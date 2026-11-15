import type { Vec3 } from '../sim/types';

const CLICK_MAX_PX = 6;
const CLICK_MAX_MS = 300;
const WALL_OFFSET_M = 0.3;

export function isClick(
  down: { x: number; y: number; t: number },
  up: { x: number; y: number; t: number },
): boolean {
  return Math.hypot(up.x - down.x, up.y - down.y) < CLICK_MAX_PX && up.t - down.t < CLICK_MAX_MS;
}

export function speakerPosition(hit: { position: Vec3; normal: Vec3 }): Vec3 {
  return [
    hit.position[0] + hit.normal[0] * WALL_OFFSET_M,
    hit.position[1] + hit.normal[1] * WALL_OFFSET_M,
    hit.position[2] + hit.normal[2] * WALL_OFFSET_M,
  ];
}

export function createPlacement(deps: {
  target: Window;
  pointer(): { position: Vec3; normal: Vec3 } | null;
  place(point: Vec3): void;
  hint(text: string | null): void;
}): { begin(): void; cancel(): void; dropAtPointer(): boolean } {
  const { target, pointer, place, hint } = deps;
  let active = false;
  type Press = { x: number; y: number; t: number; target: EventTarget | null; init: PointerEventInit; replayed: boolean };
  let down: Press | null = null;
  let replaying = false;

  /**
   * The press is held back from the tour. The tour walks to a spot on any press and release (even a release far away), so the
   * only safe way to place without moving is that it never sees a click. If the press turns out to be a drag or a long hold,
   * it is handed over late (same place, same pointer) and the tour carries on as usual: looking around still works.
   */
  function handOver(press: Press): void {
    if (press.replayed) return;
    press.replayed = true;
    const Ctor = ((target as unknown as { PointerEvent?: typeof PointerEvent }).PointerEvent ?? globalThis.PointerEvent) as typeof PointerEvent | undefined;
    const t = press.target as Element | null;
    if (!Ctor || !t || typeof t.dispatchEvent !== 'function') return;
    replaying = true;
    try {
      t.dispatchEvent(new Ctor('pointerdown', press.init));
    } finally {
      replaying = false;
    }
  }

  function onPointerDown(e: Event) {
    if (replaying) return; // our own late hand-over, on its way to the tour
    const pe = e as PointerEvent;
    const x = pe.clientX ?? 0;
    const y = pe.clientY ?? 0;
    down = {
      x,
      y,
      t: Date.now(),
      target: pe.target,
      replayed: false,
      init: {
        bubbles: true,
        cancelable: true,
        clientX: x,
        clientY: y,
        pointerId: pe.pointerId,
        pointerType: pe.pointerType,
        isPrimary: pe.isPrimary,
        button: pe.button,
        buttons: pe.buttons,
        ctrlKey: pe.ctrlKey,
        shiftKey: pe.shiftKey,
        altKey: pe.altKey,
        metaKey: pe.metaKey,
      },
    };
    e.stopPropagation();
    e.preventDefault(); // also stops the browser's follow-up mousedown and mouseup
  }

  function onPointerMove(e: Event) {
    if (!down || down.replayed) return;
    const pe = e as PointerEvent;
    if (Math.hypot((pe.clientX ?? 0) - down.x, (pe.clientY ?? 0) - down.y) >= CLICK_MAX_PX) handOver(down);
  }

  /** The browser still sends `click` after the release; the tour walks on it. Swallow that one, once. */
  function swallowClick(): void {
    const stop = (e: Event) => {
      e.stopPropagation();
      e.preventDefault();
      done();
    };
    const done = () => {
      clearTimeout(timer);
      target.removeEventListener('click', stop, true);
    };
    target.addEventListener('click', stop, true);
    const timer = setTimeout(done, 600);
  }

  function onPointerUp(e: Event) {
    const start = down;
    down = null;
    if (!start || start.replayed) return; // the tour has this press: let its release through
    const pe = e as PointerEvent;
    const up = { x: pe.clientX ?? 0, y: pe.clientY ?? 0, t: Date.now() };
    if (!isClick(start, up)) {
      handOver(start); // a drag that never moved, or a long hold: the tour gets the press and the release
      return;
    }
    // A click while placing is ours, hit or miss; a miss just keeps placing mode on.
    e.preventDefault();
    e.stopPropagation();
    swallowClick();
    const hit = pointer();
    if (!hit) return;
    place(speakerPosition(hit));
    cancel();
  }

  function onKeyDown(e: Event) {
    if ((e as KeyboardEvent).key === 'Escape') cancel();
  }

  function begin() {
    if (active) return;
    active = true;
    hint('Click a surface. Esc cancels');
    target.addEventListener('pointerdown', onPointerDown, true);
    target.addEventListener('pointermove', onPointerMove, true);
    target.addEventListener('pointerup', onPointerUp, true);
    target.addEventListener('keydown', onKeyDown, true);
  }

  function cancel() {
    if (!active) return;
    active = false;
    down = null;
    hint(null);
    target.removeEventListener('pointerdown', onPointerDown, true);
    target.removeEventListener('pointermove', onPointerMove, true);
    target.removeEventListener('pointerup', onPointerUp, true);
    target.removeEventListener('keydown', onKeyDown, true);
  }

  function dropAtPointer(): boolean {
    const hit = pointer();
    if (!hit) return false;
    place(speakerPosition(hit));
    return true;
  }

  return { begin, cancel, dropAtPointer };
}
