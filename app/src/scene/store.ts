// The one SceneState of the page. Only app/src/scene/actions.ts calls `set` (v2-design.md section 2).

import type { SceneState } from './state';

export type SceneStore = {
  get(): SceneState;
  set(next: SceneState, changed: string[]): void;
  subscribe(fn: (state: SceneState, changed: string[]) => void): () => void;
};

/** `onChange` runs on every set, before subscribers: the tour passes autosave here. */
export function createStore(initial: SceneState, onChange?: (s: SceneState) => void): SceneStore {
  let state = initial;
  const subscribers = new Set<(state: SceneState, changed: string[]) => void>();
  return {
    get: () => state,
    set(next, changed) {
      state = next;
      onChange?.(next);
      for (const fn of [...subscribers]) fn(next, changed);
    },
    subscribe(fn) {
      subscribers.add(fn);
      return () => { subscribers.delete(fn); };
    },
  };
}
