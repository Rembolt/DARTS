import { describe, expect, it } from 'vitest';
import { MATERIALS } from '../../../server/src/shared/materials';
import { defaultScene, normaliseScene, QUALITY, type SceneSource, type SceneState } from './state';

const ID = 'Ki9YdfpNKum';
const src = (n: number, extra: Partial<SceneSource> = {}): SceneSource => ({
  id: `speaker-${n}`, label: `Speaker ${n}`, kind: 'point', sound: 'music', position: [n, 1, 0], levelDb: 0, enabled: true, ...extra,
});
const norm = (raw: unknown) => {
  const r = normaliseScene(raw, ID);
  if ('error' in r) throw new Error(r.error);
  return r.scene;
};

describe('defaultScene', () => {
  it('uses the MVP materials, furnishing and quality', () => {
    const s = defaultScene(ID);
    expect(s.surfaces).toEqual({ wall: 'drywall', floor: 'wood_floor', ceiling: 'drywall', exteriorWall: 'drywall' });
    expect(s.furnishing).toBe(0.15);
    expect(s.quality).toBe('normal');
    expect(s.version).toBe(1);
    expect(s.modelId).toBe(ID);
    expect(s.sources).toEqual([]);
    expect(s.openings).toEqual({ loaded: false, closed: {} });
  });

  it('sets the default permissions', () => {
    const p = defaultScene('x'.repeat(11)).permissions;
    expect(p.put).toEqual({ furnishing: true, windows: true, doors: true, speakers: true, userLocation: true });
    expect(Object.values(p.get).every(Boolean)).toBe(true);
    expect(p.putMaterial.tile).toBe(true);
    expect(Object.keys(p.putMaterial)).toEqual(Object.keys(MATERIALS));
    expect(p.putLayer).toEqual({});
  });

  it('has the quality presets of spec 3.2', () => {
    expect(QUALITY).toEqual({
      fast: { raysPerTrace: 1000, bounces: 3, reverbRays: 800 },
      normal: { raysPerTrace: 2000, bounces: 4, reverbRays: 1500 },
      high: { raysPerTrace: 3000, bounces: 5, reverbRays: 3000 },
    });
  });

  it('returns a fresh object each time', () => {
    const a = defaultScene(ID);
    a.permissions.get.mesh = false;
    a.surfaces.floor = 'tile';
    expect(defaultScene(ID).permissions.get.mesh).toBe(true);
    expect(defaultScene(ID).surfaces.floor).toBe('wood_floor');
  });
});

describe('normaliseScene', () => {
  it('keeps a full valid scene exactly', () => {
    const s: SceneState = {
      ...defaultScene(ID),
      blends: { 'blend:house-floor': { parts: [{ material: 'tile', weight: 0.25 }, { material: 'carpet', weight: 0.75 }] } },
      surfaces: { wall: 'plaster', floor: 'blend:house-floor', ceiling: 'drywall', exteriorWall: 'brick_veneer' },
      roomSurfaces: { r1: { floor: 'tile' } },
      defaults: {
        source: 'table',
        rooms: [{
          roomId: 'r1', floor: { parts: [{ material: 'tile', weight: 1 }] }, wall: { parts: [{ material: 'drywall', weight: 1 }] },
          ceiling: { parts: [{ material: 'drywall', weight: 1 }] }, furnishing: 'sparse', reason: 'Kitchen.',
        }],
        exteriorWall: { parts: [{ material: 'siding_wall', weight: 1 }] }, exteriorReason: 'Typical.',
      },
      roomFurnishing: { r1: 0.08 },
      sources: [src(1), src(2, { kind: 'stereo', sound: 'train', every: [20, 60] })],
      openings: { loaded: true, closed: { w1: true } },
      meshLayers: { type002: { traced: false, shown: true } },
      quality: 'high',
      permissions: { ...defaultScene(ID).permissions, putLayer: { type002: true } },
    };
    expect(norm(JSON.parse(JSON.stringify(s)))).toEqual(s);
  });

  it('refuses a scene from another property', () => {
    expect(normaliseScene(defaultScene('aaaaaaaaaaa'), ID)).toEqual({ error: 'This scene belongs to another property (aaaaaaaaaaa).' });
  });

  it('refuses another version', () => {
    expect(normaliseScene({ ...defaultScene(ID), version: 2 }, ID)).toEqual({ error: 'This scene file has an unknown version (2).' });
  });

  it('refuses something that is not an object', () => {
    for (const raw of [null, 3, 'x', [1, 2]]) expect(normaliseScene(raw, ID)).toEqual({ error: 'This file is not a scene file.' });
  });

  it('fills missing keys and drops unknown ones', () => {
    expect(norm({ version: 1, modelId: ID, junk: 1 })).toEqual(defaultScene(ID));
  });

  it('replaces an unknown material with the class default', () => {
    const s = norm({ version: 1, modelId: ID, surfaces: { floor: 'lava', wall: 'tile', ceiling: 7 } });
    expect(s.surfaces).toEqual({ wall: 'tile', floor: 'wood_floor', ceiling: 'drywall', exteriorWall: 'drywall' });
  });

  it('keeps a blend reference only when the blend exists', () => {
    const blends = { 'blend:a': { parts: [{ material: 'tile', weight: 1 }] } };
    const s = norm({
      version: 1, modelId: ID, blends, surfaces: { floor: 'blend:a', wall: 'blend:missing' },
      roomSurfaces: { r1: { floor: 'blend:missing', wall: 'blend:a' }, r2: 'x' },
    });
    expect(s.surfaces.floor).toBe('blend:a');
    expect(s.surfaces.wall).toBe('drywall');
    expect(s.roomSurfaces).toEqual({ r1: { wall: 'blend:a' } });
  });

  it('drops a blend with an unknown material or a bad name', () => {
    const s = norm({
      version: 1, modelId: ID,
      blends: { 'blend:a': { parts: [{ material: 'lava', weight: 1 }] }, b: { parts: [{ material: 'tile', weight: 1 }] }, 'blend:c': { parts: [] } },
    });
    expect(s.blends).toEqual({});
  });

  it('clamps numbers and caps sources at six', () => {
    const sources = [src(1, { levelDb: 40 }), src(2, { levelDb: -99 }), src(3), src(4), src(5), src(6), src(7)];
    const s = norm({ version: 1, modelId: ID, furnishing: 3, roomFurnishing: { r1: -1, r2: 'x' }, sources });
    expect(s.furnishing).toBe(0.5);
    expect(s.roomFurnishing).toEqual({ r1: 0 });
    expect(s.sources).toHaveLength(6);
    expect(s.sources[0].levelDb).toBe(6);
    expect(s.sources[1].levelDb).toBe(-30);
  });

  it('drops sources without a valid position or kind, and repeated ids', () => {
    const sources = [
      src(1, { position: [1, 2] as never }), src(2, { position: [0, NaN, 0] }), src(3, { kind: 'laser' as never }), src(4), src(4),
    ];
    expect(norm({ version: 1, modelId: ID, sources }).sources).toEqual([src(4)]);
  });

  it('defaults bad permissions and a bad quality', () => {
    const s = norm({
      version: 1, modelId: ID, quality: 'ultra',
      permissions: { get: { mesh: false, doors: 'no' }, put: { userLocation: true }, putMaterial: { tile: false, lava: true }, putLayer: { type002: true, x: 1 } },
    });
    expect(s.quality).toBe('normal');
    expect(s.permissions.get.mesh).toBe(false);
    expect(s.permissions.get.doors).toBe(true);
    expect(s.permissions.put.userLocation).toBe(true);
    expect(s.permissions.put.speakers).toBe(true);
    expect(s.permissions.putMaterial.tile).toBe(false);
    expect(s.permissions.putMaterial.carpet).toBe(true);
    expect('lava' in s.permissions.putMaterial).toBe(false);
    expect(s.permissions.putLayer).toEqual({ type002: true });
  });

  it('refuses inherited keys and __proto__', () => {
    const room = { roomId: 'r1', floor: { parts: [{ material: 'tile', weight: 1 }] }, wall: { parts: [{ material: 'drywall', weight: 1 }] }, ceiling: { parts: [{ material: 'drywall', weight: 1 }] }, reason: 'x' };
    const text = JSON.stringify({
      version: 1, modelId: ID, quality: 'toString',
      defaults: { source: 'table', rooms: [{ ...room, furnishing: 'constructor' }, { ...room, roomId: 'r2', furnishing: 'sparse' }], exteriorWall: { parts: [{ material: 'siding_wall', weight: 1 }] }, exteriorReason: 'y' },
      surfaces: { floor: 'toString' },
    }).replace('"surfaces":', '"roomSurfaces":{"__proto__":{"floor":"tile"}},"meshLayers":{"__proto__":{"traced":false}},"surfaces":');
    const s = norm(JSON.parse(text));
    expect(s.quality).toBe('normal');
    expect(s.defaults?.rooms.map(r => r.roomId)).toEqual(['r2']);
    expect(s.surfaces.floor).toBe('wood_floor');
    expect(Object.keys(s.roomSurfaces)).toEqual([]);
    expect(Object.getPrototypeOf(s.roomSurfaces)).toBe(Object.prototype);
    expect(Object.getPrototypeOf(s.meshLayers)).toBe(Object.prototype);
  });

  it('drops malformed defaults', () => {
    expect(norm({ version: 1, modelId: ID, defaults: { source: 'llm', rooms: 'x' } }).defaults).toBeNull();
  });
});
