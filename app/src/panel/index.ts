import type { Actions, SceneEffects } from '../scene/actions';
import type { MaterialDefaults } from '../scene/state';
import type { SceneStore } from '../scene/store';
import { createMaterialsSection } from './materials-section';
import './panel.css';
import { createSceneSection } from './scene-section';

export function startPanel(
  root: HTMLElement,
  deps: {
    store: SceneStore;
    actions: Actions;
    effects: SceneEffects;
    fetchDefaults(refresh: boolean): Promise<MaterialDefaults>;
  },
): void {
  const { store, actions, effects, fetchDefaults } = deps;
  root.classList.add('panel');
  root.innerHTML = `
    <div class="panel-header">
      <strong>Settings</strong>
      <button type="button" data-role="collapse-panel" aria-expanded="true">Collapse</button>
    </div>
    <div class="panel-body"></div>
  `;

  const collapseBtn = root.querySelector<HTMLButtonElement>('[data-role="collapse-panel"]')!;
  const body = root.querySelector<HTMLElement>('.panel-body')!;

  collapseBtn.addEventListener('click', () => {
    const collapsed = root.classList.toggle('collapsed');
    collapseBtn.setAttribute('aria-expanded', String(!collapsed));
    collapseBtn.textContent = collapsed ? 'Expand' : 'Collapse';
  });

  const sceneSec = createSceneSection({
    actions,
    getState: () => store.get(),
    fetchDefaults,
  });
  const materialsSec = createMaterialsSection({
    actions,
    effects,
    getState: () => store.get(),
  });

  body.append(sceneSec.el, materialsSec.el);

  const renderAll = (scene = store.get()) => {
    sceneSec.render(scene);
    materialsSec.render(scene);
  };

  renderAll();
  store.subscribe(scene => renderAll(scene));
}
