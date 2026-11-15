// The listening features around the trace: heat map, probes, traffic and window trims, A/B compare, room names.
// main.ts owns the worker and the SDK; this module only asks for `field` measurements and writes the store.
import { effect } from '@preact/signals';
import type { AudioEngine } from '../audio/engine';
import type { FromWorker, ToWorker, Vec3 } from '../sim/types';
import { toDb } from './compass';
import { floorGrid, type FloorGrid } from './heat';
import { outdoorTrim } from './scenario';
import { heardOpenings, ui } from './store';

type FieldResult = Extract<FromWorker, { type: 'field' }>;
type Mesh = { positions: Float32Array; indices: Uint32Array; materials: Uint8Array };

export type FieldClient = {
  request(source: Vec3, points: Float32Array): Promise<FieldResult>;
  /** Feed every worker message here; returns true when it was a field answer. */
  onMessage(msg: FromWorker): boolean;
};

export function createFieldClient(post: (msg: ToWorker, transfer?: Transferable[]) => void): FieldClient {
  let id = 0;
  const pending = new Map<number, (r: FieldResult) => void>();
  return {
    request(source, points) {
      const myId = ++id;
      return new Promise(resolve => {
        pending.set(myId, resolve);
        const copy = points.slice();
        post({ type: 'field', id: myId, source, points: copy }, [copy.buffer]);
      });
    },
    onMessage(msg) {
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
  /** Hold A to compare: listen on the page and inside the tour's own window. */
  listenForCompare(win: Window): void;
};

const typing = (e: KeyboardEvent) => e.target instanceof HTMLElement && /^(INPUT|TEXTAREA|SELECT)$/.test(e.target.tagName);

export function installFeatures(deps: {
  field: FieldClient;
  mesh: () => Mesh | null;
  sources: () => { id: string; position: Vec3 }[] | null;
  audio: () => AudioEngine | null;
}): Features {
  // Traffic and windows: one trim on the outdoor sound, re-applied whenever either changes (or A is held).
  effect(() => {
    const t = outdoorTrim(heardOpenings(), ui.timeOfDay.value);
    deps.audio()?.setSourceTrim('outdoor', t.db, t.highDb);
  });

  // Heat map: street noise over this storey's floor.
  let heatAt: Vec3 | null = null;
  let heatBusy = false;
  const buildHeat = async (listener: Vec3) => {
    const mesh = deps.mesh();
    const outdoor = deps.sources()?.find(s => s.id === 'outdoor');
    if (!mesh || !outdoor || heatBusy) return;
    heatBusy = true;
    heatAt = listener;
    try {
      const grid: FloorGrid = floorGrid(mesh, listener);
      if (!grid.cells.length) return;
      const r = await deps.field.request(outdoor.position, grid.points);
      const db = new Float32Array(grid.cells.length);
      for (let i = 0; i < db.length; i++) db[i] = toDb(r.direct[i * 3 + 1]);
      ui.heat.value = { grid, db };
    } finally {
      heatBusy = false;
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
      });
    }
  });

  let labels = new Map<string, string>();
  let roomId: string | null = null;
  const showRoom = () => {
    if (!roomId) return;
    ui.room.value = { id: roomId, label: labels.get(roomId) || 'This room' };
  };

  return {
    onListener(listener) {
      const moved = heatAt ? Math.hypot(listener[0] - heatAt[0], listener[2] - heatAt[2]) : Infinity;
      const climbed = heatAt ? Math.abs(listener[1] - heatAt[1]) : Infinity;
      if (climbed > 1.2 || moved > 8) void buildHeat(listener);
    },
    onAudio(engine) {
      const t = outdoorTrim(heardOpenings(), ui.timeOfDay.value);
      engine.setSourceTrim('outdoor', t.db, t.highDb);
    },
    setRoom(id) {
      roomId = id;
      showRoom();
    },
    setRoomLabels(next) {
      labels = next;
      showRoom();
    },
    listenForCompare(win) {
      win.addEventListener('keydown', e => {
        if (e.key.toLowerCase() === 'a' && !e.repeat && !typing(e) && !e.metaKey && !e.ctrlKey && !e.altKey) ui.comparing.value = true;
      });
      win.addEventListener('keyup', e => {
        if (e.key.toLowerCase() === 'a') ui.comparing.value = false;
      });
      win.addEventListener('blur', () => (ui.comparing.value = false));
    },
  };
}
