// Outside sounds from the surroundings summary (v3-design 6.3, 6.4). Pure: it only builds the source list.
import type { Vec3 } from '../sim/types';
import { NORTH_OFFSET_DEG, type SoundId } from '../config';
import type { AreaClass, AreaSummary } from '../../../server/src/shared/contract';
import type { SourceSpec } from './engine';

/** The loop that stands for each class of area. */
export const LOOP_SOUND: Record<AreaClass, SoundId> = {
  commercial: 'commercial_ambience',
  city: 'city_ambience',
  industrial: 'industrial_ambience',
  residential: 'residential_ambience',
  nature: 'nature_ambience',
};

/** Facade level of each class's loop, in dB (v3-design 5.4). */
export const LOOP_FACADE_DB: Record<AreaClass, number> = { commercial: 62, city: 65, industrial: 65, residential: 50, nature: 42 };

const LOOP_DISTANCE_M = 25;
const LOOP_HEIGHT_M = 1.5;
const MAX_HIGHWAY_M = 60; // beyond this rays would not reach the house; the level still carries the true distance

/** A geo bearing (degrees clockwise from north) as an offset from the start: (sin θ, 0, −cos θ)·d, θ = bearing + NORTH_OFFSET_DEG. */
export function bearingOffset(bearingDeg: number, distanceM: number): Vec3 {
  const a = ((bearingDeg + NORTH_OFFSET_DEG) * Math.PI) / 180;
  return [Math.sin(a) * distanceM, 0, -Math.cos(a) * distanceM];
}

/** 72 dB at the facade equals the MVP highway's −12 dB; kept inside the limiter's range. */
export function facadeToLevelDb(facadeDb: number): number {
  return Math.min(-6, Math.max(-40, facadeDb - 84));
}

const at = (start: Vec3, offset: Vec3, height: number): Vec3 => [start[0] + offset[0], start[1] + height, start[2] + offset[2]];

export function surroundingSources(area: AreaSummary, start: Vec3): SourceSpec[] {
  const specs: SourceSpec[] = [];
  const loop = LOOP_SOUND[area.areaClass];
  specs.push({
    id: 'area', label: `${area.areaClass} background`, kind: 'ambient', sound: loop,
    position: at(start, bearingOffset(area.roadBearingDeg ?? 0, LOOP_DISTANCE_M), LOOP_HEIGHT_M),
    levelDb: facadeToLevelDb(LOOP_FACADE_DB[area.areaClass]), enabled: true,
  });
  const highway = area.located.find(s => s.kind === 'highway');
  if (highway) {
    specs.push({
      id: 'highway', label: 'Highway', kind: 'ambient', sound: 'highway',
      position: at(start, bearingOffset(highway.bearingDeg, Math.min(highway.distanceM, MAX_HIGHWAY_M)), LOOP_HEIGHT_M),
      levelDb: facadeToLevelDb(highway.levelDb), enabled: true,
    });
  }
  if (area.located.some(s => s.kind === 'railway')) {
    specs.push({ id: 'train', label: 'Train', kind: 'stereo', sound: 'train', position: [...start], levelDb: -10, enabled: true, every: [180, 360] });
  }
  if (area.located.some(s => s.kind === 'airport')) {
    specs.push({ id: 'plane', label: 'Planes', kind: 'stereo', sound: 'plane', position: [...start], levelDb: -10, enabled: true, every: [60, 180] });
  }
  return specs;
}

/** The status-line sentence when the area is a guess from the property type, or null when it is measured. */
export function surroundingsNotice(area: AreaSummary): string | null {
  return area.source === 'property_type' ? `Surroundings not available: playing a typical ${area.areaClass} background` : null;
}
