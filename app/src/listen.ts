// When to trace (mvp-design.md 5.6), and which tour states count as a listener inside the house.
import { AUDIO } from './config';
import type { Vec3 } from './sim/types';

const dist = (a: Vec3, b: Vec3) => Math.hypot(a[0] - b[0], a[1] - b[1], a[2] - b[2]);

/**
 * Trace when the listener has moved more than `threshold` metres since the last trace. One trace runs at a time; a
 * move during a trace is remembered, and the newest position is traced when it finishes. Turning never traces,
 * because only positions come in.
 */
export class TraceScheduler {
  private last: Vec3 | null = null; // position of the last trace sent
  private inFlight = false;
  private pending: Vec3 | null = null;

  constructor(private readonly threshold = AUDIO.listenerMoveThreshold) {}

  get busy(): boolean {
    return this.inFlight;
  }

  /** Call on every listener move. Returns the position to trace now, or null. */
  onListener(position: Vec3): Vec3 | null {
    const p: Vec3 = [position[0], position[1], position[2]];
    if (this.inFlight) {
      this.pending = p;
      return null;
    }
    if (this.last && dist(this.last, p) <= this.threshold) return null;
    this.last = p;
    this.inFlight = true;
    return p;
  }

  /** Call when the worker answers a trace. Returns the next position to trace, or null. */
  onResult(): Vec3 | null {
    this.inFlight = false;
    const next = this.pending;
    this.pending = null;
    return next ? this.onListener(next) : null;
  }

  /** Call when the worker answers with an error while a trace runs. */
  onError(): Vec3 | null {
    return this.onResult();
  }

  /** A trace that was asked for could not be sent (no sources yet): nothing is in flight, so the next position is traced. */
  cancel(): void {
    this.inFlight = false;
    this.pending = null;
    this.last = null;
  }

  /** Forget the last trace, e.g. after the sources moved: the next position is traced whatever the distance. */
  invalidate(): void {
    if (this.inFlight && !this.pending && this.last) this.pending = this.last;
    this.last = null;
  }
}

/** Only the inside view has a listener in the house. Dollhouse, floor plan and transitions keep the last one. */
export function isInside(poseMode: string): boolean {
  return poseMode === 'mode.inside';
}

/** The room id for the reverb cache from `Room.current`; null between rooms or outside, where the room is kept. */
export function firstRoomId(current: { rooms: { id: string }[] } | undefined): string | null {
  return current?.rooms[0]?.id ?? null;
}
