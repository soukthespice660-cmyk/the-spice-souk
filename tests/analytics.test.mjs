import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { runInNewContext } from 'node:vm';
import { ANALYTICS_TEXT } from '../public/analytics-i18n.mjs';
const source=readFileSync(new URL('../public/analytics.mjs',import.meta.url),'utf8').replace(/^import .*;\r?\n/gm,'');
function visit(saved=null){
 const elements=[];const deleted=[];let value=saved;
 const make=tag=>{const e={tag,children:[],listeners:{},append(...nodes){this.children.push(...nodes);},setAttribute(){},addEventListener(name,fn){this.listeners[name]=fn;},focus(){}};elements.push(e);return e;};
 const document={head:make('head'),body:make('body'),referrer:'https://example.com/private?email=secret',title:'Spice Souk',createElement:make,querySelector(){return null;}};
 Object.defineProperty(document,'cookie',{get:()=> '_ga=123; _ga_TEST=456; basket=keep',set:v=>deleted.push(v)});
 const location={origin:'https://spicesouk.pages.dev',pathname:'/es/',hostname:'spicesouk.pages.dev',reload(){this.reloaded=true;}};
 const window={};const localStorage={getItem:()=>value,setItem:(k,v)=>{value=v;}};
 runInNewContext(source,{window,document,location,localStorage,URL,Date,language:'es',ANALYTICS_TEXT});
 return {window,document,location,elements,deleted,stored:()=>JSON.parse(value),click:label=>elements.find(e=>e.textContent===label).listeners.click(),scripts:()=>document.head.children.filter(e=>e.tag==='script')};
}
test('analytics stays unloaded until accepted and rejection persists',()=>{
 const v=visit();assert.equal(v.scripts().length,0);v.click(ANALYTICS_TEXT.es.reject);assert.equal(v.scripts().length,0);assert.equal(v.stored().choice,'denied');assert.equal(visit(JSON.stringify(v.stored())).scripts().length,0);
});
test('accept loads once, sends sanitized page view, and withdrawal disables it',()=>{
 const v=visit();v.click(ANALYTICS_TEXT.es.accept);v.click(ANALYTICS_TEXT.es.accept);assert.equal(v.scripts().length,1);
 const event=v.window.dataLayer.find(a=>a[0]==='event');assert.equal(event[2].page_location,'https://spicesouk.pages.dev/es/');assert.equal(event[2].page_referrer,'https://example.com');
 v.click(ANALYTICS_TEXT.es.reject);assert.equal(v.window['ga-disable-G-DWWVDJSC6E'],true);assert.equal(v.location.reloaded,true);assert.ok(v.deleted.length>0);assert.ok(v.deleted.every(c=>!c.startsWith('basket')));
});
test('expired, malformed and future consent never enables analytics',()=>{
 for(const saved of ['bad',JSON.stringify({choice:'granted',time:0}),JSON.stringify({choice:'granted',time:Date.now()+100000}),JSON.stringify({choice:'granted'})])assert.equal(visit(saved).scripts().length,0);
 assert.equal(visit(JSON.stringify({choice:'granted',time:Date.now()})).scripts().length,1);
});
