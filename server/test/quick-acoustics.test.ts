import { describe, it, expect } from 'vitest';
import type { PiEdge, PiRoom } from '../src/quick/pi.js';
import {
  absorptionArea, boomyBass, compositeTl, criterion, echoWord, escapeDb, exteriorWalls, outsideInsideDb, perimeter,
  roomGainDb, sabine, scoreRoom,
} from '../src/quick/acoustics.js';
import type { Requirements, RoomSummary } from '../src/shared/contract.js';

const wall = (a: [number, number], b: [number, number], openings: PiEdge['openings'] = []): PiEdge =>
  ({ type: 'wall', a, b, thickness: 0.1, openings });

/** A closed rectangle of walls from (x0, y0) to (x1, y1). */
function box(x0: number, y0: number, x1: number, y1: number): PiEdge[] {
  return [wall([x0, y0], [x1, y0]), wall([x1, y0], [x1, y1]), wall([x1, y1], [x0, y1]), wall([x0, y1], [x0, y0])];
}

const ROOM: PiRoom = {
  id: 'r', label: '', classifications: [], floorId: 'f1', keywords: [],
  area: 20, width: 4, depth: 5, height: 2.5, lowerElevation: 0, edges: box(0, 0, 4, 5),
};

const REQ: Requirements = {
  profile: 'general', echoMid: [0.4, 0.8], maxOutsideDb: 45, maxEscapeDb: 40, minRoomArea: 10, avoidBoomyBass: true,
  weights: { echo: 0.3, outside: 0.3, escape: 0.1, size: 0.2, bass: 0.1 },
};
const SUMMARY: Omit<RoomSummary, 'score'> = {
  id: 'r', name: 'Bedroom', floor: 'f1', area: 20, volume: 50, heightAssumed: false,
  echo: [0.6, 0.6, 0.6], echoWord: 'lively', roomGainDb: 8, flags: [], outsideDb: 40, escapeDb: 35,
};

describe('acoustics formulas', () => {
  it('Sabine', () => {
    const A = absorptionArea([{ area: 20, alpha: 0.1 }, { area: 20, alpha: 0.1 }, { area: 48.6, alpha: 0.1 }], 0);
    expect(A).toBeCloseTo(8.86, 2);
    expect(sabine(54, A)).toBeCloseTo(0.981, 2);
  });
  it('caps absorption plus furnishing at 0.99', () => expect(absorptionArea([{ area: 10, alpha: 0.9 }], 0.3)).toBeCloseTo(9.9, 5));
  it('room gain', () => expect(roomGainDb(8.86, 88.6)).toBeCloseTo(7.86, 1));
  it('a window dominates the facade', () => expect(compositeTl([{ area: 9, tl: 40 }, { area: 1, tl: 25 }])).toBeCloseTo(33.91, 1));
  it('outside noise inside', () => expect(outsideInsideDb(60, 33.91, 10, 8.86)).toBeCloseTo(26.62, 1));
  it('sound escaping', () => expect(escapeDb(33.91, 10)).toBeCloseTo(32.09, 1));
  it('echo words at the edges', () => expect([0.29, 0.3, 0.6, 1.0, 1.01].map(echoWord)).toEqual(['dead', 'controlled', 'lively', 'lively', 'echoey']));
  it('boomy bass for a cube and a 2:1 room, not for 4 × 5 × 2.7', () => {
    expect(boomyBass(3, 3, 2.7)).toBe(true);
    expect(boomyBass(5.4, 4, 2.7)).toBe(true);
    expect(boomyBass(4, 5, 2.7)).toBe(false);
  });
  it('never calls bass boomy when a dimension is missing', () => expect(boomyBass(0, 0, 2.5)).toBe(false));
});

describe('room geometry', () => {
  it('perimeter sums the edges', () => expect(perimeter(ROOM)).toBeCloseTo(18, 9));
  it('perimeter falls back to width and depth without edges', () => expect(perimeter({ ...ROOM, edges: [], width: 4, depth: 5 })).toBe(18));
  it('perimeter falls back to a square without edges or width', () => expect(perimeter({ ...ROOM, edges: [], width: 0, depth: 0, area: 16 })).toBe(16));

  it('finds exterior walls', () => {
    const a = { ...ROOM, id: 'a', edges: box(0, 0, 4, 5) };
    const b = { ...ROOM, id: 'b', edges: box(4.1, 0, 8.1, 5) };   // the shared wall is 0.1 m thick
    expect(exteriorWalls(a, [b]).wallArea).toBeCloseTo(13 * 2.5, 1);
    expect(exteriorWalls(b, [a]).wallArea).toBeCloseTo(13 * 2.5, 1);
    expect(exteriorWalls(a, []).wallArea).toBeCloseTo(18 * 2.5, 1);
  });

  it('counts a partly shared wall by the part outside', () => {
    const a = { ...ROOM, id: 'a', edges: box(0, 0, 4, 5) };
    const closet = { ...ROOM, id: 'c', edges: box(4, 0, 6, 2) };   // covers 2 m of a's 5 m east wall
    expect(exteriorWalls(a, [closet]).wallArea).toBeCloseTo(16 * 2.5, 0);
  });

  it('counts windows on exterior walls only', () => {
    const win = { id: 'w', type: 'window', width: 1, height: 1.2, relativeCenter: 0.5, lowerElevation: 0.9 };
    const door = { ...win, id: 'd', type: 'doorway' };
    const a = { ...ROOM, id: 'a', edges: [wall([0, 0], [4, 0], [win, door]), wall([4, 0], [4, 5], [win]), wall([4, 5], [0, 5]), wall([0, 5], [0, 0])] };
    const b = { ...ROOM, id: 'b', edges: box(4, 0, 8, 5) };
    expect(exteriorWalls(a, [b]).windowArea).toBeCloseTo(1.2, 5);
  });

  it('ignores invisible edges', () => {
    const open = { ...ROOM, edges: [...box(0, 0, 4, 5).slice(0, 3), { ...wall([0, 5], [0, 0]), type: 'invisible' as const }] };
    expect(exteriorWalls(open, []).wallArea).toBeCloseTo(13 * 2.5, 1);
  });
});

describe('scoring', () => {
  it('criterion falls off linearly', () => {
    expect(criterion(0.3, [0.2, 0.4], 0.3)).toBe(1);
    expect(criterion(0.55, [0.2, 0.4], 0.3)).toBeCloseTo(0.5, 5);
    expect(criterion(0.9, [0.2, 0.4], 0.3)).toBe(0);
    expect(criterion(0.05, [0.2, 0.4], 0.3)).toBeCloseTo(0.5, 5);
  });

  it('scores a room that meets everything as 1', () => expect(scoreRoom(SUMMARY, REQ)).toBeCloseTo(1, 9));

  it('weighs each criterion', () => {
    // echo 0.95 s is 0.15 s past 0.8 → 0.5; everything else passes.
    expect(scoreRoom({ ...SUMMARY, echo: [0.95, 0.95, 0.95] }, REQ)).toBeCloseTo(1 - 0.3 * 0.5, 9);
    // boomy bass with avoidBoomyBass → bass 0.
    expect(scoreRoom({ ...SUMMARY, flags: ['boomy bass'] }, REQ)).toBeCloseTo(0.9, 9);
    // 7.5 m² against a 10 m² minimum, falling to 0 at 5 m² → 0.5.
    expect(scoreRoom({ ...SUMMARY, area: 7.5 }, REQ)).toBeCloseTo(1 - 0.2 * 0.5, 9);
  });

  it('drops a criterion it cannot compute and rescales', () => {
    const room = { ...SUMMARY, echo: [0.95, 0.95, 0.95] as [number, number, number], outsideDb: null, escapeDb: 45 };
    // echo 0.5, escape 0.5 (5 dB over 40, 10 dB falloff), size 1, bass 1; outside dropped.
    const expected = (0.3 * 0.5 + 0.1 * 0.5 + 0.2 * 1 + 0.1 * 1) / (0.3 + 0.1 + 0.2 + 0.1);
    expect(scoreRoom(room, REQ)).toBeCloseTo(expected, 9);
  });

  it('drops escape when the profile does not care', () => {
    expect(scoreRoom({ ...SUMMARY, escapeDb: 90 }, { ...REQ, maxEscapeDb: null })).toBeCloseTo(1, 9);
  });

  it('scores an interior room as passing escape', () => {
    expect(scoreRoom({ ...SUMMARY, escapeDb: null, flags: ['interior room'] }, REQ)).toBeCloseTo(1, 9);
    expect(scoreRoom({ ...SUMMARY, escapeDb: null, flags: ['interior room'], echo: [3, 3, 3] }, REQ)).toBeCloseTo(0.7, 9);
  });
});
