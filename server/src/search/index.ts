import { notPossible, type IndexRow, type NotPossible, type SearchQuery, type SearchResult } from '../shared/contract.js';

export type Search = {
  ready(): boolean;
  lookup(modelId: string): IndexRow | null;
  /** `skip` drops ids known to be unusable. Returns NotPossible for index_missing and outside_coverage only; zero rows is a SearchResult. */
  search(query: SearchQuery, skip?: (modelId: string) => boolean): SearchResult | NotPossible;
};

/** Stub until Lane A: no index, so every search answers index_missing. */
export function createSearch(_options: { cacheDir: string }): Search {
  return {
    ready: () => false,
    lookup: () => null,
    search: () => notPossible('index_missing'),
  };
}
