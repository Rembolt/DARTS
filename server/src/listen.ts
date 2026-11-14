import type { Server } from 'node:http';
import type express from 'express';

/** Start listening on `host`. Resolves once the port is open; rejects with the error (for example EADDRINUSE). */
export function listen(app: express.Express, port: number, host: string): Promise<Server> {
  return new Promise((resolve, reject) => {
    // Express 5 also passes listen errors to this callback, so check before reporting success.
    const server = app.listen(port, host, (err?: Error) => {
      if (err) reject(err);
      else resolve(server);
    });
  });
}
