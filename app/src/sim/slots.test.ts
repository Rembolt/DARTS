import { it, expect } from 'vitest';
import { simConfig } from '../config';
import type { Contribution, EarlyResult } from './early';
import { binSlots, drawnPaths, MIN_SLOT_DELAY, nearestSlot, PATH_START_OFFSET } from './slots';
import type { Vec3 } from './types';

const config = simConfig();
const c343 = config.speedOfSound;
const contribution = (over: Partial<Contribution>): Contribution => ({
  source: 0, energy: [1, 1, 1], arrival: 0, direction: config.slotDirections[0], ray: 0, bounce: 0, ...over,
});

it('picks the slot with the closest direction', () => {
  config.slotDirections.forEach((d, i) => expect(nearestSlot(d, config.slotDirections)).toBe(i));
});

it('bins early arrivals by direction with an energy-weighted delay, and late ones into lateEnergy', () => {
  const D = 3.43; // direct sound at 10 ms
  const r = binSlots(
    [
      contribution({ energy: [1, 1, 1], arrival: 0.02 }), // 10 ms after the direct sound
      contribution({ energy: [3, 3, 3], arrival: 0.03 }), // 20 ms
      contribution({ direction: config.slotDirections[5], energy: [0.5, 0.2, 0.1], arrival: 0.0100001 }),
      contribution({ energy: [2, 2, 2], arrival: 0.2 }), // 190 ms: late
    ],
    D,
    config,
  );
  expect(r.slots).toHaveLength(12);
  expect(r.slots[0].energy).toEqual([4, 4, 4]);
  expect(r.slots[0].delay).toBeCloseTo((1 * 0.01 + 3 * 0.02) / 4, 9);
  expect(r.slots[5].delay).toBe(MIN_SLOT_DELAY); // under 1 ms is raised to 1 ms
  expect(r.lateEnergy).toEqual([2, 2, 2]);
  expect(r.slots[1]).toEqual({ energy: [0, 0, 0], delay: MIN_SLOT_DELAY });
  expect(D / c343).toBeCloseTo(0.01);
});

it('draws the strongest paths, strongest first, starting 0.3 m from the listener', () => {
  const listener: Vec3 = [0, 0, 0];
  const source: Vec3 = [5, 0, 0];
  // ray 0: hits at (0, 2, 0) then (2, 2, 0); ray 1: hit at (0, 0, 1)
  const early: EarlyResult = {
    rays: 2, bounces: 2,
    hitPoints: new Float32Array([0, 2, 0, 2, 2, 0, 0, 0, 1, 0, 0, 0]),
    hitCount: new Uint8Array([2, 1]),
    meanFreePath: 1, averageAbsorption: [0.2, 0.2, 0.2],
    contributions: [
      contribution({ ray: 0, bounce: 1, direction: [0, 1, 0], energy: [1, 1, 1] }),
      contribution({ ray: 1, bounce: 0, direction: [0, 0, 1], energy: [0.1, 0.1, 0.1] }),
      contribution({ ray: 0, bounce: 0, direction: [0, 1, 0], energy: [0, 0, 0] }), // no energy: never drawn
    ],
  };
  const { paths, pathSource } = drawnPaths(early, listener, [source], 40);
  expect(Array.from(pathSource)).toEqual([0, 0, 0, 0, 0]);
  expect(Array.from(paths)).toEqual([
    0, PATH_START_OFFSET, 0, 0, 2, 0, // starts 0.3 m along the ray
    0, 2, 0, 2, 2, 0,
    2, 2, 0, 5, 0, 0, // last hit to the source
    0, 0, PATH_START_OFFSET, 0, 0, 1,
    0, 0, 1, 5, 0, 0,
  ].map(v => Math.fround(v)));
  expect(drawnPaths(early, listener, [source], 1).pathSource.length).toBe(3);
});
