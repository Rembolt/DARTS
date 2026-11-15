import { existsSync } from 'node:fs';
import { resolve } from 'node:path';
import { SERVER_HOST, parsePort } from './address.js';
import { createAgent } from './agent/index.js';
import { createApp } from './app.js';
import { loadEnv } from './env.js';
import { loadAllowedIds } from './ids.js';
import { listen } from './listen.js';
import { createMeshSource } from './mesh.js';
import { createQuick } from './quick/index.js';
import { createPiSource } from './quick/pi.js';
import { apiRouter } from './routes.js';
import { createSearch } from './search/index.js';
import { DEMO_MODEL_ID } from './shared/contract.js';
import { createSurroundings } from './surroundings/index.js';
import { jevRouter, v2Router } from './v2/routes.js';

const repoRoot = resolve(import.meta.dirname, '../..');
const env = loadEnv(resolve(repoRoot, '.env'));
const port = parsePort(process.env.PORT);
const cacheDir = resolve(import.meta.dirname, '../cache');
const bundleDir = resolve(import.meta.dirname, '../bundle');

function allowedIdsFromCatalogue(): Set<string> {
  const lists = ['costar-kit/residential-listings.csv', 'costar-kit/commercial-properties.csv'].map(p => resolve(repoRoot, p));
  try {
    return loadAllowedIds(lists);
  } catch (err) {
    console.warn(`Could not read the CoStar lists (${(err as Error).message}); serving only the demo house.`);
    return new Set([DEMO_MODEL_ID]);
  }
}

try {
  const allowedIds = allowedIdsFromCatalogue();
  const mesh = createMeshSource({ cacheDir, env });
  const search = createSearch({ cacheDir });
  const pi = createPiSource({ cacheDir, env });
  const surroundings = createSurroundings({ cacheDir, env });
  const quick = createQuick({
    cacheDir,
    env,
    lookup: id => search.lookup(id),
    surroundings,
    bundleReady: () => existsSync(resolve(bundleDir, 'showcase.html')),
    pi,
  });
  const agent = createAgent({ env, search, quick });
  const app = createApp(env, {
    bundleDir,
    mesh,
    allowedIds,
    wideRouters: [jevRouter({ env })],
    routers: [
      apiRouter({ search, quick, surroundings, agent, allowedIds }),
      v2Router({ pi, lookup: id => search.lookup(id), allowedIds, env, cacheDir }),
    ],
    health: () => ({ index: search.ready() }),
  });
  await listen(app, port, SERVER_HOST);
  console.log(`API server on http://${SERVER_HOST}:${port}. Open the app at http://localhost:5173`);
} catch (err) {
  if ((err as NodeJS.ErrnoException).code === 'EADDRINUSE') {
    console.error(`port ${port} is in use; set PORT to another one`);
    process.exit(1);
  }
  throw err;
}
