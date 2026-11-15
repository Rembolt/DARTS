// Controls that sit on the 3D view itself: doors and windows you can flip, and speaker pins.
import { Volume2, VolumeX } from 'lucide-preact';
import { project, useCamera } from './project';
import { DoorIcon, WindowIcon } from './icons';
import { previewedIds, ui, toggleOpening } from './store';

const MAX_DISTANCE = 9;

export function Hotspots() {
  const pose = ui.pose.value;
  const size = ui.stage.value;
  if (!pose || !size.w || !size.h) return null;
  useCamera(pose, size);
  const selection = ui.selection.value;
  const placing = ui.placing.value;
  const previewed = previewedIds();

  return (
    <div class="hotspots" aria-label="Controls in the tour">
      {ui.openings.value.map(o => {
        const s = project(o.position, size, 24);
        if (!s.visible || s.distance > MAX_DISTANCE) return null;
        const scale = Math.max(0.78, Math.min(1.15, 4.5 / s.distance));
        const verb = o.open ? 'Close' : 'Open';
        const selected = selection?.kind === 'opening' && selection.id === o.id;
        return (
          <button
            key={o.id}
            type="button"
            class={`pin opening ${o.open ? 'is-open' : 'is-closed'} ${selected ? 'is-selected' : ''} ${previewed.has(o.id) ? 'is-previewed' : ''}`}
            style={{ transform: `translate(${s.x}px, ${s.y}px) translate(-50%, -50%) scale(${scale})` }}
            aria-label={`${verb} ${o.label}`}
            aria-pressed={o.open}
            disabled={placing}
            onClick={() => toggleOpening(o.id)}
          >
            {o.type === 'door' ? <DoorIcon open={o.open} /> : <WindowIcon open={o.open} />}
            <span class="pin-tip">
              <b>{o.label}</b>
              <i>{o.open ? 'Open' : 'Closed'} · click to {verb.toLowerCase()}</i>
            </span>
          </button>
        );
      })}

      {ui.speakers.value.map(sp => {
        const s = project(sp.position, size, 24);
        if (!s.visible) return null;
        const selected = selection?.kind === 'speaker' && selection.id === sp.id;
        return (
          <button
            key={sp.id}
            type="button"
            class={`pin speaker ${selected ? 'is-selected' : ''} ${sp.enabled ? '' : 'is-muted'}`}
            style={{ transform: `translate(${s.x}px, ${s.y}px) translate(-50%, -50%)` }}
            aria-label={`${sp.label}, settings`}
            disabled={placing}
            onClick={() => {
              ui.selection.value = selected ? null : { kind: 'speaker', id: sp.id };
              if (!selected) ui.chatOpen.value = false; // the card and the conversation share the lower half
            }}
          >
            {sp.enabled ? <Volume2 size={16} strokeWidth={2} /> : <VolumeX size={16} strokeWidth={2} />}
            <span class="pin-tip">
              <b>{sp.label}</b>
              <i>{sp.levelDb > 0 ? '+' : ''}{sp.levelDb} dB</i>
            </span>
          </button>
        );
      })}
    </div>
  );
}
