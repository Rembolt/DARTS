import { describe, expect, it } from 'vitest';
import { layoutPins, type PinInput } from './pins';

const at = (x: number, y: number, distance = 3, visible = true) => ({ x, y, distance, visible });
const pin = (id: string, kind: PinInput['kind'], screen: ReturnType<typeof at>, hidden = false): PinInput => ({ id, kind, screen, hidden });

describe('layoutPins', () => {
  it('drops a door behind a wall', () => {
    expect(layoutPins([pin('d', 'opening', at(100, 100), true)])).toEqual([]);
  });
  it('keeps a speaker behind a wall as a ghost', () => {
    const [p] = layoutPins([pin('s', 'speaker', at(100, 100), true)]);
    expect(p.state).toBe('ghost');
    expect(p.opacity).toBeLessThan(1);
  });
  it('drops far doors and off-screen pins', () => {
    expect(layoutPins([pin('d', 'opening', at(100, 100, 15)), pin('s', 'speaker', at(0, 0, 3, false))])).toEqual([]);
  });
  it('lets the speaker win a collision with a window', () => {
    const out = layoutPins([pin('w', 'opening', at(100, 100, 2)), pin('s', 'speaker', at(110, 105, 5))]);
    expect(out.map(p => p.id)).toEqual(['s']);
  });
  it('lets the nearer of two windows win', () => {
    const out = layoutPins([pin('far', 'opening', at(100, 100, 6)), pin('near', 'opening', at(105, 100, 2))]);
    expect(out.map(p => p.id)).toEqual(['near']);
  });
  it('keeps pins that do not collide', () => {
    expect(layoutPins([pin('a', 'opening', at(100, 100)), pin('b', 'opening', at(300, 100))])).toHaveLength(2);
  });
});
