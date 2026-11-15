// @vitest-environment jsdom
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { createActions, type OpeningInfo, type SceneEffects } from '../scene/actions';
import { defaultScene, type MaterialDefaults, type SceneState } from '../scene/state';
import { createStore } from '../scene/store';
import { startPanel } from './index';

function fakeEffects(overrides: Partial<SceneEffects> = {}): SceneEffects {
  return {
    materialsChanged: vi.fn(),
    qualityChanged: vi.fn(),
    openingsChanged: vi.fn(async () => {}),
    layersChanged: vi.fn(),
    sourcesChanged: vi.fn(async () => {}),
    clearReverb: vi.fn(),
    retrace: vi.fn(),
    moveUserTo: vi.fn(async () => {}),
    measure: vi.fn(async () => ({
      roomId: 'r1',
      echoTime: [0.5, 0.5, 0.5] as [number, number, number],
      sources: [],
      estimated: false,
    })),
    current: vi.fn(() => null),
    rooms: vi.fn(() => [
      { id: 'r1', name: 'Kitchen', floor: 'f1', area: 12, centre: [0, 0, 0] as [number, number, number] },
    ]),
    openings: vi.fn<() => OpeningInfo[]>(() => [
      { id: 'w1', kind: 'window', roomId: 'r1', roomName: 'Kitchen', width: 1.2, height: 1.0, meshClosed: false },
      { id: 'w2', kind: 'window', roomId: 'r1', roomName: 'Kitchen', width: 1.0, height: 1.0, meshClosed: true },
      { id: 'd1', kind: 'door', roomId: 'r1', roomName: 'Kitchen', width: 0.9, height: 2.0, meshClosed: false },
    ]),
    layers: vi.fn(() => [
      { id: 'house', triangles: 13803 },
      { id: 'type002', triangles: 86901 },
    ]),
    roomsTagged: vi.fn(() => true),
    listener: vi.fn(() => ({ position: [0, 1.6, 0] as [number, number, number], roomId: 'r1' })),
    ...overrides,
  };
}

const SOUNDS = {
  music: { kind: 'point' as const, levelDb: 0 },
  traffic: { kind: 'ambient' as const, levelDb: 0 },
};

const EMPTY_DEFAULTS: MaterialDefaults = {
  source: 'table',
  rooms: [],
  exteriorWall: { parts: [{ material: 'siding_wall', weight: 1 }] },
  exteriorReason: 'Default.',
};

describe('panel sources, openings, layers, permissions', () => {
  let root: HTMLElement;

  beforeEach(() => {
    document.body.innerHTML = '<aside id="panel"></aside>';
    root = document.getElementById('panel')!;
  });

  function setup(init?: (s: SceneState) => void, effectsOverrides: Partial<SceneEffects> = {}) {
    const scene = defaultScene('Ki9YdfpNKum');
    init?.(scene);
    const store = createStore(scene);
    const effects = fakeEffects(effectsOverrides);
    const actions = createActions(store, effects, SOUNDS);
    startPanel(root, {
      store,
      actions,
      effects,
      fetchDefaults: async () => EMPTY_DEFAULTS,
    });
    return { store, actions, effects };
  }

  it('lists speakers and changes a level', async () => {
    const { store } = setup(s => {
      s.sources = [
        { id: 'speaker-1', label: 'Kitchen speaker', kind: 'point', sound: 'music', position: [0, 1, 0], levelDb: 0, enabled: true },
      ];
    });
    const levelInput = root.querySelector<HTMLInputElement>('[data-speaker-level="speaker-1"]')!;
    levelInput.value = '-6';
    levelInput.dispatchEvent(new Event('change'));
    await vi.waitFor(() => {
      expect(store.get().sources[0].levelDb).toBe(-6);
    });
  });

  it('asks the tour to place a speaker', () => {
    setup();
    const seen: CustomEvent[] = [];
    root.addEventListener('panel:add-speaker', e => seen.push(e as CustomEvent));
    const soundSel = root.querySelector<HTMLSelectElement>('[data-role="add-speaker-sound"]')!;
    soundSel.value = 'music';
    root.querySelector<HTMLButtonElement>('[data-role="add-speaker-btn"]')!.click();
    expect(seen).toHaveLength(1);
    expect(seen[0].detail).toEqual({ sound: 'music' });
  });

  it('closes all windows through the action', async () => {
    const { store } = setup(s => {
      s.openings.loaded = true;
    });
    root.querySelector<HTMLButtonElement>('[data-role="close-all-windows"]')!.click();
    await vi.waitFor(() => {
      expect(store.get().openings.closed.w1).toBe(true);
    });
  });

  it('disables openings the scan already closes', () => {
    setup(s => {
      s.openings.loaded = true;
    });
    const w2Toggle = root.querySelector<HTMLInputElement>('[data-opening-toggle="w2"]')!;
    expect(w2Toggle.disabled).toBe(true);
    const w2Row = root.querySelector<HTMLElement>('[data-opening-row="w2"]')!;
    expect(w2Row.textContent).toContain('already closed in the scan');
  });

  it('toggles a layer and shows its triangle count', () => {
    const { store } = setup();
    const houseRow = root.querySelector<HTMLElement>('[data-layer-row="house"]')!;
    expect(houseRow.textContent).toContain('13,803');
    const traced = root.querySelector<HTMLInputElement>('[data-layer-traced="type002"]')!;
    traced.checked = false;
    traced.dispatchEvent(new Event('change'));
    expect(store.get().meshLayers.type002?.traced).toBe(false);
  });

  it('turning a PUT switch off updates the permissions', () => {
    const { store } = setup();
    const winPut = root.querySelector<HTMLInputElement>('[data-perm-put="windows"]')!;
    expect(winPut.checked).toBe(true);
    winPut.checked = false;
    winPut.dispatchEvent(new Event('change'));
    expect(store.get().permissions.put.windows).toBe(false);
  });

  it('flashes the row a change touched', async () => {
    const { actions } = setup();
    await actions.setMaterial({ target: 'floor', material: 'tile' });
    const matSec = root.querySelector<HTMLElement>('[data-section="materials"]')!;
    expect(matSec.classList.contains('panel-flash')).toBe(true);
  });
});
