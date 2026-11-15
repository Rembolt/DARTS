import { describe, it, expect } from 'vitest';
import { ReverbCache, ReverbScheduler } from './reverb-cache';
import type { Vec3 } from './types';

const at: Vec3 = [1, 2, 3];

describe('ReverbCache', () => {
  it('stores and returns copies per room', () => {
    const c = new ReverbCache();
    expect(c.get('a')).toBeUndefined();
    const t: [number, number, number] = [1, 0.8, 0.6];
    c.set('a', t);
    t[0] = 9;
    const got = c.get('a')!;
    expect(got).toEqual([1, 0.8, 0.6]);
    got[1] = 9;
    expect(c.get('a')).toEqual([1, 0.8, 0.6]);
    expect(c.has('a')).toBe(true);
    expect(c.size).toBe(1);
  });
});

describe('ReverbScheduler', () => {
  it('requests a job when entering an unknown room', () => {
    const s = new ReverbScheduler();
    expect(s.enterRoom('a', at)).toEqual({ request: { type: 'reverb', roomId: 'a', listener: [1, 2, 3] } });
    expect(s.busy).toBe(true);
  });

  it('ignores the same room and missing room ids', () => {
    const s = new ReverbScheduler();
    s.enterRoom('a', at);
    expect(s.enterRoom('a', at)).toEqual({});
    expect(s.enterRoom(null, at)).toEqual({});
    expect(s.enterRoom('', at)).toEqual({});
    expect(s.currentRoom).toBe('a');
  });

  it('uses the cache without a job', () => {
    const s = new ReverbScheduler();
    s.enterRoom('a', at);
    s.onResult('a', [1, 1, 1]);
    s.enterRoom('b', at);
    s.onResult('b', [2, 2, 2]);
    expect(s.enterRoom('a', at)).toEqual({ echoTime: [1, 1, 1] });
    expect(s.busy).toBe(false);
  });

  it('returns the echo time when the reply is for the current room', () => {
    const s = new ReverbScheduler();
    s.enterRoom('a', at);
    expect(s.onResult('a', [0.9, 0.8, 0.7])).toEqual({ echoTime: [0.9, 0.8, 0.7] });
    expect(s.busy).toBe(false);
  });

  it('runs one job at a time and the newest room wins', () => {
    const s = new ReverbScheduler();
    s.enterRoom('a', at);
    expect(s.enterRoom('b', [0, 0, 0])).toEqual({});
    expect(s.enterRoom('c', [5, 5, 5])).toEqual({});
    const d = s.onResult('a', [1, 1, 1]);
    expect(d.echoTime).toBeUndefined(); // listener is in c now
    expect(d.request).toEqual({ type: 'reverb', roomId: 'c', listener: [5, 5, 5] });
    expect(s.cache.get('a')).toEqual([1, 1, 1]);
    expect(s.onResult('c', [2, 2, 2])).toEqual({ echoTime: [2, 2, 2] });
  });

  it('drops the pending room when the listener goes back to the room in flight', () => {
    const s = new ReverbScheduler();
    s.enterRoom('a', at);
    s.enterRoom('b', at);
    expect(s.enterRoom('a', at)).toEqual({});
    expect(s.onResult('a', [1, 1, 1])).toEqual({ echoTime: [1, 1, 1] });
    expect(s.busy).toBe(false);
  });

  it('drops the pending room when the listener moves to a cached room', () => {
    const s = new ReverbScheduler();
    s.enterRoom('a', at);
    s.onResult('a', [1, 1, 1]);
    s.enterRoom('b', at);
    s.enterRoom('c', at);
    expect(s.enterRoom('a', at)).toEqual({ echoTime: [1, 1, 1] });
    expect(s.onResult('b', [2, 2, 2])).toEqual({});
    expect(s.busy).toBe(false);
  });

  it('frees the worker on error and retries the room later', () => {
    const s = new ReverbScheduler();
    s.enterRoom('a', at);
    s.enterRoom('b', at);
    expect(s.onError()).toEqual({ request: { type: 'reverb', roomId: 'b', listener: [1, 2, 3] } });
    s.onError();
    expect(s.busy).toBe(false);
    s.enterRoom('a', at);
    expect(s.busy).toBe(true);
  });
});
