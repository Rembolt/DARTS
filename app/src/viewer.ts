import type { ServerConfig } from './api';

/** The fields we use from the Bundle's `Camera.Pose`. Rotation is in degrees. */
export type Pose = {
  position: { x: number; y: number; z: number };
  rotation: { x: number; y: number };
  mode: string;
};

/** The part of the Matterport SDK we use. Later steps add `Room`, `Pointer` and `Conversion`. */
export type MpSdk = {
  App: {
    Phase: { PLAYING: string };
    state: { waitUntil(cond: (s: { phase: string }) => boolean): Promise<unknown> };
  };
  Camera: { pose: { subscribe(cb: (pose: Pose) => void): { cancel(): void } } };
};

const START_TIMEOUT_MS = 60_000;
const START_TIMEOUT_MESSAGE = 'Viewer did not start: timed out after 60 s';

/** The address of the self-hosted viewer for this model. */
export function viewerUrl(config: ServerConfig): string {
  return `/bundle/showcase.html?m=${encodeURIComponent(config.modelId)}&applicationKey=${encodeURIComponent(config.sdkKey)}&play=1&qs=1`;
}

/** Thrown by `withTimeout` when time runs out. */
export class TimeoutError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'TimeoutError';
  }
}

/** Reject with a `TimeoutError` carrying `message` if `promise` has not settled after `ms`. */
export function withTimeout<T>(promise: Promise<T>, ms: number, message: string): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    const timer = setTimeout(() => reject(new TimeoutError(message)), ms);
    promise.then(
      value => {
        clearTimeout(timer);
        resolve(value);
      },
      (err: unknown) => {
        clearTimeout(timer);
        reject(err);
      },
    );
  });
}

type MpSdkGlobal = { connect(win: Window): Promise<MpSdk> };

async function connect(iframe: HTMLIFrameElement): Promise<MpSdk> {
  await new Promise<void>(resolve => iframe.addEventListener('load', () => resolve(), { once: true }));
  const win = iframe.contentWindow as (Window & { MP_SDK?: MpSdkGlobal }) | null;
  if (!win?.MP_SDK) throw new Error('the viewer page did not load the SDK');
  const sdk = await win.MP_SDK.connect(win);
  await sdk.App.state.waitUntil(s => s.phase === sdk.App.Phase.PLAYING);
  return sdk;
}

/** The text to show when the viewer fails to start. Never `[object Object]`. */
export function startFailureMessage(err: unknown): string {
  if (err instanceof TimeoutError) return err.message;
  let detail = 'unknown error';
  if (err instanceof Error) detail = err.message;
  else if (typeof err === 'string' || typeof err === 'number' || typeof err === 'boolean') detail = String(err);
  return `Viewer did not start: ${detail}`;
}

/** Connect to the SDK inside the viewer iframe and wait until the tour is playing. Rejects with a message ready to show. */
export async function connectViewer(iframe: HTMLIFrameElement): Promise<MpSdk> {
  try {
    return await withTimeout(connect(iframe), START_TIMEOUT_MS, START_TIMEOUT_MESSAGE);
  } catch (err) {
    throw new Error(startFailureMessage(err));
  }
}

/** One line for the header, e.g. `x 1.23  y 1.50  z -0.40 m  ·  pitch -10.0°  yaw 45.3°  ·  inside`. */
export function formatPose(pose: Pose): string {
  const { position: p, rotation: r } = pose;
  const mode = pose.mode.replace(/^mode\./, '');
  return `x ${p.x.toFixed(2)}  y ${p.y.toFixed(2)}  z ${p.z.toFixed(2)} m  ·  pitch ${r.x.toFixed(1)}°  yaw ${r.y.toFixed(1)}°  ·  ${mode}`;
}
