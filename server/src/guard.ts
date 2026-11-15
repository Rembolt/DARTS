import { createHash, timingSafeEqual } from 'node:crypto';
import type express from 'express';
import { sendNotPossible } from './errors.js';
import { notPossible } from './shared/contract.js';

/** Paths that stay open behind the site password: the host's health check must get through. */
const OPEN_PATHS = new Set(['/api/health']);

function sameText(a: string, b: string): boolean {
  // Hash both so the comparison takes the same time whatever the lengths.
  const ha = createHash('sha256').update(a).digest();
  const hb = createHash('sha256').update(b).digest();
  return timingSafeEqual(ha, hb);
}

/**
 * HTTP Basic auth for the whole site when SITE_PASSWORD is set: any user name, that password. The browser asks once
 * and then sends it with every request, including the viewer iframe and the worker's mesh download.
 */
export function sitePassword(password: string): express.RequestHandler {
  return (req, res, next) => {
    if (OPEN_PATHS.has(req.path)) return next();
    const header = req.get('Authorization') ?? '';
    if (header.startsWith('Basic ')) {
      const decoded = Buffer.from(header.slice(6), 'base64').toString('utf8');
      const given = decoded.slice(decoded.indexOf(':') + 1);
      if (decoded.includes(':') && sameText(given, password)) return next();
    }
    res.set('WWW-Authenticate', 'Basic realm="DARTS", charset="UTF-8"').status(401).type('text/plain').send('Password required');
  };
}

/** A whole number above 0, or undefined (rate limiting off). */
export function parseLimit(value: string | undefined): number | undefined {
  const n = Number(value);
  return Number.isInteger(n) && n > 0 ? n : undefined;
}

/**
 * At most `max` requests per client IP per window, answered with the contract's `busy` (HTTP 429) after that.
 * In memory: one server process, so that is enough. Old windows are dropped as they are passed.
 */
export function rateLimit(max: number, windowMs = 60_000, now: () => number = Date.now): express.RequestHandler {
  const counts = new Map<string, { start: number; n: number }>();
  return (req, res, next) => {
    const t = now();
    const key = req.ip ?? 'unknown';
    let entry = counts.get(key);
    if (!entry || t - entry.start >= windowMs) {
      if (counts.size > 10_000) for (const [k, e] of counts) if (t - e.start >= windowMs) counts.delete(k);
      entry = { start: t, n: 0 };
      counts.set(key, entry);
    }
    entry.n += 1;
    if (entry.n > max) {
      res.set('Retry-After', String(Math.ceil((entry.start + windowMs - t) / 1000)));
      sendNotPossible(res, notPossible('busy'));
      return;
    }
    next();
  };
}
