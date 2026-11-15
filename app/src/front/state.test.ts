import { describe, expect, it } from 'vitest';
import { notPossible, type QuickSummary } from '../../../server/src/shared/contract';
import { EMPTY, load, reduce, save, type FrontState } from './state';

const failed = (id: string, address = 'x'): QuickSummary => ({ ok: false, modelId: id, address, reason: notPossible('no_room_data') });

function memory(initial: Record<string, string> = {}): Storage & { data: Record<string, string> } {
  const data = { ...initial };
  return {
    data,
    getItem: (k: string) => (k in data ? data[k] : null),
    setItem: (k: string, v: string) => { data[k] = v; },
    removeItem: (k: string) => { delete data[k]; },
    clear: () => { for (const k of Object.keys(data)) delete data[k]; },
    key: () => null,
    get length() { return Object.keys(data).length; },
  };
}

const run = (state: FrontState, ...events: Parameters<typeof reduce>[1][]) => events.reduce(reduce, state);

describe('reduce', () => {
  it('collects a run', () => {
    const s = run(EMPTY,
      { type: 'ask', text: 'record music in Houston' },
      { type: 'conversation', conversationId: 'c1', fresh: true },
      { type: 'status', text: 'Searching homes in Houston…' },
      { type: 'cards', summaries: [failed('aaaaaaaaaaa')] },
      { type: 'text', text: 'Best fit: …' },
      { type: 'done' });
    expect(s.question).toBe('record music in Houston');
    expect(s.conversationId).toBe('c1');
    expect(s.statusLines).toEqual(['Searching homes in Houston…']);
    expect(s.summaries).toHaveLength(1);
    expect(s.answer).toBe('Best fit: …');
    expect(s.running).toBe(false);
  });

  it('shows Stop state while running and clears it on stop', () => {
    const s = reduce(EMPTY, { type: 'ask', text: 'q' });
    expect(s.running).toBe(true);
    expect(reduce(s, { type: 'stop' }).running).toBe(false);
  });

  it('keeps earlier cards while a new question runs', () => {
    const first = run(EMPTY, { type: 'ask', text: 'a' }, { type: 'cards', summaries: [failed('aaaaaaaaaaa')] }, { type: 'status', text: 's' },
      { type: 'text', text: 'old' }, { type: 'notPossible', reason: notPossible('no_results') }, { type: 'done' });
    const asked = reduce(first, { type: 'ask', text: 'b' });
    expect(asked.summaries).toHaveLength(1);
    expect(asked.statusLines).toEqual([]);
    expect(asked.answer).toBe('');
    expect(asked.notPossible).toEqual([]);
    // the new run's first cards replace the old ones; later cards of the same run merge
    const next = run(asked, { type: 'cards', summaries: [failed('bbbbbbbbbbb')] }, { type: 'cards', summaries: [failed('ccccccccccc')] });
    expect(next.summaries.map(s => s.modelId)).toEqual(['bbbbbbbbbbb', 'ccccccccccc']);
  });

  it('merges cards by model id', () => {
    const s = run(EMPTY, { type: 'ask', text: 'a' },
      { type: 'cards', summaries: [failed('aaaaaaaaaaa', 'first')] },
      { type: 'cards', summaries: [failed('bbbbbbbbbbb')] },
      { type: 'cards', summaries: [failed('aaaaaaaaaaa', 'second')] });
    expect(s.summaries).toHaveLength(2);
    expect(s.summaries.find(x => x.modelId === 'aaaaaaaaaaa')).toMatchObject({ address: 'second' });
  });

  it('highlights the property the agent opened', () => {
    expect(reduce(EMPTY, { type: 'open', modelId: 'aaaaaaaaaaa', reason: 'quiet' }).highlighted).toBe('aaaaaaaaaaa');
  });

  it('says when the server started a new conversation', () => {
    const known = { ...EMPTY, conversationId: 'old' };
    const s = reduce(known, { type: 'conversation', conversationId: 'new', fresh: true });
    expect(s.conversationId).toBe('new');
    expect(s.statusLines).toEqual(['Started a new conversation.']);
    expect(reduce(EMPTY, { type: 'conversation', conversationId: 'c', fresh: true }).statusLines).toEqual([]);
  });

  it('collects not-possible reasons once each', () => {
    const s = run(EMPTY, { type: 'notPossible', reason: notPossible('busy') }, { type: 'notPossible', reason: notPossible('busy') });
    expect(s.notPossible).toEqual([notPossible('busy')]);
  });
});

describe('save and load', () => {
  it('survives a blocked storage', () => {
    const blocked = { getItem() { throw new Error('x'); }, setItem() { throw new Error('x'); } } as unknown as Storage;
    expect(load(blocked)).toEqual(EMPTY);
    expect(() => save(EMPTY, blocked)).not.toThrow();
  });

  it('restores a saved run, never as running', () => {
    const storage = memory();
    const s = run(EMPTY, { type: 'ask', text: 'q' }, { type: 'conversation', conversationId: 'c1', fresh: true },
      { type: 'cards', summaries: [failed('aaaaaaaaaaa')] }, { type: 'text', text: 'answer' });
    save(s, storage);
    expect(Object.keys(storage.data)).toEqual(['front:v1']);
    const back = load(storage);
    expect(back).toEqual({ ...s, running: false });
  });

  it('ignores malformed saved data', () => {
    expect(load(memory({ 'front:v1': '{"summaries":5' }))).toEqual(EMPTY);
    expect(load(memory({ 'front:v1': '{"summaries":5}' }))).toEqual(EMPTY);
    expect(load(memory({ 'front:v1': '{"summaries":[{"nope":1}]}' }))).toEqual(EMPTY);
    expect(load(memory({ 'front:v1': 'null' }))).toEqual(EMPTY);
    expect(load(memory())).toEqual(EMPTY);
  });

  it('mapFocus moves the map to the right city and the next question clears it', () => {
    const focused = reduce(EMPTY, { type: 'mapFocus', lat: 34.05, lon: -118.25, radiusKm: 2, reason: 'Downtown LA' });
    expect(focused.city).toBe('Los Angeles');
    expect(focused.focus).toMatchObject({ radiusKm: 2, reason: 'Downtown LA' });
    expect(reduce(focused, { type: 'ask', text: 'again' }).focus).toBeNull();
  });
});
