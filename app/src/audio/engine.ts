// The audio engine (mvp-design.md 6): one AudioContext, two looping sources, a limiter.
// Per source: the direct path and 12 echo slots, each through its own HRTF panner (13 per source, 26 in all),
// plus a reverb send at 0 that the reverb (step 9) attaches to with `connectReverb`.
import type { Pose } from '../viewer';
import type { Bands, SourceResult, Vec3 } from '../sim/types';
import { AUDIO, SLOT_DIRECTIONS, SOURCES } from '../config';
import { applyListener } from './listener';
import { distance, indoorDirectGain, outdoorDirectGain, shelfGainsDb } from './levels';
import { clearDirectGain, echoGain, gainStartTime, planDelayChange, slotPannerPosition } from './echoes';
import type { SourceId } from './positions';
import { loadSound } from './sounds';

export type { SourceId } from './positions';

export type AudioEngine = {
  readonly context: AudioContext;
  /** Which sources are playing a synthesized stand-in because their file was missing. */
  readonly standIns: Record<SourceId, boolean>;
  /** The master bus, before the limiter. The reverb's output connects here. */
  readonly master: AudioNode;
  /** Move the listener to the tour camera. Call on every pose update. Echo slot panners follow it. */
  setListenerPose(pose: Pick<Pose, 'position' | 'rotation'>): void;
  /** Place a source, in SDK coordinates (Y-up, metres). */
  setSourcePosition(id: SourceId, position: Vec3): void;
  /** Apply a trace result from the sim worker: direct gain and shelves, the 12 echo slots, the reverb send level. */
  applySimResult(sources: SourceResult[]): void;
  /** Attach every source's reverb send to the reverb's input (step 9). Until then the sends go nowhere. */
  connectReverb(input: AudioNode): void;
  /** Stop the sounds and close the context. */
  stop(): Promise<void>;
};

export type EngineOptions = {
  /** Injected for tests; by default a new AudioContext. */
  context?: AudioContext;
  fetch?: typeof fetch;
};

type Shelves = { low: BiquadFilterNode; high: BiquadFilterNode };

type Slot = Shelves & {
  dir: Vec3;
  delay: DelayNode;
  gain: GainNode;
  panner: PannerNode;
  delayValue: number; // the delay we last asked for
  gainValue: number; // the gain we last asked for
  dipEnd: number; // context time when a running dip finishes (0: none)
};

type Voice = Shelves & {
  id: SourceId;
  source: AudioBufferSourceNode;
  gain: GainNode;
  panner: PannerNode;
  slots: Slot[];
  send: GainNode;
  position: Vec3;
  directMid: number;
};

/**
 * Create the engine. Call it from a user gesture (the "Start audio" click): the AudioContext is created and
 * resumed before the first await, so the browser lets it play. Sources start at the origin; place them with
 * `setSourcePosition` (see `defaultSourcePositions`).
 */
export async function createAudioEngine(options: EngineOptions = {}): Promise<AudioEngine> {
  const ctx = options.context ?? new AudioContext();
  const resumed = ctx.resume();

  const master = ctx.createGain();
  const limiter = ctx.createDynamicsCompressor();
  limiter.threshold.value = AUDIO.limiterThresholdDb;
  limiter.knee.value = AUDIO.limiterKneeDb;
  limiter.ratio.value = AUDIO.limiterRatio;
  limiter.attack.value = AUDIO.limiterAttack;
  limiter.release.value = AUDIO.limiterRelease;
  const volume = ctx.createGain();
  volume.gain.value = AUDIO.masterVolume;
  master.connect(limiter).connect(volume).connect(ctx.destination);

  const [indoorSound, outdoorSound] = await Promise.all([
    loadSound(ctx, 'indoor', SOURCES.indoor.file, AUDIO.standInIndoorSeconds, options.fetch),
    loadSound(ctx, 'outdoor', SOURCES.outdoor.file, AUDIO.standInOutdoorSeconds, options.fetch),
  ]);

  let listener: Vec3 = [0, 0, 0];
  const now = () => ctx.currentTime;
  const smooth = (param: AudioParam, value: number, at = now()) => param.setTargetAtTime(value, at, AUDIO.smoothing);

  function makeShelves(): Shelves {
    const low = ctx.createBiquadFilter();
    low.type = 'lowshelf';
    low.frequency.value = AUDIO.lowShelfHz;
    low.gain.value = 0;
    const high = ctx.createBiquadFilter();
    high.type = 'highshelf';
    high.frequency.value = AUDIO.highShelfHz;
    high.gain.value = 0;
    low.connect(high);
    return { low, high };
  }

  function makePanner(): PannerNode {
    const panner = ctx.createPanner();
    panner.panningModel = 'HRTF';
    panner.distanceModel = 'inverse';
    panner.rolloffFactor = 0; // we set every level ourselves; the panner must not fade with distance on top
    panner.connect(master);
    return panner;
  }

  function placePanner(p: PannerNode, [x, y, z]: Vec3, glide: boolean) {
    if (p.positionX) {
      // Slot panners glide with the same smoothing as the listener, so their direction stays fixed in the world.
      const set = (param: AudioParam, v: number) => (glide ? smooth(param, v) : param.setValueAtTime(v, now()));
      set(p.positionX, x); set(p.positionY, y); set(p.positionZ, z);
    } else {
      p.setPosition(x, y, z);
    }
  }

  function makeVoice(id: SourceId, buffer: AudioBuffer): Voice {
    const source = ctx.createBufferSource();
    source.buffer = buffer;
    source.loop = true;
    const shelves = makeShelves();
    const gain = ctx.createGain();
    gain.gain.value = 0;
    const panner = makePanner();
    source.connect(shelves.low);
    shelves.high.connect(gain).connect(panner);

    const slots = SLOT_DIRECTIONS.map((dir): Slot => {
      const delay = ctx.createDelay(AUDIO.maxDelay);
      delay.delayTime.value = 0;
      const s = makeShelves();
      const g = ctx.createGain();
      g.gain.value = 0; // empty until the first trace
      const p = makePanner();
      source.connect(delay).connect(s.low);
      s.high.connect(g).connect(p);
      placePanner(p, slotPannerPosition(listener, dir), false);
      return { ...s, dir, delay, gain: g, panner: p, delayValue: 0, gainValue: 0, dipEnd: 0 };
    });

    const send = ctx.createGain();
    send.gain.value = 0;
    source.connect(send);

    return { id, source, ...shelves, gain, panner, slots, send, position: [0, 0, 0], directMid: 1 };
  }

  const voices: Record<SourceId, Voice> = {
    indoor: makeVoice('indoor', indoorSound.buffer),
    outdoor: makeVoice('outdoor', outdoorSound.buffer),
  };

  function directGain(v: Voice): number {
    return v.id === 'indoor' ? indoorDirectGain(distance(listener, v.position), v.directMid) : outdoorDirectGain(v.directMid);
  }
  const updateGain = (v: Voice) => smooth(v.gain.gain, directGain(v));

  function setShelves(s: Shelves, bands: Bands, at = now()) {
    const { low, high } = shelfGainsDb(bands);
    smooth(s.low.gain, low, at);
    smooth(s.high.gain, high, at);
  }

  function applySlot(slot: Slot, energy: Bands, delay: number, clearGain: number) {
    const t = now();
    const plan = planDelayChange({
      now: t, currentDelay: slot.delayValue, nextDelay: delay, currentGain: slot.gainValue, nextGain: echoGain(energy[1], clearGain),
    });
    const g = slot.gain.gain, d = slot.delay.delayTime;
    if (plan.kind === 'dip') {
      g.cancelScheduledValues(t);
      g.setValueAtTime(plan.from, plan.dipStart);
      g.linearRampToValueAtTime(0, plan.delayAt);
      d.cancelScheduledValues(t);
      d.setValueAtTime(plan.delay, plan.delayAt);
      g.linearRampToValueAtTime(plan.gain, plan.end);
      slot.dipEnd = plan.end;
      setShelves(slot, energy, plan.delayAt); // change colour while silent
    } else if (plan.kind === 'set') {
      d.cancelScheduledValues(t);
      d.setValueAtTime(plan.delay, t);
      smooth(g, plan.gain, gainStartTime(t, slot.dipEnd));
      setShelves(slot, energy);
    } else {
      smooth(d, plan.delay);
      smooth(g, plan.gain, gainStartTime(t, slot.dipEnd));
      setShelves(slot, energy);
    }
    slot.delayValue = plan.delay;
    slot.gainValue = plan.gain;
  }

  for (const v of Object.values(voices)) {
    updateGain(v);
    v.source.start();
  }
  await resumed;

  let stopped = false;
  return {
    context: ctx,
    master,
    standIns: { indoor: indoorSound.standIn, outdoor: outdoorSound.standIn },

    setListenerPose(pose) {
      if (stopped) return;
      listener = [pose.position.x, pose.position.y, pose.position.z];
      applyListener(ctx.listener, pose, now(), AUDIO.smoothing);
      updateGain(voices.indoor); // only the indoor direct level depends on distance between traces
      for (const v of Object.values(voices)) for (const s of v.slots) placePanner(s.panner, slotPannerPosition(listener, s.dir), true);
    },

    setSourcePosition(id, position) {
      if (stopped) return;
      const v = voices[id];
      v.position = [...position];
      placePanner(v.panner, v.position, false);
      updateGain(v);
    },

    applySimResult(results) {
      if (stopped) return;
      for (const r of results) {
        const v = voices[r.id as SourceId];
        if (!v) continue;
        v.directMid = r.direct[1];
        setShelves(v, r.direct);
        updateGain(v);
        const clear = clearDirectGain(v.id, r.distance);
        v.slots.forEach((slot, i) => {
          const s = r.slots[i];
          if (s) applySlot(slot, s.energy, s.delay, clear);
          else applySlot(slot, [0, 0, 0], slot.delayValue, clear);
        });
        // Reverb send (mvp-design.md 6): sqrt(lateEnergy mid) × reverbGain. Silent until connectReverb.
        smooth(v.send.gain, Math.sqrt(Math.max(r.lateEnergy[1], 0)) * AUDIO.reverbGain);
      }
    },

    connectReverb(input) {
      for (const v of Object.values(voices)) v.send.connect(input);
    },

    async stop() {
      if (stopped) return;
      stopped = true;
      for (const v of Object.values(voices)) v.source.stop();
      await ctx.close();
    },
  };
}
