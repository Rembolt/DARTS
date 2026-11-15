// Hands-free conversation: the mic stays open, a voice-activity detector finds where each sentence starts and
// ends, the sentence is transcribed (ElevenLabs Scribe through our server, browser Whisper if that is not
// available) and handed to the caller. Speaking over the agent cuts it off (barge-in). Headphones are assumed:
// they are what this app is for, and they keep the agent's own voice out of the mic.
import { pauseSpeaking, resumeSpeaking, stopSpeaking } from './speak';
import { transcribeLocal } from './whisper';

const RATE = 16000;
const FRAME = 1024; // 64 ms
const PREROLL_FRAMES = 5; // keep the 320 ms before the detector fired, so the first word is not clipped

export type VadOptions = {
  /** Loud this long to count as the start of speech. */
  startMs: number;
  /** Quiet this long to count as the end. */
  endMs: number;
  /** Shorter than this is a cough or a click, not a sentence. */
  minMs: number;
  /** Never record longer than this in one go. */
  maxMs: number;
  /** Absolute floor for the loudness threshold (RMS 0..1). */
  minLevel: number;
};
export const VAD_DEFAULTS: VadOptions = { startMs: 150, endMs: 950, minMs: 400, maxMs: 30_000, minLevel: 0.012 };

export type VadEvent = 'start' | 'end' | 'cancel' | null;

/** Pure detector: feed it each frame's loudness. `strict` raises the bar while the agent is talking. */
export function createVad(options: Partial<VadOptions> = {}) {
  const o = { ...VAD_DEFAULTS, ...options };
  let floor = 0.004;
  let speaking = false;
  let loudMs = 0;
  let quietMs = 0;
  let spokeMs = 0;
  let loudRunMs = 0;
  return {
    get speaking() {
      return speaking;
    },
    feed(rms: number, ms: number, strict = false): VadEvent {
      const threshold = Math.max(o.minLevel, floor * 3) * (strict && !speaking ? 2.5 : 1);
      const loud = rms > threshold;
      if (!speaking) {
        // Learn the room's level while nobody talks. A steady sound (background music, a fan) lifts the floor within
        // a few seconds, so it stops counting as speech; a voice is short and louder than the floor, so it still does.
        floor += (rms - floor) * (loud ? 0.012 : 0.05);
        loudMs = loud ? loudMs + ms : 0;
        if (loudMs >= o.startMs) {
          speaking = true;
          loudRunMs = 0;
          quietMs = 0;
          spokeMs = loudMs;
          return 'start';
        }
        return null;
      }
      spokeMs += ms;
      quietMs = loud ? 0 : quietMs + ms;
      // Speech has small gaps; music never does. Loud for 4 s straight with no gap: treat it as background and let the floor catch up.
      loudRunMs = loud ? loudRunMs + ms : 0;
      if (loudRunMs > 4000) floor += (rms - floor) * 0.02;
      if (quietMs >= o.endMs || spokeMs >= o.maxMs) {
        const long = spokeMs - quietMs >= o.minMs;
        speaking = false;
        loudMs = 0;
        quietMs = 0;
        return long ? 'end' : 'cancel';
      }
      return null;
    },
  };
}

/** 16-bit PCM WAV, mono 16 kHz. */
export function toWav(samples: Float32Array): Uint8Array<ArrayBuffer> {
  const out = new DataView(new ArrayBuffer(44 + samples.length * 2));
  const text = (at: number, s: string) => [...s].forEach((c, i) => out.setUint8(at + i, c.charCodeAt(0)));
  text(0, 'RIFF');
  out.setUint32(4, 36 + samples.length * 2, true);
  text(8, 'WAVEfmt ');
  out.setUint32(16, 16, true);
  out.setUint16(20, 1, true);
  out.setUint16(22, 1, true);
  out.setUint32(24, RATE, true);
  out.setUint32(28, RATE * 2, true);
  out.setUint16(32, 2, true);
  out.setUint16(34, 16, true);
  text(36, 'data');
  out.setUint32(40, samples.length * 2, true);
  samples.forEach((v, i) => out.setInt16(44 + i * 2, Math.max(-1, Math.min(1, v)) * 0x7fff, true));
  return new Uint8Array(out.buffer);
}

let cloudOff = false; // Scribe said no (no key, or the key lacks Speech to Text): use Whisper from now on

export async function transcribe(audio: Float32Array, fetchFn: typeof fetch = fetch, local = transcribeLocal): Promise<string> {
  if (!cloudOff) {
    try {
      const res = await fetchFn('/api/stt', { method: 'POST', headers: { 'Content-Type': 'audio/wav' }, body: new Blob([toWav(audio)], { type: 'audio/wav' }) });
      if (res.ok) return String(((await res.json()) as { text?: unknown }).text ?? '').trim();
      if (res.status === 503 || res.status === 403 || res.status === 404) cloudOff = true;
    } catch {
      /* offline or the server is restarting: Whisper this time */
    }
  }
  return local(audio);
}

export type Conversation = {
  stop(): void;
  /** Muted: the mic stays open but nothing is heard, so nothing is sent. */
  setMuted(muted: boolean): void;
};

const STOP_WORDS = /^(stop|wait|hold on|hang on|no|cancel|pause|enough|never ?mind|actually)\b/i;
const BACKCHANNEL = /^(yeah|yes|yep|okay|ok|right|sure|mm+(-?hm+)?|uh+(-?huh)?|hm+|oh|ah|well|so|um+|and|but)\W*$/i;

/**
 * While the agent is busy, is this really the user taking the floor? A single word or a "mm-hm" is almost always
 * an accident or a nod, so the agent keeps going. A real sentence, or "stop" / "wait", takes over.
 */
export function takesTheFloor(text: string): boolean {
  const t = text.trim();
  if (STOP_WORDS.test(t)) return true;
  if (BACKCHANNEL.test(t)) return false;
  return t.split(/\s+/).filter(Boolean).length >= 3;
}

/** What Whisper writes for music, silence or noise. Not something a person said. */
export function isJunk(text: string): boolean {
  const t = text.trim();
  if (!/[a-z0-9]/i.test(t)) return true; // only symbols such as ♪
  if (/^[\[(*♪\s]*(music|applause|silence|noise|laughter|laughs|inaudible|blank[_ ]audio|background[^\])]*)[\])*♪\s.]*$/i.test(t)) return true;
  return /^(you|thank you|thanks for watching|bye)[.!\s]*$/i.test(t); // typical hallucinations on non-speech
}

export type ConverseDeps = {
  /** A finished sentence. */
  onText(text: string): void;
  /** The user started or stopped talking (for the orb and the status line). */
  onUserSpeaking(on: boolean): void;
  /** True while the agent is thinking or speaking: the user talking now is a barge-in. */
  agentBusy(): boolean;
  /** The user talked over the agent: stop its request. (Speech is already cut.) */
  onBargeIn(): void;
  onTranscribing(on: boolean): void;
};

/** Open the mic and start the loop. Rejects if the mic is blocked. */
export async function startConversation(deps: ConverseDeps): Promise<Conversation> {
  const stream = await navigator.mediaDevices.getUserMedia({ audio: { channelCount: 1, echoCancellation: true, noiseSuppression: true, autoGainControl: true } });
  const ctx = new AudioContext({ sampleRate: RATE });
  const src = ctx.createMediaStreamSource(stream);
  const node = ctx.createScriptProcessor(FRAME, 1, 1);
  const vad = createVad();
  const ms = (FRAME / RATE) * 1000;
  let ring: Float32Array[] = [];
  let take: Float32Array[] = [];
  let alive = true;
  let muted = false;
  let interrupting = false;

  node.onaudioprocess = e => {
    if (!alive || muted) return;
    const frame = e.inputBuffer.getChannelData(0).slice();
    let sum = 0;
    for (const v of frame) sum += v * v;
    const busy = deps.agentBusy();
    const event = vad.feed(Math.sqrt(sum / frame.length), ms, busy);
    if (event === 'start') {
      // Do not cut the agent yet: it may be a cough or one stray word. Hold its voice and wait to hear what this is.
      interrupting = busy;
      if (busy) pauseSpeaking();
      take = [...ring, frame];
      deps.onUserSpeaking(true);
    } else if (vad.speaking) {
      take.push(frame);
    } else if (event === 'end' || event === 'cancel') {
      take.push(frame);
      const frames = take;
      take = [];
      deps.onUserSpeaking(false);
      if (event === 'cancel' && interrupting) resumeSpeaking();
      if (event === 'end') {
        const wasInterrupt = interrupting;
        const audio = new Float32Array(frames.reduce((n, f) => n + f.length, 0));
        let at = 0;
        for (const f of frames) (audio.set(f, at), (at += f.length));
        deps.onTranscribing(true);
        transcribe(audio)
          .then(text => {
            if (!alive || muted) return;
            const heard = !!text && !isJunk(text);
            if (!wasInterrupt) {
              if (heard) deps.onText(text);
              return;
            }
            if (heard && takesTheFloor(text)) {
              stopSpeaking();
              deps.onBargeIn();
              deps.onText(text);
            } else {
              resumeSpeaking(); // an accident or a nod: the agent carries on
            }
          })
          .catch(() => {})
          .finally(() => deps.onTranscribing(false));
      }
    }
    ring = [...ring.slice(-(PREROLL_FRAMES - 1)), frame];
  };
  src.connect(node);
  node.connect(ctx.destination);

  return {
    setMuted(m) {
      muted = m;
      if (m) {
        take = [];
        deps.onUserSpeaking(false);
      }
    },
    stop() {
      if (!alive) return;
      alive = false;
      node.disconnect();
      stream.getTracks().forEach(t => t.stop());
      void ctx.close();
      deps.onUserSpeaking(false);
    },
  };
}
