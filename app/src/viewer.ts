import type { ServerConfig } from './api';

/** The fields we use from the Bundle's `Camera.Pose`. Rotation is in degrees. */
export type Pose = {
  position: { x: number; y: number; z: number };
  rotation: { x: number; y: number };
  mode: string;
  /** The tour's 4×4 projection matrix (16 values), as the Bundle's `Camera.Pose.projection`. */
  projection: ArrayLike<number>;
};

/** The part of the Matterport SDK we use. */
export type MpSdk = {
  /** The rooms the camera is in; empty between rooms or outside the inside view. Keys the reverb cache. */
  Room: { current: { subscribe(cb: (current: { rooms: { id: string }[] }) => void): { cancel(): void } } };
  /** What is under the cursor in the tour; the P key logs it to pick a source position. */
  Pointer: {
    intersection: {
      subscribe(cb: (hit: { position: { x: number; y: number; z: number }; object: string }) => void): { cancel(): void };
    };
  };
  App: {
    Phase: { PLAYING: string };
    state: { waitUntil(cond: (s: { phase: string }) => boolean): Promise<unknown> };
  };
  Camera: {
    pose: { subscribe(cb: (pose: Pose) => void): { cancel(): void } };
    rotate(horizontal: number, vertical: number, options?: { speed?: number }): Promise<void>;
  };
  Conversion: {
    worldToScreen(
      worldPos: { x: number; y: number; z: number },
      cameraPose: Pose,
      windowSize: { w: number; h: number },
    ): { x: number; y: number; z: number };
  };
  Mode: { Mode: Record<string, string>; moveTo(mode: string): Promise<string> };
  Sweep: { current: { subscribe(cb: (sweep: { sid?: string; id?: string }) => void): { cancel(): void } }; moveTo(sweepId: string, options?: { transition?: string; transitionTime?: number }): Promise<string> };
};

const SLOW_START_MS = 60_000;
export const SLOW_START_MESSAGE = 'Tour is taking longer than 60 s to start; still waiting…';

/** The address of the self-hosted viewer for this model. */
export function viewerUrl(config: ServerConfig): string {
  return `/bundle/showcase.html?m=${encodeURIComponent(config.modelId)}&applicationKey=${encodeURIComponent(config.sdkKey)}&play=1&qs=1`;
}

/**
 * Call `onSlow` once if `promise` has not settled after `ms`, but keep waiting for it: a slow tour that starts late
 * still connects. Returns `promise` unchanged.
 */
export function notifyIfSlow<T>(promise: Promise<T>, ms: number, onSlow: () => void): Promise<T> {
  const timer = setTimeout(onSlow, ms);
  const clear = () => clearTimeout(timer);
  promise.then(clear, clear);
  return promise;
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
  let detail = 'unknown error';
  if (err instanceof Error) detail = err.message;
  else if (typeof err === 'string' || typeof err === 'number' || typeof err === 'boolean') detail = String(err);
  return `Viewer did not start: ${detail}`;
}

/**
 * Connect to the SDK inside the viewer iframe and wait until the tour is playing, however long it takes.
 * `onSlow` gets a message ready to show if that takes more than 60 s. Rejects with a message ready to show.
 */
export async function connectViewer(iframe: HTMLIFrameElement, onSlow: (message: string) => void = () => {}): Promise<MpSdk> {
  try {
    return await notifyIfSlow(connect(iframe), SLOW_START_MS, () => onSlow(SLOW_START_MESSAGE));
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
