import { readFileSync } from 'node:fs';
import { MODEL_ID_PATTERN } from './shared/contract.js';

/** True for an 11-character letters-and-digits Matterport id: nothing that could reach a path or a query. */
export function isModelId(value: unknown): value is string {
  return typeof value === 'string' && MODEL_ID_PATTERN.test(value);
}

/**
 * The distinct valid ids in the `MatterportModelId` column of each CSV. A missing file throws.
 * The CoStar starter lists contain no quoted fields, so a plain comma split is enough.
 */
export function loadAllowedIds(csvPaths: string[]): Set<string> {
  const ids = new Set<string>();
  for (const path of csvPaths) {
    const lines = readFileSync(path, 'utf8').split(/\r?\n/);
    const column = (lines[0] ?? '').split(',').indexOf('MatterportModelId');
    if (column < 0) throw new Error(`${path} has no MatterportModelId column`);
    for (const line of lines.slice(1)) {
      const id = line.split(',')[column]?.trim();
      if (isModelId(id)) ids.add(id);
    }
  }
  return ids;
}
