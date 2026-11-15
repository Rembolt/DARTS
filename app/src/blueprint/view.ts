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
  MeshBasicMaterial,
  MeshLambertMaterial,
  PerspectiveCamera,
  Scene,
  WebGLRenderer,
} from 'three';
import { BLUEPRINT } from '../config';
import type { Pose } from '../viewer';
import { heatColor, type FloorGrid } from '../ui/heat';
import { applyPose } from './camera';
import { ceilingsVisible, type BlueprintMode } from './mode';
import { groupByMaterial } from './solid';
import { createPathsLayer, type TraceOverlay } from './paths';
import { canvasSize, createScheduler } from './schedule';

export type Blueprint = {
  setLines(lines: Float32Array): void;
  /** The triangles and their material ids (wall 0, floor 1, ceiling 2) for solid mode. */
  setMesh(mesh: { positions: Float32Array; indices: Uint32Array; materials: Uint8Array }): void;
  setMode(mode: BlueprintMode): void;
  /** Solid-mode colours for wall, floor and ceiling (the chosen materials). */
  setSurfaceColors(colors: readonly string[]): void;
  /** The floor painted by loudness (street noise): grid cells and their level in dB, or null to clear. */
  setHeat(heat: { grid: FloorGrid; db: Float32Array } | null): void;
  setPose(pose: Pose): void;
  /** Draws the sources, direct lines and traced paths of one trace (build step 8); `null` clears them. */
  setTrace(trace: TraceOverlay | null): void;
  /** Walls between the listener and each source, for the line's steps. */
  setWalls(walls: ({ distance: number; lossDb: number }[] | undefined)[]): void;
  setEchoes(on: boolean): void;
  /** Doors and windows in the wall: an outline each, filled in when closed and hollow when open. */
  setOpenings(items: { id: string; kind: 'door' | 'window'; corners: readonly (readonly [number, number, number])[]; open: boolean }[]): void;
  /**
   * Cut holes where the scan filled a door or window (its glass, a closed leaf): triangles and edges inside are not
   * drawn, so the drawing shows the same openings the sound goes through. `inside` null: draw everything.
   */
  setHoles(inside: ((p: ArrayLike<number>) => boolean) | null): void;
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
  if (import.meta.env.DEV) (globalThis as unknown as { __scene: unknown }).__scene = { scene, camera, paths };

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

  // The floor painted by how loud the street is: one quad per cell, vertex colours, a little above the scanned floor.
  const heatMaterial = new MeshBasicMaterial({ vertexColors: true, transparent: true, opacity: 0.62, depthWrite: false, side: DoubleSide, polygonOffset: true, polygonOffsetFactor: -1, polygonOffsetUnits: -1 });
  const heatMesh = new Mesh(new BufferGeometry(), heatMaterial);
  heatMesh.frustumCulled = false;
  heatMesh.visible = false;
  scene.add(heatMesh);

  // Openings: filled panels for the closed ones (door brown, window glass blue) and an outline for all, pulled toward the camera so
  // they sit on the wall instead of z-fighting with it.
  const fillMaterial = new MeshBasicMaterial({ vertexColors: true, transparent: true, opacity: 0.88, depthWrite: false, side: DoubleSide, polygonOffset: true, polygonOffsetFactor: -3, polygonOffsetUnits: -3 });
  const fillMesh = new Mesh(new BufferGeometry(), fillMaterial);
  fillMesh.frustumCulled = false;
  fillMesh.renderOrder = 2;
  scene.add(fillMesh);
  const outlineMaterial = new LineBasicMaterial({ vertexColors: true, depthWrite: false });
  const outline = new LineSegments(new BufferGeometry(), outlineMaterial);
  outline.frustumCulled = false;
  outline.renderOrder = 3;
  scene.add(outline);

  let renderer: WebGLRenderer | null = null; // created on first show: a hidden blueprint costs nothing
  let size = canvasSize({ width: canvas.clientWidth, height: canvas.clientHeight }, 1);
  paths.setPixelRatio(size.pixelRatio);
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

  // The sonar rings and pulses move on their own: a frame loop that runs only while the blueprint is shown and
  // there is a trace to animate, and holds still for people who asked for less motion.
  let shown = false;
  let looping = false;
  const calm = typeof matchMedia === 'function' && matchMedia('(prefers-reduced-motion: reduce)').matches;
  const startAnimation = () => {
    if (looping || calm) return;
    looping = true;
    const step = (now: number) => {
      if (!shown || !paths.animated) {
        looping = false;
        return;
      }
      paths.tick(now / 1000);
      scheduler.request();
      requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  };
  const scheduler = createScheduler(() => {
    const r = ensureRenderer();
    if (!posed) {
      r.clear();
      return;
    }
    r.render(scene, camera);
  });

  let allLines: Float32Array | null = null;
  let allMesh: { positions: Float32Array; indices: Uint32Array; materials: Uint8Array } | null = null;
  let holes: ((p: ArrayLike<number>) => boolean) | null = null;
  const mid: number[] = [0, 0, 0];

  function drawLines(): void {
    if (!allLines) return;
    let data = allLines;
    if (holes) {
      const keep: number[] = [];
      for (let i = 0; i < allLines.length; i += 6) {
        for (let k = 0; k < 3; k++) mid[k] = (allLines[i + k] + allLines[i + 3 + k]) / 2;
        if (!holes(mid)) for (let k = 0; k < 6; k++) keep.push(allLines[i + k]);
      }
      data = new Float32Array(keep);
    }
    const old = lines.geometry;
    const geometry = new BufferGeometry();
    geometry.setAttribute('position', new BufferAttribute(data, 3));
    lines.geometry = geometry;
    old.dispose();
    scheduler.request();
  }

  function drawMesh(): void {
    if (!allMesh) return;
    const mesh = allMesh;
    let indices = mesh.indices;
    let materials = mesh.materials;
    if (holes) {
      const p = mesh.positions;
      const keepIdx: number[] = [];
      const keepMat: number[] = [];
      for (let t = 0; t < materials.length; t++) {
        const a = mesh.indices[3 * t] * 3, b = mesh.indices[3 * t + 1] * 3, c = mesh.indices[3 * t + 2] * 3;
        for (let k = 0; k < 3; k++) mid[k] = (p[a + k] + p[b + k] + p[c + k]) / 3;
        if (holes(mid)) continue;
        keepIdx.push(mesh.indices[3 * t], mesh.indices[3 * t + 1], mesh.indices[3 * t + 2]);
        keepMat.push(materials[t]);
      }
      indices = new Uint32Array(keepIdx);
      materials = new Uint8Array(keepMat);
    }
    const old = solid.geometry;
    const geometry = new BufferGeometry();
    geometry.setAttribute('position', new BufferAttribute(mesh.positions, 3));
    const grouped = groupByMaterial(indices, materials);
    geometry.setIndex(new BufferAttribute(grouped.indices, 1));
    for (const g of grouped.groups) geometry.addGroup(g.start, g.count, g.materialIndex);
    solid.geometry = geometry;
    old.dispose();
    scheduler.request();
  }

  return {
    setLines(data) {
      allLines = data;
      drawLines();
    },
    setHoles(inside) {
      holes = inside;
      drawLines();
      drawMesh();
    },
    setMesh(mesh) {
      allMesh = mesh;
      drawMesh();
    },
    setHeat(heat) {
      const old = heatMesh.geometry;
      if (!heat) {
        heatMesh.visible = false;
        scheduler.request();
        return;
      }
      const { grid, db } = heat;
      const n = grid.cells.length;
      const pos = new Float32Array(n * 12);
      const col = new Float32Array(n * 12);
      const idx = new Uint32Array(n * 6);
      const y = grid.floorY + 0.04;
      grid.cells.forEach((cell, i) => {
        const x0 = grid.x0 + (cell % grid.w) * grid.step, z0 = grid.z0 + Math.floor(cell / grid.w) * grid.step;
        const x1 = x0 + grid.step, z1 = z0 + grid.step;
        pos.set([x0, y, z0, x1, y, z0, x1, y, z1, x0, y, z1], i * 12);
        const [r, g, b] = heatColor(db[i]);
        for (let k = 0; k < 4; k++) col.set([r / 255, g / 255, b / 255], i * 12 + k * 3);
        idx.set([i * 4, i * 4 + 1, i * 4 + 2, i * 4, i * 4 + 2, i * 4 + 3], i * 6);
      });
      const geometry = new BufferGeometry();
      geometry.setAttribute('position', new BufferAttribute(pos, 3));
      geometry.setAttribute('color', new BufferAttribute(col, 3));
      geometry.setIndex(new BufferAttribute(idx, 1));
      heatMesh.geometry = geometry;
      old.dispose();
      heatMesh.visible = true;
      scheduler.request();
    },
    setOpenings(items) {
      const DOOR = [0.55, 0.36, 0.2];
      const GLASS = [0.45, 0.68, 0.85];
      const OPEN = [0.82, 0.27, 0.16]; // the sound's vermilion: an open gap is where sound gets through
      const closed = items.filter(i => !i.open && i.corners.length === 4);
      const fp = new Float32Array(closed.length * 12);
      const fc = new Float32Array(closed.length * 12);
      const fi = new Uint32Array(closed.length * 6);
      closed.forEach((it, n) => {
        const col = it.kind === 'door' ? DOOR : GLASS;
        it.corners.forEach((c, k) => {
          fp.set(c, n * 12 + k * 3);
          fc.set(col, n * 12 + k * 3);
        });
        fi.set([n * 4, n * 4 + 1, n * 4 + 2, n * 4, n * 4 + 2, n * 4 + 3], n * 6);
      });
      const valid = items.filter(i => i.corners.length === 4);
      const lp = new Float32Array(valid.length * 24);
      const lc = new Float32Array(valid.length * 24);
      valid.forEach((it, n) => {
        const col = it.open ? OPEN : it.kind === 'door' ? [0.3, 0.18, 0.08] : [0.2, 0.4, 0.6];
        for (let k = 0; k < 4; k++) {
          const a = it.corners[k], b = it.corners[(k + 1) % 4];
          const at = n * 24 + k * 6;
          lp.set([a[0], a[1], a[2], b[0], b[1], b[2]], at);
          lc.set([...col, ...col], at);
        }
      });
      const oldFill = fillMesh.geometry, oldOutline = outline.geometry;
      const fg = new BufferGeometry();
      fg.setAttribute('position', new BufferAttribute(fp, 3));
      fg.setAttribute('color', new BufferAttribute(fc, 3));
      fg.setIndex(new BufferAttribute(fi, 1));
      fillMesh.geometry = fg;
      const og = new BufferGeometry();
      og.setAttribute('position', new BufferAttribute(lp, 3));
      og.setAttribute('color', new BufferAttribute(lc, 3));
      outline.geometry = og;
      oldFill.dispose();
      oldOutline.dispose();
      scheduler.request();
    },
    setSurfaceColors(colors) {
      colors.forEach((c, i) => surfaces[i]?.color.set(c));
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
    setTrace(trace) {
      paths.set(trace);
      paths.tick(calm ? 1 : performance.now() / 1000);
      if (shown) startAnimation();
      scheduler.request();
    },
    setWalls(walls) {
      paths.setWalls(walls);
      scheduler.request();
    },
    setEchoes(on) {
      paths.setEchoes(on);
      scheduler.request();
    },
    setVisible(visible) {
      scheduler.setVisible(visible);
      shown = visible;
      if (visible) startAnimation();
    },
    resize(box, pixelRatio) {
      size = canvasSize(box, pixelRatio);
      if (lastPose) applyPose(camera, lastPose, aspect()); // refit the lens now; the tour may send no new pose
      paths.setPixelRatio(size.pixelRatio);
      paths.setSize(size.width, size.height);
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
      heatMesh.geometry.dispose();
      heatMaterial.dispose();
      fillMesh.geometry.dispose();
      fillMaterial.dispose();
      outline.geometry.dispose();
      outlineMaterial.dispose();
      for (const m of surfaces) m.dispose();
      paths.dispose();
      renderer?.dispose();
      renderer = null;
    },
  };
}
