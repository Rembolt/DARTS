// The sound, drawn so it explains itself (see ui/DESIGN.md, "Sound"):
//  - One line per source, from the source to you. Dashes flow along it, so the direction is plain.
//  - The line is thick where the sound is loud and steps thinner after every wall it passes through; the wall wears a
//    badge with what it costs (the badges are DOM, in ui/WallBadges.tsx). Where it ends up is how loud you hear it.
//  - Optional: the strongest echoes as thin dotted lines that touch the walls they bounce from, with a ring at each.
//  - A soft ring spreads over the floor from each source, so you can see where it is.
import { CanvasTexture, Color, Group, Sprite, SpriteMaterial } from 'three';
import { Line2 } from 'three/examples/jsm/lines/Line2.js';
import { LineGeometry } from 'three/examples/jsm/lines/LineGeometry.js';
import { LineMaterial } from 'three/examples/jsm/lines/LineMaterial.js';
import type { Vec3 } from '../sim/types';
import { pointAlong, type Route } from './paths';

export const SONAR = {
  /** Drawn speed of the flow, m/s. */
  speed: 5,
  /** Dash and gap length, metres. */
  dash: 0.5,
  gap: 0.32,
  /** Line width in pixels at full strength and when nothing is left. */
  maxWidth: 9,
  minWidth: 2.2,
  /** Echoes: how many per source, their pixel width, and the flash at each bounce. */
  echoBeams: 3,
  mergeDegrees: 42,
  echoWidth: 1.6,
  pingLife: 0.9,
  pingSize: 0.7,
  /** The ring on the floor around each source. */
  ringPeriod: 3.2,
  ringRadius: 3.5,
  ringAlpha: 0.32,
};

export type Wall = { /** metres from the listener */ distance: number; /** dB lost crossing it (mid band) */ lossDb: number };

/** One drawn piece of a source's line: from `from` to `to` metres along it, `lossDb` already lost before it. */
export type Section = { from: number; to: number; lossDb: number };

/**
 * Cut a source→listener line of `length` metres into pieces at its walls. `walls` are measured from the listener (as
 * the simulation reports them), so they are turned around here. Without walls the whole line is one piece that has
 * lost `fallbackLossDb`.
 */
export function sectionsOf(length: number, walls: Wall[] | undefined, fallbackLossDb: number): Section[] {
  if (!walls) return [{ from: 0, to: length, lossDb: fallbackLossDb }];
  const cuts = walls
    .map(w => ({ at: Math.min(length, Math.max(0, length - w.distance)), loss: w.lossDb }))
    .sort((a, b) => a.at - b.at);
  const out: Section[] = [];
  let from = 0, lost = 0;
  for (const c of cuts) {
    if (c.at - from > 0.02) out.push({ from, to: c.at, lossDb: lost });
    from = Math.max(from, c.at);
    lost += c.loss;
  }
  out.push({ from, to: length, lossDb: lost });
  return out;
}

/** Pixel width for a piece that has lost `lossDb`: loud is thick, 60 dB down is thin. */
export function widthFor(lossDb: number, s = SONAR): number {
  const t = Math.min(1, Math.max(0, 1 - lossDb / 60));
  return s.minWidth + (s.maxWidth - s.minWidth) * Math.pow(t, 1.5);
}

export type Beam = Route & { count: number };

const dot = (a: number[], b: number[]) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2];

/** Unit direction a route arrives from at the listener, pointing from the listener back along the route. */
export function arrival(route: Route): number[] {
  const p = route.points;
  const n = p.length / 3;
  const d = [p[(n - 2) * 3] - p[(n - 1) * 3], p[(n - 2) * 3 + 1] - p[(n - 1) * 3 + 1], p[(n - 2) * 3 + 2] - p[(n - 1) * 3 + 2]];
  const len = Math.hypot(d[0], d[1], d[2]) || 1;
  return [d[0] / len, d[1] / len, d[2] / len];
}

/**
 * Echo routes grouped by the direction they reach the listener from, strongest first, at most `echoBeams` per source;
 * each group is shown as its strongest route. Direct routes are not included.
 */
export function groupEchoes(routes: Route[], s = SONAR): Beam[] {
  const out: Beam[] = [];
  const cos = Math.cos((s.mergeDegrees * Math.PI) / 180);
  for (const src of [...new Set(routes.map(r => r.source))].sort((a, b) => a - b)) {
    const echoes = routes.filter(r => !r.direct && r.source === src).sort((a, b) => b.strength - a.strength);
    const clusters: { rep: Route; dir: number[]; count: number }[] = [];
    for (const r of echoes) {
      const dir = arrival(r);
      const near = clusters.find(c => dot(c.dir, dir) >= cos);
      if (near) near.count++;
      else if (clusters.length < s.echoBeams) clusters.push({ rep: r, dir, count: 1 });
      else {
        let best = clusters[0];
        for (const c of clusters) if (dot(c.dir, dir) > dot(best.dir, dir)) best = c;
        best.count++;
      }
    }
    for (const c of clusters) out.push({ ...c.rep, count: c.count });
  }
  return out;
}

/** Distances along a route to its inner corners: the wall bounces, not the source or the listener end. */
export function bounceDistances(route: Route): number[] {
  const p = route.points;
  const n = p.length / 3;
  const out: number[] = [];
  let d = 0;
  for (let i = 1; i < n; i++) {
    d += Math.hypot(p[i * 3] - p[i * 3 - 3], p[i * 3 + 1] - p[i * 3 - 2], p[i * 3 + 2] - p[i * 3 - 1]);
    if (i < n - 1) out.push(d);
  }
  return out;
}

/** 0..1 through a flash that starts when the wave reaches `distance`, or null when not flashing at time `t`. */
export function flashPhase(distance: number, t: number, period: number, s = SONAR): number | null {
  const dt = (t % period) - distance / s.speed;
  return dt >= 0 && dt < s.pingLife ? dt / s.pingLife : null;
}

let ringTexture: CanvasTexture | null = null;
function ring(): CanvasTexture | null {
  if (ringTexture || typeof document === 'undefined') return ringTexture;
  const c = document.createElement('canvas');
  c.width = c.height = 256;
  const g = c.getContext('2d');
  if (!g) return null;
  const grad = g.createRadialGradient(128, 128, 0, 128, 128, 128);
  grad.addColorStop(0, 'rgba(255,255,255,0)');
  grad.addColorStop(0.6, 'rgba(255,255,255,0.03)');
  grad.addColorStop(0.9, 'rgba(255,255,255,0.28)');
  grad.addColorStop(0.955, 'rgba(255,255,255,1)');
  grad.addColorStop(0.985, 'rgba(255,255,255,0.12)');
  grad.addColorStop(1, 'rgba(255,255,255,0)');
  g.fillStyle = grad;
  g.fillRect(0, 0, 256, 256);
  ringTexture = new CanvasTexture(c);
  return ringTexture;
}

export type Sonar = {
  object: Group;
  set(routes: Route[], sources: Vec3[], colors: string[], directStrength?: number[]): void;
  /** Walls between the listener and each source (index = source), or undefined while unknown. */
  setWalls(walls: (Wall[] | undefined)[]): void;
  setEchoes(on: boolean): void;
  tick(seconds: number): void;
  setSize(width: number, height: number, pixelRatio: number): void;
  dispose(): void;
};

export function createSonar(s = SONAR): Sonar {
  const object = new Group();
  const overlay = { transparent: true, depthTest: false, depthWrite: false } as const;
  const rings = new Group();
  const flow = new Group();
  const echoes = new Group();
  const pings = new Group();
  object.add(rings, echoes, flow, pings);

  let routes: Route[] = [];
  let sources: Vec3[] = [];
  let colors: Color[] = [];
  let strengths: number[] = [];
  let walls: (Wall[] | undefined)[] = [];
  let showEchoes = false;
  let echoBeams: Beam[] = [];
  let bounces: number[][] = [];
  let size = { w: 1, h: 1, ratio: 1 };
  let pieces: { line: Line2; section: Section; source: number }[] = [];
  let echoPeriod = 3;
  const tint = new Color('#000');
  const colorOf = (i: number) => colors[i % Math.max(colors.length, 1)] ?? tint;

  const lineAt = (group: Group, i: number, dashed: boolean): Line2 => {
    while (group.children.length <= i) {
      const m = new LineMaterial({ ...overlay, worldUnits: false, linewidth: 2, dashed, dashSize: s.dash, gapSize: s.gap });
      m.resolution.set(size.w * size.ratio, size.h * size.ratio);
      const l = new Line2(new LineGeometry(), m);
      l.frustumCulled = false;
      l.renderOrder = 6;
      group.add(l);
    }
    return group.children[i] as Line2;
  };

  const poolSprites = (group: Group, n: number, order: number) => {
    while (group.children.length < n) {
      const sp = new Sprite(new SpriteMaterial({ ...overlay, map: ring() }));
      sp.frustumCulled = false;
      sp.renderOrder = order;
      group.add(sp);
    }
    group.children.forEach((c, i) => (c.visible = i < n));
  };

  const build = () => {
    // The direct line of every source, in pieces.
    pieces = [];
    let n = 0;
    for (const route of routes.filter(r => r.direct)) {
      const fallback = -10 * Math.log10(Math.max(0.0005, strengths[route.source] ?? 1));
      for (const section of sectionsOf(route.length, walls[route.source], fallback)) {
        const line = lineAt(flow, n++, true);
        const a = pointAlong(route.points, section.from);
        const b = pointAlong(route.points, section.to);
        line.geometry.setPositions([...a, ...b]);
        line.computeLineDistances();
        // Dashes line up across pieces, so the flow looks like one line that thins.
        (line.material as LineMaterial & { userData: { start: number } }).userData.start = section.from;
        pieces.push({ line, section, source: route.source });
      }
    }
    flow.children.forEach((c, i) => (c.visible = i < n));

    // Echoes: thin dotted lines, only when asked for.
    echoBeams = showEchoes ? groupEchoes(routes, s) : [];
    echoBeams.forEach((beam, i) => {
      const line = lineAt(echoes, i, true);
      line.geometry.setPositions(Array.from(beam.points));
      line.computeLineDistances();
    });
    echoes.children.forEach((c, i) => (c.visible = i < echoBeams.length));
    bounces = echoBeams.map(bounceDistances);
    const longest = echoBeams.reduce((m, b) => Math.max(m, b.length), 0);
    echoPeriod = Math.min(6, Math.max(2.4, longest / s.speed + 1));
    poolSprites(pings, bounces.reduce((k, b) => k + b.length, 0), 5);
    poolSprites(rings, sources.length * 2, 4);
  };

  return {
    object,
    set(nextRoutes, nextSources, palette, directStrength = []) {
      routes = nextRoutes;
      sources = nextSources;
      colors = palette.map(c => new Color(c));
      strengths = directStrength;
      build();
    },
    setWalls(next) {
      walls = next;
      build();
    },
    setEchoes(on) {
      if (on === showEchoes) return;
      showEchoes = on;
      build();
    },
    setSize(w, h, ratio) {
      size = { w, h, ratio };
      for (const g of [flow, echoes]) for (const l of g.children) (l as Line2).material.resolution.set(w * ratio, h * ratio);
    },
    tick(seconds) {
      // Flow: dashes slide from the source toward you. One shared offset, measured along each source's whole line.
      const slide = seconds * s.speed;
      for (const p of pieces) {
        const m = p.line.material;
        const start = (m.userData as { start: number }).start;
        m.dashOffset = -(slide) + start; // pattern coordinate = distance along this piece + start, so pieces line up
        m.linewidth = widthFor(p.section.lossDb, s) * size.ratio;
        m.color.copy(colorOf(p.source));
        m.opacity = 0.55 + 0.4 * Math.max(0, 1 - p.section.lossDb / 60);
      }
      echoBeams.forEach((beam, i) => {
        const m = (echoes.children[i] as Line2).material;
        m.dashOffset = -slide;
        m.linewidth = s.echoWidth * size.ratio;
        m.color.copy(colorOf(beam.source));
        m.opacity = 0.3 + 0.45 * beam.strength;
      });
      let k = 0;
      echoBeams.forEach((beam, i) => {
        for (const b of bounces[i]) {
          const sp = pings.children[k++] as Sprite;
          const phase = flashPhase(b, seconds, echoPeriod, s);
          sp.visible = phase !== null;
          if (phase === null) continue;
          const [x, y, z] = pointAlong(beam.points, b);
          sp.position.set(x, y, z);
          sp.scale.setScalar(0.1 + phase * s.pingSize);
          sp.material.color.copy(colorOf(beam.source));
          sp.material.opacity = (0.35 + 0.55 * beam.strength) * (1 - phase);
        }
      });
      // The rings on the floor around each source.
      sources.forEach((pos, i) => {
        for (let j = 0; j < 2; j++) {
          const sp = rings.children[i * 2 + j] as Sprite | undefined;
          if (!sp) continue;
          const phase = (seconds / s.ringPeriod + j / 2 + i * 0.3) % 1;
          sp.position.set(pos[0], pos[1] - 0.25, pos[2]);
          sp.scale.setScalar(Math.max(0.01, phase * s.ringRadius * 2));
          sp.material.color.copy(colorOf(i));
          sp.material.opacity = s.ringAlpha * Math.pow(1 - phase, 1.4) * Math.min(1, phase * 8);
        }
      });
    },
    dispose() {
      for (const g of [flow, echoes]) for (const c of g.children) {
        (c as Line2).geometry.dispose();
        (c as Line2).material.dispose();
      }
      for (const c of [...rings.children, ...pings.children]) (c as Sprite).material.dispose();
    },
  };
}
