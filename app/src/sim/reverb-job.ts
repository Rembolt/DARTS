// The late-reverb job (mvp-design.md 5.5): trace from a virtual source near the listener, then read the echo time
// off the decay curve. Tracing lives in reverb.ts, the histogram and the fit in decay.ts.
import { addContribution, createHistogram, DEFAULT_ECHO_TIME, echoTimes } from './decay';
import type { SimState } from './load';
import { traceReverb } from './reverb';
import type { Bands, FromWorker, ToWorker } from './types';

export type ReverbRequest = Extract<ToWorker, { type: 'reverb' }>;
export type ReverbMessage = Extract<FromWorker, { type: 'reverb' }>;

/** Echo time per band for the room around `msg.listener`. Bands with no decay to fit get `fallback`. */
export function reverbJob(state: SimState, msg: ReverbRequest, fallback: Bands = DEFAULT_ECHO_TIME): ReverbMessage {
  const start = performance.now();
  const h = createHistogram();
  // traceReverb reuses its energy array between calls; addContribution reads it at once, so no copy is needed.
  traceReverb(state, msg.listener, (time, energy) => addContribution(h, time, energy));
  return { type: 'reverb', roomId: msg.roomId, echoTime: echoTimes(h, fallback), ms: performance.now() - start };
}
