import { describe, expect, it } from 'vitest';
import { MATERIALS } from '../../../server/src/shared/materials';
import { applyDefaults, cleanBlend, effectiveAbsorption, isSuggested, materialList, resolveBlend, setMaterialsMessage } from './materials';
import type { Material } from '../sim/types';
import { defaultScene, type Blend, type MaterialDefaults, type SceneState } from './state';

const ID = 'Ki9YdfpNKum';
const one = (material: Blend['parts'][number]['material']): Blend => ({ parts: [{ material, weight: 1 }] });
const lib = (name: keyof typeof MATERIALS): Material => {
  const m = MATERIALS[name];
  return { absorption: [...m.absorption], scattering: m.scattering, blockingDb: [...m.blockingDb] };
};

const DEFAULTS: MaterialDefaults = {
  source: 'table',
  rooms: [
    { roomId: 'kitchen', floor: one('tile'), wall: one('drywall'), ceiling: one('drywall'), furnishing: 'sparse', reason: 'Kitchens usually have tile.' },
    { roomId: 'bedroom', floor: one('carpet'), wall: one('drywall'), ceiling: one('drywall'), furnishing: 'furnished', reason: 'Bedrooms usually have carpet.' },
  ],
  exteriorWall: one('brick_veneer'), exteriorReason: 'The listing says Brick Exterior Construction.',
};
const ROOMS = [{ id: 'kitchen', area: 10 }, { id: 'bedroom', area: 30 }];

describe('resolveBlend', () => {
  it('averages absorption by weight', () => {
    expect(resolveBlend({ parts: [{ material: 'wood_floor', weight: 0.7 }, { material: 'carpet', weight: 0.3 }] }).absorption[1]).toBeCloseTo(0.177, 5); // 0.7 · 0.09 + 0.3 · 0.38
  });

  it('averages scattering by weight', () => {
    expect(resolveBlend({ parts: [{ material: 'wood_floor', weight: 0.7 }, { material: 'carpet', weight: 0.3 }] }).scattering).toBeCloseTo(0.23, 5);
  });

  it('averages blocking as energy, so the weak part dominates', () => {
    // glass 32 dB, concrete 52 dB at mid
    expect(resolveBlend({ parts: [{ material: 'glass', weight: 0.4 }, { material: 'concrete', weight: 0.6 }] }).blockingDb[1]).toBeCloseTo(35.91, 1);
  });

  it('drops parts under 0.1 and renormalises', () => {
    expect(resolveBlend({ parts: [{ material: 'tile', weight: 0.95 }, { material: 'carpet', weight: 0.05 }] })).toEqual(lib('tile'));
  });

  it('gives a plain material its library values', () => expect(resolveBlend(one('carpet'))).toEqual(lib('carpet')));

  it('falls back to drywall for an empty blend', () => expect(resolveBlend({ parts: [] })).toEqual(lib('drywall')));
});

describe('cleanBlend', () => {
  it('keeps at most 3 parts, the heaviest, merges repeats and normalises', () => {
    const b = cleanBlend({
      parts: [
        { material: 'tile', weight: 2 }, { material: 'carpet', weight: 3 }, { material: 'tile', weight: 2 },
        { material: 'vinyl', weight: 2 }, { material: 'concrete', weight: 1.5 }, { material: 'lava' as never, weight: 5 },
      ],
    });
    expect(b.parts.map(p => p.material)).toEqual(['tile', 'carpet', 'vinyl']);
    expect(b.parts.reduce((t, p) => t + p.weight, 0)).toBeCloseTo(1, 10);
    expect(b.parts[0].weight).toBeCloseTo(4 / 9, 10);
  });

  it('returns no parts when nothing valid is left', () => {
    expect(cleanBlend({ parts: [{ material: 'lava' as never, weight: 1 }, { material: 'tile', weight: 0 }] })).toEqual({ parts: [] });
  });
});

describe('effectiveAbsorption', () => {
  it('clamps absorption plus furnishing to 0.99, not a perfect absorber', () => {
    const a = effectiveAbsorption(lib('acoustic_panel'), 0.15);
    expect(a[2]).toBe(0.99);
    expect(a[0]).toBeCloseTo(0.5, 10);
  });
});

describe('materialList and setMaterialsMessage', () => {
  const withBlends = (): SceneState => ({
    ...defaultScene(ID),
    blends: { 'blend:z': one('tile'), 'blend:a': one('carpet') },
  });

  it('lists the library first, then blends by name', () => {
    const { names, materials } = materialList(withBlends());
    const keys = Object.keys(MATERIALS);
    expect(names.slice(0, keys.length)).toEqual(keys);
    expect(names[0]).toBe(keys[0]);
    expect(names.slice(keys.length)).toEqual(['blend:a', 'blend:z']);
    expect(materials).toHaveLength(keys.length + 2);
    expect(materials[keys.length]).toEqual(lib('carpet'));
  });

  it('builds surface indices into that list', () => {
    const s: SceneState = { ...withBlends(), surfaces: { wall: 'plaster', floor: 'tile', ceiling: 'blend:a', exteriorWall: 'brick_veneer' } };
    const msg = setMaterialsMessage(s, false);
    const { names } = materialList(s);
    expect(msg.type).toBe('setMaterials');
    expect(msg.surfaces).toEqual([names.indexOf('plaster'), names.indexOf('tile'), names.indexOf('blend:a'), names.indexOf('brick_veneer')]);
    expect(msg.library).toEqual(materialList(s).materials);
    expect(msg.furnishing).toBe(0.15);
  });

  it('never adds the furnishing into the library values', () => {
    const s: SceneState = { ...defaultScene(ID), furnishing: 0.3, surfaces: { ...defaultScene(ID).surfaces, wall: 'acoustic_panel' } };
    const msg = setMaterialsMessage(s, false);
    expect(msg.library[msg.surfaces[0]]).toEqual(lib('acoustic_panel'));
    expect(msg.furnishing).toBe(0.3);
  });

  it('leaves room data out until rooms are tagged', () => {
    const s: SceneState = { ...defaultScene(ID), roomSurfaces: { r1: { floor: 'tile' } }, roomFurnishing: { r1: 0.3 } };
    const msg = setMaterialsMessage(s, false);
    expect(msg.roomSurfaces).toBeUndefined();
    expect(msg.roomFurnishing).toBeUndefined();
  });

  it('sends room data once rooms are tagged, with house values for missing classes', () => {
    const s: SceneState = { ...defaultScene(ID), roomSurfaces: { r1: { floor: 'tile' } }, roomFurnishing: { r1: 0.3 } };
    const { names } = materialList(s);
    const msg = setMaterialsMessage(s, true);
    expect(msg.roomSurfaces).toEqual([{ roomId: 'r1', surfaces: [names.indexOf('drywall'), names.indexOf('tile'), names.indexOf('drywall')] }]);
    expect(msg.roomFurnishing).toEqual([{ roomId: 'r1', value: 0.3 }]);
  });
});

describe('applyDefaults', () => {
  it('blends the house floor from the rooms by area', () => {
    const s = applyDefaults(defaultScene(ID), DEFAULTS, ROOMS, false);
    expect(s.surfaces.floor).toBe('blend:house-floor');
    const parts = s.blends['blend:house-floor'].parts;
    expect(parts.find(p => p.material === 'tile')?.weight).toBeCloseTo(0.25, 10);
    expect(parts.find(p => p.material === 'carpet')?.weight).toBeCloseTo(0.75, 10);
    expect(s.defaults).toBe(DEFAULTS);
    expect(s.surfaces.exteriorWall).toBe('drywall');
    expect(s.furnishing).toBe(0.15);
  });

  it('counts a room without an area as the median', () => {
    const d: MaterialDefaults = {
      ...DEFAULTS,
      rooms: [...DEFAULTS.rooms, { roomId: 'den', floor: one('vinyl'), wall: one('drywall'), ceiling: one('drywall'), furnishing: 'empty', reason: 'x' }],
    };
    // areas 10, 30 and 20; the den has no area (0), so it counts as the median of 10, 20, 30... here 20 from the room list
    const s = applyDefaults(defaultScene(ID), d, [{ id: 'kitchen', area: 10 }, { id: 'bedroom', area: 30 }, { id: 'hall', area: 20 }, { id: 'den', area: 0 }], false);
    const parts = s.blends['blend:house-floor'].parts;
    expect(parts.find(p => p.material === 'vinyl')?.weight).toBeCloseTo(20 / 60, 10);
    // a room missing from the list counts as the median too
    const s2 = applyDefaults(defaultScene(ID), d, ROOMS, false);
    expect(s2.blends['blend:house-floor'].parts.find(p => p.material === 'vinyl')?.weight).toBeCloseTo(20 / 60, 10);
  });

  it('stores a single-material default as that material', () => {
    const s = applyDefaults(defaultScene(ID), DEFAULTS, ROOMS, false);
    expect(s.surfaces.wall).toBe('drywall');
    expect(s.blends['blend:house-wall']).toBeUndefined();
    const r = applyDefaults(defaultScene(ID), DEFAULTS, ROOMS, true);
    expect(r.roomSurfaces.kitchen).toEqual({ floor: 'tile', wall: 'drywall', ceiling: 'drywall' });
    expect(r.surfaces.exteriorWall).toBe('brick_veneer');
  });

  it('applies per room when rooms are tagged', () => {
    const d: MaterialDefaults = {
      ...DEFAULTS,
      rooms: [{ ...DEFAULTS.rooms[0], floor: { parts: [{ material: 'wood_floor', weight: 0.7 }, { material: 'carpet', weight: 0.3 }] } }],
      exteriorWall: { parts: [{ material: 'brick_veneer', weight: 0.6 }, { material: 'glass', weight: 0.4 }] },
    };
    const s = applyDefaults(defaultScene(ID), d, ROOMS, true);
    expect(s.roomSurfaces.kitchen.floor).toBe('blend:kitchen-floor');
    expect(s.blends['blend:kitchen-floor']).toEqual(d.rooms[0].floor);
    expect(s.roomFurnishing.kitchen).toBe(0.08);
    expect(s.surfaces.exteriorWall).toBe('blend:exterior');
    expect(s.surfaces.floor).toBe('wood_floor');
  });

  it('drops blends that nothing uses any more', () => {
    const start: SceneState = { ...defaultScene(ID), blends: { 'blend:old': one('tile') } };
    expect(applyDefaults(start, DEFAULTS, ROOMS, false).blends).toEqual({ 'blend:house-floor': expect.anything() });
  });

  it('does not change the scene it was given', () => {
    const start = defaultScene(ID);
    applyDefaults(start, DEFAULTS, ROOMS, true);
    expect(start).toEqual(defaultScene(ID));
  });
});

describe('isSuggested', () => {
  it('says a surface is suggested until it is changed', () => {
    const s = applyDefaults(defaultScene(ID), DEFAULTS, ROOMS, true);
    expect(isSuggested(s, 'floor', 'kitchen')).toEqual({ suggested: true, reason: 'Kitchens usually have tile.' });
    expect(isSuggested(s, 'exteriorWall')).toEqual({ suggested: true, reason: 'The listing says Brick Exterior Construction.' });
    const changed: SceneState = { ...s, roomSurfaces: { ...s.roomSurfaces, kitchen: { ...s.roomSurfaces.kitchen, floor: 'carpet' } } };
    expect(isSuggested(changed, 'floor', 'kitchen')).toEqual({ suggested: false, reason: null });
  });

  it('tracks the house-wide blend', () => {
    const s = applyDefaults(defaultScene(ID), DEFAULTS, ROOMS, false);
    const r = isSuggested(s, 'floor');
    expect(r.suggested).toBe(true);
    expect(r.reason).toMatch(/weighted by floor area/);
    expect(isSuggested(s, 'wall').suggested).toBe(true);
    expect(isSuggested({ ...s, surfaces: { ...s.surfaces, floor: 'tile' } }, 'floor')).toEqual({ suggested: false, reason: null });
  });

  it('is never suggested without defaults', () => {
    expect(isSuggested(defaultScene(ID), 'floor')).toEqual({ suggested: false, reason: null });
    const s = applyDefaults(defaultScene(ID), DEFAULTS, ROOMS, true);
    expect(isSuggested(s, 'floor', 'nowhere')).toEqual({ suggested: false, reason: null });
  });
});
