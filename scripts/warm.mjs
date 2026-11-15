// Warm the caches for a demo query: asks the agent, then fetches each result's mesh and surroundings so the live demo
// is fast. Usage: npm run warm -- "I want a place in Houston where I can record music"
// One line per property: address, summary ok or its code, mesh cached or its code, area class. Exit 1 if the server is down.
const port = process.env.PORT || 8787;
const base = `http://127.0.0.1:${port}`;
const text = process.argv.slice(2).join(' ').trim();
if (!text) {
  console.error('Usage: npm run warm -- "<query>"');
  process.exit(2);
}

const started = Date.now();
let res;
try {
  res = await fetch(`${base}/api/agent`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ text }),
  });
} catch {
  console.error(`Server not reachable at ${base}. Run npm run dev first.`);
  process.exit(1);
}
if (!res.ok || !res.body) {
  console.error(`Agent request failed: HTTP ${res.status}`);
  process.exit(1);
}

// Read the event stream: "data: {json}" lines separated by a blank line.
const events = [];
const decoder = new TextDecoder();
let buffer = '';
for await (const chunk of res.body) {
  buffer += decoder.decode(chunk, { stream: true });
  let end;
  while ((end = buffer.indexOf('\n\n')) >= 0) {
    const block = buffer.slice(0, end);
    buffer = buffer.slice(end + 2);
    const line = block.split('\n').find(l => l.startsWith('data: '));
    if (!line) continue;
    try { events.push(JSON.parse(line.slice(6))); } catch { /* skip a broken event */ }
  }
}

const refused = events.find(e => e.type === 'notPossible');
if (refused) console.log(`Agent: not possible (${refused.reason.code}): ${refused.reason.message}`);

const summaries = events.filter(e => e.type === 'cards').flatMap(e => e.summaries);
const seen = new Set();
const properties = summaries.filter(s => !seen.has(s.modelId) && seen.add(s.modelId));

const codeOf = async (r) => {
  if (r.ok) return null;
  try { return (await r.json())?.reason?.code ?? `HTTP ${r.status}`; } catch { return `HTTP ${r.status}`; }
};

await Promise.all(properties.map(async (s) => {
  const [mesh, area] = await Promise.all([
    fetch(`${base}/api/mesh/${s.modelId}`).then(async r => { const code = await codeOf(r); await r.arrayBuffer().catch(() => {}); return code; }).catch(() => 'unreachable'),
    fetch(`${base}/api/surroundings/${s.modelId}`).then(async r => (r.ok ? (await r.json()).areaClass : await codeOf(r))).catch(() => 'unreachable'),
  ]);
  const summary = s.ok ? 'ok' : s.reason?.code ?? 'failed';
  console.log(`${s.address ?? s.modelId} | summary ${summary} | mesh ${mesh ?? 'cached'} | area ${area}`);
}));

console.log(`${properties.length} properties in ${((Date.now() - started) / 1000).toFixed(1)} s`);
