import './check.mjs';
import { copyFile, mkdir, readdir, rm } from 'node:fs/promises';

const root = new URL('./', import.meta.url);
const output = new URL('./dist/', root);
const files = await readdir(root, { withFileTypes: true });
const pagesFiles = new Set(['_headers', '_routes.json', '_worker.js', 'robots.txt']);
const assetExtension = /\.(?:html|css|svg|webp|ttf)$/;

await rm(output, { recursive: true, force: true });
await mkdir(output);
for (const file of files) {
  const { name } = file;
  if (file.isFile() && (pagesFiles.has(name) || name === 'site.js' || assetExtension.test(name) || /^LICENSE-.+\.txt$/.test(name))) {
    await copyFile(new URL(name, root), new URL(name, output));
  }
}
console.log('Bridal Flow built to dist/');
