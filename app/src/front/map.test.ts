import { describe, expect, it } from 'vitest';
import { CITY_VIEWS, USA_VIEW } from '../../../server/src/shared/contract';
import { framing, project, regionOf } from './map';

const houston = CITY_VIEWS.find(v => v.slug === 'houston')!;

describe('project', () => {
  it('puts the corners of the box on the corners of the image', () => {
    expect(project(houston, houston.north, houston.west)).toEqual({ x: 0, y: 0 });
    const se = project(houston, houston.south, houston.east);
    expect(se.x).toBeCloseTo(1);
    expect(se.y).toBeCloseTo(1);
  });
  it('places downtown Houston near the middle of its picture, and both cities inside the country', () => {
    const p = project(houston, 29.7604, -95.3698);
    expect(p.x).toBeGreaterThan(0.4);
    expect(p.x).toBeLessThan(0.6);
    expect(p.y).toBeGreaterThan(0.4);
    expect(p.y).toBeLessThan(0.6);
    for (const v of CITY_VIEWS) {
      expect(v.north).toBeLessThan(USA_VIEW.north);
      expect(v.south).toBeGreaterThan(USA_VIEW.south);
      expect(v.west).toBeGreaterThan(USA_VIEW.west);
      expect(v.east).toBeLessThan(USA_VIEW.east);
    }
  });
});

describe('regionOf and framing', () => {
  const at = (lat: number, lon: number) => ({ lat, lon });
  it('starts on the Los Angeles to Houston corridor, with both cities in view', () => {
    expect(regionOf([], null, null)).toBeNull();
    const f = framing(null);
    expect(f.scale).toBeGreaterThan(1);
    // At that zoom a 4:3 window sees 1/scale of the country's width, centred on the start.
    for (const v of CITY_VIEWS) {
      const x = project(USA_VIEW, (v.north + v.south) / 2, (v.east + v.west) / 2).x;
      expect(Math.abs(x - f.cx)).toBeLessThan(0.5 / f.scale);
    }
  });
  it('shows the picked city when there are no pins', () => {
    const r = regionOf([], null, houston)!;
    expect(r.heightKm).toBeCloseTo((houston.north - houston.south) * 111.32);
    expect(framing(r).scale).toBeGreaterThan(30);
  });
  it('covers the city picture on any window shape, so the country picture never shows past it', () => {
    const r = regionOf([], null, houston)!;
    const fh = (houston.north - houston.south) / (USA_VIEW.north - USA_VIEW.south);
    const fw = (houston.east - houston.west) / (USA_VIEW.east - USA_VIEW.west);
    for (const ratio of [0.6, 1, 4 / 3, 2, 3.07]) {
      const s = framing(r, ratio).scale;
      expect(Math.min(1, 4 / 3 / ratio) / s).toBeLessThanOrEqual(fh + 1e-9); // visible height fraction
      expect(Math.min(1, ratio / (4 / 3)) / s).toBeLessThanOrEqual(fw + 1e-9); // visible width fraction
    }
  });
  it('follows the agent: its point, twice its radius tall, zoomed to match', () => {
    const r = regionOf([at(29.5, -95.5)], { lat: 29.76, lon: -95.37, radiusKm: 1 }, houston)!;
    expect(r).toEqual({ lat: 29.76, lon: -95.37, heightKm: 2 });
    expect(framing(r).scale).toBeCloseTo(((USA_VIEW.north - USA_VIEW.south) * 111.32) / 2, 0);
  });
  it('with no focus, frames the pins and keeps a margin round them', () => {
    const r = regionOf([at(29.76, -95.4), at(29.78, -95.35)], null, houston)!;
    expect(r.lat).toBeCloseTo(29.77);
    expect(r.heightKm).toBeGreaterThanOrEqual(4);
  });
  it('never zooms past a 0.6 km view', () => {
    expect(framing({ lat: 29.76, lon: -95.37, heightKm: 0.01 }).scale).toBeCloseTo(((USA_VIEW.north - USA_VIEW.south) * 111.32) / 0.6, 0);
  });
});

describe('city views', () => {
  it('cover the middle of each city and keep the image proportions', () => {
    for (const v of CITY_VIEWS) {
      const mPerLon = 111_320 * Math.cos((((v.north + v.south) / 2) * Math.PI) / 180);
      const ratio = ((v.east - v.west) * mPerLon) / ((v.north - v.south) * 111_320);
      expect(ratio).toBeCloseTo(v.width / v.height, 2);
    }
  });
});
