import { existsSync } from 'node:fs';
import { join } from 'node:path';
import express from 'express';
import { MeshError, type MeshSource } from './mesh.js';

/** The only model this server serves (mvp-design.md 4.1). */
export const MODEL_ID = 'Ki9YdfpNKum';

/** Sent with HTTP 503 for any /bundle request while the Bundle is not fetched. The app shows it as is. */
export const BUNDLE_MISSING = 'Matterport Bundle missing. Run: npm run fetch-bundle';

/** What the server's own root answers: this is the API, the page is on Vite. */
export const API_ONLY = 'This is the API server. Open the app at http://localhost:5173';

export interface AppOptions {
  /** Folder holding the unpacked Matterport Bundle (written by `npm run fetch-bundle`). */
  bundleDir?: string;
  /** Where meshes come from (`createMeshSource`). Without it, /api/mesh answers 503. */
  mesh?: MeshSource;
}

export function createApp(
  env: Record<string, string | undefined>,
  options: AppOptions = {},
): express.Express {
  const app = express();
  const { bundleDir, mesh } = options;

  // express.static falls through to the next handler when a file is not there. Only then do we look at the
  // disk, so normal asset requests never block on a stat, and a Bundle fetched while the server runs needs no restart.
  if (bundleDir) app.use('/bundle', express.static(bundleDir));
  app.use('/bundle', (_req, res) => {
    if (bundleDir && existsSync(join(bundleDir, 'showcase.html'))) {
      res.status(404).type('text/plain').send('Not in the Matterport Bundle');
      return;
    }
    res.status(503).type('text/plain').send(BUNDLE_MISSING);
  });

  // Only the SDK key may reach the browser; the API token never does.
  app.get('/api/config', (_req, res) => {
    const sdkKey = env.MATTERPORT_SDK_KEY?.trim();
    if (!sdkKey) {
      res.status(500).json({ error: 'MATTERPORT_SDK_KEY is not set in .env' });
      return;
    }
    res.json({ sdkKey, modelId: MODEL_ID });
  });

  // The mesh as an OBJ file, downloaded once and then served from the disk cache. The GraphQL token stays here.
  app.get('/api/mesh/:id', async (req, res) => {
    if (req.params.id !== MODEL_ID) {
      res.status(404).json({ error: `Only model ${MODEL_ID} is served` });
      return;
    }
    if (!mesh) {
      res.status(503).json({ error: 'Mesh source not configured' });
      return;
    }
    try {
      const path = await mesh.meshPath(MODEL_ID);
      res.set('Cache-Control', 'no-store').type('text/plain; charset=utf-8').sendFile(path);
    } catch (err) {
      const status = err instanceof MeshError ? err.status : 500;
      const message = err instanceof Error ? err.message : 'Mesh failed for an unknown reason';
      res.status(status).json({ error: message });
    }
  });

  // People open the address the server prints. Point them at the page instead of "Cannot GET /".
  app.get('/', (_req, res) => {
    res.type('text/plain').send(`${API_ONLY}
`);
  });

  return app;
}
