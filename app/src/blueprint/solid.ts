// The solid model under the blueprint lines: the mesh's triangles, coloured by material.

/**
 * A copy of `indices` with the triangles ordered by material id (stable), and one draw group per material present,
 * so three.js can draw walls, floors and ceilings with their own material (and hide ceilings) from one geometry.
 */
export function groupByMaterial(
  indices: Uint32Array,
  materials: Uint8Array,
): { indices: Uint32Array; groups: { start: number; count: number; materialIndex: number }[] } {
  const counts = [0, 0, 0];
  for (let t = 0; t < materials.length; t++) counts[materials[t]]++;
  const offsets = [0, counts[0], counts[0] + counts[1]];
  const next = [...offsets];
  const out = new Uint32Array(indices.length);
  for (let t = 0; t < materials.length; t++) {
    const at = 3 * next[materials[t]]++;
    out[at] = indices[3 * t];
    out[at + 1] = indices[3 * t + 1];
    out[at + 2] = indices[3 * t + 2];
  }
  const groups = [0, 1, 2]
    .filter(m => counts[m] > 0)
    .map(m => ({ start: 3 * offsets[m], count: 3 * counts[m], materialIndex: m }));
  return { indices: out, groups };
}
