// The fixture `fixtures/vexcel-detect.json` is one real answer of POST /v2/elements/detect for the demo house,
// captured once on Nov 15 2026 with the body `detectBody(29.838364, -95.255745)` builds (a 400 m square around
// lat 29.838364, lon -95.255745). Only the JSON answer was saved: no headers, no key.
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import pngjs from 'pngjs';
import { describe, expect, it } from 'vitest';
import { detectBody, readDetections } from '../src/surroundings/detect.js';

const { PNG } = pngjs;
const FIXTURE: unknown = JSON.parse(readFileSync(join(import.meta.dirname, 'fixtures', 'vexcel-detect.json'), 'utf8'));
const LAT = 29.838364;
const LON = -95.255745;

const M_PER_DEG_LAT = 111_320;
const mPerDegLon = (lat: number) => 111_320 * Math.cos((lat * Math.PI) / 180);

/** A WKT box from metres east/north of (LAT, LON). */
function boxWkt(west: number, east: number, south: number, north: number): string {
  const lon = (m: number) => LON + m / mPerDegLon(LAT);
  const lat = (m: number) => LAT + m / M_PER_DEG_LAT;
  const [w, e, s, n] = [lon(west), lon(east), lat(south), lat(north)];
  return `POLYGON ((${w} ${n}, ${e} ${n}, ${e} ${s}, ${w} ${s}, ${w} ${n}))`;
}

/** A base64 PNG, white where `white(x, y)` is true. */
function maskPng(w: number, h: number, white: (x: number, y: number) => boolean): string {
  const png = new PNG({ width: w, height: h });
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const i = (y * w + x) * 4;
      const v = white(x, y) ? 255 : 0;
      png.data[i] = png.data[i + 1] = png.data[i + 2] = v;
      png.data[i + 3] = 255;
    }
  }
  return PNG.sync.write(png).toString('base64');
}

const answer = (features: { label: string; detections: Record<string, unknown>[] }[], captureMs?: number) => ({
  type: 'FeatureCollection',
  images: captureMs === undefined ? [] : [{ 'image-id': 'ortho-1', metadata: { 'last-capture-date': captureMs } }],
  features: features.map(properties => ({ type: 'Feature', properties })),
});

describe('detectBody', () => {
  it('asks for highway at 0.7 and masks', () => {
    const body = detectBody(LAT, LON) as {
      wkt: string; srid: number; 'buffer-meter': number;
      images: { endpoint: string; request: { wkt: string; crop: string } }[];
      'model-input': { elements: { label: string; model: string; 'detection-threshold': number }[]; include: string[] };
    };
    const threshold = (label: string) => body['model-input'].elements.find(e => e.label === label)?.['detection-threshold'];
    expect(threshold('highway')).toBe(0.7);
    expect(threshold('railway')).toBe(0.6);
    for (const label of ['house', 'commercial building', 'parking lot', 'warehouse', 'trees', 'road']) expect(threshold(label)).toBe(0.5);
    expect(body['model-input'].elements.every(e => e.model === 'sam3')).toBe(true);
    expect(body['model-input'].include).toEqual(['bbox', 'confidence', 'pixel-mask', 'pixel-bbox']);
    expect(body.srid).toBe(4326);
    expect(body['buffer-meter']).toBe(0);
    expect(body.images).toHaveLength(1);
    expect(body.images[0]!.endpoint).toBe('ortho/extract');
    expect(body.images[0]!.request.wkt).toBe(body.wkt);
  });
});

describe('readDetections', () => {
  it('counts buildings in the fixture', () => {
    const r = readDetections(FIXTURE, LAT, LON);
    expect(r.counts.house).toBeGreaterThan(40);
    expect(r.counts['commercial building'] ?? 0).toBe(0);
  });

  it('finds no highway at the demo house', () => expect(readDetections(FIXTURE, LAT, LON).nearest.highway).toBeUndefined());

  it('finds the street in front of the demo house', () => {
    const road = readDetections(FIXTURE, LAT, LON).nearest.road;
    expect(road).toBeDefined();
    expect(road!.distanceM).toBeLessThan(40);
  });

  it('measures the nearest road from its mask, not its box', () => {
    // The box runs from 50 m to 150 m east of the property; the mask is white only in its right-hand column.
    const r = readDetections(answer([{ label: 'road', detections: [{
      bbox: boxWkt(50, 150, -50, 50), confidence: 0.6, 'pixel-bbox': [0, 0, 100, 100],
      'pixel-mask': maskPng(100, 100, x => x === 99),
    }] }]), LAT, LON);
    expect(r.nearest.road!.distanceM).toBeGreaterThan(145);
    expect(r.nearest.road!.distanceM).toBeLessThan(155);
    expect(Math.abs(r.nearest.road!.bearingDeg - 90)).toBeLessThan(5);
  });

  it('gives no distance for a mask with no white pixel', () => {
    const r = readDetections(answer([{ label: 'highway', detections: [{
      bbox: boxWkt(50, 150, -50, 50), confidence: 0.8, 'pixel-bbox': [0, 0, 20, 20], 'pixel-mask': maskPng(20, 20, () => false),
    }] }]), LAT, LON);
    expect(r.nearest.highway).toBeUndefined();
    expect(r.counts.highway).toBe(1);
  });

  it('ignores a box that contains the property when there is no mask', () => {
    const r = readDetections(answer([{ label: 'road', detections: [{ bbox: boxWkt(-100, 100, -100, 100), confidence: 0.6 }] }]), LAT, LON);
    expect(r.nearest.road).toBeUndefined();
    expect(r.counts.road).toBe(1);
  });

  it('uses the nearest edge of a box outside the property when there is no mask', () => {
    const r = readDetections(answer([{ label: 'railway', detections: [{ bbox: boxWkt(-50, 50, 80, 120), confidence: 0.7 }] }]), LAT, LON);
    expect(r.nearest.railway!.distanceM).toBeCloseTo(80, 0);
    expect(r.nearest.railway!.bearingDeg).toBeCloseTo(0, 0);
  });

  it('keeps the nearest of several detections', () => {
    const r = readDetections(answer([
      { label: 'highway', detections: [{ bbox: boxWkt(200, 250, -10, 10), confidence: 0.8 }] },
      { label: 'highway', detections: [{ bbox: boxWkt(-10, 10, -120, -100), confidence: 0.8 }] },
    ]), LAT, LON);
    expect(r.counts.highway).toBe(2);
    expect(r.nearest.highway!.distanceM).toBeCloseTo(100, 0);
    expect(r.nearest.highway!.bearingDeg).toBeCloseTo(180, 0);
  });

  it('reads the imagery date', () => {
    expect(readDetections(answer([], 1770485547000), LAT, LON).imageryDate).toBe('2026-02-07');
    expect(readDetections(FIXTURE, LAT, LON).imageryDate).toBe('2026-02-07');
  });

  it('returns empty counts for an answer with no features', () => {
    for (const empty of [answer([]), {}, null, 'nonsense', { features: 'x' }]) {
      expect(readDetections(empty, LAT, LON)).toEqual({ counts: {}, nearest: {}, imageryDate: null });
    }
  });

  it('survives a broken mask by falling back to the box rule', () => {
    const r = readDetections(answer([{ label: 'road', detections: [{
      bbox: boxWkt(-50, 50, 80, 120), confidence: 0.6, 'pixel-bbox': [0, 0, 10, 10], 'pixel-mask': 'not a png',
    }] }]), LAT, LON);
    expect(r.nearest.road!.distanceM).toBeCloseTo(80, 0);
  });
});
