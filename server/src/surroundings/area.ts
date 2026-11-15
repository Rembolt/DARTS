// Pure rules for the surroundings (design section 6.2): the area class from building counts, the typical levels of
// the loop and the located sources, the hardcoded airports, and the labelled fallback by property type.
// All levels are rough typical values for ranking properties against each other, not a noise survey.
import type { AreaClass, AreaSummary, IndexRow, LocatedSource } from '../shared/contract.js';

/** The counts that decide the area class. Tuned on ten addresses in Task C4 (see AGENTS.md). */
export const AREA_THRESHOLDS = {
  /** `warehouse` at least this → industrial. The spec's 3 made a retail strip with 4 industrial (Task C4). */
  industrialWarehouses: 10,
  /** `commercial building` + `parking lot` at least this, with fewer than `houses` houses → commercial. */
  commercialBuildingsAndLots: 6,
  /** `commercial building` at least this, with at least `houses` houses → city. */
  cityCommercialBuildings: 3,
  /** `house` at least this → residential (and the house limit of the two rules above). */
  houses: 20,
};

/** The first rule that matches, in the spec's order. */
export function classifyArea(counts: Record<string, number>): AreaClass {
  const n = (label: string) => counts[label] ?? 0;
  const t = AREA_THRESHOLDS;
  const houses = n('house');
  if (n('warehouse') >= t.industrialWarehouses) return 'industrial';
  if (n('commercial building') + n('parking lot') >= t.commercialBuildingsAndLots && houses < t.houses) return 'commercial';
  if (n('commercial building') >= t.cityCommercialBuildings && houses >= t.houses) return 'city';
  if (houses >= t.houses) return 'residential';
  return 'nature';
}

/** The background loop's level at the facade, per class. */
export const LOOP_FACADE_DB: Record<AreaClass, number> = {
  commercial: 62, city: 65, industrial: 65, residential: 50, nature: 42,
};

/** A line source (road, railway): `level10m` at 10 m, 3 dB less per doubling of distance; never louder than at 10 m. */
export function lineLevelDb(level10m: number, distanceM: number): number {
  return level10m - 10 * Math.log10(Math.max(distanceM, 10) / 10);
}

/** Planes: 70 dB when the airport is within 3 km, 6 dB less per doubling beyond. */
export function planeLevelDb(distanceKm: number): number {
  return 70 - 20 * Math.log10(Math.max(distanceKm, 3) / 3);
}

export const AIRPORTS: { code: string; lat: number; lon: number }[] = [
  { code: 'IAH', lat: 29.9844, lon: -95.3414 },
  { code: 'HOU', lat: 29.6454, lon: -95.2789 },
  { code: 'EFD', lat: 29.6073, lon: -95.1588 },
  { code: 'LAX', lat: 33.9416, lon: -118.4085 },
  { code: 'BUR', lat: 34.2007, lon: -118.3587 },
  { code: 'LGB', lat: 33.8177, lon: -118.1516 },
  { code: 'SMO', lat: 34.0158, lon: -118.4513 },
  { code: 'VNY', lat: 34.2098, lon: -118.49 },
];
const AIRPORT_RANGE_M = 15_000;
const EARTH_RADIUS_M = 6_371_000;
const RAD = Math.PI / 180;

type LatLon = { lat: number; lon: number };

/** Great-circle distance in metres. */
export function distanceM(from: LatLon, to: LatLon): number {
  const dLat = (to.lat - from.lat) * RAD;
  const dLon = (to.lon - from.lon) * RAD;
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(from.lat * RAD) * Math.cos(to.lat * RAD) * Math.sin(dLon / 2) ** 2;
  return 2 * EARTH_RADIUS_M * Math.asin(Math.min(1, Math.sqrt(h)));
}

/** Initial bearing from `from` to `to`: 0 north, clockwise, in [0, 360). */
export function bearingDeg(from: LatLon, to: LatLon): number {
  const φ1 = from.lat * RAD;
  const φ2 = to.lat * RAD;
  const Δλ = (to.lon - from.lon) * RAD;
  const y = Math.sin(Δλ) * Math.cos(φ2);
  const x = Math.cos(φ1) * Math.sin(φ2) - Math.sin(φ1) * Math.cos(φ2) * Math.cos(Δλ);
  return ((Math.atan2(y, x) / RAD) % 360 + 360) % 360;
}

/** The nearest hardcoded airport within 15 km, as a located source; [] when none is that close. */
export function airportsNear(lat: number, lon: number): LocatedSource[] {
  const here = { lat, lon };
  let best: { d: number; airport: LatLon } | null = null;
  for (const airport of AIRPORTS) {
    const d = distanceM(here, airport);
    if (d <= AIRPORT_RANGE_M && (best === null || d < best.d)) best = { d, airport };
  }
  if (best === null) return [];
  return [{ kind: 'airport', distanceM: best.d, bearingDeg: bearingDeg(here, best.airport), levelDb: planeLevelDb(best.d / 1000) }];
}

/** Energy sum of levels in dB. */
export function sumDb(levels: number[]): number {
  return 10 * Math.log10(levels.reduce((sum, l) => sum + 10 ** (l / 10), 0));
}

const normalise = (type: string) => type.toLowerCase().replace(/[^a-z]/g, '');
const INDUSTRIAL_TYPES = new Set(['industrial', 'flex']);
const RESIDENTIAL_TYPES = new Set(['multifamily', 'residential', 'homes']);

/**
 * The class from the property's own CoStar type. Spec: home and apartment → residential; Office, General Retail,
 * Hospitality, Mixed Use → commercial; Industrial, Flex → industrial. Decided here: Multifamily, Residential and Homes
 * → residential; every other commercial type (Land, Specialty, Healthcare, Sports and Entertainment, Unknown) →
 * commercial, the spec's commercial default.
 */
function classFromType(row: IndexRow): AreaClass {
  if (row.kind === 'home' || row.kind === 'apartment') return 'residential';
  const type = normalise(row.propertyType);
  if (INDUSTRIAL_TYPES.has(type)) return 'industrial';
  if (RESIDENTIAL_TYPES.has(type)) return 'residential';
  return 'commercial';
}

/** The summary when Vexcel can't answer: class by property type, airports only, labelled `property_type`. */
export function fallbackArea(row: IndexRow): AreaSummary {
  const areaClass = classFromType(row);
  const located = Number.isFinite(row.lat) && Number.isFinite(row.lon) ? airportsNear(row.lat, row.lon) : [];
  return {
    areaClass,
    source: 'property_type',
    counts: {},
    located,
    roadBearingDeg: null,
    facadeDb: sumDb([LOOP_FACADE_DB[areaClass], ...located.map(s => s.levelDb)]),
    imageryDate: null,
  };
}

/** A WKT square centred on the point, `halfM` metres from centre to each edge (lon before lat). */
export function square(lat: number, lon: number, halfM: number): string {
  const dLat = halfM / 111_320;
  const dLon = halfM / (111_320 * Math.cos(lat * RAD));
  const [w, e, s, n] = [lon - dLon, lon + dLon, lat - dLat, lat + dLat];
  return `POLYGON((${w} ${s},${e} ${s},${e} ${n},${w} ${n},${w} ${s}))`;
}
