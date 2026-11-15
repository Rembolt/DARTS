// The settings panel (v2-design.md section 9). Stub from Lane G; Lane K fills it in.

import type { Actions, SceneEffects } from '../scene/actions';
import type { MaterialDefaults } from '../scene/state';
import type { SceneStore } from '../scene/store';

export function startPanel(
  root: HTMLElement,
  deps: { store: SceneStore; actions: Actions; effects: SceneEffects; fetchDefaults(refresh: boolean): Promise<MaterialDefaults> },
): void {
  void root;
  void deps;
}
