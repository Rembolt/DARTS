// The sound of a door or window being opened or closed: one file, played once per change, dry and through the
// room's reverb send (like the footsteps). Not placed in space. A missing file plays nothing, never a stand-in.
import { SOUNDS } from '../config';
import { dbToGain } from './levels';
import { loadSound } from './sounds';

const SEND_DB = -6;

/** True when an opening that is in both lists changed between open and closed (so not when the list first loads). */
export function openingsToggled(prev: { id: string; open: boolean }[], next: { id: string; open: boolean }[]): boolean {
  const before = new Map(prev.map(o => [o.id, o.open]));
  return next.some(o => before.has(o.id) && before.get(o.id) !== o.open);
}

export type OpeningSound = { play(): void; dispose(): void };

/** Null when the file does not load. */
export async function createOpeningSound(
  ctx: AudioContext,
  out: { master: AudioNode; reverbInput: AudioNode | null },
  fetchFn: typeof fetch = fetch,
): Promise<OpeningSound | null> {
  const buffer = await loadSound(ctx, SOUNDS.opening.file, fetchFn);
  if (!buffer) return null;

  const bus = ctx.createGain();
  bus.gain.setValueAtTime(dbToGain(SOUNDS.opening.levelDb), 0);
  bus.connect(out.master);
  let send: GainNode | null = null;
  if (out.reverbInput) {
    send = ctx.createGain();
    send.gain.setValueAtTime(dbToGain(SEND_DB), 0);
    bus.connect(send);
    send.connect(out.reverbInput);
  }

  let disposed = false;
  const live = new Set<AudioBufferSourceNode>();

  return {
    play() {
      if (disposed) return;
      const src = ctx.createBufferSource();
      src.buffer = buffer;
      src.connect(bus);
      src.onended = () => { live.delete(src); src.disconnect(); };
      live.add(src);
      src.start(ctx.currentTime);
    },
    dispose() {
      disposed = true;
      for (const s of live) { try { s.stop(); } catch { /* not started */ } s.disconnect(); }
      live.clear();
      bus.disconnect();
      send?.disconnect();
    },
  };
}
