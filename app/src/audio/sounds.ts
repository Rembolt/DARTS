// The two looping sounds: the real files when present, otherwise stand-ins synthesized in code.
// The generators are pure (sample rate in, Float32Array out) so they are tested without Web Audio.

/** A small seeded random generator (mulberry32), so stand-ins are the same on every run. */
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

function normalizePeak(out: Float32Array, peak: number): Float32Array {
  let max = 0;
  for (const v of out) max = Math.max(max, Math.abs(v));
  if (max > 0) for (let i = 0; i < out.length; i++) out[i] *= peak / max;
  return out;
}

// A pentatonic tune, one note per eighth at 120 bpm (0.25 s). Semitones above A3 (220 Hz); null = rest.
const MELODY: (number | null)[] = [12, 7, 9, 4, 12, 14, 16, null, 14, 12, 9, 7, 9, 12, 4, null];

/**
 * Indoor stand-in: a plucked-string tune (Karplus–Strong), broadband so HRTF can place it, unlike a sine.
 * Every note is written into the buffer modulo its length, so tails that run past the end wrap to the start
 * and the loop is seamless. Peak 0.7.
 */
export function synthMelody(sampleRate: number, seconds: number): Float32Array {
  const n = Math.round(sampleRate * seconds);
  const out = new Float32Array(n);
  const rand = seededRandom(1);
  const step = seconds / MELODY.length;
  const noteLen = Math.min(n, Math.round(sampleRate * 1.2));
  MELODY.forEach((semi, k) => {
    if (semi === null) return;
    const freq = 220 * 2 ** (semi / 12);
    const period = Math.max(2, Math.round(sampleRate / freq));
    const ring = new Float32Array(period);
    for (let i = 0; i < period; i++) ring[i] = rand() * 2 - 1; // the pluck: a burst of noise
    const start = Math.round(k * step * sampleRate);
    let prev = 0;
    for (let i = 0; i < noteLen; i++) {
      const j = i % period;
      const v = ring[j];
      ring[j] = 0.996 * 0.5 * (v + prev); // averaging two samples is the string's damping
      prev = v;
      // A short fade at the very end of the note so the cut is silent.
      const tail = Math.min(1, (noteLen - i) / (0.05 * sampleRate));
      out[(start + i) % n] += v * tail;
    }
  });
  return normalizePeak(out, 0.7);
}

/**
 * Outdoor stand-in: distant highway. Pink plus brown noise, low-passed, with slow swells as cars pass.
 * Seamless by generating extra samples and crossfading the overrun into the start; the swell periods divide
 * the loop length exactly. Peak 0.6.
 */
export function synthTraffic(sampleRate: number, seconds: number): Float32Array {
  const n = Math.round(sampleRate * seconds);
  const fade = Math.min(Math.floor(n / 4), Math.round(sampleRate * 0.5));
  const raw = new Float32Array(n + fade);
  const rand = seededRandom(2);
  // Paul Kellet's economy pink filter, a leaky integrator for brown, then a one-pole low-pass near 600 Hz.
  let b0 = 0, b1 = 0, b2 = 0, brown = 0, lp = 0;
  const lpCoef = 1 - Math.exp((-2 * Math.PI * 600) / sampleRate);
  for (let i = 0; i < raw.length; i++) {
    const w = rand() * 2 - 1;
    b0 = 0.99765 * b0 + w * 0.099046;
    b1 = 0.963 * b1 + w * 0.2965164;
    b2 = 0.57 * b2 + w * 1.0526913;
    const pink = (b0 + b1 + b2 + w * 0.1848) * 0.2;
    brown = (brown + 0.02 * w) / 1.02;
    lp += lpCoef * (pink * 0.5 + brown * 3 - lp);
    raw[i] = lp;
  }
  const out = new Float32Array(n);
  for (let i = 0; i < n; i++) out[i] = raw[i];
  for (let i = 0; i < fade; i++) {
    const t = (i + 0.5) / fade; // equal-power crossfade: the overrun fades out as the start fades in
    out[i] = raw[i] * Math.sin((t * Math.PI) / 2) + raw[n + i] * Math.cos((t * Math.PI) / 2);
  }
  for (let i = 0; i < n; i++) {
    const phase = (2 * Math.PI * i) / n;
    out[i] *= 0.75 + 0.15 * Math.sin(phase * 2 + 1) + 0.1 * Math.sin(phase * 5 + 2);
  }
  return normalizePeak(out, 0.6);
}

export type SoundKind = 'indoor' | 'outdoor';

const SYNTHS: Record<SoundKind, (sampleRate: number, seconds: number) => Float32Array> = {
  indoor: synthMelody,
  outdoor: synthTraffic,
};

/** Build a stand-in AudioBuffer (mono). */
export function standInBuffer(ctx: BaseAudioContext, kind: SoundKind, seconds: number): AudioBuffer {
  const data = SYNTHS[kind](ctx.sampleRate, seconds);
  const buf = ctx.createBuffer(1, data.length, ctx.sampleRate);
  buf.getChannelData(0).set(data);
  return buf;
}

/**
 * Fetch and decode a sound file. Returns null when it is missing: a failed request, a non-OK status, an HTML
 * page (Vite answers a missing file with index.html and status 200) or audio the browser cannot decode.
 */
export async function fetchBuffer(ctx: BaseAudioContext, url: string, fetchFn: typeof fetch = fetch): Promise<AudioBuffer | null> {
  try {
    const res = await fetchFn(url);
    if (!res.ok) return null;
    if ((res.headers.get('content-type') ?? '').includes('text/html')) return null;
    return await ctx.decodeAudioData(await res.arrayBuffer());
  } catch {
    return null;
  }
}

/** The real file if it loads, else the stand-in. Logs which one is playing. */
export async function loadSound(
  ctx: BaseAudioContext,
  kind: SoundKind,
  url: string,
  standInSeconds: number,
  fetchFn: typeof fetch = fetch,
): Promise<{ buffer: AudioBuffer; standIn: boolean }> {
  const real = await fetchBuffer(ctx, url, fetchFn);
  if (real) {
    console.info(`[audio] ${kind}: playing ${url}`);
    return { buffer: real, standIn: false };
  }
  console.info(`[audio] ${kind}: ${url} missing or undecodable, playing a synthesized stand-in`);
  return { buffer: standInBuffer(ctx, kind, standInSeconds), standIn: true };
}
