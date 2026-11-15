// Rooms per triangle (v2-design.md 4.4, "Which triangles get which value"): each triangle's room from the PI room
// polygons, and which walls face outside. Runs once per `setRooms`; never touches the ray index.
import { applySetMaterials, resolveSurfaces } from './library';
import type { SimState } from './load';
import type { FromWorker, RoomGeom, ToWorker, Vec3 } from './types';

export type SetRooms = Extract<ToWorker, { type: 'setRooms' }>;
export type RoomsReady = Extract<FromWorker, { type: 'roomsReady' }>;

/** A point belongs to a room from this far below its floor to this far above its ceiling, metres. */
export const ROOM_SLACK = 0.3;
/** The test point sits this far in front of a triangle, along its facing. */
export const FRONT_OFFSET = 0.2;
/** A wall faces outside when the point this far behind it is in no room (past the wall's thickness). */
export const BEHIND_OFFSET = 0.6;
/** Used when a room's height is missing (the page should fill it, v2-design 4.4). */
export const FALLBACK_HEIGHT = 2.7;

/** Even-odd rule on the x/z polygon. Points exactly on an edge may go either way. */
export function pointInPolygon(x: number, z: number, polygon: [number, number][]): boolean {
  let inside = false;
  for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
    const [xi, zi] = polygon[i], [xj, zj] = polygon[j];
    if (zi > z !== zj > z && x < ((xj - xi) * (z - zi)) / (zj - zi) + xi) inside = !inside;
  }
  return inside;
}

const heightOf = (r: RoomGeom) => (Number.isFinite(r.height) && r.height > 0 ? r.height : FALLBACK_HEIGHT);

/**
 * The room containing `p`, or −1: inside the polygon (x/z) and `floorY − 0.3 ≤ y ≤ floorY + height + 0.3`.
 * When several match, the one with the highest floor at or below `y` (else the lowest floor).
 */
export function roomAt(rooms: RoomGeom[], p: Vec3): number {
  return findRoom(rooms, boxes(rooms), p[0], p[1], p[2]);
}

/** `roomAt` with the rooms' x/z bounding boxes computed once (`boxes`), so most polygon tests are skipped. */
function findRoom(rooms: RoomGeom[], box: Float64Array, x: number, y: number, z: number): number {
  let best = -1;
  for (let i = 0; i < rooms.length; i++) {
    if (x < box[4 * i] || z < box[4 * i + 1] || x > box[4 * i + 2] || z > box[4 * i + 3]) continue;
    const r = rooms[i];
    if (y < r.floorY - ROOM_SLACK || y > r.floorY + heightOf(r) + ROOM_SLACK) continue;
    if (!pointInPolygon(x, z, r.polygon)) continue;
    if (best < 0 || better(r.floorY, rooms[best].floorY, y)) best = i;
  }
  return best;
}

/** Is a room with floor `a` a better match than one with floor `b` for a point at height `y`? */
function better(a: number, b: number, y: number): boolean {
  const aBelow = a <= y, bBelow = b <= y;
  if (aBelow !== bBelow) return aBelow;
  return aBelow ? a > b : a < b;
}

/** Bounding boxes in x/z (x0, z0, x1, z1 per room). */
function boxes(rooms: RoomGeom[]): Float64Array {
  const out = new Float64Array(rooms.length * 4);
  rooms.forEach((r, i) => {
    let x0 = Infinity, z0 = Infinity, x1 = -Infinity, z1 = -Infinity;
    for (const [x, z] of r.polygon) {
      if (x < x0) x0 = x;
      if (x > x1) x1 = x;
      if (z < z0) z0 = z;
      if (z > z1) z1 = z;
    }
    out.set([x0, z0, x1, z1], i * 4);
  });
  return out;
}

function check(rooms: RoomGeom[]): void {
  for (const r of rooms) {
    if (typeof r.id !== 'string' || !Array.isArray(r.polygon) || r.polygon.length < 3) {
      throw new Error(`setRooms: room ${r.id} needs an id and a polygon of at least 3 points`);
    }
    if (!Number.isFinite(r.floorY) || r.polygon.some(q => !Number.isFinite(q[0]) || !Number.isFinite(q[1]))) {
      throw new Error(`setRooms: room ${r.id} has a coordinate that is not a number`);
    }
  }
  if (rooms.length > 32_000) throw new Error(`setRooms: ${rooms.length} rooms is too many`);
}

/**
 * Tag every triangle with its room and, for walls, whether it faces outside. Then the materials are resolved again:
 * the last `setMaterials` is re-applied so its room ids map to the new rooms.
 */
export function tagRooms(state: SimState, msg: SetRooms): RoomsReady {
  const start = performance.now();
  const { rooms } = msg;
  check(rooms);
  const box = boxes(rooms);
  const find = (x: number, y: number, z: number) => findRoom(rooms, box, x, y, z);

  const { positions: p, indices } = state.mesh;
  const { normals, surfaceClass, room, exterior } = state;
  const counts = new Array<number>(rooms.length).fill(0);
  let untagged = 0, exteriorWalls = 0;
  for (let t = 0; t < room.length; t++) {
    const a = indices[3 * t] * 3, b = indices[3 * t + 1] * 3, c = indices[3 * t + 2] * 3;
    const cx = (p[a] + p[b] + p[c]) / 3, cy = (p[a + 1] + p[b + 1] + p[c + 1]) / 3, cz = (p[a + 2] + p[b + 2] + p[c + 2]) / 3;
    const nx = normals[3 * t], ny = normals[3 * t + 1], nz = normals[3 * t + 2];
    const r = find(cx + nx * FRONT_OFFSET, cy + ny * FRONT_OFFSET, cz + nz * FRONT_OFFSET);
    room[t] = r;
    exterior[t] = 0;
    if (r < 0) {
      untagged++;
      continue;
    }
    counts[r]++;
    if (surfaceClass[t] === 0 && (nx !== 0 || ny !== 0 || nz !== 0)) {
      if (find(cx - nx * BEHIND_OFFSET, cy - ny * BEHIND_OFFSET, cz - nz * BEHIND_OFFSET) < 0) {
        exterior[t] = 1;
        exteriorWalls++;
      }
    }
  }

  state.roomIds = rooms.map(r => r.id);
  if (state.lastSetMaterials) applySetMaterials(state, state.lastSetMaterials);
  else resolveSurfaces(state);

  return {
    type: 'roomsReady',
    rooms: rooms.map((r, i) => ({ id: r.id, triangles: counts[i] })),
    untagged,
    exteriorWalls,
    ms: performance.now() - start,
  };
}
