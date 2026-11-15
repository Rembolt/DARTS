// How the blueprint draws the house: solid walls with their edges, or edges only (see-through).

export type BlueprintMode = 'solid' | 'xray';

/** The mode switch's state. The button names the mode it switches to. */
export function createModeSwitch(initial: BlueprintMode): {
  mode(): BlueprintMode;
  next(): BlueprintMode;
  label(): 'Solid' | 'X-ray';
  title(): string;
} {
  let mode = initial;
  return {
    mode: () => mode,
    next() {
      mode = mode === 'solid' ? 'xray' : 'solid';
      return mode;
    },
    label: () => (mode === 'solid' ? 'X-ray' : 'Solid'),
    title: () => (mode === 'solid' ? 'See through the walls' : 'Show solid walls'),
  };
}

/** Ceilings hide the rooms when the camera is outside the house, as the tour itself does in dollhouse and floor plan. */
export function ceilingsVisible(poseMode: string): boolean {
  return poseMode !== 'mode.dollhouse' && poseMode !== 'mode.floorplan';
}
