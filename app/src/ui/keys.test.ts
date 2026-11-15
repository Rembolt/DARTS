import { describe, expect, it } from 'vitest';
import { isTyping, plain } from './keys';

const key = (k: string, over: Record<string, unknown> = {}) => ({ key: k, repeat: false, ctrlKey: false, metaKey: false, altKey: false, target: { tagName: 'DIV' }, ...over }) as unknown as KeyboardEvent;

describe('keys', () => {
  it('accepts a plain key press', () => expect(plain(key('S'), 's')).toBe(true));
  it('ignores modifiers and repeats', () => {
    expect(plain(key('s', { metaKey: true }), 's')).toBe(false);
    expect(plain(key('s', { repeat: true }), 's')).toBe(false);
  });
  it('stays out of text fields, also those inside the tour window (another document)', () => {
    expect(isTyping(key('s', { target: { tagName: 'INPUT' } }))).toBe(true);
    expect(isTyping(key('s', { target: { tagName: 'DIV', isContentEditable: true } }))).toBe(true);
    expect(plain(key('s', { target: { tagName: 'TEXTAREA' } }), 's')).toBe(false);
  });
});
