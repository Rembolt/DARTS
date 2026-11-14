import { resolve } from 'node:path';
import { createApp } from './app.js';
import { loadEnv } from './env.js';

const env = loadEnv(resolve(import.meta.dirname, '../../.env'));
const port = Number(process.env.PORT) || 8787;

const server = createApp(env).listen(port, () => {
  console.log(`server on http://localhost:${port}`);
});

server.on('error', (err: NodeJS.ErrnoException) => {
  if (err.code === 'EADDRINUSE') {
    console.error(`port ${port} is in use; set PORT to another one`);
    process.exit(1);
  }
  throw err;
});
