// Hand-written fakes of Search and Quick for the agent tests. Never the real Lane A / Lane B code.
import type { Quick } from '../src/quick/index.js';
import type { Search } from '../src/search/index.js';
import {
  notPossible,
  type IndexRow,
  type NotPossible,
  type PropertyStatus,
  type QuickSummary,
  type Requirements,
  type RoomSummary,
  type SearchQuery,
  type SearchResult,
} from '../src/shared/contract.js';

export function row(modelId: string, overrides: Partial<IndexRow> = {}): IndexRow {
  return {
    modelId, kind: 'home', propertyKey: `p-${modelId}`, toursOnProperty: 1,
    address: `${modelId} Main St`, city: 'Houston', zip: '77008', lat: 29.8, lon: -95.4,
    propertyType: 'Single Family', buildingName: null,
    sqft: 2000, beds: 3, baths: 2, price: 500000, yearBuilt: 1990, stories: 2, facts: [],
    ...overrides,
  };
}

export function room(id: string, score: number, overrides: Partial<RoomSummary> = {}): RoomSummary {
  return {
    id, name: `Room ${id}`, floor: '1', area: 14, volume: 36, heightAssumed: false,
    echo: [0.5, 0.4, 0.3], echoWord: 'controlled', roomGainDb: 2, flags: [], outsideDb: 30, escapeDb: 40, score,
    ...overrides,
  };
}

export const REQUIREMENTS: Requirements = {
  profile: 'recording', echoMid: [0.2, 0.4], maxOutsideDb: 30, maxEscapeDb: 45, minRoomArea: 12,
  avoidBoomyBass: true, weights: { echo: 0.3, outside: 0.3, escape: 0.2, size: 0.1, bass: 0.1 },
};

export function okSummary(modelId: string, score: number, rooms = 6): QuickSummary {
  const list = Array.from({ length: rooms }, (_, i) => room(`r${i}`, score - i * 0.05));
  return {
    ok: true, modelId, name: null, address: `${modelId} Main St`, kind: 'home',
    listing: { sqft: 2000, beds: 3, baths: 2, price: 500000, propertyType: 'Single Family', toursOnProperty: 1, buildingName: null },
    canEnter: true, enterReason: null, score, bestRoomId: 'r0', requirements: REQUIREMENTS,
    area: { areaClass: 'residential', source: 'vexcel', counts: { building: 12 }, located: [], roadBearingDeg: null, facadeDb: 50, imageryDate: '2025-01-01' },
    rooms: list, skippedRooms: 1, assumptions: ['heights assumed for 1 of 7 rooms'],
  };
}

export function failedSummary(modelId: string, reason: NotPossible = notPossible('no_room_data')): QuickSummary {
  return { ok: false, modelId, address: `${modelId} Main St`, reason };
}

export type Calls = { search: { query: SearchQuery; skip?: (id: string) => boolean }[]; summarise: { modelId: string; requirements: Requirements }[]; status: string[]; resolve: unknown[][] };

export function fakes(options: {
  rows?: IndexRow[];
  searchResult?: SearchResult | NotPossible;
  summaries?: Record<string, QuickSummary | (() => Promise<QuickSummary>)>;
  statuses?: Record<string, Partial<PropertyStatus>>;
  unusable?: string[];
} = {}): { search: Search; quick: Quick; calls: Calls } {
  const calls: Calls = { search: [], summarise: [], status: [], resolve: [] };
  const rows = options.rows ?? [row('aaaaaaaaaaa'), row('bbbbbbbbbbb')];
  const search: Search = {
    ready: () => true,
    lookup: id => rows.find(r => r.modelId === id) ?? null,
    search(query, skip) {
      calls.search.push({ query, skip });
      return options.searchResult ?? { total: rows.length, rows: rows.slice(0, query.limit), notes: [] };
    },
  };
  const unusable = new Set(options.unusable ?? []);
  const quick: Quick = {
    async status(modelId) {
      calls.status.push(modelId);
      return { modelId, name: null, canEnter: true, canSummarise: true, reason: null, ...options.statuses?.[modelId] };
    },
    async summarise(modelId, requirements) {
      calls.summarise.push({ modelId, requirements });
      const s = options.summaries?.[modelId];
      if (typeof s === 'function') return s();
      return s ?? okSummary(modelId, 0.8);
    },
    resolve(profile, overrides) {
      calls.resolve.push([profile, overrides]);
      return { ...REQUIREMENTS, profile };
    },
    isUnusable: id => unusable.has(id),
  };
  return { search, quick, calls };
}
