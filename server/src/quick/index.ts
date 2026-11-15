import type { Search } from '../search/index.js';
import type { Surroundings } from '../surroundings/index.js';
import {
  notPossible,
  type ProfileId,
  type PropertyStatus,
  type QuickSummary,
  type RequirementOverrides,
  type Requirements,
} from '../shared/contract.js';

export type Quick = {
  /** Never rejects. */
  status(modelId: string): Promise<PropertyStatus>;
  /** Never rejects. */
  summarise(modelId: string, requirements: Requirements): Promise<QuickSummary>;
  resolve(profile: ProfileId, overrides?: Partial<RequirementOverrides>): Requirements;
  /** From availability.json. */
  isUnusable(modelId: string): boolean;
};

/** Stub until Lane B: every property can be entered, none can be summarised. */
export function createQuick(_options: {
  cacheDir: string;
  env: Record<string, string | undefined>;
  fetchFn?: typeof fetch;
  lookup: Search['lookup'];
  surroundings: Surroundings;
  bundleReady: () => boolean;
}): Quick {
  return {
    status: async modelId => ({ modelId, name: null, canEnter: true, canSummarise: false, reason: null }),
    summarise: async modelId => ({ ok: false, modelId, address: null, reason: notPossible('no_room_data') }),
    resolve: () => {
      throw new Error('not built');
    },
    isUnusable: () => false,
  };
}
