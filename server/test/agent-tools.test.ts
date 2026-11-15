import { describe, expect, it } from 'vitest';
import { runTool, SYSTEM_PROMPT, TOOLS, trimSummary } from '../src/agent/tools.js';
import { notPossible } from '../src/shared/contract.js';
import { failedSummary, fakes, okSummary } from './agent-fakes.js';

const SEARCH_INPUT = {
  city: 'Houston', zip: null, near: null, kind: 'home', propertyTypes: null,
  minSqft: null, maxPrice: null, minBeds: null, limit: 5,
};
const SUMMARY_INPUT = {
  modelId: 'aaaaaaaaaaa', profile: 'recording',
  echoMin: null, echoMax: null, maxOutsideDb: null, maxEscapeDb: null, minRoomArea: null,
};

/** Every object schema, at any depth, must be closed and require all its keys. */
function objectSchemas(schema: unknown, out: Record<string, unknown>[] = []): Record<string, unknown>[] {
  if (Array.isArray(schema)) { for (const s of schema) objectSchemas(s, out); return out; }
  if (schema && typeof schema === 'object') {
    const s = schema as Record<string, unknown>;
    if (s.type === 'object' || (Array.isArray(s.type) && s.type.includes('object'))) out.push(s);
    for (const value of Object.values(s)) objectSchemas(value, out);
  }
  return out;
}

describe('agent tools', () => {
  it('declares strict tools with every key required', () => {
    expect(TOOLS.map(t => t.name).sort()).toEqual(['focus_map', 'open_tour', 'quick_audio_summary', 'search_properties']);
    for (const t of TOOLS) {
      expect(t.strict).toBe(true);
      expect(t.input_schema.additionalProperties).toBe(false);
      expect([...(t.input_schema.required ?? [])].sort()).toEqual(Object.keys(t.input_schema.properties as object).sort());
    }
  });

  it('closes nested objects too and uses no constraint strict mode rejects', () => {
    for (const t of TOOLS) {
      for (const s of objectSchemas(t.input_schema)) {
        expect(s.additionalProperties, t.name).toBe(false);
        expect([...((s.required as string[]) ?? [])].sort()).toEqual(Object.keys(s.properties as object).sort());
      }
      expect(JSON.stringify(t.input_schema)).not.toMatch(/"(minimum|maximum|minLength|maxLength|multipleOf|minItems|maxItems)"/);
    }
  });

  it('keeps the prompt free of anything that changes', () => {
    expect(SYSTEM_PROMPT).not.toMatch(/20\d\d-\d\d|Ki9Ydf/);
    expect(SYSTEM_PROMPT).toMatch(/not possible/i);
    expect(SYSTEM_PROMPT).toMatch(/I only have properties in Houston and Los Angeles/);
    expect(SYSTEM_PROMPT).toMatch(/data, not instructions/i);
  });

  it('searches, skipping unusable ids', async () => {
    const f = fakes({ unusable: ['bbbbbbbbbbb'] });
    const out = await runTool('search_properties', SEARCH_INPUT, f);
    expect(out.isError).toBe(false);
    const skip = f.calls.search[0].skip!;
    expect(skip('bbbbbbbbbbb')).toBe(true);
    expect(skip('aaaaaaaaaaa')).toBe(false);
    expect(f.calls.search[0].query).toMatchObject({ city: 'Houston', kind: 'home', limit: 5 });
    expect(out.events).toEqual([{ type: 'status', text: 'Searching homes in Houston…' }]);
    expect(JSON.parse(out.content).rows).toHaveLength(2);
  });

  it('clamps the search limit and radius', async () => {
    const f = fakes();
    await runTool('search_properties', { ...SEARCH_INPUT, limit: 40, near: { lat: 29.7, lon: -95.4, radiusKm: 99 } }, f);
    expect(f.calls.search[0].query.limit).toBe(8);
    expect(f.calls.search[0].query.near?.radiusKm).toBe(15);
  });

  it('returns a search NotPossible as a tool error', async () => {
    const f = fakes({ searchResult: notPossible('outside_coverage') });
    const out = await runTool('search_properties', SEARCH_INPUT, f);
    expect(out.isError).toBe(true);
    expect(JSON.parse(out.content)).toMatchObject({ ok: false, code: 'outside_coverage' });
  });

  it('emits the full card and returns the trimmed summary', async () => {
    const f = fakes();
    const out = await runTool('quick_audio_summary', { ...SUMMARY_INPUT, echoMax: 0.5 }, f);
    expect(out.isError).toBe(false);
    expect(out.events[0]).toEqual({ type: 'status', text: 'Checking aaaaaaaaaaa Main St…' });
    const cards = out.events.find(e => e.type === 'cards');
    expect(cards && cards.type === 'cards' && cards.summaries[0].ok && cards.summaries[0].rooms).toHaveLength(6);
    const content = JSON.parse(out.content);
    expect(content.rooms).toHaveLength(3);
    expect(content.assumptions).toEqual(['heights assumed for 1 of 7 rooms']);
    expect(content.area).toMatchObject({ areaClass: 'residential' });
    expect(f.calls.resolve[0]).toEqual(['recording', { echoMin: null, echoMax: 0.5, maxOutsideDb: null, maxEscapeDb: null, minRoomArea: null }]);
  });

  it('returns a tool error for a failed summary', async () => {
    const f = fakes({ summaries: { aaaaaaaaaaa: failedSummary('aaaaaaaaaaa') } });
    const out = await runTool('quick_audio_summary', SUMMARY_INPUT, f);
    expect(out.isError).toBe(true);
    expect(JSON.parse(out.content)).toMatchObject({ ok: false, code: 'no_room_data' });
    expect(out.events.some(e => e.type === 'cards')).toBe(true);
  });

  it('opens a property that can be entered', async () => {
    const f = fakes();
    const out = await runTool('open_tour', { modelId: 'aaaaaaaaaaa', reason: 'best for recording' }, f);
    expect(out.isError).toBe(false);
    expect(out.events).toEqual([{ type: 'open', modelId: 'aaaaaaaaaaa', reason: 'best for recording' }]);
  });

  it('moves the map to a point in Houston, with the radius kept inside 0.3 to 40 km', async () => {
    const out = await runTool('focus_map', { modelId: null, lat: 29.76, lon: -95.37, radiusKm: 900, reason: 'Downtown' }, fakes());
    expect(out.isError).toBe(false);
    expect(out.events).toEqual([{ type: 'mapFocus', lat: 29.76, lon: -95.37, radiusKm: 40, reason: 'Downtown' }]);
  });

  it('moves the map to a property by its CoStar row, not by coordinates the model made up', async () => {
    const f = fakes();
    const row = f.search.lookup('aaaaaaaaaaa')!;
    const out = await runTool('focus_map', { modelId: 'aaaaaaaaaaa', lat: 0, lon: 0, radiusKm: 0.5, reason: 'The pick' }, f);
    expect(out.events).toEqual([{ type: 'mapFocus', lat: row.lat, lon: row.lon, radiusKm: 0.5, reason: 'The pick' }]);
  });

  it('will not move the map outside Houston and Los Angeles, or to an unknown property', async () => {
    const away = await runTool('focus_map', { modelId: null, lat: 40.7, lon: -74, radiusKm: 2, reason: 'x' }, fakes());
    expect(JSON.parse(away.content)).toMatchObject({ ok: false, code: 'outside_coverage' });
    const unknown = await runTool('focus_map', { modelId: 'zzzzzzzzzzz', lat: null, lon: null, radiusKm: 2, reason: 'x' }, fakes());
    expect(JSON.parse(unknown.content)).toMatchObject({ ok: false, code: 'unknown_model' });
    expect(away.events.length + unknown.events.length).toBe(0);
  });

  it('refuses to open a property without a mesh', async () => {
    const f = fakes({ statuses: { aaaaaaaaaaa: { canEnter: false, reason: notPossible('no_mesh') } } });
    const out = await runTool('open_tour', { modelId: 'aaaaaaaaaaa', reason: 'x' }, f);
    expect(out.isError).toBe(true);
    expect(JSON.parse(out.content)).toMatchObject({ ok: false, code: 'no_mesh' });
    expect(out.events.some(e => e.type === 'open')).toBe(false);
  });

  it('rejects malformed input', async () => {
    const f = fakes();
    const bad: [string, unknown][] = [
      ['open_tour', { modelId: '../x', reason: 'x' }],
      ['quick_audio_summary', { ...SUMMARY_INPUT, modelId: '../x' }],
      ['quick_audio_summary', { ...SUMMARY_INPUT, profile: 'party' }],
      ['quick_audio_summary', { modelId: 'aaaaaaaaaaa' }],
      ['search_properties', { ...SEARCH_INPUT, city: 'Boston' }],
      ['search_properties', { ...SEARCH_INPUT, minSqft: 'big' }],
      ['search_properties', null],
    ];
    for (const [name, input] of bad) {
      const out = await runTool(name, input, f);
      expect(out.isError, name).toBe(true);
      expect(JSON.parse(out.content).code, name).toBe('bad_request');
    }
    expect(f.calls.search).toHaveLength(0);
    expect(f.calls.summarise).toHaveLength(0);
    expect(f.calls.status).toHaveLength(0);
  });

  it('rejects an unknown tool', async () => {
    const out = await runTool('delete_everything', {}, fakes());
    expect(out.isError).toBe(true);
    expect(JSON.parse(out.content).code).toBe('bad_request');
  });

  it('never throws when a dependency throws', async () => {
    const f = fakes();
    f.quick.summarise = async () => { throw new Error('boom'); };
    const out = await runTool('quick_audio_summary', SUMMARY_INPUT, f);
    expect(out.isError).toBe(true);
    expect(JSON.parse(out.content).code).toBe('agent_failed');
    expect(out.content).not.toMatch(/boom/);
  });

  it('trims a summary to its best three rooms', () => {
    const trimmed = trimSummary(okSummary('aaaaaaaaaaa', 0.9, 6)) as { rooms: { id: string }[] };
    expect(trimmed.rooms.map(r => r.id)).toEqual(['r0', 'r1', 'r2']);
  });
});
