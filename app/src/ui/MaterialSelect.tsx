// A material picker: swatch, name, and what it does to the sound. Used in the blueprint strip and in settings.
import * as Select from '@radix-ui/react-select';
import { Check, ChevronDown } from 'lucide-preact';
import { materialById, optionsFor, type Surface } from './materials';
import { patchSettings, ui } from './store';

export function MaterialSelect({ surface, label, compact = false }: { surface: Surface; label: string; compact?: boolean }) {
  const id = ui.settings.value.materials[surface];
  const current = materialById(id);
  return (
    <Select.Root value={id} onValueChange={v => patchSettings({ materials: { [surface]: v } })}>
      <Select.Trigger class={`mat-trigger ${compact ? 'compact' : ''}`} aria-label={`${label} material`}>
        <i class="swatch" style={{ background: current.color }} />
        {compact && <span class="mat-surface">{label}</span>}
        <Select.Value>{current.label}</Select.Value>
        <Select.Icon>
          <ChevronDown size={14} />
        </Select.Icon>
      </Select.Trigger>
      <Select.Portal>
        <Select.Content class="card menu mat-menu" position="popper" sideOffset={6} collisionPadding={12}>
          <Select.Viewport>
            {optionsFor(surface).map(m => (
              <Select.Item key={m.id} value={m.id} class="menu-item mat-item">
                <i class="swatch" style={{ background: m.color }} />
                <span class="mat-name">
                  <Select.ItemText>{m.label}</Select.ItemText>
                  <small>{m.feel}</small>
                </span>
                <Select.ItemIndicator class="menu-check">
                  <Check size={14} />
                </Select.ItemIndicator>
              </Select.Item>
            ))}
          </Select.Viewport>
        </Select.Content>
      </Select.Portal>
    </Select.Root>
  );
}
