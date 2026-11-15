// The reverb's impulse response, made in code (mvp-design.md 6, "Reverb"): noise split into three bands
// (low < 250 Hz, mid 250 Hz–2 kHz, high > 2 kHz), each fading by 60 dB over its band's echo time, two decorrelated
// channels for width. Pure: Float32Arrays in, Float32Arrays out, deterministic for a given seed.
import type { Bands } from '../sim/types';

/** Band edges in Hz, the same as the audio engine's shelf filters (AUDIO.lowShelfHz, highShelfHz). */
export const BAND_EDGES_HZ: [number, number] = [250, 2000];
/** Extra length after the longest echo time, in seconds. The response is faded to zero over it. */
export const IMPULSE_TAIL = 0.1;

/** Small seeded generator (mulberry32), uniform in [0, 1). */
export function seededRandom(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** One second-order Butterworth section (RBJ cookbook, Q = 1/√2), run in place. */
function biquad(x: Float32Array, kind: 'lowpass' | 'highpass', hz: number, sampleRate: number): Float32Array {
  const f = Math.min(hz, sampleRate * 0.45);
  const w = (2 * Math.PI * f) / sampleRate;
  const cos = Math.cos(w);
  const alpha = Math.sin(w) / (2 * Math.SQRT1_2);
  const a0 = 1 + alpha;
  const b1 = (kind === 'lowpass' ? 1 - cos : -(1 + cos)) / a0;
  const b0 = (kind === 'lowpass' ? (1 - cos) / 2 : (1 + cos) / 2) / a0;
  const b2 = b0;
  const a1 = (-2 * cos) / a0;
  const a2 = (1 - alpha) / a0;
  let x1 = 0, x2 = 0, y1 = 0, y2 = 0;
  for (let i = 0; i < x.length; i++) {
    const xi = x[i];
    const y = b0 * xi + b1 * x1 + b2 * x2 - a1 * y1 - a2 * y2;
    x2 = x1; x1 = xi; y2 = y1; y1 = y;
    x[i] = y;
  }
  return x;
}

/** Fourth-order Linkwitz-Riley filter (two Butterworth sections): the low and high halves sum back flat. */
function lr4(x: Float32Array, kind: 'lowpass' | 'highpass', hz: number, sampleRate: number): Float32Array {
  return biquad(biquad(x, kind, hz, sampleRate), kind, hz, sampleRate);
}

/** Splits a signal into the three bands (low, mid, high). Returns new arrays; the input is untouched. */
export function splitBands(x: Float32Array, sampleRate: number): [Float32Array, Float32Array, Float32Array] {
  const [lowHz, highHz] = BAND_EDGES_HZ;
  const low = lr4(Float32Array.from(x), 'lowpass', lowHz, sampleRate);
  const high = lr4(Float32Array.from(x), 'highpass', highHz, sampleRate);
  const mid = lr4(lr4(Float32Array.from(x), 'highpass', lowHz, sampleRate), 'lowpass', highHz, sampleRate);
  return [low, mid, high];
}

function scaleToEnergy(x: Float32Array, energy: number): void {
  let sum = 0;
  for (let i = 0; i < x.length; i++) sum += x[i] * x[i];
  if (!(sum > 0)) return;
  const k = Math.sqrt(energy / sum);
  for (let i = 0; i < x.length; i++) x[i] *= k;
}

function oneChannel(echoTime: Bands, sampleRate: number, length: number, random: () => number): Float32Array {
  const noise = new Float32Array(length);
  for (let i = 0; i < length; i++) noise[i] = random() * 2 - 1;
  const bands = splitBands(noise, sampleRate);
  const out = new Float32Array(length);
  for (let b = 0; b < 3; b++) {
    const band = bands[b];
    // Equal power in each band before the fade, so the colour comes from the echo times and not from how wide
    // each band is (white noise would put almost all its energy above 2 kHz).
    scaleToEnergy(band, 1);
    const k = (3 * Math.LN10) / echoTime[b]; // amplitude falls by 10^-3 (60 dB in energy) at t = echoTime
    for (let i = 0; i < length; i++) out[i] += band[i] * Math.exp((-k * i) / sampleRate);
  }
  const tail = Math.min(length, Math.round(IMPULSE_TAIL * sampleRate));
  for (let j = 0; j < tail; j++) out[length - tail + j] *= 0.5 * (1 + Math.cos((Math.PI * (j + 1)) / tail));
  scaleToEnergy(out, 1);
  return out;
}

/**
 * Two channels of impulse response, each `max(echoTime) + IMPULSE_TAIL` seconds long, each scaled to an energy
 * (sum of squares) of 1, so a mono send comes out at the same energy in each ear. Echo times must be positive;
 * the caller clamps them (see `clampEchoTime` in sim/decay.ts). Same seed, same output.
 */
export function makeImpulse(echoTime: Bands, sampleRate: number, seed = 1): Float32Array[] {
  const t: Bands = [0, 1, 2].map((b) => (echoTime[b] > 0 && Number.isFinite(echoTime[b]) ? echoTime[b] : 0.01)) as Bands;
  const length = Math.max(1, Math.ceil((Math.max(t[0], t[1], t[2]) + IMPULSE_TAIL) * sampleRate));
  const random = seededRandom(seed);
  return [oneChannel(t, sampleRate, length, random), oneChannel(t, sampleRate, length, random)];
}
