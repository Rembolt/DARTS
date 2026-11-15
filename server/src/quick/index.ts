import { toNotPossible } from '../errors.js';
import type { Search } from '../search/index.js';
import type { Surroundings } from '../surroundings/index.js';
import {
  notPossible,
  type AreaSummary,
  type NotPossible,
  type ProfileId,
  type PropertyStatus,
  type QuickSummary,
  type RequirementOverrides,
  type Requirements,
} from '../shared/contract.js';
import { createAvailability } from './availability.js';
import { createPiSource, type PiModel, type PiSource } from './pi.js';
import { resolveRequirements } from './profiles.js';
import { usableRooms, type UsableRoom } from './rooms.js';
import { analyseRooms } from './summary.js';

export type Quick = {
  /** Never rejects. */
  status(modelId: string): Promise<PropertyStatus>;
  /** Never rejects. */
  summarise(modelId: string, requirements: Requirements): Promise<QuickSummary>;
  resolve(profile: ProfileId, overrides?: Partial<RequirementOverrides>): Requirements;
  /** From availability.json: true when the model is known to have no quick summary (so it can't be ranked). */
  isUnusable(modelId: string): boolean;
};

/** What one check found. `summaryReason` is what stops a summary (never the server's own state). */
type Check = {
  status: PropertyStatus;
  summaryReason: NotPossible | null;
  model: PiModel | null;
  rooms: UsableRoom[];
  skipped: number;
};

const plural = (n: number, one: string, many: string) => `${n} ${n === 1 ? one : many}`;

/**
 * The property status (spec 4.3) and the quick audio summary (spec 5), both from one cached PI call. Facts about the
 * model (gone, no mesh, no room data) are recorded in availability.json; the server's own state (no Bundle, no SDK
 * key) and retryable outages never are.
 */
export function createQuick(options: {
  cacheDir: string;
  env: Record<string, string | undefined>;
  fetchFn?: typeof fetch;
  lookup: Search['lookup'];
  surroundings: Surroundings;
  bundleReady: () => boolean;
  /** For tests: replaces the Matterport source built from the options. */
  pi?: PiSource;
}): Quick {
  const { cacheDir, env, fetchFn, lookup, surroundings, bundleReady } = options;
  const pi = options.pi ?? createPiSource({ cacheDir, env, fetchFn });
  const availability = createAvailability(cacheDir);

  function serverReason(): NotPossible | null {
    if (!bundleReady()) return notPossible('bundle_missing');
    if (!env.MATTERPORT_SDK_KEY?.trim()) return notPossible('server_not_configured');
    return null;
  }

  async function check(modelId: string): Promise<Check> {
    const server = serverReason();
    const kind = lookup(modelId)?.kind ?? 'home';   // height only, which never changes whether a room counts
    let model: PiModel;
    try {
      model = await pi.get(modelId);
    } catch (err) {
      const reason = toNotPossible(err);
      if (reason.code === 'model_not_found') availability.set(modelId, { canEnter: false, canSummarise: false });
      return {
        status: { modelId, name: null, canEnter: false, canSummarise: false, reason: server ?? reason },
        summaryReason: reason, model: null, rooms: [], skipped: 0,
      };
    }

    const { rooms, skipped } = usableRooms(model, kind);
    const exists = model.active && model.isPublic;
    const canEnter = exists && model.hasMesh;
    const canSummarise = exists && rooms.length > 0;
    let modelReason: NotPossible | null = null;
    if (!exists) modelReason = notPossible('model_not_found');
    else if (!model.hasMesh) modelReason = notPossible('no_mesh');
    else if (!canSummarise) modelReason = notPossible('no_room_data');
    availability.set(modelId, { canEnter, canSummarise });

    return {
      status: {
        modelId, name: model.name, canEnter: canEnter && !server, canSummarise, reason: server ?? modelReason,
      },
      summaryReason: !exists ? modelReason : canSummarise ? null : notPossible('no_room_data'),
      model, rooms, skipped,
    };
  }

  async function summarise(modelId: string, requirements: Requirements): Promise<QuickSummary> {
    const row = lookup(modelId);
    if (!row) return { ok: false, modelId, address: null, reason: notPossible('unknown_model') };
    const fail = (reason: NotPossible): QuickSummary => ({ ok: false, modelId, address: row.address, reason });
    try {
      const found = await check(modelId);
      if (found.summaryReason || !found.model) return fail(found.summaryReason ?? notPossible('no_room_data'));

      let area: AreaSummary | null = null;
      try {
        area = await surroundings.get(row);
      } catch {
        area = null;   // never expected: Surroundings falls back inside
      }
      const { rooms, withoutWalls } = analyseRooms(found.model, found.rooms, row, area, requirements);

      const assumed = rooms.filter(r => r.heightAssumed).length;
      const assumptions: string[] = [];
      if (assumed > 0) assumptions.push(`heights assumed for ${assumed} of ${rooms.length} rooms`);
      if (found.skipped > 0) assumptions.push(`${plural(found.skipped, 'small room', 'small rooms')} left out`);
      if (!area) assumptions.push('surroundings unknown');
      else if (area.source === 'property_type') assumptions.push('surroundings assumed from the property type');
      if (withoutWalls > 0) {
        assumptions.push(`outside noise not estimated for ${plural(withoutWalls, 'room', 'rooms')} without wall data`);
      }
      assumptions.push('materials suggested from room names, not measured');

      const { status } = found;
      return {
        ok: true, modelId, name: found.model.name, address: row.address, kind: row.kind,
        listing: {
          sqft: row.sqft, beds: row.beds, baths: row.baths, price: row.price, propertyType: row.propertyType,
          toursOnProperty: row.toursOnProperty, buildingName: row.buildingName,
        },
        canEnter: status.canEnter, enterReason: status.canEnter ? null : status.reason,
        score: rooms[0].score, bestRoomId: rooms[0].id, requirements, area,
        rooms, skippedRooms: found.skipped, assumptions,
      };
    } catch (err) {
      return fail(toNotPossible(err));
    }
  }

  return {
    async status(modelId) {
      try {
        return (await check(modelId)).status;
      } catch (err) {
        return { modelId, name: null, canEnter: false, canSummarise: false, reason: toNotPossible(err) };
      }
    },
    summarise,
    resolve: resolveRequirements,
    isUnusable(modelId) {
      const known = availability.get(modelId);
      return known !== null && !known.canSummarise;
    },
  };
}
