// The room, read like a listing fact: how much street noise gets in, which part of it (low, mid, high), and how the
// room's echo dies away. All estimates from the trace.
import { bandMean, toDb } from './compass';
import { heardDb, outdoorTrim, quietRating } from './scenario';
import { Panel } from './Panel';
import { alternative, heardOpenings, ui } from './store';

const W = 198;
const H = 78;

function Decay({ echoTime, slots }: { echoTime: [number, number, number]; slots: { energy: [number, number, number]; delay: number }[] }) {
  const tMax = Math.max(0.6, Math.min(2.5, Math.max(...echoTime) * 1.15));
  const x = (t: number) => (t / tMax) * W;
  const y = (db: number) => (Math.min(0, Math.max(-60, db)) / -60) * H;
  const names = ['low', 'mid', 'high'] as const;
  return (
    <svg viewBox={`0 0 ${W} ${H + 14}`} class="decay" role="img" aria-label={`Echo dies away in ${echoTime[1].toFixed(1)} seconds`}>
      <line x1={0} y1={H} x2={W} y2={H} class="d-axis" />
      {slots.map((s, i) => {
        const db = toDb(bandMean(s.energy)) + 6;
        return s.delay > 0 && db > -60 ? <line key={i} x1={x(s.delay)} x2={x(s.delay)} y1={H} y2={y(db)} class="d-stem" /> : null;
      })}
      {echoTime.map((rt, k) => (
        <line key={k} x1={0} y1={y(0)} x2={x(Math.min(rt, tMax))} y2={y((-60 * Math.min(rt, tMax)) / rt)} class={`d-line ${names[k]}`} />
      ))}
      <text x={0} y={H + 12} class="d-tick">0</text>
      <text x={W} y={H + 12} class="d-tick" text-anchor="end">
        {tMax.toFixed(1)} s
      </text>
    </svg>
  );
}

export function RoomCard() {
  const sound = ui.sound.value;
  const outdoor = sound?.sources.find(s => s.id === 'outdoor');
  const indoor = sound?.sources.find(s => s.id === 'indoor');
  if (!sound || !outdoor) return null;
  const trim = outdoorTrim(heardOpenings(), ui.timeOfDay.value);
  const street = Math.round(heardDb(bandMean(outdoor.direct), trim.db));
  const rating = quietRating(street);
  const bands = [
    { name: 'Low', db: toDb(outdoor.direct[0]) + trim.db },
    { name: 'Mid', db: toDb(outdoor.direct[1]) + trim.db },
    { name: 'High', db: toDb(outdoor.direct[2]) + trim.db + trim.highDb },
  ];
  const alt = alternative();

  return (
    <Panel id="room" title={ui.room.value?.label ?? 'This room'} className="p-room" below="minimap" extra={<span class={`rating ${rating.tone}`}>{rating.label}</span>}>
      <div class="big">
        <b>{street}</b>
        <span>
          dB street noise
          <br />
          vs. outside, estimate
        </span>
      </div>
      <div class="bands" aria-label="Street noise by band">
        {bands.map(b => (
          <div class="band" key={b.name}>
            <span>{b.name}</span>
            <i>
              <em style={{ width: `${Math.max(2, (1 + Math.max(-60, b.db) / 60) * 100)}%` }} />
            </i>
            <output>{Math.round(b.db)}</output>
          </div>
        ))}
      </div>
      <div class="echo">
        <div class="echo-head">
          <span>Echo</span>
          <b>{sound.echoTime[1].toFixed(1)} s</b>
        </div>
        <Decay echoTime={sound.echoTime} slots={indoor?.slots ?? outdoor.slots} />
      </div>
      <footer>
        <button
          type="button"
          class={`compare ${ui.comparing.value ? 'held' : ''}`}
          onPointerDown={() => (ui.comparing.value = true)}
          onPointerUp={() => (ui.comparing.value = false)}
          onPointerLeave={() => (ui.comparing.value = false)}
        >
          <kbd>A</kbd> <span>Hold to hear: {alt.label.toLowerCase()}</span>
        </button>
        {ui.openingsAreDemo.value && <p class="fine">Doors and windows are placed for the demo.</p>}
      </footer>
    </Panel>
  );
}
