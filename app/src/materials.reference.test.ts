// The material library against published octave-band data (materials.reference.ts). The library keeps its rounded
// three-band values; these tests say how far they may sit from the research and that the three hardcoded copies agree.
import { describe, expect, it } from 'vitest';
import { FURNISHING, MATERIALS } from '../../server/src/shared/materials';
import { MATERIALS as MVP } from './config';
import { MATERIALS as UI } from './ui/materials';
import { ABSORPTION, BLOCKING, toBands, type Octaves } from './materials.reference';

type Name = keyof typeof MATERIALS;
const mean = (rows: Octaves[]): Octaves => rows[0].map((_, i) => rows.reduce((t, r) => t + r[i], 0) / rows.length) as Octaves;
const refAbsorption = (name: string) => toBands(mean(ABSORPTION[name].rows.map(r => r.octaves)));

/** Reverberation time in the mid band for a box room, Sabine: 0.161·V / Σ(S·α). Furnishing goes on the floor only, like the worker. */
function rt60(w: number, d: number, h: number, wall: Name, floor: Name, ceiling: Name, furnishing: number): number {
  const mid = (n: Name, extra = 0) => Math.min(0.99, MATERIALS[n].absorption[1] + extra);
  const A = 2 * (w + d) * h * mid(wall) + w * d * mid(ceiling) + w * d * mid(floor, furnishing);
  return (0.161 * w * d * h) / A;
}

describe('absorption against published tables', () => {
  for (const name of Object.keys(ABSORPTION)) {
    it(`${name} is within 0.02 or 10% of the tables in every band`, () => {
      const ref = refAbsorption(name);
      MATERIALS[name as Name].absorption.forEach((a, band) => {
        expect(Math.abs(a - ref[band])).toBeLessThanOrEqual(Math.max(0.02, 0.1 * ref[band]) + 1e-9);
      });
    });
  }
  it('has no absorption row for insulated drywall: it is drywall plus a little at low and mid', () => {
    const d = MATERIALS.drywall.absorption;
    const i = MATERIALS.insulated_drywall.absorption;
    expect(i[0]).toBeGreaterThan(d[0]);
    expect(i[1]).toBeGreaterThan(d[1]);
    expect(i[2]).toBeCloseTo(d[2], 2);
  });
  it('gives brick veneer and siding the drywall inside face', () => {
    expect(MATERIALS.brick_veneer.absorption).toEqual(MATERIALS.drywall.absorption);
    expect(MATERIALS.siding_wall.absorption).toEqual(MATERIALS.drywall.absorption);
  });
});

describe('blocking against published tables', () => {
  for (const name of Object.keys(BLOCKING)) {
    it(`${name} is within 1.5 dB of ${BLOCKING[name].source}`, () => {
      const ref = toBands(BLOCKING[name].octaves);
      MATERIALS[name as Name].blockingDb.forEach((db, band) => expect(Math.abs(db - ref[band])).toBeLessThanOrEqual(1.5));
    });
  }
  it('adds 3 to 12 dB for insulation, the gap between UFC Table 4-6 types 1 and 2', () => {
    MATERIALS.drywall.blockingDb.forEach((db, band) => {
      const gain = MATERIALS.insulated_drywall.blockingDb[band] - db;
      expect(gain).toBeGreaterThanOrEqual(3);
      expect(gain).toBeLessThanOrEqual(12);
    });
  });
  it('rises with frequency for every material, as the mass law says', () => {
    for (const [name, m] of Object.entries(MATERIALS)) {
      expect(m.blockingDb[1], name).toBeGreaterThanOrEqual(m.blockingDb[0]);
      expect(m.blockingDb[2], name).toBeGreaterThanOrEqual(m.blockingDb[1]);
    }
  });
  it('gains no more than 30 dB from the low band to the high band (mass law is 6 dB per octave, about 4 octaves apart)', () => {
    for (const [name, m] of Object.entries(MATERIALS)) {
      expect(m.blockingDb[2] - m.blockingDb[0], name).toBeLessThanOrEqual(30);
    }
  });
  it('lets a closed window and a closed door pass more than a drywall wall in the mid band', () => {
    expect(MATERIALS.glass.blockingDb[1]).toBeLessThan(MATERIALS.drywall.blockingDb[1]);
    expect(MATERIALS.door.blockingDb[1]).toBeLessThan(MATERIALS.drywall.blockingDb[1]);
  });
});

describe('physical sense', () => {
  it('keeps hard surfaces under 0.03 in the mid band and soft ones above 0.3', () => {
    for (const n of ['tile', 'wall_tile', 'concrete', 'vinyl', 'plaster'] as const) expect(MATERIALS[n].absorption[1], n).toBeLessThanOrEqual(0.03);
    for (const n of ['carpet', 'acoustic_panel'] as const) expect(MATERIALS[n].absorption[1], n).toBeGreaterThan(0.3);
  });
  it('lets carpet and acoustic panels take the highs, and glass and drywall the lows', () => {
    for (const n of ['carpet', 'acoustic_panel'] as const) expect(MATERIALS[n].absorption[2], n).toBeGreaterThan(MATERIALS[n].absorption[0]);
    for (const n of ['glass', 'drywall'] as const) expect(MATERIALS[n].absorption[0], n).toBeGreaterThan(MATERIALS[n].absorption[1]);
  });
  it('gives an empty living room 1 to 2.5 s of reverb and a furnished bedroom 0.3 to 0.8 s (Sabine, mid band)', () => {
    expect(rt60(5, 6, 2.7, 'drywall', 'wood_floor', 'drywall', FURNISHING.empty)).toBeGreaterThan(1);
    expect(rt60(5, 6, 2.7, 'drywall', 'wood_floor', 'drywall', FURNISHING.empty)).toBeLessThan(2.5);
    const bedroom = rt60(4, 5, 2.7, 'drywall', 'carpet', 'drywall', FURNISHING.furnished);
    expect(bedroom).toBeGreaterThan(0.3);
    expect(bedroom).toBeLessThan(0.8);
  });
  it('rings longer in an empty tiled bathroom than in a furnished bedroom', () => {
    expect(rt60(2, 2.5, 2.5, 'drywall', 'tile', 'drywall', FURNISHING.empty)).toBeGreaterThan(rt60(4, 5, 2.7, 'drywall', 'carpet', 'drywall', FURNISHING.furnished));
  });
});

describe('the three hardcoded copies agree', () => {
  it('the app library holds the same numbers as the shared library', () => {
    for (const m of UI) {
      const shared = MATERIALS[m.id as Name];
      expect(shared, m.id).toBeDefined();
      expect([m.absorption, m.scattering, m.blockingDb], m.id).toEqual([shared.absorption, shared.scattering, shared.blockingDb]);
    }
  });
  it('the MVP wall, floor and ceiling are drywall, wood floor and drywall', () => {
    expect(MVP.wall).toEqual(MATERIALS.drywall);
    expect(MVP.floor).toEqual(MATERIALS.wood_floor);
    expect(MVP.ceiling).toEqual(MATERIALS.drywall);
  });
});
