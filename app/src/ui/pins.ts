// The rules for what the overlay draws on the tour (see DESIGN.md, "Pins").
import type { Screen } from './project';

export type PinKind = 'opening' | 'speaker';
export type PinInput = { id: string; kind: PinKind; screen: Screen; hidden: boolean | undefined };
export type PinState = 'shown' | 'ghost';
export type PinOut = { id: string; kind: PinKind; x: number; y: number; state: PinState; scale: number; opacity: number };

export const PIN_RULES = {
  /** Doors and windows further than this are left out: too small to aim at, and they clutter. */
  openingMaxDistance: 10,
  /** Two pins closer than this on screen collide; the more important one stays. */
  minGap: 34,
  /** Pins shrink with distance between these two scales. */
  nearScale: 1.1,
  farScale: 0.8,
  /** Opacity of a speaker seen through a wall: you still hear it, so it stays, but reads as "behind". */
  ghostOpacity: 0.55,
};

/**
 * Decide each pin's look. Rules, in order:
 * 1. Off screen or behind the camera: not drawn.
 * 2. A door or window behind a wall: not drawn. A speaker behind a wall: drawn as a ghost.
 * 3. Doors and windows beyond `openingMaxDistance`: not drawn.
 * 4. Collisions: speakers beat openings, visible beats ghost, near beats far.
 */
export function layoutPins(items: PinInput[], rules = PIN_RULES): PinOut[] {
  const candidates: (PinOut & { distance: number; rank: number })[] = [];
  for (const it of items) {
    const s = it.screen;
    if (!s.visible) continue;
    if (it.kind === 'opening' && (it.hidden || s.distance > rules.openingMaxDistance)) continue;
    const state: PinState = it.hidden ? 'ghost' : 'shown';
    const t = Math.min(1, Math.max(0, (s.distance - 1.5) / 8));
    const scale = rules.nearScale + (rules.farScale - rules.nearScale) * t;
    const opacity = state === 'ghost' ? rules.ghostOpacity : 1;
    const rank = (it.kind === 'speaker' ? 0 : 2) + (state === 'ghost' ? 1 : 0);
    candidates.push({ id: it.id, kind: it.kind, x: s.x, y: s.y, state, scale, opacity, distance: s.distance, rank });
  }
  candidates.sort((a, b) => a.rank - b.rank || a.distance - b.distance);
  const kept: typeof candidates = [];
  for (const c of candidates) {
    if (kept.some(k => Math.hypot(k.x - c.x, k.y - c.y) < rules.minGap)) continue;
    kept.push(c);
  }
  return kept.map(({ distance: _d, rank: _r, ...pin }) => pin);
}
