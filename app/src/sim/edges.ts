// Blueprint lines (mvp-design.md 5.1 step 6).
import type { Mesh } from './obj';

const WELD = 1000; // positions closer than 1 mm count as one point

/**
 * Line segments (6 floats each) for every edge where the two triangles sharing it fold by more than `angleDeg`,
 * every edge with one triangle, and every edge shared by more than two.
 *
 * Edges are matched on welded positions, so the duplicated vertices along the mesh's chunk seams draw no line.
 * A neighbour wound the other way round is flipped before comparing, so it does not read as a 180° fold.
 */
export function extractLines(mesh: Mesh, angleDeg: number): Float32Array {
  const { positions: p, indices } = mesh;
  const triangleCount = indices.length / 3;

  // Weld: one id per distinct (rounded) position.
  const weldOf = new Uint32Array(p.length / 3);
  const ids = new Map<string, number>();
  for (let v = 0; v < weldOf.length; v++) {
    const key = `${Math.round(p[3 * v] * WELD)},${Math.round(p[3 * v + 1] * WELD)},${Math.round(p[3 * v + 2] * WELD)}`;
    let id = ids.get(key);
    if (id === undefined) {
      id = ids.size;
      ids.set(key, id);
    }
    weldOf[v] = id;
  }
  const weldCount = ids.size;

  // Unit normal per triangle (from its winding).
  const normals = new Float32Array(triangleCount * 3);
  for (let t = 0; t < triangleCount; t++) {
    const a = indices[3 * t] * 3, b = indices[3 * t + 1] * 3, c = indices[3 * t + 2] * 3;
    const ux = p[b] - p[a], uy = p[b + 1] - p[a + 1], uz = p[b + 2] - p[a + 2];
    const vx = p[c] - p[a], vy = p[c + 1] - p[a + 1], vz = p[c + 2] - p[a + 2];
    const nx = uy * vz - uz * vy, ny = uz * vx - ux * vz, nz = ux * vy - uy * vx;
    const len = Math.hypot(nx, ny, nz) || 1;
    normals[3 * t] = nx / len;
    normals[3 * t + 1] = ny / len;
    normals[3 * t + 2] = nz / len;
  }

  // Group triangle edges by their welded end points. Per edge: one vertex at each end (for output), the first two
  // triangles and the direction each walks it in, and how many triangles share it.
  type Edge = { v0: number; v1: number; t0: number; forward0: boolean; t1: number; forward1: boolean; count: number };
  const edges = new Map<number, Edge>();
  for (let t = 0; t < triangleCount; t++) {
    for (let k = 0; k < 3; k++) {
      const va = indices[3 * t + k];
      const vb = indices[3 * t + ((k + 1) % 3)];
      const wa = weldOf[va], wb = weldOf[vb];
      if (wa === wb) continue; // collapsed edge
      const forward = wa < wb;
      const key = forward ? wa * weldCount + wb : wb * weldCount + wa;
      const edge = edges.get(key);
      if (!edge) {
        edges.set(key, { v0: va, v1: vb, t0: t, forward0: forward, t1: -1, forward1: false, count: 1 });
      } else {
        if (edge.count === 1) {
          edge.t1 = t;
          edge.forward1 = forward;
        }
        edge.count++;
      }
    }
  }

  const cosLimit = Math.cos((angleDeg * Math.PI) / 180);
  const out: number[] = [];
  for (const e of edges.values()) {
    let keep = e.count !== 2;
    if (!keep) {
      // Consistently wound neighbours walk a shared edge in opposite directions. If both walk it the same way,
      // one of them is wound backwards: flip its normal.
      const sign = e.forward0 === e.forward1 ? -1 : 1;
      const dot =
        sign *
        (normals[3 * e.t0] * normals[3 * e.t1] +
          normals[3 * e.t0 + 1] * normals[3 * e.t1 + 1] +
          normals[3 * e.t0 + 2] * normals[3 * e.t1 + 2]);
      keep = dot < cosLimit;
    }
    if (keep) out.push(p[3 * e.v0], p[3 * e.v0 + 1], p[3 * e.v0 + 2], p[3 * e.v1], p[3 * e.v1 + 1], p[3 * e.v1 + 2]);
  }
  return new Float32Array(out);
}
