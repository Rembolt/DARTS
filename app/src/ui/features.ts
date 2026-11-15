// The listening features around the trace: heat map, probes, traffic and window trims, A/B compare, room names.
// main.ts owns the worker and the SDK; this module only asks for `field` measurements and writes the store.
import { effect } from '@preact/signals';
import type { AudioEngine } from '../audio/engine';
import type { FromWorker, ToWorker, Vec3 } from '../sim/types';
import { toDb } from './compass';
import { onKeyDown, onKeyUp, onWindowBlur, plain } from './keys';
import { floorGrid, type FloorGrid } from './heat';
import { outdoorTrim } from './scenario';
import { heardOpenings, isOutdoorSource, ui } from './store';

type FieldResult = Extract<FromWorker, { type: 'field' }>;
type Mesh = { positions: Float32Array; indices: Uint32Array; materials: Uint8Array };

type WallsResult = Extract<FromWorker, { type: 'walls' }>;

export type FieldClient = {
  request(source: Vec3, points: Float32Array): Promise<FieldResult>;
  /** The walls between two points, nearest `from` first. */
  walls(from: Vec3, to: Vec3): Promise<WallsResult['walls']>;
  /** Feed every worker message here; returns true when it was a field answer. */
  onMessage(msg: FromWorker): boolean;
};

const FIELD_TIMEOUT_MS = 10_000;

export function createFieldClient(post: (msg: ToWorker, transfer?: Transferable[]) => void): FieldClient {
  let id = 0;
  const pending = new Map<number, (r: FieldResult) => void>();
  const pendingWalls = new Map<number, (r: WallsResult['walls']) => void>();
  return {
    // The worker reports a failed job without its id, and answers nothing before the mesh is loaded: an unanswered
    // request ends by itself, so whoever waits (the heat map, the wall badges, a probe) can try again.
    walls(from, to) {
      const myId = ++id;
      return new Promise((resolve, reject) => {
        const timer = setTimeout(() => (pendingWalls.delete(myId), reject(new Error('walls request not answered'))), FIELD_TIMEOUT_MS);
        pendingWalls.set(myId, r => (clearTimeout(timer), resolve(r)));
        post({ type: 'walls', id: myId, from, to });
      });
    },
    request(source, points) {
      const myId = ++id;
      return new Promise((resolve, reject) => {
        const timer = setTimeout(() => (pending.delete(myId), reject(new Error('field request not answered'))), FIELD_TIMEOUT_MS);
        pending.set(myId, r => (clearTimeout(timer), resolve(r)));
        const copy = points.slice();
        post({ type: 'field', id: myId, source, points: copy }, [copy.buffer]);
      });
    },
    onMessage(msg) {
      if (msg.type === 'walls') {
        pendingWalls.get(msg.id)?.(msg.walls);
        pendingWalls.delete(msg.id);
        return true;
      }
      if (msg.type !== 'field') return false;
      pending.get(msg.id)?.(msg);
      pending.delete(msg.id);
      return true;
    },
  };
}

export type Features = {
  /** Call when the listener moves: rebuilds the heat map when it changes storey or walks far. */
  onListener(listener: Vec3): void;
  /** Call when the audio engine starts, so it gets the current trims at once. */
  onAudio(engine: AudioEngine): void;
  setRoom(id: string): void;
  setRoomLabels(labels: Map<string, string>): void;
  /** Hold A to compare. Keys come from ui/keys.ts, which listens on the page and the tour's window. */
  listenForCompare(): void;
  /** Something the numbers depend on changed (an opening, a material, a source): measure the heat map and the probes again. */
  invalidate(): void;
};

export function installFeatures(deps: {
  field: FieldClient;
  mesh: () => Mesh | null;
  sources: () => { id: string; position: Vec3 }[] | null;
  audio: () => AudioEngine | null;
}): Features {
  const applyOutdoorTrim = (engine: AudioEngine | null, db: number, highDb: number) => {
    if (!engine) return;
    const outdoorIds = new Set((deps.sources() ?? []).filter(s => isOutdoorSource(s.id)).map(s => s.id));
    if (outdoorIds.size === 0) outdoorIds.add('outdoor');
    for (const id of outdoorIds) engine.setSourceTrim(id, db, highDb);
  };

  // Traffic and windows: one trim on the outdoor sound, re-applied whenever either changes (or A is held).
  effect(() => {
    const t = outdoorTrim(heardOpenings(), ui.timeOfDay.value);
    applyOutdoorTrim(deps.audio(), t.db, t.highDb);
  });

  // Heat map: street noise over this storey's floor.
  let heatAt: Vec3 | null = null;
  let heatBusy = false;
  let heatAgain = false; // asked for while one was being built: build once more when it ends
  let lastListener: Vec3 | null = null;
  const buildHeat = async (listener: Vec3) => {
    const mesh = deps.mesh();
    const srcs = deps.sources();
    const outdoor = srcs?.find(s => isOutdoorSource(s.id)) ?? srcs?.[0];
    if (!mesh || !outdoor) return;
    if (heatBusy) {
      heatAgain = true;
      return;
    }
    heatBusy = true;
    heatAt = listener;
    try {
      const grid: FloorGrid = floorGrid(mesh, listener);
      if (!grid.cells.length) return;
      const r = await deps.field.request(outdoor.position, grid.points);
      const db = new Float32Array(grid.cells.length);
      for (let i = 0; i < db.length; i++) db[i] = toDb(r.direct[i * 3 + 1]);
      ui.heat.value = { grid, db };
    } catch (err) {
      heatAt = null; // not answered: the next move tries again
      console.warn('heat map:', err instanceof Error ? err.message : err);
    } finally {
      heatBusy = false;
      if (heatAgain) {
        heatAgain = false;
        if (lastListener) void buildHeat(lastListener);
      }
    }
  };

  // Probes: measure each new one against every source.
  const measuring = new Set<string>();
  effect(() => {
    const srcs = deps.sources();
    for (const p of ui.probes.value) {
      if (p.readings || measuring.has(p.id) || !srcs) continue;
      measuring.add(p.id);
      const point = Float32Array.from(p.position);
      Promise.all(srcs.map(s => deps.field.request(s.position, point))).then(results => {
        const readings = results.map((r, i) => ({
          sourceId: srcs[i].id,
          db: toDb(r.direct[1]),
          walls: r.walls[0],
          bands: [r.direct[0], r.direct[1], r.direct[2]] as [number, number, number],
        }));
        ui.probes.value = ui.probes.value.map(x => (x.id === p.id ? { ...x, readings } : x));
        measuring.delete(p.id);
      }).catch(() => {
        measuring.delete(p.id); // not answered (the mesh is still loading): measured on the next refresh
      });
    }
  });

  let refreshTimer: ReturnType<typeof setTimeout> | undefined;
  let labels = new Map<string, string>();
  let roomId: string | null = null;
  const showRoom = () => {
    if (!roomId) return;
    ui.room.value = { id: roomId, label: labels.get(roomId) || 'This room' };
  };

  return {
    onListener(listener) {
      lastListener = listener;
      const moved = heatAt ? Math.hypot(listener[0] - heatAt[0], listener[2] - heatAt[2]) : Infinity;
      const climbed = heatAt ? Math.abs(listener[1] - heatAt[1]) : Infinity;
      if (climbed > 1.2 || moved > 8) void buildHeat(listener);
    },
    onAudio(engine) {
      const t = outdoorTrim(heardOpenings(), ui.timeOfDay.value);
      applyOutdoorTrim(engine, t.db, t.highDb);
    },
    setRoom(id) {
      roomId = id;
      showRoom();
    },
    setRoomLabels(next) {
      labels = next;
      showRoom();
    },
    invalidate() {
      // Many changes arrive together (a slider, "close all the windows"): one refresh after they settle.
      clearTimeout(refreshTimer);
      refreshTimer = setTimeout(() => {
        if (lastListener) void buildHeat(lastListener);
        if (ui.probes.value.some(p => p.readings)) ui.probes.value = ui.probes.value.map(p => ({ ...p, readings: null }));
        else ui.probes.value = [...ui.probes.value]; // probes still unmeasured get another try
      }, 200);
    },
    listenForCompare() {
      onKeyDown(e => {
        if (!plain(e, 'a')) return;
        ui.comparing.value = true;
        return true;
      });
      onKeyUp(e => {
        if (e.key.toLowerCase() !== 'a') return;
        ui.comparing.value = false;
        return true;
      });
      onWindowBlur(() => (ui.comparing.value = false));
    },
  };
}
