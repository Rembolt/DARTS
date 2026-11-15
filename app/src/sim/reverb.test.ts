import { it, expect, vi } from 'vitest';

vi.setConfig({ testTimeout: 20_000 }); // 300 rays × 120 bounces per run; slow when other agents load the machine
import { simConfig } from '../config';
import { traceReverb, virtualSource } from './reverb';
import { mulberry32 } from './sampling';
import { MeshBuilder, boxRoom } from './testMeshes';
import type { Bands, SimConfig, Vec3 } from './types';

const listener: Vec3 = [1, 1.5, 1.5];
const small = (over: Partial<SimConfig> = {}): SimConfig => ({ ...simConfig(), reverbRays: 300, ...over });

function collect(config: SimConfig, seed?: number) {
  const out: { time: number; energy: Bands; bounce: number }[] = [];
  const r = traceReverb(boxRoom(config), listener, (time, energy, bounce) => out.push({ time, energy: [...energy], bounce }),
    seed === undefined ? undefined : mulberry32(seed));
  return { ...r, out };
}

it('puts the virtual source 1 m from the listener, with clearance, inside the room', () => {
  const s = virtualSource(boxRoom(), listener);
  expect(Math.hypot(s[0] - listener[0], s[1] - listener[1], s[2] - listener[2])).toBeCloseTo(1, 6);
  expect(s.every((v, k) => v > [0, 0, 0][k] && v < [4, 3, 3][k])).toBe(true);
});

it('falls back to a shorter offset along the clearest direction in a tiny room', () => {
  const tiny = new MeshBuilder().room([0, 0, 0], [1, 1, 1]).state();
  const p: Vec3 = [0.5, 0.5, 0.5];
  const s = virtualSource(tiny, p);
  const d = Math.hypot(s[0] - p[0], s[1] - p[1], s[2] - p[2]);
  expect(d).toBeGreaterThan(0.1);
  expect(d).toBeLessThan(0.5);
});

it('delivers arrivals with positive time and non-negative energy, and reports rays and ms', () => {
  const { rays, ms, out } = collect(small());
  expect(rays).toBe(300);
  expect(ms).toBeGreaterThanOrEqual(0);
  expect(out.length).toBeGreaterThan(300 * 10);
  // one expect for all arrivals: thousands of expect calls make this test slow on a busy machine
  expect(out.filter(a => !(a.time > 0) || !a.energy.every(e => e >= 0 && Number.isFinite(e)))).toEqual([]);
  expect(out.reduce((m, a) => Math.max(m, a.bounce), 0)).toBeGreaterThan(30); // a closed room keeps rays going
});

it('arrival times grow with the bounce count', () => {
  const { out } = collect(small());
  const mean = (b: number) => {
    const xs = out.filter(a => a.bounce === b).map(a => a.time);
    return xs.reduce((s, x) => s + x, 0) / xs.length;
  };
  for (const b of [0, 5, 10, 20]) expect(mean(b + 5)).toBeGreaterThan(mean(b));
});

it('more absorption makes the energy fall off faster (less of it after 100 ms)', () => {
  const withAbsorption = (a: number) => {
    const m = { ...simConfig().materials.wall, absorption: [a, a, a] as Bands };
    return small({ furnishing: 0, materials: { wall: m, floor: m, ceiling: m } });
  };
  const lateShare = (config: SimConfig) => {
    const { out } = collect(config);
    const total = out.reduce((s, a) => s + a.energy[1], 0);
    const late = out.filter(a => a.time > 0.1).reduce((s, a) => s + a.energy[1], 0);
    return late / total;
  };
  expect(lateShare(withAbsorption(0.5))).toBeLessThan(lateShare(withAbsorption(0.1)));
});

it('is deterministic with a fixed seed (and by default)', () => {
  expect(collect(small(), 4).out).toEqual(collect(small(), 4).out);
  expect(collect(small()).out).toEqual(collect(small()).out);
});
