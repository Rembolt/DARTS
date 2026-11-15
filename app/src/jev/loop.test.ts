import { describe, expect, it, vi } from 'vitest';
import { createActions, type SceneEffects } from '../scene/actions';
import { defaultScene } from '../scene/state';
import { createStore } from '../scene/store';
import { ask, type MessageParam } from './loop';

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
      echoTime: [0.5, 0.5, 0.5] as [number, number, number],
      sources: [],
      estimated: false,
    })),
    current: vi.fn(() => ({
      roomId: 'r1',
      echoTime: [0.8, 0.7, 0.6] as [number, number, number],
      sources: [],
      estimated: true,
    })),
    rooms: vi.fn(() => [{ id: 'r1', name: 'Kitchen', floor: 'f1', area: 12, centre: [0, 0, 0] as [number, number, number] }]),
    openings: vi.fn(() => []),
    layers: vi.fn(() => []),
    roomsTagged: vi.fn(() => true),
    listener: vi.fn(() => ({ position: [0, 1.6, 0] as [number, number, number], roomId: 'r1' })),
  };
}

const okJson = (body: unknown) =>
  new Response(JSON.stringify(body), { status: 200, headers: { 'Content-Type': 'application/json' } });

describe('ask', () => {
  it('answers a question without tools', async () => {
    const store = createStore(defaultScene('Ki9YdfpNKum'));
    const effects = fakeEffects();
    const actions = createActions(store, effects, { music: { kind: 'point', levelDb: 0 } });
    const fetchFn = vi.fn(async () =>
      okJson({ stop_reason: 'end_turn', content: [{ type: 'text', text: 'Echo time is 0.7 s (estimate).' }] }),
    );

    const res = await ask('Why is it echoey?', [], { store, actions, effects, fetch: fetchFn as unknown as typeof fetch });
    expect(res.reply).toBe('Echo time is 0.7 s (estimate).');
    expect(res.convo).toHaveLength(2);
  });

  it('runs tool calls and sends all results in one message', async () => {
    const store = createStore(defaultScene('Ki9YdfpNKum'));
    const effects = fakeEffects();
    const actions = createActions(store, effects, { music: { kind: 'point', levelDb: 0 } });
    const calls: unknown[] = [];
    let step = 0;
    const fetchFn = vi.fn(async (_url: unknown, init?: RequestInit) => {
      calls.push(JSON.parse(String(init?.body)));
      step++;
      if (step === 1) {
        return okJson({
          stop_reason: 'tool_use',
          content: [
            { type: 'tool_use', id: 't1', name: 'set_furnishing', input: { level: 'studio', room: null } },
            { type: 'tool_use', id: 't2', name: 'measure', input: { point: null, room: null } },
          ],
        });
      }
      return okJson({ stop_reason: 'end_turn', content: [{ type: 'text', text: 'Done (estimate).' }] });
    });

    const res = await ask('Make it quieter', [], { store, actions, effects, fetch: fetchFn as unknown as typeof fetch });
    expect(res.reply).toBe('Done (estimate).');
    const secondReq = calls[1] as { messages: MessageParam[] };
    const lastUser = secondReq.messages[secondReq.messages.length - 1];
    expect(lastUser.role).toBe('user');
    expect(Array.isArray(lastUser.content)).toBe(true);
    expect((lastUser.content as unknown[]).length).toBe(2);
  });

  it('sends the scene summary with each user turn', async () => {
    const store = createStore(defaultScene('Ki9YdfpNKum'));
    const effects = fakeEffects();
    const actions = createActions(store, effects, {});
    let sentBody: { messages: MessageParam[] } | null = null;
    const fetchFn = vi.fn(async (_url: unknown, init?: RequestInit) => {
      sentBody = JSON.parse(String(init?.body));
      return okJson({ stop_reason: 'end_turn', content: [{ type: 'text', text: 'ok' }] });
    });

    await ask('Hello', [], { store, actions, effects, fetch: fetchFn as unknown as typeof fetch });
    const content = String(sentBody!.messages[0].content);
    expect(content).toContain('"off"');
  });

  it('rebuilds the tool list each request', async () => {
    const store = createStore(defaultScene('Ki9YdfpNKum'));
    const effects = fakeEffects();
    const actions = createActions(store, effects, {});
    const reqs: { tools: { name: string }[] }[] = [];
    let step = 0;
    const fetchFn = vi.fn(async (_url: unknown, init?: RequestInit) => {
      reqs.push(JSON.parse(String(init?.body)));
      step++;
      if (step === 1) {
        const s = store.get();
        actions.setPermissions({ ...s.permissions, put: { ...s.permissions.put, windows: false, doors: false } });
        return okJson({
          stop_reason: 'tool_use',
          content: [{ type: 'tool_use', id: 't1', name: 'measure', input: { point: null, room: null } }],
        });
      }
      return okJson({ stop_reason: 'end_turn', content: [{ type: 'text', text: 'ok' }] });
    });

    await ask('Check', [], { store, actions, effects, fetch: fetchFn as unknown as typeof fetch });
    expect(reqs[0].tools.some(t => t.name === 'set_opening')).toBe(true);
    expect(reqs[1].tools.some(t => t.name === 'set_opening')).toBe(false);
  });

  it('reports a refusal', async () => {
    const store = createStore(defaultScene('Ki9YdfpNKum'));
    const effects = fakeEffects();
    const actions = createActions(store, effects, {});
    const fetchFn = vi.fn(async () => okJson({ stop_reason: 'refusal', content: [] }));

    const res = await ask('Bad request', [], { store, actions, effects, fetch: fetchFn as unknown as typeof fetch });
    expect(res.reply).toBe("I can't help with that request.");
  });

  it('stops after eight requests', async () => {
    const store = createStore(defaultScene('Ki9YdfpNKum'));
    const effects = fakeEffects();
    const actions = createActions(store, effects, {});
    const fetchFn = vi.fn(async () =>
      okJson({
        stop_reason: 'tool_use',
        content: [{ type: 'tool_use', id: 't1', name: 'measure', input: { point: null, room: null } }],
      }),
    );

    const res = await ask('Loop forever', [], { store, actions, effects, fetch: fetchFn as unknown as typeof fetch });
    expect(fetchFn).toHaveBeenCalledTimes(8);
    expect(res.reply).toBe("I couldn't finish that.");
  });

  it('says Jev is unavailable when the relay fails', async () => {
    const store = createStore(defaultScene('Ki9YdfpNKum'));
    const effects = fakeEffects();
    const actions = createActions(store, effects, {});
    const fetchFn = vi.fn(async () => new Response(JSON.stringify({ error: 'no key' }), { status: 503 }));

    const res = await ask('Hi', [], { store, actions, effects, fetch: fetchFn as unknown as typeof fetch });
    expect(res.reply).toBe('Jev is not available right now. The settings panel can do the same things.');
  });
});
