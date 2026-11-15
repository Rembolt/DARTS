import '@fontsource-variable/hanken-grotesk';
import '../ui/styles.css'; // the tour's own tokens and chat styles: the front door is the same chat
import { CITY_VIEWS, DEMO_MODEL_ID, NOT_POSSIBLE, type AgentEvent, type City, type Health, type Place, type QuickSummary } from '../../../server/src/shared/contract';
import { getJson, type NotPossibleError } from '../api';
import { tourUrl } from '../route';
import { rankCards, renderCard } from './card';
import { ArrowUp, Check, Headphones, Loader2, MapPin, Square, icon } from './icons';
import { createCityMap, type Pin } from './map';
import { askAgent } from './stream';
import { EMPTY, load, reduce, save, type FrontAction, type FrontState } from './state';
import './front.css';

/** What the page talks to. `main.ts` passes none; tests pass fakes (jsdom's `location.assign` can't be spied on). */
export type FrontDeps = {
  fetch?: typeof fetch; storage?: Storage; navigate?: (url: string) => void;
  /** True when this load is the way back from a tour (back/forward). Only then is the last chat restored. Tests pass it. */
  returning?: boolean;
};

/** A refresh or a fresh visit starts clean; only the browser's Back from a tour brings the last chat back. */
function cameBack(): boolean {
  try {
    const nav = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming | undefined;
    return nav?.type === 'back_forward';
  } catch {
    return false;
  }
}

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

  let state: FrontState = (deps.returning ?? cameBack()) ? load(storage) : EMPTY;
  let controller: AbortController | null = null;
  let runToken = 0;

  root.classList.add('fd');

  // The name of the page sits in a corner: the first view is just the one line to type into.
  const heading = el('h1', undefined, 'Hear a place before you visit it');
  const brand = el('div', 'fd-brand');
  brand.append(icon(Headphones, 16), heading);

  const map = createCityMap({
    onCity: city => apply({ type: 'city', city }),
    onPin: id => {
      const card = cards.querySelector<HTMLElement>(`[data-id="${id}"]`);
      card?.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
      card?.focus({ preventScroll: true });
    },
    onHover: id => hover(id),
  });

  const cityRow = el('div', 'fd-cities');
  cityRow.setAttribute('role', 'group');
  cityRow.setAttribute('aria-label', 'City');
  const chips = CITY_VIEWS.map(view => {
    const chip = el('button', 'fd-chip');
    chip.type = 'button';
    chip.append(icon(MapPin, 14), el('span', undefined, view.name));
    chip.addEventListener('click', () => apply({ type: 'city', city: view.name }));
    return [view.name, chip] as const;
  });
  cityRow.append(...chips.map(([, chip]) => chip));
  const health = el('ul', 'fd-health');
  health.hidden = true;

  // The same composer as the tour's agent bar: a level meter, the box, a send button.
  const form = el('form', 'composer fd-form');
  const meter = el('span', 'bars');
  meter.setAttribute('aria-hidden', 'true');
  meter.append(el('i'), el('i'), el('i'), el('i'));
  const label = el('label', 'fd-sr', 'What should the place be good for?');
  label.htmlFor = 'fd-question';
  const box = el('textarea');
  box.id = 'fd-question';
  box.maxLength = MAX_TEXT;
  box.rows = 1;
  box.placeholder = 'A quiet place to record music';
  const button = el('button', 'send fd-ask');
  button.type = 'submit';
  const buttonLabel = el('span', 'fd-sr', 'Ask'); // the arrow says it; the word is for screen readers
  const askIcon = icon(ArrowUp, 15);
  const stopIcon = icon(Square, 12);
  stopIcon.hidden = true;
  button.append(askIcon, stopIcon, buttonLabel);
  const hint = el('p', 'fd-hint', 'Enter sends. Shift+Enter starts a new line. Every number is an estimate from the 3D tour, not a measurement.');
  // Once a city is picked it sits in the bar; clicking it goes back to choosing.
  const cityPill = el('button', 'fd-citypill');
  cityPill.type = 'button';
  cityPill.title = 'Choose another city';
  const cityPillText = el('span');
  cityPill.append(icon(MapPin, 13), cityPillText);
  cityPill.hidden = true;
  cityPill.addEventListener('click', () => apply({ type: 'city', city: null }));
  form.append(label, meter, cityPill, box, button);

  // The conversation: what you asked, the steps, the reply, then the places. Same bubbles as the tour's chat.
  const userMsg = el('p', 'msg user');
  const statusList = el('ul', 'fd-status');
  statusList.setAttribute('aria-live', 'polite');
  // What the assistant did: one line while it works, "Checked 8 properties" after, the steps a click away.
  const steps = el('details', 'fd-steps');
  const stepsLine = el('summary');
  steps.append(stepsLine, statusList);
  steps.hidden = true;
  const answer = el('p', 'msg jev fd-answer');
  const alertBox = el('div', 'fd-alert');
  alertBox.setAttribute('role', 'alert');
  const cards = el('section', 'fd-cards');
  // Properties with no room data fold into one line instead of a red card each.
  const leftOut = el('details', 'fd-leftout');
  const leftOutLine = el('summary');
  const leftOutCards = el('div', 'fd-cards');
  leftOut.append(leftOutLine, leftOutCards);
  leftOut.hidden = true;
  cards.setAttribute('aria-label', 'Properties');

  const skip = el('a', 'fd-skip', 'Skip to the demo house →');
  skip.href = tourUrl(DEMO_MODEL_ID);
  const foot = el('p', 'fd-foot');
  foot.append(skip);

  const head = el('div', 'fd-head');
  head.append(cityRow, health);
  const log = el('div', 'fd-log');
  log.setAttribute('role', 'log');
  log.append(userMsg, steps, alertBox, answer, cards, leftOut);
  log.hidden = true;
  const center = el('main', 'card fd-center');
  center.append(head, log, form, hint, foot);
  root.replaceChildren(map.el, brand, center);

  // What is on screen, so a render only touches what changed (status lines append; cards rebuild only on change).
  let shownStatus: string[] = [];
  let shownSummaries: QuickSummary[] | null = null;
  let shownHighlight: string | null | undefined;
  let shownCity: City | null | undefined;
  let shownFocus: FrontState['focus'] | undefined;
  const places = new Map<string, Place | null>(); // null: asked for, not in the index
  const asked = new Set<string>();
  let hoveredCard: string | null = null;

  /** One card and its pin light up together, from either side. */
  function hover(id: string | null): void {
    hoveredCard = id;
    map.setHover(id);
    for (const c of cards.querySelectorAll<HTMLElement>('.fd-card')) c.classList.toggle('linked', c.dataset.id === id);
  }

  function pinsFor(city: City | null): Pin[] {
    const out: Pin[] = [];
    for (const s of rankCards(state.summaries)) {
      const place = places.get(s.modelId);
      if (!s.ok || !place || place.city !== city) continue;
      out.push({
        modelId: s.modelId, lat: place.lat, lon: place.lon,
        label: `${Math.round(s.score * 100)}% fit · ${place.address}`, highlighted: s.modelId === state.highlighted,
      });
    }
    return out;
  }

  /** Where the results are: ask the server once per property, then draw them on the map. */
  function loadPlaces(): void {
    const missing = state.summaries.filter(s => s.ok && !places.has(s.modelId) && !asked.has(s.modelId)).map(s => s.modelId);
    if (missing.length === 0) return;
    for (const id of missing) asked.add(id);
    getJson<Place[]>(`/api/places?ids=${missing.join(',')}`, fetchFn).then(
      found => {
        for (const id of missing) places.set(id, found.find(p => p.modelId === id) ?? null);
        // Results in a city other than the one on the map: follow them, so the pins are where you are looking.
        const first = rankCards(state.summaries).map(s => places.get(s.modelId)).find((p): p is Place => !!p);
        if (first && !pinsFor(state.city).length) apply({ type: 'city', city: first.city });
        else paintMap();
      },
      () => {
        for (const id of missing) asked.delete(id); // the map is a bonus: the cards stand without it
      },
    );
  }

  function paintMap(): void {
    map.set({ city: state.city, pins: pinsFor(state.city), focus: state.focus });
    map.setHover(hoveredCard);
  }

  function enter(modelId: string): void {
    stop(); // a run still going would otherwise come back from the back/forward cache showing Stop
    save(state, storage);
    navigate(tourUrl(modelId));
  }

  function render(): void {
    buttonLabel.textContent = state.running ? 'Stop' : 'Ask';
    button.setAttribute('aria-label', state.running ? 'Stop' : 'Ask');
    cityPill.hidden = state.city === null;
    cityPillText.textContent = state.city ?? '';
    box.placeholder = state.question ? 'Ask a follow-up' : state.city ? `What should a place in ${state.city} be good for?` : 'Pick a city, or just ask: a silent office in Houston';

    steps.hidden = state.statusLines.length === 0;
    const checked = state.statusLines.filter(l => l.startsWith('Checking')).length || state.statusLines.length;
    stepsLine.replaceChildren(
      state.running ? icon(Loader2, 13) : icon(Check, 13),
      el('span', undefined, state.running ? (state.statusLines[state.statusLines.length - 1] ?? '') : `Checked ${checked} ${checked === 1 ? 'step' : 'steps'}`),
    );
    stepsLine.classList.toggle('running', state.running);
    askIcon.hidden = state.running;
    stopIcon.hidden = !state.running;
    meter.className = `bars${state.running ? ' is-thinking' : ''}`;
    userMsg.textContent = state.question;
    userMsg.hidden = state.question === '';
    const hasLog = state.question !== '' || state.summaries.length > 0 || state.notPossible.length > 0;
    log.hidden = !hasLog;
    root.classList.toggle('has-log', hasLog); // the chat slides left and the map takes the middle
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

    if (state.focus !== shownFocus) {
      shownFocus = state.focus;
      paintMap();
    }

    if (state.city !== shownCity) {
      for (const [name, chip] of chips) chip.setAttribute('aria-pressed', String(name === state.city));
      shownCity = state.city;
      paintMap();
    }

    if (state.summaries !== shownSummaries || state.highlighted !== shownHighlight) {
      const ranked = rankCards(state.summaries);
      const draw = (s: QuickSummary) => renderCard(s, { highlighted: s.modelId === state.highlighted, onEnter: enter });
      cards.replaceChildren(...ranked.filter(s => s.ok).map(draw));
      const failed = ranked.filter(s => !s.ok);
      leftOutCards.replaceChildren(...failed.map(draw));
      leftOut.hidden = failed.length === 0;
      leftOutLine.textContent = `${failed.length} left out: no room data to analyse`;
      const newCards = state.summaries !== shownSummaries;
      shownSummaries = state.summaries;
      shownHighlight = state.highlighted;
      if (newCards) loadPlaces();
      paintMap();
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
    let text = box.value.trim().slice(0, MAX_TEXT);
    if (!text) return;
    // The city on the map is part of the question, unless the person already named a city.
    if (state.city && !/houston|los angeles|\bLA\b/i.test(text)) text = `${text} (in ${state.city})`.slice(0, MAX_TEXT);
    stop();
    box.value = ''; // the question is now a bubble in the chat
    box.style.height = '';
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

  cards.addEventListener('pointerover', e => hover((e.target as Element).closest<HTMLElement>('.fd-card')?.dataset.id ?? null));
  cards.addEventListener('pointerleave', () => hover(null));
  form.addEventListener('submit', e => {
    e.preventDefault();
    if (state.running) stop();
    else ask();
  });
  box.addEventListener('input', () => {
    box.style.height = 'auto';
    box.style.height = `${Math.min(box.scrollHeight, 120)}px`;
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
