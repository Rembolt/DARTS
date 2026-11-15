import { PerspectiveCamera } from 'three';
import { describe, expect, it } from 'vitest';
import type { Pose } from '../viewer';
import { project, useCamera } from './project';

function pose(): Pose {
  const lens = new PerspectiveCamera(60, 2, 0.1, 100);
  lens.updateProjectionMatrix();
  // The pose carries the matrix row by row; three stores columns.
  const rowMajor = lens.projectionMatrix.clone().transpose().toArray();
  return { position: { x: 0, y: 1.5, z: 0 }, rotation: { x: 0, y: 0 }, mode: 'mode.inside', projection: rowMajor };
}

const size = { w: 1000, h: 500 };

describe('project', () => {
  it('puts a point straight ahead in the middle of the stage', () => {
    useCamera(pose(), size);
    const s = project([0, 1.5, -5], size);
    expect(s.visible).toBe(true);
    expect(s.x).toBeCloseTo(500, 3);
    expect(s.y).toBeCloseTo(250, 3);
    expect(s.distance).toBeCloseTo(5, 6);
  });

  it('hides a point behind the camera', () => {
    useCamera(pose(), size);
    expect(project([0, 1.5, 5], size).visible).toBe(false);
  });

  it('puts a point to the right of the view on the right half', () => {
    useCamera(pose(), size);
    const s = project([1, 1.5, -5], size);
    expect(s.x).toBeGreaterThan(500);
  });

  it('hides a point outside the frame', () => {
    useCamera(pose(), size);
    expect(project([40, 1.5, -5], size).visible).toBe(false);
  });
});
