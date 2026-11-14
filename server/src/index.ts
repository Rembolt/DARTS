import { resolve } from 'node:path';
import { createApp } from './app.js';
import { loadEnv } from './env.js';
import { listen } from './listen.js';

const env = loadEnv(resolve(import.meta.dirname, '../../.env'));
const port = Number(process.env.PORT) || 8787;

try {
  await listen(createApp(env, { bundleDir: resolve(import.meta.dirname, '../bundle') }), port);
  console.log(`server on http://localhost:${port}`);
} catch (err) {
  if ((err as NodeJS.ErrnoException).code === 'EADDRINUSE') {
    console.error(`port ${port} is in use; set PORT to another one`);
    process.exit(1);
  }
  throw err;
}
