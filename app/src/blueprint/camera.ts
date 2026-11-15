// The tour's camera, copied onto a three.js camera (mvp-design.md 7: "the same position, direction and field of view").
import { Euler, PerspectiveCamera, Vector3 } from 'three';
import type { Pose } from '../viewer';
import type { Vec3 } from '../sim/types';

/** The pose's rotation convention, in one place: yaw about +Y, then pitch about +X; yaw 0 / pitch 0 looks along −Z. */
export const EULER_ORDER = 'YXZ' as const;
export const YAW_SIGN = 1;

const rad = (deg: number) => (deg * Math.PI) / 180;

/**
 * Set `camera` from the tour's pose: view from position and rotation, lens from the pose's own projection matrix
 * (row-major in the pose),
 * so field of view, aspect and mode (inside, dollhouse, floor plan) match without guessing. Never call
 * `updateProjectionMatrix()` on this camera: it would rebuild the lens from its own `fov`. Pass the canvas `aspect`
 * (width / height) to fit the lens to the box the lines are drawn in.
 */
export function applyPose(camera: PerspectiveCamera, pose: Pose, aspect?: number): void {
  camera.position.set(pose.position.x, pose.position.y, pose.position.z);
  camera.rotation.set(rad(pose.rotation.x), YAW_SIGN * rad(pose.rotation.y), 0, EULER_ORDER);
  // The Bundle sends the matrix row by row (checked on the demo tour); three.js stores columns, so transpose.
  camera.projectionMatrix.fromArray(Array.from(pose.projection)).transpose();
  // Fit the lens to the canvas box: for perspective and orthographic lenses alike, x scale = y scale / aspect. Without
  // this, a resize that brings no new pose would stretch the lines off the walls until the camera moved.
  if (aspect && Number.isFinite(aspect) && aspect > 0) {
    const m = camera.projectionMatrix.elements;
    m[0] = m[5] / aspect;
  }
  camera.projectionMatrixInverse.copy(camera.projectionMatrix).invert();
  camera.updateMatrixWorld(true);
  camera.matrixWorldInverse.copy(camera.matrixWorld).invert();
}

/** The unit direction the pose looks along. */
export function forwardOf(pose: Pose): Vec3 {
  const euler = new Euler(rad(pose.rotation.x), YAW_SIGN * rad(pose.rotation.y), 0, EULER_ORDER);
  const f = new Vector3(0, 0, -1).applyEuler(euler);
  return [f.x, f.y, f.z];
}
