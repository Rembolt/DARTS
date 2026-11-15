import { describe, it, expect } from 'vitest';
import { Matrix4, PerspectiveCamera, Vector3 } from 'three';
import { applyPose, forwardOf } from './camera';
import type { Pose } from '../viewer';

// A real lens, laid out row by row like the Bundle's Camera.Pose.projection.
const lens = new PerspectiveCamera(70, 1.5, 0.1, 100).projectionMatrix.clone().transpose().toArray();
const pose = (yaw: number, pitch: number, position = { x: 0, y: 0, z: 0 }): Pose => ({
  position,
  rotation: { x: pitch, y: yaw },
  mode: 'mode.inside',
  projection: lens,
});
const clean = (v: ArrayLike<number>) => Array.from(v, x => +x.toFixed(9) || 0);

describe('applyPose', () => {
  it('reads the pose projection row by row, as the Bundle sends it, never its own fov', () => {
    // Measured on the demo tour: the Bundle's projection has -1 at index 14 and the depth term at index 11.
    const fromTour = [0.786, 0, 0, 0, 0, 1.3032, 0, 0, 0, 0, -1.0001, -0.2, 0, 0, -1, 0];
    const cam = new PerspectiveCamera(10, 3, 1, 2);
    applyPose(cam, { ...pose(0, 0), projection: fromTour });
    const expected = new Matrix4().set(...(fromTour as Parameters<Matrix4['set']>));
    expect(cam.projectionMatrix.toArray()).toEqual(expected.toArray());
    const id = new Matrix4().multiplyMatrices(cam.projectionMatrix, cam.projectionMatrixInverse).toArray();
    id.forEach((v, i) => expect(v).toBeCloseTo(i % 5 === 0 ? 1 : 0, 9));
  });

  it('projects a point straight ahead to the centre of the screen', () => {
    const cam = new PerspectiveCamera();
    applyPose(cam, pose(30, -10, { x: 1, y: 1.5, z: 2 }));
    const [fx, fy, fz] = forwardOf(pose(30, -10));
    const ndc = new Vector3(1 + 3 * fx, 1.5 + 3 * fy, 2 + 3 * fz).project(cam);
    expect(ndc.x).toBeCloseTo(0, 6);
    expect(ndc.y).toBeCloseTo(0, 6);
  });

  it('keeps only the latest pose', () => {
    const cam = new PerspectiveCamera();
    applyPose(cam, pose(90, 20, { x: 5, y: 5, z: 5 }));
    applyPose(cam, pose(0, 0));
    expect(cam.position.toArray()).toEqual([0, 0, 0]);
    expect(clean(new Vector3(0, 0, -1).applyQuaternion(cam.quaternion).toArray())).toEqual([0, 0, -1]);
  });
});

describe('forwardOf', () => {
  it('looks along -Z at yaw 0, pitch 0', () => expect(clean(forwardOf(pose(0, 0)))).toEqual([0, 0, -1]));
  it('looks along -X at yaw 90', () => expect(clean(forwardOf(pose(90, 0)))).toEqual([-1, 0, 0]));
  it('looks up at pitch +30', () => expect(forwardOf(pose(0, 30))[1]).toBeCloseTo(0.5, 9));
});
