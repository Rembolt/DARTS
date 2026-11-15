import { it, expect } from 'vitest';
import { groupByMaterial } from './solid';

it('orders triangles by material and returns one draw group per material present', () => {
  // Triangles 0..3 with materials wall, ceiling, wall, floor.
  const indices = new Uint32Array([0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11]);
  const materials = new Uint8Array([0, 2, 0, 1]);
  const out = groupByMaterial(indices, materials);
  expect(Array.from(out.indices)).toEqual([0, 1, 2, 6, 7, 8, 9, 10, 11, 3, 4, 5]);
  expect(out.groups).toEqual([
    { start: 0, count: 6, materialIndex: 0 },
    { start: 6, count: 3, materialIndex: 1 },
    { start: 9, count: 3, materialIndex: 2 },
  ]);
});

it('leaves out groups for materials with no triangles', () => {
  const out = groupByMaterial(new Uint32Array([0, 1, 2]), new Uint8Array([1]));
  expect(out.groups).toEqual([{ start: 0, count: 3, materialIndex: 1 }]);
});

it('does not change the input', () => {
  const indices = new Uint32Array([0, 1, 2, 3, 4, 5]);
  groupByMaterial(indices, new Uint8Array([2, 0]));
  expect(Array.from(indices)).toEqual([0, 1, 2, 3, 4, 5]);
});
