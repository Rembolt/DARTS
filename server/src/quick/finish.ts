import { FURNISHING, ROOM_TABLE, roomType, type MaterialName, type Mix } from '../shared/materials.js';

export type RoomFinish = { floor: MaterialName; walls: MaterialName; ceiling: MaterialName; furnishing: number };

/** The mix's heaviest material (the first one on a tie). */
function heaviest(mix: Mix): MaterialName {
  return mix.reduce((best, m) => (m.weight > best.weight ? m : best)).material;
}

/**
 * Suggested finishes for a room by its name (the room-type table), not facts about the house. The listing fact
 * 'hardwood floors' makes living rooms and bedrooms `wood_floor`.
 */
export function roomFinish(roomName: string, facts: string[]): RoomFinish {
  const type = roomType(roomName);
  const row = ROOM_TABLE[type];
  const hardwood = facts.includes('hardwood floors') && (type === 'living' || type === 'bedroom');
  return {
    floor: hardwood ? 'wood_floor' : heaviest(row.floor),
    walls: heaviest(row.wall),
    ceiling: heaviest(row.ceiling),
    furnishing: FURNISHING[row.furnishing],
  };
}
