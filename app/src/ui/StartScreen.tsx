// The first moment: sound needs a click to start anyway, so that click is the welcome.
import { effect } from '@preact/signals';
import { commands, ui } from './store';

const KEY = 'acoustic:started';
const MUTED = 'acoustic:muted';
const ENTERED = 'acoustic:entered'; // when the front door sent you in, set by the front door

function mutedByChoice(): boolean {
  try {
    return sessionStorage.getItem(MUTED) === '1';
  } catch {
    return false;
  }
}

function setMuted(on: boolean): void {
  try {
    if (on) sessionStorage.setItem(MUTED, '1');
    else sessionStorage.removeItem(MUTED);
  } catch {
    /* private mode: the choice just lasts until reload */
  }
}

/**
 * Sound is on by default. The browser only lets audio start after a click or key press, so "Start listening" is that click.
 * After a reload (the headphones screen is skipped) the first click or key press anywhere, in the page or in the tour,
 * turns it back on, unless the person chose "Look around without sound" or turned it off themselves.
 */
export function armAutoSound(): void {
  if (!ui.started.value || mutedByChoice() || ui.audio.value !== 'off') return;
  // Chrome keeps "the person has clicked on this site" across a same-site page load: arriving by a click (from the front door)
  // the sound can start at once. Otherwise it waits for the first click or key press below.
  if ((navigator as Navigator & { userActivation?: { hasBeenActive: boolean } }).userActivation?.hasBeenActive) {
    commands.toggleAudio();
    return;
  }
  const docs = new Set<Document>();
  const go = (e: Event) => {
    if ((e.target as Element | null)?.closest?.('[data-tour="sound"], .start')) return; // that button does its own toggling
    off();
    if (ui.audio.value === 'off' && !mutedByChoice()) commands.toggleAudio();
  };
  const attach = (d: Document | null | undefined) => {
    if (!d || docs.has(d)) return;
    docs.add(d);
    d.addEventListener('pointerdown', go, true);
    d.addEventListener('keydown', go, true);
  };
  // The tour is an iframe that may finish loading after this runs: look again every second until the first click.
  const scan = () => {
    attach(document);
    for (const f of Array.from(document.querySelectorAll('iframe'))) {
      try {
        attach(f.contentDocument);
      } catch {
        /* cross-origin frame: only the page itself */
      }
    }
  };
  const timer = setInterval(scan, 1000);
  const off = () => {
    clearInterval(timer);
    for (const d of docs) {
      d.removeEventListener('pointerdown', go, true);
      d.removeEventListener('keydown', go, true);
    }
    docs.clear();
  };
  scan();
}

// Turning sound off yourself is a choice to keep it off for this visit; turning it on clears that.
let wasOn = false;
effect(() => {
  const a = ui.audio.value;
  if (a === 'off' && wasOn) setMuted(true);
  if (a === 'on') {
    wasOn = true;
    setMuted(false);
  }
});

/**
 * The headphones screen is skipped for someone who chose no sound this visit, and for someone who just arrived by clicking
 * "Listen inside" on the front door (that click was the "yes, play it", and Chrome lets sound start after it). Everyone else
 * sees it on every load: a browser will not play sound until a click, so "Start listening" is that click.
 */
export function startedBefore(): boolean {
  try {
    if (sessionStorage.getItem(KEY) !== '1') return false;
    if (sessionStorage.getItem(MUTED) === '1') return true;
    const entered = Number(sessionStorage.getItem(ENTERED));
    const justArrived = Number.isFinite(entered) && Date.now() - entered < 15_000;
    return justArrived && !!(navigator as Navigator & { userActivation?: { hasBeenActive: boolean } }).userActivation?.hasBeenActive;
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
  setMuted(!withSound);
  ui.started.value = true;
  if (withSound && ui.audio.value === 'off') commands.toggleAudio();
}

export function StartScreen() {
  if (ui.started.value) return null;
  return (
    <div class="start" role="dialog" aria-modal="true" aria-labelledby="start-title">
      <div class="start-card">
        <img class="start-mark" src="/darts-mark.svg" alt="DARTS" width={36} height={36} />
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
