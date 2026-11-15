// Controls that sit on the 3D view itself: doors and windows you can flip, and speaker pins. What is drawn, and how,
// follows the rules in pins.ts (behind walls, distance, collisions).
import * as Tooltip from '@radix-ui/react-tooltip';
import { Volume2, VolumeX } from 'lucide-preact';
import { DoorIcon, WindowIcon } from './icons';
import { Inspector } from './Inspector';
import { layoutPins, type PinInput } from './pins';
import { project, useCamera } from './project';
import { heardOpenings, previewedIds, removeProbe, toggleOpening, ui } from './store';
import { PATHS_STYLE } from '../blueprint/paths';
import { outdoorTrim } from './scenario';

export function Hotspots() {
  const pose = ui.pose.value;
  const size = ui.stage.value;
  if (!pose || !size.w || !size.h) return null;
  useCamera(pose, size);
  const selection = ui.selection.value;
  const placing = ui.placing.value;
  const previewed = previewedIds();
  const hidden = ui.hidden.value;
  const shownOpenings = heardOpenings(); // while A is held, the pins show the alternative you hear
  const openings = new Map(shownOpenings.map(o => [o.id, o]));
  const speakers = new Map(ui.speakers.value.map(s => [s.id, s]));

  const inputs: PinInput[] = [
    ...shownOpenings.map(o => ({ id: o.id, kind: 'opening' as const, screen: project(o.position, size, 24), hidden: hidden.get(o.id) })),
    ...ui.speakers.value.map(s => ({ id: s.id, kind: 'speaker' as const, screen: project(s.position, size, 24), hidden: hidden.get(s.id) })),
  ];
  // A previewed opening (the agent suggests changing it) stays visible even behind a wall, so the user can check it.
  for (const i of inputs) if (previewed.has(i.id)) i.hidden = false;
  const pins = layoutPins(inputs);

  return (
    <Tooltip.Provider delayDuration={120} skipDelayDuration={300}>
      <div class="hotspots" aria-label="Controls in the tour">
        {pins.map(pin => {
          const style = { transform: `translate(${pin.x}px, ${pin.y}px) translate(-50%, -50%) scale(${pin.scale})`, opacity: pin.opacity };
          if (pin.kind === 'opening') {
            const o = openings.get(pin.id)!;
            const verb = o.open ? 'Close' : 'Open';
            return (
              <Tooltip.Root key={o.id}>
                <Tooltip.Trigger asChild>
                  <button
                    type="button"
                    class={`pin opening ${o.open ? 'is-open' : 'is-closed'} ${previewed.has(o.id) ? 'is-previewed' : ''}`}
                    style={style}
                    aria-label={`${verb} ${o.label}`}
                    aria-pressed={o.open}
                    disabled={placing}
                    onClick={() => toggleOpening(o.id)}
                  >
                    {o.type === 'door' ? <DoorIcon open={o.open} /> : <WindowIcon open={o.open} />}
                  </button>
                </Tooltip.Trigger>
                <Tooltip.Portal>
                  <Tooltip.Content class="tip" side="top" sideOffset={8} collisionPadding={12}>
                    <b>{o.label}</b>
                    <span>
                      {o.open ? 'Open' : 'Closed'} · click to {verb.toLowerCase()}
                    </span>
                  </Tooltip.Content>
                </Tooltip.Portal>
              </Tooltip.Root>
            );
          }
          const sp = speakers.get(pin.id)!;
          const selected = selection?.kind === 'speaker' && selection.id === sp.id;
          return (
            <Tooltip.Root key={sp.id}>
              <Tooltip.Trigger asChild>
                <button
                  type="button"
                  id={`pin-${sp.id}`}
                  class={`pin speaker ${selected ? 'is-selected' : ''} ${sp.enabled ? '' : 'is-muted'} ${pin.state === 'ghost' ? 'is-ghost' : ''}`}
                  style={style}
                  aria-label={`${sp.label}${pin.state === 'ghost' ? ', behind a wall' : ''}, settings`}
                  aria-expanded={selected}
                  disabled={placing}
                  onClick={() => {
                    ui.selection.value = selected ? null : { kind: 'speaker', id: sp.id };
                    if (!selected) ui.chatOpen.value = false; // the card and the conversation share the lower half
                  }}
                >
                  {sp.enabled ? <Volume2 size={16} strokeWidth={2} /> : <VolumeX size={16} strokeWidth={2} />}
                </button>
              </Tooltip.Trigger>
              {!selected && (
                <Tooltip.Portal>
                  <Tooltip.Content class="tip" side="top" sideOffset={8} collisionPadding={12}>
                    <b>{sp.label}</b>
                    <span>
                      {sp.levelDb > 0 ? '+' : ''}
                      {sp.levelDb} dB{pin.state === 'ghost' ? ' · behind a wall' : ''}
                    </span>
                  </Tooltip.Content>
                </Tooltip.Portal>
              )}
            </Tooltip.Root>
          );
        })}
        {ui.probes.value.map(p => {
          const s = project(p.position, size, 20);
          if (!s.visible) return null;
          const names = new Map(ui.speakers.value.map((sp, i) => [sp.id, { label: sp.label, color: PATHS_STYLE.sourceColors[i % PATHS_STYLE.sourceColors.length] }]));
          return (
            <div key={p.id} class={`probe ${s.x > size.w - 420 ? 'flip' : ''}`} style={{ transform: `translate(${s.x}px, ${s.y}px)` }}>
              <button type="button" class="probe-dot" aria-label="Remove probe" title="Remove probe" onClick={() => removeProbe(p.id)} />
              <div class="probe-card">
                {p.readings === null ? (
                  <span class="fine">Measuring…</span>
                ) : (
                  p.readings.map(r => (
                    <div key={r.sourceId} class="probe-row">
                      <i style={{ background: names.get(r.sourceId)?.color }} />
                      <span>{names.get(r.sourceId)?.label ?? r.sourceId}</span>
                      <b>{Math.round(r.db + (r.sourceId === 'outdoor' ? outdoorTrim(shownOpenings, ui.timeOfDay.value).db : 0))}</b>
                    </div>
                  ))
                )}
              </div>
            </div>
          );
        })}
        <Inspector anchor={selection?.kind === 'speaker' ? pins.find(p => p.id === selection.id) ?? null : null} />
      </div>
    </Tooltip.Provider>
  );
}
