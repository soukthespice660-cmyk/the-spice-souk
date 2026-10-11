import {createRequire} from 'node:module';
import assert from 'node:assert/strict';
const require=createRequire(import.meta.url);
const {chromium}=require(process.env.PLAYWRIGHT_MODULE||'playwright');
const browser=await chromium.launch({headless:true,channel:'chrome'});
try{
 const context=await browser.newContext({bypassCSP:true});const page=await context.newPage();const errors=[];page.on('pageerror',error=>errors.push(error.message));
 for(const [code,name,option] of [['en','Couscous','Chicken'],['fr','Couscous','Poulet'],['es','Cuscús','Pollo'],['tn','كسكسي','دجاج']]){
  await page.goto(`http://127.0.0.1:4173/${code}/#menu`);await page.locator('.language-switcher').waitFor();
  assert.equal(await page.locator('html').getAttribute('lang'),code==='tn'?'aeb':code);assert.equal(await page.locator('html').getAttribute('dir'),code==='tn'?'rtl':'ltr');
  const selector=page.locator('.language-switcher select');assert.equal(await selector.inputValue(),code);assert.equal(await selector.locator('option').count(),4);assert.ok(await selector.getAttribute('aria-label'));
  assert.equal(await page.locator('.food-card').count(),24);assert.equal(await page.locator('link[hreflang]').count(),5);
  assert.equal(await page.getByRole('heading',{name,exact:true}).count(),1);
  assert.ok(!(await page.locator('#food-grid').innerText()).includes('Hacendado'));
  if(code==='tn'){for(const name of ['Sprite — Can · 330 ml','Coca-Cola Zero Sugar — Bottle · 500 ml','Lemon Iced Tea — Can · 330 ml','Zero Green Tea — Can · 330 ml'])assert.equal(await page.getByRole('heading',{name,exact:true}).count(),1);}
  const mechouiya=page.locator('.food-card').filter({has:page.getByRole('heading',{name:{en:'Mechouiya Salad',fr:'Salade Mechouiya',es:'Ensalada Mechouiya',tn:'سلاطة مشوية'}[code],exact:true})});
  assert.ok((await mechouiya.innerText()).includes({en:'Grilled Vegetable Salad.',fr:'Salade De Légumes Grillés.',es:'Ensalada De Verduras Asadas.',tn:'مشوية'}[code]));
  for(const width of [360,768,1280]){await page.setViewportSize({width,height:900});assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),true,`${code} overflow ${width}`);}
  if(code!=='en'){assert.equal(await page.getByRole('button',{name:'Choose options — Couscous',exact:true}).count(),0);assert.equal(await page.getByRole('button',{name:'Close',exact:true}).count(),0);}
  await page.locator('.food-card').filter({has:page.getByRole('heading',{name,exact:true})}).getByRole('button').click();await page.getByRole('radio',{name:new RegExp(option)}).check();
  await page.locator('#product-dialog button[type=submit]').click();await page.locator('.bag-button').click();assert.ok((await page.locator('#cart-body').innerText()).includes(option));await page.keyboard.press('Escape');
  const savedCart=await page.evaluate(()=>localStorage.getItem('spice-souk-cart-v1'));const nextLanguage=code==='en'?'fr':'en';
  await selector.selectOption(nextLanguage);await page.waitForURL(`**/${nextLanguage}/#menu`);await page.locator('.food-card').first().waitFor();assert.equal(await page.evaluate(()=>localStorage.getItem('spice-souk-cart-v1')),savedCart);
  await page.locator('.language-switcher select').selectOption(code);await page.waitForURL(`**/${code}/#menu`);await page.locator('.food-card').first().waitFor();
  const result=await page.evaluate(async()=>{const {MENU}=await import('/menu.mjs');const {localizedMenu,translate}=await import('/locale.mjs');const {addLine,orderMessage}=await import('/order.mjs');const menu=localizedMenu(MENU).map(item=>({...item,price:200,variants:item.variants.map(v=>({...v,price:1100})),addons:item.addons.map(a=>({...a,price:100}))}));const cart=addLine([],menu,'couscous','chicken',[]);return orderMessage(cart,menu,{name:'Lamb',fulfilment:'delivery',address:'Calle Test 12',time:'2026-10-12T12:00',phone:'+34612345678',notes:'Leave at door'},translate);});
  assert.ok(result.includes(option));assert.ok(result.includes('Calle Test 12'));assert.ok(result.includes('Lamb'));assert.ok(result.includes('Leave at door'));if(code!=='en')assert.ok(!result.includes('ORDER REQUEST'));
  await page.setViewportSize({width:360,height:900});await page.locator('#menu').scrollIntoViewIfNeeded();await page.screenshot({path:`artifacts/language-${code}.png`,fullPage:true});
  await page.addScriptTag({path:require.resolve('axe-core/axe.min.js')});const audit=await page.evaluate(()=>axe.run(document,{runOnly:{type:'tag',values:['wcag2a','wcag2aa','wcag21aa','wcag22aa']}}));assert.equal(audit.violations.length,0,JSON.stringify(audit.violations));
  console.log(`PASS ${code}: localized dishes/options, shared cart, WhatsApp message, three widths and accessibility`);
 }
 assert.deepEqual(errors,[]);await context.close();
}finally{await browser.close();}
