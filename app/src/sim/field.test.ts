import { expect, it } from 'vitest';
import { simConfig } from '../config';
import { directField } from './field';
import { boxRoom } from './testMeshes';

it('a point inside the room hears an inside source clearly, a point outside hears it through a wall', () => {
  const state = boxRoom(simConfig()); // room from (0,0,0) to (4,3,3)
  const points = Float32Array.from([1, 1.5, 1.5, /* outside: */ 8, 1.5, 1.5]);
  const r = directField(state, [3, 1.5, 1.5], points, 4);
  expect(r.id).toBe(4);
  expect(Array.from(r.walls)).toEqual([0, 1]);
  expect(r.direct[1]).toBe(1); // inside: mid band untouched
  expect(r.direct[4]).toBeLessThan(0.1); // outside: through one wall
});
