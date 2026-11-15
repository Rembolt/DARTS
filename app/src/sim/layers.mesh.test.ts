// Mesh layers on the real demo mesh. The mesh is git-ignored: skipped when the file is missing.
import { it, expect } from 'vitest';
import { existsSync, readFileSync } from 'node:fs';
import { simConfig } from '../config';
import { loadSim } from './load';

const MESH_PATH = process.env.MESH_PATH ?? 'C:/Users/marcv/princeton/MEI-princeton/server/cache/Ki9YdfpNKum-50k.obj';

it.skipIf(!existsSync(MESH_PATH))('loads the demo mesh layers without slowing the load', () => {
  const file = readFileSync(MESH_PATH);
  const obj = () => file.buffer.slice(file.byteOffset, file.byteOffset + file.byteLength) as ArrayBuffer;
  const runs = [0, 1, 2, 3, 4, 5].map(() => loadSim(obj(), simConfig()).ready);
  const best = runs.reduce((a, r) => (r.loadMs < a.loadMs ? r : a));
  expect(best.layers.reduce((n, l) => n + l.triangles, 0)).toBe(116_539);
  expect(best.lineLayers.length).toBe(best.lines.length / 6);
  const round = (v: number) => Math.round(v);
  process.stderr.write(
    `demo-mesh layers: ${JSON.stringify({
      loadMs: runs.map(r => round(r.loadMs)),
      timings: Object.fromEntries(Object.entries(best.timings).map(([k, v]) => [k, round(v)])),
      layers: best.layers.filter(l => l.triangles > 0),
      emptyLayers: best.layers.filter(l => l.triangles === 0).length,
    })}\n`,
  );
}, 120_000);
