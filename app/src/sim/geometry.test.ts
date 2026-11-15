import { it, expect } from 'vitest';
import { buildRayIndex, firstHit } from './geometry';

// One floor triangle at y = 0, covering x + z < 1.
const floor = () =>
  buildRayIndex({ positions: new Float32Array([0, 0, 0, 0, 0, 1, 1, 0, 0]), indices: new Uint32Array([0, 1, 2]) });

it('hits a triangle from the front', () => {
  const hit = firstHit(floor(), [0.2, 1, 0.2], [0, -1, 0]);
  expect(hit?.triangle).toBe(0);
  expect(hit?.distance).toBeCloseTo(1);
});

it('hits a triangle from behind', () => {
  const hit = firstHit(floor(), [0.2, -1, 0.2], [0, 1, 0]);
  expect(hit?.distance).toBeCloseTo(1);
});

it('misses when pointing away', () => {
  expect(firstHit(floor(), [0.2, 1, 0.2], [0, 1, 0])).toBeNull();
});

it('misses beyond far', () => {
  expect(firstHit(floor(), [0.2, 1, 0.2], [0, -1, 0], 0.5)).toBeNull();
});
