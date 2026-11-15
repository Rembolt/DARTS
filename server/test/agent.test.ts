import Anthropic from '@anthropic-ai/sdk';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { createConversations } from '../src/agent/conversations.js';
import { createAgent } from '../src/agent/index.js';
import type { AgentEvent, QuickSummary } from '../src/shared/contract.js';
import { fakes, okSummary, row } from './agent-fakes.js';

type Params = Anthropic.Beta.MessageCreateParamsNonStreaming;
type Step = Anthropic.Beta.BetaMessage | Error | ((params: Params) => Anthropic.Beta.BetaMessage | Promise<Anthropic.Beta.BetaMessage>);

const ENV = { CLAUDE_API: 'test-key-not-real' };
const SEARCH_INPUT = { city: 'Houston', zip: null, near: null, kind: 'home', propertyTypes: null, minSqft: null, maxPrice: null, minBeds: null, limit: 5 };
const summaryInput = (modelId: string) => ({ modelId, profile: 'recording', echoMin: null, echoMax: null, maxOutsideDb: null, maxEscapeDb: null, minRoomArea: null });

function message(stop_reason: Anthropic.Beta.BetaStopReason, content: unknown[]): Anthropic.Beta.BetaMessage {
  return {
    id: 'msg_test', type: 'message', role: 'assistant', model: 'claude-opus-5-5', content, stop_reason,
    stop_sequence: null, stop_details: null, usage: { input_tokens: 1, output_tokens: 1 },
  } as unknown as Anthropic.Beta.BetaMessage;
}
const toolUse = (id: string, name: string, input: unknown) => ({ type: 'tool_use', id, name, input });
const text = (t: string) => ({ type: 'text', text: t });
const THINKING = { type: 'thinking', thinking: '', signature: 'sig-abc' };

/** A scripted client: each call returns (or throws) the next step; params are cloned at call time. */
function scripted(steps: Step[], fallback?: Step) {
  const calls: { params: Params; options: { signal?: AbortSignal; timeout?: number; maxRetries?: number } | undefined }[] = [];
  const client = {
    beta: {
      messages: {
        async create(params: Params, options?: { signal?: AbortSignal; timeout?: number; maxRetries?: number }) {
          calls.push({ params: structuredClone(params), options });
          const step = steps.length ? steps.shift()! : fallback;
          if (!step) throw new Error('script ran out');
          if (step instanceof Error) throw step;
          return typeof step === 'function' ? step(params) : step;
        },
      },
    },
  };
  return { client, calls };
}

function collect() {
  const events: AgentEvent[] = [];
  return { events, emit: (e: AgentEvent) => events.push(e) };
}
const live = () => new AbortController().signal;
const types = (events: AgentEvent[]) => events.map(e => e.type);

const BASIC_SCRIPT = (): Step[] => [
  message('tool_use', [THINKING, toolUse('t1', 'search_properties', SEARCH_INPUT)]),
  message('tool_use', [toolUse('t2', 'quick_audio_summary', summaryInput('aaaaaaaaaaa')), toolUse('t3', 'quick_audio_summary', summaryInput('bbbbbbbbbbb'))]),
  message('end_turn', [text('Best: aaaaaaaaaaa Main St, Room r0, estimated 0.4 s.')]),
];

beforeEach(() => { vi.spyOn(console, 'info').mockImplementation(() => {}); });
afterEach(() => { vi.restoreAllMocks(); });

describe('agent loop', () => {
  it('runs tools and answers', async () => {
    const { client } = scripted(BASIC_SCRIPT());
    const agent = createAgent({ env: ENV, ...fakes(), client });
    const { events, emit } = collect();
    await agent.run({ text: 'record music in Houston' }, emit, live());
    expect(types(events)).toEqual(['conversation', 'status', 'status', 'status', 'cards', 'cards', 'text', 'done']);
    expect(events[6]).toEqual({ type: 'text', text: 'Best: aaaaaaaaaaa Main St, Room r0, estimated 0.4 s.' });
  });

  it('returns every tool result in one user message', async () => {
    const { client, calls } = scripted(BASIC_SCRIPT());
    const f = fakes({ summaries: { bbbbbbbbbbb: { ok: false, modelId: 'bbbbbbbbbbb', address: null, reason: { code: 'no_room_data', message: 'x', retry: false } } } });
    await createAgent({ env: ENV, ...f, client }).run({ text: 'hi' }, () => {}, live());
    const third = calls[2].params.messages;
    const last = third[third.length - 1];
    expect(last.role).toBe('user');
    const blocks = last.content as Anthropic.Beta.BetaToolResultBlockParam[];
    expect(blocks.map(b => [b.type, b.tool_use_id, b.is_error])).toEqual([['tool_result', 't2', false], ['tool_result', 't3', true]]);
    expect(JSON.parse(blocks[0].content as string).rooms).toHaveLength(3);
  });

  it('sends thinking blocks back unchanged', async () => {
    const { client, calls } = scripted(BASIC_SCRIPT());
    await createAgent({ env: ENV, ...fakes(), client }).run({ text: 'hi' }, () => {}, live());
    const assistant = calls[1].params.messages[1];
    expect(assistant.role).toBe('assistant');
    expect((assistant.content as unknown[])[0]).toEqual(THINKING);
  });

  it('keeps the conversation between requests', async () => {
    const { client, calls } = scripted([...BASIC_SCRIPT(), message('end_turn', [text('Second answer.')])]);
    const agent = createAgent({ env: ENV, ...fakes(), client });
    const first = collect();
    await agent.run({ text: 'first question' }, first.emit, live());
    const conv = first.events[0];
    expect(conv).toMatchObject({ type: 'conversation', fresh: true });
    const id = conv.type === 'conversation' ? conv.conversationId : '';
    const second = collect();
    await agent.run({ conversationId: id, text: 'second question' }, second.emit, live());
    expect(second.events[0]).toEqual({ type: 'conversation', conversationId: id, fresh: false });
    const sent = calls[3].params.messages;
    expect(sent).toHaveLength(7); // user, assistant, tool results, assistant, tool results, assistant, user
    expect(sent[0]).toEqual({ role: 'user', content: 'first question' });
    expect(sent[6]).toEqual({ role: 'user', content: 'second question' });
  });

  it('starts fresh for an unknown id', async () => {
    const { client } = scripted([message('end_turn', [text('ok')])]);
    const { events, emit } = collect();
    await createAgent({ env: ENV, ...fakes(), client }).run({ conversationId: 'gone-after-restart', text: 'hi' }, emit, live());
    expect(events[0]).toMatchObject({ type: 'conversation', fresh: true });
    expect(events[0].type === 'conversation' && events[0].conversationId).not.toBe('gone-after-restart');
  });

  it('uses the model, effort and fallback settings', async () => {
    const { client, calls } = scripted([message('end_turn', [text('ok')])]);
    await createAgent({ env: ENV, ...fakes(), client }).run({ text: 'hi' }, () => {}, live());
    const { params, options } = calls[0];
    expect(params.model).toBe('claude-opus-5-5');
    expect(params.max_tokens).toBe(16000);
    expect(params.output_config).toEqual({ effort: 'low' });
    expect(params.fallbacks).toBe('default');
    expect(params.betas).toEqual(['server-side-fallback-2026-07-01']);
    expect(params.tool_choice).toBeUndefined();
    expect(params.tools?.map(t => (t as { name: string }).name)).toEqual(['search_properties', 'quick_audio_summary', 'open_tour', 'focus_map']);
    expect(params.system).toEqual([{ type: 'text', text: expect.any(String), cache_control: { type: 'ephemeral' } }]);
    expect(options).toMatchObject({ timeout: 30_000, maxRetries: 0 });
    expect(options?.signal).toBeInstanceOf(AbortSignal);
  });

  it('stops at six model calls', async () => {
    let n = 0;
    const endless: Step = () => message('tool_use', [toolUse(`t${n++}`, 'search_properties', SEARCH_INPUT)]);
    const { client, calls } = scripted([], endless);
    const { events, emit } = collect();
    await createAgent({ env: ENV, ...fakes(), client }).run({ text: 'hi' }, emit, live());
    expect(calls).toHaveLength(6);
    expect(events.at(-2)).toMatchObject({ type: 'notPossible', reason: { code: 'agent_failed' } });
    expect(events.at(-1)).toEqual({ type: 'done' });
  });

  it('reports a refusal', async () => {
    const { client } = scripted([message('refusal', [])]);
    const { events, emit } = collect();
    await createAgent({ env: ENV, ...fakes(), client }).run({ text: 'hi' }, emit, live());
    expect(events.slice(1)).toEqual([{ type: 'notPossible', reason: expect.objectContaining({ code: 'refused' }) }, { type: 'done' }]);
  });

  it('reports max_tokens, pause_turn and unknown stop reasons as agent_failed', async () => {
    for (const reason of ['max_tokens', 'pause_turn', 'model_context_window_exceeded'] as const) {
      const { client } = scripted([message(reason, [text('partial')])]);
      const { events, emit } = collect();
      await createAgent({ env: ENV, ...fakes(), client }).run({ text: 'hi' }, emit, live());
      expect(types(events), reason).toEqual(['conversation', 'notPossible', 'done']);
      expect(events[1]).toMatchObject({ reason: { code: 'agent_failed' } });
    }
  });

  it('does not keep a failed turn in the conversation', async () => {
    const { client, calls } = scripted([message('refusal', []), message('end_turn', [text('ok')])]);
    const agent = createAgent({ env: ENV, ...fakes(), client });
    const first = collect();
    await agent.run({ text: 'first' }, first.emit, live());
    const id = first.events[0].type === 'conversation' ? first.events[0].conversationId : '';
    await agent.run({ conversationId: id, text: 'second' }, () => {}, live());
    expect(calls[1].params.messages).toEqual([{ role: 'user', content: 'second' }]);
  });

  it('falls back to keywords when the key is missing', async () => {
    const { client, calls } = scripted([]);
    const { events, emit } = collect();
    await createAgent({ env: {}, ...fakes(), client }).run({ text: 'a place to record music' }, emit, live());
    expect(calls).toHaveLength(0);
    expect(events[1]).toMatchObject({ type: 'notPossible', reason: { code: 'ai_unavailable' } });
    expect(types(events)).toContain('cards');
    expect(events.at(-2)).toMatchObject({ type: 'text' });
    expect(events.at(-1)).toEqual({ type: 'done' });
  });

  it('falls back to keywords when the first call fails', async () => {
    const { client, calls } = scripted([new Anthropic.APIConnectionError({ message: 'down' }), new Anthropic.APIConnectionError({ message: 'down' })]);
    const { events, emit } = collect();
    await createAgent({ env: ENV, ...fakes(), client }).run({ text: 'a place to record music' }, emit, live());
    expect(calls).toHaveLength(2);
    expect(events[1]).toMatchObject({ type: 'notPossible', reason: { code: 'ai_unavailable' } });
    expect(types(events)).toContain('cards');
    expect(events.at(-1)).toEqual({ type: 'done' });
  });

  it('retries a first-call failure once and carries on', async () => {
    const { client, calls } = scripted([new Anthropic.APIConnectionTimeoutError(), message('end_turn', [text('ok')])]);
    const { events, emit } = collect();
    await createAgent({ env: ENV, ...fakes(), client }).run({ text: 'hi' }, emit, live());
    expect(calls).toHaveLength(2);
    expect(types(events)).toEqual(['conversation', 'text', 'done']);
  });

  it('does not retry an authentication error, and falls back', async () => {
    const auth = new Anthropic.AuthenticationError(401, { type: 'error' }, 'bad key', new Headers());
    const { client, calls } = scripted([auth]);
    const { events, emit } = collect();
    await createAgent({ env: ENV, ...fakes(), client }).run({ text: 'a house' }, emit, live());
    expect(calls).toHaveLength(1);
    expect(events[1]).toMatchObject({ reason: { code: 'ai_unavailable' } });
  });

  it('reports agent_failed when a later call fails', async () => {
    const { client } = scripted([BASIC_SCRIPT()[0], new Anthropic.APIConnectionError({ message: 'down' }), new Anthropic.APIConnectionError({ message: 'down' })]);
    const { events, emit } = collect();
    await createAgent({ env: ENV, ...fakes(), client }).run({ text: 'hi' }, emit, live());
    expect(events.at(-2)).toMatchObject({ type: 'notPossible', reason: { code: 'agent_failed' } });
    expect(types(events)).not.toContain('text');
  });

  it('stops when the client disconnects', async () => {
    const controller = new AbortController();
    const f = fakes({ summaries: { aaaaaaaaaaa: async () => { controller.abort(); return okSummary('aaaaaaaaaaa', 0.8); } } });
    const { client, calls } = scripted(BASIC_SCRIPT());
    const { events, emit } = collect();
    await createAgent({ env: ENV, ...f, client }).run({ text: 'hi' }, emit, controller.signal);
    expect(calls).toHaveLength(2);
    expect(types(events)).not.toContain('cards');
    expect(types(events)).not.toContain('text');
    expect(events.filter(e => e.type === 'done')).toHaveLength(1);
    expect(events.at(-1)).toEqual({ type: 'done' });
  });

  it('runs at most four tools at once and starts none after an abort', async () => {
    const ids = ['aaaaaaaaaaa', 'bbbbbbbbbbb', 'ccccccccccc', 'ddddddddddd', 'eeeeeeeeeee', 'fffffffffff'];
    const controller = new AbortController();
    let inFlight = 0;
    let most = 0;
    const slow = (abort: boolean) => async () => {
      inFlight++; most = Math.max(most, inFlight);
      await new Promise(r => setTimeout(r, 5));
      if (abort) controller.abort();
      inFlight--;
      return okSummary('aaaaaaaaaaa', 0.5);
    };
    const f = fakes({ rows: ids.map(id => row(id)), summaries: Object.fromEntries(ids.map((id, i) => [id, slow(i === 0)])) });
    const { client, calls } = scripted([message('tool_use', ids.map((id, i) => toolUse(`t${i}`, 'quick_audio_summary', summaryInput(id))))]);
    const { events, emit } = collect();
    await createAgent({ env: ENV, ...f, client }).run({ text: 'hi' }, emit, controller.signal);
    expect(most).toBe(4);
    expect(f.calls.summarise).toHaveLength(4);
    expect(calls).toHaveLength(1);
    expect(events.at(-1)).toEqual({ type: 'done' });
  });

  it('reports an answer with no text as agent_failed', async () => {
    const { client } = scripted([message('end_turn', [THINKING])]);
    const { events, emit } = collect();
    await createAgent({ env: ENV, ...fakes(), client }).run({ text: 'hi' }, emit, live());
    expect(types(events)).toEqual(['conversation', 'notPossible', 'done']);
  });

  it('does not fall back to keywords when aborted during the first call', async () => {
    const controller = new AbortController();
    const { client } = scripted([() => { controller.abort(); throw new Anthropic.APIUserAbortError(); }]);
    const f = fakes();
    const { events, emit } = collect();
    await createAgent({ env: ENV, ...f, client }).run({ text: 'a house' }, emit, controller.signal);
    expect(types(events)).toEqual(['conversation', 'done']);
    expect(f.calls.search).toHaveLength(0);
  });

  it('cancels the running request when a new one arrives', async () => {
    let release!: (s: QuickSummary) => void;
    const slow = new Promise<QuickSummary>(resolve => { release = resolve; });
    const f = fakes({ summaries: { aaaaaaaaaaa: () => slow } });
    const { client, calls } = scripted([
      message('tool_use', [toolUse('t1', 'quick_audio_summary', summaryInput('aaaaaaaaaaa'))]),
      message('end_turn', [text('second answer')]),
    ]);
    const agent = createAgent({ env: ENV, ...f, client });
    const first = collect();
    const running = agent.run({ text: 'first' }, first.emit, live());
    await vi.waitFor(() => expect(f.calls.summarise).toHaveLength(1));
    const id = first.events[0].type === 'conversation' ? first.events[0].conversationId : '';
    const second = collect();
    await agent.run({ conversationId: id, text: 'second' }, second.emit, live());
    release(okSummary('aaaaaaaaaaa', 0.8));
    await running;
    expect(types(first.events)).toEqual(['conversation', 'status', 'done']);
    expect(types(second.events)).toEqual(['conversation', 'text', 'done']);
    expect(calls).toHaveLength(2);
    expect(calls[1].params.messages).toEqual([{ role: 'user', content: 'second' }]);
  });

  it('never rejects and always ends with done', async () => {
    const f = fakes();
    f.search.search = () => { throw new Error('index exploded'); };
    const { client } = scripted([BASIC_SCRIPT()[0], message('end_turn', [text('done anyway')])]);
    const { events, emit } = collect();
    await expect(createAgent({ env: ENV, ...f, client }).run({ text: 'hi' }, emit, live())).resolves.toBeUndefined();
    expect(events.at(-1)).toEqual({ type: 'done' });

    const broken = { beta: { messages: { create: () => { throw new TypeError('bug'); } } } };
    const b = collect();
    await expect(createAgent({ env: ENV, ...fakes(), client: broken }).run({ text: 'hi' }, b.emit, live())).resolves.toBeUndefined();
    expect(types(b.events)).toEqual(['conversation', 'notPossible', 'done']);
  });

  it('refuses a long conversation', async () => {
    const steps = Array.from({ length: 21 }, () => message('end_turn', [text('ok')]));
    const { client, calls } = scripted(steps);
    const agent = createAgent({ env: ENV, ...fakes(), client });
    let id: string | undefined;
    for (let i = 0; i < 20; i++) {
      const c = collect();
      await agent.run({ conversationId: id, text: `q${i}` }, c.emit, live());
      id = c.events[0].type === 'conversation' ? c.events[0].conversationId : id;
    }
    const last = collect();
    await agent.run({ conversationId: id, text: 'one more' }, last.emit, live());
    expect(calls).toHaveLength(20);
    expect(last.events[1]).toMatchObject({ type: 'notPossible', reason: { code: 'bad_request', message: 'This conversation is long. Start a new search.' } });
  });
});

describe('conversations', () => {
  it('is busy past the limit and expires idle ones', () => {
    let t = 0;
    const c = createConversations({ max: 2, idleMs: 1000, now: () => t });
    const a = c.open(undefined);
    c.open(undefined);
    expect(c.open(undefined)).toMatchObject({ code: 'busy' });
    expect(c.open('code' in a ? undefined : a.id)).toMatchObject({ fresh: false });
    t = 5000;
    expect(c.open(undefined)).toMatchObject({ fresh: true });
  });
});
