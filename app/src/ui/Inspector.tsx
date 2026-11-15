// The speaker card: a popover anchored to the selected pin, placed by Radix (flips and shifts to stay on screen).
import * as Popover from '@radix-ui/react-popover';
import * as Select from '@radix-ui/react-select';
import * as Switch from '@radix-ui/react-switch';
import { Check, ChevronDown, Trash2, X } from 'lucide-preact';
import type { PinOut } from './pins';
import { removeSpeaker, SOUND_LIBRARY, ui, updateSpeaker } from './store';

export function Inspector({ anchor }: { anchor: PinOut | null }) {
  const sel = ui.selection.value;
  const sp = sel?.kind === 'speaker' ? ui.speakers.value.find(s => s.id === sel.id) : undefined;
  const open = !!sp;
  // When the pin is off screen the card stays, anchored to the right edge.
  const size = ui.stage.value;
  const x = anchor ? anchor.x : size.w - 40;
  const y = anchor ? anchor.y : 120;

  return (
    <Popover.Root open={open} onOpenChange={o => !o && (ui.selection.value = null)}>
      <Popover.Anchor asChild>
        <span class="anchor" style={{ transform: `translate(${x}px, ${y}px)` }} />
      </Popover.Anchor>
      <Popover.Portal>
        {sp && (
          <Popover.Content
            class="card inspector"
            side={anchor && anchor.x > size.w / 2 ? 'left' : 'right'}
            align="center"
            sideOffset={22}
            collisionPadding={{ top: 72, bottom: 96, left: 14, right: 14 }}
            updatePositionStrategy="always"
            onOpenAutoFocus={e => e.preventDefault()}
            onInteractOutside={e => {
              // Clicks in the tour or on another pin do not close the card; Esc and the X do.
              e.preventDefault();
            }}
            aria-label={`${sp.label} settings`}
          >
            <header>
              <input class="name" value={sp.label} aria-label="Speaker name" onInput={e => updateSpeaker(sp.id, { label: (e.currentTarget as HTMLInputElement).value })} />
              <Popover.Close class="icon-btn" aria-label="Close">
                <X size={16} />
              </Popover.Close>
            </header>

            <div class="field">
              <span class="label">Sound</span>
              <Select.Root
                value={sp.sound}
                onValueChange={v => {
                  const lib = SOUND_LIBRARY.find(x => x.id === v)!;
                  updateSpeaker(sp.id, { sound: lib.id, kind: lib.kind, levelDb: lib.levelDb });
                }}
              >
                <Select.Trigger class="select" aria-label="Sound">
                  <Select.Value />
                  <Select.Icon>
                    <ChevronDown size={14} />
                  </Select.Icon>
                </Select.Trigger>
                <Select.Portal>
                  <Select.Content class="card menu" position="popper" sideOffset={6}>
                    <Select.Viewport>
                      {SOUND_LIBRARY.map(l => (
                        <Select.Item key={l.id} value={l.id} class="menu-item">
                          <Select.ItemText>{l.label}</Select.ItemText>
                          <span class="menu-meta">{l.kind === 'point' ? 'Inside' : 'Outside'}</span>
                          <Select.ItemIndicator class="menu-check">
                            <Check size={14} />
                          </Select.ItemIndicator>
                        </Select.Item>
                      ))}
                    </Select.Viewport>
                  </Select.Content>
                </Select.Portal>
              </Select.Root>
            </div>

            <div class="field">
              <span class="label">
                Level <output>{sp.levelDb > 0 ? '+' : ''}{sp.levelDb} dB</output>
              </span>
              {/* Native range: Radix Slider loses its thumb under preact/compat. Styled in styles.css. */}
              <input
                type="range"
                class="range"
                min={-30}
                max={6}
                step={1}
                value={sp.levelDb}
                aria-label="Level"
                style={{ '--fill': `${((sp.levelDb + 30) / 36) * 100}%` }}
                onInput={e => updateSpeaker(sp.id, { levelDb: Number((e.currentTarget as HTMLInputElement).value) })}
              />
            </div>

            <div class="row">
              <label class="switch-row">
                <Switch.Root class="switch" checked={sp.enabled} onCheckedChange={v => updateSpeaker(sp.id, { enabled: v })}>
                  <Switch.Thumb class="switch-thumb" />
                </Switch.Root>
                {sp.enabled ? 'Playing' : 'Muted'}
              </label>
              <button type="button" class="btn danger" onClick={() => removeSpeaker(sp.id)}>
                <Trash2 size={14} /> Remove
              </button>
            </div>
          </Popover.Content>
        )}
      </Popover.Portal>
    </Popover.Root>
  );
}
