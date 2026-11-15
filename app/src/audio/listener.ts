// The audio listener from the tour's camera pose (mvp-design.md 6: "Listener").
import type { Pose } from '../viewer';
import type { Vec3 } from '../sim/types';
import { YAW_SIGN } from '../blueprint/camera';

const rad = (deg: number) => (deg * Math.PI) / 180;

export type ListenerVectors = { position: Vec3; forward: Vec3; up: Vec3 };

/**
 * Position, forward and up from a pose, in the same convention as the blueprint camera (`blueprint/camera.ts`):
 * yaw about +Y then pitch about +X (Euler order 'YXZ'); yaw 0 / pitch 0 looks along −Z with +Y up.
 * Written out by hand so the audio code does not need three.js at runtime math; tested against `forwardOf`.
 */
export function listenerVectors(pose: Pick<Pose, 'position' | 'rotation'>): ListenerVectors {
  const p = rad(pose.rotation.x);
  const y = YAW_SIGN * rad(pose.rotation.y);
  const cp = Math.cos(p), sp = Math.sin(p), cy = Math.cos(y), sy = Math.sin(y);
  return {
    position: [pose.position.x, pose.position.y, pose.position.z],
    // R = Ry(yaw) · Rx(pitch) applied to (0, 0, −1) and (0, 1, 0).
    forward: [-cp * sy, sp, -cp * cy],
    up: [sp * sy, cp, sp * cy],
  };
}

/** Set a Web Audio listener from a pose. Uses the AudioParam form, falling back to the old setters (Firefox). */
export function applyListener(listener: AudioListener, pose: Pick<Pose, 'position' | 'rotation'>, time: number, smoothing: number): void {
  const { position: [px, py, pz], forward: [fx, fy, fz], up: [ux, uy, uz] } = listenerVectors(pose);
  if (listener.positionX) {
    const set = (param: AudioParam, v: number) => param.setTargetAtTime(v, time, smoothing);
    set(listener.positionX, px); set(listener.positionY, py); set(listener.positionZ, pz);
    set(listener.forwardX, fx); set(listener.forwardY, fy); set(listener.forwardZ, fz);
    set(listener.upX, ux); set(listener.upY, uy); set(listener.upZ, uz);
  } else {
    listener.setPosition(px, py, pz);
    listener.setOrientation(fx, fy, fz, ux, uy, uz);
  }
}
