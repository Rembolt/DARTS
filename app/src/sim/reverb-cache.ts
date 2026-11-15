// Echo times per room (mvp-design.md 5.5 step 5) and the rule for when to ask the worker for a reverb job.
// Like the trace rule in 5.6: one job in flight at a time, and if the listener moves on meanwhile, the newest room
// is asked for when the job finishes. Pure: it returns messages to send, it never sends them.
import type { Bands, ToWorker, Vec3 } from './types';

export type ReverbRequest = Extract<ToWorker, { type: 'reverb' }>;

export type ReverbDecision = {
  /** The echo time to play now, when this room's is known. Otherwise keep the last trace's estimate. */
  echoTime?: Bands;
  /** A message to post to the worker, if a job should start now. */
  request?: ReverbRequest;
};

export class ReverbCache {
  private readonly times = new Map<string, Bands>();

  get(roomId: string): Bands | undefined {
    const t = this.times.get(roomId);
    return t && [t[0], t[1], t[2]];
  }

  set(roomId: string, echoTime: Bands): void {
    this.times.set(roomId, [echoTime[0], echoTime[1], echoTime[2]]);
  }

  has(roomId: string): boolean {
    return this.times.has(roomId);
  }

  get size(): number {
    return this.times.size;
  }
}

export class ReverbScheduler {
  readonly cache: ReverbCache;
  private room: string | null = null; // the listener's current room
  private inFlight: string | null = null; // room of the job the worker is running
  private pending: ReverbRequest | null = null; // newest room asked for while a job ran

  constructor(cache = new ReverbCache()) {
    this.cache = cache;
  }

  get currentRoom(): string | null {
    return this.room;
  }

  get busy(): boolean {
    return this.inFlight !== null;
  }

  /**
   * Call on every room update from the viewer (`Room.current`). An empty or null room id (no room, e.g. outside or
   * in dollhouse view) is ignored: the listener keeps its last room. Re-reporting the same room does nothing.
   */
  enterRoom(roomId: string | null | undefined, listener: Vec3): ReverbDecision {
    if (!roomId || roomId === this.room) return {};
    this.room = roomId;
    const known = this.cache.get(roomId);
    if (known) {
      this.pending = null; // the room we waited for is no longer the newest
      return { echoTime: known };
    }
    if (this.inFlight === roomId) {
      this.pending = null;
      return {};
    }
    const request: ReverbRequest = { type: 'reverb', roomId, listener: [listener[0], listener[1], listener[2]] };
    if (this.inFlight !== null) {
      this.pending = request; // newest room wins
      return {};
    }
    this.inFlight = roomId;
    return { request };
  }

  /**
   * Call with the worker's `reverb` reply. Caches the result, frees the worker, and starts the pending room's job
   * if there is one. `echoTime` is returned only when the reply is for the room the listener is in now.
   */
  onResult(roomId: string, echoTime: Bands): ReverbDecision {
    this.cache.set(roomId, echoTime);
    if (this.inFlight === roomId) this.inFlight = null;
    const decision: ReverbDecision = {};
    if (roomId === this.room) decision.echoTime = this.cache.get(roomId);
    const next = this.startPending();
    if (next) decision.request = next;
    return decision;
  }

  /** Call when the worker answers a reverb job with an error: frees the worker and starts the pending job, if any.
   *  The failed room is not cached, so entering it again retries. */
  onError(): ReverbDecision {
    this.inFlight = null;
    const next = this.startPending();
    return next ? { request: next } : {};
  }

  private startPending(): ReverbRequest | undefined {
    if (this.inFlight !== null || !this.pending) return undefined;
    const p = this.pending;
    this.pending = null;
    if (this.cache.has(p.roomId) || p.roomId !== this.room) return undefined;
    this.inFlight = p.roomId;
    return p;
  }
}
