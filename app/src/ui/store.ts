// The UI's state, in one place. The page's other parts (viewer, worker, audio) write into it from main.ts, and the
// overlay reads it. The V2 scene state (v2-design.md section 3) will replace the speaker and opening lists; the
// `commands` hooks are where the overlay calls back into the app.
import { signal } from '@preact/signals';
import { toast } from 'sonner';
import type { Bands, SourceResult, Vec3 } from '../sim/types';
import type { Pose } from '../viewer';

export type SoundKind = 'point' | 'ambient' | 'stereo';

/** Same ids as the V2 sound library (v2-design.md 5.3). */
export const SOUND_LIBRARY: { id: string; label: string; kind: SoundKind; levelDb: number }[] = [
  { id: 'music', label: 'Music', kind: 'point', levelDb: 0 },
  { id: 'conversation', label: 'Conversation', kind: 'point', levelDb: -6 },
  { id: 'highway', label: 'Highway', kind: 'ambient', levelDb: -12 },
  { id: 'city_ambience', label: 'City street', kind: 'ambient', levelDb: -14 },
  { id: 'nature_ambience', label: 'Nature', kind: 'ambient', levelDb: -20 },
  { id: 'train', label: 'Train passing', kind: 'stereo', levelDb: -10 },
];

export type Speaker = {
  id: string;
  label: string;
  sound: string;
  kind: SoundKind;
  position: Vec3;
  levelDb: number;
  enabled: boolean;
};

export type OpeningType = 'door' | 'window';
export type Opening = {
  id: string;
  type: OpeningType;
  label: string;
  room: string;
  /** Centre of the opening, viewer coordinates (Y up). */
  position: Vec3;
  open: boolean;
};

export type Step = { label: string; status: 'run' | 'done' | 'fail'; detail?: string };
export type ProposalStatus = 'pending' | 'applied' | 'dismissed';
export type ChatMessage =
  | { id: number; kind: 'text'; role: 'user' | 'jev'; text: string }
  /** What the agent is doing, step by step, so the user sees the whole process. */
  | { id: number; kind: 'process'; steps: Step[] }
  /** A change the agent suggests. Nothing happens until the user applies it. */
  | { id: number; kind: 'proposal'; title: string; detail: string; changes: string[]; previewIds: string[]; status: ProposalStatus };
export type AgentState = 'idle' | 'listening' | 'thinking' | 'speaking';
export type Selection = { kind: 'speaker' | 'opening'; id: string } | null;
export type AudioState = 'off' | 'starting' | 'on';

export const ui = {
  status: signal('Loading…'),
  sim: signal(''),
  pose: signal<Pose | null>(null),
  stage: signal({ w: 0, h: 0 }),

  blueprint: signal({ enabled: false, on: false, label: 'Blueprint', mode: 'Solid' }),
  audio: signal<AudioState>('off'),

  speakers: signal<Speaker[]>([]),
  openings: signal<Opening[]>([]),
  /** True when the opening list is stand-in data, not read from Property Intelligence yet. */
  openingsAreDemo: signal(true),
  selection: signal<Selection>(null),
  /** The last trace, for the sound compass. `positions` matches `sources` by index. */
  sound: signal<{ listener: Vec3; sources: SourceResult[]; positions: Vec3[]; echoTime: Bands } | null>(null),
  /** Pin id → behind a wall from where the camera is. Unknown ids count as visible. */
  hidden: signal<Map<string, boolean>>(new Map()),
  placing: signal(false),

  chat: signal<ChatMessage[]>([]),
  chatOpen: signal(false),
  thinking: signal(false),
  speaking: signal(false),
  /** Voice input. The mic button flips it; speech recognition plugs into `commands.voice` later. */
  listening: signal(false),
};

export function agentState(): AgentState {
  if (ui.thinking.value) return 'thinking';
  if (ui.listening.value) return 'listening';
  if (ui.speaking.value) return 'speaking';
  return 'idle';
}

/** Hooks the app fills in. The overlay never touches the viewer, worker or audio directly. */
export const commands = {
  toggleBlueprint: () => {},
  cycleBlueprintMode: () => {},
  toggleAudio: () => {},
  /** Called after any change so the app can retrace or update audio. */
  onSpeakersChanged: (_speakers: Speaker[]) => {},
  onOpeningsChanged: (_openings: Opening[]) => {},
  /** The agent: report progress through `session` as it works. Replace with the Jev relay (v2-design.md 6). */
  ask: (async (_text: string, _session: AgentSession) => {}) as (text: string, session: AgentSession) => Promise<void>,
  /** Voice on or off. Hook up speech-to-text here; it should call `ui.listening.value = false` when it ends. */
  voice: (_on: boolean) => {},
};

/** What an agent can show in the chat. The same calls fit a real streaming agent. */
export type AgentSession = {
  /** Start a visible step. Call the returned functions when it ends. */
  step(label: string): { done(detail?: string): void; fail(detail?: string): void };
  say(text: string): void;
  /** Suggest a change; `apply` runs only if the user accepts. */
  propose(p: { title: string; detail: string; changes: string[]; previewIds?: string[]; apply: () => void }): void;
};

const pendingApply = new Map<number, () => void>();

export function createSession(): AgentSession {
  let processId: number | null = null;
  const patchSteps = (fn: (steps: Step[]) => Step[]) => {
    ui.chat.value = ui.chat.value.map(m => (m.id === processId && m.kind === 'process' ? { ...m, steps: fn(m.steps) } : m));
  };
  return {
    step(label) {
      if (processId === null) {
        processId = nextId++;
        ui.chat.value = [...ui.chat.value.slice(-29), { id: processId, kind: 'process', steps: [] }];
      }
      const index = (ui.chat.value.find(m => m.id === processId) as Extract<ChatMessage, { kind: 'process' }>).steps.length;
      patchSteps(steps => [...steps, { label, status: 'run' }]);
      const end = (status: 'done' | 'fail') => (detail?: string) =>
        patchSteps(steps => steps.map((st, i) => (i === index ? { ...st, status, detail } : st)));
      return { done: end('done'), fail: end('fail') };
    },
    say(text) {
      pushChat('jev', text);
      ui.speaking.value = true;
      setTimeout(() => (ui.speaking.value = false), Math.min(4000, 900 + text.length * 25));
    },
    propose({ title, detail, changes, previewIds = [], apply }) {
      const id = nextId++;
      pendingApply.set(id, apply);
      ui.chat.value = [...ui.chat.value.slice(-29), { id, kind: 'proposal', title, detail, changes, previewIds, status: 'pending' }];
    },
  };
}

/** The user's answer to a suggestion. */
export function resolveProposal(id: number, accept: boolean): void {
  const apply = pendingApply.get(id);
  pendingApply.delete(id);
  ui.chat.value = ui.chat.value.map(m => (m.id === id && m.kind === 'proposal' && m.status === 'pending' ? { ...m, status: accept ? 'applied' : 'dismissed' } : m));
  if (accept) apply?.();
  const m = ui.chat.value.find(x => x.id === id);
  if (m?.kind === 'proposal') toast(accept ? `Applied: ${m.title.toLowerCase()}` : 'Suggestion dismissed', { description: accept ? m.changes.join(', ') : undefined });
}

/** Ids the agent's open suggestions would change, for the pins to light up. */
export function previewedIds(): Set<string> {
  const ids = new Set<string>();
  for (const m of ui.chat.value) if (m.kind === 'proposal' && m.status === 'pending') for (const id of m.previewIds) ids.add(id);
  return ids;
}

let nextId = 1;
export const newId = (prefix: string) => `${prefix}-${nextId++}`;

export function setSpeakers(list: Speaker[]): void {
  ui.speakers.value = list;
  commands.onSpeakersChanged(list);
}

export function updateSpeaker(id: string, patch: Partial<Speaker>): void {
  setSpeakers(ui.speakers.value.map(s => (s.id === id ? { ...s, ...patch } : s)));
}

export function removeSpeaker(id: string): void {
  setSpeakers(ui.speakers.value.filter(s => s.id !== id));
  if (ui.selection.value?.id === id) ui.selection.value = null;
}

export function addSpeaker(position: Vec3, soundId = 'music'): Speaker {
  const sound = SOUND_LIBRARY.find(s => s.id === soundId) ?? SOUND_LIBRARY[0];
  const count = ui.speakers.value.length + 1;
  const speaker: Speaker = {
    id: newId('speaker'),
    label: `Speaker ${count}`,
    sound: sound.id,
    kind: sound.kind,
    position,
    levelDb: sound.levelDb,
    enabled: true,
  };
  setSpeakers([...ui.speakers.value, speaker]);
  ui.selection.value = { kind: 'speaker', id: speaker.id };
  return speaker;
}

export function setOpenings(list: Opening[]): void {
  ui.openings.value = list;
  commands.onOpeningsChanged(list);
}

export function setOpeningOpen(ids: string[], open: boolean): number {
  const set = new Set(ids);
  let changed = 0;
  const next = ui.openings.value.map(o => {
    if (!set.has(o.id) || o.open === open) return o;
    changed++;
    return { ...o, open };
  });
  if (changed) setOpenings(next);
  return changed;
}

export function toggleOpening(id: string): void {
  const o = ui.openings.value.find(x => x.id === id);
  if (o) setOpeningOpen([id], !o.open);
}

export function pushChat(role: 'user' | 'jev', text: string): void {
  ui.chat.value = [...ui.chat.value.slice(-29), { id: nextId++, kind: 'text', role, text }];
}
