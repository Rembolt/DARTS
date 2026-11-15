import { describe, it, expect, vi } from 'vitest';
import { createAudioEngine } from './engine';
import { dbToGain } from './levels';
import type { SourceResult } from '../sim/types';
import { AUDIO, SLOT_DIRECTIONS } from '../config';

// A minimal fake of the Web Audio nodes the engine touches. Params remember their last value or target.
class Param {
  value = 0;
  events: [string, number, number][] = [];
  setTargetAtTime(v: number, t: number) { this.value = v; this.events.push(['target', v, t]); return this; }
  setValueAtTime(v: number, t: number) { this.value = v; this.events.push(['set', v, t]); return this; }
  linearRampToValueAtTime(v: number, t: number) { this.value = v; this.events.push(['ramp', v, t]); return this; }
  cancelScheduledValues(t: number) { this.events.push(['cancel', 0, t]); return this; }
}
class Node {
  out: Node[] = [];
  connect<T extends Node>(n: T): T { this.out.push(n); return n; }
  disconnect() { this.out = []; }
}
class Source extends Node {
  buffer: unknown = null; loop = false; started = false; stopped = false;
  start() { this.started = true; } stop() { this.stopped = true; }
}

function fakeContext() {
  const made = { panners: [] as Record<string, any>[], gains: [] as any[], filters: [] as any[], sources: [] as Source[], delays: [] as any[] };
  const ctx = {
    currentTime: 0,
    sampleRate: 8000,
    destination: new Node(),
    listener: Object.fromEntries(
      ['positionX', 'positionY', 'positionZ', 'forwardX', 'forwardY', 'forwardZ', 'upX', 'upY', 'upZ'].map((k) => [k, new Param()]),
    ),
    resume: vi.fn(async () => {}),
    close: vi.fn(async () => {}),
    createGain() { const g = Object.assign(new Node(), { gain: new Param() }); made.gains.push(g); return g; },
    createBiquadFilter() {
      const f = Object.assign(new Node(), { type: '', frequency: new Param(), gain: new Param() }); made.filters.push(f); return f;
    },
    createPanner() {
      const p = Object.assign(new Node(), {
        panningModel: '', distanceModel: '', rolloffFactor: 1, positionX: new Param(), positionY: new Param(), positionZ: new Param(),
      });
      made.panners.push(p); return p;
    },
    createDynamicsCompressor() {
      return Object.assign(new Node(), { threshold: new Param(), knee: new Param(), ratio: new Param(), attack: new Param(), release: new Param() });
    },
    createDelay(max: number) { const d = Object.assign(new Node(), { max, delayTime: new Param() }); made.delays.push(d); return d; },
    createBufferSource() { const s = new Source(); made.sources.push(s); return s; },
    createBuffer(_c: number, n: number) { const d = new Float32Array(n); return { getChannelData: () => d, length: n }; },
    decodeAudioData: vi.fn(),
  };
  return { ctx: ctx as unknown as AudioContext, made, raw: ctx };
}

const missing = async () => new Response('<html>', { status: 200, headers: { 'content-type': 'text/html' } });
const pose = (x: number, y: number, z: number, pitch = 0, yaw = 0) => ({ position: { x, y, z }, rotation: { x: pitch, y: yaw } });

async function setup() {
  vi.spyOn(console, 'info').mockImplementation(() => {});
  const f = fakeContext();
  const engine = await createAudioEngine({ context: f.ctx, fetch: missing });
  // Build order: master, volume; then per voice (indoor first) the direct path, 12 slots, the send.
  // Gains per voice: [direct, 12 slots, send]; panners per voice: [direct, 12 slots]; filters: [lo, hi] × 13.
  const g = f.made.gains, p = f.made.panners;
  return {
    ...f, engine, volume: g[1],
    indoorGain: g[2], indoorSlotGains: g.slice(3, 15), indoorSend: g[15],
    outdoorGain: g[16], outdoorSlotGains: g.slice(17, 29),
    indoorPanner: p[0], indoorSlotPanners: p.slice(1, 13), outdoorPanner: p[13],
    indoorSlotDelays: f.made.delays.slice(0, 12),
  };
}

describe('createAudioEngine (fake AudioContext)', () => {
  it('falls back to stand-ins, loops both sources through HRTF panners without rolloff', async () => {
    const { engine, made, raw, volume } = await setup();
    expect(engine.standIns).toEqual({ indoor: true, outdoor: true });
    expect(raw.resume).toHaveBeenCalled();
    expect(made.sources.every((s) => s.loop && s.started)).toBe(true);
    for (const p of made.panners) {
      expect(p.panningModel).toBe('HRTF');
      expect(p.rolloffFactor).toBe(0);
    }
    expect(volume.gain.value).toBeGreaterThan(0);
    expect(made.panners).toHaveLength(26);
    expect(made.delays).toHaveLength(24);
    expect(made.delays.every((d) => d.max === AUDIO.maxDelay)).toBe(true);
    expect(made.filters).toHaveLength(54); // 2 voices × (13 pairs of shelves + 1 trim shelf)
    expect(made.filters.slice(0, 4).map((f) => f.type)).toEqual(['lowshelf', 'highshelf', 'lowshelf', 'highshelf']);
  });

  it('puts a trim stage between each player and everything it feeds, neutral until set', async () => {
    const { engine, made } = await setup();
    for (const src of made.sources) {
      expect(src.out).toHaveLength(1);
      const shelf = src.out[0] as any;
      expect(shelf.type).toBe('highshelf');
      const trim = shelf.out[0] as any;
      expect(trim.gain.value).toBe(1);
      expect(trim.out.length).toBe(1 + 12 + 1); // direct shelves, 12 echo delays, reverb send
    }
    engine.setSourceTrim('outdoor', -6, -8);
    const outdoorTrim = (made.sources[1].out[0] as any).out[0];
    expect(outdoorTrim.gain.value).toBeCloseTo(dbToGain(-6));
    expect((made.sources[1].out[0] as any).gain.value).toBe(-8);
  });

  it('fades the song as 1/D when the listener walks away; the highway stays 12 dB down', async () => {
    const { engine, indoorGain, outdoorGain, indoorPanner } = await setup();
    engine.setSourcePosition('indoor', [0, 1, 0]);
    expect(indoorPanner.positionY.value).toBe(1); // listener still at the origin: relative = world
    engine.setListenerPose(pose(0, 1, 4));
    expect(indoorGain.gain.value).toBeCloseTo(0.25);
    engine.setListenerPose(pose(0, 1, 0.5));
    expect(indoorGain.gain.value).toBeCloseTo(1);
    expect(outdoorGain.gain.value).toBeCloseTo(dbToGain(-12));
  });

  it('turns the listener with the pose, keeps it at the origin, and steps (no glides on panner params)', async () => {
    const { engine, raw, indoorPanner } = await setup();
    engine.setSourcePosition('indoor', [1, 2, 0]);
    engine.setListenerPose(pose(1, 2, 3, 0, 90));
    for (const k of ['positionX', 'positionY', 'positionZ'] as const) expect(raw.listener[k].events).toHaveLength(0);
    // The source is 3 m in front of the listener's world position along −Z, so it sits at (0, 0, −3) relative to it.
    expect([indoorPanner.positionX.value, indoorPanner.positionY.value, indoorPanner.positionZ.value]).toEqual([0, 0, -3]);
    const kinds = [raw.listener.forwardX, indoorPanner.positionZ].flatMap((p: Param) => p.events.map(e => e[0]));
    expect(kinds.every(k => k === 'set')).toBe(true);
    expect(raw.listener.forwardX.value).toBeCloseTo(-1);
    expect(raw.listener.forwardZ.value).toBeCloseTo(0);
    expect(raw.listener.upY.value).toBeCloseTo(1);
  });

  it('applies sim results to gain and shelves', async () => {
    const { engine, indoorGain, made } = await setup();
    engine.setListenerPose(pose(0, 0, 2));
    const result = { id: 'indoor', distance: 2, direct: [1, 0.25, 0.025], walls: 1, slots: [], lateEnergy: [0, 0, 0] } as SourceResult;
    engine.applySimResult([result]);
    expect(indoorGain.gain.value).toBeCloseTo(0.5 / 2);
    expect(made.filters[0].gain.value).toBeCloseTo(10 * Math.log10(4));
    expect(made.filters[1].gain.value).toBeCloseTo(-10);
  });

  it('stops the sources and closes the context once', async () => {
    const { engine, made, raw } = await setup();
    await engine.stop();
    await engine.stop();
    expect(made.sources.every((s) => s.stopped)).toBe(true);
    expect(raw.close).toHaveBeenCalledTimes(1);
  });

  it('keeps the slot panners 2 m from the listener along fixed world directions, and never moves them', async () => {
    const { engine, indoorSlotPanners } = await setup();
    const before = indoorSlotPanners.map(p => p.positionX.events.length);
    engine.setListenerPose(pose(1, 2, 3, 20, 75));
    engine.setListenerPose(pose(4, 2, -1, 0, 10));
    indoorSlotPanners.forEach((p, i) => {
      const d = SLOT_DIRECTIONS[i];
      expect(p.positionX.value).toBeCloseTo(2 * d[0]);
      expect(p.positionY.value).toBeCloseTo(2 * d[1]);
      expect(p.positionZ.value).toBeCloseTo(2 * d[2]);
      expect(p.positionX.events.length).toBe(before[i]); // no updates per pose
    });
  });

  it('feeds echo slots from the trace: gain, delay, and a dip for a jump', async () => {
    const { engine, raw, indoorSlotGains, indoorSlotDelays, indoorSend } = await setup();
    const slots = Array.from({ length: 12 }, () => ({ energy: [0, 0, 0] as [number, number, number], delay: 0 }));
    slots[0] = { energy: [0.04, 0.04, 0.04], delay: 0.01 };
    const result = (s: typeof slots) =>
      ({ id: 'indoor', distance: 4, direct: [1, 1, 1], walls: 0, slots: s, lateEnergy: [0, 0.16, 0] }) as SourceResult;

    engine.applySimResult([result(slots)]);
    expect(indoorSlotGains[0].gain.value).toBeCloseTo(0.2 * 0.25); // sqrt(0.04) × 1/4
    expect(indoorSlotDelays[0].delayTime.value).toBeCloseTo(0.01);
    expect(indoorSlotGains[1].gain.value).toBe(0);
    expect(indoorSend.gain.value).toBeCloseTo(0.4 * AUDIO.reverbGain);

    raw.currentTime = 1;
    slots[0] = { energy: [0.04, 0.04, 0.04], delay: 0.05 }; // a 40 ms jump: dip
    indoorSlotGains[0].gain.events = [];
    engine.applySimResult([result(slots)]);
    const d = AUDIO.delayDipTime;
    expect(indoorSlotGains[0].gain.events).toEqual([
      ['cancel', 0, 1], ['set', 0.05, 1], ['ramp', 0, 1 + d], ['ramp', 0.05, 1 + 2 * d],
    ]);
    expect(indoorSlotDelays[0].delayTime.events.at(-1)).toEqual(['set', 0.05, 1 + d]);
  });

  it('connects the reverb sends only when asked', async () => {
    const { engine, indoorSend } = await setup();
    expect(indoorSend.out).toHaveLength(0);
    const reverb = new Node();
    engine.connectReverb(reverb as unknown as AudioNode);
    expect(indoorSend.out).toEqual([reverb]);
  });
});
