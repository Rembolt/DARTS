// Page side of the simulation worker.
import type { ReadyMessage } from './load';
import type { FromWorker, SimConfig, ToWorker } from './types';

export type SimClient = {
  /** Hand the mesh to the worker (the buffer is transferred, not copied). Rejects with the worker's message. */
  load(obj: ArrayBuffer, config: SimConfig): Promise<ReadyMessage>;
};

export function startSim(): SimClient {
  const worker = new Worker(new URL('./worker.ts', import.meta.url), { type: 'module' });
  return {
    load(obj, config) {
      return new Promise((resolve, reject) => {
        const onMessage = (event: MessageEvent<FromWorker>) => {
          const msg = event.data;
          if (msg.type !== 'ready' && msg.type !== 'error') return;
          cleanup();
          if (msg.type === 'ready') resolve(msg);
          else reject(new Error(msg.message));
        };
        const onError = (event: ErrorEvent) => {
          cleanup();
          reject(new Error(event.message || 'the worker crashed'));
        };
        const cleanup = () => {
          worker.removeEventListener('message', onMessage);
          worker.removeEventListener('error', onError);
        };
        worker.addEventListener('message', onMessage);
        worker.addEventListener('error', onError);
        const msg: ToWorker = { type: 'load', obj, config };
        worker.postMessage(msg, [obj]);
      });
    },
  };
}

/** One line for the header, e.g. `Mesh: 116,539 triangles · 23,456 lines · loaded in 412 ms`. */
export function formatSimReady(ready: Pick<ReadyMessage, 'triangles' | 'lines' | 'loadMs'>): string {
  const n = (v: number) => v.toLocaleString('en-US');
  return `Mesh: ${n(ready.triangles)} triangles · ${n(ready.lines.length / 6)} lines · loaded in ${Math.round(ready.loadMs)} ms`;
}
