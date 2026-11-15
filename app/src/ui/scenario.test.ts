import { describe, expect, it } from 'vitest';
import { heardDb, outdoorTrim, quietRating, windowsTrim, WINDOWS_CLOSED } from './scenario';

const w = (open: boolean) => ({ type: 'window' as const, open });

describe('scenario', () => {
  it('takes nothing off when every window is open, the full amount when all are closed', () => {
    expect(windowsTrim([w(true), w(true)])).toEqual({ db: 0, highDb: 0 });
    expect(windowsTrim([w(false), w(false)])).toEqual(WINDOWS_CLOSED);
    expect(windowsTrim([w(false), w(true)]).db).toBeCloseTo(WINDOWS_CLOSED.db / 2);
  });
  it('ignores doors and a house without windows', () => {
    expect(windowsTrim([{ type: 'door', open: false }])).toEqual({ db: 0, highDb: 0 });
  });
  it('adds the time of day on top', () => {
    expect(outdoorTrim([w(true)], 'night').db).toBe(-16);
    expect(outdoorTrim([w(false)], 'night').db).toBe(-16 + WINDOWS_CLOSED.db);
  });
  it('rates street noise like a listing would', () => {
    expect(quietRating(-30).label).toBe('Quiet');
    expect(quietRating(-18).label).toBe('Moderate');
    expect(quietRating(-6).label).toBe('Loud');
  });
  it('reads a strength and a trim as dB below outside', () => {
    expect(heardDb(0.1, -4)).toBeCloseTo(-14);
  });
});
