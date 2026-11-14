import { defineConfig } from 'vite';

// The SDK key only works on localhost, so the dev server stays there.
export default defineConfig({
  server: {
    host: 'localhost',
    proxy: {
      '/api': 'http://localhost:8787',
      '/bundle': 'http://localhost:8787',
    },
  },
});
