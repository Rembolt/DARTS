import { it, expect } from 'vitest';
import { extractLines } from './edges';

const mesh = (positions: number[], indices: number[]) => ({
  positions: new Float32Array(positions),
  indices: new Uint32Array(indices),
});
const lineCount = (lines: Float32Array) => lines.length / 6;

const SQUARE = [0, 0, 0, 1, 0, 0, 1, 0, 1, 0, 0, 1];

it('drops the flat edge shared by two coplanar triangles', () => {
  expect(lineCount(extractLines(mesh(SQUARE, [0, 1, 2, 0, 2, 3]), 25))).toBe(4);
});

it('matches edges on welded positions, so duplicated seam vertices draw no line', () => {
  const split = mesh([0, 0, 0, 1, 0, 0, 1, 0, 1, 0, 0, 0, 1, 0, 1, 0, 0, 1], [0, 1, 2, 3, 4, 5]);
  expect(lineCount(extractLines(split, 25))).toBe(4);
});

it('treats a neighbour wound the other way as flat, not as a fold', () => {
  expect(lineCount(extractLines(mesh(SQUARE, [0, 1, 2, 0, 3, 2]), 25))).toBe(4);
});

it('keeps the edge where a floor meets a wall', () => {
  const corner = mesh([0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 1, 0], [0, 1, 2, 1, 0, 3]);
  expect(lineCount(extractLines(corner, 25))).toBe(5);
});

it('keeps a shared edge only when the fold is over the angle', () => {
  const fold = (deg: number) => {
    const r = (deg * Math.PI) / 180;
    // Triangle A lies flat towards +z; triangle B continues towards −z, tilted up by `deg`, with matching winding.
    return mesh([0, 0, 0, 1, 0, 0, 0.5, 0, 1, 0.5, Math.sin(r), -Math.cos(r)], [0, 1, 2, 1, 0, 3]);
  };
  expect(lineCount(extractLines(fold(20), 25))).toBe(4);
  expect(lineCount(extractLines(fold(30), 25))).toBe(5);
});

it('returns segments as pairs of points', () => {
  const lines = extractLines(mesh(SQUARE, [0, 1, 2, 0, 2, 3]), 25);
  const points = new Set<string>();
  for (let i = 0; i < lines.length; i += 3) points.add(`${lines[i]},${lines[i + 1]},${lines[i + 2]}`);
  expect(points).toEqual(new Set(['0,0,0', '1,0,0', '1,0,1', '0,0,1']));
});

it('welds seams the same way far from the origin (beyond ±65 m)', () => {
  const far = [0, 0, 0, 1, 0, 0, 1, 0, 1, 0, 0, 0, 1, 0, 1, 0, 0, 1].map((v, i) => (i % 3 === 0 ? v + 100 : v));
  expect(lineCount(extractLines(mesh(far, [0, 1, 2, 3, 4, 5]), 25))).toBe(4);
});

it('treats an edge shared with a zero-area triangle as flat, not as a fold', () => {
  // A square split along its diagonal, with a zero-area triangle lying on the diagonal between the two halves.
  const p = [0, 0, 0, 1, 0, 0, 1, 0, 1, 0, 0, 1, 0.5, 0, 0.5];
  const withSliver = mesh(p, [0, 1, 2, 2, 0, 4, 0, 4, 3, 4, 2, 3]);
  expect(lineCount(extractLines(withSliver, 25))).toBe(4);
});
