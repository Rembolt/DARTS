import { describe, it, expect, vi } from 'vitest';
import { bindShortcut, createToggle } from './toggle';

it('starts disabled while the mesh loads', () => {
  expect(createToggle().view()).toEqual({ enabled: false, pressed: false, label: 'Blueprint', title: 'Loading the mesh…' });
});

it('ignores presses before the mesh is ready', () => {
  const t = createToggle();
  expect(t.toggle().pressed).toBe(false);
});

it('enables when the mesh is ready and flips between Blueprint and Tour', () => {
  const t = createToggle();
  t.ready();
  expect(t.view()).toEqual({ enabled: true, pressed: false, label: 'Blueprint', title: 'Show the blueprint (B)' });
  expect(t.toggle()).toEqual({ enabled: true, pressed: true, label: 'Tour', title: 'Back to the tour (B)' });
  expect(t.toggle().pressed).toBe(false);
});

it('stays disabled with the reason when the mesh failed', () => {
  const t = createToggle();
  t.failed('Mesh download failed: HTTP 403');
  expect(t.view()).toEqual({
    enabled: false,
    pressed: false,
    label: 'Blueprint',
    title: 'Blueprint needs the mesh: Mesh download failed: HTTP 403',
  });
  expect(t.toggle().pressed).toBe(false);
});

it('takes B as the shortcut, except while typing', () => {
  const t = createToggle();
  expect(t.isShortcut('b', { tagName: 'BODY' })).toBe(true);
  expect(t.isShortcut('B', null)).toBe(true);
  expect(t.isShortcut('b', { tagName: 'INPUT' })).toBe(false);
  expect(t.isShortcut('b', { tagName: 'DIV', isContentEditable: true })).toBe(false);
  expect(t.isShortcut('p', { tagName: 'BODY' })).toBe(false);
});

describe('bindShortcut', () => {
  const key = (k: string, extra: Partial<KeyboardEvent> = {}) =>
    Object.assign(new Event('keydown'), { key: k, repeat: false, ctrlKey: false, metaKey: false, altKey: false, ...extra });

  it('flips on B pressed in the page or inside the tour, so a click into the tour does not disable it', () => {
    const page = new EventTarget();
    const tour = new EventTarget();
    const flip = vi.fn();
    const bind = bindShortcut(createToggle(), flip);
    bind(page);
    bind(tour);
    page.dispatchEvent(key('b'));
    tour.dispatchEvent(key('B'));
    expect(flip).toHaveBeenCalledTimes(2);
  });

  it('ignores held keys and B with a modifier', () => {
    const target = new EventTarget();
    const flip = vi.fn();
    bindShortcut(createToggle(), flip)(target);
    target.dispatchEvent(key('b', { repeat: true }));
    target.dispatchEvent(key('b', { ctrlKey: true }));
    target.dispatchEvent(key('b', { metaKey: true }));
    expect(flip).not.toHaveBeenCalled();
  });
});
