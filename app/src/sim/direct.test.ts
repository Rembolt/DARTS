import { it, expect } from 'vitest';
import { simConfig } from '../config';
import { directSound } from './direct';
import { MeshBuilder, ROOM_MAX, ROOM_MIN, boxRoom, splitRoom } from './testMeshes';

it('is full strength with nothing in the way, and reports distance and direction', () => {
  const r = directSound(boxRoom(), [1, 1.5, 1.5], [3, 1.5, 1.5]);
  expect(r.direct).toEqual([1, 1, 1]);
  expect(r.walls).toBe(0);
  expect(r.distance).toBeCloseTo(2);
  expect(r.direction).toEqual([1, 0, 0]);
});

it('one wall lowers each band by its blocking × transmissionScale in dB', () => {
  const r = directSound(splitRoom(), [1, 1.5, 1.5], [3, 1.5, 1.5]);
  expect(r.walls).toBe(1);
  const { blockingDb } = simConfig().materials.wall;
  r.direct.forEach((d, k) => expect(10 * Math.log10(d)).toBeCloseTo(-blockingDb[k] * simConfig().transmissionScale, 6));
});

it('averages the occlusion rays: a source just past the edge of a wall panel is partly blocked', () => {
  // A 0.1 m panel at x = 2 covering z 0..1.5. The centre ray at z = 1.6 passes; some rays to points around the
  // source cross the panel.
  const s = new MeshBuilder()
    .room(ROOM_MIN, ROOM_MAX)
    .wallX(2, 0.1, ROOM_MIN, [4, 3, 1.5])
    .state();
  const r = directSound(s, [1, 1.5, 1.6], [3, 1.5, 1.6]);
  expect(r.walls).toBe(0);
  expect(r.direct.every(d => d > 0.1 && d < 1)).toBe(true);
});
