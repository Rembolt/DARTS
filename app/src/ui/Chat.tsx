// The agent, as a bar at the bottom. It grows upward to show the conversation, the steps the agent took, and any
// change it suggests, which only happens when the user applies it.
import { ArrowUp, Check, ChevronDown, Loader2, Mic, MicOff, X } from 'lucide-preact';
import { useEffect, useRef, useState } from 'preact/hooks';
import { Orb, stateLabel } from './Orb';
import { agentState, commands, createSession, pushChat, resolveProposal, ui, type ChatMessage } from './store';

const SUGGESTIONS = ['Close all the windows', 'Add a speaker', 'Open the kitchen door'];

function Process({ steps }: { steps: Extract<ChatMessage, { kind: 'process' }>['steps'] }) {
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
          <button type="button" class="btn" onClick={() => resolveProposal(m.id, false)}>
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
    <section class={`chat ${open ? 'is-open' : ''}`} aria-label="Ask Jev">
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
      {!open && messages.length === 0 && state === 'idle' && (
        <div class="chips">
          {SUGGESTIONS.map(s => (
            <button type="button" class="chip" onClick={() => void send(s)}>
              {s}
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
            value={text}
            placeholder="Ask Jev about this home, or tell it what to change"
            aria-label="Message Jev"
            onInput={e => setText((e.currentTarget as HTMLInputElement).value)}
            onFocus={() => {
              ui.chatOpen.value = true;
              ui.selection.value = null;
            }}
          />
        ) : (
          <p class="state-line" role="status">
            {stateLabel()}
          </p>
        )}
        <button type="button" class={`mic ${ui.listening.value ? 'on' : ''}`} aria-pressed={ui.listening.value} aria-label={ui.listening.value ? 'Stop listening' : 'Talk to Jev'} title="Voice (coming soon)" onClick={toggleVoice}>
          {ui.listening.value ? <MicOff size={16} /> : <Mic size={16} />}
        </button>
        <button type="submit" class="send" aria-label="Send" disabled={!text.trim() || ui.thinking.value}>
          <ArrowUp size={16} strokeWidth={2.4} />
        </button>
      </form>
    </section>
  );
}
