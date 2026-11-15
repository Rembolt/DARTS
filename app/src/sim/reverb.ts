// The tracing half of the late-reverb job (mvp-design.md 5.5 steps 1 and 2). The histogram, decay curve and echo
// time live in decay.ts; this module only delivers arrivals.
import { traceRays } from './early';
import { firstHit } from './geometry';
import type { SimState } from './load';
import { mulberry32, type Rng } from './sampling';
import type { Bands, Vec3 } from './types';

/** The virtual source sits this far from the listener (5.5 step 1). */
export const VIRTUAL_SOURCE_DISTANCE = 1; // metres
/** A direction is used for the virtual source only if nothing is hit this close along it. */
export const VIRTUAL_SOURCE_CLEARANCE = 1.2; // metres
/** A reverb ray stops once its strength is below this in every band (−60 dB): it can no longer change the decay. */
export const REVERB_MIN_STRENGTH = 1e-6;
/** The default seed, so the same room gives the same echo time. */
export const REVERB_SEED = 2;

const s = Math.SQRT1_2;
/** Tried in order: level directions first (the virtual source stays at ear height), then up and down. */
const CANDIDATES: Vec3[] = [
  [1, 0, 0], [-1, 0, 0], [0, 0, 1], [0, 0, -1],
  [s, 0, s], [-s, 0, s], [s, 0, -s], [-s, 0, -s],
  [0, 1, 0], [0, -1, 0],
];

/**
 * Where the virtual source goes: 1 m from the listener along the first candidate direction with at least 1.2 m clear.
 * If none is clear (a cupboard, or a listener against a wall), it goes along the candidate with the most room, at
 * half that clearance, so it stays on the listener's side of every surface.
 */
export function virtualSource(state: SimState, listener: Vec3): Vec3 {
  const at = (d: Vec3, k: number): Vec3 => [listener[0] + d[0] * k, listener[1] + d[1] * k, listener[2] + d[2] * k];
  for (const d of CANDIDATES) {
    if (!firstHit(state.index, listener, d, VIRTUAL_SOURCE_CLEARANCE)) return at(d, VIRTUAL_SOURCE_DISTANCE);
  }
  let best = CANDIDATES[0], room = 0;
  for (const d of CANDIDATES) {
    const clear = firstHit(state.index, listener, d)?.distance ?? Infinity;
    if (clear > room) { room = clear; best = d; }
  }
  return at(best, Math.min(VIRTUAL_SOURCE_DISTANCE, room / 2));
}

/**
 * Trace `reverbRays` rays from the listener with up to `reverbBounces` bounces (the same tracer as the early
 * reflections), connecting each hit to the virtual source only by a clear leg (no cutting through walls).
 * `onArrival` gets every contribution: arrival time in seconds after the sound left the virtual source, energy per
 * band (against the virtual source's direct sound, as in 5.3; only relative values matter for the decay), and the
 * bounce index (0 = first hit). The `energy` array is reused between calls: copy it to keep it.
 */
export function traceReverb(
  state: SimState,
  listener: Vec3,
  onArrival: (time: number, energy: Bands, bounce: number) => void,
  rng: Rng = mulberry32(REVERB_SEED),
): { rays: number; ms: number } {
  const t0 = performance.now();
  const { reverbRays: rays, reverbBounces: bounces } = state.config;
  const energy: Bands = [0, 0, 0];
  traceRays(state, listener, [{ position: virtualSource(state, listener) }], rng, {
    rays,
    bounces,
    maxLegWalls: 0,
    minStrength: REVERB_MIN_STRENGTH,
    onContribution(_source, e0, e1, e2, arrival, _ray, bounce) {
      energy[0] = e0; energy[1] = e1; energy[2] = e2;
      onArrival(arrival, energy, bounce);
    },
  });
  return { rays, ms: performance.now() - t0 };
}
