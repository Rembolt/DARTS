// The live scene: one source of truth for the settings panel and Jev (v2-design.md section 3).
// Only app/src/scene/actions.ts writes to it. Material values are rough estimates (spec 4.1).

import { FURNISHING, MATERIALS, type MaterialName } from '../../../server/src/shared/materials';
import type { Vec3 } from '../sim/types';

export type BlendName = `blend:${string}`;
export type SurfaceValue = MaterialName | BlendName;
export type SurfaceClass = 'wall' | 'floor' | 'ceiling' | 'exteriorWall';
export type RoomSurfaceClass = Exclude<SurfaceClass, 'exteriorWall'>;
export type Blend = { parts: { material: MaterialName; weight: number }[] };
export type Quality = 'fast' | 'normal' | 'high';
export type FurnishingLevel = keyof typeof FURNISHING;

/** Simulation quality presets (spec 3.2). */
export const QUALITY: Record<Quality, { raysPerTrace: number; bounces: number; reverbRays: number }> = {
  fast: { raysPerTrace: 1000, bounces: 3, reverbRays: 800 },
  normal: { raysPerTrace: 2000, bounces: 4, reverbRays: 1500 },
  high: { raysPerTrace: 3000, bounces: 5, reverbRays: 3000 },
};

export const MAX_SOURCES = 6;
export const SURFACE_CLASSES: SurfaceClass[] = ['wall', 'floor', 'ceiling', 'exteriorWall'];
export const ROOM_SURFACE_CLASSES: RoomSurfaceClass[] = ['wall', 'floor', 'ceiling'];
export const FURNISHING_MAX = 0.5;
export const LEVEL_MIN_DB = -30;
export const LEVEL_MAX_DB = 6;

/** Same shape as V3's `SourceSpec` in app/src/audio/engine.ts (declared here so this lane needs no other lane's file). */
export type SceneSource = {
  id: string; label: string; kind: 'point' | 'ambient' | 'stereo'; sound: string; position: Vec3; levelDb: number; enabled: boolean;
  /** stereo only: play once every [min, max] seconds instead of looping (V3's SourceSpec). */
  every?: [number, number];
};
export type RoomDefault = { roomId: string; floor: Blend; wall: Blend; ceiling: Blend; furnishing: FurnishingLevel; reason: string };
export type MaterialDefaults = { source: 'llm' | 'table'; rooms: RoomDefault[]; exteriorWall: Blend; exteriorReason: string };
export type PermissionRow = 'materials' | 'furnishing' | 'windows' | 'doors' | 'speakers' | 'locations' | 'userLocation' | 'mesh' | 'measurements';
export type PutRow = 'furnishing' | 'windows' | 'doors' | 'speakers' | 'userLocation';
export type Permissions = {
  get: Record<PermissionRow, boolean>;
  put: Record<PutRow, boolean>;
  putMaterial: Record<string, boolean>; // per library entry
  putLayer: Record<string, boolean>; // per mesh layer; absent means off
};
export type SceneState = {
  version: 1; modelId: string;
  blends: Record<BlendName, Blend>;
  surfaces: Record<SurfaceClass, SurfaceValue>;
  roomSurfaces: Record<string, Partial<Record<RoomSurfaceClass, SurfaceValue>>>;
  defaults: MaterialDefaults | null;
  furnishing: number; roomFurnishing: Record<string, number>;
  sources: SceneSource[];
  openings: { loaded: boolean; closed: Record<string, boolean> };
  meshLayers: Record<string, { traced: boolean; shown: boolean }>;
  quality: Quality;
  permissions: Permissions;
};

export const PERMISSION_ROWS: PermissionRow[] = ['materials', 'furnishing', 'windows', 'doors', 'speakers', 'locations', 'userLocation', 'mesh', 'measurements'];
export const PUT_ROWS: PutRow[] = ['furnishing', 'windows', 'doors', 'speakers', 'userLocation'];
const SOURCE_KINDS = ['point', 'ambient', 'stereo'] as const;
const DEFAULT_SURFACES: Record<SurfaceClass, MaterialName> = { wall: 'drywall', floor: 'wood_floor', ceiling: 'drywall', exteriorWall: 'drywall' };

/** Permission defaults (spec 6.2): every GET on; PUT on except the user location; every material on; every layer off. */
export function defaultPermissions(): Permissions {
  return {
    get: Object.fromEntries(PERMISSION_ROWS.map(r => [r, true])) as Record<PermissionRow, boolean>,
    put: { furnishing: true, windows: true, doors: true, speakers: true, userLocation: false },
    putMaterial: Object.fromEntries(Object.keys(MATERIALS).map(m => [m, true])),
    putLayer: {},
  };
}

export function defaultScene(modelId: string): SceneState {
  return {
    version: 1, modelId,
    blends: {},
    surfaces: { ...DEFAULT_SURFACES },
    roomSurfaces: {},
    defaults: null,
    furnishing: 0.15, roomFurnishing: {},
    sources: [],
    openings: { loaded: false, closed: {} },
    meshLayers: {},
    quality: 'normal',
    permissions: defaultPermissions(),
  };
}

export function isMaterialName(v: unknown): v is MaterialName {
  return typeof v === 'string' && Object.prototype.hasOwnProperty.call(MATERIALS, v);
}
export const isBlendName = (v: unknown): v is BlendName => typeof v === 'string' && v.startsWith('blend:') && v.length > 6;
export const clamp = (v: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, v));

const isObject = (v: unknown): v is Record<string, unknown> => typeof v === 'object' && v !== null && !Array.isArray(v);
const isFiniteNumber = (v: unknown): v is number => typeof v === 'number' && Number.isFinite(v);
const own = (o: object, k: string) => Object.prototype.hasOwnProperty.call(o, k);
/** Own entries of a plain object, without a '__proto__' key (assigning one would replace the prototype). */
const entries = (v: unknown): [string, unknown][] => (isObject(v) ? Object.entries(v).filter(([k]) => k !== '__proto__') : []);
const bool = (v: unknown, fallback: boolean) => (typeof v === 'boolean' ? v : fallback);

export function isVec3(v: unknown): v is Vec3 {
  return Array.isArray(v) && v.length === 3 && v.every(isFiniteNumber);
}

/** A blend whose parts all name library materials with weights in (0, 1]; anything else is null. */
function readBlend(v: unknown): Blend | null {
  if (!isObject(v) || !Array.isArray(v.parts) || v.parts.length === 0) return null;
  const parts: Blend['parts'] = [];
  for (const p of v.parts) {
    if (!isObject(p) || !isMaterialName(p.material) || !isFiniteNumber(p.weight) || p.weight <= 0 || p.weight > 1) return null;
    parts.push({ material: p.material, weight: p.weight });
  }
  return { parts };
}

function readDefaults(v: unknown): MaterialDefaults | null {
  if (!isObject(v) || (v.source !== 'llm' && v.source !== 'table') || !Array.isArray(v.rooms)) return null;
  const exteriorWall = readBlend(v.exteriorWall);
  if (!exteriorWall || typeof v.exteriorReason !== 'string') return null;
  const rooms: RoomDefault[] = [];
  for (const r of v.rooms) {
    if (!isObject(r) || typeof r.roomId !== 'string' || typeof r.reason !== 'string') continue;
    const floor = readBlend(r.floor), wall = readBlend(r.wall), ceiling = readBlend(r.ceiling);
    const furnishing = r.furnishing;
    if (!floor || !wall || !ceiling || typeof furnishing !== 'string' || !own(FURNISHING, furnishing)) continue;
    rooms.push({ roomId: r.roomId, floor, wall, ceiling, furnishing: furnishing as FurnishingLevel, reason: r.reason });
  }
  return { source: v.source, rooms, exteriorWall, exteriorReason: v.exteriorReason };
}

function readSource(v: unknown): SceneSource | null {
  if (!isObject(v) || typeof v.id !== 'string' || !v.id || typeof v.label !== 'string' || typeof v.sound !== 'string') return null;
  if (!SOURCE_KINDS.includes(v.kind as SceneSource['kind']) || !isVec3(v.position)) return null;
  const s: SceneSource = {
    id: v.id, label: v.label, kind: v.kind as SceneSource['kind'], sound: v.sound,
    position: [v.position[0], v.position[1], v.position[2]],
    levelDb: isFiniteNumber(v.levelDb) ? clamp(v.levelDb, LEVEL_MIN_DB, LEVEL_MAX_DB) : 0,
    enabled: bool(v.enabled, true),
  };
  const e = v.every;
  if (Array.isArray(e) && e.length === 2 && e.every(isFiniteNumber) && e[0] > 0 && e[0] <= e[1]) s.every = [e[0], e[1]];
  return s;
}

function readPermissions(v: unknown): Permissions {
  const p = defaultPermissions();
  if (!isObject(v)) return p;
  const get = isObject(v.get) ? v.get : {}, put = isObject(v.put) ? v.put : {}, putMaterial = isObject(v.putMaterial) ? v.putMaterial : {};
  for (const r of PERMISSION_ROWS) p.get[r] = bool(get[r], p.get[r]);
  for (const r of PUT_ROWS) p.put[r] = bool(put[r], p.put[r]);
  for (const m of Object.keys(p.putMaterial)) p.putMaterial[m] = bool(putMaterial[m], true);
  for (const [k, b] of entries(v.putLayer)) if (typeof b === 'boolean') p.putLayer[k] = b;
  return p;
}

/**
 * Turns anything read from a file or storage into a valid scene, or a message saying why not (spec 3.1):
 * another property or version is refused, unknown keys are dropped, missing or invalid ones take the defaults.
 */
export function normaliseScene(raw: unknown, modelId: string): { scene: SceneState } | { error: string } {
  if (!isObject(raw)) return { error: 'This file is not a scene file.' };
  if (raw.version !== 1) return { error: `This scene file has an unknown version (${String(raw.version)}).` };
  if (raw.modelId !== modelId) return { error: `This scene belongs to another property (${String(raw.modelId)}).` };
  const s = defaultScene(modelId);

  for (const [name, b] of entries(raw.blends)) {
    const blend = readBlend(b);
    if (isBlendName(name) && blend) s.blends[name] = blend;
  }
  const surfaceValue = (v: unknown): SurfaceValue | null =>
    isMaterialName(v) ? v : isBlendName(v) && Object.prototype.hasOwnProperty.call(s.blends, v) ? v : null;

  const surfaces = isObject(raw.surfaces) ? raw.surfaces : {};
  for (const cls of SURFACE_CLASSES) s.surfaces[cls] = surfaceValue(surfaces[cls]) ?? DEFAULT_SURFACES[cls];
  for (const [roomId, r] of entries(raw.roomSurfaces)) {
    if (!isObject(r)) continue;
    const room: Partial<Record<RoomSurfaceClass, SurfaceValue>> = {};
    for (const cls of ROOM_SURFACE_CLASSES) {
      const value = surfaceValue(r[cls]);
      if (value) room[cls] = value;
    }
    if (Object.keys(room).length) s.roomSurfaces[roomId] = room;
  }
  s.defaults = readDefaults(raw.defaults);

  if (isFiniteNumber(raw.furnishing)) s.furnishing = clamp(raw.furnishing, 0, FURNISHING_MAX);
  for (const [roomId, f] of entries(raw.roomFurnishing)) if (isFiniteNumber(f)) s.roomFurnishing[roomId] = clamp(f, 0, FURNISHING_MAX);

  if (Array.isArray(raw.sources)) {
    for (const v of raw.sources) {
      const source = readSource(v);
      if (source && !s.sources.some(o => o.id === source.id) && s.sources.length < MAX_SOURCES) s.sources.push(source);
    }
  }

  if (isObject(raw.openings)) {
    s.openings.loaded = bool(raw.openings.loaded, false);
    for (const [id, c] of entries(raw.openings.closed)) if (typeof c === 'boolean') s.openings.closed[id] = c;
  }
  for (const [id, l] of entries(raw.meshLayers)) {
    if (isObject(l)) s.meshLayers[id] = { traced: bool(l.traced, true), shown: bool(l.shown, true) };
  }
  if (typeof raw.quality === 'string' && own(QUALITY, raw.quality)) s.quality = raw.quality as Quality;
  s.permissions = readPermissions(raw.permissions);
  return { scene: s };
}
