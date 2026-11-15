import { FURNISHING, MATERIALS, type MaterialName } from '../../../server/src/shared/materials';
import type { Actions, SceneEffects } from '../scene/actions';
import { isSuggested } from '../scene/materials';
import {
  isBlendName,
  SURFACE_CLASSES,
  type FurnishingLevel,
  type SceneState,
  type SurfaceClass,
  type SurfaceValue,
} from '../scene/state';

const MATERIAL_KEYS = Object.keys(MATERIALS) as MaterialName[];
const FURNISHING_LEVELS = Object.keys(FURNISHING) as FurnishingLevel[];
const SURFACE_LABELS: Record<SurfaceClass, string> = {
  wall: 'Wall',
  floor: 'Floor',
  ceiling: 'Ceiling',
  exteriorWall: 'Exterior wall',
};

function closestFurnishing(value: number): FurnishingLevel {
  let best: FurnishingLevel = 'furnished';
  let dist = Infinity;
  for (const level of FURNISHING_LEVELS) {
    const d = Math.abs(FURNISHING[level] - value);
    if (d < dist) {
      dist = d;
      best = level;
    }
  }
  return best;
}

export function createMaterialsSection(deps: {
  actions: Actions;
  effects: SceneEffects;
  getState: () => SceneState;
}): { el: HTMLElement; render: (scene: SceneState) => void } {
  const { actions, effects } = deps;
  const el = document.createElement('section');
  el.className = 'panel-section';
  el.dataset.section = 'materials';
  el.innerHTML = `
    <h3>Materials</h3>
    <div class="panel-row" data-role="room-picker-wrap">
      <label for="panel-room-picker">Scope</label>
      <select id="panel-room-picker" data-role="room-picker"></select>
    </div>
    <div data-role="surface-rows"></div>
    <div class="panel-row">
      <label for="panel-furnishing">Furnishing</label>
      <select id="panel-furnishing" data-role="furnishing"></select>
    </div>
    <div class="panel-actions">
      <button type="button" data-role="reset-house-suggested">Reset house to suggested</button>
      <button type="button" data-role="reset-room-suggested" hidden>Reset room to suggested</button>
    </div>
    <p class="panel-note">Material values are rough estimates.</p>
  `;

  const pickerWrap = el.querySelector<HTMLElement>('[data-role="room-picker-wrap"]')!;
  const roomPicker = el.querySelector<HTMLSelectElement>('[data-role="room-picker"]')!;
  const surfaceRows = el.querySelector<HTMLElement>('[data-role="surface-rows"]')!;
  const furnishingSelect = el.querySelector<HTMLSelectElement>('[data-role="furnishing"]')!;
  const resetHouseBtn = el.querySelector<HTMLButtonElement>('[data-role="reset-house-suggested"]')!;
  const resetRoomBtn = el.querySelector<HTMLButtonElement>('[data-role="reset-room-suggested"]')!;

  for (const level of FURNISHING_LEVELS) {
    const opt = document.createElement('option');
    opt.value = level;
    opt.textContent = level;
    furnishingSelect.append(opt);
  }

  const selects = new Map<SurfaceClass, HTMLSelectElement>();
  const badges = new Map<SurfaceClass, HTMLElement>();
  const rows = new Map<SurfaceClass, HTMLElement>();

  for (const cls of SURFACE_CLASSES) {
    const row = document.createElement('div');
    row.className = 'panel-row';

    const label = document.createElement('label');
    label.textContent = SURFACE_LABELS[cls];

    const badge = document.createElement('span');
    badge.className = 'panel-badge';
    badge.dataset.suggested = cls;
    badge.textContent = 'suggested';
    badge.hidden = true;

    const select = document.createElement('select');
    select.dataset.surface = cls;

    const mixOpt = document.createElement('option');
    mixOpt.value = '';
    mixOpt.textContent = 'suggested mix';
    mixOpt.disabled = true;
    mixOpt.hidden = true;
    select.append(mixOpt);

    for (const mat of MATERIAL_KEYS) {
      const opt = document.createElement('option');
      opt.value = mat;
      opt.textContent = mat;
      select.append(opt);
    }

    select.addEventListener('change', () => {
      if (!select.value) return;
      const room = cls === 'exteriorWall' ? undefined : roomPicker.value || undefined;
      void actions.setMaterial({ target: cls, room, material: select.value });
    });

    row.append(label, badge, select);
    surfaceRows.append(row);
    rows.set(cls, row);
    selects.set(cls, select);
    badges.set(cls, badge);
  }

  let latestScene = deps.getState();

  function selectedRoom(): string | undefined {
    return effects.roomsTagged() && roomPicker.value ? roomPicker.value : undefined;
  }

  roomPicker.addEventListener('change', () => {
    render(latestScene);
  });

  furnishingSelect.addEventListener('change', () => {
    void actions.setFurnishing({ level: furnishingSelect.value as FurnishingLevel, room: selectedRoom() });
  });

  resetHouseBtn.addEventListener('click', () => {
    actions.resetToSuggested();
  });

  resetRoomBtn.addEventListener('click', () => {
    const room = selectedRoom();
    if (room) actions.resetToSuggested(room);
  });

  function syncRoomOptions() {
    const tagged = effects.roomsTagged();
    pickerWrap.hidden = !tagged;
    if (!tagged) {
      roomPicker.value = '';
      return;
    }
    const prev = roomPicker.value;
    const rooms = effects.rooms();
    roomPicker.innerHTML = '';
    const houseOpt = document.createElement('option');
    houseOpt.value = '';
    houseOpt.textContent = 'House (all rooms)';
    roomPicker.append(houseOpt);
    for (const r of rooms) {
      const opt = document.createElement('option');
      opt.value = r.id;
      opt.textContent = r.name;
      roomPicker.append(opt);
    }
    roomPicker.value = rooms.some(r => r.id === prev) ? prev : '';
  }

  function render(scene: SceneState) {
    latestScene = scene;
    syncRoomOptions();
    const roomId = selectedRoom();
    resetRoomBtn.hidden = !roomId;

    for (const cls of SURFACE_CLASSES) {
      const row = rows.get(cls)!;
      if (cls === 'exteriorWall' && roomId) {
        row.hidden = true;
        continue;
      }
      row.hidden = false;

      const select = selects.get(cls)!;
      const val: SurfaceValue =
        cls === 'exteriorWall'
          ? scene.surfaces.exteriorWall
          : roomId
            ? (scene.roomSurfaces[roomId]?.[cls] ?? scene.surfaces[cls])
            : scene.surfaces[cls];

      const mixOpt = select.options[0]!;
      if (isBlendName(val)) {
        mixOpt.hidden = false;
        select.value = '';
      } else {
        mixOpt.hidden = true;
        select.value = val;
      }

      const sug = isSuggested(scene, cls, roomId);
      const badge = badges.get(cls)!;
      badge.hidden = !sug.suggested;
      badge.title = sug.reason ?? '';
    }

    const fVal = roomId ? (scene.roomFurnishing[roomId] ?? scene.furnishing) : scene.furnishing;
    furnishingSelect.value = closestFurnishing(fVal);
  }

  return { el, render };
}
