// A small local stand-in for the agent: it reads a few commands so the chat does something real today.
// `commands.ask` is the seam: the Jev relay (v2-design.md 6) replaces `localAssistant`.
import type { Opening } from './store';

export type Intent =
  | { kind: 'openings'; ids: string[]; open: boolean; reply: string }
  | { kind: 'place'; reply: string }
  | { kind: 'blueprint'; reply: string }
  | { kind: 'audio'; reply: string }
  | { kind: 'none'; reply: string };

const has = (text: string, ...words: string[]) => words.some(w => text.includes(w));

export function interpret(input: string, openings: Opening[]): Intent {
  const text = input.toLowerCase();
  const open = has(text, 'open', 'unlock', 'raise');
  const close = has(text, 'close', 'shut');

  if (open !== close && has(text, 'window', 'door', 'everything', 'all')) {
    const wantsWindows = has(text, 'window');
    const wantsDoors = has(text, 'door');
    const everything = !wantsWindows && !wantsDoors;
    let pool = openings.filter(o => everything || (wantsWindows && o.type === 'window') || (wantsDoors && o.type === 'door'));
    const named = pool.filter(o => text.includes(o.room.toLowerCase()));
    if (named.length) pool = named;
    const target = pool.filter(o => o.open !== open);
    const noun = wantsWindows && !wantsDoors ? 'window' : wantsDoors && !wantsWindows ? 'door' : 'opening';
    if (!pool.length) return { kind: 'none', reply: 'I do not see any matching doors or windows in this home.' };
    if (!target.length) return { kind: 'none', reply: `Already ${open ? 'open' : 'closed'}.` };
    return {
      kind: 'openings',
      ids: target.map(o => o.id),
      open,
      reply: `I'd ${open ? 'open' : 'close'} ${target.length} ${noun}${target.length > 1 ? 's' : ''}.`,
    };
  }
  if (has(text, 'speaker', 'sound source') && has(text, 'add', 'place', 'put')) {
    return { kind: 'place', reply: 'Click a surface in the tour to place it. Esc cancels.' };
  }
  if (has(text, 'blueprint', 'floor plan', 'x-ray', 'xray')) return { kind: 'blueprint', reply: 'Toggled the blueprint.' };
  if (has(text, 'audio', 'sound on', 'start sound', 'mute')) return { kind: 'audio', reply: 'Toggled the audio.' };
  return {
    kind: 'none',
    reply: 'I can open or close doors and windows, and add speakers. The full agent is not connected yet.',
  };
}
