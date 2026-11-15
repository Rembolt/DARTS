import { existsSync } from 'node:fs';
import { resolve } from 'node:path';
import { parseHost, parsePort } from './address.js';
import { createAgent } from './agent/index.js';
import { createCityMaps } from './city/index.js';
import { cityRouter } from './city/routes.js';
import { createApp } from './app.js';
import { serverEnv } from './env.js';
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
const env = serverEnv(resolve(repoRoot, '.env'), process.env);
const port = parsePort(process.env.PORT);
const host = parseHost(process.env.HOST);
// A deployment points CACHE_DIR at its persistent volume; locally the cache sits next to the server.
const cacheDir = env.CACHE_DIR?.trim() ? resolve(env.CACHE_DIR.trim()) : resolve(import.meta.dirname, '../cache');
const bundleDir = resolve(import.meta.dirname, '../bundle');
// Exists only after `npm run build`; in development the page comes from Vite instead.
const pageDir = resolve(repoRoot, 'app/dist');

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
  const cities = createCityMaps({ cacheDir, env });
  const app = createApp(env, {
    bundleDir,
    mesh,
    allowedIds,
    wideRouters: [jevRouter({ env })],
    routers: [
      cityRouter({ cities, search }),
      apiRouter({ search, quick, surroundings, agent, allowedIds }),
      v2Router({ pi, lookup: id => search.lookup(id), allowedIds, env, cacheDir }),
    ],
    health: () => ({ index: search.ready() }),
    pageDir,
  });
  await listen(app, port, host);
  console.log(existsSync(resolve(pageDir, 'index.html'))
    ? `Server on http://${host}:${port}, serving the built page from app/dist`
    : `API server on http://${host}:${port}. Open the app at http://localhost:5173`);
} catch (err) {
  if ((err as NodeJS.ErrnoException).code === 'EADDRINUSE') {
    console.error(`port ${port} is in use; set PORT to another one`);
    process.exit(1);
  }
  throw err;
}
