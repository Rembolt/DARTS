// Every hardcoded value of the MVP (mvp-design.md section 4). Later versions change these from settings or an agent.
import type { Material, SimConfig, Vec3 } from './sim/types';

// Starting values from memory, not from a measured table. See mvp-design.md 4.2.
export const MATERIALS: SimConfig['materials'] = {
  wall: { absorption: [0.25, 0.06, 0.08], scattering: 0.10, blockingDb: [25, 35, 45] },
  floor: { absorption: [0.15, 0.10, 0.07], scattering: 0.20, blockingDb: [35, 45, 50] },
  ceiling: { absorption: [0.25, 0.06, 0.08], scattering: 0.10, blockingDb: [25, 35, 45] },
} satisfies Record<string, Material>;

export const SIM = {
  furnishing: 0.15,
  transmissionScale: 0.6,
  raysPerTrace: 2000,
  bounces: 4,
  maxLegWalls: 2,
  scatteringFloor: 0.3,
  occlusionRays: 9,
  occlusionRadius: 0.3,
  wallMergeDistance: 0.5,
  earlyWindow: 0.08,
  maxDrawnPaths: 40,
  reverbRays: 1500,
  reverbBounces: 60,
  blueprintEdgeAngle: 25,
  speedOfSound: 343,
} satisfies Omit<SimConfig, 'materials' | 'slotDirections'>;

export const SOURCES = {
  indoor: {
    id: 'indoor',
    file: '/audio/indoor.mp3', // "Dream Sweet in Sea Major", supplied locally, git-ignored
    position: null as Vec3 | null, // null: use the tour's start position
    startHeightOffset: -0.4,
  },
  outdoor: {
    id: 'outdoor',
    file: '/audio/outdoor.mp3', // a free highway loop; credit it in app/public/audio/CREDITS.md
    distance: 25, // metres from the tour's start position
    compassAngleDeg: 0, // pick by ear (open question Q1)
    height: 1.5,
    levelDb: -12,
  },
};

/** The blueprint view's look (mvp-design.md 7). The edge angle that picks its lines is `SIM.blueprintEdgeAngle`. */
export const BLUEPRINT = {
  background: '#ffffff',
  opacity: 0.85,
  lineColor: '#1f3a93',
};

export const AUDIO = {
  slotPannerDistance: 2,
  maxDelay: 0.2,
  delayJumpThreshold: 0.002,
  delayDipTime: 0.02,
  reverbGain: 1.5,
  reverbCrossfade: 0.2,
  reverbChangeThreshold: 0.15,
  smoothing: 0.08,
  lowShelfHz: 250,
  highShelfHz: 2000,
  echoTimeMin: 0.2,
  echoTimeMax: 2.5,
  listenerMoveThreshold: 0.25,
};

/** The 12 fixed echo slot directions: the corners of an icosahedron (mvp-design.md 5.4). */
export const SLOT_DIRECTIONS: Vec3[] = (() => {
  const phi = (1 + Math.sqrt(5)) / 2;
  const len = Math.hypot(1, phi);
  const dirs: Vec3[] = [];
  for (const a of [1, -1])
    for (const b of [phi, -phi]) {
      dirs.push([0, a / len, b / len], [a / len, b / len, 0], [b / len, 0, a / len]);
    }
  return dirs;
})();

export function simConfig(): SimConfig {
  return { materials: MATERIALS, slotDirections: SLOT_DIRECTIONS, ...SIM };
}
