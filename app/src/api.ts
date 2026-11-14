export type ServerConfig = { sdkKey: string; modelId: string };

const UNREACHABLE = 'Server not reachable. Start it with: npm run dev';

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
    // The dev proxy answers with a non-JSON error page when the server is down.
    throw new Error(UNREACHABLE);
  }

  const data = body as Partial<ServerConfig> & { error?: string };
  if (!res.ok) throw new Error(data.error ?? UNREACHABLE);
  if (typeof data.sdkKey !== 'string' || !data.sdkKey || typeof data.modelId !== 'string' || !data.modelId) {
    throw new Error('Server sent an incomplete config');
  }
  return { sdkKey: data.sdkKey, modelId: data.modelId };
}
