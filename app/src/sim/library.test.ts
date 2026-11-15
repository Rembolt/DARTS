import { it, expect } from 'vitest';
import { MATERIALS } from '../../../server/src/shared/materials';
import { simConfig } from '../config';
import { traceEarly } from './early';
import { applySetMaterials, applySetQuality, effectiveAbsorption, materialOf, surfaceClass, type SurfaceTable } from './library';
import { reverbJob } from './reverb-job';
import { mulberry32 } from './sampling';
import { boxRoom } from './testMeshes';
import type { Material, ToWorker } from './types';

type SetMaterials = Extract<ToWorker, { type: 'setMaterials' }>;

// The library as the page sends it: the shared table in a fixed order.
const NAMES = Object.keys(MATERIALS) as (keyof typeof MATERIALS)[];
const LIBRARY: Material[] = NAMES.map(n => MATERIALS[n] as unknown as Material);
const at = (name: keyof typeof MATERIALS) => NAMES.indexOf(name);

const setMaterials = (floor: keyof typeof MATERIALS, extra: Partial<SetMaterials> = {}): SetMaterials => ({
  type: 'setMaterials',
  library: LIBRARY,
  surfaces: [at('drywall'), at(floor), at('drywall'), at('drywall')],
  furnishing: 0,
  ...extra,
});

it('caps absorption plus furnishing at 0.99', () =>
  expect(effectiveAbsorption({ absorption: [0.4, 0.85, 0.9], scattering: 0.4, blockingDb: [25, 35, 45] }, 0.15)).toEqual([0.55, 0.99, 0.99]));

it('maps facing and exterior to a surface class', () => {
  expect(surfaceClass(0, false)).toBe(0);
  expect(surfaceClass(0, true)).toBe(3);
  expect(surfaceClass(1, true)).toBe(1); // only walls can be exterior
  expect(surfaceClass(2, false)).toBe(2);
});

it('starts from the MVP materials, so an untouched scene traces as before', () => {
  const state = boxRoom();
  const config = simConfig();
  expect(state.table.library).toEqual([config.materials.wall, config.materials.floor, config.materials.ceiling]);
  expect(state.table.surfaces).toEqual([0, 1, 2, 0]);
  expect(state.table.furnishing).toBe(config.furnishing);
  expect(Array.from(state.room).every(r => r === -1)).toBe(true);
  expect(Array.from(state.exterior).every(e => e === 0)).toBe(true);
});

it('a tiled box rings longer than a carpeted one', () => {
  const echo = (floor: keyof typeof MATERIALS) => {
    const state = boxRoom();
    applySetMaterials(state, setMaterials(floor));
    return reverbJob(state, { type: 'reverb', roomId: 'r', listener: [2, 1.5, 1.5] }).echoTime;
  };
  const tile = echo('tile'), carpet = echo('carpet');
  expect(tile[1]).toBeGreaterThan(carpet[1]);
});

it('rejects an index outside the library and keeps the old table', () => {
  const state = boxRoom();
  const before = state.table;
  const surfaceBefore = state.surface.slice();
  expect(() => applySetMaterials(state, { ...setMaterials('tile'), surfaces: [0, LIBRARY.length, 0, 0] })).toThrow(/library/);
  expect(() => applySetMaterials(state, setMaterials('tile', { roomSurfaces: [{ roomId: 'a', surfaces: [0, -1, 0] }] }))).toThrow(/library/);
  expect(state.table).toBe(before);
  expect(state.surface).toEqual(surfaceBefore);
});

it('setQuality changes the rays used', () => {
  const state = boxRoom();
  applySetQuality(state, { type: 'setQuality', raysPerTrace: 1000, bounces: 3, reverbRays: 800 });
  expect(state.config.raysPerTrace).toBe(1000);
  expect(state.config.bounces).toBe(3);
  expect(state.config.reverbRays).toBe(800);
  const early = traceEarly(state, [2, 1.5, 1.5], [{ position: [1, 1, 1] }], mulberry32(1));
  expect(early.rays).toBe(1000);
  expect(early.bounces).toBe(3);
  expect(() => applySetQuality(state, { type: 'setQuality', raysPerTrace: 0, bounces: 3, reverbRays: 800 })).toThrow();
});

it('room values override house values for that room only', () => {
  const table: SurfaceTable = {
    library: LIBRARY,
    surfaces: [at('drywall'), at('wood_floor'), at('drywall'), at('siding_wall')],
    furnishing: 0.15,
    roomSurfaces: new Map([[1, [at('wall_tile'), at('tile'), at('plaster')]]]),
    roomFurnishing: new Map([[1, 0]]),
  };
  expect(materialOf(table, 1, 1)).toEqual({ material: MATERIALS.tile, furnishing: 0 });
  expect(materialOf(table, 1, 0)).toEqual({ material: MATERIALS.wood_floor, furnishing: 0.15 });
  expect(materialOf(table, 1, -1)).toEqual({ material: MATERIALS.wood_floor, furnishing: 0.15 });
  expect(materialOf(table, 0, 1).material).toEqual(MATERIALS.wall_tile);
  // Exterior walls take the house's exterior material, with the room's furnishing.
  expect(materialOf(table, 3, 1)).toEqual({ material: MATERIALS.siding_wall, furnishing: 0 });
});
