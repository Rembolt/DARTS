import { describe, it, expect, vi } from 'vitest';
import { synthMelody, synthTraffic, fetchBuffer, seededRandom } from './sounds';

const SR = 8000; // small rate keeps the tests fast; the shapes do not depend on it

function stats(x: Float32Array) {
  let peak = 0, maxStep = 0, sumSq = 0;
  for (let i = 0; i < x.length; i++) {
    peak = Math.max(peak, Math.abs(x[i]));
    sumSq += x[i] * x[i];
    if (i > 0) maxStep = Math.max(maxStep, Math.abs(x[i] - x[i - 1]));
  }
  return { peak, maxStep, rms: Math.sqrt(sumSq / x.length), seam: Math.abs(x[0] - x[x.length - 1]) };
}

describe('seededRandom', () => {
  it('is repeatable and in [0, 1)', () => {
    const a = seededRandom(7), b = seededRandom(7);
    for (let i = 0; i < 100; i++) {
      const v = a();
      expect(v).toBe(b());
      expect(v).toBeGreaterThanOrEqual(0);
      expect(v).toBeLessThan(1);
    }
  });
});

describe.each([
  ['synthMelody', synthMelody, 4],
  ['synthTraffic', synthTraffic, 8],
] as const)('%s', (_name, fn, seconds) => {
  const x = fn(SR, seconds);
  const s = stats(x);

  it('has the requested length and no NaN', () => {
    expect(x.length).toBe(SR * seconds);
    expect(x.every(Number.isFinite)).toBe(true);
  });

  it('never clips and is not silent', () => {
    expect(s.peak).toBeLessThanOrEqual(0.7 + 1e-6);
    expect(s.rms).toBeGreaterThan(0.02);
  });

  it('loops without a click: the seam is no bigger than a normal step', () => {
    expect(s.seam).toBeLessThanOrEqual(s.maxStep);
  });

  it('is deterministic', () => {
    expect(fn(SR, seconds)).toEqual(x);
  });
});

describe('synthMelody', () => {
  it('is broadband, not a sine: far more high-frequency energy than a sine at its top note', () => {
    const sr = 44100;
    const x = synthMelody(sr, 4);
    let diff = 0, energy = 0;
    for (let i = 1; i < x.length; i++) { diff += (x[i] - x[i - 1]) ** 2; energy += x[i] ** 2; }
    // For a sine at f, the first difference keeps (2 sin(pi f / sr))^2 of the energy. The top note is 554 Hz.
    const sine = (2 * Math.sin((Math.PI * 554) / sr)) ** 2;
    expect(diff / energy).toBeGreaterThan(10 * sine);
  });
});

describe('synthTraffic', () => {
  it('is low-heavy: neighbouring samples are strongly correlated', () => {
    const x = synthTraffic(SR, 8);
    let num = 0, den = 0;
    for (let i = 1; i < x.length; i++) { num += x[i] * x[i - 1]; den += x[i] * x[i]; }
    expect(num / den).toBeGreaterThan(0.9);
  });
});

describe('fetchBuffer', () => {
  const ctx = { decodeAudioData: vi.fn(async () => ({ duration: 1 }) as unknown as AudioBuffer) } as unknown as BaseAudioContext;
  const response = (status: number, type: string) =>
    new Response(new ArrayBuffer(4), { status, headers: { 'content-type': type } });

  it('decodes an audio response', async () => {
    expect(await fetchBuffer(ctx, '/a.mp3', async () => response(200, 'audio/mpeg'))).not.toBeNull();
  });

  it('treats 404, an HTML fallback page, a network error and a decode error as missing', async () => {
    expect(await fetchBuffer(ctx, '/a.mp3', async () => response(404, 'audio/mpeg'))).toBeNull();
    expect(await fetchBuffer(ctx, '/a.mp3', async () => response(200, 'text/html; charset=utf-8'))).toBeNull();
    expect(await fetchBuffer(ctx, '/a.mp3', async () => { throw new TypeError('offline'); })).toBeNull();
    const bad = { decodeAudioData: async () => { throw new DOMException('bad'); } } as unknown as BaseAudioContext;
    expect(await fetchBuffer(bad, '/a.mp3', async () => response(200, 'audio/mpeg'))).toBeNull();
  });
});
