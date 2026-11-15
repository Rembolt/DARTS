// Click-to-add (v2-design.md 5.4): a press and release close in space and time is a click; anything longer is a drag
// and goes to the tour so the user can still look around.
export const CLICK_MAX_PX = 6;
export const CLICK_MAX_MS = 300;

export function isClick(down: { x: number; y: number; t: number }, up: { x: number; y: number; t: number }): boolean {
  return Math.hypot(up.x - down.x, up.y - down.y) < CLICK_MAX_PX && up.t - down.t < CLICK_MAX_MS;
}

/**
 * While `active()` is true, watch the tour's window for a click and call `onClick`. Captured events are stopped for
 * clicks so the tour does not also jump to a sweep. Returns an remover.
 */
export function listenForPlacement(win: Window, active: () => boolean, onClick: () => void): () => void {
  let down: { x: number; y: number; t: number } | null = null;
  const onDown = (e: PointerEvent) => {
    if (!active()) return;
    down = { x: e.clientX, y: e.clientY, t: e.timeStamp };
  };
  const onUp = (e: PointerEvent) => {
    if (!active() || !down) return;
    const click = isClick(down, { x: e.clientX, y: e.clientY, t: e.timeStamp });
    down = null;
    if (!click) return;
    e.preventDefault();
    e.stopPropagation();
    onClick();
  };
  win.addEventListener('pointerdown', onDown, true);
  win.addEventListener('pointerup', onUp, true);
  return () => {
    win.removeEventListener('pointerdown', onDown, true);
    win.removeEventListener('pointerup', onUp, true);
  };
}
