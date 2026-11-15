// Textbook room-acoustics estimates for the quick summary (spec 5.4). Pure functions, metric units.
// Rough material values in, rough numbers out: every result is an estimate, never a measurement.
import type { Requirements, RoomSummary } from '../shared/contract.js';
import type { PiEdge, PiRoom } from './pi.js';

/** Σ S·min(α + furnishing, 0.99): furnishing never makes a surface a perfect absorber. */
export function absorptionArea(surfaces: { area: number; alpha: number }[], furnishing: number): number {
  return surfaces.reduce((sum, s) => sum + s.area * Math.min(s.alpha + furnishing, 0.99), 0);
}

/** Sabine echo time RT60 = 0.161·V/A, in seconds. */
export function sabine(volume: number, absorption: number): number {
  return absorption > 0 ? (0.161 * volume) / absorption : 0;
}

export function echoWord(rt60Mid: number): RoomSummary['echoWord'] {
  if (rt60Mid < 0.3) return 'dead';
  if (rt60Mid < 0.6) return 'controlled';
  if (rt60Mid <= 1.0) return 'lively';
  return 'echoey';
}

/** How much louder a source is at 1 m than outdoors: 10·log10(1 + 16π/R), R = A/(1 − A/S). */
export function roomGainDb(absorption: number, surface: number): number {
  const alpha = Math.min(absorption / surface, 0.99);
  const roomConstant = absorption / (1 - alpha);
  return roomConstant > 0 ? 10 * Math.log10(1 + (16 * Math.PI) / roomConstant) : 0;
}

/** Area-weighted transmission loss of a facade: −10·log10(Σ S·10^(−TL/10) / Σ S). */
export function compositeTl(parts: { area: number; tl: number }[]): number {
  const total = parts.reduce((s, p) => s + p.area, 0);
  if (!(total > 0)) return 0;
  const passed = parts.reduce((s, p) => s + p.area * 10 ** (-p.tl / 10), 0);
  return -10 * Math.log10(passed / total);
}

/** Outside noise heard inside: L_facade − TL + 10·log10(S_ext / A). */
export function outsideInsideDb(facadeDb: number, tl: number, exteriorArea: number, absorption: number): number {
  return facadeDb - tl + 10 * Math.log10(exteriorArea / absorption);
}

/** A 90 dB source in the room heard 10 m outside: 90 − 6 − TL + 10·log10(S) − 20·log10(10) − 8. */
export function escapeDb(tl: number, exteriorArea: number): number {
  return 90 - 6 - tl + 10 * Math.log10(exteriorArea) - 20 - 8;
}

/** Two of the three dimensions within 5% of 1:1 or 2:1 (stacked axial modes). A missing dimension never counts. */
export function boomyBass(width: number, depth: number, height: number): boolean {
  const dims = [width, depth, height];
  if (!dims.every(d => d > 0)) return false;
  const near = (a: number, b: number) => {
    const ratio = Math.max(a, b) / Math.min(a, b);
    return Math.abs(ratio - 1) <= 0.05 || Math.abs(ratio - 2) <= 0.1;
  };
  return near(width, depth) || near(width, height) || near(depth, height);
}

const length = (e: Pick<PiEdge, 'a' | 'b'>) => Math.hypot(e.b[0] - e.a[0], e.b[1] - e.a[1]);

/** Σ edge lengths; without edges 2·(width + depth); without those either, the perimeter of a square of that area. */
export function perimeter(room: PiRoom): number {
  if (room.edges.length > 0) return room.edges.reduce((s, e) => s + length(e), 0);
  if (room.width > 0 && room.depth > 0) return 2 * (room.width + room.depth);
  return 4 * Math.sqrt(Math.max(room.area, 0));
}

/** Another room's edge closer than this means the wall is shared. */
const SHARED_WITHIN_M = 0.3;
const SAMPLE_STEP_M = 0.1;
/** Edges at more than this angle can't be the two faces of one wall. */
const PARALLEL_COS = Math.cos((20 * Math.PI) / 180);

/** True when the point lies within 0.3 m of a roughly parallel edge, measured square to that edge, inside its ends. */
function nearAny(p: [number, number], direction: [number, number], edges: PiEdge[]): boolean {
  for (const e of edges) {
    const ex = e.b[0] - e.a[0];
    const ey = e.b[1] - e.a[1];
    const len = Math.hypot(ex, ey);
    if (len === 0) continue;
    if (Math.abs((ex * direction[0] + ey * direction[1]) / len) < PARALLEL_COS) continue;
    const t = ((p[0] - e.a[0]) * ex + (p[1] - e.a[1]) * ey) / (len * len);
    if (t < 0 || t > 1) continue;
    const dist = Math.abs((p[0] - e.a[0]) * ey - (p[1] - e.a[1]) * ex) / len;
    if (dist <= SHARED_WITHIN_M) return true;
  }
  return false;
}

/**
 * The room's outside walls: parts of its `wall` edges with no other room's edge within 0.3 m, sampled every 0.1 m so a
 * partly shared wall counts by its outside part. `others` should be every other room on the same floor, the tiny and
 * Void ones too. Areas use the room's height; windows count when their centre is on an outside part.
 */
export function exteriorWalls(room: PiRoom, others: PiRoom[]): { wallArea: number; windowArea: number } {
  const theirs = others.filter(o => o.id !== room.id).flatMap(o => o.edges);
  let outsideLength = 0;
  let windowArea = 0;
  for (const edge of room.edges) {
    if (edge.type !== 'wall') continue;
    const len = length(edge);
    if (len === 0) continue;
    const dir: [number, number] = [(edge.b[0] - edge.a[0]) / len, (edge.b[1] - edge.a[1]) / len];
    const at = (t: number): [number, number] => [edge.a[0] + dir[0] * len * t, edge.a[1] + dir[1] * len * t];
    const n = Math.max(1, Math.ceil(len / SAMPLE_STEP_M));
    let outside = 0;
    for (let i = 0; i < n; i++) if (!nearAny(at((i + 0.5) / n), dir, theirs)) outside++;
    outsideLength += (len * outside) / n;
    for (const o of edge.openings) {
      if (o.type === 'window' && !nearAny(at(o.relativeCenter), dir, theirs)) windowArea += o.width * o.height;
    }
  }
  return { wallArea: outsideLength * room.height, windowArea };
}

/** 1 inside the range, falling linearly to 0 at `falloff` outside it. */
export function criterion(value: number, range: [number, number], falloff: number): number {
  const [lo, hi] = range;
  const off = value < lo ? lo - value : value > hi ? value - hi : 0;
  if (off === 0) return 1;
  return falloff > 0 ? Math.max(0, 1 - off / falloff) : 0;
}

/**
 * The weighted score of a room, 0 to 1 (spec 5.5). A criterion that could not be computed (null outside or escape
 * level, or escape when the profile has no limit) is left out and the other weights rescaled. An interior room passes
 * escape. Bass scores 0 for a 'boomy bass' room and 1 otherwise; the profile's bass weight says how much that matters.
 */
export function scoreRoom(room: Omit<RoomSummary, 'score'>, req: Requirements): number {
  const parts: { weight: number; value: number }[] = [
    { weight: req.weights.echo, value: criterion(room.echo[1], req.echoMid, 0.3) },
    { weight: req.weights.size, value: criterion(room.area, [req.minRoomArea, Infinity], req.minRoomArea / 2) },
    { weight: req.weights.bass, value: room.flags.includes('boomy bass') ? 0 : 1 },
  ];
  if (room.outsideDb !== null) {
    parts.push({ weight: req.weights.outside, value: criterion(room.outsideDb, [-Infinity, req.maxOutsideDb], 10) });
  }
  if (req.maxEscapeDb !== null) {
    if (room.flags.includes('interior room')) parts.push({ weight: req.weights.escape, value: 1 });
    else if (room.escapeDb !== null) {
      parts.push({ weight: req.weights.escape, value: criterion(room.escapeDb, [-Infinity, req.maxEscapeDb], 10) });
    }
  }
  const total = parts.reduce((s, p) => s + p.weight, 0);
  return total > 0 ? parts.reduce((s, p) => s + p.weight * p.value, 0) / total : 0;
}
