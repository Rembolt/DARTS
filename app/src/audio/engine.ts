// The audio engine (mvp-design.md 6, v3-design 6): one AudioContext, a list of looping sources, a limiter.
// A point or ambient voice has the direct path and 12 echo slots (8 from the fifth voice on), each through its own HRTF
// panner, plus a reverb send at 0 that the reverb attaches to with `connectReverb`. A stereo voice is a plain
// gain and low-pass: no panner, no echoes, no send.
import type { Pose } from '../viewer';
import type { Bands, SourceResult, Vec3 } from '../sim/types';
import { AUDIO, MAX_SOURCES, SLOT_DIRECTIONS, SOUNDS, type SoundId } from '../config';
import { applyListenerOrientation } from './listener';
import { dbToGain, directGain, distance, shelfGainsDb } from './levels';
import { clearDirectGain, echoGain, gainStartTime, MERGED_DIRECTIONS, mergeSlots, planDelayChange, slotPannerPosition } from './echoes';
import { loadSound } from './sounds';

export type SourceKind = 'point' | 'ambient' | 'stereo';

export type SourceSpec = {
  id: string;
  label: string;
  kind: SourceKind;
  sound: SoundId;
  position: Vec3;
  levelDb: number;
  enabled: boolean;
  /** stereo only: play once every [min, max] seconds instead of looping. */
  every?: [number, number];
};

export type AudioEngine = {
  readonly context: AudioContext;
  /** Labels of sources that are not playing: their file was missing, or there were too many. */
  readonly skipped: string[];
  /** The master bus, before the limiter. The reverb's output connects here. */
  readonly master: AudioNode;
  /** What `connectReverb` attached the sends to, or null before that (footsteps send their wet part here). */
  readonly reverbInput: AudioNode | null;
  /** Add, remove and update voices by id. At most `MAX_SOURCES` enabled sources play. The last call wins. */
  setSources(specs: SourceSpec[]): Promise<void>;
  /** Move the listener to the tour camera. Call on every pose update. Echo slot panners follow it. */
  setListenerPose(pose: Pick<Pose, 'position' | 'rotation'>): void;
  /** Place a source, in SDK coordinates (Y-up, metres). Stereo sources have no place. */
  setSourcePosition(id: string, position: Vec3): void;
  /** Apply a trace result from the sim worker: direct gain and shelves, the echo slots, the reverb send level. */
  applySimResult(sources: SourceResult[]): void;
  /** Level (dB, added) and low-pass (Hz) of every stereo voice: the outside heard through walls. */
  setStereoCut(db: number, lowpassHz: number): void;
  /** Attach every source's reverb send to the reverb's input. Until then the sends go nowhere. */
  connectReverb(input: AudioNode): void;
  /** Dev aid: silence the direct sound or the echoes (the sources keep playing), to find which part breaks up. */
  setPartEnabled(part: 'direct' | 'echoes', on: boolean): void;
  /**
   * A level and treble change ahead of everything a source feeds (direct, echoes, reverb): for scenarios the trace
   * does not model yet, such as traffic by time of day or windows closed. Estimates; 0 / 0 is neutral.
   */
  setSourceTrim(id: string, gainDb: number, highDb: number): void;
  /** Turn the whole mix down (or back up) so a voice can be heard over it. */
  setDuck(on: boolean): void;
  /** Stop the sounds and close the context. */
  stop(): Promise<void>;
};

export type EngineOptions = {
  /** Injected for tests; by default a new AudioContext. */
  context?: AudioContext;
  fetch?: typeof fetch;
  random?: () => number;
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

type SpatialVoice = Shelves & {
  stereo: false;
  spec: SourceSpec;
  source: AudioBufferSourceNode;
  trim: GainNode | null;
  trimHigh: BiquadFilterNode | null;
  gain: GainNode;
  panner: PannerNode;
  slots: Slot[];
  send: GainNode;
  position: Vec3;
  directMid: number;
};

type StereoVoice = {
  stereo: true;
  spec: SourceSpec;
  buffer: AudioBuffer;
  gain: GainNode;
  lowpass: BiquadFilterNode;
  sources: Set<AudioBufferSourceNode>;
  timer: ReturnType<typeof setTimeout> | null;
};

type Voice = SpatialVoice | StereoVoice;

/**
 * Create the engine. Call it from a user gesture (the "Start audio" click): the AudioContext is created and
 * resumed before the first await, so the browser lets it play. It starts with no sources; give it some with `setSources`.
 */
export async function createAudioEngine(options: EngineOptions = {}): Promise<AudioEngine> {
  const ctx = options.context ?? new AudioContext();
  const resumed = ctx.resume();
  const random = options.random ?? Math.random;

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

  // The listener sits at the origin and only turns; panners are placed relative to it. So the slot panners
  // (fixed world directions, 2 m away) never move, and only the direct panners move as you walk. Steps, not glides:
  // automated panner positions put HRTF panners in Chrome's costly sample-accurate mode, which crackled on movement.
  function placePanner(p: PannerNode, [x, y, z]: Vec3) {
    if (p.positionX) {
      const t = now();
      p.positionX.setValueAtTime(x, t); p.positionY.setValueAtTime(y, t); p.positionZ.setValueAtTime(z, t);
    } else {
      p.setPosition(x, y, z);
    }
  }

  /** A world position seen from the listener, which the audio graph keeps at the origin. */
  const relative = (p: Vec3): Vec3 => [p[0] - listener[0], p[1] - listener[1], p[2] - listener[2]];

  const voices = new Map<string, Voice>();
  const enabled = { direct: true, echoes: true };
  let lastResults: SourceResult[] = [];
  let reverbInput: AudioNode | null = null;
  let stereoCut = { db: 0, hz: 20000 };
  let skipped: string[] = [];
  let generation = 0;
  let stopped = false;
  const buffers = new Map<string, Promise<AudioBuffer | null>>(); // by file: each sound is fetched once

  const slotDirs = (index: number): Vec3[] => (index < 4 ? SLOT_DIRECTIONS : MERGED_DIRECTIONS);

  function makeSpatialVoice(spec: SourceSpec, buffer: AudioBuffer, dirs: Vec3[]): SpatialVoice {
    const source = ctx.createBufferSource();
    source.buffer = buffer;
    source.loop = true;
    const shelves = makeShelves();
    const gain = ctx.createGain();
    gain.gain.value = 0;
    const panner = makePanner();
    source.connect(shelves.low);
    shelves.high.connect(gain).connect(panner);

    const slots = dirs.map((dir): Slot => {
      const delay = ctx.createDelay(AUDIO.maxDelay);
      delay.delayTime.value = 0;
      const s = makeShelves();
      const g = ctx.createGain();
      g.gain.value = 0; // empty until the first trace
      const p = makePanner();
      source.connect(delay).connect(s.low);
      s.high.connect(g).connect(p);
      placePanner(p, slotPannerPosition([0, 0, 0], dir));
      return { ...s, dir, delay, gain: g, panner: p, delayValue: 0, gainValue: 0, dipEnd: 0 };
    });

    const send = ctx.createGain();
    send.gain.value = 0;
    source.connect(send);
    if (reverbInput) send.connect(reverbInput);

    return { stereo: false, spec, source, trim: null, trimHigh: null, ...shelves, gain, panner, slots, send, position: [...spec.position], directMid: 1 };
  }

  function makeStereoVoice(spec: SourceSpec, buffer: AudioBuffer): StereoVoice {
    const lowpass = ctx.createBiquadFilter();
    lowpass.type = 'lowpass';
    lowpass.frequency.value = stereoCut.hz;
    const gain = ctx.createGain();
    gain.gain.value = 0;
    lowpass.connect(gain).connect(master);
    return { stereo: true, spec, buffer, gain, lowpass, sources: new Set(), timer: null };
  }

  const loadFile = (file: string) => {
    let p = buffers.get(file);
    if (!p) buffers.set(file, (p = loadSound(ctx, file, options.fetch)));
    return p;
  };

  function ensureTrim(v: SpatialVoice): void {
    if (v.trim) return;
    const trimHigh = ctx.createBiquadFilter();
    trimHigh.type = 'highshelf';
    trimHigh.frequency.value = AUDIO.highShelfHz;
    trimHigh.gain.value = 0;
    const trim = ctx.createGain();
    trim.gain.value = 1;
    v.source.disconnect();
    v.source.connect(trimHigh).connect(trim);
    trim.connect(v.low);
    for (const slot of v.slots) trim.connect(slot.delay);
    trim.connect(v.send);
    v.trim = trim;
    v.trimHigh = trimHigh;
  }

  function updateGain(v: Voice) {
    if (v.stereo) smooth(v.gain.gain, dbToGain(v.spec.levelDb + stereoCut.db));
    else smooth(v.gain.gain, enabled.direct ? directGain(v.spec.kind, v.spec.levelDb, distance(listener, v.position), v.directMid) : 0);
  }

  function setShelves(s: Shelves, bands: Bands, at = now()) {
    const { low, high } = shelfGainsDb(bands);
    smooth(s.low.gain, low, at);
    smooth(s.high.gain, high, at);
  }

  function applySlot(slot: Slot, energy: Bands, delay: number, clearGain: number) {
    const t = now();
    const plan = planDelayChange({
      now: t, currentDelay: slot.delayValue, nextDelay: delay, currentGain: slot.gainValue, nextGain: enabled.echoes ? echoGain(energy[1], clearGain) : 0,
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
      d.setTargetAtTime(plan.delay, t, AUDIO.delayGlideTime); // slow, so the glide barely bends the pitch
      smooth(g, plan.gain, gainStartTime(t, slot.dipEnd));
      setShelves(slot, energy);
    }
    slot.delayValue = plan.delay;
    slot.gainValue = plan.gain;
  }

  function playStereoOnce(v: StereoVoice, loop: boolean) {
    const source = ctx.createBufferSource();
    source.buffer = v.buffer;
    source.loop = loop;
    source.connect(v.lowpass);
    v.sources.add(source);
    source.onended = () => { v.sources.delete(source); source.disconnect(); };
    source.start();
  }

  function scheduleStereo(v: StereoVoice, first: boolean) {
    const every = v.spec.every;
    if (!every) return;
    const wait = first ? random() * 10 : every[0] + random() * (every[1] - every[0]); // the first pass comes early
    v.timer = setTimeout(() => {
      if (stopped) return;
      playStereoOnce(v, false);
      scheduleStereo(v, false);
    }, wait * 1000);
  }

  function startVoice(v: Voice) {
    if (v.stereo) {
      if (v.spec.every) scheduleStereo(v, true);
      else playStereoOnce(v, true);
    } else {
      placePanner(v.panner, relative(v.position));
      v.source.start();
    }
    updateGain(v);
  }

  function stopVoice(v: Voice) {
    if (v.stereo) {
      if (v.timer) clearTimeout(v.timer);
      v.timer = null;
      for (const s of v.sources) s.stop();
      v.sources.clear();
    } else {
      v.source.stop();
    }
  }

  const sameDirs = (a: Vec3[], b: Vec3[]) => a.length === b.length && a.every((d, i) => d === b[i]);

  async function setSources(specs: SourceSpec[]): Promise<void> {
    const mine = ++generation;
    const wanted = specs.filter(s => s.enabled);
    const active = wanted.slice(0, MAX_SOURCES);
    const over = wanted.slice(MAX_SOURCES).map(s => `${s.label} (too many sources)`);
    const loaded = await Promise.all(active.map(s => loadFile(SOUNDS[s.sound].file)));
    await resumed;
    if (stopped || mine !== generation) return; // a newer call replaces this one

    const missing: string[] = [];
    const keep: { spec: SourceSpec; buffer: AudioBuffer }[] = [];
    active.forEach((spec, i) => {
      const buffer = loaded[i];
      if (buffer) keep.push({ spec, buffer });
      else missing.push(spec.label);
    });
    skipped = [...missing, ...over];

    const ids = new Set(keep.map(k => k.spec.id));
    for (const [id, v] of voices) {
      if (!ids.has(id)) { stopVoice(v); voices.delete(id); }
    }

    keep.forEach(({ spec, buffer }, index) => {
      const dirs = slotDirs(index);
      let existing = voices.get(spec.id);
      if (existing && !(existing.spec.sound === spec.sound && existing.spec.kind === spec.kind
        && (existing.stereo || sameDirs(existing.slots.map(s => s.dir), dirs)))) {
        stopVoice(existing);
        voices.delete(spec.id);
        existing = undefined;
      }
      if (existing) {
        const everyChanged = JSON.stringify(existing.spec.every) !== JSON.stringify(spec.every);
        existing.spec = spec;
        if (existing.stereo) {
          if (everyChanged) { stopVoice(existing); startVoice(existing); return; }
        } else {
          existing.position = [...spec.position];
          placePanner(existing.panner, relative(existing.position));
        }
        updateGain(existing);
        return;
      }
      const v = spec.kind === 'stereo' ? makeStereoVoice(spec, buffer) : makeSpatialVoice(spec, buffer, dirs);
      voices.set(spec.id, v);
      startVoice(v);
    });
  }

  function applyResults(results: SourceResult[]): void {
    if (stopped) return;
    lastResults = results;
    for (const r of results) {
      const v = voices.get(r.id);
      if (!v || v.stereo) continue;
      v.directMid = r.direct[1];
      setShelves(v, r.direct);
      updateGain(v);
      const clear = clearDirectGain(v.spec.kind, v.spec.levelDb, r.distance);
      const slots = v.slots.length === r.slots.length ? r.slots : mergeSlots(r.slots);
      v.slots.forEach((slot, i) => {
        const s = slots[i];
        if (s) applySlot(slot, s.energy, s.delay, clear);
        else applySlot(slot, [0, 0, 0], slot.delayValue, clear);
      });
      // Reverb send (mvp-design.md 6): sqrt(lateEnergy mid) x reverbGain. Silent until connectReverb.
      smooth(v.send.gain, Math.sqrt(Math.max(r.lateEnergy[1], 0)) * AUDIO.reverbGain);
    }
  }

  await resumed;

  return {
    context: ctx,
    master,
    get skipped() { return skipped; },
    get reverbInput() { return reverbInput; },

    setSources,

    setListenerPose(pose) {
      if (stopped) return;
      listener = [pose.position.x, pose.position.y, pose.position.z];
      applyListenerOrientation(ctx.listener, pose.rotation, now());
      for (const v of voices.values()) {
        if (v.stereo) continue;
        if (v.spec.kind === 'point') updateGain(v); // only a point source's direct level depends on distance between traces
        placePanner(v.panner, relative(v.position));
      }
    },

    setSourcePosition(id, position) {
      if (stopped) return;
      const v = voices.get(id);
      if (!v || v.stereo) return;
      v.position = [...position];
      placePanner(v.panner, relative(v.position));
      updateGain(v);
    },

    setStereoCut(db, lowpassHz) {
      stereoCut = { db, hz: lowpassHz };
      for (const v of voices.values()) {
        if (!v.stereo) continue;
        v.lowpass.frequency.value = lowpassHz;
        updateGain(v);
      }
    },

    setSourceTrim(id, gainDb, highDb) {
      if (stopped) return;
      const v = voices.get(id);
      if (!v || v.stereo) return;
      ensureTrim(v);
      if (!v.trim || !v.trimHigh) return;
      smooth(v.trim.gain, Math.pow(10, gainDb / 20));
      smooth(v.trimHigh.gain, Math.max(-AUDIO.maxShelfDb, Math.min(AUDIO.maxShelfDb, highDb)));
    },

    setPartEnabled(part, on) {
      enabled[part] = on;
      for (const v of voices.values()) if (!v.stereo) updateGain(v);
      if (lastResults.length) applyResults(lastResults);
    },

    applySimResult: applyResults,

    connectReverb(input) {
      reverbInput = input;
      for (const v of voices.values()) if (!v.stereo) v.send.connect(input);
    },

    setDuck(on) {
      // A quarter of the level while someone is talking: the voice stays clear without stopping the tour's sound.
      volume.gain.setTargetAtTime(on ? AUDIO.masterVolume * 0.25 : AUDIO.masterVolume, now(), 0.12);
    },
    async stop() {
      if (stopped) return;
      stopped = true;
      generation++;
      for (const v of voices.values()) stopVoice(v);
      await ctx.close();
    },
  };
}
