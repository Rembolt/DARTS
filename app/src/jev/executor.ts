import type { ActionResult, Actions, Measurement, SceneEffects } from '../scene/actions';
import { refusal, type ActionName, type OpeningKind } from '../scene/permissions';
import type { FurnishingLevel, SurfaceClass } from '../scene/state';
import type { SceneStore } from '../scene/store';
import type { Bands, Vec3 } from '../sim/types';

export type ToolResultBlock = {
  type: 'tool_result';
  tool_use_id: string;
  content: string;
  is_error?: boolean;
};

const isPlainObject = (v: unknown): v is Record<string, unknown> =>
  typeof v === 'object' && v !== null && !Array.isArray(v);

const optStr = (v: unknown): string | undefined => (typeof v === 'string' && v.length > 0 ? v : undefined);
const optNum = (v: unknown): number | undefined => (typeof v === 'number' && Number.isFinite(v) ? v : undefined);
const optBool = (v: unknown): boolean | undefined => (typeof v === 'boolean' ? v : undefined);
const optVec3 = (v: unknown): Vec3 | undefined =>
  Array.isArray(v) && v.length === 3 && v.every(n => typeof n === 'number' && Number.isFinite(n))
    ? [v[0], v[1], v[2]]
    : undefined;

const round = (n: number, decimals: number): number => {
  const f = 10 ** decimals;
  return Math.round(n * f) / f;
};

const roundBands = (b: Bands, decimals: number): Bands => [
  round(b[0], decimals),
  round(b[1], decimals),
  round(b[2], decimals),
];

export function formatMeasurement(m: Measurement | null): unknown {
  if (!m) return null;
  return {
    roomId: m.roomId,
    echoTime: roundBands(m.echoTime, 2),
    sources: m.sources.map(s => ({
      id: s.id,
      levelDb: roundBands(s.levelDb, 1),
      walls: s.walls,
    })),
    estimated: m.estimated,
  };
}

function roundValue(v: unknown): unknown {
  if (!isPlainObject(v)) return v;
  const out: Record<string, unknown> = { ...v };
  if (Array.isArray(out.echoTime) && out.echoTime.length === 3) {
    out.echoTime = roundBands(out.echoTime as Bands, 2);
  }
  if (Array.isArray(out.echoTimeDelta) && out.echoTimeDelta.length === 3) {
    out.echoTimeDelta = roundBands(out.echoTimeDelta as Bands, 2);
  }
  if (Array.isArray(out.sources)) {
    out.sources = out.sources.map(s => {
      if (!isPlainObject(s)) return s;
      const copy = { ...s };
      if (Array.isArray(copy.levelDb) && copy.levelDb.length === 3) copy.levelDb = roundBands(copy.levelDb as Bands, 1);
      if (Array.isArray(copy.levelDeltaDb) && copy.levelDeltaDb.length === 3) {
        copy.levelDeltaDb = roundBands(copy.levelDeltaDb as Bands, 1);
      }
      return copy;
    });
  }
  return out;
}

const VALID_TARGETS: Record<string, SurfaceClass> = {
  wall: 'wall',
  floor: 'floor',
  ceiling: 'ceiling',
  exterior_wall: 'exteriorWall',
  exteriorWall: 'exteriorWall',
};

function openingKindForRefusal(
  input: Record<string, unknown>,
  effects: SceneEffects,
): OpeningKind | 'all' {
  const id = optStr(input.id);
  if (id) {
    const found = effects.openings().find(o => o.id === id);
    if (found && (found.kind === 'window' || found.kind === 'door')) return found.kind;
  }
  if (input.type === 'window' || input.type === 'door') return input.type;
  return 'all';
}

function errResult(id: string, content: string): ToolResultBlock {
  return { type: 'tool_result', tool_use_id: id, content, is_error: true };
}

function okResult(id: string, res: ActionResult): ToolResultBlock {
  if (!res.ok) return errResult(id, res.error);
  return {
    type: 'tool_result',
    tool_use_id: id,
    content: JSON.stringify({
      value: roundValue(res.value),
      before: formatMeasurement(res.before),
      after: formatMeasurement(res.after),
    }),
  };
}

/** Validate, check permissions at call time, run through actions, and format numbers (spec 6.3, 6.5). */
export async function execute(
  call: { id: string; name: string; input: unknown },
  deps: { store: SceneStore; actions: Actions; effects: SceneEffects },
): Promise<ToolResultBlock> {
  const { store, actions, effects } = deps;
  if (!isPlainObject(call.input)) return errResult(call.id, 'Tool input must be an object.');
  const input = call.input;
  const perms = store.get().permissions;

  const checkPerm = (action: ActionName, args: { material?: string; layer?: string; openingKind?: OpeningKind | 'all' }) => {
    const row = refusal(perms, action, args);
    if (!row) return null;
    const mode = action === 'measure' || action === 'compare' ? 'GET' : 'PUT';
    return `Not allowed: turn on ${mode} for ${row} in Settings.`;
  };

  try {
    switch (call.name) {
      case 'measure': {
        const denied = checkPerm('measure', {});
        if (denied) return errResult(call.id, denied);
        return okResult(call.id, await actions.measure({ point: optVec3(input.point), room: optStr(input.room) }));
      }
      case 'compare': {
        const denied = checkPerm('compare', {});
        if (denied) return errResult(call.id, denied);
        if (!isPlainObject(input.before) || !isPlainObject(input.after)) {
          return errResult(call.id, 'Give before and after measurements.');
        }
        return okResult(
          call.id,
          actions.compare({ before: input.before as Measurement, after: input.after as Measurement }),
        );
      }
      case 'set_material': {
        const target = typeof input.target === 'string' ? VALID_TARGETS[input.target] : undefined;
        const material = optStr(input.material);
        if (!target || !material) return errResult(call.id, 'Give a valid target and material.');
        const denied = checkPerm('set_material', { material });
        if (denied) return errResult(call.id, denied);
        return okResult(call.id, await actions.setMaterial({ target, room: optStr(input.room), material }));
      }
      case 'set_furnishing': {
        const level = optStr(input.level) as FurnishingLevel | undefined;
        if (!level) return errResult(call.id, 'Give a furnishing level.');
        const denied = checkPerm('set_furnishing', {});
        if (denied) return errResult(call.id, denied);
        return okResult(call.id, await actions.setFurnishing({ level, room: optStr(input.room) }));
      }
      case 'set_opening': {
        const state = input.state === 'open' || input.state === 'closed' ? input.state : undefined;
        if (!state) return errResult(call.id, 'Give opening state open or closed.');
        const denied = checkPerm('set_opening', { openingKind: openingKindForRefusal(input, effects) });
        if (denied) return errResult(call.id, denied);
        const type =
          input.type === 'window' || input.type === 'door' || input.type === 'all' ? input.type : undefined;
        return okResult(
          call.id,
          await actions.setOpening({ id: optStr(input.id), room: optStr(input.room), type, state }),
        );
      }
      case 'place_speaker': {
        const sound = optStr(input.sound);
        if (!sound) return errResult(call.id, 'Give a sound name.');
        const denied = checkPerm('place_speaker', {});
        if (denied) return errResult(call.id, denied);
        return okResult(
          call.id,
          await actions.placeSpeaker({
            room: optStr(input.room),
            point: optVec3(input.point),
            sound,
            levelDb: optNum(input.levelDb),
          }),
        );
      }
      case 'move_speaker': {
        const id = optStr(input.id);
        if (!id) return errResult(call.id, 'Give a speaker id.');
        const denied = checkPerm('move_speaker', {});
        if (denied) return errResult(call.id, denied);
        return okResult(
          call.id,
          await actions.moveSpeaker({ id, room: optStr(input.room), point: optVec3(input.point) }),
        );
      }
      case 'set_speaker': {
        const id = optStr(input.id);
        if (!id) return errResult(call.id, 'Give a speaker id.');
        const denied = checkPerm('set_speaker', {});
        if (denied) return errResult(call.id, denied);
        return okResult(
          call.id,
          await actions.setSpeaker({
            id,
            levelDb: optNum(input.levelDb),
            enabled: optBool(input.enabled),
            sound: optStr(input.sound),
          }),
        );
      }
      case 'remove_speaker': {
        const id = optStr(input.id);
        if (!id) return errResult(call.id, 'Give a speaker id.');
        const denied = checkPerm('remove_speaker', {});
        if (denied) return errResult(call.id, denied);
        return okResult(call.id, await actions.removeSpeaker({ id }));
      }
      case 'move_user_to': {
        const room = optStr(input.room);
        if (!room) return errResult(call.id, 'Give a room.');
        const denied = checkPerm('move_user_to', {});
        if (denied) return errResult(call.id, denied);
        return okResult(call.id, await actions.moveUserTo({ room }));
      }
      case 'set_mesh_layer': {
        const layer = optStr(input.layer);
        if (!layer) return errResult(call.id, 'Give a layer.');
        const denied = checkPerm('set_mesh_layer', { layer });
        if (denied) return errResult(call.id, denied);
        return okResult(
          call.id,
          await actions.setMeshLayer({
            layer,
            traced: optBool(input.traced),
            shown: optBool(input.shown),
          }),
        );
      }
      default:
        return errResult(call.id, `Unknown tool: ${call.name}`);
    }
  } catch (err) {
    return errResult(call.id, err instanceof Error ? err.message : String(err));
  }
}
