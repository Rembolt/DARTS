// One trace (mvp-design.md 5.2 to 5.5): direct sound, early reflections and echo slots for every source.
import { directSound } from './direct';
import { traceEarly, type Contribution } from './early';
import type { SimState } from './load';
import { mulberry32, type Rng } from './sampling';
import { binSlots, drawnPaths } from './slots';
import type { Bands, FromWorker, SourceResult, ToWorker } from './types';

export type TraceRequest = Extract<ToWorker, { type: 'trace' }>;
export type TraceMessage = Extract<FromWorker, { type: 'trace' }>;

/** A fixed seed by default: the same listener position gives the same result, so nothing flickers between traces. */
export const TRACE_SEED = 1;

export const ECHO_TIME_MIN = 0.2; // seconds
export const ECHO_TIME_MAX = 2.5; // seconds

/**
 * The placeholder echo time per band until the reverb job runs (5.5): `0.04 × mean free path / −ln(1 − average
 * absorption)`, clamped to 0.2–2.5 s. With no hits (or no absorption) it returns the clamp limit.
 */
export function echoTimeEstimate(meanFreePath: number, averageAbsorption: Bands): Bands {
  return averageAbsorption.map(a => {
    const t = a > 0 ? (0.04 * meanFreePath) / -Math.log(1 - a) : meanFreePath > 0 ? ECHO_TIME_MAX : ECHO_TIME_MIN;
    return Math.min(ECHO_TIME_MAX, Math.max(ECHO_TIME_MIN, t));
  }) as Bands;
}

export type TraceTimings = { direct: number; early: number; slots: number }; // ms

export function trace(state: SimState, msg: TraceRequest, rng: Rng = mulberry32(TRACE_SEED)): TraceMessage & { timings: TraceTimings } {
  const t0 = performance.now();
  const directs = msg.sources.map(s => directSound(state, msg.listener, s.position));
  const t1 = performance.now();
  const early = traceEarly(state, msg.listener, msg.sources, rng);
  const t2 = performance.now();

  const bySource: Contribution[][] = msg.sources.map(() => []);
  for (const c of early.contributions) bySource[c.source].push(c);
  const sources: SourceResult[] = msg.sources.map((s, i) => ({
    id: s.id,
    distance: directs[i].distance,
    direct: directs[i].direct,
    walls: directs[i].walls,
    ...binSlots(bySource[i], directs[i].distance, state.config),
  }));
  const { paths, pathSource } = drawnPaths(early, msg.listener, msg.sources.map(s => s.position), state.config.maxDrawnPaths);
  const t3 = performance.now();

  return {
    type: 'trace',
    id: msg.id,
    listener: msg.listener,
    ms: t3 - t0,
    echoTimeEstimate: echoTimeEstimate(early.meanFreePath, early.averageAbsorption),
    sources,
    paths,
    pathSource,
    timings: { direct: t1 - t0, early: t2 - t1, slots: t3 - t2 },
  };
}
