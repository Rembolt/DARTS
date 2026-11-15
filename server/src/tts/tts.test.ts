import { mkdtempSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import express from 'express';
import { afterEach, describe, expect, it } from 'vitest';
import { ttsRouter, voiceId } from './index.js';

const servers: import('node:http').Server[] = [];
afterEach(() => servers.splice(0).forEach(s => s.close()));

function start(env: Record<string, string>, fetchFn: typeof fetch): Promise<string> {
  const app = express();
  app.use('/api', express.json({ limit: '4kb' }), ttsRouter({ env, cacheDir: mkdtempSync(join(tmpdir(), 'tts-')), fetch: fetchFn }));
  return new Promise(resolve => {
    const s = app.listen(0, '127.0.0.1', () => {
      servers.push(s);
      resolve(`http://127.0.0.1:${(s.address() as { port: number }).port}`);
    });
  });
}
const post = (base: string, body: unknown) => fetch(`${base}/api/tts`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });

describe('tts route', () => {
  it('picks the voice per agent with a shared fallback', () => {
    expect(voiceId({ ELEVENLABS_VOICE_JEV: 'a', ELEVENLABS_VOICE_ID: 'z' }, 'jev')).toBe('a');
    expect(voiceId({ ELEVENLABS_VOICE_ID: 'z' }, 'front')).toBe('z');
    expect(voiceId({}, 'front')).toBe('');
  });
  it('answers 503 without a key', async () => {
    const base = await start({}, (async () => new Response('x')) as typeof fetch);
    expect((await post(base, { text: 'hi' })).status).toBe(503);
  });
  it('rejects empty and oversized text', async () => {
    const base = await start({ ELEVENLABS_API_KEY: 'k', ELEVENLABS_VOICE_JEV: 'v' }, (async () => new Response('x')) as typeof fetch);
    expect((await post(base, { text: '' })).status).toBe(400);
    expect((await post(base, { text: 'a'.repeat(1300) })).status).toBe(400);
  });
  it('calls ElevenLabs once and serves the repeat from the cache, key in the header only', async () => {
    const calls: { url: string; init: RequestInit }[] = [];
    const fetchFn = (async (url: string, init: RequestInit) => (calls.push({ url, init }), new Response(new Uint8Array([1, 2, 3])))) as unknown as typeof fetch;
    const base = await start({ ELEVENLABS_API_KEY: 'secret', ELEVENLABS_VOICE_JEV: 'voice1' }, fetchFn);
    const a = await post(base, { text: 'Hello', voice: 'jev' });
    expect(a.headers.get('content-type')).toContain('audio/mpeg');
    expect(new Uint8Array(await a.arrayBuffer())).toEqual(new Uint8Array([1, 2, 3]));
    await post(base, { text: 'Hello', voice: 'jev' });
    expect(calls).toHaveLength(1);
    expect(calls[0].url).toContain('/text-to-speech/voice1');
    expect(JSON.parse(calls[0].init.body as string).model_id).toBe('eleven_flash_v2_5');
    expect(calls[0].url).not.toContain('secret');
  });
  it('maps an upstream failure to 502 without its body', async () => {
    const base = await start({ ELEVENLABS_API_KEY: 'k', ELEVENLABS_VOICE_JEV: 'v' }, (async () => new Response('account details', { status: 401 })) as typeof fetch);
    const res = await post(base, { text: 'hi' });
    expect(res.status).toBe(502);
    expect(await res.text()).not.toContain('account details');
  });

  it('transcribes a WAV through Scribe and returns the text only', async () => {
    let sent: FormData | null = null;
    const fetchFn = (async (_u: string, init: RequestInit) => ((sent = init.body as FormData), new Response(JSON.stringify({ text: ' hello world ', words: [1] })))) as unknown as typeof fetch;
    const base = await start({ ELEVENLABS_API_KEY: 'k' }, fetchFn);
    const res = await fetch(`${base}/api/stt`, { method: 'POST', headers: { 'Content-Type': 'audio/wav' }, body: new Uint8Array(2000) });
    expect(await res.json()).toEqual({ text: 'hello world' });
    expect(sent!.get('model_id')).toBe('scribe_v1');
  });
  it('maps a key without Speech to Text access to 403', async () => {
    const base = await start({ ELEVENLABS_API_KEY: 'k' }, (async () => new Response('no', { status: 401 })) as typeof fetch);
    const res = await fetch(`${base}/api/stt`, { method: 'POST', headers: { 'Content-Type': 'audio/wav' }, body: new Uint8Array(2000) });
    expect(res.status).toBe(403);
  });
});
