import { describe, expect, it } from 'vitest';
import { interpret } from './assistant';
import type { Opening } from './store';

const mk = (id: string, type: Opening['type'], room: string, open: boolean): Opening => ({ id, type, room, label: id, position: [0, 0, 0], open });
const openings = [mk('w1', 'window', 'Kitchen', true), mk('w2', 'window', 'Study', true), mk('d1', 'door', 'Kitchen', false)];

describe('interpret', () => {
  it('closes all windows', () => {
    const r = interpret('close all the windows', openings);
    expect(r).toMatchObject({ kind: 'openings', open: false, ids: ['w1', 'w2'] });
  });
  it('narrows to a room by name', () => {
    const r = interpret('Close the kitchen window', openings);
    expect(r).toMatchObject({ kind: 'openings', open: false, ids: ['w1'] });
  });
  it('says so when nothing needs to change', () => {
    expect(interpret('close the door', openings).kind).toBe('none');
  });
  it('starts placement for an add-speaker request', () => {
    expect(interpret('add a speaker', openings).kind).toBe('place');
  });
  it('is honest about what it cannot do', () => {
    expect(interpret('why is it echoey', openings).reply).toMatch(/not connected/);
  });
});
