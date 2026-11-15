import type { AgentEvent, NotPossible, QuickSummary } from '../../../server/src/shared/contract';

/**
 * What the front door shows, kept across the trip into a tour and back (sessionStorage).
 * `staleCards` (an addition to the plan's shape): the cards on screen came from an earlier question, so the next
 * `cards` event replaces them instead of merging, and the old cards stay visible until then.
 */
export type FrontState = {
  conversationId: string | null; question: string; statusLines: string[]; answer: string;
  notPossible: NotPossible[]; summaries: QuickSummary[]; highlighted: string | null; running: boolean;
  staleCards: boolean;
};

export const EMPTY: FrontState = {
  conversationId: null, question: '', statusLines: [], answer: '', notPossible: [], summaries: [],
  highlighted: null, running: false, staleCards: false,
};

const KEY = 'front:v1';

export type FrontAction = AgentEvent | { type: 'ask'; text: string } | { type: 'stop' };

function merge(old: QuickSummary[], incoming: QuickSummary[]): QuickSummary[] {
  const byId = new Map(old.map(s => [s.modelId, s] as const));
  for (const s of incoming) byId.set(s.modelId, s);
  return [...byId.values()];
}

export function reduce(state: FrontState, event: FrontAction): FrontState {
  switch (event.type) {
    case 'ask':
      return { ...state, question: event.text, statusLines: [], answer: '', notPossible: [], highlighted: null, running: true, staleCards: true };
    case 'stop':
    case 'done':
      return state.running ? { ...state, running: false } : state;
    case 'conversation': {
      const restarted = event.fresh && state.conversationId !== null && state.conversationId !== event.conversationId;
      return {
        ...state,
        conversationId: event.conversationId,
        statusLines: restarted ? [...state.statusLines, 'Started a new conversation.'] : state.statusLines,
      };
    }
    case 'status':
      return { ...state, statusLines: [...state.statusLines, event.text] };
    case 'cards':
      return { ...state, summaries: merge(state.staleCards ? [] : state.summaries, event.summaries), staleCards: false };
    case 'text':
      return { ...state, answer: state.answer ? `${state.answer}\n\n${event.text}` : event.text };
    case 'open':
      return { ...state, highlighted: event.modelId };
    case 'notPossible': {
      const r = event.reason;
      if (state.notPossible.some(n => n.code === r.code && n.message === r.message)) return state;
      return { ...state, notPossible: [...state.notPossible, r] };
    }
    default:
      // placeSound belongs to the tour; nothing to show here.
      return state;
  }
}

/** Keep the state for the return from a tour. Blocked or full storage: not kept, never thrown. */
export function save(state: FrontState, storage?: Storage): void {
  try {
    (storage ?? sessionStorage).setItem(KEY, JSON.stringify(state));
  } catch {
    // sessionStorage blocked (spec 8.3): the conversation is not kept across the reload.
  }
}

const isString = (v: unknown): v is string => typeof v === 'string';
const isStringOrNull = (v: unknown): v is string | null => v === null || typeof v === 'string';
const isObject = (v: unknown): v is Record<string, unknown> => typeof v === 'object' && v !== null && !Array.isArray(v);

function isReason(v: unknown): v is NotPossible {
  return isObject(v) && isString(v.code) && isString(v.message) && typeof v.retry === 'boolean';
}

function isSummary(v: unknown): v is QuickSummary {
  if (!isObject(v) || !isString(v.modelId) || typeof v.ok !== 'boolean') return false;
  if (!v.ok) return isReason(v.reason);
  return isString(v.address) && typeof v.score === 'number' && Array.isArray(v.rooms) && isObject(v.listing);
}

/** The saved state, or EMPTY when it is missing, blocked or malformed. Never comes back running. */
export function load(storage?: Storage): FrontState {
  let raw: string | null;
  try {
    raw = (storage ?? sessionStorage).getItem(KEY);
  } catch {
    return EMPTY;
  }
  if (raw === null) return EMPTY;
  let v: unknown;
  try {
    v = JSON.parse(raw);
  } catch {
    return EMPTY;
  }
  if (!isObject(v)) return EMPTY;
  const ok =
    isStringOrNull(v.conversationId) && isString(v.question) &&
    Array.isArray(v.statusLines) && v.statusLines.every(isString) && isString(v.answer) &&
    Array.isArray(v.notPossible) && v.notPossible.every(isReason) &&
    Array.isArray(v.summaries) && v.summaries.every(isSummary) && isStringOrNull(v.highlighted);
  if (!ok) return EMPTY;
  return {
    conversationId: v.conversationId as string | null, question: v.question as string,
    statusLines: v.statusLines as string[], answer: v.answer as string, notPossible: v.notPossible as NotPossible[],
    summaries: v.summaries as QuickSummary[], highlighted: v.highlighted as string | null,
    running: false, staleCards: v.staleCards === true,
  };
}
