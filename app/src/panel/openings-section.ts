import type { Actions, SceneEffects } from '../scene/actions';
import type { SceneState } from '../scene/state';

export function createOpeningsSection(deps: {
  actions: Actions;
  effects: SceneEffects;
  getState: () => SceneState;
}): { el: HTMLElement; render: (scene: SceneState) => void } {
  const { actions, effects, getState } = deps;
  const el = document.createElement('section');
  el.className = 'panel-section';
  el.dataset.section = 'openings';
  el.innerHTML = `
    <h3>Openings</h3>
    <div class="panel-row">
      <label for="panel-load-openings">Load doors and windows</label>
      <input id="panel-load-openings" type="checkbox" data-role="load-openings" />
    </div>
    <div class="panel-actions" data-role="openings-bulk" hidden>
      <button type="button" data-role="close-all-windows">Close all windows</button>
      <button type="button" data-role="close-all-doors">Close all doors</button>
    </div>
    <div data-role="openings-list"></div>
  `;

  const loadToggle = el.querySelector<HTMLInputElement>('[data-role="load-openings"]')!;
  const bulkEl = el.querySelector<HTMLElement>('[data-role="openings-bulk"]')!;
  const closeWindowsBtn = el.querySelector<HTMLButtonElement>('[data-role="close-all-windows"]')!;
  const closeDoorsBtn = el.querySelector<HTMLButtonElement>('[data-role="close-all-doors"]')!;
  const listEl = el.querySelector<HTMLElement>('[data-role="openings-list"]')!;

  loadToggle.addEventListener('change', async () => {
    const scene = getState();
    await actions.loadScene({ ...scene, openings: { ...scene.openings, loaded: loadToggle.checked } });
  });

  async function closeAll(type: 'window' | 'door') {
    const rooms = new Set(
      effects
        .openings()
        .filter(o => o.kind === type && !o.meshClosed)
        .map(o => o.roomId),
    );
    for (const room of rooms) {
      await actions.setOpening({ room, type, state: 'closed' });
    }
  }

  closeWindowsBtn.addEventListener('click', () => {
    void closeAll('window');
  });

  closeDoorsBtn.addEventListener('click', () => {
    void closeAll('door');
  });

  function render(scene: SceneState) {
    loadToggle.checked = scene.openings.loaded;
    bulkEl.hidden = !scene.openings.loaded;
    listEl.innerHTML = '';
    if (!scene.openings.loaded) return;

    const openings = effects.openings().filter(o => o.kind === 'window' || o.kind === 'door');
    const byRoom = new Map<string, typeof openings>();
    for (const o of openings) {
      const group = byRoom.get(o.roomName) ?? [];
      group.push(o);
      byRoom.set(o.roomName, group);
    }

    for (const [roomName, items] of byRoom) {
      const heading = document.createElement('div');
      heading.className = 'panel-note';
      heading.textContent = roomName;
      listEl.append(heading);

      for (const o of items) {
        const row = document.createElement('div');
        row.className = 'panel-row';
        row.dataset.openingRow = o.id;

        const label = document.createElement('label');
        label.textContent = o.meshClosed
          ? `${o.kind} (${o.width.toFixed(1)}m) — already closed in the scan`
          : `${o.kind} (${o.width.toFixed(1)}m)`;

        const toggle = document.createElement('input');
        toggle.type = 'checkbox';
        toggle.dataset.openingToggle = o.id;
        toggle.disabled = o.meshClosed;
        toggle.checked = o.meshClosed || scene.openings.closed[o.id] === true;
        toggle.addEventListener('change', () => {
          void actions.setOpening({ id: o.id, state: toggle.checked ? 'closed' : 'open' });
        });

        row.append(label, toggle);
        listEl.append(row);
      }
    }
  }

  return { el, render };
}
