// The UI's state, in one place. The page's other parts (viewer, worker, audio) write into it from main.ts, and the
// overlay reads it. The V2 scene state (v2-design.md section 3) will replace the speaker and opening lists; the
// `commands` hooks are where the overlay calls back into the app.
import { signal } from '@preact/signals';
import type { Vec3 } from '../sim/types';
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

export type ChatMessage = { id: number; role: 'user' | 'jev'; text: string };
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
  placing: signal(false),

  chat: signal<ChatMessage[]>([]),
  chatOpen: signal(false),
  thinking: signal(false),
};

/** Hooks the app fills in. The overlay never touches the viewer, worker or audio directly. */
export const commands = {
  toggleBlueprint: () => {},
  cycleBlueprintMode: () => {},
  toggleAudio: () => {},
  /** Called after any change so the app can retrace or update audio. */
  onSpeakersChanged: (_speakers: Speaker[]) => {},
  onOpeningsChanged: (_openings: Opening[]) => {},
  /** The agent. Resolves with the reply text. Replace with the Jev relay (v2-design.md 6). */
  ask: (async (_text: string) => '') as (text: string) => Promise<string>,
};

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

export function pushChat(role: ChatMessage['role'], text: string): void {
  ui.chat.value = [...ui.chat.value.slice(-19), { id: nextId++, role, text }];
}
