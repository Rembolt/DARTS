// Downloads the self-hosted Matterport Bundle into server/bundle/ (git-ignored).
// Usage: npm run fetch-bundle [-- --force]
import { existsSync, mkdtempSync, readFileSync, readdirSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import extract from 'extract-zip';

const BUNDLE_VERSION = '26.10.4_webgl-1728-g1cd7e0997a';
const BUNDLE_URL = `https://static.matterport.com/showcase-sdk/bundle/${BUNDLE_VERSION}/showcase-bundle.zip`;

const bundleDir = resolve(import.meta.dirname, '../server/bundle');
const versionFile = join(bundleDir, 'version.txt');
const force = process.argv.includes('--force');

function countFiles(dir) {
  return readdirSync(dir, { recursive: true, withFileTypes: true }).filter((e) => e.isFile()).length;
}

if (!force && existsSync(versionFile) && readFileSync(versionFile, 'utf8').includes(BUNDLE_VERSION)) {
  console.log(`Bundle ${BUNDLE_VERSION} already in server/bundle`);
  process.exit(0);
}

let res;
try {
  res = await fetch(BUNDLE_URL);
} catch (err) {
  console.error(`Download failed: ${err instanceof Error ? err.message : String(err)}`);
  process.exit(1);
}
if (!res.ok) {
  console.error(`Download failed: HTTP ${res.status}`);
  process.exit(1);
}

const tmp = mkdtempSync(join(tmpdir(), 'matterport-bundle-'));
const zipPath = join(tmp, 'showcase-bundle.zip');
try {
  writeFileSync(zipPath, Buffer.from(await res.arrayBuffer()));
  rmSync(bundleDir, { recursive: true, force: true });
  await extract(zipPath, { dir: bundleDir });
} finally {
  rmSync(tmp, { recursive: true, force: true });
}

if (!existsSync(join(bundleDir, 'showcase.html'))) {
  console.error('Unexpected bundle layout');
  process.exit(1);
}
console.log(`Bundle ${BUNDLE_VERSION} ready in server/bundle (${countFiles(bundleDir)} files)`);
