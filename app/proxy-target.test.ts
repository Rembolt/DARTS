import { it, expect } from 'vitest';
import { proxyTarget } from './proxy-target';

it('defaults to port 8787 on loopback', () => {
  expect(proxyTarget({})).toBe('http://127.0.0.1:8787');
});

it('follows PORT', () => {
  expect(proxyTarget({ PORT: '9001' })).toBe('http://127.0.0.1:9001');
});

it('ignores a PORT the server would also ignore', () => {
  expect(proxyTarget({ PORT: 'abc' })).toBe('http://127.0.0.1:8787');
  expect(proxyTarget({ PORT: '-5' })).toBe('http://127.0.0.1:8787');
  expect(proxyTarget({ PORT: '8787.5' })).toBe('http://127.0.0.1:8787');
});
