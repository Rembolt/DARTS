import { resolve } from 'node:path';
import { SERVER_HOST, parsePort } from './address.js';
import { createApp } from './app.js';
import { loadEnv } from './env.js';
import { listen } from './listen.js';

const env = loadEnv(resolve(import.meta.dirname, '../../.env'));
const port = parsePort(process.env.PORT);

try {
  await listen(createApp(env, { bundleDir: resolve(import.meta.dirname, '../bundle') }), port, SERVER_HOST);
  console.log(`server on http://${SERVER_HOST}:${port}`);
} catch (err) {
  if ((err as NodeJS.ErrnoException).code === 'EADDRINUSE') {
    console.error(`port ${port} is in use; set PORT to another one`);
    process.exit(1);
  }
  throw err;
}
