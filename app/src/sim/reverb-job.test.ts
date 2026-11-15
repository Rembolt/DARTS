import { it, expect, vi } from 'vitest';
import { simConfig } from '../config';
import { reverbJob } from './reverb-job';
import { boxRoom } from './testMeshes';
import type { SimConfig } from './types';

vi.setConfig({ testTimeout: 20_000 }); // a traced reverb job; slow on a busy machine

const small = (over: Partial<SimConfig> = {}): SimConfig => ({ ...simConfig(), reverbRays: 300, ...over });
const msg = { type: 'reverb' as const, roomId: 'room-1', listener: [1, 1.5, 1.5] as [number, number, number] };

it('answers with the room id, a clamped echo time per band and a duration', () => {
  const out = reverbJob(boxRoom(small()), msg);
  expect(out.type).toBe('reverb');
  expect(out.roomId).toBe('room-1');
  expect(out.ms).toBeGreaterThanOrEqual(0);
  for (const t of out.echoTime) {
    expect(t).toBeGreaterThanOrEqual(0.2);
    expect(t).toBeLessThanOrEqual(2.5);
  }
});

it('rings longer in a harder room', () => {
  const soft = reverbJob(boxRoom(small({ furnishing: 0.3 })), msg).echoTime[1];
  const hard = reverbJob(boxRoom(small({ furnishing: 0 })), msg).echoTime[1];
  expect(hard).toBeGreaterThan(soft);
});

it('uses the fallback for a band it cannot fit', () => {
  // Fully absorbing surfaces: nothing after the first bounce, so no decay to fit.
  const dead = small({ furnishing: 1 });
  const out = reverbJob(boxRoom(dead), msg, [0.5, 0.6, 0.7]);
  expect(out.echoTime).toEqual([0.5, 0.6, 0.7]);
});
