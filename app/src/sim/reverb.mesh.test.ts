// The reverb tracer on the real demo mesh. The mesh is git-ignored: skipped when the file is missing.
import { it, expect } from 'vitest';
import { existsSync, readFileSync } from 'node:fs';
import { simConfig } from '../config';
import { loadSim } from './load';
import { traceReverb, virtualSource } from './reverb';
import type { Bands, SimConfig, Vec3 } from './types';

const MESH_PATH = process.env.MESH_PATH ?? 'C:/Users/marcv/princeton/MEI-princeton/server/cache/Ki9YdfpNKum-50k.obj';
const LISTENER: Vec3 = [2, 1.5, 2]; // the same point as trace.mesh.test.ts

/**
 * A rough T60 for a sanity check only, NOT the app's decay code (that is decay.ts): 5 ms histogram, backward
 * (Schroeder) integration, time from −5 to −25 dB × 3. An estimate from unvalidated materials, not a measurement.
 */
function t60Estimate(arrivals: { time: number; energy: Bands }[]): Bands {
  const step = 0.005;
  const bins = Math.ceil(Math.max(...arrivals.map(a => a.time)) / step) + 1;
  return [0, 1, 2].map(k => {
    const hist = new Float64Array(bins);
    for (const a of arrivals) hist[Math.floor(a.time / step)] += a.energy[k];
    const curve = new Float64Array(bins);
    for (let i = bins - 1, sum = 0; i >= 0; i--) curve[i] = sum += hist[i];
    const db = (i: number) => 10 * Math.log10(curve[i] / curve[0]);
    const cross = (level: number) => {
      for (let i = 0; i < bins; i++) if (db(i) <= level) return i * step;
      return NaN;
    };
    return 3 * (cross(-25) - cross(-5));
  }) as Bands;
}

it.skipIf(!existsSync(MESH_PATH))('traces the reverb job on the demo mesh', () => {
  const file = readFileSync(MESH_PATH);
  const obj = file.buffer.slice(file.byteOffset, file.byteOffset + file.byteLength) as ArrayBuffer;
  const run = (config: SimConfig) => {
    const { state } = loadSim(obj, config);
    const arrivals: { time: number; energy: Bands }[] = [];
    traceReverb(state, LISTENER, (time, energy) => arrivals.push({ time, energy: [...energy] })); // warm-up
    arrivals.length = 0;
    const { rays, ms } = traceReverb(state, LISTENER, (time, energy) => arrivals.push({ time, energy: [...energy] }));
    return { rays, ms, arrivals, source: virtualSource(state, LISTENER) };
  };

  const r = run(simConfig());
  expect(r.rays).toBe(1500);
  expect(r.arrivals.length).toBeGreaterThan(1500);
  const t60 = t60Estimate(r.arrivals);
  for (const t of t60) {
    expect(t).toBeGreaterThan(0.05);
    expect(t).toBeLessThan(5);
  }
  const noFurnishing = t60Estimate(run({ ...simConfig(), furnishing: 0 }).arrivals);
  const round = (v: number) => Number(v.toFixed(3));
  process.stderr.write(
    `demo-mesh reverb: ${JSON.stringify({
      ms: Math.round(r.ms),
      arrivals: r.arrivals.length,
      virtualSource: r.source.map(round),
      t60Estimate: t60.map(round),
      t60EstimateWithoutFurnishing: noFurnishing.map(round),
    })}\n`,
  );
}, 120_000);
