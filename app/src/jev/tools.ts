import { FURNISHING } from '../../../server/src/shared/materials';
import { allowedActions, allowedMaterials, type ActionName } from '../scene/permissions';
import type { Permissions } from '../scene/state';

export type JevTool = {
  name: ActionName;
  description: string;
  strict: true;
  input_schema: {
    type: 'object';
    additionalProperties: false;
    properties: Record<string, unknown>;
    required: string[];
  };
};

const FURNISHING_LEVELS = Object.keys(FURNISHING);
const VEC3_SCHEMA = { type: ['array', 'null'], items: { type: 'number' }, minItems: 3, maxItems: 3 };
const MEASUREMENT_SCHEMA = {
  type: 'object',
  additionalProperties: false,
  properties: {
    roomId: { type: ['string', 'null'] },
    echoTime: { type: 'array', items: { type: 'number' }, minItems: 3, maxItems: 3 },
    sources: {
      type: 'array',
      items: {
        type: 'object',
        additionalProperties: false,
        properties: {
          id: { type: 'string' },
          levelDb: { type: 'array', items: { type: 'number' }, minItems: 3, maxItems: 3 },
          walls: { type: 'number' },
        },
        required: ['id', 'levelDb', 'walls'],
      },
    },
    estimated: { type: 'boolean' },
  },
  required: ['roomId', 'echoTime', 'sources', 'estimated'],
};

function strictTool(
  name: ActionName,
  description: string,
  properties: Record<string, unknown>,
): JevTool {
  return {
    name,
    description,
    strict: true,
    input_schema: {
      type: 'object',
      additionalProperties: false,
      properties,
      required: Object.keys(properties),
    },
  };
}

/** Build the strict tool list allowed by the current permissions (spec 6.3, 6.5). */
export function toolsFor(
  p: Permissions,
  ctx: { sounds: string[]; rooms: string[]; layers: string[] },
): JevTool[] {
  const allowed = new Set(allowedActions(p));
  const materials = allowedMaterials(p);
  const allowedLayers = ctx.layers.filter(l => p.putLayer[l] === true);
  const openingTypes = [
    ...(p.put.windows ? ['window'] : []),
    ...(p.put.doors ? ['door'] : []),
    ...(p.put.windows && p.put.doors ? ['all'] : []),
  ];

  const tools: JevTool[] = [];
  const add = (name: ActionName, description: string, props: Record<string, unknown>) => {
    if (allowed.has(name)) tools.push(strictTool(name, description, props));
  };

  add('measure', 'Run a trace and reverb job at a point or room without moving the user.', {
    point: VEC3_SCHEMA,
    room: { type: ['string', 'null'] },
  });
  add('compare', 'Compute differences between two measure results.', {
    before: MEASUREMENT_SCHEMA,
    after: MEASUREMENT_SCHEMA,
  });
  add('set_material', 'Set the material of a surface (house-wide or for one room).', {
    target: { type: 'string', enum: ['wall', 'floor', 'ceiling', 'exterior_wall'] },
    room: { type: ['string', 'null'] },
    material: { type: 'string', enum: materials },
  });
  add('set_furnishing', 'Set furnishing absorption level (house-wide or for one room).', {
    level: { type: 'string', enum: FURNISHING_LEVELS },
    room: { type: ['string', 'null'] },
  });
  add('set_opening', 'Open or close a window or door by id, or by room and type.', {
    id: { type: ['string', 'null'] },
    room: { type: ['string', 'null'] },
    type: { type: ['string', 'null'], enum: [...openingTypes, null] },
    state: { type: 'string', enum: ['open', 'closed'] },
  });
  add('place_speaker', 'Place a speaker at a room centre (1 m up) or 3D point.', {
    room: { type: ['string', 'null'] },
    point: VEC3_SCHEMA,
    sound: { type: 'string', enum: ctx.sounds },
    levelDb: { type: ['number', 'null'] },
  });
  add('move_speaker', 'Move an existing speaker to a room or 3D point.', {
    id: { type: 'string' },
    room: { type: ['string', 'null'] },
    point: VEC3_SCHEMA,
  });
  add('set_speaker', 'Change a speaker level, enabled state, or sound.', {
    id: { type: 'string' },
    levelDb: { type: ['number', 'null'] },
    enabled: { type: ['boolean', 'null'] },
    sound: { type: ['string', 'null'], enum: [...ctx.sounds, null] },
  });
  add('remove_speaker', 'Remove a placed speaker by id.', {
    id: { type: 'string' },
  });
  add('move_user_to', 'Move the listener to the sweep nearest a room centre.', {
    room: { type: 'string' },
  });
  add('set_mesh_layer', 'Toggle whether a mesh layer is traced or shown.', {
    layer: allowedLayers.length ? { type: 'string', enum: allowedLayers } : { type: 'string' },
    traced: { type: ['boolean', 'null'] },
    shown: { type: ['boolean', 'null'] },
  });

  return tools;
}
