import { describe, it, expect } from 'vitest';
import { checkBundle, getJson, loadMesh, loadServerConfig } from './api';

const respond = (status: number, body: unknown) =>
  (async () => new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } })) as typeof fetch;
const raw = (status: number, text: string, type = 'text/plain') =>
  (async () => new Response(text, { status, headers: { 'Content-Type': type } })) as typeof fetch;
const down = (async () => { throw new TypeError('Failed to fetch'); }) as typeof fetch;

const UNREACHABLE = 'Server not reachable. Start it with: npm run dev';

describe('loadServerConfig', () => {
  it('returns the config', async () => {
    await expect(loadServerConfig(undefined, respond(200, { sdkKey: 'k', modelId: 'Ki9YdfpNKum' })))
      .resolves.toEqual({ sdkKey: 'k', modelId: 'Ki9YdfpNKum' });
  });

  it("passes on the server's error message", async () => {
    await expect(loadServerConfig(undefined, respond(500, { error: 'MATTERPORT_SDK_KEY is not set in .env' })))
      .rejects.toThrow('MATTERPORT_SDK_KEY is not set in .env');
  });

  it('reports an unreachable server', async () => {
    await expect(loadServerConfig(undefined, down)).rejects.toThrow(UNREACHABLE);
  });

  it("reports an unreachable server behind Vite's proxy (empty-body 500)", async () => {
    await expect(loadServerConfig(undefined, raw(500, ''))).rejects.toThrow(UNREACHABLE);
  });

  it('reports an unreachable server behind a gateway (502)', async () => {
    await expect(loadServerConfig(undefined, raw(502, '<html>', 'text/html'))).rejects.toThrow(UNREACHABLE);
  });

  it('reports the status when a running server answers 500 with a non-JSON body', async () => {
    await expect(loadServerConfig(undefined, raw(500, '<html>Internal Server Error</html>', 'text/html')))
      .rejects.toThrow('Server error: HTTP 500');
  });

  it('reports the status when a running server answers with a non-JSON error', async () => {
    await expect(loadServerConfig(undefined, raw(404, '<html>Cannot GET</html>', 'text/html'))).rejects.toThrow('Server error: HTTP 404');
  });

  it('reports the status when an error answer has no message', async () => {
    await expect(loadServerConfig(undefined, respond(500, {}))).rejects.toThrow('Server error: HTTP 500');
  });

  it('rejects a JSON null body with a readable message', async () => {
    await expect(loadServerConfig(undefined, respond(200, null))).rejects.toThrow('Server sent an incomplete config');
  });

  it('rejects a config without a key', async () => {
    await expect(loadServerConfig(undefined, respond(200, { modelId: 'Ki9YdfpNKum' })))
      .rejects.toThrow('Server sent an incomplete config');
  });

  it('asks the config for the model', async () => {
    let asked = '';
    const fake = (async (url: string | URL | Request) => {
      asked = String(url);
      return new Response(JSON.stringify({ sdkKey: 'k', modelId: 'aaaaaaaaaaa' }), { status: 200 });
    }) as typeof fetch;
    await expect(loadServerConfig('aaaaaaaaaaa', fake)).resolves.toEqual({ sdkKey: 'k', modelId: 'aaaaaaaaaaa' });
    expect(asked).toBe('/api/config?m=aaaaaaaaaaa');
  });

  it('asks the plain config when no model is given', async () => {
    let asked = '';
    const fake = (async (url: string | URL | Request) => {
      asked = String(url);
      return new Response(JSON.stringify({ sdkKey: 'k', modelId: 'Ki9YdfpNKum' }), { status: 200 });
    }) as typeof fetch;
    await loadServerConfig(undefined, fake);
    expect(asked).toBe('/api/config');
  });
});

describe('getJson', () => {
  it('returns the body', async () => {
    await expect(getJson<{ a: number }>('/api/x', respond(200, { a: 1 }))).resolves.toEqual({ a: 1 });
  });

  it("throws the server's not-possible reason", async () => {
    const message = 'Not possible to load: this property is not in the catalogue.';
    await expect(getJson('/api/config?m=aaaaaaaaaaa', respond(404, { error: message, code: 'unknown_model', retry: false })))
      .rejects.toEqual({ reason: { code: 'unknown_model', message, retry: false } });
  });

  it('throws an unreachable reason when the server is down', async () => {
    for (const fake of [down, raw(500, ''), raw(502, '<html>', 'text/html')]) {
      await expect(getJson('/api/x', fake)).rejects.toEqual({
        reason: { code: 'matterport_unreachable', message: UNREACHABLE, retry: true },
      });
    }
  });

  it('throws a reason with the status for an error without a known code', async () => {
    await expect(getJson('/api/x', raw(404, '<html>Cannot GET</html>', 'text/html'))).rejects.toMatchObject({
      reason: { message: 'Server error: HTTP 404' },
    });
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
