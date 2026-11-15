import { NOT_POSSIBLE, notPossible, type AgentEvent, type AgentRequest, type NotPossible, type NotPossibleCode } from '../../../server/src/shared/contract';
import { UNREACHABLE } from '../api';

const EVENT_TYPES = new Set<string>(['conversation', 'status', 'cards', 'text', 'open', 'placeSound', 'mapFocus', 'notPossible', 'done']);

function toEvent(frame: string): AgentEvent | null {
  const data = frame
    .split('\n')
    .filter(line => line.startsWith('data:'))
    .map(line => line.slice(line.startsWith('data: ') ? 6 : 5))
    .join('\n');
  if (!data) return null;
  try {
    const value: unknown = JSON.parse(data);
    if (typeof value !== 'object' || value === null) return null;
    const type = (value as { type?: unknown }).type;
    return typeof type === 'string' && EVENT_TYPES.has(type) ? (value as AgentEvent) : null;
  } catch {
    return null;
  }
}

/**
 * Split Server-Sent Events text into events. `carry` is the unfinished tail of the previous chunk; the returned
 * `carry` goes into the next call. A frame that is not a known event (bad JSON, a comment) is skipped.
 */
export function parseSse(chunk: string, carry: string): { events: AgentEvent[]; carry: string } {
  const frames = (carry + chunk).replace(/\r\n?/g, '\n').split('\n\n');
  const rest = frames.pop() ?? '';
  const events: AgentEvent[] = [];
  for (const frame of frames) {
    const event = toEvent(frame);
    if (event) events.push(event);
  }
  return { events, carry: rest };
}

/** The dev proxy's answer when our server is down (as `api.ts` reads it): an empty 500/503, or a 502/504. */
function proxyDown(status: number, text: string): boolean {
  if (status === 502 || status === 504) return true;
  return (status === 500 || status === 503) && text.trim() === '';
}

function isCode(code: unknown): code is NotPossibleCode {
  return typeof code === 'string' && Object.prototype.hasOwnProperty.call(NOT_POSSIBLE, code);
}

const unreachable = (): NotPossible => ({ code: 'ai_unavailable', message: UNREACHABLE, retry: true });

function reasonFromError(status: number, text: string): NotPossible {
  let body: unknown;
  try {
    body = JSON.parse(text);
  } catch {
    return proxyDown(status, text) ? unreachable() : { ...notPossible('agent_failed') };
  }
  const data = (typeof body === 'object' && body !== null ? body : {}) as { error?: unknown; code?: unknown; retry?: unknown };
  const code: NotPossibleCode = isCode(data.code) ? data.code : 'agent_failed';
  const message = typeof data.error === 'string' && data.error ? data.error : NOT_POSSIBLE[code].message;
  const retry = typeof data.retry === 'boolean' ? data.retry : NOT_POSSIBLE[code].retry;
  return { code, message, retry };
}

/**
 * Ask the agent (POST /api/agent) and hand each streamed event to `onEvent`. Always ends with exactly one `done`
 * unless aborted: an abort resolves quietly and delivers nothing more. Never rejects.
 */
export async function askAgent(
  request: AgentRequest,
  onEvent: (e: AgentEvent) => void,
  options: { fetch?: typeof fetch; signal?: AbortSignal } = {},
): Promise<void> {
  const fetchFn = options.fetch ?? fetch;
  const signal = options.signal;
  const aborted = () => signal?.aborted === true;
  let finished = false;
  const deliver = (e: AgentEvent) => {
    if (finished || aborted()) return;
    if (e.type === 'done') finished = true;
    onEvent(e);
  };
  const fail = (reason: NotPossible) => {
    deliver({ type: 'notPossible', reason });
    deliver({ type: 'done' });
  };

  let res: Response;
  try {
    res = await fetchFn('/api/agent', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Accept: 'text/event-stream' },
      body: JSON.stringify(request),
      signal,
    });
  } catch {
    if (!aborted()) fail(unreachable());
    return;
  }

  if (!res.ok || !res.body) {
    let text = '';
    try {
      text = await res.text();
    } catch {
      // the body broke off: treat as empty
    }
    if (!aborted()) fail(res.ok ? notPossible('agent_failed') : reasonFromError(res.status, text));
    return;
  }

  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  let carry = '';
  try {
    for (;;) {
      const { done, value } = await reader.read();
      if (aborted()) return;
      const text = done ? decoder.decode() : decoder.decode(value, { stream: true });
      const parsed = parseSse(done ? `${text}\n\n` : text, carry);
      carry = parsed.carry;
      for (const event of parsed.events) deliver(event);
      if (done) break;
    }
  } catch {
    if (aborted()) return;
  } finally {
    if (aborted()) reader.cancel().catch(() => {});
  }
  if (!finished) fail(notPossible('agent_failed'));
}
