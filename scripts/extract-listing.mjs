// Streams costar-kit/data/residential-listing-features.jsonl for one modelId and writes
// server/cache/listing-<id>.json with only Home Design, Flooring and Interior Spaces lines,
// each trimmed to 60 characters and [A-Za-z0-9 -] so no free text reaches the LLM.
import { createReadStream, existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { createInterface } from 'node:readline';

const SECTIONS = new Set(['Home Design', 'Flooring', 'Interior Spaces']);
const clean = s => String(s).replace(/[^A-Za-z0-9 -]/g, '').trim().slice(0, 60);

const modelId = process.argv[2];
if (!modelId) {
  console.error('Usage: npm run extract-listing -- <modelId>');
  process.exit(1);
}

const repoRoot = resolve(import.meta.dirname, '..');
const csvPath = resolve(repoRoot, 'costar-kit/residential-listings.csv');
const featuresPath = resolve(repoRoot, 'costar-kit/data/residential-listing-features.jsonl');
const outPath = resolve(repoRoot, `server/cache/listing-${modelId}.json`);

let listingId = null;
if (existsSync(csvPath)) {
  const lines = readFileSync(csvPath, 'utf8').split(/\r?\n/);
  const headers = (lines[0] ?? '').split(',');
  const modelIdx = headers.indexOf('MatterportModelId');
  const listingIdx = headers.indexOf('ListingId');
  for (let i = 1; i < lines.length; i++) {
    const cols = lines[i].split(',');
    if (cols[modelIdx] === modelId) {
      listingId = cols[listingIdx] ?? null;
      break;
    }
  }
}

const facts = [];
if (listingId && existsSync(featuresPath)) {
  const rl = createInterface({ input: createReadStream(featuresPath), crlfDelay: Infinity });
  for await (const line of rl) {
    if (!line.includes(listingId)) continue;
    let rec;
    try {
      rec = JSON.parse(line);
    } catch {
      continue;
    }
    if (String(rec.id) !== String(listingId)) continue;
    const sections = Array.isArray(rec.sections) ? rec.sections : [];
    for (const sec of sections) {
      if (!SECTIONS.has(sec?.name)) continue;
      for (const item of sec.items ?? sec.values ?? []) {
        const c = clean(item);
        if (c) facts.push(c);
      }
    }
    break;
  }
}

mkdirSync(resolve(repoRoot, 'server/cache'), { recursive: true });
writeFileSync(outPath, JSON.stringify({ modelId, listingId, facts }, null, 2));
console.log(`Wrote ${facts.length} facts to ${outPath}`);
