/** Where Vite's dev proxy sends /api and /bundle: our server, on PORT or 8787 (same rule as server/src/index.ts). */
export function proxyTarget(env: Record<string, string | undefined>): string {
  const port = Number(env.PORT);
  return `http://localhost:${Number.isInteger(port) && port > 0 ? port : 8787}`;
}
