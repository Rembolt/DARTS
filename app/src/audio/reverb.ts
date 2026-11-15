// The shared reverb (mvp-design.md 6, "Reverb"): two convolvers with the impulse response from impulse.ts, and a
// crossfade between them when the echo time changes enough. The audio engine connects each source's send gain to
// `input` and `output` to its master; this module does no wiring of its own beyond its two paths.
import { AUDIO } from '../config';
import { clampEchoTime } from '../sim/decay';
import type { Bands } from '../sim/types';
import { makeImpulse } from './impulse';

/** Points in each crossfade curve. */
const CURVE_POINTS = 16;

/**
 * Whether a new echo time should replace the current impulse response: true when there is none yet, or when any
 * band changed by more than `threshold` (a fraction, 0.15 = 15%) of the current value.
 */
export function shouldSwap(current: Bands | null | undefined, next: Bands, threshold = AUDIO.reverbChangeThreshold): boolean {
  if (!current) return true;
  for (let b = 0; b < 3; b++) {
    if (!(Math.abs(next[b] - current[b]) <= threshold * Math.abs(current[b]))) return true;
  }
  return false;
}

/** Equal-power crossfade curve from `from` to `to` (0..1 gains). Two unrelated
 *  reverbs add in power, so this keeps the level steady through the swap where a straight line would dip 3 dB.
 *  Returned as points; `Reverb` plays them as short straight ramps. */
export function crossfadeCurve(from: number, to: number, points = CURVE_POINTS): Float32Array {
  const c = new Float32Array(points);
  for (let i = 0; i < points; i++) {
    const p = i / (points - 1);
    c[i] = to >= from ? from + (to - from) * Math.sin((p * Math.PI) / 2) : to + (from - to) * Math.cos((p * Math.PI) / 2);
  }
  return c;
}

type Slot = { convolver: ConvolverNode | null; fade: GainNode };

export class Reverb {
  readonly input: GainNode;
  readonly output: GainNode;
  private readonly ctx: BaseAudioContext;
  private readonly slots: [Slot, Slot];
  private active = -1;
  private current: Bands | null = null;
  private readonly crossfade: number;
  private readonly threshold: number;
  private readonly seed: number;

  constructor(
    ctx: BaseAudioContext,
    options: { crossfade?: number; threshold?: number; seed?: number } = {},
  ) {
    this.ctx = ctx;
    this.crossfade = options.crossfade ?? AUDIO.reverbCrossfade;
    this.threshold = options.threshold ?? AUDIO.reverbChangeThreshold;
    this.seed = options.seed ?? 1;
    this.input = ctx.createGain();
    this.output = ctx.createGain();
    const slot = (): Slot => {
      const fade = ctx.createGain();
      fade.gain.value = 0;
      fade.connect(this.output);
      return { convolver: null, fade };
    };
    this.slots = [slot(), slot()];
  }

  /** The echo time of the impulse response playing now (clamped), or null before the first `setEchoTime`. */
  get echoTime(): Bands | null {
    return this.current && [this.current[0], this.current[1], this.current[2]];
  }

  /**
   * Plays a reverb with these echo times (seconds per band, clamped to AUDIO.echoTimeMin..echoTimeMax).
   * Rebuilds the impulse response into the idle convolver and crossfades to it, but only when `shouldSwap` says
   * the change is big enough. Returns whether it swapped.
   */
  setEchoTime(echoTime: Bands): boolean {
    const next: Bands = [clampEchoTime(echoTime[0]), clampEchoTime(echoTime[1]), clampEchoTime(echoTime[2])];
    if (!shouldSwap(this.current, next, this.threshold)) return false;

    const idle = this.active === 0 ? 1 : 0;
    const slot = this.slots[idle];
    const channels = makeImpulse(next, this.ctx.sampleRate, this.seed);
    const buffer = this.ctx.createBuffer(channels.length, channels[0].length, this.ctx.sampleRate);
    channels.forEach((data, i) => buffer.copyToChannel(data as Float32Array<ArrayBuffer>, i));

    // A fresh convolver each time: some browsers refuse a second buffer on the same node.
    slot.convolver?.disconnect();
    const convolver = this.ctx.createConvolver();
    convolver.normalize = false; // impulse.ts already scales the energy
    convolver.buffer = buffer;
    this.input.connect(convolver);
    convolver.connect(slot.fade);
    slot.convolver = convolver;

    this.fadeTo(slot.fade.gain, 1);
    if (this.active >= 0) this.fadeTo(this.slots[this.active].fade.gain, 0);
    this.active = idle;
    this.current = next;
    return true;
  }

  dispose(): void {
    for (const s of this.slots) {
      s.convolver?.disconnect();
      s.convolver = null;
      s.fade.disconnect();
    }
    this.input.disconnect();
    this.output.disconnect();
    this.active = -1;
    this.current = null;
  }

  private fadeTo(param: AudioParam, target: number): void {
    const now = this.ctx.currentTime;
    const from = param.value; // the value the automation has reached, if a crossfade is still running
    // Hold where it is, then follow the curve in straight steps. Straight ramps, unlike setValueCurveAtTime, never
    // throw when they meet a crossfade that is still running.
    if (typeof param.cancelAndHoldAtTime === 'function') param.cancelAndHoldAtTime(now);
    else param.cancelScheduledValues(now);
    param.setValueAtTime(from, now);
    const curve = crossfadeCurve(from, target);
    for (let i = 1; i < curve.length; i++) {
      param.linearRampToValueAtTime(curve[i], now + (this.crossfade * i) / (curve.length - 1));
    }
  }
}
