import { it, expect } from 'vitest';
import { MATERIALS } from '../../../server/src/shared/materials';
import { simConfig } from '../config';
import { crossSegment } from './crossings';
import { directSound } from './direct';
import { firstTracedHit } from './layers';
import { applySetMaterials, surfaceAt } from './library';
import { applySetOpenings, loadOpenings, panelMesh, panelSurface } from './openings';
import { MeshBuilder, ROOM_MAX, ROOM_MIN, splitRoom } from './testMeshes';
import type { Material, OpeningGeom, Vec3 } from './types';

const LISTENER: Vec3 = [1, 1, 1.5];
const SOURCE: Vec3 = [3, 1, 1.5];

/** A door 1 m wide and 2 m tall in a plane x = `x`, from z = 1 to 2. */
const door = (id: string, x = 2, kind: OpeningGeom['kind'] = 'door', thickness = 0.1): OpeningGeom => ({
  id, kind, roomId: 'left', thickness,
  corners: [[x, 0, 1], [x, 0, 2], [x, 2, 2], [x, 2, 1]],
});

/** The 4 × 3 × 3 m room split at x = 2 by a 0.1 m wall with a doorway gap (z 1–2, up to 2 m high). */
function doorwayRoom() {
  const b = new MeshBuilder().room(ROOM_MIN, ROOM_MAX);
  const a = 1.95, c = 2.05;
  for (const [x, facing] of [[a, -1], [c, 1]] as const) {
    const f: Vec3 = [facing, 0, 0];
    b.quad([x, 0, 0], [x, 3, 0], [x, 3, 1], [x, 0, 1], f); // beside the door
    b.quad([x, 0, 2], [x, 3, 2], [x, 3, 3], [x, 0, 3], f); // the other side
    b.quad([x, 2, 1], [x, 3, 1], [x, 3, 2], [x, 2, 2], f); // above it
  }
  return b.state();
}

it('builds 12 triangles per opening and at least 4 cm deep', () => {
  const { mesh, panelOfTriangle } = panelMesh([door('a', 2, 'door', 0.01), door('b', 1, 'window', 0.2)]);
  expect(mesh.indices.length / 3).toBe(24);
  expect(Array.from(panelOfTriangle)).toEqual([...Array(12).fill(0), ...Array(12).fill(1)]);
  const xs = (panel: number) => Array.from({ length: 8 }, (_, v) => mesh.positions[(panel * 8 + v) * 3]);
  expect(Math.max(...xs(0)) - Math.min(...xs(0))).toBeCloseTo(0.04, 6); // thin wall: 4 cm minimum
  expect(Math.max(...xs(1)) - Math.min(...xs(1))).toBeCloseTo(0.2, 6);
});

it('an open doorway lets the direct sound through; closed blocks it', () => {
  const state = doorwayRoom();
  const ready = loadOpenings(state, { type: 'loadOpenings', openings: [door('d1')] });
  expect(ready.openings).toEqual([{ id: 'd1', meshClosed: false }]);
  const open = directSound(state, LISTENER, SOURCE);
  expect(open.walls).toBe(0);

  applySetOpenings(state, { type: 'setOpenings', closed: ['d1', 'unknown'] });
  const closed = directSound(state, LISTENER, SOURCE);
  expect(closed.walls).toBe(1);
  expect(closed.direct[1]).toBeLessThan(open.direct[1]);
  expect(firstTracedHit(state, LISTENER, [1, 0, 0])!.distance).toBeCloseTo(0.95, 5); // the panel's near face
  expect(crossSegment(state, LISTENER, SOURCE, 0)).toBeNull(); // no clear leg through a closed door

  applySetOpenings(state, { type: 'setOpenings', closed: [] });
  expect(directSound(state, LISTENER, SOURCE)).toEqual(open);
});

it('never rebuilds the main index', () => {
  const state = doorwayRoom();
  const index = state.index, indices = state.mesh.indices.slice();
  loadOpenings(state, { type: 'loadOpenings', openings: [door('d1')] });
  applySetOpenings(state, { type: 'setOpenings', closed: ['d1'] });
  expect(state.index).toBe(index);
  expect(state.mesh.indices).toEqual(indices);
});

it('an opening the scan filled (glass, a closed leaf) is open or closed by its setting, not by the scan', () => {
  const state = splitRoom(); // a solid wall at x = 2: the scanned glass
  const ready = loadOpenings(state, { type: 'loadOpenings', openings: [door('scanned')] });
  expect(ready.openings).toEqual([{ id: 'scanned', meshClosed: true }]);
  // Open: the scanned surface inside the opening is cut out, so the sound comes through.
  expect(directSound(state, LISTENER, SOURCE).walls).toBe(0);
  expect(crossSegment(state, LISTENER, SOURCE, 0)).not.toBeNull();
  // Closed: one wall, the panel, never the panel and the scanned surface on top of each other.
  applySetOpenings(state, { type: 'setOpenings', closed: ['scanned'] });
  expect(directSound(state, LISTENER, SOURCE).walls).toBe(1);
  // Beside the opening the wall is still wall.
  expect(directSound(state, [1, 1, 0.5], [3, 1, 0.5]).walls).toBe(1);
});

it('returns outline lines', () => {
  const ready = loadOpenings(doorwayRoom(), { type: 'loadOpenings', openings: [door('a'), door('b', 1, 'window')] });
  expect(ready.lines).toBeInstanceOf(Float32Array);
  expect(ready.lines.length).toBe(2 * 4 * 6);
  expect(Array.from(ready.lines.slice(0, 6))).toEqual([2, 0, 1, 2, 0, 2]);
  expect(ready.ms).toBeGreaterThanOrEqual(0);
});

it('uses glass for windows and door for doors', () => {
  const state = doorwayRoom();
  loadOpenings(state, { type: 'loadOpenings', openings: [door('w', 1, 'window'), door('d')] });
  // Before any setMaterials: the MVP wall.
  expect(panelSurface(state, 0).blockingDb).toEqual(simConfig().materials.wall.blockingDb);
  const NAMES = Object.keys(MATERIALS) as (keyof typeof MATERIALS)[];
  const library = NAMES.map(n => MATERIALS[n] as unknown as Material);
  const at = (n: keyof typeof MATERIALS) => NAMES.indexOf(n);
  applySetMaterials(state, {
    type: 'setMaterials', library, surfaces: [at('drywall'), at('wood_floor'), at('drywall'), at('drywall')], furnishing: 0.15,
    glassIndex: at('glass'), doorIndex: at('door'),
  });
  expect(panelSurface(state, 0).blockingDb).toEqual(MATERIALS.glass.blockingDb);
  expect(panelSurface(state, 0).absorption).toEqual(MATERIALS.glass.absorption);   // upright: no furniture absorption
  expect(panelSurface(state, 1).blockingDb).toEqual(MATERIALS.door.blockingDb);
  // A hit on a closed panel reads the panel's material.
  applySetOpenings(state, { type: 'setOpenings', closed: ['w'] });
  const hit = firstTracedHit(state, [0.5, 1, 1.5], [1, 0, 0])!;
  expect(hit.triangle).toBeGreaterThanOrEqual(state.mesh.indices.length / 3);
  expect(surfaceAt(state, hit.triangle).blockingDb).toEqual(MATERIALS.glass.blockingDb);
});

it('slides an opening the floor plan has a little off onto the scan’s real hole', () => {
  const state = doorwayRoom(); // the real hole: z 1–2
  const off: OpeningGeom = { id: 'off', kind: 'door', roomId: 'left', thickness: 0.1, corners: [[2, 0, 1.85], [2, 0, 2.75], [2, 2, 2.75], [2, 2, 1.85]] };
  const ready = loadOpenings(state, { type: 'loadOpenings', openings: [off] });
  const moved = ready.moved?.find(m => m.id === 'off');
  expect(moved).toBeDefined();
  expect(moved!.corners[0][2]).toBeLessThan(1.85 - 0.5);
  expect(ready.openings).toEqual([{ id: 'off', meshClosed: false }]);
  // Closing the moved door closes the real hole.
  applySetOpenings(state, { type: 'setOpenings', closed: ['off'] });
  expect(directSound(state, LISTENER, SOURCE).walls).toBe(1);
});

it('never slides glass with no hole near it, nor onto another opening', () => {
  const solid = splitRoom();
  expect(loadOpenings(solid, { type: 'loadOpenings', openings: [door('glass')] }).moved).toBeUndefined();
  const state = doorwayRoom();
  const off: OpeningGeom = { id: 'off', kind: 'window', roomId: 'left', thickness: 0.1, corners: [[2, 0, 1.85], [2, 0, 2.75], [2, 2, 2.75], [2, 2, 1.85]] };
  expect(loadOpenings(state, { type: 'loadOpenings', openings: [door('real'), off] }).moved).toBeUndefined();
});

it('cuts gaps (archways, half walls) out of the scan, always open', () => {
  const state = splitRoom(); // something scanned across the archway at x = 2
  loadOpenings(state, { type: 'loadOpenings', openings: [door('elsewhere', 1)], gaps: [{ id: 'arch', thickness: 0.1, corners: [[2, 0, 1], [2, 0, 2], [2, 2, 2], [2, 2, 1]] }] });
  expect(directSound(state, LISTENER, SOURCE).walls).toBe(0);
});
