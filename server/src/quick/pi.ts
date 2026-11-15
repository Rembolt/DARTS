import { existsSync, mkdirSync, readFileSync, renameSync, rmSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { NotPossibleError } from '../errors.js';
import { notPossible } from '../shared/contract.js';

const GRAPHQL_URL = 'https://api.matterport.com/api/models/graph';

/** Field names checked against the live API on Ki9YdfpNKum (Nov 15): `boundary` is one object holding `edges`. */
const PI_QUERY = `query Pi($id: ID!) { model(id: $id) { name state visibility
  assets { meshes { format resolution status } }
  rooms { id label keywords classifications { label confidence } floor { id }
    dimensionEstimates(units: metric) { area width depth height lowerElevation }
    boundary { edges { type thickness vertices { position { x y } }
      openings { id type width height relativeCenter lowerElevation } } } } } }`;

export type PiOpening = { id: string; type: string; width: number; height: number; relativeCenter: number; lowerElevation: number | null };
export type PiEdge = { type: 'wall' | 'invisible'; a: [number, number]; b: [number, number]; thickness: number; openings: PiOpening[] };

/** One Property Intelligence room, in metres. 0 means missing (PI answers 0.0 for an unknown height). */
export type PiRoom = {
  id: string;
  label: string;
  /** Highest confidence first. */
  classifications: { label: string; confidence: number }[];
  floorId: string;
  keywords: string[];
  area: number; width: number; depth: number; height: number;
  /** The room's floor height in the PI frame. */
  lowerElevation: number | null;
  edges: PiEdge[];
};
export type PiModel = { modelId: string; name: string | null; active: boolean; isPublic: boolean; hasMesh: boolean; rooms: PiRoom[] };
/** Rejects with a NotPossibleError. */
export type PiSource = { get(modelId: string): Promise<PiModel> };

type CacheFile = { notFound: true } | { model: PiModel };

const num = (v: unknown): number => (typeof v === 'number' && Number.isFinite(v) ? v : 0);
const numOrNull = (v: unknown): number | null => (typeof v === 'number' && Number.isFinite(v) ? v : null);
const str = (v: unknown): string => (typeof v === 'string' ? v : '');
const list = (v: unknown): unknown[] => (Array.isArray(v) ? v : []);
const obj = (v: unknown): Record<string, unknown> => (typeof v === 'object' && v !== null ? (v as Record<string, unknown>) : {});

function point(v: unknown): [number, number] {
  const p = obj(obj(v).position);
  return [num(p.x), num(p.y)];
}

function normaliseRoom(raw: unknown): PiRoom {
  const r = obj(raw);
  const dims = obj(r.dimensionEstimates);
  const edges: PiEdge[] = [];
  for (const e of list(obj(r.boundary).edges)) {
    const edge = obj(e);
    const vertices = list(edge.vertices);
    if (vertices.length !== 2) continue;
    edges.push({
      type: edge.type === 'wall' ? 'wall' : 'invisible',
      a: point(vertices[0]),
      b: point(vertices[1]),
      thickness: num(edge.thickness),
      openings: list(edge.openings).map(o => {
        const op = obj(o);
        return {
          id: str(op.id), type: str(op.type), width: num(op.width), height: num(op.height),
          relativeCenter: num(op.relativeCenter), lowerElevation: numOrNull(op.lowerElevation),
        };
      }),
    });
  }
  return {
    id: str(r.id),
    label: str(r.label).trim(),
    classifications: list(r.classifications)
      .map(c => ({ label: str(obj(c).label), confidence: num(obj(c).confidence) }))
      .filter(c => c.label !== '')
      .sort((x, y) => y.confidence - x.confidence),
    floorId: str(obj(r.floor).id),
    keywords: list(r.keywords).filter((k): k is string => typeof k === 'string'),
    area: num(dims.area), width: num(dims.width), depth: num(dims.depth), height: num(dims.height),
    lowerElevation: numOrNull(dims.lowerElevation),
    edges,
  };
}

function normaliseModel(modelId: string, raw: Record<string, unknown>): PiModel {
  const meshes = list(obj(raw.assets).meshes).map(obj);
  return {
    modelId,
    name: typeof raw.name === 'string' && raw.name.trim() !== '' ? raw.name.trim() : null,
    active: raw.state === 'active',
    isPublic: raw.visibility === 'public',
    hasMesh: meshes.some(m => m.format === 'obj' && m.resolution === '50k' && m.status === 'available'),
    rooms: list(raw.rooms).map(normaliseRoom),
  };
}

/** A failure worth one more try: never cached. */
class Outage extends Error {}

/**
 * Property Intelligence through Matterport GraphQL (read-only token, HTTP Basic), cached in `pi-<id>.json`.
 * A success and a `not.found` are cached; an outage is not. The token is sent only to the GraphQL endpoint and never
 * appears in an error: every failure becomes a contract NotPossible with its fixed message.
 */
export function createPiSource(options: {
  cacheDir: string;
  env: Record<string, string | undefined>;
  fetchFn?: typeof fetch;
  timeoutMs?: number;
}): PiSource {
  const { cacheDir, env, fetchFn = fetch, timeoutMs = 10_000 } = options;
  const inFlight = new Map<string, Promise<PiModel>>();
  const cachePath = (id: string) => join(cacheDir, `pi-${id}.json`);

  function readCache(id: string): CacheFile | null {
    const path = cachePath(id);
    if (!existsSync(path)) return null;
    try {
      const parsed = JSON.parse(readFileSync(path, 'utf8')) as CacheFile;
      if ('notFound' in parsed && parsed.notFound === true) return parsed;
      if ('model' in parsed && Array.isArray(parsed.model?.rooms)) return parsed;
    } catch {
      // A broken file is fetched again.
    }
    return null;
  }

  function writeCache(id: string, content: CacheFile): void {
    mkdirSync(cacheDir, { recursive: true });
    const tmp = join(cacheDir, `.pi-${id}.part`);
    try {
      writeFileSync(tmp, JSON.stringify(content));
      renameSync(tmp, cachePath(id));
    } catch {
      rmSync(tmp, { force: true });   // the answer is still good; it just isn't cached
    }
  }

  /** One GraphQL call. Returns the model, null for not.found, or throws Outage. */
  async function callOnce(id: string, auth: string): Promise<Record<string, unknown> | null> {
    let res: Response;
    let body: unknown;
    try {
      res = await fetchFn(GRAPHQL_URL, {
        method: 'POST',
        headers: { Authorization: auth, 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: PI_QUERY, variables: { id } }),
        signal: AbortSignal.timeout(timeoutMs),
      });
      if (!res.ok) throw new Outage();
      body = await res.json();
    } catch {
      throw new Outage();
    }
    const data = obj(obj(body).data);
    if (typeof data.model === 'object' && data.model !== null) return data.model as Record<string, unknown>;
    const code = obj(obj(list(obj(body).errors)[0]).extensions).code;
    if (code === 'not.found') return null;
    throw new Outage();
  }

  async function load(id: string): Promise<PiModel> {
    const keyId = env.MATTERPORT_API_KEY?.trim();
    const secret = env.MATTERPORT_API_TOKEN?.trim();
    if (!keyId || !secret) throw new NotPossibleError(notPossible('server_not_configured'));
    const auth = `Basic ${Buffer.from(`${keyId}:${secret}`).toString('base64')}`;

    let raw: Record<string, unknown> | null | undefined;
    for (let attempt = 0; attempt < 2 && raw === undefined; attempt++) {
      try {
        raw = await callOnce(id, auth);
      } catch {
        // Retry once, then give up.
      }
    }
    if (raw === undefined) throw new NotPossibleError(notPossible('matterport_unreachable'));
    if (raw === null) {
      writeCache(id, { notFound: true });
      throw new NotPossibleError(notPossible('model_not_found'));
    }
    const model = normaliseModel(id, raw);
    writeCache(id, { model });
    return model;
  }

  return {
    get(modelId) {
      const cached = readCache(modelId);
      if (cached) {
        return 'model' in cached
          ? Promise.resolve(cached.model)
          : Promise.reject(new NotPossibleError(notPossible('model_not_found')));
      }
      let pending = inFlight.get(modelId);
      if (!pending) {
        pending = load(modelId).finally(() => inFlight.delete(modelId));
        inFlight.set(modelId, pending);
      }
      return pending;
    },
  };
}
