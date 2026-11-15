// Jev, the agent (v2-design.md section 6). Stub from Lane G; Lane L fills it in.

import type { Actions, SceneEffects } from '../scene/actions';
import type { SceneStore } from '../scene/store';

export function startJev(root: HTMLElement, deps: { store: SceneStore; actions: Actions; effects: SceneEffects; fetch?: typeof fetch }): void {
  void root;
  void deps;
}
