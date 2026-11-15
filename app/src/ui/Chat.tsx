// The agent, as a bar at the bottom. It grows upward to show the last exchange and never covers the tour's centre.
import { ArrowUp, ChevronDown } from 'lucide-preact';
import { useEffect, useRef, useState } from 'preact/hooks';
import { commands, pushChat, ui } from './store';

const SUGGESTIONS = ['Close all the windows', 'Add a speaker', 'Open the kitchen door'];

export function Chat() {
  const [text, setText] = useState('');
  const log = useRef<HTMLDivElement>(null);
  const messages = ui.chat.value;
  const open = ui.chatOpen.value && messages.length > 0;

  useEffect(() => {
    log.current?.scrollTo({ top: log.current.scrollHeight });
  }, [messages.length, ui.thinking.value]);

  async function send(value: string) {
    const q = value.trim();
    if (!q || ui.thinking.value) return;
    setText('');
    pushChat('user', q);
    ui.chatOpen.value = true;
    ui.thinking.value = true;
    try {
      pushChat('jev', await commands.ask(q));
    } catch (err) {
      pushChat('jev', `That failed: ${err instanceof Error ? err.message : 'unknown error'}`);
    } finally {
      ui.thinking.value = false;
    }
  }

  return (
    <section class={`chat ${open ? 'is-open' : ''}`} aria-label="Ask Jev">
      {open && (
        <div class="card chat-log" ref={log} role="log" aria-live="polite">
          <button type="button" class="icon-btn collapse" aria-label="Hide conversation" onClick={() => (ui.chatOpen.value = false)}>
            <ChevronDown size={16} />
          </button>
          {messages.map(m => (
            <p key={m.id} class={`msg ${m.role}`}>
              {m.text}
            </p>
          ))}
          {ui.thinking.value && <p class="msg jev thinking" aria-label="Thinking"><span /><span /><span /></p>}
        </div>
      )}
      {!open && messages.length === 0 && (
        <div class="chips">
          {SUGGESTIONS.map(s => (
            <button type="button" class="chip" onClick={() => void send(s)}>
              {s}
            </button>
          ))}
        </div>
      )}
      <form
        class="card composer"
        onSubmit={e => {
          e.preventDefault();
          void send(text);
        }}
      >
        <span class="mark" aria-hidden="true">J</span>
        <input
          value={text}
          placeholder="Ask Jev about this home, or tell it what to change"
          aria-label="Message Jev"
          onInput={e => setText((e.currentTarget as HTMLInputElement).value)}
          onFocus={() => (ui.chatOpen.value = true)}
        />
        <button type="submit" class="send" aria-label="Send" disabled={!text.trim() || ui.thinking.value}>
          <ArrowUp size={16} strokeWidth={2.4} />
        </button>
      </form>
    </section>
  );
}
