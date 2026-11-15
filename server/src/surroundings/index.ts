// What is around a property (design section 6.2): one Vexcel detection call per property, read into an area class
// and located sources, cached in `cacheDir/surroundings-<modelId>.json`. When Vexcel can't answer, the labelled
// fallback by property type, not cached, so the next call tries again.
import { mkdirSync, readFileSync, renameSync, rmSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { MODEL_ID_PATTERN, type AreaSummary, type IndexRow, type LocatedSource } from '../shared/contract.js';
import { LOOP_FACADE_DB, ROAD_LEVEL_10M, airportsNear, classifyArea, fallbackArea, lineLevelDb, sumDb } from './area.js';
import { detectBody, readDetections, type Detections } from './detect.js';

/** Never rejects: falls back to the property type inside. */
export type Surroundings = { get(row: IndexRow): Promise<AreaSummary> };

const DETECT_URL = 'https://api.vexcelgroup.com/v2/elements/detect';
const TIMEOUT_MS = 15_000;
/** How long an answer with no detections is believed before asking again. */
const NOTHING_FOUND_MS = 30 * 60 * 1000;
/** Waits before each retry after a 429: three retries, then the fallback. */
const BACKOFF_MS = [1000, 2000, 4000];
/** Located sources are kept within this distance. */
const LOCATED_RANGE_M = 300;
/** The nearest road is a located source within this distance; farther away the background loop covers it. */
const ROAD_RANGE_M = 100;
/** Level at 10 m of each located line source. */
const LEVEL_AT_10M = { highway: 80, railway: 85 } as const;

/** What the cache file holds: the reading, so retuned rules apply to cached properties, and the summary it gave. */
type CacheFile = { reading: Detections; summary: AreaSummary };

/** The summary from a reading, with the current rules. */
export function summarise(reading: Detections, row: IndexRow): AreaSummary {
  const areaClass = classifyArea(reading.counts);
  const located: LocatedSource[] = [];
  for (const kind of ['highway', 'railway'] as const) {
    const hit = reading.nearest[kind];
    if (hit !== undefined && hit.distanceM <= LOCATED_RANGE_M) {
      located.push({ kind, distanceM: hit.distanceM, bearingDeg: hit.bearingDeg, levelDb: lineLevelDb(LEVEL_AT_10M[kind], hit.distanceM) });
    }
  }
  const road = reading.nearest.road;
  if (road !== undefined && road.distanceM <= ROAD_RANGE_M) {
    located.push({ kind: 'road', distanceM: road.distanceM, bearingDeg: road.bearingDeg, levelDb: lineLevelDb(ROAD_LEVEL_10M[areaClass], road.distanceM) });
  }
  located.push(...airportsNear(row.lat, row.lon));
  return {
    areaClass,
    source: 'vexcel',
    counts: reading.counts,
    located,
    roadBearingDeg: reading.nearest.road?.bearingDeg ?? null,
    facadeDb: sumDb([LOOP_FACADE_DB[areaClass], ...located.map(s => s.levelDb)]),
    imageryDate: reading.imageryDate,
  };
}

const isReading = (v: unknown): v is Detections =>
  typeof v === 'object' && v !== null &&
  typeof (v as Detections).counts === 'object' && (v as Detections).counts !== null &&
  typeof (v as Detections).nearest === 'object' && (v as Detections).nearest !== null;

/** Lane 0's factory: the real thing with real waits and the default time limit. */
export function createSurroundings(options: {
  cacheDir: string;
  env: Record<string, string | undefined>;
  fetchFn?: typeof fetch;
}): Surroundings {
  return createSurroundingsWith(options);
}

/** `createSurroundings` with the waits, time limit and log injectable, for tests. */
export function createSurroundingsWith(options: {
  cacheDir: string;
  env: Record<string, string | undefined>;
  fetchFn?: typeof fetch;
  sleep?: (ms: number) => Promise<void>;
  timeoutMs?: number;
  log?: (message: string) => void;
}): Surroundings {
  const {
    cacheDir, env, fetchFn = fetch, timeoutMs = TIMEOUT_MS,
    sleep = (ms: number) => new Promise<void>(resolve => setTimeout(resolve, ms)),
    log = (message: string) => console.warn(message),
  } = options;
  const inFlight = new Map<string, Promise<AreaSummary>>();
  /** Properties Vexcel answered with no detections, and when. In memory only: a restart asks again. */
  const nothingFound = new Map<string, number>();

  const cachePath = (modelId: string) => join(cacheDir, `surroundings-${modelId}.json`);

  function readCache(modelId: string): Detections | null {
    try {
      const parsed = JSON.parse(readFileSync(cachePath(modelId), 'utf8')) as Partial<CacheFile>;
      return isReading(parsed.reading) ? parsed.reading : null;
    } catch {
      return null;   // missing or corrupt: a miss
    }
  }

  function writeCache(modelId: string, file: CacheFile): void {
    const tmp = join(cacheDir, `.surroundings-${modelId}.json.part`);
    try {
      mkdirSync(cacheDir, { recursive: true });
      writeFileSync(tmp, JSON.stringify(file));
      renameSync(tmp, cachePath(modelId));
    } catch (err) {
      rmSync(tmp, { force: true });
      log(`surroundings: could not cache ${modelId}: ${err instanceof Error ? err.message : String(err)}`);
    }
  }

  /** The detection answer, or a reason it is not there. The key goes in the header only. */
  async function detect(key: string, row: IndexRow): Promise<{ answer: unknown } | { why: string }> {
    const body = JSON.stringify(detectBody(row.lat, row.lon));
    for (let attempt = 0; ; attempt++) {
      let res: Response;
      try {
        res = await fetchFn(DETECT_URL, {
          method: 'POST',
          headers: { 'X-API-KEY': key, 'Content-Type': 'application/json' },
          body,
          signal: AbortSignal.timeout(timeoutMs),
        });
        if (res.status === 429) {
          const wait = BACKOFF_MS[attempt];
          if (wait === undefined) return { why: 'HTTP 429 after retries' };
          await sleep(wait);
          continue;
        }
        if (!res.ok) return { why: `HTTP ${res.status}` };
        return { answer: await res.json() };
      } catch (err) {
        const name = err instanceof Error ? err.name : 'Error';
        return { why: name === 'TimeoutError' || name === 'AbortError' ? `timed out after ${timeoutMs} ms` : `${name}: no answer` };
      }
    }
  }

  async function fetchArea(row: IndexRow): Promise<AreaSummary> {
    const key = env.VEXCEL_API_KEY?.trim();
    if (!key) return fallbackArea(row);
    const got = await detect(key, row);
    if ('why' in got) {
      log(`surroundings: Vexcel detection for ${row.modelId} failed (${got.why}); using the property type`);
      return fallbackArea(row);
    }
    const features = (got.answer as { features?: unknown } | null)?.features;
    if (!Array.isArray(features) || features.length === 0) {
      log(`surroundings: Vexcel found nothing around ${row.modelId}; using the property type`);
      // A real answer, not an outage: asking again on every card and tour load would cost 2 s each time.
      nothingFound.set(row.modelId, Date.now());
      return fallbackArea(row);
    }
    const reading = readDetections(got.answer, row.lat, row.lon);
    const summary = summarise(reading, row);
    writeCache(row.modelId, { reading, summary });
    return summary;
  }

  return {
    async get(row) {
      try {
        if (!MODEL_ID_PATTERN.test(row.modelId) || !Number.isFinite(row.lat) || !Number.isFinite(row.lon)) {
          return fallbackArea(row);
        }
        const cached = readCache(row.modelId);
        if (cached !== null) return summarise(cached, row);
        const empty = nothingFound.get(row.modelId);
        if (empty !== undefined && Date.now() - empty < NOTHING_FOUND_MS) return fallbackArea(row);
        let pending = inFlight.get(row.modelId);
        if (pending === undefined) {
          pending = fetchArea(row).finally(() => inFlight.delete(row.modelId));
          inFlight.set(row.modelId, pending);
        }
        return await pending;
      } catch (err) {
        log(`surroundings: ${row.modelId}: ${err instanceof Error ? err.message : String(err)}; using the property type`);
        try {
          return fallbackArea(row);
        } catch {
          return { areaClass: 'residential', source: 'property_type', counts: {}, located: [], roadBearingDeg: null, facadeDb: 50, imageryDate: null };
        }
      }
    },
  };
}
