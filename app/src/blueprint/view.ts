// The blueprint view (mvp-design.md 7): the mesh as lines on see-through white, seen through the tour's camera.
import {
  BufferAttribute,
  BufferGeometry,
  DirectionalLight,
  DoubleSide,
  HemisphereLight,
  LineBasicMaterial,
  LineSegments,
  Mesh,
  MeshLambertMaterial,
  PerspectiveCamera,
  Scene,
  WebGLRenderer,
} from 'three';
import { BLUEPRINT } from '../config';
import type { Pose } from '../viewer';
import { applyPose } from './camera';
import { ceilingsVisible, type BlueprintMode } from './mode';
import { groupByMaterial } from './solid';
import { canvasSize, createScheduler } from './schedule';

export type Blueprint = {
  setLines(lines: Float32Array): void;
  /** The triangles and their material ids (wall 0, floor 1, ceiling 2) for solid mode. */
  setMesh(mesh: { positions: Float32Array; indices: Uint32Array; materials: Uint8Array }): void;
  setMode(mode: BlueprintMode): void;
  setPose(pose: Pose): void;
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

  // Solid mode: the house as a white model. Pushed back a little in depth so its own edges draw cleanly on top, and
  // drawn from both sides (the scan's winding is not reliable from outside). It hides the lines behind walls.
  const surfaces = BLUEPRINT.surfaceColors.map(
    color => new MeshLambertMaterial({ color, side: DoubleSide, flatShading: true, polygonOffset: true, polygonOffsetFactor: 1, polygonOffsetUnits: 1 }),
  );
  const solid = new Mesh(new BufferGeometry(), surfaces);
  solid.frustumCulled = false;
  solid.visible = BLUEPRINT.defaultMode === 'solid';
  scene.add(solid);
  // Bright and soft: a white model, with just enough shading to tell walls, floor and ceiling apart.
  scene.add(new HemisphereLight('#ffffff', '#ece8e0', 3.4));
  const sun = new DirectionalLight('#ffffff', 0.7);
  sun.position.set(0.4, 1, 0.3);
  scene.add(sun);

  let renderer: WebGLRenderer | null = null; // created on first show: a hidden blueprint costs nothing
  let size = canvasSize({ width: canvas.clientWidth, height: canvas.clientHeight }, 1);
  let posed = false;
  let lastPose: Pose | null = null;
  const aspect = () => size.width / size.height;

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
    setMesh(mesh) {
      const old = solid.geometry;
      const geometry = new BufferGeometry();
      geometry.setAttribute('position', new BufferAttribute(mesh.positions, 3));
      const grouped = groupByMaterial(mesh.indices, mesh.materials);
      geometry.setIndex(new BufferAttribute(grouped.indices, 1));
      for (const g of grouped.groups) geometry.addGroup(g.start, g.count, g.materialIndex);
      solid.geometry = geometry;
      old.dispose();
      scheduler.request();
    },
    setMode(mode) {
      solid.visible = mode === 'solid';
      scheduler.request();
    },
    setPose(pose) {
      surfaces[2].visible = ceilingsVisible(pose.mode);
      applyPose(camera, pose, aspect());
      lastPose = pose;
      posed = true;
      scheduler.request();
    },
    setVisible(visible) {
      scheduler.setVisible(visible);
    },
    resize(box, pixelRatio) {
      size = canvasSize(box, pixelRatio);
      if (lastPose) applyPose(camera, lastPose, aspect()); // refit the lens now; the tour may send no new pose
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
      solid.geometry.dispose();
      for (const m of surfaces) m.dispose();
      renderer?.dispose();
      renderer = null;
    },
  };
}
