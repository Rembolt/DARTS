// Measure (v2-design.md 6.5): one trace and one reverb job at a point, for Jev's `measure` tool. It does not move the
// user and does not change the worker's last estimate. Numbers are estimates from unvalidated materials.
import { MIN_REFERENCE_DISTANCE } from './early';
import type { SimState } from './load';
import { reverbJob } from './reverb-job';
import { trace } from './trace';
import type { Bands, FromWorker, SourceResult, ToWorker } from './types';

export type MeasureRequest = Extract<ToWorker, { type: 'measure' }>;
export type MeasureMessage = Extract<FromWorker, { type: 'measure' }>;

/** Silence, and anything quieter, reads as this many dB. */
export const LEVEL_FLOOR_DB = -120;

/**
 * Level per band in dB against the source's own level 1 m away with nothing in the way: the trace's energies
 * (direct, echo slots and late energy) are all relative to the unobstructed direct sound `1 / D²`, so their sum is
 * scaled by `1 / D²` (D at least 0.1 m). Floored at −120 dB.
 */
export function levelDb(s: SourceResult): Bands {
  const d = Math.max(MIN_REFERENCE_DISTANCE, s.distance);
  return [0, 1, 2].map(k => {
    let e = s.direct[k] + s.lateEnergy[k];
    for (const slot of s.slots) e += slot.energy[k];
    const db = e > 0 ? 10 * Math.log10(e / (d * d)) : LEVEL_FLOOR_DB;
    return Math.max(LEVEL_FLOOR_DB, db);
  }) as Bands;
}

export function measure(state: SimState, msg: MeasureRequest): MeasureMessage {
  const start = performance.now();
  const t = trace(state, { type: 'trace', id: msg.id, listener: msg.point, sources: msg.sources });
  // As in the worker's reverb case: a band the decay can't fit falls back to this trace's estimate.
  const r = reverbJob(state, { type: 'reverb', roomId: msg.roomId, listener: msg.point }, t.echoTimeEstimate);
  return {
    type: 'measure',
    id: msg.id,
    echoTime: r.echoTime,
    sources: t.sources.map(s => ({ id: s.id, levelDb: levelDb(s), walls: s.walls })),
    ms: performance.now() - start,
  };
}
