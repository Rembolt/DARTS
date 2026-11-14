import { loadServerConfig } from './api';

const status = document.getElementById('status')!;

// Never write the SDK key to the page or the console.
loadServerConfig()
  .then(config => {
    status.textContent = `Ready: model ${config.modelId}`;
  })
  .catch((err: unknown) => {
    status.textContent = err instanceof Error ? err.message : String(err);
  });
