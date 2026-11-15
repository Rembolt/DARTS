// The settings panel: everything the simulation runs with. Materials per surface, furnishing, quality; save, load and
// reset the scene. A change goes straight to the simulation, so the room, the compass and the sound follow at once.
import { Download, RotateCcw, Upload } from 'lucide-preact';
import { useRef } from 'preact/hooks';
import { MaterialSelect } from './MaterialSelect';
import { DEFAULT_SETTINGS, parseSettings, QUALITY, SURFACES, type Quality } from './materials';
import { Panel } from './Panel';
import { patchSettings, setSettings, ui } from './store';
import { toast } from 'sonner';

function save() {
  const scene = { version: 1, settings: ui.settings.value, timeOfDay: ui.timeOfDay.value };
  const url = URL.createObjectURL(new Blob([JSON.stringify(scene, null, 2)], { type: 'application/json' }));
  const a = document.createElement('a');
  a.href = url;
  a.download = `scene-${new Date().toISOString().slice(0, 10)}.json`;
  a.click();
  URL.revokeObjectURL(url);
}

async function load(file: File) {
  try {
    const raw = JSON.parse(await file.text());
    if (!raw || typeof raw !== 'object') throw new Error('not a scene file');
    setSettings(parseSettings(raw.settings ?? raw));
    toast('Scene loaded', { description: file.name });
  } catch (err) {
    toast('Could not load that file', { description: err instanceof Error ? err.message : 'unknown error' });
  }
}

export function Settings() {
  const s = ui.settings.value;
  const picker = useRef<HTMLInputElement>(null);
  if (!ui.settingsOpen.value) return null;
  return (
    <Panel id="settings" title="Settings" className="p-settings">
      <section class="set-group">
        <h4>Surfaces</h4>
        {SURFACES.map(x => (
          <div class="set-row" key={x.id}>
            <span>{x.label}</span>
            <MaterialSelect surface={x.id} label={x.label} />
          </div>
        ))}
        <p class="fine">Estimates from a rough table, not measurements.</p>
      </section>

      <section class="set-group">
        <h4>Room</h4>
        <label class="set-slider">
          <span class="label">
            Furnishing <output>{Math.round(s.furnishing * 100)}%</output>
          </span>
          <input
            type="range"
            class="range"
            min={0}
            max={40}
            step={1}
            value={Math.round(s.furnishing * 100)}
            style={{ '--fill': `${(s.furnishing / 0.4) * 100}%` }}
            aria-label="Furnishing"
            onInput={e => patchSettings({ furnishing: Number((e.currentTarget as HTMLInputElement).value) / 100 })}
          />
          <small>Soft furniture, curtains, people. More of it shortens the echo.</small>
        </label>
      </section>

      <section class="set-group">
        <h4>Quality</h4>
        <div class="segmented three" role="radiogroup" aria-label="Simulation quality">
          {(Object.keys(QUALITY) as Quality[]).map(q => (
            <button key={q} type="button" role="radio" aria-checked={s.quality === q} class={s.quality === q ? 'on' : ''} onClick={() => patchSettings({ quality: q })}>
              {QUALITY[q].label}
            </button>
          ))}
        </div>
        <p class="fine">{QUALITY[s.quality].raysPerTrace.toLocaleString()} rays per step, {QUALITY[s.quality].bounces} bounces. Higher is smoother and slower.</p>
      </section>

      <div class="set-actions">
        <button type="button" class="btn" onClick={save}>
          <Download size={14} /> Save
        </button>
        <button type="button" class="btn" onClick={() => picker.current?.click()}>
          <Upload size={14} /> Load
        </button>
        <button type="button" class="btn quiet" onClick={() => setSettings(DEFAULT_SETTINGS)}>
          <RotateCcw size={14} /> Reset
        </button>
        <input ref={picker} type="file" accept="application/json,.json" hidden onChange={e => { const f = (e.currentTarget as HTMLInputElement).files?.[0]; if (f) void load(f); (e.currentTarget as HTMLInputElement).value = ''; }} />
      </div>
    </Panel>
  );
}
