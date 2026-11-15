import { describe, it, expect, vi } from 'vitest';
import { createOpeningSound, openingsToggled } from './opening-sound';
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
    decodeAudioData: vi.fn(async () => ({ duration: 2.6 })),
  };
  return { ctx: ctx as unknown as AudioContext, made };
}

const reaches = (from: Node, target: Node, seen = new Set<Node>()): boolean => {
  if (from === target) return true;
  if (seen.has(from)) return false;
  seen.add(from);
  return from.out.some(n => reaches(n, target, seen));
};

const ogg = (async () => new Response(new Uint8Array([1]), { status: 200, headers: { 'content-type': 'audio/ogg' } })) as typeof fetch;
const html = (async () => new Response('<html>', { status: 200, headers: { 'content-type': 'text/html' } })) as typeof fetch;

async function setup(fetchFn: typeof fetch = ogg) {
  const f = fakeContext();
  const master = new Node();
  const reverbInput = new Node();
  const sound = await createOpeningSound(f.ctx, { master: master as unknown as AudioNode, reverbInput: reverbInput as unknown as AudioNode }, fetchFn);
  return { ...f, master, reverbInput, sound };
}

describe('openingsToggled', () => {
  const list = (...open: boolean[]) => open.map((o, i) => ({ id: `o${i}`, open: o }));

  it('is true when an opening both lists have changed state', () => {
    expect(openingsToggled(list(true, true), list(true, false))).toBe(true);
    expect(openingsToggled(list(false), list(true))).toBe(true);
  });

  it('is false when nothing changed, or the openings were only just loaded', () => {
    expect(openingsToggled(list(true, false), list(true, false))).toBe(false);
    expect(openingsToggled([], list(true, false))).toBe(false);
    expect(openingsToggled(list(true), [{ id: 'other', open: false }])).toBe(false);
  });
});

describe('createOpeningSound', () => {
  it('plays the file once, to the master and the reverb, at -12 dB', async () => {
    const { sound, made, master, reverbInput } = await setup();
    sound!.play();
    expect(made.sources).toHaveLength(1);
    expect(made.sources[0].startedAt).toBe(10);
    expect(reaches(made.sources[0], master)).toBe(true);
    expect(reaches(made.sources[0], reverbInput)).toBe(true);
    expect(made.gains[0].gain.value).toBeCloseTo(dbToGain(-12));
  });

  it('is null when the file is missing: nothing is synthesized', async () => {
    expect((await setup(html)).sound).toBeNull();
  });

  it('plays nothing after dispose', async () => {
    const { sound, made } = await setup();
    sound!.play();
    sound!.dispose();
    expect(made.sources[0].stopped).toBe(true);
    sound!.play();
    expect(made.sources).toHaveLength(1);
  });
});
