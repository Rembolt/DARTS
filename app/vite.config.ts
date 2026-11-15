import { defineConfig } from 'vite';
import { proxyTarget } from './proxy-target';

const target = proxyTarget(process.env);

// The SDK key only works on localhost, so the dev server stays there.
export default defineConfig({
  // Radix and Sonner are React libraries; Preact's compat layer runs them without shipping React.
  resolve: {
    alias: {
      react: 'preact/compat',
      'react-dom/test-utils': 'preact/test-utils',
      'react-dom': 'preact/compat',
      'react/jsx-runtime': 'preact/jsx-runtime',
    },
  },
  server: {
    host: 'localhost',
    proxy: {
      '/api': target,
      '/bundle': target,
    },
  },
});
