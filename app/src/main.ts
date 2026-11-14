import { loadServerConfig } from './api';

const status = document.getElementById('status')!;

// Never write the SDK key to the page or the console.
loadServerConfig()
  .then(config => {
    status.textContent = `Ready: model ${config.modelId}`;
  })
  .catch((err: Error) => {
    status.textContent = err.message;
  });
