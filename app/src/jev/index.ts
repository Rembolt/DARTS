import type { Actions, SceneEffects } from '../scene/actions';
import type { SceneStore } from '../scene/store';
import './jev.css';
import { ask, type MessageParam } from './loop';
import { browserRecognition, pushToTalk } from './voice';

export function startJev(
  root: HTMLElement,
  deps: { store: SceneStore; actions: Actions; effects: SceneEffects; fetch?: typeof fetch },
): void {
  root.classList.add('jev');
  root.innerHTML = `
    <div class="jev-transcript" aria-live="polite" data-role="transcript"></div>
    <form class="jev-form" data-role="form">
      <input type="text" placeholder="Ask Jev about the acoustics…" data-role="input" />
      <button type="submit" data-role="send">Send</button>
      <button type="button" data-role="mic">Mic (V)</button>
    </form>
  `;

  const transcript = root.querySelector<HTMLElement>('[data-role="transcript"]')!;
  const form = root.querySelector<HTMLFormElement>('[data-role="form"]')!;
  const input = root.querySelector<HTMLInputElement>('[data-role="input"]')!;
  const sendBtn = root.querySelector<HTMLButtonElement>('[data-role="send"]')!;
  const micBtn = root.querySelector<HTMLButtonElement>('[data-role="mic"]')!;

  let convo: MessageParam[] = [];
  let busy = false;

  function append(role: 'user' | 'assistant' | 'step', text: string) {
    const el = document.createElement('div');
    el.className = `jev-msg ${role}`;
    el.textContent = text;
    transcript.append(el);
    transcript.scrollTop = transcript.scrollHeight;
  }

  async function submit(raw: string) {
    const text = raw.trim();
    if (!text || busy) return;
    busy = true;
    input.value = '';
    sendBtn.disabled = true;
    append('user', text);
    try {
      const res = await ask(text, convo, {
        ...deps,
        onStep: step => append('step', step),
      });
      convo = res.convo;
      append('assistant', res.reply);
    } finally {
      busy = false;
      sendBtn.disabled = false;
    }
  }

  form.addEventListener('submit', e => {
    e.preventDefault();
    void submit(input.value);
  });

  const ptt = pushToTalk({
    recognition: browserRecognition,
    onText(text, final) {
      input.value = text;
      if (final) void submit(text);
    },
  });

  if (!ptt.available) {
    micBtn.disabled = true;
    micBtn.title = 'Voice needs Chrome';
  } else {
    micBtn.addEventListener('pointerdown', () => ptt.start());
    micBtn.addEventListener('pointerup', () => ptt.stop());
    micBtn.addEventListener('pointerleave', () => ptt.stop());

    const isTyping = (target: EventTarget | null) =>
      target instanceof HTMLElement && /^(INPUT|TEXTAREA|SELECT)$/.test(target.tagName);

    document.addEventListener('keydown', e => {
      if (e.key.toLowerCase() === 'v' && !e.repeat && !isTyping(e.target) && !e.ctrlKey && !e.metaKey && !e.altKey) {
        ptt.start();
      }
    });
    document.addEventListener('keyup', e => {
      if (e.key.toLowerCase() === 'v') ptt.stop();
    });
  }
}
