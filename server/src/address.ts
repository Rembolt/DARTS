// Shared by the server (src/index.ts) and Vite's dev proxy (app/proxy-target.ts), so both always agree.
// Keep this file free of Node imports: the app's Vite config imports it.

/** By default the server only listens on loopback, so nobody else on the network can read /api/config. */
export const SERVER_HOST = '127.0.0.1';
export const DEFAULT_PORT = 8787;

/** HOST if set (a deployment sets 0.0.0.0 to accept outside traffic), otherwise loopback. */
export function parseHost(value: string | undefined): string {
  const host = value?.trim();
  return host ? host : SERVER_HOST;
}

/** PORT if it is a whole number from 1 to 65535, otherwise 8787. */
export function parsePort(value: string | undefined): number {
  const port = Number(value);
  return Number.isInteger(port) && port > 0 && port <= 65535 ? port : DEFAULT_PORT;
}
