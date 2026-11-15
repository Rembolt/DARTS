import type { PiModel, PiOpening as RawOpening, PiRoom } from '../quick/pi.js';

export type OpeningKind = 'window' | 'door' | 'opening' | 'divider';

export type PiOpening = {
  id: string;
  kind: OpeningKind;
  roomId: string;
  roomName: string;
  /** The opening's two ends on its wall, PI frame (2D, metres). */
  a: [number, number];
  b: [number, number];
  /** Metres above the PI zero. */
  bottom: number;
  height: number;
  thickness: number;
};

export type PiRoomGeom = {
  id: string;
  name: string;
  floor: string;
  area: number;
  floorZ: number;
  height: number;
  polygon: [number, number][];
};

export type GeometryAnswer = { rooms: PiRoomGeom[]; openings: PiOpening[] };

const DEFAULT_ROOM_HEIGHT = 2.7;
const DEFAULT_WINDOW_SILL = 0.9;
const DEFAULT_DOOR_HEIGHT = 2.0;
const DEFAULT_WINDOW_HEIGHT = 1.2;

function openingKind(rawType: string): OpeningKind | null {
  if (rawType === 'doorway' || rawType === 'door') return 'door';
  if (rawType === 'window' || rawType === 'opening' || rawType === 'divider') return rawType;
  return null;
}

function openingSpan(
  edgeA: [number, number],
  edgeB: [number, number],
  relativeCenter: number,
  width: number,
): [[number, number], [number, number]] | null {
  const dx = edgeB[0] - edgeA[0];
  const dy = edgeB[1] - edgeA[1];
  const len = Math.hypot(dx, dy);
  if (len <= 0 || width <= 0) return null;
  const ux = dx / len;
  const uy = dy / len;
  const cx = edgeA[0] + dx * relativeCenter;
  const cy = edgeA[1] + dy * relativeCenter;
  const hw = width / 2;
  return [
    [cx - ux * hw, cy - uy * hw],
    [cx + ux * hw, cy + uy * hw],
  ];
}

function mapOpening(
  op: RawOpening,
  kind: OpeningKind,
  room: PiRoom,
  roomName: string,
  floorZ: number,
  roomHeight: number,
  edgeA: [number, number],
  edgeB: [number, number],
  thickness: number,
): PiOpening | null {
  const span = openingSpan(edgeA, edgeB, op.relativeCenter, op.width);
  if (!span) return null;
  const bottom =
    op.lowerElevation !== null ? op.lowerElevation : kind === 'window' ? floorZ + DEFAULT_WINDOW_SILL : floorZ;
  const fallbackHeight =
    kind === 'door' ? DEFAULT_DOOR_HEIGHT : kind === 'window' ? DEFAULT_WINDOW_HEIGHT : roomHeight;
  const height = op.height > 0 ? op.height : fallbackHeight;
  return {
    id: op.id,
    kind,
    roomId: room.id,
    roomName,
    a: span[0],
    b: span[1],
    bottom,
    height,
    thickness,
  };
}

/**
 * The name a person would use: the owner's label, else the detected type with the best confidence ("Kitchen"),
 * else "Room". Repeated names are numbered ("Bedroom 1", "Bedroom 2") so the agent can tell them apart.
 */
export function roomNames(rooms: PiModel['rooms']): Map<string, string> {
  const base = rooms.map(r => {
    const best = [...r.classifications].sort((x, y) => y.confidence - x.confidence)[0];
    return r.label.trim() || best?.label || 'Room';
  });
  const total = new Map<string, number>();
  for (const b of base) total.set(b, (total.get(b) ?? 0) + 1);
  const seen = new Map<string, number>();
  const out = new Map<string, string>();
  rooms.forEach((r, i) => {
    const b = base[i];
    const n = (seen.get(b) ?? 0) + 1;
    seen.set(b, n);
    out.set(r.id, (total.get(b) ?? 0) > 1 ? `${b} ${n}` : b);
  });
  return out;
}

/** Extract closed room polygons and 2D opening spans in the PI frame from a PI model. */
export function geometryOf(model: PiModel): GeometryAnswer {
  const rooms: PiRoomGeom[] = [];
  const openings: PiOpening[] = [];

  const usable = model.rooms.filter(r => r.edges.length >= 3);
  const names = roomNames(usable);
  for (const room of usable) {
    const name = names.get(room.id) ?? 'Room';
    const floorZ = room.lowerElevation ?? 0;
    const height = room.height > 0 ? room.height : DEFAULT_ROOM_HEIGHT;
    const polygon = room.edges.map(e => e.a);

    rooms.push({
      id: room.id,
      name,
      floor: room.floorId,
      area: room.area,
      floorZ,
      height,
      polygon,
    });

    for (const edge of room.edges) {
      for (const op of edge.openings) {
        const kind = openingKind(op.type);
        if (!kind) continue;
        const mapped = mapOpening(op, kind, room, name, floorZ, height, edge.a, edge.b, edge.thickness);
        if (mapped) openings.push(mapped);
      }
    }
  }

  return { rooms, openings };
}
