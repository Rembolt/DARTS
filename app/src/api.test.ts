import { describe, it, expect } from 'vitest';
import { loadServerConfig } from './api';

const respond = (status: number, body: unknown) =>
  (async () => new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } })) as typeof fetch;

describe('loadServerConfig', () => {
  it('returns the config', async () => {
    await expect(loadServerConfig(respond(200, { sdkKey: 'k', modelId: 'Ki9YdfpNKum' })))
      .resolves.toEqual({ sdkKey: 'k', modelId: 'Ki9YdfpNKum' });
  });

  it("passes on the server's error message", async () => {
    await expect(loadServerConfig(respond(500, { error: 'MATTERPORT_SDK_KEY is not set in .env' })))
      .rejects.toThrow('MATTERPORT_SDK_KEY is not set in .env');
  });

  it('reports an unreachable server', async () => {
    const down = (async () => { throw new TypeError('Failed to fetch'); }) as typeof fetch;
    await expect(loadServerConfig(down)).rejects.toThrow('Server not reachable. Start it with: npm run dev');
  });

  it('reports a non-JSON answer, as when the proxy target is down', async () => {
    const html = (async () => new Response('<html>', { status: 502 })) as typeof fetch;
    await expect(loadServerConfig(html)).rejects.toThrow('Server not reachable. Start it with: npm run dev');
  });

  it('rejects a config without a key', async () => {
    await expect(loadServerConfig(respond(200, { modelId: 'Ki9YdfpNKum' })))
      .rejects.toThrow('Server sent an incomplete config');
  });
});
