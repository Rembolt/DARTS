// The agent's four tools (spec 7.2): their strict schemas, input checks and what each one emits to the page.
import type Anthropic from '@anthropic-ai/sdk';
import type { Quick } from '../quick/index.js';
import type { Search } from '../search/index.js';
import {
  MODEL_ID_PATTERN,
  notPossible,
  type AgentEvent,
  type City,
  cityAt,
  type NotPossible,
  type ProfileId,
  type PropertyKind,
  type QuickSummary,
  type RequirementOverrides,
  type SearchQuery,
} from '../shared/contract.js';

export { SYSTEM_PROMPT } from './prompt.js';

export type ToolOutcome = { content: string; isError: boolean; events: AgentEvent[] };
export type ToolDeps = { search: Search; quick: Quick; emit?: (event: AgentEvent) => void };

export const CITIES: readonly City[] = ['Houston', 'Los Angeles'];
export const KINDS: readonly (PropertyKind | 'any')[] = ['home', 'apartment', 'commercial', 'any'];
export const PROFILES: readonly ProfileId[] = ['recording', 'rehearsal', 'podcast', 'home_office', 'sleep', 'home_theater',
  'cafe_restaurant', 'retail', 'open_office', 'general'];
const OVERRIDE_KEYS = ['echoMin', 'echoMax', 'maxOutsideDb', 'maxEscapeDb', 'minRoomArea'] as const;
const MAX_LIMIT = 8;
const MAX_RADIUS_KM = 15;

const nullable = (type: string, description: string) => ({ type: [type, 'null'], description });

// Strict mode accepts no numeric or length bounds, so the bounds are in the descriptions and checked in runTool.
export const TOOLS: Anthropic.Beta.BetaTool[] = [
  {
    name: 'search_properties',
    description: 'Search the property catalogue (Houston and Los Angeles only). Returns { total, rows }: one row per property, '
      + 'nearest first, skipping tours known to be unusable. total 0 is a normal answer, with notes naming the filter that removed the most.',
    strict: true,
    input_schema: {
      type: 'object',
      additionalProperties: false,
      properties: {
        city: { type: 'string', enum: [...CITIES] },
        zip: nullable('string', 'A 5-digit ZIP code, or null.'),
        near: {
          anyOf: [
            {
              type: 'object',
              additionalProperties: false,
              properties: {
                lat: { type: 'number' },
                lon: { type: 'number' },
                radiusKm: { type: 'number', description: 'Search radius in km, at most 15.' },
              },
              required: ['lat', 'lon', 'radiusKm'],
            },
            { type: 'null' },
          ],
          description: 'A point to search around (for a neighbourhood), or null.',
        },
        kind: { type: 'string', enum: [...KINDS] },
        propertyTypes: { type: ['array', 'null'], items: { type: 'string' }, description: 'CoStar property types to keep, or null for all.' },
        minSqft: nullable('number', 'Minimum floor area in square feet, or null.'),
        maxPrice: nullable('number', 'Maximum price in USD, or null. Drops rows without a price.'),
        minBeds: nullable('number', 'Minimum bedrooms, or null.'),
        limit: { type: 'integer', description: 'How many rows to return, 1 to 8.' },
      },
      required: ['city', 'zip', 'near', 'kind', 'propertyTypes', 'minSqft', 'maxPrice', 'minBeds', 'limit'],
    },
  },
  {
    name: 'quick_audio_summary',
    description: 'Estimate the acoustics of one property for a requirement profile. Returns its score, the best three rooms, '
      + 'flags, assumptions and the surroundings class, or { ok: false, code, message }. The full summary is shown to the user as a card.',
    strict: true,
    input_schema: {
      type: 'object',
      additionalProperties: false,
      properties: {
        modelId: { type: 'string', description: 'The modelId of a row from search_properties.' },
        profile: { type: 'string', enum: [...PROFILES] },
        echoMin: nullable('number', 'Override: lowest wanted mid-band echo time in s (0.1–3), or null.'),
        echoMax: nullable('number', 'Override: highest wanted mid-band echo time in s (0.1–3), or null.'),
        maxOutsideDb: nullable('number', 'Override: most outside noise allowed inside the room in dB (20–70), or null.'),
        maxEscapeDb: nullable('number', 'Override: most sound allowed to escape, at 10 m, in dB (20–80), or null.'),
        minRoomArea: nullable('number', 'Override: smallest room area in m² (2–500), or null.'),
      },
      required: ['modelId', 'profile', ...OVERRIDE_KEYS],
    },
  },
  {
    name: 'open_tour',
    description: 'Highlight one property\'s "Listen inside" button on the page. The page does not navigate by itself. '
      + 'Fails with { ok: false, code, message } when the property cannot be entered.',
    strict: true,
    input_schema: {
      type: 'object',
      additionalProperties: false,
      properties: {
        modelId: { type: 'string' },
        reason: { type: 'string', description: 'One short sentence: why this property.' },
      },
      required: ['modelId', 'reason'],
    },
  },
  {
    name: 'focus_map',
    description: 'Zoom the satellite map on the page. Use modelId (a row from search_properties) to centre on a real property, '
      + 'or lat and lon for an area you searched. radiusKm is how much to show: 0.3 for one building, 2 for a neighbourhood, 15 for a district, 40 for the whole city. '
      + 'Fails with { ok: false, code, message } outside Houston and Los Angeles.',
    strict: true,
    input_schema: {
      type: 'object',
      additionalProperties: false,
      properties: {
        modelId: nullable('string', 'The modelId of a property from search_properties, or null.'),
        lat: nullable('number', 'Latitude when modelId is null.'),
        lon: nullable('number', 'Longitude when modelId is null.'),
        radiusKm: { type: 'number', description: 'Radius to show in km, 0.3 to 40.' },
        reason: { type: 'string', description: 'One short sentence the user sees: what the map is showing.' },
      },
      required: ['modelId', 'lat', 'lon', 'radiusKm', 'reason'],
    },
  },
];

const KIND_WORDS: Record<PropertyKind | 'any', string> = {
  home: 'homes', apartment: 'apartments', commercial: 'commercial properties', any: 'properties',
};

/** The view of a summary the model gets: never the full room list (spec 5.6). */
export function trimSummary(summary: QuickSummary): unknown {
  if (!summary.ok) {
    return { ok: false, modelId: summary.modelId, address: summary.address, code: summary.reason.code, message: summary.reason.message };
  }
  const rooms = [...summary.rooms].sort((a, b) => b.score - a.score).slice(0, 3);
  return {
    ok: true, modelId: summary.modelId, name: summary.name, address: summary.address, kind: summary.kind,
    listing: summary.listing, canEnter: summary.canEnter, enterReason: summary.enterReason?.code ?? null,
    score: summary.score, bestRoomId: summary.bestRoomId, profile: summary.requirements.profile,
    rooms, roomsAnalysed: summary.rooms.length, skippedRooms: summary.skippedRooms, assumptions: summary.assumptions,
    area: summary.area && { areaClass: summary.area.areaClass, source: summary.area.source, located: summary.area.located },
  };
}

class BadInput extends Error {}

type Result = { content: string; isError: boolean };
type Push = (event: AgentEvent) => void;

function fail(reason: NotPossible): Result {
  return { content: JSON.stringify({ ok: false, code: reason.code, message: reason.message }), isError: true };
}

function bad(detail: string): never {
  throw new BadInput(detail);
}

function object(value: unknown, keys: readonly string[]): Record<string, unknown> {
  if (!value || typeof value !== 'object' || Array.isArray(value)) bad('input is not an object');
  const v = value as Record<string, unknown>;
  for (const key of keys) if (!(key in v)) bad(`missing ${key}`);
  return v;
}

function oneOf<T extends string>(value: unknown, allowed: readonly T[], name: string): T {
  if (typeof value !== 'string' || !(allowed as readonly string[]).includes(value)) bad(`${name} must be one of ${allowed.join(', ')}`);
  return value as T;
}

function numberOrNull(value: unknown, name: string): number | null {
  if (value === null) return null;
  if (typeof value !== 'number' || !Number.isFinite(value)) bad(`${name} must be a number or null`);
  if (value < 0) bad(`${name} must not be negative`);
  return value;
}

function finite(value: unknown, name: string): number {
  if (typeof value !== 'number' || !Number.isFinite(value)) bad(`${name} must be a number`);
  return value;
}

function modelId(value: unknown): string {
  if (typeof value !== 'string' || !MODEL_ID_PATTERN.test(value)) bad('modelId is not a valid model id');
  return value;
}

const clamp = (v: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, v));

function readSearch(input: unknown): SearchQuery {
  const v = object(input, ['city', 'zip', 'near', 'kind', 'propertyTypes', 'minSqft', 'maxPrice', 'minBeds', 'limit']);
  const city = oneOf(v.city, CITIES, 'city');
  if (v.zip !== null && (typeof v.zip !== 'string' || !/^\d{5}$/.test(v.zip))) bad('zip must be 5 digits or null');
  let near: SearchQuery['near'] = null;
  if (v.near !== null) {
    const n = object(v.near, ['lat', 'lon', 'radiusKm']);
    const lat = finite(n.lat, 'near.lat');
    const lon = finite(n.lon, 'near.lon');
    if (Math.abs(lat) > 90 || Math.abs(lon) > 180) bad('near is not a point on Earth');
    near = { lat, lon, radiusKm: clamp(finite(n.radiusKm, 'near.radiusKm'), 0.1, MAX_RADIUS_KM) };
  }
  let propertyTypes: string[] | null = null;
  if (v.propertyTypes !== null) {
    if (!Array.isArray(v.propertyTypes) || v.propertyTypes.some(t => typeof t !== 'string')) bad('propertyTypes must be strings or null');
    propertyTypes = (v.propertyTypes as string[]).slice(0, 20);
  }
  return {
    city, zip: v.zip as string | null, near, kind: oneOf(v.kind, KINDS, 'kind'), propertyTypes,
    minSqft: numberOrNull(v.minSqft, 'minSqft'), maxPrice: numberOrNull(v.maxPrice, 'maxPrice'), minBeds: numberOrNull(v.minBeds, 'minBeds'),
    limit: clamp(Math.round(finite(v.limit, 'limit')), 1, MAX_LIMIT),
  };
}

function readSummary(input: unknown): { modelId: string; profile: ProfileId; overrides: RequirementOverrides } {
  const v = object(input, ['modelId', 'profile', ...OVERRIDE_KEYS]);
  const overrides = {} as RequirementOverrides;
  for (const key of OVERRIDE_KEYS) overrides[key] = numberOrNull(v[key], key);
  return { modelId: modelId(v.modelId), profile: oneOf(v.profile, PROFILES, 'profile'), overrides };
}

function readOpen(input: unknown): { modelId: string; reason: string } {
  const v = object(input, ['modelId', 'reason']);
  if (typeof v.reason !== 'string') bad('reason must be a string');
  return { modelId: modelId(v.modelId), reason: v.reason.slice(0, 200) };
}

async function searchProperties(input: unknown, deps: ToolDeps, push: Push): Promise<Result> {
  const query = readSearch(input);
  const where = query.zip ? `${query.city} ${query.zip}` : query.city;
  push({ type: 'status', text: `Searching ${KIND_WORDS[query.kind]} in ${where}…` });
  const result = deps.search.search(query, id => deps.quick.isUnusable(id));
  if ('code' in result) return fail(result);
  return { content: JSON.stringify(result), isError: false };
}

async function quickAudioSummary(input: unknown, deps: ToolDeps, push: Push): Promise<Result> {
  const { modelId: id, profile, overrides } = readSummary(input);
  const row = deps.search.lookup(id);
  if (!row) return fail(notPossible('unknown_model'));
  push({ type: 'status', text: `Checking ${row.address}…` });
  const summary = await deps.quick.summarise(id, deps.quick.resolve(profile, overrides));
  push({ type: 'cards', summaries: [summary] });
  return { content: JSON.stringify(trimSummary(summary)), isError: !summary.ok };
}

async function openTour(input: unknown, deps: ToolDeps, push: Push): Promise<Result> {
  const { modelId: id, reason } = readOpen(input);
  if (!deps.search.lookup(id)) return fail(notPossible('unknown_model'));
  const status = await deps.quick.status(id);
  if (!status.canEnter) return fail(status.reason ?? notPossible('agent_failed'));
  push({ type: 'open', modelId: id, reason });
  return { content: JSON.stringify({ ok: true, result: 'highlighted' }), isError: false };
}

async function focusMap(input: unknown, deps: ToolDeps, push: Push): Promise<Result> {
  const v = object(input, ['modelId', 'lat', 'lon', 'radiusKm', 'reason']);
  if (typeof v.reason !== 'string') bad('reason must be a string');
  const radiusKm = clamp(finite(v.radiusKm, 'radiusKm'), 0.3, 40);
  let lat: number;
  let lon: number;
  if (v.modelId !== null) {
    const row = deps.search.lookup(modelId(v.modelId));
    if (!row) return fail(notPossible('unknown_model'));
    ({ lat, lon } = row);
  } else {
    lat = finite(v.lat, 'lat');
    lon = finite(v.lon, 'lon');
  }
  if (!cityAt(lat, lon)) return fail(notPossible('outside_coverage'));
  push({ type: 'mapFocus', lat, lon, radiusKm, reason: v.reason.slice(0, 200) });
  return { content: JSON.stringify({ ok: true, result: 'map moved' }), isError: false };
}

const RUNNERS: Record<string, (input: unknown, deps: ToolDeps, push: Push) => Promise<Result>> = {
  search_properties: searchProperties,
  quick_audio_summary: quickAudioSummary,
  open_tour: openTour,
  focus_map: focusMap,
};

/**
 * Never throws: bad input → bad_request, an unexpected error → agent_failed (its text is not passed on).
 * `deps.emit`, when given, receives each event as it happens (a status line before the slow part); `events` lists them all.
 */
export async function runTool(name: string, input: unknown, deps: ToolDeps): Promise<ToolOutcome> {
  const events: AgentEvent[] = [];
  const push: Push = event => { events.push(event); deps.emit?.(event); };
  const runner = Object.hasOwn(RUNNERS, name) ? RUNNERS[name] : undefined;
  let result: Result;
  if (!runner) {
    result = fail(notPossible('bad_request', `Not possible: there is no tool named ${JSON.stringify(name.slice(0, 40))}.`));
  } else {
    try {
      result = await runner(input, deps, push);
    } catch (err) {
      result = fail(err instanceof BadInput ? notPossible('bad_request', `Not possible: ${err.message}.`) : notPossible('agent_failed'));
    }
  }
  return { ...result, events };
}
