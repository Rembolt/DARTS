// OBJ mesh → triangles in viewer coordinates (mvp-design.md 5.1 steps 2 and 3).

/** A triangle mesh in viewer coordinates (Y up), metres. 3 floats per vertex, 3 indices per triangle. */
export type Mesh = { positions: Float32Array; indices: Uint32Array };

const SPACE = 32, TAB = 9, CR = 13, LF = 10, SLASH = 47;

/** A typed array that doubles when full. */
class Grow<T extends Float32Array | Uint32Array> {
  length = 0;
  constructor(public data: T) {}
  push(v: number): void {
    if (this.length === this.data.length) {
      const next = new (this.data.constructor as new (n: number) => T)(this.data.length * 2);
      next.set(this.data);
      this.data = next;
    }
    this.data[this.length++] = v;
  }
  /** The filled part. A view when at least half full (no copy); a trimmed copy otherwise, so memory is not wasted. */
  done(): T {
    return (this.length * 2 >= this.data.length ? this.data.subarray(0, this.length) : this.data.slice(0, this.length)) as T;
  }
}

/**
 * Read the `v` and `f` lines of an OBJ file. Polygons are split into triangles (a fan from the first corner).
 * Matterport meshes are Z-up; the viewer is Y-up, so each vertex becomes `(x, z, −y)`.
 * Scans characters directly: about 5× faster than splitting lines on the 5 MB demo mesh.
 */
export function parseObj(obj: ArrayBuffer): Mesh {
  const text = new TextDecoder().decode(obj);
  const n = text.length;
  const guess = Math.max(16, Math.ceil(n / 40));
  const positions = new Grow(new Float32Array(guess * 3));
  const indices = new Grow(new Uint32Array(guess * 3));
  const corners: number[] = [];

  let i = 0;
  const skipSpaces = () => {
    while (i < n) {
      const c = text.charCodeAt(i);
      if (c !== SPACE && c !== TAB) break;
      i++;
    }
  };
  /** The next token on this line, or '' at the end of the line. */
  const token = (): string => {
    skipSpaces();
    const start = i;
    while (i < n) {
      const c = text.charCodeAt(i);
      if (c === SPACE || c === TAB || c === CR || c === LF) break;
      i++;
    }
    return text.slice(start, i);
  };
  const nextLine = () => {
    const end = text.indexOf('\n', i);
    i = end === -1 ? n : end + 1;
  };

  while (i < n) {
    skipSpaces();
    const c0 = text.charCodeAt(i);
    const c1 = text.charCodeAt(i + 1);
    const isKeyword = c1 === SPACE || c1 === TAB;
    if (c0 === 118 /* v */ && isKeyword) {
      const lineStart = i;
      i += 2;
      const tx = token(), ty = token(), tz = token();
      const x = Number(tx), y = Number(ty), z = Number(tz);
      // Number('') is 0, so check the tokens are there; NaN or Infinity would break the ray index and the bounds.
      if (tz === '' || !Number.isFinite(x) || !Number.isFinite(y) || !Number.isFinite(z)) {
        const end = text.indexOf('\n', lineStart);
        throw new Error(`Vertex is not three numbers: "${text.slice(lineStart, end === -1 ? n : end).trim()}"`);
      }
      positions.push(x);
      positions.push(z);
      positions.push(-y);
    } else if (c0 === 102 /* f */ && isKeyword) {
      i += 2;
      const vertexCount = positions.length / 3;
      corners.length = 0;
      for (let t = token(); t !== ''; t = token()) {
        let slash = -1;
        for (let k = 0; k < t.length; k++) {
          if (t.charCodeAt(k) === SLASH) {
            slash = k;
            break;
          }
        }
        const num = parseInt(slash === -1 ? t : t.slice(0, slash), 10);
        const index = num < 0 ? vertexCount + num : num - 1;
        if (!Number.isInteger(index) || index < 0 || index >= vertexCount) {
          throw new Error(`Face refers to vertex ${t}, which does not exist`);
        }
        corners.push(index);
      }
      for (let k = 1; k + 1 < corners.length; k++) {
        indices.push(corners[0]);
        indices.push(corners[k]);
        indices.push(corners[k + 1]);
      }
    }
    nextLine();
  }

  if (indices.length === 0) throw new Error('Mesh has no triangles');
  return { positions: positions.done(), indices: indices.done() };
}
