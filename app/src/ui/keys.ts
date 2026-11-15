// One place for keyboard shortcuts. After you click the tour, key presses go to the tour's own window (it is an
// iframe), not to the page, so every shortcut listens on both. `attach(win)` adds a window; handlers see every key.
// The tour's canvas stops key events from bubbling, so listeners sit in the capture phase, where they always arrive.
/** A handler returns true when it used the key: the tour then does not also see it. */
type Handler = (e: KeyboardEvent) => boolean | void;

const down = new Set<Handler>();
const up = new Set<Handler>();
const blur = new Set<() => void>();
// By document, not window: a window keeps its identity when the tour loads a new page into it, but loses its listeners.
const attached = new WeakSet<Document>();

const run = (set: Set<Handler>, e: KeyboardEvent) => {
  let used = false;
  set.forEach(h => {
    if (h(e) === true) used = true;
  });
  if (used) e.stopPropagation();
};
const onDown = (e: KeyboardEvent) => run(down, e);
const onUp = (e: KeyboardEvent) => run(up, e);
const onBlur = () => blur.forEach(h => h());

export function attach(win: Window | null | undefined): void {
  let doc: Document | null = null;
  try {
    doc = win?.document ?? null;
  } catch {
    return; // another origin: nothing to listen to
  }
  if (!win || !doc || attached.has(doc)) return;
  attached.add(doc);
  win.addEventListener('keydown', onDown, true);
  win.addEventListener('keyup', onUp, true);
  win.addEventListener('blur', onBlur);
}

export function onKeyDown(h: Handler): () => void {
  down.add(h);
  return () => down.delete(h);
}
export function onKeyUp(h: Handler): () => void {
  up.add(h);
  return () => up.delete(h);
}
export function onWindowBlur(h: () => void): () => void {
  blur.add(h);
  return () => blur.delete(h);
}

/** Typing in a field: shortcuts stay out of the way. Works for events from the tour's window too. */
export function isTyping(e: KeyboardEvent): boolean {
  const el = e.target as { tagName?: string; isContentEditable?: boolean } | null;
  return !!el && (/^(INPUT|TEXTAREA|SELECT)$/.test(el.tagName ?? '') || !!el.isContentEditable);
}

/** A plain key press: no modifiers, not a repeat, not while typing. */
export function plain(e: KeyboardEvent, key: string): boolean {
  return e.key.toLowerCase() === key && !e.repeat && !isTyping(e) && !e.ctrlKey && !e.metaKey && !e.altKey;
}

if (typeof window !== "undefined") attach(window);
