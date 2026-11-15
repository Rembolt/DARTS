import type { QuickSummary, RoomSummary } from '../../../server/src/shared/contract';
import { fmt, kindWord, sentence } from './format';

export { fmt } from './format';

type Ok = Extract<QuickSummary, { ok: true }>;

/** A small element builder. Text always goes in through `textContent`, never as markup. */
function el<K extends keyof HTMLElementTagNameMap>(tag: K, className?: string, text?: string): HTMLElementTagNameMap[K] {
  const node = document.createElement(tag);
  if (className) node.className = className;
  if (text !== undefined) node.textContent = text;
  return node;
}

/** A room's flags, with "(height assumed)" after a boomy-bass flag that rests on an assumed height. */
function flagWords(room: RoomSummary): string[] {
  const words = room.flags.map(f => (f === 'boomy bass' && room.heightAssumed ? 'boomy bass (height assumed)' : f));
  if (room.heightAssumed && !room.flags.includes('boomy bass')) words.push('height assumed');
  return words;
}

function roomsTable(summary: Ok): HTMLDetailsElement {
  const details = el('details', 'fd-rooms');
  details.append(el('summary', undefined, 'All rooms'));
  const wrap = el('div', 'fd-table-wrap');
  const table = el('table');
  const head = el('tr');
  for (const h of ['Room', 'Area (m², estimated)', 'Echo (s, estimated)', 'Sound', 'Outside noise inside', 'Escaping', 'Fit', 'Notes']) {
    const th = el('th', undefined, h);
    th.scope = 'col';
    head.append(th);
  }
  const thead = el('thead');
  thead.append(head);
  const tbody = el('tbody');
  for (const room of summary.rooms) {
    const tr = el('tr');
    const name = el('th', undefined, room.name);
    name.scope = 'row';
    tr.append(
      name,
      el('td', 'num', room.area.toFixed(1)),
      el('td', 'num', room.echo[1].toFixed(2)),
      el('td', undefined, room.echoWord),
      el('td', 'num', fmt.db(room.outsideDb)),
      el('td', 'num', fmt.db(room.escapeDb)),
      el('td', 'num', fmt.percent(room.score)),
      el('td', undefined, flagWords(room).join(', ')),
    );
    tbody.append(tr);
  }
  table.append(thead, tbody);
  wrap.append(table);
  details.append(wrap);
  return details;
}

function okCard(summary: Ok, options: { highlighted: boolean; onEnter(modelId: string): void }): HTMLElement {
  const card = el('article', 'fd-card');
  if (options.highlighted) card.classList.add('highlighted');

  const header = el('div', 'fd-card-head');
  const title = [summary.address, kindWord(summary.kind)];
  if (summary.listing.sqft !== null) title.push(fmt.sqft(summary.listing.sqft));
  header.append(el('h3', undefined, title.join(' · ')), el('span', 'fd-fit', `fit ${fmt.percent(summary.score)}`));
  card.append(header);
  if (options.highlighted) card.append(el('p', 'fd-picked', 'Picked by the assistant'));

  // The tour's name is often the street address again ('5506 Russett Dr'): show it only when it says something new.
  const name = summary.name ?? summary.listing.buildingName;
  const firstWord = (s: string) => s.trim().split(/\s+/)[0]?.toLowerCase() ?? '';
  if (name && firstWord(name) !== firstWord(summary.address)) card.append(el('p', 'fd-name', name));

  const facts: string[] = [];
  if (summary.listing.beds !== null) facts.push(`${summary.listing.beds} beds`);
  if (summary.listing.baths !== null) facts.push(`${summary.listing.baths} baths`);
  facts.push(fmt.price(summary.listing.price));
  card.append(el('p', 'fd-facts', facts.join(' · ')));

  const best = summary.rooms.find(r => r.id === summary.bestRoomId) ?? summary.rooms[0];
  if (best) {
    card.append(el('p', undefined, `Best room: ${best.name} · echo ${fmt.seconds(best.echo[1])} (${best.echoWord})`));
    const flags = flagWords(best);
    if (flags.length > 0) card.append(el('p', 'fd-flags', `Flags: ${flags.join(', ')}`));
    card.append(el('p', undefined, `Outside noise inside: ${fmt.db(best.outsideDb)} · Escaping: ${fmt.db(best.escapeDb)}`));
  }
  card.append(el('p', undefined, `Area: ${fmt.area(summary.area)}`));
  card.append(el('p', 'fd-estimated', ['Estimated.', ...summary.assumptions.map(sentence).filter(Boolean)].join(' ')));

  const footer = el('div', 'fd-card-foot');
  footer.append(roomsTable(summary));
  const button = el('button', 'fd-enter', 'Listen inside');
  button.type = 'button';
  if (!summary.canEnter) {
    button.disabled = true;
    const why = summary.enterReason?.message ?? 'Not possible to load this tour.';
    button.title = why;
    card.append(el('p', 'fd-reason', why));
  } else {
    button.addEventListener('click', () => options.onEnter(summary.modelId));
  }
  footer.append(button);
  card.append(footer);
  return card;
}

/** One property card (spec 7.5). A failed summary shows only where it is and why it could not be analysed. */
export function renderCard(summary: QuickSummary, options: { highlighted: boolean; onEnter(modelId: string): void }): HTMLElement {
  if (summary.ok) return okCard(summary, options);
  const card = el('article', 'fd-card failed');
  const header = el('div', 'fd-card-head');
  header.append(el('h3', undefined, summary.address ?? summary.modelId));
  card.append(header, el('p', 'fd-reason', summary.reason.message));
  return card;
}

/** One card per model id (the latest wins); analysed ones by score, highest first, then the failed ones in arrival order. */
export function rankCards(summaries: QuickSummary[]): QuickSummary[] {
  const latest = new Map<string, QuickSummary>();
  for (const s of summaries) {
    latest.delete(s.modelId);
    latest.set(s.modelId, s);
  }
  const all = [...latest.values()];
  const ok = all.filter((s): s is Ok => s.ok).sort((a, b) => b.score - a.score);
  return [...ok, ...all.filter(s => !s.ok)];
}
