import { it, expect } from 'vitest';
import { formatSimReady } from './client';

it('formats the ready summary for the header', () => {
  expect(formatSimReady({ triangles: 116539, lines: new Float32Array(23456 * 6), loadMs: 412.4 }))
    .toBe('Mesh: 116,539 triangles · 23,456 lines · loaded in 412 ms');
});
