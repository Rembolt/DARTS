// The first moment: sound needs a click to start anyway, so that click is the welcome.
import { Headphones } from 'lucide-preact';
import { commands, ui } from './store';

const KEY = 'acoustic:started';

export function startedBefore(): boolean {
  try {
    return sessionStorage.getItem(KEY) === '1';
  } catch {
    return false;
  }
}

function pass(withSound: boolean) {
  try {
    sessionStorage.setItem(KEY, '1');
  } catch {
    /* private mode: show it again next time, that is fine */
  }
  ui.started.value = true;
  if (withSound && ui.audio.value === 'off') commands.toggleAudio();
}

export function StartScreen() {
  if (ui.started.value) return null;
  return (
    <div class="start" role="dialog" aria-modal="true" aria-labelledby="start-title">
      <div class="start-card">
        <Headphones size={28} strokeWidth={1.6} />
        <h1 id="start-title">Put on headphones</h1>
        <p>Walk through the home and hear it: the street through the walls, each room's echo, what changes when you close a window.</p>
        <button type="button" class="btn primary big" onClick={() => pass(true)}>
          Start listening
        </button>
        <button type="button" class="link" onClick={() => pass(false)}>
          Look around without sound
        </button>
      </div>
    </div>
  );
}
