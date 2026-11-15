// Dev-only helpers, loaded from main.ts behind import.meta.env.DEV. Never part of a production build.
import { PerspectiveCamera } from 'three';
import { alignmentStats, sampleEndpoints, toPixels } from './blueprint/align';
import { applyPose } from './blueprint/camera';
import type { MpSdk, Pose } from './viewer';

export type BlueprintCheckInputs = {
  sdk: MpSdk;
  getPose(): Pose | null;
  getLines(): Float32Array | null;
  getSize(): { w: number; h: number };
};

export type BlueprintCheck = { mode: string; visible: number; samples: number; maxPx: number; medianPx: number };

declare global {
  interface Window {
    /** Compare our projection of blueprint points with the tour's own (`Conversion.worldToScreen`). */
    __blueprintCheck?: (samples?: number) => BlueprintCheck;
    /** The connected SDK, for driving the tour from DevTools (moving, rotating, switching modes). */
    __sdk?: MpSdk;
  }
}

export function installBlueprintCheck({ sdk, getPose, getLines, getSize }: BlueprintCheckInputs): void {
  const camera = new PerspectiveCamera();
  window.__sdk = sdk;
  window.__blueprintCheck = (samples = 200) => {
    const pose = getPose();
    const lines = getLines();
    if (!pose || !lines) throw new Error('the tour pose or the mesh is not ready yet');
    const size = getSize();
    applyPose(camera, pose);
    const errors: number[] = [];
    for (const p of sampleEndpoints(lines, samples)) {
      const ours = toPixels(camera, p, size);
      if (!ours.inFront || ours.x < 0 || ours.y < 0 || ours.x > size.w || ours.y > size.h) continue;
      const theirs = sdk.Conversion.worldToScreen({ x: p[0], y: p[1], z: p[2] }, pose, size);
      errors.push(Math.hypot(ours.x - theirs.x, ours.y - theirs.y));
    }
    return { mode: pose.mode, visible: errors.length, ...alignmentStats(errors) };
  };
}
