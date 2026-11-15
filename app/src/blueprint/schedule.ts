// When the blueprint renders (mvp-design.md 7: "it only redraws when the pose or the paths change, and it is not drawn
// at all while hidden").

/**
 * At most one render per animation frame, and none while hidden. `request()` while visible queues one frame; repeated
 * requests before it fires do nothing more. Showing renders once on the next frame. A request made during a render
 * queues a fresh frame, so the latest change is never lost.
 */
export function createScheduler(
  render: () => void,
  raf: (cb: () => void) => unknown = cb => requestAnimationFrame(cb),
): { request(): void; setVisible(visible: boolean): void } {
  let visible = false;
  let queued = false;

  const frame = () => {
    queued = false;
    if (visible) render();
  };
  const queue = () => {
    if (queued) return;
    queued = true;
    raf(frame);
  };

  return {
    request() {
      if (visible) queue();
    },
    setVisible(v) {
      visible = v;
      if (v) queue();
    },
  };
}

/** The canvas size for a box: whole CSS pixels, at least 1, with the pixel ratio clamped to 1–2 (sharp, not costly). */
export function canvasSize(
  box: { width: number; height: number },
  pixelRatio: number,
): { width: number; height: number; pixelRatio: number } {
  return {
    width: Math.max(1, Math.round(box.width)),
    height: Math.max(1, Math.round(box.height)),
    pixelRatio: Math.min(2, Math.max(1, pixelRatio)),
  };
}
