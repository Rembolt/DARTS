import { it, expect } from 'vitest';
import { proxyTarget } from './proxy-target';

it('defaults to port 8787', () => {
  expect(proxyTarget({})).toBe('http://localhost:8787');
});

it('follows PORT', () => {
  expect(proxyTarget({ PORT: '9001' })).toBe('http://localhost:9001');
});

it('ignores a PORT that is not a number', () => {
  expect(proxyTarget({ PORT: 'abc' })).toBe('http://localhost:8787');
});
