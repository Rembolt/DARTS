import express from 'express';

/** The only model this server serves (mvp-design.md 4.1). */
export const MODEL_ID = 'Ki9YdfpNKum';

export function createApp(env: Record<string, string | undefined>): express.Express {
  const app = express();

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
