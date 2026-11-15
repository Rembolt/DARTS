import { MATERIALS } from '../../../server/src/shared/materials';
import type { Actions, SceneEffects } from '../scene/actions';
import { ROW_NAMES } from '../scene/permissions';
import {
  PERMISSION_ROWS,
  PUT_ROWS,
  type PermissionRow,
  type Permissions,
  type PutRow,
  type SceneState,
} from '../scene/state';

const MATERIAL_KEYS = Object.keys(MATERIALS);
const PUT_ROW_SET = new Set<string>(PUT_ROWS);

function clonePerms(p: Permissions): Permissions {
  return {
    get: { ...p.get },
    put: { ...p.put },
    putMaterial: { ...p.putMaterial },
    putLayer: { ...p.putLayer },
  };
}

export function createPermissionsSection(deps: {
  actions: Actions;
  effects: SceneEffects;
  getState: () => SceneState;
}): { el: HTMLElement; render: (scene: SceneState) => void } {
  const { actions, effects, getState } = deps;
  const el = document.createElement('section');
  el.className = 'panel-section';
  el.dataset.section = 'permissions';
  el.innerHTML = `
    <h3>Permissions (Jev)</h3>
    <div data-role="perm-rows"></div>
  `;

  const rowsEl = el.querySelector<HTMLElement>('[data-role="perm-rows"]')!;

  function update(mutate: (p: Permissions) => void) {
    const next = clonePerms(getState().permissions);
    mutate(next);
    actions.setPermissions(next);
  }

  function render(scene: SceneState) {
    rowsEl.innerHTML = '';
    const p = scene.permissions;

    for (const rowKey of PERMISSION_ROWS) {
      const row = document.createElement('div');
      row.className = 'panel-row';
      row.dataset.permRow = rowKey;

      const label = document.createElement('span');
      label.textContent = ROW_NAMES[rowKey];

      const getBox = document.createElement('input');
      getBox.type = 'checkbox';
      getBox.checked = p.get[rowKey];
      getBox.title = 'GET';
      getBox.dataset.permGet = rowKey;
      getBox.addEventListener('change', () => {
        update(next => {
          next.get[rowKey as PermissionRow] = getBox.checked;
        });
      });

      row.append(label, getBox);

      if (PUT_ROW_SET.has(rowKey)) {
        const putKey = rowKey as PutRow;
        const putBox = document.createElement('input');
        putBox.type = 'checkbox';
        putBox.checked = p.put[putKey];
        putBox.title = 'PUT';
        putBox.dataset.permPut = putKey;
        putBox.addEventListener('change', () => {
          update(next => {
            next.put[putKey] = putBox.checked;
          });
        });
        row.append(putBox);
      }

      rowsEl.append(row);
    }

    for (const mat of MATERIAL_KEYS) {
      const row = document.createElement('div');
      row.className = 'panel-row';
      const label = document.createElement('span');
      label.textContent = `Material: ${mat}`;
      const putBox = document.createElement('input');
      putBox.type = 'checkbox';
      putBox.checked = p.putMaterial[mat] === true;
      putBox.title = 'PUT';
      putBox.dataset.permMaterial = mat;
      putBox.addEventListener('change', () => {
        update(next => {
          next.putMaterial[mat] = putBox.checked;
        });
      });
      row.append(label, putBox);
      rowsEl.append(row);
    }

    for (const layer of effects.layers()) {
      const row = document.createElement('div');
      row.className = 'panel-row';
      const label = document.createElement('span');
      label.textContent = `Mesh layer: ${layer.id}`;
      const putBox = document.createElement('input');
      putBox.type = 'checkbox';
      putBox.checked = p.putLayer[layer.id] === true;
      putBox.title = 'PUT';
      putBox.dataset.permLayer = layer.id;
      putBox.addEventListener('change', () => {
        update(next => {
          next.putLayer[layer.id] = putBox.checked;
        });
      });
      row.append(label, putBox);
      rowsEl.append(row);
    }
  }

  return { el, render };
}
