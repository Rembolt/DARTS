// OBJ mesh → triangles in viewer coordinates (mvp-design.md 5.1 steps 2 and 3).

/** A triangle mesh in viewer coordinates (Y up), metres. 3 floats per vertex, 3 indices per triangle. */
export type Mesh = { positions: Float32Array; indices: Uint32Array };

/**
 * Read the `v` and `f` lines of an OBJ file. Polygons are split into triangles (a fan from the first corner).
 * Matterport meshes are Z-up; the viewer is Y-up, so each vertex becomes `(x, z, −y)`.
 */
export function parseObj(obj: ArrayBuffer): Mesh {
  const text = new TextDecoder().decode(obj);
  const positions: number[] = [];
  const indices: number[] = [];
  const corners: number[] = [];

  let start = 0;
  while (start < text.length) {
    let end = text.indexOf('\n', start);
    if (end === -1) end = text.length;
    const line = text.slice(start, end).trim();
    start = end + 1;

    if (line.startsWith('v ')) {
      const t = line.split(/\s+/);
      const x = Number(t[1]);
      const y = Number(t[2]);
      const z = Number(t[3]);
      positions.push(x, z, -y);
    } else if (line.startsWith('f ')) {
      const t = line.split(/\s+/);
      const vertexCount = positions.length / 3;
      corners.length = 0;
      for (let i = 1; i < t.length; i++) {
        const slash = t[i].indexOf('/');
        const n = parseInt(slash === -1 ? t[i] : t[i].slice(0, slash), 10);
        const index = n < 0 ? vertexCount + n : n - 1;
        if (!Number.isInteger(index) || index < 0 || index >= vertexCount) {
          throw new Error(`Face refers to vertex ${t[i]}, which does not exist`);
        }
        corners.push(index);
      }
      for (let i = 1; i + 1 < corners.length; i++) indices.push(corners[0], corners[i], corners[i + 1]);
    }
  }

  if (indices.length === 0) throw new Error('Mesh has no triangles');
  return { positions: new Float32Array(positions), indices: new Uint32Array(indices) };
}
