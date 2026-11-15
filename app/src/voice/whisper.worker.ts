// Open-source Whisper (whisper-tiny.en, ONNX) running in a worker through transformers.js, so the page and the tour stay smooth.
// The model downloads once from the Hugging Face hub and the browser caches it.
import { pipeline, env } from '@huggingface/transformers';

env.allowLocalModels = false;

type Transcriber = (audio: Float32Array) => Promise<{ text: string } | { text: string }[]>;
let loading: Promise<Transcriber> | null = null;

function load(): Promise<Transcriber> {
  loading ??= (async () => {
    const device = (self.navigator as Navigator & { gpu?: unknown }).gpu ? 'webgpu' : 'wasm';
    const asr = await pipeline('automatic-speech-recognition', 'Xenova/whisper-tiny.en', { device });
    return asr as unknown as Transcriber;
  })();
  loading.catch(() => (loading = null));
  return loading;
}

self.onmessage = async (e: MessageEvent<{ id: number; type: 'warm' | 'transcribe'; audio?: Float32Array }>) => {
  const { id, type, audio } = e.data;
  try {
    const asr = await load();
    if (type === 'warm' || !audio) return void self.postMessage({ id, ok: true, text: '' });
    const out = await asr(audio);
    const text = (Array.isArray(out) ? out.map(o => o.text).join(' ') : out.text).trim();
    self.postMessage({ id, ok: true, text });
  } catch (err) {
    self.postMessage({ id, ok: false, error: err instanceof Error ? err.message : 'transcription failed' });
  }
};
