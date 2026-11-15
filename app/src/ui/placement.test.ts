import { describe, expect, it } from 'vitest';
import { isClick } from './placement';

describe('isClick', () => {
  const down = { x: 100, y: 100, t: 0 };
  it('accepts a short, still press', () => expect(isClick(down, { x: 102, y: 101, t: 120 })).toBe(true));
  it('rejects a drag', () => expect(isClick(down, { x: 140, y: 100, t: 120 })).toBe(false));
  it('rejects a long press', () => expect(isClick(down, { x: 100, y: 100, t: 400 })).toBe(false));
});
