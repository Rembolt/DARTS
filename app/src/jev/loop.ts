import type { Actions, SceneEffects } from '../scene/actions';
import type { SceneStore } from '../scene/store';
import { execute, type ToolResultBlock } from './executor';
import { sceneSummary } from './summary';
import { toolsFor } from './tools';

export type ContentBlock =
  | { type: 'text'; text: string }
  | { type: 'tool_use'; id: string; name: string; input: unknown }
  | ToolResultBlock
  | { type: string; [key: string]: unknown };

export type MessageParam = {
  role: 'user' | 'assistant';
  content: string | ContentBlock[];
};

const MAX_REQUESTS = 8;
// The ids of SOUND_LIBRARY (ui/store.ts): the only sounds place_speaker and set_speaker accept.
const DEFAULT_SOUNDS = ['music', 'speaking', 'conversation', 'highway', 'city_ambience', 'nature_ambience', 'train', 'plane'];
const UNAVAILABLE_MSG = 'The assistant is not available right now. The settings panel can do the same things.';
const REFUSAL_MSG = "I can't help with that request.";
const LIMIT_MSG = "I couldn't finish that.";
const STOPPED_MSG = 'Stopped.';

/** The tools that change the scene. The prompt tells the model to ask first; `ask` below makes sure it did. */
const CHANGING_TOOLS = new Set(['set_material', 'set_furnishing', 'set_opening', 'place_speaker', 'move_speaker', 'set_speaker', 'remove_speaker', 'move_user_to', 'set_mesh_layer']);
const CONFIRM_TOKEN = '[[confirm]]';
const NOT_CONFIRMED = `Not done: the user has not been asked yet. Reply in one or two lines saying exactly what you would change, ask them to confirm, and end with ${CONFIRM_TOKEN} on its own last line. Call the tool only after they say yes.`;

/** True when the assistant's last message asked something (the confirm token, or a question): the user's reply to it can be a yes. */
export function askedLast(convo: MessageParam[]): boolean {
  for (let i = convo.length - 1; i >= 0; i--) {
    const m = convo[i];
    if (m.role !== 'assistant') continue;
    const text = typeof m.content === 'string' ? m.content
      : m.content.filter((b): b is { type: 'text'; text: string } => b.type === 'text' && typeof (b as { text?: unknown }).text === 'string').map(b => b.text).join('\n');
    if (!text.trim()) continue; // a tool-only message: look at the one before
    return text.includes(CONFIRM_TOKEN) || text.includes('?');
  }
  return false;
}

const SUMMARY_MARK = '\n\nScene summary:\n';
/** The server takes at most 60 messages and 256 kB. One turn can add 17 messages, so the history going in stays well under both. */
export const MAX_HISTORY_MESSAGES = 40;
export const MAX_HISTORY_CHARS = 120_000;

/**
 * The earlier conversation, made small enough to send again: old scene summaries are dropped (each turn brings a
 * fresh one), and the oldest turns go when it is still too long. The cut is always at a typed question, so no tool
 * result is ever left without the call it answers.
 */
export function trimConvo(convo: MessageParam[]): MessageParam[] {
  const slim = convo.map(m => {
    if (m.role === 'assistant' && Array.isArray(m.content)) {
      // A thinking block is signed against the exact conversation before it. This function changes that conversation
      // (summaries dropped, old turns cut), so the API would refuse the block: finished turns go back without them.
      const kept = m.content.filter(b => b.type !== 'thinking' && b.type !== 'redacted_thinking');
      return kept.length > 0 && kept.length < m.content.length ? { ...m, content: kept } : m;
    }
    if (m.role !== 'user' || typeof m.content !== 'string') return m;
    const at = m.content.indexOf(SUMMARY_MARK);
    return at < 0 ? m : { ...m, content: m.content.slice(0, at) };
  });
  const turnStarts = slim.flatMap((m, i) => (m.role === 'user' && typeof m.content === 'string' ? [i] : []));
  const fits = (from: number) =>
    slim.length - from <= MAX_HISTORY_MESSAGES && JSON.stringify(slim.slice(from)).length <= MAX_HISTORY_CHARS;
  if (fits(0)) return slim;
  const start = turnStarts.find(i => i > 0 && fits(i));
  return start === undefined ? [] : slim.slice(start);
}

export async function ask(
  text: string,
  convo: MessageParam[],
  deps: {
    store: SceneStore;
    actions: Actions;
    effects: SceneEffects;
    fetch?: typeof fetch;
    /** Aborting stops the turn: no more requests or tool calls, and the conversation goes back to how it was. */
    signal?: AbortSignal;
    onStep?(text: string): void;
  },
): Promise<{ reply: string; convo: MessageParam[] }> {
  const { store, actions, effects, onStep } = deps;
  const fetchFn = deps.fetch ?? fetch;
  const summary = sceneSummary(store.get(), effects);
  const nextConvo: MessageParam[] = [
    ...trimConvo(convo),
    { role: 'user', content: `${text}${SUMMARY_MARK}${JSON.stringify(summary)}` },
  ];

  const { signal } = deps;
  // A change runs only as the answer to a question the assistant asked: a request out of the blue is asked about first.
  const confirmed = askedLast(convo);
  for (let i = 0; i < MAX_REQUESTS; i++) {
    if (signal?.aborted) return { reply: STOPPED_MSG, convo };
    const scene = store.get();
    const soundSet = new Set([...DEFAULT_SOUNDS, ...scene.sources.map(s => s.sound)]);
    const tools = toolsFor(scene.permissions, {
      sounds: [...soundSet],
      rooms: effects.rooms().map(r => r.name),
      layers: effects.layers().map(l => l.id),
    });

    let response: { stop_reason?: string; content?: ContentBlock[] };
    try {
      const res = await fetchFn('/api/jev', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: nextConvo, tools }),
        signal,
      });
      if (!res.ok) return { reply: UNAVAILABLE_MSG, convo };
      response = (await res.json()) as { stop_reason?: string; content?: ContentBlock[] };
    } catch {
      return { reply: signal?.aborted ? STOPPED_MSG : UNAVAILABLE_MSG, convo };
    }

    if (response.stop_reason === 'refusal') {
      return { reply: REFUSAL_MSG, convo: nextConvo };
    }

    const content = Array.isArray(response.content) ? response.content : [];
    nextConvo.push({ role: 'assistant', content });

    const toolUses = content.filter(
      (b): b is { type: 'tool_use'; id: string; name: string; input: unknown } => b.type === 'tool_use',
    );
    if (toolUses.length === 0 || response.stop_reason === 'end_turn') {
      const reply = content
        .filter((b): b is { type: 'text'; text: string } => b.type === 'text' && typeof b.text === 'string')
        .map(b => b.text)
        .join('\n')
        .trim();
      return { reply: reply || LIMIT_MSG, convo: nextConvo };
    }

    const results: ToolResultBlock[] = [];
    for (const call of toolUses) {
      if (signal?.aborted) return { reply: STOPPED_MSG, convo };
      if (CHANGING_TOOLS.has(call.name) && !confirmed) {
        results.push({ type: 'tool_result', tool_use_id: call.id, content: NOT_CONFIRMED, is_error: true });
        continue;
      }
      onStep?.(`Running ${call.name}…`);
      results.push(await execute(call, { store, actions, effects }));
    }
    nextConvo.push({ role: 'user', content: results });
  }

  return { reply: LIMIT_MSG, convo: nextConvo };
}
