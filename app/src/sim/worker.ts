// The simulation worker (mvp-design.md 2 and 5). Message dispatch only; the work lives in the modules it calls.
import { loadSim, type SimState } from './load';
import type { FromWorker, ToWorker } from './types';

let state: SimState | null = null;

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
      case 'trace':
        post({ type: 'error', message: state ? 'trace is not built yet (step 6)' : 'trace before load' });
        break;
      case 'reverb':
        post({ type: 'error', message: state ? 'reverb is not built yet (step 9)' : 'reverb before load' });
        break;
    }
  } catch (err) {
    post({ type: 'error', message: err instanceof Error ? err.message : String(err) });
  }
};
