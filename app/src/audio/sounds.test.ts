import { describe, it, expect, vi } from 'vitest';
import * as sounds from './sounds';
import { loadSound } from './sounds';

describe('loadSound', () => {
  const ctx = { decodeAudioData: vi.fn(async () => ({ duration: 1 }) as unknown as AudioBuffer) } as unknown as BaseAudioContext;
  const response = (status: number, type: string) =>
    new Response(new ArrayBuffer(4), { status, headers: { 'content-type': type } });

  it('decodes an audio response', async () => {
    expect(await loadSound(ctx, '/a.ogg', async () => response(200, 'audio/ogg'))).not.toBeNull();
  });

  it('loadSound returns null for HTML and for 404', async () => {
    expect(await loadSound(ctx, '/404.ogg', async () => response(404, 'audio/ogg'))).toBeNull();
    expect(await loadSound(ctx, '/html.ogg', async () => response(200, 'text/html; charset=utf-8'))).toBeNull();
  });

  it('treats a network error and a decode error as missing', async () => {
    expect(await loadSound(ctx, '/offline.ogg', async () => { throw new TypeError('offline'); })).toBeNull();
    const bad = { decodeAudioData: async () => { throw new DOMException('bad'); } } as unknown as BaseAudioContext;
    expect(await loadSound(bad, '/a.ogg', async () => response(200, 'audio/ogg'))).toBeNull();
  });

  it('decodes a file once per context', async () => {
    const fetchFn = vi.fn(async () => response(200, 'audio/ogg'));
    const own = { decodeAudioData: vi.fn(async () => ({ duration: 1 }) as unknown as AudioBuffer) } as unknown as BaseAudioContext;
    await Promise.all([loadSound(own, '/once.ogg', fetchFn), loadSound(own, '/once.ogg', fetchFn)]);
    expect(fetchFn).toHaveBeenCalledTimes(1);
  });

  it('has no synthesized stand-ins any more', () => {
    for (const name of ['synthMelody', 'synthTraffic', 'standInBuffer']) expect(name in sounds).toBe(false);
  });
});
