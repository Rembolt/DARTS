import { defineConfig } from 'vite';
import { proxyTarget } from './proxy-target';

const target = proxyTarget(process.env);

// The SDK key only works on localhost, so the dev server stays there.
export default defineConfig({
  server: {
    host: 'localhost',
    proxy: {
      '/api': target,
      '/bundle': target,
    },
  },
});
