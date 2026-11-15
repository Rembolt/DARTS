import { describe, it, expect, vi } from 'vitest';
import { BufferAttribute, BufferGeometry } from 'three';
import type { Vec3 } from '../sim/types';
import {
  PATHS_STYLE,
  buildTraceArrays,
  createPathsLayer,
  fakeTrace,
  groupPaths,
  rankAlpha,
  sourceRgb,
  writeAttribute,
  type TraceOverlay,
} from './paths';

/** Segments for paths given as point lists, in order, with their source index. */
function segmentsOf(paths: { points: Vec3[]; source: number }[]) {
  const segs: number[] = [];
  const src: number[] = [];
  for (const p of paths)
    for (let k = 0; k + 1 < p.points.length; k++) {
      segs.push(...p.points[k], ...p.points[k + 1]);
      src.push(p.source);
    }
  return { paths: new Float32Array(segs), pathSource: new Uint8Array(src) };
}

const L: Vec3 = [0, 1.5, 0];
const INDOOR: Vec3 = [4, 1.5, 0];
const OUTDOOR: Vec3 = [0, 1.5, 25];

function trace(): TraceOverlay {
  return {
    listener: L,
    sources: [{ position: INDOOR }, { position: OUTDOOR }],
    ...segmentsOf([
      { points: [[0.3, 1.5, 0], [2, 1.5, 3], INDOOR], source: 0 }, // strongest, 2 segments
      { points: [[0, 1.5, 0.3], [1, 1.5, 5], [-2, 1.5, 9], OUTDOOR], source: 1 }, // 3 segments
      { points: [[0.3, 1.5, 0], [2, 1.5, -3], INDOOR], source: 0 }, // weakest, 2 segments
    ]),
  };
}

describe('groupPaths', () => {
  it('splits where a segment does not start at the previous end', () => {
    const t = trace();
    expect(groupPaths(t.paths, t.pathSource)).toEqual([
      { firstSegment: 0, segmentCount: 2, source: 0 },
      { firstSegment: 2, segmentCount: 3, source: 1 },
      { firstSegment: 5, segmentCount: 2, source: 0 },
    ]);
  });

  it('splits where the source changes even if the points join', () => {
    const { paths, pathSource } = segmentsOf([
      { points: [[0, 0, 0], [1, 0, 0]], source: 0 },
      { points: [[1, 0, 0], [2, 0, 0]], source: 1 },
    ]);
    expect(groupPaths(paths, pathSource).map(g => g.source)).toEqual([0, 1]);
  });

  it('splits two paths of one source that do not join', () => {
    // Two single-segment paths of one source, the second starting elsewhere.
    const { paths, pathSource } = segmentsOf([
      { points: [[0, 0, 0], [1, 0, 0]], source: 0 },
      { points: [[0, 0, 1], [1, 0, 0]], source: 0 },
    ]);
    expect(groupPaths(paths, pathSource)).toHaveLength(2);
  });

  it('returns nothing for empty input', () => {
    expect(groupPaths(new Float32Array(0), new Uint8Array(0))).toEqual([]);
  });
});

describe('rankAlpha', () => {
  it('runs from strongest to weakest, decreasing', () => {
    expect(rankAlpha(0, 5)).toBe(PATHS_STYLE.strongestAlpha);
    expect(rankAlpha(4, 5)).toBeCloseTo(PATHS_STYLE.weakestAlpha);
    for (let r = 1; r < 5; r++) expect(rankAlpha(r, 5)).toBeLessThan(rankAlpha(r - 1, 5));
  });

  it('draws a lone path at full strength', () => {
    expect(rankAlpha(0, 1)).toBe(PATHS_STYLE.strongestAlpha);
  });
});

describe('sourceRgb', () => {
  it('gives the two sources different colours and cycles past the list', () => {
    expect(sourceRgb(0)).not.toEqual(sourceRgb(1));
    expect(sourceRgb(PATHS_STYLE.sourceColors.length)).toEqual(sourceRgb(0));
  });
});

describe('buildTraceArrays', () => {
  it('keeps every segment and colours each vertex by its source and rank', () => {
    const a = buildTraceArrays(trace());
    expect(a.pathPositions).toHaveLength(7 * 6);
    expect(a.pathColors).toHaveLength(7 * 2 * 4);
    const vertex = (v: number) => Array.from(a.pathColors.subarray(v * 4, v * 4 + 4));
    const [r0, g0, b0] = sourceRgb(0);
    const [r1, g1, b1] = sourceRgb(1);
    expect(vertex(0).slice(0, 3)).toEqual(Array.from(new Float32Array([r0, g0, b0])));
    expect(vertex(4).slice(0, 3)).toEqual(Array.from(new Float32Array([r1, g1, b1]))); // segment 2 = path 1
    expect(vertex(10).slice(0, 3)).toEqual(Array.from(new Float32Array([r0, g0, b0]))); // segment 5 = path 2
    // Alpha: same within a path, decreasing with rank.
    expect(vertex(0)[3]).toBe(vertex(3)[3]);
    expect(vertex(4)[3]).toBeLessThan(vertex(0)[3]);
    expect(vertex(10)[3]).toBeLessThan(vertex(4)[3]);
  });

  it('draws a direct line per source, starting 0.3 m from the listener', () => {
    const a = buildTraceArrays(trace());
    expect(a.directPositions).toHaveLength(2 * 6);
    expect(Array.from(a.directPositions.subarray(0, 6))).toEqual([0.3, 1.5, 0, 4, 1.5, 0].map(Math.fround));
    const start = a.directPositions.subarray(6, 9);
    expect(Math.hypot(start[0] - L[0], start[1] - L[1], start[2] - L[2])).toBeCloseTo(PATHS_STYLE.listenerGap, 5);
    expect(Array.from(a.directPositions.subarray(9, 12))).toEqual(OUTDOOR);
    expect(Array.from(a.directDistances)).toEqual([0, 3.7, 0, 24.7].map(Math.fround));
    expect(a.directColors).toHaveLength(2 * 2 * 4);
    expect(a.directColors[3]).toBeCloseTo(PATHS_STYLE.directAlpha);
  });

  it('puts one marker per source in its colour', () => {
    const a = buildTraceArrays(trace());
    expect(Array.from(a.markerPositions)).toEqual([...INDOOR, ...OUTDOOR]);
    expect(Array.from(a.markerColors.subarray(3, 6))).toEqual(Array.from(new Float32Array(sourceRgb(1))));
  });

  it('skips the direct line of a source at the listener', () => {
    const a = buildTraceArrays({ ...trace(), sources: [{ position: [0.1, 1.5, 0] }] });
    expect(a.directPositions).toHaveLength(0);
    expect(a.markerPositions).toHaveLength(3);
  });

  it('handles a trace with no paths and no sources', () => {
    const a = buildTraceArrays({ listener: L, sources: [], paths: new Float32Array(0), pathSource: new Uint8Array(0) });
    for (const arr of Object.values(a)) expect(arr).toHaveLength(0);
  });
});

describe('writeAttribute', () => {
  it('reuses the buffer when the data fits', () => {
    const g = new BufferGeometry();
    const g1 = writeAttribute(g, 'position', new Float32Array(30), 3);
    const attr = g1.getAttribute('position') as BufferAttribute;
    const g2 = writeAttribute(g1, 'position', new Float32Array([1, 2, 3]), 3);
    expect(g2).toBe(g1);
    expect(g2.getAttribute('position')).toBe(attr);
    expect(Array.from(attr.array.slice(0, 3))).toEqual([1, 2, 3]);
  });

  it('replaces and disposes the geometry when the data outgrows it, keeping other attributes', () => {
    const g = writeAttribute(new BufferGeometry(), 'position', new Float32Array(6), 3);
    const g1 = writeAttribute(g, 'color', new Float32Array(8), 4);
    const color = g1.getAttribute('color');
    const dispose = vi.fn();
    g1.addEventListener('dispose', dispose);
    const g2 = writeAttribute(g1, 'position', new Float32Array(60), 3);
    expect(g2).not.toBe(g1);
    expect(dispose).toHaveBeenCalledOnce();
    expect(g2.getAttribute('color')).toBe(color);
    expect(g2.getAttribute('position').array.length).toBeGreaterThanOrEqual(60);
  });
});

describe('createPathsLayer', () => {
  it('fills the layer for a trace, hides it for null, and reuses buffers for a same-size trace', () => {
    const layer = createPathsLayer();
    expect(layer.object.visible).toBe(false);
    layer.set(trace());
    expect(layer.object.visible).toBe(true);
    const [paths, direct] = layer.object.children as unknown as { geometry: BufferGeometry }[];
    expect(paths.geometry.drawRange.count).toBe(14);
    expect(direct.geometry.drawRange.count).toBe(4);
    expect(direct.geometry.getAttribute('lineDistance')).toBeDefined();
    // Markers are spheres with a real size, at each source's position, so they shrink and grow with distance.
    const markers = layer.object.children[2] as unknown as { children: { visible: boolean; position: { toArray(): number[] } }[] };
    const shown = markers.children.filter(m => m.visible);
    expect(shown.map(m => m.position.toArray())).toEqual(trace().sources.map(s => [...s.position]));
    const before = paths.geometry;
    layer.set(trace());
    expect(paths.geometry).toBe(before);
    layer.set(null);
    expect(layer.object.visible).toBe(false);
    layer.dispose();
  });

  it('accepts the fake trace', () => {
    const layer = createPathsLayer();
    const t = fakeTrace(L, [INDOOR, OUTDOOR]);
    expect(groupPaths(t.paths, t.pathSource)).toHaveLength(12);
    layer.set(t);
    expect(layer.object.visible).toBe(true);
    layer.dispose();
  });
});

import { buildRoutes, pointAlong } from './paths';
describe('sonar routes', () => {
  it('walks a polyline by distance', () => {
    const line = [0, 0, 0, 2, 0, 0, 2, 0, 3];
    expect(pointAlong(line, 1)).toEqual([1, 0, 0]);
    expect(pointAlong(line, 3.5)).toEqual([2, 0, 1.5]);
    expect(pointAlong(line, 99)).toEqual([2, 0, 3]);
  });
  it('runs every route from the source to the listener', () => {
    const routes = buildRoutes({
      listener: [0, 0, 0],
      sources: [{ position: [4, 0, 0] }],
      paths: Float32Array.from([0.3, 0, 0, 2, 1, 0, 2, 1, 0, 4, 0, 0]),
      pathSource: Uint8Array.from([0, 0]),
    });
    expect(routes).toHaveLength(2); // the reflected path and the direct route
    expect(Array.from(routes[0].points.slice(0, 3))).toEqual([4, 0, 0]);
    expect(routes[0].points[routes[0].points.length - 3]).toBeCloseTo(0.3, 5);
    expect(Array.from(routes[1].points.slice(-3))).toEqual([0, 0, 0]);
  });
});
