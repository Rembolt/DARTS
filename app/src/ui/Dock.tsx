// Top bar: where we are on the left, view and sound controls on the right.
import { Box, Layers, Plus, Volume2, VolumeX, X } from 'lucide-preact';
import { commands, ui } from './store';

/** What the status line says to a person, not the raw log text. */
function statusText(raw: string): string {
  if (raw.startsWith('Loading')) return 'Loading the tour';
  return raw.length > 40 ? 'Something went wrong' : raw;
}

export function Dock() {
  const bp = ui.blueprint.value;
  const audio = ui.audio.value;
  const placing = ui.placing.value;
  const count = ui.speakers.value.length;

  return (
    <>
      {!ui.status.value.startsWith('Tour playing') && (
        <div class="notice" role="status">
          {statusText(ui.status.value)}
        </div>
      )}

      <div class="dock card" role="toolbar" aria-label="View and sound">
        <button type="button" class={`tool ${bp.on ? 'on' : ''}`} disabled={!bp.enabled} aria-pressed={bp.on} title="Show the house outline (B)" onClick={() => commands.toggleBlueprint()}>
          <Layers size={16} /> <span class="lbl">Blueprint</span>
        </button>
        {bp.on && (
          <button type="button" class="tool ghost" disabled={!bp.enabled} title="Switch between a solid model and an x-ray" onClick={() => commands.cycleBlueprintMode()}>
            <Box size={16} /> <span class="lbl">{bp.mode}</span>
          </button>
        )}
        <span class="sep" />
        <button
          type="button"
          class={`tool ${placing ? 'on accent' : ''}`}
          aria-pressed={placing}
          title="Add a speaker (S)"
          onClick={() => (ui.placing.value = !placing)}
        >
          {placing ? <X size={16} /> : <Plus size={16} />} <span class="lbl">{placing ? 'Cancel' : 'Speaker'}</span>
          {!placing && count > 0 && <em>{count}</em>}
        </button>
        <button
          type="button"
          class={`tool ${audio === 'on' ? 'on' : ''}`}
          disabled={audio === 'starting'}
          aria-pressed={audio === 'on'}
          onClick={() => commands.toggleAudio()}
        >
          {audio === 'on' ? <Volume2 size={16} /> : <VolumeX size={16} />}
          <span class="lbl">{audio === 'on' ? 'Sound on' : audio === 'starting' ? 'Starting…' : 'Start sound'}</span>
        </button>
      </div>

      {placing && (
        <div class="hint" role="status">
          <kbd>Click</kbd> a surface to place the speaker <kbd>Esc</kbd> cancels
        </div>
      )}
      {ui.openingsAreDemo.value && ui.openings.value.length > 0 && !placing && (
        <div class="demo-note" title="Doors and windows are placed around the start point until the home's real openings are connected.">
          Demo doors and windows
        </div>
      )}
    </>
  );
}
