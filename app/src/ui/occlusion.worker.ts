// Line of sight for the overlay's pins: is the segment from the camera to a point blocked by the mesh?
// Its own worker with its own copy of the mesh, so it answers in a few ms even while the sim worker traces.
import { BufferAttribute, BufferGeometry, DoubleSide, Ray } from 'three';
import { MeshBVH } from 'three-mesh-bvh';
import { blocked, type OcclusionRequest, type OcclusionResponse, type OcclusionSetup } from './occlusion';

let bvh: MeshBVH | null = null;
const ray = new Ray();

self.onmessage = (event: MessageEvent<OcclusionSetup | OcclusionRequest>) => {
  const msg = event.data;
  if (msg.type === 'mesh') {
    const geometry = new BufferGeometry();
    geometry.setAttribute('position', new BufferAttribute(msg.positions, 3));
    geometry.setIndex(new BufferAttribute(msg.indices, 1));
    bvh = new MeshBVH(geometry);
    return;
  }
  if (!bvh) return;
  const index = bvh;
  const hidden = msg.points.map(p =>
    blocked(msg.eye, p, (origin, dir, far) => {
      ray.origin.set(origin[0], origin[1], origin[2]);
      ray.direction.set(dir[0], dir[1], dir[2]);
      const hit = index.raycastFirst(ray, DoubleSide, 0, far);
      return hit ? hit.distance : null;
    }),
  );
  (self as unknown as Worker).postMessage({ type: 'visibility', id: msg.id, hidden } satisfies OcclusionResponse);
};
