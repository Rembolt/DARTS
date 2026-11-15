import { checkBundle, loadMesh, loadServerConfig } from './api';
import { createModeSwitch } from './blueprint/mode';
import { bindShortcut, createToggle } from './blueprint/toggle';
import { createBlueprint } from './blueprint/view';
import { BLUEPRINT, simConfig } from './config';
import { formatSimReady, startSim } from './sim/client';
import { connectViewer, formatPose, viewerUrl, type Pose } from './viewer';

const status = document.getElementById('status')!;
const poseLine = document.getElementById('pose')!;
const simLine = document.getElementById('sim')!;
const iframe = document.getElementById('viewer') as HTMLIFrameElement;
const stage = document.getElementById('stage')!;
const canvas = document.getElementById('blueprint') as HTMLCanvasElement;
const button = document.getElementById('blueprint-toggle') as HTMLButtonElement;
const modeButton = document.getElementById('blueprint-mode') as HTMLButtonElement;

const blueprint = createBlueprint(canvas);
let latestPose: Pose | null = null;
let blueprintLines: Float32Array | null = null;
const toggle = createToggle();
const modeSwitch = createModeSwitch(BLUEPRINT.defaultMode);
blueprint.setMode(modeSwitch.mode());

function showToggle(): void {
  const v = toggle.view();
  button.disabled = !v.enabled;
  button.textContent = v.label;
  button.title = v.title;
  button.setAttribute('aria-pressed', String(v.pressed));
  canvas.hidden = !v.pressed;
  blueprint.setVisible(v.pressed);
  modeButton.disabled = !v.enabled;
  modeButton.textContent = modeSwitch.label();
  modeButton.title = modeSwitch.title();
}

function flipBlueprint(): void {
  toggle.toggle();
  showToggle();
}

button.addEventListener('click', flipBlueprint);
modeButton.addEventListener('click', () => {
  blueprint.setMode(modeSwitch.next());
  showToggle();
});
const listenForShortcut = bindShortcut(toggle, flipBlueprint);
listenForShortcut(document);
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
    blueprint.setMesh(ready.mesh);
    blueprintLines = ready.lines;
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
  // Same origin, so the tour's own window can be listened to: after a click into the tour, keys go there.
  if (iframe.contentWindow) listenForShortcut(iframe.contentWindow);
  sdk.Camera.pose.subscribe(pose => {
    poseLine.textContent = formatPose(pose);
    blueprint.setPose(pose);
    latestPose = pose;
  });

  if (import.meta.env.DEV) {
    const { installBlueprintCheck } = await import('./debug');
    installBlueprintCheck({
      sdk,
      getPose: () => latestPose,
      getLines: () => blueprintLines,
      getSize: () => ({ w: stage.clientWidth, h: stage.clientHeight }),
    });
  }
}

start().catch(showError);
