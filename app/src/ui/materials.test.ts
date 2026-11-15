import { describe, expect, it } from 'vitest';
import { MATERIALS as SIM_DEFAULTS } from '../config';
import { DEFAULT_SETTINGS, materialById, optionsFor, parseSettings, surfaceColors, toConfigMessage } from './materials';

describe('material library', () => {
  it('starts from exactly the MVP values the simulation was built with', () => {
    const m = toConfigMessage(DEFAULT_SETTINGS).materials;
    expect(m.wall).toEqual(SIM_DEFAULTS.wall);
    expect(m.floor).toEqual(SIM_DEFAULTS.floor);
    expect(m.ceiling).toEqual(SIM_DEFAULTS.ceiling);
  });
  it('offers each surface only materials that make sense there', () => {
    expect(optionsFor('floor').map(m => m.id)).toContain('carpet');
    expect(optionsFor('wall').map(m => m.id)).not.toContain('carpet');
    expect(optionsFor('ceiling').map(m => m.id)).toContain('acoustic_panel');
  });
  it('keeps absorption and blocking in range, bands low to high', () => {
    for (const m of [...optionsFor('wall'), ...optionsFor('floor'), ...optionsFor('ceiling')]) {
      for (const a of m.absorption) expect(a).toBeGreaterThanOrEqual(0), expect(a).toBeLessThanOrEqual(1);
      expect(m.blockingDb[0]).toBeLessThanOrEqual(m.blockingDb[2]);
    }
  });
  it('colours the blueprint by the chosen materials', () => {
    const colors = surfaceColors({ ...DEFAULT_SETTINGS, materials: { wall: 'drywall', floor: 'carpet', ceiling: 'drywall' } });
    expect(colors[1]).toBe(materialById('carpet').color);
  });
});

describe('parseSettings', () => {
  it('takes a good scene as it is', () => {
    const s = { materials: { wall: 'plaster', floor: 'tile', ceiling: 'acoustic_panel' }, furnishing: 0.3, quality: 'high' };
    expect(parseSettings(s)).toEqual(s);
  });
  it('drops unknown keys and bad values, filling in defaults', () => {
    const s = parseSettings({ materials: { wall: 'carpet', floor: 'tile', extra: 1 }, furnishing: 'lots', quality: 'ultra', secret: true });
    expect(s.materials.wall).toBe('drywall'); // carpet is not a wall
    expect(s.materials.floor).toBe('tile');
    expect(s.furnishing).toBe(DEFAULT_SETTINGS.furnishing);
    expect(s.quality).toBe('normal');
    expect(s).not.toHaveProperty('secret');
  });
  it('survives garbage', () => {
    expect(parseSettings(null)).toEqual(DEFAULT_SETTINGS);
    expect(parseSettings('x')).toEqual(DEFAULT_SETTINGS);
  });
});
