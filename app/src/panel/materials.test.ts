// @vitest-environment jsdom
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { createActions, type SceneEffects } from '../scene/actions';
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
      { id: 'r2', name: 'Bedroom', floor: 'f1', area: 16, centre: [4, 0, 0] as [number, number, number] },
    ]),
    openings: vi.fn(() => []),
    layers: vi.fn(() => []),
    roomsTagged: vi.fn(() => false),
    listener: vi.fn(() => ({ position: [0, 1.6, 0] as [number, number, number], roomId: 'r1' })),
    ...overrides,
  };
}

const SOUNDS = {
  music: { kind: 'point' as const, levelDb: 0 },
  traffic: { kind: 'ambient' as const, levelDb: 0 },
};

const SAMPLE_DEFAULTS: MaterialDefaults = {
  source: 'llm',
  rooms: [
    {
      roomId: 'r1',
      floor: { parts: [{ material: 'tile', weight: 1 }] },
      wall: { parts: [{ material: 'drywall', weight: 1 }] },
      ceiling: { parts: [{ material: 'drywall', weight: 1 }] },
      furnishing: 'sparse',
      reason: 'Listing says Tile Flooring.',
    },
    {
      roomId: 'r2',
      floor: { parts: [{ material: 'tile', weight: 1 }] },
      wall: { parts: [{ material: 'drywall', weight: 1 }] },
      ceiling: { parts: [{ material: 'drywall', weight: 1 }] },
      furnishing: 'furnished',
      reason: 'Listing says Tile Flooring.',
    },
  ],
  exteriorWall: { parts: [{ material: 'brick_veneer', weight: 1 }] },
  exteriorReason: 'Brick Exterior Construction.',
};

describe('panel scene & materials', () => {
  let root: HTMLElement;

  beforeEach(() => {
    document.body.innerHTML = '<aside id="panel"></aside>';
    root = document.getElementById('panel')!;
  });

  function setup(effectsOverrides: Partial<SceneEffects> = {}, init?: (s: SceneState) => void) {
    const scene = defaultScene('Ki9YdfpNKum');
    init?.(scene);
    const store = createStore(scene);
    const effects = fakeEffects(effectsOverrides);
    const actions = createActions(store, effects, SOUNDS);
    const fetchDefaults = vi.fn(async () => SAMPLE_DEFAULTS);
    startPanel(root, { store, actions, effects, fetchDefaults });
    return { store, actions, effects };
  }

  it('changing the floor select calls setMaterial', async () => {
    const { store } = setup();
    const floorSelect = root.querySelector<HTMLSelectElement>('[data-surface="floor"]')!;
    floorSelect.value = 'carpet';
    floorSelect.dispatchEvent(new Event('change'));
    await vi.waitFor(() => {
      expect(store.get().surfaces.floor).toBe('carpet');
    });
  });

  it('shows "suggested" with the reason until the value is changed', async () => {
    const { actions } = setup({ roomsTagged: () => true });
    actions.applyDefaults(SAMPLE_DEFAULTS);

    const roomPicker = root.querySelector<HTMLSelectElement>('[data-role="room-picker"]')!;
    roomPicker.value = 'r1';
    roomPicker.dispatchEvent(new Event('change'));

    const badge = root.querySelector<HTMLElement>('[data-suggested="floor"]')!;
    expect(badge.hidden).toBe(false);
    expect(badge.textContent).toContain('suggested');
    expect(badge.title).toContain('Tile Flooring');

    const floorSelect = root.querySelector<HTMLSelectElement>('[data-surface="floor"]')!;
    floorSelect.value = 'carpet';
    floorSelect.dispatchEvent(new Event('change'));
    await vi.waitFor(() => {
      expect(root.querySelector<HTMLElement>('[data-suggested="floor"]')!.hidden).toBe(true);
    });
  });

  it('hides the room picker until rooms are tagged', () => {
    setup({ roomsTagged: () => false });
    const pickerWrap = root.querySelector<HTMLElement>('[data-role="room-picker-wrap"]')!;
    expect(pickerWrap.hidden).toBe(true);

    document.body.innerHTML = '<aside id="panel"></aside>';
    root = document.getElementById('panel')!;
    setup({ roomsTagged: () => true });
    expect(root.querySelector<HTMLElement>('[data-role="room-picker-wrap"]')!.hidden).toBe(false);
  });

  it('shows a load error and keeps the scene', async () => {
    const { store } = setup();
    const before = store.get();
    const input = root.querySelector<HTMLInputElement>('[data-role="load-file"]')!;
    const badFile = new File([JSON.stringify({ ...before, modelId: 'OtherModel1' })], 'other.json', {
      type: 'application/json',
    });
    Object.defineProperty(input, 'files', { value: [badFile], configurable: true });
    input.dispatchEvent(new Event('change'));

    await vi.waitFor(() => {
      const errEl = root.querySelector<HTMLElement>('[data-role="scene-error"]')!;
      expect(errEl.textContent?.trim()).not.toBe('');
    });
    expect(store.get()).toEqual(before);
  });

  it('redraws when the store changes from elsewhere', async () => {
    const { actions } = setup();
    await actions.setMaterial({ target: 'wall', material: 'brick_veneer' });
    const wallSelect = root.querySelector<HTMLSelectElement>('[data-surface="wall"]')!;
    expect(wallSelect.value).toBe('brick_veneer');
  });

  it('lists only library materials', () => {
    setup();
    const options = [...root.querySelectorAll<HTMLOptionElement>('[data-surface] option')];
    expect(options.length).toBeGreaterThan(0);
    for (const opt of options) {
      expect(opt.value.startsWith('blend:')).toBe(false);
    }
  });
});
