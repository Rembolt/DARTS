import { createHash } from 'node:crypto';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import express from 'express';

export type Voice = 'jev' | 'front';
export const DEFAULT_MODEL = 'eleven_flash_v2_5';
export const MAX_TTS_CHARS = 1200;

type Env = Record<string, string | undefined>;

/** The voice id for an agent: its own variable, else the shared ELEVENLABS_VOICE_ID. Empty when neither is set. */
export function voiceId(env: Env, voice: Voice): string {
  const own = voice === 'jev' ? env.ELEVENLABS_VOICE_JEV : env.ELEVENLABS_VOICE_FRONT;
  return (own || env.ELEVENLABS_VOICE_ID || '').trim();
}

export const STT_MODEL = 'scribe_v1';
const MAX_AUDIO_BYTES = 8 * 1024 * 1024;

export function ttsEnabled(env: Env): boolean {
  return Boolean(env.ELEVENLABS_API_KEY?.trim()) && Boolean(voiceId(env, 'jev') || voiceId(env, 'front'));
}

/** POST /api/tts { text, voice } → audio/mpeg. Same text, voice and model are served from the disk cache. */
export function ttsRouter(deps: { env: Env; cacheDir: string; fetch?: typeof fetch }): express.Router {
  const { env, cacheDir } = deps;
  const doFetch = deps.fetch ?? fetch;
  const router = express.Router();
  const model = env.ELEVENLABS_MODEL?.trim() || DEFAULT_MODEL;

  router.post('/tts', async (req, res) => {
    const body: unknown = req.body;
    const text = typeof (body as { text?: unknown })?.text === 'string' ? (body as { text: string }).text.trim() : '';
    const voice: Voice = (body as { voice?: unknown })?.voice === 'front' ? 'front' : 'jev';
    if (!text || text.length > MAX_TTS_CHARS) {
      res.status(400).json({ error: `text must be 1 to ${MAX_TTS_CHARS} characters`, code: 'bad_request' });
      return;
    }
    const key = env.ELEVENLABS_API_KEY?.trim();
    const id = voiceId(env, voice);
    if (!key || !id) {
      res.status(503).json({ error: 'Voice is not set up', code: 'tts_off' });
      return;
    }
    const file = join(cacheDir, 'tts', `${createHash('sha256').update(`${id}|${model}|${text}`).digest('hex')}.mp3`);
    try {
      const audio = await readFile(file).catch(() => null);
      if (audio) return void res.type('audio/mpeg').set('Cache-Control', 'private, max-age=86400').send(audio);
      const upstream = await doFetch(
        `https://api.elevenlabs.io/v1/text-to-speech/${encodeURIComponent(id)}?output_format=mp3_44100_64`,
        {
          method: 'POST',
          headers: { 'xi-api-key': key, 'Content-Type': 'application/json', Accept: 'audio/mpeg' },
          body: JSON.stringify({ text, model_id: model }),
        },
      );
      if (!upstream.ok) {
        // Never forward the upstream body: it can echo account details.
        res.status(502).json({ error: `Voice service answered ${upstream.status}`, code: 'tts_failed' });
        return;
      }
      const bytes = Buffer.from(await upstream.arrayBuffer());
      await mkdir(join(cacheDir, 'tts'), { recursive: true });
      await writeFile(file, bytes).catch(() => {});
      res.type('audio/mpeg').set('Cache-Control', 'private, max-age=86400').send(bytes);
    } catch {
      res.status(502).json({ error: 'Voice service unreachable', code: 'tts_failed' });
    }
  });

  // POST /api/stt (audio/wav body) → { text }. ElevenLabs Scribe; the client falls back to browser Whisper on any non-200.
  router.post('/stt', express.raw({ type: ['audio/wav', 'audio/x-wav'], limit: MAX_AUDIO_BYTES }), async (req, res) => {
    const key = env.ELEVENLABS_API_KEY?.trim();
    if (!key) return void res.status(503).json({ error: 'Voice is not set up', code: 'stt_off' });
    const wav: unknown = req.body;
    if (!Buffer.isBuffer(wav) || wav.length < 1000) return void res.status(400).json({ error: 'send a WAV body', code: 'bad_request' });
    try {
      const form = new FormData();
      form.set('model_id', env.ELEVENLABS_STT_MODEL?.trim() || STT_MODEL);
      form.set('language_code', 'en');
      form.set('tag_audio_events', 'false');
      form.set('file', new Blob([new Uint8Array(wav)], { type: 'audio/wav' }), 'speech.wav');
      const upstream = await doFetch('https://api.elevenlabs.io/v1/speech-to-text', { method: 'POST', headers: { 'xi-api-key': key }, body: form });
      if (!upstream.ok) {
        // 401/403 usually means the key lacks Speech to Text access. Never forward the upstream body.
        res.status(upstream.status === 401 || upstream.status === 403 ? 403 : 502).json({ error: `Speech service answered ${upstream.status}`, code: 'stt_failed' });
        return;
      }
      const data = (await upstream.json()) as { text?: unknown };
      res.json({ text: typeof data.text === 'string' ? data.text.trim() : '' });
    } catch {
      res.status(502).json({ error: 'Speech service unreachable', code: 'stt_failed' });
    }
  });

  return router;
}
