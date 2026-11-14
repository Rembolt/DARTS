import { describe, it, expect } from 'vitest';
import { MATERIALS, SIM, SOURCES, AUDIO, SLOT_DIRECTIONS, simConfig } from './config';

describe('materials (spec 4.2)', () => {
  it('has the spec values', () => {
    expect(MATERIALS.wall).toEqual({ absorption: [0.25, 0.06, 0.08], scattering: 0.10, blockingDb: [25, 35, 45] });
    expect(MATERIALS.floor).toEqual({ absorption: [0.15, 0.10, 0.07], scattering: 0.20, blockingDb: [35, 45, 50] });
    expect(MATERIALS.ceiling).toEqual({ absorption: [0.25, 0.06, 0.08], scattering: 0.10, blockingDb: [25, 35, 45] });
    expect(SIM.furnishing).toBe(0.15);
    expect(SIM.transmissionScale).toBe(0.6);
  });

  it('keeps absorption plus furnishing below 1 in every band', () => {
    for (const m of Object.values(MATERIALS))
      for (const a of m.absorption) expect(a + SIM.furnishing).toBeLessThan(1);
  });
});

describe('simulation settings (spec 4.4)', () => {
  it('has the spec values', () => {
    expect(SIM).toMatchObject({
      raysPerTrace: 2000, bounces: 4, maxLegWalls: 2, scatteringFloor: 0.3,
      occlusionRays: 9, occlusionRadius: 0.3, wallMergeDistance: 0.5, earlyWindow: 0.08,
      maxDrawnPaths: 40, reverbRays: 1500, reverbBounces: 60, blueprintEdgeAngle: 25, speedOfSound: 343,
    });
  });
});

describe('echo slot directions (spec 5.4)', () => {
  it('are 12 distinct unit vectors', () => {
    expect(SLOT_DIRECTIONS).toHaveLength(12);
    for (const [x, y, z] of SLOT_DIRECTIONS) expect(Math.hypot(x, y, z)).toBeCloseTo(1, 6);
    expect(new Set(SLOT_DIRECTIONS.map(d => d.map(n => n.toFixed(4)).join(','))).size).toBe(12);
  });

  it('are the corners of an icosahedron: each has 5 nearest neighbours at the same angle', () => {
    const dot = (a: number[], b: number[]) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
    for (const a of SLOT_DIRECTIONS) {
      const near = SLOT_DIRECTIONS.filter(b => b !== a && Math.abs(dot(a, b) - 1 / Math.sqrt(5)) < 1e-6);
      expect(near).toHaveLength(5);
    }
  });
});

describe('sources and audio (spec 4.3, 6)', () => {
  it('has the spec values', () => {
    expect(SOURCES.indoor).toEqual({ id: 'indoor', file: '/audio/indoor.mp3', position: null, startHeightOffset: -0.4 });
    expect(SOURCES.outdoor).toEqual({ id: 'outdoor', file: '/audio/outdoor.mp3', distance: 25, compassAngleDeg: 0, height: 1.5, levelDb: -12 });
    expect(AUDIO).toEqual({
      slotPannerDistance: 2, maxDelay: 0.2, delayJumpThreshold: 0.002, delayDipTime: 0.02,
      reverbGain: 1.5, reverbCrossfade: 0.2, reverbChangeThreshold: 0.15, smoothing: 0.08,
      lowShelfHz: 250, highShelfHz: 2000, echoTimeMin: 0.2, echoTimeMax: 2.5, listenerMoveThreshold: 0.25,
    });
  });
});

describe('simConfig', () => {
  it('bundles what the worker needs', () => {
    const c = simConfig();
    expect(c.materials).toBe(MATERIALS);
    expect(c.slotDirections).toBe(SLOT_DIRECTIONS);
    expect(c.raysPerTrace).toBe(2000);
    expect(c.furnishing).toBe(0.15);
  });
});
