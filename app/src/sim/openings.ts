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
  /** Per opening: closed and not already closed in the mesh, so rays hit it. */
  active: boolean[];
  anyActive: boolean;
  /** Per opening: its material (glass or door), resolved like the main mesh's surfaces. */
  surfaces: ResolvedSurface[];
};

function sub(a: Vec3, b: Vec3): Vec3 {
  return [a[0] - b[0], a[1] - b[1], a[2] - b[2]];
}

/** Centre and unit normal of an opening's quad. Throws for a quad with no area. */
function frame(o: OpeningGeom): { centre: Vec3; normal: Vec3 } {
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

/** True when the main mesh already fills the opening: a ray through its centre hits a surface within the wall. */
function closedInMesh(state: SimState, o: OpeningGeom): boolean {
  const { centre, normal } = frame(o);
  const t = Math.max(Number.isFinite(o.thickness) ? o.thickness : 0, 0);
  const back = t / 2 + CLOSED_MARGIN;
  const start: Vec3 = [centre[0] - normal[0] * back, centre[1] - normal[1] * back, centre[2] - normal[2] * back];
  return firstHit(state.index, start, normal, t + 2 * CLOSED_MARGIN) !== null;
}

/**
 * Load the openings: build their panels in a second ray index and check each against the main mesh. Openings
 * closed earlier (by id) stay closed. Returns their outlines for the blueprint.
 */
export function loadOpenings(state: SimState, msg: LoadOpenings): OpeningsReady {
  const start = performance.now();
  const openings = msg.openings;
  check(openings);
  const lines = new Float32Array(openings.length * 4 * 6);
  openings.forEach((o, i) => {
    for (let k = 0; k < 4; k++) {
      lines.set(o.corners[k], (i * 4 + k) * 6);
      lines.set(o.corners[(k + 1) % 4], (i * 4 + k) * 6 + 3);
    }
  });
  const meshClosed = openings.map(o => closedInMesh(state, o));

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
      surfaces: [],
    };
    setActive(state);
    resolveSurfaces(state); // fills the panels' surfaces
  }
  return {
    type: 'openingsReady',
    openings: openings.map((o, i) => ({ id: o.id, meshClosed: meshClosed[i] })),
    lines,
    ms: performance.now() - start,
  };
}

function setActive(state: SimState): void {
  const p = state.panels;
  if (!p) return;
  p.active = p.openings.map((o, i) => state.closedOpenings.has(o.id) && !p.meshClosed[i]);
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
