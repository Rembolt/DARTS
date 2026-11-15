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
    mesh: { positions: new Float32Array(9), indices: new Uint32Array(3), materials: new Uint8Array(1), layers: new Uint8Array(1) },
    layers: [{ id: 'house', triangles: 1 }],
    lineLayers: new Uint8Array(1),
  };
  expect(ready.type).toBe('ready');
  expect(req.type).toBe('trace');
  expect(res.type).toBe('trace');
});

it('accepts the V2 messages', () => {
  const msgs: ToWorker[] = [
    { type: 'setMaterials', library: [{ absorption: [0.1, 0.1, 0.1], scattering: 0.1, blockingDb: [20, 30, 40] }], surfaces: [0, 0, 0, 0], furnishing: 0.15,
      roomSurfaces: [{ roomId: 'r1', surfaces: [0, 0, 0] }], roomFurnishing: [{ roomId: 'r1', value: 0 }], glassIndex: 0, doorIndex: 0 },
    { type: 'setRooms', rooms: [{ id: 'r1', floorY: 0, height: 2.7, polygon: [[0, 0], [1, 0], [1, 1]] }] },
    { type: 'loadOpenings', openings: [{ id: 'o1', kind: 'door', roomId: 'r1', corners: [[0, 0, 0], [1, 0, 0], [1, 2, 0], [0, 2, 0]], thickness: 0.1 }] },
    { type: 'setOpenings', closed: ['o1'] },
    { type: 'setLayers', traced: { type002: false } },
    { type: 'setQuality', raysPerTrace: 1000, bounces: 3, reverbRays: 800 },
    { type: 'measure', id: 2, point: [0, 1, 0], roomId: 'r1', sources: [{ id: 'indoor', position: [1, 1, 1] }] },
  ];
  const replies: FromWorker[] = [
    { type: 'roomsReady', rooms: [{ id: 'r1', triangles: 10 }], untagged: 2, exteriorWalls: 1, ms: 3 },
    { type: 'openingsReady', openings: [{ id: 'o1', meshClosed: false }], lines: new Float32Array(24), ms: 1 },
    { type: 'measure', id: 2, echoTime: [0.4, 0.5, 0.5], sources: [{ id: 'indoor', levelDb: [-6, -6, -7], walls: 0 }], ms: 200 },
  ];
  expect(msgs).toHaveLength(7);
  expect(replies).toHaveLength(3);
});
