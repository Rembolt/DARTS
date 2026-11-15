import { NOT_POSSIBLE, type NotPossible, type NotPossibleCode } from '../../server/src/shared/contract';

export type ServerConfig = { sdkKey: string; modelId: string };

export const UNREACHABLE = 'Server not reachable. Start it with: npm run dev';

/**
 * True when the answer came from Vite's dev proxy because our server is down, not from our server.
 * The proxy answers an empty-body 500 when the target refuses the connection, and 502/503/504 behind other proxies.
 * Our own server never sends an empty error body.
 */
function proxyDown(status: number, text: string): boolean {
  if (status === 502 || status === 504) return true;
  return (status === 500 || status === 503) && text.trim() === '';
}

/**
 * Ask our server for the viewer config of one model (or the server's default when none is given).
 * Rejects with a message that is ready to show to the user.
 */
export async function loadServerConfig(modelId?: string, fetchFn: typeof fetch = fetch): Promise<ServerConfig> {
  let res: Response;
  let text: string;
  try {
    res = await fetchFn(modelId === undefined ? '/api/config' : `/api/config?m=${encodeURIComponent(modelId)}`);
    text = await res.text();
  } catch {
    throw new Error(UNREACHABLE);
  }

  let body: unknown;
  try {
    body = JSON.parse(text);
  } catch {
    throw new Error(proxyDown(res.status, text) ? UNREACHABLE : `Server error: HTTP ${res.status}`);
  }

  const data = (typeof body === 'object' && body !== null ? body : {}) as Partial<ServerConfig> & { error?: unknown };
  if (!res.ok) {
    throw new Error(typeof data.error === 'string' && data.error ? data.error : `Server error: HTTP ${res.status}`);
  }
  if (typeof data.sdkKey !== 'string' || !data.sdkKey || typeof data.modelId !== 'string' || !data.modelId) {
    throw new Error('Server sent an incomplete config');
  }
  return { sdkKey: data.sdkKey, modelId: data.modelId };
}

/** What `getJson` throws: the reason, ready to show on a not-possible screen. */
export type NotPossibleError = { reason: NotPossible };

// Our own server down has no code of its own in the contract; the closest is "did not answer, try again".
const unreachable = (): NotPossibleError => ({ reason: { code: 'matterport_unreachable', message: UNREACHABLE, retry: true } });

function isCode(code: unknown): code is NotPossibleCode {
  return typeof code === 'string' && Object.prototype.hasOwnProperty.call(NOT_POSSIBLE, code);
}

/**
 * GET a JSON answer from our server. On failure, throws a `NotPossibleError` built from the server's
 * `{ error, code, retry }`; a server that can't be reached throws one with the UNREACHABLE message.
 */
export async function getJson<T>(path: string, fetchFn: typeof fetch = fetch): Promise<T> {
  let res: Response;
  let text: string;
  try {
    res = await fetchFn(path);
    text = await res.text();
  } catch {
    throw unreachable();
  }

  let body: unknown;
  try {
    body = JSON.parse(text);
  } catch {
    if (proxyDown(res.status, text)) throw unreachable();
    throw { reason: { code: 'matterport_unreachable', message: `Server error: HTTP ${res.status}`, retry: true } } satisfies NotPossibleError;
  }
  if (res.ok) return body as T;

  const data = (typeof body === 'object' && body !== null ? body : {}) as { error?: unknown; code?: unknown; retry?: unknown };
  const code: NotPossibleCode = isCode(data.code) ? data.code : 'matterport_unreachable';
  const message = typeof data.error === 'string' && data.error ? data.error : `Server error: HTTP ${res.status}`;
  const retry = typeof data.retry === 'boolean' ? data.retry : NOT_POSSIBLE[code].retry;
  throw { reason: { code, message, retry } } satisfies NotPossibleError;
}

/**
 * Check that the server can serve the viewer page before pointing the iframe at it, so a missing Bundle shows the
 * server's hint ("Run: npm run fetch-bundle") instead of a generic SDK error. Rejects with a message ready to show.
 */
export async function checkBundle(fetchFn: typeof fetch = fetch): Promise<void> {
  let res: Response;
  let text: string;
  try {
    res = await fetchFn('/bundle/showcase.html', { cache: 'no-store' });
    text = await res.text();
  } catch {
    throw new Error(UNREACHABLE);
  }
  if (res.ok) return;
  if (proxyDown(res.status, text)) throw new Error(UNREACHABLE);
  const plain = (res.headers.get('Content-Type') ?? '').startsWith('text/plain') ? text.trim() : '';
  throw new Error(plain || `Viewer page not available: HTTP ${res.status}`);
}

/** Download the property's mesh (an OBJ file) from our server. Rejects with a message ready to show. */
export async function loadMesh(modelId: string, fetchFn: typeof fetch = fetch): Promise<ArrayBuffer> {
  let res: Response;
  try {
    res = await fetchFn(`/api/mesh/${encodeURIComponent(modelId)}`);
  } catch {
    throw new Error(UNREACHABLE);
  }
  if (res.ok) {
    try {
      return await res.arrayBuffer();
    } catch {
      throw new Error('Mesh download interrupted');
    }
  }
  // Our server answers 502 with a JSON message when Matterport fails, so read the message before the proxy rule.
  const text = await res.text().catch(() => '');
  let message = '';
  try {
    const body: unknown = JSON.parse(text);
    if (typeof body === 'object' && body !== null && typeof (body as { error?: unknown }).error === 'string') {
      message = (body as { error: string }).error;
    }
  } catch {
    // not JSON: fall through
  }
  if (message) throw new Error(message);
  if (proxyDown(res.status, text)) throw new Error(UNREACHABLE);
  throw new Error(`Mesh download failed: HTTP ${res.status}`);
}
