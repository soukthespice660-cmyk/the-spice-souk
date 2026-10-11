import {createRequire} from 'node:module';
import assert from 'node:assert/strict';
const require=createRequire(import.meta.url);
const {chromium}=require(process.env.PLAYWRIGHT_MODULE||'playwright');
const browser=await chromium.launch({headless:true,channel:'chrome'});
try{
  for(const locale of ['en','es','fr','tn']){
    const page=await browser.newPage({viewport:{width:360,height:800},bypassCSP:true,reducedMotion:'reduce'});
    await page.goto(`http://127.0.0.1:4173/${locale}/`);await page.locator('.language-switcher').waitFor();
    assert.ok(await page.locator('.hero .primary').evaluate(node=>node.getBoundingClientRect().bottom<=innerHeight),'Menu CTA visible on mobile entry');
    if(locale==='es')await page.screenshot({path:'artifacts/conversion-hero.png'});
    if(locale==='es'){await page.locator('#search').fill('cuscus');assert.equal(await page.locator('.food-card').count(),1);await page.locator('#search').fill('');}
    await page.locator('.food-card').filter({has:page.locator('h3',{hasText:locale==='tn'?'كسكسي':locale==='es'?'Cuscús':'Couscous'})}).getByRole('button').click();
    await page.locator('#product-dialog button[type=submit]').click();
    await page.locator('.floating-cart').click();assert.equal(await page.locator('.suggestion').count(),4);
    assert.equal(await page.locator('.suggestion').filter({hasText:locale==='tn'?'كسكسي':locale==='es'?'Cuscús':'Couscous'}).count(),0);
    assert.ok(!(await page.locator('#cart-extras').innerText()).includes('undefined'));
    const before=await page.locator('#subtotal').innerText();
    await page.locator('[data-suggestion-group=dishes] .suggestion').first().getByRole('button').click();await page.locator('#product-dialog button[type=submit]').click();
    assert.equal(await page.locator('#cart-dialog').isVisible(),true);assert.equal(await page.locator('.cart-line').count(),2);assert.notEqual(await page.locator('#subtotal').innerText(),before);
    await page.locator('.cart-line').first().getByRole('button',{name:/^(Remove|Quitar|Supprimer|نحي)/}).click();
    const extras=await page.locator('[data-suggestion-group=dishes] .suggestion').evaluateAll(nodes=>nodes.map(node=>node.dataset.productId));
    assert.deepEqual(extras,['tajin','libanaise'],'Starter-only cart offers a small portion and sandwich, never a large main');
    const drinkName=await page.locator('[data-suggestion-group=drinks] .suggestion h5').first().innerText();
    await page.locator('[data-suggestion-group=drinks] .suggestion').first().getByRole('button').click();
    assert.equal(await page.locator('#product-dialog').isVisible(),false);assert.equal(await page.locator('.cart-line').count(),2);
    assert.equal(await page.locator('.cart-line').last().locator('h3').innerText(),drinkName);
    assert.equal(await page.locator('[data-suggestion-group=drinks] .suggestion').filter({hasText:drinkName}).count(),0);
    await page.addScriptTag({path:require.resolve('axe-core/axe.min.js')});const audit=await page.evaluate(async()=>axe.run(document,{runOnly:{type:'tag',values:['wcag2a','wcag2aa','wcag21aa','wcag22aa']}}));assert.equal(audit.violations.length,0,JSON.stringify(audit.violations));
    if(locale==='es')await page.screenshot({path:'artifacts/conversion-cart.png'});
    await page.locator('.continue-shopping').click();assert.equal(await page.locator('#cart-dialog').isVisible(),false);
    const drink=page.locator('.food-card').filter({has:page.locator('h3',{hasText:'Sprite'})});await drink.getByRole('button').click();assert.equal(await page.locator('#product-dialog').isVisible(),false);
    await page.locator('.floating-cart').click();assert.equal(await page.locator('.cart-line').count(),3);await page.keyboard.press('Escape');
    for(const width of [360,768,1280]){await page.setViewportSize({width,height:900});assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));}
    console.log(`PASS ${locale}: mobile CTA, optional recommendations, correct totals, quick drinks and accessibility`);await page.close();
  }
}finally{await browser.close();}
