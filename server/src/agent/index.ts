import type { Quick } from '../quick/index.js';
import type { Search } from '../search/index.js';
import { notPossible, type AgentEvent, type AgentRequest } from '../shared/contract.js';

/** Never rejects; always ends with 'done'. */
export type Agent = { run(request: AgentRequest, emit: (event: AgentEvent) => void, signal: AbortSignal): Promise<void> };

/** Stub until Lane D: the agent is unavailable. */
export function createAgent(_options: {
  env: Record<string, string | undefined>;
  search: Search;
  quick: Quick;
  client?: unknown;
}): Agent {
  return {
    run: async (_request, emit) => {
      emit({ type: 'notPossible', reason: notPossible('ai_unavailable') });
      emit({ type: 'done' });
    },
  };
}
