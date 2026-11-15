import { it, expect } from 'vitest';
import { MATERIALS } from '../../../server/src/shared/materials';
import { applySetMaterials, materialOf, surfaceAt } from './library';
import { pointInPolygon, roomAt, tagRooms } from './rooms';
import { boxRoom, MeshBuilder, ROOM_MAX, ROOM_MIN, splitRoom } from './testMeshes';
import type { Material, RoomGeom, ToWorker } from './types';

type SetRooms = Extract<ToWorker, { type: 'setRooms' }>;

const LEFT: RoomGeom = { id: 'left', floorY: 0, height: 3, polygon: [[0, 0], [2, 0], [2, 3], [0, 3]] };
const RIGHT: RoomGeom = { id: 'right', floorY: 0, height: 3, polygon: [[2, 0], [4, 0], [4, 3], [2, 3]] };
const WHOLE: RoomGeom = { id: 'whole', floorY: 0, height: 3, polygon: [[0, 0], [4, 0], [4, 3], [0, 3]] };
const setRooms = (...rooms: RoomGeom[]): SetRooms => ({ type: 'setRooms', rooms });

/** Triangle centres, to find triangles by position (the ray index reorders them). */
function centre(state: ReturnType<typeof boxRoom>, t: number): [number, number, number] {
  const { positions: p, indices } = state.mesh;
  const c: [number, number, number] = [0, 0, 0];
  for (let k = 0; k < 3; k++) for (let j = 0; j < 3; j++) c[j] += p[indices[3 * t + k] * 3 + j] / 3;
  return c;
}

it('point in polygon', () => {
  const square: [number, number][] = [[0, 0], [2, 0], [2, 2], [0, 2]];
  expect(pointInPolygon(1, 1, square)).toBe(true);
  expect(pointInPolygon(3, 1, square)).toBe(false);
  expect(pointInPolygon(1, -0.5, square)).toBe(false);
  const ell: [number, number][] = [[0, 0], [3, 0], [3, 1], [1, 1], [1, 3], [0, 3]]; // concave L
  expect(pointInPolygon(0.5, 2.5, ell)).toBe(true);
  expect(pointInPolygon(2.5, 0.5, ell)).toBe(true);
  expect(pointInPolygon(2, 2, ell)).toBe(false); // in the notch
});

it('picks the room on the right floor', () => {
  const square: [number, number][] = [[0, 0], [4, 0], [4, 4], [0, 4]];
  const rooms: RoomGeom[] = [
    { id: 'upper', floorY: 3, height: 2.7, polygon: square },
    { id: 'lower', floorY: 0, height: 2.7, polygon: square },
  ];
  expect(roomAt(rooms, [1, 1, 1])).toBe(1);
  expect(roomAt(rooms, [1, 4, 1])).toBe(0);
  expect(roomAt(rooms, [1, 2.9, 1])).toBe(1); // both match; the highest floor at or below the point wins
  expect(roomAt(rooms, [1, -0.2, 1])).toBe(1); // within 0.3 m below the lower floor
  expect(roomAt(rooms, [1, 7, 1])).toBe(-1);
  expect(roomAt(rooms, [5, 1, 1])).toBe(-1);
});

it('tags both sides of a shared wall to the room each faces', () => {
  const state = splitRoom();
  const ready = tagRooms(state, setRooms(LEFT, RIGHT));
  expect(ready.type).toBe('roomsReady');
  expect(state.roomIds).toEqual(['left', 'right']);
  let checked = 0;
  for (let t = 0; t < state.room.length; t++) {
    const [x] = centre(state, t);
    if (Math.abs(x - 1.95) < 1e-6) { expect(state.room[t]).toBe(0); checked++; }
    if (Math.abs(x - 2.05) < 1e-6) { expect(state.room[t]).toBe(1); checked++; }
  }
  expect(checked).toBe(4);
  expect(ready.rooms.map(r => r.id)).toEqual(['left', 'right']);
  expect(ready.rooms.reduce((n, r) => n + r.triangles, 0) + ready.untagged).toBe(state.room.length);
  expect(ready.ms).toBeGreaterThanOrEqual(0);
});

it('marks outside-facing walls as exterior', () => {
  const box = boxRoom();
  expect(tagRooms(box, setRooms(WHOLE)).exteriorWalls).toBe(8); // four walls, two triangles each
  const split = splitRoom();
  expect(tagRooms(split, setRooms(LEFT, RIGHT)).exteriorWalls).toBe(8);
  for (let t = 0; t < split.room.length; t++) {
    const [x] = centre(split, t);
    if (Math.abs(x - 2) < 0.1) expect(split.exterior[t]).toBe(0); // the divider
  }
  // Floors and ceilings are never exterior.
  for (let t = 0; t < box.room.length; t++) if (box.surfaceClass[t] !== 0) expect(box.exterior[t]).toBe(0);
});

it('leaves triangles outside every room untagged', () => {
  const state = new MeshBuilder().room(ROOM_MIN, ROOM_MAX).tri([50, 0, 0], [51, 0, 0], [50, 0, 1], [0, 1, 0]).state();
  const ready = tagRooms(state, setRooms(WHOLE));
  expect(ready.untagged).toBe(1);
  expect(ready.rooms).toEqual([{ id: 'whole', triangles: 12 }]);
});

it('gives each room its own floor material', () => {
  const NAMES = Object.keys(MATERIALS) as (keyof typeof MATERIALS)[];
  const library = NAMES.map(n => MATERIALS[n] as unknown as Material);
  const at = (n: keyof typeof MATERIALS) => NAMES.indexOf(n);
  const state = splitRoom();
  // Sent before the rooms: kept, and mapped to rooms once they arrive.
  applySetMaterials(state, {
    type: 'setMaterials',
    library,
    surfaces: [at('drywall'), at('wood_floor'), at('drywall'), at('brick_veneer')],
    roomSurfaces: [
      { roomId: 'left', surfaces: [at('drywall'), at('tile'), at('drywall')] },
      { roomId: 'right', surfaces: [at('drywall'), at('carpet'), at('drywall')] },
      { roomId: 'nowhere', surfaces: [at('drywall'), at('concrete'), at('drywall')] },
    ],
    furnishing: 0,
  });
  tagRooms(state, setRooms(LEFT, RIGHT));
  expect(materialOf(state.table, 1, 0).material).toEqual(MATERIALS.tile);
  expect(materialOf(state.table, 1, 1).material).toEqual(MATERIALS.carpet);
  expect(materialOf(state.table, 1, -1).material).toEqual(MATERIALS.wood_floor);
  let floors = 0, exterior = 0;
  for (let t = 0; t < state.room.length; t++) {
    const [x, y] = centre(state, t);
    if (y === 0) {
      expect(surfaceAt(state, t).absorption).toEqual(x < 2 ? MATERIALS.tile.absorption : MATERIALS.carpet.absorption);
      floors++;
    }
    if (state.exterior[t]) {
      expect(surfaceAt(state, t).blockingDb).toEqual(MATERIALS.brick_veneer.blockingDb);
      exterior++;
    }
  }
  expect(floors).toBe(2);
  expect(exterior).toBe(8);
});
