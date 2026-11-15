import type { SceneEffects } from '../scene/actions';
import { isSuggested } from '../scene/materials';
import { offRows } from '../scene/permissions';
import { ROOM_SURFACE_CLASSES, SURFACE_CLASSES, type SceneState } from '../scene/state';
import { formatMeasurement } from './executor';

const r2 = (n: number) => Math.round(n * 100) / 100;
const rVec = (v: [number, number, number]) => [r2(v[0]), r2(v[1]), r2(v[2])];

/** Build the per-turn JSON scene summary from GET-allowed rows only (spec 6.3, 6.4). */
export function sceneSummary(scene: SceneState, effects: SceneEffects): object {
  const g = scene.permissions.get;
  const out: Record<string, unknown> = {};

  if (g.userLocation) {
    const l = effects.listener();
    out.userLocation = l ? { roomId: l.roomId, position: rVec(l.position) } : null;
  }

  if (g.locations) {
    out.locations = effects.rooms().map(r => ({
      id: r.id,
      name: r.name,
      floor: r.floor,
      area: r2(r.area),
    }));
  }

  if (g.speakers) {
    out.speakers = scene.sources.map(s => ({
      id: s.id,
      label: s.label,
      kind: s.kind,
      sound: s.sound,
      levelDb: r2(s.levelDb),
      enabled: s.enabled,
      pos: rVec(s.position),
    }));
  }

  if (g.measurements) {
    out.measurements = formatMeasurement(effects.current());
  }

  if (g.materials) {
    const reasons: Record<string, string> = {};
    for (const cls of SURFACE_CLASSES) {
      const sug = isSuggested(scene, cls);
      if (sug.suggested && sug.reason) reasons[cls] = sug.reason;
    }
    if (effects.roomsTagged()) {
      for (const room of effects.rooms()) {
        for (const cls of ROOM_SURFACE_CLASSES) {
          const sug = isSuggested(scene, cls, room.id);
          if (sug.suggested && sug.reason) reasons[`${room.id}.${cls}`] = sug.reason;
        }
      }
    }
    out.materials = {
      surfaces: scene.surfaces,
      ...(Object.keys(scene.roomSurfaces).length ? { roomSurfaces: scene.roomSurfaces } : {}),
      ...(Object.keys(reasons).length ? { reasons } : {}),
    };
  }

  if (g.furnishing) {
    out.furnishing = {
      house: r2(scene.furnishing),
      ...(Object.keys(scene.roomFurnishing).length ? { rooms: scene.roomFurnishing } : {}),
    };
  }

  if (g.windows) {
    out.windows = effects
      .openings()
      .filter(o => o.kind === 'window')
      .map(o => ({
        id: o.id,
        room: o.roomName,
        width: r2(o.width),
        closed: scene.openings.closed[o.id] === true,
      }));
  }

  if (g.doors) {
    out.doors = effects
      .openings()
      .filter(o => o.kind === 'door')
      .map(o => ({
        id: o.id,
        room: o.roomName,
        width: r2(o.width),
        closed: scene.openings.closed[o.id] === true,
      }));
  }

  if (g.mesh) {
    out.mesh = {
      layers: effects.layers().map(l => {
        const state = scene.meshLayers[l.id] ?? { traced: true, shown: true };
        return { id: l.id, triangles: l.triangles, traced: state.traced, shown: state.shown };
      }),
    };
  }

  out.off = offRows(scene.permissions);
  return out;
}
