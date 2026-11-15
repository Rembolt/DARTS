import type { AreaSummary, IndexRow } from '../shared/contract.js';

/** Never rejects: falls back to the property type inside. */
export type Surroundings = { get(row: IndexRow): Promise<AreaSummary> };

/** Stub until Lane C: every property is residential, labelled as a property-type guess. */
export function createSurroundings(_options: {
  cacheDir: string;
  env: Record<string, string | undefined>;
  fetchFn?: typeof fetch;
}): Surroundings {
  return {
    get: async () => ({
      areaClass: 'residential',
      source: 'property_type',
      counts: {},
      located: [],
      roadBearingDeg: null,
      facadeDb: 50,
      imageryDate: null,
    }),
  };
}
