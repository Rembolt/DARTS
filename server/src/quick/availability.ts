import { existsSync, mkdirSync, readFileSync, renameSync, rmSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

export type AvailabilityFacts = { canEnter: boolean; canSummarise: boolean };
export type Availability = {
  get(id: string): AvailabilityFacts | null;
  set(id: string, value: AvailabilityFacts): void;
};

type Entry = AvailabilityFacts & { checkedAt: string };

/**
 * What is known about each model: `availability.json` (`modelId → { canEnter, canSummarise, checkedAt }`), read once
 * and rewritten through a temp file and a rename, so a crash can't leave half a file. Holds facts about the model
 * only, never the server's own state (a missing Bundle or key).
 */
export function createAvailability(cacheDir: string): Availability {
  const path = join(cacheDir, 'availability.json');
  let entries: Record<string, Entry> | null = null;

  function load(): Record<string, Entry> {
    if (entries) return entries;
    entries = {};
    if (existsSync(path)) {
      try {
        const parsed: unknown = JSON.parse(readFileSync(path, 'utf8'));
        if (typeof parsed === 'object' && parsed !== null && !Array.isArray(parsed)) entries = parsed as Record<string, Entry>;
      } catch {
        // A broken file starts empty; the next set rewrites it.
      }
    }
    return entries;
  }

  return {
    get(id) {
      const entry = load()[id];
      if (!entry || typeof entry.canEnter !== 'boolean' || typeof entry.canSummarise !== 'boolean') return null;
      return { canEnter: entry.canEnter, canSummarise: entry.canSummarise };
    },
    set(id, value) {
      const all = load();
      all[id] = { canEnter: value.canEnter, canSummarise: value.canSummarise, checkedAt: new Date().toISOString() };
      mkdirSync(cacheDir, { recursive: true });
      const tmp = join(cacheDir, '.availability.part');
      try {
        writeFileSync(tmp, JSON.stringify(all));
        renameSync(tmp, path);
      } catch {
        rmSync(tmp, { force: true });   // kept in memory; written on the next set
      }
    },
  };
}
