#!/usr/bin/env node
/**
 * Windows fix for @salla.sa/twilight-bundles sallaDemoPlugin.
 *
 * The demo plugin builds Vite filesystem URLs as `/@fs${path}` which breaks on
 * Windows drive-letter paths (e.g. `/@fsC:\...`). This script patches the
 * installed plugin to emit `/@fs/${path}` instead.
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

  const source = fs.readFileSync(file, 'utf8');

  if (!source.includes('/@fs${')) {
    console.log(`✅ Already patched or nothing to fix: ${path.basename(file)}`);
    continue;
  }

  const fixed = source.replace(/\/@fs\$\{/g, '/@fs/${');
  fs.writeFileSync(file, fixed, 'utf8');
  patched++;
  console.log(`✅ Patched: ${path.basename(file)}`);
}

if (patched > 0) {
  console.log('\n🎉 Done! Restart the dev server (`pnpm run dev`) to apply the fix.');
} else {
  console.log('\nℹ️ No changes were applied.');
}
