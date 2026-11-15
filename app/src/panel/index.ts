import type { Actions, SceneEffects } from '../scene/actions';
import type { MaterialDefaults } from '../scene/state';
import type { SceneStore } from '../scene/store';
import { createLayersSection } from './layers-section';
import { createMaterialsSection } from './materials-section';
import { createOpeningsSection } from './openings-section';
import './panel.css';
import { createPermissionsSection } from './permissions-section';
import { createSceneSection } from './scene-section';
import { createSourcesSection } from './sources-section';

const SECTION_FOR_KEY: Record<string, string> = {
  blends: 'materials',
  surfaces: 'materials',
  roomSurfaces: 'materials',
  defaults: 'materials',
  furnishing: 'materials',
  roomFurnishing: 'materials',
  sources: 'sources',
  openings: 'openings',
  meshLayers: 'layers',
  permissions: 'permissions',
};

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

  const getState = () => store.get();
  const sceneSec = createSceneSection({ actions, getState, fetchDefaults });
  const materialsSec = createMaterialsSection({ actions, effects, getState });
  const sourcesSec = createSourcesSection({ root, actions });
  const openingsSec = createOpeningsSection({ actions, effects, getState });
  const layersSec = createLayersSection({ actions, effects });
  const permissionsSec = createPermissionsSection({ actions, effects, getState });

  const sections: Record<string, HTMLElement> = {
    materials: materialsSec.el,
    sources: sourcesSec.el,
    openings: openingsSec.el,
    layers: layersSec.el,
    permissions: permissionsSec.el,
  };

  body.append(
    sceneSec.el,
    materialsSec.el,
    sourcesSec.el,
    openingsSec.el,
    layersSec.el,
    permissionsSec.el,
  );

  function flashChanged(changed: string[]) {
    const touched = new Set(changed.map(k => SECTION_FOR_KEY[k]).filter((s): s is string => !!s));
    for (const key of touched) {
      const el = sections[key];
      if (!el) continue;
      el.classList.remove('panel-flash');
      el.classList.add('panel-flash');
      setTimeout(() => el.classList.remove('panel-flash'), 1000);
    }
  }

  const renderAll = (scene = store.get()) => {
    sceneSec.render(scene);
    materialsSec.render(scene);
    sourcesSec.render(scene);
    openingsSec.render(scene);
    layersSec.render(scene);
    permissionsSec.render(scene);
  };

  renderAll();
  store.subscribe((scene, changed) => {
    renderAll(scene);
    flashChanged(changed);
  });
}
