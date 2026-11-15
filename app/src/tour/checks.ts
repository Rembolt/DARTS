// The tour page's own load checks (v3-design.md 4.3, 4.4). Each answers a `NotPossible` from the contract, or null.
import { notPossible, type NotPossible, type PropertyStatus } from '../../../server/src/shared/contract';
import { getJson, type NotPossibleError } from '../api';

/** The tracer's timings were measured at 116,539 triangles; far beyond that it can't keep up (spec 4.4). */
export const MAX_TRIANGLES = 500_000;

type BrowserFeatures = { WebGLRenderingContext?: unknown; Worker?: unknown; AudioContext?: unknown };

/** WebGL, Web Worker and Web Audio, or the reason naming what is missing. */
export function browserSupport(win: BrowserFeatures = globalThis as BrowserFeatures): NotPossible | null {
  const missing = [
    !win.WebGLRenderingContext && 'WebGL',
    !win.Worker && 'Web Worker',
    !win.AudioContext && 'Web Audio',
  ].filter((m): m is string => Boolean(m));
  if (missing.length === 0) return null;
  const base = notPossible('browser_unsupported');
  return { ...base, message: `${base.message} Missing: ${missing.join(', ')}.` };
}

/** True for what `getJson` and `withTimeout` throw. */
export function isNotPossibleError(err: unknown): err is NotPossibleError {
  return typeof err === 'object' && err !== null && typeof (err as NotPossibleError).reason?.code === 'string';
}

/** The property's status from our server. Rejects with `{ reason }`, as `getJson` does. */
export function loadStatus(modelId: string, fetchFn?: typeof fetch): Promise<PropertyStatus> {
  return getJson<PropertyStatus>(`/api/property/${encodeURIComponent(modelId)}/status`, fetchFn);
}

/**
 * Can this property be entered? The status route's reason when it can't, or the request's own failure.
 * No room data is not a reason here: the tour still works without a summary.
 */
export async function checkProperty(modelId: string, fetchFn?: typeof fetch): Promise<NotPossible | null> {
  try {
    const status = await loadStatus(modelId, fetchFn);
    return status.canEnter ? null : (status.reason ?? notPossible('model_not_found'));
  } catch (err) {
    if (isNotPossibleError(err)) return err.reason;
    throw err;
  }
}

/** `promise`, or a rejection with `{ reason }` after `ms`. The timer is cleared when the promise settles. */
export function withTimeout<T>(promise: Promise<T>, ms: number, reason: NotPossible): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    const timer = setTimeout(() => reject({ reason } satisfies NotPossibleError), ms);
    promise.then(
      value => { clearTimeout(timer); resolve(value); },
      err => { clearTimeout(timer); reject(err); },
    );
  });
}

/** Zero triangles, or more than the tracer can handle, make the mesh unusable for sound. */
export function meshProblem(ready: { triangles: number }): NotPossible | null {
  return ready.triangles <= 0 || ready.triangles > MAX_TRIANGLES ? notPossible('mesh_unusable') : null;
}
