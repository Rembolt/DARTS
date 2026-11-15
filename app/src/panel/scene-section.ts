import type { Actions } from '../scene/actions';
import { type MaterialDefaults, type Quality, type SceneState } from '../scene/state';
import { parseSceneFile, sceneFileName } from '../scene/storage';

const QUALITIES: Quality[] = ['fast', 'normal', 'high'];

export type SceneSectionDeps = {
  actions: Actions;
  getState: () => SceneState;
  fetchDefaults: (refresh: boolean) => Promise<MaterialDefaults>;
};

export function createSceneSection(deps: SceneSectionDeps): {
  el: HTMLElement;
  render: (scene: SceneState) => void;
} {
  const { actions, getState, fetchDefaults } = deps;
  const el = document.createElement('section');
  el.className = 'panel-section';
  el.innerHTML = `
    <h3>Scene</h3>
    <div class="panel-actions">
      <button type="button" data-role="save-scene">Save</button>
      <label class="panel-file-btn">Load <input type="file" accept=".json" data-role="load-file" hidden /></label>
      <button type="button" data-role="reset-scene">Reset</button>
    </div>
    <div class="panel-row">
      <label for="panel-quality">Quality</label>
      <select id="panel-quality" data-role="quality"></select>
    </div>
    <p class="panel-error" data-role="scene-error" hidden></p>
  `;

  const saveBtn = el.querySelector<HTMLButtonElement>('[data-role="save-scene"]')!;
  const loadInput = el.querySelector<HTMLInputElement>('[data-role="load-file"]')!;
  const resetBtn = el.querySelector<HTMLButtonElement>('[data-role="reset-scene"]')!;
  const qualitySelect = el.querySelector<HTMLSelectElement>('[data-role="quality"]')!;
  const errorEl = el.querySelector<HTMLElement>('[data-role="scene-error"]')!;

  for (const q of QUALITIES) {
    const opt = document.createElement('option');
    opt.value = q;
    opt.textContent = q;
    qualitySelect.append(opt);
  }

  function showError(msg: string | null) {
    errorEl.hidden = !msg;
    errorEl.textContent = msg ?? '';
  }

  saveBtn.addEventListener('click', () => {
    const scene = getState();
    const blob = new Blob([JSON.stringify(scene, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = sceneFileName(scene.modelId, new Date());
    a.click();
    URL.revokeObjectURL(url);
  });

  loadInput.addEventListener('change', async () => {
    const file = loadInput.files?.[0];
    loadInput.value = '';
    if (!file) return;
    const text = await file.text();
    const parsed = parseSceneFile(text, getState().modelId);
    if ('error' in parsed) {
      showError(parsed.error);
      return;
    }
    showError(null);
    await actions.loadScene(parsed.scene);
  });

  resetBtn.addEventListener('click', async () => {
    showError(null);
    await actions.reset();
    if (!getState().defaults) {
      try {
        actions.applyDefaults(await fetchDefaults(false));
      } catch {
        // Keep defaults null if fetch fails.
      }
    }
  });

  qualitySelect.addEventListener('change', () => {
    actions.setQuality(qualitySelect.value as Quality);
  });

  return {
    el,
    render(scene) {
      qualitySelect.value = scene.quality;
    },
  };
}
