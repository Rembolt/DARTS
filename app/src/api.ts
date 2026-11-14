export type ServerConfig = { sdkKey: string; modelId: string };

const UNREACHABLE = 'Server not reachable. Start it with: npm run dev';

// What Vite's dev proxy answers (with an empty, non-JSON body) when our server is down.
const PROXY_DOWN = new Set([502, 503, 504]);

/** Ask our server for the viewer config. Rejects with a message that is ready to show to the user. */
export async function loadServerConfig(fetchFn: typeof fetch = fetch): Promise<ServerConfig> {
  let res: Response;
  try {
    res = await fetchFn('/api/config');
  } catch {
    throw new Error(UNREACHABLE);
  }

  let body: unknown;
  try {
    body = await res.json();
  } catch {
    throw new Error(PROXY_DOWN.has(res.status) ? UNREACHABLE : `Server error: HTTP ${res.status}`);
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
