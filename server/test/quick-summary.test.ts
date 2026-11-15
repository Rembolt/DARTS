import { describe, it, expect, afterEach } from 'vitest';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { createQuick } from '../src/quick/index.js';
import { createAvailability } from '../src/quick/availability.js';
import type { PiEdge, PiModel, PiRoom, PiSource } from '../src/quick/pi.js';
import { NotPossibleError } from '../src/errors.js';
import { notPossible, type AreaSummary, type IndexRow, type NotPossibleCode } from '../src/shared/contract.js';
import type { Surroundings } from '../src/surroundings/index.js';

const ID = 'Ki9YdfpNKum';
const ENV = { MATTERPORT_SDK_KEY: 'sdk', MATTERPORT_API_KEY: 'id', MATTERPORT_API_TOKEN: 'secret' };

const tempDirs: string[] = [];
function tempDir(): string {
  const dir = mkdtempSync(join(tmpdir(), 'quick-summary-'));
  tempDirs.push(dir);
  return dir;
}
afterEach(() => {
  for (const dir of tempDirs.splice(0)) rmSync(dir, { recursive: true, force: true });
});

const wall = (a: [number, number], b: [number, number]): PiEdge => ({ type: 'wall', a, b, thickness: 0.1, openings: [] });
function box(x0: number, y0: number, x1: number, y1: number): PiEdge[] {
  return [wall([x0, y0], [x1, y0]), wall([x1, y0], [x1, y1]), wall([x1, y1], [x0, y1]), wall([x0, y1], [x0, y0])];
}
function room(id: string, cls: string, over: Partial<PiRoom>): PiRoom {
  return {
    id, label: '', classifications: [{ label: cls, confidence: 1 }], floorId: 'f1', keywords: [],
    area: 20, width: 4, depth: 5, height: 0, lowerElevation: 0, edges: [], ...over,
  };
}

/** Bedroom and living room side by side, a kitchen behind the bedroom, and a Void sliver. */
const HOUSE: PiRoom[] = [
  room('bed', 'Bedroom', { height: 2.5, edges: box(0, 0, 4, 5) }),
  room('living', 'Living Room', { edges: box(4.1, 0, 8.1, 5) }),
  room('kitchen', 'Kitchen', { area: 12, width: 3, depth: 4, edges: box(0, 5.1, 3, 9.1) }),
  room('void', 'Void', { area: 0.3, width: 0.5, depth: 0.6 }),
];
const model = (over: Partial<PiModel> = {}): PiModel =>
  ({ modelId: ID, name: '9117 Richland Dr', active: true, isPublic: true, hasMesh: true, rooms: HOUSE, ...over });

const ROW: IndexRow = {
  modelId: ID, kind: 'home', propertyKey: 'L1', toursOnProperty: 1, address: '9117 Richland Dr', city: 'Houston',
  zip: '77078', lat: 29.85, lon: -95.25, propertyType: 'Detached', buildingName: null, sqft: 1500, beds: 3, baths: 2,
  price: 250000, yearBuilt: 1970, stories: 1, facts: ['brick'],
};

const AREA: AreaSummary = {
  areaClass: 'residential', source: 'vexcel', counts: { house: 82 }, located: [], roadBearingDeg: null, facadeDb: 50,
  imageryDate: '2025-01-01',
};

function fakePi(get: () => Promise<PiModel>): PiSource & { calls: number } {
  const pi = { calls: 0, get: () => { pi.calls++; return get(); } };
  return pi;
}

function setup(opts: {
  model?: PiModel; pi?: PiSource; bundle?: boolean; env?: Record<string, string>; row?: IndexRow | null; area?: AreaSummary;
} = {}) {
  const cacheDir = tempDir();
  const pi = opts.pi ?? fakePi(async () => opts.model ?? model());
  const surroundings: Surroundings = { get: async () => opts.area ?? AREA };
  const quick = createQuick({
    cacheDir, env: opts.env ?? ENV, pi, surroundings,
    lookup: id => (id === ID ? (opts.row === undefined ? ROW : opts.row) : null),
    bundleReady: () => opts.bundle ?? true,
  });
  return { quick, cacheDir };
}

const rejecting = (code: NotPossibleCode) => fakePi(() => Promise.reject(new NotPossibleError(notPossible(code))));

describe('createQuick summarise', () => {
  it('summarises a house', async () => {
    const { quick } = setup();
    const s = await quick.summarise(ID, quick.resolve('recording'));
    expect(s.ok).toBe(true);
    if (!s.ok) return;
    expect(s.rooms).toHaveLength(3);
    expect(s.bestRoomId).toBe(s.rooms[0].id);
    expect(s.score).toBe(s.rooms[0].score);
    for (let i = 1; i < s.rooms.length; i++) expect(s.rooms[i - 1].score).toBeGreaterThanOrEqual(s.rooms[i].score);
    expect(s.rooms.every(r => r.echo[1] > 0.1 && r.echo[1] < 3)).toBe(true);
    expect(s.canEnter).toBe(true);
    expect(s.enterReason).toBeNull();
    expect(s).toMatchObject({ modelId: ID, name: '9117 Richland Dr', address: '9117 Richland Dr', kind: 'home', skippedRooms: 1, area: AREA });
    expect(s.listing).toEqual({ sqft: 1500, beds: 3, baths: 2, price: 250000, propertyType: 'Detached', toursOnProperty: 1, buildingName: null });
    expect(s.requirements.profile).toBe('recording');
    const bed = s.rooms.find(r => r.id === 'bed')!;
    expect(bed).toMatchObject({ name: 'Bedroom', floor: 'f1', area: 20, volume: 50, heightAssumed: false });
    expect(bed.echoWord).toBe('controlled');
    expect(bed.outsideDb).not.toBeNull();
    expect(bed.escapeDb).not.toBeNull();
    expect(bed.roomGainDb).toBeGreaterThan(0);
  });

  it('answers no_room_data when every room is empty', async () => {
    const { quick } = setup({ model: model({ rooms: [room('x', 'Void', { area: 0, width: 0, depth: 0, classifications: [] })] }) });
    const s = await quick.summarise(ID, quick.resolve('general'));
    expect(s).toMatchObject({ ok: false, modelId: ID, address: '9117 Richland Dr', reason: { code: 'no_room_data' } });
    const status = await quick.status(ID);
    expect(status).toMatchObject({ canEnter: true, canSummarise: false, reason: { code: 'no_room_data' } });
  });

  it('answers no_mesh but still summarises', async () => {
    const { quick } = setup({ model: model({ hasMesh: false }) });
    const s = await quick.summarise(ID, quick.resolve('general'));
    expect(s).toMatchObject({ ok: true, canEnter: false, enterReason: { code: 'no_mesh' } });
  });

  it('passes a PI outage through and does not record it', async () => {
    const { quick, cacheDir } = setup({ pi: rejecting('matterport_unreachable') });
    expect(await quick.status(ID)).toMatchObject({ canEnter: false, canSummarise: false, reason: { code: 'matterport_unreachable', retry: true } });
    expect(await quick.summarise(ID, quick.resolve('general'))).toMatchObject({ ok: false, reason: { code: 'matterport_unreachable' } });
    expect(createAvailability(cacheDir).get(ID)).toBeNull();
    expect(quick.isUnusable(ID)).toBe(false);
  });

  it('records unusable models', async () => {
    const empty = [room('x', 'Room', { area: 0 })];
    const { quick, cacheDir } = setup({ model: model({ hasMesh: false, rooms: empty }) });
    expect(quick.isUnusable(ID)).toBe(false);
    expect(await quick.status(ID)).toMatchObject({ canEnter: false, canSummarise: false, reason: { code: 'no_mesh' } });
    expect(quick.isUnusable(ID)).toBe(true);
    expect(createAvailability(cacheDir).get(ID)).toEqual({ canEnter: false, canSummarise: false });
  });

  it('records a gone model, and a good one as usable', async () => {
    const gone = setup({ pi: rejecting('model_not_found') });
    expect((await gone.quick.status(ID)).reason?.code).toBe('model_not_found');
    expect(gone.quick.isUnusable(ID)).toBe(true);
    const good = setup();
    await good.quick.status(ID);
    expect(createAvailability(good.cacheDir).get(ID)).toEqual({ canEnter: true, canSummarise: true });
    expect(good.quick.isUnusable(ID)).toBe(false);
  });

  it('treats an inactive or private model as gone', async () => {
    const { quick } = setup({ model: model({ isPublic: false }) });
    expect(await quick.status(ID)).toMatchObject({ canEnter: false, canSummarise: false, reason: { code: 'model_not_found' } });
  });

  it('lists assumed heights', async () => {
    const { quick } = setup();
    const s = await quick.summarise(ID, quick.resolve('general'));
    if (!s.ok) throw new Error('expected a summary');
    expect(s.assumptions[0]).toBe('heights assumed for 2 of 3 rooms');
    expect(s.assumptions).toContain('1 small room left out');
    expect(s.rooms.find(r => r.id === 'kitchen')).toMatchObject({ heightAssumed: true, volume: 32.4 });
  });

  it('says when the surroundings are assumed', async () => {
    const { quick } = setup({ area: { ...AREA, source: 'property_type' } });
    const s = await quick.summarise(ID, quick.resolve('general'));
    if (!s.ok) throw new Error('expected a summary');
    expect(s.assumptions).toContain('surroundings assumed from the property type');
    expect(s.rooms.every(r => r.outsideDb !== null)).toBe(true);
    const vexcel = await setup().quick.summarise(ID, quick.resolve('general'));
    if (!vexcel.ok) throw new Error('expected a summary');
    expect(vexcel.assumptions).not.toContain('surroundings assumed from the property type');
  });

  it('louder surroundings mean more outside noise inside', async () => {
    const quiet = await setup({ area: { ...AREA, facadeDb: 45 } }).quick.summarise(ID, setup().quick.resolve('sleep'));
    const loud = await setup({ area: { ...AREA, facadeDb: 90 } }).quick.summarise(ID, setup().quick.resolve('sleep'));
    if (!quiet.ok || !loud.ok) throw new Error('expected summaries');
    const bedQuiet = quiet.rooms.find(r => r.id === 'bed')!;
    const bedLoud = loud.rooms.find(r => r.id === 'bed')!;
    expect(bedLoud.outsideDb! - bedQuiet.outsideDb!).toBeCloseTo(45, 0);
    expect(loud.score).toBeLessThan(quiet.score);
  });

  it('leaves outside noise out for a room without wall data', async () => {
    const rooms = [room('bed', 'Bedroom', { height: 2.5 })];
    const s = await setup({ model: model({ rooms }) }).quick.summarise(ID, setup().quick.resolve('general'));
    if (!s.ok) throw new Error('expected a summary');
    expect(s.rooms[0]).toMatchObject({ outsideDb: null, escapeDb: null });
    expect(s.rooms[0].flags).not.toContain('interior room');
  });

  it('flags an interior room and still estimates its outside noise', async () => {
    const rooms = [
      room('hall', 'Hallway', { area: 4, width: 2, depth: 2, height: 2.5, edges: box(2, 2, 4, 4) }),
      room('n', 'Bedroom', { height: 2.5, edges: box(0, 4.1, 6, 6) }),
      room('s', 'Bedroom', { height: 2.5, edges: box(0, 0, 6, 1.9) }),
      room('w', 'Closet', { area: 4, height: 2.5, edges: box(0, 2, 1.9, 4) }),
      room('e', 'Closet', { area: 4, height: 2.5, edges: box(4.1, 2, 6, 4) }),
    ];
    const s = await setup({ model: model({ rooms }) }).quick.summarise(ID, setup().quick.resolve('rehearsal'));
    if (!s.ok) throw new Error('expected a summary');
    const hall = s.rooms.find(r => r.id === 'hall')!;
    expect(hall.flags).toContain('interior room');
    expect(hall.escapeDb).toBeNull();
    expect(hall.outsideDb).not.toBeNull();
  });

  it('answers unknown_model without an index row', async () => {
    const { quick } = setup({ row: null });
    expect(await quick.summarise(ID, quick.resolve('general'))).toMatchObject({ ok: false, address: null, reason: { code: 'unknown_model' } });
  });

  it('never rejects', async () => {
    const { quick } = setup({ pi: fakePi(() => Promise.reject(new Error('boom'))) });
    expect(await quick.summarise(ID, quick.resolve('general'))).toMatchObject({ ok: false, reason: { code: 'agent_failed' } });
    expect(await quick.status(ID)).toMatchObject({ canEnter: false, canSummarise: false, reason: { code: 'agent_failed' } });
    const throwing: Surroundings = { get: () => { throw new Error('boom'); } };
    const q2 = createQuick({ cacheDir: tempDir(), env: ENV, pi: fakePi(async () => model()), surroundings: throwing, lookup: () => ROW, bundleReady: () => true });
    const s = await q2.summarise(ID, q2.resolve('general'));
    expect(s.ok).toBe(true);
    if (s.ok) {
      expect(s.area).toBeNull();
      expect(s.assumptions).toContain('surroundings unknown');
      expect(s.rooms.every(r => r.outsideDb === null)).toBe(true);
    }
  });
});

describe('createQuick status', () => {
  it('reports bundle_missing first, and still knows the summary works', async () => {
    const { quick, cacheDir } = setup({ bundle: false });
    expect(await quick.status(ID)).toEqual({ modelId: ID, name: '9117 Richland Dr', canEnter: false, canSummarise: true, reason: notPossible('bundle_missing') });
    expect((await quick.summarise(ID, quick.resolve('general'))).ok).toBe(true);
    // The server's own state is never recorded against the model.
    expect(createAvailability(cacheDir).get(ID)).toEqual({ canEnter: true, canSummarise: true });
  });

  it('reports a missing SDK key', async () => {
    const { quick } = setup({ env: { MATTERPORT_API_KEY: 'id', MATTERPORT_API_TOKEN: 'secret' } });
    expect(await quick.status(ID)).toMatchObject({ canEnter: false, canSummarise: true, reason: { code: 'server_not_configured' } });
  });

  it('answers a good house with no reason', async () => {
    expect(await setup().quick.status(ID)).toEqual({ modelId: ID, name: '9117 Richland Dr', canEnter: true, canSummarise: true, reason: null });
  });

  it('works without an index row', async () => {
    expect(await setup({ row: null }).quick.status(ID)).toMatchObject({ canEnter: true, canSummarise: true });
  });

  it('builds a real PI source from the options when none is given', async () => {
    const quick = createQuick({ cacheDir: tempDir(), env: {}, surroundings: { get: async () => AREA }, lookup: () => ROW, bundleReady: () => true });
    expect((await quick.status(ID)).reason?.code).toBe('server_not_configured');
  });
});
