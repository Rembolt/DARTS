import { describe, expect, it } from 'vitest';
import { echoRose, rosePath, toDb, viewBearing, worldBearing } from './compass';

describe('compass', () => {
  it('measures bearings clockwise from straight ahead', () => {
    expect(worldBearing(0, -1)).toBeCloseTo(0);
    expect(worldBearing(1, 0)).toBeCloseTo(Math.PI / 2); // +X is to the right at yaw 0
  });
  it('turns with the view: after turning left 90°, a source ahead of the start is on the right', () => {
    // Positive yaw turns the camera left (rotation about +Y).
    expect(viewBearing(worldBearing(0, -1), 90)).toBeCloseTo(Math.PI / 2);
  });
  it('converts strength to dB with a floor', () => {
    expect(toDb(1)).toBe(0);
    expect(toDb(0.1)).toBeCloseTo(-10);
    expect(toDb(0)).toBe(-60);
  });
  it('points the echo rose at the loud direction', () => {
    const slots = [{ energy: [1, 1, 1] as [number, number, number], delay: 0.01 }, { energy: [0.1, 0.1, 0.1] as [number, number, number], delay: 0.02 }];
    const rose = echoRose(slots, [[1, 0, 0], [-1, 0, 0]], 4); // samples at 0, 90, 180, 270 degrees
    expect(rose[1]).toBe(1); // 90°: +X
    expect(rose[3]).toBeCloseTo(0.1);
  });
  it('draws a closed path', () => {
    expect(rosePath([10, 10, 10, 10], 50, 50)).toMatch(/^M50\.0,40\.0.*Z$/);
  });
});
