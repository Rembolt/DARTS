// In the blueprint you can change what the house is made of: three pickers on top of the plan. The solid model
// recolours at once and the simulation follows (the same settings as the panel).
import { MaterialSelect } from './MaterialSelect';
import { SURFACES } from './materials';
import { ui } from './store';

export function SurfaceStrip() {
  if (!ui.blueprint.value.on) return null;
  return (
    <div class="strip card" role="group" aria-label="Surfaces">
      <span class="strip-title">Made of</span>
      {SURFACES.map(x => (
        <MaterialSelect key={x.id} surface={x.id} label={x.label} compact />
      ))}
    </div>
  );
}
