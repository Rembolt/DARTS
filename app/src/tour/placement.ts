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
  let down: { x: number; y: number; t: number } | null = null;

  function onPointerDown(e: Event) {
    const pe = e as PointerEvent;
    down = { x: pe.clientX ?? 0, y: pe.clientY ?? 0, t: Date.now() };
  }

  function onPointerUp(e: Event) {
    const start = down;
    down = null;
    if (!start) return;
    const pe = e as PointerEvent;
    const up = { x: pe.clientX ?? 0, y: pe.clientY ?? 0, t: Date.now() };
    if (!isClick(start, up)) return;
    const hit = pointer();
    if (!hit) return;
    e.preventDefault();
    e.stopPropagation();
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
    target.addEventListener('pointerup', onPointerUp, true);
    target.addEventListener('keydown', onKeyDown, true);
  }

  function cancel() {
    if (!active) return;
    active = false;
    down = null;
    hint(null);
    target.removeEventListener('pointerdown', onPointerDown, true);
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
