// Sound files. A file that is missing or can't be decoded is skipped and named; V3 sounds get no synthesized stand-in
// (v3-design 6.3).

const decoded = new WeakMap<BaseAudioContext, Map<string, Promise<AudioBuffer | null>>>();

/**
 * Fetch and decode a sound file. Returns null when it is missing: a failed request, a non-OK status, an HTML
 * page (Vite answers a missing file with index.html and status 200) or audio the browser cannot decode.
 * Each file is decoded once per context, so a context warmed up before the click already holds every sound.
 */
export function loadSound(ctx: BaseAudioContext, url: string, fetchFn: typeof fetch = fetch): Promise<AudioBuffer | null> {
  let perContext = decoded.get(ctx);
  if (!perContext) decoded.set(ctx, (perContext = new Map()));
  let p = perContext.get(url);
  if (!p) perContext.set(url, (p = decode(ctx, url, fetchFn)));
  return p;
}

async function decode(ctx: BaseAudioContext, url: string, fetchFn: typeof fetch): Promise<AudioBuffer | null> {
  try {
    const res = await fetchFn(url);
    if (!res.ok) return null;
    if ((res.headers.get('content-type') ?? '').includes('text/html')) return null;
    return await ctx.decodeAudioData(await res.arrayBuffer());
  } catch {
    return null;
  }
}
