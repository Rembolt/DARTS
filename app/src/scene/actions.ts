// The action layer: the only code that writes to SceneState (v2-design.md section 2). The settings panel and Jev call
// the same functions; Jev's executor checks permissions first (permissions.ts), these functions do not.
// Every action: validate → store.set → effect → clearReverb (geometry or materials) → retrace; PUT actions return
// the numbers before (the latest results, no new work) and after (one fresh measure), spec 6.5.

import { FURNISHING } from '../../../server/src/shared/materials';
import type { Bands, Vec3 } from '../sim/types';
import { applyDefaults as applyDefaultsTo, pruneBlends } from './materials';
import type { OpeningKind } from './permissions';
import {
  clamp, defaultScene, isMaterialName, isVec3, LEVEL_MAX_DB, LEVEL_MIN_DB, MAX_SOURCES, SURFACE_CLASSES,
  type FurnishingLevel, type MaterialDefaults, type Permissions, type Quality, type SceneSource, type SceneState, type SurfaceClass,
} from './state';
import type { SceneStore } from './store';

export type OpeningInfo = { id: string; kind: OpeningKind | 'opening' | 'divider'; roomId: string; roomName: string; width: number; height: number; meshClosed: boolean };
export type RoomInfo = { id: string; name: string; floor: string; area: number; centre: Vec3 | null };
export type Measurement = { roomId: string | null; echoTime: Bands; sources: { id: string; levelDb: Bands; walls: number }[]; estimated: boolean };

/** What the tour gives the actions. Lane J implements it; tests use a recording fake. */
export type SceneEffects = {
  materialsChanged(scene: SceneState): void; // setMaterials to the worker
  qualityChanged(scene: SceneState): void;
  openingsChanged(scene: SceneState): Promise<void>; // loads the layer first when scene.openings.loaded turned on
  layersChanged(scene: SceneState): void;
  sourcesChanged(scene: SceneState): Promise<void>; // engine.setSources + source positions for traces
  clearReverb(): void;
  retrace(): void;
  /** Resolves to where the user really landed when that is known: a small room may have no viewpoint of its own. */
  moveUserTo(roomId: string): Promise<{ arrivedIn: string; exact: boolean } | void>;
  measure(at: { point?: Vec3; roomId?: string }): Promise<Measurement>;
  current(): Measurement | null; // the latest trace and cached reverb; no new work
  rooms(): RoomInfo[]; openings(): OpeningInfo[]; layers(): { id: string; triangles: number }[];
  roomsTagged(): boolean;
  listener(): { position: Vec3; roomId: string | null } | null;
};

export type ActionResult<T = unknown> = { ok: true; value: T; before: Measurement | null; after: Measurement | null } | { ok: false; error: string };

export type Actions = {
  setMaterial(a: { target: SurfaceClass; room?: string; material: string }): Promise<ActionResult>;
  setFurnishing(a: { level: FurnishingLevel; room?: string }): Promise<ActionResult>;
  setOpening(a: { id?: string; room?: string; type?: OpeningKind | 'all'; state: 'open' | 'closed' }): Promise<ActionResult<{ changed: string[] }>>;
  placeSpeaker(a: { room?: string; point?: Vec3; sound: string; levelDb?: number }): Promise<ActionResult<{ id: string }>>;
  moveSpeaker(a: { id: string; room?: string; point?: Vec3 }): Promise<ActionResult>;
  setSpeaker(a: { id: string; levelDb?: number; enabled?: boolean; sound?: string }): Promise<ActionResult>;
  removeSpeaker(a: { id: string }): Promise<ActionResult>;
  moveUserTo(a: { room: string }): Promise<ActionResult>;
  setMeshLayer(a: { layer: string; traced?: boolean; shown?: boolean }): Promise<ActionResult>;
  measure(a: { point?: Vec3; room?: string }): Promise<ActionResult<Measurement>>;
  compare(a: { before: Measurement; after: Measurement }): ActionResult<{ echoTimeDelta: Bands; sources: { id: string; levelDeltaDb: Bands }[] }>;
  setQuality(q: Quality): void; setPermissions(p: Permissions): void;
  applyDefaults(d: MaterialDefaults): void; resetToSuggested(room?: string): void;
  loadScene(scene: SceneState): Promise<void>; reset(): Promise<void>;
};

export const LAYER_WARNING = 'Layer names are guesses from height; hiding one may remove walls.';
const ALL_KEYS = ['blends', 'surfaces', 'roomSurfaces', 'defaults', 'furnishing', 'roomFurnishing', 'sources', 'openings', 'meshLayers', 'quality', 'permissions'];
const MATERIAL_KEYS = ['blends', 'surfaces', 'roomSurfaces', 'defaults', 'furnishing', 'roomFurnishing'];
const SPEAKER_ID = /^speaker-(\d+)$/;

const fail = (error: string): { ok: false; error: string } => ({ ok: false, error });
const message = (e: unknown) => (e instanceof Error ? e.message : String(e));
const subtract = (a: Bands, b: Bands): Bands => [a[0] - b[0], a[1] - b[1], a[2] - b[2]];

export function createActions(store: SceneStore, effects: SceneEffects, sounds: Record<string, { kind: SceneSource['kind']; levelDb: number }>): Actions {
  /** A room by id, else by name (case-insensitive). */
  const findRoom = (room: string): RoomInfo | undefined => {
    const rooms = effects.rooms();
    return rooms.find(r => r.id === room) ?? rooms.find(r => r.name.toLowerCase() === room.toLowerCase());
  };
  const hasSound = (sound: string) => Object.prototype.hasOwnProperty.call(sounds, sound);

  /** The end of every PUT action: one fresh measure at the listener; a failed measure gives `after: null`. */
  async function finish<T>(value: T, before: Measurement | null): Promise<ActionResult<T>> {
    let after: Measurement | null = null;
    try {
      after = await effects.measure({});
    } catch {
      after = null;
    }
    return { ok: true, value, before, after };
  }

  function materialsChanged(next: SceneState, changed: string[]) {
    store.set(next, changed);
    effects.materialsChanged(next);
    effects.clearReverb();
    effects.retrace();
  }

  async function sourcesChanged(next: SceneState) {
    store.set(next, ['sources']);
    await effects.sourcesChanged(next);
    effects.retrace();
  }

  /** A speaker position from a room (its centre, 1 m above the floor) or a point. */
  function place(a: { room?: string; point?: Vec3 }): { position: Vec3 } | { error: string } {
    if (a.room !== undefined) {
      const room = findRoom(a.room);
      if (!room) return { error: `Unknown room: ${a.room}.` };
      if (!room.centre) return { error: "I can't place a speaker in that room yet." };
      return { position: [room.centre[0], room.centre[1] + 1, room.centre[2]] };
    }
    if (a.point !== undefined) return isVec3(a.point) ? { position: [a.point[0], a.point[1], a.point[2]] } : { error: 'The point must be three numbers (x, y, z).' };
    return { error: 'Give a room or a point.' };
  }

  async function updateSpeaker(id: string, change: (s: SceneSource) => SceneSource | string): Promise<ActionResult> {
    const before = effects.current();
    const scene = store.get();
    const i = scene.sources.findIndex(s => s.id === id);
    if (i < 0) return fail(`Unknown speaker: ${id}.`);
    const updated = change(scene.sources[i]);
    if (typeof updated === 'string') return fail(updated);
    await sourcesChanged({ ...scene, sources: scene.sources.map((s, j) => (j === i ? updated : s)) });
    return finish({ id }, before);
  }

  async function applyWhole(next: SceneState) {
    store.set(next, ALL_KEYS);
    effects.materialsChanged(next);
    effects.qualityChanged(next);
    effects.layersChanged(next);
    await effects.openingsChanged(next);
    await effects.sourcesChanged(next);
    effects.clearReverb();
    effects.retrace();
  }

  const actions: Actions = {
    async setMaterial(a) {
      const before = effects.current();
      if (!SURFACE_CLASSES.includes(a.target)) return fail(`Unknown surface: ${String(a.target)}.`);
      if (!isMaterialName(a.material)) return fail(`Unknown material: ${a.material}.`);
      const scene = store.get();
      if (a.room === undefined) {
        materialsChanged(pruneBlends({ ...scene, surfaces: { ...scene.surfaces, [a.target]: a.material } }), ['surfaces']);
        return finish({ target: a.target, material: a.material }, before);
      }
      if (a.target === 'exteriorWall') return fail('The exterior wall is set for the whole house, not per room.');
      if (!effects.roomsTagged()) return fail('Per-room materials are not available yet for this property.');
      const room = findRoom(a.room);
      if (!room) return fail(`Unknown room: ${a.room}.`);
      const roomSurfaces = { ...scene.roomSurfaces, [room.id]: { ...scene.roomSurfaces[room.id], [a.target]: a.material } };
      materialsChanged(pruneBlends({ ...scene, roomSurfaces }), ['roomSurfaces']);
      return finish({ target: a.target, room: room.id, material: a.material }, before);
    },

    async setFurnishing(a) {
      const before = effects.current();
      if (!Object.prototype.hasOwnProperty.call(FURNISHING, a.level)) return fail(`Unknown furnishing level: ${String(a.level)}.`);
      const value = FURNISHING[a.level];
      const scene = store.get();
      if (a.room === undefined) {
        materialsChanged({ ...scene, furnishing: value }, ['furnishing']);
        return finish({ level: a.level, value }, before);
      }
      if (!effects.roomsTagged()) return fail('Per-room furnishing is not available yet for this property.');
      const room = findRoom(a.room);
      if (!room) return fail(`Unknown room: ${a.room}.`);
      materialsChanged({ ...scene, roomFurnishing: { ...scene.roomFurnishing, [room.id]: value } }, ['roomFurnishing']);
      return finish({ level: a.level, room: room.id, value }, before);
    },

    async setOpening(a) {
      const before = effects.current();
      if (a.state !== 'open' && a.state !== 'closed') return fail(`Unknown opening state: ${String(a.state)}.`);
      const type = a.type ?? 'all';
      if (!['window', 'door', 'all'].includes(type)) return fail(`Unknown opening type: ${String(type)}.`);
      let room: RoomInfo | undefined;
      // No id and no room: the whole house in one go ("close all the doors"), one trace instead of one per opening.
      if (a.id === undefined && a.room !== undefined) {
        room = findRoom(a.room);
        if (!room) return fail(`Unknown room: ${a.room}.`);
      }
      // The openings are known only once their layer is loaded.
      if (!store.get().openings.loaded) {
        const scene = store.get();
        const next = { ...scene, openings: { ...scene.openings, loaded: true } };
        store.set(next, ['openings']);
        await effects.openingsChanged(next);
      }
      const openings = effects.openings();
      let targets: OpeningInfo[];
      if (a.id !== undefined) {
        const o = openings.find(x => x.id === a.id);
        if (!o) return fail(`Unknown opening: ${a.id}.`);
        if (o.kind !== 'window' && o.kind !== 'door') return fail(`Opening ${a.id} is a gap with no door or window to close.`);
        targets = [o];
      } else {
        targets = openings.filter(o => (!room || o.roomId === room.id) && (type === 'all' ? o.kind === 'window' || o.kind === 'door' : o.kind === type));
        if (targets.length === 0) {
          const what = type === 'window' ? 'windows' : type === 'door' ? 'doors' : 'windows or doors';
          return fail(room ? `No ${what} to change in ${room.name}.` : `No ${what} to change.`);
        }
      }
      const scene = store.get();
      const closed = { ...scene.openings.closed };
      const changed: string[] = [];
      for (const o of targets) {
        if ((closed[o.id] === true) !== (a.state === 'closed')) changed.push(o.id);
        if (a.state === 'closed') closed[o.id] = true;
        else delete closed[o.id];
      }
      const next = { ...scene, openings: { loaded: true, closed } };
      store.set(next, ['openings']);
      await effects.openingsChanged(next);
      effects.clearReverb();
      effects.retrace();
      return finish({ changed }, before);
    },

    async placeSpeaker(a) {
      const before = effects.current();
      const scene = store.get();
      if (scene.sources.length >= MAX_SOURCES) return fail(`At most ${MAX_SOURCES} sources.`);
      if (!hasSound(a.sound)) return fail(`Unknown sound: ${a.sound}.`);
      const where = place(a);
      if ('error' in where) return fail(where.error);
      const n = 1 + Math.max(0, ...scene.sources.map(s => Number(SPEAKER_ID.exec(s.id)?.[1] ?? 0)));
      const id = `speaker-${n}`;
      const levelDb = clamp(Number.isFinite(a.levelDb) ? a.levelDb! : sounds[a.sound].levelDb, LEVEL_MIN_DB, LEVEL_MAX_DB);
      const source: SceneSource = { id, label: `Speaker ${n} (${a.sound})`, kind: sounds[a.sound].kind, sound: a.sound, position: where.position, levelDb, enabled: true };
      await sourcesChanged({ ...scene, sources: [...scene.sources, source] });
      return finish({ id }, before);
    },

    moveSpeaker(a) {
      return updateSpeaker(a.id, s => {
        const where = place(a);
        return 'error' in where ? where.error : { ...s, position: where.position };
      });
    },

    setSpeaker(a) {
      return updateSpeaker(a.id, s => {
        if (a.sound !== undefined && !hasSound(a.sound)) return `Unknown sound: ${a.sound}.`;
        const next = { ...s };
        if (a.sound !== undefined) Object.assign(next, { sound: a.sound, kind: sounds[a.sound].kind });
        if (a.levelDb !== undefined && Number.isFinite(a.levelDb)) next.levelDb = clamp(a.levelDb, LEVEL_MIN_DB, LEVEL_MAX_DB);
        if (typeof a.enabled === 'boolean') next.enabled = a.enabled;
        return next;
      });
    },

    async removeSpeaker(a) {
      const before = effects.current();
      const scene = store.get();
      if (!scene.sources.some(s => s.id === a.id)) return fail(`Unknown speaker: ${a.id}.`);
      // Spec 6.5: the property's own sources (not placed as speakers) can be turned off but not removed.
      if (!SPEAKER_ID.test(a.id)) return fail(`${a.id} is one of the property's own sources: turn it off instead of removing it.`);
      await sourcesChanged({ ...scene, sources: scene.sources.filter(s => s.id !== a.id) });
      return finish({ id: a.id }, before);
    },

    async moveUserTo(a) {
      const before = effects.current();
      const room = findRoom(a.room);
      if (!room) return fail(`Unknown room: ${a.room}.`);
      let landed: { arrivedIn: string; exact: boolean } | void;
      try {
        landed = await effects.moveUserTo(room.id);
      } catch (e) {
        return fail(`I couldn't move you to ${room.name}: ${message(e)}`);
      }
      // Tell the truth about where the user is: the closest viewpoint can sit in the next room.
      return finish(landed && !landed.exact ? { room: room.id, arrivedIn: landed.arrivedIn, note: `${room.name} has no viewpoint of its own; the user is now in ${landed.arrivedIn}, as close as the tour allows. Say so.` } : { room: room.id }, before);
    },

    async setMeshLayer(a) {
      const before = effects.current();
      if (!effects.layers().some(l => l.id === a.layer)) return fail(`Unknown mesh layer: ${a.layer}.`);
      const scene = store.get();
      const old = scene.meshLayers[a.layer] ?? { traced: true, shown: true };
      const layer = { traced: typeof a.traced === 'boolean' ? a.traced : old.traced, shown: typeof a.shown === 'boolean' ? a.shown : old.shown };
      const next = { ...scene, meshLayers: { ...scene.meshLayers, [a.layer]: layer } };
      store.set(next, ['meshLayers']);
      effects.layersChanged(next);
      if (layer.traced !== old.traced) {
        effects.clearReverb();
        effects.retrace();
      }
      return finish({ layer: a.layer, ...layer, warning: LAYER_WARNING }, before);
    },

    async measure(a) {
      const before = effects.current();
      const at: { point?: Vec3; roomId?: string } = {};
      if (a.room !== undefined) {
        const room = findRoom(a.room);
        if (!room) return fail(`Unknown room: ${a.room}.`);
        at.roomId = room.id;
      }
      if (a.point !== undefined) {
        if (!isVec3(a.point)) return fail('The point must be three numbers (x, y, z).');
        at.point = a.point;
      }
      try {
        const value = await effects.measure(at);
        return { ok: true, value, before, after: value };
      } catch (e) {
        return fail(`The measurement failed: ${message(e)}`);
      }
    },

    compare({ before, after }) {
      const sources = after.sources.flatMap(s => {
        const b = before.sources.find(x => x.id === s.id);
        return b ? [{ id: s.id, levelDeltaDb: subtract(s.levelDb, b.levelDb) }] : [];
      });
      return { ok: true, value: { echoTimeDelta: subtract(after.echoTime, before.echoTime), sources }, before, after };
    },

    setQuality(q) {
      const next = { ...store.get(), quality: q };
      store.set(next, ['quality']);
      effects.qualityChanged(next);
      effects.clearReverb(); // the cached reverb was traced with the old ray count
      effects.retrace();
    },

    setPermissions(p) {
      store.set({ ...store.get(), permissions: p }, ['permissions']);
    },

    applyDefaults(d) {
      const next = applyDefaultsTo(store.get(), d, effects.rooms(), effects.roomsTagged());
      materialsChanged(next, MATERIAL_KEYS);
    },

    resetToSuggested(room) {
      const scene = store.get();
      const d = scene.defaults;
      if (!d) return;
      if (room === undefined) return actions.applyDefaults(d);
      if (!effects.roomsTagged()) return;
      const r = d.rooms.find(x => x.roomId === (findRoom(room)?.id ?? room));
      if (!r) return;
      const applied = applyDefaultsTo(scene, { ...d, rooms: [r] }, effects.rooms(), true);
      // Only this room changes: the house surfaces, the exterior wall included, stay as they are.
      materialsChanged(pruneBlends({ ...applied, defaults: d, surfaces: scene.surfaces, blends: { ...scene.blends, ...applied.blends } }), MATERIAL_KEYS);
    },

    loadScene(scene) {
      return applyWhole(scene);
    },

    async reset() {
      const scene = store.get();
      // Tour sources (not placed as speakers) and the user's permission choices survive a reset.
      let next: SceneState = {
        ...defaultScene(scene.modelId),
        sources: scene.sources.filter(s => !SPEAKER_ID.test(s.id)),
        permissions: scene.permissions,
      };
      if (scene.defaults) next = applyDefaultsTo(next, scene.defaults, effects.rooms(), effects.roomsTagged());
      await applyWhole(next);
    },
  };
  return actions;
}
