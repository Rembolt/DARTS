// The blueprint view (mvp-design.md 7): the mesh as lines on see-through white, seen through the tour's camera.
import { BufferAttribute, BufferGeometry, LineBasicMaterial, LineSegments, PerspectiveCamera, Scene, WebGLRenderer } from 'three';
import { BLUEPRINT } from '../config';
import type { Pose } from '../viewer';
import { applyPose } from './camera';
import { createPathsLayer, type TraceOverlay } from './paths';
import { canvasSize, createScheduler } from './schedule';

export type Blueprint = {
  setLines(lines: Float32Array): void;
  setPose(pose: Pose): void;
  /** Draws the sources, direct lines and traced paths of one trace (build step 8); `null` clears them. */
  setTrace(trace: TraceOverlay | null): void;
  setVisible(visible: boolean): void;
  resize(box: { width: number; height: number }, pixelRatio: number): void;
  dispose(): void;
};

export function createBlueprint(canvas: HTMLCanvasElement): Blueprint {
  const scene = new Scene();
  const camera = new PerspectiveCamera();
  const material = new LineBasicMaterial({ color: BLUEPRINT.lineColor });
  const lines = new LineSegments(new BufferGeometry(), material);
  lines.frustumCulled = false; // the bounds are the whole house; culling would save nothing
  scene.add(lines);
  const paths = createPathsLayer();
  scene.add(paths.object);

  let renderer: WebGLRenderer | null = null; // created on first show: a hidden blueprint costs nothing
  let size = canvasSize({ width: canvas.clientWidth, height: canvas.clientHeight }, 1);
  paths.setPixelRatio(size.pixelRatio);
  let posed = false;

  const ensureRenderer = (): WebGLRenderer => {
    if (!renderer) {
      renderer = new WebGLRenderer({ canvas, alpha: true, antialias: true });
      renderer.setClearColor(BLUEPRINT.background, BLUEPRINT.opacity);
      renderer.setPixelRatio(size.pixelRatio);
      renderer.setSize(size.width, size.height, false);
    }
    return renderer;
  };

  const scheduler = createScheduler(() => {
    const r = ensureRenderer();
    if (!posed) {
      r.clear();
      return;
    }
    r.render(scene, camera);
  });

  return {
    setLines(data) {
      const old = lines.geometry;
      const geometry = new BufferGeometry();
      geometry.setAttribute('position', new BufferAttribute(data, 3));
      lines.geometry = geometry;
      old.dispose();
      scheduler.request();
    },
    setPose(pose) {
      applyPose(camera, pose);
      posed = true;
      scheduler.request();
    },
    setTrace(trace) {
      paths.set(trace);
      scheduler.request();
    },
    setVisible(visible) {
      scheduler.setVisible(visible);
    },
    resize(box, pixelRatio) {
      size = canvasSize(box, pixelRatio);
      paths.setPixelRatio(size.pixelRatio);
      if (renderer) {
        renderer.setPixelRatio(size.pixelRatio);
        renderer.setSize(size.width, size.height, false);
      }
      scheduler.request();
    },
    dispose() {
      scheduler.setVisible(false);
      lines.geometry.dispose();
      material.dispose();
      paths.dispose();
      renderer?.dispose();
      renderer = null;
    },
  };
}
