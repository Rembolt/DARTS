// Jev's permission rules (v2-design.md sections 6.2 and 6.3). Enforced in code: Lane L sends only allowed tools and
// checks `refusal` again before running each call. The settings panel calls actions without these checks.

import { isMaterialName, PERMISSION_ROWS, PUT_ROWS, type PermissionRow, type Permissions, type PutRow } from './state';

export type ActionName = 'set_material' | 'set_furnishing' | 'set_opening' | 'place_speaker' | 'move_speaker' | 'set_speaker'
  | 'remove_speaker' | 'move_user_to' | 'set_mesh_layer' | 'measure' | 'compare';
export type OpeningKind = 'window' | 'door';

export const ACTION_NAMES: ActionName[] = ['set_material', 'set_furnishing', 'set_opening', 'place_speaker', 'move_speaker', 'set_speaker',
  'remove_speaker', 'move_user_to', 'set_mesh_layer', 'measure', 'compare'];

/** Row names as the user reads them in the panel. */
export const ROW_NAMES: Record<PermissionRow, string> = {
  materials: 'Materials', furnishing: 'Furnishing', windows: 'Windows', doors: 'Doors', speakers: 'Speakers',
  locations: 'Locations', userLocation: 'User location', mesh: 'Mesh', measurements: 'Measurements',
};
const materialRow = (m: string | undefined) => `Material: ${m ?? '(none)'}`;
const layerRow = (l: string | undefined) => `Mesh layer: ${l ?? '(none)'}`;
const put = (p: Permissions, row: PutRow): string | null => (p.put[row] ? null : ROW_NAMES[row]);

/** null = allowed. Otherwise the row to enable, as the user reads it: 'Windows', 'Material: tile', 'Mesh layer: type002'. */
export function refusal(p: Permissions, action: ActionName, args: { material?: string; layer?: string; openingKind?: OpeningKind | 'all' }): string | null {
  switch (action) {
    case 'set_material':
      return isMaterialName(args.material) && p.putMaterial[args.material] === true ? null : materialRow(args.material);
    case 'set_furnishing':
      return put(p, 'furnishing');
    case 'set_opening': {
      const kind = args.openingKind ?? 'all';
      const off = [kind !== 'door' && put(p, 'windows'), kind !== 'window' && put(p, 'doors')].filter((r): r is string => !!r);
      return off.length ? off.join(', ') : null;
    }
    case 'place_speaker': case 'move_speaker': case 'set_speaker': case 'remove_speaker':
      return put(p, 'speakers');
    case 'move_user_to':
      return put(p, 'userLocation');
    case 'set_mesh_layer':
      return args.layer !== undefined && p.putLayer[args.layer] === true ? null : layerRow(args.layer);
    case 'measure': case 'compare':
      return p.get.measurements ? null : ROW_NAMES.measurements;
  }
}

/** Library names whose PUT is on. */
export function allowedMaterials(p: Permissions): string[] {
  return Object.keys(p.putMaterial).filter(m => isMaterialName(m) && p.putMaterial[m] === true);
}

/** An action with no way to pass is absent. */
export function allowedActions(p: Permissions): ActionName[] {
  return ACTION_NAMES.filter(a => {
    if (a === 'set_material') return allowedMaterials(p).length > 0;
    if (a === 'set_mesh_layer') return Object.values(p.putLayer).some(v => v === true);
    if (a === 'set_opening') return p.put.windows || p.put.doors;
    return refusal(p, a, {}) === null;
  });
}

/** Display names of rows that are off. Layers are listed only when the scene has a row for them. */
export function offRows(p: Permissions): { get: string[]; put: string[] } {
  return {
    get: PERMISSION_ROWS.filter(r => !p.get[r]).map(r => ROW_NAMES[r]),
    put: [
      ...PUT_ROWS.filter(r => !p.put[r]).map(r => ROW_NAMES[r]),
      ...Object.entries(p.putMaterial).filter(([m, on]) => isMaterialName(m) && !on).map(([m]) => materialRow(m)),
      ...Object.entries(p.putLayer).filter(([, on]) => !on).map(([l]) => layerRow(l)),
    ],
  };
}
