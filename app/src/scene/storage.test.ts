import { describe, expect, it } from 'vitest';
import { defaultScene } from './state';
import { autosaveKey, loadAutosave, parseSceneFile, saveAutosave, sceneFileName } from './storage';

const ID = 'Ki9YdfpNKum';

function memoryStorage(): Storage {
  const m = new Map<string, string>();
  return {
    get length() { return m.size; },
    clear: () => m.clear(),
    getItem: k => m.get(k) ?? null,
    key: i => [...m.keys()][i] ?? null,
    removeItem: k => { m.delete(k); },
    setItem: (k, v) => { m.set(k, String(v)); },
  };
}
const blocked = (): never => { throw new Error('blocked'); };
const throwing: Storage = { length: 0, clear: blocked, getItem: blocked, key: blocked, removeItem: blocked, setItem: blocked };

describe('scene file', () => {
  it('round-trips a scene exactly', () => {
    const s = { ...defaultScene(ID), furnishing: 0.3 };
    expect(parseSceneFile(JSON.stringify(s), ID)).toEqual({ scene: s });
  });

  it('refuses a scene from another property', () => {
    expect(parseSceneFile(JSON.stringify(defaultScene('aaaaaaaaaaa')), ID)).toEqual({ error: 'This scene belongs to another property (aaaaaaaaaaa).' });
  });

  it('rejects text that is not JSON, and JSON that is not an object', () => {
    expect(parseSceneFile('{', ID)).toEqual({ error: 'This file is not a scene file (not JSON).' });
    expect(parseSceneFile('[1]', ID)).toEqual({ error: 'This file is not a scene file.' });
    expect(parseSceneFile('null', ID)).toEqual({ error: 'This file is not a scene file.' });
  });

  it('names the file', () => {
    expect(sceneFileName(ID, new Date('2026-11-14T10:00:00Z'))).toBe('scene-Ki9YdfpNKum-2026-11-14.json');
  });
});

describe('autosave', () => {
  it('uses the key scene:<modelId>', () => expect(autosaveKey(ID)).toBe('scene:Ki9YdfpNKum'));

  it('saves and loads back', () => {
    const st = memoryStorage();
    const s = { ...defaultScene(ID), quality: 'fast' as const };
    saveAutosave(s, st);
    expect(loadAutosave(ID, st)).toEqual(s);
  });

  it('returns null when nothing is saved', () => expect(loadAutosave(ID, memoryStorage())).toBeNull());

  it('survives a storage that throws', () => {
    expect(() => saveAutosave(defaultScene(ID), throwing)).not.toThrow();
    expect(loadAutosave(ID, throwing)).toBeNull();
  });

  it('survives having no storage at all', () => {
    expect(() => saveAutosave(defaultScene(ID))).not.toThrow();
    expect(loadAutosave(ID)).toBeNull();
  });

  it('ignores a corrupt autosave', () => {
    const st = memoryStorage();
    st.setItem(autosaveKey(ID), '{');
    expect(loadAutosave(ID, st)).toBeNull();
  });

  it('ignores an autosave of another property', () => {
    const st = memoryStorage();
    st.setItem(autosaveKey(ID), JSON.stringify(defaultScene('aaaaaaaaaaa')));
    expect(loadAutosave(ID, st)).toBeNull();
  });
});
