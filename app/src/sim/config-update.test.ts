import { expect, it } from 'vitest';
import { simConfig } from '../config';
import { applyConfig } from './config-update';
import { reverbJob } from './reverb-job';
import { boxRoom } from './testMeshes';
import { trace } from './trace';

const request = { type: 'trace' as const, id: 1, listener: [1, 1.5, 1.5] as [number, number, number], sources: [{ id: 'indoor', position: [3, 1.2, 1] as [number, number, number] }] };
const tile = { absorption: [0.01, 0.01, 0.02] as [number, number, number], scattering: 0.05, blockingDb: [40, 50, 55] as [number, number, number] };
const carpet = { absorption: [0.08, 0.35, 0.6] as [number, number, number], scattering: 0.3, blockingDb: [35, 45, 50] as [number, number, number] };

it('a harder floor makes the room ring longer than a soft one', () => {
  const state = boxRoom({ ...simConfig(), raysPerTrace: 500, reverbRays: 400 });
  applyConfig(state, { type: 'config', materials: { floor: tile, wall: tile, ceiling: tile } });
  const hard = trace(state, request).echoTimeEstimate[1];
  applyConfig(state, { type: 'config', materials: { floor: carpet, wall: carpet, ceiling: carpet } });
  const soft = trace(state, request).echoTimeEstimate[1];
  expect(hard).toBeGreaterThan(soft);
});

it('keeps what the message leaves out, and clamps wild values', () => {
  const state = boxRoom(simConfig());
  const walls = state.config.materials.wall;
  applyConfig(state, { type: 'config', furnishing: 9, raysPerTrace: 1, bounces: 99 });
  expect(state.config.materials.wall).toBe(walls);
  expect(state.config.furnishing).toBe(0.6);
  expect(state.config.raysPerTrace).toBe(100);
  expect(state.config.bounces).toBe(8);
});

it('more furnishing shortens the echo of a reverb job', () => {
  const state = boxRoom({ ...simConfig(), reverbRays: 400 });
  applyConfig(state, { type: 'config', furnishing: 0 });
  const bare = reverbJob(state, { type: 'reverb', roomId: 'a', listener: [1, 1.5, 1.5] }).echoTime[1];
  applyConfig(state, { type: 'config', furnishing: 0.4 });
  const full = reverbJob(state, { type: 'reverb', roomId: 'a', listener: [1, 1.5, 1.5] }).echoTime[1];
  expect(full).toBeLessThan(bare);
});
