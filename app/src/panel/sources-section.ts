import type { Actions } from '../scene/actions';
import { LEVEL_MAX_DB, LEVEL_MIN_DB, type SceneState } from '../scene/state';

const DEFAULT_SOUNDS = ['music', 'speech', 'traffic', 'piano', 'fan', 'tv'];
const SPEAKER_ID = /^speaker-(\d+)$/;

export function createSourcesSection(deps: {
  root: HTMLElement;
  actions: Actions;
  sounds?: string[];
}): { el: HTMLElement; render: (scene: SceneState) => void } {
  const { root, actions } = deps;
  const soundNames = [...(deps.sounds ?? DEFAULT_SOUNDS)];
  const uploadedUrls = new Map<string, string>();

  const el = document.createElement('section');
  el.className = 'panel-section';
  el.dataset.section = 'sources';
  el.innerHTML = `
    <h3>Sources</h3>
    <div data-role="speaker-list"></div>
    <div class="panel-actions">
      <select data-role="add-speaker-sound"></select>
      <button type="button" data-role="add-speaker-btn">Add speaker</button>
    </div>
    <div class="panel-row">
      <label class="panel-file-btn">Upload sound <input type="file" accept=".mp3,.ogg,.wav" data-role="upload-sound" hidden /></label>
    </div>
  `;

  const listEl = el.querySelector<HTMLElement>('[data-role="speaker-list"]')!;
  const addSoundSelect = el.querySelector<HTMLSelectElement>('[data-role="add-speaker-sound"]')!;
  const addBtn = el.querySelector<HTMLButtonElement>('[data-role="add-speaker-btn"]')!;
  const uploadInput = el.querySelector<HTMLInputElement>('[data-role="upload-sound"]')!;

  function fillSoundOptions(select: HTMLSelectElement, current?: string) {
    const prev = current ?? select.value;
    select.innerHTML = '';
    const options = current && !soundNames.includes(current) ? [current, ...soundNames] : soundNames;
    for (const s of options) {
      const opt = document.createElement('option');
      opt.value = s;
      opt.textContent = s;
      select.append(opt);
    }
    if (prev) select.value = prev;
  }

  fillSoundOptions(addSoundSelect, soundNames[0]);

  addBtn.addEventListener('click', () => {
    root.dispatchEvent(new CustomEvent('panel:add-speaker', { detail: { sound: addSoundSelect.value }, bubbles: true }));
  });

  uploadInput.addEventListener('change', () => {
    const file = uploadInput.files?.[0];
    uploadInput.value = '';
    if (!file) return;
    const url = URL.createObjectURL(file);
    const name = file.name.replace(/\.[^.]+$/, '') || 'custom';
    if (!soundNames.includes(name)) soundNames.push(name);
    uploadedUrls.set(name, url);
    fillSoundOptions(addSoundSelect, name);
    root.dispatchEvent(new CustomEvent('panel:upload-sound', { detail: { name, url }, bubbles: true }));
  });

  function render(scene: SceneState) {
    listEl.innerHTML = '';
    for (const src of scene.sources) {
      const row = document.createElement('div');
      row.className = 'panel-row';
      row.dataset.speakerRow = src.id;

      const enabled = document.createElement('input');
      enabled.type = 'checkbox';
      enabled.checked = src.enabled;
      enabled.title = 'On / Off';
      enabled.addEventListener('change', () => {
        void actions.setSpeaker({ id: src.id, enabled: enabled.checked });
      });

      const label = document.createElement('span');
      label.textContent = src.label;

      const soundSel = document.createElement('select');
      fillSoundOptions(soundSel, src.sound);
      soundSel.addEventListener('change', () => {
        void actions.setSpeaker({ id: src.id, sound: soundSel.value });
      });

      const level = document.createElement('input');
      level.type = 'range';
      level.min = String(LEVEL_MIN_DB);
      level.max = String(LEVEL_MAX_DB);
      level.step = '1';
      level.value = String(src.levelDb);
      level.dataset.speakerLevel = src.id;
      level.addEventListener('change', () => {
        void actions.setSpeaker({ id: src.id, levelDb: Number(level.value) });
      });

      const moveBtn = document.createElement('button');
      moveBtn.type = 'button';
      moveBtn.textContent = 'Move';
      moveBtn.addEventListener('click', () => {
        root.dispatchEvent(new CustomEvent('panel:move-speaker', { detail: { id: src.id }, bubbles: true }));
      });

      row.append(enabled, label, soundSel, level, moveBtn);

      if (SPEAKER_ID.test(src.id)) {
        const removeBtn = document.createElement('button');
        removeBtn.type = 'button';
        removeBtn.textContent = 'Remove';
        removeBtn.addEventListener('click', () => {
          void actions.removeSpeaker({ id: src.id });
        });
        row.append(removeBtn);
      }

      listEl.append(row);
    }
  }

  return { el, render };
}
