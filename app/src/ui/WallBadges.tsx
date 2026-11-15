// What each wall between you and a source costs, on the wall itself. Shown with the blueprint.
import { PATHS_STYLE } from '../blueprint/paths';
import { project, useCamera } from './project';
import { ui } from './store';

export function WallBadges() {
  const pose = ui.pose.value;
  const size = ui.stage.value;
  if (!ui.blueprint.value.on || !pose || !size.w) return null;
  useCamera(pose, size);
  return (
    <div class="badges" aria-hidden="true">
      {ui.walls.value.flatMap(line =>
        line.items.map((w, i) => {
          const s = project(w.position, size, 20);
          if (!s.visible || s.distance < 0.8) return null;
          const color = PATHS_STYLE.sourceColors[line.color % PATHS_STYLE.sourceColors.length];
          return (
            <span key={`${line.sourceId}-${i}`} class="badge" style={{ transform: `translate(${s.x}px, ${s.y}px) translate(-50%, -50%)`, borderColor: color }}>
              −{Math.round(w.lossDb)} dB
            </span>
          );
        }),
      )}
    </div>
  );
}
