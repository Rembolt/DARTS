// Conversation state on the server (spec 7.1): id → messages, 1 hour idle expiry, at most 50, one running request each.
import { randomUUID } from 'node:crypto';
import type Anthropic from '@anthropic-ai/sdk';
import { notPossible, type NotPossible } from '../shared/contract.js';

type Message = Anthropic.Beta.BetaMessageParam;
type Entry = { messages: Message[]; turns: number; lastUsed: number; running: AbortController | null };

export type Conversations = {
  /** An unknown or expired id starts a new conversation (fresh). At 50 the least recently used idle one is dropped; `busy` only when all 50 are running. */
  open(id: string | undefined): { id: string; fresh: boolean; messages: Message[]; turns: number } | NotPossible;
  cancelRunning(id: string): void;
  setRunning(id: string, controller: AbortController): void;
  /** Clears the running request, if it is still this one. */
  finishRunning(id: string, controller: AbortController): void;
  /** Appends one finished user turn. Earlier messages are never edited (thinking blocks must go back unchanged). */
  commit(id: string, added: Message[]): void;
};

export function createConversations(options: { max?: number; idleMs?: number; now?: () => number } = {}): Conversations {
  const max = options.max ?? 50;
  const idleMs = options.idleMs ?? 60 * 60 * 1000;
  const now = options.now ?? Date.now;
  const entries = new Map<string, Entry>();

  function prune() {
    const t = now();
    for (const [id, entry] of entries) if (!entry.running && t - entry.lastUsed > idleMs) entries.delete(id);
  }

  return {
    open(id) {
      prune();
      const existing = id ? entries.get(id) : undefined;
      if (id && existing) {
        existing.lastUsed = now();
        return { id, fresh: false, messages: [...existing.messages], turns: existing.turns };
      }
      if (entries.size >= max) {
        // Full: the conversation nobody has used for the longest makes room. Busy only when every one is mid-request.
        let oldest: string | null = null;
        for (const [key, entry] of entries) {
          if (!entry.running && (oldest === null || entry.lastUsed < entries.get(oldest)!.lastUsed)) oldest = key;
        }
        if (oldest === null) return notPossible('busy');
        entries.delete(oldest);
      }
      const newId = randomUUID();
      entries.set(newId, { messages: [], turns: 0, lastUsed: now(), running: null });
      return { id: newId, fresh: true, messages: [], turns: 0 };
    },
    cancelRunning(id) {
      const entry = entries.get(id);
      entry?.running?.abort();
      if (entry) entry.running = null;
    },
    setRunning(id, controller) {
      const entry = entries.get(id);
      if (entry) entry.running = controller;
    },
    finishRunning(id, controller) {
      const entry = entries.get(id);
      if (entry && entry.running === controller) entry.running = null;
      if (entry) entry.lastUsed = now();
    },
    commit(id, added) {
      const entry = entries.get(id);
      if (!entry) return;
      entry.messages.push(...added);
      entry.turns += 1;
      entry.lastUsed = now();
    },
  };
}
