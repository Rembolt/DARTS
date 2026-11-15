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
  CanvasTexture,
  DoubleSide,
  Mesh,
  MeshBasicMaterial,
  Points,
  PointsMaterial,
  PlaneGeometry,
  SphereGeometry,
  Color,
} from 'three';
import type { Vec3 } from '../sim/types';

/** The look of the paths layer. Will move to `config.ts` (next to `BLUEPRINT`) later. */
export const PATHS_STYLE = {
  /**
   * One colour per source index (indoor = 0, outdoor = 1), cycled for more. Okabe-Ito vermillion and bluish green:
   * told apart under the common colour-blindnesses, dark enough to read on 85% white, and unlike the dark-blue mesh.
   */
  sourceColors: ['#ff8a00', '#0fae95', '#1b5cf0', '#cc79a7'],
  /** Opacity of the strongest path and of the weakest drawn path; the ones between are spaced evenly by rank. */
  strongestAlpha: 1,
  weakestAlpha: 0.15,
  /** The direct line: dashed, a little see-through, so it reads apart from the reflection paths. */
  directAlpha: 0.8,
  dashSize: 0.3, // metres
  gapSize: 0.2, // metres
  /** Lines start this far from the listener: lines that begin at the camera itself are clipped away (design 7). */
  listenerGap: 0.3, // metres
  /**
   * Source marker radius in metres: a sphere at the source, seen in perspective like the walls, so a near source looks
   * near (a screen-constant dot looked far away). 0.12 m: small up close, still about 5 px at 25 m on an 800 px view.
   */
  markerRadius: 0.12,
  markerAlpha: 0.9,
  /** Sonar: rings that leave each source, and pulses that travel its paths to the listener. */
  ringsPerSource: 2,
  ringPeriod: 3.2, // seconds for one ripple to travel out and fade
  ringRadius: 5, // metres at the end of a ripple's life
  ringAlpha: 0.9,
  /** Opacity of the paths themselves: a soft trail under the pulses. */
  trailOpacity: 0.4,
  pulsesPerPath: 3,
  pulseSpeed: 4.5, // metres per second as drawn (the real speed of sound would be invisible)
  pulseSize: 0.4, // metres
};

export type TraceOverlay = {
  listener: Vec3;
  sources: { position: Vec3 }[];
  paths: Float32Array; // 6 floats per segment, strongest path first (the worker's `trace` reply)
  pathSource: Uint8Array; // one source index per segment
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
export type Route = { points: Float32Array; length: number; source: number };

export function buildRoutes(trace: TraceOverlay, style = PATHS_STYLE): Route[] {
  const routes: Route[] = [];
  const measure = (pts: number[]) => {
    let length = 0;
    for (let i = 0; i + 1 < pts.length / 3; i++)
      length += Math.hypot(pts[i * 3 + 3] - pts[i * 3], pts[i * 3 + 4] - pts[i * 3 + 1], pts[i * 3 + 5] - pts[i * 3 + 2]);
    return length;
  };
  for (const g of groupPaths(trace.paths, trace.pathSource)) {
    // Segments run listener → source; sound travels the other way.
    const pts: number[] = [];
    for (let s = g.firstSegment + g.segmentCount - 1; s >= g.firstSegment; s--) {
      const o = s * 6;
      if (pts.length === 0) pts.push(trace.paths[o + 3], trace.paths[o + 4], trace.paths[o + 5]);
      pts.push(trace.paths[o], trace.paths[o + 1], trace.paths[o + 2]);
    }
    const length = measure(pts);
    if (length > 0.01) routes.push({ points: Float32Array.from(pts), length, source: g.source });
  }
  const [lx, ly, lz] = trace.listener;
  trace.sources.forEach((src, i) => {
    const d = Math.hypot(src.position[0] - lx, src.position[1] - ly, src.position[2] - lz);
    if (d <= style.listenerGap) return;
    routes.push({ points: Float32Array.from([...src.position, lx, ly, lz]), length: d, source: i });
  });
  return routes;
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
  setPixelRatio(pixelRatio: number): void;
  /** Moves the rings and pulses to `seconds`. Only CPU work: the caller requests the render. */
  tick(seconds: number): void;
  /** True while there is something to animate. */
  readonly animated: boolean;
  dispose(): void;
};

let glowTexture: CanvasTexture | null = null;
let rippleTexture: CanvasTexture | null = null;
/** A soft ripple: clear in the middle, a glow building to a thin bright edge, then nothing. Tinted per source. */
function ripple(): CanvasTexture | null {
  if (rippleTexture || typeof document === 'undefined') return rippleTexture;
  const c = document.createElement('canvas');
  c.width = c.height = 256;
  const g = c.getContext('2d');
  if (!g) return null;
  const grad = g.createRadialGradient(128, 128, 0, 128, 128, 128);
  grad.addColorStop(0, 'rgba(255,255,255,0)');
  grad.addColorStop(0.55, 'rgba(255,255,255,0.04)');
  grad.addColorStop(0.9, 'rgba(255,255,255,0.35)');
  grad.addColorStop(0.955, 'rgba(255,255,255,1)');
  grad.addColorStop(0.985, 'rgba(255,255,255,0.15)');
  grad.addColorStop(1, 'rgba(255,255,255,0)');
  g.fillStyle = grad;
  g.fillRect(0, 0, 256, 256);
  rippleTexture = new CanvasTexture(c);
  return rippleTexture;
}

/** A soft round dot for the pulses; null where there is no canvas (tests). */
function glow(): CanvasTexture | null {
  if (glowTexture || typeof document === 'undefined') return glowTexture;
  const c = document.createElement('canvas');
  c.width = c.height = 64;
  const g = c.getContext('2d');
  if (!g) return null;
  const grad = g.createRadialGradient(32, 32, 0, 32, 32, 32);
  grad.addColorStop(0, 'rgba(255,255,255,1)');
  grad.addColorStop(0.35, 'rgba(255,255,255,0.8)');
  grad.addColorStop(1, 'rgba(255,255,255,0)');
  g.fillStyle = grad;
  g.fillRect(0, 0, 64, 64);
  glowTexture = new CanvasTexture(c);
  return glowTexture;
}

export function createPathsLayer(style = PATHS_STYLE): PathsLayer {
  // Drawn over the mesh lines, ignoring depth: the paths run through walls, and the point is to see them.
  const overlay = { transparent: true, depthTest: false, depthWrite: false, vertexColors: true } as const;
  const pathMaterial = new LineBasicMaterial({ ...overlay, opacity: style.trailOpacity });
  const directMaterial = new LineDashedMaterial({ ...overlay, dashSize: style.dashSize, gapSize: style.gapSize });
  const sphere = new SphereGeometry(style.markerRadius, 20, 14);
  const markerMaterials: MeshBasicMaterial[] = [];

  const pathLines = new LineSegments(new BufferGeometry(), pathMaterial);
  const directLines = new LineSegments(new BufferGeometry(), directMaterial);
  const markers = new Group(); // one sphere per source, made on demand
  const object = new Group();
  for (const [o, order] of [[pathLines, 1], [directLines, 2], [markers, 3]] as const) {
    o.frustumCulled = false;
    o.renderOrder = order;
    object.add(o);
  }
  object.visible = false;
  directLines.visible = false; // the pulses along each direct route say the same, more cleanly

  // Sonar rings: flat on the floor plane of each source, drawn through walls like everything in this layer.
  const ringGeometry = new PlaneGeometry(2, 2).rotateX(-Math.PI / 2);
  const rippleMap = ripple();
  const rings = new Group();
  rings.renderOrder = 0;
  object.add(rings);
  let sourcePositions: Vec3[] = [];

  // Pulses: small glowing dots that run from each source along its routes to the listener.
  const pulseMaterial = new PointsMaterial({
    size: style.pulseSize,
    sizeAttenuation: true,
    vertexColors: true,
    transparent: true,
    depthTest: false,
    depthWrite: false,
    map: glow(),
    alphaTest: 0.01,
  });
  const pulses = new Points(new BufferGeometry(), pulseMaterial);
  pulses.frustumCulled = false;
  pulses.renderOrder = 4;
  object.add(pulses);
  let routes: Route[] = [];
  let pulseSource = new Uint8Array(0);

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

  const syncRings = (count: number) => {
    const want = count * style.ringsPerSource;
    while (rings.children.length < want) {
      const m = new Mesh(ringGeometry, new MeshBasicMaterial({ map: rippleMap, transparent: true, depthTest: false, depthWrite: false, side: DoubleSide }));
      m.frustumCulled = false;
      rings.add(m);
    }
    rings.children.forEach((c, i) => (c.visible = i < want));
  };

  return {
    object,
    get animated() {
      return object.visible && sourcePositions.length > 0;
    },
    tick(seconds) {
      sourcePositions.forEach((pos, si) => {
        for (let k = 0; k < style.ringsPerSource; k++) {
          const ring = rings.children[si * style.ringsPerSource + k] as Mesh<PlaneGeometry, MeshBasicMaterial>;
          const phase = (seconds / style.ringPeriod + k / style.ringsPerSource + si * 0.31) % 1;
          const r = 0.2 + phase * style.ringRadius;
          ring.position.set(pos[0], pos[1] - 0.25, pos[2]);
          ring.scale.set(r, r, r);
          ring.material.color.set(style.sourceColors[si % style.sourceColors.length]);
          ring.material.opacity = style.ringAlpha * Math.min(1, phase * 8) * Math.pow(1 - phase, 1.4);
        }
      });
      const attr = pulses.geometry.getAttribute('position') as BufferAttribute | undefined;
      if (!attr) return;
      const out = attr.array as Float32Array;
      let n = 0;
      routes.forEach(route => {
        for (let k = 0; k < style.pulsesPerPath; k++) {
          const phase = (seconds * style.pulseSpeed / Math.max(route.length, 1) + k / style.pulsesPerPath + route.length * 0.07) % 1;
          out.set(pointAlong(route.points, phase * route.length), n * 3);
          n++;
        }
      });
      attr.needsUpdate = true;
    },
    set(trace) {
      if (!trace) {
        object.visible = false;
        sourcePositions = [];
        return;
      }
      sourcePositions = trace.sources.map(s => s.position);
      syncRings(sourcePositions.length);
      routes = buildRoutes(trace, style);
      const count = routes.length * style.pulsesPerPath;
      const colors = new Float32Array(count * 3);
      let n = 0;
      for (const route of routes) {
        const [r, g, b] = sourceRgb(route.source, style);
        for (let k = 0; k < style.pulsesPerPath; k++) colors.set([r, g, b], n++ * 3);
      }
      const geometry = new BufferGeometry();
      geometry.setAttribute('position', new BufferAttribute(new Float32Array(count * 3), 3));
      geometry.setAttribute('color', new BufferAttribute(colors, 3));
      pulses.geometry.dispose();
      pulses.geometry = geometry;
      const a = buildTraceArrays(trace, style);
      fill(pathLines, a.pathPositions, a.pathColors, 4);
      fill(directLines, a.directPositions, a.directColors, 4);
      placeMarkers(a.markerPositions, a.markerColors);
      // LineDashedMaterial needs the distance along each line. Written here rather than by computeLineDistances(),
      // which would make a new GPU buffer on every trace.
      directLines.geometry = writeAttribute(directLines.geometry, 'lineDistance', a.directDistances, 1);
      object.visible = true;
    },
    setPixelRatio() {
      // Spheres are sized in metres, so the pixel ratio no longer matters; kept for the view's call.
    },
    dispose() {
      for (const o of [pathLines, directLines]) o.geometry.dispose();
      pathMaterial.dispose();
      directMaterial.dispose();
      pulses.geometry.dispose();
      pulseMaterial.dispose();
      ringGeometry.dispose();
      for (const c of rings.children) ((c as Mesh).material as MeshBasicMaterial).dispose();
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
