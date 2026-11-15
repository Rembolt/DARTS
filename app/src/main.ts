import { checkBundle, loadMesh, loadServerConfig } from './api';
import { createToggle } from './blueprint/toggle';
import { createBlueprint } from './blueprint/view';
import { simConfig } from './config';
import { formatSimReady, startSim } from './sim/client';
import { connectViewer, formatPose, viewerUrl } from './viewer';

const status = document.getElementById('status')!;
const poseLine = document.getElementById('pose')!;
const simLine = document.getElementById('sim')!;
const iframe = document.getElementById('viewer') as HTMLIFrameElement;
const stage = document.getElementById('stage')!;
const canvas = document.getElementById('blueprint') as HTMLCanvasElement;
const button = document.getElementById('blueprint-toggle') as HTMLButtonElement;

const blueprint = createBlueprint(canvas);
const toggle = createToggle();

function showToggle(): void {
  const v = toggle.view();
  button.disabled = !v.enabled;
  button.textContent = v.label;
  button.title = v.title;
  button.setAttribute('aria-pressed', String(v.pressed));
  canvas.hidden = !v.pressed;
  blueprint.setVisible(v.pressed);
}

function flipBlueprint(): void {
  toggle.toggle();
  showToggle();
}

button.addEventListener('click', flipBlueprint);
document.addEventListener('keydown', event => {
  if (event.repeat || event.ctrlKey || event.metaKey || event.altKey) return;
  if (toggle.isShortcut(event.key, event.target as HTMLElement | null)) flipBlueprint();
});
new ResizeObserver(([entry]) => blueprint.resize(entry.contentRect, devicePixelRatio)).observe(stage);
showToggle();

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
    blueprint.setLines(ready.lines);
    toggle.ready();
    showToggle();
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
    toggle.failed(err instanceof Error ? err.message : String(err));
    showToggle();
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
    blueprint.setPose(pose);
  });
}

start().catch(showError);
