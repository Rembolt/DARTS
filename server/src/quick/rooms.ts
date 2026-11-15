import type { PropertyKind } from '../shared/contract.js';
import type { PiModel, PiRoom } from './pi.js';

export type UsableRoom = PiRoom & { name: string; heightAssumed: boolean };

/** Rooms analysed per property: the largest ones (spec 5.3). */
export const MAX_ROOMS = 40;
const MIN_AREA = 1;
const ASSUMED_HEIGHT: Record<PropertyKind, number> = { home: 2.7, apartment: 2.7, commercial: 3.5 };

/**
 * The rooms that count (spec 5.3): an area of at least 1 m² and not classified `Void`. A missing height (PI answers 0)
 * is assumed and flagged. `skipped` counts every room left out, including those past the 40 largest.
 */
export function usableRooms(model: PiModel, kind: PropertyKind): { rooms: UsableRoom[]; skipped: number } {
  const kept: UsableRoom[] = [];
  for (const room of model.rooms) {
    if (!(room.area >= MIN_AREA) || room.classifications[0]?.label === 'Void') continue;
    const heightAssumed = !(room.height > 0);
    kept.push({
      ...room,
      name: room.label || room.classifications[0]?.label || 'Room',
      height: heightAssumed ? ASSUMED_HEIGHT[kind] : room.height,
      heightAssumed,
    });
  }
  const rooms = kept.sort((a, b) => b.area - a.area).slice(0, MAX_ROOMS);
  return { rooms, skipped: model.rooms.length - rooms.length };
}
