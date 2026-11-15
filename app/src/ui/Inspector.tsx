// A small card that opens beside the selected speaker. Same shape the V2 settings panel will use per source.
import { Trash2, X } from 'lucide-preact';
import { project } from './project';
import { SOUND_LIBRARY, removeSpeaker, ui, updateSpeaker } from './store';

const CARD_W = 264;

export function Inspector() {
  const sel = ui.selection.value;
  const size = ui.stage.value;
  if (!sel || sel.kind !== 'speaker') return null;
  const sp = ui.speakers.value.find(s => s.id === sel.id);
  if (!sp) return null;

  const s = project(sp.position, size);
  const left = s.visible ? Math.min(size.w - CARD_W - 16, Math.max(16, s.x + 26)) : size.w - CARD_W - 16;
  const top = s.visible ? Math.min(Math.max(72, size.h - 440), Math.max(72, s.y - 40)) : 88;

  return (
    <aside class="card inspector" style={{ left: `${left}px`, top: `${top}px`, width: `${CARD_W}px` }} aria-label={`${sp.label} settings`}>
      <header>
        <input
          class="name"
          value={sp.label}
          aria-label="Speaker name"
          onInput={e => updateSpeaker(sp.id, { label: (e.currentTarget as HTMLInputElement).value })}
        />
        <button type="button" class="icon-btn" aria-label="Close" onClick={() => (ui.selection.value = null)}>
          <X size={16} />
        </button>
      </header>

      <label class="field">
        <span>Sound</span>
        <select
          value={sp.sound}
          onChange={e => {
            const lib = SOUND_LIBRARY.find(x => x.id === (e.currentTarget as HTMLSelectElement).value)!;
            updateSpeaker(sp.id, { sound: lib.id, kind: lib.kind, levelDb: lib.levelDb });
          }}
        >
          {SOUND_LIBRARY.map(l => (
            <option value={l.id}>{l.label}</option>
          ))}
        </select>
      </label>

      <label class="field">
        <span>
          Level <output>{sp.levelDb > 0 ? '+' : ''}{sp.levelDb} dB</output>
        </span>
        <input type="range" min={-30} max={6} step={1} value={sp.levelDb} onInput={e => updateSpeaker(sp.id, { levelDb: Number((e.currentTarget as HTMLInputElement).value) })} />
      </label>

      <div class="row">
        <button type="button" class={`switch ${sp.enabled ? 'on' : ''}`} role="switch" aria-checked={sp.enabled} onClick={() => updateSpeaker(sp.id, { enabled: !sp.enabled })}>
          <span class="knob" />
          <span class="switch-label">{sp.enabled ? 'Playing' : 'Muted'}</span>
        </button>
        <button type="button" class="btn danger" onClick={() => removeSpeaker(sp.id)}>
          <Trash2 size={14} /> Remove
        </button>
      </div>
      <p class="fine">Heard from this spot, through the walls.</p>
    </aside>
  );
}
