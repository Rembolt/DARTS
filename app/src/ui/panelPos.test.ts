import { describe, expect, it } from 'vitest';
import { clampPosition } from './panelPos';

const panel = { w: 200, h: 300 };
const stage = { w: 1000, h: 700 };

describe('clampPosition', () => {
  it('leaves a position inside the stage alone', () => expect(clampPosition(100, 120, panel, stage)).toEqual({ x: 100, y: 120 }));
  it('never lets the header leave the top or the bottom', () => {
    expect(clampPosition(100, -50, panel, stage).y).toBe(0);
    expect(clampPosition(100, 900, panel, stage).y).toBe(664);
  });
  it('keeps a strip of the panel on screen at either side', () => {
    expect(clampPosition(-900, 10, panel, stage).x).toBe(56 - 200);
    expect(clampPosition(5000, 10, panel, stage).x).toBe(944);
  });
});
