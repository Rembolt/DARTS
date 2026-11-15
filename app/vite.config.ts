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
  // Pre-bundle everything the page imports at start. Without this, Vite finds the three.js line modules and the Radix
  // packages only after the page loads, rebuilds its cache, and every tab already open gets "504 Outdated Optimize Dep".
  optimizeDeps: {
    include: [
      'three/examples/jsm/lines/Line2.js',
      'three/examples/jsm/lines/LineGeometry.js',
      'three/examples/jsm/lines/LineMaterial.js',
      'three-mesh-bvh',
      'sonner',
      '@radix-ui/react-popover',
      '@radix-ui/react-select',
      '@radix-ui/react-switch',
      '@radix-ui/react-tooltip',
    ],
  },
  server: {
    host: 'localhost',
    proxy: {
      '/api': target,
      '/bundle': target,
    },
  },
});
