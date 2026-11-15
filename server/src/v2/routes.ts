import express from 'express';
import { sendNotPossible, toNotPossible } from '../errors.js';
import { isModelId } from '../ids.js';
import type { PiSource } from '../quick/pi.js';
import type { Search } from '../search/index.js';
import { notPossible } from '../shared/contract.js';
import { suggestDefaults } from './defaults.js';
import { geometryOf } from './geometry.js';

export type V2RouterDeps = {
  pi: PiSource;
  lookup: Search['lookup'];
  allowedIds: Set<string>;
  env: Record<string, string | undefined>;
  cacheDir: string;
  client?: unknown;
};

/** V2 routes, mounted at /api. */
export function v2Router(deps: V2RouterDeps): express.Router {
  const { pi, allowedIds } = deps;
  const router = express.Router();
  const isAllowed = (id: unknown): id is string => isModelId(id) && allowedIds.has(id);

  router.get('/openings/:id', async (req, res) => {
    if (!isAllowed(req.params.id)) return sendNotPossible(res, notPossible('unknown_model'));
    try {
      const model = await pi.get(req.params.id);
      res.json(geometryOf(model));
    } catch (err) {
      sendNotPossible(res, toNotPossible(err));
    }
  });

  router.get('/defaults/:id', async (req, res) => {
    if (!isAllowed(req.params.id)) return sendNotPossible(res, notPossible('unknown_model'));
    const refresh = req.query.refresh === '1' || req.query.refresh === 'true';
    try {
      res.json(await suggestDefaults(deps, req.params.id, refresh));
    } catch (err) {
      sendNotPossible(res, toNotPossible(err));
    }
  });

  return router;
}
