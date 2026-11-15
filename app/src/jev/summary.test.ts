import { describe, expect, it, vi } from 'vitest';
import type { OpeningInfo, RoomInfo, SceneEffects } from '../scene/actions';
import { applyDefaults } from '../scene/materials';
import { defaultScene, type MaterialDefaults } from '../scene/state';
import { sceneSummary } from './summary';

function fakeEffects(opts: { rooms?: RoomInfo[]; openings?: OpeningInfo[]; estimated?: boolean } = {}): SceneEffects {
  return {
    materialsChanged: vi.fn(),
    qualityChanged: vi.fn(),
    openingsChanged: vi.fn(async () => {}),
    layersChanged: vi.fn(),
    sourcesChanged: vi.fn(async () => {}),
    clearReverb: vi.fn(),
    retrace: vi.fn(),
    moveUserTo: vi.fn(async () => {}),
    measure: vi.fn(async () => ({
      roomId: 'r1',
      echoTime: [0.5, 0.5, 0.5] as [number, number, number],
      sources: [],
      estimated: false,
    })),
    current: vi.fn(() => ({
      roomId: 'r1',
      echoTime: [0.823, 0.712, 0.645] as [number, number, number],
      sources: [{ id: 's1', levelDb: [-12.34, -15.67, -18.9] as [number, number, number], walls: 1 }],
      estimated: opts.estimated ?? true,
    })),
    rooms: vi.fn(
      () =>
        opts.rooms ?? [
          { id: 'r1', name: 'Kitchen', floor: 'f1', area: 12, centre: [0, 0, 0] as [number, number, number] },
        ],
    ),
    openings: vi.fn(
      () =>
        opts.openings ?? [
          { id: 'w1', kind: 'window' as const, roomId: 'r1', roomName: 'Kitchen', width: 1.2, height: 1.0, meshClosed: false },
          { id: 'd1', kind: 'door' as const, roomId: 'r1', roomName: 'Kitchen', width: 0.9, height: 2.0, meshClosed: false },
        ],
    ),
    layers: vi.fn(() => [{ id: 'house', triangles: 13803 }]),
    roomsTagged: vi.fn(() => true),
    listener: vi.fn(() => ({ position: [1.234, 1.6, -2.345] as [number, number, number], roomId: 'r1' })),
  };
}

describe('sceneSummary', () => {
  it('includes everything with the default permissions', () => {
    const scene = defaultScene('Ki9YdfpNKum');
    scene.openings.loaded = true;
    const sum = sceneSummary(scene, fakeEffects()) as Record<string, unknown>;
    expect(sum.userLocation).toBeDefined();
    expect(sum.locations).toBeDefined();
    expect(sum.measurements).toBeDefined();
    expect(sum.materials).toBeDefined();
    expect(sum.furnishing).toBeDefined();
    expect(sum.windows).toBeDefined();
    expect(sum.doors).toBeDefined();
    expect(sum.mesh).toBeDefined();
    expect(sum.off).toBeDefined();
  });

  it('leaves a row out when its GET is off', () => {
    const scene = defaultScene('Ki9YdfpNKum');
    scene.openings.loaded = true;
    scene.permissions.get.windows = false;
    const sum = sceneSummary(scene, fakeEffects()) as { windows?: unknown; off: { get: string[] } };
    expect('windows' in sum).toBe(false);
    expect(sum.off.get).toContain('Windows');
  });

  it('carries the default reason for an untouched surface', () => {
    const defaults: MaterialDefaults = {
      source: 'llm',
      rooms: [
        {
          roomId: 'r1',
          floor: { parts: [{ material: 'tile', weight: 1 }] },
          wall: { parts: [{ material: 'drywall', weight: 1 }] },
          ceiling: { parts: [{ material: 'drywall', weight: 1 }] },
          furnishing: 'sparse',
          reason: 'Listing says Tile Flooring.',
        },
      ],
      exteriorWall: { parts: [{ material: 'brick_veneer', weight: 1 }] },
      exteriorReason: 'Brick Exterior Construction.',
    };
    const scene = applyDefaults(defaultScene('Ki9YdfpNKum'), defaults, [{ id: 'r1', area: 12 }], true);
    const sum = sceneSummary(scene, fakeEffects()) as { materials: { reasons: Record<string, string> } };
    expect(JSON.stringify(sum.materials)).toContain('Tile Flooring');
    expect(JSON.stringify(sum.materials)).toContain('Brick Exterior Construction');
  });

  it('marks the echo time as estimated until the reverb job answers', () => {
    const scene = defaultScene('Ki9YdfpNKum');
    const est = sceneSummary(scene, fakeEffects({ estimated: true })) as { measurements: { estimated: boolean } };
    expect(est.measurements.estimated).toBe(true);
    const done = sceneSummary(scene, fakeEffects({ estimated: false })) as { measurements: { estimated: boolean } };
    expect(done.measurements.estimated).toBe(false);
  });

  it('has no listener when user location GET is off', () => {
    const scene = defaultScene('Ki9YdfpNKum');
    scene.permissions.get.userLocation = false;
    const sum = sceneSummary(scene, fakeEffects()) as Record<string, unknown>;
    expect('userLocation' in sum).toBe(false);
  });

  it('stays under 4 kB for a 20-room house with 6 sources', () => {
    const scene = defaultScene('Ki9YdfpNKum');
    const rooms: RoomInfo[] = Array.from({ length: 20 }, (_, i) => ({
      id: `r${i}`,
      name: `Room ${i}`,
      floor: 'f1',
      area: 15,
      centre: [i, 0, 0] as [number, number, number],
    }));
    scene.sources = Array.from({ length: 6 }, (_, i) => ({
      id: `speaker-${i + 1}`,
      label: `Speaker ${i + 1}`,
      kind: 'point' as const,
      sound: 'music',
      position: [i, 1, 0] as [number, number, number],
      levelDb: 0,
      enabled: true,
    }));
    const bytes = new TextEncoder().encode(JSON.stringify(sceneSummary(scene, fakeEffects({ rooms })))).length;
    expect(bytes).toBeLessThan(4096);
  });
});
