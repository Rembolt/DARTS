// The first-visit walkthrough: the page goes dark except the one control being explained, with a short card beside it.
// Skippable at any step (Esc too), remembered once seen, and the help button in the dock plays it again.
import { signal } from '@preact/signals';
import { ArrowLeft, CircleHelp, Compass, Crosshair, DoorOpen, Layers, Map as MapIcon, Plus, SlidersHorizontal, Volume2 } from 'lucide-preact';
import type { ComponentType } from 'preact';
import { useEffect, useLayoutEffect, useRef, useState } from 'preact/hooks';
import { onKeyDown } from './keys';
import { ui } from './store';

const KEY = 'acoustic:tutorial';

type Tool = { icon: ComponentType<{ size?: number; strokeWidth?: number }>; name: string; what: string };
type Step = { targets: string[]; title: string; text?: string; tools?: Tool[] };

const STEPS: Step[] = [
  { targets: [], title: 'Hear this home before you visit', text: 'A quick look at the controls, about 30 seconds. You can skip it any time, and the help button in the toolbar brings it back.' },
  { targets: ['.chat'], title: 'Ask or tell it what to change', text: 'Ask about the sound ("how echoey is the kitchen?") or tell it what to try ("close all the doors"). It asks before changing anything.' },
  {
    targets: ['[data-tour="blueprint"]', '[data-tour="noise"]', '[data-tour="room"]', '[data-tour="compass"]'],
    title: 'Change what you see',
    tools: [
      { icon: Layers, name: 'Blueprint', what: 'walls and sound paths' },
      { icon: MapIcon, name: 'Noise', what: 'street noise on this floor' },
      { icon: DoorOpen, name: 'Room', what: 'echo of this room' },
      { icon: Compass, name: 'Sound', what: 'where sound comes from' },
    ],
  },
  {
    targets: ['[data-tour="speaker"]', '[data-tour="probe"]'],
    title: 'Try things',
    tools: [
      { icon: Plus, name: 'Speaker', what: 'place music or voices' },
      { icon: Crosshair, name: 'Probe', what: 'read the level at a spot' },
    ],
  },
  {
    targets: ['[data-tour="settings"]', '[data-tour="sound"]'],
    title: 'Materials and sound',
    tools: [
      { icon: SlidersHorizontal, name: 'Settings', what: 'carpet, tile, furniture' },
      { icon: Volume2, name: 'Start sound', what: 'turn the audio on or off' },
    ],
  },
  { targets: ['.pin.opening'], title: 'Open and close doors and windows', text: 'Click a door or window on the tour to flip it and hear the difference at once.' },
  {
    targets: ['[data-tour="back"]', '[data-tour="help"]'],
    title: 'That is it',
    text: 'Every number you see is an estimate, not a measurement.',
    tools: [
      { icon: ArrowLeft, name: 'Back', what: 'return to the search' },
      { icon: CircleHelp, name: 'Help', what: 'play this tour again' },
    ],
  },
];

export const tutorial = signal<number | null>(null);
/** Skip was pressed: ask first, then close. */
const confirming = signal(false);

function seen(): boolean {
  try {
    return localStorage.getItem(KEY) === 'done';
  } catch {
    return false;
  }
}

function remember(): void {
  try {
    localStorage.setItem(KEY, 'done');
  } catch {
    /* private window: it just plays again next visit */
  }
}

export function startTutorial(): void {
  confirming.value = false;
  tutorial.value = 0;
}

function close(): void {
  remember();
  confirming.value = false;
  tutorial.value = null;
}

type Box = { x: number; y: number; w: number; h: number };
const PAD = 8;
const GAP = 30; // air between the lit control and the card
const CARD_W = 320;

/** Each selector's first usable element: it exists, has a size and is not faded out (a pin behind a wall, a hidden panel). */
function findBoxes(selectors: string[], root: HTMLElement): Box[] {
  const origin = root.getBoundingClientRect();
  const found: Box[] = [];
  for (const selector of selectors) {
    for (const el of document.querySelectorAll<HTMLElement>(selector)) {
      const r = el.getBoundingClientRect();
      if (r.width < 4 || r.height < 4 || +getComputedStyle(el).opacity < 0.3) continue;
      found.push({ x: r.left - origin.left, y: r.top - origin.top, w: r.width, h: r.height });
      break;
    }
  }
  return found;
}

/** Lit areas that touch are one lit area: two overlapping spotlights would each dim the other's control. */
function merge(boxes: Box[]): Box[] {
  const out: Box[] = [];
  for (const b of [...boxes].sort((p, q) => p.x - q.x)) {
    const last = out[out.length - 1];
    if (last && b.x - PAD * 2 <= last.x + last.w && b.y - PAD * 2 <= last.y + last.h && last.y - PAD * 2 <= b.y + b.h) out[out.length - 1] = union([last, b])!;
    else out.push(b);
  }
  return out;
}

function union(boxes: Box[]): Box | null {
  if (!boxes.length) return null;
  const x0 = Math.min(...boxes.map(b => b.x)), y0 = Math.min(...boxes.map(b => b.y));
  const x1 = Math.max(...boxes.map(b => b.x + b.w)), y1 = Math.max(...boxes.map(b => b.y + b.h));
  return { x: x0, y: y0, w: x1 - x0, h: y1 - y0 };
}

export function Tutorial() {
  const root = useRef<HTMLDivElement>(null);
  const [boxes, setBoxes] = useState<Box[]>([]);
  const box = union(boxes);
  const [area, setArea] = useState({ w: 0, h: 0 });
  const card = useRef<HTMLDivElement>(null);
  const [cardH, setCardH] = useState(200);
  const step = tutorial.value;

  // First visit: once the headphones screen is passed, start. Not again once it was finished or skipped.
  useEffect(() => {
    if (ui.started.value && tutorial.value === null && !seen()) {
      const t = setTimeout(() => {
        if (!seen() && tutorial.value === null) tutorial.value = 0;
      }, 700);
      return () => clearTimeout(t);
    }
  }, [ui.started.value]);

  useEffect(
    () =>
      onKeyDown(e => {
        if (tutorial.value === null) return;
        if (confirming.value) {
          if (e.key === 'Escape') confirming.value = false;
          else if (e.key === 'Enter') close();
          else return;
          return true;
        }
        if (e.key === 'Escape') confirming.value = true;
        else if (e.key === 'ArrowRight' || e.key === 'Enter') tutorial.value = tutorial.value + 1 >= STEPS.length ? (close(), null) : tutorial.value + 1;
        else if (e.key === 'ArrowLeft') tutorial.value = Math.max(0, tutorial.value - 1);
        else return;
        return true;
      }),
    [],
  );

  // Follow the target: panels can move, the window can resize, pins drift as you look around.
  useLayoutEffect(() => {
    if (step === null || !root.current) return;
    const el = root.current;
    const update = () => {
      setBoxes(findBoxes(STEPS[step].targets, el));
      setArea({ w: el.clientWidth, h: el.clientHeight });
      if (card.current) setCardH(card.current.offsetHeight);
    };
    update();
    const timer = setInterval(update, 250);
    window.addEventListener('resize', update);
    return () => {
      clearInterval(timer);
      window.removeEventListener('resize', update);
    };
  }, [step]);

  if (step === null) return <div ref={root} class="tut-root" />;
  const s = STEPS[step];
  const last = step === STEPS.length - 1;

  // The card sits under the target, or over it when there is no room below; centred when there is no target.
  let left = (area.w - CARD_W) / 2;
  let top = Math.max(24, area.h / 2 - 90);
  if (box) {
    left = Math.min(Math.max(12, box.x + box.w / 2 - CARD_W / 2), Math.max(12, area.w - CARD_W - 12));
    const below = box.y + box.h + PAD + GAP;
    top = below + cardH + 12 < area.h ? below : Math.max(12, box.y - PAD - GAP - cardH);
    top = Math.max(12, Math.min(top, area.h - cardH - 12)); // never off the screen
    top = Math.max(12, Math.min(top, area.h - cardH - 12)); // never off the screen, even when it must sit over the control
  }

  return (
    <div ref={root} class="tut-root">
      <div class="tut-block" onClick={e => e.stopPropagation()} />
      {boxes.length ? (
        <>
          {/* One dim layer with a hole per lit control. Separate spotlights would each dim the others' controls. */}
          <svg class="tut-dimsvg" width={area.w} height={area.h} aria-hidden="true">
            <defs>
              <mask id="tut-mask">
                <rect width={area.w} height={area.h} fill="white" />
                {merge(boxes).map((b, i) => (
                  <rect key={i} x={b.x - PAD} y={b.y - PAD} width={b.w + PAD * 2} height={b.h + PAD * 2} rx="14" fill="black" />
                ))}
              </mask>
            </defs>
            <rect width={area.w} height={area.h} fill="rgb(20 14 8 / 0.7)" mask="url(#tut-mask)" />
          </svg>
          {merge(boxes).map((b, i) => (
            <div key={i} class="tut-spot" style={{ left: `${b.x - PAD}px`, top: `${b.y - PAD}px`, width: `${b.w + PAD * 2}px`, height: `${b.h + PAD * 2}px` }} />
          ))}
        </>
      ) : (
        <div class="tut-dim" />
      )}
      <div ref={card} class="tut-card" role="dialog" aria-modal="true" aria-label="Tour of the controls" style={{ left: `${left}px`, top: `${top}px`, width: `${CARD_W}px` }}>
        {confirming.value ? (
          <>
            <h3>Skip the tour?</h3>
            <p class="tut-text">If you need it later, the help button at the right end of the toolbar plays it again.</p>
            <div class="tut-actions">
              <button type="button" class="btn quiet" onClick={() => (confirming.value = false)}>
                Keep going
              </button>
              <button type="button" class="btn primary" onClick={close}>
                Skip tour
              </button>
            </div>
          </>
        ) : (
          <>
        <p class="tut-count">
          Step {step + 1} of {STEPS.length}
        </p>
        <h3>{s.title}</h3>
        {s.text && <p class="tut-text">{s.text}</p>}
        {s.tools && (
          <ul class="tut-list">
            {s.tools.map(t => (
              <li key={t.name}>
                <span class="tut-ico">
                  <t.icon size={16} strokeWidth={2} />
                </span>
                <b>{t.name}</b>
                <span>{t.what}</span>
              </li>
            ))}
          </ul>
        )}
        <div class="tut-dots" aria-hidden="true">
          {STEPS.map((_, i) => (
            <i key={i} class={i === step ? 'on' : ''} />
          ))}
        </div>
        <div class="tut-actions">
          <button type="button" class="link" onClick={() => (confirming.value = true)}>
            Skip
          </button>
          <span class="tut-nav">
            {step > 0 && (
              <button type="button" class="btn quiet" onClick={() => (tutorial.value = step - 1)}>
                Back
              </button>
            )}
            <button type="button" class="btn primary" onClick={() => (last ? close() : (tutorial.value = step + 1))}>
              {last ? 'Done' : step === 0 ? 'Start' : 'Next'}
            </button>
          </span>
        </div>
          </>
        )}
      </div>
    </div>
  );
}
