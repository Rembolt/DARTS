import { describe, expect, it } from 'vitest';
import { readRequest, runKeyword } from '../src/agent/keyword.js';
import type { AgentEvent } from '../src/shared/contract.js';
import { failedSummary, fakes, okSummary, row } from './agent-fakes.js';

function collect() {
  const events: AgentEvent[] = [];
  return { events, emit: (e: AgentEvent) => events.push(e) };
}
const live = () => new AbortController().signal;

describe('readRequest', () => {
  it('reads profiles', () => {
    expect(readRequest('a place to record music').profile).toBe('recording');
    expect(readRequest('somewhere quiet to sleep').profile).toBe('sleep');
    expect(readRequest('a house').profile).toBe('general');
    expect(readRequest('room for my drums').profile).toBe('rehearsal');
    expect(readRequest('I work from home').profile).toBe('home_office');
    expect(readRequest('a home theater').profile).toBe('home_theater');
    expect(readRequest('a cafe').profile).toBe('cafe_restaurant');
    expect(readRequest('a shop').profile).toBe('retail');
  });

  it('reads cities and zips', () => {
    expect(readRequest('studio in LA')).toMatchObject({ city: 'Los Angeles', otherCity: false });
    expect(readRequest('a house in los angeles')).toMatchObject({ city: 'Los Angeles' });
    expect(readRequest('quiet home in Houston')).toMatchObject({ city: 'Houston', otherCity: false });
    expect(readRequest('homes in 77008')).toMatchObject({ city: null, zip: '77008' });
    expect(readRequest('a lab in Boston').otherCity).toBe(true);
    expect(readRequest('quiet home in Downtown LA')).toMatchObject({ city: 'Los Angeles', otherCity: false });
    expect(readRequest('a house in Houston Heights').otherCity).toBe(false);
    expect(readRequest('quiet home in Montrose')).toMatchObject({ city: 'Houston', otherCity: false });
    expect(readRequest('a studio in Silver Lake')).toMatchObject({ city: 'Los Angeles', otherCity: false });
    expect(readRequest('a loft in River Oaks Houston')).toMatchObject({ city: 'Houston', otherCity: false });
    expect(readRequest('a flat place').city).toBeNull();
    expect(readRequest('a flat place').otherCity).toBe(false);
  });

  it('reads the kind', () => {
    expect(readRequest('an office for my team').kind).toBe('commercial');
    expect(readRequest('a retail store').kind).toBe('commercial');
    expect(readRequest('an apartment to sleep in').kind).toBe('apartment');
    expect(readRequest('a home office').kind).toBe('home');
    expect(readRequest('somewhere to record').kind).toBe('home');
  });
});

describe('runKeyword', () => {
  it('says another city is not possible', async () => {
    const f = fakes();
    const { events, emit } = collect();
    await runKeyword('a studio in Boston', f, emit, live());
    expect(events).toEqual([{ type: 'notPossible', reason: expect.objectContaining({ code: 'outside_coverage' }) }]);
    expect(f.calls.search).toHaveLength(0);
  });

  it('returns cards and one sentence', async () => {
    const f = fakes({ summaries: { aaaaaaaaaaa: okSummary('aaaaaaaaaaa', 0.6), bbbbbbbbbbb: okSummary('bbbbbbbbbbb', 0.9) } });
    const { events, emit } = collect();
    await runKeyword('a place to record music in Houston', f, emit, live());
    expect(f.calls.search[0].query).toMatchObject({ city: 'Houston', kind: 'home', limit: 5 });
    expect(f.calls.search[0].skip).toBeTypeOf('function');
    expect(f.calls.resolve[0][0]).toBe('recording');
    expect(events.filter(e => e.type === 'cards')).toHaveLength(2);
    const last = events[events.length - 1];
    expect(last).toEqual({ type: 'text', text: 'Best fit: bbbbbbbbbbb Main St. Room r0 has an estimated 0.4 s echo.' });
    expect(events.filter(e => e.type === 'text')).toHaveLength(1);
  });

  it('searches Los Angeles for an LA zip', async () => {
    const f = fakes();
    await runKeyword('homes in 90026', f, () => {}, live());
    expect(f.calls.search[0].query).toMatchObject({ city: 'Los Angeles', zip: '90026' });
  });

  it('says when nothing matches, naming the filter', async () => {
    const f = fakes({ searchResult: { total: 0, rows: [], notes: ['Nothing matches that. Removing the zip would give 12 properties.'] } });
    const { events, emit } = collect();
    await runKeyword('homes in 77999', f, emit, live());
    expect(events[events.length - 1]).toEqual({ type: 'notPossible', reason: expect.objectContaining({ code: 'no_results', message: expect.stringMatching(/zip/) }) });
    expect(f.calls.summarise).toHaveLength(0);
  });

  it('passes a search NotPossible on', async () => {
    const f = fakes({ searchResult: { code: 'index_missing', message: 'x', retry: false } });
    const { events, emit } = collect();
    await runKeyword('a house', f, emit, live());
    expect(events[events.length - 1]).toMatchObject({ type: 'notPossible', reason: { code: 'index_missing' } });
  });

  it('says when nothing is usable', async () => {
    const f = fakes({ rows: [row('aaaaaaaaaaa'), row('bbbbbbbbbbb'), row('ccccccccccc')],
      summaries: { aaaaaaaaaaa: failedSummary('aaaaaaaaaaa'), bbbbbbbbbbb: failedSummary('bbbbbbbbbbb'), ccccccccccc: failedSummary('ccccccccccc') } });
    const { events, emit } = collect();
    await runKeyword('an office', f, emit, live());
    expect(events.filter(e => e.type === 'cards')).toHaveLength(3);
    const last = events[events.length - 1];
    expect(last).toMatchObject({ type: 'notPossible', reason: { code: 'none_usable' } });
    expect(last.type === 'notPossible' && last.reason.message).toMatch(/^I found 3 properties but none/);
    expect(events.findIndex(e => e.type === 'notPossible')).toBe(events.length - 1);
  });

  it('stops when aborted', async () => {
    const f = fakes();
    const controller = new AbortController();
    controller.abort();
    const { events, emit } = collect();
    await runKeyword('a place to record music', f, emit, controller.signal);
    expect(events).toEqual([]);
    expect(f.calls.search).toHaveLength(0);
    expect(f.calls.summarise).toHaveLength(0);
  });

  it('emits nothing more once aborted during the summaries', async () => {
    const controller = new AbortController();
    const f = fakes({ summaries: { aaaaaaaaaaa: async () => { controller.abort(); return okSummary('aaaaaaaaaaa', 0.5); } } });
    const { events, emit } = collect();
    await runKeyword('a house', f, emit, controller.signal);
    expect(events.some(e => e.type === 'cards' || e.type === 'text')).toBe(false);
  });
});
