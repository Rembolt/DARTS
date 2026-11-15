import { describe, it, expect } from 'vitest';
import { checkBundle, loadMesh, loadServerConfig } from './api';

const respond = (status: number, body: unknown) =>
  (async () => new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } })) as typeof fetch;
const raw = (status: number, text: string, type = 'text/plain') =>
  (async () => new Response(text, { status, headers: { 'Content-Type': type } })) as typeof fetch;
const down = (async () => { throw new TypeError('Failed to fetch'); }) as typeof fetch;

const UNREACHABLE = 'Server not reachable. Start it with: npm run dev';

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
    await expect(loadServerConfig(down)).rejects.toThrow(UNREACHABLE);
  });

  it("reports an unreachable server behind Vite's proxy (empty-body 500)", async () => {
    await expect(loadServerConfig(raw(500, ''))).rejects.toThrow(UNREACHABLE);
  });

  it('reports an unreachable server behind a gateway (502)', async () => {
    await expect(loadServerConfig(raw(502, '<html>', 'text/html'))).rejects.toThrow(UNREACHABLE);
  });

  it('reports the status when a running server answers 500 with a non-JSON body', async () => {
    await expect(loadServerConfig(raw(500, '<html>Internal Server Error</html>', 'text/html')))
      .rejects.toThrow('Server error: HTTP 500');
  });

  it('reports the status when a running server answers with a non-JSON error', async () => {
    await expect(loadServerConfig(raw(404, '<html>Cannot GET</html>', 'text/html'))).rejects.toThrow('Server error: HTTP 404');
  });

  it('reports the status when an error answer has no message', async () => {
    await expect(loadServerConfig(respond(500, {}))).rejects.toThrow('Server error: HTTP 500');
  });

  it('rejects a JSON null body with a readable message', async () => {
    await expect(loadServerConfig(respond(200, null))).rejects.toThrow('Server sent an incomplete config');
  });

  it('rejects a config without a key', async () => {
    await expect(loadServerConfig(respond(200, { modelId: 'Ki9YdfpNKum' })))
      .rejects.toThrow('Server sent an incomplete config');
  });
});

describe('checkBundle', () => {
  it('passes when the viewer page is there', async () => {
    await expect(checkBundle(raw(200, '<html>', 'text/html'))).resolves.toBeUndefined();
  });

  it("shows the server's hint when the Bundle is missing", async () => {
    await expect(checkBundle(raw(503, 'Matterport Bundle missing. Run: npm run fetch-bundle')))
      .rejects.toThrow('Matterport Bundle missing. Run: npm run fetch-bundle');
  });

  it('reports an unreachable server', async () => {
    await expect(checkBundle(down)).rejects.toThrow(UNREACHABLE);
    await expect(checkBundle(raw(500, ''))).rejects.toThrow(UNREACHABLE);
  });

  it('reports the status for other failures', async () => {
    await expect(checkBundle(raw(404, '<html>', 'text/html'))).rejects.toThrow('Viewer page not available: HTTP 404');
  });
});

describe('loadMesh', () => {
  it('returns the bytes of the mesh', async () => {
    let asked = '';
    const ok = (async (url: string | URL | Request) => {
      asked = String(url);
      return new Response('v 0 0 0');
    }) as typeof fetch;
    const buf = await loadMesh('Ki9YdfpNKum', ok);
    expect(new TextDecoder().decode(buf)).toBe('v 0 0 0');
    expect(asked).toBe('/api/mesh/Ki9YdfpNKum');
  });

  it("passes on the server's error message", async () => {
    await expect(loadMesh('Ki9YdfpNKum', respond(502, { error: 'Mesh download failed: HTTP 403' })))
      .rejects.toThrow('Mesh download failed: HTTP 403');
  });

  it('reports an unreachable server', async () => {
    await expect(loadMesh('Ki9YdfpNKum', down)).rejects.toThrow(UNREACHABLE);
    await expect(loadMesh('Ki9YdfpNKum', raw(502, ''))).rejects.toThrow(UNREACHABLE);
  });

  it('reports the status for a non-JSON failure', async () => {
    await expect(loadMesh('Ki9YdfpNKum', raw(404, '<html>', 'text/html'))).rejects.toThrow('Mesh download failed: HTTP 404');
  });
});
