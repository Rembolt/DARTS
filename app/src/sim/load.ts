// The load step (mvp-design.md 5.1, steps 2 to 7), run once in the worker.
import { extractLines } from './edges';
import { buildRayIndex, type RayIndex } from './geometry';
import { tagMaterials } from './materials';
import { faceNormals } from './normals';
import { parseObj, type Mesh } from './obj';
import type { FromWorker, SimConfig, Vec3 } from './types';

export type ReadyMessage = Extract<FromWorker, { type: 'ready' }>;

/** What the worker keeps after loading. Tracing (later steps) reads it. */
export type SimState = { mesh: Mesh; normals: Float32Array; materials: Uint8Array; index: RayIndex; config: SimConfig };

function bounds(positions: Float32Array): { min: Vec3; max: Vec3 } {
  const min: Vec3 = [Infinity, Infinity, Infinity];
  const max: Vec3 = [-Infinity, -Infinity, -Infinity];
  for (let i = 0; i < positions.length; i += 3) {
    for (let k = 0; k < 3; k++) {
      const v = positions[i + k];
      if (v < min[k]) min[k] = v;
      if (v > max[k]) max[k] = v;
    }
  }
  // Float32 storage; round to 0.1 mm so -0 and float noise do not show up in logs or tests.
  const round = (v: number) => Math.round(v * 1e4) / 1e4 || 0;
  return { min: min.map(round) as Vec3, max: max.map(round) as Vec3 };
}

export function loadSim(obj: ArrayBuffer, config: SimConfig): { state: SimState; ready: ReadyMessage } {
  const t0 = performance.now();
  const mesh = parseObj(obj);
  const t1 = performance.now();
  // MeshBVH reorders mesh.indices in place. Everything per triangle is computed after this line, so triangle
  // numbers match the `triangle` that firstHit reports.
  const index = buildRayIndex(mesh);
  const t2 = performance.now();
  const normals = faceNormals(mesh);
  const materials = tagMaterials(mesh, normals);
  const t3 = performance.now();
  const lines = extractLines(mesh, config.blueprintEdgeAngle, normals);
  const t4 = performance.now();

  const { min, max } = bounds(mesh.positions);
  return {
    state: { mesh, normals, materials, index, config },
    ready: {
      type: 'ready',
      lines,
      boundsMin: min,
      boundsMax: max,
      triangles: mesh.indices.length / 3,
      loadMs: t4 - t0,
      timings: { parse: t1 - t0, index: t2 - t1, materials: t3 - t2, lines: t4 - t3 },
    },
  };
}
