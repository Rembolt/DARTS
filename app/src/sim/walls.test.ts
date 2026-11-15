import { expect, it } from 'vitest';
import { simConfig } from '../config';
import { crossSegment, wallsAlong } from './crossings';
import { boxRoom, splitRoom } from './testMeshes';

const config = simConfig();

it('finds the one wall between a point outside and a point inside, nearest the start', () => {
  const state = boxRoom(config); // room (0,0,0)-(4,3,3)
  const walls = wallsAlong(state, [8, 1.5, 1.5], [2, 1.5, 1.5]);
  expect(walls).toHaveLength(1);
  expect(walls[0].distance).toBeCloseTo(4, 1);
  expect(walls[0].lossDb[1]).toBeCloseTo(config.materials.wall.blockingDb[1] * config.transmissionScale, 5);
});

it('finds nothing inside one room', () => {
  expect(wallsAlong(boxRoom(config), [1, 1.5, 1.5], [3, 1.2, 1])).toEqual([]);
});

it('adds up to exactly what crossSegment applies', () => {
  const state = splitRoom(config);
  const from: [number, number, number] = [0.5, 1.5, 1.5], to: [number, number, number] = [3.5, 1.5, 1.5];
  const walls = wallsAlong(state, from, to);
  const t = crossSegment(state, from, to)!;
  expect(walls.length).toBe(t.walls);
  const product = walls.reduce((a, w) => a * 10 ** (-w.lossDb[1] / 10), 1);
  expect(product).toBeCloseTo(t.transmission[1], 8);
});
