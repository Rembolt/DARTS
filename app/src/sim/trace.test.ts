import { it, expect } from 'vitest';
import { simConfig } from '../config';
import { mulberry32 } from './sampling';
import { boxRoom, splitRoom } from './testMeshes';
import { echoTimeEstimate, trace, type TraceRequest } from './trace';

const request: TraceRequest = {
  type: 'trace',
  id: 7,
  listener: [1, 1.5, 1.5],
  sources: [
    { id: 'indoor', position: [3, 1.2, 1] },
    { id: 'outdoor', position: [30, 1.5, 1.5] },
  ],
};
const config = { ...simConfig(), raysPerTrace: 500 };

it('returns the trace message: one result per source with 12 slots, sane energies and delays', () => {
  const r = trace(boxRoom(config), request);
  expect(r.type).toBe('trace');
  expect(r.id).toBe(7);
  expect(r.listener).toEqual(request.listener);
  expect(r.ms).toBeGreaterThanOrEqual(0);
  expect(r.sources.map(s => s.id)).toEqual(['indoor', 'outdoor']);
  const [indoor, outdoor] = r.sources;
  expect(indoor.direct).toEqual([1, 1, 1]);
  expect(indoor.walls).toBe(0);
  expect(indoor.distance).toBeCloseTo(Math.hypot(2, 0.3, 0.5));
  expect(outdoor.walls).toBe(1);
  for (const s of r.sources) {
    expect(s.slots).toHaveLength(12);
    for (const slot of s.slots) {
      expect(slot.energy.every(e => e >= 0)).toBe(true);
      expect(slot.delay).toBeGreaterThanOrEqual(0.001);
      expect(slot.delay).toBeLessThanOrEqual(config.earlyWindow);
    }
    expect(s.lateEnergy.every(e => e >= 0)).toBe(true);
  }
  expect(indoor.slots.some(s => s.energy[1] > 0)).toBe(true);
  // the outdoor source is heard through the room's wall: weaker than the indoor one
  const sum = (s: typeof indoor) => s.slots.reduce((a, x) => a + x.energy[1], 0);
  expect(sum(outdoor)).toBeLessThan(sum(indoor));
  expect(r.echoTimeEstimate.every(t => t >= 0.2 && t <= 2.5)).toBe(true);
  expect(r.paths.length).toBe(r.pathSource.length * 6);
  expect(r.pathSource.length).toBeGreaterThan(0);
});

it('is deterministic: the same request gives the same result', () => {
  const a = trace(boxRoom(config), request);
  const b = trace(boxRoom(config), request, mulberry32(1));
  expect(b.sources).toEqual(a.sources);
  expect(b.paths).toEqual(a.paths);
});

it('a dividing wall lowers the indoor source on the far side', () => {
  const far = { ...request, sources: [{ id: 'indoor', position: [3, 1.5, 1.5] as [number, number, number] }] };
  const open = trace(boxRoom(config), far).sources[0];
  const walled = trace(splitRoom(config), far).sources[0];
  expect(walled.walls).toBe(1);
  expect(walled.direct[1]).toBeLessThan(open.direct[1]);
  const sum = (s: typeof open) => s.slots.reduce((a, x) => a + x.energy[1], 0);
  expect(sum(walled)).toBeLessThan(sum(open));
});

it('the echo time estimate follows 0.04 × mean free path / −ln(1 − absorption), clamped', () => {
  expect(echoTimeEstimate(3, [0.2, 0.2, 0.2])[0]).toBeCloseTo((0.04 * 3) / -Math.log(0.8));
  expect(echoTimeEstimate(0.1, [0.9, 0.9, 0.9])).toEqual([0.2, 0.2, 0.2]);
  expect(echoTimeEstimate(50, [0.01, 0.01, 0.01])).toEqual([2.5, 2.5, 2.5]);
  expect(echoTimeEstimate(0, [0, 0, 0])).toEqual([0.2, 0.2, 0.2]);
});
