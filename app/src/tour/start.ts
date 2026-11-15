import { checkBundle, loadMesh, loadServerConfig } from '../api';
import { createModeSwitch } from '../blueprint/mode';
import { bindShortcut, createToggle } from '../blueprint/toggle';
import { createBlueprint } from '../blueprint/view';
import { createAudioEngine, type AudioEngine } from '../audio/engine';
import { defaultSourcePositions } from '../audio/positions';
import { Reverb } from '../audio/reverb';
import { BLUEPRINT, simConfig } from '../config';
import { firstRoomId, isInside, TraceScheduler } from '../listen';
import { formatSimReady, startSim, type SimClient } from '../sim/client';
import { ReverbScheduler } from '../sim/reverb-cache';
import type { FromWorker, Vec3 } from '../sim/types';
import { connectViewer, formatPose, viewerUrl, type Pose } from '../viewer';

/**
 * Start the tour of one property: the viewer, the sim worker with its mesh, the audio and the blueprint.
 * Everything uses `modelId`; nothing reads the page before this is called.
 */
export function startTour(modelId: string): void {
  const status = document.getElementById('status')!;
  const poseLine = document.getElementById('pose')!;
  const simLine = document.getElementById('sim')!;
  const iframe = document.getElementById('viewer') as HTMLIFrameElement;
  const stage = document.getElementById('stage')!;
  const canvas = document.getElementById('blueprint') as HTMLCanvasElement;
  const button = document.getElementById('blueprint-toggle') as HTMLButtonElement;
  const modeButton = document.getElementById('blueprint-mode') as HTMLButtonElement;
  const audioButton = document.getElementById('audio-toggle') as HTMLButtonElement;

  const blueprint = createBlueprint(canvas);
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
  new ResizeObserver(([entry]) => blueprint.resize(entry.contentRect, devicePixelRatio)).observe(stage);
  showToggle();

  // ---- Listener, traces, audio and reverb (mvp-design.md 2 flow, 5.5, 5.6, 6) ----

  let sim: SimClient | null = null; // set once the worker has the mesh
  let sources: { id: string; position: Vec3 }[] | null = null; // placed from the tour's first inside position
  let listener: Vec3 | null = null; // last position inside the house
  let roomId: string | null = null; // last room from Room.current
  let audio: AudioEngine | null = null;
  let reverb: Reverb | null = null;
  let traceId = 0;
  const traces = new TraceScheduler();
  const rooms = new ReverbScheduler();
  let estimateRoom: string | null | undefined; // room whose reverb estimate is applied; undefined: none yet
  let debugLog = false; // dev: log every reverb swap and trace with a timestamp (window.__audio.log(true))

  /** Change the reverb. Swapping a convolver's sound can drop the reverb for an instant, so swaps are kept rare. */
  function setEchoTime(echoTime: [number, number, number], why: string): void {
    if (!reverb) return;
    const swapped = reverb.setEchoTime(echoTime);
    if (swapped && debugLog) console.info(`[${(performance.now() / 1000).toFixed(2)} s] reverb swap (${why})`, echoTime.map(t => t.toFixed(2)));
  }

  function sendTrace(position: Vec3 | null): void {
    if (!position || !sim || !sources) return;
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

  function placeSources(start: Vec3): void {
    const pos = defaultSourcePositions(start);
    sources = [
      { id: 'indoor', position: pos.indoor },
      { id: 'outdoor', position: pos.outdoor },
    ];
    audio?.setSourcePosition('indoor', pos.indoor);
    audio?.setSourcePosition('outdoor', pos.outdoor);
    console.info('sources', pos);
    traces.invalidate();
  }

  function onWorkerMessage(msg: FromWorker): void {
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

  function showAudio(state: 'off' | 'starting' | 'on'): void {
    audioButton.disabled = state === 'starting';
    audioButton.textContent = state === 'on' ? 'Stop audio' : state === 'starting' ? 'Starting…' : 'Start audio';
    audioButton.setAttribute('aria-pressed', String(state === 'on'));
  }

  // The click handler itself creates the AudioContext, so the browser lets it play.
  audioButton.addEventListener('click', () => {
    if (audio) {
      const old = audio;
      audio = null;
      reverb?.dispose();
      reverb = null;
      showAudio('off');
      void old.stop();
      return;
    }
    showAudio('starting');
    createAudioEngine()
      .then(engine => {
        audio = engine;
        reverb = new Reverb(engine.context);
        engine.connectReverb(reverb.input);
        reverb.output.connect(engine.master);
        estimateRoom = undefined;
        const known = rooms.currentRoom ? rooms.cache.get(rooms.currentRoom) : undefined;
        if (known) setEchoTime(known, 'cached room');
        if (sources) for (const s of sources) engine.setSourcePosition(s.id as 'indoor' | 'outdoor', s.position);
        if (latestPose && isInside(latestPose.mode)) engine.setListenerPose(latestPose);
        traces.invalidate(); // a fresh trace sets every level at once
        traceListener();
        showAudio('on');
        console.info('audio started', { standIns: engine.standIns });
      })
      .catch(err => {
        showAudio('off');
        showError(err);
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

  function showError(err: unknown): void {
    const message = err instanceof Error ? err.message : typeof err === 'string' ? err : 'unknown error';
    status.textContent = message;
    status.title = message;
  }

  /** Download the mesh and load it in the worker. Runs beside the tour; it never blocks or breaks it. */
  async function startSimulation(modelId: string): Promise<void> {
    simLine.textContent = 'Loading mesh…';
    try {
      const obj = await loadMesh(modelId);
      const client = startSim();
      const ready = await client.load(obj, simConfig());
      client.worker.addEventListener('message', event => onWorkerMessage((event as MessageEvent<FromWorker>).data));
      sim = client;
      traceListener();
      enterRoom();
      simLine.textContent = formatSimReady(ready);
      blueprint.setLines(ready.lines);
      blueprint.setMesh(ready.mesh);
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
      const message = `Simulation failed to load: ${err instanceof Error ? err.message : String(err)}`;
      simLine.textContent = message;
      simLine.title = message;
      toggle.failed(err instanceof Error ? err.message : String(err));
      showToggle();
    }
  }

  async function start(): Promise<void> {
    const config = await loadServerConfig(modelId).catch(showError);
    if (!config) return;

    // The mesh is the one for the model this tour was started with, never a default.
    void startSimulation(modelId);

    try {
      await checkBundle();
    } catch (err) {
      showError(err);
      return;
    }

    status.textContent = 'Loading tour…';
    // Never write the SDK key to the page text or the console. It appears only in this src.
    iframe.src = viewerUrl(config);

    const sdk = await connectViewer(iframe, message => {
      status.textContent = message;
    }).catch(showError);
    if (!sdk) return;

    status.textContent = `Tour playing: model ${config.modelId}`;
    // Same origin, so the tour's own window can be listened to: after a click into the tour, keys go there.
    if (iframe.contentWindow) listenForShortcut(iframe.contentWindow);
    sdk.Camera.pose.subscribe(pose => {
      poseLine.textContent = formatPose(pose);
      blueprint.setPose(pose);
      latestPose = pose;
      // In dollhouse and floor plan the camera is outside: the listener stays at its last inside position (5.6).
      if (!isInside(pose.mode)) return;
      listener = [pose.position.x, pose.position.y, pose.position.z];
      if (!sources) placeSources(listener);
      audio?.setListenerPose(pose);
      traceListener();
    });

    sdk.Room.current.subscribe(current => {
      const id = firstRoomId(current);
      if (!id || id === roomId) return; // between rooms or outside: keep the last room
      roomId = id;
      enterRoom();
    });

    // Dev helper (mvp-design.md 8): press P to log the point under the cursor, to paste as a source position.
    let pointed: Vec3 | null = null;
    sdk.Pointer.intersection.subscribe(hit => {
      pointed = [hit.position.x, hit.position.y, hit.position.z];
    });
    const logPoint = (event: KeyboardEvent) => {
      const typing = event.target instanceof HTMLElement && /^(INPUT|TEXTAREA|SELECT)$/.test(event.target.tagName);
      if (event.key.toLowerCase() !== 'p' || event.repeat || typing || event.ctrlKey || event.metaKey || event.altKey) return;
      if (pointed) console.info('point', JSON.stringify(pointed.map(v => +v.toFixed(3))));
    };
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

  start().catch(showError);
}
