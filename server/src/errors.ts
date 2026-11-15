import type express from 'express';
import { MeshError } from './mesh.js';
import { NOT_POSSIBLE, notPossible, type NotPossible } from './shared/contract.js';

/** Thrown inside the server to carry a contract failure up to the route that answers it. */
export class NotPossibleError extends Error {
  constructor(public readonly reason: NotPossible) {
    super(reason.message);
    this.name = 'NotPossibleError';
  }
}

/** Answers with the code's HTTP status and `{ error, code, retry }`. */
export function sendNotPossible(res: express.Response, reason: NotPossible): void {
  res.status(NOT_POSSIBLE[reason.code].status).json({ error: reason.message, code: reason.code, retry: reason.retry });
}

export function toNotPossible(err: unknown): NotPossible {
  if (err instanceof NotPossibleError) return err.reason;
  if (err instanceof MeshError) return notPossible('mesh_failed');
  return notPossible('agent_failed');
}
