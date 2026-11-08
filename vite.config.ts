//@ts-nocheck
declare global {
  const Salla: any;
}
import { defineConfig } from 'vite';
import { readFileSync } from 'node:fs';
import {
  sallaBuildPlugin,
  sallaDemoPlugin,
  sallaTransformPlugin,
} from '@salla.sa/twilight-bundles/vite-plugins';

/**
 * The demo shell only renders a component once its saved settings exist in
 * localStorage (`form-builder::data_<name>`). Build a seed script from the
 * field defaults in twilight-bundle.json and inject it through the plugin's
 * `js` option (a classic script that runs before the CDN modules render), so
 * previews show content immediately — no data is hardcoded in the component.
 *
 * IMPORTANT: the seed runs ONLY when there is no saved config yet. It never
 * overwrites an existing `form-builder::data_<name>`, so real user edits and
 * uploaded images survive page reloads and twilight-bundle.json changes. To
 * force fresh defaults again, remove that localStorage key in the demo.
 */
function buildDemoSeedScript(): string {
  const bundle = JSON.parse(readFileSync('./twilight-bundle.json', 'utf8'));
  const statements = (bundle.components || [])
    .filter((component) => Array.isArray(component.fields) && component.fields.length)
    .map((component) => {
      const data = Object.fromEntries(
        component.fields.map((field) => [field.id, field.value])
      );
      const json = JSON.stringify(data);
      return [
        `try {`,
        `if (!localStorage.getItem('form-builder::data_${component.name}')) {`,
        `localStorage.setItem('form-builder::data_${component.name}', ${JSON.stringify(json)});`,
        `}`,
        `} catch (e) {}`,
      ].join(' ');
    });
  return statements.join('\n');
}

export default defineConfig({
  server: {
    port: 5176,
    strictPort: true,
  },
  plugins: [
    sallaTransformPlugin(),
    sallaBuildPlugin(),
    sallaDemoPlugin({
      js: buildDemoSeedScript(),
      // Uncomment to preview only specific components
      // components: ['special-categories'],
    }),
  ],
});
