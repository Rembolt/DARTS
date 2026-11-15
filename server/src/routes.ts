import express from 'express';
import type { Agent } from './agent/index.js';
import { sendNotPossible, toNotPossible } from './errors.js';
import { isModelId } from './ids.js';
import type { Quick } from './quick/index.js';
import type { Search } from './search/index.js';
import type { Surroundings } from './surroundings/index.js';
import { notPossible, type AgentEvent, type AgentRequest, type ProfileId, type RequirementOverrides } from './shared/contract.js';

const PROFILES: readonly ProfileId[] = [
  'recording', 'rehearsal', 'podcast', 'home_office', 'sleep', 'home_theater',
  'cafe_restaurant', 'retail', 'open_office', 'general',
];

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

/** The V3 routes, mounted at /api by createApp. Every id is checked against the catalogue first. */
export function apiRouter(deps: {
  search: Search;
  quick: Quick;
  surroundings: Surroundings;
  agent: Agent;
  allowedIds: Set<string>;
}): express.Router {
  const { search, quick, surroundings, agent, allowedIds } = deps;
  const router = express.Router();
  const isAllowed = (id: unknown): id is string => isModelId(id) && allowedIds.has(id);

  router.get('/property/:id/status', async (req, res) => {
    if (!isAllowed(req.params.id)) return sendNotPossible(res, notPossible('unknown_model'));
    res.json(await quick.status(req.params.id));
  });

  router.post('/quick-summary', async (req, res) => {
    const body: unknown = req.body;
    if (!isPlainObject(body)) return sendNotPossible(res, notPossible('bad_request'));
    if (!isAllowed(body.modelId)) return sendNotPossible(res, notPossible('unknown_model'));
    const profile = body.profile;
    if (typeof profile !== 'string' || !PROFILES.includes(profile as ProfileId)) {
      return sendNotPossible(res, notPossible('bad_request'));
    }
    if (body.overrides !== undefined && !isPlainObject(body.overrides)) {
      return sendNotPossible(res, notPossible('bad_request'));
    }
    try {
      const requirements = quick.resolve(profile as ProfileId, body.overrides as Partial<RequirementOverrides> | undefined);
      res.json(await quick.summarise(body.modelId, requirements));
    } catch (err) {
      sendNotPossible(res, toNotPossible(err));
    }
  });

  router.get('/surroundings/:id', async (req, res) => {
    const id = req.params.id;
    const row = isAllowed(id) ? search.lookup(id) : null;
    if (!row) return sendNotPossible(res, notPossible('unknown_model'));
    res.json(await surroundings.get(row));
  });

  router.post('/agent', async (req, res) => {
    const body: unknown = req.body;
    if (!isPlainObject(body) || typeof body.text !== 'string' || body.text.length < 1 || body.text.length > 500) {
      return sendNotPossible(res, notPossible('bad_request'));
    }
    const controller = new AbortController();
    // The response's close event fires when the client goes away; after a normal end it no longer matters.
    res.on('close', () => controller.abort());
    // The stream opens with the first event, so a refusal that comes first (`busy`) can still be a real 429 (spec 8.2).
    let opened = false;
    const emit = (event: AgentEvent) => {
      if (controller.signal.aborted || res.writableEnded) return;
      if (!opened) {
        opened = true;
        if (event.type === 'notPossible' && event.reason.code === 'busy') {
          sendNotPossible(res, event.reason);
          return;
        }
        res.status(200).set({ 'Content-Type': 'text/event-stream', 'Cache-Control': 'no-store' });
        res.flushHeaders();
      }
      res.write(`data: ${JSON.stringify(event)}\n\n`);
    };
    await agent.run(body as AgentRequest, emit, controller.signal);
    if (!res.writableEnded) res.end();
  });

  return router;
}
