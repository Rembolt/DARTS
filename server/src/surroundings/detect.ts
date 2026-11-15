// The Vexcel detection call (design section 6.2): the request body, and reading its answer into building counts,
// the nearest highway, railway and road, and the imagery date.
import pngjs from 'pngjs';
import { square } from './area.js';

const { PNG } = pngjs;

/** Half the side of the square around the property. The image is 2048 px whatever the area, so 400 m it is. */
export const DETECT_HALF_M = 200;

/** Every ortho layer, so the API picks the best one here (the string `scripts/vexcel_quickstart.py` uses). */
const LAYERS = 'urban,urban-r,wide-area,urban-g';

/** Counted (box and confidence only), then located (the mask gives the distance). */
const ELEMENTS: [label: string, threshold: number][] = [
  ['house', 0.5], ['commercial building', 0.5], ['parking lot', 0.5], ['warehouse', 0.5], ['trees', 0.5],
  ['road', 0.5], ['railway', 0.6], ['highway', 0.7],
];

type LocatedLabel = 'highway' | 'railway' | 'road';
const LOCATED: readonly LocatedLabel[] = ['highway', 'railway', 'road'];

/** The POST /elements/detect body for a 400 m square centred on the property. */
export function detectBody(lat: number, lon: number): unknown {
  const wkt = square(lat, lon, DETECT_HALF_M);
  return {
    wkt,
    srid: 4326,
    'buffer-meter': 0,
    images: [{ endpoint: 'ortho/extract', request: { layer: LAYERS, srid: 4326, wkt, crop: 'bounding_box' } }],
    'model-input': {
      elements: ELEMENTS.map(([label, threshold]) => ({ label, model: 'sam3', 'detection-threshold': threshold })),
      // The API requires pixel-bbox whenever pixel-mask is asked for.
      include: ['bbox', 'confidence', 'pixel-mask', 'pixel-bbox'],
    },
  };
}

export type Detections = {
  counts: Record<string, number>;
  nearest: Partial<Record<LocatedLabel, { distanceM: number; bearingDeg: number }>>;
  imageryDate: string | null;
};

type Box = { w: number; e: number; s: number; n: number };
type Hit = { distanceM: number; bearingDeg: number };

const isObject = (v: unknown): v is Record<string, unknown> => typeof v === 'object' && v !== null;

/** The bounds of a WKT polygon (only its numbers are read), or null. */
function bounds(wkt: unknown): Box | null {
  if (typeof wkt !== 'string') return null;
  const nums = wkt.match(/-?\d+(?:\.\d+)?(?:[eE][-+]?\d+)?/g)?.map(Number) ?? [];
  if (nums.length < 4 || nums.length % 2 !== 0) return null;
  const lons = nums.filter((_, i) => i % 2 === 0);
  const lats = nums.filter((_, i) => i % 2 === 1);
  const box = { w: Math.min(...lons), e: Math.max(...lons), s: Math.min(...lats), n: Math.max(...lats) };
  return Object.values(box).every(Number.isFinite) ? box : null;
}

/** Local flat metres around the property: plenty for a 400 m square. */
function local(lat0: number, lon0: number) {
  const mLat = 111_320;
  const mLon = 111_320 * Math.cos((lat0 * Math.PI) / 180);
  return {
    east: (lon: number) => (lon - lon0) * mLon,
    north: (lat: number) => (lat - lat0) * mLat,
  };
}

const hitAt = (east: number, north: number): Hit => ({
  distanceM: Math.hypot(east, north),
  bearingDeg: ((Math.atan2(east, north) * 180) / Math.PI + 360) % 360,
});

/** Sample positions 0, step, 2·step … and always the last one, so an edge row or column is never skipped. */
function samples(size: number, step: number): number[] {
  const out: number[] = [];
  for (let i = 0; i < size; i += step) out.push(i);
  if (out[out.length - 1] !== size - 1) out.push(size - 1);
  return out;
}

const MASK_STEP = 4;

/**
 * The white mask pixel nearest the property. The mask is the detection's pixel box clipped to the image, as is the
 * detection's map `bbox`, so the mask is stretched over the bbox (ortho: up is north, right is east), as
 * `mask_to_wkt` in scripts/vexcel_quickstart.py does. Returns undefined for no white pixel, null for a broken mask.
 */
function nearestInMask(maskB64: string, box: Box, lat: number, lon: number): Hit | undefined | null {
  let png: { width: number; height: number; data: Buffer };
  try {
    png = PNG.sync.read(Buffer.from(maskB64, 'base64'));
  } catch {
    return null;
  }
  const { width: w, height: h, data } = png;
  if (w === 0 || h === 0) return null;
  const { east, north } = local(lat, lon);
  const [x0, x1] = [east(box.w), east(box.e)];
  const [y0, y1] = [north(box.n), north(box.s)];
  let best: Hit | undefined;
  for (const y of samples(h, MASK_STEP)) {
    const ny = y0 + ((y + 0.5) / h) * (y1 - y0);
    for (const x of samples(w, MASK_STEP)) {
      if ((data[(y * w + x) * 4] ?? 0) <= 128) continue;
      const hit = hitAt(x0 + ((x + 0.5) / w) * (x1 - x0), ny);
      if (best === undefined || hit.distanceM < best.distanceM) best = hit;
    }
  }
  return best;
}

/** The nearest point of a box the property is outside of; undefined when the box contains the property. */
function nearestOnBox(box: Box, lat: number, lon: number): Hit | undefined {
  const { east, north } = local(lat, lon);
  const clamp = (v: number, lo: number, hi: number) => Math.min(Math.max(v, lo), hi);
  const ex = clamp(0, east(box.w), east(box.e));
  const ny = clamp(0, north(box.s), north(box.n));
  if (ex === 0 && ny === 0) return undefined;
  return hitAt(ex, ny);
}

function locate(detection: Record<string, unknown>, lat: number, lon: number): Hit | undefined {
  const box = bounds(detection.bbox);
  if (box === null) return undefined;
  const mask = detection['pixel-mask'];
  if (typeof mask === 'string' && mask !== '') {
    const fromMask = nearestInMask(mask, box, lat, lon);
    if (fromMask !== null) return fromMask;
  }
  return nearestOnBox(box, lat, lon);
}

function imageryDate(answer: Record<string, unknown>): string | null {
  const images = answer.images;
  if (!Array.isArray(images) || !isObject(images[0]) || !isObject(images[0].metadata)) return null;
  const ms = images[0].metadata['last-capture-date'];
  if (typeof ms !== 'number' || !Number.isFinite(ms)) return null;
  return new Date(ms).toISOString().slice(0, 10);
}

/** Counts per label, the nearest highway, railway and road, and the imagery date. Anything malformed is skipped. */
export function readDetections(answer: unknown, lat: number, lon: number): Detections {
  const out: Detections = { counts: {}, nearest: {}, imageryDate: null };
  if (!isObject(answer)) return out;
  out.imageryDate = imageryDate(answer);
  if (!Array.isArray(answer.features)) return out;
  for (const feature of answer.features) {
    if (!isObject(feature) || !isObject(feature.properties)) continue;
    const { label, detections } = feature.properties;
    if (typeof label !== 'string' || !Array.isArray(detections)) continue;
    for (const detection of detections) {
      if (!isObject(detection)) continue;
      out.counts[label] = (out.counts[label] ?? 0) + 1;
      if (!(LOCATED as readonly string[]).includes(label)) continue;
      const hit = locate(detection, lat, lon);
      const key = label as LocatedLabel;
      const prev = out.nearest[key];
      if (hit !== undefined && (prev === undefined || hit.distanceM < prev.distanceM)) out.nearest[key] = hit;
    }
  }
  return out;
}
