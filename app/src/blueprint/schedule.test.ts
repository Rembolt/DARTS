import { describe, it, expect, vi } from 'vitest';
import { canvasSize, createScheduler } from './schedule';

function fakeRaf() {
  const queue: (() => void)[] = [];
  return { raf: (cb: () => void) => queue.push(cb), flush: () => queue.splice(0).forEach(cb => cb()), queue };
}

describe('createScheduler', () => {
  it('renders once for many requests in one frame', () => {
    const f = fakeRaf();
    const render = vi.fn();
    const s = createScheduler(render, f.raf);
    s.setVisible(true);
    f.flush();
    render.mockClear();
    for (let i = 0; i < 10; i++) s.request();
    expect(f.queue).toHaveLength(1);
    f.flush();
    expect(render).toHaveBeenCalledTimes(1);
  });

  it('does not render while hidden, and renders once when shown', () => {
    const f = fakeRaf();
    const render = vi.fn();
    const s = createScheduler(render, f.raf);
    s.request();
    expect(f.queue).toHaveLength(0);
    s.setVisible(true);
    f.flush();
    expect(render).toHaveBeenCalledTimes(1);
  });

  it('skips a queued frame after being hidden', () => {
    const f = fakeRaf();
    const render = vi.fn();
    const s = createScheduler(render, f.raf);
    s.setVisible(true);
    f.flush();
    render.mockClear();
    s.request();
    s.setVisible(false);
    f.flush();
    expect(render).not.toHaveBeenCalled();
  });

  it('keeps a request made during a render', () => {
    const f = fakeRaf();
    let n = 0;
    const s = createScheduler(() => {
      if (n++ === 0) s.request();
    }, f.raf);
    s.setVisible(true);
    f.flush();
    f.flush();
    expect(n).toBe(2);
  });
});

describe('canvasSize', () => {
  it('follows the box and the pixel ratio', () =>
    expect(canvasSize({ width: 800.4, height: 600.6 }, 1.5)).toEqual({ width: 800, height: 601, pixelRatio: 1.5 }));
  it('clamps the pixel ratio to 1..2', () => {
    expect(canvasSize({ width: 10, height: 10 }, 3).pixelRatio).toBe(2);
    expect(canvasSize({ width: 10, height: 10 }, 0.5).pixelRatio).toBe(1);
  });
  it('never returns a zero size', () => expect(canvasSize({ width: 0, height: 0 }, 1)).toEqual({ width: 1, height: 1, pixelRatio: 1 }));
});
