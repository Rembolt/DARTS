// Floor plan of this storey, coloured by how much street noise reaches each spot (direct sound through the walls).
// North up; you are the white dot with your view as a wedge; sources and probes sit where they are.
import { useEffect, useRef } from 'preact/hooks';
import { PATHS_STYLE } from '../blueprint/paths';
import { heatColor } from './heat';
import { Panel } from './Panel';
import { ui } from './store';

const SIZE = 196;

export function Minimap() {
  const heat = ui.heat.value;
  const pose = ui.pose.value;
  const canvas = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const c = canvas.current;
    if (!c || !heat) return;
    const { grid, db } = heat;
    const small = document.createElement('canvas');
    small.width = grid.w;
    small.height = grid.h;
    const g = small.getContext('2d')!;
    const img = g.createImageData(grid.w, grid.h);
    grid.cells.forEach((cell, i) => {
      const [r, gr, b] = heatColor(db[i]);
      img.data.set([r, gr, b, 255], cell * 4);
    });
    g.putImageData(img, 0, 0);
    const ctx = c.getContext('2d')!;
    const ratio = Math.min(2, devicePixelRatio || 1);
    c.width = SIZE * ratio;
    c.height = SIZE * ratio;
    ctx.clearRect(0, 0, c.width, c.height);
    // Soft heat, then a crisp outline where floor meets no floor: it reads as a plan, not as pixels.
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high';
    ctx.filter = `blur(${1.2 * ratio}px)`;
    ctx.drawImage(small, 0, 0, c.width, c.height);
    ctx.filter = 'none';
    // Close the scan's pinholes (dilate, then erode) so the outline follows rooms, not specks.
    const raw = new Uint8Array(grid.w * grid.h);
    grid.cells.forEach(cell => (raw[cell] = 1));
    const pass = (src: Uint8Array, keep: (n: number) => boolean) => {
      const out = new Uint8Array(src.length);
      for (let r = 0; r < grid.h; r++)
        for (let col = 0; col < grid.w; col++) {
          let n = 0;
          for (let dr = -1; dr <= 1; dr++)
            for (let dc = -1; dc <= 1; dc++) {
              const rr = r + dr, cc = col + dc;
              if (rr >= 0 && cc >= 0 && rr < grid.h && cc < grid.w) n += src[rr * grid.w + cc];
            }
          out[r * grid.w + col] = keep(n) ? 1 : 0;
        }
      return out;
    };
    const mask = pass(pass(raw, n => n > 0), n => n === 9);
    const cw = c.width / grid.w, ch = c.height / grid.h;
    ctx.strokeStyle = 'rgba(238, 243, 255, 0.55)';
    ctx.lineWidth = ratio;
    ctx.beginPath();
    for (let r = 0; r < grid.h; r++)
      for (let col = 0; col < grid.w; col++) {
        const here = mask[r * grid.w + col];
        const right = col + 1 < grid.w ? mask[r * grid.w + col + 1] : 0;
        const down = r + 1 < grid.h ? mask[(r + 1) * grid.w + col] : 0;
        if (here !== right) {
          ctx.moveTo((col + 1) * cw, r * ch);
          ctx.lineTo((col + 1) * cw, (r + 1) * ch);
        }
        if (here !== down) {
          ctx.moveTo(col * cw, (r + 1) * ch);
          ctx.lineTo((col + 1) * cw, (r + 1) * ch);
        }
      }
    ctx.stroke();
  }, [heat]);

  if (!heat) return null;
  const { grid } = heat;
  const px = SIZE / grid.w;
  const toMap = (x: number, z: number) => [((x - grid.x0) / grid.step) * px, ((z - grid.z0) / grid.step) * px] as const;
  const clamp = (v: number) => Math.max(6, Math.min(SIZE - 6, v));

  let you = null;
  if (pose) {
    const [x, y] = toMap(pose.position.x, pose.position.z);
    const yaw = (pose.rotation.y * Math.PI) / 180;
    const fx = -Math.sin(yaw), fy = -Math.cos(yaw);
    const spread = 0.5, len = 26;
    const a = [x + len * (fx * Math.cos(spread) - fy * Math.sin(spread)), y + len * (fy * Math.cos(spread) + fx * Math.sin(spread))];
    const b = [x + len * (fx * Math.cos(-spread) - fy * Math.sin(-spread)), y + len * (fy * Math.cos(-spread) + fx * Math.sin(-spread))];
    you = (
      <g>
        <path d={`M${x},${y} L${a[0]},${a[1]} L${b[0]},${b[1]} Z`} class="m-view" />
        <circle cx={x} cy={y} r={4.5} class="m-you" />
      </g>
    );
  }

  return (
    <Panel id="minimap" title="Street noise, this floor" className="p-minimap">
      <div class="m-stage" style={{ width: `${SIZE}px`, height: `${SIZE}px` }}>
        <canvas ref={canvas} style={{ width: `${SIZE}px`, height: `${SIZE}px` }} />
        <svg width={SIZE} height={SIZE}>
          {ui.speakers.value.slice(0, 2).map((s, i) => {
            const [x, y] = toMap(s.position[0], s.position[2]);
            const off = x < 0 || y < 0 || x > SIZE || y > SIZE;
            return <circle key={s.id} cx={clamp(x)} cy={clamp(y)} r={off ? 3.5 : 5} class={`m-src ${off ? 'off' : ''}`} style={{ fill: PATHS_STYLE.sourceColors[i] }} />;
          })}
          {ui.probes.value.map(p => {
            const [x, y] = toMap(p.position[0], p.position[2]);
            return <rect key={p.id} x={x - 3.5} y={y - 3.5} width={7} height={7} transform={`rotate(45 ${x} ${y})`} class="m-probe" />;
          })}
          {you}
        </svg>
      </div>
      <div class="legend">
        <span>Quiet</span>
        <i />
        <span>Loud</span>
      </div>
    </Panel>
  );
}
