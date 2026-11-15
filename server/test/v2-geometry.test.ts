import express from 'express';
import request from 'supertest';
import { describe, expect, it } from 'vitest';
import { NotPossibleError } from '../src/errors.js';
import type { PiModel, PiRoom, PiSource } from '../src/quick/pi.js';
import { notPossible } from '../src/shared/contract.js';
import { geometryOf } from '../src/v2/geometry.js';
import { v2Router } from '../src/v2/routes.js';

function makeRoom(overrides: Partial<PiRoom> = {}): PiRoom {
  return {
    id: 'room-1',
    label: 'Living Room',
    classifications: [],
    floorId: 'floor-1',
    keywords: [],
    area: 16,
    width: 4,
    depth: 4,
    height: 2.8,
    lowerElevation: 0,
    edges: [
      { type: 'wall', a: [0, 0], b: [4, 0], thickness: 0.15, openings: [] },
      { type: 'wall', a: [4, 0], b: [4, 4], thickness: 0.15, openings: [] },
      { type: 'wall', a: [4, 4], b: [0, 4], thickness: 0.15, openings: [] },
      { type: 'wall', a: [0, 4], b: [0, 0], thickness: 0.15, openings: [] },
    ],
    ...overrides,
  };
}

function makeModel(rooms: PiRoom[]): PiModel {
  return {
    modelId: 'Ki9YdfpNKum',
    name: 'Test House',
    active: true,
    isPublic: true,
    hasMesh: true,
    rooms,
  };
}

describe('geometryOf', () => {
  it('places an opening along its edge', () => {
    const room = makeRoom({
      edges: [
        {
          type: 'wall',
          a: [0, 0],
          b: [4, 0],
          thickness: 0.2,
          openings: [{ id: 'op-1', type: 'window', width: 1, height: 1.2, relativeCenter: 0.5, lowerElevation: 1.0 }],
        },
        { type: 'wall', a: [4, 0], b: [4, 4], thickness: 0.2, openings: [] },
        { type: 'wall', a: [4, 4], b: [0, 4], thickness: 0.2, openings: [] },
        { type: 'wall', a: [0, 4], b: [0, 0], thickness: 0.2, openings: [] },
      ],
    });
    const result = geometryOf(makeModel([room]));
    expect(result.openings).toHaveLength(1);
    expect(result.openings[0]).toMatchObject({
      id: 'op-1',
      kind: 'window',
      roomId: 'room-1',
      roomName: 'Living Room',
      a: [1.5, 0],
      b: [2.5, 0],
      bottom: 1.0,
      height: 1.2,
      thickness: 0.2,
    });
  });

  it('maps doorway to door and keeps opening and divider', () => {
    const room = makeRoom({
      edges: [
        {
          type: 'wall',
          a: [0, 0],
          b: [4, 0],
          thickness: 0.15,
          openings: [
            { id: 'd1', type: 'doorway', width: 0.9, height: 2.1, relativeCenter: 0.25, lowerElevation: 0 },
            { id: 'o1', type: 'opening', width: 1.2, height: 2.4, relativeCenter: 0.5, lowerElevation: 0 },
            { id: 'v1', type: 'divider', width: 1.0, height: 2.4, relativeCenter: 0.75, lowerElevation: 0 },
          ],
        },
        { type: 'wall', a: [4, 0], b: [4, 4], thickness: 0.15, openings: [] },
        { type: 'wall', a: [4, 4], b: [0, 4], thickness: 0.15, openings: [] },
        { type: 'wall', a: [0, 4], b: [0, 0], thickness: 0.15, openings: [] },
      ],
    });
    const result = geometryOf(makeModel([room]));
    expect(result.openings.map(o => o.kind)).toEqual(['door', 'opening', 'divider']);
  });

  it('defaults a window sill to 0.9 m and a door height to 2.0 m', () => {
    const room = makeRoom({
      lowerElevation: 3.0,
      height: 0,
      edges: [
        {
          type: 'wall',
          a: [0, 0],
          b: [4, 0],
          thickness: 0.15,
          openings: [
            { id: 'w1', type: 'window', width: 1.0, height: 1.2, relativeCenter: 0.3, lowerElevation: null },
            { id: 'd1', type: 'doorway', width: 0.9, height: 0, relativeCenter: 0.7, lowerElevation: null },
          ],
        },
        { type: 'wall', a: [4, 0], b: [4, 4], thickness: 0.15, openings: [] },
        { type: 'wall', a: [4, 4], b: [0, 4], thickness: 0.15, openings: [] },
        { type: 'wall', a: [0, 4], b: [0, 0], thickness: 0.15, openings: [] },
      ],
    });
    const result = geometryOf(makeModel([room]));
    expect(result.rooms[0].height).toBe(2.7);
    expect(result.rooms[0].floorZ).toBe(3.0);
    expect(result.openings[0].bottom).toBeCloseTo(3.9);
    expect(result.openings[1].bottom).toBeCloseTo(3.0);
    expect(result.openings[1].height).toBe(2.0);
  });

  it('builds a closed polygon per room in edge order', () => {
    const result = geometryOf(makeModel([makeRoom()]));
    expect(result.rooms).toHaveLength(1);
    expect(result.rooms[0].polygon).toEqual([
      [0, 0],
      [4, 0],
      [4, 4],
      [0, 4],
    ]);
  });

  it('leaves out rooms without a boundary', () => {
    const result = geometryOf(makeModel([makeRoom({ id: 'empty', edges: [] }), makeRoom()]));
    expect(result.rooms.map(r => r.id)).toEqual(['room-1']);
  });
});

describe('GET /api/openings/:id', () => {
  function mount(pi: PiSource) {
    const app = express();
    app.use(
      '/api',
      v2Router({
        pi,
        lookup: () => null,
        allowedIds: new Set(['Ki9YdfpNKum']),
        env: {},
        cacheDir: '/tmp/unused',
      }),
    );
    return app;
  }

  it('serves the answer and refuses an unknown id', async () => {
    const app = mount({ get: async () => makeModel([makeRoom()]) });
    const ok = await request(app).get('/api/openings/Ki9YdfpNKum');
    expect(ok.status).toBe(200);
    expect(ok.body.rooms).toHaveLength(1);

    const bad = await request(app).get('/api/openings/NotInCat123');
    expect(bad.status).toBe(404);
    expect(bad.body.code).toBe('unknown_model');
  });

  it('passes a Matterport outage through as not possible', async () => {
    const app = mount({
      get: async () => {
        throw new NotPossibleError(notPossible('matterport_unreachable'));
      },
    });
    const res = await request(app).get('/api/openings/Ki9YdfpNKum');
    expect(res.status).toBe(502);
    expect(res.body.code).toBe('matterport_unreachable');
  });
});
