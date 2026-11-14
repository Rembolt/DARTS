import { SERVER_HOST, parsePort } from '../server/src/address';

/** Where Vite's dev proxy sends /api and /bundle: our server, using the server's own host and port rule. */
export function proxyTarget(env: Record<string, string | undefined>): string {
  return `http://${SERVER_HOST}:${parsePort(env.PORT)}`;
}
