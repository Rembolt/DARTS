// Door and window panels (v2-design.md 7.4): each opening is a thin box in a second, small ray index. Closing or
// opening one is a flag change; neither index is ever rebuilt for it, and the main index is never touched.
import { DoubleSide, Ray } from 'three';
import { buildRayIndex, firstHit, type RayIndex } from './geometry';
import { resolveSurfaces, type ResolvedSurface } from './library';
import type { SimState } from './load';
import { faceNormals } from './normals';
import type { Mesh } from './obj';
import type { FromWorker, OpeningGeom, ToWorker, Vec3 } from './types';

export type LoadOpenings = Extract<ToWorker, { type: 'loadOpenings' }>;
export type SetOpenings = Extract<ToWorker, { type: 'setOpenings' }>;
export type OpeningsReady = Extract<FromWorker, { type: 'openingsReady' }>;

/** A panel is at least this deep, metres. */
export const MIN_PANEL_DEPTH = 0.04;
/** The `meshClosed` ray starts this far before the wall's near face and runs this far past its far face. */
const CLOSED_MARGIN = 0.05;
const VERTICES_PER_PANEL = 8;
const TRIANGLES_PER_PANEL = 12;

/** What the worker keeps about the loaded openings. Panel triangles are numbered after the main mesh's. */
export type Panels = {
  openings: OpeningGeom[];
  mesh: Mesh;
  index: RayIndex;
  normals: Float32Array;
  /** Per panel triangle, in the panel index's order: which opening. */
  panelOf: Uint16Array;
  meshClosed: boolean[];
  /** Per opening: closed, so rays hit its panel. */
  active: boolean[];
  /**
   * The openings the scan filled (glass, a closed door leaf): their box is cut out of the main mesh for sound, and
   * their panel stands in for it, so open and closed is the person's choice there too. Without this an opening the
   * scan closed stays shut for sound however it is set.
   */
  carved: Carve[];
  anyActive: boolean;
  /** Per opening: its material (glass or door), resolved like the main mesh's surfaces. */
  surfaces: ResolvedSurface[];
};

/** An opening's box, for `carvedAt`. */
export type Carve = { c0: Vec3; u: Vec3; v: Vec3; uu: number; vv: number; centre: Vec3; normal: Vec3; depth: number };

/** How far either side of the opening's middle plane a scanned surface still counts as filling it, metres. */
const CARVE_MARGIN = 0.15;
/** Kept off the opening's own edges, as a fraction of its width and height: the frame and the wall beside it stay. */
const CARVE_INSET = 0.03;

export function carveOf(o: Pick<OpeningGeom, 'corners' | 'thickness'>): Carve {
  const { centre, normal } = frame(o);
  const [c0, c1, , c3] = o.corners;
  const u = sub(c1, c0), v = sub(c3, c0);
  const depth = Math.max(Number.isFinite(o.thickness) ? o.thickness : 0, MIN_PANEL_DEPTH) / 2 + CARVE_MARGIN;
  return { c0: [...c0] as Vec3, u, v, uu: dot(u, u), vv: dot(v, v), centre, normal, depth };
}

function dot(a: Vec3, b: Vec3): number {
  return a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
}

const rel: Vec3 = [0, 0, 0];

/** True when point `p` lies inside an opening the scan filled: a main-mesh hit there is the scanned glass or leaf, not wall. */
export function carvedAt(state: SimState, p: Vec3): boolean {
  const carved = state.panels?.carved;
  return !!carved && carved.length > 0 && insideAny(carved, p);
}

/** True when `p` is inside one of the boxes. Pure, so the blueprint cuts the same holes the sound goes through. */
export function insideAny(carved: readonly Carve[], p: ArrayLike<number>): boolean {
  for (const c of carved) {
    rel[0] = p[0] - c.centre[0]; rel[1] = p[1] - c.centre[1]; rel[2] = p[2] - c.centre[2];
    if (Math.abs(dot(rel, c.normal)) > c.depth) continue;
    rel[0] = p[0] - c.c0[0]; rel[1] = p[1] - c.c0[1]; rel[2] = p[2] - c.c0[2];
    const s = dot(rel, c.u) / c.uu, t = dot(rel, c.v) / c.vv;
    if (s > CARVE_INSET && s < 1 - CARVE_INSET && t > CARVE_INSET && t < 1 - CARVE_INSET) return true;
  }
  return false;
}

/** True when the scan filled any opening: then every main-mesh hit is checked with `carvedAt`. */
export const hasCarved = (state: SimState): boolean => (state.panels?.carved.length ?? 0) > 0;

function sub(a: Vec3, b: Vec3): Vec3 {
  return [a[0] - b[0], a[1] - b[1], a[2] - b[2]];
}

/** Centre and unit normal of an opening's quad. Throws for a quad with no area. */
function frame(o: Pick<OpeningGeom, 'corners'> & { id?: string }): { centre: Vec3; normal: Vec3 } {
  const [c0, c1, , c3] = o.corners;
  const u = sub(c1, c0), v = sub(c3, c0);
  const n: Vec3 = [u[1] * v[2] - u[2] * v[1], u[2] * v[0] - u[0] * v[2], u[0] * v[1] - u[1] * v[0]];
  const len = Math.hypot(n[0], n[1], n[2]);
  if (!(len > 1e-9)) throw new Error(`loadOpenings: opening ${o.id} has no area`);
  const centre: Vec3 = [0, 0, 0];
  for (const c of o.corners) for (let k = 0; k < 3; k++) centre[k] += c[k] / 4;
  return { centre, normal: [n[0] / len, n[1] / len, n[2] / len] };
}

/**
 * One box per opening: its four corners pushed half the depth (`max(thickness, 0.04)`) to each side along the
 * quad's normal. 8 vertices and 12 triangles each; `panelOfTriangle` gives the opening of each triangle.
 */
export function panelMesh(openings: OpeningGeom[]): { mesh: Mesh; panelOfTriangle: Uint16Array } {
  const positions = new Float32Array(openings.length * VERTICES_PER_PANEL * 3);
  const indices = new Uint32Array(openings.length * TRIANGLES_PER_PANEL * 3);
  const panelOfTriangle = new Uint16Array(openings.length * TRIANGLES_PER_PANEL);
  // Vertices 0–3: front (along +normal), 4–7: back. Faces as quads of vertex numbers.
  const quads = [[0, 1, 2, 3], [7, 6, 5, 4], [0, 4, 5, 1], [1, 5, 6, 2], [2, 6, 7, 3], [3, 7, 4, 0]];
  openings.forEach((o, i) => {
    const { normal } = frame(o);
    const half = Math.max(Number.isFinite(o.thickness) ? o.thickness : 0, MIN_PANEL_DEPTH) / 2;
    const base = i * VERTICES_PER_PANEL;
    for (let side = 0; side < 2; side++) {
      const s = side === 0 ? half : -half;
      o.corners.forEach((c, k) => {
        const at = (base + side * 4 + k) * 3;
        for (let j = 0; j < 3; j++) positions[at + j] = c[j] + normal[j] * s;
      });
    }
    quads.forEach((q, f) => {
      const at = (i * TRIANGLES_PER_PANEL + 2 * f) * 3;
      indices.set([base + q[0], base + q[1], base + q[2], base + q[0], base + q[2], base + q[3]], at);
      panelOfTriangle[i * TRIANGLES_PER_PANEL + 2 * f] = i;
      panelOfTriangle[i * TRIANGLES_PER_PANEL + 2 * f + 1] = i;
    });
  });
  return { mesh: { positions, indices }, panelOfTriangle };
}

function check(openings: OpeningGeom[]): void {
  if (openings.length > 0xffff) {
    throw new Error(`loadOpenings: ${openings.length} openings is too many`);
  }
  for (const o of openings) {
    if (o.kind !== 'window' && o.kind !== 'door') throw new Error(`loadOpenings: opening ${o.id} is a ${o.kind}, not a window or door`);
    if (o.corners?.length !== 4 || o.corners.some(c => c.length !== 3 || c.some(v => !Number.isFinite(v)))) {
      throw new Error(`loadOpenings: opening ${o.id} needs four corners of three numbers`);
    }
  }
}

/** Samples across an opening (columns × rows) for `fillOf`. */
const FILL_COLS = 5, FILL_ROWS = 5;
/** Above this share of samples blocked, the scan shows the opening shut. */
const SHUT = 0.5;
/** A filled opening is looked for a real hole this far along its wall, either way, metres. */
const SNAP_MAX = 0.8;
const SNAP_STEP = 0.1;

const unit = (a: Vec3): Vec3 => {
  const l = Math.hypot(a[0], a[1], a[2]) || 1;
  return [a[0] / l, a[1] / l, a[2] / l];
};

/**
 * The share of rays across the opening (slid `shift` metres along its wall) that hit the scan within the wall's
 * depth: 0 is a clean hole, 1 a filled one (glass, a closed leaf, or no hole there at all).
 */
function fillOf(state: SimState, o: Pick<OpeningGeom, 'corners' | 'thickness'>, shift = 0): number {
  const { normal } = frame(o);
  const [c0, c1, , c3] = o.corners;
  const u = sub(c1, c0), v = sub(c3, c0), along = unit(u);
  const t = Math.max(Number.isFinite(o.thickness) ? o.thickness : 0, 0);
  const back = t / 2 + CLOSED_MARGIN;
  let hits = 0;
  for (let i = 1; i <= FILL_COLS; i++) {
    for (let j = 1; j <= FILL_ROWS; j++) {
      const s = i / (FILL_COLS + 1), r = j / (FILL_ROWS + 1);
      const start: Vec3 = [0, 1, 2].map(k => c0[k] + u[k] * s + v[k] * r + along[k] * shift - normal[k] * back) as Vec3;
      if (firstHit(state.index, start, normal, t + 2 * CLOSED_MARGIN)) hits++;
    }
  }
  return hits / (FILL_COLS * FILL_ROWS);
}

const moveBy = (o: { corners: [Vec3, Vec3, Vec3, Vec3] }, d: Vec3): [Vec3, Vec3, Vec3, Vec3] =>
  o.corners.map(c => [c[0] + d[0], c[1] + d[1], c[2] + d[2]]) as [Vec3, Vec3, Vec3, Vec3];

/**
 * A filled opening slid along its wall onto the scan's real hole, when the floor plan has it a little off: the
 * nearest shift (up to `SNAP_MAX`) where the opening's whole span is clear, and where no other opening already is.
 * Null when it stays: a hole that is open there already, or glass with no hole near it.
 */
function snap(state: SimState, o: { id: string; corners: [Vec3, Vec3, Vec3, Vec3]; thickness: number }, all: { id: string; corners: [Vec3, Vec3, Vec3, Vec3] }[]): [Vec3, Vec3, Vec3, Vec3] | null {
  if (fillOf(state, o) <= 0.8) return null;
  const { centre, normal } = frame(o);
  const along = unit(sub(o.corners[1], o.corners[0]));
  const half = Math.hypot(...sub(o.corners[1], o.corners[0])) / 2;
  const taken = (shift: number) => all.some(other => {
    if (other.id === o.id) return false;
    const f = frame(other);
    const rel = sub(f.centre, centre);
    const otherHalf = Math.hypot(...sub(other.corners[1], other.corners[0])) / 2;
    return Math.abs(dot(rel, normal)) < 0.3 && Math.abs(rel[1]) < 1.5 && Math.abs(dot(rel, along) - shift) < half + otherHalf;
  });
  for (let d = SNAP_STEP; d <= SNAP_MAX + 1e-9; d += SNAP_STEP) {
    for (const shift of [d, -d]) {
      if (fillOf(state, o, shift) < 0.2 && !taken(shift)) return moveBy(o, [along[0] * shift, along[1] * shift, along[2] * shift]);
    }
  }
  return null;
}

/**
 * Load the openings: build their panels in a second ray index and check each against the main mesh. Openings
 * closed earlier (by id) stay closed. Returns their outlines for the blueprint.
 */
export function loadOpenings(state: SimState, msg: LoadOpenings): OpeningsReady {
  const start = performance.now();
  check(msg.openings);
  const gaps = (msg.gaps ?? []).filter(g => g.corners?.length === 4 && g.corners.every(c => c.length === 3 && c.every(Number.isFinite)));
  // The floor plan can be a little off from the scan: each filled opening is slid onto the real hole first.
  const everything = [...msg.openings, ...gaps];
  const moved: { id: string; corners: [Vec3, Vec3, Vec3, Vec3] }[] = [];
  const place = <T extends { id: string; corners: [Vec3, Vec3, Vec3, Vec3]; thickness: number }>(o: T): T => {
    const corners = snap(state, o, everything);
    if (!corners) return o;
    moved.push({ id: o.id, corners });
    return { ...o, corners };
  };
  const openings = msg.openings.map(place);
  const placedGaps = gaps.map(place);
  const lines = new Float32Array(openings.length * 4 * 6);
  openings.forEach((o, i) => {
    for (let k = 0; k < 4; k++) {
      lines.set(o.corners[k], (i * 4 + k) * 6);
      lines.set(o.corners[(k + 1) % 4], (i * 4 + k) * 6 + 3);
    }
  });
  const meshClosed = openings.map(o => fillOf(state, o) > SHUT);

  // (Gaps alone, with no door or window to hold the panel index, are left as the scan has them: rare, and harmless.)
  if (openings.length === 0) {
    state.panels = null;
  } else {
    const { mesh } = panelMesh(openings);
    const index = buildRayIndex(mesh); // reorders mesh.indices: find each triangle's opening from its vertices
    const panelOf = new Uint16Array(mesh.indices.length / 3);
    for (let t = 0; t < panelOf.length; t++) panelOf[t] = Math.floor(mesh.indices[3 * t] / VERTICES_PER_PANEL);
    state.panels = {
      openings: [...openings],
      mesh,
      index,
      normals: faceNormals(mesh),
      panelOf,
      meshClosed,
      active: openings.map(() => false),
      anyActive: false,
      // Every opening and gap, filled or not: cutting out a part that is already a hole changes nothing, and a
      // half-filled one (a door scanned half open) is then fully open or closed by its setting.
      carved: [...openings, ...placedGaps].map(carveOf),
      surfaces: [],
    };
    setActive(state);
    resolveSurfaces(state); // fills the panels' surfaces
  }
  return {
    type: 'openingsReady',
    openings: openings.map((o, i) => ({ id: o.id, meshClosed: meshClosed[i] })),
    ...(moved.length ? { moved } : {}),
    lines,
    ms: performance.now() - start,
  };
}

function setActive(state: SimState): void {
  const p = state.panels;
  if (!p) return;
  // Every opening, the scan-filled ones included: their scanned surface is carved out, so the panel is all there is.
  p.active = p.openings.map(o => state.closedOpenings.has(o.id));
  p.anyActive = p.active.some(Boolean);
}

/** Close the openings listed and open every other loaded one. Unknown ids are kept, for openings loaded later. */
export function applySetOpenings(state: SimState, msg: SetOpenings): void {
  state.closedOpenings = new Set(msg.closed);
  setActive(state);
}

/** The resolved material of opening `i`. */
export function panelSurface(state: SimState, i: number): ResolvedSurface {
  if (!state.panels) throw new Error('no openings loaded');
  return state.panels.surfaces[i];
}

const ray = new Ray();

/**
 * The nearest closed panel along the ray within `far`, as a hit whose triangle is numbered after the main mesh's
 * (`mainTriangles + panel triangle`). Null when no panel is closed.
 */
export function firstPanelHit(state: SimState, origin: Vec3, dir: Vec3, far: number): { distance: number; triangle: number } | null {
  const p = state.panels;
  if (!p || !p.anyActive) return null;
  ray.origin.set(origin[0], origin[1], origin[2]);
  ray.direction.set(dir[0], dir[1], dir[2]).normalize();
  let best: { distance: number; triangle: number } | null = null;
  for (const h of p.index.bvh.raycast(ray, DoubleSide, 0, far)) {
    if (h.faceIndex == null || !p.active[p.panelOf[h.faceIndex]]) continue;
    if (!best || h.distance < best.distance) best = { distance: h.distance, triangle: h.faceIndex };
  }
  return best && { distance: best.distance, triangle: state.mesh.indices.length / 3 + best.triangle };
}

/** Every closed-panel crossing along the ray within `far` (triangles numbered as in `firstPanelHit`). */
export function panelHits(state: SimState, origin: Vec3, dir: Vec3, far: number): { distance: number; triangle: number }[] {
  const p = state.panels;
  if (!p || !p.anyActive) return [];
  ray.origin.set(origin[0], origin[1], origin[2]);
  ray.direction.set(dir[0], dir[1], dir[2]).normalize();
  const main = state.mesh.indices.length / 3;
  const out: { distance: number; triangle: number }[] = [];
  for (const h of p.index.bvh.raycast(ray, DoubleSide, 0, far)) {
    if (h.faceIndex != null && p.active[p.panelOf[h.faceIndex]]) out.push({ distance: h.distance, triangle: main + h.faceIndex });
  }
  return out;
}
