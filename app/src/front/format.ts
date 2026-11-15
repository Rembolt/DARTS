import type { AreaSummary, PropertyKind } from '../../../server/src/shared/contract';

/** Matches the server's range for located sources (server/src/surroundings LOCATED_RANGE_M). */
const LOCATED_RANGE_M = 300;

const whole = (v: number) => Math.round(v).toLocaleString('en-US');

/** How a card says each number. Every value shown is an estimate; the card says so once in its "Estimated." line. */
export const fmt = {
  db: (v: number | null): string => (v === null || !Number.isFinite(v) ? 'not estimated' : `${Math.round(v)} dB`),
  seconds: (v: number): string => `${v.toFixed(2)} s`,
  /** Scores are shown as given (0–1 → 0–100%), never rescaled. */
  percent: (score: number): string => `${Math.round(score * 100)}%`,
  sqft: (v: number | null): string => (v === null ? 'size not listed' : `${whole(v)} sqft`),
  price: (v: number | null): string => (v === null ? 'price not listed' : `$${whole(v)}`),
  /**
   * The area after "Area: ". From Vexcel: the class and the nearest highway within range. Assumed from the property
   * type: Vexcel was not asked, so nothing is said about highways.
   */
  area: (a: AreaSummary | null): string => {
    if (a === null) return 'surroundings unknown';
    if (a.source === 'property_type') return `${a.areaClass} (assumed)`;
    const highways = a.located.filter(s => s.kind === 'highway').sort((x, y) => x.distanceM - y.distanceM);
    const highway = highways.length > 0 ? `highway ${Math.round(highways[0].distanceM)} m` : `no highway within ${LOCATED_RANGE_M} m`;
    return `${a.areaClass} · ${highway}`;
  },
};

export function kindWord(kind: PropertyKind): string {
  return kind === 'home' ? 'Home' : kind === 'apartment' ? 'Apartment' : 'Commercial';
}

/** 'heights assumed for 6 of 16 rooms' → 'Heights assumed for 6 of 16 rooms.' */
export function sentence(text: string): string {
  const t = text.trim();
  if (!t) return '';
  const capped = t[0].toUpperCase() + t.slice(1);
  return /[.!?]$/.test(capped) ? capped : `${capped}.`;
}
