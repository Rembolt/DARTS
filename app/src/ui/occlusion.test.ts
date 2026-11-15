import { describe, expect, it } from 'vitest';
import { blocked, END_TOLERANCE } from './occlusion';

// A single wall: the plane z = -2, infinite. `cast` returns the distance to it along the ray, if within `far`.
const wallAt = (z: number) => (o: [number, number, number], d: [number, number, number], far: number) => {
  if (d[2] === 0) return null;
  const t = (z - o[2]) / d[2];
  return t > 0 && t <= far ? t : null;
};

describe('blocked', () => {
  it('sees a point in front of the wall', () => {
    expect(blocked([0, 0, 0], [0, 0, -1.5], wallAt(-2))).toBe(false);
  });
  it('sees a point on the wall itself (a window)', () => {
    expect(blocked([0, 0, 0], [0, 0, -2], wallAt(-2))).toBe(false);
  });
  it('sees a point just inside the tolerance beyond the wall', () => {
    expect(blocked([0, 0, 0], [0, 0, -2 - END_TOLERANCE / 2], wallAt(-2))).toBe(false);
  });
  it('hides a point well behind the wall', () => {
    expect(blocked([0, 0, 0], [0, 0, -4], wallAt(-2))).toBe(true);
  });
});
