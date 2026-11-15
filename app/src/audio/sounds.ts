// Sound files. A file that is missing or can't be decoded is skipped and named; V3 sounds get no synthesized stand-in
// (v3-design 6.3).

/**
 * Fetch and decode a sound file. Returns null when it is missing: a failed request, a non-OK status, an HTML
 * page (Vite answers a missing file with index.html and status 200) or audio the browser cannot decode.
 */
export async function loadSound(ctx: BaseAudioContext, url: string, fetchFn: typeof fetch = fetch): Promise<AudioBuffer | null> {
  try {
    const res = await fetchFn(url);
    if (!res.ok) return null;
    if ((res.headers.get('content-type') ?? '').includes('text/html')) return null;
    return await ctx.decodeAudioData(await res.arrayBuffer());
  } catch {
    return null;
  }
}
