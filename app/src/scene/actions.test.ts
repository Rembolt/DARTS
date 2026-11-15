import { describe, expect, it } from 'vitest';
import { createActions, type Measurement, type OpeningInfo, type RoomInfo, type SceneEffects } from './actions';
import { defaultScene, type MaterialDefaults, type SceneSource, type SceneState } from './state';
import { createStore } from './store';

const ID = 'Ki9YdfpNKum';
const SOUNDS = { music: { kind: 'point' as const, levelDb: 0 }, highway: { kind: 'ambient' as const, levelDb: -12 }, train: { kind: 'stereo' as const, levelDb: -10 } };
const ROOMS: RoomInfo[] = [
  { id: 'kitchen', name: 'Kitchen', floor: '1', area: 10, centre: [1, 0, 2] },
  { id: 'bedroom', name: 'Bedroom', floor: '1', area: 30, centre: [5, 0, 5] },
  { id: 'attic', name: 'Attic', floor: '2', area: 0, centre: null },
];
const OPENINGS: OpeningInfo[] = [
  { id: 'w1', kind: 'window', roomId: 'kitchen', roomName: 'Kitchen', width: 1, height: 1.2, meshClosed: false },
  { id: 'w2', kind: 'window', roomId: 'kitchen', roomName: 'Kitchen', width: 1, height: 1.2, meshClosed: true },
  { id: 'w3', kind: 'window', roomId: 'bedroom', roomName: 'Bedroom', width: 1, height: 1.2, meshClosed: false },
  { id: 'd1', kind: 'door', roomId: 'kitchen', roomName: 'Kitchen', width: 0.9, height: 2, meshClosed: false },
  { id: 'g1', kind: 'opening', roomId: 'kitchen', roomName: 'Kitchen', width: 2, height: 2.4, meshClosed: false },
];
const BEFORE: Measurement = { roomId: 'kitchen', echoTime: [0.9, 0.8, 0.7], sources: [{ id: 'a', levelDb: [-10, -12, -20], walls: 1 }], estimated: false };
const AFTER: Measurement = { roomId: 'kitchen', echoTime: [0.6, 0.5, 0.5], sources: [{ id: 'a', levelDb: [-13, -15, -26], walls: 1 }], estimated: true };
const DEFAULTS: MaterialDefaults = {
  source: 'table',
  rooms: [
    { roomId: 'kitchen', floor: { parts: [{ material: 'tile', weight: 1 }] }, wall: { parts: [{ material: 'drywall', weight: 1 }] }, ceiling: { parts: [{ material: 'drywall', weight: 1 }] }, furnishing: 'sparse', reason: 'Kitchen.' },
    { roomId: 'bedroom', floor: { parts: [{ material: 'carpet', weight: 1 }] }, wall: { parts: [{ material: 'drywall', weight: 1 }] }, ceiling: { parts: [{ material: 'drywall', weight: 1 }] }, furnishing: 'furnished', reason: 'Bedroom.' },
  ],
  exteriorWall: { parts: [{ material: 'brick_veneer', weight: 1 }] }, exteriorReason: 'Brick.',
};
const speaker = (n: number): SceneSource => ({ id: `speaker-${n}`, label: `Speaker ${n}`, kind: 'point', sound: 'music', position: [n, 1, 0], levelDb: 0, enabled: true });

/** A recording fake: logs only the effects that do work; the read-only ones are not logged. */
function setup(opts: { tagged?: boolean; scene?: Partial<SceneState>; measure?: () => Promise<Measurement> } = {}) {
  const calls: string[] = [];
  const seen: { openingsLoaded: boolean[]; measureAt: unknown[]; moved: string[] } = { openingsLoaded: [], measureAt: [], moved: [] };
  let layerLoaded = false;
  const effects: SceneEffects = {
    materialsChanged: () => { calls.push('materialsChanged'); },
    qualityChanged: () => { calls.push('qualityChanged'); },
    openingsChanged: async s => { calls.push('openingsChanged'); seen.openingsLoaded.push(s.openings.loaded); if (s.openings.loaded) layerLoaded = true; },
    layersChanged: () => { calls.push('layersChanged'); },
    sourcesChanged: async () => { calls.push('sourcesChanged'); },
    clearReverb: () => { calls.push('clearReverb'); },
    retrace: () => { calls.push('retrace'); },
    moveUserTo: async id => { calls.push('moveUserTo'); seen.moved.push(id); },
    measure: async at => { calls.push('measure'); seen.measureAt.push(at); return opts.measure ? opts.measure() : AFTER; },
    current: () => BEFORE,
    rooms: () => ROOMS,
    openings: () => (layerLoaded ? OPENINGS : []),
    layers: () => [{ id: 'house', triangles: 13803 }, { id: 'type002', triangles: 86901 }],
    roomsTagged: () => opts.tagged ?? false,
    listener: () => ({ position: [0, 1.5, 0], roomId: 'kitchen' }),
  };
  const saved: SceneState[] = [];
  const store = createStore({ ...defaultScene(ID), ...opts.scene }, s => saved.push(s));
  const actions = createActions(store, effects, SOUNDS);
  return { calls, seen, store, actions, saved };
}

describe('store', () => {
  it('notifies subscribers with what changed, autosaves, and unsubscribes', () => {
    const { store, saved } = setup();
    const got: string[][] = [];
    const off = store.subscribe((_s, changed) => got.push(changed));
    const next = { ...store.get(), quality: 'fast' as const };
    store.set(next, ['quality']);
    expect(store.get()).toBe(next);
    expect(got).toEqual([['quality']]);
    expect(saved).toEqual([next]);
    off();
    store.set({ ...next, quality: 'high' }, ['quality']);
    expect(got).toHaveLength(1);
  });
});

describe('setMaterial', () => {
  it('changes a house surface, clears the reverb and retraces once', async () => {
    const { calls, store, actions } = setup();
    const r = await actions.setMaterial({ target: 'floor', material: 'tile' });
    expect(r.ok).toBe(true);
    expect(calls).toEqual(['materialsChanged', 'clearReverb', 'retrace', 'measure']);
    expect(store.get().surfaces.floor).toBe('tile');
  });

  it('returns before and after measurements', async () => {
    const { actions, seen } = setup();
    expect(await actions.setMaterial({ target: 'wall', material: 'plaster' })).toEqual({ ok: true, value: { target: 'wall', material: 'plaster' }, before: BEFORE, after: AFTER });
    expect(seen.measureAt).toEqual([{}]);
  });

  it('notifies subscribers with what changed', async () => {
    const { store, actions } = setup();
    const got: string[][] = [];
    store.subscribe((_s, changed) => got.push(changed));
    await actions.setMaterial({ target: 'floor', material: 'tile' });
    expect(got).toEqual([['surfaces']]);
  });

  it('refuses a room material until rooms are tagged', async () => {
    const { calls, actions } = setup();
    expect(await actions.setMaterial({ target: 'floor', room: 'kitchen', material: 'tile' })).toEqual({ ok: false, error: 'Per-room materials are not available yet for this property.' });
    expect(calls).toEqual([]);
  });

  it('sets a room material once rooms are tagged, by id or by name', async () => {
    const { store, actions } = setup({ tagged: true });
    expect((await actions.setMaterial({ target: 'floor', room: 'Kitchen', material: 'carpet' })).ok).toBe(true);
    expect(store.get().roomSurfaces.kitchen).toEqual({ floor: 'carpet' });
  });

  it('refuses an exterior wall for one room', async () => {
    const { actions } = setup({ tagged: true });
    const r = await actions.setMaterial({ target: 'exteriorWall', room: 'kitchen', material: 'brick_veneer' });
    expect(r.ok).toBe(false);
  });

  it('refuses an unknown material and changes nothing', async () => {
    const { calls, store, actions } = setup();
    const before = store.get();
    expect(await actions.setMaterial({ target: 'floor', material: 'lava' })).toEqual({ ok: false, error: 'Unknown material: lava.' });
    expect(await actions.setMaterial({ target: 'floor', material: 'blend:house-floor' })).toEqual({ ok: false, error: 'Unknown material: blend:house-floor.' });
    expect(await actions.setMaterial({ target: 'roof' as never, material: 'tile' })).toEqual({ ok: false, error: 'Unknown surface: roof.' });
    expect(store.get()).toBe(before);
    expect(calls).toEqual([]);
  });

  it('refuses an unknown room', async () => {
    const { actions } = setup({ tagged: true });
    expect(await actions.setMaterial({ target: 'floor', room: 'garage', material: 'tile' })).toEqual({ ok: false, error: 'Unknown room: garage.' });
  });

  it('survives a measure that rejects', async () => {
    const { actions } = setup({ measure: () => Promise.reject(new Error('worker gone')) });
    const r = await actions.setMaterial({ target: 'floor', material: 'tile' });
    expect(r).toMatchObject({ ok: true, before: BEFORE, after: null });
  });
});

describe('setFurnishing', () => {
  it('sets the house furnishing from the level', async () => {
    const { calls, store, actions } = setup();
    expect((await actions.setFurnishing({ level: 'studio' })).ok).toBe(true);
    expect(store.get().furnishing).toBe(0.3);
    expect(calls).toEqual(['materialsChanged', 'clearReverb', 'retrace', 'measure']);
  });

  it('sets a room furnishing only once rooms are tagged', async () => {
    expect((await setup().actions.setFurnishing({ level: 'empty', room: 'kitchen' })).ok).toBe(false);
    const { store, actions } = setup({ tagged: true });
    await actions.setFurnishing({ level: 'empty', room: 'kitchen' });
    expect(store.get().roomFurnishing).toEqual({ kitchen: 0 });
  });

  it('refuses an unknown level', async () => {
    expect(await setup().actions.setFurnishing({ level: 'cosy' as never })).toEqual({ ok: false, error: 'Unknown furnishing level: cosy.' });
  });
});

describe('speakers', () => {
  it('places a speaker at a room centre, 1 m up', async () => {
    const { calls, store, actions } = setup();
    const r = await actions.placeSpeaker({ room: 'kitchen', sound: 'highway' });
    expect(r).toMatchObject({ ok: true, value: { id: 'speaker-1' }, before: BEFORE, after: AFTER });
    expect(store.get().sources).toEqual([{ id: 'speaker-1', label: 'Speaker 1 (highway)', kind: 'ambient', sound: 'highway', position: [1, 1, 2], levelDb: -12, enabled: true }]);
    expect(calls).toEqual(['sourcesChanged', 'retrace', 'measure']);
  });

  it('places a speaker at a point, with a clamped level', async () => {
    const { store, actions } = setup();
    await actions.placeSpeaker({ point: [3, 1, 3], sound: 'music', levelDb: 20 });
    expect(store.get().sources[0]).toMatchObject({ position: [3, 1, 3], levelDb: 6, kind: 'point' });
  });

  it('refuses a room without a centre, an unknown sound, and no place at all', async () => {
    const { calls, actions } = setup();
    expect(await actions.placeSpeaker({ room: 'attic', sound: 'music' })).toEqual({ ok: false, error: "I can't place a speaker in that room yet." });
    expect(await actions.placeSpeaker({ room: 'kitchen', sound: 'kazoo' })).toEqual({ ok: false, error: 'Unknown sound: kazoo.' });
    expect((await actions.placeSpeaker({ sound: 'music' })).ok).toBe(false);
    expect((await actions.placeSpeaker({ point: [0, NaN, 0], sound: 'music' })).ok).toBe(false);
    expect(calls).toEqual([]);
  });

  it('refuses a seventh source', async () => {
    const { calls, actions } = setup({ scene: { sources: [1, 2, 3, 4, 5, 6].map(speaker) } });
    expect(await actions.placeSpeaker({ room: 'kitchen', sound: 'music' })).toEqual({ ok: false, error: 'At most 6 sources.' });
    expect(calls).toEqual([]);
  });

  it('never reuses an id after a removal', async () => {
    const { store, actions } = setup({ scene: { sources: [speaker(1), speaker(3)] } });
    expect(await actions.placeSpeaker({ room: 'kitchen', sound: 'music' })).toMatchObject({ value: { id: 'speaker-4' } });
    expect(store.get().sources.map(s => s.id)).toEqual(['speaker-1', 'speaker-3', 'speaker-4']);
  });

  it('moves, changes and removes a speaker', async () => {
    const { store, actions } = setup({ scene: { sources: [speaker(1)] } });
    await actions.moveSpeaker({ id: 'speaker-1', room: 'bedroom' });
    expect(store.get().sources[0].position).toEqual([5, 1, 5]);
    await actions.setSpeaker({ id: 'speaker-1', levelDb: -40, enabled: false, sound: 'train' });
    expect(store.get().sources[0]).toMatchObject({ levelDb: -30, enabled: false, sound: 'train', kind: 'stereo' });
    expect((await actions.removeSpeaker({ id: 'speaker-1' })).ok).toBe(true);
    expect(store.get().sources).toEqual([]);
  });

  it('turns a tour source off but never removes it', async () => {
    const tourSource: SceneSource = { ...speaker(0), id: 'highway', sound: 'highway', kind: 'ambient' };
    const { calls, store, actions } = setup({ scene: { sources: [tourSource] } });
    expect(await actions.removeSpeaker({ id: 'highway' })).toEqual({ ok: false, error: 'highway is one of the property\'s own sources: turn it off instead of removing it.' });
    expect(calls).toEqual([]);
    await actions.setSpeaker({ id: 'highway', enabled: false });
    expect(store.get().sources).toEqual([{ ...tourSource, enabled: false }]);
  });

  it('refuses an unknown speaker id', async () => {
    const { calls, actions } = setup();
    expect(await actions.moveSpeaker({ id: 'speaker-9', point: [0, 0, 0] })).toEqual({ ok: false, error: 'Unknown speaker: speaker-9.' });
    expect(await actions.setSpeaker({ id: 'speaker-9', levelDb: 0 })).toEqual({ ok: false, error: 'Unknown speaker: speaker-9.' });
    expect(await actions.removeSpeaker({ id: 'speaker-9' })).toEqual({ ok: false, error: 'Unknown speaker: speaker-9.' });
    expect(calls).toEqual([]);
  });
});

describe('setOpening', () => {
  it('closes all windows in a room and loads the layer first', async () => {
    const { calls, seen, store, actions } = setup();
    const r = await actions.setOpening({ room: 'kitchen', type: 'window', state: 'closed' });
    expect(r).toMatchObject({ ok: true, value: { changed: ['w1', 'w2'] }, before: BEFORE, after: AFTER });
    expect(seen.openingsLoaded).toEqual([true, true]);
    expect(store.get().openings).toEqual({ loaded: true, closed: { w1: true, w2: true } });
    expect(calls).toEqual(['openingsChanged', 'openingsChanged', 'clearReverb', 'retrace', 'measure']);
  });

  it('closes every window and door of a room with all, skipping gaps', async () => {
    const { calls, store, actions } = setup();
    await actions.setOpening({ room: 'kitchen', type: 'window', state: 'closed' });
    calls.length = 0;
    const r = await actions.setOpening({ room: 'kitchen', type: 'all', state: 'closed' });
    expect(r).toMatchObject({ ok: true, value: { changed: ['d1'] } }); // w1 was already closed
    expect(calls[0]).toBe('openingsChanged'); // loaded already: no second load
    expect(calls.filter(c => c === 'openingsChanged')).toHaveLength(1);
    expect(store.get().openings.closed).toEqual({ w1: true, w2: true, d1: true });
  });

  it('opens one opening by id', async () => {
    const { store, actions } = setup();
    await actions.setOpening({ id: 'w3', state: 'closed' });
    const r = await actions.setOpening({ id: 'w3', state: 'open' });
    expect(r).toMatchObject({ ok: true, value: { changed: ['w3'] } });
    expect(store.get().openings.closed).toEqual({});
  });

  it('refuses an unknown opening and a gap; one closed in the scan can still be changed (the page trims its sound)', async () => {
    const { actions } = setup();
    expect(await actions.setOpening({ id: 'x9', state: 'closed' })).toEqual({ ok: false, error: 'Unknown opening: x9.' });
    expect((await actions.setOpening({ id: 'g1', state: 'closed' })).ok).toBe(false);
    expect((await actions.setOpening({ id: 'w2', state: 'closed' })).ok).toBe(true);
    expect(await actions.setOpening({ room: 'garage', type: 'door', state: 'closed' })).toEqual({ ok: false, error: 'Unknown room: garage.' });
    expect(await actions.setOpening({ room: 'bedroom', type: 'door', state: 'closed' })).toEqual({ ok: false, error: 'No doors to change in Bedroom.' });
  });
});

describe('other actions', () => {
  it('warns when hiding a layer', async () => {
    const { calls, store, actions } = setup();
    const r = await actions.setMeshLayer({ layer: 'type002', traced: false });
    expect(r).toMatchObject({ ok: true, value: { warning: 'Layer names are guesses from height; hiding one may remove walls.' } });
    expect(store.get().meshLayers).toEqual({ type002: { traced: false, shown: true } });
    expect(calls).toEqual(['layersChanged', 'clearReverb', 'retrace', 'measure']);
    expect(await actions.setMeshLayer({ layer: 'type999', traced: false })).toEqual({ ok: false, error: 'Unknown mesh layer: type999.' });
  });

  it('moves the user to a room', async () => {
    const { seen, actions } = setup();
    expect((await actions.moveUserTo({ room: 'Bedroom' })).ok).toBe(true);
    expect(seen.moved).toEqual(['bedroom']);
  });

  it('measures at a room', async () => {
    const { seen, actions } = setup();
    expect(await actions.measure({ room: 'kitchen' })).toEqual({ ok: true, value: AFTER, before: BEFORE, after: AFTER });
    expect(seen.measureAt).toEqual([{ roomId: 'kitchen' }]);
    const failing = setup({ measure: () => Promise.reject(new Error('busy')) });
    expect(await failing.actions.measure({})).toEqual({ ok: false, error: 'The measurement failed: busy' });
  });

  it('compares without simulating', () => {
    const { calls, actions } = setup();
    const r = actions.compare({ before: BEFORE, after: AFTER });
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    r.value.echoTimeDelta.forEach((d, i) => expect(d).toBeCloseTo([-0.3, -0.3, -0.2][i], 10));
    expect(r.value.sources).toEqual([{ id: 'a', levelDeltaDb: [-3, -3, -6] }]);
    expect(calls).toEqual([]);
  });

  it('sets quality and permissions', () => {
    const { calls, store, actions } = setup();
    actions.setQuality('high');
    expect(store.get().quality).toBe('high');
    expect(calls).toEqual(['qualityChanged', 'clearReverb', 'retrace']);
    const p = { ...store.get().permissions, put: { ...store.get().permissions.put, windows: false } };
    actions.setPermissions(p);
    expect(store.get().permissions).toEqual(p);
    expect(calls).toHaveLength(3);
  });
});

describe('defaults, scenes and reset', () => {
  it('applies defaults house-wide before rooms are tagged', () => {
    const { calls, store, actions } = setup();
    actions.applyDefaults(DEFAULTS);
    expect(store.get().surfaces.floor).toBe('blend:house-floor');
    expect(store.get().defaults).toEqual(DEFAULTS);
    expect(calls).toEqual(['materialsChanged', 'clearReverb', 'retrace']);
  });

  it('resets a room to its suggested values', async () => {
    const { store, actions } = setup({ tagged: true });
    actions.applyDefaults(DEFAULTS);
    await actions.setMaterial({ target: 'floor', room: 'kitchen', material: 'carpet' });
    await actions.setMaterial({ target: 'floor', room: 'bedroom', material: 'tile' });
    await actions.setMaterial({ target: 'exteriorWall', material: 'siding_wall' });
    actions.resetToSuggested('kitchen');
    expect(store.get().roomSurfaces.kitchen.floor).toBe('tile');
    expect(store.get().roomSurfaces.bedroom.floor).toBe('tile');
    expect(store.get().surfaces.exteriorWall).toBe('siding_wall');
    actions.resetToSuggested();
    expect(store.get().roomSurfaces.bedroom.floor).toBe('carpet');
    expect(store.get().surfaces.exteriorWall).toBe('brick_veneer');
  });

  it('loads a scene: every effect once, then one retrace', async () => {
    const { calls, store, actions } = setup();
    const scene = { ...defaultScene(ID), quality: 'fast' as const };
    await actions.loadScene(scene);
    expect(store.get()).toEqual(scene);
    expect(calls.slice(-1)).toEqual(['retrace']);
    expect([...calls].sort()).toEqual(['clearReverb', 'layersChanged', 'materialsChanged', 'openingsChanged', 'qualityChanged', 'retrace', 'sourcesChanged']);
  });

  it('resets to the defaults, keeps tour sources and permissions, and reapplies the suggestion', async () => {
    const tourSource: SceneSource = { ...speaker(0), id: 'highway', sound: 'highway', kind: 'ambient' };
    const { store, actions } = setup({ scene: { sources: [tourSource, speaker(1)], furnishing: 0.3 } });
    actions.applyDefaults(DEFAULTS);
    const p = { ...store.get().permissions, put: { ...store.get().permissions.put, windows: false } };
    actions.setPermissions(p);
    await actions.reset();
    const s = store.get();
    expect(s.furnishing).toBe(0.15);
    expect(s.sources).toEqual([tourSource]);
    expect(s.permissions).toEqual(p);
    expect(s.defaults).toEqual(DEFAULTS);
    expect(s.surfaces.floor).toBe('blend:house-floor');
  });
});
