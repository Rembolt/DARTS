import { describe, it, expect } from 'vitest';
import { bearingOffset, facadeToLevelDb, surroundingSources, surroundingsNotice } from './surroundings';
import type { AreaSummary } from '../../../server/src/shared/contract';
import type { Vec3 } from '../sim/types';

const start: Vec3 = [10, 2, -5];
const A: AreaSummary = {
  areaClass: 'residential', source: 'vexcel', counts: {}, located: [], roadBearingDeg: null, facadeDb: 50, imageryDate: null,
};

describe('surroundings sources', () => {
  it('points north along −Z and east along +X', () => {
    const n = bearingOffset(0, 10);
    expect(n[0]).toBeCloseTo(0, 6); expect(n[1]).toBe(0); expect(n[2]).toBeCloseTo(-10, 6);
    const e = bearingOffset(90, 10);
    expect(e[0]).toBeCloseTo(10, 5); expect(e[2]).toBeCloseTo(0, 5);
  });

  it('maps facade levels to gains', () => {
    expect(facadeToLevelDb(72)).toBe(-12);
    expect(facadeToLevelDb(30)).toBe(-40);
    expect(facadeToLevelDb(90)).toBe(-6);
  });

  it('plays one residential loop for the demo house', () => {
    const specs = surroundingSources(A, start);
    expect(specs).toHaveLength(1);
    expect(specs[0]).toMatchObject({ id: 'area', sound: 'residential_ambience', kind: 'ambient', levelDb: -34, enabled: true });
    expect(specs[0].position[0]).toBeCloseTo(10, 6);
    expect(specs[0].position[1]).toBeCloseTo(3.5, 6);
    expect(specs[0].position[2]).toBeCloseTo(-30, 6); // 25 m north of the start
  });

  it('puts the loop toward the road', () => {
    const [loop] = surroundingSources({ ...A, roadBearingDeg: 90 }, start);
    expect(loop.position[0]).toBeCloseTo(35, 5);
  });

  it('adds a highway toward its bearing, capped at 60 m', () => {
    const specs = surroundingSources({ ...A, located: [{ kind: 'highway', distanceM: 200, bearingDeg: 90, levelDb: 67 }] }, start);
    const h = specs.find(s => s.id === 'highway')!;
    expect(h).toMatchObject({ sound: 'highway', kind: 'ambient', levelDb: -17 });
    expect(h.position[0]).toBeCloseTo(70, 5);
    expect(h.position[1]).toBeCloseTo(3.5, 6);
    expect(h.position[2]).toBeCloseTo(-5, 5);
  });

  it('adds trains and planes as stereo sources that are not traced', () => {
    const specs = surroundingSources({
      ...A,
      located: [{ kind: 'railway', distanceM: 300, bearingDeg: 10, levelDb: 60 }, { kind: 'airport', distanceM: 4000, bearingDeg: 200, levelDb: 55 }],
    }, start);
    expect(specs.find(s => s.id === 'train')).toMatchObject({ kind: 'stereo', sound: 'train', every: [180, 360] });
    expect(specs.find(s => s.id === 'plane')).toMatchObject({ kind: 'stereo', sound: 'plane', every: [60, 180] });
  });

  it('never exceeds three traced sources', () => {
    const specs = surroundingSources({
      ...A,
      located: [
        { kind: 'highway', distanceM: 100, bearingDeg: 0, levelDb: 70 }, { kind: 'highway', distanceM: 50, bearingDeg: 90, levelDb: 70 },
        { kind: 'railway', distanceM: 100, bearingDeg: 0, levelDb: 60 }, { kind: 'airport', distanceM: 100, bearingDeg: 0, levelDb: 60 },
        { kind: 'road', distanceM: 20, bearingDeg: 0, levelDb: 60 },
      ],
    }, start);
    expect(specs.filter(s => s.kind !== 'stereo').length).toBeLessThanOrEqual(3);
  });

  it('labels a fallback', () => {
    expect(surroundingsNotice({ ...A, source: 'property_type', areaClass: 'commercial' }))
      .toBe('Surroundings not available: playing a typical commercial background');
    expect(surroundingsNotice(A)).toBeNull();
  });
});
