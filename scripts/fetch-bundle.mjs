// Downloads the self-hosted Matterport Bundle into server/bundle/ (git-ignored).
// Usage: npm run fetch-bundle [-- --force]
//
// The new Bundle is unpacked and checked in a temp folder next to server/bundle/, then swapped in, so a failed or
// interrupted run leaves the previous Bundle working.
import { createWriteStream, existsSync, mkdtempSync, readFileSync, readdirSync, renameSync, rmSync, writeFileSync } from 'node:fs';
import { Readable } from 'node:stream';
import { pipeline } from 'node:stream/promises';
import { dirname, join, resolve } from 'node:path';
import extract from 'extract-zip';

const BUNDLE_VERSION = '26.10.4_webgl-1728-g1cd7e0997a';
const BUNDLE_URL = `https://static.matterport.com/showcase-sdk/bundle/${BUNDLE_VERSION}/showcase-bundle.zip`;

const bundleDir = resolve(import.meta.dirname, '../server/bundle');
// Written by this script after a good extract. A dotfile, so express.static never serves it.
const MARKER = '.fetched-version';
const force = process.argv.includes('--force');

/** A failure with a message ready to print. Thrown, not exited, so the temp folder is always cleaned up. */
class FetchError extends Error {}
function fail(message) {
  throw new FetchError(message);
}

function countFiles(dir) {
  return readdirSync(dir, { recursive: true, withFileTypes: true }).filter((e) => e.isFile()).length;
}

/** The folder in `root` that holds showcase.html: `root` itself, or its only subfolder if the zip wraps everything in one. */
function findViewerRoot(root) {
  if (existsSync(join(root, 'showcase.html'))) return root;
  const entries = readdirSync(root, { withFileTypes: true });
  if (entries.length === 1 && entries[0].isDirectory() && existsSync(join(root, entries[0].name, 'showcase.html'))) {
    return join(root, entries[0].name);
  }
  return undefined;
}

const markerPath = join(bundleDir, MARKER);
if (!force && existsSync(markerPath) && readFileSync(markerPath, 'utf8').trim() === BUNDLE_VERSION) {
  console.log(`Bundle ${BUNDLE_VERSION} already in server/bundle (use --force to fetch again)`);
  process.exit(0);
}

// Same parent as bundleDir, so the final rename never crosses drives.
const tmp = mkdtempSync(join(dirname(bundleDir), '.bundle-tmp-'));
try {
  const zipPath = join(tmp, 'showcase-bundle.zip');
  const unpacked = join(tmp, 'unpacked');

  let res;
  try {
    res = await fetch(BUNDLE_URL);
  } catch (err) {
    fail(`Download failed: ${err instanceof Error ? err.message : String(err)}`);
  }
  if (!res.ok || !res.body) fail(`Download failed: HTTP ${res.status}`);
  try {
    await pipeline(Readable.fromWeb(res.body), createWriteStream(zipPath));
  } catch (err) {
    fail(`Download interrupted: ${err instanceof Error ? err.message : String(err)}`);
  }

  try {
    await extract(zipPath, { dir: unpacked });
  } catch (err) {
    fail(`Could not unpack the Bundle: ${err instanceof Error ? err.message : String(err)}`);
  }
  const viewerRoot = findViewerRoot(unpacked);
  if (!viewerRoot) fail('Unexpected bundle layout: no showcase.html. server/bundle was left as it was.');
  writeFileSync(join(viewerRoot, MARKER), `${BUNDLE_VERSION}\n`);

  // Swap: move the old Bundle aside, move the new one in, then delete the old one.
  const old = join(tmp, 'old');
  if (existsSync(bundleDir)) renameSync(bundleDir, old);
  try {
    renameSync(viewerRoot, bundleDir);
  } catch (err) {
    if (existsSync(old)) renameSync(old, bundleDir);
    throw err;
  }
  console.log(`Bundle ${BUNDLE_VERSION} ready in server/bundle (${countFiles(bundleDir)} files)`);
} catch (err) {
  if (!(err instanceof FetchError)) throw err;
  console.error(err.message);
  process.exitCode = 1;
} finally {
  rmSync(tmp, { recursive: true, force: true });
}
