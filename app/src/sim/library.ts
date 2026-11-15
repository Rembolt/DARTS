// The material library in the worker (v2-design.md 4.1 to 4.3): which material each triangle uses, from its surface
// class (facing, and exterior from the room tagging) and its room. Never rebuilds the ray index.
import type { SimState } from './load';
import type { Bands, Material, SimConfig, ToWorker } from './types';

export type SurfaceTable = {
  library: Material[];
  surfaces: [number, number, number, number]; // library index per class: wall, floor, ceiling, exterior wall
  furnishing: number;
  roomSurfaces: Map<number, [number, number, number]>; // keyed by room index: wall, floor, ceiling
  roomFurnishing: Map<number, number>; // keyed by room index
  /** Library indexes of the closed-window and closed-door panel materials; absent: the MVP wall. */
  glassIndex?: number;
  doorIndex?: number;
};

/** What the tracer reads per hit: absorption with furnishing added and clamped, scattering with the floor applied. */
export type ResolvedSurface = { absorption: Bands; scattering: number; blockingDb: Bands };

export type SetMaterials = Extract<ToWorker, { type: 'setMaterials' }>;
export type SetQuality = Extract<ToWorker, { type: 'setQuality' }>;

/** At most this much of the sound is absorbed per band per hit (v2-design 4.1, "Clamp"): never a perfect absorber. */
export const MAX_ABSORPTION = 0.99;

/** Surface class from the facing tag (`tagMaterials`: 0 wall, 1 floor, 2 ceiling) and the exterior flag. */
export function surfaceClass(materialTag: number, exterior: boolean): 0 | 1 | 2 | 3 {
  if (materialTag === 0) return exterior ? 3 : 0;
  return materialTag === 1 ? 1 : 2;
}

function libraryIndexOf(table: SurfaceTable, cls: 0 | 1 | 2 | 3, room: number): { index: number; furnishing: number } {
  const furnishing = table.roomFurnishing.get(room) ?? table.furnishing;
  if (cls === 3) return { index: table.surfaces[3], furnishing };
  const own = table.roomSurfaces.get(room);
  return { index: own ? own[cls] : table.surfaces[cls], furnishing };
}

/** The material and furnishing of a surface class in a room (−1: in no room, so the house values). */
export function materialOf(table: SurfaceTable, cls: 0 | 1 | 2 | 3, room: number): { material: Material; furnishing: number } {
  const { index, furnishing } = libraryIndexOf(table, cls, room);
  return { material: table.library[index], furnishing };
}

/** `min(α + f, 0.99)` per band (and at least 0). */
export function effectiveAbsorption(m: Material, furnishing: number): Bands {
  return m.absorption.map(a => Math.min(MAX_ABSORPTION, Math.max(0, a + furnishing))) as Bands;
}

export function resolveSurface(m: Material, furnishing: number, config: SimConfig): ResolvedSurface {
  return {
    absorption: effectiveAbsorption(m, furnishing),
    scattering: Math.max(m.scattering, config.scatteringFloor),
    blockingDb: [...m.blockingDb],
  };
}

/** The table an untouched scene uses: the three MVP materials, exterior walls as walls (v2-design 4.4). */
export function mvpTable(config: SimConfig): SurfaceTable {
  const { wall, floor, ceiling } = config.materials;
  return {
    library: [wall, floor, ceiling],
    surfaces: [0, 1, 2, 0],
    furnishing: config.furnishing,
    roomSurfaces: new Map(),
    roomFurnishing: new Map(),
  };
}

/**
 * Recompute every triangle's resolved surface from `state.table`, `state.surfaceClass`, `state.room` and
 * `state.exterior`. One small lookup per (class, room) pair, then one array read per triangle.
 */
export function resolveSurfaces(state: SimState): void {
  const rooms = state.roomIds.length;
  const surfaces: ResolvedSurface[] = [];
  const keyOf = new Map<string, number>();
  const slot = new Uint16Array(4 * (rooms + 1)); // [class][room + 1]
  for (let cls = 0 as 0 | 1 | 2 | 3; cls < 4; cls = (cls + 1) as 0 | 1 | 2 | 3) {
    for (let r = -1; r < rooms; r++) {
      const { index, furnishing } = libraryIndexOf(state.table, cls, r);
      const key = `${index}|${furnishing}`;
      let s = keyOf.get(key);
      if (s === undefined) {
        s = surfaces.length;
        surfaces.push(resolveSurface(state.table.library[index], furnishing, state.config));
        keyOf.set(key, s);
      }
      slot[cls * (rooms + 1) + r + 1] = s;
    }
  }
  const { surfaceClass: tags, room, exterior, surface } = state;
  for (let t = 0; t < surface.length; t++) {
    const tag = tags[t];
    const cls = tag === 0 ? (exterior[t] ? 3 : 0) : tag;
    surface[t] = slot[cls * (rooms + 1) + room[t] + 1];
  }
  state.surfaces = surfaces;

  // Door and window panels: glass or door, with the furnishing of the opening's room.
  if (state.panels) {
    const roomIndex = new Map(state.roomIds.map((id, i) => [id, i]));
    const { table, config } = state;
    state.panels.surfaces = state.panels.openings.map(o => {
      const index = o.kind === 'window' ? table.glassIndex : table.doorIndex;
      const material = index === undefined ? config.materials.wall : table.library[index];
      const furnishing = table.roomFurnishing.get(roomIndex.get(o.roomId) ?? -1) ?? table.furnishing;
      return resolveSurface(material, furnishing, config);
    });
  }
}

/** The resolved surface of triangle `t`: a main-mesh triangle, or a panel triangle (numbered after the mesh's). */
export function surfaceAt(state: SimState, t: number): ResolvedSurface {
  const main = state.surface.length;
  if (t < main) return state.surfaces[state.surface[t]];
  const p = state.panels!;
  return p.surfaces[p.panelOf[t - main]];
}

function checkIndex(i: number, library: Material[], what: string): void {
  if (!Number.isInteger(i) || i < 0 || i >= library.length) {
    throw new Error(`setMaterials: ${what} ${i} is outside the library (${library.length} materials)`);
  }
}

function checkFurnishing(v: number, what: string): void {
  if (!Number.isFinite(v) || v < 0) throw new Error(`setMaterials: ${what} ${v} is not a furnishing value`);
}

/**
 * Apply a `setMaterials` message. Everything is checked first: an index outside the library (or a bad value) throws
 * and leaves the state as it was. Room ids map to indexes through the rooms last set (`setRooms`); unknown ids are
 * ignored. The message is kept, so a later `setRooms` can map its room ids again.
 */
export function applySetMaterials(state: SimState, msg: SetMaterials): void {
  const { library } = msg;
  if (library.length === 0 || library.length > 255) throw new Error(`setMaterials: the library has ${library.length} materials (1 to 255)`);
  msg.surfaces.forEach((i, k) => checkIndex(i, library, `surface ${k}`));
  for (const r of msg.roomSurfaces ?? []) r.surfaces.forEach((i, k) => checkIndex(i, library, `room ${r.roomId} surface ${k}`));
  if (msg.glassIndex !== undefined) checkIndex(msg.glassIndex, library, 'glassIndex');
  if (msg.doorIndex !== undefined) checkIndex(msg.doorIndex, library, 'doorIndex');
  checkFurnishing(msg.furnishing, 'furnishing');
  for (const r of msg.roomFurnishing ?? []) checkFurnishing(r.value, `room ${r.roomId} furnishing`);

  const roomIndex = new Map(state.roomIds.map((id, i) => [id, i]));
  const roomSurfaces = new Map<number, [number, number, number]>();
  for (const r of msg.roomSurfaces ?? []) {
    const i = roomIndex.get(r.roomId);
    if (i !== undefined) roomSurfaces.set(i, [...r.surfaces]);
  }
  const roomFurnishing = new Map<number, number>();
  for (const r of msg.roomFurnishing ?? []) {
    const i = roomIndex.get(r.roomId);
    if (i !== undefined) roomFurnishing.set(i, r.value);
  }
  state.table = {
    library: [...library],
    surfaces: [...msg.surfaces],
    furnishing: msg.furnishing,
    roomSurfaces,
    roomFurnishing,
    glassIndex: msg.glassIndex,
    doorIndex: msg.doorIndex,
  };
  state.lastSetMaterials = msg;
  resolveSurfaces(state);
}

/** Apply a `setQuality` message (v2-design 3.2): the rays per trace, bounces and reverb rays. */
export function applySetQuality(state: SimState, msg: SetQuality): void {
  for (const [k, v] of [['raysPerTrace', msg.raysPerTrace], ['bounces', msg.bounces], ['reverbRays', msg.reverbRays]] as const) {
    if (!Number.isInteger(v) || v < 1 || v > 100_000) throw new Error(`setQuality: ${k} ${v} must be a whole number from 1`);
  }
  if (msg.bounces > 255) throw new Error(`setQuality: bounces ${msg.bounces} is more than 255`);
  state.config = { ...state.config, raysPerTrace: msg.raysPerTrace, bounces: msg.bounces, reverbRays: msg.reverbRays };
}
