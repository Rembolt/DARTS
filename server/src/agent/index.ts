// The property agent (spec 7.1): a manual tool loop on Claude, streamed to the page as AgentEvents, with a keyword fallback.
import Anthropic from '@anthropic-ai/sdk';
import type { Quick } from '../quick/index.js';
import type { Search } from '../search/index.js';
import { notPossible, type AgentEvent, type AgentRequest, type NotPossible } from '../shared/contract.js';
import { createConversations } from './conversations.js';
import { runKeyword } from './keyword.js';
import { runTool, SYSTEM_PROMPT, TOOLS, type ToolOutcome } from './tools.js';

/** Never rejects; always ends with 'done'. */
export type Agent = { run(request: AgentRequest, emit: (event: AgentEvent) => void, signal: AbortSignal): Promise<void> };

type Params = Anthropic.Beta.MessageCreateParamsNonStreaming;
type Message = Anthropic.Beta.BetaMessageParam;
type CallOptions = { signal: AbortSignal; timeout: number; maxRetries: number };
/** The part of the SDK client the loop uses, so tests can pass a scripted fake. */
export type AgentClient = { beta: { messages: { create(params: Params, options?: CallOptions): Promise<Anthropic.Beta.BetaMessage> } } };

export const MODEL = 'claude-opus-5-5';
const MAX_MODEL_CALLS = 6;
const MAX_TURNS = 20;
const TOOL_CONCURRENCY = 4;
const CALL_TIMEOUT_MS = 30_000;

class Aborted extends Error {}

/** 408, 429, 5xx (529 overloaded included), connection errors and timeouts get one retry. Not an abort. */
function retryable(err: unknown): boolean {
  if (err instanceof Anthropic.APIUserAbortError) return false;
  if (err instanceof Anthropic.APIConnectionError) return true;
  if (err instanceof Anthropic.APIError) {
    const status = err.status ?? 0;
    return status === 408 || status === 429 || status >= 500;
  }
  return false;
}

/** Runs `tasks` with at most `limit` in flight; results in input order. */
async function pool<T>(tasks: (() => Promise<T>)[], limit: number): Promise<T[]> {
  const results = new Array<T>(tasks.length);
  let next = 0;
  const worker = async () => {
    while (next < tasks.length) {
      const i = next++;
      results[i] = await tasks[i]();
    }
  };
  await Promise.all(Array.from({ length: Math.min(limit, tasks.length) }, worker));
  return results;
}

function outcomeCode(outcome: ToolOutcome): string {
  if (!outcome.isError) return 'ok';
  try {
    return String(JSON.parse(outcome.content).code ?? 'error');
  } catch {
    return 'error';
  }
}

export function createAgent(options: {
  env: Record<string, string | undefined>;
  search: Search;
  quick: Quick;
  client?: unknown;
}): Agent {
  const { env, search, quick } = options;
  const conversations = createConversations();
  let client = options.client as AgentClient | undefined;
  // Built only when the key is there and no client was injected, so tests never construct a real one.
  const getClient = (apiKey: string): AgentClient => (client ??= new Anthropic({ apiKey }) as unknown as AgentClient);

  async function callModel(api: AgentClient, messages: Message[], signal: AbortSignal): Promise<Anthropic.Beta.BetaMessage> {
    const params: Params = {
      model: MODEL,
      max_tokens: 16000,
      betas: ['server-side-fallback-2026-07-01'],
      fallbacks: 'default',
      output_config: { effort: 'low' },
      system: [{ type: 'text', text: SYSTEM_PROMPT, cache_control: { type: 'ephemeral' } }],
      tools: TOOLS,
      messages,
    };
    // The SDK's own retries are off so the total stays bounded (spec 8.4): one retry here, for transient errors only.
    for (let attempt = 0; ; attempt++) {
      try {
        return await api.beta.messages.create(params, { signal, timeout: CALL_TIMEOUT_MS, maxRetries: 0 });
      } catch (err) {
        if (signal.aborted) throw new Aborted();
        if (attempt === 0 && retryable(err)) continue;
        throw err;
      }
    }
  }

  async function runTools(blocks: Anthropic.Beta.BetaToolUseBlock[], send: (e: AgentEvent) => void, signal: AbortSignal) {
    const deps = { search, quick, emit: send };
    return pool(blocks.map(block => async (): Promise<Anthropic.Beta.BetaToolResultBlockParam> => {
      // After an abort no further tool starts; the placeholder is never sent, because the turn is dropped.
      if (signal.aborted) return { type: 'tool_result', tool_use_id: block.id, content: 'cancelled', is_error: true };
      const started = Date.now();
      const outcome = await runTool(block.name, block.input, deps);
      // One line per tool: name, time, outcome. Never the user's text or the tool input.
      if (!signal.aborted) console.info(`[agent] ${block.name} ${Date.now() - started}ms ${outcomeCode(outcome)}`);
      return { type: 'tool_result', tool_use_id: block.id, content: outcome.content, is_error: outcome.isError };
    }), TOOL_CONCURRENCY);
  }

  /** The loop. Returns the messages to keep when the turn finished cleanly, else null. */
  async function loop(api: AgentClient, history: Message[], text: string, send: (e: AgentEvent) => void,
    signal: AbortSignal, fallBack: () => Promise<void>): Promise<Message[] | null> {
    // A local copy: the conversation only gets this turn when it ends cleanly, so it never holds a tool_use without its result.
    const turn: Message[] = [{ role: 'user', content: text }];
    const fail = (reason: NotPossible) => { send({ type: 'notPossible', reason }); return null; };
    for (let call = 0; call < MAX_MODEL_CALLS; call++) {
      let response: Anthropic.Beta.BetaMessage;
      try {
        response = await callModel(api, [...history, ...turn], signal);
      } catch (err) {
        if (err instanceof Aborted || signal.aborted) return null;
        if (call === 0 && err instanceof Anthropic.APIError) {
          send({ type: 'notPossible', reason: notPossible('ai_unavailable') });
          await fallBack();
          return null;
        }
        return fail(notPossible('agent_failed'));
      }
      if (signal.aborted) return null;
      turn.push({ role: 'assistant', content: response.content as Anthropic.Beta.BetaContentBlockParam[] });

      switch (response.stop_reason) {
        case 'tool_use': {
          const uses = response.content.filter((b): b is Anthropic.Beta.BetaToolUseBlock => b.type === 'tool_use');
          if (uses.length === 0) return fail(notPossible('agent_failed'));
          const results = await runTools(uses, send, signal);
          if (signal.aborted) return null;
          turn.push({ role: 'user', content: results });
          continue;
        }
        case 'end_turn': {
          const answer = response.content.filter((b): b is Anthropic.Beta.BetaTextBlock => b.type === 'text').map(b => b.text).join('').trim();
          if (!answer) return fail(notPossible('agent_failed'));
          send({ type: 'text', text: answer });
          return turn;
        }
        case 'refusal':
          return fail(notPossible('refused'));
        default:
          // max_tokens, pause_turn and anything unexpected.
          return fail(notPossible('agent_failed'));
      }
    }
    return fail(notPossible('agent_failed'));
  }

  return {
    async run(request, emit, signal) {
      const runController = new AbortController();
      const runSignal = AbortSignal.any([signal, runController.signal]);
      const send = (e: AgentEvent) => { if (!runSignal.aborted) emit(e); };
      let conversationId: string | null = null;
      try {
        const text = typeof request?.text === 'string' ? request.text.trim() : '';
        if (!text || text.length > 500) return send({ type: 'notPossible', reason: notPossible('bad_request') });

        const conv = conversations.open(typeof request.conversationId === 'string' ? request.conversationId : undefined);
        if ('code' in conv) return send({ type: 'notPossible', reason: conv });
        conversationId = conv.id;
        // A second request on a conversation cancels the first.
        conversations.cancelRunning(conv.id);
        conversations.setRunning(conv.id, runController);
        send({ type: 'conversation', conversationId: conv.id, fresh: conv.fresh });
        if (conv.turns >= MAX_TURNS) {
          return send({ type: 'notPossible', reason: notPossible('bad_request', 'This conversation is long. Start a new search.') });
        }

        const deps = { search, quick };
        const fallBack = () => runKeyword(text, deps, send, runSignal);
        const apiKey = env.CLAUDE_API;
        if (!apiKey) {
          send({ type: 'notPossible', reason: notPossible('ai_unavailable') });
          return await fallBack();
        }
        const kept = await loop(getClient(apiKey), conv.messages, text, send, runSignal, fallBack);
        if (kept && !runSignal.aborted) conversations.commit(conv.id, kept);
      } catch {
        send({ type: 'notPossible', reason: notPossible('agent_failed') });
      } finally {
        if (conversationId) conversations.finishRunning(conversationId, runController);
        emit({ type: 'done' });
      }
    },
  };
}
