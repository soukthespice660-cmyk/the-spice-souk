import { readFile, readdir, access } from 'node:fs/promises';
import { spawnSync } from 'node:child_process';
import assert from 'node:assert/strict';
import { MENU, CATEGORIES } from '../public/menu.mjs';
for(const folder of ['public','scripts','tests'])for(const name of await readdir(folder)){if(name.endsWith('.mjs')){const result=spawnSync(process.execPath,['--check',`${folder}/${name}`],{encoding:'utf8'});assert.equal(result.status,0,result.stderr);}}
assert.equal(new Set(MENU.map(item=>item.id)).size,MENU.length,'Duplicate menu IDs');
for(const item of MENU){assert.ok(CATEGORIES.includes(item.category));assert.ok(item.price===null||(Number.isSafeInteger(item.price)&&item.price>=0));assert.ok(typeof item.available==='boolean');if(item.image)await access(`public/${item.image}`);for(const option of [...item.variants,...item.addons])assert.ok(option.price===null||(Number.isSafeInteger(option.price)&&option.price>=0));}
const css=await readFile('public/style.css','utf8');assert.ok(!css.includes('!important'));
const html=await readFile('public/index.html','utf8');assert.ok(!/style\s*=/.test(html));assert.ok(html.includes('name="description"')&&html.includes('rel="canonical"'));
console.log('Syntax, menu data, local image paths and source conventions checked.');
