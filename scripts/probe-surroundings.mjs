// Prints the surroundings (area class, counts, located sources) for model ids, to tune the rules in
// server/src/surroundings/area.ts against places you can judge from a map (plan Task C4).
//
//   node scripts/probe-surroundings.mjs <modelId>...            asks a running server: GET /api/surroundings/:id
//        (PROBE_BASE=http://localhost:8793 to use another port; default http://localhost:8787)
//   npx tsx scripts/probe-surroundings.mjs --direct <modelId>...  no server: rows from server/cache/index.json,
//        the surroundings module called directly with the key from .env
//   add --fresh (direct only) to delete that id's cached surroundings first, so Vexcel is asked again.
import { existsSync, readFileSync, rmSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const CACHE = join(ROOT, 'server', 'cache');
const ID = /^[A-Za-z0-9]{11}$/;

const args = process.argv.slice(2);
const direct = args.includes('--direct');
const fresh = args.includes('--fresh');
const ids = args.filter(a => !a.startsWith('--'));
if (ids.length === 0 || ids.some(id => !ID.test(id))) {
  console.error('Usage: node scripts/probe-surroundings.mjs [--direct [--fresh]] <modelId>...');
  process.exit(1);
}

function show(id, row, area) {
  const where = row ? `${row.address}, ${row.city} (${row.kind}, ${row.propertyType})` : '';
  const counts = Object.entries(area.counts).map(([k, v]) => `${k} ${v}`).join(', ') || 'none';
  const located = area.located
    .map(s => `${s.kind} ${Math.round(s.distanceM)} m at ${Math.round(s.bearingDeg)}° → ${s.levelDb.toFixed(1)} dB`)
    .join('; ') || 'none';
  console.log(`${id}  ${where}`);
  console.log(`  class ${area.areaClass} (${area.source}), facade ${area.facadeDb.toFixed(1)} dB, imagery ${area.imageryDate ?? '-'}`);
  console.log(`  counts: ${counts}`);
  console.log(`  located: ${located}; road bearing ${area.roadBearingDeg === null ? '-' : Math.round(area.roadBearingDeg) + '°'}`);
}

if (direct) {
  const indexPath = join(CACHE, 'index.json');
  if (!existsSync(indexPath)) {
    console.error('server/cache/index.json is missing: run `npm run build-index` first.');
    process.exit(1);
  }
  const rows = new Map(JSON.parse(readFileSync(indexPath, 'utf8')).map(r => [r.modelId, r]));
  const { createSurroundings } = await import(pathToFileURL(join(ROOT, 'server', 'src', 'surroundings', 'index.ts')).href);
  const { loadEnv } = await import(pathToFileURL(join(ROOT, 'server', 'src', 'env.ts')).href);
  const surroundings = createSurroundings({ cacheDir: CACHE, env: loadEnv(join(ROOT, '.env')) });
  for (const id of ids) {
    const row = rows.get(id);
    if (!row) { console.log(`${id}  not in the index`); continue; }
    if (fresh) rmSync(join(CACHE, `surroundings-${id}.json`), { force: true });
    const started = Date.now();
    const area = await surroundings.get(row);   // one at a time: Vexcel asks for few parallel requests
    show(id, row, area);
    console.log(`  ${Date.now() - started} ms`);
  }
} else {
  const base = process.env.PROBE_BASE ?? 'http://localhost:8787';
  for (const id of ids) {
    const res = await fetch(`${base}/api/surroundings/${id}`);
    const body = await res.json();
    if (!res.ok) { console.log(`${id}  HTTP ${res.status}: ${body.error ?? JSON.stringify(body)}`); continue; }
    show(id, null, body);
  }
}
