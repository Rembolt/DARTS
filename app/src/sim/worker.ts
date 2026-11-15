// The simulation worker (mvp-design.md 2 and 5). Message dispatch only; the work lives in the modules it calls.
import { applySetLayers } from './layers';
import { applySetMaterials, applySetQuality } from './library';
import { loadSim, type SimState } from './load';
import { reverbJob } from './reverb-job';
import { trace } from './trace';
import type { Bands, FromWorker, ToWorker } from './types';

let state: SimState | null = null;
let lastEstimate: Bands | null = null;

function post(msg: FromWorker, transfer: Transferable[] = []): void {
  (self as unknown as Worker).postMessage(msg, transfer);
}

/** The loaded state, or an error naming the message that came too early (posted by the catch below). */
function need(what: string): SimState {
  if (!state) throw new Error(`${what} before load`);
  return state;
}

self.onmessage = (event: MessageEvent<ToWorker>) => {
  const msg = event.data;
  try {
    switch (msg.type) {
      case 'load': {
        const loaded = loadSim(msg.obj, msg.config);
        state = loaded.state;
        const { lines, mesh, lineLayers } = loaded.ready;
        post(loaded.ready, [lines.buffer, mesh.positions.buffer, mesh.indices.buffer, mesh.materials.buffer, mesh.layers.buffer, lineLayers.buffer]);
        break;
      }
      case 'trace': {
        if (!state) {
          post({ type: 'error', message: 'trace before load' });
          break;
        }
        const result = trace(state, msg);
        lastEstimate = result.echoTimeEstimate;
        post(result, [result.paths.buffer, result.pathSource.buffer]);
        break;
      }
      case 'reverb': {
        if (!state) {
          post({ type: 'error', message: 'reverb before load' });
          break;
        }
        // A band the decay can't fit falls back to the last trace's estimate (5.5).
        post(reverbJob(state, msg, lastEstimate ?? undefined));
        break;
      }
      // V2 settings (v2-design.md 8). They change the state only; the page sends a fresh trace after each.
      case 'setMaterials':
        applySetMaterials(need(msg.type), msg);
        break;
      case 'setQuality':
        applySetQuality(need(msg.type), msg);
        break;
      case 'setLayers':
        applySetLayers(need(msg.type), msg);
        break;
    }
  } catch (err) {
    post({ type: 'error', message: err instanceof Error ? err.message : String(err) });
  }
};
