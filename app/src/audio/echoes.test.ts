import { describe, it, expect } from 'vitest';
import { clearDirectGain, echoGain, gainStartTime, planDelayChange, slotPannerPosition } from './echoes';
import { dbToGain } from './levels';
import { AUDIO } from '../config';

describe('slotPannerPosition', () => {
  it('sits slotPannerDistance m from the listener along the fixed world direction', () => {
    expect(slotPannerPosition([1, 2, 3], [0, 0, -1])).toEqual([1, 2, 3 - AUDIO.slotPannerDistance]);
    expect(slotPannerPosition([0, 0, 0], [0.6, 0.8, 0], 5)).toEqual([3, 4, 0]);
  });
});

describe('echo gains (mvp-design.md 6)', () => {
  it('uses the unobstructed direct gain: 1/max(D,1) indoors, the level outdoors', () => {
    expect(clearDirectGain('indoor', 4)).toBe(0.25);
    expect(clearDirectGain('indoor', 0.3)).toBe(1);
    expect(clearDirectGain('outdoor', 100)).toBeCloseTo(dbToGain(-12));
  });

  it('is sqrt(slot energy mid) × that gain, and 0 for an empty slot', () => {
    expect(echoGain(0.04, 0.5)).toBeCloseTo(0.1);
    expect(echoGain(0, 0.5)).toBe(0);
    expect(echoGain(-1, 0.5)).toBe(0);
  });
});

describe('planDelayChange', () => {
  const t = 10;

  it('glides a small change smoothly', () => {
    expect(planDelayChange({ now: t, currentDelay: 0.01, nextDelay: 0.011, currentGain: 0.3, nextGain: 0.2 })).toEqual({
      kind: 'glide', delay: 0.011, gain: 0.2, at: t,
    });
  });

  it('dips a jump over 10 ms: gain to 0 over 20 ms, set the delay, gain back over 20 ms', () => {
    const plan = planDelayChange({ now: t, currentDelay: 0.01, nextDelay: 0.03, currentGain: 0.3, nextGain: 0.2 });
    const d = AUDIO.delayDipTime;
    expect(plan).toEqual({
      kind: 'dip', from: 0.3, delay: 0.03, gain: 0.2, dipStart: t, delayAt: t + d, end: t + 2 * d,
    });
  });

  it('sets a silent slot at once: nothing to click', () => {
    expect(planDelayChange({ now: t, currentDelay: 0.01, nextDelay: 0.15, currentGain: 0, nextGain: 0.2 }).kind).toBe('set');
    expect(planDelayChange({ now: t, currentDelay: 0.01, nextDelay: 0.15, currentGain: 0.4, nextGain: 0 }).kind).toBe('dip');
  });

  it('clamps delays to [0, maxDelay]', () => {
    expect(planDelayChange({ now: t, currentDelay: 0.199, nextDelay: 0.5, currentGain: 1, nextGain: 1 })).toMatchObject({ kind: 'glide', delay: AUDIO.maxDelay });
    expect(planDelayChange({ now: t, currentDelay: 0, nextDelay: -0.001, currentGain: 1, nextGain: 1 })).toMatchObject({ kind: 'glide', delay: 0 });
  });

  it('glides the 2–10 ms changes a walk makes between traces, instead of muting the slot', () => {
    expect(planDelayChange({ now: t, currentDelay: 0.01, nextDelay: 0.015, currentGain: 1, nextGain: 1 }).kind).toBe('glide');
    expect(planDelayChange({ now: t, currentDelay: 0.01, nextDelay: 0.0195, currentGain: 1, nextGain: 1 }).kind).toBe('glide');
  });

  it('glides a change under the jump threshold', () => {
    expect(planDelayChange({ now: t, currentDelay: 0.01, nextDelay: 0.01 + AUDIO.delayJumpThreshold / 2, currentGain: 1, nextGain: 1 }).kind).toBe('glide');
  });
});

describe('gainStartTime', () => {
  it('holds gain changes until a running dip has finished', () => {
    expect(gainStartTime(5, 0)).toBe(5);
    expect(gainStartTime(5, 5.03)).toBe(5.03);
    expect(gainStartTime(5.1, 5.03)).toBe(5.1);
  });
});
