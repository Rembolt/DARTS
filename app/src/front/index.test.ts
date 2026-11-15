// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { NOT_POSSIBLE, type Health, type QuickSummary } from '../../../server/src/shared/contract';
import { startFrontDoor } from './index';

const enc = new TextEncoder();
const HEALTHY: Health = { bundle: true, sdkKey: true, matterport: true, vexcel: true, claude: true, index: true };

const OK: QuickSummary = {
  ok: true, modelId: 'aaaaaaaaaaa', name: null, address: '1234 Oak St', kind: 'home',
  listing: { sqft: 1850, beds: 3, baths: 2, price: null, propertyType: 'Single Family', toursOnProperty: 1, buildingName: null },
  canEnter: true, enterReason: null, score: 0.82, bestRoomId: 'r2',
  requirements: {
    profile: 'recording', echoMid: [0.2, 0.4], maxOutsideDb: 30, maxEscapeDb: 45, minRoomArea: 9, avoidBoomyBass: true,
    weights: { echo: 1, outside: 1, escape: 1, size: 1, bass: 1 },
  },
  area: null,
  rooms: [{ id: 'r2', name: 'Bedroom 2', floor: 'f', area: 14, volume: 36, heightAssumed: false, echo: [0.4, 0.32, 0.3],
    echoWord: 'controlled', roomGainDb: 3, flags: [], outsideDb: 28, escapeDb: 41, score: 0.82 }],
  skippedRooms: 0, assumptions: [],
};

type Agent = { body: unknown; signal: AbortSignal | undefined; push(event: object): void; end(): void };

/** A fake server: /api/health answers `health`; each /api/agent call opens a stream the test drives. */
function server(health: Partial<Health> | 'down' = {}, agentStatus = 200, agentBody = '') {
  const agents: Agent[] = [];
  const fetchFn = (async (url: string, init?: RequestInit) => {
    if (url === '/api/health') {
      if (health === 'down') throw new TypeError('Failed to fetch');
      return new Response(JSON.stringify({ ...HEALTHY, ...health }), { status: 200 });
    }
    if (url === '/api/agent') {
      if (agentStatus !== 200) return new Response(agentBody, { status: agentStatus });
      let ctrl!: ReadableStreamDefaultController<Uint8Array>;
      const body = new ReadableStream<Uint8Array>({ start(c) { ctrl = c; } });
      init?.signal?.addEventListener('abort', () => { try { ctrl.error(new DOMException('aborted', 'AbortError')); } catch { /* closed */ } });
      agents.push({
        body: JSON.parse(String(init?.body)), signal: init?.signal ?? undefined,
        push: e => ctrl.enqueue(enc.encode(`data: ${JSON.stringify(e)}\n\n`)),
        end: () => ctrl.close(),
      });
      return new Response(body, { status: 200 });
    }
    return new Response('{}', { status: 404 });
  }) as unknown as typeof fetch;
  return { fetchFn, agents };
}

function memory(log: string[] = []): Storage & { data: Record<string, string> } {
  const data: Record<string, string> = {};
  return {
    data,
    getItem: (k: string) => (k in data ? data[k] : null),
    setItem: (k: string, v: string) => { log.push('save'); data[k] = v; },
    removeItem: (k: string) => { delete data[k]; },
    clear: () => {},
    key: () => null,
    get length() { return Object.keys(data).length; },
  };
}

let root: HTMLElement;
beforeEach(() => {
  root = document.createElement('main');
  document.body.replaceChildren(root);
});
afterEach(() => document.body.replaceChildren());

const q = <T extends Element = HTMLElement>(sel: string) => root.querySelector(sel) as T;
const textarea = () => q<HTMLTextAreaElement>('textarea');
const askButton = () => q<HTMLButtonElement>('button.fd-ask');
function type(text: string) {
  textarea().value = text;
  textarea().dispatchEvent(new Event('input', { bubbles: true }));
}
function enter(shiftKey = false) {
  textarea().dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', shiftKey, bubbles: true, cancelable: true }));
}

describe('the front door', () => {
  it('has a heading, a labelled box and the demo link', () => {
    const { fetchFn } = server();
    startFrontDoor(root, { fetch: fetchFn, storage: memory(), navigate: () => {} });
    expect(q('h1').textContent).toBe('Hear a place before you visit it');
    const label = q<HTMLLabelElement>('label');
    expect(label.htmlFor).toBe(textarea().id);
    expect(textarea().maxLength).toBe(500);
    expect(q('[aria-live="polite"]')).not.toBeNull();
    const link = Array.from(root.querySelectorAll('a')).find(a => a.textContent?.includes('Skip to the demo house'))!;
    expect(link.getAttribute('href')).toBe('/?m=Ki9YdfpNKum');
  });

  it('sends on Enter and shows Stop while running', async () => {
    const { fetchFn, agents } = server();
    startFrontDoor(root, { fetch: fetchFn, storage: memory(), navigate: () => {} });
    type('record music in Houston');
    enter(true); // Shift+Enter is a newline, not a send
    expect(agents).toHaveLength(0);
    enter();
    await vi.waitFor(() => expect(agents).toHaveLength(1));
    expect(agents[0].body).toEqual({ text: 'record music in Houston' });
    expect(askButton().textContent).toBe('Stop');
    agents[0].push({ type: 'conversation', conversationId: 'c1', fresh: true });
    agents[0].push({ type: 'status', text: 'Searching homes in Houston…' });
    agents[0].push({ type: 'text', text: 'Best fit: 1234 Oak St' });
    agents[0].push({ type: 'done' });
    await vi.waitFor(() => expect(askButton().textContent).toBe('Ask'));
    expect(q('[aria-live="polite"]').textContent).toContain('Searching homes in Houston…');
    expect(q('.fd-answer').textContent).toBe('Best fit: 1234 Oak St');
  });

  it('does not send an empty question', () => {
    const { fetchFn, agents } = server();
    startFrontDoor(root, { fetch: fetchFn, storage: memory(), navigate: () => {} });
    type('   ');
    enter();
    expect(agents).toHaveLength(0);
  });

  it('stops a running request', async () => {
    const { fetchFn, agents } = server();
    startFrontDoor(root, { fetch: fetchFn, storage: memory(), navigate: () => {} });
    type('quiet home');
    enter();
    await vi.waitFor(() => expect(agents).toHaveLength(1));
    askButton().click();
    expect(agents[0].signal?.aborted).toBe(true);
    expect(askButton().textContent).toBe('Ask');
  });

  it('cancels the running question when a new one is asked, and sends the conversation id', async () => {
    const { fetchFn, agents } = server();
    startFrontDoor(root, { fetch: fetchFn, storage: memory(), navigate: () => {} });
    type('first');
    enter();
    await vi.waitFor(() => expect(agents).toHaveLength(1));
    agents[0].push({ type: 'conversation', conversationId: 'c1', fresh: true });
    await vi.waitFor(() => expect(q('textarea')).not.toBeNull());
    await new Promise(r => setTimeout(r, 0));
    type('second');
    enter();
    await vi.waitFor(() => expect(agents).toHaveLength(2));
    expect(agents[0].signal?.aborted).toBe(true);
    expect(agents[1].body).toEqual({ conversationId: 'c1', text: 'second' });
  });

  it('shows a not-possible message in an alert', async () => {
    const { fetchFn } = server({}, 503, JSON.stringify({ error: 'AI assistant not available.', code: 'ai_unavailable', retry: false }));
    startFrontDoor(root, { fetch: fetchFn, storage: memory(), navigate: () => {} });
    type('hello');
    enter();
    await vi.waitFor(() => expect(q('[role="alert"]').textContent).toContain('AI assistant not available.'));
    expect(q('[role="alert"]').hidden).toBe(false);
  });

  it('shows a health line when the index is missing', async () => {
    const { fetchFn } = server({ index: false, claude: false });
    startFrontDoor(root, { fetch: fetchFn, storage: memory(), navigate: () => {} });
    await vi.waitFor(() => expect(q('.fd-health').textContent).toContain(NOT_POSSIBLE.index_missing.message));
    expect(q('.fd-health').textContent).toContain('AI assistant not available: showing a keyword search');
    expect(q('.fd-health').textContent).not.toContain(NOT_POSSIBLE.bundle_missing.message);
  });

  it('shows a line when the server does not answer the health check', async () => {
    const { fetchFn } = server('down');
    startFrontDoor(root, { fetch: fetchFn, storage: memory(), navigate: () => {} });
    await vi.waitFor(() => expect(q('.fd-health').textContent).toContain('Server not reachable'));
  });

  it('navigates to the tour from a card, saving first', async () => {
    const log: string[] = [];
    const { fetchFn, agents } = server();
    const storage = memory(log);
    startFrontDoor(root, { fetch: fetchFn, storage, navigate: url => log.push(`go ${url}`) });
    type('record');
    enter();
    await vi.waitFor(() => expect(agents).toHaveLength(1));
    agents[0].push({ type: 'cards', summaries: [OK] });
    agents[0].push({ type: 'open', modelId: 'aaaaaaaaaaa', reason: 'best fit' });
    agents[0].push({ type: 'done' });
    await vi.waitFor(() => expect(root.querySelector('.fd-card.highlighted')).not.toBeNull());
    log.length = 0;
    q<HTMLButtonElement>('.fd-enter').click();
    expect(log).toEqual(['save', 'go /?m=aaaaaaaaaaa']);
    expect(JSON.parse(storage.data['front:v1']).summaries[0].modelId).toBe('aaaaaaaaaaa');
  });

  it('restores the last run on return from a tour', () => {
    const storage = memory();
    storage.data['front:v1'] = JSON.stringify({
      conversationId: 'c1', question: 'record', statusLines: ['Checking…'], answer: 'Best fit', notPossible: [],
      summaries: [OK], highlighted: null, running: true, staleCards: false,
    });
    const { fetchFn } = server();
    startFrontDoor(root, { fetch: fetchFn, storage, navigate: () => {} });
    expect(textarea().value).toBe('record');
    expect(q('.fd-answer').textContent).toBe('Best fit');
    expect(root.querySelectorAll('.fd-card')).toHaveLength(1);
    expect(askButton().textContent).toBe('Ask');
  });

  it('puts server text on the page as text', async () => {
    const { fetchFn, agents } = server();
    startFrontDoor(root, { fetch: fetchFn, storage: memory(), navigate: () => {} });
    type('x');
    enter();
    await vi.waitFor(() => expect(agents).toHaveLength(1));
    agents[0].push({ type: 'status', text: '<img src=x>' });
    agents[0].push({ type: 'text', text: '<b>bold</b>' });
    agents[0].push({ type: 'done' });
    await vi.waitFor(() => expect(askButton().textContent).toBe('Ask'));
    expect(root.querySelector('img')).toBeNull();
    expect(root.querySelector('.fd-answer b')).toBeNull();
  });
});
