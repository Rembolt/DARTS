import { mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import express from 'express';
import request from 'supertest';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { PiModel, PiSource } from '../src/quick/pi.js';
import type { IndexRow } from '../src/shared/contract.js';
import { checkProposal, suggestDefaults, tableDefaults } from '../src/v2/defaults.js';
import type { PiRoomGeom } from '../src/v2/geometry.js';
import { v2Router } from '../src/v2/routes.js';

function makeRoomGeom(id: string, name: string): PiRoomGeom {
  return {
    id,
    name,
    floor: 'f1',
    area: 15,
    floorZ: 0,
    height: 2.7,
    polygon: [
      [0, 0],
      [4, 0],
      [4, 4],
      [0, 4],
    ],
  };
}

function makePiModel(): PiModel {
  return {
    modelId: 'Ki9YdfpNKum',
    name: 'Demo House',
    active: true,
    isPublic: true,
    hasMesh: true,
    rooms: [
      {
        id: 'r-kitchen',
        label: 'Kitchen',
        classifications: [{ label: 'kitchen', confidence: 0.9 }],
        floorId: 'f1',
        keywords: [],
        area: 12,
        width: 3,
        depth: 4,
        height: 2.7,
        lowerElevation: 0,
        edges: [
          { type: 'wall', a: [0, 0], b: [3, 0], thickness: 0.15, openings: [] },
          { type: 'wall', a: [3, 0], b: [3, 4], thickness: 0.15, openings: [] },
          { type: 'wall', a: [3, 4], b: [0, 4], thickness: 0.15, openings: [] },
          { type: 'wall', a: [0, 4], b: [0, 0], thickness: 0.15, openings: [] },
        ],
      },
      {
        id: 'r-bed',
        label: 'Primary Bedroom',
        classifications: [{ label: 'bedroom', confidence: 0.95 }],
        floorId: 'f1',
        keywords: [],
        area: 18,
        width: 4,
        depth: 4.5,
        height: 2.7,
        lowerElevation: 0,
        edges: [
          { type: 'wall', a: [0, 0], b: [4, 0], thickness: 0.15, openings: [] },
          { type: 'wall', a: [4, 0], b: [4, 4.5], thickness: 0.15, openings: [] },
          { type: 'wall', a: [4, 4.5], b: [0, 4.5], thickness: 0.15, openings: [] },
          { type: 'wall', a: [0, 4.5], b: [0, 0], thickness: 0.15, openings: [] },
        ],
      },
    ],
  };
}

const INDEX_ROW: IndexRow = {
  modelId: 'Ki9YdfpNKum',
  kind: 'home',
  propertyKey: 'p1',
  toursOnProperty: 1,
  address: '9117 Richland Dr',
  city: 'Houston',
  zip: '77016',
  lat: 29.8,
  lon: -95.2,
  propertyType: 'Single Family',
  buildingName: null,
  sqft: 1500,
  beds: 3,
  baths: 2,
  price: 250000,
  yearBuilt: 1952,
  stories: 1,
  facts: ['Tile Flooring', 'Brick Exterior Construction'],
};

describe('tableDefaults', () => {
  it('gives a kitchen tile and a bedroom carpet from the table', () => {
    const rooms = [makeRoomGeom('r1', 'Kitchen'), makeRoomGeom('r2', 'Bedroom')];
    const d = tableDefaults(rooms, () => [], []);
    expect(d.source).toBe('table');
    expect(d.rooms[0].floor.parts).toEqual([{ material: 'tile', weight: 1 }]);
    expect(d.rooms[0].furnishing).toBe('sparse');
    expect(d.rooms[1].floor.parts).toEqual([{ material: 'carpet', weight: 1 }]);
    expect(d.rooms[1].furnishing).toBe('furnished');
    expect(d.exteriorWall.parts).toEqual([{ material: 'siding_wall', weight: 1 }]);
  });

  it('blends a kitchen-dining room by confidence', () => {
    const rooms = [makeRoomGeom('r1', 'Main Space')];
    const d = tableDefaults(
      rooms,
      () => [
        { label: 'kitchen', confidence: 0.6 },
        { label: 'dining', confidence: 0.4 },
      ],
      [],
    );
    expect(d.rooms[0].floor.parts).toEqual([
      { material: 'tile', weight: 0.6 },
      { material: 'wood_floor', weight: 0.4 },
    ]);
  });

  it('turns a brick fact into brick_veneer', () => {
    const d = tableDefaults([makeRoomGeom('r1', 'Kitchen')], () => [], ['Built in 1952', 'Brick Exterior Construction']);
    expect(d.exteriorWall.parts).toEqual([{ material: 'brick_veneer', weight: 1 }]);
    expect(d.exteriorReason).toContain('Brick');
  });
});

describe('checkProposal', () => {
  const table = tableDefaults([makeRoomGeom('r-kitchen', 'Kitchen'), makeRoomGeom('r-bed', 'Bedroom')], () => [], []);

  it('accepts a valid proposal and marks it llm', () => {
    const checked = checkProposal(
      {
        rooms: [
          {
            roomId: 'r-kitchen',
            floor: [{ material: 'tile', weight: 1 }],
            wall: [{ material: 'drywall', weight: 1 }],
            ceiling: [{ material: 'drywall', weight: 1 }],
            furnishing: 'sparse',
            reason: 'Listing says Tile Flooring.',
          },
        ],
        exteriorWall: [{ material: 'brick_veneer', weight: 1 }],
        exteriorReason: 'Brick Exterior Construction.',
      },
      table,
    );
    expect(checked.source).toBe('llm');
    expect(checked.rooms[0].reason).toBe('Listing says Tile Flooring.');
    expect(checked.rooms[1]).toEqual(table.rooms[1]);
    expect(checked.exteriorWall.parts).toEqual([{ material: 'brick_veneer', weight: 1 }]);
  });

  it('drops unknown rooms, tiny parts and extra parts, and normalises', () => {
    const checked = checkProposal(
      {
        rooms: [
          { roomId: 'unknown-id', floor: [{ material: 'tile', weight: 1 }], wall: [{ material: 'drywall', weight: 1 }], ceiling: [{ material: 'drywall', weight: 1 }], furnishing: 'empty', reason: 'x' },
          {
            roomId: 'r-kitchen',
            floor: [
              { material: 'tile', weight: 6 },
              { material: 'wood_floor', weight: 2 },
              { material: 'carpet', weight: 1 },
              { material: 'concrete', weight: 0.5 },
              { material: 'vinyl', weight: 0.05 },
            ],
            wall: [{ material: 'drywall', weight: 2 }],
            ceiling: [{ material: 'drywall', weight: 3 }],
            furnishing: 'sparse',
            reason: 'Blended.',
          },
        ],
        exteriorWall: [{ material: 'siding_wall', weight: 1 }],
        exteriorReason: 'Siding.',
      },
      table,
    );
    expect(checked.rooms).toHaveLength(2);
    const floor = checked.rooms[0].floor.parts;
    expect(floor.length).toBeLessThanOrEqual(3);
    expect(floor.every(p => p.weight >= 0.1)).toBe(true);
    const sum = floor.reduce((s, p) => s + p.weight, 0);
    expect(sum).toBeCloseTo(1);
  });

  it('keeps the table row for a room the model got wrong', () => {
    const checked = checkProposal(
      {
        rooms: [
          {
            roomId: 'r-kitchen',
            floor: [{ material: 'lava', weight: 1 }],
            wall: [{ material: 'drywall', weight: 1 }],
            ceiling: [{ material: 'drywall', weight: 1 }],
            furnishing: 'sparse',
            reason: 'Invalid.',
          },
        ],
        exteriorWall: [{ material: 'siding_wall', weight: 1 }],
        exteriorReason: 'Default.',
      },
      table,
    );
    expect(checked.rooms[0]).toEqual(table.rooms[0]);
  });
});

describe('suggestDefaults', () => {
  let cacheDir: string;
  const pi: PiSource = { get: async () => makePiModel() };

  beforeEach(() => {
    cacheDir = mkdtempSync(join(tmpdir(), 'v2-defaults-'));
  });

  afterEach(() => {
    rmSync(cacheDir, { recursive: true, force: true });
  });

  it('falls back to the table without a key and does not cache', async () => {
    const res = await suggestDefaults({ pi, lookup: () => INDEX_ROW, env: {}, cacheDir }, 'Ki9YdfpNKum', false);
    expect(res.source).toBe('table');
    expect(() => readFileSync(join(cacheDir, 'defaults-Ki9YdfpNKum.json'))).toThrow();
  });

  it('falls back on a refusal', async () => {
    const client = {
      messages: {
        create: vi.fn(async () => ({ stop_reason: 'refusal', content: [] })),
      },
    };
    const res = await suggestDefaults({ pi, lookup: () => INDEX_ROW, env: {}, cacheDir, client }, 'Ki9YdfpNKum', false);
    expect(res.source).toBe('table');
    expect(() => readFileSync(join(cacheDir, 'defaults-Ki9YdfpNKum.json'))).toThrow();
  });

  it('caches an llm answer and reuses it', async () => {
    const create = vi.fn(async () => ({
      stop_reason: 'tool_use',
      content: [
        {
          type: 'tool_use',
          id: 't1',
          name: 'propose_defaults',
          input: {
            rooms: [
              {
                roomId: 'r-kitchen',
                floor: [{ material: 'tile', weight: 1 }],
                wall: [{ material: 'drywall', weight: 1 }],
                ceiling: [{ material: 'drywall', weight: 1 }],
                furnishing: 'sparse',
                reason: 'Listing says Tile Flooring.',
              },
            ],
            exteriorWall: [{ material: 'brick_veneer', weight: 1 }],
            exteriorReason: 'Brick Exterior Construction.',
          },
        },
      ],
    }));
    const client = { messages: { create } };
    const first = await suggestDefaults({ pi, lookup: () => INDEX_ROW, env: {}, cacheDir, client }, 'Ki9YdfpNKum', false);
    const second = await suggestDefaults({ pi, lookup: () => INDEX_ROW, env: {}, cacheDir, client }, 'Ki9YdfpNKum', false);
    expect(first.source).toBe('llm');
    expect(second).toEqual(first);
    expect(create).toHaveBeenCalledTimes(1);
  });

  it('recomputes on refresh', async () => {
    const create = vi.fn(async () => ({
      stop_reason: 'tool_use',
      content: [
        {
          type: 'tool_use',
          id: 't1',
          name: 'propose_defaults',
          input: {
            rooms: [],
            exteriorWall: [{ material: 'brick_veneer', weight: 1 }],
            exteriorReason: 'Brick.',
          },
        },
      ],
    }));
    const client = { messages: { create } };
    await suggestDefaults({ pi, lookup: () => INDEX_ROW, env: {}, cacheDir, client }, 'Ki9YdfpNKum', false);
    await suggestDefaults({ pi, lookup: () => INDEX_ROW, env: {}, cacheDir, client }, 'Ki9YdfpNKum', true);
    expect(create).toHaveBeenCalledTimes(2);
  });

  it('sends no free text to the model', async () => {
    const remarks = 'PRIVATE SELLER REMARKS DO NOT SEND';
    writeFileSync(
      join(cacheDir, 'listing-Ki9YdfpNKum.json'),
      JSON.stringify({ facts: ['Tile Flooring', 'Brick Exterior Construction'], remarks }),
    );
    const create = vi.fn(async (_params: unknown) => ({ stop_reason: 'end_turn', content: [] }));
    const client = { messages: { create } };
    await suggestDefaults({ pi, lookup: () => INDEX_ROW, env: {}, cacheDir, client }, 'Ki9YdfpNKum', false);
    const sent = JSON.stringify(create.mock.calls[0]?.[0]);
    expect(sent).not.toContain(remarks);
    expect(sent).toContain('Tile Flooring');
  });

  it('serves GET /api/defaults/:id', async () => {
    const app = express();
    app.use('/api', v2Router({ pi, lookup: () => INDEX_ROW, allowedIds: new Set(['Ki9YdfpNKum']), env: {}, cacheDir }));
    const res = await request(app).get('/api/defaults/Ki9YdfpNKum');
    expect(res.status).toBe(200);
    expect(res.body.source).toBe('table');
  });
});
