import { describe, it, expect } from 'vitest';
import { MATERIALS, ROOM_TABLE, roomType } from '../src/shared/materials.js';

describe('material library', () => {
  it('has the 15 library rows with the design values', () => {
    expect(Object.keys(MATERIALS)).toHaveLength(15);
    expect(MATERIALS.carpet).toEqual({ absorption: [0.08, 0.35, 0.60], scattering: 0.30, blockingDb: [35, 45, 50] });
    expect(MATERIALS.glass.blockingDb).toEqual([18, 25, 28]);
  });
  it('names room types', () => {
    expect(roomType('Primary Bedroom')).toBe('bedroom');
    expect(roomType('Family Room')).toBe('living');
    expect(roomType('Entry')).toBe('hallway');
    expect(roomType('Void')).toBe('other');
  });
  it('has mixes that sum to 1 and name library materials', () => {
    for (const [type, row] of Object.entries(ROOM_TABLE)) {
      for (const surface of ['floor', 'wall', 'ceiling'] as const) {
        const mix = row[surface];
        expect(Math.abs(mix.reduce((s, p) => s + p.weight, 0) - 1), `${type} ${surface}`).toBeLessThan(1e-9);
        for (const part of mix) expect(Object.keys(MATERIALS), `${type} ${surface}`).toContain(part.material);
      }
    }
  });
});
