import { checkBundle, loadMesh, loadServerConfig } from './api';
import { createModeSwitch } from './blueprint/mode';
import { bindShortcut, createToggle } from './blueprint/toggle';
import { createBlueprint } from './blueprint/view';
import { createAudioEngine, type AudioEngine } from './audio/engine';
import { defaultSourcePositions } from './audio/positions';
import { Reverb } from './audio/reverb';
import { BLUEPRINT, simConfig } from './config';
import { firstRoomId, isInside, TraceScheduler } from './listen';
import { formatSimReady, startSim, type SimClient } from './sim/client';
import { ReverbScheduler } from './sim/reverb-cache';
import type { FromWorker, Vec3 } from './sim/types';
import { mountUi } from './ui/mount';
import { commands, ui, addSpeaker, setOpenings, setSpeakers, type Speaker } from './ui/store';
import { localAgent } from './ui/localAgent';
import { mockOpenings } from './ui/mock';
import { listenForPlacement } from './ui/placement';
import { createOcclusion, type Occlusion } from './ui/occlusion';
import { connectViewer, formatPose, viewerUrl, type Pose } from './viewer';

const iframe = document.getElementById('viewer') as HTMLIFrameElement;
const stage = document.getElementById('stage')!;
const canvas = document.getElementById('blueprint') as HTMLCanvasElement;

mountUi(document.getElementById('ui-root')!);

const blueprint = createBlueprint(canvas);
let latestPose: Pose | null = null;
let blueprintLines: Float32Array | null = null;
const toggle = createToggle();
const modeSwitch = createModeSwitch(BLUEPRINT.defaultMode);
blueprint.setMode(modeSwitch.mode());

function showToggle(): void {
  const v = toggle.view();
  ui.blueprint.value = { enabled: v.enabled, on: v.pressed, label: v.label, mode: modeSwitch.mode() === 'solid' ? 'Solid' : 'X-ray' };
  canvas.hidden = !v.pressed;
  blueprint.setVisible(v.pressed);
}

function flipBlueprint(): void {
  toggle.toggle();
  showToggle();
}

commands.toggleBlueprint = flipBlueprint;
commands.cycleBlueprintMode = () => {
  blueprint.setMode(modeSwitch.next());
  showToggle();
};
const listenForShortcut = bindShortcut(toggle, flipBlueprint);
listenForShortcut(document);
new ResizeObserver(([entry]) => {
  blueprint.resize(entry.contentRect, devicePixelRatio);
  ui.stage.value = { w: entry.contentRect.width, h: entry.contentRect.height };
}).observe(stage);
showToggle();

// ---- Listener, traces, audio and reverb (mvp-design.md 2 flow, 5.5, 5.6, 6) ----

let occlusion: Occlusion | null = null; // line of sight for the overlay's pins
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
  // The overlay lists the two MVP sources as speakers; more are preview-only until the engine takes a source list (v2 5.1).
  const mvp: Speaker[] = [
    { id: 'indoor', label: 'Indoor music', sound: 'music', kind: 'point', position: pos.indoor, levelDb: 0, enabled: true },
    { id: 'outdoor', label: 'Highway', sound: 'highway', kind: 'ambient', position: pos.outdoor, levelDb: -12, enabled: true },
  ];
  setSpeakers([...mvp, ...ui.speakers.value.filter(s => s.id !== 'indoor' && s.id !== 'outdoor')]);
  traces.invalidate();
}

function onWorkerMessage(msg: FromWorker): void {
  switch (msg.type) {
    case 'trace': {
      audio?.applySimResult(msg.sources);
      if (sources) {
        const known = rooms.currentRoom ? rooms.cache.get(rooms.currentRoom) : undefined;
        ui.sound.value = { listener: msg.listener, sources: msg.sources, positions: sources.map(s => s.position), echoTime: known ?? msg.echoTimeEstimate };
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

/** Ask which pins the camera can see. Inside only: dollhouse and floor plan are cutaways, so nothing hides there. */
function checkSight(): void {
  const pose = latestPose;
  if (!occlusion || !pose) return;
  if (!isInside(pose.mode)) {
    if (ui.hidden.value.size) ui.hidden.value = new Map();
    return;
  }
  const items = [...ui.openings.value, ...ui.speakers.value];
  occlusion.query([pose.position.x, pose.position.y, pose.position.z], items.map(i => i.id), items.map(i => i.position));
}
ui.openings.subscribe(() => checkSight());
ui.speakers.subscribe(() => checkSight());

function showAudio(state: 'off' | 'starting' | 'on'): void {
  ui.audio.value = state;
}

// The click handler itself creates the AudioContext, so the browser lets it play.
commands.toggleAudio = () => {
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
};

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
  ui.status.value = message;
}

/** Download the mesh and load it in the worker. Runs beside the tour; it never blocks or breaks it. */
async function startSimulation(modelId: string): Promise<void> {
  ui.sim.value = 'Loading mesh…';
  try {
    const obj = await loadMesh(modelId);
    const client = startSim();
    const ready = await client.load(obj, simConfig());
    client.worker.addEventListener('message', event => onWorkerMessage((event as MessageEvent<FromWorker>).data));
    sim = client;
    traceListener();
    enterRoom();
    ui.sim.value = formatSimReady(ready);
    blueprint.setLines(ready.lines);
    occlusion = createOcclusion(ready.mesh, hidden => (ui.hidden.value = hidden));
    blueprint.setMesh(ready.mesh);
    checkSight();
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
    ui.sim.value = message;
    toggle.failed(err instanceof Error ? err.message : String(err));
    showToggle();
  }
}

async function start(): Promise<void> {
  const config = await loadServerConfig().catch(showError);
  if (!config) return;

  void startSimulation(config.modelId);

  try {
    await checkBundle();
  } catch (err) {
    showError(err);
    return;
  }

  ui.status.value = 'Loading tour…';
  // Never write the SDK key to the page text or the console. It appears only in this src.
  iframe.src = viewerUrl(config);

  const sdk = await connectViewer(iframe, message => {
    ui.status.value = message;
  }).catch(showError);
  if (!sdk) return;

  ui.status.value = `Tour playing: model ${config.modelId}`;
  // Same origin, so the tour's own window can be listened to: after a click into the tour, keys go there.
  if (iframe.contentWindow) listenForShortcut(iframe.contentWindow);
  sdk.Camera.pose.subscribe(pose => {
    ui.pose.value = { ...pose }; // the SDK may reuse one object; a copy makes the signal fire
    if (import.meta.env.DEV) (window as unknown as { __pose: string }).__pose = formatPose(pose);
    blueprint.setPose(pose);
    latestPose = pose;
    checkSight();
    // In dollhouse and floor plan the camera is outside: the listener stays at its last inside position (5.6).
    if (!isInside(pose.mode)) return;
    listener = [pose.position.x, pose.position.y, pose.position.z];
    if (!sources) {
      placeSources(listener);
      setOpenings(mockOpenings(listener));
    }
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
  let pointedNormal: Vec3 = [0, 1, 0];
  sdk.Pointer.intersection.subscribe(hit => {
    pointed = [hit.position.x, hit.position.y, hit.position.z];
    if (hit.normal) pointedNormal = [hit.normal.x, hit.normal.y, hit.normal.z];
  });
  const logPoint = (event: KeyboardEvent) => {
    const typing = event.target instanceof HTMLElement && /^(INPUT|TEXTAREA|SELECT)$/.test(event.target.tagName);
    if (event.key.toLowerCase() !== 'p' || event.repeat || typing || event.ctrlKey || event.metaKey || event.altKey) return;
    if (pointed) console.info('point', JSON.stringify(pointed.map(v => +v.toFixed(3))));
  };
  document.addEventListener('keydown', logPoint);
  iframe.contentWindow?.addEventListener('keydown', logPoint);

  // Click to add a speaker (v2-design.md 5.4): the S key toggles placement, a click in the tour drops it at the pointer.
  const placeKey = (event: KeyboardEvent) => {
    const typing = event.target instanceof HTMLElement && /^(INPUT|TEXTAREA|SELECT)$/.test(event.target.tagName);
    if (event.key.toLowerCase() === 's' && !event.repeat && !typing && !event.ctrlKey && !event.metaKey && !event.altKey) {
      ui.placing.value = !ui.placing.value;
    } else if (event.key === 'Escape') ui.placing.value = false;
  };
  document.addEventListener('keydown', placeKey);
  iframe.contentWindow?.addEventListener('keydown', placeKey);
  if (iframe.contentWindow) {
    listenForPlacement(
      iframe.contentWindow,
      () => ui.placing.value && pointed !== null,
      () => {
        if (!pointed) return;
        // 0.3 m off the surface along its facing direction, so the speaker never sits inside the wall (v2 5.4).
        const n = pointedNormal;
        addSpeaker([pointed[0] + n[0] * 0.3, pointed[1] + n[1] * 0.3, pointed[2] + n[2] * 0.3]);
        ui.placing.value = false;
      },
    );
  }
  const frameBody = () => iframe.contentDocument?.body;
  ui.placing.subscribe(on => {
    const body = frameBody();
    if (body) body.style.cursor = on ? 'crosshair' : '';
  });

  // The agent seam: replace the local stand-in with the Jev relay.
  commands.ask = localAgent;

  if (import.meta.env.DEV) {
    const { installBlueprintCheck } = await import('./debug');
    installBlueprintCheck({
      sdk,
      getPose: () => latestPose,
      getLines: () => blueprintLines,
      getSize: () => ({ w: stage.clientWidth, h: stage.clientHeight }),
    });
  }
}

start().catch(showError);
