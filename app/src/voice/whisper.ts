// Push-to-talk with open-source Whisper: record the mic, decode to 16 kHz mono, transcribe in a worker.
// Used by the front door and by Jev in the tour. Nothing leaves the browser except the one-time model download.

export type Recorder = {
  available: boolean;
  /** Start recording. Rejects if the mic is blocked. */
  start(onPartial?: (text: string) => void): Promise<void>;
  /** Stop and transcribe. Resolves to the text (empty if nothing was heard). */
  stop(): Promise<string>;
  cancel(): void;
  /** Preload the model so the first question is not slow. */
  warm(): void;
};

const SAMPLE_RATE = 16000;
const MAX_MS = 60_000;

let worker: Worker | null = null;
let nextId = 1;
const pending = new Map<number, { resolve(t: string): void; reject(e: Error): void }>();

function getWorker(): Worker {
  if (worker) return worker;
  worker = new Worker(new URL('./whisper.worker.ts', import.meta.url), { type: 'module' });
  worker.onmessage = (e: MessageEvent<{ id: number; ok: boolean; text?: string; error?: string }>) => {
    const p = pending.get(e.data.id);
    if (!p) return;
    pending.delete(e.data.id);
    if (e.data.ok) p.resolve(e.data.text ?? '');
    else p.reject(new Error(e.data.error ?? 'transcription failed'));
  };
  // A worker that fails to load (the script, the model library) answers nothing: end everything that waits on it,
  // and make a new worker the next time, so the mic is never stuck on "writing down what you said".
  worker.onerror = () => {
    for (const p of pending.values()) p.reject(new Error('the speech model could not start'));
    pending.clear();
    worker?.terminate();
    worker = null;
  };
  return worker;
}

function call(type: 'warm' | 'transcribe', audio?: Float32Array): Promise<string> {
  const id = nextId++;
  return new Promise((resolve, reject) => {
    pending.set(id, { resolve, reject });
    getWorker().postMessage({ id, type, audio }, audio ? [audio.buffer] : []);
  });
}

const PARTIAL_EVERY_MS = 1500;

export function createRecorder(): Recorder {
  const available = typeof AudioContext !== 'undefined' && !!navigator.mediaDevices?.getUserMedia && typeof Worker !== 'undefined';
  let ctx: AudioContext | null = null;
  let stream: MediaStream | null = null;
  let node: ScriptProcessorNode | null = null;
  let chunks: Float32Array[] = [];
  let samples = 0;
  let timer: ReturnType<typeof setInterval> | undefined;
  let stopTimer: ReturnType<typeof setTimeout> | undefined;
  let inflight: Promise<unknown> | null = null;
  let session = 0;

  const all = (): Float32Array => {
    const out = new Float32Array(samples);
    let at = 0;
    for (const c of chunks) {
      out.set(c, at);
      at += c.length;
    }
    return out;
  };

  const release = () => {
    clearInterval(timer);
    clearTimeout(stopTimer);
    node?.disconnect();
    node = null;
    stream?.getTracks().forEach(t => t.stop());
    stream = null;
    void ctx?.close();
    ctx = null;
  };

  return {
    available,
    warm() {
      if (available) void call('warm').catch(() => {});
    },
    async start(onPartial) {
      if (ctx) return;
      const mine = ++session;
      stream = await navigator.mediaDevices.getUserMedia({ audio: { channelCount: 1, echoCancellation: true, noiseSuppression: true } });
      ctx = new AudioContext({ sampleRate: SAMPLE_RATE });
      chunks = [];
      samples = 0;
      const src = ctx.createMediaStreamSource(stream);
      node = ctx.createScriptProcessor(4096, 1, 1);
      node.onaudioprocess = e => {
        const c = e.inputBuffer.getChannelData(0).slice();
        chunks.push(c);
        samples += c.length;
      };
      src.connect(node);
      node.connect(ctx.destination);
      // Whisper does not stream: every 1.5 s transcribe everything said so far and show it as the live text.
      let lastLen = 0;
      timer = setInterval(() => {
        if (!onPartial || inflight || samples - lastLen < SAMPLE_RATE / 2) return;
        lastLen = samples;
        const run = call('transcribe', all())
          .then(text => session === mine && ctx && onPartial(text))
          .catch(() => {})
          .finally(() => {
            if (inflight === run) inflight = null;
          });
        inflight = run;
      }, PARTIAL_EVERY_MS);
      stopTimer = setTimeout(() => release(), MAX_MS);
    },
    async stop() {
      if (!ctx && samples === 0) return '';
      const audio = all();
      const pendingRun = inflight;
      release();
      session++;
      chunks = [];
      samples = 0;
      await pendingRun;
      if (audio.length < SAMPLE_RATE / 4) return '';
      return call('transcribe', audio);
    },
    cancel() {
      session++;
      release();
      chunks = [];
      samples = 0;
    },
  };
}

/** Transcribe one finished utterance (16 kHz mono) in the Whisper worker. */
export function transcribeLocal(audio: Float32Array): Promise<string> {
  return call('transcribe', audio);
}
