// Default source positions from the tour's start position (mvp-design.md 4.3). SDK coordinates: Y-up, metres.
import type { Vec3 } from '../sim/types';
import { SOURCES } from '../config';

export type SourceId = 'indoor' | 'outdoor';

/**
 * Indoor: `SOURCES.indoor.position` if set, else the start position moved by `startHeightOffset` in y.
 *
 * Outdoor: `distance` metres from the start, horizontally, at `height` above the start's y.
 * Compass convention: 0° points along −Z (the direction the tour looks at yaw 0), and the angle grows clockwise
 * seen from above, so 90° points along +X, 180° along +Z, 270° along −X. Direction = (sin a, 0, −cos a).
 * This is not true north: the model's −Z has no known geographic heading. Pick the angle by ear (open question Q1).
 */
export function defaultSourcePositions(start: Vec3): Record<SourceId, Vec3> {
  const { indoor, outdoor } = SOURCES;
  const a = (outdoor.compassAngleDeg * Math.PI) / 180;
  return {
    indoor: indoor.position ? [...indoor.position] : [start[0], start[1] + indoor.startHeightOffset, start[2]],
    outdoor: [start[0] + outdoor.distance * Math.sin(a), start[1] + outdoor.height, start[2] - outdoor.distance * Math.cos(a)],
  };
}
