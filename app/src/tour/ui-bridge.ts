// Connects the Preact UI overlay (`app/src/ui/*`) to the live tour (`start.ts`), V2 scene store/actions,
// Property Intelligence openings (`/api/openings/:id`), material defaults (`/api/defaults/:id`), and Jev (`/api/jev`).
import { effect } from '@preact/signals';
import type { GeometryAnswer } from '../../../server/src/v2/geometry';
import type { AudioEngine, SourceSpec } from '../audio/engine';
import { PATHS_STYLE } from '../blueprint/paths';
import type { Blueprint } from '../blueprint/view';
import { SOUNDS, type SoundId } from '../config';
import { ask } from '../jev/loop';
import { createRecorder } from '../voice/whisper';
import { createActions, type Measurement, type OpeningInfo, type RoomInfo, type SceneEffects } from '../scene/actions';
import { setMaterialsMessage } from '../scene/materials';
import { defaultScene, isMaterialName, QUALITY as SCENE_QUALITY, type MaterialDefaults, type SceneState } from '../scene/state';
import { createStore } from '../scene/store';
import type { SimClient } from '../sim/client';
import type { Bands, FromWorker, GapGeom, OpeningGeom, RoomGeom, ToWorker, Vec3 } from '../sim/types';
import type { Pose } from '../viewer';
import { createFieldClient, installFeatures } from '../ui/features';
import { materialById } from '../ui/materials';
import { outdoorTrim } from '../ui/scenario';
import { mountUi } from '../ui/mount';
import { createOcclusion, type Occlusion } from '../ui/occlusion';
import { startedBefore } from '../ui/StartScreen';
import { startConversation, type Conversation } from '../voice/converse';
import { ackAfter, stopSpeaking, warmAcks } from '../voice/speak';
import { addProbe, addSpeaker, commands, createSession, isOutdoorSource, latestAsk, openingChange, pushChat, setOpenings, SOUND_LIBRARY, ui, type Opening, type Speaker } from '../ui/store';
import { createPlacement } from './placement';
import { carveOf, insideAny } from '../sim/openings';

export type BridgeDeps = {
  modelId: string;
  uiRoot: HTMLElement;
  blueprint: Blueprint;
  getSim: () => SimClient | null;
  getAudio: () => AudioEngine | null;
  getSources: () => { id: string; position: Vec3 }[] | null;
  setSources: (next: { id: string; position: Vec3 }[]) => void;
  setSourceSpecs?: (next: SourceSpec[]) => void;
  getListener: () => Vec3 | null;
  getRoomId: () => string | null;
  getEchoTime: () => Bands | null;
  getPointed: () => { position: Vec3; normal: Vec3 } | null;
  toggleBlueprint: () => void;
  cycleBlueprintMode: () => void;
  toggleAudio: () => void;
  toggleFootsteps?: () => void;
  /** Fly to the capture point nearest `point`, preferring one where `inside(x, z)` is true. Resolves to where it landed, or null. */
  moveToPoint?: (point: Vec3, inside?: (x: number, z: number) => boolean) => Promise<Vec3 | null>;
  retrace: () => void;
  clearReverb: () => void;
  /** Optional target window for pointer placement (the Matterport iframe window). */
  setPlacementTarget?: (win: Window) => void;
};

export type TourUiBridge = {
  onSimReady(ready: Extract<FromWorker, { type: 'ready' }>): void;
  onWorkerMessage(msg: FromWorker): void;
  onPose(pose: Pose, inside: boolean): void;
  onRoom(roomId: string): void;
  onAudioStarted(engine: AudioEngine): void;
  onSourcesInitialized(specs: SourceSpec[]): void;
  setPointerTarget(win: Window): void;
  dispose(): void;
};

type Convo = Parameters<typeof ask>[1];

/** A measure the worker has not answered by then is given up, so the agent never waits forever. */
const MEASURE_TIMEOUT_MS = 8000;

export function mountTourUi(deps: BridgeDeps): TourUiBridge {
  mountUi(deps.uiRoot);
  ui.started.value = startedBefore();
  ui.openingsAreDemo.value = false;

  const post = (msg: ToWorker, transfer?: Transferable[]) => {
    const sim = deps.getSim();
    if (!sim) return;
    if (transfer) sim.worker.postMessage(msg, transfer);
    else sim.worker.postMessage(msg);
  };

  let meshReady: { positions: Float32Array; indices: Uint32Array; materials: Uint8Array } | null = null;
  let occlusion: Occlusion | null = null;
  let meshLayers: { id: string; triangles: number }[] = [];
  let roomsTagged = false;
  let openingsLoaded = false;
  let openingGeoms: OpeningGeom[] = [];
  let gapGeoms: GapGeom[] = [];
  let openingsStarted = false; // the openings were put in the state the scan shows, once per tour
  const drawOpenings = () => {
    const state = new Map(ui.openings.value.map(o => [o.id, o.open]));
    deps.blueprint.setOpenings(openingGeoms.map(g => ({ id: g.id, kind: g.kind, corners: g.corners, open: state.get(g.id) ?? true })));
  };
  let piGeometry: GeometryAnswer | null = null;
  let piDefaults: MaterialDefaults | null = null;
  let latestMeasurement: Measurement | null = null;
  let measureId = 0;
  const pendingMeasures = new Map<number, (r: Extract<FromWorker, { type: 'measure' }>) => void>();
  const meshClosedByOpening = new Map<string, boolean>();

  const field = createFieldClient(post);
  const features = installFeatures({
    field,
    mesh: () => meshReady,
    sources: deps.getSources,
    audio: deps.getAudio,
  });
  features.listenForCompare();

  // ---- V2 SceneStore + Actions + SceneEffects ----
  const sceneStore = createStore(defaultScene(deps.modelId), () => {});

  const toRoomInfo = (r: GeometryAnswer['rooms'][number]): RoomInfo => {
    const n = r.polygon.length;
    let cx = n ? r.polygon.reduce((s, p) => s + p[0], 0) / n : 0;
    let cz = n ? -r.polygon.reduce((s, p) => s + p[1], 0) / n : 0;
    // The area centroid, not the mean of the corners: a wall with many corners must not pull the centre toward it.
    let twice = 0, sx = 0, sy = 0;
    for (let i = 0; i < n; i++) {
      const [x0, y0] = r.polygon[i];
      const [x1, y1] = r.polygon[(i + 1) % n];
      const cross = x0 * y1 - x1 * y0;
      twice += cross;
      sx += (x0 + x1) * cross;
      sy += (y0 + y1) * cross;
    }
    if (Math.abs(twice) > 1e-6) {
      cx = sx / (3 * twice);
      cz = -sy / (3 * twice);
    }
    return { id: r.id, name: r.name, floor: r.floor, area: r.area, centre: n ? [cx, r.floorZ + 1.5, cz] : null };
  };

  const toOpeningInfo = (o: GeometryAnswer['openings'][number]): OpeningInfo => ({
    id: o.id,
    kind: o.kind,
    roomId: o.roomId,
    roomName: o.roomName,
    width: Math.hypot(o.b[0] - o.a[0], o.b[1] - o.a[1]),
    height: o.height,
    meshClosed: meshClosedByOpening.get(o.id) ?? false,
  });

  const syncOpeningsFromUi = (list: Opening[]) => {
    const closed: string[] = [];
    const nextClosed: Record<string, boolean> = {};
    for (const o of list) {
      if (!o.open) {
        closed.push(o.id);
        nextClosed[o.id] = true;
      }
    }
    sceneStore.set({ ...sceneStore.get(), openings: { loaded: openingsLoaded, closed: nextClosed } }, ['openings']);
    if (openingsLoaded) post({ type: 'setOpenings', closed });
    drawOpenings();
    deps.clearReverb();
    deps.retrace();
    features.invalidate();
  };

  const toSoundId = (id: string): SoundId => (id in SOUNDS ? (id as SoundId) : 'music');

  const toAudioSpecs = (list: SceneState['sources']): SourceSpec[] =>
    list.map(s => ({
      id: s.id,
      label: s.label,
      kind: s.kind,
      sound: toSoundId(s.sound),
      position: s.position,
      levelDb: s.levelDb,
      enabled: s.enabled,
      ...(s.every ? { every: s.every } : {}),
    }));

  const syncSpeakersToScene = (list: Speaker[]) => {
    const prevById = new Map(sceneStore.get().sources.map(s => [s.id, s]));
    const nextSources = list.map(s => ({
      id: s.id,
      label: s.label,
      kind: s.kind,
      sound: s.sound,
      position: s.position,
      levelDb: s.levelDb,
      enabled: s.enabled,
      ...(prevById.get(s.id)?.every ? { every: prevById.get(s.id)!.every } : {}),
    }));
    sceneStore.set({ ...sceneStore.get(), sources: nextSources }, ['sources']);
    const active = list.filter(s => s.enabled && s.kind !== 'stereo').map(s => ({ id: s.id, position: s.position }));
    deps.setSources(active);
    const audioSpecs = toAudioSpecs(nextSources);
    deps.setSourceSpecs?.(audioSpecs);
    void deps.getAudio()?.setSources(audioSpecs);
    deps.retrace();
    features.invalidate();
  };

  let syncingFromJev = false;
  const syncSceneToUiSettings = (scene: SceneState) => {
    syncingFromJev = true;
    try {
      const cur = ui.settings.value;
      const wall = isMaterialName(scene.surfaces.wall) ? scene.surfaces.wall : cur.materials.wall;
      const floor = isMaterialName(scene.surfaces.floor) ? scene.surfaces.floor : cur.materials.floor;
      const ceiling = isMaterialName(scene.surfaces.ceiling) ? scene.surfaces.ceiling : cur.materials.ceiling;
      ui.settings.value = {
        materials: { wall, floor, ceiling },
        furnishing: scene.furnishing,
        quality: scene.quality,
      };
    } finally {
      syncingFromJev = false;
    }
  };

  /** The stand-in trim (windows the scan shows closed, time of day) on an outside source's level, so numbers match the ear. */
  const heard = (id: string, levelDb: Bands): Bands => {
    if (!isOutdoorSource(id)) return levelDb;
    const t = outdoorTrim(ui.openings.value, ui.timeOfDay.value).db;
    return [levelDb[0] + t, levelDb[1] + t, levelDb[2] + t];
  };
  /** The level of a traced source as the worker's `measure` states it: all its energy, against the source at 1 m. */
  const tracedLevelDb = (s: { direct: Bands; lateEnergy: Bands; slots: { energy: Bands }[]; distance: number }): Bands => {
    const d = Math.max(0.1, s.distance);
    return [0, 1, 2].map(k => {
      let e = s.direct[k] + s.lateEnergy[k];
      for (const slot of s.slots) e += slot.energy[k];
      return e > 0 ? Math.max(-120, 10 * Math.log10(e / (d * d))) : -120;
    }) as Bands;
  };

  /** Everything the worker needs from the scene: the material table and the quality. Never the MVP `config` message, which would replace the table with three house-wide materials. */
  const postScene = (scene: SceneState) => {
    post(setMaterialsMessage(scene, roomsTagged));
    const q = SCENE_QUALITY[scene.quality];
    post({ type: 'setQuality', raysPerTrace: q.raysPerTrace, bounces: q.bounces, reverbRays: q.reverbRays });
  };

  const effects: SceneEffects = {
    materialsChanged(scene: SceneState) {
      post(setMaterialsMessage(scene, roomsTagged));
      syncSceneToUiSettings(scene);
      deps.retrace();
      features.invalidate();
    },
    qualityChanged(scene: SceneState) {
      const q = SCENE_QUALITY[scene.quality];
      post({ type: 'setQuality', raysPerTrace: q.raysPerTrace, bounces: q.bounces, reverbRays: q.reverbRays });
      syncSceneToUiSettings(scene);
      deps.retrace();
    },
    async openingsChanged(scene: SceneState) {
      const closedIds = Object.keys(scene.openings.closed).filter(id => scene.openings.closed[id]);
      const closedSet = new Set(closedIds);
      ui.openings.value = ui.openings.value.map(o => ({ ...o, open: !closedSet.has(o.id) }));
      if (openingsLoaded) post({ type: 'setOpenings', closed: closedIds });
      deps.retrace();
      features.invalidate();
    },
    layersChanged(scene: SceneState) {
      const traced: Record<string, boolean> = {};
      for (const [id, v] of Object.entries(scene.meshLayers)) traced[id] = v.traced;
      post({ type: 'setLayers', traced });
      deps.retrace();
      features.invalidate();
    },
    async sourcesChanged(scene: SceneState) {
      ui.speakers.value = scene.sources.map(s => ({
        id: s.id,
        label: s.label,
        sound: s.sound,
        kind: s.kind,
        position: s.position,
        levelDb: s.levelDb,
        enabled: s.enabled,
      }));
      const active = scene.sources.filter(s => s.enabled && s.kind !== 'stereo').map(s => ({ id: s.id, position: s.position }));
      deps.setSources(active);
      const audioSpecs = toAudioSpecs(scene.sources);
      deps.setSourceSpecs?.(audioSpecs);
      await deps.getAudio()?.setSources(audioSpecs);
      deps.retrace();
      features.invalidate();
    },
    clearReverb: deps.clearReverb,
    retrace: deps.retrace,
    async moveUserTo(roomId) {
      const room = piGeometry?.rooms.find(r => r.id === roomId);
      const centre = room ? toRoomInfo(room).centre : null;
      if (!room || !centre || !deps.moveToPoint) throw new Error('cannot move');
      const within = (r: typeof room, x: number, z: number) => pointInPolygon(x, z, r.polygon.map(([px, py]) => [px, -py] as [number, number]));
      const landed = await deps.moveToPoint(centre, (x, z) => within(room, x, z));
      if (!landed) throw new Error('no viewpoint');
      // Say where we really are: a small room may have no capture point, and the nearest one can be next door.
      const here = (piGeometry?.rooms ?? []).find(r => Math.abs(r.floorZ + 1.5 - landed[1]) < 1.5 && within(r, landed[0], landed[2]));
      return { arrivedIn: here?.name ?? room.name, exact: !here || here.id === room.id };
    },
    measure(at) {
      const srcs = deps.getSources() ?? [];
      const room = at.roomId ? piGeometry?.rooms.find(r => r.id === at.roomId) : undefined;
      const point: Vec3 =
        at.point ??
        (room ? toRoomInfo(room).centre : null) ??
        deps.getListener() ??
        [0, 1.5, 0];
      const rid = at.roomId ?? deps.getRoomId() ?? 'unknown';
      // No worker yet (the mesh is still loading, or failed): nothing would ever answer.
      if (!deps.getSim()) return Promise.reject(new Error('the simulation is not ready'));
      const id = ++measureId;
      return new Promise((resolve, reject) => {
        // The worker reports a failed job without its id, so an unanswered measure must end by itself.
        const timer = setTimeout(() => {
          pendingMeasures.delete(id);
          reject(new Error('the measurement took too long'));
        }, MEASURE_TIMEOUT_MS);
        pendingMeasures.set(id, r => {
          clearTimeout(timer);
          pendingMeasures.delete(id);
          resolve({ roomId: rid, echoTime: r.echoTime, sources: r.sources.map(s => ({ ...s, levelDb: heard(s.id, s.levelDb) })), estimated: false });
        });
        post({ type: 'measure', id, point, roomId: rid, sources: srcs });
      });
    },
    current: () => latestMeasurement,
    // For the actions the centre is on the floor: `place` adds the 1 m a speaker stands at. (measure and moveUserTo
    // above use the ear-height centre from toRoomInfo directly.)
    rooms: () =>
      piGeometry
        ? piGeometry.rooms.map(r => {
            const info = toRoomInfo(r);
            return info.centre ? { ...info, centre: [info.centre[0], r.floorZ, info.centre[2]] as Vec3 } : info;
          })
        : [],
    openings: () => (piGeometry ? piGeometry.openings.map(toOpeningInfo) : []),
    layers: () => meshLayers,
    roomsTagged: () => roomsTagged,
    listener: () => {
      const pos = deps.getListener();
      return pos ? { position: pos, roomId: deps.getRoomId() } : null;
    },
  };

  const soundsMap = Object.fromEntries(SOUND_LIBRARY.map(s => [s.id, { kind: s.kind, levelDb: s.levelDb }]));
  const actions = createActions(sceneStore, effects, soundsMap);

  // ---- Wire UI commands ----
  commands.toggleBlueprint = deps.toggleBlueprint;
  commands.cycleBlueprintMode = deps.cycleBlueprintMode;
  commands.toggleAudio = deps.toggleAudio;
  commands.toggleFootsteps = deps.toggleFootsteps ?? (() => {});
  commands.onOpeningsChanged = syncOpeningsFromUi;
  commands.onSpeakersChanged = syncSpeakersToScene;

  let jevConvo: Convo = [];
  let jevAbort: AbortController | null = null;
  commands.stop = () => jevAbort?.abort();
  commands.ask = async (text, session) => {
    // One request at a time: a new one ends the one before it, and only the newest may keep what it learned or speak.
    jevAbort?.abort();
    const mine = ++latestAsk.id;
    const step = session.step('Thinking');
    const abort = (jevAbort = new AbortController());
    try {
      const res = await ask(text, jevConvo, {
        signal: abort.signal,
        store: sceneStore,
        actions,
        effects,
        onStep: label => {
          const s = session.step(label);
          s.done();
        },
      });
      const newest = mine === latestAsk.id;
      // A replaced request ends with the conversation as it was before it; writing that back would drop the newer turn.
      if (newest) jevConvo = res.convo;
      step.done();
      // "Stopped." is shown, never read aloud.
      session.say(res.reply, { silent: !newest || abort.signal.aborted });
    } catch (err) {
      console.error('[jev] step failed:', err);
      step.fail('could not finish');
      throw err;
    }
  };

  // Voice: open-source Whisper in a worker. Mic on records; mic off transcribes, then the text goes to Jev like a typed question.
  const recorder = createRecorder();
  const ask_ = (text: string) => {
    pushChat('user', text);
    ui.chatOpen.value = true;
    ui.thinking.value = true;
    const session = createSession();
    // Talking with Jev: a small "mm" if the answer is slow, the way a person would not leave a silence.
    let stopped = false;
    markStopped = () => (stopped = true);
    const cancelFiller = ui.converse.value ? ackAfter('jev', text, 150, on => (ui.speaking.value = on)) : () => {};
    cancelAck = cancelFiller;
    const sessionSay = session.say;
    // A request the user stopped still reports "Stopped" on screen, but never out loud.
    session.say = (t, o) => (cancelFiller(), sessionSay(t, { ...o, silent: o?.silent || stopped || mine !== latestAsk.id }));
    const request = commands.ask(text, session);
    const mine = latestAsk.id;
    void request
      .catch(err => {
        console.error('[jev] request failed:', err);
        session.say("Sorry, I couldn't do that.");
      })
      .finally(() => {
        cancelFiller();
        // A newer request may already be running: then "thinking" is its to clear.
        if (mine === latestAsk.id) ui.thinking.value = false;
      });
  };
  // Marks the spoken request in progress as stopped. Per request, so a new one starting does not un-stop the old one.
  let markStopped: () => void = () => {};
  let cancelAck: () => void = () => {};
  // Stopping Jev stops everything it is doing: the request, a pending "of course", and any speech already playing.
  const stopRequest = commands.stop;
  commands.stop = () => {
    markStopped();
    cancelAck();
    stopRequest();
    stopSpeaking();
    ui.speaking.value = false;
  };
  commands.voice = on => {
    if (!recorder.available) {
      ui.listening.value = false;
      pushChat('jev', 'Voice needs a browser with microphone access. You can type instead.');
      ui.chatOpen.value = true;
      return;
    }
    if (on) {
      ui.liveText.value = '';
      recorder.warm(); // the model downloads on first use of the mic, not on every tour
      recorder.start(t => (ui.liveText.value = t)).catch(() => {
        ui.listening.value = false;
        pushChat('jev', 'I could not use the microphone. Allow it in the browser, or type instead.');
        ui.chatOpen.value = true;
      });
      return;
    }
    ui.thinking.value = true;
    recorder
      .stop()
      .then(text => {
        ui.thinking.value = false;
        ui.liveText.value = '';
        if (text) ask_(text);
      })
      .catch(() => {
        ui.thinking.value = false;
        pushChat('jev', 'I could not make out the recording. Try again, or type instead.');
        ui.chatOpen.value = true;
      });
  };

  // Hands-free conversation: the mic stays open, each sentence goes to Jev, and Jev answers aloud.
  let conversation: Conversation | null = null;
  commands.converse = on => {
    conversation?.stop();
    conversation = null;
    ui.listening.value = false;
    ui.micMuted.value = false;
    if (!on) {
      ui.converse.value = false;
      commands.stop(); // ending the conversation ends the speech and the request in progress
      return;
    }
    stopSpeaking();
    warmAcks('jev');
    ui.converse.value = true;
    ui.chatOpen.value = true;
    startConversation({
      onText: ask_,
      onUserSpeaking: speaking => (ui.listening.value = speaking),
      onTranscribing: () => {}, // the agent's own thinking state takes over as soon as the sentence is sent
      agentBusy: () => ui.thinking.value || ui.speaking.value,
      onBargeIn: () => commands.stop(),
    }).then(
      c => {
        if (ui.converse.value) (conversation = c).setMuted(ui.micMuted.value);
        else c.stop();
      },
      () => {
        ui.converse.value = false;
        pushChat('jev', 'I could not use the microphone. Allow it in the browser, or type instead.');
      },
    );
  };

  // The mic button, while talking, mutes the mic instead of starting a second recording.
  const stopMuteEffect = effect(() => {
    conversation?.setMuted(ui.micMuted.value);
  });
  // Turn the tour's sound down while someone is talking, so the voice is heard over it.
  const stopDuckEffect = effect(() => {
    deps.getAudio()?.setDuck(ui.speaking.value || (ui.converse.value && ui.listening.value));
  });

  // ---- Sync UI signals -> Blueprint & Worker ----
  // Redraw the doors and windows on the blueprint whenever one opens or closes (or the list arrives after the geometry).
  const stopOpeningsEffect = effect(() => {
    void ui.openings.value;
    if (openingGeoms.length) drawOpenings();
  });

  const stopEchoesEffect = effect(() => {
    deps.blueprint.setEchoes(ui.showEchoes.value);
  });

  const stopHeatEffect = effect(() => {
    deps.blueprint.setHeat(ui.heat.value);
  });

  let lastSettings: typeof ui.settings.value | null = null;
  const stopSettingsEffect = effect(() => {
    const s = ui.settings.value;
    deps.blueprint.setSurfaceColors([
      materialById(s.materials.wall).color,
      materialById(s.materials.floor).color,
      materialById(s.materials.ceiling).color,
    ]);
    // A change that came from the scene (the agent, suggested defaults) was already sent to the worker by its effect.
    const last = lastSettings;
    lastSettings = s;
    if (syncingFromJev) return;
    const prev = sceneStore.get();
    const surfaces = { ...prev.surfaces };
    const roomSurfaces = { ...prev.roomSurfaces };
    for (const cls of ['wall', 'floor', 'ceiling'] as const) {
      const picked = s.materials[cls];
      // Only a surface the person changed here: the scene may hold a blend or a material this panel does not list.
      // (On the first run: a choice remembered from an earlier visit, when it differs from the scene's own.)
      if ((last ? last.materials[cls] : prev.surfaces[cls]) === picked || !isMaterialName(picked)) continue;
      surfaces[cls] = picked;
      // Their choice is for the whole house: rooms no longer keep their own material for that surface.
      for (const id of Object.keys(roomSurfaces)) {
        const rest = { ...roomSurfaces[id] };
        delete rest[cls];
        roomSurfaces[id] = rest;
      }
    }
    const furnishingChanged = !!last && last.furnishing !== s.furnishing;
    const next: SceneState = {
      ...prev,
      surfaces,
      roomSurfaces,
      furnishing: s.furnishing,
      roomFurnishing: furnishingChanged ? {} : prev.roomFurnishing,
      quality: s.quality,
    };
    sceneStore.set(next, ['surfaces', 'roomSurfaces', 'furnishing', 'roomFurnishing', 'quality']);
    if (deps.getSim()) {
      postScene(next);
      deps.clearReverb();
      deps.retrace();
      features.invalidate();
    }
  });

  // ---- Click-to-place speaker / probe ----
  const placements: ReturnType<typeof createPlacement>[] = [];
  const attachPlacement = (target: Window) => {
    const p = createPlacement({
      target,
      pointer: deps.getPointed,
      place(point) {
        if (ui.placeKind.value === 'probe') addProbe(point);
        else addSpeaker(point);
        ui.placing.value = false;
      },
      hint() {},
    });
    placements.push(p);
  };
  attachPlacement(window);

  const stopPlacingEffect = effect(() => {
    const on = ui.placing.value;
    for (const p of placements) {
      if (on) p.begin();
      else p.cancel();
    }
  });

  // ---- Fetch Property Intelligence openings & defaults ----
  const sendGeometryToWorker = () => {
    if (!meshReady || !piGeometry) return;
    const rooms: RoomGeom[] = piGeometry.rooms.map(r => ({
      id: r.id,
      floorY: r.floorZ,
      height: r.height,
      polygon: r.polygon.map(([x, y]) => [x, -y] as [number, number]),
    }));
    const openings: OpeningGeom[] = piGeometry.openings
      .filter((o): o is typeof o & { kind: 'window' | 'door' } => o.kind === 'window' || o.kind === 'door')
      .map(o => {
        const bot = o.bottom;
        const top = o.bottom + o.height;
        return {
          id: o.id,
          kind: o.kind,
          roomId: o.roomId,
          corners: [
            [o.a[0], bot, -o.a[1]],
            [o.b[0], bot, -o.b[1]],
            [o.b[0], top, -o.b[1]],
            [o.a[0], top, -o.a[1]],
          ],
          thickness: o.thickness,
        };
      });
    // Archways and half walls: nothing to close, but the scan may have something across them (a railing, a curtain).
    const gaps: GapGeom[] = piGeometry.openings
      .filter(o => o.kind === 'opening' || o.kind === 'divider')
      .map(o => ({
        id: o.id,
        thickness: o.thickness,
        corners: [
          [o.a[0], o.bottom, -o.a[1]],
          [o.b[0], o.bottom, -o.b[1]],
          [o.b[0], o.bottom + o.height, -o.b[1]],
          [o.a[0], o.bottom + o.height, -o.a[1]],
        ],
      }));
    post({ type: 'setRooms', rooms });
    post({ type: 'loadOpenings', openings, gaps });
    openingsLoaded = true;
    openingGeoms = openings;
    gapGeoms = gaps;
    drawOpenings();
    // Suggested defaults are applied when the worker answers `roomsReady`, so they are always per room.
  };

  fetch(`/api/openings/${encodeURIComponent(deps.modelId)}`)
    .then(r => (r.ok ? r.json() : null))
    .then((geom: GeometryAnswer | null) => {
      if (!geom) return;
      piGeometry = geom;
      features.setRoomLabels(new Map(geom.rooms.map(r => [r.id, r.name])));
      ui.openings.value = geom.openings
        .filter((o): o is typeof o & { kind: 'window' | 'door' } => o.kind === 'window' || o.kind === 'door')
        .map(o => ({
          id: o.id,
          type: o.kind,
          room: o.roomName || 'Room',
          label: `${o.roomName || 'Room'} ${o.kind}`,
          position: [(o.a[0] + o.b[0]) / 2, o.bottom + o.height / 2, -(o.a[1] + o.b[1]) / 2] as Vec3,
          open: true,
        }));
      sendGeometryToWorker();
    })
    .catch(() => {
      /* Property Intelligence openings optional; UI works without them. */
    });

  fetch(`/api/defaults/${encodeURIComponent(deps.modelId)}`)
    .then(r => (r.ok ? r.json() : null))
    .then((defaults: MaterialDefaults | null) => {
      if (!defaults) return;
      if (roomsTagged) actions.applyDefaults(defaults);
      else piDefaults = defaults;
    })
    .catch(() => {
      /* Defaults optional; defaultScene materials remain active. */
    });

  // ---- Wall badges between listener and sources ----
  let wallsBusy = false;
  // A request that arrives while one is running is kept (the newest only) and run after it, so the badges never
  // stay on where you were a moment ago.
  let wallsNext: { listener: Vec3; srcs: { id: string; position: Vec3 }[] } | null = null;
  const refreshWalls = async (listener: Vec3, srcs: { id: string; position: Vec3 }[]): Promise<void> => {
    if (!meshReady) return;
    if (wallsBusy) {
      wallsNext = { listener, srcs };
      return;
    }
    wallsBusy = true;
    try {
      const results = await Promise.all(srcs.map(s => field.walls(listener, s.position)));
      deps.blueprint.setWalls(results.map(list => list.map(w => ({ distance: w.distance, lossDb: w.lossDb[1] }))));
      ui.walls.value = results.map((list, i) => {
        const dirX = srcs[i].position[0] - listener[0];
        const dirY = srcs[i].position[1] - listener[1];
        const dirZ = srcs[i].position[2] - listener[2];
        const len = Math.hypot(dirX, dirY, dirZ) || 1;
        return {
          sourceId: srcs[i].id,
          color: Number.parseInt(PATHS_STYLE.sourceColors[i % PATHS_STYLE.sourceColors.length].slice(1), 16),
          items: list.map(w => ({
            position: [
              listener[0] + (dirX / len) * w.distance,
              listener[1] + (dirY / len) * w.distance,
              listener[2] + (dirZ / len) * w.distance,
            ] as Vec3,
            lossDb: Math.round(w.lossDb[1]),
          })),
        };
      });
    } finally {
      wallsBusy = false;
      const next = wallsNext;
      wallsNext = null;
      if (next) refreshWalls(next.listener, next.srcs).catch(() => {});
    }
  };

  return {
    onSimReady(ready) {
      meshReady = ready.mesh;
      meshLayers = ready.layers;
      occlusion?.dispose();
      occlusion = createOcclusion(ready.mesh, map => {
        ui.hidden.value = map;
      });
      postScene(sceneStore.get());
      sendGeometryToWorker();
    },
    onWorkerMessage(msg) {
      if (field.onMessage(msg)) return;
      if (msg.type === 'roomsReady') {
        roomsTagged = true;
        if (piDefaults) {
          actions.applyDefaults(piDefaults);
          piDefaults = null;
        } else {
          // The rooms are known now: send the table again so room materials reach their rooms.
          postScene(sceneStore.get());
          deps.clearReverb();
          deps.retrace();
        }
        return;
      }
      if (msg.type === 'openingsReady') {
        for (const o of msg.openings) meshClosedByOpening.set(o.id, o.meshClosed);
        // Openings the worker slid onto the scan's real hole: the outline, the pin and the hole move with them.
        const moved = new Map((msg.moved ?? []).map(m => [m.id, m.corners]));
        openingGeoms = openingGeoms.map(g => (moved.has(g.id) ? { ...g, corners: moved.get(g.id)! } : g));
        gapGeoms = gapGeoms.map(g => (moved.has(g.id) ? { ...g, corners: moved.get(g.id)! } : g));
        // The blueprint cuts the same holes the sound goes through: every opening and gap, as the worker carves them.
        const carved = [...openingGeoms, ...gapGeoms].map(carveOf);
        deps.blueprint.setHoles(carved.length ? p => insideAny(carved, p) : null);
        const centre = (c: OpeningGeom['corners']): Vec3 => [0, 1, 2].map(k => (c[0][k] + c[1][k] + c[2][k] + c[3][k]) / 4) as Vec3;
        const next = ui.openings.value.map(o => ({
          ...o,
          // Every loaded opening is traced as a panel: no stand-in trim.
          traced: meshClosedByOpening.has(o.id),
          ...(moved.has(o.id) ? { position: centre(moved.get(o.id)!) } : {}),
          // The first time: each opening starts as the scan shows it (glass or a closed leaf: closed; a hole: open).
          ...(!openingsStarted && meshClosedByOpening.has(o.id) ? { open: !meshClosedByOpening.get(o.id) } : {}),
        }));
        openingsStarted = true;
        openingChange.silent = true;
        try {
          setOpenings(next); // through the scene store and the worker, like a click
        } finally {
          openingChange.silent = false;
        }
        return;
      }
      if (msg.type === 'measure') {
        pendingMeasures.get(msg.id)?.(msg);
        pendingMeasures.delete(msg.id);
        return;
      }
      if (msg.type === 'trace') {
        const srcs = deps.getSources() ?? [];
        const echoTime = deps.getEchoTime() ?? msg.echoTimeEstimate;
        ui.sound.value = {
          listener: msg.listener,
          sources: msg.sources,
          positions: srcs.map(s => s.position),
          echoTime,
        };
        latestMeasurement = {
          roomId: deps.getRoomId(),
          echoTime,
          sources: msg.sources.map(s => ({
            id: s.id,
            // The same quantity `measure` reports, so a before/after pair compares like with like.
            levelDb: heard(s.id, tracedLevelDb(s)),
            walls: s.walls,
          })),
          estimated: !deps.getEchoTime(),
        };
        refreshWalls(msg.listener, srcs).catch(err => console.warn('walls:', err instanceof Error ? err.message : err));
      }
    },
    onPose(pose, inside) {
      ui.pose.value = pose;
      if (inside) features.onListener([pose.position.x, pose.position.y, pose.position.z]);
      if (occlusion) {
        const items = [...ui.openings.value, ...ui.speakers.value];
        if (items.length) {
          occlusion.query(
            [pose.position.x, pose.position.y, pose.position.z],
            items.map(i => i.id),
            items.map(i => i.position),
          );
        }
      }
    },
    onRoom(roomId) {
      features.setRoom(roomId);
    },
    onAudioStarted(engine) {
      features.onAudio(engine);
    },
    onSourcesInitialized(specs) {
      const nextSceneSources = specs.map(s => ({
        id: s.id,
        label: s.label,
        kind: s.kind,
        sound: s.sound,
        position: s.position,
        levelDb: s.levelDb,
        enabled: s.enabled,
        ...(s.every ? { every: s.every } : {}),
      }));
      // The surroundings arrive a few seconds in: speakers the person or the agent placed meanwhile are kept.
      const own = new Set(specs.map(s => s.id));
      const placed = sceneStore.get().sources.filter(s => /^speaker-/.test(s.id) && !own.has(s.id));
      sceneStore.set({ ...sceneStore.get(), sources: [...nextSceneSources, ...placed] }, ['sources']);
      ui.speakers.value = [...nextSceneSources, ...placed].map(s => ({
        id: s.id,
        label: s.label,
        sound: s.sound,
        kind: s.kind,
        position: s.position,
        levelDb: s.levelDb,
        enabled: s.enabled,
      }));
      if (placed.length) syncSpeakersToScene(ui.speakers.value);
    },
    setPointerTarget(win) {
      attachPlacement(win);
    },
    dispose() {
      commands.converse(false);
      stopMuteEffect();
      stopDuckEffect();
      stopEchoesEffect();
      stopOpeningsEffect();
      stopHeatEffect();
      stopSettingsEffect();
      stopPlacingEffect();
      for (const p of placements) p.cancel();
      occlusion?.dispose();
      occlusion = null;
      recorder.cancel();
    },
  };
}

/** Ray casting: is (x, z) inside the polygon? */
function pointInPolygon(x: number, z: number, poly: [number, number][]): boolean {
  let inside = false;
  for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
    const [xi, zi] = poly[i];
    const [xj, zj] = poly[j];
    if (zi > z !== zj > z && x < ((xj - xi) * (z - zi)) / (zj - zi) + xi) inside = !inside;
  }
  return inside;
}
