// Top bar: where we are on the left, view and sound controls on the right.
import { Box, Layers, Plus, Volume2, VolumeX, X } from 'lucide-preact';
import { commands, ui } from './store';

export function Dock() {
  const bp = ui.blueprint.value;
  const audio = ui.audio.value;
  const placing = ui.placing.value;
  const count = ui.speakers.value.length;

  return (
    <>
      <div class="brand card" role="status">
        <span class={`dot ${ui.status.value.startsWith('Tour playing') ? 'live' : ''}`} />
        <div>
          <strong>Acoustic Experience</strong>
          <small title={ui.status.value}>{ui.status.value}</small>
        </div>
      </div>

      <div class="dock card" role="toolbar" aria-label="View and sound">
        <button type="button" class={`tool ${bp.on ? 'on' : ''}`} disabled={!bp.enabled} aria-pressed={bp.on} title="Show the house outline (B)" onClick={() => commands.toggleBlueprint()}>
          <Layers size={16} /> Blueprint
        </button>
        {bp.on && (
          <button type="button" class="tool ghost" disabled={!bp.enabled} title="Switch between a solid model and an x-ray" onClick={() => commands.cycleBlueprintMode()}>
            <Box size={16} /> {bp.mode}
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
          {placing ? <X size={16} /> : <Plus size={16} />} {placing ? 'Cancel' : 'Speaker'}
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
          {audio === 'on' ? 'Sound on' : audio === 'starting' ? 'Starting…' : 'Start sound'}
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
