import { MATERIALS } from '../shared/materials.js';
import type { AreaSummary, IndexRow, Requirements, RoomSummary } from '../shared/contract.js';
import {
  absorptionArea, boomyBass, compositeTl, echoWord, escapeDb, exteriorWalls, outsideInsideDb, perimeter, roomGainDb,
  sabine, scoreRoom,
} from './acoustics.js';
import { roomFinish } from './finish.js';
import type { PiModel } from './pi.js';
import type { UsableRoom } from './rooms.js';

const MID = 1;
const BANDS = [0, 1, 2] as const;
const round = (v: number, places: number) => Math.round(v * 10 ** places) / 10 ** places;

/** The exterior wall build in the mid band: brick veneer when the listing says brick, else siding; windows closed glass. */
function facadeTl(facts: string[]): { wall: number; glass: number } {
  const build = facts.includes('brick') ? MATERIALS.brick_veneer : MATERIALS.siding_wall;
  return { wall: build.blockingDb[MID], glass: MATERIALS.glass.blockingDb[MID] };
}

type Exterior = { wallArea: number; windowArea: number } | null;

/**
 * Per-room estimates (spec 5.4), sorted best first. `area` null means the surroundings are unknown: outside noise is
 * then left out of every room's score. A room with no boundary edges has unknown outside walls, so its outside and
 * escape levels are null rather than guessed.
 */
export function analyseRooms(
  model: PiModel, rooms: UsableRoom[], row: IndexRow, area: AreaSummary | null, req: Requirements,
): { rooms: RoomSummary[]; withoutWalls: number } {
  const tl = facadeTl(row.facts);
  const exteriors: Exterior[] = rooms.map(room =>
    room.edges.length === 0 ? null : exteriorWalls(room, model.rooms.filter(o => o.floorId === room.floorId)));
  const facadeParts = (e: { wallArea: number; windowArea: number }) => {
    const windows = Math.min(e.windowArea, e.wallArea);
    return [{ area: e.wallArea - windows, tl: tl.wall }, { area: windows, tl: tl.glass }];
  };
  // The whole house's facade, for rooms that have no outside wall of their own.
  const houseParts = exteriors.flatMap(e => (e && e.wallArea > 0 ? facadeParts(e) : []));
  const houseTl = houseParts.length > 0 ? compositeTl(houseParts) : tl.wall;

  let withoutWalls = 0;
  const summaries = rooms.map((room, i): RoomSummary => {
    const finish = roomFinish(room.name, row.facts);
    const volume = room.area * room.height;
    const wallArea = perimeter(room) * room.height;
    const surface = 2 * room.area + wallArea;
    // Furniture absorbs on the floor only, as in the tour (0fd3a83): the same room gets the same echo on its card and by ear.
    const absorption = BANDS.map(b => absorptionArea([
      { area: room.area, alpha: MATERIALS[finish.floor].absorption[b] + finish.furnishing },
      { area: room.area, alpha: MATERIALS[finish.ceiling].absorption[b] },
      { area: wallArea, alpha: MATERIALS[finish.walls].absorption[b] },
    ], 0));
    const echo = absorption.map(a => round(sabine(volume, a), 2)) as [number, number, number];

    const flags: string[] = [];
    if (boomyBass(room.width, room.depth, room.height)) flags.push('boomy bass');
    const hard = [finish.floor, finish.walls, finish.ceiling].every(m => MATERIALS[m].absorption[MID] < 0.1);
    if (hard && finish.furnishing === 0) flags.push('flutter risk');
    if (room.edges.some(e => e.type === 'invisible')) flags.push('open plan');

    let outsideDb: number | null = null;
    let escape: number | null = null;
    const exterior = exteriors[i];
    if (!exterior) {
      withoutWalls++;
    } else if (exterior.wallArea > 0) {
      const roomTl = compositeTl(facadeParts(exterior));
      if (area) outsideDb = outsideInsideDb(area.facadeDb, roomTl, exterior.wallArea, absorption[MID]);
      escape = escapeDb(roomTl, exterior.wallArea);
    } else {
      flags.push('interior room');
      // One more partition between the room and the facade: rough.
      if (area) outsideDb = area.facadeDb - houseTl - 10;
    }

    const summary: Omit<RoomSummary, 'score'> = {
      id: room.id, name: room.name, floor: room.floorId, area: round(room.area, 1), volume: round(volume, 1),
      heightAssumed: room.heightAssumed, echo, echoWord: echoWord(echo[MID]),
      roomGainDb: round(roomGainDb(absorption[MID], surface), 1), flags,
      outsideDb: outsideDb === null ? null : round(outsideDb, 1),
      escapeDb: escape === null ? null : round(escape, 1),
    };
    return { ...summary, score: round(scoreRoom(summary, req), 3) };
  });
  summaries.sort((a, b) => b.score - a.score);
  return { rooms: summaries, withoutWalls };
}
