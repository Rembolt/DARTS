// Guards the MVP numbers: with no setMaterials, setRooms, setLayers or openings, a trace and a reverb job give
// exactly what they gave before V2 (the snapshot was written by the MVP code, before V2 Lane H changed anything).
import { it, expect } from 'vitest';
import { reverbJob } from './reverb-job';
import { boxRoom, splitRoom } from './testMeshes';
import { trace } from './trace';

const round = (v: number) => Number(v.toPrecision(6));

it('traces the same as before with no setMaterials', () => {
  const state = splitRoom();
  const r = trace(state, {
    type: 'trace',
    id: 1,
    listener: [1, 1.5, 1.5],
    sources: [
      { id: 'near', position: [1.5, 1.2, 2] },
      { id: 'behind', position: [3, 1.2, 1.5] },
    ],
  });
  expect({
    echoTimeEstimate: r.echoTimeEstimate.map(round),
    sources: r.sources.map(s => ({
      id: s.id,
      distance: round(s.distance),
      direct: s.direct.map(round),
      walls: s.walls,
      slots: s.slots.map(x => ({ energy: x.energy.map(round), delay: round(x.delay) })),
      lateEnergy: s.lateEnergy.map(round),
    })),
    segments: r.pathSource.length,
  }).toMatchSnapshot();

  const reverb = reverbJob(boxRoom(), { type: 'reverb', roomId: 'r', listener: [2, 1.5, 1.5] });
  expect(reverb.echoTime.map(round)).toMatchSnapshot();
});
