// Page side of the simulation worker.
import type { ReadyMessage } from './load';
import type { FromWorker, SimConfig, ToWorker } from './types';

/** The part of `Worker` the client uses, so tests can pass a fake. */
export type WorkerLike = Pick<Worker, 'postMessage' | 'addEventListener' | 'removeEventListener' | 'terminate'>;

export type SimClient = {
  /** The one simulation worker. It keeps the mesh and ray index; later steps send it trace and reverb requests. */
  readonly worker: WorkerLike;
  /** Hand the mesh to the worker (the buffer is transferred, not copied). Rejects with a message ready to show. */
  load(obj: ArrayBuffer, config: SimConfig): Promise<ReadyMessage>;
  /** Stop the worker and free the mesh it holds. */
  terminate(): void;
};

const newWorker = (): WorkerLike => new Worker(new URL('./worker.ts', import.meta.url), { type: 'module' });

/** Start the simulation worker. Call once and keep the client: each call starts a worker that holds its own mesh. */
export function startSim(createWorker: () => WorkerLike = newWorker): SimClient {
  const worker = createWorker();
  return {
    worker,
    load(obj, config) {
      return new Promise((resolve, reject) => {
        const finish = (fn: () => void) => {
          worker.removeEventListener('message', onMessage);
          worker.removeEventListener('messageerror', onMessageError);
          worker.removeEventListener('error', onError);
          fn();
        };
        const onMessage = (event: Event) => {
          const msg = (event as MessageEvent<FromWorker>).data;
          if (msg.type === 'ready') finish(() => resolve(msg));
          else if (msg.type === 'error') finish(() => reject(new Error(msg.message)));
        };
        // Fires when a reply cannot be deserialized; without this the promise would never settle.
        const onMessageError = () => finish(() => reject(new Error('the worker sent a message the page could not read')));
        const onError = (event: Event) => {
          const message = (event as ErrorEvent).message;
          finish(() => reject(new Error(message || 'the worker crashed')));
        };
        worker.addEventListener('message', onMessage);
        worker.addEventListener('messageerror', onMessageError);
        worker.addEventListener('error', onError);
        const msg: ToWorker = { type: 'load', obj, config };
        worker.postMessage(msg, [obj]);
      });
    },
    terminate() {
      worker.terminate();
    },
  };
}

/** One line for the header, e.g. `Mesh: 116,539 triangles · 23,456 lines · loaded in 412 ms`. */
export function formatSimReady(ready: Pick<ReadyMessage, 'triangles' | 'lines' | 'loadMs'>): string {
  const n = (v: number) => v.toLocaleString('en-US');
  return `Mesh: ${n(ready.triangles)} triangles · ${n(ready.lines.length / 6)} lines · loaded in ${Math.round(ready.loadMs)} ms`;
}
