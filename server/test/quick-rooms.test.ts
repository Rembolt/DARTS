import { describe, it, expect } from 'vitest';
import type { PiModel, PiRoom } from '../src/quick/pi.js';
import { usableRooms } from '../src/quick/rooms.js';
import { roomFinish } from '../src/quick/finish.js';
import { PROFILES, resolveRequirements } from '../src/quick/profiles.js';
import type { ProfileId } from '../src/shared/contract.js';

function room(over: Partial<PiRoom> = {}): PiRoom {
  return {
    id: 'r', label: '', classifications: [], floorId: 'f1', keywords: [],
    area: 12, width: 3, depth: 4, height: 2.5, lowerElevation: 0, edges: [], ...over,
  };
}
function model(rooms: PiRoom[]): PiModel {
  return { modelId: 'Ki9YdfpNKum', name: null, active: true, isPublic: true, hasMesh: true, rooms };
}
const VOID = [{ label: 'Void', confidence: 1 }];

describe('usableRooms', () => {
  it('skips Void, tiny and area-less rooms', () => {
    const { rooms, skipped } = usableRooms(model([
      room({ id: 'a' }),
      room({ id: 'void', area: 5, classifications: VOID }),
      room({ id: 'tiny', area: 0.4 }),
      room({ id: 'none', area: 0 }),
      room({ id: 'b', area: 1.5 }),
    ]), 'home');
    expect(rooms.map(r => r.id)).toEqual(['a', 'b']);
    expect(skipped).toBe(3);
  });

  it('leaves out balconies, halls and entrances, unless nothing else is left', () => {
    const named = (id: string, label: string, area = 12) => room({ id, label, area });
    const some = usableRooms(model([named('a', 'Bedroom'), named('b', 'Balcony', 20), named('c', 'Entrance Hall'), named('d', 'Hallway')]), 'home');
    expect(some.rooms.map(r => r.id)).toEqual(['a']);
    expect(some.skipped).toBe(3);
    const only = usableRooms(model([named('b', 'Balcony'), named('d', 'Hallway')]), 'home');
    expect(only.rooms).toHaveLength(2);
  });

  it('assumes a height when PI gives 0 and flags it', () => {
    const home = usableRooms(model([room({ height: 0 }), room({ id: 'b', height: 2.4 })]), 'home');
    const commercial = usableRooms(model([room({ height: 0 })]), 'commercial');
    const apartment = usableRooms(model([room({ height: 0 })]), 'apartment');
    expect(home.rooms[0]).toMatchObject({ height: 2.7, heightAssumed: true });
    expect(home.rooms[1]).toMatchObject({ height: 2.4, heightAssumed: false });
    expect(commercial.rooms[0].height).toBe(3.5);
    expect(apartment.rooms[0].height).toBe(2.7);
  });

  it('returns no rooms when none has an area', () => {
    const empty = room({ id: 'x', area: 0, width: 0, depth: 0, height: 0 });
    expect(usableRooms(model([empty, { ...empty, id: 'y' }]), 'home')).toEqual({ rooms: [], skipped: 2 });
  });

  it('names rooms by label, then class, then Room', () => {
    const { rooms } = usableRooms(model([
      room({ id: 'a', label: 'Studio', classifications: [{ label: 'Bedroom', confidence: 1 }] }),
      room({ id: 'b', classifications: [{ label: 'Kitchen', confidence: 1 }] }),
      room({ id: 'c' }),
    ]), 'home');
    expect(rooms.map(r => r.name)).toEqual(['Studio', 'Kitchen', 'Room']);
  });

  it('keeps the 40 largest', () => {
    const many = Array.from({ length: 45 }, (_, i) => room({ id: `r${i}`, area: 2 + i }));
    const { rooms, skipped } = usableRooms(model(many), 'home');
    expect(rooms).toHaveLength(40);
    expect(skipped).toBe(5);
    expect(rooms.some(r => r.id === 'r0')).toBe(false);
    expect(rooms.some(r => r.id === 'r44')).toBe(true);
  });
});

describe('roomFinish', () => {
  it('finishes a kitchen with tile and a bedroom with carpet', () => {
    expect(roomFinish('Kitchen', [])).toEqual({ floor: 'tile', walls: 'drywall', ceiling: 'drywall', furnishing: 0.08 });
    expect(roomFinish('Primary Bedroom', [])).toEqual({ floor: 'carpet', walls: 'drywall', ceiling: 'drywall', furnishing: 0.15 });
  });

  it('uses the heaviest material of a mix', () => {
    expect(roomFinish('Living Room', []).floor).toBe('wood_floor');   // wood_floor 0.7, carpet 0.3
    expect(roomFinish('Bathroom', []).walls).toBe('drywall');          // drywall 0.6, wall_tile 0.4
  });

  it('lets hardwood floors override the bedroom floor', () => {
    expect(roomFinish('Bedroom', ['hardwood floors']).floor).toBe('wood_floor');
    expect(roomFinish('Family Room', ['hardwood floors']).floor).toBe('wood_floor');
    expect(roomFinish('Kitchen', ['hardwood floors']).floor).toBe('tile');
  });
});

describe('profiles', () => {
  it('has weights that sum to 1 for every profile', () => {
    for (const [id, p] of Object.entries(PROFILES)) {
      const w = p.weights;
      expect(w.echo + w.outside + w.escape + w.size + w.bass, id).toBeCloseTo(1, 6);
      expect(p.profile).toBe(id);
    }
    expect(Object.keys(PROFILES)).toHaveLength(10);
  });

  it('holds the spec values', () => {
    expect(PROFILES.recording).toEqual({
      profile: 'recording', echoMid: [0.2, 0.4], maxOutsideDb: 30, maxEscapeDb: 45, minRoomArea: 12, avoidBoomyBass: true,
      weights: { echo: 0.35, outside: 0.30, escape: 0.10, size: 0.10, bass: 0.15 },
    });
    expect(PROFILES.podcast.maxEscapeDb).toBeNull();
    expect(PROFILES.retail).toMatchObject({ echoMid: [0.6, 1.2], maxOutsideDb: 60, minRoomArea: 50 });
  });

  it('clamps overrides', () => {
    expect(resolveRequirements('recording', { maxOutsideDb: 5, echoMin: 0.9, echoMax: 0.2 })).toMatchObject({ maxOutsideDb: 20, echoMid: [0.2, 0.9] });
    expect(resolveRequirements('general', { echoMax: 9, maxEscapeDb: 100, minRoomArea: 1 })).toMatchObject({ echoMid: [0.4, 3], maxEscapeDb: 80, minRoomArea: 2 });
  });

  it('ignores null and junk overrides and never changes the profile table', () => {
    const before = JSON.stringify(PROFILES);
    const junk = { echoMin: null, echoMax: 'x', maxOutsideDb: Number.NaN, minRoomArea: undefined } as never;
    expect(resolveRequirements('sleep', junk)).toEqual(PROFILES.sleep);
    const r = resolveRequirements('sleep', { echoMin: 0.9, echoMax: 0.2 });
    r.weights.echo = 99;
    expect(JSON.stringify(PROFILES)).toBe(before);
  });

  it('answers a copy for every profile', () => {
    for (const id of Object.keys(PROFILES) as ProfileId[]) expect(resolveRequirements(id)).toEqual(PROFILES[id]);
  });
});
