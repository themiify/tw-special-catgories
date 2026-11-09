#!/usr/bin/env node
/**
 * Windows and restart fix for @salla.sa/twilight-bundles sallaDemoPlugin.
 *
 * 1. The demo plugin builds Vite filesystem URLs as `/@fs${path}` which breaks on
 *    Windows drive-letter paths (e.g. `/@fsC:\...`). This script patches the
 *    installed plugin to emit `/@fs/${path}` instead.
 * 2. On server restarts, Vite preserves `server.open`, which caused sallaDemoPlugin's
 *    `configResolved` to exit early and fail to regenerate `.salla-temp/index.html`.
 *
 * Usage: pnpm run fix-twilight
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const projectRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

const targets = [
  path.join(projectRoot, 'node_modules/@salla.sa/twilight-bundles/dist/vite-plugins/demo.js'),
  path.join(projectRoot, 'node_modules/@salla.sa/twilight-bundles/dist/vite-plugins/demo.cjs'),
];

let patched = 0;

for (const file of targets) {
  if (!fs.existsSync(file)) {
    console.warn(`⚠️ Not found (skipping): ${file}`);
    continue;
  }

  let source = fs.readFileSync(file, 'utf8');
  let changed = false;

  if (source.includes('/@fs${')) {
    source = source.replace(/\/@fs\$\{/g, '/@fs/${');
    changed = true;
  }

  const openCheckRegex = /if\s*\(\([A-Za-z]\s*=\s*t\.server\)\s*!=\s*null\s*&&\s*[A-Za-z]\.open\)\s*return;/g;
  if (openCheckRegex.test(source)) {
    source = source.replace(openCheckRegex, '/* bypass open check on restart */');
    changed = true;
  }

  if (changed) {
    fs.writeFileSync(file, source, 'utf8');
    patched++;
    console.log(`✅ Patched: ${path.basename(file)}`);
  } else {
    console.log(`✅ Already patched or nothing to fix: ${path.basename(file)}`);
  }
}

if (patched > 0) {
  console.log('\n🎉 Done! Restart the dev server (`pnpm run dev`) to apply the fix.');
} else {
  console.log('\nℹ️ No changes were applied.');
}
