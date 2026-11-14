import { existsSync } from 'node:fs';
import { join } from 'node:path';
import express from 'express';

/** The only model this server serves (mvp-design.md 4.1). */
export const MODEL_ID = 'Ki9YdfpNKum';

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

  // Checked per request, so fetching the Bundle while the server runs needs no restart.
  const serveBundle = bundleDir ? express.static(bundleDir) : undefined;
  app.use('/bundle', (req, res, next) => {
    if (serveBundle && bundleDir && existsSync(join(bundleDir, 'showcase.html'))) {
      serveBundle(req, res, next);
      return;
    }
    res.status(503).type('text/plain').send('Matterport Bundle missing. Run: npm run fetch-bundle');
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

  return app;
}
