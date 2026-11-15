import { describe, it, expect, vi } from 'vitest';
import { stepTimes, pickStep, createFootsteps } from './footsteps';
import { dbToGain } from './levels';

class Param {
  value = 1;
  setValueAtTime(v: number) { this.value = v; return this; }
}
class Node {
  out: Node[] = [];
  connect<T extends Node>(n: T): T { this.out.push(n); return n; }
  disconnect() { this.out = []; }
}
class Gain extends Node { gain = new Param(); }
class Source extends Node {
  buffer: unknown = null;
  playbackRate = new Param();
  startedAt: number | null = null;
  stopped = false;
  onended: (() => void) | null = null;
  start(t = 0) { this.startedAt = t; }
  stop() { this.stopped = true; }
}

function fakeContext() {
  const made = { sources: [] as Source[], gains: [] as Gain[] };
  const ctx = {
    currentTime: 10,
    createGain() { const g = new Gain(); made.gains.push(g); return g; },
    createBufferSource() { const s = new Source(); made.sources.push(s); return s; },
    decodeAudioData: vi.fn(async (b: ArrayBuffer) => ({ tag: new Uint8Array(b)[0], duration: 0.2 })),
  };
  return { ctx: ctx as unknown as AudioContext, made };
}

const reaches = (from: Node, target: Node, seen = new Set<Node>()): boolean => {
  if (from === target) return true;
  if (seen.has(from)) return false;
  seen.add(from);
  return from.out.some((n) => reaches(n, target, seen));
};

const audio = (url: string) => new Response(new Uint8Array([url.length]), { status: 200, headers: { 'content-type': 'audio/ogg' } });
const html = () => new Response('<html>', { status: 200, headers: { 'content-type': 'text/html' } });
const all = (async (url: RequestInfo | URL) => audio(String(url))) as typeof fetch;
const noHard = (async (url: RequestInfo | URL) => (String(url).includes('hard') ? html() : audio(String(url)))) as typeof fetch;
const none = (async () => html()) as typeof fetch;

async function setup(fetchFn: typeof fetch = all, withReverb = true) {
  const f = fakeContext();
  const master = new Node();
  const reverbInput = withReverb ? new Node() : null;
  const steps = await createFootsteps(f.ctx, { master: master as unknown as AudioNode, reverbInput: reverbInput as unknown as AudioNode | null }, { fetch: fetchFn, random: () => 0.5 });
  return { ...f, master, reverbInput, steps };
}

describe('stepTimes', () => {
  it('plays at least two and at most eight steps', () => {
    expect(stepTimes(0.3)).toEqual([0, 0.5]);
    expect(stepTimes(1.6)).toEqual([0, 0.5, 1, 1.5]);
    expect(stepTimes(30)).toHaveLength(8);
    expect(stepTimes(0)).toEqual([0, 0.5]);
    expect(stepTimes(Number.NaN)).toEqual([0, 0.5]);
  });
});

describe('pickStep', () => {
  it('never repeats a variation', () => {
    for (const rnd of [() => 0.5, () => 0, () => 0.999999, () => 1]) {
      let last = -1;
      for (let i = 0; i < 50; i++) {
        const n = pickStep(4, last, rnd);
        expect(n).toBeGreaterThanOrEqual(0);
        expect(n).toBeLessThan(4);
        expect(n).not.toBe(last);
        last = n;
      }
    }
  });
  it('covers every variation with a sweeping random', () => {
    let k = 0;
    const seen = new Set<number>();
    let last = -1;
    for (let i = 0; i < 40; i++) { last = pickStep(4, last, () => (k++ % 10) / 10); seen.add(last); }
    expect([...seen].sort()).toEqual([0, 1, 2, 3]);
  });
  it('returns 0 for a single variation', () => {
    expect(pickStep(1, 0, () => 0.5)).toBe(0);
  });
});

describe('createFootsteps (fake AudioContext)', () => {
  it('sends each step dry and to the reverb', async () => {
    const { steps, made, master, reverbInput } = await setup();
    expect(steps).not.toBeNull();
    steps!.walk(0.3);
    expect(made.sources).toHaveLength(2);
    for (const s of made.sources) {
      expect(s.buffer).toBeTruthy();
      expect(reaches(s, master)).toBe(true);
      expect(reaches(s, reverbInput!)).toBe(true);
      expect(s.playbackRate.value).toBeGreaterThanOrEqual(0.95);
      expect(s.playbackRate.value).toBeLessThanOrEqual(1.05);
    }
    expect(made.sources.map((s) => s.startedAt)).toEqual([10, 10.5]);
  });

  it('applies -18 dB dry and -6 dB to the reverb send', async () => {
    const { steps, made } = await setup();
    steps!.walk(0.3);
    const values = made.gains.map((g) => g.gain.value);
    expect(values).toContainEqual(expect.closeTo(dbToGain(-18), 6));
    expect(values).toContainEqual(expect.closeTo(dbToGain(-6), 6));
  });

  it('works without a reverb input', async () => {
    const { steps, made, master } = await setup(all, false);
    steps!.walk(0.3);
    expect(made.sources).toHaveLength(2);
    expect(reaches(made.sources[0], master)).toBe(true);
  });

  it('plays eight steps for a long transition', async () => {
    const { steps, made } = await setup();
    steps!.walk(30);
    expect(made.sources).toHaveLength(8);
  });

  it('is silent when disabled and plays again when re-enabled', async () => {
    const { steps, made } = await setup();
    steps!.setEnabled(false);
    steps!.walk(1);
    expect(made.sources).toHaveLength(0);
    steps!.setEnabled(true);
    steps!.walk(1);
    expect(made.sources).toHaveLength(2);
  });

  it('plays nothing for a floor whose set did not load, and does not fall back to the other', async () => {
    const { steps, made } = await setup(noHard);
    expect(steps).not.toBeNull();
    steps!.walk(1);
    expect(made.sources).toHaveLength(0);
    steps!.setFloor('soft');
    steps!.walk(1);
    expect(made.sources).toHaveLength(2);
    steps!.setFloor('hard');
    steps!.walk(1);
    expect(made.sources).toHaveLength(2);
  });

  it('returns null when no file loads', async () => {
    const { steps } = await setup(none);
    expect(steps).toBeNull();
  });

  it('returns null when every request throws', async () => {
    const { steps } = await setup((async () => { throw new Error('offline'); }) as typeof fetch);
    expect(steps).toBeNull();
  });

  it('stops pending steps on dispose and plays nothing after', async () => {
    const { steps, made } = await setup();
    steps!.walk(1);
    steps!.dispose();
    expect(made.sources.every((s) => s.stopped)).toBe(true);
    steps!.walk(1);
    expect(made.sources).toHaveLength(2);
  });
});
