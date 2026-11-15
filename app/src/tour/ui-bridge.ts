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
import type { Bands, FromWorker, OpeningGeom, RoomGeom, ToWorker, Vec3 } from '../sim/types';
import type { Pose } from '../viewer';
import { createFieldClient, installFeatures } from '../ui/features';
import { materialById, toConfigMessage } from '../ui/materials';
import { mountUi } from '../ui/mount';
import { createOcclusion, type Occlusion } from '../ui/occlusion';
import { startedBefore } from '../ui/StartScreen';
import { addProbe, addSpeaker, commands, createSession, pushChat, SOUND_LIBRARY, ui, type Opening, type Speaker } from '../ui/store';
import { createPlacement } from './placement';

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
  moveToPoint?: (point: Vec3) => Promise<void>;
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
    const cx = n ? r.polygon.reduce((s, p) => s + p[0], 0) / n : 0;
    const cz = n ? -r.polygon.reduce((s, p) => s + p[1], 0) / n : 0;
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
    deps.retrace();
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

  const effects: SceneEffects = {
    materialsChanged(scene: SceneState) {
      post(setMaterialsMessage(scene, roomsTagged));
      syncSceneToUiSettings(scene);
      deps.retrace();
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
    },
    layersChanged(scene: SceneState) {
      const traced: Record<string, boolean> = {};
      for (const [id, v] of Object.entries(scene.meshLayers)) traced[id] = v.traced;
      post({ type: 'setLayers', traced });
      deps.retrace();
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
    },
    clearReverb: deps.clearReverb,
    retrace: deps.retrace,
    async moveUserTo(roomId) {
      const room = piGeometry?.rooms.find(r => r.id === roomId);
      const centre = room ? toRoomInfo(room).centre : null;
      if (centre && deps.moveToPoint) await deps.moveToPoint(centre);
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
      const id = ++measureId;
      return new Promise(resolve => {
        pendingMeasures.set(id, r => {
          resolve({ roomId: rid, echoTime: r.echoTime, sources: r.sources, estimated: false });
        });
        post({ type: 'measure', id, point, roomId: rid, sources: srcs });
      });
    },
    current: () => latestMeasurement,
    rooms: () => (piGeometry ? piGeometry.rooms.map(toRoomInfo) : []),
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
  commands.ask = async (text, session) => {
    const step = session.step('Thinking');
    try {
      const res = await ask(text, jevConvo, {
        store: sceneStore,
        actions,
        effects,
        onStep: label => {
          const s = session.step(label);
          s.done();
        },
      });
      jevConvo = res.convo;
      step.done();
      session.say(res.reply);
    } catch (err) {
      step.fail(err instanceof Error ? err.message : 'failed');
      throw err;
    }
  };

  // Voice: open-source Whisper in a worker. Mic on records; mic off transcribes, then the text goes to Jev like a typed question.
  const recorder = createRecorder();
  recorder.warm();
  const ask_ = (text: string) => {
    pushChat('user', text);
    ui.chatOpen.value = true;
    ui.thinking.value = true;
    const session = createSession();
    void commands
      .ask(text, session)
      .catch(err => session.say(`That failed: ${err instanceof Error ? err.message : 'unknown error'}`))
      .finally(() => {
        ui.thinking.value = false;
      });
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

  const stopSettingsEffect = effect(() => {
    const s = ui.settings.value;
    deps.blueprint.setSurfaceColors([
      materialById(s.materials.wall).color,
      materialById(s.materials.floor).color,
      materialById(s.materials.ceiling).color,
    ]);
    if (!syncingFromJev) {
      const prev = sceneStore.get();
      sceneStore.set(
        {
          ...prev,
          surfaces: {
            ...prev.surfaces,
            wall: isMaterialName(s.materials.wall) ? s.materials.wall : prev.surfaces.wall,
            floor: isMaterialName(s.materials.floor) ? s.materials.floor : prev.surfaces.floor,
            ceiling: isMaterialName(s.materials.ceiling) ? s.materials.ceiling : prev.surfaces.ceiling,
          },
          furnishing: s.furnishing,
          quality: s.quality,
        },
        ['surfaces', 'furnishing', 'quality'],
      );
    }
    if (deps.getSim()) {
      post(toConfigMessage(s));
      deps.retrace();
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
    post({ type: 'setRooms', rooms });
    post({ type: 'loadOpenings', openings });
    openingsLoaded = true;
    openingGeoms = openings;
    drawOpenings();
    if (piDefaults) {
      actions.applyDefaults(piDefaults);
      piDefaults = null;
    }
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
      if (piGeometry) actions.applyDefaults(defaults);
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
      if (next) void refreshWalls(next.listener, next.srcs);
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
      sendGeometryToWorker();
      post(toConfigMessage(ui.settings.value));
    },
    onWorkerMessage(msg) {
      if (field.onMessage(msg)) return;
      if (msg.type === 'roomsReady') {
        roomsTagged = true;
        return;
      }
      if (msg.type === 'openingsReady') {
        for (const o of msg.openings) meshClosedByOpening.set(o.id, o.meshClosed);
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
            levelDb: [
              10 * Math.log10(Math.max(1e-6, s.direct[0])),
              10 * Math.log10(Math.max(1e-6, s.direct[1])),
              10 * Math.log10(Math.max(1e-6, s.direct[2])),
            ] as Bands,
            walls: s.walls,
          })),
          estimated: !deps.getEchoTime(),
        };
        void refreshWalls(msg.listener, srcs);
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
      sceneStore.set({ ...sceneStore.get(), sources: nextSceneSources }, ['sources']);
      ui.speakers.value = specs.map(s => ({
        id: s.id,
        label: s.label,
        sound: s.sound,
        kind: s.kind,
        position: s.position,
        levelDb: s.levelDb,
        enabled: s.enabled,
      }));
    },
    setPointerTarget(win) {
      attachPlacement(win);
    },
    dispose() {
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
