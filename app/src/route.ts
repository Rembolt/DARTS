import { MODEL_ID_PATTERN } from '../../server/src/shared/contract';

/** Which of the page's two states to show: the front door, or the tour of one property. */
export type Route = { state: 'front' } | { state: 'tour'; modelId: string };

export const FRONT_URL = '/';

/** '?m=<valid id>' opens the tour; anything else (no id, a malformed id) is the front door. */
export function readRoute(search: string): Route {
  const id = new URLSearchParams(search).get('m');
  return id !== null && MODEL_ID_PATTERN.test(id) ? { state: 'tour', modelId: id } : { state: 'front' };
}

export function tourUrl(modelId: string): string {
  return `/?m=${encodeURIComponent(modelId)}`;
}
