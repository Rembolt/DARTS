// Integration test on the real demo mesh. The mesh is git-ignored: skipped when the file is missing.
import { it, expect } from 'vitest';
import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { simConfig } from '../config';
import { firstHit } from './geometry';
import { loadSim } from './load';
import { MATERIAL_IDS } from './materials';
import { trace } from './trace';
import type { Vec3 } from './types';

const MESH_PATH = process.env.MESH_PATH ?? 'C:/Users/marcv/princeton/MEI-princeton/server/cache/Ki9YdfpNKum-50k.obj';

// Found by a grid search over the mesh: a floor 1.5 m below, a ceiling about 1 m above, and walls 3.6 m or more away
// in all four level directions. The indoor source is 3 m along −z in the same open space, 0.3 m lower; the
// outdoor source is 25 m away along +z, outside the house.
const LISTENER: Vec3 = [2, 1.5, 2];
const INDOOR: Vec3 = [2, 1.2, -1];
const OUTDOOR: Vec3 = [2, 1.5, 27];

const round = (v: number, d = 4) => Number(v.toPrecision(d));

it.skipIf(!existsSync(MESH_PATH))('traces the demo mesh with the design settings', () => {
  const file = readFileSync(MESH_PATH);
  const { state } = loadSim(file.buffer.slice(file.byteOffset, file.byteOffset + file.byteLength) as ArrayBuffer, simConfig());

  const down = firstHit(state.index, LISTENER, [0, -1, 0])!;
  const up = firstHit(state.index, LISTENER, [0, 1, 0])!;
  expect(state.surfaceClass[down.triangle]).toBe(MATERIAL_IDS.floor);
  expect(state.surfaceClass[up.triangle]).toBe(MATERIAL_IDS.ceiling);
  expect(down.distance).toBeGreaterThan(1);
  expect(down.distance).toBeLessThan(2);

  const request = {
    type: 'trace' as const,
    id: 1,
    listener: LISTENER,
    sources: [
      { id: 'indoor', position: INDOOR },
      { id: 'outdoor', position: OUTDOOR },
    ],
  };
  trace(state, request); // warm-up (JIT)
  const runs = [0, 1, 2].map(() => trace(state, request));
  const r = runs.reduce((best, x) => (x.ms < best.ms ? x : best));

  const [indoor, outdoor] = r.sources;
  expect(indoor.walls).toBe(0);
  expect(indoor.direct[1]).toBeGreaterThan(0.9);
  expect(indoor.distance).toBeCloseTo(Math.hypot(3, 0.3), 3);
  expect(outdoor.walls).toBeGreaterThanOrEqual(1);
  expect(outdoor.direct[1]).toBeLessThan(indoor.direct[1]);
  for (const s of r.sources) {
    expect(s.slots).toHaveLength(12);
    for (const slot of s.slots) {
      expect(slot.energy.every(e => e >= 0 && Number.isFinite(e))).toBe(true);
      expect(slot.delay).toBeGreaterThanOrEqual(0.001);
    }
  }
  const early = indoor.slots.reduce((a, x) => a + x.energy[1], 0);
  expect(early).toBeGreaterThan(0.05); // reflections add a noticeable share of the direct sound
  expect(early).toBeLessThan(20);
  expect(r.echoTimeEstimate.every(t => t >= 0.2 && t <= 2.5)).toBe(true);
  expect(r.pathSource.length).toBeGreaterThan(0);

  const summary = {
    ms: runs.map(x => Math.round(x.ms)),
    timings: Object.fromEntries(Object.entries(r.timings).map(([k, v]) => [k, Math.round(v)])),
    echoTimeEstimate: r.echoTimeEstimate.map(t => round(t, 3)),
    segments: r.pathSource.length,
    sources: r.sources.map(s => ({
      id: s.id,
      distance: round(s.distance),
      direct: s.direct.map(v => round(v, 3)),
      walls: s.walls,
      slots: s.slots.map(x => ({ energy: x.energy.map(v => round(v, 2)), delayMs: round(x.delay * 1000, 3) })),
      lateEnergy: s.lateEnergy.map(v => round(v, 3)),
    })),
  };
  // Vitest hides console output from passing tests here; print to stderr so the timing shows in the run.
  process.stderr.write(`demo-mesh trace: ${JSON.stringify(summary)}\n`);
  if (process.env.TRACE_SUMMARY) writeFileSync(process.env.TRACE_SUMMARY, JSON.stringify(summary, null, 1));
}, 60_000);
