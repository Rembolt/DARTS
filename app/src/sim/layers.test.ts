import { it, expect } from 'vitest';
import { simConfig } from '../config';
import { crossSegment } from './crossings';
import { firstHit } from './geometry';
import { applySetLayers, firstTracedHit } from './layers';
import { loadSim } from './load';
import { parseObj } from './obj';
import { MeshBuilder, ROOM_MAX, ROOM_MIN } from './testMeshes';
import type { Vec3 } from './types';

const bytes = (s: string) => new TextEncoder().encode(s).buffer as ArrayBuffer;

/**
 * Two 1 m boxes as OBJ text (Z-up, as Matterport writes it): one at x = 0 in the house layer, one at x = `far` in
 * group `type002`. Their faces alternate in the file (with `g` lines switching back and forth), so the ray index
 * must reorder the triangles to separate the boxes.
 */
function twoBoxesObj(far = 100): string {
  const vs: string[] = [];
  const corner = (x0: number) => {
    const base = vs.length;
    for (const z of [0, 1]) for (const y of [0, 1]) for (const x of [0, 1]) vs.push(`v ${x0 + x} ${y} ${z}`);
    return (i: number) => base + i + 1; // 1-based
  };
  const a = corner(0), b = corner(far);
  // Corner i = x + 2y + 4z. Six faces as quads.
  const quads = [[0, 1, 3, 2], [4, 5, 7, 6], [0, 1, 5, 4], [2, 3, 7, 6], [0, 2, 6, 4], [1, 3, 7, 5]];
  const lines: string[] = [];
  for (const q of quads) {
    lines.push('g', `f ${q.map(a).join(' ')}`);
    lines.push('g type002', `f ${q.map(b).join(' ')}`);
  }
  return `${vs.join('\n')}\n${lines.join('\n')}\n`;
}

it('keeps layer numbers right after the index reorders triangles', () => {
  const text = twoBoxesObj();
  const parsed = parseObj(bytes(text));
  const { state } = loadSim(bytes(text), simConfig());
  // The index did reorder the triangles (otherwise this test proves nothing).
  expect(Array.from(state.mesh.indices)).not.toEqual(Array.from(parsed.indices));
  const { positions: p, indices } = state.mesh;
  for (let t = 0; t < indices.length / 3; t++) {
    const x = p[indices[3 * t] * 3];
    expect(state.layer[t]).toBe(x > 50 ? 1 : 0);
  }
});

it('counts triangles per layer in ready', () => {
  const { state, ready } = loadSim(bytes(twoBoxesObj()), simConfig());
  expect(ready.layers).toEqual([{ id: 'house', triangles: 12 }, { id: 'type002', triangles: 12 }]);
  expect(Array.from(ready.mesh.layers)).toEqual(Array.from(state.layer));
  expect(ready.mesh.layers.buffer).not.toBe(state.layer.buffer);
});

it('tags each blueprint line with a layer', () => {
  const { ready } = loadSim(bytes(twoBoxesObj()), simConfig());
  expect(ready.lineLayers.length).toBe(ready.lines.length / 6);
  expect(ready.lineLayers.length).toBe(24); // 12 box edges each
  for (let i = 0; i < ready.lineLayers.length; i++) {
    expect(ready.lineLayers[i]).toBe(ready.lines[6 * i] > 50 ? 1 : 0);
  }
});

/** The test room with a dividing wall at x = 2 in layer `type002`. */
function roomWithLayeredWall() {
  const b = new MeshBuilder().room(ROOM_MIN, ROOM_MAX);
  b.use('type002').wallX(2, 0.1, ROOM_MIN, ROOM_MAX);
  return b.state();
}

it('a ray passes through an untraced layer', () => {
  const state = roomWithLayeredWall();
  const origin: Vec3 = [1, 1.5, 1.5];
  expect(firstTracedHit(state, origin, [1, 0, 0])!.distance).toBeCloseTo(0.95, 5);
  expect(crossSegment(state, origin, [3, 1.5, 1.5])!.walls).toBe(1);

  applySetLayers(state, { type: 'setLayers', traced: { type002: false, unknown: false } });
  expect(state.layerTraced).toEqual([true, false]);
  const hit = firstTracedHit(state, origin, [1, 0, 0])!;
  expect(hit.distance).toBeCloseTo(3, 5);
  expect(state.layer[hit.triangle]).toBe(0);
  expect(firstTracedHit(state, origin, [1, 0, 0], 2.5)).toBeNull();
  expect(crossSegment(state, origin, [3, 1.5, 1.5])!.walls).toBe(0);
  expect(crossSegment(state, origin, [3, 1.5, 1.5], 0)).not.toBeNull(); // a clear leg now

  applySetLayers(state, { type: 'setLayers', traced: { type002: true } });
  expect(firstTracedHit(state, origin, [1, 0, 0])!.distance).toBeCloseTo(0.95, 5);
});

it('leaves the hit unchanged when all layers are traced', () => {
  const state = roomWithLayeredWall();
  const origin: Vec3 = [1, 1.5, 1.5];
  for (const dir of [[1, 0, 0], [-1, 0.2, 0.1], [0, 1, 0], [0.3, -1, 0.5]] as Vec3[]) {
    expect(firstTracedHit(state, origin, dir)).toEqual(firstHit(state.index, origin, dir));
    expect(firstTracedHit(state, origin, dir, 0.5)).toEqual(firstHit(state.index, origin, dir, 0.5));
  }
});
