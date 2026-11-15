import { describe, it, expect } from 'vitest';
import { FRONT_URL, readRoute, tourUrl } from './route';

describe('route', () => {
  it('reads the route', () => {
    expect(readRoute('')).toEqual({ state: 'front' });
    expect(readRoute('?m=Ki9YdfpNKum')).toEqual({ state: 'tour', modelId: 'Ki9YdfpNKum' });
    expect(readRoute('?m=../x')).toEqual({ state: 'front' });
    expect(tourUrl('Ki9YdfpNKum')).toBe('/?m=Ki9YdfpNKum');
  });

  it('sends anything that is not one valid id to the front door', () => {
    expect(readRoute('?m=')).toEqual({ state: 'front' });
    expect(readRoute('?m=Ki9YdfpNKumX')).toEqual({ state: 'front' });
    expect(readRoute('?x=Ki9YdfpNKum')).toEqual({ state: 'front' });
    expect(FRONT_URL).toBe('/');
  });
});
