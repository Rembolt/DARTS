import { it, expect } from 'vitest';
import { simConfig } from '../config';
import { crossSegment } from './crossings';
import { MeshBuilder, ROOM_MAX, ROOM_MIN, boxRoom, splitRoom } from './testMeshes';

const dB = (v: number) => 10 * Math.log10(v);

it('crosses nothing inside an empty room', () => {
  expect(crossSegment(boxRoom(), [1, 1.5, 1.5], [3, 1.5, 1.5])).toEqual({ walls: 0, transmission: [1, 1, 1] });
});

it('merges the two faces of a thin wall into one wall with the wall blocking', () => {
  const c = crossSegment(splitRoom(), [1, 1.5, 1.5], [3, 1.5, 1.5])!;
  expect(c.walls).toBe(1);
  const { blockingDb } = simConfig().materials.wall;
  const scale = simConfig().transmissionScale;
  c.transmission.forEach((t, k) => expect(dB(t)).toBeCloseTo(-blockingDb[k] * scale, 6));
});

it('counts walls further apart than the merge distance separately, and stops past maxWalls', () => {
  const s = new MeshBuilder()
    .room(ROOM_MIN, ROOM_MAX)
    .wallX(1.5, 0.1, ROOM_MIN, ROOM_MAX)
    .wallX(2.5, 0.1, ROOM_MIN, ROOM_MAX)
    .state();
  expect(crossSegment(s, [1, 1.5, 1.5], [3, 1.5, 1.5])!.walls).toBe(2);
  expect(crossSegment(s, [1, 1.5, 1.5], [3, 1.5, 1.5], 1)).toBeNull();
  // through the outer wall too: 3 walls
  expect(crossSegment(s, [1, 1.5, 1.5], [5, 1.5, 1.5])!.walls).toBe(3);
});

it('a floor slab (floor face + ceiling face) blocks like the floor', () => {
  const s = new MeshBuilder()
    .quad([0, 1, 0], [4, 1, 0], [4, 1, 3], [0, 1, 3], [0, 1, 0])
    .quad([0, 0.8, 0], [4, 0.8, 0], [4, 0.8, 3], [0, 0.8, 3], [0, -1, 0])
    .state();
  const c = crossSegment(s, [2, 2, 1.5], [2, 0, 1.5])!;
  expect(c.walls).toBe(1);
  const scale = simConfig().transmissionScale;
  c.transmission.forEach((t, k) => expect(dB(t)).toBeCloseTo(-simConfig().materials.floor.blockingDb[k] * scale, 6));
});

it('with maxWalls 0 a clear segment passes and any crossing fails', () => {
  expect(crossSegment(splitRoom(), [1, 1.5, 1.5], [1.8, 1.5, 1.5], 0)).toEqual({ walls: 0, transmission: [1, 1, 1] });
  expect(crossSegment(splitRoom(), [1, 1.5, 1.5], [3, 1.5, 1.5], 0)).toBeNull();
});
