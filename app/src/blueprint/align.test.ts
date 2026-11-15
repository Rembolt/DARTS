import { it, expect } from 'vitest';
import { PerspectiveCamera } from 'three';
import { alignmentStats, sampleEndpoints, toPixels } from './align';

it('samples end points evenly and deterministically', () => {
  const lines = new Float32Array(Array.from({ length: 10 * 6 }, (_, i) => i));
  const pts = sampleEndpoints(lines, 5);
  expect(pts).toHaveLength(5);
  expect(sampleEndpoints(lines, 5)).toEqual(pts);
  expect(pts[0]).toEqual([0, 1, 2]);
});

it('puts a point straight ahead at the centre, origin top-left', () => {
  const cam = new PerspectiveCamera(60, 2, 0.1, 100);
  cam.updateMatrixWorld();
  expect(toPixels(cam, [0, 0, -5], { w: 800, h: 400 })).toEqual({ x: 400, y: 200, inFront: true });
  expect(toPixels(cam, [0, 0, 5], { w: 800, h: 400 }).inFront).toBe(false);
  expect(toPixels(cam, [0, 1, -5], { w: 800, h: 400 }).y).toBeLessThan(200);
});

it('reports the worst and the median error', () => {
  expect(alignmentStats([0.5, 3, 1])).toEqual({ samples: 3, maxPx: 3, medianPx: 1 });
  expect(alignmentStats([])).toEqual({ samples: 0, maxPx: 0, medianPx: 0 });
});
