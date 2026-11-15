import { checkBundle, loadMesh, loadServerConfig } from './api';
import { simConfig } from './config';
import { formatSimReady, startSim } from './sim/client';
import { connectViewer, formatPose, viewerUrl } from './viewer';

const status = document.getElementById('status')!;
const poseLine = document.getElementById('pose')!;
const simLine = document.getElementById('sim')!;
const iframe = document.getElementById('viewer') as HTMLIFrameElement;

function showError(err: unknown): void {
  const message = err instanceof Error ? err.message : typeof err === 'string' ? err : 'unknown error';
  status.textContent = message;
  status.title = message;
}

/** Download the mesh and load it in the worker. Runs beside the tour; it never blocks or breaks it. */
async function startSimulation(modelId: string): Promise<void> {
  simLine.textContent = 'Loading mesh…';
  try {
    const obj = await loadMesh(modelId);
    const ready = await startSim().load(obj, simConfig());
    simLine.textContent = formatSimReady(ready);
    console.info('sim ready', {
      triangles: ready.triangles,
      lines: ready.lines.length / 6,
      loadMs: Math.round(ready.loadMs),
      timings: Object.fromEntries(Object.entries(ready.timings).map(([k, v]) => [k, Math.round(v)])),
      boundsMin: ready.boundsMin,
      boundsMax: ready.boundsMax,
    });
  } catch (err) {
    const message = `Simulation failed to load: ${err instanceof Error ? err.message : String(err)}`;
    simLine.textContent = message;
    simLine.title = message;
  }
}

async function start(): Promise<void> {
  const config = await loadServerConfig().catch(showError);
  if (!config) return;

  void startSimulation(config.modelId);

  try {
    await checkBundle();
  } catch (err) {
    showError(err);
    return;
  }

  status.textContent = 'Loading tour…';
  // Never write the SDK key to the page text or the console. It appears only in this src.
  iframe.src = viewerUrl(config);

  const sdk = await connectViewer(iframe, message => {
    status.textContent = message;
  }).catch(showError);
  if (!sdk) return;

  status.textContent = `Tour playing: model ${config.modelId}`;
  sdk.Camera.pose.subscribe(pose => {
    poseLine.textContent = formatPose(pose);
  });
}

start().catch(showError);
