import { it, expect } from 'vitest';
import { applySetMaterials } from './library';
import { measure } from './measure';
import { boxRoom, splitRoom } from './testMeshes';
import type { ToWorker } from './types';

type Measure = Extract<ToWorker, { type: 'measure' }>;
const request = (sourceAt: [number, number, number], id = 7): Measure => ({
  type: 'measure', id, point: [1, 1.5, 1.5], roomId: 'room-1', sources: [{ id: 's', position: sourceAt }],
});

it('returns an echo time and a level per source', () => {
  const r = measure(boxRoom(), request([3, 1.5, 1.5])); // 2 m away, same room
  expect(r.type).toBe('measure');
  expect(r.echoTime[1]).toBeGreaterThan(0.2);
  expect(r.echoTime[1]).toBeLessThan(2.5);
  expect(r.sources).toHaveLength(1);
  const [s] = r.sources;
  expect(s.id).toBe('s');
  expect(s.walls).toBe(0);
  expect(Number.isFinite(s.levelDb[1])).toBe(true);
  // Against the source's level 1 m away in the open. The direct sound alone at 2 m is 10·log10(1/4) = −6.02 dB;
  // this small closed box is very live, so its reflections lift the level a few dB above that (about +2.5 dB).
  expect(s.levelDb[1]).toBeGreaterThan(-6.03);
  expect(s.levelDb[1]).toBeLessThan(10);
  expect(r.ms).toBeGreaterThanOrEqual(0);
});

it('a source behind a wall is quieter and counts the wall', () => {
  const open = measure(boxRoom(), request([3, 1.5, 1.5])).sources[0];
  const behind = measure(splitRoom(), request([3, 1.5, 1.5])).sources[0];
  expect(behind.walls).toBe(1);
  for (let k = 0; k < 3; k++) expect(behind.levelDb[k]).toBeLessThan(open.levelDb[k]);
});

it('floors silence at −120 dB', () => {
  const state = splitRoom();
  const wall = { absorption: [0.1, 0.1, 0.1] as [number, number, number], scattering: 0.1, blockingDb: [1000, 1000, 1000] as [number, number, number] };
  applySetMaterials(state, { type: 'setMaterials', library: [wall], surfaces: [0, 0, 0, 0], furnishing: 0 });
  expect(measure(state, request([3, 1.5, 1.5])).sources[0].levelDb).toEqual([-120, -120, -120]);
});

it('answers with the request id', () => {
  expect(measure(boxRoom(), request([3, 1.5, 1.5], 42)).id).toBe(42);
});
