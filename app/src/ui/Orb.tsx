// The agent's face: a small orb that shows what it is doing (idle, listening, thinking, speaking).
import { agentState } from './store';

export function Orb({ big = false }: { big?: boolean }) {
  const state = agentState();
  return (
    <span class={`orb ${big ? 'big' : ''} is-${state}`} role="img" aria-label={`Jev is ${state === 'idle' ? 'ready' : state}`}>
      <i />
      <i />
      <i />
    </span>
  );
}

const LABEL = { idle: 'Ready', listening: 'Listening…', thinking: 'Working on it…', speaking: 'Replying…' } as const;
export const stateLabel = () => LABEL[agentState()];
