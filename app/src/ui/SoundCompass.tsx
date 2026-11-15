// "Where the sound comes from": a dial at the listener that turns with the view. Each source is a dot at its true
// bearing, sized by how much of it gets through; its echoes are a soft shape leaning toward the walls that send them
// back. Built from the same trace the audio uses, so what you see is what you hear.
import { SLOT_DIRECTIONS } from '../config';
import { PATHS_STYLE } from '../blueprint/paths';
import { bandMean, echoRose, rosePath, toDb, viewBearing, worldBearing } from './compass';
import { ui } from './store';

const SIZE = 168;
const C = SIZE / 2;
const OUTER = 66;
const ROSE_MIN = 14;
const ROSE_MAX = 52;

export function SoundCompass() {
  const sound = ui.sound.value;
  const pose = ui.pose.value;
  if (!sound || !pose) return null;
  const yaw = pose.rotation.y;
  const labels = new Map(ui.speakers.value.map(s => [s.id, s.label]));

  return (
    <figure class="compass card" aria-label="Where the sound comes from">
      <svg width={SIZE} height={SIZE} viewBox={`0 0 ${SIZE} ${SIZE}`} role="img">
        <circle cx={C} cy={C} r={OUTER} class="c-ring" />
        <circle cx={C} cy={C} r={OUTER * 0.55} class="c-ring faint" />
        {/* The view: a wedge pointing up, fixed, because the dial turns instead of the listener. */}
        <path d={`M${C},${C} L${C - 30},${C - 58} A66,66 0 0 1 ${C + 30},${C - 58} Z`} class="c-view" />
        <g transform={`rotate(${yaw} ${C} ${C})`}>
          {sound.sources.map((src, i) => {
            const r = echoRose(src.slots, SLOT_DIRECTIONS).map(v => ROSE_MIN + v * (ROSE_MAX - ROSE_MIN));
            return <path key={src.id} d={rosePath(r, C, C)} class="c-rose" style={{ fill: color(i), stroke: color(i) }} />;
          })}
          <text x={C} y={C - OUTER - 4} class="c-north" text-anchor="middle">
            N
          </text>
        </g>
        {sound.sources.map((src, i) => {
          const p = sound.positions[i];
          if (!p) return null;
          const b = viewBearing(worldBearing(p[0] - sound.listener[0], p[2] - sound.listener[2]), yaw);
          const db = toDb(bandMean(src.direct));
          const radius = 4 + 5 * (1 + db / 60);
          const x = C + Math.sin(b) * OUTER;
          const y = C - Math.cos(b) * OUTER;
          return (
            <g key={src.id}>
              <line x1={C} y1={C} x2={x} y2={y} class="c-ray" style={{ stroke: color(i) }} />
              <circle cx={x} cy={y} r={radius + 4} class="c-halo" style={{ fill: color(i) }} />
              <circle cx={x} cy={y} r={radius} style={{ fill: color(i) }} />
            </g>
          );
        })}
        <circle cx={C} cy={C} r={3.5} class="c-you" />
      </svg>
      <figcaption>
        <div class="c-stat">
          <span>Echo</span>
          <b>{sound.echoTime[1].toFixed(1)} s</b>
        </div>
        {sound.sources.map((src, i) => (
          <div class="c-src" key={src.id}>
            <i style={{ background: color(i) }} />
            <span>{labels.get(src.id) ?? src.id}</span>
            <em>
              {Math.round(toDb(bandMean(src.direct)))} dB{src.walls > 0 ? ` · ${src.walls} wall${src.walls > 1 ? 's' : ''}` : ''}
            </em>
          </div>
        ))}
      </figcaption>
    </figure>
  );
}

const color = (i: number) => PATHS_STYLE.sourceColors[i % PATHS_STYLE.sourceColors.length];
