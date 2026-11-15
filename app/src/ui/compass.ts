// Geometry for the sound compass (see DESIGN.md, "Sound"): where each source and its echoes reach the listener from,
// as angles on a dial that turns with the view. Pure, so it is tested without a DOM.
import type { SourceResult, Vec3 } from '../sim/types';

/** Bearing in radians of a horizontal direction, clockwise from world −Z (the view at yaw 0). */
export function worldBearing(dx: number, dz: number): number {
  return Math.atan2(dx, -dz);
}

/** Bearing relative to the view: 0 straight ahead, +π/2 to the right. `yawDeg` is the pose's yaw. */
export function viewBearing(world: number, yawDeg: number): number {
  const b = world + (yawDeg * Math.PI) / 180;
  return Math.atan2(Math.sin(b), Math.cos(b));
}

const mean = (b: readonly number[]) => (b[0] + b[1] + b[2]) / 3;

/** Strength in dB (0 = nothing lost), never below `floor`. */
export function toDb(strength: number, floor = -60): number {
  return strength > 0 ? Math.max(floor, 10 * Math.log10(strength)) : floor;
}

/**
 * Echo energy around the listener, sampled at `samples` world bearings (0..1, loudest = 1). Each of the 12 slot
 * directions spreads its energy over nearby bearings; mostly vertical slots count less, as the dial is flat.
 */
export function echoRose(slots: SourceResult['slots'], directions: Vec3[], samples = 48): number[] {
  const out = new Array(samples).fill(0);
  slots.forEach((slot, k) => {
    const d = directions[k];
    if (!d) return;
    const flat = Math.hypot(d[0], d[2]);
    if (flat < 1e-6) return;
    const at = worldBearing(d[0], d[2]);
    const e = mean(slot.energy) * flat;
    for (let i = 0; i < samples; i++) {
      const a = (i / samples) * Math.PI * 2;
      const c = Math.cos(a - at);
      if (c > 0) out[i] += e * c ** 6;
    }
  });
  const max = Math.max(...out);
  return max > 0 ? out.map(v => v / max) : out;
}

/** A smooth closed SVG path through points at radii `r[i]` (bearings evenly spaced, clockwise from up). */
export function rosePath(r: number[], cx: number, cy: number): string {
  const n = r.length;
  const pts = r.map((v, i) => {
    const a = (i / n) * Math.PI * 2;
    return [cx + Math.sin(a) * v, cy - Math.cos(a) * v];
  });
  // Closed Catmull-Rom spline as cubic Béziers.
  let d = `M${pts[0][0].toFixed(1)},${pts[0][1].toFixed(1)}`;
  for (let i = 0; i < n; i++) {
    const p0 = pts[(i - 1 + n) % n], p1 = pts[i], p2 = pts[(i + 1) % n], p3 = pts[(i + 2) % n];
    const c1 = [p1[0] + (p2[0] - p0[0]) / 6, p1[1] + (p2[1] - p0[1]) / 6];
    const c2 = [p2[0] - (p3[0] - p1[0]) / 6, p2[1] - (p3[1] - p1[1]) / 6];
    d += `C${c1[0].toFixed(1)},${c1[1].toFixed(1)} ${c2[0].toFixed(1)},${c2[1].toFixed(1)} ${p2[0].toFixed(1)},${p2[1].toFixed(1)}`;
  }
  return d + 'Z';
}

export { mean as bandMean };
