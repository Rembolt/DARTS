import express from 'express';
import { sendNotPossible } from '../errors.js';
import { isModelId } from '../ids.js';
import type { Search } from '../search/index.js';
import { notPossible, type Place } from '../shared/contract.js';
import type { CityMaps } from './index.js';

const MAX_PLACES = 40;

/** /api/city, /api/city/:slug/image.jpg and /api/places?ids=a,b: what the front door's map needs. */
export function cityRouter(deps: { cities: CityMaps; search: Search }): express.Router {
  const { cities, search } = deps;
  const router = express.Router();

  router.get('/city', (_req, res) => {
    res.json(cities.views());
  });

  router.get('/usa/image.jpg', async (_req, res) => {
    const bytes = await cities.usa();
    if (!bytes) {
      res.status(503).type('text/plain').send('Satellite image not available');
      return;
    }
    res.set({ 'Content-Type': 'image/jpeg', 'Cache-Control': 'public, max-age=86400' }).send(bytes);
  });

  router.get('/city/:slug/image.jpg', async (req, res) => {
    if (!cities.views().some(v => v.slug === req.params.slug)) return sendNotPossible(res, notPossible('bad_request'));
    const bytes = await cities.image(req.params.slug);
    if (!bytes) {
      res.status(503).type('text/plain').send('Satellite image not available');
      return;
    }
    res.set({ 'Content-Type': 'image/jpeg', 'Cache-Control': 'public, max-age=86400' }).send(bytes);
  });

  router.get('/map.jpg', async (req, res) => {
    const lat = Number(req.query.lat);
    const lon = Number(req.query.lon);
    const h = Number(req.query.h);
    const bytes = await cities.detail(lat, lon, h);
    if (!bytes) {
      res.status(503).type('text/plain').send('Satellite image not available');
      return;
    }
    res.set({ 'Content-Type': 'image/jpeg', 'Cache-Control': 'public, max-age=86400' }).send(bytes);
  });

  router.get('/places', (req, res) => {
    const raw = typeof req.query.ids === 'string' ? req.query.ids : '';
    const ids = raw.split(',').filter(isModelId).slice(0, MAX_PLACES);
    const places: Place[] = [];
    for (const id of ids) {
      const row = search.lookup(id);
      if (row) places.push({ modelId: row.modelId, address: row.address, city: row.city, lat: row.lat, lon: row.lon });
    }
    res.json(places);
  });

  return router;
}
