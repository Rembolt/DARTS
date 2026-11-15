import Anthropic from '@anthropic-ai/sdk';
import { NotPossibleError } from '../errors.js';
import { notPossible } from '../shared/contract.js';
import { JEV_PROMPT } from './jev-prompt.js';

const MODEL = 'claude-haiku-5-5';
const MAX_MESSAGES = 60;
const MAX_TOOLS = 12;

export const JEV_TOOL_NAMES = new Set([
  'measure',
  'compare',
  'set_material',
  'set_furnishing',
  'set_opening',
  'place_speaker',
  'move_speaker',
  'set_speaker',
  'remove_speaker',
  'move_user_to',
  'set_mesh_layer',
]);

const isPlainObject = (v: unknown): v is Record<string, unknown> =>
  typeof v === 'object' && v !== null && !Array.isArray(v);

type MessagesClient = {
  messages: {
    create(params: Record<string, unknown>): Promise<unknown>;
  };
};

export function validateJevBody(body: unknown): { messages: Anthropic.MessageParam[]; tools: Anthropic.ToolUnion[] } | null {
  if (!isPlainObject(body)) return null;
  if (!Array.isArray(body.messages) || body.messages.length < 1 || body.messages.length > MAX_MESSAGES) return null;
  const tools = body.tools === undefined ? [] : body.tools;
  if (!Array.isArray(tools) || tools.length > MAX_TOOLS) return null;
  for (const t of tools) {
    if (!isPlainObject(t) || typeof t.name !== 'string' || !JEV_TOOL_NAMES.has(t.name)) return null;
  }
  return {
    messages: body.messages as Anthropic.MessageParam[],
    tools: tools as Anthropic.ToolUnion[],
  };
}

/** Relay a Jev chat turn to Claude Haiku 5.5, enforcing tool allowlist and fixed server settings. */
export async function relayJev(
  deps: { env: Record<string, string | undefined>; client?: unknown },
  body: unknown,
): Promise<unknown> {
  const valid = validateJevBody(body);
  if (!valid) throw new NotPossibleError(notPossible('bad_request'));

  const key = deps.env.CLAUDE_API?.trim();
  const client = (deps.client as MessagesClient | undefined) ?? (key ? new Anthropic({ apiKey: key }) : undefined);
  if (!client) throw new NotPossibleError(notPossible('ai_unavailable'));

  try {
    return await client.messages.create({
      model: MODEL,
      max_tokens: 16000,
      thinking: { type: 'adaptive' },
      output_config: { effort: 'low' },
      tool_choice: { type: 'auto' },
      system: [{ type: 'text', text: JEV_PROMPT, cache_control: { type: 'ephemeral' } }],
      messages: valid.messages,
      tools: valid.tools,
    });
  } catch {
    throw new NotPossibleError(notPossible('agent_failed'));
  }
}
