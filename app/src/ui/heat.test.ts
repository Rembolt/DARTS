import { describe, expect, it } from 'vitest';
import { floorGrid, heatColor, HEAT } from './heat';

// One 4 × 4 m floor square (two triangles) 1.5 m below the listener, and a ceiling square that must be ignored.
const mesh = {
  positions: Float32Array.from([0, 0, 0, 4, 0, 0, 4, 0, 4, 0, 0, 4, /* ceiling */ 0, 3, 0, 4, 3, 0, 4, 3, 4]),
  indices: Uint32Array.from([0, 1, 2, 0, 2, 3, 4, 5, 6]),
  materials: Uint8Array.from([1, 1, 2]),
};

describe('floorGrid', () => {
  it('fills the cells under the floor at this storey only', () => {
    const g = floorGrid(mesh, [2, 1.5, 2]);
    const cellArea = HEAT.step * HEAT.step;
    expect(g.cells.length * cellArea).toBeCloseTo(16, 0);
    expect(g.points[1]).toBe(1.5); // measured at the listener's height
  });
  it('finds nothing when the floor is on another storey', () => {
    expect(floorGrid(mesh, [2, 6, 2]).cells.length).toBe(0);
  });
});

describe('heatColor', () => {
  it('runs from quiet navy to loud coral', () => {
    expect(heatColor(-60)).toEqual([233, 226, 210]);
    expect(heatColor(0)).toEqual([196, 52, 30]);
    expect(heatColor(-18)).toEqual([226, 150, 60]);
  });
});
