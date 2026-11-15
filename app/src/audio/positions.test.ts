import { describe, it, expect, afterEach } from 'vitest';
import { defaultSourcePositions } from './positions';
import { SOURCES } from '../config';

const original = { pos: SOURCES.indoor.position, angle: SOURCES.outdoor.compassAngleDeg };
afterEach(() => {
  SOURCES.indoor.position = original.pos;
  SOURCES.outdoor.compassAngleDeg = original.angle;
});

const close = (a: number[], b: number[]) => a.forEach((v, i) => expect(v).toBeCloseTo(b[i], 9));

describe('defaultSourcePositions (mvp-design.md 4.3)', () => {
  it('puts the song 0.4 m below the start position', () => {
    SOURCES.indoor.position = null;
    close(defaultSourcePositions([1, 2, 3]).indoor, [1, 1.6, 3]);
  });

  it('uses the configured indoor point when set', () => {
    SOURCES.indoor.position = [5, 6, 7];
    expect(defaultSourcePositions([1, 2, 3]).indoor).toEqual([5, 6, 7]);
  });

  it('puts the highway 25 m away along the compass angle, 1.5 m up', () => {
    SOURCES.outdoor.compassAngleDeg = 0;
    close(defaultSourcePositions([1, 2, 3]).outdoor, [1, 3.5, -22]);
    SOURCES.outdoor.compassAngleDeg = 90;
    close(defaultSourcePositions([1, 2, 3]).outdoor, [26, 3.5, 3]);
    SOURCES.outdoor.compassAngleDeg = 180;
    close(defaultSourcePositions([0, 0, 0]).outdoor, [0, 1.5, 25]);
  });
});
