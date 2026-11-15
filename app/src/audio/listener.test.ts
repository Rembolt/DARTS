import { describe, it, expect } from 'vitest';
import { listenerVectors } from './listener';
import { forwardOf } from '../blueprint/camera';
import type { Pose } from '../viewer';

const pose = (pitch: number, yaw: number): Pose => ({
  position: { x: 1, y: 2, z: 3 },
  rotation: { x: pitch, y: yaw },
  mode: 'mode.inside',
  projection: new Array(16).fill(0),
});

const close = (a: number[], b: number[]) => a.forEach((v, i) => expect(v).toBeCloseTo(b[i], 9));
const dot = (a: number[], b: number[]) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2];

describe('listenerVectors', () => {
  it('looks along −Z with +Y up at yaw 0, pitch 0', () => {
    const v = listenerVectors(pose(0, 0));
    expect(v.position).toEqual([1, 2, 3]);
    close(v.forward, [0, 0, -1]);
    close(v.up, [0, 1, 0]);
  });

  it('matches the blueprint camera forward for any pose', () => {
    for (const [p, y] of [[0, 90], [30, 45], [-60, 200], [10, -135], [89, 10]]) {
      close(listenerVectors(pose(p, y)).forward, forwardOf(pose(p, y)));
    }
  });

  it('pitching up raises forward and tilts up backwards; vectors stay unit and perpendicular', () => {
    const v = listenerVectors(pose(30, 0));
    close(v.forward, [0, 0.5, -Math.sqrt(3) / 2]);
    close(v.up, [0, Math.sqrt(3) / 2, 0.5]);
    for (const [p, y] of [[12, 34], [-45, 170]]) {
      const w = listenerVectors(pose(p, y));
      expect(dot(w.forward, w.forward)).toBeCloseTo(1, 9);
      expect(dot(w.up, w.up)).toBeCloseTo(1, 9);
      expect(dot(w.forward, w.up)).toBeCloseTo(0, 9);
    }
  });
});
