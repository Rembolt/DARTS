// The Blueprint button's state (mvp-design.md 7: "A 'Blueprint' button outside the viewer toggles a canvas").

export type ToggleView = { enabled: boolean; pressed: boolean; label: 'Blueprint' | 'Tour'; title: string };

export type Toggle = {
  view(): ToggleView;
  /** The mesh is loaded: the button works. */
  ready(): void;
  /** The mesh failed: the button stays disabled and says why. */
  failed(message: string): void;
  /** Flip between the tour and the blueprint. Does nothing until `ready()`. */
  toggle(): ToggleView;
  /** True for the B key, unless the user is typing in a field. */
  isShortcut(key: string, target: { tagName?: string; isContentEditable?: boolean } | null): boolean;
};

const TYPING = new Set(['INPUT', 'TEXTAREA', 'SELECT']);

export function createToggle(): Toggle {
  let state: 'loading' | 'ready' | 'failed' = 'loading';
  let reason = '';
  let pressed = false;

  const view = (): ToggleView => {
    if (state === 'loading') return { enabled: false, pressed: false, label: 'Blueprint', title: 'Loading the mesh…' };
    if (state === 'failed') {
      return { enabled: false, pressed: false, label: 'Blueprint', title: `Blueprint needs the mesh: ${reason}` };
    }
    return pressed
      ? { enabled: true, pressed: true, label: 'Tour', title: 'Back to the tour (B)' }
      : { enabled: true, pressed: false, label: 'Blueprint', title: 'Show the blueprint (B)' };
  };

  return {
    view,
    ready() {
      state = 'ready';
    },
    failed(message) {
      state = 'failed';
      reason = message;
      pressed = false;
    },
    toggle() {
      if (state === 'ready') pressed = !pressed;
      return view();
    },
    isShortcut(key, target) {
      if (key.toLowerCase() !== 'b') return false;
      if (!target) return true;
      return !(target.isContentEditable || TYPING.has(target.tagName ?? ''));
    },
  };
}

/**
 * Listen for the B shortcut on a target (the page's document, and the tour's own window: a click into the tour moves
 * keyboard focus there, and its key events never reach the page). Returns the function that binds one target.
 */
export function bindShortcut(toggle: Toggle, flip: () => void): (target: EventTarget) => void {
  const onKey = (event: Event) => {
    const e = event as KeyboardEvent;
    if (e.repeat || e.ctrlKey || e.metaKey || e.altKey) return;
    const target = e.target as { tagName?: string; isContentEditable?: boolean } | null;
    if (toggle.isShortcut(e.key, target && typeof target === 'object' && 'tagName' in target ? target : null)) flip();
  };
  return target => target.addEventListener('keydown', onKey);
}
