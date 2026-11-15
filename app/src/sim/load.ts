// The load step (mvp-design.md 5.1, steps 2 to 7), run once in the worker.
import { extractLinesTagged } from './edges';
import { buildRayIndex, type RayIndex } from './geometry';
import { mvpTable, resolveSurfaces, type ResolvedSurface, type SetMaterials, type SurfaceTable } from './library';
import { layerCounts, layersAfterReorder } from './layers';
import type { Panels } from './openings';
import { tagMaterials } from './materials';
import { faceNormals } from './normals';
import { parseObj, type Mesh } from './obj';
import type { FromWorker, SimConfig, Vec3 } from './types';

export type ReadyMessage = Extract<FromWorker, { type: 'ready' }>;

/** What the worker keeps after loading. Tracing reads it; the V2 setting messages change it. */
export type SimState = {
  mesh: Mesh;
  normals: Float32Array;
  index: RayIndex;
  config: SimConfig;
  /** Per triangle, from facing (`tagMaterials`): 0 wall, 1 floor, 2 ceiling. Kept from load. */
  surfaceClass: Uint8Array;
  /** Per triangle: room index from `setRooms`, −1 in no room. */
  room: Int16Array;
  /** Per triangle: 1 for a wall that faces outside (`setRooms`). */
  exterior: Uint8Array;
  /** Room ids of the last `setRooms`, in index order. */
  roomIds: string[];
  /** The materials in use, from `config.materials` until the first `setMaterials`. */
  table: SurfaceTable;
  /** The last `setMaterials`, re-applied when the rooms change. */
  lastSetMaterials: SetMaterials | null;
  /** Per triangle: index into `surfaces`. */
  surface: Uint16Array;
  surfaces: ResolvedSurface[];
  /** Per triangle: mesh layer (OBJ group; 0 is 'house'). */
  layer: Uint8Array;
  layerIds: string[];
  /** Per layer: do rays hit it (`setLayers`). */
  layerTraced: boolean[];
  /** Every layer traced: ray casts take the plain path. */
  allTraced: boolean;
  /** Door and window panels (`loadOpenings`), null until loaded. Their triangles are numbered after the mesh's. */
  panels: Panels | null;
  /** Opening ids closed by the last `setOpenings`. */
  closedOpenings: Set<string>;
};

/** Per-triangle layers in index order, with their names. */
export type Layers = { layer: Uint8Array; ids: string[] };

/** The state for a mesh whose ray index is built. Call after `buildRayIndex`: it reorders `mesh.indices`. */
export function createSimState(
  mesh: Mesh,
  index: RayIndex,
  normals: Float32Array,
  surfaceClass: Uint8Array,
  config: SimConfig,
  layers: Layers = { layer: new Uint8Array(mesh.indices.length / 3), ids: ['house'] },
): SimState {
  const triangles = mesh.indices.length / 3;
  const state: SimState = {
    mesh,
    normals,
    index,
    config,
    surfaceClass,
    room: new Int16Array(triangles).fill(-1),
    exterior: new Uint8Array(triangles),
    roomIds: [],
    table: mvpTable(config),
    lastSetMaterials: null,
    surface: new Uint16Array(triangles),
    surfaces: [],
    layer: layers.layer,
    layerIds: layers.ids,
    layerTraced: layers.ids.map(() => true),
    allTraced: true,
    panels: null,
    closedOpenings: new Set(),
  };
  resolveSurfaces(state);
  return state;
}

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
  const { groups, triangleGroup, ...mesh } = parseObj(obj);
  // A copy of the triangles in file order, to find each one's group again after the index reorders them.
  const before = groups.length > 1 ? mesh.indices.slice() : null;
  const t1 = performance.now();
  // MeshBVH reorders mesh.indices in place. Everything per triangle is computed after this line, so triangle
  // numbers match the `triangle` that firstHit reports.
  const index = buildRayIndex(mesh);
  const layer = before
    ? layersAfterReorder(before, triangleGroup, mesh.indices, mesh.positions.length / 3)
    : new Uint8Array(triangleGroup.length);
  const t2 = performance.now();
  const normals = faceNormals(mesh);
  const materials = tagMaterials(mesh, normals);
  const state = createSimState(mesh, index, normals, materials, config, { layer, ids: groups });
  const t3 = performance.now();
  const tagged = extractLinesTagged(mesh, config.blueprintEdgeAngle, normals);
  const lines = tagged.lines;
  const lineLayers = new Uint8Array(tagged.triangles.length);
  for (let i = 0; i < lineLayers.length; i++) lineLayers[i] = layer[tagged.triangles[i]];
  const t4 = performance.now();

  const { min, max } = bounds(mesh.positions);
  return {
    state,
    ready: {
      type: 'ready',
      lines,
      boundsMin: min,
      boundsMax: max,
      triangles: mesh.indices.length / 3,
      loadMs: t4 - t0,
      timings: { parse: t1 - t0, index: t2 - t1, materials: t3 - t2, lines: t4 - t3 },
      // Copies: these buffers are transferred to the page, and the worker's own must stay usable for tracing.
      mesh: {
        positions: mesh.positions.slice(),
        indices: mesh.indices.slice(),
        materials: materials.slice(),
        layers: layer.slice(),
      },
      layers: layerCounts(layer, groups),
      lineLayers,
    },
  };
}
