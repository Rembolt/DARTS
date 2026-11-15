import { describe, it, expect, vi } from 'vitest';
import { createAudioEngine } from './engine';
import { dbToGain } from './levels';
import type { SourceResult } from '../sim/types';

// A minimal fake of the Web Audio nodes the engine touches. Params remember their last value or target.
class Param {
  value = 0;
  setTargetAtTime(v: number) { this.value = v; return this; }
  setValueAtTime(v: number) { this.value = v; return this; }
}
class Node {
  out: Node[] = [];
  connect<T extends Node>(n: T): T { this.out.push(n); return n; }
}
class Source extends Node {
  buffer: unknown = null; loop = false; started = false; stopped = false;
  start() { this.started = true; } stop() { this.stopped = true; }
}

function fakeContext() {
  const made = { panners: [] as Record<string, any>[], gains: [] as any[], filters: [] as any[], sources: [] as Source[] };
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
  // Voices are built indoor first: filters [lo, hi] per voice; gains [master, volume, indoor, outdoor].
  const [, volume, indoorGain, outdoorGain] = f.made.gains;
  return { ...f, engine, volume, indoorGain, outdoorGain, indoorPanner: f.made.panners[0], outdoorPanner: f.made.panners[1] };
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
    expect(made.filters.map((f) => f.type)).toEqual(['lowshelf', 'highshelf', 'lowshelf', 'highshelf']);
  });

  it('fades the song as 1/D when the listener walks away; the highway stays 12 dB down', async () => {
    const { engine, indoorGain, outdoorGain, indoorPanner } = await setup();
    engine.setSourcePosition('indoor', [0, 1, 0]);
    expect(indoorPanner.positionY.value).toBe(1);
    engine.setListenerPose(pose(0, 1, 4));
    expect(indoorGain.gain.value).toBeCloseTo(0.25);
    engine.setListenerPose(pose(0, 1, 0.5));
    expect(indoorGain.gain.value).toBeCloseTo(1);
    expect(outdoorGain.gain.value).toBeCloseTo(dbToGain(-12));
  });

  it('turns the listener with the pose', async () => {
    const { engine, raw } = await setup();
    engine.setListenerPose(pose(1, 2, 3, 0, 90));
    expect(raw.listener.positionZ.value).toBe(3);
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
});
