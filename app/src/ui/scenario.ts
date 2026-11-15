// What-if settings the trace does not model yet, applied as a level and treble trim on the outdoor sound (see the
// engine's `setSourceTrim`). All values are estimates, and the UI labels them so.
import type { Opening } from './store';
import { toDb } from './compass';

export type TimeOfDay = 'rush' | 'day' | 'evening' | 'night';

/** Traffic by time of day, relative to rush hour. Rough figures for a suburban street. */
export const TIME_OF_DAY: { id: TimeOfDay; label: string; db: number; highDb: number }[] = [
  { id: 'rush', label: 'Rush', db: 0, highDb: 0 },
  { id: 'day', label: 'Day', db: -4, highDb: -1 },
  { id: 'evening', label: 'Evening', db: -9, highDb: -3 },
  { id: 'night', label: 'Night', db: -16, highDb: -6 },
];

/**
 * Closing every window: this much less outdoor sound, mostly treble. A stand-in for windows the scan already shows
 * closed (the mesh has glass there, so the trace cannot open them). Windows the worker traces as panels
 * (v2-design.md 7.4) are left out: `Opening.traced`.
 */
export const WINDOWS_CLOSED = { db: -8, highDb: -10 };

export type Trim = { db: number; highDb: number };

export function windowsTrim(openings: Pick<Opening, 'type' | 'open' | 'traced'>[]): Trim {
  const windows = openings.filter(o => o.type === 'window');
  if (!windows.length) return { db: 0, highDb: 0 };
  // A window the worker traces as a panel already loses its sound in the trace: counting it here too would double it.
  const closed = windows.filter(w => !w.open && !w.traced).length / windows.length;
  if (closed === 0) return { db: 0, highDb: 0 };
  return { db: WINDOWS_CLOSED.db * closed, highDb: WINDOWS_CLOSED.highDb * closed };
}

export function outdoorTrim(openings: Pick<Opening, 'type' | 'open' | 'traced'>[], time: TimeOfDay): Trim {
  const w = windowsTrim(openings);
  const t = TIME_OF_DAY.find(x => x.id === time) ?? TIME_OF_DAY[0];
  return { db: w.db + t.db, highDb: w.highDb + t.highDb };
}

/** How far below the outside a source is heard, in dB, from a trace strength and a trim. */
export function heardDb(strength: number, trimDb = 0): number {
  return toDb(strength) + trimDb;
}

export type Rating = { label: 'Quiet' | 'Moderate' | 'Loud'; tone: 'quiet' | 'moderate' | 'loud' };

/** A listing-style word for how much street noise gets in (dB below outside). */
export function quietRating(outdoorDb: number): Rating {
  if (outdoorDb <= -24) return { label: 'Quiet', tone: 'quiet' };
  if (outdoorDb <= -14) return { label: 'Moderate', tone: 'moderate' };
  return { label: 'Loud', tone: 'loud' };
}
