// The agent's state as a small level meter (it is a sound product: the agent shows as audio, not as a blob).
import { agentState } from './store';

export function Orb() {
  const state = agentState();
  return (
    <span class={`bars is-${state}`} role="img" aria-label={`Assistant is ${state === 'idle' ? 'ready' : state}`}>
      <i />
      <i />
      <i />
      <i />
    </span>
  );
}

const LABEL = { idle: 'Ready', listening: 'Listening', thinking: 'Working', speaking: 'Replying' } as const;
export const stateLabel = () => LABEL[agentState()];
