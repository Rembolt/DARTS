import { resolve } from 'node:path';
import { SERVER_HOST, parsePort } from './address.js';
import { createApp } from './app.js';
import { loadEnv } from './env.js';
import { listen } from './listen.js';
import { createMeshSource } from './mesh.js';

const env = loadEnv(resolve(import.meta.dirname, '../../.env'));
const port = parsePort(process.env.PORT);

try {
  const mesh = createMeshSource({ cacheDir: resolve(import.meta.dirname, '../cache'), env });
  await listen(createApp(env, { bundleDir: resolve(import.meta.dirname, '../bundle'), mesh }), port, SERVER_HOST);
  console.log(`API server on http://${SERVER_HOST}:${port}. Open the app at http://localhost:5173`);
} catch (err) {
  if ((err as NodeJS.ErrnoException).code === 'EADDRINUSE') {
    console.error(`port ${port} is in use; set PORT to another one`);
    process.exit(1);
  }
  throw err;
}
