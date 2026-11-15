// Published octave-band data the material library is checked against (tests only; nothing in the app imports this).
// Absorption: Hall, "Physics of Sound" Table 15.1 as printed on HyperPhysics (hyperphysics.gsu.edu/hbase/Acoustic/revmod.html)
// and the RoomTreat table (roomtreat.com/data/absorption-coefficients, CC BY 4.0). Both are lab values, ASTM C423.
// Blocking: UFC 3-450-01 (TM 5-805-4) Table 4-6 stud partitions; Riverbank test TL-71-247 structural floor; mass law
// TL = 20·log10(m·f) − 47 dB for glass (checked against 27 dB at 500 Hz for 4 mm glass and Rw 32 for 6 mm).
// These are still estimates of a real room, not measurements of this house.
import type { Bands } from './sim/types';

/** Octave centres 125, 250, 500, 1000, 2000, 4000 Hz. */
export type Octaves = [number, number, number, number, number, number];

/**
 * The engine's three bands are low < 250 Hz, mid 250 Hz – 2 kHz, high > 2 kHz (`BAND_EDGES_HZ` in audio/impulse.ts).
 * An octave centred on an edge is split half and half between its two bands.
 */
export const BAND_WEIGHTS: [Octaves, Octaves, Octaves] = [
  [1, 0.5, 0, 0, 0, 0],
  [0, 0.5, 1, 1, 0.5, 0],
  [0, 0, 0, 0, 0.5, 1],
];

/** Weighted mean of an octave-band row in each engine band. */
export function toBands(o: Octaves): Bands {
  return BAND_WEIGHTS.map(w => {
    let sum = 0;
    let weight = 0;
    w.forEach((x, i) => { sum += x * o[i]; weight += x; });
    return sum / weight;
  }) as Bands;
}

export type AbsorptionRef = { rows: { source: string; octaves: Octaves }[]; note?: string };

/** Absorption references per library material. A material with two rows is compared with their mean. */
export const ABSORPTION: Record<string, AbsorptionRef> = {
  drywall: { rows: [
    { source: 'Hall: gypsum wallboard 1/2" on studs', octaves: [0.30, 0.10, 0.05, 0.04, 0.07, 0.10] },
    { source: 'RoomTreat: gypsum board 12 mm on studs', octaves: [0.29, 0.10, 0.05, 0.04, 0.07, 0.09] },
  ] },
  wood_floor: { rows: [
    { source: 'RoomTreat: wood floor on joists', octaves: [0.15, 0.11, 0.10, 0.07, 0.06, 0.07] },
  ] },
  tile: { rows: [
    { source: 'RoomTreat: marble or glazed tile', octaves: [0.01, 0.01, 0.01, 0.01, 0.02, 0.02] },
  ] },
  concrete: { rows: [
    { source: 'Hall: concrete, poured', octaves: [0.01, 0.01, 0.02, 0.02, 0.02, 0.03] },
    { source: 'RoomTreat: concrete or terrazzo floor', octaves: [0.01, 0.01, 0.01, 0.02, 0.02, 0.02] },
  ] },
  carpet: { rows: [
    { source: 'Hall: heavy carpet on concrete', octaves: [0.02, 0.06, 0.15, 0.40, 0.60, 0.60] },
    { source: 'RoomTreat: thin carpet on concrete', octaves: [0.02, 0.06, 0.14, 0.37, 0.60, 0.65] },
    { source: 'RoomTreat: heavy carpet on foam pad', octaves: [0.08, 0.24, 0.57, 0.69, 0.71, 0.73] },
  ], note: 'a house carpet is mostly on a pad: the mean of bare and padded' },
  wood_panel: { rows: [
    { source: 'RoomTreat: wood paneling on battens', octaves: [0.30, 0.25, 0.20, 0.17, 0.15, 0.10] },
    { source: 'RoomTreat: plywood panel 10 mm, air gap', octaves: [0.28, 0.22, 0.17, 0.09, 0.10, 0.11] },
  ] },
  acoustic_panel: { rows: [
    { source: 'RoomTreat: mineral-fiber ceiling tile 15 mm', octaves: [0.34, 0.55, 0.68, 0.78, 0.80, 0.78] },
    { source: 'RoomTreat: fabric-wrapped panel 50 mm', octaves: [0.16, 0.55, 0.95, 1.00, 1.00, 0.98] },
  ] },
  glass: { rows: [
    { source: 'Hall: ordinary window glass', octaves: [0.30, 0.20, 0.20, 0.10, 0.07, 0.04] },
    { source: 'RoomTreat: ordinary window glass', octaves: [0.35, 0.25, 0.18, 0.12, 0.07, 0.04] },
  ] },
  door: { rows: [
    { source: 'RoomTreat: solid wood door', octaves: [0.14, 0.10, 0.06, 0.08, 0.10, 0.10] },
  ] },
  vinyl: { rows: [
    { source: 'Hall: vinyl tile on concrete', octaves: [0.02, 0.03, 0.03, 0.03, 0.03, 0.02] },
    { source: 'RoomTreat: vinyl / linoleum on concrete', octaves: [0.02, 0.03, 0.03, 0.03, 0.03, 0.02] },
  ] },
  wall_tile: { rows: [
    { source: 'RoomTreat: marble or glazed tile', octaves: [0.01, 0.01, 0.01, 0.01, 0.02, 0.02] },
  ] },
  plaster: { rows: [
    { source: 'RoomTreat: plaster on masonry', octaves: [0.01, 0.01, 0.02, 0.03, 0.04, 0.05] },
  ] },
};

export type BlockingRef = { source: string; octaves: Octaves };

/** Transmission loss (dB) references for the materials a published row exists for. */
export const BLOCKING: Record<string, BlockingRef> = {
  drywall: { source: 'UFC 3-450-01 Table 4-6, stud partition type 1 (STC 37)', octaves: [17, 26, 34, 40, 46, 44] },
  glass: { source: 'mass law, 6 mm glass (15 kg/m2) capped near coincidence; Rw 32', octaves: [19, 25, 31, 36, 33, 38] },
  concrete: { source: 'Riverbank TL-71-247, structural concrete floor', octaves: [39, 45, 50, 52, 60, 68] },
};
