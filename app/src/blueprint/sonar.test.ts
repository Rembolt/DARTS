import { describe, expect, it } from 'vitest';
import type { Route } from './paths';
import { arrival, bounceDistances, flashPhase, groupEchoes, sectionsOf, SONAR, widthFor } from './sonar';

const route = (pts: number[], over: Partial<Route> = {}): Route => ({ points: Float32Array.from(pts), length: 1, source: 0, strength: 1, ...over });

describe('sectionsOf', () => {
  it('is one piece when there is nothing in the way', () => {
    expect(sectionsOf(10, [], 0)).toEqual([{ from: 0, to: 10, lossDb: 0 }]);
  });
  it('falls back to one piece with the known loss while the walls are not known yet', () => {
    expect(sectionsOf(10, undefined, 26)).toEqual([{ from: 0, to: 10, lossDb: 26 }]);
  });
  it('cuts at each wall, turning the distances around (they are measured from the listener) and adding up the loss', () => {
    // A 10 m line. Walls 2 m and 7 m from the listener are 8 m and 3 m from the source.
    const s = sectionsOf(10, [{ distance: 2, lossDb: 20 }, { distance: 7, lossDb: 15 }], 0);
    expect(s).toEqual([
      { from: 0, to: 3, lossDb: 0 },
      { from: 3, to: 8, lossDb: 15 },
      { from: 8, to: 10, lossDb: 35 },
    ]);
  });
  it('keeps every piece inside the line even if a wall is reported past its end', () => {
    const s = sectionsOf(5, [{ distance: 9, lossDb: 10 }], 0);
    expect(s.every(p => p.from >= 0 && p.to <= 5)).toBe(true);
  });
});

describe('widthFor', () => {
  it('is thickest for loud sound and thinner the more was lost', () => {
    expect(widthFor(0)).toBe(SONAR.maxWidth);
    expect(widthFor(30)).toBeLessThan(widthFor(10));
    expect(widthFor(60)).toBe(SONAR.minWidth);
    expect(widthFor(200)).toBe(SONAR.minWidth);
  });
});

describe('echoes', () => {
  const echo = (angleDeg: number, strength: number, source = 0): Route => {
    const a = (angleDeg * Math.PI) / 180;
    return route([Math.cos(a) * 4, 0, Math.sin(a) * 4, 0, 0, 0], { strength, source });
  };
  it('points the arrival direction from the listener back along the route', () => {
    const [x, , z] = arrival(echo(0, 1));
    expect(x).toBeCloseTo(1);
    expect(z).toBeCloseTo(0);
  });
  it('merges echoes from nearly the same direction into the strongest one', () => {
    const beams = groupEchoes([echo(0, 0.4), echo(10, 0.9), echo(20, 0.2)]);
    expect(beams).toHaveLength(1);
    expect(beams[0].count).toBe(3);
    expect(beams[0].strength).toBe(0.9);
  });
  it('shows at most a few per source, never the direct line, and loses none of the count', () => {
    const many = [0, 90, 180, 270, 45, 135].map((a, i) => echo(a, 1 - i * 0.1));
    const direct = route([20, 0, 0, 0, 0, 0], { direct: true });
    const beams = groupEchoes([direct, ...many]);
    expect(beams).toHaveLength(SONAR.echoBeams);
    expect(beams.reduce((n, b) => n + b.count, 0)).toBe(6);
  });
  it('finds the bounce distances along a route, not its ends', () => {
    expect(bounceDistances(route([0, 0, 0, 3, 0, 0, 3, 4, 0]))).toEqual([3]);
  });
  it('flashes a bounce once the wave has reached it, every period', () => {
    const at = 3;
    expect(flashPhase(at, at / SONAR.speed - 0.01, 4)).toBeNull();
    expect(flashPhase(at, at / SONAR.speed + SONAR.pingLife / 2, 4)).toBeCloseTo(0.5);
    expect(flashPhase(at, 4 + at / SONAR.speed + SONAR.pingLife / 2, 4)).toBeCloseTo(0.5);
  });
});
