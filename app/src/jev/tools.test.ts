import { describe, expect, it, vi } from 'vitest';
import { createActions, type SceneEffects } from '../scene/actions';
import { defaultScene } from '../scene/state';
import { createStore } from '../scene/store';
import { execute } from './executor';
import { toolsFor } from './tools';

function fakeEffects(): SceneEffects {
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
      echoTime: [0.4567, 0.5123, 0.6789] as [number, number, number],
      sources: [{ id: 's1', levelDb: [-12.34, -15.67, -18.91] as [number, number, number], walls: 1 }],
      estimated: false,
    })),
    current: vi.fn(() => ({
      roomId: 'r1',
      echoTime: [0.8123, 0.7234, 0.6345] as [number, number, number],
      sources: [{ id: 's1', levelDb: [-10.12, -11.34, -12.56] as [number, number, number], walls: 1 }],
      estimated: true,
    })),
    rooms: vi.fn(() => [{ id: 'r1', name: 'Kitchen', floor: 'f1', area: 12, centre: [0, 0, 0] as [number, number, number] }]),
    openings: vi.fn(() => [
      { id: 'w1', kind: 'window' as const, roomId: 'r1', roomName: 'Kitchen', width: 1.2, height: 1.0, meshClosed: false },
    ]),
    layers: vi.fn(() => [{ id: 'type002', triangles: 100 }]),
    roomsTagged: vi.fn(() => true),
    listener: vi.fn(() => ({ position: [0, 1.6, 0] as [number, number, number], roomId: 'r1' })),
  };
}

const SOUNDS = { music: { kind: 'point' as const, levelDb: 0 } };

describe('toolsFor', () => {
  it('sends only allowed tools', () => {
    const scene = defaultScene('Ki9YdfpNKum');
    const tools = toolsFor(scene.permissions, { sounds: ['music'], rooms: ['Kitchen'], layers: ['type002'] });
    const names = tools.map(t => t.name);
    expect(names).not.toContain('move_user_to');
    expect(names).not.toContain('set_mesh_layer');
    expect(names).toContain('set_material');
    expect(names).toContain('set_opening');
  });

  it('lists only materials whose PUT is on', () => {
    const scene = defaultScene('Ki9YdfpNKum');
    scene.permissions.putMaterial.tile = false;
    const tools = toolsFor(scene.permissions, { sounds: ['music'], rooms: ['Kitchen'], layers: [] });
    const setMat = tools.find(t => t.name === 'set_material')!;
    const props = setMat.input_schema.properties as Record<string, { enum?: string[] }>;
    expect(props.material.enum).not.toContain('tile');
    expect(props.material.enum).toContain('carpet');
  });

  it('declares closed schemas with every key required', () => {
    const scene = defaultScene('Ki9YdfpNKum');
    scene.permissions.put.userLocation = true;
    scene.permissions.putLayer.type002 = true;
    const tools = toolsFor(scene.permissions, { sounds: ['music'], rooms: ['Kitchen'], layers: ['type002'] });
    for (const tool of tools) {
      expect(tool.input_schema.additionalProperties).toBe(false);
      const keys = Object.keys(tool.input_schema.properties);
      expect(tool.input_schema.required).toEqual(keys);
    }
  });
});

describe('execute', () => {
  it('runs a call through the action layer', async () => {
    const store = createStore(defaultScene('Ki9YdfpNKum'));
    const effects = fakeEffects();
    const actions = createActions(store, effects, SOUNDS);
    const spy = vi.spyOn(actions, 'setFurnishing');

    const res = await execute(
      { id: 'c1', name: 'set_furnishing', input: { level: 'studio', room: null } },
      { store, actions, effects },
    );
    expect(spy).toHaveBeenCalledWith({ level: 'studio', room: undefined });
    expect(res.is_error).toBeUndefined();
    const parsed = JSON.parse(res.content);
    expect(parsed.before.echoTime).toEqual([0.81, 0.72, 0.63]);
    expect(parsed.after.echoTime).toEqual([0.46, 0.51, 0.68]);
    expect(parsed.after.sources[0].levelDb).toEqual([-12.3, -15.7, -18.9]);
  });

  it('refuses a call whose permission was turned off after the tools were sent', async () => {
    const scene = defaultScene('Ki9YdfpNKum');
    scene.permissions.put.windows = false;
    const store = createStore(scene);
    const effects = fakeEffects();
    const actions = createActions(store, effects, SOUNDS);
    const spy = vi.spyOn(actions, 'setOpening');

    const res = await execute(
      { id: 'c2', name: 'set_opening', input: { id: 'w1', room: null, type: 'window', state: 'closed' } },
      { store, actions, effects },
    );
    expect(res.is_error).toBe(true);
    expect(res.content).toBe('Not allowed: turn on PUT for Windows in Settings.');
    expect(spy).not.toHaveBeenCalled();
  });

  it('refuses an unknown tool and malformed input', async () => {
    const store = createStore(defaultScene('Ki9YdfpNKum'));
    const effects = fakeEffects();
    const actions = createActions(store, effects, SOUNDS);

    const unknown = await execute({ id: 'c3', name: 'run_shell', input: {} }, { store, actions, effects });
    expect(unknown.is_error).toBe(true);

    const bad = await execute({ id: 'c4', name: 'set_furnishing', input: 'not-an-object' }, { store, actions, effects });
    expect(bad.is_error).toBe(true);
  });

  it('returns an action error as is_error', async () => {
    const store = createStore(defaultScene('Ki9YdfpNKum'));
    const effects = fakeEffects();
    const actions = createActions(store, effects, SOUNDS);

    const res = await execute(
      { id: 'c5', name: 'remove_speaker', input: { id: 'speaker-999' } },
      { store, actions, effects },
    );
    expect(res.is_error).toBe(true);
    expect(res.content).toContain('Unknown speaker');
  });
});
