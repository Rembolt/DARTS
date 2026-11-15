// The shared material library and room-type table (v2-design.md sections 4.1 and 4.4).
// No imports and no Node APIs: the app imports this file too.
// Rough, unvalidated values. Every number shown from them is an estimate, never a measurement.

/** Per band low / mid / high. blockingDb is transmission loss in dB. */
export type Material = {
  absorption: [number, number, number];
  scattering: number;
  blockingDb: [number, number, number];
};

export const MATERIALS = {
  drywall: { absorption: [0.25, 0.06, 0.08], scattering: 0.10, blockingDb: [25, 35, 45] },
  insulated_drywall: { absorption: [0.30, 0.08, 0.08], scattering: 0.10, blockingDb: [35, 47, 55] },
  wood_floor: { absorption: [0.15, 0.10, 0.07], scattering: 0.20, blockingDb: [35, 45, 50] },
  tile: { absorption: [0.01, 0.01, 0.02], scattering: 0.05, blockingDb: [40, 50, 55] },
  concrete: { absorption: [0.01, 0.02, 0.03], scattering: 0.05, blockingDb: [45, 55, 60] },
  carpet: { absorption: [0.08, 0.35, 0.60], scattering: 0.30, blockingDb: [35, 45, 50] },
  wood_panel: { absorption: [0.30, 0.10, 0.08], scattering: 0.15, blockingDb: [25, 30, 35] },
  acoustic_panel: { absorption: [0.40, 0.85, 0.90], scattering: 0.40, blockingDb: [25, 35, 45] },
  glass: { absorption: [0.30, 0.04, 0.02], scattering: 0.05, blockingDb: [18, 25, 28] },
  door: { absorption: [0.15, 0.08, 0.08], scattering: 0.10, blockingDb: [18, 25, 30] },
  vinyl: { absorption: [0.02, 0.03, 0.03], scattering: 0.05, blockingDb: [35, 45, 50] },
  wall_tile: { absorption: [0.01, 0.01, 0.02], scattering: 0.05, blockingDb: [28, 38, 48] },
  plaster: { absorption: [0.02, 0.03, 0.04], scattering: 0.05, blockingDb: [35, 45, 50] },
  brick_veneer: { absorption: [0.25, 0.06, 0.08], scattering: 0.10, blockingDb: [40, 55, 60] },
  siding_wall: { absorption: [0.25, 0.06, 0.08], scattering: 0.10, blockingDb: [30, 42, 50] },
} as const satisfies Record<string, Material>;

export type MaterialName = keyof typeof MATERIALS;

/** Added to a surface's absorption (set_furnishing levels). */
export const FURNISHING = { empty: 0, sparse: 0.08, furnished: 0.15, studio: 0.30 } as const;

export type RoomType =
  | 'kitchen' | 'dining' | 'living' | 'bedroom' | 'bathroom' | 'laundry'
  | 'hallway' | 'office' | 'closet' | 'garage' | 'other';

/** A blend of library materials; weights sum to 1. */
export type Mix = { material: MaterialName; weight: number }[];

const one = (material: MaterialName): Mix => [{ material, weight: 1 }];

/** The default finishes per room type (v2-design.md section 4.4). Typical US homes, not facts about a house. */
export const ROOM_TABLE: Record<RoomType, { floor: Mix; wall: Mix; ceiling: Mix; furnishing: keyof typeof FURNISHING }> = {
  kitchen: { floor: one('tile'), wall: one('drywall'), ceiling: one('drywall'), furnishing: 'sparse' },
  dining: { floor: one('wood_floor'), wall: one('drywall'), ceiling: one('drywall'), furnishing: 'sparse' },
  living: {
    floor: [{ material: 'wood_floor', weight: 0.7 }, { material: 'carpet', weight: 0.3 }],
    wall: one('drywall'), ceiling: one('drywall'), furnishing: 'furnished',
  },
  bedroom: { floor: one('carpet'), wall: one('drywall'), ceiling: one('drywall'), furnishing: 'furnished' },
  bathroom: {
    floor: one('tile'),
    wall: [{ material: 'drywall', weight: 0.6 }, { material: 'wall_tile', weight: 0.4 }],
    ceiling: one('drywall'), furnishing: 'empty',
  },
  laundry: { floor: one('vinyl'), wall: one('drywall'), ceiling: one('drywall'), furnishing: 'empty' },
  hallway: { floor: one('wood_floor'), wall: one('drywall'), ceiling: one('drywall'), furnishing: 'empty' },
  office: { floor: one('carpet'), wall: one('drywall'), ceiling: one('drywall'), furnishing: 'furnished' },
  closet: { floor: one('carpet'), wall: one('drywall'), ceiling: one('drywall'), furnishing: 'studio' },
  garage: { floor: one('concrete'), wall: one('drywall'), ceiling: one('drywall'), furnishing: 'empty' },
  other: { floor: one('wood_floor'), wall: one('drywall'), ceiling: one('drywall'), furnishing: 'furnished' },
};

/** Room type from a room's label, case-insensitive. First match wins; anything else is 'other'. */
export function roomType(name: string): RoomType {
  const n = name.toLowerCase();
  if (n.includes('kitchen')) return 'kitchen';
  if (n.includes('dining')) return 'dining';
  if (/living|family/.test(n)) return 'living';
  if (n.includes('bed')) return 'bedroom';
  if (n.includes('bath')) return 'bathroom';
  if (/laundry|utility/.test(n)) return 'laundry';
  if (/hall|entry|stair|foyer/.test(n)) return 'hallway';
  if (/office|study/.test(n)) return 'office';
  if (n.includes('closet')) return 'closet';
  if (n.includes('garage')) return 'garage';
  return 'other';
}
