// Renders preview stills: node scripts/stills.mjs 30 90 150 ...  -> cache/stills/f0030.jpg
import { bundle } from '@remotion/bundler';
import { renderStill, selectComposition } from '@remotion/renderer';
import path from 'node:path';
import fs from 'node:fs';

const frames = process.argv.slice(2).map(Number);
const out = path.resolve('cache/stills');
fs.mkdirSync(out, { recursive: true });
const serveUrl = await bundle({ entryPoint: path.resolve('src/index.ts') });
const composition = await selectComposition({ serveUrl, id: 'Promo', inputProps: {} });
for (const frame of frames) {
  const file = path.join(out, `f${String(frame).padStart(4, '0')}.jpg`);
  await renderStill({ serveUrl, composition, frame, output: file, imageFormat: 'jpeg', jpegQuality: 80, chromiumOptions: { gl: 'angle' }, scale: 0.5 });
  console.log('still', file);
}
