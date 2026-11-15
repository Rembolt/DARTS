// The settings panel: everything the simulation runs with. Materials per surface, furnishing, quality; save, load and
// reset the scene. A change goes straight to the simulation, so the room, the compass and the sound follow at once.
import { Download, RotateCcw, Upload } from 'lucide-preact';
import { useRef } from 'preact/hooks';
import { MaterialSelect } from './MaterialSelect';
import { DEFAULT_SETTINGS, parseSettings, QUALITY, SURFACES, type Quality } from './materials';
import { Panel } from './Panel';
import { patchSettings, setOpenings, setSettings, setSpeakers, commands, SOUND_LIBRARY, ui, type Speaker } from './store';
import { toast } from 'sonner';

/** Speakers someone placed (by a click or through the assistant). The property's own outside sounds are not part of a scene file. */
const isPlaced = (s: Speaker) => s.id.startsWith('speaker-');

/** The speakers of a scene file: only well-formed ones with a sound from the library; anything else is dropped. */
export function parseSpeakers(raw: unknown): Speaker[] {
  if (!Array.isArray(raw)) return [];
  const out: Speaker[] = [];
  for (const v of raw.slice(0, 6)) {
    if (!v || typeof v !== 'object') continue;
    const s = v as Record<string, unknown>;
    const lib = SOUND_LIBRARY.find(l => l.id === s.sound);
    const p = s.position;
    if (!lib || typeof s.id !== 'string' || !/^speaker-\d+$/.test(s.id)) continue;
    if (!Array.isArray(p) || p.length !== 3 || !p.every(n => typeof n === 'number' && Number.isFinite(n))) continue;
    const level = typeof s.levelDb === 'number' && Number.isFinite(s.levelDb) ? Math.min(6, Math.max(-30, s.levelDb)) : lib.levelDb;
    out.push({
      id: s.id, label: typeof s.label === 'string' && s.label ? s.label.slice(0, 60) : lib.label, sound: lib.id, kind: lib.kind,
      position: [p[0], p[1], p[2]], levelDb: level, enabled: s.enabled !== false,
    });
  }
  return out;
}

function save() {
  const scene = {
    version: 2,
    settings: ui.settings.value,
    timeOfDay: ui.timeOfDay.value,
    // Positions and opening ids belong to this property: loading the file in another tour keeps only the settings.
    speakers: ui.speakers.value.filter(isPlaced),
    closedOpenings: ui.openings.value.filter(o => !o.open).map(o => o.id),
  };
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
    // Version 1 files hold settings only: speakers and openings then stay as they are.
    if (Array.isArray(raw.speakers)) {
      const loaded = parseSpeakers(raw.speakers);
      const ids = new Set(loaded.map(s => s.id));
      setSpeakers([...ui.speakers.value.filter(s => !isPlaced(s) && !ids.has(s.id)), ...loaded]);
    }
    if (Array.isArray(raw.closedOpenings)) {
      const closed = new Set(raw.closedOpenings.filter((id: unknown) => typeof id === 'string'));
      // Ids this property does not have are simply not found: nothing else changes.
      if (ui.openings.value.some(o => o.open === closed.has(o.id))) setOpenings(ui.openings.value.map(o => ({ ...o, open: !closed.has(o.id) })));
    }
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
        <div class="set-row">
          <span>Footsteps on move</span>
          <button
            type="button"
            role="switch"
            aria-checked={ui.footsteps.value}
            class={`btn ${ui.footsteps.value ? 'primary' : 'quiet'}`}
            onClick={() => commands.toggleFootsteps()}
          >
            {ui.footsteps.value ? 'On' : 'Off'}
          </button>
        </div>
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
