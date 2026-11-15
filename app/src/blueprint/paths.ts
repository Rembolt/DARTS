// Traced sound paths in the blueprint view (mvp-design.md 7, build step 8): a marker per source, a dashed direct line
// from the listener to each source, and the strongest reflection paths of the last trace, one colour per source and
// more opaque for stronger paths.
import {
  BufferAttribute,
  BufferGeometry,
  DataTexture,
  Group,
  LineBasicMaterial,
  LineDashedMaterial,
  LineSegments,
  Points,
  PointsMaterial,
  RGBAFormat,
  Color,
} from 'three';
import type { Vec3 } from '../sim/types';

/** The look of the paths layer. Will move to `config.ts` (next to `BLUEPRINT`) later. */
export const PATHS_STYLE = {
  /**
   * One colour per source index (indoor = 0, outdoor = 1), cycled for more. Okabe-Ito vermillion and bluish green:
   * told apart under the common colour-blindnesses, dark enough to read on 85% white, and unlike the dark-blue mesh.
   */
  sourceColors: ['#d55e00', '#009e73', '#e69f00', '#cc79a7'],
  /** Opacity of the strongest path and of the weakest drawn path; the ones between are spaced evenly by rank. */
  strongestAlpha: 1,
  weakestAlpha: 0.15,
  /** The direct line: dashed, a little see-through, so it reads apart from the reflection paths. */
  directAlpha: 0.8,
  dashSize: 0.3, // metres
  gapSize: 0.2, // metres
  /** Lines start this far from the listener: lines that begin at the camera itself are clipped away (design 7). */
  listenerGap: 0.3, // metres
  /** Source marker diameter in CSS pixels. Screen-constant, so the outdoor source 25 m away stays as visible as indoor. */
  markerSize: 16,
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

/** A soft white disc: the point sprite for the source markers (tinted by the vertex colour). */
function discTexture(size = 32): DataTexture {
  const data = new Uint8Array(size * size * 4);
  for (let y = 0; y < size; y++)
    for (let x = 0; x < size; x++) {
      const r = Math.hypot(x + 0.5 - size / 2, y + 0.5 - size / 2) / (size / 2);
      const o = (y * size + x) * 4;
      data[o] = data[o + 1] = data[o + 2] = 255;
      data[o + 3] = Math.round(255 * Math.min(1, Math.max(0, (1 - r) * (size / 2))));
    }
  const texture = new DataTexture(data, size, size, RGBAFormat);
  texture.needsUpdate = true;
  return texture;
}

export type PathsLayer = {
  object: Group;
  /** Shows a trace, or clears the layer with `null`. Only CPU work: the caller requests the render. */
  set(trace: TraceOverlay | null): void;
  setPixelRatio(pixelRatio: number): void;
  dispose(): void;
};

export function createPathsLayer(style = PATHS_STYLE): PathsLayer {
  // Drawn over the mesh lines, ignoring depth: the paths run through walls, and the point is to see them.
  const overlay = { transparent: true, depthTest: false, depthWrite: false, vertexColors: true } as const;
  const pathMaterial = new LineBasicMaterial(overlay);
  const directMaterial = new LineDashedMaterial({ ...overlay, dashSize: style.dashSize, gapSize: style.gapSize });
  const sprite = discTexture();
  const markerMaterial = new PointsMaterial({
    ...overlay,
    size: style.markerSize,
    sizeAttenuation: false,
    map: sprite,
    alphaTest: 0.05,
  });

  const pathLines = new LineSegments(new BufferGeometry(), pathMaterial);
  const directLines = new LineSegments(new BufferGeometry(), directMaterial);
  const markers = new Points(new BufferGeometry(), markerMaterial);
  const object = new Group();
  for (const [o, order] of [[pathLines, 1], [directLines, 2], [markers, 3]] as const) {
    o.frustumCulled = false;
    o.renderOrder = order;
    object.add(o);
  }
  object.visible = false;

  const fill = (
    target: LineSegments | Points,
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
    set(trace) {
      if (!trace) {
        object.visible = false;
        return;
      }
      const a = buildTraceArrays(trace, style);
      fill(pathLines, a.pathPositions, a.pathColors, 4);
      fill(directLines, a.directPositions, a.directColors, 4);
      fill(markers, a.markerPositions, a.markerColors, 3);
      // LineDashedMaterial needs the distance along each line. Written here rather than by computeLineDistances(),
      // which would make a new GPU buffer on every trace.
      directLines.geometry = writeAttribute(directLines.geometry, 'lineDistance', a.directDistances, 1);
      object.visible = true;
    },
    setPixelRatio(pixelRatio) {
      markerMaterial.size = style.markerSize * pixelRatio; // point size is in device pixels
    },
    dispose() {
      for (const o of [pathLines, directLines, markers]) o.geometry.dispose();
      pathMaterial.dispose();
      directMaterial.dispose();
      markerMaterial.dispose();
      sprite.dispose();
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
