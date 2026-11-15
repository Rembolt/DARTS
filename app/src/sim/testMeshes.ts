// Tiny synthetic meshes for sim tests, built directly in viewer coordinates (Y up). Not shipped code.
import { simConfig } from '../config';
import { buildRayIndex } from './geometry';
import type { SimState } from './load';
import { tagMaterials } from './materials';
import { faceNormals } from './normals';
import type { Mesh } from './obj';
import type { SimConfig, Vec3 } from './types';

export class MeshBuilder {
  positions: number[] = [];
  indices: number[] = [];

  /** One triangle, wound so its `(b − a) × (c − a)` normal points along `facing`. */
  tri(a: Vec3, b: Vec3, c: Vec3, facing: Vec3): this {
    const u = [b[0] - a[0], b[1] - a[1], b[2] - a[2]];
    const v = [c[0] - a[0], c[1] - a[1], c[2] - a[2]];
    const n = [u[1] * v[2] - u[2] * v[1], u[2] * v[0] - u[0] * v[2], u[0] * v[1] - u[1] * v[0]];
    const ok = n[0] * facing[0] + n[1] * facing[1] + n[2] * facing[2] > 0;
    const base = this.positions.length / 3;
    for (const p of ok ? [a, b, c] : [a, c, b]) this.positions.push(...p);
    this.indices.push(base, base + 1, base + 2);
    return this;
  }

  quad(a: Vec3, b: Vec3, c: Vec3, d: Vec3, facing: Vec3): this {
    return this.tri(a, b, c, facing).tri(a, c, d, facing);
  }

  /** An axis-aligned box with its six faces facing inwards (a closed room). */
  room(min: Vec3, max: Vec3): this {
    const [x0, y0, z0] = min, [x1, y1, z1] = max;
    this.quad([x0, y0, z0], [x1, y0, z0], [x1, y0, z1], [x0, y0, z1], [0, 1, 0]); // floor
    this.quad([x0, y1, z0], [x1, y1, z0], [x1, y1, z1], [x0, y1, z1], [0, -1, 0]); // ceiling
    this.quad([x0, y0, z0], [x0, y1, z0], [x0, y1, z1], [x0, y0, z1], [1, 0, 0]);
    this.quad([x1, y0, z0], [x1, y1, z0], [x1, y1, z1], [x1, y0, z1], [-1, 0, 0]);
    this.quad([x0, y0, z0], [x1, y0, z0], [x1, y1, z0], [x0, y1, z0], [0, 0, 1]);
    this.quad([x0, y0, z1], [x1, y0, z1], [x1, y1, z1], [x0, y1, z1], [0, 0, -1]);
    return this;
  }

  /** A wall across the room at x = `x`, `thickness` thick: two faces facing away from each other. */
  wallX(x: number, thickness: number, min: Vec3, max: Vec3): this {
    const a = x - thickness / 2, b = x + thickness / 2;
    const [, y0, z0] = min, [, y1, z1] = max;
    this.quad([a, y0, z0], [a, y1, z0], [a, y1, z1], [a, y0, z1], [-1, 0, 0]);
    this.quad([b, y0, z0], [b, y1, z0], [b, y1, z1], [b, y0, z1], [1, 0, 0]);
    return this;
  }

  /** The sim state `loadSim` would produce for this mesh (index first, then per-triangle data). */
  state(config: SimConfig = simConfig()): SimState {
    const mesh: Mesh = { positions: new Float32Array(this.positions), indices: new Uint32Array(this.indices) };
    const index = buildRayIndex(mesh);
    const normals = faceNormals(mesh);
    return { mesh, normals, materials: tagMaterials(mesh, normals), index, config };
  }
}

export const ROOM_MIN: Vec3 = [0, 0, 0];
export const ROOM_MAX: Vec3 = [4, 3, 3];

/** A closed 4 × 3 × 3 m room. */
export const boxRoom = (config?: SimConfig) => new MeshBuilder().room(ROOM_MIN, ROOM_MAX).state(config);

/** The same room split at x = 2 by a 0.1 m wall. */
export const splitRoom = (config?: SimConfig) =>
  new MeshBuilder().room(ROOM_MIN, ROOM_MAX).wallX(2, 0.1, ROOM_MIN, ROOM_MAX).state(config);
