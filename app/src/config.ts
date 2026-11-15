// Every hardcoded value of the MVP (mvp-design.md section 4). Later versions change these from settings or an agent.
import type { Material, SimConfig, Vec3 } from './sim/types';
import type { SourceKind } from './audio/engine';

// Fitted to published octave-band tables (materials.reference.ts); still estimates. See mvp-design.md 4.2.
export const MATERIALS: SimConfig['materials'] = {
  wall: { absorption: [0.23, 0.06, 0.09], scattering: 0.10, blockingDb: [20, 37, 45] },
  floor: { absorption: [0.14, 0.09, 0.07], scattering: 0.20, blockingDb: [35, 45, 50] },
  ceiling: { absorption: [0.23, 0.06, 0.09], scattering: 0.10, blockingDb: [20, 37, 45] },
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
  reverbBounces: 120, // 60 cut hard rooms short: an empty tiled room read about 20% under its Eyring time
  blueprintEdgeAngle: 25,
  speedOfSound: 343,
} satisfies Omit<SimConfig, 'materials' | 'slotDirections'>;

/** The sound library (v2-design 5.3, v3-design 6.6). Each file's licence and credit: app/public/audio/CREDITS.md. */
export type SoundId = 'highway' | 'road' | 'city_ambience' | 'nature_ambience' | 'industrial_ambience' | 'commercial_ambience'
  | 'residential_ambience' | 'train' | 'plane' | 'music' | 'conversation' | 'speaking' | 'opening' | 'footstep_hard' | 'footstep_soft';

/**
 * Per sound: its file, the kind it plays as and its default level in dB relative to the MVP song. Outside sounds placed
 * from the surroundings take their level from the facade level instead (audio/surroundings.ts).
 * `road` and `residential_ambience` are not in V2's table: road like the city loop, residential from its 50 dB facade.
 * Footsteps play from `footstep_<floor>_1..4.ogg` (audio/footsteps.ts); their entries here only carry the level.
 * `conversation` is a crowd talking, `speaking` one person. `opening` plays once when a door or window is opened or
 * closed (audio/opening-sound.ts); it is not a source.
 */
export const SOUNDS: Record<SoundId, { file: string; kind: SourceKind; levelDb: number }> = {
  music: { file: '/audio/music.ogg', kind: 'point', levelDb: 0 },
  conversation: { file: '/audio/conversation.ogg', kind: 'point', levelDb: -6 },
  speaking: { file: '/audio/speaking.ogg', kind: 'point', levelDb: -6 },
  opening: { file: '/audio/opening.ogg', kind: 'point', levelDb: -12 },
  highway: { file: '/audio/highway.ogg', kind: 'ambient', levelDb: -12 },
  road: { file: '/audio/road.ogg', kind: 'ambient', levelDb: -14 },
  city_ambience: { file: '/audio/city_ambience.ogg', kind: 'ambient', levelDb: -14 },
  nature_ambience: { file: '/audio/nature_ambience.ogg', kind: 'ambient', levelDb: -20 },
  industrial_ambience: { file: '/audio/industrial_ambience.ogg', kind: 'ambient', levelDb: -14 },
  commercial_ambience: { file: '/audio/commercial_ambience.ogg', kind: 'ambient', levelDb: -16 },
  residential_ambience: { file: '/audio/residential_ambience.ogg', kind: 'ambient', levelDb: -34 },
  train: { file: '/audio/train.ogg', kind: 'stereo', levelDb: -10 },
  plane: { file: '/audio/plane.ogg', kind: 'stereo', levelDb: -10 },
  footstep_hard: { file: '/audio/footstep_hard.ogg', kind: 'point', levelDb: -18 },
  footstep_soft: { file: '/audio/footstep_soft.ogg', kind: 'point', levelDb: -18 },
};

/** At most this many sources play at once (v2-design 5.2); from the fifth on, a voice gets 8 echo slots, not 12. */
export const MAX_SOURCES = 6;

/** Rotates every geo bearing in the tour (v3-design 6.4). 0: the mesh's -Z axis is taken as north (not measured). */
export const NORTH_OFFSET_DEG = 0;

/** The blueprint view's look (mvp-design.md 7). The edge angle that picks its lines is `SIM.blueprintEdgeAngle`. */
export const BLUEPRINT = {
  background: '#f4eee2',
  opacity: 0.85,
  lineColor: '#4a3b2c',
  /** 'solid': walls drawn as a white model with their edges on top; 'xray': edges only, seen through the walls. */
  defaultMode: 'solid' as 'solid' | 'xray',
  /** Solid mode surface colours, in material id order: wall, floor, ceiling. */
  surfaceColors: ['#f3f0ea', '#d8d2c4', '#faf8f4'],
};

export const AUDIO = {
  slotPannerDistance: 2,
  maxDelay: 0.2,
  // Walking moves most echo delays 2–10 ms per trace; dipping those muted the echoes on every trace (a stutter).
  // They glide instead, slowly enough that the pitch bend stays small (~9 cents for 5 ms); only bigger jumps dip.
  delayJumpThreshold: 0.01,
  delayGlideTime: 0.25,
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
  /** Master volume cap after the limiter (linear gain). */
  masterVolume: 0.8,
  /** The limiter: a `DynamicsCompressorNode` set hard so the sum of 26 panners never clips. */
  limiterThresholdDb: -6,
  limiterKneeDb: 0,
  limiterRatio: 20,
  limiterAttack: 0.003,
  limiterRelease: 0.25,
  /** Shelf filters never go further than this from flat, in dB, whatever the simulation says. */
  maxShelfDb: 24,
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
