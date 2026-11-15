import { statSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { notPossible, type IndexRow, type NotPossible, type SearchQuery, type SearchResult } from '../shared/contract.js';
import { searchRows } from './query.js';

export type Search = {
  ready(): boolean;
  lookup(modelId: string): IndexRow | null;
  /** `skip` drops ids known to be unusable. Returns NotPossible for index_missing and outside_coverage only; zero rows is a SearchResult. */
  search(query: SearchQuery, skip?: (modelId: string) => boolean): SearchResult | NotPossible;
};

type Loaded = { rows: IndexRow[]; byId: Map<string, IndexRow> };

/**
 * Search over `<cacheDir>/index.json` (written by `npm run build-index`). The file is read lazily on first use and
 * again whenever its modification time or size changes. A missing or unreadable file means not ready: index_missing.
 */
export function createSearch(options: { cacheDir: string }): Search {
  const file = join(options.cacheDir, 'index.json');
  let stamp: string | null = null; // mtime and size of the file last read, good or bad
  let loaded: Loaded | null = null;

  function load(): Loaded | null {
    let current: string;
    try {
      const stat = statSync(file);
      current = `${stat.mtimeMs}:${stat.size}`;
    } catch {
      stamp = null;
      loaded = null;
      return null;
    }
    if (current === stamp) return loaded;
    stamp = current;
    try {
      const parsed: unknown = JSON.parse(readFileSync(file, 'utf8'));
      if (!Array.isArray(parsed)) throw new Error('index.json is not an array');
      const rows = parsed as IndexRow[];
      loaded = { rows, byId: new Map(rows.map((row) => [row.modelId, row])) };
    } catch (error) {
      console.warn(`search: ${file} could not be read (${(error as Error).message}); search is not available`);
      loaded = null;
    }
    return loaded;
  }

  return {
    ready: () => load() !== null,
    lookup: (modelId) => load()?.byId.get(modelId) ?? null,
    search(query, skip) {
      const index = load();
      if (!index) return notPossible('index_missing');
      return searchRows(index.rows, query, skip);
    },
  };
}
