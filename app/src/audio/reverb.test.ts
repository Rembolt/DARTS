import { describe, it, expect } from 'vitest';
import { Reverb, shouldSwap, crossfadeCurve } from './reverb';
import { AUDIO } from '../config';

describe('shouldSwap', () => {
  it('swaps when there is no reverb yet', () => {
    expect(shouldSwap(null, [1, 1, 1])).toBe(true);
    expect(shouldSwap(undefined, [1, 1, 1])).toBe(true);
  });

  it('keeps the reverb for changes up to 15% in every band', () => {
    expect(shouldSwap([1, 1, 1], [1.14, 0.86, 1.15])).toBe(false);
    expect(shouldSwap([1, 0.5, 2], [1, 0.5, 2])).toBe(false);
  });

  it('swaps when any band changes by more than 15%', () => {
    expect(shouldSwap([1, 1, 1], [1, 1.16, 1])).toBe(true);
    expect(shouldSwap([1, 1, 1], [0.84, 1, 1])).toBe(true);
    expect(shouldSwap([1, 1, 1], [1, 1, NaN])).toBe(true);
  });

  it('takes the threshold from config by default, or as an argument', () => {
    expect(AUDIO.reverbChangeThreshold).toBe(0.15);
    expect(shouldSwap([1, 1, 1], [1.1, 1, 1], 0.05)).toBe(true);
  });
});

describe('crossfadeCurve', () => {
  it('runs from start to end and keeps the summed power at 1', () => {
    const up = crossfadeCurve(0, 1);
    const down = crossfadeCurve(1, 0);
    expect(up[0]).toBe(0);
    expect(up[up.length - 1]).toBeCloseTo(1);
    expect(down[0]).toBe(1);
    expect(down[down.length - 1]).toBeCloseTo(0);
    for (let i = 0; i < up.length; i++) expect(up[i] ** 2 + down[i] ** 2).toBeCloseTo(1, 5);
  });

  it('starts from a partial gain', () => {
    const c = crossfadeCurve(0.4, 1);
    expect(c[0]).toBeCloseTo(0.4);
    expect(c[c.length - 1]).toBeCloseTo(1);
  });
});

// A minimal stand-in for an AudioContext: records connections and parameter automation.
type Event = [string, number, number];
class FakeParam {
  value = 1;
  events: Event[] = [];
  cancelScheduledValues(t: number) { this.events.push(['cancel', 0, t]); }
  cancelAndHoldAtTime(t: number) { this.events.push(['hold', 0, t]); }
  setValueAtTime(v: number, t: number) { this.events.push(['set', v, t]); }
  linearRampToValueAtTime(v: number, t: number) { this.events.push(['ramp', v, t]); this.value = v; }
}
class FakeNode {
  outputs = new Set<FakeNode>();
  connect(n: FakeNode) { this.outputs.add(n); return n; }
  disconnect() { this.outputs.clear(); }
}
class FakeGain extends FakeNode { gain = new FakeParam(); }
class FakeConvolver extends FakeNode { normalize = true; buffer: FakeBuffer | null = null; }
class FakeBuffer {
  data: Float32Array[];
  constructor(public numberOfChannels: number, public length: number, public sampleRate: number) {
    this.data = Array.from({ length: numberOfChannels }, () => new Float32Array(length));
  }
  copyToChannel(src: Float32Array, ch: number) { this.data[ch].set(src); }
}
class FakeContext {
  sampleRate = 8000;
  currentTime = 2;
  convolvers: FakeConvolver[] = [];
  createGain() { return new FakeGain(); }
  createConvolver() { const c = new FakeConvolver(); this.convolvers.push(c); return c; }
  createBuffer(ch: number, len: number, sr: number) { return new FakeBuffer(ch, len, sr); }
}

function setup() {
  const ctx = new FakeContext();
  const reverb = new Reverb(ctx as unknown as BaseAudioContext);
  const input = reverb.input as unknown as FakeGain;
  const output = reverb.output as unknown as FakeGain;
  const fades = [...input.outputs]; // empty until the first convolver
  return { ctx, reverb, input, output, fades };
}

/** The fade gains: the nodes that feed the output. */
function fadesOf(ctx: FakeContext) {
  return ctx.convolvers.map((c) => [...c.outputs][0] as FakeGain);
}

describe('Reverb', () => {
  it('starts silent with no convolver', () => {
    const { ctx, reverb, fades } = setup();
    expect(fades).toHaveLength(0);
    expect(ctx.convolvers).toHaveLength(0);
    expect(reverb.echoTime).toBeNull();
  });

  it('builds a stereo, unnormalised convolver on the first echo time and fades it in', () => {
    const { ctx, reverb, input, output } = setup();
    expect(reverb.setEchoTime([1, 0.8, 0.5])).toBe(true);
    const [conv] = ctx.convolvers;
    expect(conv.normalize).toBe(false);
    expect(conv.buffer!.numberOfChannels).toBe(2);
    expect(conv.buffer!.length).toBe(Math.ceil(1.1 * ctx.sampleRate));
    expect(input.outputs.has(conv)).toBe(true);
    const fade = fadesOf(ctx)[0];
    expect(fade.outputs.has(output)).toBe(true);
    const last = fade.gain.events[fade.gain.events.length - 1];
    expect(last[1]).toBeCloseTo(1);
    expect(last[2]).toBeCloseTo(ctx.currentTime + AUDIO.reverbCrossfade);
    expect(reverb.echoTime).toEqual([1, 0.8, 0.5]);
  });

  it('ignores small changes', () => {
    const { ctx, reverb } = setup();
    reverb.setEchoTime([1, 1, 1]);
    expect(reverb.setEchoTime([1.1, 0.9, 1.05])).toBe(false);
    expect(ctx.convolvers).toHaveLength(1);
    expect(reverb.echoTime).toEqual([1, 1, 1]);
  });

  it('crossfades to the other slot on a big change and back again', () => {
    const { ctx, reverb, output } = setup();
    reverb.setEchoTime([1, 1, 1]);
    ctx.currentTime = 5;
    expect(reverb.setEchoTime([2, 2, 2])).toBe(true);
    const [a, b] = fadesOf(ctx);
    expect(a).not.toBe(b);
    expect(b.outputs.has(output)).toBe(true);
    const endA = a.gain.events[a.gain.events.length - 1];
    const endB = b.gain.events[b.gain.events.length - 1];
    expect(endA[1]).toBeCloseTo(0);
    expect(endB[1]).toBeCloseTo(1);
    expect(endB[2]).toBeCloseTo(5 + AUDIO.reverbCrossfade);
    expect(a.gain.events.some(([k, , t]) => k === 'hold' && t === 5)).toBe(true);

    // Third swap reuses the first slot with a fresh convolver and drops the old one.
    expect(reverb.setEchoTime([0.5, 0.5, 0.5])).toBe(true);
    expect(ctx.convolvers).toHaveLength(3);
    expect(ctx.convolvers[0].outputs.size).toBe(0);
    expect(fadesOf(ctx)[2]).toBe(a);
  });

  it('clamps echo times before building', () => {
    const { ctx, reverb } = setup();
    reverb.setEchoTime([10, 0.01, 1]);
    expect(reverb.echoTime).toEqual([AUDIO.echoTimeMax, AUDIO.echoTimeMin, 1]);
    expect(ctx.convolvers[0].buffer!.length).toBe(Math.ceil((AUDIO.echoTimeMax + 0.1) * ctx.sampleRate));
  });

  it('disconnects everything on dispose', () => {
    const { ctx, reverb, input, output } = setup();
    reverb.setEchoTime([1, 1, 1]);
    const fade = fadesOf(ctx)[0];
    reverb.dispose();
    expect(input.outputs.size).toBe(0);
    expect(output.outputs.size).toBe(0);
    expect(fade.outputs.size).toBe(0);
    expect(ctx.convolvers[0].outputs.size).toBe(0);
    expect(reverb.echoTime).toBeNull();
  });
});
