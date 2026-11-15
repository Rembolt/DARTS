import { randomBytes } from 'node:crypto';
import { createWriteStream, existsSync, mkdirSync, renameSync, rmSync } from 'node:fs';
import { join } from 'node:path';
import { Readable } from 'node:stream';
import { pipeline } from 'node:stream/promises';
import type { ReadableStream as WebReadableStream } from 'node:stream/web';

const GRAPHQL_URL = 'https://api.matterport.com/api/models/graph';
const MESH_QUERY = 'query Mesh($id: ID!) { model(id: $id) { assets { meshes { format resolution status url } } } }';

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

type MeshEntry = { format?: unknown; resolution?: unknown; url?: unknown };

const messageOf = (err: unknown) => (err instanceof Error ? err.message : String(err));

/**
 * Downloads meshes through Matterport GraphQL and caches them in `cacheDir`. The token stays here: it is sent only
 * to the GraphQL endpoint and never appears in an error. The signed download link expires, so only the file is cached.
 */
export function createMeshSource(options: {
  cacheDir: string;
  env: Record<string, string | undefined>;
  fetchFn?: typeof fetch;
}): MeshSource {
  const { cacheDir, env, fetchFn = fetch } = options;
  const inFlight = new Map<string, Promise<string>>();

  async function call(url: string, init?: RequestInit): Promise<Response> {
    try {
      return await fetchFn(url, init);
    } catch (err) {
      throw new MeshError(`Matterport not reachable: ${messageOf(err)}`, 502);
    }
  }

  async function meshUrl(modelId: string): Promise<string> {
    const id = env.MATTERPORT_API_KEY?.trim();
    const secret = env.MATTERPORT_API_TOKEN?.trim();
    if (!id || !secret) throw new MeshError('MATTERPORT_API_KEY or MATTERPORT_API_TOKEN is not set in .env', 500);

    const res = await call(GRAPHQL_URL, {
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
    } catch {
      throw new MeshError(`Matterport GraphQL answered HTTP ${res.status} without JSON`, 502);
    }
    const firstError = body.errors?.[0]?.message;
    if (firstError !== undefined) throw new MeshError(`Matterport GraphQL error: ${String(firstError)}`, 502);
    if (!res.ok) throw new MeshError(`Matterport GraphQL answered HTTP ${res.status}`, 502);

    const entry = body.data?.model?.assets?.meshes?.find(m => m.format === 'obj' && m.resolution === '50k');
    if (typeof entry?.url !== 'string' || !entry.url) {
      throw new MeshError(`No single-file 50k mesh for model ${modelId}`, 502);
    }
    return entry.url;
  }

  async function download(modelId: string, finalPath: string): Promise<string> {
    const url = await meshUrl(modelId);
    const res = await call(url);
    if (!res.ok || !res.body) throw new MeshError(`Mesh download failed: HTTP ${res.status}`, 502);

    // Write beside the final file, then rename, so a broken download never looks cached.
    mkdirSync(cacheDir, { recursive: true });
    const tmp = join(cacheDir, `.${modelId}-${randomBytes(4).toString('hex')}.part`);
    try {
      await pipeline(Readable.fromWeb(res.body as WebReadableStream), createWriteStream(tmp));
      renameSync(tmp, finalPath);
    } catch (err) {
      rmSync(tmp, { force: true });
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
