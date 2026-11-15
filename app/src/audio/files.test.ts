import { describe, it, expect } from 'vitest';
import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { SOUNDS, type SoundId } from '../config';
import { LOOP_SOUND, surroundingSources } from './surroundings';
import type { AreaSummary } from '../../../server/src/shared/contract';

// The tour fetches every sound from /audio/<file>, which Vite serves from app/public/audio and copies into the build.
const DIR = resolve(__dirname, '../../public/audio');
const urlToPath = (url: string) => resolve(DIR, url.replace(/^\/audio\//, ''));
const isOgg = (path: string) => readFileSync(path).subarray(0, 4).toString('latin1') === 'OggS';

// The footsteps load footstep_<floor>_1..4.ogg (audio/footsteps.ts); their SOUNDS entries only carry the level.
const NUMBERED: SoundId[] = ['footstep_hard', 'footstep_soft'];

describe('sound files the tour loads', () => {
  it('every sound in SOUNDS has a real Ogg file in app/public/audio', () => {
    const missing = (Object.entries(SOUNDS) as [SoundId, { file: string }][])
      .filter(([id]) => !NUMBERED.includes(id))
      .filter(([, s]) => !existsSync(urlToPath(s.file)) || !isOgg(urlToPath(s.file)))
      .map(([id]) => id);
    expect(missing).toEqual([]);
  });

  it('every sound the surroundings can place is one of them', () => {
    const area = (areaClass: AreaSummary['areaClass']): AreaSummary => ({
      areaClass, source: 'vexcel', counts: {}, roadBearingDeg: 90, facadeDb: 60, imageryDate: null,
      located: [
        { kind: 'highway', distanceM: 100, bearingDeg: 0, levelDb: 70 },
        { kind: 'railway', distanceM: 100, bearingDeg: 0, levelDb: 60 },
        { kind: 'airport', distanceM: 100, bearingDeg: 0, levelDb: 60 },
      ],
    });
    const used = new Set<SoundId>();
    for (const cls of Object.keys(LOOP_SOUND) as AreaSummary['areaClass'][]) {
      for (const s of surroundingSources(area(cls), [0, 0, 0])) used.add(s.sound);
    }
    expect([...used].sort()).toEqual(
      ['city_ambience', 'commercial_ambience', 'highway', 'industrial_ambience', 'nature_ambience', 'plane', 'residential_ambience', 'train'],
    );
    for (const id of used) expect(existsSync(urlToPath(SOUNDS[id].file)), id).toBe(true);
  });

  it('the footsteps have all eight files', () => {
    for (const kind of ['hard', 'soft']) {
      for (let i = 1; i <= 4; i++) expect(existsSync(resolve(DIR, `footstep_${kind}_${i}.ogg`)), `${kind} ${i}`).toBe(true);
    }
  });
});
