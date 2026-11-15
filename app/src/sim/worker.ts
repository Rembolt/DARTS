// The simulation worker (mvp-design.md 2 and 5). Message dispatch only; the work lives in the modules it calls.
import { loadSim, type SimState } from './load';
import { reverbJob } from './reverb-job';
import { trace } from './trace';
import type { Bands, FromWorker, ToWorker } from './types';

let state: SimState | null = null;
let lastEstimate: Bands | null = null;

function post(msg: FromWorker, transfer: Transferable[] = []): void {
  (self as unknown as Worker).postMessage(msg, transfer);
}

self.onmessage = (event: MessageEvent<ToWorker>) => {
  const msg = event.data;
  try {
    switch (msg.type) {
      case 'load': {
        const loaded = loadSim(msg.obj, msg.config);
        state = loaded.state;
        const { lines, mesh } = loaded.ready;
        post(loaded.ready, [lines.buffer, mesh.positions.buffer, mesh.indices.buffer, mesh.materials.buffer]);
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
    }
  } catch (err) {
    post({ type: 'error', message: err instanceof Error ? err.message : String(err) });
  }
};
