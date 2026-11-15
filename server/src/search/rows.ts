// Turns CoStar records into search index rows. Pure: no fs, so the build script and the tests share it.
// Free text (`remarks`, `notes`) is never read: only named fields are copied.
import type { City, IndexRow } from '../shared/contract.js';

/** `costar-kit/schemas/enums.json`: enum name → value → name. */
export type Enums = Record<string, Record<string, string>>;

/** A row as built from one record, before merging: `listDate` decides which record wins for a model id. */
export type DatedRow = IndexRow & { listDate?: string };

type Obj = Record<string, unknown>;

const MATTERPORT_REFERENCE_TYPES = new Set([36, 234]); // MatterportScan, MatterportStreamingKey
const FOR_RENT = 2; // TransactionType ForRent: currentPrice is a monthly rent
const CONSTRUCTION_COMPLETE = 2; // ConstructionEventType
const MASONRY = 1; // BuildingConstructionMaterialType

const isObj = (value: unknown): value is Obj => typeof value === 'object' && value !== null && !Array.isArray(value);
const obj = (value: unknown): Obj => (isObj(value) ? value : {});
const num = (value: unknown): number | null => (typeof value === 'number' && Number.isFinite(value) ? value : null);
const str = (value: unknown): string | null => (typeof value === 'string' && value.trim() !== '' ? value.trim() : null);
/** A positive count or size; 0 in the data means unknown. */
const positive = (value: unknown): number | null => {
  const n = num(value);
  return n !== null && n > 0 ? n : null;
};

function decode(enums: Enums, name: string, value: unknown): string | null {
  const n = num(value);
  if (n === null) return null;
  return enums[name]?.[String(n)] ?? null;
}

export function normaliseCity(value: string): City | null {
  const key = value.trim().toLowerCase();
  if (key === 'houston') return 'Houston';
  if (key === 'los angeles') return 'Los Angeles';
  return null;
}

/** The first Matterport model id in a residential listing's media, or ''. */
function firstMediaModelId(record: Obj): string {
  const media = Array.isArray(record.media) ? record.media : [];
  for (const item of media.map(obj)) {
    if (MATTERPORT_REFERENCE_TYPES.has(num(item.externalReferenceType) ?? -1) && str(item.videoKey)) return str(item.videoKey)!;
  }
  return '';
}

/**
 * One `residential-listings.jsonl` record → its index row, or null without coordinates or outside the two cities.
 * `modelId` comes from the CSV join (a listing can have several tours); without it, the first Matterport media item.
 */
export function homeRow(record: unknown, enums: Enums, modelId?: string): DatedRow | null {
  const r = obj(record);
  const property = obj(r.property);
  const address = obj(property.address);
  const reso = obj(r.resoValues);
  const structure = obj(reso.structure);

  const lat = num(address.latitude);
  const lon = num(address.longitude);
  const city = normaliseCity(str(address.city) ?? '');
  if (lat === null || lon === null || city === null) return null;

  const forRent = num(r.transactionType) === FOR_RENT;
  const facts: string[] = [];
  if (forRent) facts.push('for rent');
  if (reso.hasHardwoodFloors === true) facts.push('hardwood floors');
  if (reso.hasGarage === true) facts.push('garage');
  if (reso.hasBasement === true) facts.push('basement');
  if (reso.isWaterfront === true) facts.push('waterfront');
  if (reso.hasFireplace === true) facts.push('fireplace');
  if ((num(reso.poolType) ?? 0) > 0) facts.push('pool');

  const row: DatedRow = {
    modelId: modelId ?? firstMediaModelId(r),
    kind: 'home',
    propertyKey: `home:${num(r.propertyId) ?? str(r.propertyId) ?? num(r.id) ?? str(r.id)}`,
    toursOnProperty: 1,
    address: str(address.fullStreetAddress) ?? '',
    city,
    zip: str(address.zip) ?? '',
    lat,
    lon,
    propertyType: decode(enums, 'ListingPropertyType', property.listingPropertyType) ?? 'Unknown',
    buildingName: null,
    sqft: positive(property.sqftMin),
    beds: positive(property.bedsMin),
    baths: positive(property.bathsMin),
    // A rental's price is a monthly rent; it must never pass a sale-price limit, so it is left unlisted.
    price: forRent ? null : positive(r.currentPrice),
    yearBuilt: positive(structure.yearBuilt) ?? positive(property.yearBuilt),
    stories: positive(structure.stories),
    facts,
  };
  const listDate = str(r.listDate);
  if (listDate) row.listDate = listDate;
  return row;
}

function streetAddress(address: Obj): string {
  const number = str(address.streetNumber);
  const end = str(address.streetNumberEndRange);
  return [
    number && end ? `${number}-${end}` : number,
    str(address.streetDirection),
    str(address.streetName),
    str(address.streetType),
    str(address.streetSuffix),
  ]
    .filter((part) => part !== null)
    .join(' ');
}

/** One `commercial-property.jsonl` record → one row per tour, all sharing the property's key. */
export function commercialRow(record: unknown, modelIds: string[], enums: Enums): IndexRow[] {
  const r = obj(record);
  const address = obj(r.primaryAddress);
  const lat = num(address.latitude);
  const lon = num(address.longitude);
  const city = normaliseCity(str(address.city) ?? '');
  if (lat === null || lon === null || city === null || modelIds.length === 0) return [];

  const propertyType = decode(enums, 'PropertyType', r.propertyType) ?? 'Unknown';
  const events = (Array.isArray(r.constructionEvents) ? r.constructionEvents : []).map(obj);
  const built = events.find((event) => num(event.eventType) === CONSTRUCTION_COMPLETE);
  const facts = num(r.buildingConstructionMaterial) === MASONRY ? ['brick'] : [];

  return modelIds.map((modelId) => ({
    modelId,
    kind: propertyType === 'Multifamily' ? 'apartment' : 'commercial',
    propertyKey: `commercial:${num(r.id) ?? str(r.id)}`,
    toursOnProperty: modelIds.length,
    address: streetAddress(address),
    city,
    zip: (str(address.postcode) ?? '').slice(0, 5),
    lat,
    lon,
    propertyType,
    buildingName: str(r.buildingName),
    sqft: positive(r.rentableBuildingAreaSquareFeet),
    beds: null,
    baths: null,
    price: null,
    yearBuilt: built ? positive(built.year) : null,
    stories: positive(r.numStoriesAboveGrade),
    facts: [...facts],
  }));
}

/**
 * One row per model id: the latest `listDate` wins (a dated row beats an undated one; ties keep the first).
 * Then `toursOnProperty` is recounted per `propertyKey`, since a home's tours can come from several listings.
 * Output order follows each model id's first appearance; `listDate` is dropped.
 */
export function mergeRows(rows: DatedRow[]): IndexRow[] {
  const byId = new Map<string, DatedRow>();
  for (const row of rows) {
    const kept = byId.get(row.modelId);
    if (!kept || (row.listDate && (!kept.listDate || row.listDate > kept.listDate))) byId.set(row.modelId, row);
  }
  const tours = new Map<string, number>();
  for (const row of byId.values()) tours.set(row.propertyKey, (tours.get(row.propertyKey) ?? 0) + 1);
  return [...byId.values()].map(({ listDate: _listDate, ...row }) => ({ ...row, toursOnProperty: tours.get(row.propertyKey)! }));
}
