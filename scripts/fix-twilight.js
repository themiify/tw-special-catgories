#!/usr/bin/env node
/**
 * Windows fix for @salla.sa/twilight-bundles sallaDemoPlugin.
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
  path.join(projectRoot, 'node_modules/@salla.sa/twilight-bundles/dist/vite-plugins/_demo.js'),
  path.join(projectRoot, 'node_modules/@salla.sa/twilight-bundles/dist/vite-plugins/_demo.cjs'),
];

const updatedSchemaMethod = `static schemaForComponent(e, t = !0) {
    let n = window.customComponentsSchema && window.customComponentsSchema[e];
    if (n) {
      try {
        const fields = JSON.parse(n);
        const d = localStorage.getItem(\`form-builder::data_\${e}\`);
        const data = d ? JSON.parse(d) : null;
        fields.forEach(f => {
          if (data && (f.id in data)) {
            if (f.type === 'boolean') {
              const boolVal = data[f.id] === true || String(data[f.id]).toLowerCase() === 'true' || data[f.id] === 1 || String(data[f.id]) === '1';
              f.value = boolVal;
              f.selected = boolVal;
            } else if (f.type === 'items') {
              f.value = data[f.id];
              f.selected = data[f.id];
            } else if (f.type === 'collection' && Array.isArray(data[f.id])) {
              f.value = data[f.id].map(item => {
                if (!item || typeof item !== 'object') return item;
                const clean = {};
                for (const [k, v] of Object.entries(item)) {
                  const shortKey = k.includes('.') ? k.split('.').pop() : k;
                  if (shortKey.endsWith('__type') && Array.isArray(v)) {
                    clean[shortKey] = (v[0] && typeof v[0] === 'object' && v[0].value) ? v[0].value : (typeof v[0] === 'string' ? v[0] : 'custom');
                  } else {
                    clean[shortKey] = v;
                  }
                }
                return clean;
              });
            } else {
              f.value = data[f.id];
            }
          } else if (f.type === 'boolean' && f.selected === undefined) {
            f.selected = Boolean(f.value);
          }
        });
        n = JSON.stringify(fields);
      } catch (err) {}
      const res = this.ensureHiddenComponentField(n, e);
      return t ? this.htmlSafeString(res) : res;
    }
    const a = localStorage.getItem(\`form-builder::\${e}\`), fallback = a ? this.ensureHiddenComponentField(a, e) : "";
    return t ? this.htmlSafeString(fallback) : fallback;
  }`;

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

  // Restore save-url and upload-url if they were emptied by shell expansion
  if (source.includes('save-url=""') || source.includes('save-url="/__salla_save"')) {
    source = source
      .replace(/save-url="[^"]*"/g, 'save-url="${window.formBuilderMockUrl}"')
      .replace(/upload-url="[^"]*"/g, 'upload-url="${window.formBuilderMockUrl}/uploader"');
    changed = true;
  }

  // Ensure schemaForComponent syncs boolean `selected` and unwraps variable-list `__type` arrays
  const methodPattern = /static\s+schemaForComponent\s*\([^{]+?\{[\s\S]*?(?=\s*static\s+ensureHiddenComponentField)/;
  if (methodPattern.test(source) && !source.includes(updatedSchemaMethod)) {
    source = source.replace(methodPattern, updatedSchemaMethod);
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
