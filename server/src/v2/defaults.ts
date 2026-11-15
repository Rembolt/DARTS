import { existsSync, mkdirSync, readFileSync, renameSync, rmSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import Anthropic from '@anthropic-ai/sdk';
import type { PiSource } from '../quick/pi.js';
import type { Search } from '../search/index.js';
import type { Blend, FurnishingLevel, MaterialDefaults, RoomDefault } from '../shared/defaults.js';
import { FURNISHING, MATERIALS, ROOM_TABLE, roomType, type MaterialName, type Mix } from '../shared/materials.js';
import { geometryOf, type PiRoomGeom } from './geometry.js';

const MATERIAL_KEYS = Object.keys(MATERIALS) as MaterialName[];
const FURNISHING_KEYS = Object.keys(FURNISHING) as FurnishingLevel[];
const MODEL = 'claude-haiku-5-5';

const isMaterial = (v: unknown): v is MaterialName =>
  typeof v === 'string' && Object.prototype.hasOwnProperty.call(MATERIALS, v);

const isFurnishing = (v: unknown): v is FurnishingLevel =>
  typeof v === 'string' && Object.prototype.hasOwnProperty.call(FURNISHING, v);

const isPlainObject = (v: unknown): v is Record<string, unknown> =>
  typeof v === 'object' && v !== null && !Array.isArray(v);

function normaliseBlend(rawParts: { material: MaterialName; weight: number }[]): Blend | null {
  const merged = new Map<MaterialName, number>();
  for (const p of rawParts) {
    if (!Number.isFinite(p.weight) || p.weight <= 0) continue;
    merged.set(p.material, (merged.get(p.material) ?? 0) + p.weight);
  }
  const sorted = [...merged.entries()]
    .map(([material, weight]) => ({ material, weight }))
    .sort((a, b) => b.weight - a.weight)
    .slice(0, 3);
  const total1 = sorted.reduce((s, p) => s + p.weight, 0);
  if (total1 <= 0) return null;
  const kept = sorted
    .map(p => ({ material: p.material, weight: p.weight / total1 }))
    .filter(p => p.weight >= 0.1);
  const total2 = kept.reduce((s, p) => s + p.weight, 0);
  if (total2 <= 0) return null;
  return {
    parts: kept.map(p => ({ material: p.material, weight: +(p.weight / total2).toFixed(4) })),
  };
}

function mixToBlend(mix: Mix): Blend {
  return normaliseBlend(mix.map(m => ({ material: m.material, weight: m.weight }))) ?? {
    parts: [{ material: 'drywall', weight: 1 }],
  };
}

function blendFromClasses(classes: { label: string; confidence: number }[]): {
  floor: Blend;
  wall: Blend;
  ceiling: Blend;
  furnishing: FurnishingLevel;
} | null {
  const valid = classes.filter(c => Number.isFinite(c.confidence) && c.confidence > 0);
  if (valid.length === 0) return null;

  const floorParts: { material: MaterialName; weight: number }[] = [];
  const wallParts: { material: MaterialName; weight: number }[] = [];
  const ceilingParts: { material: MaterialName; weight: number }[] = [];

  for (const c of valid) {
    const row = ROOM_TABLE[roomType(c.label)];
    for (const p of row.floor) floorParts.push({ material: p.material, weight: p.weight * c.confidence });
    for (const p of row.wall) wallParts.push({ material: p.material, weight: p.weight * c.confidence });
    for (const p of row.ceiling) ceilingParts.push({ material: p.material, weight: p.weight * c.confidence });
  }

  const top = [...valid].sort((a, b) => b.confidence - a.confidence)[0]!;
  return {
    floor: normaliseBlend(floorParts) ?? mixToBlend(ROOM_TABLE.other.floor),
    wall: normaliseBlend(wallParts) ?? mixToBlend(ROOM_TABLE.other.wall),
    ceiling: normaliseBlend(ceilingParts) ?? mixToBlend(ROOM_TABLE.other.ceiling),
    furnishing: ROOM_TABLE[roomType(top.label)].furnishing,
  };
}

/** Room-type table defaults (spec 4.4); owner label wins over classifications when it names a known room type. */
export function tableDefaults(
  rooms: PiRoomGeom[],
  classesOf: (roomId: string) => { label: string; confidence: number }[],
  facts: string[],
): MaterialDefaults {
  const roomRows: RoomDefault[] = rooms.map(room => {
    const labelType = roomType(room.name);
    if (labelType !== 'other') {
      const row = ROOM_TABLE[labelType];
      return {
        roomId: room.id,
        floor: mixToBlend(row.floor),
        wall: mixToBlend(row.wall),
        ceiling: mixToBlend(row.ceiling),
        furnishing: row.furnishing,
        reason: 'Typical US home finishes by room type (suggested).',
      };
    }
    const blended = blendFromClasses(classesOf(room.id));
    if (blended) {
      return {
        roomId: room.id,
        ...blended,
        reason: 'Typical US home finishes by room classification (suggested).',
      };
    }
    const fallback = ROOM_TABLE.other;
    return {
      roomId: room.id,
      floor: mixToBlend(fallback.floor),
      wall: mixToBlend(fallback.wall),
      ceiling: mixToBlend(fallback.ceiling),
      furnishing: fallback.furnishing,
      reason: 'Typical US home finishes (suggested).',
    };
  });

  const brickFact = facts.find(f => /\bbrick\b/i.test(f));
  const exteriorWall: Blend = brickFact
    ? { parts: [{ material: 'brick_veneer', weight: 1 }] }
    : { parts: [{ material: 'siding_wall', weight: 1 }] };
  const exteriorReason = brickFact
    ? `Suggested brick_veneer from listing fact: ${brickFact}`
    : 'Typical US home exterior (suggested).';

  return { source: 'table', rooms: roomRows, exteriorWall, exteriorReason };
}

const BLEND_SCHEMA = {
  type: 'array' as const,
  items: {
    type: 'object' as const,
    additionalProperties: false,
    properties: {
      material: { type: 'string' as const, enum: MATERIAL_KEYS },
      weight: { type: 'number' as const },
    },
    required: ['material', 'weight'],
  },
};

export const PROPOSE_DEFAULTS_TOOL: Anthropic.Tool = {
  name: 'propose_defaults',
  description: 'Suggest material blends per room and for the exterior wall from the library and listing facts.',
  strict: true,
  input_schema: {
    type: 'object',
    additionalProperties: false,
    properties: {
      rooms: {
        type: 'array',
        items: {
          type: 'object',
          additionalProperties: false,
          properties: {
            roomId: { type: 'string' },
            floor: BLEND_SCHEMA,
            wall: BLEND_SCHEMA,
            ceiling: BLEND_SCHEMA,
            furnishing: { type: 'string', enum: FURNISHING_KEYS },
            reason: { type: 'string' },
          },
          required: ['roomId', 'floor', 'wall', 'ceiling', 'furnishing', 'reason'],
        },
      },
      exteriorWall: BLEND_SCHEMA,
      exteriorReason: { type: 'string' },
    },
    required: ['rooms', 'exteriorWall', 'exteriorReason'],
  },
};

function parseBlend(raw: unknown): Blend | null {
  if (!Array.isArray(raw)) return null;
  const parts: { material: MaterialName; weight: number }[] = [];
  for (const item of raw) {
    if (!isPlainObject(item)) return null;
    if (!isMaterial(item.material)) return null;
    if (typeof item.weight !== 'number' || !Number.isFinite(item.weight) || item.weight <= 0) return null;
    parts.push({ material: item.material, weight: item.weight });
  }
  return normaliseBlend(parts);
}

/** Validate and normalise an LLM proposal against the table baseline (spec 4.4 item 5). */
export function checkProposal(input: unknown, table: MaterialDefaults): MaterialDefaults {
  if (!isPlainObject(input)) return { ...table, source: 'llm' };

  const byId = new Map<string, Record<string, unknown>>();
  if (Array.isArray(input.rooms)) {
    for (const r of input.rooms) {
      if (isPlainObject(r) && typeof r.roomId === 'string') byId.set(r.roomId, r);
    }
  }

  const rooms: RoomDefault[] = table.rooms.map(base => {
    const cand = byId.get(base.roomId);
    if (!cand) return base;
    const floor = parseBlend(cand.floor);
    const wall = parseBlend(cand.wall);
    const ceiling = parseBlend(cand.ceiling);
    const furnishing = isFurnishing(cand.furnishing) ? cand.furnishing : null;
    const reason = typeof cand.reason === 'string' && cand.reason.trim() ? cand.reason.trim() : base.reason;
    if (!floor || !wall || !ceiling || !furnishing) return base;
    return { roomId: base.roomId, floor, wall, ceiling, furnishing, reason };
  });

  const ext = parseBlend(input.exteriorWall);
  const extReason =
    typeof input.exteriorReason === 'string' && input.exteriorReason.trim()
      ? input.exteriorReason.trim()
      : table.exteriorReason;

  return {
    source: 'llm',
    rooms,
    exteriorWall: ext ?? table.exteriorWall,
    exteriorReason: ext ? extReason : table.exteriorReason,
  };
}

function readCachedDefaults(path: string): MaterialDefaults | null {
  if (!existsSync(path)) return null;
  try {
    return JSON.parse(readFileSync(path, 'utf8')) as MaterialDefaults;
  } catch {
    return null;
  }
}

function writeAtomic(path: string, data: unknown): void {
  mkdirSync(join(path, '..'), { recursive: true });
  const tmp = `${path}.${process.pid}.${Date.now()}.tmp`;
  try {
    writeFileSync(tmp, JSON.stringify(data, null, 2));
    renameSync(tmp, path);
  } catch (err) {
    rmSync(tmp, { force: true });
    throw err;
  }
}

function readFacts(cacheDir: string, modelId: string, lookup: Search['lookup']): string[] {
  const listingPath = join(cacheDir, `listing-${modelId}.json`);
  if (existsSync(listingPath)) {
    try {
      const parsed = JSON.parse(readFileSync(listingPath, 'utf8')) as { facts?: unknown };
      if (Array.isArray(parsed.facts)) {
        return parsed.facts.filter((f): f is string => typeof f === 'string');
      }
    } catch {
      // Fall back to index row facts.
    }
  }
  return lookup(modelId)?.facts ?? [];
}

type MessagesClient = {
  messages: {
    create(params: Record<string, unknown>): Promise<{
      stop_reason?: string | null;
      content?: { type: string; name?: string; input?: unknown }[];
    }>;
  };
};

export async function suggestDefaults(
  deps: {
    pi: PiSource;
    lookup: Search['lookup'];
    env: Record<string, string | undefined>;
    cacheDir: string;
    client?: unknown;
  },
  modelId: string,
  refresh: boolean,
): Promise<MaterialDefaults> {
  const cachePath = join(deps.cacheDir, `defaults-${modelId}.json`);
  if (!refresh) {
    const cached = readCachedDefaults(cachePath);
    if (cached) return cached;
  }

  const model = await deps.pi.get(modelId);
  const geom = geometryOf(model);
  const classMap = new Map(model.rooms.map(r => [r.id, r.classifications]));
  const facts = readFacts(deps.cacheDir, modelId, deps.lookup);
  const table = tableDefaults(geom.rooms, id => classMap.get(id) ?? [], facts);

  const key = deps.env.CLAUDE_API?.trim();
  const client = (deps.client as MessagesClient | undefined) ?? (key ? new Anthropic({ apiKey: key }) : undefined);
  if (!client) return table;

  try {
    const response = await client.messages.create({
      model: MODEL,
      max_tokens: 4096,
      output_config: { effort: 'low' },
      tools: [PROPOSE_DEFAULTS_TOOL],
      tool_choice: { type: 'tool', name: 'propose_defaults' },
      system:
        'Start from each room table row and change it only where a building fact supports it. ' +
        'Name the supporting fact in reason. Never invent materials outside the enum.',
      messages: [
        {
          role: 'user',
          content: JSON.stringify({
            library: MATERIALS,
            facts,
            rooms: geom.rooms.map((r, i) => ({
              roomId: r.id,
              name: r.name,
              area: r.area,
              table: table.rooms[i],
            })),
            exteriorWall: table.exteriorWall,
          }),
        },
      ],
    });
    if (response.stop_reason === 'refusal') return table;
    const block = response.content?.find(
      (b): b is { type: 'tool_use'; name: string; input: unknown } =>
        b.type === 'tool_use' && 'name' in b && b.name === 'propose_defaults',
    );
    if (!block) return table;
    const result = checkProposal(block.input, table);
    writeAtomic(cachePath, result);
    return result;
  } catch {
    return table;
  }
}
