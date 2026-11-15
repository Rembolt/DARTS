// Top bar: where we are on the left, view and sound controls on the right.
import { Box, Crosshair, Layers, Plus, Volume2, VolumeX, X } from 'lucide-preact';
import { alternative, commands, ui } from './store';

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
  const kind = ui.placeKind.value;
  const place = (k: 'speaker' | 'probe') => {
    if (placing && kind === k) ui.placing.value = false;
    else {
      ui.placeKind.value = k;
      ui.placing.value = true;
    }
  };

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
          class={`tool ${placing && kind === 'speaker' ? 'on accent' : ''}`}
          aria-pressed={placing && kind === 'speaker'}
          title="Add a speaker (S)"
          onClick={() => place('speaker')}
        >
          {placing && kind === 'speaker' ? <X size={16} /> : <Plus size={16} />} <span class="lbl">{placing && kind === 'speaker' ? 'Cancel' : 'Speaker'}</span>
          {!placing && count > 0 && <em>{count}</em>}
        </button>
        <button
          type="button"
          class={`tool ${placing && kind === 'probe' ? 'on accent' : ''}`}
          aria-pressed={placing && kind === 'probe'}
          title="Drop a listening probe (L)"
          onClick={() => place('probe')}
        >
          {placing && kind === 'probe' ? <X size={16} /> : <Crosshair size={16} />} <span class="lbl">{placing && kind === 'probe' ? 'Cancel' : 'Probe'}</span>
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
          <kbd>Click</kbd> {kind === 'probe' ? 'where you want to listen' : 'a surface to place the speaker'} <kbd>Esc</kbd> cancels
        </div>
      )}
      {ui.comparing.value && (
        <div class="hint compare-banner" role="status">
          Hearing: {alternative().label.toLowerCase()} <span>release to go back</span>
        </div>
      )}
    </>
  );
}
