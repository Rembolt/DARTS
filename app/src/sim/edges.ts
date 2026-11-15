// Blueprint lines (mvp-design.md 5.1 step 6).
import { faceNormals, isDegenerate } from './normals';
import type { Mesh } from './obj';

const WELD = 1000; // positions closer than 1 mm count as one point

/**
 * Line segments (6 floats each) for every edge where the two triangles sharing it fold by more than `angleDeg`,
 * every edge with one triangle, and every edge shared by more than two.
 *
 * Edges are matched on welded positions, so the duplicated vertices along the mesh's chunk seams draw no line.
 * A neighbour wound the other way round is flipped before comparing, so it does not read as a 180° fold.
 * A zero-area triangle has no facing, so an edge it shares is treated as flat, not as a fold.
 */
export function extractLines(mesh: Mesh, angleDeg: number, normals: Float32Array = faceNormals(mesh)): Float32Array {
  const { positions: p, indices } = mesh;
  const triangleCount = indices.length / 3;

  // Weld: one id per distinct position, rounded to 1 mm. Number keys when every coordinate is within ±65 m of the
  // origin (17 bits per axis, exact in a double), string keys otherwise.
  const weldOf = new Uint32Array(p.length / 3);
  const OFFSET = 65536;
  let small = true;
  for (let i = 0; i < p.length; i++) {
    if (Math.abs(Math.round(p[i] * WELD)) >= OFFSET) {
      small = false;
      break;
    }
  }
  const ids = new Map<number | string, number>();
  for (let v = 0; v < weldOf.length; v++) {
    const x = Math.round(p[3 * v] * WELD), y = Math.round(p[3 * v + 1] * WELD), z = Math.round(p[3 * v + 2] * WELD);
    const key = small ? ((x + OFFSET) * 131072 + (y + OFFSET)) * 131072 + (z + OFFSET) : `${x},${y},${z}`;
    let id = ids.get(key);
    if (id === undefined) {
      id = ids.size;
      ids.set(key, id);
    }
    weldOf[v] = id;
  }
  const weldCount = ids.size;

  // Group triangle edges by their welded end points, in flat arrays (one slot per distinct edge). Per edge: one
  // vertex at each end (for output), the first two triangles, whether each walks it low → high id, and how many share it.
  const maxEdges = indices.length;
  const v0 = new Uint32Array(maxEdges), v1 = new Uint32Array(maxEdges);
  const t0 = new Uint32Array(maxEdges), t1 = new Uint32Array(maxEdges);
  const fwd0 = new Uint8Array(maxEdges), fwd1 = new Uint8Array(maxEdges);
  const count = new Uint32Array(maxEdges);
  const slotOf = new Map<number, number>();
  for (let t = 0; t < triangleCount; t++) {
    for (let k = 0; k < 3; k++) {
      const va = indices[3 * t + k];
      const vb = indices[3 * t + ((k + 1) % 3)];
      const wa = weldOf[va], wb = weldOf[vb];
      if (wa === wb) continue; // collapsed edge
      const forward = wa < wb ? 1 : 0;
      const key = forward ? wa * weldCount + wb : wb * weldCount + wa;
      let slot = slotOf.get(key);
      if (slot === undefined) {
        slot = slotOf.size;
        slotOf.set(key, slot);
        v0[slot] = va;
        v1[slot] = vb;
        t0[slot] = t;
        fwd0[slot] = forward;
      } else if (count[slot] === 1) {
        t1[slot] = t;
        fwd1[slot] = forward;
      }
      count[slot]++;
    }
  }
  const edgeCount = slotOf.size;

  const cosLimit = Math.cos((angleDeg * Math.PI) / 180);
  const out = new Float32Array(edgeCount * 6);
  let written = 0;
  for (let e = 0; e < edgeCount; e++) {
    let keep = count[e] !== 2;
    if (!keep && (isDegenerate(normals, t0[e]) || isDegenerate(normals, t1[e]))) {
      continue;
    }
    if (!keep) {
      // Consistently wound neighbours walk a shared edge in opposite directions. If both walk it the same way,
      // one of them is wound backwards: flip its normal.
      const a = 3 * t0[e], b = 3 * t1[e];
      const dot = normals[a] * normals[b] + normals[a + 1] * normals[b + 1] + normals[a + 2] * normals[b + 2];
      keep = (fwd0[e] === fwd1[e] ? -dot : dot) < cosLimit;
    }
    if (keep) {
      const a = 3 * v0[e], b = 3 * v1[e];
      out[written++] = p[a];
      out[written++] = p[a + 1];
      out[written++] = p[a + 2];
      out[written++] = p[b];
      out[written++] = p[b + 1];
      out[written++] = p[b + 2];
    }
  }
  return out.slice(0, written);
}
