// Listening tests on real meshes (docs/project/engine-fix.md section 2): prints echo time and late arrivals for a big
// commercial room, the house and a tiled washroom. Skipped when the cached meshes are missing. Estimates, not measurements.
import { it } from 'vitest';
import { existsSync, readFileSync } from 'node:fs';
import { simConfig } from '../config';
import { loadSim } from './load';
import { traceReverb } from './reverb';
import { firstTracedHit } from './layers';
import { addContribution, createHistogram, echoTimes } from './decay';
import { mulberry32 } from './sampling';
import type { Material, SimConfig, Vec3 } from './types';
import { MATERIALS as LIB } from '../../../server/src/shared/materials';

function load(path: string, over: Partial<SimConfig> = {}) {
  const f = readFileSync(path);
  const obj = f.buffer.slice(f.byteOffset, f.byteOffset + f.byteLength) as ArrayBuffer;
  const text = f.toString('utf8');
  const min = [Infinity, Infinity, Infinity], max = [-Infinity, -Infinity, -Infinity];
  for (const line of text.split('\n')) {
    if (!line.startsWith('v ')) continue;
    const [, x, y, z] = line.split(/\s+/).map(Number);
    const p = [x, z, -y];
    for (let k = 0; k < 3; k++) { min[k] = Math.min(min[k], p[k]); max[k] = Math.max(max[k], p[k]); }
  }
  return { state: loadSim(obj, { ...simConfig(), ...over }).state, min, max };
}

const H8: Vec3[] = Array.from({ length: 8 }, (_, i) => [Math.cos(i * Math.PI / 4), 0, Math.sin(i * Math.PI / 4)] as Vec3);

/** The most open enclosed spot: floor below within 3 m, ceiling above, all 8 level rays hit within 40 m. */
function openSpot(state: any, min: number[], max: number[], seed = 7): { p: Vec3; meanFree: number; ceil: number } {
  const rng = mulberry32(seed);
  let best = { p: [0, 0, 0] as Vec3, meanFree: 0, ceil: 0 };
  for (let i = 0; i < 4000; i++) {
    const x = min[0] + rng() * (max[0] - min[0]), y = min[1] + rng() * (max[1] - min[1]), z = min[2] + rng() * (max[2] - min[2]);
    const down = firstTracedHit(state, [x, y, z], [0, -1, 0]);
    if (!down || down.distance > 3) continue;
    const p: Vec3 = [x, y - down.distance + 1.5, z];
    const up = firstTracedHit(state, p, [0, 1, 0]);
    if (!up || up.distance < 0.5) continue;
    let sum = 0, ok = true;
    for (const d of H8) { const h = firstTracedHit(state, p, d); if (!h || h.distance > 40) { ok = false; break; } sum += h.distance; }
    if (ok && sum / 8 > best.meanFree) best = { p, meanFree: sum / 8, ceil: up.distance + 1.5 };
  }
  return best;
}

function listen(label: string, state: any, p: Vec3, extra = '') {
  const h = createHistogram();
  // Energy after 50 ms vs before: how much late sound there is to hear as echo.
  let early = 0, late = 0, last = 0;
  traceReverb(state, p, (t, e) => { addContribution(h, t, e); if (t < 0.05) early += e[1]; else late += e[1]; if (e[1] > 1e-4) last = Math.max(last, t); });
  const t60 = echoTimes(h).map(v => v.toFixed(2)).join('/');
  return `${label.padEnd(30)} T60 ${t60}  late/early ${(late / early).toFixed(2)}  last strong arrival ${(last * 1000).toFixed(0)} ms ${extra}`;
}

const NEEDED = ['zt8JiL9gipg-50k.obj', 'UJev7JJKZ6J-50k.obj', 'Ki9YdfpNKum-50k.obj', 'pi-Ki9YdfpNKum.json'].map(f => '../server/cache/' + f);
it.skipIf(!NEEDED.every(existsSync))('three listening tests', () => {
  const out: string[] = [];
  const C = '../server/cache/';
  // 1. Big commercial room.
  for (const id of ['zt8JiL9gipg', 'UJev7JJKZ6J']) {
    const { state, min, max } = load(C + id + '-50k.obj');
    const s = openSpot(state, min, max);
    out.push(listen(`commercial ${id} open spot`, state, s.p, `(mean wall dist ${s.meanFree.toFixed(1)} m, ceiling ${s.ceil.toFixed(1)} m)`));
  }
  // 2. The house: its most open spot.
  { const { state, min, max } = load(C + 'Ki9YdfpNKum-50k.obj');
    const s = openSpot(state, min, max);
    out.push(listen('house most open spot', state, s.p, `(mean wall dist ${s.meanFree.toFixed(1)} m, ceiling ${s.ceil.toFixed(1)} m)`)); }
  // 3. Tiled washroom: demo bathroom (5.8 m2) with tile walls, tile floor, plaster ceiling, no furniture.
  { const pi = JSON.parse(readFileSync(C + 'pi-Ki9YdfpNKum.json', 'utf8')); const model = pi.model ?? pi;
    const bath = model.rooms.filter((r: any) => r.classifications?.[0]?.label === 'Bathroom').sort((a: any, b: any) => b.area - a.area)[0];
    let sx = 0, sy = 0, n = 0; for (const e of bath.edges) { sx += e.a[0] + e.b[0]; sy += e.a[1] + e.b[1]; n += 2; }
    const x = sx / n, z = -(sy / n);
    const m = (k: keyof typeof LIB): Material => LIB[k] as unknown as Material;
    for (const [label, mats, furn] of [
      ['washroom, MVP drywall', undefined, 0.15],
      ['washroom, tiled', { wall: m('wall_tile'), floor: m('tile'), ceiling: m('plaster') }, 0],
    ] as const) {
      const { state } = load(C + 'Ki9YdfpNKum-50k.obj', { furnishing: furn, ...(mats ? { materials: mats } : {}) });
      const up = firstTracedHit(state, [x, -2, z], [0, 1, 0])!;
      out.push(listen(label + ` (${bath.area.toFixed(1)} m2)`, state, [x, -2 + up.distance + 1.5, z]));
    }
  }
  process.stderr.write('\n' + out.join('\n') + '\n');
}, 300000);
