// The floor under the listener as grid cells, for the minimap's heat map. Cells come from the mesh's floor triangles
// at this storey; the worker then measures how much of a source reaches each cell (a `field` request).
export type FloorGrid = {
  x0: number; // world x of column 0's left edge
  z0: number; // world z of row 0's top edge (rows grow toward +z)
  step: number; // metres per cell
  w: number;
  h: number;
  /** Indices (row * w + col) of cells with floor under them. */
  cells: Int32Array;
  /** One point per cell, at the listener's height: what the worker measures. */
  points: Float32Array;
};

export const HEAT = {
  radius: 16, // metres around the listener
  step: 0.5,
  /** A floor counts for this storey when it is this far below the listener's eye (metres). */
  minDrop: 0.6,
  maxDrop: 2.6,
};

/** Point in triangle, on the xz plane. */
function inside(px: number, pz: number, ax: number, az: number, bx: number, bz: number, cx: number, cz: number): boolean {
  const d1 = (px - bx) * (az - bz) - (ax - bx) * (pz - bz);
  const d2 = (px - cx) * (bz - cz) - (bx - cx) * (pz - cz);
  const d3 = (px - ax) * (cz - az) - (cx - ax) * (pz - az);
  const neg = d1 < 0 || d2 < 0 || d3 < 0;
  const pos = d1 > 0 || d2 > 0 || d3 > 0;
  return !(neg && pos);
}

export function floorGrid(
  mesh: { positions: Float32Array; indices: Uint32Array; materials: Uint8Array },
  listener: [number, number, number],
  floorMaterial = 1,
  o = HEAT,
): FloorGrid {
  const [lx, ly, lz] = listener;
  const x0 = lx - o.radius, z0 = lz - o.radius;
  const w = Math.ceil((o.radius * 2) / o.step), h = w;
  const mask = new Uint8Array(w * h);
  const P = mesh.positions, I = mesh.indices;
  const tris = Math.min(mesh.materials.length, I.length / 3);
  for (let t = 0; t < tris; t++) {
    if (mesh.materials[t] !== floorMaterial) continue;
    const a = I[t * 3] * 3, b = I[t * 3 + 1] * 3, c = I[t * 3 + 2] * 3;
    const ay = P[a + 1], by = P[b + 1], cy = P[c + 1];
    const drop = ly - (ay + by + cy) / 3;
    if (drop < o.minDrop || drop > o.maxDrop) continue;
    const ax = P[a], az = P[a + 2], bx = P[b], bz = P[b + 2], cx = P[c], cz = P[c + 2];
    const c0 = Math.max(0, Math.floor((Math.min(ax, bx, cx) - x0) / o.step));
    const c1 = Math.min(w - 1, Math.floor((Math.max(ax, bx, cx) - x0) / o.step));
    const r0 = Math.max(0, Math.floor((Math.min(az, bz, cz) - z0) / o.step));
    const r1 = Math.min(h - 1, Math.floor((Math.max(az, bz, cz) - z0) / o.step));
    for (let r = r0; r <= r1; r++)
      for (let col = c0; col <= c1; col++) {
        const i = r * w + col;
        if (mask[i]) continue;
        const px = x0 + (col + 0.5) * o.step, pz = z0 + (r + 0.5) * o.step;
        if (inside(px, pz, ax, az, bx, bz, cx, cz)) mask[i] = 1;
      }
  }
  const list: number[] = [];
  for (let i = 0; i < mask.length; i++) if (mask[i]) list.push(i);
  const cells = Int32Array.from(list);
  const points = new Float32Array(cells.length * 3);
  cells.forEach((i, k) => {
    points[k * 3] = x0 + ((i % w) + 0.5) * o.step;
    points[k * 3 + 1] = ly;
    points[k * 3 + 2] = z0 + (Math.floor(i / w) + 0.5) * o.step;
  });
  return { x0, z0, step: o.step, w, h, cells, points };
}

/** Heat colour for a level in dB below outside: quiet navy, then muted teal, amber and brick (calm on a dark panel). */
export function heatColor(db: number): [number, number, number] {
  const stops: [number, [number, number, number]][] = [
    [-45, [24, 48, 88]],
    [-30, [38, 120, 128]],
    [-18, [214, 150, 62]],
    [-6, [206, 92, 66]],
  ];
  if (db <= stops[0][0]) return stops[0][1];
  for (let i = 1; i < stops.length; i++) {
    const [d1, c1] = stops[i];
    const [d0, c0] = stops[i - 1];
    if (db <= d1) {
      const t = (db - d0) / (d1 - d0);
      return [0, 1, 2].map(k => Math.round(c0[k] + (c1[k] - c0[k]) * t)) as [number, number, number];
    }
  }
  return stops[stops.length - 1][1];
}
