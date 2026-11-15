// One trace (mvp-design.md 5.2 to 5.5): direct sound, early reflections and echo slots for every source.
import { directSound } from './direct';
import { traceEarly, type Contribution, type EarlyResult } from './early';
import type { SimState } from './load';
import { mulberry32, type Rng } from './sampling';
import { binSlots, drawnPaths } from './slots';
import type { Bands, FromWorker, SourceResult, ToWorker, Vec3 } from './types';

export type TraceRequest = Extract<ToWorker, { type: 'trace' }>;
export type TraceMessage = Extract<FromWorker, { type: 'trace' }>;

/** A fixed seed by default: the same listener position gives the same result, so nothing flickers between traces. */
export const TRACE_SEED = 1;

/** How many of the traced rays are sent for drawing (an even sample of the sphere: the rays are Fibonacci-spread). */
export const DRAWN_RAYS = 120;

/** The first `DRAWN_RAYS` evenly spaced rays as segments (listener → hit → hit …), their strengths, and each hit's absorbed share. */
export function rayFan(early: EarlyResult, listener: Vec3, maxRays = DRAWN_RAYS) {
  const stride = Math.max(1, Math.floor(early.rays / maxRays));
  const seg: number[] = [], strength: number[] = [], hits: number[] = [];
  for (let r = 0; r < early.rays; r += stride) {
    let from: ArrayLike<number> = listener;
    let carried = 1;
    for (let b = 0; b < early.hitCount[r]; b++) {
      const at = (r * early.bounces + b) * 3;
      const to = early.hitPoints.subarray(at, at + 3);
      const left = early.hitStrength[r * early.bounces + b];
      seg.push(from[0], from[1], from[2], to[0], to[1], to[2]);
      strength.push(carried);
      hits.push(to[0], to[1], to[2], carried > 0 ? Math.min(1, Math.max(0, 1 - left / carried)) : 0);
      carried = left;
      from = to;
    }
  }
  return { rays: new Float32Array(seg), raySegmentStrength: new Float32Array(strength), rayHits: new Float32Array(hits) };
}

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
    ...rayFan(early, msg.listener),
    timings: { direct: t1 - t0, early: t2 - t1, slots: t3 - t2 },
  };
}
