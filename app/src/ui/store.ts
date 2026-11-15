// The UI's state, in one place. The page's other parts (viewer, worker, audio) write into it from main.ts, and the
// overlay reads it. The V2 scene state (v2-design.md section 3) will replace the speaker and opening lists; the
// `commands` hooks are where the overlay calls back into the app.
import { signal } from '@preact/signals';
import { toast } from 'sonner';
import type { Bands, SourceResult, Vec3 } from '../sim/types';
import type { FloorGrid } from './heat';
import { DEFAULT_SETTINGS, parseSettings, type Settings } from './materials';
import type { TimeOfDay } from './scenario';
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
export type Probe = { id: string; position: Vec3; readings: { sourceId: string; db: number; walls: number; bands: Bands }[] | null };

export type ChatMessage =
  | { id: number; kind: 'text'; role: 'user' | 'jev'; text: string }
  /** What the agent is doing, step by step, so the user sees the whole process. */
  | { id: number; kind: 'process'; steps: Step[] }
  /** A change the agent suggests. Nothing happens until the user applies it. */
  | { id: number; kind: 'proposal'; title: string; detail: string; changes: string[]; previewIds: string[]; previewOpen?: boolean; status: ProposalStatus };
export type AgentState = 'idle' | 'listening' | 'thinking' | 'speaking';
export type Selection = { kind: 'speaker' | 'opening'; id: string } | null;
export type AudioState = 'off' | 'starting' | 'on';

const SETTINGS_KEY = 'acoustic:scene';
function loadFlag(name: string): boolean {
  try {
    return localStorage.getItem(`panel-shown-${name}`) !== 'false';
  } catch {
    return true;
  }
}

/** Show or hide a dock-toggled panel, and remember it. */
export function setShown(name: 'room' | 'compass' | 'minimap', on: boolean): void {
  (name === 'room' ? ui.roomShown : name === 'compass' ? ui.compassShown : ui.minimapShown).value = on;
  try {
    localStorage.setItem(`panel-shown-${name}`, String(on));
  } catch {
    /* private window: the choice just lasts this visit */
  }
}

function loadSettings(): Settings {
  try {
    return parseSettings(JSON.parse(localStorage.getItem(SETTINGS_KEY) ?? 'null'));
  } catch {
    return DEFAULT_SETTINGS;
  }
}

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
  /** Real openings from Property Intelligence (`/api/openings/:id`). */
  openingsAreDemo: signal(false),
  selection: signal<Selection>(null),
  /** What a click in placement mode drops. */
  placeKind: signal<'speaker' | 'probe'>('speaker'),
  /** Listening probes: a point that shows how loud each source is there. `readings` null while measuring. */
  probes: signal<Probe[]>([]),
  timeOfDay: signal<TimeOfDay>('rush'),
  /** True while A (or a compare button) is held: you hear and see the alternative. */
  comparing: signal(false),
  /** Street noise over the floor of this storey, dB below outside per grid cell. */
  heat: signal<{ grid: FloorGrid; db: Float32Array } | null>(null),
  room: signal<{ id: string; label: string } | null>(null),
  /** Materials, furnishing and quality: what the simulation runs with. Remembered between visits. */
  settings: signal<Settings>(loadSettings()),
  settingsOpen: signal(false),
  /** The room card and the sound compass can be hidden from the dock (they stay foldable too). Remembered. */
  roomShown: signal(loadFlag('room')),
  compassShown: signal(loadFlag('compass')),
  minimapShown: signal(loadFlag('minimap')),
  /** The headphones screen has been passed. */
  started: signal(false),
  /** The last trace, for the sound compass. `positions` matches `sources` by index. */
  sound: signal<{ listener: Vec3; sources: SourceResult[]; positions: Vec3[]; echoTime: Bands } | null>(null),
  /** The walls between you and each source, with where they are and what they cost: for the badges and the line's steps. */
  walls: signal<{ sourceId: string; color: number; items: { position: Vec3; lossDb: number }[] }[]>([]),
  /** Show the strongest echoes in the blueprint (off by default: the direct line is the story). */
  showEchoes: signal(false),
  /** Pin id → behind a wall from where the camera is. Unknown ids count as visible. */
  hidden: signal<Map<string, boolean>>(new Map()),
  placing: signal(false),

  chat: signal<ChatMessage[]>([]),
  chatOpen: signal(false),
  thinking: signal(false),
  speaking: signal(false),
  /** Voice input. The mic button flips it; speech recognition plugs into `commands.voice` later. */
  listening: signal(false),
  /** What Whisper has heard so far while the mic is on. */
  liveText: signal(''),
  footsteps: signal(true),
};

export const isOutdoorSource = (id: string): boolean =>
  id === 'outdoor' || id === 'area' || id === 'road' || id === 'highway' || ui.speakers.value.some(s => s.id === id && s.kind === 'ambient');

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
  toggleFootsteps: () => {},
  /** Called after any change so the app can retrace or update audio. */
  onSpeakersChanged: (_speakers: Speaker[]) => {},
  onOpeningsChanged: (_openings: Opening[]) => {},
  /** The agent: report progress through `session` as it works. Replace with the Jev relay (v2-design.md 6). */
  ask: (async (_text: string, _session: AgentSession) => {}) as (text: string, session: AgentSession) => Promise<void>,
  /** Stop whatever Jev is doing: the running request and any tool calls still queued. */
  stop: () => {},
  /** Voice on or off. Hook up speech-to-text here; it should call `ui.listening.value = false` when it ends. */
  voice: (_on: boolean) => {},
};

/** What an agent can show in the chat. The same calls fit a real streaming agent. */
export type AgentSession = {
  /** Start a visible step. Call the returned functions when it ends. */
  step(label: string): { done(detail?: string): void; fail(detail?: string): void };
  say(text: string): void;
  /** Suggest a change; `apply` runs only if the user accepts. */
  propose(p: { title: string; detail: string; changes: string[]; previewIds?: string[]; previewOpen?: boolean; apply: () => void }): void;
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
    propose({ title, detail, changes, previewIds = [], previewOpen, apply }) {
      const id = nextId++;
      pendingApply.set(id, apply);
      ui.chat.value = [...ui.chat.value.slice(-29), { id, kind: 'proposal', title, detail, changes, previewIds, previewOpen, status: 'pending' }];
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

/** The open suggestion whose change can be heard before applying it, if any. */
export function pendingPreview(): { ids: string[]; open: boolean; title: string } | null {
  for (let i = ui.chat.value.length - 1; i >= 0; i--) {
    const m = ui.chat.value[i];
    if (m.kind === 'proposal' && m.status === 'pending' && m.previewOpen !== undefined && m.previewIds.length)
      return { ids: m.previewIds, open: m.previewOpen, title: m.title };
  }
  return null;
}

/**
 * The alternative that A/B compare plays: the open suggestion if there is one, otherwise every window flipped
 * (all closed if any is open, else all open). Returns the openings as they would be, and a name for it.
 */
export function alternative(): { openings: Opening[]; label: string } {
  const list = ui.openings.value;
  const p = pendingPreview();
  if (p) {
    const ids = new Set(p.ids);
    return { openings: list.map(o => (ids.has(o.id) ? { ...o, open: p.open } : o)), label: p.title };
  }
  const anyOpen = list.some(o => o.type === 'window' && o.open);
  return {
    openings: list.map(o => (o.type === 'window' ? { ...o, open: !anyOpen } : o)),
    label: anyOpen ? 'All windows closed' : 'All windows open',
  };
}

/** The openings you are hearing right now: the alternative while comparing, the real ones otherwise. */
export function heardOpenings(): Opening[] {
  return ui.comparing.value ? alternative().openings : ui.openings.value;
}

export function addProbe(position: Vec3): Probe {
  const probe: Probe = { id: newId('probe'), position, readings: null };
  ui.probes.value = [...ui.probes.value.slice(-5), probe];
  return probe;
}

export function removeProbe(id: string): void {
  ui.probes.value = ui.probes.value.filter(p => p.id !== id);
}

export function setSettings(next: Settings): void {
  ui.settings.value = next;
  try {
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(next));
  } catch {
    /* private window: not remembered */
  }
}

export function patchSettings(patch: Partial<Omit<Settings, 'materials'>> & { materials?: Partial<Settings['materials']> }): void {
  const cur = ui.settings.value;
  setSettings({ ...cur, ...patch, materials: { ...cur.materials, ...patch.materials } });
}
