import { readFile, writeFile, rm } from 'node:fs/promises';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
let html = await readFile(resolve(root, '.standalone/index.html'), 'utf8');
for (const match of [...html.matchAll(/<script\b[^>]*src="([^"]+)"[^>]*><\/script>/g)]) {
  const code = await readFile(resolve(root, '.standalone', match[1].replace(/^\//, '')), 'utf8');
  html = html.replace(match[0], () => `<script type="module">${code.replaceAll('</script', '<\\/script')}</script>`);
}
for (const match of [...html.matchAll(/<link\b[^>]*rel="stylesheet"[^>]*href="([^"]+)"[^>]*>/g)]) {
  const css = await readFile(resolve(root, '.standalone', match[1].replace(/^\//, '')), 'utf8');
  html = html.replace(match[0], () => `<style>${css}</style>`);
}
const icon = await readFile(resolve(root, 'public/favicon.svg'), 'utf8');
html = html.replace(/href="[^"]*favicon.svg"/, `href="data:image/svg+xml,${encodeURIComponent(icon)}"`);
if (/<(?:script|link)\b[^>]*(?:src|href)="\/?assets\//.test(html)) throw new Error('Standalone packaging left an external app asset.');
await writeFile(resolve(root, 'standalone.html'), html);
await rm(resolve(root, '.standalone'), { recursive: true });
console.log('Created standalone.html: a self-contained fictional-case demo, without a service worker.');
