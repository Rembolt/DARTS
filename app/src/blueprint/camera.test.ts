import { describe, it, expect } from 'vitest';
import { Matrix4, PerspectiveCamera, Vector3 } from 'three';
import { applyPose, forwardOf } from './camera';
import type { Pose } from '../viewer';

const lens = new PerspectiveCamera(70, 1.5, 0.1, 100).projectionMatrix.toArray();
const pose = (yaw: number, pitch: number, position = { x: 0, y: 0, z: 0 }): Pose => ({
  position,
  rotation: { x: pitch, y: yaw },
  mode: 'mode.inside',
  projection: lens,
});
const clean = (v: ArrayLike<number>) => Array.from(v, x => +x.toFixed(9) || 0);

describe('applyPose', () => {
  it('uses the pose projection as is, never its own fov', () => {
    const odd = Array.from({ length: 16 }, (_, i) => (i % 5 === 0 ? 2 : i / 100));
    const cam = new PerspectiveCamera(10, 3, 1, 2);
    applyPose(cam, { ...pose(0, 0), projection: odd });
    expect(cam.projectionMatrix.toArray()).toEqual(odd);
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
