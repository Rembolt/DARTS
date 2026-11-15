// The simulation worker (mvp-design.md 2 and 5). Message dispatch only; the work lives in the modules it calls.
import { loadSim, type SimState } from './load';
import { trace } from './trace';
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
        post(loaded.ready, [loaded.ready.lines.buffer]);
        break;
      }
      case 'trace': {
        if (!state) {
          post({ type: 'error', message: 'trace before load' });
          break;
        }
        const result = trace(state, msg);
        post(result, [result.paths.buffer, result.pathSource.buffer]);
        break;
      }
      case 'reverb':
        post({ type: 'error', message: state ? 'reverb is not built yet (step 9)' : 'reverb before load' });
        break;
    }
  } catch (err) {
    post({ type: 'error', message: err instanceof Error ? err.message : String(err) });
  }
};
