// World point → pixel in the stage, using the tour's own pose (same camera as the blueprint canvas).
import { PerspectiveCamera, Vector3 } from 'three';
import { applyPose } from '../blueprint/camera';
import type { Vec3 } from '../sim/types';
import type { Pose } from '../viewer';

export type Screen = { x: number; y: number; /** metres from the camera */ distance: number; /** in front of the lens and inside the frame */ visible: boolean };

const camera = new PerspectiveCamera();
const tmp = new Vector3();

/** Call once per pose, then `project` for each point. */
export function useCamera(pose: Pose, size: { w: number; h: number }): void {
  applyPose(camera, pose, size.h > 0 ? size.w / size.h : 1);
}

export function project(world: Vec3, size: { w: number; h: number }, margin = 0): Screen {
  tmp.set(world[0], world[1], world[2]);
  const distance = tmp.distanceTo(camera.position);
  tmp.project(camera);
  const x = ((tmp.x + 1) / 2) * size.w;
  const y = ((1 - tmp.y) / 2) * size.h;
  const inFront = tmp.z > -1 && tmp.z < 1;
  const inside = x >= margin && x <= size.w - margin && y >= margin && y <= size.h - margin;
  return { x, y, distance, visible: inFront && inside };
}
