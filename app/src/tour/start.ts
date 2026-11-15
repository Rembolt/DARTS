import { notPossible, type AreaSummary, type NotPossible, type NotPossibleCode } from '../../../server/src/shared/contract';
import { checkBundle, getJson, loadMesh, loadServerConfig, UNREACHABLE, type ServerConfig } from '../api';
import { createModeSwitch } from '../blueprint/mode';
import { bindShortcut, createToggle } from '../blueprint/toggle';
import { createBlueprint } from '../blueprint/view';
import { createAudioEngine, type AudioEngine, type SourceSpec } from '../audio/engine';
import { surroundingSources, surroundingsNotice } from '../audio/surroundings';
import { createFootsteps, type Footsteps } from '../audio/footsteps';
import { Reverb } from '../audio/reverb';
import { BLUEPRINT, MAX_SOURCES, simConfig } from '../config';
import { firstRoomId, isInside, TraceScheduler } from '../listen';
import { formatSimReady, startSim, type SimClient } from '../sim/client';
import { ReverbScheduler } from '../sim/reverb-cache';
import type { Bands, FromWorker, Vec3 } from '../sim/types';
import { ui } from '../ui/store';
import { connectViewer, formatPose, viewerUrl, type MpSdk, type Pose } from '../viewer';
import { browserSupport, isNotPossibleError, loadStatus, meshProblem, withTimeout } from './checks';
import { showFailure } from './failure';
import { mountTourUi } from './ui-bridge';

const VIEWER_TIMEOUT_MS = 30_000;
const WORKER_LOAD_TIMEOUT_MS = 60_000;
/** Spec 8.3. No contract code of its own; shown as a viewer failure whose "Try again" reloads the page. */
const CONTEXT_LOST: NotPossible = { code: 'viewer_failed', message: 'The 3D view stopped. Reload to continue.', retry: true };

/**
 * A failure from one of our own steps as a `NotPossible`: a `{ reason }` as it is, our server being down as the
 * unreachable reason, and anything else as `code`'s spec sentence (the detail goes to the console only).
 */
function reasonOf(err: unknown, code: NotPossibleCode): NotPossible {
  if (isNotPossibleError(err)) return err.reason;
  const detail = err instanceof Error ? err.message : String(err);
  if (detail === UNREACHABLE) return { code: 'matterport_unreachable', message: UNREACHABLE, retry: true };
  console.warn(`${code}:`, detail);
  return notPossible(code);
}

/**
 * Start the tour of one property: the viewer, the sim worker with its mesh, the audio and the blueprint.
 * Everything uses `modelId`; nothing reads the page before this is called.
 */
export function startTour(modelId: string): void {
  const tourRoot = document.getElementById('tour')!;
  let failed = false;
  const cleanups: (() => void)[] = [];

  /** Stop everything and show the reason instead of the tour: never a half-loaded tour (spec 4.4, 8.1). */
  function fail(reason: NotPossible): void {
    if (failed) return;
    failed = true;
    for (const cleanup of cleanups.splice(0)) {
      try {
        cleanup();
      } catch (err) {
        console.warn('cleanup failed:', err);
      }
    }
    showFailure(tourRoot, reason, { retry: () => location.reload() });
  }

  // Before anything touches WebGL, a worker or audio.
  const unsupported = browserSupport(window as unknown as Parameters<typeof browserSupport>[0]);
  if (unsupported) {
    fail(unsupported);
    return;
  }

  const status = document.getElementById('status')!;
  const poseLine = document.getElementById('pose')!;
  const simLine = document.getElementById('sim')!;
  const iframe = document.getElementById('viewer') as HTMLIFrameElement;
  const stage = document.getElementById('stage')!;
  const canvas = document.getElementById('blueprint') as HTMLCanvasElement;
  const button = document.getElementById('blueprint-toggle') as HTMLButtonElement;
  const modeButton = document.getElementById('blueprint-mode') as HTMLButtonElement;
  const audioButton = document.getElementById('audio-toggle') as HTMLButtonElement;
  const uiRoot = document.getElementById('ui-root')!;
  const stepsButton = document.getElementById('footsteps-toggle') as HTMLButtonElement;

  const blueprint = createBlueprint(canvas);
  canvas.addEventListener('webglcontextlost', () => fail(CONTEXT_LOST));
  let latestPose: Pose | null = null;
  let blueprintLines: Float32Array | null = null;
  const toggle = createToggle();
  const modeSwitch = createModeSwitch(BLUEPRINT.defaultMode);
  blueprint.setMode(modeSwitch.mode());

  function showToggle(): void {
    const v = toggle.view();
    button.disabled = !v.enabled;
    button.textContent = v.label;
    button.title = v.title;
    button.setAttribute('aria-pressed', String(v.pressed));
    canvas.hidden = !v.pressed;
    blueprint.setVisible(v.pressed);
    modeButton.disabled = !v.enabled;
    modeButton.textContent = modeSwitch.label();
    modeButton.title = modeSwitch.title();
    ui.blueprint.value = { enabled: v.enabled, on: v.pressed, label: v.label, mode: modeSwitch.mode() };
  }

  function flipBlueprint(): void {
    toggle.toggle();
    showToggle();
  }

  button.addEventListener('click', flipBlueprint);
  modeButton.addEventListener('click', () => {
    blueprint.setMode(modeSwitch.next());
    showToggle();
  });
  const listenForShortcut = bindShortcut(toggle, flipBlueprint);
  listenForShortcut(document);
  new ResizeObserver(([entry]) => {
    blueprint.resize(entry.contentRect, devicePixelRatio);
    ui.stage.value = { w: entry.contentRect.width, h: entry.contentRect.height };
  }).observe(stage);
  showToggle();

  // ---- Listener, traces, audio and reverb (mvp-design.md 2 flow, 5.5, 5.6, 6) ----

  let sim: SimClient | null = null; // set once the worker has the mesh
  let viewerReady = false;
  let sourceSpecs: SourceSpec[] = []; // what plays: the surroundings, once the first inside position is known
  let sources: { id: string; position: Vec3 }[] | null = null; // the traced ones (enabled, not stereo); null until placed
  let placed = false;
  let listener: Vec3 | null = null; // last position inside the house
  let roomId: string | null = null; // last room from Room.current
  let audio: AudioEngine | null = null;
  let reverb: Reverb | null = null;
  let footsteps: Footsteps | null = null;
  let stepsOn = true;
  let floor: 'hard' | 'soft' = 'hard'; // from the property's status (carpet in the listing: soft)
  let traceId = 0;
  const traces = new TraceScheduler();
  const rooms = new ReverbScheduler();
  let estimateRoom: string | null | undefined; // room whose reverb estimate is applied; undefined: none yet
  let debugLog = false; // dev: log every reverb swap and trace with a timestamp (window.__audio.log(true))
  let currentEchoTime: Bands | null = null;
  let pointedHit: { position: Vec3; normal: Vec3 } | null = null;
  let sdkRef: MpSdk | null = null;

  const uiBridge = mountTourUi({
    modelId,
    uiRoot,
    blueprint,
    getSim: () => sim,
    getAudio: () => audio,
    getSources: () => sources,
    setSources: next => {
      sources = next;
      traces.invalidate();
    },
    setSourceSpecs: next => {
      sourceSpecs = next;
    },
    getListener: () => listener,
    getRoomId: () => roomId,
    getEchoTime: () => currentEchoTime,
    getPointed: () => pointedHit,
    toggleBlueprint: flipBlueprint,
    cycleBlueprintMode: () => {
      blueprint.setMode(modeSwitch.next());
      showToggle();
    },
    toggleAudio: () => audioButton.click(),
    toggleFootsteps: () => flipSteps(),
    moveToPoint: async point => {
      const s = sdkRef as (MpSdk & { Model?: { getData(): Promise<{ sweeps?: { sid?: string; id?: string; position?: { x: number; y: number; z: number } }[] }> } }) | null;
      if (!s?.Model?.getData) return;
      const data = await s.Model.getData();
      const sweeps = data.sweeps ?? [];
      let best: { id: string; dist: number } | null = null;
      for (const sw of sweeps) {
        const id = sw.sid ?? sw.id;
        if (!id || !sw.position) continue;
        const dy = Math.abs(sw.position.y - point[1]);
        const d = Math.hypot(sw.position.x - point[0], sw.position.z - point[2]) + (dy > 1.5 ? dy * 10 : 0);
        if (!best || d < best.dist) best = { id, dist: d };
      }
      if (best) await s.Sweep.moveTo(best.id, { transition: 'fly', transitionTime: 800 });
    },
    retrace: () => {
      traces.invalidate();
      traceListener();
    },
    clearReverb: () => {
      rooms.cache.clear();
      estimateRoom = undefined;
    },
  });
  cleanups.push(() => uiBridge.dispose());

  cleanups.push(() => {
    iframe.src = 'about:blank';
    sim?.terminate();
    sim = null;
    reverb?.dispose();
    reverb = null;
    footsteps?.dispose();
    footsteps = null;
    const old = audio;
    audio = null;
    if (old) void old.stop();
  });

  /** The status line: the tour's state, then any notices (sounds skipped, surroundings). */
  let statusText = 'Loading…';
  const notices = new Map<string, string>();
  function showStatus(text?: string): void {
    if (text !== undefined) statusText = text;
    const line = [statusText, ...notices.values()].join(' · ');
    status.textContent = line;
    status.title = line;
    ui.status.value = line;
  }

  /** Change the reverb. Swapping a convolver's sound can drop the reverb for an instant, so swaps are kept rare. */
  function setEchoTime(echoTime: [number, number, number], why: string): void {
    currentEchoTime = echoTime;
    if (!reverb) return;
    const swapped = reverb.setEchoTime(echoTime);
    if (swapped && debugLog) console.info(`[${(performance.now() / 1000).toFixed(2)} s] reverb swap (${why})`, echoTime.map(t => t.toFixed(2)));
  }

  function sendTrace(position: Vec3 | null): void {
    if (!position || !sim || !sources?.length) return;
    sim.worker.postMessage({ type: 'trace', id: ++traceId, listener: position, sources });
  }

  function sendReverb(request: ReturnType<ReverbScheduler['enterRoom']>['request']): void {
    if (request && sim) sim.worker.postMessage(request);
  }

  /** Trace the listener if the worker, the sources and a position are all there. */
  function traceListener(): void {
    if (sim && sources && listener) sendTrace(traces.onListener(listener));
  }

  function enterRoom(): void {
    if (!sim || !listener) return;
    const d = rooms.enterRoom(roomId, listener);
    if (d.echoTime) setEchoTime(d.echoTime, 'cached room');
    sendReverb(d.request);
  }

  /** The sources that play now. Traced ones (not stereo) go to the worker; all go to the audio engine. */
  function applySourceSpecs(specs: SourceSpec[]): void {
    sourceSpecs = specs;
    sources = specs.filter(sp => sp.enabled && sp.kind !== 'stereo').slice(0, MAX_SOURCES).map(({ id, position }) => ({ id, position }));
    void pushSources();
    uiBridge.onSourcesInitialized(specs);
    traces.invalidate();
    traceListener();
  }

  async function pushSources(): Promise<void> {
    if (!audio) return;
    const engine = audio;
    await engine.setSources(sourceSpecs);
    if (audio !== engine) return;
    if (engine.skipped.length) notices.set('skipped', `Not playing (file missing): ${engine.skipped.join(', ')}`);
    else notices.delete('skipped');
    showStatus();
  }

  /** Once the first inside position is known: place the outside sounds from the property's surroundings (v3-design 6). */
  async function placeSources(start: Vec3, modelId: string): Promise<void> {
    applySourceSpecs([]);
    try {
      const area = await getJson<AreaSummary>(`/api/surroundings/${modelId}`);
      if (failed) return;
      const notice = surroundingsNotice(area);
      if (notice) notices.set('surroundings', notice);
      applySourceSpecs(surroundingSources(area, start));
      audio?.setStereoCut(-25, 800);
    } catch (err) {
      console.warn('surroundings:', err instanceof Error ? err.message : err);
      notices.set('surroundings', 'Surroundings not available: outside sounds are off');
    }
    showStatus();
  }

  function onWorkerMessage(msg: FromWorker): void {
    uiBridge.onWorkerMessage(msg);
    switch (msg.type) {
      case 'trace': {
        audio?.applySimResult(msg.sources);
        if (sources) {
          blueprint.setTrace({
            listener: msg.listener,
            sources: sources.map(s => ({ position: s.position })),
            paths: msg.paths,
            pathSource: msg.pathSource,
          });
        }
        // Until the room's reverb job answers, the trace's estimate stands in (5.5): once per room, not every trace.
        const room = rooms.currentRoom;
        if (reverb && estimateRoom !== room && !(room && rooms.cache.get(room))) {
          estimateRoom = room;
          setEchoTime(msg.echoTimeEstimate, 'estimate');
        }
        if (debugLog) console.info(`[${(performance.now() / 1000).toFixed(2)} s] trace ${Math.round(msg.ms)} ms`);
        sendTrace(traces.onResult());
        break;
      }
      case 'reverb': {
        console.info('reverb', msg.roomId, msg.echoTime.map(t => t.toFixed(2)), `${Math.round(msg.ms)} ms`);
        const d = rooms.onResult(msg.roomId, msg.echoTime);
        if (d.echoTime) setEchoTime(d.echoTime, 'reverb job');
        sendReverb(d.request);
        break;
      }
      case 'error': {
        // The worker runs one job at a time and the message doesn't say which failed; free whatever is waiting.
        console.warn('sim worker:', msg.message);
        if (traces.busy) sendTrace(traces.onError());
        if (rooms.busy) sendReverb(rooms.onError().request);
        break;
      }
    }
  }

  /** Audio waits for the whole tour: the viewer and the simulation (no audio without the viewer, spec 8.1). */
  function showAudio(state: 'off' | 'starting' | 'on'): void {
    audioButton.disabled = state === 'starting' || !viewerReady || !sim;
    audioButton.textContent = state === 'on' ? 'Stop audio' : state === 'starting' ? 'Starting…' : 'Start audio';
    audioButton.setAttribute('aria-pressed', String(state === 'on'));
    ui.audio.value = state;
  }

  function showSteps(missing = false): void {
    stepsButton.disabled = !footsteps;
    stepsButton.setAttribute('aria-pressed', String(stepsOn && !!footsteps));
    stepsButton.title = footsteps ? 'Footsteps on sweep changes (F)' : missing ? 'Footstep sounds are missing' : 'Start audio first';
    ui.footsteps.value = stepsOn && !!footsteps;
  }

  async function startFootsteps(engine: AudioEngine): Promise<void> {
    const made = await createFootsteps(engine.context, { master: engine.master, reverbInput: engine.reverbInput });
    if (audio !== engine) { made?.dispose(); return; }
    footsteps = made;
    footsteps?.setEnabled(stepsOn);
    footsteps?.setFloor(floor);
    showSteps(!made);
  }

  function flipSteps(): void {
    if (!footsteps) return;
    stepsOn = !stepsOn;
    footsteps.setEnabled(stepsOn);
    showSteps();
  }
  stepsButton.addEventListener('click', flipSteps);
  showSteps();

  // The click handler itself creates the AudioContext, so the browser lets it play.
  audioButton.addEventListener('click', () => {
    if (audio) {
      const old = audio;
      audio = null;
      reverb?.dispose();
      reverb = null;
      footsteps?.dispose();
      footsteps = null;
      showSteps();
      showAudio('off');
      void old.stop();
      return;
    }
    showAudio('starting');
    createAudioEngine()
      .then(engine => {
        if (failed) {
          void engine.stop();
          return;
        }
        audio = engine;
        reverb = new Reverb(engine.context);
        engine.connectReverb(reverb.input);
        reverb.output.connect(engine.master);
        void startFootsteps(engine);
        estimateRoom = undefined;
        const known = rooms.currentRoom ? rooms.cache.get(rooms.currentRoom) : undefined;
        if (known) setEchoTime(known, 'cached room');
        engine.setStereoCut(-25, 800);
        void pushSources();
        if (latestPose && isInside(latestPose.mode)) engine.setListenerPose(latestPose);
        traces.invalidate(); // a fresh trace sets every level at once
        traceListener();
        showAudio('on');
        uiBridge.onAudioStarted(engine);
        console.info('audio started');
      })
      .catch(err => {
        // Spec 4.4: an audio context that won't start means this browser can't run 3D audio.
        const base = notPossible('browser_unsupported');
        console.warn('audio did not start:', err);
        fail({ ...base, message: `${base.message} The audio could not start.` });
      });
  });

  // Dev console controls to find which part breaks up: __audio.mute('reverb' | 'echoes' | 'direct'), __audio.unmute(...),
  // __audio.log(true) to timestamp every trace and reverb swap. The sources keep playing either way.
  if (import.meta.env.DEV) {
    let reverbOn = true;
    const set = (part: 'reverb' | 'echoes' | 'direct', on: boolean) => {
      if (!audio) return 'start audio first';
      if (part === 'reverb') {
        if (reverb && on !== reverbOn) on ? reverb.output.connect(audio.master) : reverb.output.disconnect();
        reverbOn = on;
      } else audio.setPartEnabled(part, on);
      return `${part} ${on ? 'on' : 'muted'}`;
    };
    (window as unknown as { __audio: unknown }).__audio = {
      mute: (part: 'reverb' | 'echoes' | 'direct') => set(part, false),
      unmute: (part: 'reverb' | 'echoes' | 'direct') => set(part, true),
      log: (on = true) => ((debugLog = on), `logging ${on ? 'on' : 'off'}`),
    };
  }

  /** Download the mesh and load it in the worker, beside the viewer. Any failure stops the whole tour. */
  async function startSimulation(modelId: string): Promise<void> {
    simLine.textContent = 'Loading mesh…';
    let obj: ArrayBuffer;
    try {
      obj = await loadMesh(modelId);
    } catch (err) {
      fail(reasonOf(err, 'mesh_failed'));
      return;
    }
    if (failed) return;
    const client = startSim();
    cleanups.push(() => client.terminate());
    try {
      const ready = await withTimeout(client.load(obj, simConfig()), WORKER_LOAD_TIMEOUT_MS, notPossible('mesh_unusable'));
      if (failed) return;
      const problem = meshProblem(ready);
      if (problem) {
        console.warn('mesh unusable:', ready.triangles, 'triangles');
        fail(problem);
        return;
      }
      client.worker.addEventListener('message', event => onWorkerMessage((event as MessageEvent<FromWorker>).data));
      sim = client;
      showAudio(audio ? 'on' : 'off');
      traceListener();
      enterRoom();
      simLine.textContent = formatSimReady(ready);
      blueprint.setLines(ready.lines);
      blueprint.setMesh(ready.mesh);
      uiBridge.onSimReady(ready);
      blueprintLines = ready.lines;
      toggle.ready();
      showToggle();
      console.info('sim ready', {
        triangles: ready.triangles,
        lines: ready.lines.length / 6,
        loadMs: Math.round(ready.loadMs),
        timings: Object.fromEntries(Object.entries(ready.timings).map(([k, v]) => [k, Math.round(v)])),
        boundsMin: ready.boundsMin,
        boundsMax: ready.boundsMax,
      });
    } catch (err) {
      fail(reasonOf(err, 'mesh_unusable'));
    }
  }

  // Order (spec 4.3, 4.4): browser (above), the property's status, config, Bundle, then viewer and simulation.
  async function start(): Promise<void> {
    showAudio('off');
    showStatus('Checking this property…');
    let name: string | null = null;
    try {
      const property = await loadStatus(modelId);
      if (!property.canEnter) {
        fail(property.reason ?? notPossible('model_not_found'));
        return;
      }
      name = property.name;
      floor = property.floor;
    } catch (err) {
      fail(reasonOf(err, 'matterport_unreachable'));
      return;
    }

    let config: ServerConfig;
    try {
      config = await loadServerConfig(modelId);
    } catch (err) {
      fail(reasonOf(err, 'server_not_configured'));
      return;
    }
    try {
      await checkBundle();
    } catch (err) {
      fail(reasonOf(err, 'bundle_missing'));
      return;
    }
    if (failed) return;

    // The mesh is the one for the model this tour was started with, never a default.
    void startSimulation(modelId);

    showStatus('Loading tour…');
    // Never write the SDK key to the page text or the console. It appears only in this src.
    iframe.src = viewerUrl(config);

    let sdk: MpSdk;
    try {
      sdk = await withTimeout(connectViewer(iframe, message => showStatus(message)), VIEWER_TIMEOUT_MS, notPossible('viewer_failed'));
    } catch (err) {
      fail(reasonOf(err, 'viewer_failed'));
      return;
    }
    if (failed) return;
    sdkRef = sdk;
    viewerReady = true;
    showAudio(audio ? 'on' : 'off');

    showStatus(`Tour playing: ${name ?? 'this property'}`);
    // Same origin, so the tour's own window can be listened to: after a click into the tour, keys go there.
    if (iframe.contentWindow) {
      listenForShortcut(iframe.contentWindow);
      uiBridge.setPointerTarget(iframe.contentWindow);
    }
    sdk.Camera.pose.subscribe(pose => {
      poseLine.textContent = formatPose(pose);
      blueprint.setPose(pose);
      latestPose = pose;
      const inside = isInside(pose.mode);
      uiBridge.onPose(pose, inside);
      // In dollhouse and floor plan the camera is outside: the listener stays at its last inside position (5.6).
      if (!inside) return;
      listener = [pose.position.x, pose.position.y, pose.position.z];
      if (!placed) {
        placed = true;
        void placeSources(listener, modelId);
      }
      audio?.setListenerPose(pose);
      traceListener();
    });

    sdk.Room.current.subscribe(current => {
      const id = firstRoomId(current);
      if (!id || id === roomId) return; // between rooms or outside: keep the last room
      roomId = id;
      uiBridge.onRoom(id);
      enterRoom();
    });

    // Dev helper (mvp-design.md 8): press P to log the point under the cursor, to paste as a source position.
    let pointed: Vec3 | null = null;
    sdk.Pointer.intersection.subscribe(hit => {
      pointed = [hit.position.x, hit.position.y, hit.position.z];
      const n = (hit as { normal?: { x: number; y: number; z: number } }).normal;
      pointedHit = { position: pointed, normal: n ? [n.x, n.y, n.z] : [0, 1, 0] };
    });
    const logPoint = (event: KeyboardEvent) => {
      const typing = event.target instanceof HTMLElement && /^(INPUT|TEXTAREA|SELECT)$/.test(event.target.tagName);
      if (event.key.toLowerCase() !== 'p' || event.repeat || typing || event.ctrlKey || event.metaKey || event.altKey) return;
      if (pointed) console.info('point', JSON.stringify(pointed.map(v => +v.toFixed(3))));
    };
    const stepKey = (event: KeyboardEvent) => {
      const typing = event.target instanceof HTMLElement && /^(INPUT|TEXTAREA|SELECT)$/.test(event.target.tagName);
      if (event.key.toLowerCase() !== 'f' || event.repeat || typing || event.ctrlKey || event.metaKey || event.altKey) return;
      flipSteps();
    };
    document.addEventListener('keydown', stepKey);
    iframe.contentWindow?.addEventListener('keydown', stepKey);
    // A step sound for each jump to a new sweep, not for the first pose and not outside the house (v3-design 6.5).
    let lastSweep: string | undefined;
    sdk.Sweep.current.subscribe(sweep => {
      const id = sweep.sid ?? sweep.id;
      const first = lastSweep === undefined;
      const changed = id !== lastSweep;
      lastSweep = id;
      if (!first && changed && latestPose && isInside(latestPose.mode)) footsteps?.walk(1.0);
    });
    document.addEventListener('keydown', logPoint);
    iframe.contentWindow?.addEventListener('keydown', logPoint);

    if (import.meta.env.DEV) {
      const { installBlueprintCheck } = await import('../debug');
      installBlueprintCheck({
        sdk,
        getPose: () => latestPose,
        getLines: () => blueprintLines,
        getSize: () => ({ w: stage.clientWidth, h: stage.clientHeight }),
      });
    }
  }

  start().catch(err => fail(reasonOf(err, 'viewer_failed')));
}
