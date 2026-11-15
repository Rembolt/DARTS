// Search over the index rows. Pure: the rows come in, a result or a NotPossible goes out.
import { notPossible, type City, type IndexRow, type NotPossible, type SearchQuery, type SearchResult } from '../shared/contract.js';

export const CITY_BOXES: Record<City, { latMin: number; latMax: number; lonMin: number; lonMax: number }> = {
  Houston: { latMin: 29.4, latMax: 30.3, lonMin: -96.0, lonMax: -94.8 },
  'Los Angeles': { latMin: 33.6, latMax: 34.5, lonMin: -118.9, lonMax: -117.6 },
};

const MAX_LIMIT = 8;
const MAX_RADIUS_KM = 15;
const EARTH_RADIUS_KM = 6371.0088;

type Point = { lat: number; lon: number };

/** Great-circle distance (haversine). */
export function distanceKm(a: Point, b: Point): number {
  const rad = Math.PI / 180;
  const dLat = (b.lat - a.lat) * rad;
  const dLon = (b.lon - a.lon) * rad;
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(a.lat * rad) * Math.cos(b.lat * rad) * Math.sin(dLon / 2) ** 2;
  return 2 * EARTH_RADIUS_KM * Math.asin(Math.min(1, Math.sqrt(h)));
}

const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value));
const thousands = (n: number) => n.toLocaleString('en-US');
const plural = (n: number) => `${thousands(n)} ${n === 1 ? 'property' : 'properties'}`;

/** The filters a query can drop, in the order they are tried when nothing matches. */
const FILTERS = ['zip', 'near', 'kind', 'propertyTypes', 'minSqft', 'maxPrice', 'minBeds'] as const;
type Filter = (typeof FILTERS)[number];

function isActive(query: SearchQuery, filter: Filter): boolean {
  if (filter === 'kind') return query.kind !== 'any';
  if (filter === 'propertyTypes') return query.propertyTypes !== null && query.propertyTypes.length > 0;
  return query[filter] !== null;
}

function without(query: SearchQuery, filter: Filter): SearchQuery {
  return { ...query, [filter]: filter === 'kind' ? 'any' : null };
}

function describeFilter(query: SearchQuery, filter: Filter): string {
  switch (filter) {
    case 'zip':
      return `the zip code ${query.zip}`;
    case 'near':
      return `the ${query.near!.radiusKm} km distance limit`;
    case 'kind':
      return `the kind of property (${query.kind})`;
    case 'propertyTypes':
      return `the property types (${query.propertyTypes!.join(', ')})`;
    case 'minSqft':
      return `the minimum of ${thousands(query.minSqft!)} sqft`;
    case 'maxPrice':
      return `the price limit of $${thousands(query.maxPrice!)}`;
    case 'minBeds':
      return `the minimum of ${query.minBeds} bedrooms`;
  }
}

/** Every filter but the price limit, which is applied separately so unpriced rows can be counted. */
function matchesExceptPrice(row: IndexRow, query: SearchQuery): boolean {
  if (row.city !== query.city) return false;
  if (query.zip !== null && row.zip !== query.zip) return false;
  if (query.near !== null && distanceKm(row, query.near) > query.near.radiusKm) return false;
  if (query.kind !== 'any' && row.kind !== query.kind) return false;
  if (query.propertyTypes !== null && query.propertyTypes.length > 0) {
    const wanted = query.propertyTypes.map((type) => type.trim().toLowerCase());
    if (!wanted.includes(row.propertyType.toLowerCase())) return false;
  }
  if (query.minSqft !== null && (row.sqft === null || row.sqft < query.minSqft)) return false;
  if (query.minBeds !== null && (row.beds === null || row.beds < query.minBeds)) return false;
  return true;
}

/** One row per property: the first usable tour in index order. */
function onePerProperty(rows: IndexRow[]): IndexRow[] {
  const seen = new Set<string>();
  return rows.filter((row) => {
    if (seen.has(row.propertyKey)) return false;
    seen.add(row.propertyKey);
    return true;
  });
}

/** Filtered properties (before sorting and limit), and how many fell only to the price limit for having no price. */
function filter(rows: IndexRow[], query: SearchQuery, skip?: (id: string) => boolean) {
  const usable = rows.filter((row) => !skip?.(row.modelId) && matchesExceptPrice(row, query));
  const properties = onePerProperty(usable);
  if (query.maxPrice === null) return { matches: properties, unpriced: 0 };
  const maxPrice = query.maxPrice;
  const unpriced = properties.filter((row) => row.price === null).length;
  return { matches: properties.filter((row) => row.price !== null && row.price <= maxPrice), unpriced };
}

function sortRows(rows: IndexRow[], query: SearchQuery): IndexRow[] {
  let centre: Point | null = query.near;
  if (centre === null && query.zip !== null && rows.length > 0) {
    centre = {
      lat: rows.reduce((sum, row) => sum + row.lat, 0) / rows.length,
      lon: rows.reduce((sum, row) => sum + row.lon, 0) / rows.length,
    };
  }
  if (centre !== null) {
    const from = centre;
    return rows
      .map((row) => ({ row, d: distanceKm(row, from) }))
      .sort((a, b) => a.d - b.d)
      .map(({ row }) => row);
  }
  return [...rows].sort((a, b) => (b.sqft ?? -1) - (a.sqft ?? -1));
}

/**
 * The search behind `search_properties` (spec 7.2). `near` outside the query city's box → outside_coverage.
 * `skip` drops unusable tours before one tour per property is picked, so a property's next tour can stand in.
 * `total` counts properties before `limit`. Zero rows is a normal result whose note names the filter to relax.
 */
export function searchRows(rows: IndexRow[], input: SearchQuery, skip?: (id: string) => boolean): SearchResult | NotPossible {
  const limit = Number.isFinite(input.limit) ? clamp(Math.round(input.limit), 1, MAX_LIMIT) : MAX_LIMIT;
  const query: SearchQuery = {
    ...input,
    limit,
    near: input.near && {
      ...input.near,
      radiusKm: Number.isFinite(input.near.radiusKm) ? clamp(input.near.radiusKm, 0, MAX_RADIUS_KM) : MAX_RADIUS_KM,
    },
  };

  const box = CITY_BOXES[query.city];
  if (!box) return notPossible('outside_coverage');
  if (query.near) {
    const { lat, lon } = query.near;
    if (!(lat >= box.latMin && lat <= box.latMax && lon >= box.lonMin && lon <= box.lonMax)) return notPossible('outside_coverage');
  }

  const { matches, unpriced } = filter(rows, query, skip);
  const notes: string[] = [];
  if (unpriced > 0) {
    notes.push(`${plural(unpriced)} ${unpriced === 1 ? 'has' : 'have'} no listed price and ${unpriced === 1 ? 'was' : 'were'} left out`);
  }

  if (matches.length === 0) {
    let best: { filter: Filter; count: number } | null = null;
    for (const name of FILTERS) {
      if (!isActive(query, name)) continue;
      const count = filter(rows, without(query, name), skip).matches.length;
      if (count > 0 && (best === null || count > best.count)) best = { filter: name, count };
    }
    notes.unshift(
      best
        ? `Nothing matches that. Removing ${describeFilter(query, best.filter)} would give ${plural(best.count)}.`
        : 'Nothing matches that, and removing any one filter would still give none: more than one filter needs to change.',
    );
    return { total: 0, rows: [], notes };
  }

  return { total: matches.length, rows: sortRows(matches, query).slice(0, limit), notes };
}
