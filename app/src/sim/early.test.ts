import { it, expect } from 'vitest';
import { simConfig } from '../config';
import { cosineHemisphere, traceEarly } from './early';
import { mulberry32 } from './sampling';
import { boxRoom, splitRoom } from './testMeshes';
import type { SimConfig, Vec3 } from './types';

const listener: Vec3 = [1, 1.5, 1.5];
const source: Vec3 = [3, 1.2, 1.0];
const small = (over: Partial<SimConfig> = {}): SimConfig => ({ ...simConfig(), raysPerTrace: 400, ...over });
const total = (r: ReturnType<typeof traceEarly>) =>
  r.contributions.reduce((sum, c) => sum + c.energy[0] + c.energy[1] + c.energy[2], 0);

it('in a closed room every ray hits every bounce, energies are positive and arrive after the direct sound', () => {
  const r = traceEarly(boxRoom(small()), listener, [{ position: source }], mulberry32(7));
  expect(Array.from(r.hitCount).every(h => h === 4)).toBe(true);
  expect(r.contributions.length).toBeGreaterThan(400);
  const directTime = Math.hypot(2, 0.3, 0.5) / 343;
  for (const c of r.contributions) {
    expect(c.energy.every(e => e >= 0 && Number.isFinite(e))).toBe(true);
    expect(c.arrival).toBeGreaterThanOrEqual(directTime - 1e-5);
  }
  expect(r.meanFreePath).toBeGreaterThan(0.5);
  expect(r.meanFreePath).toBeLessThan(4);
});

it('is deterministic with a fixed seed', () => {
  const a = traceEarly(boxRoom(small()), listener, [{ position: source }], mulberry32(3));
  const b = traceEarly(boxRoom(small()), listener, [{ position: source }], mulberry32(3));
  expect(b.contributions).toEqual(a.contributions);
});

it('more absorption gives less energy', () => {
  const soft = (a: number) => {
    const base = simConfig().materials;
    const m = { ...base.wall, absorption: [a, a, a] as [number, number, number] };
    return small({ materials: { wall: m, floor: m, ceiling: m } });
  };
  const hard = total(traceEarly(boxRoom(soft(0.05)), listener, [{ position: source }], mulberry32(1)));
  const absorbing = total(traceEarly(boxRoom(soft(0.6)), listener, [{ position: source }], mulberry32(1)));
  expect(absorbing).toBeLessThan(hard);
});

it('legs through a wall carry less energy than the same room without it, and none past maxLegWalls', () => {
  const src: Vec3 = [3, 1.5, 1.5];
  const open = total(traceEarly(boxRoom(small()), listener, [{ position: src }], mulberry32(1)));
  const walled = total(traceEarly(splitRoom(small()), listener, [{ position: src }], mulberry32(1)));
  expect(walled).toBeLessThan(open);
  expect(walled).toBeGreaterThan(0);
  const none = traceEarly(splitRoom(small({ maxLegWalls: 0 })), listener, [{ position: src }], mulberry32(1));
  // the listener's rays stay in its half, so every leg to the source crosses the dividing wall
  expect(none.contributions).toHaveLength(0);
});

it('stops rays that leave the building', () => {
  const r = traceEarly(splitRoom(small()), [10, 1.5, 1.5], [{ position: source }], mulberry32(1));
  expect(r.hitCount.filter(h => h > 0).length).toBeLessThan(r.rays / 2);
});

it('cosine-weighted directions are unit length and on the facing side', () => {
  const rng = mulberry32(5);
  const n: Vec3 = [0, 0.6, -0.8];
  for (let i = 0; i < 200; i++) {
    const d = cosineHemisphere(n, rng, [0, 0, 0]);
    expect(Math.hypot(...d)).toBeCloseTo(1, 6);
    expect(d[0] * n[0] + d[1] * n[1] + d[2] * n[2]).toBeGreaterThanOrEqual(0);
  }
});
