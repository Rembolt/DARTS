import { createWriteStream, existsSync, mkdirSync, renameSync, rmSync } from 'node:fs';
import { join } from 'node:path';
import { Readable } from 'node:stream';
import { pipeline } from 'node:stream/promises';
import type { ReadableStream as WebReadableStream } from 'node:stream/web';

const GRAPHQL_URL = 'https://api.matterport.com/api/models/graph';
const MESH_QUERY = 'query Mesh($id: ID!) { model(id: $id) { assets { meshes { format resolution status url } } } }';

/** Default time limits. A stalled request must fail, or every later request would wait on it (see `inFlight`). */
export const DEFAULT_TIMEOUTS = { graphqlMs: 30_000, downloadMs: 180_000 };

/** A failure with a message ready to show in the page and the HTTP status the route should answer. */
export class MeshError extends Error {
  constructor(
    message: string,
    readonly status: number,
  ) {
    super(message);
    this.name = 'MeshError';
  }
}

export type MeshSource = {
  /** The path of the model's cached 50k OBJ, downloading it first if needed. Rejects with a `MeshError`. */
  meshPath(modelId: string): Promise<string>;
};

type MeshEntry = { format?: unknown; resolution?: unknown; status?: unknown; url?: unknown };

const messageOf = (err: unknown) => (err instanceof Error ? err.message : String(err));
const duration = (ms: number) => (ms >= 1000 ? `${Math.round(ms / 1000)} s` : `${ms} ms`);

/**
 * Downloads meshes through Matterport GraphQL and caches them in `cacheDir`. The token stays here: it is sent only
 * to the GraphQL endpoint and never appears in an error. The signed download link expires, so only the file is cached.
 */
export function createMeshSource(options: {
  cacheDir: string;
  env: Record<string, string | undefined>;
  fetchFn?: typeof fetch;
  timeouts?: { graphqlMs: number; downloadMs: number };
}): MeshSource {
  const { cacheDir, env, fetchFn = fetch, timeouts = DEFAULT_TIMEOUTS } = options;
  const inFlight = new Map<string, Promise<string>>();

  const isTimeout = (err: unknown) => err instanceof Error && (err.name === 'TimeoutError' || err.name === 'AbortError');

  /** `fetch` with a time limit that also covers reading the body (the signal stays attached to the response). */
  async function call(url: string, ms: number, what: string, init: RequestInit = {}): Promise<Response> {
    try {
      return await fetchFn(url, { ...init, signal: AbortSignal.timeout(ms) });
    } catch (err) {
      if (isTimeout(err)) throw new MeshError(`${what} timed out after ${duration(ms)}`, 504);
      throw new MeshError(`Matterport not reachable: ${messageOf(err)}`, 502);
    }
  }

  async function meshUrl(modelId: string): Promise<string> {
    const id = env.MATTERPORT_API_KEY?.trim();
    const secret = env.MATTERPORT_API_TOKEN?.trim();
    if (!id || !secret) throw new MeshError('MATTERPORT_API_KEY or MATTERPORT_API_TOKEN is not set in .env', 500);

    const res = await call(GRAPHQL_URL, timeouts.graphqlMs, 'Matterport GraphQL', {
      method: 'POST',
      headers: {
        Authorization: `Basic ${Buffer.from(`${id}:${secret}`).toString('base64')}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ query: MESH_QUERY, variables: { id: modelId } }),
    });
    if (res.status === 401 || res.status === 403) {
      throw new MeshError(`Matterport GraphQL refused the token (HTTP ${res.status})`, 502);
    }
    let body: { data?: { model?: { assets?: { meshes?: MeshEntry[] } } }; errors?: { message?: unknown }[] };
    try {
      body = await res.json();
    } catch (err) {
      if (isTimeout(err)) throw new MeshError(`Matterport GraphQL timed out after ${duration(timeouts.graphqlMs)}`, 504);
      throw new MeshError(`Matterport GraphQL answered HTTP ${res.status} without JSON`, 502);
    }

    // A partial answer (an error on some other field) still counts if it holds a usable 50k mesh.
    const entry = body.data?.model?.assets?.meshes?.find(m => m.format === 'obj' && m.resolution === '50k');
    const hasUrl = typeof entry?.url === 'string' && entry.url !== '';
    if (hasUrl && entry?.status === 'available') return entry.url as string;

    const firstError = body.errors?.[0]?.message;
    if (firstError !== undefined) throw new MeshError(`Matterport GraphQL error: ${String(firstError)}`, 502);
    if (!res.ok) throw new MeshError(`Matterport GraphQL answered HTTP ${res.status}`, 502);
    if (hasUrl) {
      throw new MeshError(`The 50k mesh for model ${modelId} is not available (status: ${String(entry?.status)})`, 502);
    }
    throw new MeshError(`No single-file 50k mesh for model ${modelId}`, 502);
  }

  async function download(modelId: string, finalPath: string): Promise<string> {
    const url = await meshUrl(modelId);
    const res = await call(url, timeouts.downloadMs, 'Mesh download');
    if (!res.ok || !res.body) throw new MeshError(`Mesh download failed: HTTP ${res.status}`, 502);

    // Write beside the final file, then rename, so a broken download never looks cached. One fixed temp name per
    // model (downloads are shared through `inFlight`), so a server killed mid-download leaves at most one stale
    // file, which the next download overwrites.
    mkdirSync(cacheDir, { recursive: true });
    const tmp = join(cacheDir, `.${modelId}-50k.part`);
    try {
      await pipeline(Readable.fromWeb(res.body as WebReadableStream), createWriteStream(tmp));
      renameSync(tmp, finalPath);
    } catch (err) {
      rmSync(tmp, { force: true });
      if (isTimeout(err)) throw new MeshError(`Mesh download timed out after ${duration(timeouts.downloadMs)}`, 504);
      throw new MeshError(`Mesh download interrupted: ${messageOf(err)}`, 502);
    }
    return finalPath;
  }

  return {
    meshPath(modelId) {
      const finalPath = join(cacheDir, `${modelId}-50k.obj`);
      if (existsSync(finalPath)) return Promise.resolve(finalPath);

      let pending = inFlight.get(modelId);
      if (!pending) {
        pending = download(modelId, finalPath).finally(() => inFlight.delete(modelId));
        inFlight.set(modelId, pending);
      }
      return pending;
    },
  };
}
