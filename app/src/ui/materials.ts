// The material library (v2-design.md 4.1) and the settings built from it. Values are rough starting points, not
// measurements; the UI says "estimate" wherever it states what they do.
import type { Material } from '../sim/types';

export type Surface = 'wall' | 'floor' | 'ceiling';
export type MaterialDef = Material & { id: string; label: string; surfaces: Surface[]; color: string; feel: string };

export const MATERIALS: MaterialDef[] = [
  { id: 'drywall', label: 'Drywall', surfaces: ['wall', 'ceiling'], color: '#f3f0ea', feel: 'Typical walls', absorption: [0.23, 0.06, 0.09], scattering: 0.1, blockingDb: [20, 37, 45] },
  { id: 'insulated_drywall', label: 'Insulated drywall', surfaces: ['wall'], color: '#e9e6dc', feel: 'Blocks more street noise', absorption: [0.28, 0.08, 0.09], scattering: 0.1, blockingDb: [28, 45, 50] },
  { id: 'plaster', label: 'Plaster', surfaces: ['wall', 'ceiling'], color: '#efe8dc', feel: 'Hard and bright', absorption: [0.01, 0.03, 0.05], scattering: 0.05, blockingDb: [35, 45, 50] },
  { id: 'wall_tile', label: 'Wall tile', surfaces: ['wall'], color: '#d9e3df', feel: 'Very live, rings', absorption: [0.01, 0.01, 0.02], scattering: 0.05, blockingDb: [28, 38, 48] },
  { id: 'wood_panel', label: 'Wood panel', surfaces: ['wall', 'ceiling'], color: '#d8b98a', feel: 'Warm, a little soft', absorption: [0.27, 0.17, 0.11], scattering: 0.15, blockingDb: [25, 30, 35] },
  { id: 'acoustic_panel', label: 'Acoustic panel', surfaces: ['wall', 'ceiling'], color: '#b9c3a2', feel: 'Absorbs the room tone', absorption: [0.35, 0.81, 0.89], scattering: 0.4, blockingDb: [25, 35, 45] },
  { id: 'concrete', label: 'Concrete', surfaces: ['wall', 'floor'], color: '#cdc8bf', feel: 'Hard, blocks well', absorption: [0.01, 0.02, 0.02], scattering: 0.05, blockingDb: [41, 52, 65] },
  { id: 'wood_floor', label: 'Wood floor', surfaces: ['floor'], color: '#d3ac78', feel: 'Typical floors', absorption: [0.14, 0.09, 0.07], scattering: 0.2, blockingDb: [35, 45, 50] },
  { id: 'tile', label: 'Tile', surfaces: ['floor'], color: '#c7d1d0', feel: 'Hard, rings longer', absorption: [0.01, 0.01, 0.02], scattering: 0.05, blockingDb: [40, 50, 55] },
  { id: 'vinyl', label: 'Vinyl', surfaces: ['floor'], color: '#d6cfc0', feel: 'Fairly hard', absorption: [0.02, 0.03, 0.02], scattering: 0.05, blockingDb: [35, 45, 50] },
  { id: 'carpet', label: 'Carpet', surfaces: ['floor'], color: '#b8a698', feel: 'Soft, takes the highs', absorption: [0.07, 0.38, 0.65], scattering: 0.3, blockingDb: [35, 45, 50] },
];

export const SURFACES: { id: Surface; label: string }[] = [
  { id: 'wall', label: 'Walls' },
  { id: 'floor', label: 'Floor' },
  { id: 'ceiling', label: 'Ceiling' },
];

export const materialById = (id: string): MaterialDef => MATERIALS.find(m => m.id === id) ?? MATERIALS[0];
export const optionsFor = (surface: Surface): MaterialDef[] => MATERIALS.filter(m => m.surfaces.includes(surface));

export type Quality = 'fast' | 'normal' | 'high';
/** v2-design.md 3.2. */
export const QUALITY: Record<Quality, { label: string; raysPerTrace: number; bounces: number; reverbRays: number }> = {
  fast: { label: 'Fast', raysPerTrace: 1000, bounces: 3, reverbRays: 800 },
  normal: { label: 'Normal', raysPerTrace: 2000, bounces: 4, reverbRays: 1500 },
  high: { label: 'High', raysPerTrace: 3000, bounces: 5, reverbRays: 3000 },
};

export type Settings = {
  materials: Record<Surface, string>;
  furnishing: number;
  quality: Quality;
};

export const DEFAULT_SETTINGS: Settings = {
  materials: { wall: 'drywall', floor: 'wood_floor', ceiling: 'drywall' },
  furnishing: 0.15,
  quality: 'normal',
};

/** The settings as the worker wants them. */
export function toConfigMessage(s: Settings) {
  const q = QUALITY[s.quality];
  const m = (id: string): Material => {
    const d = materialById(id);
    return { absorption: d.absorption, scattering: d.scattering, blockingDb: d.blockingDb };
  };
  return {
    type: 'config' as const,
    materials: { wall: m(s.materials.wall), floor: m(s.materials.floor), ceiling: m(s.materials.ceiling) },
    furnishing: s.furnishing,
    raysPerTrace: q.raysPerTrace,
    bounces: q.bounces,
    reverbRays: q.reverbRays,
  };
}

/** Blueprint surface colours in the order the mesh's material ids use: wall, floor, ceiling. */
export const surfaceColors = (s: Settings): [string, string, string] => [materialById(s.materials.wall).color, materialById(s.materials.floor).color, materialById(s.materials.ceiling).color];

/** Read a saved or loaded scene: unknown keys dropped, missing ones take the defaults, bad values are ignored. */
export function parseSettings(raw: unknown): Settings {
  const d = DEFAULT_SETTINGS;
  const o = (raw && typeof raw === 'object' ? raw : {}) as Record<string, unknown>;
  const mats = (o.materials && typeof o.materials === 'object' ? o.materials : {}) as Record<string, unknown>;
  const pick = (surface: Surface) => {
    const id = mats[surface];
    return typeof id === 'string' && optionsFor(surface).some(m => m.id === id) ? id : d.materials[surface];
  };
  const furnishing = typeof o.furnishing === 'number' && Number.isFinite(o.furnishing) ? Math.min(0.4, Math.max(0, o.furnishing)) : d.furnishing;
  const quality = o.quality === 'fast' || o.quality === 'normal' || o.quality === 'high' ? o.quality : d.quality;
  return { materials: { wall: pick('wall'), floor: pick('floor'), ceiling: pick('ceiling') }, furnishing, quality };
}
