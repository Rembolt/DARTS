import { existsSync } from 'node:fs';
import { join } from 'node:path';
import express from 'express';

/** The only model this server serves (mvp-design.md 4.1). */
export const MODEL_ID = 'Ki9YdfpNKum';

/** Sent with HTTP 503 for any /bundle request while the Bundle is not fetched. The app shows it as is. */
export const BUNDLE_MISSING = 'Matterport Bundle missing. Run: npm run fetch-bundle';

/** What the server's own root answers: this is the API, the page is on Vite. */
export const API_ONLY = 'This is the API server. Open the app at http://localhost:5173';

export interface AppOptions {
  /** Folder holding the unpacked Matterport Bundle (written by `npm run fetch-bundle`). */
  bundleDir?: string;
}

export function createApp(
  env: Record<string, string | undefined>,
  options: AppOptions = {},
): express.Express {
  const app = express();
  const { bundleDir } = options;

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

  // People open the address the server prints. Point them at the page instead of "Cannot GET /".
  app.get('/', (_req, res) => {
    res.type('text/plain').send(`${API_ONLY}
`);
  });

  return app;
}
