import { describe, it, expect } from 'vitest';
import { firstRoomId, isInside, TraceScheduler } from './listen';

describe('TraceScheduler (mvp-design.md 5.6)', () => {
  it('traces the first position at once', () => {
    const s = new TraceScheduler(0.25);
    expect(s.onListener([0, 0, 0])).toEqual([0, 0, 0]);
    expect(s.busy).toBe(true);
  });

  it('runs one trace at a time and traces the newest position when it finishes', () => {
    const s = new TraceScheduler(0.25);
    s.onListener([0, 0, 0]);
    expect(s.onListener([1, 0, 0])).toBeNull();
    expect(s.onListener([2, 0, 0])).toBeNull();
    expect(s.onResult()).toEqual([2, 0, 0]);
    expect(s.onResult()).toBeNull();
    expect(s.busy).toBe(false);
  });

  it('ignores moves of 0.25 m or less since the last trace', () => {
    const s = new TraceScheduler(0.25);
    s.onListener([0, 0, 0]);
    s.onResult();
    expect(s.onListener([0.2, 0, 0])).toBeNull();
    expect(s.onListener([0.1, 0.1, 0.1])).toBeNull();
    expect(s.onListener([0.3, 0, 0])).toEqual([0.3, 0, 0]);
  });

  it('drops a pending position that ended up back near the last trace', () => {
    const s = new TraceScheduler(0.25);
    s.onListener([0, 0, 0]);
    s.onListener([1, 0, 0]);
    s.onListener([0.1, 0, 0]);
    expect(s.onResult()).toBeNull();
  });

  it('traces again after invalidate, even without a move (sources moved)', () => {
    const s = new TraceScheduler(0.25);
    s.onListener([0, 0, 0]);
    s.onResult();
    s.invalidate();
    expect(s.onListener([0, 0, 0])).toEqual([0, 0, 0]);
  });

  it('after invalidate during a trace, retraces the newest position when it finishes', () => {
    const s = new TraceScheduler(0.25);
    s.onListener([0, 0, 0]);
    s.invalidate();
    expect(s.onResult()).toEqual([0, 0, 0]);
  });

  it('frees itself after a worker error', () => {
    const s = new TraceScheduler(0.25);
    s.onListener([0, 0, 0]);
    s.onListener([1, 0, 0]);
    expect(s.onError()).toEqual([1, 0, 0]);
  });
});

describe('isInside', () => {
  it('is true only in the inside mode, so dollhouse and floor plan keep the last listener', () => {
    expect(isInside('mode.inside')).toBe(true);
    expect(isInside('mode.dollhouse')).toBe(false);
    expect(isInside('mode.floorplan')).toBe(false);
    expect(isInside('mode.transitioning')).toBe(false);
  });
});

describe('firstRoomId', () => {
  it('takes the first room, or null when there is none', () => {
    expect(firstRoomId({ rooms: [{ id: 'a' }, { id: 'b' }] })).toBe('a');
    expect(firstRoomId({ rooms: [] })).toBeNull();
    expect(firstRoomId(undefined)).toBeNull();
  });
});
