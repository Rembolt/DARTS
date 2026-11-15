// Builds the property search index, server/cache/index.json (git-ignored), from the CoStar kit.
// Usage: npm run build-index
//
// Streams costar-kit/data/residential-listings.jsonl and commercial-property.jsonl line by line (never read whole),
// joins each record to its Matterport model ids through the two starter CSVs, and writes one row per model id.
// Free text (remarks, notes) is never copied. The file is written to a temp name in the same folder, then renamed.
import { createReadStream, existsSync, mkdirSync, readFileSync, renameSync, rmSync, writeFileSync } from 'node:fs';
import { createInterface } from 'node:readline';
import { join, resolve } from 'node:path';
import { tsImport } from 'tsx/esm/api';

const root = resolve(import.meta.dirname, '..');
const kit = join(root, 'costar-kit');
const inputs = {
  enums: join(kit, 'schemas', 'enums.json'),
  homeCsv: join(kit, 'residential-listings.csv'),
  commercialCsv: join(kit, 'commercial-properties.csv'),
  homes: join(kit, 'data', 'residential-listings.jsonl'),
  commercial: join(kit, 'data', 'commercial-property.jsonl'),
};
const cacheDir = join(root, 'server', 'cache');
const out = join(cacheDir, 'index.json');
const MODEL_ID_PATTERN = /^[A-Za-z0-9]{11}$/;

const missing = Object.values(inputs).filter((path) => !existsSync(path));
if (missing.length > 0) {
  console.error(`build-index: missing input file(s):\n  ${missing.join('\n  ')}\nThe CoStar kit data goes in costar-kit/data/.`);
  process.exit(1);
}

const { homeRow, commercialRow, mergeRows } = await tsImport('../server/src/search/rows.ts', import.meta.url);

/** CSV key column → valid model ids, plus the CSV's address per key, for a sanity check. Plain comma split: no quoted fields. */
function readCsv(path, keyColumn) {
  const lines = readFileSync(path, 'utf8').split(/\r?\n/);
  const header = lines[0].split(',');
  const key = header.indexOf(keyColumn);
  const id = header.indexOf('MatterportModelId');
  const addr = header.indexOf('Address');
  const ids = new Map();
  const addresses = new Map();
  let invalid = 0;
  for (const line of lines.slice(1)) {
    if (line.trim() === '') continue;
    const cells = line.split(',');
    const k = cells[key]?.trim();
    const modelId = cells[id]?.trim();
    if (!k) continue;
    addresses.set(k, cells[addr]?.trim() ?? '');
    if (!MODEL_ID_PATTERN.test(modelId ?? '')) {
      invalid++;
      continue;
    }
    const list = ids.get(k) ?? [];
    if (!list.includes(modelId)) list.push(modelId);
    ids.set(k, list);
  }
  return { ids, addresses, invalid };
}

async function* records(path) {
  const lines = createInterface({ input: createReadStream(path, 'utf8'), crlfDelay: Infinity });
  for await (const line of lines) if (line.trim() !== '') yield JSON.parse(line);
}

const started = Date.now();
const enums = JSON.parse(readFileSync(inputs.enums, 'utf8'));
const homeCsv = readCsv(inputs.homeCsv, 'ListingId');
const commercialCsv = readCsv(inputs.commercialCsv, 'PropertyId');

const rows = [];
let noCoordinates = 0;
let noModelId = 0;
let rentals = 0;
let addressMismatch = 0;
const seenHomeKeys = new Set();
const seenCommercialKeys = new Set();

for await (const record of records(inputs.homes)) {
  const key = String(record.id);
  seenHomeKeys.add(key);
  const modelIds = homeCsv.ids.get(key) ?? [];
  if (modelIds.length === 0) {
    noModelId++;
    continue;
  }
  const built = modelIds.map((modelId) => homeRow(record, enums, modelId));
  if (built[0] === null) {
    noCoordinates += modelIds.length;
    continue;
  }
  if (built[0].facts.includes('for rent')) rentals++;
  rows.push(...built);
}

for await (const record of records(inputs.commercial)) {
  const key = String(record.id);
  seenCommercialKeys.add(key);
  const modelIds = commercialCsv.ids.get(key) ?? [];
  if (modelIds.length === 0) {
    noModelId++;
    continue;
  }
  const built = commercialRow(record, modelIds, enums);
  if (built.length === 0) {
    noCoordinates += modelIds.length;
    continue;
  }
  if (built[0].address !== commercialCsv.addresses.get(key)) addressMismatch++;
  rows.push(...built);
}

// CSV ids whose key has no record in the data: counted as dropped, never invented.
let noRecord = 0;
for (const [key, list] of homeCsv.ids) if (!seenHomeKeys.has(key)) noRecord += list.length;
for (const [key, list] of commercialCsv.ids) if (!seenCommercialKeys.has(key)) noRecord += list.length;

const homeIds = new Set([...homeCsv.ids.values()].flat());
const sharedIds = [...commercialCsv.ids.values()].flat().filter((id) => homeIds.has(id)).length;

const merged = mergeRows(rows);
const duplicates = rows.length - merged.length;

mkdirSync(cacheDir, { recursive: true });
const temp = join(cacheDir, `.index.json.${process.pid}.tmp`);
try {
  writeFileSync(temp, JSON.stringify(merged));
  renameSync(temp, out);
} catch (error) {
  rmSync(temp, { force: true });
  throw error;
}

const dropped = noCoordinates + noModelId + noRecord;
console.log(`wrote ${merged.length} rows, dropped ${dropped} (no coordinates ${noCoordinates}, no model id ${noModelId}${noRecord ? `, no record ${noRecord}` : ''})`);
console.log(
  `  ${duplicates} duplicate id rows merged, ${sharedIds} ids on both lists, ${rentals} rental listings (price left unlisted), ` +
    `${addressMismatch} commercial addresses differ from the CSV; ${((Date.now() - started) / 1000).toFixed(1)} s → ${out}`,
);
