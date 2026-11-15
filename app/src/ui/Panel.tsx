// A floating panel you can move (drag the title, or arrow keys on it) and fold away (the chevron, or double-click the
// title). Position and open state are remembered. Until moved, a panel sits where its CSS class puts it.
import { signal } from '@preact/signals';
import { ChevronDown } from 'lucide-preact';
import type { ComponentChildren } from 'preact';
import { useLayoutEffect, useRef, useState } from 'preact/hooks';
import { clampPosition, loadPanels, savePanels, type PanelState } from './panelPos';
import { ui } from './store';

const panels = signal<Record<string, PanelState>>(loadPanels());

function patch(id: string, p: PanelState): void {
  panels.value = { ...panels.value, [id]: { ...panels.value[id], ...p } };
  savePanels(panels.value);
}

export function resetPanels(): void {
  panels.value = {};
  savePanels({});
}

/** Space kept free at the bottom of the screen: the chat bar and the tour's own controls. */
const BOTTOM_MARGIN = 88;

export function Panel({
  id,
  title,
  extra,
  className = '',
  below,
  children,
}: {
  id: string;
  title: string;
  extra?: ComponentChildren;
  className?: string;
  /** Until moved, sit under this other panel (and follow it when it folds), instead of at a fixed spot. */
  below?: string;
  children: ComponentChildren;
}) {
  const root = useRef<HTMLElement>(null);
  const drag = useRef<{ dx: number; dy: number } | null>(null);
  const state = panels.value[id] ?? {};
  const collapsed = !!state.collapsed;
  const moved = state.x !== undefined && state.y !== undefined;
  const stage = ui.stage.value;
  const [auto, setAuto] = useState<number | null>(null);
  const above = below ? panels.value[below]?.collapsed : undefined; // read so this panel re-renders when that one folds

  // Unmoved and stacked: measure the panel above and sit 10 px under it.
  useLayoutEffect(() => {
    if (!below || moved) return;
    const frame = requestAnimationFrame(() => {
      const other = document.querySelector<HTMLElement>(`[data-panel="${below}"]`);
      const parent = root.current?.offsetParent?.getBoundingClientRect();
      setAuto(other && parent ? other.getBoundingClientRect().bottom - parent.top + 10 : null);
    });
    return () => cancelAnimationFrame(frame);
  }, [below, moved, above, stage.w, stage.h, collapsed, ui.heat.value]);

  const place = (x: number, y: number) => {
    const el = root.current;
    if (!el) return;
    const c = clampPosition(x, y, { w: el.offsetWidth, h: el.offsetHeight }, { w: stage.w, h: stage.h });
    patch(id, c);
  };
  const here = () => {
    const el = root.current!;
    const box = el.getBoundingClientRect();
    const parent = el.offsetParent?.getBoundingClientRect() ?? { left: 0, top: 0 };
    return { x: box.left - parent.left, y: box.top - parent.top };
  };

  const style = moved
    ? { left: `${clampX(state.x!, root.current, stage)}px`, top: `${state.y}px`, right: 'auto', bottom: 'auto' }
    : auto !== null
      ? { top: `${auto}px` }
      : undefined;
  // However tall the content, the panel stays on screen: the body scrolls inside what is left below the header.
  const top = moved ? state.y! : auto ?? root.current?.offsetTop ?? 0;
  const bodyMax = stage.h ? Math.max(120, stage.h - top - BOTTOM_MARGIN - 44) : undefined;

  return (
    <section ref={root} data-panel={id} class={`panel floating ${className} ${collapsed ? 'is-collapsed' : ''}`} style={style} aria-label={title}>
      <header
        class="p-bar"
        tabIndex={0}
        role="group"
        aria-label={`${title}. Drag to move, double-click to fold.`}
        onPointerDown={e => {
          if ((e.target as HTMLElement).closest('button')) return;
          const at = here();
          drag.current = { dx: e.clientX - at.x, dy: e.clientY - at.y };
          (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
        }}
        onPointerMove={e => {
          if (!drag.current) return;
          const parent = root.current?.offsetParent?.getBoundingClientRect() ?? { left: 0, top: 0 };
          place(e.clientX - parent.left - drag.current.dx, e.clientY - parent.top - drag.current.dy);
        }}
        onPointerUp={() => (drag.current = null)}
        onPointerCancel={() => (drag.current = null)}
        onDblClick={() => patch(id, { collapsed: !collapsed })}
        onKeyDown={e => {
          const step = e.shiftKey ? 40 : 10;
          const d = ({ ArrowLeft: [-step, 0], ArrowRight: [step, 0], ArrowUp: [0, -step], ArrowDown: [0, step] } as Record<string, [number, number]>)[e.key];
          if (!d) return;
          e.preventDefault();
          e.stopPropagation();
          const at = here();
          place(at.x + d[0], at.y + d[1]);
        }}
      >
        <span class="p-title">{title}</span>
        {extra}
        <button type="button" class="p-fold" aria-expanded={!collapsed} aria-label={collapsed ? `Open ${title}` : `Fold ${title}`} onClick={() => patch(id, { collapsed: !collapsed })}>
          <ChevronDown size={15} />
        </button>
      </header>
      {!collapsed && (
        <div class="p-body" style={bodyMax ? { maxHeight: `${bodyMax}px` } : undefined}>
          {children}
        </div>
      )}
    </section>
  );
}

/** A saved panel may be off screen after the window shrinks: pull it back (display only; the saved value is kept). */
function clampX(x: number, el: HTMLElement | null, stage: { w: number; h: number }): number {
  if (!el || !stage.w) return x;
  return clampPosition(x, 0, { w: el.offsetWidth, h: el.offsetHeight }, stage).x;
}
