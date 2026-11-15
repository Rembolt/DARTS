import { describe, expect, it } from 'vitest';
import type { Route } from './paths';
import { bounceDistances, cyclePeriod, flashPhase, SONAR } from './sonar';

const route = (pts: number[], length: number): Route => ({ points: Float32Array.from(pts), length, source: 0, strength: 1 });

describe('sonar timing', () => {
  it('finds the bounce distances along a route, not its ends', () => {
    expect(bounceDistances(route([0, 0, 0, 3, 0, 0, 3, 4, 0], 7))).toEqual([3]);
    expect(bounceDistances(route([0, 0, 0, 5, 0, 0], 5))).toEqual([]);
  });
  it('lasts until the longest route arrives, within bounds', () => {
    expect(cyclePeriod([route([], 12)])).toBeCloseTo(12 / SONAR.speed + SONAR.rest);
    expect(cyclePeriod([route([], 1)])).toBe(SONAR.minPeriod);
    expect(cyclePeriod([route([], 500)])).toBe(SONAR.maxPeriod);
  });
  it('flashes a bounce only once the wave has reached it', () => {
    const at = 3; // metres from the source
    expect(flashPhase(at, at / SONAR.speed - 0.01)).toBeNull();
    expect(flashPhase(at, at / SONAR.speed + SONAR.pingLife / 2)).toBeCloseTo(0.5);
    expect(flashPhase(at, at / SONAR.speed + SONAR.pingLife + 0.01)).toBeNull();
  });
});
