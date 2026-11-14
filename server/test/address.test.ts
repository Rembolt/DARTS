import { it, expect } from 'vitest';
import { parsePort } from '../src/address.js';

it('defaults to 8787', () => {
  expect(parsePort(undefined)).toBe(8787);
  expect(parsePort('')).toBe(8787);
});

it('follows a valid PORT', () => {
  expect(parsePort('9001')).toBe(9001);
});

it('ignores a PORT that is not a whole number in range', () => {
  for (const bad of ['abc', '-5', '0', '8787.5', '70000']) expect(parsePort(bad)).toBe(8787);
});
