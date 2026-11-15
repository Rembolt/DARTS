import { describe, it, expect, vi } from 'vitest';
import { formatSimReady, startSim, type WorkerLike } from './client';
import { simConfig } from '../config';

it('formats the ready summary for the header', () => {
  expect(formatSimReady({ triangles: 116539, lines: new Float32Array(23456 * 6), loadMs: 412.4 }))
    .toBe('Mesh: 116,539 triangles · 23,456 lines · loaded in 412 ms');
});

/** A fake worker: an EventTarget that records what is posted to it. */
function fakeWorker() {
  const target = new EventTarget();
  const posted: { msg: unknown; transfer: unknown }[] = [];
  const worker = Object.assign(target, {
    postMessage: (msg: unknown, transfer: unknown) => posted.push({ msg, transfer }),
    terminate: vi.fn(),
  }) as unknown as WorkerLike & EventTarget & { terminate: ReturnType<typeof vi.fn> };
  const reply = (data: unknown) => target.dispatchEvent(Object.assign(new Event('message'), { data }));
  return { worker, posted, reply, target };
}

describe('startSim', () => {
  it('transfers the mesh and resolves with the ready message', async () => {
    const fake = fakeWorker();
    const sim = startSim(() => fake.worker);
    const obj = new ArrayBuffer(8);
    const p = sim.load(obj, simConfig());
    expect(fake.posted[0].transfer).toEqual([obj]);
    fake.reply({ type: 'ready', triangles: 1, lines: new Float32Array(0), loadMs: 1 });
    await expect(p).resolves.toMatchObject({ type: 'ready', triangles: 1 });
  });

  it("rejects with the worker's error message", async () => {
    const fake = fakeWorker();
    const p = startSim(() => fake.worker).load(new ArrayBuffer(8), simConfig());
    fake.reply({ type: 'error', message: 'Mesh has no triangles' });
    await expect(p).rejects.toThrow('Mesh has no triangles');
  });

  it('rejects when a reply cannot be read (messageerror)', async () => {
    const fake = fakeWorker();
    const p = startSim(() => fake.worker).load(new ArrayBuffer(8), simConfig());
    fake.target.dispatchEvent(new Event('messageerror'));
    await expect(p).rejects.toThrow('the worker sent a message the page could not read');
  });

  it('rejects when the worker crashes', async () => {
    const fake = fakeWorker();
    const p = startSim(() => fake.worker).load(new ArrayBuffer(8), simConfig());
    fake.target.dispatchEvent(Object.assign(new Event('error'), { message: 'out of memory' }));
    await expect(p).rejects.toThrow('out of memory');
  });

  it('keeps one worker that can be stopped', () => {
    const fake = fakeWorker();
    const sim = startSim(() => fake.worker);
    expect(sim.worker).toBe(fake.worker);
    sim.terminate();
    expect(fake.worker.terminate).toHaveBeenCalledTimes(1);
  });
});
