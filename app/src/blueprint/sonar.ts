// The sound, animated (see ui/DESIGN.md, "Sound"). One emission per cycle: each source sends out a wavefront, a pulse
// rides every traced route at the same speed, and each wall bounce flashes as the wave reaches it. Arrivals keep the
// true order (direct sound first, then reflections by path length), slowed down so the eye can follow it.
import {
  BufferAttribute,
  BufferGeometry,
  CanvasTexture,
  Color,
  Group,
  Points,
  PointsMaterial,
  Sprite,
  SpriteMaterial,
} from 'three';
import type { Vec3 } from '../sim/types';
import { pointAlong, type Route } from './paths';

export const SONAR = {
  /** Drawn speed of sound, m/s: about 1/57 of the real one, so a 10 m path takes 1.7 s. */
  speed: 6,
  /** A cycle lasts until the longest route has arrived, plus this rest, within the bounds below. */
  rest: 0.8,
  minPeriod: 2,
  maxPeriod: 5.5,
  /** The wavefront fades out by this radius (metres), like the 1/r drop of a real one. */
  waveRadius: 4.5,
  waveAlpha: 0.7,
  /** A bounce flash: how long it lasts (s) and how wide it grows (m). */
  pingLife: 0.6,
  pingSize: 0.9,
  pulseSize: 0.34,
};

export type RouteTiming = { bounces: number[] }; // distance from the source to each bounce, metres

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

export function cyclePeriod(routes: Route[], s = SONAR): number {
  const longest = routes.reduce((m, r) => Math.max(m, r.length), 0);
  return Math.min(s.maxPeriod, Math.max(s.minPeriod, longest / s.speed + s.rest));
}

/** 0..1 through a flash that starts when the wave reaches `distance`, or null when not flashing at time `t`. */
export function flashPhase(distance: number, t: number, s = SONAR): number | null {
  const dt = t - distance / s.speed;
  return dt >= 0 && dt < s.pingLife ? dt / s.pingLife : null;
}

let ringTexture: CanvasTexture | null = null;
/** A soft ring: clear inside, a glow rising to a thin bright edge. White, tinted per sprite. Null without a canvas. */
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

let dotTexture: CanvasTexture | null = null;
function dot(): CanvasTexture | null {
  if (dotTexture || typeof document === 'undefined') return dotTexture;
  const c = document.createElement('canvas');
  c.width = c.height = 64;
  const g = c.getContext('2d');
  if (!g) return null;
  const grad = g.createRadialGradient(32, 32, 0, 32, 32, 32);
  grad.addColorStop(0, 'rgba(255,255,255,1)');
  grad.addColorStop(0.25, 'rgba(255,255,255,0.95)');
  grad.addColorStop(0.5, 'rgba(255,255,255,0.35)');
  grad.addColorStop(1, 'rgba(255,255,255,0)');
  g.fillStyle = grad;
  g.fillRect(0, 0, 64, 64);
  dotTexture = new CanvasTexture(c);
  return dotTexture;
}

export type Sonar = {
  object: Group;
  set(routes: Route[], sources: Vec3[], colors: string[]): void;
  tick(seconds: number): void;
  dispose(): void;
};

export function createSonar(s = SONAR): Sonar {
  const object = new Group();
  const overlay = { transparent: true, depthTest: false, depthWrite: false } as const;
  const waves = new Group();
  const pings = new Group();
  object.add(waves, pings);

  const pulseMaterial = new PointsMaterial({ ...overlay, size: s.pulseSize, sizeAttenuation: true, vertexColors: true, map: dot() });
  const pulses = new Points(new BufferGeometry(), pulseMaterial);
  pulses.frustumCulled = false;
  pulses.renderOrder = 6;
  object.add(pulses);

  let routes: Route[] = [];
  let timings: RouteTiming[] = [];
  let sources: Vec3[] = [];
  let colors: Color[] = [];
  let period = s.minPeriod;
  const tint = new Color();

  const pool = (group: Group, n: number, order: number) => {
    while (group.children.length < n) {
      const sp = new Sprite(new SpriteMaterial({ ...overlay, map: ring() }));
      sp.frustumCulled = false;
      sp.renderOrder = order;
      group.add(sp);
    }
    group.children.forEach((c, i) => (c.visible = i < n));
  };

  return {
    object,
    set(next, nextSources, palette) {
      routes = next;
      sources = nextSources;
      colors = palette.map(c => new Color(c));
      timings = routes.map(r => ({ bounces: bounceDistances(r) }));
      period = cyclePeriod(routes, s);
      pool(waves, sources.length, 4);
      pool(pings, timings.reduce((n, t) => n + t.bounces.length, 0), 5);
      const geometry = new BufferGeometry();
      geometry.setAttribute('position', new BufferAttribute(new Float32Array(routes.length * 3), 3));
      geometry.setAttribute('color', new BufferAttribute(new Float32Array(routes.length * 4), 4));
      pulses.geometry.dispose();
      pulses.geometry = geometry;
    },
    tick(seconds) {
      const t = seconds % period;
      const colorOf = (i: number) => colors[i % Math.max(colors.length, 1)] ?? tint.set('#ffffff');

      sources.forEach((pos, i) => {
        const sp = waves.children[i] as Sprite;
        const r = t * s.speed;
        const fade = Math.max(0, 1 - r / s.waveRadius);
        sp.position.set(pos[0], pos[1], pos[2]);
        sp.scale.setScalar(Math.max(0.01, r * 2));
        sp.material.color.copy(colorOf(i));
        sp.material.opacity = s.waveAlpha * Math.pow(fade, 1.3) * Math.min(1, t * 6);
      });

      const pos = pulses.geometry.getAttribute('position') as BufferAttribute | undefined;
      const col = pulses.geometry.getAttribute('color') as BufferAttribute | undefined;
      let p = 0;
      routes.forEach((route, i) => {
        const d = t * s.speed;
        const c = colorOf(route.source);
        if (pos && col) {
          const inFlight = d <= route.length;
          const [x, y, z] = pointAlong(route.points, Math.min(d, route.length));
          (pos.array as Float32Array).set([x, y, z], i * 3);
          // Weaker routes are dimmer; every pulse fades over its last half metre so arrivals do not pop.
          const tail = Math.min(1, Math.max(0, (route.length - d) / 0.5));
          (col.array as Float32Array).set([c.r, c.g, c.b, inFlight ? route.strength * tail : 0], i * 4);
        }
        for (const b of timings[i].bounces) {
          const sp = pings.children[p++] as Sprite;
          const phase = flashPhase(b, t, s);
          sp.visible = phase !== null;
          if (phase === null) continue;
          const [x, y, z] = pointAlong(route.points, b);
          sp.position.set(x, y, z);
          sp.scale.setScalar(0.1 + phase * s.pingSize);
          sp.material.color.copy(c);
          sp.material.opacity = route.strength * (1 - phase) * 0.9;
        }
      });
      if (pos) pos.needsUpdate = true;
      if (col) col.needsUpdate = true;
    },
    dispose() {
      pulses.geometry.dispose();
      pulseMaterial.dispose();
      for (const c of [...waves.children, ...pings.children]) (c as Sprite).material.dispose();
    },
  };
}
