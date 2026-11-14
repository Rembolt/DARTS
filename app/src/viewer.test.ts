import { describe, it, expect, vi, afterEach } from 'vitest';
import { viewerUrl, notifyIfSlow, formatPose, startFailureMessage } from './viewer';

describe('viewerUrl', () => {
  it('builds the Bundle address', () => {
    expect(viewerUrl({ sdkKey: 'abc', modelId: 'Ki9YdfpNKum' }))
      .toBe('/bundle/showcase.html?m=Ki9YdfpNKum&applicationKey=abc&play=1&qs=1');
  });

  it('encodes characters that would break the address', () => {
    expect(viewerUrl({ sdkKey: 'a&b=c', modelId: 'Ki9YdfpNKum' })).toContain('applicationKey=a%26b%3Dc&');
  });
});

describe('notifyIfSlow', () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  it('passes the result through and stays quiet when it arrives in time', async () => {
    vi.useFakeTimers();
    const onSlow = vi.fn();
    await expect(notifyIfSlow(Promise.resolve(7), 1000, onSlow)).resolves.toBe(7);
    vi.advanceTimersByTime(5000);
    expect(onSlow).not.toHaveBeenCalled();
  });

  it('notifies once when time runs out, and still delivers a late result', async () => {
    vi.useFakeTimers();
    const onSlow = vi.fn();
    let finish!: (v: string) => void;
    const p = notifyIfSlow(new Promise<string>(r => { finish = r; }), 60_000, onSlow);
    vi.advanceTimersByTime(60_000);
    expect(onSlow).toHaveBeenCalledTimes(1);
    finish('late');
    await expect(p).resolves.toBe('late');
  });

  it('passes errors through', async () => {
    await expect(notifyIfSlow(Promise.reject(new Error('boom')), 1000, () => {})).rejects.toThrow('boom');
  });
});

describe('startFailureMessage', () => {
  it('prefixes the message of other errors', () => {
    expect(startFailureMessage(new Error('the viewer page did not load the SDK')))
      .toBe('Viewer did not start: the viewer page did not load the SDK');
  });

  it('reads primitives as text', () => {
    expect(startFailureMessage('boom')).toBe('Viewer did not start: boom');
  });

  it('never prints [object Object]', () => {
    expect(startFailureMessage({ code: 1 })).toBe('Viewer did not start: unknown error');
    expect(startFailureMessage(null)).toBe('Viewer did not start: unknown error');
  });
});

describe('formatPose', () => {
  it('shows position, rotation and mode', () => {
    expect(formatPose({ position: { x: 1.234, y: 1.5, z: -0.4 }, rotation: { x: -10, y: 45.25 }, mode: 'mode.inside' }))
      .toBe('x 1.23  y 1.50  z -0.40 m  ·  pitch -10.0°  yaw 45.3°  ·  inside');
  });

  it('works in dollhouse mode', () => {
    expect(formatPose({ position: { x: 0, y: 12, z: 0 }, rotation: { x: -60, y: 0 }, mode: 'mode.dollhouse' }))
      .toBe('x 0.00  y 12.00  z 0.00 m  ·  pitch -60.0°  yaw 0.0°  ·  dollhouse');
  });
});
