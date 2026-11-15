import { describe, expect, it, vi } from 'vitest';
import { createPlacement, isClick, speakerPosition } from './placement';

describe('placement', () => {
  it('tells a click from a drag', () => {
    expect(isClick({ x: 0, y: 0, t: 0 }, { x: 3, y: 3, t: 200 })).toBe(true);
    expect(isClick({ x: 0, y: 0, t: 0 }, { x: 10, y: 0, t: 100 })).toBe(false);
    expect(isClick({ x: 0, y: 0, t: 0 }, { x: 0, y: 0, t: 400 })).toBe(false);
  });

  it('stands the speaker 0.3 m off the wall', () => {
    expect(speakerPosition({ position: [1, 1, 1], normal: [0, 0, 1] })).toEqual([1, 1, 1.3]);
  });

  it('places on a click and leaves placement mode', () => {
    const target = new EventTarget() as unknown as Window;
    const place = vi.fn();
    const hint = vi.fn();
    const p = createPlacement({
      target,
      pointer: () => ({ position: [2, 1, 3], normal: [0, 1, 0] }),
      place,
      hint,
    });

    p.begin();
    expect(hint).toHaveBeenCalledWith('Click a surface. Esc cancels');

    const down = new Event('pointerdown', { cancelable: true });
    Object.assign(down, { clientX: 10, clientY: 10 });
    target.dispatchEvent(down);

    const up = new Event('pointerup', { cancelable: true });
    Object.assign(up, { clientX: 11, clientY: 11 });
    target.dispatchEvent(up);

    expect(up.defaultPrevented).toBe(true);
    expect(place).toHaveBeenCalledWith([2, 1.3, 3]);
    expect(hint).toHaveBeenLastCalledWith(null);
  });

  it('lets a drag through and stays in placement mode', () => {
    const target = new EventTarget() as unknown as Window;
    const place = vi.fn();
    const hint = vi.fn();
    const p = createPlacement({
      target,
      pointer: () => ({ position: [2, 1, 3], normal: [0, 1, 0] }),
      place,
      hint,
    });

    p.begin();
    const down = new Event('pointerdown', { cancelable: true });
    Object.assign(down, { clientX: 10, clientY: 10 });
    target.dispatchEvent(down);

    const up = new Event('pointerup', { cancelable: true });
    Object.assign(up, { clientX: 40, clientY: 10 });
    target.dispatchEvent(up);

    expect(up.defaultPrevented).toBe(false);
    expect(place).not.toHaveBeenCalled();
    expect(hint).not.toHaveBeenLastCalledWith(null);
  });

  it('places nothing when there is no surface under the cursor', () => {
    const target = new EventTarget() as unknown as Window;
    const place = vi.fn();
    const p = createPlacement({
      target,
      pointer: () => null,
      place,
      hint: vi.fn(),
    });

    p.begin();
    const down = new Event('pointerdown');
    Object.assign(down, { clientX: 10, clientY: 10 });
    target.dispatchEvent(down);
    const up = new Event('pointerup');
    Object.assign(up, { clientX: 10, clientY: 10 });
    target.dispatchEvent(up);
    expect(place).not.toHaveBeenCalled();
    expect(p.dropAtPointer()).toBe(false);
  });

  it('cancels on Escape', () => {
    const target = new EventTarget() as unknown as Window;
    const hint = vi.fn();
    const p = createPlacement({
      target,
      pointer: () => ({ position: [0, 0, 0], normal: [0, 1, 0] }),
      place: vi.fn(),
      hint,
    });
    p.begin();
    const esc = new Event('keydown');
    Object.assign(esc, { key: 'Escape' });
    target.dispatchEvent(esc);
    expect(hint).toHaveBeenLastCalledWith(null);
  });

  it('S drops a speaker at the pointer', () => {
    const target = new EventTarget() as unknown as Window;
    const place = vi.fn();
    const p = createPlacement({
      target,
      pointer: () => ({ position: [1, 2, 3], normal: [1, 0, 0] }),
      place,
      hint: vi.fn(),
    });
    expect(p.dropAtPointer()).toBe(true);
    expect(place).toHaveBeenCalledWith([1.3, 2, 3]);
  });
});
