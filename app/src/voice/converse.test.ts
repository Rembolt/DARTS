import { describe, expect, it } from 'vitest';
import { createVad, toWav, transcribe } from './converse';

function run(vad: ReturnType<typeof createVad>, levels: number[], strict = false) {
  return levels.map(l => vad.feed(l, 64, strict)).filter(Boolean);
}
const talk = (ms: number) => Array(Math.round(ms / 64)).fill(0.1);
const hush = (ms: number) => Array(Math.round(ms / 64)).fill(0.003);

describe('vad', () => {
  it('finds one sentence: start, then end after the pause', () => {
    expect(run(createVad(), [...hush(500), ...talk(1200), ...hush(1200)])).toEqual(['start', 'end']);
  });
  it('ignores a short click', () => {
    expect(run(createVad(), [...hush(300), ...talk(192), ...hush(1200)])).toEqual(['start', 'cancel']);
  });
  it('keeps one sentence through a short pause', () => {
    expect(run(createVad(), [...talk(800), ...hush(500), ...talk(800), ...hush(1200)])).toEqual(['start', 'end']);
  });
  it('needs a louder voice to interrupt the agent', () => {
    expect(run(createVad(), Array(10).fill(0.02), true)).toEqual([]);
    expect(run(createVad(), Array(10).fill(0.02), false)).toEqual(['start']);
  });
});

describe('wav', () => {
  it('writes a 16 kHz mono 16-bit header', () => {
    const wav = toWav(new Float32Array(100));
    const view = new DataView(wav.buffer);
    expect(wav.length).toBe(244);
    expect(view.getUint32(24, true)).toBe(16000);
    expect(String.fromCharCode(...wav.slice(0, 4))).toBe('RIFF');
  });
});

describe('transcribe', () => {
  it('uses Scribe, then falls back to Whisper for good when the server says no', async () => {
    let cloud = 0;
    const no = (async () => (cloud++, new Response('{}', { status: 403 }))) as typeof fetch;
    const local = async () => 'from whisper';
    expect(await transcribe(new Float32Array(10), no, local)).toBe('from whisper');
    expect(await transcribe(new Float32Array(10), no, local)).toBe('from whisper');
    expect(cloud).toBe(1);
  });
});

import { isJunk } from './converse';

describe('background sound', () => {
  it('steady music stops counting as speech once the floor has caught up, but a voice over it still does', () => {
    const vad = createVad();
    const music = Array(120).fill(0.05); // about 7.7 s of steady music
    const events = run(vad, music);
    expect(events.length).toBeLessThanOrEqual(2); // may start once at the very beginning, then it is the floor
    expect(run(vad, Array(10).fill(0.05))).toEqual([]);
    expect(run(vad, [...Array(10).fill(0.4), ...Array(20).fill(0.05)])).toContain('start');
  });
  it('drops what Whisper writes for music or silence', () => {
    for (const t of ['[Music]', '(music)', '♪♪', '[BLANK_AUDIO]', 'Thank you.', 'you', '...']) expect(isJunk(t)).toBe(true);
    for (const t of ['close all the doors', 'how echoey is the kitchen']) expect(isJunk(t)).toBe(false);
  });
});

import { takesTheFloor } from './converse';

describe('interrupting the agent', () => {
  it('ignores one stray word or a nod, takes a real sentence or "stop"', () => {
    for (const t of ['kitchen', 'okay', 'mm-hm', 'yeah.', 'um']) expect(takesTheFloor(t)).toBe(false);
    for (const t of ['stop', 'Wait', 'no, the bedroom', 'close all the doors', 'how about the garage']) expect(takesTheFloor(t)).toBe(true);
  });
});
