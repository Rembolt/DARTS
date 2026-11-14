import { checkBundle, loadServerConfig } from './api';
import { connectViewer, formatPose, viewerUrl } from './viewer';

const status = document.getElementById('status')!;
const poseLine = document.getElementById('pose')!;
const iframe = document.getElementById('viewer') as HTMLIFrameElement;

function showError(err: unknown): void {
  const message = err instanceof Error ? err.message : typeof err === 'string' ? err : 'unknown error';
  status.textContent = message;
  status.title = message;
}

async function start(): Promise<void> {
  const config = await loadServerConfig().catch(showError);
  if (!config) return;

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
