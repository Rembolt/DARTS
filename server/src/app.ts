import { existsSync } from 'node:fs';
import { join } from 'node:path';
import express from 'express';
import { sendNotPossible } from './errors.js';
import { parseLimit, rateLimit, sitePassword } from './guard.js';
import { isModelId } from './ids.js';
import { MeshError, type MeshSource } from './mesh.js';
import { DEMO_MODEL_ID, notPossible, type Health } from './shared/contract.js';

/** Sent with HTTP 503 for any /bundle request while the Bundle is not fetched. The app shows it as is. */
export const BUNDLE_MISSING = 'Matterport Bundle missing. Run: npm run fetch-bundle';

/** What the server's root answers when it has no built page to serve (local development: the page is on Vite). */
export const API_ONLY = 'This is the API server. In development, open the app at http://localhost:5173';

/** The routes that call paid services (Claude, Vexcel). Each gets its own per-IP limit when RATE_LIMIT_PER_MIN is set. */
export const LIMITED_PATHS = ['/api/agent', '/api/jev', '/api/quick-summary', '/api/surroundings', '/api/map.jpg'];

export interface AppOptions {
  /** Folder holding the unpacked Matterport Bundle (written by `npm run fetch-bundle`). */
  bundleDir?: string;
  /** Where meshes come from (`createMeshSource`). Without it, /api/mesh answers 503. */
  mesh?: MeshSource;
  /** The catalogued model ids this server may serve. Absent: only the demo house. */
  allowedIds?: Set<string>;
  /** Mounted at /api before the 4 kB parser, with a 256 kB JSON body limit. */
  wideRouters?: express.Router[];
  /** Mounted at /api, after a 4 kB JSON body parser. */
  routers?: express.Router[];
  /** Extra health flags (the search index); bundle and the key flags are filled in here. */
  health?: () => Partial<Health>;
  /** The built page (`app/dist`). When it holds index.html, the server serves the page too (production). */
  pageDir?: string;
}

export function createApp(
  env: Record<string, string | undefined>,
  options: AppOptions = {},
): express.Express {
  const app = express();
  const { bundleDir, mesh, wideRouters = [], routers = [], health, pageDir } = options;

  // Behind a host's proxy (Fly), req.ip must come from X-Forwarded-For, or every visitor shares one rate limit.
  if (env.TRUST_PROXY?.trim()) app.set('trust proxy', Number(env.TRUST_PROXY) || env.TRUST_PROXY.trim());
  const password = env.SITE_PASSWORD?.trim();
  if (password) app.use(sitePassword(password));
  const perMinute = parseLimit(env.RATE_LIMIT_PER_MIN);
  if (perMinute) for (const path of LIMITED_PATHS) app.use(path, rateLimit(perMinute));
  const allowedIds = options.allowedIds ?? new Set([DEMO_MODEL_ID]);
  const isAllowed = (id: unknown): id is string => isModelId(id) && (id === DEMO_MODEL_ID || allowedIds.has(id));
  const has = (key: string) => Boolean(env[key]?.trim());
  const bundleReady = () => Boolean(bundleDir && existsSync(join(bundleDir, 'showcase.html')));

  // express.static falls through to the next handler when a file is not there. Only then do we look at the
  // disk, so normal asset requests never block on a stat, and a Bundle fetched while the server runs needs no restart.
  if (bundleDir) app.use('/bundle', express.static(bundleDir));
  app.use('/bundle', (_req, res) => {
    if (bundleReady()) {
      res.status(404).type('text/plain').send('Not in the Matterport Bundle');
      return;
    }
    res.status(503).type('text/plain').send(BUNDLE_MISSING);
  });

  // Only the SDK key may reach the browser; the API token never does.
  app.get('/api/config', (req, res) => {
    const requested = req.query.m;
    if (requested !== undefined && !isAllowed(requested)) {
      sendNotPossible(res, notPossible('unknown_model'));
      return;
    }
    const modelId = requested ?? DEMO_MODEL_ID;
    const sdkKey = env.MATTERPORT_SDK_KEY?.trim();
    if (!sdkKey) {
      res.status(500).json({ error: 'MATTERPORT_SDK_KEY is not set in .env' });
      return;
    }
    res.json({ sdkKey, modelId });
  });

  // The mesh as an OBJ file, downloaded once and then served from the disk cache. The GraphQL token stays here.
  app.get('/api/mesh/:id', async (req, res) => {
    const id = req.params.id;
    if (!isAllowed(id)) {
      sendNotPossible(res, notPossible('unknown_model'));
      return;
    }
    if (!mesh) {
      res.status(503).json({ error: 'Mesh source not configured' });
      return;
    }
    try {
      const path = await mesh.meshPath(id);
      res.set('Cache-Control', 'no-store').type('text/plain; charset=utf-8');
      // dotfiles: 'allow' because the cache may sit under a dot folder (agent worktrees live in .claude/).
      res.sendFile(path, { dotfiles: 'allow' }, err => {
        // For example the cached file was deleted or is locked. Answer JSON like every other mesh error.
        if (!err) return;
        if (res.headersSent) {
          res.end();
          return;
        }
        res.removeHeader('Content-Type');
        res.status(500).json({ error: `Could not send the cached mesh: ${err.message}` });
      });
    } catch (err) {
      const status = err instanceof MeshError ? err.status : 500;
      const message = err instanceof Error ? err.message : 'Mesh failed for an unknown reason';
      res.status(status).json({ error: message });
    }
  });

  // Booleans only: whether each part is ready, never a key.
  app.get('/api/health', (_req, res) => {
    const body: Health = {
      bundle: bundleReady(),
      sdkKey: has('MATTERPORT_SDK_KEY'),
      matterport: has('MATTERPORT_API_KEY') && has('MATTERPORT_API_TOKEN'),
      vexcel: has('VEXCEL_API_KEY'),
      claude: has('CLAUDE_API'),
      index: false,
      ...health?.(),
    };
    res.json(body);
  });

  if (wideRouters.length > 0) app.use('/api', express.json({ limit: '256kb' }), ...wideRouters);
  if (routers.length > 0) app.use('/api', express.json({ limit: '4kb' }), ...routers);

  // Production: the built page, from the same origin as /api and /bundle (the SDK key is tied to that domain).
  const pageIndex = pageDir ? join(pageDir, 'index.html') : undefined;
  if (pageDir && pageIndex && existsSync(pageIndex)) {
    // Vite names assets by content hash, so they never change; index.html must always be fetched fresh.
    app.use('/assets', express.static(join(pageDir, 'assets'), { immutable: true, maxAge: '1y', fallthrough: false }));
    app.use(express.static(pageDir, { index: false }));
    app.get(/^(?!\/(api|bundle)(\/|$)).*/, (_req, res) => {
      res.set('Cache-Control', 'no-cache').sendFile(pageIndex);
    });
    return app;
  }

  // People open the address the server prints. Point them at the page instead of "Cannot GET /".
  app.get('/', (_req, res) => {
    res.type('text/plain').send(`${API_ONLY}
`);
  });

  return app;
}
