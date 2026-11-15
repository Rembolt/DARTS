// Agents talk: text goes to our server (`/api/tts`, which holds the ElevenLabs key) and the audio plays here.
// One voice at a time: a new line cuts the old one. No key on the server, or muted, or the browser refuses to
// play: `speak` resolves false and the caller keeps its text-only behaviour. Nothing here ever throws.
import { signal } from '@preact/signals';

export type VoiceId = 'jev' | 'front';

const MUTE_KEY = 'acoustic:voice-muted';
const MAX_CHARS = 1200;

function readMuted(): boolean {
  try {
    return localStorage.getItem(MUTE_KEY) === '1';
  } catch {
    return false;
  }
}

export const voiceMuted = signal(readMuted());
export function setVoiceMuted(muted: boolean): void {
  voiceMuted.value = muted;
  try {
    localStorage.setItem(MUTE_KEY, muted ? '1' : '0');
  } catch {
    /* private window */
  }
  if (muted) stopSpeaking();
}

/** What a person would say aloud: no markdown marks, links or bullets, and a sensible length. */
export function speakable(text: string): string {
  const clean = text
    .replace(/```[\s\S]*?```/g, ' ')
    .replace(/\[([^\]]+)\]\([^)]*\)/g, '$1')
    .replace(/https?:\/\/\S+/g, ' ')
    .replace(/[*_`#>~]+/g, '')
    .replace(/^\s*[-•]\s+/gm, '')
    .replace(/\s+/g, ' ')
    .trim();
  if (clean.length <= MAX_CHARS) return clean;
  const cut = clean.slice(0, MAX_CHARS);
  const end = Math.max(cut.lastIndexOf('. '), cut.lastIndexOf('? '), cut.lastIndexOf('! '));
  return end > 200 ? cut.slice(0, end + 1) : cut;
}

let audio: HTMLAudioElement | null = null;
let token = 0;
let offForGood = false; // the server said voice is not set up: stop asking this session
let stopCurrent: (() => void) | null = null;

/** Browsers only let a page play sound after a click. The first click or key unlocks one shared player. */
function unlock(): void {
  if (audio || typeof Audio === 'undefined') return;
  audio = new Audio();
  audio.src = 'data:audio/wav;base64,UklGRiQAAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQAAAAA=';
  // play() returns nothing in old browsers and in jsdom.
  void audio.play()?.catch(() => {});
}
if (typeof window !== 'undefined') {
  for (const type of ['pointerdown', 'keydown'] as const) window.addEventListener(type, unlock, { once: true, capture: true });
}

/** Hold the line for a moment (someone started talking). Returns true if something was playing. */
export function pauseSpeaking(): boolean {
  if (!stopCurrent || !audio || audio.paused) return false;
  audio.pause();
  return true;
}

/** It was only a cough or an "mm-hm": carry on where the line stopped. */
export function resumeSpeaking(): void {
  if (stopCurrent && audio?.paused && !audio.ended) void audio.play().catch(() => {});
}

export function stopSpeaking(): void {
  token++;
  stopCurrent?.();
  stopCurrent = null;
}

/**
 * Say `text` aloud. `onState(true)` when sound starts, `onState(false)` when it ends or is cut.
 * Resolves true if it played to the end, false if nothing was played or it was cut.
 */
export async function speak(text: string, voice: VoiceId, onState?: (speaking: boolean) => void, fetchFn: typeof fetch = fetch): Promise<boolean> {
  pending++;
  try {
    // A small "mm" that is already playing finishes first: a reply that cuts it mid-sound is the opposite of human.
    if (fillerPlaying) await fillerPlaying;
    return await play(text, voice, onState, fetchFn);
  } finally {
    pending--;
  }
}

let pending = 0;
let fillerPlaying: Promise<boolean> | null = null;
/** True while a line is being fetched or played. */
export const isTalking = (): boolean => pending > 0;

const ACKS = {
  change: ['Of course, one moment.', 'Sure, on it.', 'Absolutely, doing that now.', 'Right away.'],
  search: ['Certainly, let me look for that.', 'Sure, let me pull up some options.', 'Of course, searching now.', 'Happy to, one moment.'],
  ask: ['Sure, let me check.', 'Good question, one moment.', 'Let me take a look.', 'One moment, checking that.'],
} as const;
const lastAck: Record<string, number> = {};

/** What a good secretary or agent says first: a quick, fitting "yes, on it", chosen by what was asked. */
export function ackFor(userText: string): string {
  const t = userText.toLowerCase();
  const kind: keyof typeof ACKS = /\b(find|search|looking for|show me|recommend|where can|place to|home for|house for)\b/.test(t)
    ? 'search'
    : /\b(close|open|add|put|place|set|change|swap|move|remove|turn|make|play|try)\b/.test(t)
      ? 'change'
      : 'ask';
  const list = ACKS[kind];
  let i: number;
  do i = Math.floor(Math.random() * list.length);
  while (list.length > 1 && i === lastAck[kind]);
  lastAck[kind] = i;
  return list[i];
}

/** The short version of a reply for the ear: the headline only, never the bullets or a second paragraph. */
export function briefly(text: string): string {
  const lines = text
    .replace(/\[\[confirm\]\]/g, '')
    .split('\n')
    .map(l => l.trim())
    .filter(Boolean);
  const head = lines.find(l => !/^[-•*]\s/.test(l)) ?? lines[0] ?? '';
  const sentences = speakable(head).split(/(?<=[.!?])\s+/).map(x => `${x} `);
  let out = '';
  for (const s of sentences) {
    if (out && (out + s).length > 200) break;
    out += s;
    if (out.length > 90) break;
  }
  return out.trim();
}

/** Say a quick acknowledgement of what was just asked. Skips if anything is already being said. */
export function speakAck(voice: VoiceId, userText: string, onState?: (speaking: boolean) => void): void {
  if (isTalking() || voiceMuted.value) return;
  pending++;
  const run = play(ackFor(userText), voice, onState, fetch).finally(() => {
    pending--;
    if (fillerPlaying === run) fillerPlaying = null;
  });
  fillerPlaying = run;
}

/** Acknowledge after `afterMs` unless the answer has already begun. Call the returned function when it does (or fails). */
export function ackAfter(voice: VoiceId, userText: string, afterMs = 150, onState?: (speaking: boolean) => void): () => void {
  const timer = setTimeout(() => speakAck(voice, userText, onState), afterMs);
  return () => clearTimeout(timer);
}

/** Fetch the acknowledgements ahead of time so the first "of course" has no wait. The server caches them. */
export function warmAcks(voice: VoiceId): void {
  for (const list of Object.values(ACKS)) for (const line of list) void fetch('/api/tts', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ text: line, voice }) }).catch(() => {});
}

async function play(text: string, voice: VoiceId, onState: ((speaking: boolean) => void) | undefined, fetchFn: typeof fetch): Promise<boolean> {
  stopSpeaking();
  const mine = token;
  const line = speakable(text);
  if (!line || voiceMuted.value || offForGood) return false;
  try {
    const res = await fetchFn('/api/tts', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ text: line, voice }) });
    if (res.status === 503) offForGood = true;
    if (!res.ok || mine !== token) return false;
    const blob = await res.blob();
    if (mine !== token) return false;
    unlock();
    const player = audio ?? new Audio();
    const url = URL.createObjectURL(blob);
    return await new Promise<boolean>(resolve => {
      const finish = (played: boolean) => {
        player.onended = player.onerror = null;
        player.pause();
        URL.revokeObjectURL(url);
        if (stopCurrent === cut) stopCurrent = null;
        onState?.(false);
        resolve(played);
      };
      const cut = () => finish(false);
      stopCurrent = cut;
      player.onended = () => finish(true);
      player.onerror = () => finish(false);
      player.src = url;
      player.play().then(() => onState?.(true), () => finish(false));
    });
  } catch {
    return false;
  }
}
