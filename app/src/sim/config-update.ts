// Live settings: materials per surface class, furnishing, and the quality numbers. The tracer reads `state.config` on
// every call, so replacing values here is all a change needs; the page then re-traces and drops its cached echo times.
import type { SimState } from './load';
import type { ToWorker } from './types';

export type ConfigMessage = Extract<ToWorker, { type: 'config' }>;

const clamp = (v: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, v));

export function applyConfig(state: SimState, msg: ConfigMessage): void {
  const c = state.config;
  if (msg.materials) c.materials = { ...c.materials, ...msg.materials };
  if (msg.furnishing !== undefined) c.furnishing = clamp(msg.furnishing, 0, 0.6);
  if (msg.raysPerTrace !== undefined) c.raysPerTrace = Math.round(clamp(msg.raysPerTrace, 100, 6000));
  if (msg.bounces !== undefined) c.bounces = Math.round(clamp(msg.bounces, 1, 8));
  if (msg.reverbRays !== undefined) c.reverbRays = Math.round(clamp(msg.reverbRays, 100, 6000));
}
