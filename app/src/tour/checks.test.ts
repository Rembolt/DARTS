// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from 'vitest';
import { notPossible } from '../../../server/src/shared/contract';
import { browserSupport, checkProperty, loadStatus, meshProblem, withTimeout } from './checks';
import { showFailure } from './failure';
import { FRONT_URL } from '../route';

const json = (status: number, body: unknown) => async () =>
  new Response(JSON.stringify(body), { status, headers: { 'content-type': 'application/json' } });

const status = (over: object) => ({ modelId: 'Ki9YdfpNKum', name: '9117 Richland Dr', canEnter: true, canSummarise: true, reason: null, ...over });

describe('browserSupport', () => {
  it('names the missing browser feature', () => {
    const r = browserSupport({ Worker: 1, AudioContext: 1 })!;
    expect(r.code).toBe('browser_unsupported');
    expect(r.message).toMatch(/WebGL/);
    expect(r.message).not.toMatch(/Web Worker|Web Audio/);
  });
  it('names every missing feature', () => {
    expect(browserSupport({})!.message).toMatch(/WebGL.*Web Worker.*Web Audio/);
  });
  it('passes a full browser', () => {
    expect(browserSupport({ WebGLRenderingContext: 1, Worker: 1, AudioContext: 1 })).toBeNull();
  });
});

describe('checkProperty', () => {
  it('returns the status reason when the property cannot be entered', async () => {
    const reason = notPossible('no_mesh');
    expect(await checkProperty('xN28FQ5mE6E', json(200, status({ canEnter: false, canSummarise: false, reason })))).toEqual(reason);
  });
  it('passes a property that can be entered even without room data', async () => {
    const fetchFn = json(200, status({ canEnter: true, canSummarise: false, reason: notPossible('no_room_data') }));
    expect(await checkProperty('FDfFB5xd88B', fetchFn)).toBeNull();
  });
  it('maps an unknown id', async () => {
    const r = await checkProperty('bbbbbbbbbbb', json(404, { error: notPossible('unknown_model').message, code: 'unknown_model', retry: false }));
    expect(r!.code).toBe('unknown_model');
    expect(r!.message).toBe('Not possible to load: this property is not in the catalogue.');
  });
  it('maps a server that is down', async () => {
    const r = await checkProperty('Ki9YdfpNKum', async () => { throw new TypeError('offline'); });
    expect(r).toMatchObject({ code: 'matterport_unreachable', retry: true });
  });
  it('asks the status route for the id and keeps the name', async () => {
    const fetchFn = vi.fn(json(200, status({})));
    const s = await loadStatus('Ki9YdfpNKum', fetchFn as unknown as typeof fetch);
    expect(fetchFn).toHaveBeenCalledWith('/api/property/Ki9YdfpNKum/status');
    expect(s.name).toBe('9117 Richland Dr');
  });
});

describe('withTimeout', () => {
  afterEach(() => vi.useRealTimers());
  it('times out with the given reason', async () => {
    vi.useFakeTimers();
    const reason = notPossible('viewer_failed');
    const p = withTimeout(new Promise(() => {}), 30_000, reason);
    const caught = p.catch(e => e);
    await vi.advanceTimersByTimeAsync(30_000);
    expect(await caught).toEqual({ reason });
  });
  it('passes a value through and clears its timer', async () => {
    vi.useFakeTimers();
    expect(await withTimeout(Promise.resolve(7), 1000, notPossible('viewer_failed'))).toBe(7);
    expect(vi.getTimerCount()).toBe(0);
  });
});

describe('meshProblem', () => {
  it('rejects an empty or huge mesh', () => {
    expect(meshProblem({ triangles: 0 })!.code).toBe('mesh_unusable');
    expect(meshProblem({ triangles: 500_001 })!.code).toBe('mesh_unusable');
    expect(meshProblem({ triangles: 116_539 })).toBeNull();
    expect(meshProblem({ triangles: 500_000 })).toBeNull();
  });
});

describe('showFailure', () => {
  it('offers Try again only for retryable reasons', () => {
    const root = document.createElement('div');
    root.innerHTML = '<iframe></iframe>';
    const retry = vi.fn();
    showFailure(root, notPossible('mesh_failed'), { retry });
    expect(root.querySelector('iframe')).toBeNull();
    expect(root.textContent).toContain('Not possible to load: the 3D mesh could not be downloaded.');
    const back = root.querySelector('a')!;
    expect(back.textContent).toBe('Back to search');
    expect(back.getAttribute('href')).toBe(FRONT_URL);
    const again = [...root.querySelectorAll('button')].find(b => b.textContent === 'Try again')!;
    again.click();
    expect(retry).toHaveBeenCalledOnce();

    showFailure(root, notPossible('no_mesh'), { retry });
    expect([...root.querySelectorAll('button')].some(b => b.textContent === 'Try again')).toBe(false);
    expect(root.querySelectorAll('a')).toHaveLength(1);
  });
  it('puts the message on the page as text, never as markup', () => {
    const root = document.createElement('div');
    showFailure(root, { code: 'viewer_failed', message: '<b>x</b>', retry: false }, {});
    expect(root.querySelector('b')).toBeNull();
    expect(root.textContent).toContain('<b>x</b>');
  });
});
