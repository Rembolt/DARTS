import { describe, expect, it } from 'vitest';
import { NOT_POSSIBLE, type AgentEvent } from '../../../server/src/shared/contract';
import { UNREACHABLE } from '../api';
import { askAgent, parseSse } from './stream';

const enc = new TextEncoder();

/** A fake fetch whose response body streams the given chunks (strings or raw bytes). */
function streaming(chunks: (string | Uint8Array)[], init: { status?: number } = {}): { fetch: typeof fetch; calls: [string, RequestInit | undefined][] } {
  const calls: [string, RequestInit | undefined][] = [];
  const fake = (async (url: string, options?: RequestInit) => {
    calls.push([url, options]);
    const body = new ReadableStream<Uint8Array>({
      start(controller) {
        for (const c of chunks) controller.enqueue(typeof c === 'string' ? enc.encode(c) : c);
        controller.close();
      },
    });
    return new Response(body, { status: init.status ?? 200, headers: { 'Content-Type': 'text/event-stream' } });
  }) as unknown as typeof fetch;
  return { fetch: fake, calls };
}

async function collect(fetchFn: typeof fetch, signal?: AbortSignal): Promise<AgentEvent[]> {
  const events: AgentEvent[] = [];
  await askAgent({ text: 'hi' }, e => events.push(e), { fetch: fetchFn, signal });
  return events;
}

describe('parseSse', () => {
  it('parses whole events', () => expect(parseSse('data: {"type":"done"}\n\n', '').events).toEqual([{ type: 'done' }]));

  it('joins an event cut across two chunks', () => {
    const first = parseSse('data: {"type":"status","te', '');
    expect(first.events).toEqual([]);
    const second = parseSse('xt":"a"}\n\ndata: {"type":"done"}\n\n', first.carry);
    expect(second.events).toEqual([{ type: 'status', text: 'a' }, { type: 'done' }]);
    expect(second.carry).toBe('');
  });

  it('skips a malformed event without throwing', () => {
    const out = parseSse('data: {"type":\n\ndata: 5\n\n: comment\n\ndata: {"type":"done"}\n\n', '');
    expect(out.events).toEqual([{ type: 'done' }]);
  });

  it('accepts CRLF line endings', () => {
    expect(parseSse('data: {"type":"done"}\r\n\r\n', '').events).toEqual([{ type: 'done' }]);
  });
});

describe('askAgent', () => {
  it('delivers events in order', async () => {
    const { fetch, calls } = streaming([
      'data: {"type":"conversation","conversationId":"c1","fresh":true}\n\ndata: {"type":"sta',
      'tus","text":"Searching…"}\n\n',
      'data: {"type":"text","text":"Best fit"}\n\ndata: {"type":"done"}\n\n',
    ]);
    expect(await collect(fetch)).toEqual([
      { type: 'conversation', conversationId: 'c1', fresh: true },
      { type: 'status', text: 'Searching…' },
      { type: 'text', text: 'Best fit' },
      { type: 'done' },
    ]);
    expect(calls[0][0]).toBe('/api/agent');
    expect(calls[0][1]?.method).toBe('POST');
    expect(JSON.parse(String(calls[0][1]?.body))).toEqual({ text: 'hi' });
  });

  it('keeps a character split across chunks', async () => {
    const bytes = enc.encode('data: {"type":"status","text":"Checking…"}\n\ndata: {"type":"done"}\n\n');
    const cut = bytes.indexOf(0xe2) + 1; // inside the three bytes of '…'
    const { fetch } = streaming([bytes.slice(0, cut), bytes.slice(cut)]);
    expect((await collect(fetch))[0]).toEqual({ type: 'status', text: 'Checking…' });
  });

  it('turns an HTTP error into a not-possible event', async () => {
    const fake = (async () => new Response(JSON.stringify({ error: 'Text must be 1 to 500 characters.', code: 'bad_request', retry: false }), { status: 400 })) as unknown as typeof fetch;
    expect(await collect(fake)).toEqual([
      { type: 'notPossible', reason: { code: 'bad_request', message: 'Text must be 1 to 500 characters.', retry: false } },
      { type: 'done' },
    ]);
  });

  it('fills a missing retry flag from the table', async () => {
    const fake = (async () => new Response(JSON.stringify({ error: 'Try again in a moment.', code: 'busy' }), { status: 429 })) as unknown as typeof fetch;
    const events = await collect(fake);
    expect(events[0]).toEqual({ type: 'notPossible', reason: { code: 'busy', message: 'Try again in a moment.', retry: NOT_POSSIBLE.busy.retry } });
  });

  it('reports an unreachable server', async () => {
    const fake = (async () => { throw new TypeError('Failed to fetch'); }) as unknown as typeof fetch;
    expect(await collect(fake)).toEqual([
      { type: 'notPossible', reason: { code: 'ai_unavailable', message: UNREACHABLE, retry: true } },
      { type: 'done' },
    ]);
  });

  it('reports the dev proxy answering for a server that is down', async () => {
    const fake = (async () => new Response('', { status: 500 })) as unknown as typeof fetch;
    const events = await collect(fake);
    expect(events[0]).toMatchObject({ type: 'notPossible', reason: { code: 'ai_unavailable', message: UNREACHABLE } });
  });

  it('reports a stream that ends early', async () => {
    const { fetch } = streaming(['data: {"type":"status","text":"a"}\n\n']);
    expect(await collect(fetch)).toEqual([
      { type: 'status', text: 'a' },
      { type: 'notPossible', reason: { code: 'agent_failed', message: NOT_POSSIBLE.agent_failed.message, retry: true } },
      { type: 'done' },
    ]);
  });

  it('sends done only once', async () => {
    const { fetch } = streaming(['data: {"type":"done"}\n\ndata: {"type":"done"}\n\n']);
    expect(await collect(fetch)).toEqual([{ type: 'done' }]);
  });

  it('is silent after an abort', async () => {
    const controller = new AbortController();
    let pull!: ReadableStreamDefaultController<Uint8Array>;
    const fake = (async (_url: string, options?: RequestInit) => {
      const body = new ReadableStream<Uint8Array>({ start(c) { pull = c; } });
      options?.signal?.addEventListener('abort', () => pull.error(new DOMException('aborted', 'AbortError')));
      return new Response(body, { status: 200 });
    }) as unknown as typeof fetch;
    const events: AgentEvent[] = [];
    const run = askAgent({ text: 'hi' }, e => events.push(e), { fetch: fake, signal: controller.signal });
    await new Promise(r => setTimeout(r, 0));
    pull.enqueue(enc.encode('data: {"type":"status","text":"a"}\n\n'));
    await new Promise(r => setTimeout(r, 0));
    controller.abort();
    await expect(run).resolves.toBeUndefined();
    expect(events).toEqual([{ type: 'status', text: 'a' }]);
  });

  it('is silent when aborted before the server answers', async () => {
    const controller = new AbortController();
    controller.abort();
    const fake = (async (_url: string, options?: RequestInit) => {
      if (options?.signal?.aborted) throw new DOMException('aborted', 'AbortError');
      return new Response('', { status: 200 });
    }) as unknown as typeof fetch;
    expect(await collect(fake, controller.signal)).toEqual([]);
  });
});
