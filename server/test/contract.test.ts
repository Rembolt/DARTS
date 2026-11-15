import { describe, it, expect } from 'vitest';
import { NOT_POSSIBLE, notPossible } from '../src/shared/contract.js';

describe('not-possible vocabulary', () => {
  it('gives every code a status, a message and a retry flag', () => {
    for (const [code, row] of Object.entries(NOT_POSSIBLE)) {
      expect(row.status, code).toBeGreaterThanOrEqual(400);
      expect(row.message.length, code).toBeGreaterThan(10);
      expect(typeof row.retry, code).toBe('boolean');
    }
  });
  it('uses the spec sentences', () => {
    expect(notPossible('no_mesh')).toEqual({ code: 'no_mesh', retry: false,
      message: 'Not possible to load the audio tour: this property has no 3D mesh to trace sound through.' });
    expect(notPossible('unknown_model').message).toBe('Not possible to load: this property is not in the catalogue.');
    expect(notPossible('outside_coverage').message).toBe("That's not possible: I only have properties in Houston and Los Angeles.");
    expect(NOT_POSSIBLE.bundle_missing.status).toBe(503);
    expect(NOT_POSSIBLE.no_mesh.status).toBe(409);
    expect(NOT_POSSIBLE.mesh_failed.retry).toBe(true);
  });
  it('lets a detail replace the message', () => {
    expect(notPossible('no_results', 'Nothing matches that. Removing the price limit would give 12 properties.').message).toMatch(/price limit/);
  });
});
