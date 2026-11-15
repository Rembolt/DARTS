// Page side of the line-of-sight worker, and the rule it applies.
import type { Vec3 } from '../sim/types';

export type OcclusionSetup = { type: 'mesh'; positions: Float32Array; indices: Uint32Array };
export type OcclusionRequest = { type: 'query'; id: number; eye: Vec3; points: Vec3[] };
export type OcclusionResponse = { type: 'visibility'; id: number; hidden: boolean[] };

/**
 * How close to the point a hit may be and still count as "the point itself". Doors, windows and speakers sit on
 * or in a wall, so the ray always meets that wall right at the end; the scanned mesh is also bumpy by a few cm.
 */
export const END_TOLERANCE = 0.35; // metres

/** True when something lies between `eye` and `point`. `cast` returns the distance of the first hit within `far`. */
export function blocked(eye: Vec3, point: Vec3, cast: (origin: Vec3, dir: Vec3, far: number) => number | null): boolean {
  const d: Vec3 = [point[0] - eye[0], point[1] - eye[1], point[2] - eye[2]];
  const len = Math.hypot(d[0], d[1], d[2]);
  if (len <= END_TOLERANCE) return false;
  const dir: Vec3 = [d[0] / len, d[1] / len, d[2] / len];
  const hit = cast(eye, dir, len - END_TOLERANCE);
  return hit !== null;
}

export type Occlusion = {
  /** Ask which points are hidden from `eye`. Only the newest answer is applied; at most one query is in flight. */
  query(eye: Vec3, ids: string[], points: Vec3[]): void;
  dispose(): void;
};

export function createOcclusion(
  mesh: { positions: Float32Array; indices: Uint32Array },
  onResult: (hidden: Map<string, boolean>) => void,
): Occlusion {
  const worker = new Worker(new URL('./occlusion.worker.ts', import.meta.url), { type: 'module' });
  // Copies: the blueprint keeps using its own arrays.
  const positions = mesh.positions.slice();
  const indices = mesh.indices.slice();
  worker.postMessage({ type: 'mesh', positions, indices } satisfies OcclusionSetup, [positions.buffer, indices.buffer]);

  let id = 0;
  let inFlight: { id: number; ids: string[] } | null = null;
  let pending: { eye: Vec3; ids: string[]; points: Vec3[] } | null = null;

  const send = (q: { eye: Vec3; ids: string[]; points: Vec3[] }) => {
    inFlight = { id: ++id, ids: q.ids };
    worker.postMessage({ type: 'query', id, eye: q.eye, points: q.points } satisfies OcclusionRequest);
  };

  worker.onmessage = (event: MessageEvent<OcclusionResponse>) => {
    const msg = event.data;
    if (!inFlight || msg.id !== inFlight.id) return;
    const map = new Map<string, boolean>();
    inFlight.ids.forEach((key, i) => map.set(key, msg.hidden[i]));
    inFlight = null;
    onResult(map);
    if (pending) {
      const next = pending;
      pending = null;
      send(next);
    }
  };

  return {
    query(eye, ids, points) {
      const q = { eye, ids, points };
      if (inFlight) pending = q;
      else send(q);
    },
    dispose() {
      worker.terminate();
    },
  };
}
