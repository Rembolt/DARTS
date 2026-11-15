// Traced sound paths in the blueprint view (mvp-design.md 7, build step 8): a marker per source, a dashed direct line
// from the listener to each source, and the strongest reflection paths of the last trace, one colour per source and
// more opaque for stronger paths.
import {
  BufferAttribute,
  BufferGeometry,
  Group,
  LineBasicMaterial,
  LineDashedMaterial,
  LineSegments,
  Mesh,
  MeshBasicMaterial,
  Points,
  PointsMaterial,
  SphereGeometry,
  Color,
  CanvasTexture,
} from 'three';
import type { Vec3 } from '../sim/types';
import { createSonar } from './sonar';

/** The look of the paths layer. Will move to `config.ts` (next to `BLUEPRINT`) later. */
export const PATHS_STYLE = {
  /**
   * One colour per source index (indoor = 0, outdoor = 1), cycled for more. Okabe-Ito vermillion and bluish green:
   * told apart under the common colour-blindnesses, dark enough to read on 85% white, and unlike the dark-blue mesh.
   */
  sourceColors: ['#c98a1d', '#d9462a', '#4d7a52', '#7a4b6b'],
  /** Opacity of the strongest path and of the weakest drawn path; the ones between are spaced evenly by rank. */
  strongestAlpha: 1,
  weakestAlpha: 0.15,
  /** The direct line: dashed, a little see-through, so it reads apart from the reflection paths. */
  directAlpha: 0.8,
  dashSize: 0.3, // metres
  gapSize: 0.2, // metres
  /** Lines start this far from the listener: lines that begin at the camera itself are clipped away (design 7). */
  listenerGap: 0.3, // metres
  /** The sound lines end this far below the camera (metres), so they can be seen from the camera's own position. */
  lineDrop: 0.75,
  /**
   * Source marker radius in metres: a sphere at the source, seen in perspective like the walls, so a near source looks
   * near (a screen-constant dot looked far away). 0.12 m: small up close, still about 5 px at 25 m on an 800 px view.
   */
  markerRadius: 0.12,
  markerAlpha: 0.9,
  /** The ray fan (Rays in the dock): colour of the rays, of the dots where a wall takes some, and their sizes. */
  rayColor: '#d9462a',
  hitColor: '#2b1d14',
  rayMinAlpha: 0.1,
  rayMaxAlpha: 0.85,
  hitSize: 7, // pixels at full absorption
  /** The ray animation: how fast a wavefront travels (drawn m/s), how long the finished fan stays, then fades (s). */
  raySpeed: 10,
  rayHold: 1.2,
  rayFade: 0.8,
  headSize: 10, // pixels, the bright point at the front of each ray
  /** Opacity of the paths themselves: a faint trail under the sonar pulses (sonar.ts). */
  trailOpacity: 0.22,
};

export type TraceOverlay = {
  listener: Vec3;
  sources: { position: Vec3 }[];
  paths: Float32Array; // 6 floats per segment, strongest path first (the worker's `trace` reply)
  pathSource: Uint8Array; // one source index per segment
  /** The ray fan: segments (6 floats each), the strength each carries (0..1) and the hits (x, y, z, absorbed share). */
  rays?: Float32Array;
  raySegmentStrength?: Float32Array;
  rayHits?: Float32Array;
  /** How much of each source gets through the walls (0..1, mid band): the direct beam calms by this much on the way. */
  directStrength?: number[];
};

export type PathGroup = { firstSegment: number; segmentCount: number; source: number };

const SAME_POINT = 1e-6;

/**
 * Splits the worker's segment list into paths. A new path starts where a segment does not begin at the previous
 * segment's end, or where the source changes. Paths keep the worker's order, so the index is the strength rank.
 */
export function groupPaths(paths: Float32Array, pathSource: Uint8Array): PathGroup[] {
  const count = Math.min(Math.floor(paths.length / 6), pathSource.length);
  const groups: PathGroup[] = [];
  let current: PathGroup | null = null;
  for (let s = 0; s < count; s++) {
    const o = s * 6;
    const source = pathSource[s];
    const joins =
      current !== null &&
      current.source === source &&
      Math.abs(paths[o] - paths[o - 3]) < SAME_POINT &&
      Math.abs(paths[o + 1] - paths[o - 2]) < SAME_POINT &&
      Math.abs(paths[o + 2] - paths[o - 1]) < SAME_POINT;
    if (joins) current!.segmentCount++;
    else {
      current = { firstSegment: s, segmentCount: 1, source };
      groups.push(current);
    }
  }
  return groups;
}

/** The opacity of the path at `rank` (0 = strongest) among `count` drawn paths. */
export function rankAlpha(rank: number, count: number, style = PATHS_STYLE): number {
  if (count <= 1) return style.strongestAlpha;
  const t = Math.min(1, Math.max(0, rank / (count - 1)));
  return style.strongestAlpha + (style.weakestAlpha - style.strongestAlpha) * t;
}

/** The colour of source `index` as linear 0..1 RGB, the way three.js wants vertex colours. */
export function sourceRgb(index: number, style = PATHS_STYLE): Vec3 {
  const c = new Color(style.sourceColors[index % style.sourceColors.length]);
  return [c.r, c.g, c.b];
}

/** The point `distance` metres along a polyline (flat xyz triples), clamped to its ends. */
export function pointAlong(points: Float32Array | number[], distance: number): Vec3 {
  const n = points.length / 3;
  if (n === 0) return [0, 0, 0];
  let left = Math.max(0, distance);
  for (let i = 0; i + 1 < n; i++) {
    const [ax, ay, az, bx, by, bz] = [points[i * 3], points[i * 3 + 1], points[i * 3 + 2], points[i * 3 + 3], points[i * 3 + 4], points[i * 3 + 5]];
    const len = Math.hypot(bx - ax, by - ay, bz - az);
    if (left <= len || i === n - 2) {
      const t = len > 0 ? Math.min(1, left / len) : 0;
      return [ax + (bx - ax) * t, ay + (by - ay) * t, az + (bz - az) * t];
    }
    left -= len;
  }
  return [points[0], points[1], points[2]];
}

/** Each path of a trace as one polyline running from its source to the listener, with its colour index and length. */
export type Route = { points: Float32Array; length: number; source: number; /** 0..1, from the path's strength rank */ strength: number; /** the straight line source → listener, not a reflection */ direct?: boolean };

export function buildRoutes(trace: TraceOverlay, style = PATHS_STYLE): Route[] {
  const routes: Route[] = [];
  const measure = (pts: number[]) => {
    let length = 0;
    for (let i = 0; i + 1 < pts.length / 3; i++)
      length += Math.hypot(pts[i * 3 + 3] - pts[i * 3], pts[i * 3 + 4] - pts[i * 3 + 1], pts[i * 3 + 5] - pts[i * 3 + 2]);
    return length;
  };
  const groups = groupPaths(trace.paths, trace.pathSource);
  groups.forEach((g, rank) => {
    // Segments run listener → source; sound travels the other way.
    const pts: number[] = [];
    for (let s = g.firstSegment + g.segmentCount - 1; s >= g.firstSegment; s--) {
      const o = s * 6;
      if (pts.length === 0) pts.push(trace.paths[o + 3], trace.paths[o + 4], trace.paths[o + 5]);
      pts.push(trace.paths[o], trace.paths[o + 1], trace.paths[o + 2]);
    }
    const length = measure(pts);
    if (length > 0.01) routes.push({ points: Float32Array.from(pts), length, source: g.source, strength: rankAlpha(rank, groups.length, style) });
  });
  const [lx, ly, lz] = trace.listener;
  trace.sources.forEach((src, i) => {
    const d = Math.hypot(src.position[0] - lx, src.position[1] - ly, src.position[2] - lz);
    if (d <= style.listenerGap) return;
    // Drawn ending a little below the eye: a line that ends exactly at the camera projects onto one pixel and cannot be seen.
    routes.push({ points: Float32Array.from([...src.position, lx, ly - style.lineDrop, lz]), length: d, source: i, strength: 1, direct: true });
  });
  return routes;
}

/** Vertex arrays for the ray fan: every segment opaque by the strength it still carries; every hit by what the wall took. */
export function buildRayArrays(trace: TraceOverlay, style = PATHS_STYLE) {
  const rays = trace.rays ?? new Float32Array(0);
  const strength = trace.raySegmentStrength ?? new Float32Array(0);
  const segments = Math.min(Math.floor(rays.length / 6), strength.length);
  const rayColors = new Float32Array(segments * 8);
  const c = new Color(style.rayColor);
  for (let i = 0; i < segments; i++) {
    const a = style.rayMinAlpha + (style.rayMaxAlpha - style.rayMinAlpha) * Math.min(1, Math.max(0, strength[i]));
    rayColors.set([c.r, c.g, c.b, a, c.r, c.g, c.b, a], i * 8);
  }
  const hits = trace.rayHits ?? new Float32Array(0);
  const n = Math.floor(hits.length / 4);
  const hitPositions = new Float32Array(n * 3);
  const hitColors = new Float32Array(n * 4);
  const h = new Color(style.hitColor);
  for (let i = 0; i < n; i++) {
    hitPositions.set(hits.subarray(i * 4, i * 4 + 3), i * 3);
    hitColors.set([h.r, h.g, h.b, 0.1 + 0.8 * Math.min(1, Math.max(0, hits[i * 4 + 3]))], i * 4);
  }
  return { rayPositions: rays.slice(0, segments * 6), rayColors, hitPositions, hitColors };
}

let dotTexture: CanvasTexture | null = null;
/** A soft round dot for the ray points (a point is a square without it). */
function dot(): CanvasTexture | null {
  if (dotTexture || typeof document === 'undefined') return dotTexture;
  const c = document.createElement('canvas');
  c.width = c.height = 64;
  const g = c.getContext('2d');
  if (!g) return null;
  const grad = g.createRadialGradient(32, 32, 0, 32, 32, 32);
  grad.addColorStop(0, 'rgba(255,255,255,1)');
  grad.addColorStop(0.7, 'rgba(255,255,255,1)');
  grad.addColorStop(1, 'rgba(255,255,255,0)');
  g.fillStyle = grad;
  g.fillRect(0, 0, 64, 64);
  dotTexture = new CanvasTexture(c);
  return dotTexture;
}

export type RayPlan = {
  n: number; // segments
  start: Float32Array; // 3 per segment
  end: Float32Array;
  cum0: Float32Array; // metres travelled along the ray when the segment starts
  len: Float32Array;
  strength: Float32Array; // carried along the segment, 0..1
  absorbed: Float32Array; // share the wall at the segment's end takes, 0..1
  maxLen: number; // longest ray in metres
};

/** The fan as a plan to animate: segments chained into rays (a ray starts where a segment begins at the listener). */
export function planRays(trace: TraceOverlay): RayPlan {
  const rays = trace.rays ?? new Float32Array(0);
  const strength = trace.raySegmentStrength ?? new Float32Array(0);
  const hits = trace.rayHits ?? new Float32Array(0);
  const n = Math.min(Math.floor(rays.length / 6), strength.length, Math.floor(hits.length / 4));
  const plan: RayPlan = {
    n, start: new Float32Array(n * 3), end: new Float32Array(n * 3), cum0: new Float32Array(n),
    len: new Float32Array(n), strength: strength.slice(0, n), absorbed: new Float32Array(n), maxLen: 0,
  };
  let cum = 0;
  for (let i = 0; i < n; i++) {
    const o = i * 6;
    const fromListener = Math.hypot(rays[o] - trace.listener[0], rays[o + 1] - trace.listener[1], rays[o + 2] - trace.listener[2]) < 1e-4;
    if (fromListener) cum = 0;
    plan.start.set(rays.subarray(o, o + 3), i * 3);
    plan.end.set(rays.subarray(o + 3, o + 6), i * 3);
    plan.len[i] = Math.hypot(rays[o + 3] - rays[o], rays[o + 4] - rays[o + 1], rays[o + 5] - rays[o + 2]);
    plan.cum0[i] = cum;
    plan.absorbed[i] = hits[i * 4 + 3];
    cum += plan.len[i];
    plan.maxLen = Math.max(plan.maxLen, cum);
  }
  return plan;
}

/** Seconds one run of the animation lasts: the wave reaches the longest ray's end, holds, then fades. */
export function rayPeriod(plan: RayPlan, style = PATHS_STYLE): number {
  return plan.maxLen / style.raySpeed + style.rayHold + style.rayFade;
}

/**
 * One frame of the animation at `seconds`: every ray grows from you at `raySpeed`; a bright head runs at its tip;
 * where it reaches a wall the wall flashes (size by what it absorbs) and the ray carries on dimmer, until it is gone.
 */
export function rayFrame(plan: RayPlan, seconds: number, style = PATHS_STYLE) {
  const period = rayPeriod(plan, style);
  const t = seconds % period;
  const headAt = t * style.raySpeed;
  const fadeStart = plan.maxLen / style.raySpeed + style.rayHold;
  const fade = t > fadeStart ? Math.max(0, 1 - (t - fadeStart) / style.rayFade) : 1;
  const n = plan.n;
  const positions = new Float32Array(n * 6);
  const colors = new Float32Array(n * 8);
  const hitPositions = new Float32Array(n * 3);
  const hitColors = new Float32Array(n * 4);
  const headPositions = new Float32Array(n * 3);
  const headColors = new Float32Array(n * 4);
  const c = new Color(style.rayColor), h = new Color(style.hitColor);
  for (let i = 0; i < n; i++) {
    const len = plan.len[i];
    const reach = Math.min(len, Math.max(0, headAt - plan.cum0[i]));
    const f = len > 0 ? reach / len : 0;
    const sx = plan.start[i * 3], sy = plan.start[i * 3 + 1], sz = plan.start[i * 3 + 2];
    const ex = sx + (plan.end[i * 3] - sx) * f, ey = sy + (plan.end[i * 3 + 1] - sy) * f, ez = sz + (plan.end[i * 3 + 2] - sz) * f;
    positions.set([sx, sy, sz, ex, ey, ez], i * 6);
    const a = (style.rayMinAlpha + (style.rayMaxAlpha - style.rayMinAlpha) * plan.strength[i]) * fade * (reach > 0 ? 1 : 0);
    colors.set([c.r, c.g, c.b, a * 0.55, c.r, c.g, c.b, a], i * 8);
    // The bright head, only while this segment is being crossed.
    const crossing = reach > 0 && reach < len;
    headPositions.set([ex, ey, ez], i * 3);
    headColors.set([1, 0.55, 0.08, crossing ? fade * (0.5 + 0.5 * plan.strength[i]) : 0], i * 4);
    // The wall at the segment's end: flashes when the head arrives, then stays as a dot sized by what it took.
    const since = (headAt - (plan.cum0[i] + len)) / style.raySpeed; // seconds since the head reached it
    hitPositions.set(plan.end.subarray(i * 3, i * 3 + 3), i * 3);
    const flash = since >= 0 && since < 0.35 ? 1 - since / 0.35 : 0;
    const base = since >= 0 ? (0.1 + 0.8 * plan.absorbed[i]) * fade : 0;
    hitColors.set([h.r, h.g, h.b, Math.min(1, base + flash * (0.4 + plan.absorbed[i]))], i * 4);
  }
  return { positions, colors, hitPositions, hitColors, headPositions, headColors };
}

export type TraceArrays = {
  pathPositions: Float32Array; // 3 per vertex, 2 vertices per segment
  pathColors: Float32Array; // RGBA per vertex
  directPositions: Float32Array;
  directColors: Float32Array;
  directDistances: Float32Array; // metres along each direct line, for the dashes (0 at its start)
  markerPositions: Float32Array; // 3 per source
  markerColors: Float32Array; // RGB per source
};

/** Everything the layer draws for one trace, as plain arrays (no GPU work, so it is tested in Node). */
export function buildTraceArrays(trace: TraceOverlay, style = PATHS_STYLE): TraceArrays {
  const groups = groupPaths(trace.paths, trace.pathSource);
  const segments = groups.reduce((n, g) => n + g.segmentCount, 0);
  const pathPositions = trace.paths.slice(0, segments * 6);
  const pathColors = new Float32Array(segments * 8);
  groups.forEach((g, rank) => {
    const [r, gr, b] = sourceRgb(g.source, style);
    const a = rankAlpha(rank, groups.length, style);
    for (let v = g.firstSegment * 2; v < (g.firstSegment + g.segmentCount) * 2; v++) pathColors.set([r, gr, b, a], v * 4);
  });

  const direct: number[] = [];
  const directColor: number[] = [];
  const directDistance: number[] = [];
  const markerPositions = new Float32Array(trace.sources.length * 3);
  const markerColors = new Float32Array(trace.sources.length * 3);
  const [lx, ly, lz] = trace.listener;
  trace.sources.forEach((src, i) => {
    const rgb = sourceRgb(i, style);
    markerPositions.set(src.position, i * 3);
    markerColors.set(rgb, i * 3);
    const [sx, sy, sz] = src.position;
    const d = Math.hypot(sx - lx, sy - ly, sz - lz);
    if (d <= style.listenerGap) return; // the source is at the listener: nothing to draw
    const t = style.listenerGap / d;
    direct.push(lx + (sx - lx) * t, ly + (sy - ly) * t, lz + (sz - lz) * t, sx, sy, sz);
    directColor.push(...rgb, style.directAlpha, ...rgb, style.directAlpha);
    directDistance.push(0, d - style.listenerGap);
  });

  return {
    pathPositions,
    pathColors,
    directPositions: new Float32Array(direct),
    directColors: new Float32Array(directColor),
    directDistances: new Float32Array(directDistance),
    markerPositions,
    markerColors,
  };
}

/**
 * Writes `data` into the geometry's attribute `name`, reusing the buffer when it is big enough (the draw range hides
 * the rest). A bigger one replaces the geometry's buffers: three.js cannot resize a buffer it has sent to the GPU.
 * Returns the geometry to use (the same one, or a new one after disposing the old one).
 */
export function writeAttribute(
  geometry: BufferGeometry,
  name: string,
  data: Float32Array,
  itemSize: number,
): BufferGeometry {
  const old = geometry.getAttribute(name) as BufferAttribute | undefined;
  if (old && old.itemSize === itemSize && old.array.length >= data.length) {
    (old.array as Float32Array).set(data);
    old.needsUpdate = true;
    return geometry;
  }
  // Grow with headroom so the next, slightly longer trace fits.
  const capacity = Math.max(data.length, Math.ceil((data.length * 1.5) / itemSize) * itemSize);
  const array = new Float32Array(capacity);
  array.set(data);
  const next = new BufferGeometry();
  for (const [key, attr] of Object.entries(geometry.attributes)) if (key !== name) next.setAttribute(key, attr);
  next.setAttribute(name, new BufferAttribute(array, itemSize));
  next.setDrawRange(geometry.drawRange.start, geometry.drawRange.count);
  geometry.dispose();
  return next;
}

export type PathsLayer = {
  object: Group;
  /** Shows a trace, or clears the layer with `null`. Only CPU work: the caller requests the render. */
  set(trace: TraceOverlay | null): void;
  /** Walls between the listener and each source (index = source), from the simulation. */
  setWalls(walls: ({ distance: number; lossDb: number }[] | undefined)[]): void;
  /** Show every sampled ray bouncing around, fading where walls absorb it. */
  setEchoes(on: boolean): void;
  setPixelRatio(pixelRatio: number): void;
  /** The canvas size in CSS pixels, for the fat lines. */
  setSize(width: number, height: number): void;
  /** Moves the rings and pulses to `seconds`. Only CPU work: the caller requests the render. */
  tick(seconds: number): void;
  /** True while there is something to animate. */
  readonly animated: boolean;
  dispose(): void;
};

export function createPathsLayer(style = PATHS_STYLE): PathsLayer {
  // Drawn over the mesh lines, ignoring depth: the paths run through walls, and the point is to see them.
  const overlay = { transparent: true, depthTest: false, depthWrite: false, vertexColors: true } as const;
  const pathMaterial = new LineBasicMaterial({ ...overlay, opacity: style.trailOpacity });
  // The raw traced paths (up to 40 straight lines) are not drawn: they are grouped into a few beams by sonar.ts.
  const directMaterial = new LineDashedMaterial({ ...overlay, dashSize: style.dashSize, gapSize: style.gapSize });
  const sphere = new SphereGeometry(style.markerRadius, 20, 14);
  const markerMaterials: MeshBasicMaterial[] = [];

  const pathLines = new LineSegments(new BufferGeometry(), pathMaterial);
  const directLines = new LineSegments(new BufferGeometry(), directMaterial);
  const rayMaterial = new LineBasicMaterial({ ...overlay });
  const hitMaterial = new PointsMaterial({ ...overlay, size: style.hitSize, sizeAttenuation: false, map: dot() });
  const headMaterial = new PointsMaterial({ ...overlay, size: style.headSize, sizeAttenuation: false, map: dot() });
  const headDots = new Points(new BufferGeometry(), headMaterial);
  let plan: RayPlan | null = null;
  const rayLines = new LineSegments(new BufferGeometry(), rayMaterial);
  const hitDots = new Points(new BufferGeometry(), hitMaterial);
  const markers = new Group(); // one sphere per source, made on demand
  const object = new Group();
  for (const [o, order] of [[pathLines, 1], [directLines, 2], [markers, 3]] as const) {
    o.frustumCulled = false;
    o.renderOrder = order;
    object.add(o);
  }
  for (const [o, order] of [[rayLines, 1], [hitDots, 2], [headDots, 3]] as const) {
    o.frustumCulled = false;
    o.renderOrder = order;
    object.add(o);
  }
  object.visible = false;
  directLines.visible = false;
  pathLines.visible = false;
  rayLines.visible = false;
  hitDots.visible = false;
  headDots.visible = false;
  let showRays = false;

  // The animated sound: wavefronts, pulses and bounce flashes (sonar.ts).
  const sonar = createSonar();
  object.add(sonar.object);
  let animatedSources = 0;
  let width = 1, height = 1, pixelRatio = 1;

  /** Place one sphere per source; extra spheres from an earlier trace are hidden, not freed. */
  const placeMarkers = (positions: Float32Array, colors: Float32Array) => {
    const n = positions.length / 3;
    while (markers.children.length < n) {
      const material = new MeshBasicMaterial({ transparent: true, opacity: style.markerAlpha, depthTest: false, depthWrite: false });
      markerMaterials.push(material);
      const m = new Mesh(sphere, material);
      m.renderOrder = 3;
      m.frustumCulled = false;
      markers.add(m);
    }
    markers.children.forEach((child, i) => {
      const m = child as Mesh<SphereGeometry, MeshBasicMaterial>;
      m.visible = i < n;
      if (!m.visible) return;
      m.position.set(positions[i * 3], positions[i * 3 + 1], positions[i * 3 + 2]);
      m.material.color.setRGB(colors[i * 3], colors[i * 3 + 1], colors[i * 3 + 2]);
    });
  };

  const fill = (
    target: LineSegments,
    positions: Float32Array,
    colors: Float32Array,
    colorSize: number,
  ) => {
    let g = writeAttribute(target.geometry, 'position', positions, 3);
    g = writeAttribute(g, 'color', colors, colorSize);
    g.setDrawRange(0, positions.length / 3);
    target.geometry = g;
  };

  return {
    object,
    get animated() {
      return object.visible && animatedSources > 0;
    },
    tick(seconds) {
      sonar.tick(seconds);
      if (showRays && plan && plan.n > 0) {
        const f = rayFrame(plan, seconds, style);
        const put = (g: BufferGeometry, name: string, data: Float32Array) => {
          const a = g.getAttribute(name) as BufferAttribute;
          (a.array as Float32Array).set(data);
          a.needsUpdate = true;
        };
        put(rayLines.geometry, 'position', f.positions);
        put(rayLines.geometry, 'color', f.colors);
        put(hitDots.geometry, 'position', f.hitPositions);
        put(hitDots.geometry, 'color', f.hitColors);
        put(headDots.geometry, 'position', f.headPositions);
        put(headDots.geometry, 'color', f.headColors);
      }
    },
    setWalls(walls) {
      sonar.setWalls(walls);
    },
    setEchoes(on) {
      showRays = on;
      sonar.setSubdued(on);
      rayLines.visible = on;
      hitDots.visible = on;
      headDots.visible = on;
    },
    set(trace) {
      if (!trace) {
        object.visible = false;
        animatedSources = 0;
        return;
      }
      animatedSources = trace.sources.length;
      sonar.set(buildRoutes(trace, style), trace.sources.map(src => src.position), style.sourceColors, trace.directStrength ?? []);
      const a = buildTraceArrays(trace, style);
      fill(pathLines, a.pathPositions, a.pathColors, 4);
      plan = planRays(trace);
      const f = rayFrame(plan, 0, style);
      fill(rayLines, f.positions, f.colors, 4);
      for (const [dots, pos, col] of [[hitDots, f.hitPositions, f.hitColors], [headDots, f.headPositions, f.headColors]] as const) {
        dots.geometry = writeAttribute(dots.geometry, 'position', pos, 3);
        dots.geometry = writeAttribute(dots.geometry, 'color', col, 4);
        dots.geometry.setDrawRange(0, pos.length / 3);
      }
      rayLines.visible = hitDots.visible = headDots.visible = showRays;
      fill(directLines, a.directPositions, a.directColors, 4);
      placeMarkers(a.markerPositions, a.markerColors);
      // LineDashedMaterial needs the distance along each line. Written here rather than by computeLineDistances(),
      // which would make a new GPU buffer on every trace.
      directLines.geometry = writeAttribute(directLines.geometry, 'lineDistance', a.directDistances, 1);
      object.visible = true;
    },
    setPixelRatio(ratio) {
      pixelRatio = ratio;
      sonar.setSize(width, height, ratio);
    },
    setSize(w, h) {
      width = w;
      height = h;
      sonar.setSize(w, h, pixelRatio);
    },
    dispose() {
      for (const o of [pathLines, directLines, rayLines, hitDots, headDots]) o.geometry.dispose();
      rayMaterial.dispose();
      hitMaterial.dispose();
      headMaterial.dispose();
      pathMaterial.dispose();
      directMaterial.dispose();
      sonar.dispose();
      sphere.dispose();
      for (const m of markerMaterials) m.dispose();
    },
  };
}

/**
 * A plausible trace for trying the layer before the worker is wired: from DevTools,
 * `blueprint.setTrace(fakeTrace(listener, [indoorPos, outdoorPos]))`. Not used by the app.
 */
export function fakeTrace(listener: Vec3, sources: Vec3[], pathsPerSource = 6): TraceOverlay {
  const segs: number[] = [];
  const srcIdx: number[] = [];
  const [lx, ly, lz] = listener;
  for (let p = 0; p < pathsPerSource; p++)
    sources.forEach((s, i) => {
      // One bounce off an imaginary wall on a ring around the listener, then a second for odd paths.
      const angle = (p / pathsPerSource) * Math.PI * 2 + i;
      const hit: Vec3 = [lx + 3 * Math.cos(angle), ly + 0.5 * Math.sin(p), lz + 3 * Math.sin(angle)];
      const pts: Vec3[] = [[lx + 0.3 * Math.cos(angle), ly, lz + 0.3 * Math.sin(angle)], hit];
      if (p % 2) pts.push([hit[0] + 2 * Math.sin(angle), hit[1], hit[2] - 2 * Math.cos(angle)]);
      pts.push(s);
      for (let k = 0; k + 1 < pts.length; k++) {
        segs.push(...pts[k], ...pts[k + 1]);
        srcIdx.push(i);
      }
    });
  return {
    listener,
    sources: sources.map(position => ({ position })),
    paths: new Float32Array(segs),
    pathSource: new Uint8Array(srcIdx),
  };
}
