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
const DEFAULT_SOUNDS = ['music', 'speech', 'traffic', 'piano', 'fan', 'tv'];
const UNAVAILABLE_MSG = 'Jev is not available right now. The settings panel can do the same things.';
const REFUSAL_MSG = "I can't help with that request.";
const LIMIT_MSG = "I couldn't finish that.";

export async function ask(
  text: string,
  convo: MessageParam[],
  deps: {
    store: SceneStore;
    actions: Actions;
    effects: SceneEffects;
    fetch?: typeof fetch;
    onStep?(text: string): void;
  },
): Promise<{ reply: string; convo: MessageParam[] }> {
  const { store, actions, effects, onStep } = deps;
  const fetchFn = deps.fetch ?? fetch;
  const summary = sceneSummary(store.get(), effects);
  const nextConvo: MessageParam[] = [
    ...convo,
    { role: 'user', content: `${text}\n\nScene summary:\n${JSON.stringify(summary)}` },
  ];

  for (let i = 0; i < MAX_REQUESTS; i++) {
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
      });
      if (!res.ok) return { reply: UNAVAILABLE_MSG, convo };
      response = (await res.json()) as { stop_reason?: string; content?: ContentBlock[] };
    } catch {
      return { reply: UNAVAILABLE_MSG, convo };
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
      onStep?.(`Running ${call.name}…`);
      results.push(await execute(call, { store, actions, effects }));
    }
    nextConvo.push({ role: 'user', content: results });
  }

  return { reply: LIMIT_MSG, convo: nextConvo };
}
