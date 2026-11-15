import type { ProfileId, RequirementOverrides, Requirements, Weights } from '../shared/contract.js';

const w = (echo: number, outside: number, escape: number, size: number, bass: number): Weights => ({ echo, outside, escape, size, bass });

/** Spec 5.5. Starting values from general room-acoustics practice, not a standard. */
export const PROFILES: Record<ProfileId, Requirements> = {
  recording: { profile: 'recording', echoMid: [0.2, 0.4], maxOutsideDb: 30, maxEscapeDb: 45, minRoomArea: 12, avoidBoomyBass: true, weights: w(0.35, 0.30, 0.10, 0.10, 0.15) },
  rehearsal: { profile: 'rehearsal', echoMid: [0.3, 0.6], maxOutsideDb: 40, maxEscapeDb: 40, minRoomArea: 15, avoidBoomyBass: false, weights: w(0.15, 0.10, 0.45, 0.20, 0.10) },
  podcast: { profile: 'podcast', echoMid: [0.15, 0.35], maxOutsideDb: 30, maxEscapeDb: null, minRoomArea: 6, avoidBoomyBass: false, weights: w(0.45, 0.40, 0, 0.10, 0.05) },
  home_office: { profile: 'home_office', echoMid: [0.3, 0.6], maxOutsideDb: 40, maxEscapeDb: null, minRoomArea: 8, avoidBoomyBass: false, weights: w(0.35, 0.50, 0, 0.15, 0) },
  sleep: { profile: 'sleep', echoMid: [0.3, 0.7], maxOutsideDb: 30, maxEscapeDb: null, minRoomArea: 9, avoidBoomyBass: false, weights: w(0.10, 0.75, 0, 0.15, 0) },
  home_theater: { profile: 'home_theater', echoMid: [0.3, 0.5], maxOutsideDb: 35, maxEscapeDb: 45, minRoomArea: 15, avoidBoomyBass: true, weights: w(0.30, 0.15, 0.25, 0.15, 0.15) },
  cafe_restaurant: { profile: 'cafe_restaurant', echoMid: [0.5, 0.9], maxOutsideDb: 55, maxEscapeDb: null, minRoomArea: 40, avoidBoomyBass: false, weights: w(0.45, 0.10, 0, 0.45, 0) },
  retail: { profile: 'retail', echoMid: [0.6, 1.2], maxOutsideDb: 60, maxEscapeDb: null, minRoomArea: 50, avoidBoomyBass: false, weights: w(0.25, 0.10, 0, 0.65, 0) },
  open_office: { profile: 'open_office', echoMid: [0.4, 0.7], maxOutsideDb: 45, maxEscapeDb: null, minRoomArea: 60, avoidBoomyBass: false, weights: w(0.40, 0.15, 0, 0.45, 0) },
  general: { profile: 'general', echoMid: [0.4, 0.8], maxOutsideDb: 45, maxEscapeDb: null, minRoomArea: 10, avoidBoomyBass: false, weights: w(0.30, 0.30, 0, 0.30, 0.10) },
};

/** The spec's bounds for every override. */
const BOUNDS = { echo: [0.1, 3], outside: [20, 70], escape: [20, 80], area: [2, 500] } as const;

const given = (v: unknown): v is number => typeof v === 'number' && Number.isFinite(v);
const clamp = (v: number, [lo, hi]: readonly [number, number]) => Math.min(hi, Math.max(lo, v));

/**
 * A profile with the agent's overrides, each clamped to its bounds. A null, missing or non-numeric override keeps the
 * profile's value; a minimum above the maximum is swapped. Always a fresh copy.
 */
export function resolveRequirements(profile: ProfileId, overrides: Partial<RequirementOverrides> = {}): Requirements {
  const base = PROFILES[profile];
  const o = overrides ?? {};
  let lo = given(o.echoMin) ? clamp(o.echoMin, BOUNDS.echo) : base.echoMid[0];
  let hi = given(o.echoMax) ? clamp(o.echoMax, BOUNDS.echo) : base.echoMid[1];
  if (lo > hi) [lo, hi] = [hi, lo];
  return {
    profile: base.profile,
    echoMid: [lo, hi],
    maxOutsideDb: given(o.maxOutsideDb) ? clamp(o.maxOutsideDb, BOUNDS.outside) : base.maxOutsideDb,
    maxEscapeDb: given(o.maxEscapeDb) ? clamp(o.maxEscapeDb, BOUNDS.escape) : base.maxEscapeDb,
    minRoomArea: given(o.minRoomArea) ? clamp(o.minRoomArea, BOUNDS.area) : base.minRoomArea,
    avoidBoomyBass: base.avoidBoomyBass,
    weights: { ...base.weights },
  };
}
