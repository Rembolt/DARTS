import { describe, it, expect } from 'vitest';
import request from 'supertest';
import { createApp } from '../src/app.js';
import { apiRouter } from '../src/routes.js';
import type { Search } from '../src/search/index.js';
import type { Quick } from '../src/quick/index.js';
import type { Surroundings } from '../src/surroundings/index.js';
import type { Agent } from '../src/agent/index.js';
import {
  DEMO_MODEL_ID,
  notPossible,
  type AreaSummary,
  type IndexRow,
  type ProfileId,
  type Requirements,
  type RequirementOverrides,
} from '../src/shared/contract.js';

const ROW: IndexRow = {
  modelId: DEMO_MODEL_ID, kind: 'home', propertyKey: 'r1', toursOnProperty: 1,
  address: '9117 Richland Drive', city: 'Houston', zip: '77000', lat: 29.7, lon: -95.4,
  propertyType: 'Single Family', buildingName: null, sqft: 2000, beds: 3, baths: 2, price: 300000,
  yearBuilt: 1990, stories: 1, facts: [],
};
const AREA: AreaSummary = {
  areaClass: 'residential', source: 'vexcel', counts: {}, located: [], roadBearingDeg: null, facadeDb: 50, imageryDate: null,
};
const REQ: Requirements = {
  profile: 'podcast', echoMid: [0.2, 0.4], maxOutsideDb: 30, maxEscapeDb: null, minRoomArea: 6, avoidBoomyBass: true,
  weights: { echo: 1, outside: 1, escape: 0, size: 1, bass: 1 },
};

function fakes() {
  const calls: { resolve: [ProfileId, Partial<RequirementOverrides> | undefined][]; summarise: [string, Requirements][] } = {
    resolve: [],
    summarise: [],
  };
  const search: Search = {
    ready: () => true,
    lookup: id => (id === DEMO_MODEL_ID ? ROW : null),
    search: () => ({ total: 0, rows: [], notes: [] }),
  };
  const surroundings: Surroundings = { get: async () => AREA };
  const quick: Quick = {
    status: async modelId => ({ modelId, name: 'Home', canEnter: true, canSummarise: true, reason: null }),
    summarise: async (modelId, requirements) => {
      calls.summarise.push([modelId, requirements]);
      return { ok: false, modelId, address: null, reason: notPossible('no_room_data') };
    },
    resolve: (profile, overrides) => {
      calls.resolve.push([profile, overrides]);
      return REQ;
    },
    isUnusable: () => false,
  };
  const agent: Agent = {
    run: async (_request, emit) => {
      emit({ type: 'status', text: 'a' });
      emit({ type: 'text', text: 'b' });
      emit({ type: 'done' });
    },
  };
  const allowedIds = new Set([DEMO_MODEL_ID, 'aaaaaaaaaaa']);
  const app = createApp({}, { allowedIds, routers: [apiRouter({ search, quick, surroundings, agent, allowedIds })] });
  return { app, calls };
}

describe('apiRouter', () => {
  it('refuses ids outside the catalogue on every id route', async () => {
    const { app } = fakes();
    for (const path of ['/api/property/bbbbbbbbbbb/status', '/api/surroundings/bbbbbbbbbbb', '/api/property/..%2Fx/status']) {
      const res = await request(app).get(path);
      expect(res.status, path).toBe(404);
      expect(res.body.code, path).toBe('unknown_model');
    }
    const quick = await request(app).post('/api/quick-summary').send({ modelId: 'bbbbbbbbbbb', profile: 'podcast' });
    expect(quick.status).toBe(404);
    expect(quick.body.code).toBe('unknown_model');
  });

  it('answers status and surroundings for an allowed id', async () => {
    const { app } = fakes();
    const status = await request(app).get(`/api/property/${DEMO_MODEL_ID}/status`);
    expect(status.body).toEqual({ modelId: DEMO_MODEL_ID, name: 'Home', canEnter: true, canSummarise: true, reason: null });
    const area = await request(app).get(`/api/surroundings/${DEMO_MODEL_ID}`);
    expect(area.body).toEqual(AREA);
  });

  it('refuses surroundings for an allowed id with no index row', async () => {
    const { app } = fakes();
    const res = await request(app).get('/api/surroundings/aaaaaaaaaaa');
    expect(res.status).toBe(404);
    expect(res.body.code).toBe('unknown_model');
  });

  it('streams agent events as SSE and ends', async () => {
    const { app } = fakes();
    const res = await request(app).post('/api/agent').send({ text: 'hi' });
    expect(res.headers['content-type']).toMatch(/text\/event-stream/);
    expect(res.headers['cache-control']).toBe('no-store');
    expect(res.text).toBe('data: {"type":"status","text":"a"}\n\ndata: {"type":"text","text":"b"}\n\ndata: {"type":"done"}\n\n');
  });

  it('rejects empty and over-long text before streaming', async () => {
    const { app } = fakes();
    for (const text of ['', 'x'.repeat(501), 5]) {
      const res = await request(app).post('/api/agent').send({ text });
      expect(res.status).toBe(400);
      expect(res.body.code).toBe('bad_request');
    }
  });

  it('rejects a body over 4 kB', async () => {
    const { app } = fakes();
    const res = await request(app).post('/api/agent').send({ text: 'hi', pad: 'x'.repeat(5000) });
    expect([400, 413]).toContain(res.status);
  });

  it('passes the resolved requirements to summarise', async () => {
    const { app, calls } = fakes();
    const overrides = { echoMax: 0.5 };
    const res = await request(app).post('/api/quick-summary').send({ modelId: DEMO_MODEL_ID, profile: 'podcast', overrides });
    expect(res.status).toBe(200);
    expect(calls.resolve).toEqual([['podcast', overrides]]);
    expect(calls.summarise).toEqual([[DEMO_MODEL_ID, REQ]]);
  });

  it('rejects a quick-summary body without a known profile', async () => {
    const { app, calls } = fakes();
    for (const body of [{ modelId: DEMO_MODEL_ID }, { modelId: DEMO_MODEL_ID, profile: 'karaoke' }, { modelId: DEMO_MODEL_ID, profile: 'podcast', overrides: 3 }]) {
      const res = await request(app).post('/api/quick-summary').send(body);
      expect(res.status).toBe(400);
      expect(res.body.code).toBe('bad_request');
    }
    expect(calls.summarise).toEqual([]);
  });
});
