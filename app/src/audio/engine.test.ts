import { describe, it, expect, vi } from 'vitest';
import { createAudioEngine, type SourceSpec } from './engine';
import { dbToGain } from './levels';
import type { SourceResult } from '../sim/types';
import { AUDIO, SLOT_DIRECTIONS, type SoundId } from '../config';

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
  buffer: unknown = null; loop = false; started = false; stopped = false; onended: null | (() => void) = null;
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
    decodeAudioData: vi.fn(async () => ({ duration: 30, numberOfChannels: 1 })),
  };
  return { ctx: ctx as unknown as AudioContext, made, raw: ctx };
}

// Serves every sound file except the ones named; a missing file gets 404, as from our server.
const files = (missing: string[] = []) => vi.fn(async (url: string | URL | Request) =>
  missing.some(m => String(url).includes(m))
    ? new Response('not found', { status: 404 })
    : new Response(new ArrayBuffer(8), { status: 200, headers: { 'content-type': 'audio/ogg' } }));
const pose = (x: number, y: number, z: number, pitch = 0, yaw = 0) => ({ position: { x, y, z }, rotation: { x: pitch, y: yaw } });
const spec = (id: string, over: Partial<SourceSpec> = {}): SourceSpec =>
  ({ id, label: id, kind: 'point', sound: 'music' as SoundId, position: [0, 0, 0], levelDb: 0, enabled: true, ...over });
const result = (id: string, over: Partial<SourceResult> = {}) =>
  ({ id, distance: 1, direct: [1, 1, 1], walls: 0, slots: [], lateEnergy: [0, 0, 0], ...over }) as unknown as SourceResult;

async function setup(specs: SourceSpec[] = [spec('music')], missing: string[] = []) {
  vi.spyOn(console, 'info').mockImplementation(() => {});
  const f = fakeContext();
  const fetch = files(missing);
  const engine = await createAudioEngine({ context: f.ctx, fetch: fetch as unknown as typeof globalThis.fetch, random: () => 0.5 });
  await engine.setSources(specs);
  // Build order: master, volume; then per voice the direct path, 12 slots, the send.
  // Gains per voice: [direct, 12 slots, send]; panners per voice: [direct, 12 slots]; filters: [lo, hi] × 13.
  const g = f.made.gains, p = f.made.panners;
  return {
    ...f, engine, fetch, volume: g[1],
    gain: g[2], slotGains: g.slice(3, 15), send: g[15],
    panner: p[0], slotPanners: p.slice(1, 13),
    slotDelays: f.made.delays.slice(0, 12),
  };
}

describe('createAudioEngine on a source list (fake AudioContext)', () => {
  it('creates one voice per enabled source', async () => {
    const { made, engine } = await setup([spec('a'), spec('b', { enabled: false }), spec('c', { kind: 'ambient', sound: 'highway' })]);
    expect(made.sources.filter(s => s.started)).toHaveLength(2);
    expect(made.sources.every(s => s.loop)).toBe(true);
    expect(engine.skipped).toEqual([]);
  });

  it('loops each source through HRTF panners without rolloff', async () => {
    const { made, raw, volume } = await setup();
    expect(raw.resume).toHaveBeenCalled();
    for (const p of made.panners) {
      expect(p.panningModel).toBe('HRTF');
      expect(p.rolloffFactor).toBe(0);
    }
    expect(volume.gain.value).toBeGreaterThan(0);
    expect(made.panners).toHaveLength(13);
    expect(made.delays).toHaveLength(12);
    expect(made.delays.every(d => d.max === AUDIO.maxDelay)).toBe(true);
    expect(made.filters).toHaveLength(26);
    expect(made.filters.slice(0, 4).map(f => f.type)).toEqual(['lowshelf', 'highshelf', 'lowshelf', 'highshelf']);
  });

  it('caps at six', async () => {
    const specs = Array.from({ length: 8 }, (_, i) => spec(`s${i}`, { label: `Source ${i}` }));
    const { made, engine } = await setup(specs);
    expect(made.sources.filter(s => s.started)).toHaveLength(6);
    expect(engine.skipped).toEqual(['Source 6 (too many sources)', 'Source 7 (too many sources)']);
  });

  it('skips a missing file and names it', async () => {
    const { made, engine, raw } = await setup(
      [spec('music', { label: 'Music' }), spec('highway', { label: 'Highway', kind: 'ambient', sound: 'highway' })], ['highway.ogg']);
    expect(engine.skipped).toEqual(['Highway']);
    expect(made.sources).toHaveLength(1);
    expect('createOscillator' in raw).toBe(false); // nothing synthesized: the fake has no oscillator to make
    expect(made.panners).toHaveLength(13);
  });

  it('fetches each file once', async () => {
    const { engine, fetch } = await setup([spec('a'), spec('b')]);
    await engine.setSources([spec('a'), spec('b'), spec('c')]);
    expect(fetch).toHaveBeenCalledTimes(1);
  });

  it('removes a voice when its source goes away', async () => {
    const { engine, made } = await setup([spec('a'), spec('b')]);
    await engine.setSources([spec('a')]);
    expect(made.sources[0].stopped).toBe(false);
    expect(made.sources[1].stopped).toBe(true);
    await engine.setSources([spec('a', { enabled: false })]);
    expect(made.sources[0].stopped).toBe(true);
  });

  it('updates a source in place: a new level changes the gain, not the voice', async () => {
    const { engine, made, gain } = await setup([spec('a', { position: [0, 0, -4] })]);
    expect(gain.gain.value).toBeCloseTo(0.25);
    await engine.setSources([spec('a', { position: [0, 0, -4], levelDb: -6 })]);
    expect(made.sources).toHaveLength(1);
    expect(gain.gain.value).toBeCloseTo(0.25 * dbToGain(-6));
  });

  it('replaces the voice when the sound changes', async () => {
    const { engine, made } = await setup([spec('a')]);
    await engine.setSources([spec('a', { sound: 'conversation' })]);
    expect(made.sources).toHaveLength(2);
    expect(made.sources[0].stopped).toBe(true);
  });

  it('lets the last call win when two overlap', async () => {
    const { engine, made } = await setup([]);
    const first = engine.setSources([spec('a'), spec('b')]);
    const second = engine.setSources([spec('a')]);
    await Promise.all([first, second]);
    expect(made.sources.filter(s => s.started && !s.stopped)).toHaveLength(1);
  });

  it('uses 8 echo slots from the fifth source on', async () => {
    const specs = Array.from({ length: 6 }, (_, i) => spec(`s${i}`));
    const { made, engine } = await setup(specs);
    expect(made.panners).toHaveLength(4 * 13 + 2 * 9);
    expect(made.delays).toHaveLength(4 * 12 + 2 * 8);
    // A trace result for the fifth source still carries 12 slots; they are merged into its 8.
    const slots = Array.from({ length: 12 }, () => ({ energy: [0.01, 0.01, 0.01] as [number, number, number], delay: 0.01 }));
    engine.applySimResult([result('s4', { slots })]);
    const fifthSlotGains = made.gains.slice(2 + 4 * 14 + 1, 2 + 4 * 14 + 9);
    const energySum = fifthSlotGains.reduce((sum, g) => sum + g.gain.value ** 2, 0);
    expect(energySum).toBeCloseTo(12 * 0.01, 6); // every slot's energy arrives, in 8 voices
  });

  it('plays a stereo source without a panner', async () => {
    const { made, engine } = await setup([spec('plane', { kind: 'stereo', sound: 'plane', levelDb: -10 })]);
    expect(made.panners).toHaveLength(0);
    expect(made.delays).toHaveLength(0);
    expect(made.sources).toHaveLength(1);
    expect(made.sources[0].loop).toBe(true);
    const lowpass = made.filters.find(f => f.type === 'lowpass')!;
    expect(lowpass).toBeDefined();
    engine.setStereoCut(-25, 800);
    expect(lowpass.frequency.value).toBe(800);
    const stereoGain = made.gains[2];
    expect(stereoGain.gain.value).toBeCloseTo(dbToGain(-35));
    // Never traced: a result for it changes nothing.
    engine.applySimResult([result('plane', { direct: [0, 0, 0], walls: 3 })]);
    expect(stereoGain.gain.value).toBeCloseTo(dbToGain(-35));
  });

  it('applies the stereo cut to a stereo voice added later', async () => {
    const { made, engine } = await setup([]);
    engine.setStereoCut(-25, 800);
    await engine.setSources([spec('plane', { kind: 'stereo', sound: 'plane', levelDb: -10 })]);
    expect(made.filters.find(f => f.type === 'lowpass')!.frequency.value).toBe(800);
    expect(made.gains[2].gain.value).toBeCloseTo(dbToGain(-35));
  });

  it('plays an occasional stereo clip once per random interval', async () => {
    vi.useFakeTimers();
    try {
      const { made, engine } = await setup([spec('train', { kind: 'stereo', sound: 'train', every: [180, 360] })]);
      expect(made.sources).toHaveLength(0);
      await vi.advanceTimersByTimeAsync(11_000); // the first pass comes early: within 10 s
      expect(made.sources).toHaveLength(1);
      expect(made.sources[0]).toMatchObject({ loop: false, started: true });
      await vi.advanceTimersByTimeAsync(270_000); // 180 + 0.5 × 180 with random() = 0.5
      expect(made.sources).toHaveLength(2);
      await engine.stop();
      await vi.advanceTimersByTimeAsync(400_000);
      expect(made.sources).toHaveLength(2);
    } finally {
      vi.useRealTimers();
    }
  });

  it('fades a point source as 1/D when the listener walks away; an ambient one stays at its level', async () => {
    const { engine, made } = await setup([spec('music', { position: [0, 1, 0] }), spec('highway', { kind: 'ambient', sound: 'highway', levelDb: -12 })]);
    const gain = made.gains[2], highwayGain = made.gains[16], panner = made.panners[0];
    expect(panner.positionY.value).toBe(1); // listener still at the origin: relative = world
    engine.setListenerPose(pose(0, 1, 4));
    expect(gain.gain.value).toBeCloseTo(0.25);
    engine.setListenerPose(pose(0, 1, 0.5));
    expect(gain.gain.value).toBeCloseTo(1);
    expect(highwayGain.gain.value).toBeCloseTo(dbToGain(-12));
  });

  it('turns the listener with the pose, keeps it at the origin, and steps (no glides on panner params)', async () => {
    const { engine, raw, panner } = await setup();
    engine.setSourcePosition('music', [1, 2, 0]);
    engine.setListenerPose(pose(1, 2, 3, 0, 90));
    for (const k of ['positionX', 'positionY', 'positionZ'] as const) expect(raw.listener[k].events).toHaveLength(0);
    expect([panner.positionX.value, panner.positionY.value, panner.positionZ.value]).toEqual([0, 0, -3]);
    const kinds = [raw.listener.forwardX, panner.positionZ].flatMap((p: Param) => p.events.map(e => e[0]));
    expect(kinds.every(k => k === 'set')).toBe(true);
    expect(raw.listener.forwardX.value).toBeCloseTo(-1);
    expect(raw.listener.forwardZ.value).toBeCloseTo(0);
    expect(raw.listener.upY.value).toBeCloseTo(1);
  });

  it('applies sim results to gain and shelves', async () => {
    const { engine, gain, made } = await setup();
    engine.setListenerPose(pose(0, 0, 2));
    engine.applySimResult([result('music', { distance: 2, direct: [1, 0.25, 0.025], walls: 1 })]);
    expect(gain.gain.value).toBeCloseTo(0.5 / 2);
    expect(made.filters[0].gain.value).toBeCloseTo(10 * Math.log10(4));
    expect(made.filters[1].gain.value).toBeCloseTo(-10);
  });

  it('stops the sources and closes the context once', async () => {
    const { engine, made, raw } = await setup();
    await engine.stop();
    await engine.stop();
    expect(made.sources.every(s => s.stopped)).toBe(true);
    expect(raw.close).toHaveBeenCalledTimes(1);
  });

  it('keeps the slot panners 2 m from the listener along fixed world directions, and never moves them', async () => {
    const { engine, slotPanners } = await setup();
    const before = slotPanners.map(p => p.positionX.events.length);
    engine.setListenerPose(pose(1, 2, 3, 20, 75));
    engine.setListenerPose(pose(4, 2, -1, 0, 10));
    slotPanners.forEach((p, i) => {
      const d = SLOT_DIRECTIONS[i];
      expect(p.positionX.value).toBeCloseTo(2 * d[0]);
      expect(p.positionY.value).toBeCloseTo(2 * d[1]);
      expect(p.positionZ.value).toBeCloseTo(2 * d[2]);
      expect(p.positionX.events.length).toBe(before[i]);
    });
  });

  it('feeds echo slots from the trace: gain, delay, and a dip for a jump', async () => {
    const { engine, raw, slotGains, slotDelays, send } = await setup();
    const slots = Array.from({ length: 12 }, () => ({ energy: [0, 0, 0] as [number, number, number], delay: 0 }));
    slots[0] = { energy: [0.04, 0.04, 0.04], delay: 0.01 };
    const traced = (s: typeof slots) => result('music', { distance: 4, slots: s, lateEnergy: [0, 0.16, 0] });

    engine.applySimResult([traced(slots)]);
    expect(slotGains[0].gain.value).toBeCloseTo(0.2 * 0.25); // sqrt(0.04) × 1/4
    expect(slotDelays[0].delayTime.value).toBeCloseTo(0.01);
    expect(slotGains[1].gain.value).toBe(0);
    expect(send.gain.value).toBeCloseTo(0.4 * AUDIO.reverbGain);

    raw.currentTime = 1;
    slots[0] = { energy: [0.04, 0.04, 0.04], delay: 0.05 }; // a 40 ms jump: dip
    slotGains[0].gain.events = [];
    engine.applySimResult([traced(slots)]);
    const d = AUDIO.delayDipTime;
    expect(slotGains[0].gain.events).toEqual([
      ['cancel', 0, 1], ['set', 0.05, 1], ['ramp', 0, 1 + d], ['ramp', 0.05, 1 + 2 * d],
    ]);
    expect(slotDelays[0].delayTime.events.at(-1)).toEqual(['set', 0.05, 1 + d]);
  });

  it('connects the reverb sends only when asked, including voices added later', async () => {
    const { engine, send, made } = await setup();
    expect(send.out).toHaveLength(0);
    expect(engine.reverbInput).toBeNull();
    const reverb = new Node();
    engine.connectReverb(reverb as unknown as AudioNode);
    expect(send.out).toEqual([reverb]);
    expect(engine.reverbInput).toBe(reverb);
    await engine.setSources([spec('music'), spec('b')]);
    const secondSend = made.gains[2 + 14 + 13];
    expect(secondSend.out).toEqual([reverb]);
  });
});
