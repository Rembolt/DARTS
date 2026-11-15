// Early reflections (mvp-design.md 5.3): rays from the listener, each bounce point connected to every source
// ("diffuse rain"), with the connecting leg allowed to cut through up to `maxLegWalls` walls.
import { crossSegment } from './crossings';
import { firstTracedHit } from './layers';
import { surfaceAt } from './library';
import type { SimState } from './load';
import { isDegenerate } from './normals';
import { fibonacciSphere, type Rng } from './sampling';
import type { Bands, Vec3 } from './types';

/** How far new ray and leg origins are pushed off a surface, along its facing, so they do not hit it again. */
export const SURFACE_OFFSET = 1e-3; // metres

/** Below this distance the `1/D²` reference is clamped, so a source at the listener does not blow up. */
export const MIN_REFERENCE_DISTANCE = 0.1; // metres

/** One bounce point's share of a source's sound, as heard at the listener. */
export type Contribution = {
  source: number; // index into the sources passed in
  energy: Bands; // against the source's unobstructed direct sound (1/D²)
  arrival: number; // seconds after the sound left the source
  direction: Vec3; // arrival direction: the ray's first direction as it left the listener (unit)
  ray: number; // which ray, to rebuild the drawn path
  bounce: number; // which hit along that ray (0 = first hit)
};

export type EarlyResult = {
  rays: number;
  bounces: number;
  contributions: Contribution[];
  /** Hit points per ray: ray r, hit b at `hitPoints[(r * bounces + b) * 3 ..]`. Only the first `hitCount[r]` are set. */
  hitPoints: Float32Array;
  hitCount: Uint8Array;
  /** Mid-band strength left in the ray after each hit (1 = untouched, 0 = fully absorbed), same layout as `hitPoints` / 3. */
  hitStrength: Float32Array;
  /** Average length of the ray segments that ended on a surface, metres (0 when nothing was hit). */
  meanFreePath: number;
  /** Average `absorption + furnishing` (each clamped to 0.99) per band over all hits (0 when nothing was hit). */
  averageAbsorption: Bands;
};

export type SourceInput = { position: Vec3 };

/**
 * Trace `raysPerTrace` rays from the listener, spread evenly over the sphere (Fibonacci sphere), up to `bounces`
 * hits each. The random choices (diffuse or mirror bounce, diffuse direction) come from `rng`, so a fixed seed gives
 * a fixed result. The choices the design leaves open are listed on `traceRays`.
 */
export function traceEarly(state: SimState, listener: Vec3, sources: SourceInput[], rng: Rng): EarlyResult {
  const { config } = state;
  const rays = config.raysPerTrace;
  const bounces = config.bounces;
  const hitPoints = new Float32Array(rays * bounces * 3);
  const hitCount = new Uint8Array(rays);
  const hitStrength = new Float32Array(rays * bounces);
  const contributions: Contribution[] = [];
  const stats = traceRays(state, listener, sources, rng, {
    rays,
    bounces,
    maxLegWalls: config.maxLegWalls,
    minStrength: 0,
    onHit(r, b, x, y, z, left) {
      const at = (r * bounces + b) * 3;
      hitPoints[at] = x; hitPoints[at + 1] = y; hitPoints[at + 2] = z;
      hitCount[r] = b + 1;
      hitStrength[r * bounces + b] = left;
    },
    onContribution(source, e0, e1, e2, arrival, r, b, first) {
      contributions.push({ source, energy: [e0, e1, e2], arrival, direction: first, ray: r, bounce: b });
    },
  });
  return { rays, bounces, contributions, hitPoints, hitCount, hitStrength, ...stats };
}

export type RayTraceOptions = {
  rays: number;
  bounces: number;
  /** Walls a connecting leg may cut through (0: the leg must be clear). */
  maxLegWalls: number;
  /** A ray stops once its strength is at or below this in every band (0: only when it is fully absorbed). */
  minStrength: number;
  /** Every hit point, in order along each ray, with the mid-band strength the ray has left after this wall took its share. */
  onHit?: (ray: number, bounce: number, x: number, y: number, z: number, strengthLeft: number) => void;
  /** Every contribution: energy per band against the source's unobstructed direct sound (1/D²), arrival in seconds. */
  onContribution: (
    source: number, e0: number, e1: number, e2: number, arrival: number, ray: number, bounce: number, first: Vec3,
  ) => void;
};

/**
 * The shared tracer behind the early reflections (5.3) and the reverb job (5.5): rays from the listener, evenly over
 * the sphere, each hit connected to every source.
 *
 * Choices the design leaves open:
 * - The surface's facing at a hit is its normal turned towards the side the ray came from (rays hit both sides).
 *   Zero-area triangles use the reverse of the ray direction.
 * - A source behind the hit surface (leg cosine ≤ 0) gets no contribution from that hit: the formula's cosine
 *   would be negative.
 * - `absorption + furnishing` is clamped to 0.99 per band (`effectiveAbsorption`), so no surface absorbs everything.
 */
export function traceRays(
  state: SimState,
  listener: Vec3,
  sources: SourceInput[],
  rng: Rng,
  opts: RayTraceOptions,
): Pick<EarlyResult, 'meanFreePath' | 'averageAbsorption'> {
  const { config, normals } = state;
  const mainTriangles = state.mesh.indices.length / 3;
  const { rays, bounces, maxLegWalls, minStrength, onHit, onContribution } = opts;
  const c = config.speedOfSound;
  const reference = sources.map(s => {
    const p = s.position;
    const d = Math.max(MIN_REFERENCE_DISTANCE, Math.hypot(p[0] - listener[0], p[1] - listener[1], p[2] - listener[2]));
    return d * d;
  });
  const perRay = 4 / rays;

  let segmentSum = 0, segments = 0;
  const absorptionSum: Bands = [0, 0, 0];
  const origin: Vec3 = [0, 0, 0];
  const dir: Vec3 = [0, 0, 0];
  const n: Vec3 = [0, 0, 0];
  const legStart: Vec3 = [0, 0, 0];

  const firstDirections = fibonacciSphere(rays);
  for (let r = 0; r < rays; r++) {
    const first = firstDirections[r];
    origin[0] = listener[0]; origin[1] = listener[1]; origin[2] = listener[2];
    dir[0] = first[0]; dir[1] = first[1]; dir[2] = first[2];
    const strength: Bands = [1, 1, 1];
    let travelled = 0;

    for (let b = 0; b < bounces; b++) {
      const hit = firstTracedHit(state, origin, dir);
      if (!hit) break; // the ray left the building
      travelled += hit.distance;
      segmentSum += hit.distance;
      segments++;
      const px = origin[0] + dir[0] * hit.distance;
      const py = origin[1] + dir[1] * hit.distance;
      const pz = origin[2] + dir[2] * hit.distance;
      const t = hit.triangle;
      // Panel triangles (closed doors and windows) are numbered after the main mesh's.
      const onMesh = t < mainTriangles;
      const nb = onMesh ? normals : state.panels!.normals;
      const ti = onMesh ? t : t - mainTriangles;
      if (isDegenerate(nb, ti)) {
        n[0] = -dir[0]; n[1] = -dir[1]; n[2] = -dir[2];
      } else {
        n[0] = nb[3 * ti]; n[1] = nb[3 * ti + 1]; n[2] = nb[3 * ti + 2];
        if (n[0] * dir[0] + n[1] * dir[1] + n[2] * dir[2] > 0) { n[0] = -n[0]; n[1] = -n[1]; n[2] = -n[2]; }
      }
      const surface = surfaceAt(state, t);
      const a = surface.absorption;
      for (let k = 0; k < 3; k++) {
        absorptionSum[k] += a[k];
        strength[k] *= Math.max(0, 1 - a[k]);
      }
      onHit?.(r, b, px, py, pz, strength[1]);
      if (strength[0] <= minStrength && strength[1] <= minStrength && strength[2] <= minStrength) break;

      legStart[0] = px + n[0] * SURFACE_OFFSET;
      legStart[1] = py + n[1] * SURFACE_OFFSET;
      legStart[2] = pz + n[2] * SURFACE_OFFSET;

      // Connect this hit to every source.
      for (let s = 0; s < sources.length; s++) {
        const sp = sources[s].position;
        const lx = sp[0] - legStart[0], ly = sp[1] - legStart[1], lz = sp[2] - legStart[2];
        const leg = Math.hypot(lx, ly, lz);
        if (leg === 0) continue;
        const cos = (lx * n[0] + ly * n[1] + lz * n[2]) / leg;
        if (cos <= 0) continue;
        const cross = crossSegment(state, legStart, sp, maxLegWalls);
        if (!cross) continue;
        const scale = (perRay * cos * reference[s]) / (leg * leg);
        onContribution(
          s,
          scale * strength[0] * cross.transmission[0],
          scale * strength[1] * cross.transmission[1],
          scale * strength[2] * cross.transmission[2],
          (travelled + leg) / c,
          r,
          b,
          first,
        );
      }

      // Bounce: diffuse (cosine-weighted around the facing) or mirror.
      if (rng() < surface.scattering) {
        cosineHemisphere(n, rng, dir);
      } else {
        const d2 = 2 * (dir[0] * n[0] + dir[1] * n[1] + dir[2] * n[2]);
        dir[0] -= d2 * n[0]; dir[1] -= d2 * n[1]; dir[2] -= d2 * n[2];
      }
      origin[0] = legStart[0]; origin[1] = legStart[1]; origin[2] = legStart[2];
    }
  }

  const averageAbsorption: Bands = [0, 0, 0];
  if (segments > 0) {
    for (let k = 0; k < 3; k++) averageAbsorption[k] = Math.min(0.999, Math.max(0, absorptionSum[k] / segments));
  }
  return { meanFreePath: segments > 0 ? segmentSum / segments : 0, averageAbsorption };
}

/** A random unit vector in the hemisphere around unit `n`, denser towards `n` (cosine-weighted). Writes into `out`. */
export function cosineHemisphere(n: Vec3, rng: Rng, out: Vec3): Vec3 {
  const u1 = rng(), u2 = rng();
  const radius = Math.sqrt(u1), phi = 2 * Math.PI * u2;
  const x = radius * Math.cos(phi), y = radius * Math.sin(phi), z = Math.sqrt(Math.max(0, 1 - u1));
  // An orthonormal basis (t, b, n) around n (Duff et al. 2017).
  const sign = n[2] >= 0 ? 1 : -1;
  const a = -1 / (sign + n[2]);
  const bb = n[0] * n[1] * a;
  const tx = 1 + sign * n[0] * n[0] * a, ty = sign * bb, tz = -sign * n[0];
  const bx = bb, by = sign + n[1] * n[1] * a, bz = -n[1];
  out[0] = x * tx + y * bx + z * n[0];
  out[1] = x * ty + y * by + z * n[1];
  out[2] = x * tz + y * bz + z * n[2];
  return out;
}
