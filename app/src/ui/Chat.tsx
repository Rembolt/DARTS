// The agent, as a bar at the bottom. It grows upward to show the conversation, the steps the agent took, and any
// change it suggests, which only happens when the user applies it.
import { ArrowUp, Check, ChevronDown, ChevronRight, Headphones, Loader2, Mic, MicOff, X } from 'lucide-preact';
import { useEffect, useRef, useState } from 'preact/hooks';
import { plain, onKeyDown } from './keys';
import { Orb, stateLabel } from './Orb';
import { bandMean } from './compass';
import { heardDb, outdoorTrim } from './scenario';
import { agentState, commands, createSession, isOutdoorSource, pushChat, resolveProposal, ui, type ChatMessage } from './store';

/** One suggestion from the numbers, or nothing. Never a generic list. */
function contextHint(): { text: string; ask: string } | null {
  const sound = ui.sound.value;
  const outdoor = sound?.sources.find(s => isOutdoorSource(s.id));
  if (!outdoor) return null;
  const db = Math.round(heardDb(bandMean(outdoor.direct), outdoorTrim(ui.openings.value, ui.timeOfDay.value).db));
  const open = ui.openings.value.filter(o => o.type === 'window' && o.open).length;
  if (db > -20 && open > 0) return { text: `Street noise ${db} dB here, ${open} window${open > 1 ? 's' : ''} open. Close ${open > 1 ? 'them' : 'it'}?`, ask: 'Close all the windows' };
  return null;
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
        <Check size={13} strokeWidth={3} /> Checked {steps.length} things <ChevronRight size={13} />
      </button>
    );
  return (
    <ol class="process" aria-label="What Jev did">
      {steps.map(st => (
        <li class={`step ${st.status}`}>
          <span class="step-icon">{st.status === 'run' ? <Loader2 size={13} class="spin" /> : st.status === 'done' ? <Check size={13} strokeWidth={3} /> : <X size={13} strokeWidth={3} />}</span>
          <span>{st.label}</span>
          {st.detail && <em>{st.detail}</em>}
        </li>
      ))}
    </ol>
  );
}

function Proposal({ m }: { m: Extract<ChatMessage, { kind: 'proposal' }> }) {
  return (
    <div class={`proposal is-${m.status}`}>
      <p class="p-kicker">Jev suggests</p>
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
        input.current?.focus();
        return true;
      }),
    [],
  );
  const [focused, setFocused] = useState(false);
  const hint = contextHint();

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
    try {
      await commands.ask(q, session);
    } catch (err) {
      session.say(`That failed: ${err instanceof Error ? err.message : 'unknown error'}`);
    } finally {
      ui.thinking.value = false;
    }
  }

  function toggleVoice() {
    const on = !ui.listening.value;
    ui.listening.value = on;
    commands.voice(on);
  }

  return (
    <section class={`chat ${open || focused || text ? 'is-open' : ''}`} aria-label="Ask Jev">
      {open && (
        <div class="card chat-log" ref={log} role="log" aria-live="polite">
          <button type="button" class="icon-btn collapse" aria-label="Hide conversation" onClick={() => (ui.chatOpen.value = false)}>
            <ChevronDown size={16} />
          </button>
          {messages.map(m =>
            m.kind === 'text' ? (
              <p key={m.id} class={`msg ${m.role}`}>
                {m.text}
              </p>
            ) : m.kind === 'process' ? (
              <Process key={m.id} steps={m.steps} />
            ) : (
              <Proposal key={m.id} m={m} />
            ),
          )}
        </div>
      )}
      {!open && hint && state === 'idle' && (
        <button type="button" class="hint-line" onClick={() => void send(hint.ask)}>
          {hint.text}
        </button>
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
            placeholder="Ask Jev"
            onBlur={() => setFocused(false)}
            aria-label="Message Jev"
            onInput={e => setText((e.currentTarget as HTMLInputElement).value)}
            onFocus={() => {
              setFocused(true);
              ui.chatOpen.value = true;
              ui.selection.value = null;
            }}
          />
        ) : (
          <p class="state-line" role="status">
            {stateLabel()}
          </p>
        )}
        {state === 'idle' && !focused && !text && <kbd class="slash">/</kbd>}
        <button type="button" class={`mic ${ui.listening.value ? 'on' : ''}`} aria-pressed={ui.listening.value} aria-label={ui.listening.value ? 'Stop listening' : 'Talk to Jev'} title="Talk to Jev" onClick={toggleVoice}>
          {ui.listening.value ? <MicOff size={16} /> : <Mic size={16} />}
        </button>
        <button type="submit" class="send" aria-label="Send" disabled={!text.trim() || ui.thinking.value}>
          <ArrowUp size={16} strokeWidth={2.4} />
        </button>
      </form>
    </section>
  );
}
