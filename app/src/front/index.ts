import { DEMO_MODEL_ID, NOT_POSSIBLE, type AgentEvent, type Health, type QuickSummary } from '../../../server/src/shared/contract';
import { getJson, type NotPossibleError } from '../api';
import { tourUrl } from '../route';
import { rankCards, renderCard } from './card';
import { askAgent } from './stream';
import { load, reduce, save, type FrontAction, type FrontState } from './state';
import './front.css';

/** What the page talks to. `main.ts` passes none; tests pass fakes (jsdom's `location.assign` can't be spied on). */
export type FrontDeps = { fetch?: typeof fetch; storage?: Storage; navigate?: (url: string) => void };

const MAX_TEXT = 500;

function el<K extends keyof HTMLElementTagNameMap>(tag: K, className?: string, text?: string): HTMLElementTagNameMap[K] {
  const node = document.createElement(tag);
  if (className) node.className = className;
  if (text !== undefined) node.textContent = text;
  return node;
}

/** One line per missing piece, saying what still works (spec 7.5). */
export function healthLines(h: Partial<Health>): string[] {
  const lines: string[] = [];
  if (h.bundle === false) lines.push(NOT_POSSIBLE.bundle_missing.message);
  if (h.sdkKey === false || h.matterport === false) lines.push(NOT_POSSIBLE.server_not_configured.message);
  if (h.index === false) lines.push(NOT_POSSIBLE.index_missing.message);
  if (h.claude === false) lines.push('AI assistant not available: showing a keyword search');
  if (h.vexcel === false) lines.push('Surroundings not available: outside sounds will be assumed from the property type');
  return lines;
}

/** The front door (spec 7.5): ask for a place by how it should sound, see the cards, go inside one. */
export function startFrontDoor(root: HTMLElement, deps: FrontDeps = {}): void {
  const fetchFn = deps.fetch ?? ((input, init) => fetch(input, init));
  const storage = deps.storage;
  const navigate = deps.navigate ?? ((url: string) => location.assign(url));

  let state: FrontState = load(storage);
  let controller: AbortController | null = null;
  let runToken = 0;

  root.classList.add('fd');

  const heading = el('h1', undefined, 'Hear a place before you visit it');
  const intro = el('p', 'fd-intro', 'Say what you need a place for. Every number you see is an estimate from the 3D tour, not a measurement.');
  const health = el('ul', 'fd-health');
  health.hidden = true;

  const form = el('form', 'fd-form');
  const label = el('label', undefined, 'What should the place be good for?');
  label.htmlFor = 'fd-question';
  const box = el('textarea');
  box.id = 'fd-question';
  box.maxLength = MAX_TEXT;
  box.rows = 2;
  box.placeholder = 'I want a place in Houston to record music';
  box.value = state.question;
  const button = el('button', 'fd-ask', 'Ask');
  button.type = 'submit';
  const row = el('div', 'fd-row');
  row.append(box, button);
  const hint = el('p', 'fd-hint', 'Enter sends. Shift+Enter starts a new line.');
  form.append(label, row, hint);

  const statusList = el('ul', 'fd-status');
  statusList.setAttribute('aria-live', 'polite');
  const answer = el('p', 'fd-answer');
  const alertBox = el('div', 'fd-alert');
  alertBox.setAttribute('role', 'alert');
  const cards = el('section', 'fd-cards');
  cards.setAttribute('aria-label', 'Properties');

  const skip = el('a', 'fd-skip', 'Skip to the demo house →');
  skip.href = tourUrl(DEMO_MODEL_ID);
  const foot = el('p', 'fd-foot');
  foot.append(skip);

  const inner = el('div', 'fd-inner');
  inner.append(heading, intro, health, form, statusList, alertBox, answer, cards, foot);
  root.replaceChildren(inner);

  // What is on screen, so a render only touches what changed (status lines append; cards rebuild only on change).
  let shownStatus: string[] = [];
  let shownSummaries: QuickSummary[] | null = null;
  let shownHighlight: string | null | undefined;

  function enter(modelId: string): void {
    stop(); // a run still going would otherwise come back from the back/forward cache showing Stop
    save(state, storage);
    navigate(tourUrl(modelId));
  }

  function render(): void {
    button.textContent = state.running ? 'Stop' : 'Ask';
    form.setAttribute('aria-busy', String(state.running));

    if (state.statusLines !== shownStatus) {
      const extends_ = state.statusLines.length >= shownStatus.length && shownStatus.every((s, i) => state.statusLines[i] === s);
      if (!extends_) statusList.replaceChildren();
      for (const line of state.statusLines.slice(extends_ ? shownStatus.length : 0)) statusList.append(el('li', undefined, line));
      shownStatus = state.statusLines;
    }

    answer.textContent = state.answer;
    answer.hidden = state.answer === '';

    alertBox.replaceChildren(...state.notPossible.map(r => el('p', undefined, r.message)));
    alertBox.hidden = state.notPossible.length === 0;

    if (state.summaries !== shownSummaries || state.highlighted !== shownHighlight) {
      cards.replaceChildren(
        ...rankCards(state.summaries).map(s => renderCard(s, { highlighted: s.modelId === state.highlighted, onEnter: enter })),
      );
      shownSummaries = state.summaries;
      shownHighlight = state.highlighted;
    }
  }

  function apply(action: FrontAction): void {
    state = reduce(state, action);
    render();
  }

  function stop(): void {
    runToken++;
    controller?.abort();
    controller = null;
    if (state.running) {
      apply({ type: 'stop' });
      save(state, storage);
    }
  }

  function ask(): void {
    const text = box.value.trim().slice(0, MAX_TEXT);
    if (!text) return;
    stop();
    const token = ++runToken;
    const current = new AbortController();
    controller = current;
    const conversationId = state.conversationId;
    apply({ type: 'ask', text });
    const onEvent = (event: AgentEvent) => {
      if (token !== runToken) return; // a late event from a run that was stopped or replaced
      apply(event);
      if (event.type === 'done') {
        controller = null;
        save(state, storage);
      }
    };
    void askAgent(conversationId ? { conversationId, text } : { text }, onEvent, { fetch: fetchFn, signal: current.signal });
  }

  form.addEventListener('submit', e => {
    e.preventDefault();
    if (state.running) stop();
    else ask();
  });
  box.addEventListener('keydown', e => {
    if (e.key !== 'Enter' || e.shiftKey || e.isComposing) return;
    e.preventDefault();
    ask(); // a new question cancels the running one
  });
  window.addEventListener('pagehide', stop);

  render();

  getJson<Health>('/api/health', fetchFn).then(
    h => showHealth(healthLines(h)),
    (err: unknown) => {
      const message = (err as Partial<NotPossibleError>)?.reason?.message;
      showHealth([typeof message === 'string' && message ? message : 'Server not reachable.']);
    },
  );

  function showHealth(lines: string[]): void {
    health.replaceChildren(...lines.map(line => el('li', undefined, line)));
    health.hidden = lines.length === 0;
  }
}
