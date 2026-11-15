// Measuring alignment between the blueprint and the tour (mvp-design.md 10, build step 4: "This is the alignment check").
import { Vector3, type Camera } from 'three';
import type { Vec3 } from '../sim/types';

/** `count` line end points spread evenly over the segments (6 floats per segment). Deterministic. */
export function sampleEndpoints(lines: Float32Array, count: number): Vec3[] {
  const endpoints = Math.floor(lines.length / 3);
  if (endpoints === 0 || count <= 0) return [];
  const n = Math.min(count, endpoints);
  const stride = endpoints / n;
  const out: Vec3[] = [];
  for (let k = 0; k < n; k++) {
    const i = Math.floor(k * stride) * 3;
    out.push([lines[i], lines[i + 1], lines[i + 2]]);
  }
  return out;
}

const v = new Vector3();

/** Where `point` lands on a `size` box seen through `camera`, in CSS pixels from the top left. */
export function toPixels(camera: Camera, point: Vec3, size: { w: number; h: number }): { x: number; y: number; inFront: boolean } {
  v.set(point[0], point[1], point[2]).project(camera);
  return { x: ((v.x + 1) / 2) * size.w, y: ((1 - v.y) / 2) * size.h, inFront: v.z >= -1 && v.z <= 1 };
}

/** Worst and median pixel error. */
export function alignmentStats(errors: number[]): { samples: number; maxPx: number; medianPx: number } {
  if (errors.length === 0) return { samples: 0, maxPx: 0, medianPx: 0 };
  const sorted = [...errors].sort((a, b) => a - b);
  return { samples: sorted.length, maxPx: sorted[sorted.length - 1], medianPx: sorted[Math.floor(sorted.length / 2)] };
}
