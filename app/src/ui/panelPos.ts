// Where the floating panels are, and whether they are open. Remembered between visits.
export type PanelState = { x?: number; y?: number; collapsed?: boolean };
export type Box = { w: number; h: number };

const KEY = 'acoustic:panels';

/** Keep at least `grab` pixels of a panel on screen, so it can always be found and dragged back. */
export function clampPosition(x: number, y: number, panel: Box, stage: Box, grab = 56): { x: number; y: number } {
  const minX = grab - panel.w;
  const maxX = stage.w - grab;
  const minY = 0;
  const maxY = stage.h - 36;
  return { x: Math.min(maxX, Math.max(minX, x)), y: Math.min(maxY, Math.max(minY, y)) };
}

export function loadPanels(): Record<string, PanelState> {
  try {
    const raw = JSON.parse(localStorage.getItem(KEY) ?? '{}');
    return raw && typeof raw === 'object' ? raw : {};
  } catch {
    return {};
  }
}

export function savePanels(state: Record<string, PanelState>): void {
  try {
    localStorage.setItem(KEY, JSON.stringify(state));
  } catch {
    /* private window: positions just are not remembered */
  }
}
