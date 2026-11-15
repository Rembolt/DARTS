import { it, expect } from 'vitest';
import type { FromWorker, ToWorker, SourceResult } from './types';

it('accepts a trace round trip', () => {
  const req: ToWorker = { type: 'trace', id: 1, listener: [0, 1.5, 0], sources: [{ id: 'indoor', position: [1, 1, 1] }] };
  const src: SourceResult = {
    id: 'indoor', distance: 1.7, direct: [1, 1, 1], walls: 0,
    slots: Array.from({ length: 12 }, () => ({ energy: [0, 0, 0] as [number, number, number], delay: 0.001 })),
    lateEnergy: [0, 0, 0],
  };
  const res: FromWorker = {
    type: 'trace', id: 1, listener: [0, 1.5, 0], ms: 200, echoTimeEstimate: [0.4, 0.5, 0.5],
    sources: [src], paths: new Float32Array(0), pathSource: new Uint8Array(0),
  };
  const ready: FromWorker = {
    type: 'ready', lines: new Float32Array(6), boundsMin: [0, 0, 0], boundsMax: [1, 1, 1], triangles: 12, loadMs: 5,
    timings: { parse: 1, index: 2, materials: 1, lines: 1 },
    mesh: { positions: new Float32Array(9), indices: new Uint32Array(3), materials: new Uint8Array(1) },
  };
  expect(ready.type).toBe('ready');
  expect(req.type).toBe('trace');
  expect(res.type).toBe('trace');
});
