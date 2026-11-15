// The audio engine (mvp-design.md 6): one AudioContext, two looping sources through HRTF panners, a limiter.
// Step 5 plays the direct path only. Echo slots (step 7) and the reverb send (step 9) plug in where marked TODO.
import type { Pose } from '../viewer';
import type { SourceResult, Vec3 } from '../sim/types';
import { AUDIO, SOURCES } from '../config';
import { applyListener } from './listener';
import { distance, indoorDirectGain, outdoorDirectGain, shelfGainsDb } from './levels';
import type { SourceId } from './positions';
import { loadSound } from './sounds';

export type { SourceId } from './positions';

export type AudioEngine = {
  readonly context: AudioContext;
  /** Which sources are playing a synthesized stand-in because their file was missing. */
  readonly standIns: Record<SourceId, boolean>;
  /** Move the listener to the tour camera. Call on every pose update. */
  setListenerPose(pose: Pick<Pose, 'position' | 'rotation'>): void;
  /** Place a source, in SDK coordinates (Y-up, metres). */
  setSourcePosition(id: SourceId, position: Vec3): void;
  /** Apply a trace result from the sim worker (step 6+). Step 5 never calls it: direct = 1 for every band. */
  applySimResult(sources: SourceResult[]): void;
  /** Stop the sounds and close the context. */
  stop(): Promise<void>;
};

export type EngineOptions = {
  /** Injected for tests; by default a new AudioContext. */
  context?: AudioContext;
  fetch?: typeof fetch;
};

type Voice = {
  id: SourceId;
  source: AudioBufferSourceNode;
  lowShelf: BiquadFilterNode;
  highShelf: BiquadFilterNode;
  gain: GainNode;
  panner: PannerNode;
  position: Vec3;
  directMid: number;
  // TODO(step 7): 12 echo slots per source: delay (max AUDIO.maxDelay) → shelves → gain → HRTF panner
  //   AUDIO.slotPannerDistance m along SLOT_DIRECTIONS[i] from the listener → master.
  // TODO(step 9): send gain → shared convolver reverb (two convolvers, crossfaded) → master.
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
  const smooth = (param: AudioParam, value: number) => param.setTargetAtTime(value, now(), AUDIO.smoothing);

  function makeVoice(id: SourceId, buffer: AudioBuffer): Voice {
    const source = ctx.createBufferSource();
    source.buffer = buffer;
    source.loop = true;
    const lowShelf = ctx.createBiquadFilter();
    lowShelf.type = 'lowshelf';
    lowShelf.frequency.value = AUDIO.lowShelfHz;
    lowShelf.gain.value = 0;
    const highShelf = ctx.createBiquadFilter();
    highShelf.type = 'highshelf';
    highShelf.frequency.value = AUDIO.highShelfHz;
    highShelf.gain.value = 0;
    const gain = ctx.createGain();
    gain.gain.value = 0;
    const panner = ctx.createPanner();
    panner.panningModel = 'HRTF';
    panner.distanceModel = 'inverse';
    panner.rolloffFactor = 0; // we set every level ourselves; the panner must not fade with distance on top
    source.connect(lowShelf).connect(highShelf).connect(gain).connect(panner).connect(master);
    return { id, source, lowShelf, highShelf, gain, panner, position: [0, 0, 0], directMid: 1 };
  }

  const voices: Record<SourceId, Voice> = {
    indoor: makeVoice('indoor', indoorSound.buffer),
    outdoor: makeVoice('outdoor', outdoorSound.buffer),
  };

  function directGain(v: Voice): number {
    return v.id === 'indoor' ? indoorDirectGain(distance(listener, v.position), v.directMid) : outdoorDirectGain(v.directMid);
  }
  const updateGain = (v: Voice) => smooth(v.gain.gain, directGain(v));

  function placePanner(p: PannerNode, [x, y, z]: Vec3) {
    if (p.positionX) {
      p.positionX.setValueAtTime(x, now());
      p.positionY.setValueAtTime(y, now());
      p.positionZ.setValueAtTime(z, now());
    } else {
      p.setPosition(x, y, z);
    }
  }

  for (const v of Object.values(voices)) {
    updateGain(v);
    v.source.start();
  }
  await resumed;

  let stopped = false;
  return {
    context: ctx,
    standIns: { indoor: indoorSound.standIn, outdoor: outdoorSound.standIn },

    setListenerPose(pose) {
      if (stopped) return;
      listener = [pose.position.x, pose.position.y, pose.position.z];
      applyListener(ctx.listener, pose, now(), AUDIO.smoothing);
      updateGain(voices.indoor); // only the indoor level depends on distance
    },

    setSourcePosition(id, position) {
      if (stopped) return;
      const v = voices[id];
      v.position = [...position];
      placePanner(v.panner, v.position);
      updateGain(v);
    },

    applySimResult(results) {
      if (stopped) return;
      for (const r of results) {
        const v = voices[r.id as SourceId];
        if (!v) continue;
        v.directMid = r.direct[1];
        const { low, high } = shelfGainsDb(r.direct);
        smooth(v.lowShelf.gain, low);
        smooth(v.highShelf.gain, high);
        updateGain(v);
        // TODO(step 7): r.slots → echo slot delays and gains. TODO(step 9): r.lateEnergy → reverb send.
      }
    },

    async stop() {
      if (stopped) return;
      stopped = true;
      for (const v of Object.values(voices)) v.source.stop();
      await ctx.close();
    },
  };
}
