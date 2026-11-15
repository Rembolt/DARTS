// The fixed path without the LLM (spec 7.4): keywords → one search → summaries → cards and one templated sentence.
import {
  notPossible,
  type AgentEvent,
  type City,
  type ProfileId,
  type PropertyKind,
  type QuickSummary,
  type Requirements,
} from '../shared/contract.js';
import type { ToolDeps } from './tools.js';

/** First match wins, in the spec's order. */
const PROFILE_WORDS: [ProfileId, RegExp][] = [
  ['recording', /\b(record|studio|music)/i],
  ['rehearsal', /\b(band|drums?|rehears)/i],
  ['podcast', /\b(podcast|voice)/i],
  ['sleep', /\b(sleep|quiet)/i],
  ['home_office', /\b(office|calls?\b|work from home)/i],
  ['home_theater', /\b(movie|theat(er|re))/i],
  ['cafe_restaurant', /\b(cafe|café|restaurant)/i],
  ['retail', /\b(shop|store)/i],
];
const COMMERCIAL = /\b(office|shop|store|cafe|café|restaurant|retail)/i;
const HOME_OFFICE = /\b(home office|work from home)\b/i;
const LOS_ANGELES = /\blos angeles\b|\bla\b/i;
const HOUSTON = /\bhouston\b/i;
const OUR_CITY = /\b(houston|los angeles|la)\b/i;
// Neighbourhoods and suburbs people name instead of the city. A place that starts with one is ours, not another city.
const HOUSTON_AREAS = /^(montrose|(the )?heights|river oaks|midtown|galleria|uptown|memorial|west university|bellaire|rice village|museum district|east end|katy|sugar land|spring|(the )?woodlands|pearland|cypress|tomball|kingwood|clear lake|spring branch|garden oaks|oak forest)\b/i;
const LA_AREAS = /^(hollywood|west hollywood|venice|santa monica|silver lake|echo park|koreatown|beverly hills|westwood|pasadena|burbank|glendale|culver city|encino|sherman oaks|studio city|brentwood|highland park|los feliz|downtown|dtla|van nuys|north hollywood|long beach|inglewood|torrance)\b/i;
const IN_PLACE =/\bin\s+([A-Z][\w.'-]*(?:\s+[A-Z][\w.'-]*)*)/g;

export function readRequest(text: string): { profile: ProfileId; city: City | null; otherCity: boolean; zip: string | null; kind: PropertyKind | 'any' } {
  const profile = PROFILE_WORDS.find(([, re]) => re.test(text))?.[0] ?? 'general';
  const places = [...text.matchAll(IN_PLACE)].map(m => m[1]);
  const named: City | null = LOS_ANGELES.test(text) ? 'Los Angeles' : HOUSTON.test(text) ? 'Houston' : null;
  // "in Montrose" with no city named: the neighbourhood tells which city. A bare "Downtown" stays on the Houston default.
  const city: City | null = named ?? (places.some(p => LA_AREAS.test(p) && !/^downtown\b/i.test(p)) ? 'Los Angeles'
    : places.some(p => HOUSTON_AREAS.test(p)) ? 'Houston' : null);
  const otherCity = places.some(p => !OUR_CITY.test(p) && !HOUSTON_AREAS.test(p) && !LA_AREAS.test(p));
  const zip = /\b(\d{5})\b/.exec(text)?.[1] ?? null;
  const kind: PropertyKind = /\bapartment/i.test(text) ? 'apartment'
    : COMMERCIAL.test(text) && !HOME_OFFICE.test(text) ? 'commercial' : 'home';
  return { profile, city, otherCity, zip, kind };
}

const KIND_WORDS: Record<PropertyKind | 'any', string> = {
  home: 'homes', apartment: 'apartments', commercial: 'commercial properties', any: 'properties',
};

/** Checks `signal.aborted` between steps and emits nothing once it is set. Never rejects. */
export async function runKeyword(text: string, deps: ToolDeps, emit: (e: AgentEvent) => void, signal: AbortSignal): Promise<void> {
  if (signal.aborted) return;
  const send = (e: AgentEvent) => { if (!signal.aborted) emit(e); };
  try {
    const request = readRequest(text);
    if (request.otherCity) return send({ type: 'notPossible', reason: notPossible('outside_coverage') });
    // No city named: a Los Angeles zip (90xxx–91xxx) means Los Angeles, anything else Houston.
    const city: City = request.city ?? (request.zip && /^9[01]/.test(request.zip) ? 'Los Angeles' : 'Houston');
    send({ type: 'status', text: `Searching ${KIND_WORDS[request.kind]} in ${request.zip ? `${city} ${request.zip}` : city}…` });
    const result = deps.search.search(
      { city, zip: request.zip, near: null, kind: request.kind, propertyTypes: null, minSqft: null, maxPrice: null, minBeds: null, limit: 5 },
      id => deps.quick.isUnusable(id),
    );
    if ('code' in result) return send({ type: 'notPossible', reason: result });
    if (result.rows.length === 0) return send({ type: 'notPossible', reason: notPossible('no_results', result.notes[0]) });

    const requirements: Requirements = deps.quick.resolve(request.profile);
    send({ type: 'status', text: `Checking ${result.rows.length} ${result.rows.length === 1 ? 'property' : 'properties'}…` });
    const summaries = await Promise.all(result.rows.map(async (row): Promise<QuickSummary> => {
      let summary: QuickSummary;
      try {
        summary = await deps.quick.summarise(row.modelId, requirements);
      } catch {
        summary = { ok: false, modelId: row.modelId, address: row.address, reason: notPossible('agent_failed') };
      }
      send({ type: 'cards', summaries: [summary] });
      return summary;
    }));
    if (signal.aborted) return;

    const usable = summaries.filter((s): s is Extract<QuickSummary, { ok: true }> => s.ok);
    if (usable.length === 0) {
      const n = summaries.length;
      return send({ type: 'notPossible', reason: notPossible('none_usable',
        `I found ${n} ${n === 1 ? 'property' : 'properties'} but none has the room data I need. That's common for commercial tours; homes almost always work.`) });
    }
    const best = usable.reduce((a, b) => (b.score > a.score ? b : a));
    const room = best.rooms.find(r => r.id === best.bestRoomId) ?? best.rooms[0];
    send({ type: 'text', text: room
      ? `Best fit: ${best.address}. ${room.name} has an estimated ${room.echo[1].toFixed(1)} s echo.`
      : `Best fit: ${best.address}.` });
  } catch {
    send({ type: 'notPossible', reason: notPossible('agent_failed') });
  }
}
