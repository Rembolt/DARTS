import { describe, expect, it } from 'vitest';
import { speak, speakable } from './speak';

describe('speakable', () => {
  it('drops markdown, links and bullets', () => {
    expect(speakable('**Quiet** room, see [the map](http://x.y/z) or https://a.b\n- one\n- two')).toBe('Quiet room, see the map or one two');
  });
  it('cuts long text at a sentence end', () => {
    const long = 'Sentence number one is here. '.repeat(80);
    const out = speakable(long);
    expect(out.length).toBeLessThanOrEqual(1200);
    expect(out.endsWith('.')).toBe(true);
  });
});

describe('speak', () => {
  it('resolves false without playing when the server has no voice', async () => {
    const states: boolean[] = [];
    const fetchFn = (async () => new Response('{}', { status: 503 })) as typeof fetch;
    expect(await speak('Hello there', 'jev', s => states.push(s), fetchFn)).toBe(false);
    expect(states).toEqual([]);
  });
  it('resolves false for empty text without a request', async () => {
    let called = false;
    const fetchFn = (async () => ((called = true), new Response('')) ) as typeof fetch;
    expect(await speak('  **  ', 'front', undefined, fetchFn)).toBe(false);
    expect(called).toBe(false);
  });
});

describe('fillers', () => {
  it('fillerAfter does nothing when cancelled in time', async () => {
    const { ackAfter, isTalking } = await import('./speak');
    const cancel = ackAfter('jev', 'hi', 20);
    cancel();
    await new Promise(r => setTimeout(r, 50));
    expect(isTalking()).toBe(false);
  });
});

describe('briefly and ackFor', () => {
  it('speaks only the headline, not the bullets or the confirm token', async () => {
    const { briefly } = await import('./speak');
    expect(briefly('The kitchen echo is about 0.6 s, estimated.\n- Tile floor\n- Bare walls\n[[confirm]]')).toBe('The kitchen echo is about 0.6 s, estimated.');
    expect(briefly('One. Two. Three. Four. Five. Six.').length).toBeLessThan(200);
  });
  it('picks an acknowledgement that fits the request', async () => {
    const { ackFor } = await import('./speak');
    expect(ackFor('close all the doors')).toMatch(/moment|on it|doing that|right away/i);
    expect(ackFor('find me a quiet place to record')).toMatch(/look|options|search|happy/i);
    expect(ackFor('how echoey is the kitchen')).toMatch(/check|question|look|moment/i);
  });
});
