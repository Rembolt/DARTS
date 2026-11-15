import { describe, it, expect } from 'vitest';
import { commercialRow, homeRow, mergeRows, normaliseCity, type Enums } from '../src/search/rows.js';
import type { IndexRow } from '../src/shared/contract.js';

const ENUMS: Enums = {
  ListingPropertyType: { '0': 'None', '1': 'Detached', '4': 'Condo' },
  PropertyType: { '0': 'Unknown', '5': 'Office', '11': 'Multifamily' },
  BuildingConstructionMaterialType: { '0': 'Unknown', '1': 'Masonry', '5': 'WoodFrame' },
};

/** A trimmed copy of the first residential record's shape, with made-up values. */
const HOME = {
  id: 1001,
  propertyId: 2002,
  transactionType: 1,
  listDate: '2024-08-17T00:00:00+00:00',
  currentPrice: 280000,
  remarks: 'Nestled on a quiet street, call 555-0100.',
  resoValues: {
    hasHardwoodFloors: true, hasGarage: false, hasBasement: false, isWaterfront: false, hasFireplace: true,
    poolType: 1,
    structure: { yearBuilt: 1952, stories: 1 },
  },
  property: {
    address: { fullStreetAddress: '100 Example Drive', city: 'houston', zip: '77078', latitude: 29.83, longitude: -95.25 },
    listingPropertyType: 1, sqftMin: 1436, bedsMin: 4, bathsMin: 2,
  },
  media: [{ videoKey: 'Ki9YdfpNKum', externalReferenceType: 234 }],
};

const MULTIFAMILY = {
  id: 3003,
  propertyType: 11,
  buildingName: 'The Example Lofts',
  rentableBuildingAreaSquareFeet: 120000,
  numStoriesAboveGrade: 4,
  buildingConstructionMaterial: 1,
  constructionEvents: [{ eventType: 1, year: 1997 }, { eventType: 2, year: 1999 }],
  notes: 'Broker note: secret',
  primaryAddress: {
    streetNumber: '333', streetDirection: 'N', streetName: 'Example', streetType: 'Pky', streetSuffix: 'E',
    city: 'LOS ANGELES', postcode: '900121234', latitude: 34.05, longitude: -118.25,
  },
};

const A: IndexRow = {
  modelId: 'aaaaaaaaaaa', kind: 'home', propertyKey: 'home:1', toursOnProperty: 1, address: '1 A St', city: 'Houston',
  zip: '77008', lat: 29.8, lon: -95.4, propertyType: 'Detached', buildingName: null, sqft: 1000, beds: 2, baths: 1,
  price: 1, yearBuilt: null, stories: null, facts: [],
};

describe('homeRow', () => {
  it('maps a home record', () => {
    const row = homeRow(HOME, ENUMS)!;
    expect(row).toMatchObject({
      kind: 'home', city: 'Houston', zip: '77078', lat: 29.83, lon: -95.25, sqft: 1436, beds: 4, baths: 2,
      price: 280000, propertyType: 'Detached', yearBuilt: 1952, stories: 1, address: '100 Example Drive',
      modelId: 'Ki9YdfpNKum', propertyKey: 'home:2002', buildingName: null,
    });
    expect(row.facts).toEqual(expect.arrayContaining(['hardwood floors', 'fireplace', 'pool']));
    expect(row.facts).not.toContain('garage');
    expect(JSON.stringify(row)).not.toContain('Nestled'); // remarks never copied
  });
  it('takes the model id it is given', () => {
    expect(homeRow(HOME, ENUMS, 'bbbbbbbbbbb')!.modelId).toBe('bbbbbbbbbbb');
  });
  it('drops a record without coordinates', () =>
    expect(homeRow({ ...HOME, property: { ...HOME.property, address: { ...HOME.property.address, latitude: null } } }, ENUMS)).toBeNull());
  it('drops a record outside the two cities', () =>
    expect(homeRow({ ...HOME, property: { ...HOME.property, address: { ...HOME.property.address, city: 'Boston' } } }, ENUMS)).toBeNull());
  it('keeps a missing price as null', () => {
    const { currentPrice: _drop, ...noPrice } = HOME;
    expect(homeRow(noPrice, ENUMS)!.price).toBeNull();
  });
  it('gives a rental no price, so monthly rent never passes a price limit, and says it is for rent', () => {
    const row = homeRow({ ...HOME, transactionType: 2, currentPrice: 2500 }, ENUMS)!;
    expect(row.price).toBeNull();
    expect(row.facts).toContain('for rent');
  });
  it('treats a placeholder price of a few dollars as not listed', () => {
    expect(homeRow({ ...HOME, currentPrice: 1 }, ENUMS)!.price).toBeNull();
  });
  it('carries the list date for merging', () => {
    expect((homeRow(HOME, ENUMS) as IndexRow & { listDate?: string }).listDate).toBe('2024-08-17T00:00:00+00:00');
  });
});

describe('normaliseCity', () => {
  it('normalises city names', () => {
    expect(normaliseCity('houston')).toBe('Houston');
    expect(normaliseCity(' LOS ANGELES ')).toBe('Los Angeles');
    expect(normaliseCity('Boston')).toBeNull();
  });
});

describe('mergeRows', () => {
  it('keeps one row per model id, the latest listing', () =>
    expect(mergeRows([{ ...A, listDate: '2024-01-01' }, { ...A, price: 5, listDate: '2026-01-01' }])).toEqual([
      expect.objectContaining({ price: 5 }),
    ]));
  it('drops the list date from the output', () => {
    expect(mergeRows([{ ...A, listDate: '2024-01-01' }])[0]).not.toHaveProperty('listDate');
  });
  it('counts the tours of one property after merging', () => {
    const rows = mergeRows([
      { ...A, listDate: '2024-01-01' },
      { ...A, listDate: '2025-01-01' },
      { ...A, modelId: 'bbbbbbbbbbb', listDate: '2025-01-01' },
      { ...A, modelId: 'ccccccccccc', propertyKey: 'home:2' },
    ]);
    expect(rows.map((r) => [r.modelId, r.toursOnProperty])).toEqual([
      ['aaaaaaaaaaa', 2], ['bbbbbbbbbbb', 2], ['ccccccccccc', 1],
    ]);
  });
});

describe('commercialRow', () => {
  it('marks apartment communities and counts their tours', () => {
    const rows = commercialRow(MULTIFAMILY, ['aaaaaaaaaaa', 'bbbbbbbbbbb'], ENUMS);
    expect(rows.map((r) => [r.kind, r.toursOnProperty])).toEqual([['apartment', 2], ['apartment', 2]]);
  });
  it('maps the commercial fields', () => {
    const [row] = commercialRow(MULTIFAMILY, ['aaaaaaaaaaa'], ENUMS);
    expect(row).toEqual({
      modelId: 'aaaaaaaaaaa', kind: 'apartment', propertyKey: 'commercial:3003', toursOnProperty: 1,
      address: '333 N Example Pky E', city: 'Los Angeles', zip: '90012', lat: 34.05, lon: -118.25,
      propertyType: 'Multifamily', buildingName: 'The Example Lofts', sqft: 120000, beds: null, baths: null,
      price: null, yearBuilt: 1999, stories: 4, facts: ['brick'],
    });
    expect(JSON.stringify(row)).not.toContain('secret'); // notes never copied
  });
  it('marks other types commercial', () => {
    const [row] = commercialRow({ ...MULTIFAMILY, propertyType: 5, buildingConstructionMaterial: 5 }, ['aaaaaaaaaaa'], ENUMS);
    expect(row).toMatchObject({ kind: 'commercial', propertyType: 'Office', facts: [] });
  });
  it('gives no rows without coordinates or ids', () => {
    expect(commercialRow({ ...MULTIFAMILY, primaryAddress: { ...MULTIFAMILY.primaryAddress, longitude: null } }, ['aaaaaaaaaaa'], ENUMS)).toEqual([]);
    expect(commercialRow(MULTIFAMILY, [], ENUMS)).toEqual([]);
  });
});
