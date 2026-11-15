// Messages between the page and the simulation worker (mvp-design.md 5.7).
// Everything is in viewer coordinates (Y up), in metres and seconds.

export type Vec3 = [number, number, number];
export type Bands = [number, number, number]; // low, mid, high

export type Material = { absorption: Bands; scattering: number; blockingDb: Bands };

export type SimConfig = {
  materials: { wall: Material; floor: Material; ceiling: Material };
  furnishing: number;
  transmissionScale: number;
  raysPerTrace: number;
  bounces: number;
  maxLegWalls: number;
  scatteringFloor: number;
  occlusionRays: number;
  occlusionRadius: number; // metres
  wallMergeDistance: number; // metres
  earlyWindow: number; // seconds
  slotDirections: Vec3[];
  maxDrawnPaths: number;
  reverbRays: number;
  reverbBounces: number;
  blueprintEdgeAngle: number; // degrees
  speedOfSound: number; // metres per second
};

export type ToWorker =
  | { type: 'load'; obj: ArrayBuffer; config: SimConfig }
  | { type: 'trace'; id: number; listener: Vec3; sources: { id: string; position: Vec3 }[] }
  | { type: 'reverb'; roomId: string; listener: Vec3 }
  // V2 (v2-design.md section 8). Every setting message is followed by a fresh trace from the page.
  | {
      type: 'setMaterials';
      library: Material[]; // library, then resolved blends (v2-design 4.4); at most 255 entries
      surfaces: [number, number, number, number]; // material index per class: wall, floor, ceiling, exterior wall
      roomSurfaces?: { roomId: string; surfaces: [number, number, number] }[];
      furnishing: number;
      roomFurnishing?: { roomId: string; value: number }[];
      /** Indexes of `glass` and `door` in `library`, for closed window and door panels. Default: the MVP wall. */
      glassIndex?: number;
      doorIndex?: number;
    }
  | { type: 'setRooms'; rooms: RoomGeom[] }
  | { type: 'loadOpenings'; openings: OpeningGeom[] }
  | { type: 'setOpenings'; closed: string[] } // every other loaded opening is open
  | { type: 'setLayers'; traced: Record<string, boolean> }
  | { type: 'setQuality'; raysPerTrace: number; bounces: number; reverbRays: number }
  | { type: 'measure'; id: number; point: Vec3; roomId: string; sources: { id: string; position: Vec3 }[] }
  /** Direct sound only, one ray per point: for the heat map and listening probes. Cheap: thousands of points per call. */
  | { type: 'field'; id: number; source: Vec3; points: Float32Array }
  /** The walls between two points, in order from `from`: for drawing what stands between a listener and a source. */
  | { type: 'walls'; id: number; from: Vec3; to: Vec3 }
  /** Change the simulation settings while it runs (v2-design.md 3 and 4). Anything left out stays as it was. */
  | { type: 'config'; materials?: Partial<SimConfig['materials']>; furnishing?: number; raysPerTrace?: number; bounces?: number; reverbRays?: number };

/** A PI room in viewer coordinates: polygon in x/z, height filled per v2-design 4.4. */
export type RoomGeom = { id: string; floorY: number; height: number; polygon: [number, number][] };

export type OpeningGeom = {
  id: string;
  kind: 'window' | 'door';
  roomId: string;
  corners: [Vec3, Vec3, Vec3, Vec3]; // viewer coordinates
  thickness: number;
};

export type FromWorker =
  | {
      type: 'ready';
      lines: Float32Array; // blueprint line segments as pairs of points
      boundsMin: Vec3;
      boundsMax: Vec3;
      triangles: number;
      loadMs: number; // parse + index + materials + lines, without the download
      timings: { parse: number; index: number; materials: number; lines: number }; // ms
      /** A copy of the triangles for the solid blueprint (the worker keeps its own for tracing). */
      mesh: { positions: Float32Array; indices: Uint32Array; materials: Uint8Array; layers: Uint8Array };
      /** The mesh layers (OBJ groups; 0 is 'house', the ungrouped faces). `mesh.layers` indexes this list. */
      layers: { id: string; triangles: number }[];
      /** The layer of the triangle each blueprint line came from (one entry per 6 floats of `lines`). */
      lineLayers: Uint8Array;
    }
  | {
      type: 'trace';
      id: number;
      listener: Vec3;
      ms: number;
      echoTimeEstimate: Bands;
      sources: SourceResult[];
      paths: Float32Array; // line segments as pairs of points
      pathSource: Uint8Array; // which source each segment belongs to
    }
  | { type: 'reverb'; roomId: string; echoTime: Bands; ms: number }
  | { type: 'roomsReady'; rooms: { id: string; triangles: number }[]; untagged: number; exteriorWalls: number; ms: number }
  | { type: 'openingsReady'; openings: { id: string; meshClosed: boolean }[]; lines: Float32Array; ms: number }
  | { type: 'measure'; id: number; echoTime: Bands; sources: { id: string; levelDb: Bands; walls: number }[]; ms: number }
  | { type: 'walls'; id: number; walls: { distance: number; lossDb: Bands }[] }
  /** Per point, in the request's order: strength left after walls (3 bands, 0..1) and walls crossed. */
  | { type: 'field'; id: number; direct: Float32Array; walls: Uint8Array; ms: number }
  | { type: 'error'; message: string };

export type SourceResult = {
  id: string;
  distance: number; // metres
  direct: Bands; // strength left after walls, 0..1
  walls: number; // walls crossed by the centre ray
  slots: { energy: Bands; delay: number }[]; // 12 entries, delay in seconds after the direct sound
  lateEnergy: Bands;
};
