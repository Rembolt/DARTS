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

/** Ask our server for the viewer config. Rejects with a message that is ready to show to the user. */
export async function loadServerConfig(fetchFn: typeof fetch = fetch): Promise<ServerConfig> {
  let res: Response;
  let text: string;
  try {
    res = await fetchFn('/api/config');
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
