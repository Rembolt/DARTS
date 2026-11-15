// @vitest-environment jsdom
import { describe, expect, it, vi } from 'vitest';
import { NOT_POSSIBLE, notPossible, type QuickSummary, type RoomSummary } from '../../../server/src/shared/contract';
import { fmt, rankCards, renderCard } from './card';

type Ok = Extract<QuickSummary, { ok: true }>;

const ROOM: RoomSummary = {
  id: 'r2', name: 'Bedroom 2', floor: 'f7x2opaque', area: 14.2, volume: 36.1, heightAssumed: false,
  echo: [0.41, 0.32, 0.28], echoWord: 'controlled', roomGainDb: 3.1,
  flags: ['interior room'], outsideDb: 28.4, escapeDb: 41.2, score: 0.82,
};
const OK: Ok = {
  ok: true, modelId: 'aaaaaaaaaaa', name: null, address: '1234 Oak St', kind: 'home',
  listing: { sqft: 1850, beds: 3, baths: 2, price: 450000, propertyType: 'Single Family', toursOnProperty: 1, buildingName: null },
  canEnter: true, enterReason: null, score: 0.82, bestRoomId: 'r2',
  requirements: {
    profile: 'recording', echoMid: [0.2, 0.4], maxOutsideDb: 30, maxEscapeDb: 45, minRoomArea: 9, avoidBoomyBass: true,
    weights: { echo: 1, outside: 1, escape: 1, size: 1, bass: 1 },
  },
  area: { areaClass: 'residential', source: 'vexcel', counts: {}, located: [], roadBearingDeg: null, facadeDb: 50, imageryDate: '2025-01-01' },
  rooms: [
    { ...ROOM, id: 'r1', name: 'Living Room', score: 0.6, flags: ['boomy bass'], heightAssumed: true, outsideDb: null, escapeDb: null },
    ROOM,
  ],
  skippedRooms: 0, assumptions: ['heights assumed for 1 of 2 rooms', 'materials suggested from room names, not measured'],
};
const FAILED: QuickSummary = { ok: false, modelId: 'bbbbbbbbbbb', address: '500 Main St', reason: notPossible('no_room_data') };
const OPTS = { highlighted: false, onEnter: () => {} };

const text = (el: HTMLElement) => (el.textContent ?? '').replace(/\s+/g, ' ');

describe('renderCard', () => {
  it('shows the headline numbers as estimates', () => {
    const t = text(renderCard(OK, OPTS));
    expect(t).toContain('1234 Oak St · Home · 1,850 sqft');
    expect(t).toContain('fit 82%');
    expect(t).toContain('Best room: Bedroom 2 · echo 0.32 s (controlled)');
    expect(t).toContain('Outside noise inside: 28 dB · Escaping: 41 dB');
    expect(t).toContain('Area: residential · no highway within 300 m');
    expect(t).toContain('Estimated.');
    expect(t).toContain('Heights assumed for 1 of 2 rooms');
  });

  it('never shows the raw floor id', () => {
    expect(text(renderCard(OK, OPTS))).not.toContain('f7x2opaque');
  });

  it('lists all rooms in a table, marking assumed heights', () => {
    const el = renderCard(OK, OPTS);
    const details = el.querySelector('details')!;
    expect(details.querySelector('summary')!.textContent).toBe('All rooms');
    const rows = details.querySelectorAll('tbody tr');
    expect(rows.length).toBe(2);
    expect(text(rows[0] as HTMLElement)).toContain('Living Room');
    expect(text(rows[0] as HTMLElement)).toContain('boomy bass (height assumed)');
    expect(text(details.querySelector('thead')!)).toContain('estimated');
  });

  it('names a highway with its distance', () => {
    const t = text(renderCard({ ...OK, area: { ...OK.area!, located: [{ kind: 'highway', distanceM: 182.4, bearingDeg: 90, levelDb: 64 }] } }, OPTS));
    expect(t).toContain('Area: residential · highway 182 m');
  });

  it('disables Listen inside with the reason', () => {
    const el = renderCard({ ...OK, canEnter: false, enterReason: notPossible('no_mesh') }, OPTS);
    const button = el.querySelector('button')!;
    expect(button.disabled).toBe(true);
    expect(button.title).toBe(NOT_POSSIBLE.no_mesh.message);
    expect(text(el)).toContain(NOT_POSSIBLE.no_mesh.message);
  });

  it('calls onEnter with the model id', () => {
    const onEnter = vi.fn();
    const button = renderCard(OK, { highlighted: false, onEnter }).querySelector('button')!;
    expect(button.textContent).toBe('Listen inside');
    button.click();
    expect(onEnter).toHaveBeenCalledWith('aaaaaaaaaaa');
  });

  it('shows why a property could not be analysed', () => {
    const el = renderCard(FAILED, OPTS);
    expect(text(el)).toContain('500 Main St');
    expect(text(el)).toContain('Not possible to analyse: this tour has no room data.');
    expect(el.querySelector('button')).toBeNull();
    expect(text(el)).not.toContain('%');
  });

  it('falls back to the model id when a failed card has no address', () => {
    expect(text(renderCard({ ...FAILED, address: null }, OPTS))).toContain('bbbbbbbbbbb');
  });

  it('marks assumed surroundings', () => {
    const t = text(renderCard({ ...OK, area: { ...OK.area!, source: 'property_type' } }, OPTS));
    expect(t).toMatch(/Area: residential.*\(assumed\)/);
    expect(t).not.toContain('no highway within 300 m');
  });

  it('says when the surroundings are unknown', () => {
    expect(text(renderCard({ ...OK, area: null }, OPTS))).toContain('Area: surroundings unknown');
  });

  it('says "price not listed" and "not estimated"', () => {
    const t = text(renderCard({ ...OK, listing: { ...OK.listing, price: null }, bestRoomId: 'r1' }, OPTS));
    expect(t).toContain('price not listed');
    expect(t).toContain('Outside noise inside: not estimated · Escaping: not estimated');
  });

  it('shows a building name but not a name that only repeats the address', () => {
    expect(text(renderCard({ ...OK, name: '1234 Oak St.' }, OPTS)).match(/1234 Oak St/g)).toHaveLength(1);
    expect(text(renderCard({ ...OK, name: 'The Oakwood Lofts' }, OPTS))).toContain('The Oakwood Lofts');
  });

  it('does not use the page header style for the card title', () => {
    expect(renderCard(OK, OPTS).querySelector('header')).toBeNull();
  });

  it('marks the card the assistant picked', () => {
    const el = renderCard(OK, { ...OPTS, highlighted: true });
    expect(el.classList.contains('highlighted')).toBe(true);
    expect(text(el)).toContain('Picked by the assistant');
  });

  it('does not render markup from data', () => {
    const el = renderCard({ ...OK, address: '<img src=x onerror=alert(1)>' }, OPTS);
    expect(el.querySelector('img')).toBeNull();
    expect(text(el)).toContain('<img src=x onerror=alert(1)>');
    const failed = renderCard({ ...FAILED, reason: { ...notPossible('agent_failed'), message: '<b>x</b>' } }, OPTS);
    expect(failed.querySelector('b')).toBeNull();
  });
});

describe('rankCards', () => {
  it('ranks ok cards by score and puts failures last, one per id', () => {
    const a = { ...OK, modelId: 'aaaaaaaaaaa', score: 0.5 };
    const b = { ...OK, modelId: 'ccccccccccc', score: 0.9 };
    const aLater = { ...a, score: 0.7 };
    const ranked = rankCards([FAILED, a, b, aLater]);
    expect(ranked.map(s => s.modelId)).toEqual(['ccccccccccc', 'aaaaaaaaaaa', 'bbbbbbbbbbb']);
    expect((ranked[1] as Ok).score).toBe(0.7);
  });

  it('lets a later failure replace an earlier success for the same id', () => {
    const ranked = rankCards([OK, { ...FAILED, modelId: OK.modelId }]);
    expect(ranked).toHaveLength(1);
    expect(ranked[0].ok).toBe(false);
  });
});

describe('fmt', () => {
  it('formats numbers', () => {
    expect(fmt.db(27.6)).toBe('28 dB');
    expect(fmt.db(null)).toBe('not estimated');
    expect(fmt.seconds(0.3)).toBe('0.30 s');
    expect(fmt.percent(0.996)).toBe('100%');
    expect(fmt.sqft(1850)).toBe('1,850 sqft');
    expect(fmt.price(450000)).toBe('$450,000');
    expect(fmt.price(null)).toBe('price not listed');
  });
});
