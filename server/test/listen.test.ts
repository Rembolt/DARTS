import { it, expect } from 'vitest';
import express from 'express';
import { createServer, type Server } from 'node:http';
import type { AddressInfo } from 'node:net';
import { listen } from '../src/listen.js';
import { SERVER_HOST } from '../src/address.js';

it('resolves once the server is listening, on loopback only', async () => {
  const server = await listen(express(), 0, SERVER_HOST);
  const address = server.address() as AddressInfo;
  expect(address.port).toBeGreaterThan(0);
  expect(address.address).toBe('127.0.0.1');
  server.close();
});

it('rejects with EADDRINUSE when the port is taken', async () => {
  const blocker: Server = createServer();
  await new Promise<void>(r => blocker.listen(0, SERVER_HOST, r));
  const port = (blocker.address() as AddressInfo).port;
  await expect(listen(express(), port, SERVER_HOST)).rejects.toMatchObject({ code: 'EADDRINUSE' });
  blocker.close();
});
