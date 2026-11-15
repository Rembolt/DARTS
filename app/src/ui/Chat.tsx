// The agent, as a bar at the bottom. It grows upward to show the conversation, the steps the agent took, and any
// change it suggests, which only happens when the user applies it.
import { ArrowUp, AudioLines, Volume2, VolumeX, Check, ChevronDown, ChevronRight, ChevronUp, Headphones, Loader2, Mic, MicOff, Square, X } from 'lucide-preact';
import { useEffect, useRef, useState } from 'preact/hooks';
import { plain, onKeyDown } from './keys';
import { Orb, stateLabel } from './Orb';
import { bandMean } from './compass';
import { heardDb, outdoorTrim } from './scenario';
import { setVoiceMuted, stopSpeaking, voiceMuted } from '../voice/speak';
import { agentState, commands, createSession, isOutdoorSource, latestAsk, pushChat, resolveProposal, ui, type ChatMessage } from './store';

/** One suggestion from the numbers, or nothing. Never a generic list. */
/** Render **bold** in a message as <strong> without touching innerHTML. */
function renderInline(text: string) {
  return text.split(/(\*\*[^*\n]+\*\*)/g).map((part, i) =>
    part.startsWith('**') && part.endsWith('**') && part.length > 4 ? <strong key={i}>{part.slice(2, -2)}</strong> : part,
  );
}

const CONFIRM = '[[confirm]]';

/** Replies: lines starting with "- " become a bullet list, other lines stay paragraphs. **bold** works in both. */
function renderBlocks(text: string) {
  const out: preact.ComponentChildren[] = [];
  let bullets: string[] = [];
  const flush = () => {
    if (bullets.length) out.push(<ul class="msg-list">{bullets.map(b => <li>{renderInline(b)}</li>)}</ul>);
    bullets = [];
  };
  for (const line of text.split('\n')) {
    const m = /^\s*[-•*]\s+(.*)$/.exec(line);
    if (m) bullets.push(m[1]);
    else {
      flush();
      if (line.trim()) out.push(<span class="msg-line">{renderInline(line)}</span>);
    }
  }
  flush();
  return out;
}

function contextHint(): { text: string; ask: string } | null {
  const sound = ui.sound.value;
  const outdoor = sound?.sources.find(s => isOutdoorSource(s.id));
  if (!outdoor) return null;
  const db = Math.round(heardDb(bandMean(outdoor.direct), outdoorTrim(ui.openings.value, ui.timeOfDay.value).db));
  const open = ui.openings.value.filter(o => o.type === 'window' && o.open).length;
  if (db > -20 && open > 0) return { text: `Street noise ${db} dB here, ${open} window${open > 1 ? 's' : ''} open. Close ${open > 1 ? 'them' : 'it'}?`, ask: 'Close all the windows' };
  return null;
}

type Suggestion = { text: string; ask: string };

/** A few questions that fit what is on screen right now: the room you are in, the street, the windows, the echo. */
function suggestions(): Suggestion[] {
  const out: Suggestion[] = [];
  const hint = contextHint();
  if (hint) out.push(hint);
  const room = ui.room.value?.label;
  const echo = ui.sound.value?.echoTime[1];
  const windowsOpen = ui.openings.value.filter(o => o.type === 'window' && o.open).length;
  const doorsOpen = ui.openings.value.filter(o => o.type === 'door' && o.open).length;
  if (echo !== undefined && echo > 0.7) out.push({ text: 'Too echoey? Ask how to reduce it', ask: `How can I make the ${room ?? 'room'} less echoey?` });
  else if (room) out.push({ text: `How echoey is the ${room.toLowerCase()}?`, ask: `How echoey is the ${room}?` });
  if (!hint && windowsOpen > 0) out.push({ text: 'What if I close the windows?', ask: 'What changes if I close all the windows?' });
  if (doorsOpen > 2) out.push({ text: 'What if I close the doors?', ask: 'What changes if I close all the doors?' });
  if (ui.speakers.value.length === 0) out.push({ text: 'How would music sound here?', ask: 'Put music in this room and tell me how it sounds' });
  out.push({ text: 'Which room is quietest?', ask: 'Which room is the quietest, and why?' });
  return out.slice(0, 3);
}

function Process({ steps }: { steps: Extract<ChatMessage, { kind: 'process' }>['steps'] }) {
  const [open, setOpen] = useState(false);
  const running = steps.find(st => st.status === 'run');
  if (running && !open)
    return (
      <p class="process-line">
        <Loader2 size={13} class="spin" /> {running.label}
      </p>
    );
  if (!open)
    return (
      <button type="button" class="process-line done" onClick={() => setOpen(true)} aria-expanded="false">
        <Check size={13} strokeWidth={3} /> Checked {steps.length} {steps.length === 1 ? 'thing' : 'things'} <ChevronRight size={13} />
      </button>
    );
  return (
    <div class="process-wrap">
      <button type="button" class="process-line done" onClick={() => setOpen(false)} aria-expanded="true">
        <Check size={13} strokeWidth={3} /> Checked {steps.length} {steps.length === 1 ? 'thing' : 'things'} <ChevronDown size={13} />
      </button>
    <ol class="process" aria-label="What the assistant did">
      {steps.map(st => (
        <li class={`step ${st.status}`}>
          <span class="step-icon">{st.status === 'run' ? <Loader2 size={13} class="spin" /> : st.status === 'done' ? <Check size={13} strokeWidth={3} /> : <X size={13} strokeWidth={3} />}</span>
          <span>{st.label}</span>
          {st.detail && <em>{st.detail}</em>}
        </li>
      ))}
    </ol>
    </div>
  );
}

function Proposal({ m }: { m: Extract<ChatMessage, { kind: 'proposal' }> }) {
  return (
    <div class={`proposal is-${m.status}`}>
      <p class="p-kicker">Suggestion</p>
      <h4>{m.title}</h4>
      <p class="p-detail">{m.detail}</p>
      <ul>
        {m.changes.map(c => (
          <li>{c}</li>
        ))}
      </ul>
      {m.status === 'pending' ? (
        <div class="p-actions">
          <button type="button" class="btn primary" onClick={() => resolveProposal(m.id, true)}>
            <Check size={14} strokeWidth={2.6} /> Apply
          </button>
          {m.previewOpen !== undefined && (
            <button
              type="button"
              class={`btn ${ui.comparing.value ? 'held' : ''}`}
              title="Hold to hear it before applying (or hold A)"
              onPointerDown={() => (ui.comparing.value = true)}
              onPointerUp={() => (ui.comparing.value = false)}
              onPointerLeave={() => (ui.comparing.value = false)}
            >
              <Headphones size={14} /> Hold to hear
            </button>
          )}
          <button type="button" class="btn quiet" onClick={() => resolveProposal(m.id, false)}>
            Dismiss
          </button>
        </div>
      ) : (
        <p class="p-result">{m.status === 'applied' ? 'Applied' : 'Dismissed'}</p>
      )}
    </div>
  );
}

export function Chat() {
  const [text, setText] = useState('');
  const log = useRef<HTMLDivElement>(null);
  const messages = ui.chat.value;
  const open = ui.chatOpen.value && messages.length > 0;
  const state = agentState();

  const input = useRef<HTMLInputElement>(null);
  useEffect(
    // "/" puts the cursor in the agent, from the page or from the tour.
    () =>
      onKeyDown(e => {
        if (!plain(e, '/')) return;
        e.preventDefault();
        window.focus(); // the key may have been pressed inside the tour's frame
        input.current?.focus();
        return true;
      }),
    [],
  );
  const [focused, setFocused] = useState(false);
  const ideas = suggestions();

  useEffect(() => {
    log.current?.scrollTo({ top: log.current.scrollHeight, behavior: 'smooth' });
  }, [messages, ui.thinking.value]);

  async function send(value: string) {
    const q = value.trim();
    if (!q || ui.thinking.value) return;
    setText('');
    pushChat('user', q);
    ui.chatOpen.value = true;
    ui.selection.value = null;
    ui.thinking.value = true;
    const session = createSession();
    const request = commands.ask(q, session);
    const mine = latestAsk.id;
    try {
      await request;
    } catch (err) {
      session.say(`That failed: ${err instanceof Error ? err.message : 'unknown error'}`);
    } finally {
      // A spoken question may have replaced this one: then the newer request owns the "thinking" state.
      if (mine === latestAsk.id) ui.thinking.value = false;
    }
  }

  function toggleVoice() {
    if (ui.converse.value) {
      ui.micMuted.value = !ui.micMuted.value; // in a voice conversation the mic button mutes the mic
      return;
    }
    const on = !ui.listening.value;
    if (on) stopSpeaking(); // do not hear Jev while you talk
    ui.listening.value = on;
    commands.voice(on);
  }

  return (
    <section class={`chat ${open || focused || text ? 'is-open' : ''}`} aria-label="Sound assistant">
      {!open && messages.length > 0 && (
        <button type="button" class="chat-reopen" onClick={() => (ui.chatOpen.value = true)}>
          <ChevronUp size={14} /> Show conversation
        </button>
      )}
      {open && (
        <div class="card chat-log" ref={log} role="log" aria-live="polite">
          <div class="chat-head">
            <span>Sound assistant</span>
            <button type="button" class="icon-btn" aria-label="Hide conversation" title="Hide conversation" onClick={() => (ui.chatOpen.value = false)}>
              <ChevronDown size={16} />
            </button>
          </div>
          {messages.map((m, idx) =>
            m.kind === 'text' ? (
              <div key={m.id} class={`msg ${m.role}`}>
                {renderBlocks(m.text.replace(CONFIRM, '').trim())}
                {m.role === 'jev' && m.text.includes(CONFIRM) && idx === messages.length - 1 && !ui.thinking.value && (
                  <span class="confirm-actions">
                    <button type="button" class="btn primary" onClick={() => void send('Yes, go ahead.')}>Yes</button>
                    <button type="button" class="btn quiet" onClick={() => void send('No, leave it as it is.')}>No</button>
                  </span>
                )}
              </div>
            ) : m.kind === 'process' ? (
              <Process key={m.id} steps={m.steps} />
            ) : (
              <Proposal key={m.id} m={m} />
            ),
          )}
        </div>
      )}
      {!open && ideas.length > 0 && state === 'idle' && !text && (
        <div class="suggest-row" role="group" aria-label="Ideas to ask">
          {ideas.map(i => (
            <button key={i.text} type="button" class="hint-line" onClick={() => void send(i.ask)}>
              {i.text}
            </button>
          ))}
        </div>
      )}
      <form
        class={`card composer is-${state}`}
        onSubmit={e => {
          e.preventDefault();
          void send(text);
        }}
      >
        <Orb />
        {state === 'idle' ? (
          <input
            ref={input}
            value={text}
            placeholder="Ask, or say what to change"
            onBlur={() => setFocused(false)}
            aria-label="Ask about the sound or say what to change"
            onInput={e => setText((e.currentTarget as HTMLInputElement).value)}
            onFocus={() => {
              setFocused(true);
              ui.chatOpen.value = true;
              ui.selection.value = null;
            }}
          />
        ) : (
          <p class="state-line" role="status">
            {state === 'listening' && ui.liveText.value ? `“${ui.liveText.value.length > 70 ? `…${ui.liveText.value.slice(-70)}` : ui.liveText.value}”` : stateLabel()}
          </p>
        )}
        {state === 'idle' && !focused && !text && <kbd class="slash">/</kbd>}
        <button
          type="button"
          class={`mic voice ${voiceMuted.value ? 'on' : ''}`}
          aria-pressed={!voiceMuted.value}
          aria-label={voiceMuted.value ? 'Turn the assistant voice on' : 'Turn the assistant voice off'}
          title={voiceMuted.value ? 'Voice is off: click to let the assistant speak' : 'Voice is on: click to keep the assistant silent'}
          onClick={() => setVoiceMuted(!voiceMuted.value)}
        >
          {voiceMuted.value ? <VolumeX size={16} /> : <Volume2 size={16} />}
        </button>
        <button
          type="button"
          class={`mic talk ${ui.converse.value ? 'on' : ''} ${ui.converse.value && ui.listening.value ? 'hearing' : ''}`}
          aria-pressed={ui.converse.value}
          aria-label={ui.converse.value ? 'End the conversation' : 'Start a voice conversation'}
          title={ui.converse.value ? 'End the voice conversation' : 'Talk with Jev, hands free (headphones recommended)'}
          onClick={() => commands.converse(!ui.converse.value)}
        >
          <AudioLines size={16} />
        </button>
        <button
          type="button"
          class={`mic ${ui.converse.value ? (ui.micMuted.value ? 'on' : '') : ui.listening.value ? 'on' : ''}`}
          aria-pressed={ui.converse.value ? ui.micMuted.value : ui.listening.value}
          aria-label={ui.converse.value ? (ui.micMuted.value ? 'Unmute the microphone' : 'Mute the microphone') : ui.listening.value ? 'Stop listening' : 'Talk instead of typing'}
          title={ui.converse.value ? (ui.micMuted.value ? 'Microphone muted: click to unmute' : 'Mute the microphone') : 'Talk instead of typing'}
          onClick={toggleVoice}
        >
          {ui.converse.value ? (ui.micMuted.value ? <MicOff size={16} /> : <Mic size={16} />) : ui.listening.value ? <MicOff size={16} /> : <Mic size={16} />}
        </button>
        {ui.thinking.value || ui.speaking.value ? (
          <button type="button" class="send stop" aria-label="Stop" title="Stop" onClick={() => commands.stop()}>
            <Square size={13} fill="currentColor" />
          </button>
        ) : (
          <button type="submit" class="send" aria-label="Send" disabled={!text.trim()}>
            <ArrowUp size={16} strokeWidth={2.4} />
          </button>
        )}
      </form>
    </section>
  );
}
