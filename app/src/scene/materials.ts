// Blends, the setMaterials message and applying suggested defaults (v2-design.md sections 4.1 and 4.4).
// The LLM picks library materials; this code computes every number. Values are rough estimates.

import { FURNISHING, MATERIALS, type MaterialName } from '../../../server/src/shared/materials';
import type { Bands, Material } from '../sim/types';
import {
  isBlendName, isMaterialName, ROOM_SURFACE_CLASSES, SURFACE_CLASSES,
  type Blend, type BlendName, type MaterialDefaults, type RoomSurfaceClass, type SceneState, type SurfaceClass, type SurfaceValue,
} from './state';

/**
 * The worker message this lane builds, copied from spec section 8. Lane H adds it to app/src/sim/types.ts in the
 * same wave; Lane Y replaces this copy with the import.
 */
export type SetMaterials = {
  type: 'setMaterials';
  library: Material[]; // library, then resolved blends (4.4)
  surfaces: [number, number, number, number]; // material index per class: wall, floor, ceiling, exterior wall
  roomSurfaces?: { roomId: string; surfaces: [number, number, number] }[];
  furnishing: number;
  roomFurnishing?: { roomId: string; value: number }[];
};

const MIN_PART = 0.1;
const MAX_PARTS = 3;
/** Absorption plus furnishing never passes this (spec 4.1 "Clamp"): a perfect absorber would be an artefact. */
export const MAX_ABSORPTION = 0.99;

function libraryMaterial(name: MaterialName): Material {
  const m = MATERIALS[name];
  return { absorption: [...m.absorption], scattering: m.scattering, blockingDb: [...m.blockingDb] };
}

const normalise = (parts: Blend['parts']): Blend['parts'] => {
  const total = parts.reduce((t, p) => t + p.weight, 0);
  return total > 0 ? parts.map(p => ({ material: p.material, weight: p.weight / total })) : [];
};

/**
 * Unknown materials and non-positive weights dropped, repeats merged, weights normalised, parts under 0.1 dropped,
 * the 3 heaviest kept, normalised again. Nothing valid left gives `{ parts: [] }`.
 */
export function cleanBlend(blend: Blend): Blend {
  const merged = new Map<MaterialName, number>();
  for (const p of blend.parts) {
    if (!isMaterialName(p.material) || !Number.isFinite(p.weight) || p.weight <= 0) continue;
    merged.set(p.material, (merged.get(p.material) ?? 0) + p.weight);
  }
  const parts = normalise([...merged].map(([material, weight]) => ({ material, weight })))
    .filter(p => p.weight >= MIN_PART)
    .sort((a, b) => b.weight - a.weight)
    .slice(0, MAX_PARTS);
  return { parts: normalise(parts) };
}

/**
 * A blend's values per band (spec 4.4): absorption and scattering as the weighted mean, blocking averaged as energy,
 * `TL = −10·log10 Σ w·10^(−TL_i/10)`. An empty blend falls back to drywall, the MVP wall.
 */
export function resolveBlend(blend: Blend): Material {
  const parts = cleanBlend(blend).parts;
  if (parts.length === 0) return libraryMaterial('drywall');
  if (parts.length === 1) return libraryMaterial(parts[0].material);
  const mats = parts.map(p => ({ m: libraryMaterial(p.material), w: p.weight }));
  const absorption = [0, 1, 2].map(i => mats.reduce((t, { m, w }) => t + w * m.absorption[i], 0)) as Bands;
  const blockingDb = [0, 1, 2].map(i => -10 * Math.log10(mats.reduce((t, { m, w }) => t + w * 10 ** (-m.blockingDb[i] / 10), 0))) as Bands;
  const scattering = mats.reduce((t, { m, w }) => t + w * m.scattering, 0);
  return { absorption, scattering, blockingDb };
}

/** Absorption with furnishing added, clamped to 0.99 per band. For display; the worker applies the same clamp. */
export function effectiveAbsorption(material: Material, furnishing: number): Bands {
  return material.absorption.map(a => Math.min(MAX_ABSORPTION, Math.max(0, a + furnishing))) as Bands;
}

/** The library in MATERIALS key order, then the scene's blends in name order. */
export function materialList(scene: SceneState): { names: SurfaceValue[]; materials: Material[] } {
  const library = Object.keys(MATERIALS) as MaterialName[];
  const blends = (Object.keys(scene.blends) as BlendName[]).sort();
  return {
    names: [...library, ...blends],
    materials: [...library.map(libraryMaterial), ...blends.map(b => resolveBlend(scene.blends[b]))],
  };
}

const HOUSE_FALLBACK: Record<SurfaceClass, MaterialName> = { wall: 'drywall', floor: 'wood_floor', ceiling: 'drywall', exteriorWall: 'drywall' };

/** The worker message for the scene. Room data only once rooms are tagged (spec 4.2). */
export function setMaterialsMessage(scene: SceneState, roomsTagged: boolean): SetMaterials {
  const { names, materials } = materialList(scene);
  const index = (v: SurfaceValue | undefined, cls: SurfaceClass): number => {
    const i = v === undefined ? -1 : names.indexOf(v);
    return i >= 0 ? i : names.indexOf(HOUSE_FALLBACK[cls]);
  };
  const msg: SetMaterials = {
    type: 'setMaterials',
    library: materials,
    surfaces: SURFACE_CLASSES.map(cls => index(scene.surfaces[cls], cls)) as SetMaterials['surfaces'],
    furnishing: scene.furnishing,
  };
  if (roomsTagged) {
    msg.roomSurfaces = Object.entries(scene.roomSurfaces).map(([roomId, r]) => ({
      roomId,
      surfaces: ROOM_SURFACE_CLASSES.map(cls => index(r[cls] ?? scene.surfaces[cls], cls)) as [number, number, number],
    }));
    msg.roomFurnishing = Object.entries(scene.roomFurnishing).map(([roomId, value]) => ({ roomId, value }));
  }
  return msg;
}

/** A blend with one part is stored as the plain material; otherwise under `name`. */
function assign(blends: Record<BlendName, Blend>, name: BlendName, blend: Blend): SurfaceValue | null {
  const clean = cleanBlend(blend);
  if (clean.parts.length === 0) return null;
  if (clean.parts.length === 1) return clean.parts[0].material;
  blends[name] = clean;
  return name;
}

function median(values: number[]): number {
  const v = [...values].sort((a, b) => a - b);
  if (v.length === 0) return 1;
  const mid = Math.floor(v.length / 2);
  return v.length % 2 ? v[mid] : (v[mid - 1] + v[mid]) / 2;
}

/** Keeps only the blends some surface still names. */
export function pruneBlends(scene: SceneState): SceneState {
  const used = new Set<string>([
    ...Object.values(scene.surfaces),
    ...Object.values(scene.roomSurfaces).flatMap(r => Object.values(r)),
  ]);
  const blends = Object.fromEntries(Object.entries(scene.blends).filter(([name]) => used.has(name))) as Record<BlendName, Blend>;
  return { ...scene, blends };
}

export const houseBlendName = (cls: RoomSurfaceClass): BlendName => `blend:house-${cls}`;
export const roomBlendName = (roomId: string, cls: RoomSurfaceClass): BlendName => `blend:${roomId}-${cls}`;
export const EXTERIOR_BLEND: BlendName = 'blend:exterior';

/**
 * Applies suggested defaults (spec 4.4). Without per-room tagging, each house surface becomes the rooms' choices
 * weighted by floor area (a room with no area counts as the median); furnishing and the exterior wall are left as they
 * are. With tagging, each room gets its own surfaces and furnishing, and the exterior wall its suggestion.
 */
export function applyDefaults(scene: SceneState, defaults: MaterialDefaults, rooms: { id: string; area: number }[], perRoom: boolean): SceneState {
  const blends: Record<BlendName, Blend> = { ...scene.blends };
  const next: SceneState = { ...scene, blends, defaults, surfaces: { ...scene.surfaces } };
  if (!perRoom) {
    const areas = new Map(rooms.filter(r => Number.isFinite(r.area) && r.area > 0).map(r => [r.id, r.area]));
    const fallback = median([...areas.values()]);
    for (const cls of ROOM_SURFACE_CLASSES) {
      delete blends[houseBlendName(cls)];
      const parts = defaults.rooms.flatMap(r => {
        const w = areas.get(r.roomId) ?? fallback;
        return cleanBlend(r[cls]).parts.map(p => ({ material: p.material, weight: p.weight * w }));
      });
      const value = assign(blends, houseBlendName(cls), { parts });
      if (value) next.surfaces[cls] = value;
    }
  } else {
    next.roomSurfaces = { ...scene.roomSurfaces };
    next.roomFurnishing = { ...scene.roomFurnishing };
    for (const r of defaults.rooms) {
      const room: Partial<Record<RoomSurfaceClass, SurfaceValue>> = { ...next.roomSurfaces[r.roomId] };
      for (const cls of ROOM_SURFACE_CLASSES) {
        delete blends[roomBlendName(r.roomId, cls)];
        const value = assign(blends, roomBlendName(r.roomId, cls), r[cls]);
        if (value) room[cls] = value;
      }
      next.roomSurfaces[r.roomId] = room;
      next.roomFurnishing[r.roomId] = FURNISHING[r.furnishing];
    }
    delete blends[EXTERIOR_BLEND];
    const ext = assign(blends, EXTERIOR_BLEND, defaults.exteriorWall);
    if (ext) next.surfaces.exteriorWall = ext;
  }
  return pruneBlends(next);
}

const sameBlend = (a: Blend | undefined, b: Blend) =>
  !!a && a.parts.length === b.parts.length &&
  a.parts.every((p, i) => p.material === b.parts[i].material && Math.abs(p.weight - b.parts[i].weight) < 1e-9);

/** Whether `value` is what applying `suggestion` under `name` would have stored. */
function matches(scene: SceneState, value: SurfaceValue | undefined, name: BlendName, suggestion: Blend): boolean {
  const clean = cleanBlend(suggestion);
  if (value === undefined || clean.parts.length === 0) return false;
  if (clean.parts.length === 1) return value === clean.parts[0].material;
  return value === name && sameBlend(scene.blends[name], clean);
}

const NOT_SUGGESTED = { suggested: false, reason: null } as const;

/** A surface still on its suggested default, with the default's reason (spec 4.4 "Where they live"). */
export function isSuggested(scene: SceneState, cls: SurfaceClass, roomId?: string): { suggested: boolean; reason: string | null } {
  const d = scene.defaults;
  if (!d) return NOT_SUGGESTED;
  if (cls === 'exteriorWall') {
    return matches(scene, scene.surfaces.exteriorWall, EXTERIOR_BLEND, d.exteriorWall) ? { suggested: true, reason: d.exteriorReason } : NOT_SUGGESTED;
  }
  if (roomId !== undefined) {
    const r = d.rooms.find(x => x.roomId === roomId);
    if (!r) return NOT_SUGGESTED;
    return matches(scene, scene.roomSurfaces[roomId]?.[cls], roomBlendName(roomId, cls), r[cls]) ? { suggested: true, reason: r.reason } : NOT_SUGGESTED;
  }
  const value = scene.surfaces[cls];
  const reason = `Blend of each room's suggested ${cls}, weighted by floor area.`;
  // Only applyDefaults writes a blend:house-* name; set_material always writes a plain material.
  if (isBlendName(value) && value === houseBlendName(cls) && scene.blends[value]) return { suggested: true, reason };
  const singles = new Set(d.rooms.map(r => {
    const parts = cleanBlend(r[cls]).parts;
    return parts.length === 1 ? parts[0].material : null;
  }));
  return d.rooms.length > 0 && singles.size === 1 && singles.has(value as MaterialName) ? { suggested: true, reason } : NOT_SUGGESTED;
}
