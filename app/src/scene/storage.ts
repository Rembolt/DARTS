// Autosave in localStorage and the scene file (v2-design.md section 3.1).
// Every storage access is in try/catch: private windows and blocked site data make it throw.

import { normaliseScene, type SceneState } from './state';

export function autosaveKey(modelId: string): string {
  return `scene:${modelId}`;
}

/** The given storage, else the page's localStorage, else null. Reading `localStorage` itself can throw. */
function resolveStorage(storage?: Storage): Storage | null {
  if (storage) return storage;
  try {
    return typeof localStorage === 'undefined' ? null : localStorage;
  } catch {
    return null;
  }
}

/** Never throws. */
export function saveAutosave(scene: SceneState, storage?: Storage): void {
  try {
    resolveStorage(storage)?.setItem(autosaveKey(scene.modelId), JSON.stringify(scene));
  } catch {
    // Storage blocked or full: the scene still lives in the page.
  }
}

/** The saved scene for this property, or null when there is none, it is unreadable, or storage is blocked. */
export function loadAutosave(modelId: string, storage?: Storage): SceneState | null {
  let text: string | null;
  try {
    text = resolveStorage(storage)?.getItem(autosaveKey(modelId)) ?? null;
  } catch {
    return null;
  }
  if (text === null) return null;
  const r = parseSceneFile(text, modelId);
  if (!('scene' in r)) return null;
  // One-time: scenes saved before "User location" became on by default would keep refusing "take me to the kitchen".
  // Switching it on once is safe; a later choice to turn it off in Settings is kept.
  try {
    const store = resolveStorage(storage);
    if (store && store.getItem(`${PERM_MIGRATION}:${modelId}`) === null) {
      r.scene.permissions.put.userLocation = true;
      store.setItem(`${PERM_MIGRATION}:${modelId}`, "1");
    }
  } catch {
    /* storage blocked: the scene is used as saved */
  }
  return r.scene;
}

const PERM_MIGRATION = 'acoustic:perm-userlocation-1';

/** 'scene-<modelId>-<YYYY-MM-DD>.json', with the UTC date. */
export function sceneFileName(modelId: string, date: Date): string {
  return `scene-${modelId}-${date.toISOString().slice(0, 10)}.json`;
}

export function parseSceneFile(text: string, modelId: string): { scene: SceneState } | { error: string } {
  let raw: unknown;
  try {
    raw = JSON.parse(text);
  } catch {
    return { error: 'This file is not a scene file (not JSON).' };
  }
  return normaliseScene(raw, modelId);
}
