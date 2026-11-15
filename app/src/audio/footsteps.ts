// Footsteps (v3-design.md 6.5): one step every 0.5 s while the listener moves between sweeps, played dry and
// through the room's reverb send. Files only: a set that does not load is unavailable, never synthesized.
import { dbToGain } from './levels';
import { loadSound } from './sounds';

const STEP_SECONDS = 0.5;
const MIN_STEPS = 2;
const MAX_STEPS = 8;
const VARIATIONS = 4;

/** Every footstep file, so they can be decoded before the sound is switched on. */
export const FOOTSTEP_FILES: string[] = (['hard', 'soft'] as const).flatMap(kind => Array.from({ length: VARIATIONS }, (_, i) => `/audio/footstep_${kind}_${i + 1}.ogg`));
const STEP_DB = -18;
const SEND_DB = -6;
const PITCH_SPREAD = 0.05;

/** Start times (seconds from the walk's start) of the steps: one every 0.5 s, at least 2, at most 8. */
export function stepTimes(transitionSeconds: number): number[] {
  const seconds = Number.isFinite(transitionSeconds) ? Math.max(transitionSeconds, 0) : 0;
  const n = Math.min(MAX_STEPS, Math.max(MIN_STEPS, Math.ceil(seconds / STEP_SECONDS)));
  return Array.from({ length: n }, (_, i) => i * STEP_SECONDS);
}

/** A variation index in [0, count) that is never `last` (pass -1 for none). `random` returns [0, 1]. */
export function pickStep(count: number, last: number, random: () => number): number {
  if (count <= 1) return 0;
  const r = Math.min(Math.max(random(), 0), 0.999999);
  if (!(last >= 0 && last < count)) return Math.floor(r * count);
  const i = Math.floor(r * (count - 1));
  return i >= last ? i + 1 : i;
}

export type Footsteps = {
  walk(transitionSeconds: number): void;
  setEnabled(on: boolean): void;
  setFloor(kind: 'hard' | 'soft'): void;
  dispose(): void;
};

/** Null when no step file loads at all. A floor with no loadable file plays nothing (it does not fall back). */
export async function createFootsteps(
  ctx: AudioContext,
  out: { master: AudioNode; reverbInput: AudioNode | null },
  options: { fetch?: typeof fetch; random?: () => number } = {},
): Promise<Footsteps | null> {
  const fetchFn = options.fetch ?? fetch;
  const random = options.random ?? Math.random;

  const load = async (kind: 'hard' | 'soft') => {
    const files = Array.from({ length: VARIATIONS }, (_, i) => `/audio/footstep_${kind}_${i + 1}.ogg`);
    const buffers = await Promise.all(files.map((url) => loadSound(ctx, url, fetchFn)));
    return buffers.filter((b): b is AudioBuffer => b !== null);
  };
  const [hard, soft] = await Promise.all([load('hard'), load('soft')]);
  if (hard.length === 0 && soft.length === 0) return null;
  const sets = { hard, soft };

  // source -> bus (-18 dB) -> master; bus -> send (-6 dB) -> reverb input.
  const bus = ctx.createGain();
  bus.gain.setValueAtTime(dbToGain(STEP_DB), 0);
  bus.connect(out.master);
  let send: GainNode | null = null;
  if (out.reverbInput) {
    send = ctx.createGain();
    send.gain.setValueAtTime(dbToGain(SEND_DB), 0);
    bus.connect(send);
    send.connect(out.reverbInput);
  }

  let enabled = true;
  let floor: 'hard' | 'soft' = 'hard';
  let disposed = false;
  let last = -1;
  const live = new Set<AudioBufferSourceNode>();

  return {
    walk(transitionSeconds) {
      if (!enabled || disposed) return;
      const buffers = sets[floor];
      if (buffers.length === 0) return;
      for (const t of stepTimes(transitionSeconds)) {
        last = pickStep(buffers.length, last, random);
        const src = ctx.createBufferSource();
        src.buffer = buffers[last];
        src.playbackRate.value = 1 - PITCH_SPREAD + random() * 2 * PITCH_SPREAD;
        src.connect(bus);
        src.onended = () => { live.delete(src); src.disconnect(); };
        live.add(src);
        src.start(ctx.currentTime + t);
      }
    },
    setEnabled(on) {
      enabled = on;
      if (!on) stopAll();
    },
    setFloor(kind) {
      floor = kind;
    },
    dispose() {
      disposed = true;
      stopAll();
      bus.disconnect();
      send?.disconnect();
    },
  };

  function stopAll() {
    for (const s of live) { try { s.stop(); } catch { /* not started */ } s.disconnect(); }
    live.clear();
  }
}
