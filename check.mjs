import {readFile, readdir, access} from 'node:fs/promises';
import {resolve, dirname} from 'node:path';
import {fileURLToPath} from 'node:url';
const root=fileURLToPath(new URL('./',import.meta.url));
const required=['index.html','experience.html','packages.html','about.html','gallery.html','faq.html','contact.html','privacy.html','terms.html','404.html','styles.css','site.js','_worker.js','_routes.json'];
const failures=[];
async function check(ref, from) {
  if(/^(?:https?:|mailto:|tel:|data:|#)/.test(ref)) return;
  const clean=ref.split(/[?#]/)[0];
  if(!clean || clean==='/' || clean.startsWith('/api/'))return;
  const path=resolve(clean.startsWith('/')?root:dirname(from),clean.replace(/^\//,''));
  if(!path.startsWith(root)) { failures.push(`Reference leaves site: ${ref}`);return; }
  try {await access(path);} catch {failures.push(`${from.split('/').pop()}: missing ${ref}`);}
}
for(const name of required) await check(name,resolve(root,'index.html'));
for(const name of await readdir(root)) {
  if(!/\.(html|css)$/.test(name)) continue;
  const path=resolve(root,name),source=await readFile(path,'utf8');
  for(const match of source.matchAll(/(?:src|href)="([^"]+)"/g)) await check(match[1],path);
  for(const match of source.matchAll(/srcset="([^"]+)"/g)) for(const item of match[1].split(',')) await check(item.trim().split(/\s+/)[0],path);
  for(const match of source.matchAll(/url\(['"]?([^)'"\s]+)['"]?\)/g)) await check(match[1],path);
  if(/images\.unsplash\.com|fonts\.googleapis\.com|fonts\.gstatic\.com/.test(source)) failures.push(`${name}: external display dependency`);
}
for(const name of ['index.html','packages.html']) {
  const html=await readFile(resolve(root,name),'utf8');
  for(const value of ['£60','£75','£100','30 minutes','45 minutes','60 minutes','up to 12 people']) if(!html.includes(value))failures.push(`${name}: missing ${value}`);
}
if(failures.length){console.error(failures.join('\n'));process.exit(1);}
console.log('PASS: every page, image, responsive image, stylesheet, script and font reference exists; package details agree.');
