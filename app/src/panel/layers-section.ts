import type { Actions, SceneEffects } from '../scene/actions';
import type { SceneState } from '../scene/state';

export function createLayersSection(deps: {
  actions: Actions;
  effects: SceneEffects;
}): { el: HTMLElement; render: (scene: SceneState) => void } {
  const { actions, effects } = deps;
  const el = document.createElement('section');
  el.className = 'panel-section';
  el.dataset.section = 'layers';
  el.innerHTML = `
    <h3>Mesh layers</h3>
    <div data-role="layers-list"></div>
    <p class="panel-note">Layer names are guesses from height. Hiding one may remove walls.</p>
  `;

  const listEl = el.querySelector<HTMLElement>('[data-role="layers-list"]')!;

  function render(scene: SceneState) {
    listEl.innerHTML = '';
    for (const layer of effects.layers()) {
      const cur = scene.meshLayers[layer.id] ?? { traced: true, shown: true };
      const row = document.createElement('div');
      row.className = 'panel-row';
      row.dataset.layerRow = layer.id;

      const label = document.createElement('span');
      label.textContent = `${layer.id} (${layer.triangles.toLocaleString()})`;

      const traced = document.createElement('input');
      traced.type = 'checkbox';
      traced.checked = cur.traced;
      traced.title = 'Traced';
      traced.dataset.layerTraced = layer.id;
      traced.addEventListener('change', () => {
        void actions.setMeshLayer({ layer: layer.id, traced: traced.checked });
      });

      const shown = document.createElement('input');
      shown.type = 'checkbox';
      shown.checked = cur.shown;
      shown.title = 'Shown';
      shown.dataset.layerShown = layer.id;
      shown.addEventListener('change', () => {
        void actions.setMeshLayer({ layer: layer.id, shown: shown.checked });
      });

      row.append(label, traced, shown);
      listEl.append(row);
    }
  }

  return { el, render };
}
