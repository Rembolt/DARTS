import { describe, it, expect, vi } from 'vitest';
import { viewerUrl, withTimeout, formatPose } from './viewer';

describe('viewerUrl', () => {
  it('builds the Bundle address', () => {
    expect(viewerUrl({ sdkKey: 'abc', modelId: 'Ki9YdfpNKum' }))
      .toBe('/bundle/showcase.html?m=Ki9YdfpNKum&applicationKey=abc&play=1&qs=1');
  });

  it('encodes characters that would break the address', () => {
    expect(viewerUrl({ sdkKey: 'a&b=c', modelId: 'Ki9YdfpNKum' })).toContain('applicationKey=a%26b%3Dc&');
  });
});

describe('withTimeout', () => {
  it('passes the result through when it arrives in time', async () => {
    await expect(withTimeout(Promise.resolve(7), 1000, 'too slow')).resolves.toBe(7);
  });

  it('rejects with the message when time runs out', async () => {
    vi.useFakeTimers();
    const p = withTimeout(new Promise(() => {}), 60_000, 'Viewer did not start: timed out after 60 s');
    vi.advanceTimersByTime(60_000);
    await expect(p).rejects.toThrow('Viewer did not start: timed out after 60 s');
    vi.useRealTimers();
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
