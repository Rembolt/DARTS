import { it, expect } from 'vitest';
import { loadSim } from './load';
import { MATERIAL_IDS } from './materials';
import { firstHit } from './geometry';
import { simConfig } from '../config';

type P = [number, number, number];

/**
 * A unit box as an OBJ file in Matterport's Z-up coordinates. Each triangle is wound so it faces into the box
 * (`inward`) or out of it. Faces in order: bottom (z = 0), top, then the four sides.
 */
function boxObj(inward: boolean): string {
  const faces: { quad: P[]; out: P }[] = [
    { quad: [[0, 0, 0], [1, 0, 0], [1, 1, 0], [0, 1, 0]], out: [0, 0, -1] },
    { quad: [[0, 0, 1], [1, 0, 1], [1, 1, 1], [0, 1, 1]], out: [0, 0, 1] },
    { quad: [[0, 0, 0], [1, 0, 0], [1, 0, 1], [0, 0, 1]], out: [0, -1, 0] },
    { quad: [[0, 1, 0], [1, 1, 0], [1, 1, 1], [0, 1, 1]], out: [0, 1, 0] },
    { quad: [[0, 0, 0], [0, 1, 0], [0, 1, 1], [0, 0, 1]], out: [-1, 0, 0] },
    { quad: [[1, 0, 0], [1, 1, 0], [1, 1, 1], [1, 0, 1]], out: [1, 0, 0] },
  ];
  const vs: string[] = [];
  const fs: string[] = [];
  for (const { quad, out } of faces) {
    for (const [a, b, c] of [[quad[0], quad[1], quad[2]], [quad[0], quad[2], quad[3]]] as P[][]) {
      const u = [b[0] - a[0], b[1] - a[1], b[2] - a[2]];
      const v = [c[0] - a[0], c[1] - a[1], c[2] - a[2]];
      const n = [u[1] * v[2] - u[2] * v[1], u[2] * v[0] - u[0] * v[2], u[0] * v[1] - u[1] * v[0]];
      const facesOut = n[0] * out[0] + n[1] * out[1] + n[2] * out[2] > 0;
      const tri = facesOut === inward ? [a, c, b] : [a, b, c];
      const base = vs.length;
      for (const q of tri) vs.push(`v ${q[0]} ${q[1]} ${q[2]}`);
      fs.push(`f ${base + 1} ${base + 2} ${base + 3}`);
    }
  }
  return `${vs.join('\n')}\n${fs.join('\n')}\n`;
}

const bytes = (s: string) => new TextEncoder().encode(s).buffer as ArrayBuffer;

/** Material per box face, found by position (the ray index reorders triangles). Y-up: bottom y = 0, top y = 1. */
function materialsByFace(state: ReturnType<typeof loadSim>['state']) {
  const { positions: p, indices } = state.mesh;
  const out = { bottom: [] as number[], top: [] as number[], side: [] as number[] };
  for (let t = 0; t < indices.length / 3; t++) {
    const ys = [0, 1, 2].map(k => p[indices[3 * t + k] * 3 + 1]);
    const face = ys.every(y => y === 0) ? 'bottom' : ys.every(y => y === 1) ? 'top' : 'side';
    out[face].push(state.surfaceClass[t]);
  }
  return out;
}

it('loads a box: triangles, Y-up bounds, the 12 box edges and the timings', () => {
  const { ready } = loadSim(bytes(boxObj(true)), simConfig());
  expect(ready.type).toBe('ready');
  expect(ready.triangles).toBe(12);
  expect(ready.boundsMin).toEqual([0, 0, -1]);
  expect(ready.boundsMax).toEqual([1, 1, 0]);
  expect(ready.lines.length).toBe(12 * 6); // the face diagonals are flat
  expect(ready.loadMs).toBeGreaterThanOrEqual(0);
  expect(Object.keys(ready.timings)).toEqual(['parse', 'index', 'materials', 'lines']);
});

it('tags a box seen from inside: bottom floor, top ceiling, sides wall', () => {
  const { state } = loadSim(bytes(boxObj(true)), simConfig());
  expect(materialsByFace(state)).toEqual({ bottom: [1, 1], top: [2, 2], side: [0, 0, 0, 0, 0, 0, 0, 0] });
});

it('follows the winding: a box wound outwards has its bottom tagged ceiling', () => {
  const { state } = loadSim(bytes(boxObj(false)), simConfig());
  const faces = materialsByFace(state);
  expect(faces.bottom).toEqual([MATERIAL_IDS.ceiling, MATERIAL_IDS.ceiling]);
  expect(faces.top).toEqual([MATERIAL_IDS.floor, MATERIAL_IDS.floor]);
});

it('numbers materials like the ray index: a ray straight down from inside hits a floor triangle', () => {
  const { state } = loadSim(bytes(boxObj(true)), simConfig());
  const hit = firstHit(state.index, [0.3, 0.5, -0.6], [0, -1, 0]);
  expect(hit).not.toBeNull();
  expect(state.surfaceClass[hit!.triangle]).toBe(MATERIAL_IDS.floor);
  const up = firstHit(state.index, [0.3, 0.5, -0.6], [0, 1, 0]);
  expect(state.surfaceClass[up!.triangle]).toBe(MATERIAL_IDS.ceiling);
});

it('sends a copy of the triangles and their materials for the solid blueprint, keeping its own for tracing', () => {
  const { state, ready } = loadSim(bytes(boxObj(true)), simConfig());
  expect(Array.from(ready.mesh.positions)).toEqual(Array.from(state.mesh.positions));
  expect(Array.from(ready.mesh.indices)).toEqual(Array.from(state.mesh.indices));
  expect(Array.from(ready.mesh.materials)).toEqual(Array.from(state.surfaceClass));
  expect(ready.mesh.positions.buffer).not.toBe(state.mesh.positions.buffer);
  expect(ready.mesh.indices.buffer).not.toBe(state.mesh.indices.buffer);
  expect(ready.mesh.materials.buffer).not.toBe(state.surfaceClass.buffer);
});
