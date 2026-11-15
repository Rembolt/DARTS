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
      {ui.walls.value.flatMap(line => {
        // Walls along one line pile up on screen when you look straight down it: badges within 36 px become one.
        const merged: { x: number; y: number; loss: number; n: number }[] = [];
        for (const w of line.items) {
          const s = project(w.position, size, 20);
          if (!s.visible || s.distance < 0.8) continue;
          const near = merged.find(m => Math.hypot(m.x - s.x, m.y - s.y) < 36);
          if (near) {
            near.loss += w.lossDb;
            near.n++;
          } else merged.push({ x: s.x, y: s.y, loss: w.lossDb, n: 1 });
        }
        const color = PATHS_STYLE.sourceColors[line.color % PATHS_STYLE.sourceColors.length];
        return merged.map((m, i) => (
          <span key={`${line.sourceId}-${i}`} class="badge" style={{ transform: `translate(${m.x}px, ${m.y}px) translate(-50%, -50%)`, borderColor: color }}>
            −{Math.round(m.loss)} dB{m.n > 1 ? ` · ${m.n} walls` : ''}
          </span>
        ));
      })}
    </div>
  );
}
