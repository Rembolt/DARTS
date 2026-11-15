import { describe, expect, it } from 'vitest';
import { MATERIALS } from '../../../server/src/shared/materials';
import { allowedActions, allowedMaterials, offRows, refusal } from './permissions';
import { defaultPermissions, type Permissions } from './state';

const P = defaultPermissions();

describe('permissions', () => {
  it('allows the defaults', () => {
    expect(allowedActions(P)).toEqual(expect.arrayContaining(['set_material', 'set_furnishing', 'set_opening', 'place_speaker', 'move_speaker', 'set_speaker', 'remove_speaker', 'measure', 'compare']));
  });

  it('hides what is off by default', () => {
    expect(allowedActions(P)).toContain('move_user_to');
    expect(allowedActions(P)).not.toContain('set_mesh_layer');
    expect(refusal({ ...P, put: { ...P.put, userLocation: false } }, 'move_user_to', {})).toBe('User location');
  });

  it('lists set_mesh_layer once any layer is on', () => {
    const p = { ...P, putLayer: { type002: true, type003: false } };
    expect(allowedActions(p)).toContain('set_mesh_layer');
    expect(refusal(p, 'set_mesh_layer', { layer: 'type002' })).toBeNull();
    expect(refusal(p, 'set_mesh_layer', { layer: 'type003' })).toBe('Mesh layer: type003');
  });

  it('names the row to enable', () => {
    expect(refusal({ ...P, put: { ...P.put, windows: false } }, 'set_opening', { openingKind: 'window' })).toBe('Windows');
    expect(refusal({ ...P, put: { ...P.put, windows: false } }, 'set_opening', { openingKind: 'door' })).toBeNull();
    expect(refusal(P, 'set_mesh_layer', { layer: 'type002' })).toBe('Mesh layer: type002');
    expect(refusal({ ...P, put: { ...P.put, speakers: false } }, 'remove_speaker', {})).toBe('Speakers');
    expect(refusal({ ...P, put: { ...P.put, furnishing: false } }, 'set_furnishing', {})).toBe('Furnishing');
    expect(refusal({ ...P, get: { ...P.get, measurements: false } }, 'compare', {})).toBe('Measurements');
  });

  it('checks each material on its own', () => {
    const p = { ...P, putMaterial: { ...P.putMaterial, tile: false } };
    expect(refusal(p, 'set_material', { material: 'tile' })).toBe('Material: tile');
    expect(refusal(p, 'set_material', { material: 'carpet' })).toBeNull();
    expect(allowedMaterials(p)).not.toContain('tile');
    expect(allowedMaterials(p)).toContain('carpet');
  });

  it('refuses a material that is not in the library', () => {
    expect(refusal(P, 'set_material', { material: 'blend:house-floor' })).toBe('Material: blend:house-floor');
    expect(allowedMaterials({ ...P, putMaterial: { ...P.putMaterial, lava: true } })).not.toContain('lava');
  });

  it('needs both rows to change all openings', () => {
    const noDoors = { ...P, put: { ...P.put, doors: false } };
    const noWindows = { ...P, put: { ...P.put, windows: false } };
    const neither = { ...P, put: { ...P.put, doors: false, windows: false } };
    expect(refusal(P, 'set_opening', { openingKind: 'all' })).toBeNull();
    expect(refusal(noDoors, 'set_opening', { openingKind: 'all' })).toBe('Doors');
    expect(refusal(noWindows, 'set_opening', { openingKind: 'all' })).toBe('Windows');
    expect(refusal(neither, 'set_opening', { openingKind: 'all' })).toBe('Windows, Doors');
    expect(allowedActions(noDoors)).toContain('set_opening');
    expect(allowedActions(neither)).not.toContain('set_opening');
  });

  it('drops set_material when every material is off', () => {
    const p = { ...P, putMaterial: Object.fromEntries(Object.keys(MATERIALS).map(m => [m, false])) };
    expect(allowedActions(p)).not.toContain('set_material');
    expect(allowedMaterials(p)).toEqual([]);
  });

  it('lists the rows that are off', () => {
    const p: Permissions = {
      ...P,
      get: { ...P.get, doors: false, mesh: false },
      put: { ...P.put, speakers: false, userLocation: false },
      putMaterial: { ...P.putMaterial, tile: false },
      putLayer: { type002: false, type003: true },
    };
    expect(offRows(p)).toEqual({
      get: ['Doors', 'Mesh'],
      put: ['Speakers', 'User location', 'Material: tile', 'Mesh layer: type002'],
    });
    expect(offRows(P)).toEqual({ get: [], put: [] });
  });
});
