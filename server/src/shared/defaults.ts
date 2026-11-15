import type { FURNISHING, MaterialName } from './materials.js';

export type FurnishingLevel = keyof typeof FURNISHING;
export type Blend = { parts: { material: MaterialName; weight: number }[] };
export type RoomDefault = {
  roomId: string;
  floor: Blend;
  wall: Blend;
  ceiling: Blend;
  furnishing: FurnishingLevel;
  reason: string;
};
export type MaterialDefaults = {
  source: 'llm' | 'table';
  rooms: RoomDefault[];
  exteriorWall: Blend;
  exteriorReason: string;
};
