import { it, expect } from 'vitest';
import express from 'express';
import { createServer, type Server } from 'node:http';
import type { AddressInfo } from 'node:net';
import { listen } from '../src/listen.js';

it('resolves once the server is listening', async () => {
  const server = await listen(express(), 0);
  expect((server.address() as AddressInfo).port).toBeGreaterThan(0);
  server.close();
});

it('rejects with EADDRINUSE when the port is taken', async () => {
  const blocker: Server = createServer();
  await new Promise<void>(r => blocker.listen(0, r));
  const port = (blocker.address() as AddressInfo).port;
  await expect(listen(express(), port)).rejects.toMatchObject({ code: 'EADDRINUSE' });
  blocker.close();
});
