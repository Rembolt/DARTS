import { it, expect } from 'vitest';
import { ceilingsVisible, createModeSwitch } from './mode';

it('starts in the configured mode and flips between solid and x-ray', () => {
  const m = createModeSwitch('solid');
  expect(m.mode()).toBe('solid');
  expect(m.label()).toBe('X-ray');
  expect(m.title()).toBe('See through the walls');
  expect(m.next()).toBe('xray');
  expect(m.label()).toBe('Solid');
  expect(m.title()).toBe('Show solid walls');
  expect(m.next()).toBe('solid');
});

it('hides ceilings when looking from outside (dollhouse, floor plan), so the rooms show', () => {
  expect(ceilingsVisible('mode.inside')).toBe(true);
  expect(ceilingsVisible('mode.dollhouse')).toBe(false);
  expect(ceilingsVisible('mode.floorplan')).toBe(false);
  expect(ceilingsVisible('mode.transitioning')).toBe(true);
});
