import {createRequire} from 'node:module';
import assert from 'node:assert/strict';
const require=createRequire(import.meta.url);
const {chromium}=require(process.env.PLAYWRIGHT_MODULE||'playwright');
const browser=await chromium.launch({headless:true,channel:'chrome'});
try {
  const page=await browser.newPage({viewport:{width:360,height:800},bypassCSP:true,reducedMotion:'reduce'});
  for(const locale of ['es','en','fr','tn']) {
    await page.goto(`http://127.0.0.1:4173/${locale}/#menu`);
    await page.locator('.language-switcher').waitFor();
    await page.locator('.floating-cart').click();assert.equal(await page.locator('#cart-dialog').isVisible(),true);await page.keyboard.press('Escape');
    assert.ok(await page.locator('.floating-cart').evaluate(node=>{const r=node.getBoundingClientRect();return r.right<=innerWidth&&r.left>innerWidth/2&&r.bottom<=innerHeight&&r.top>innerHeight-100;}));
    for(const view of ['grid','list']) {
      await page.locator(`[data-menu-view=${view}]`).click();
      assert.equal(await page.locator(`[data-menu-view=${view}]`).getAttribute('aria-pressed'),'true');
      assert.equal(await page.locator('#food-grid').getAttribute('data-view'),view);
      assert.equal(await page.locator('.food-card').count(),24);
      assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),true);
      const cards=await page.locator('.food-card').evaluateAll(nodes=>nodes.slice(0,2).map(node=>({x:node.offsetLeft,y:node.offsetTop})));
      assert.equal(cards[0].y===cards[1].y,view==='grid');
      await page.locator('[data-products-jump=end]').click();
      assert.ok(await page.locator('.food-card').last().evaluate(node=>node.getBoundingClientRect().bottom<=innerHeight-100),'Last product clears the mobile bag');
      assert.ok(await page.locator('.product-navigation').evaluate(node=>node.getBoundingClientRect().top>=0),'Navigation remains visible');
      await page.locator('[data-products-jump=start]').click();
      assert.ok(await page.locator('.food-card').first().evaluate(node=>{const top=node.getBoundingClientRect().top;return top>=document.querySelector('.product-navigation').getBoundingClientRect().bottom&&top<160;}),'First product clears the navigation');
      await page.locator('#search').fill('NO MATCH');
      assert.equal(await page.locator('.empty-results').count(),1);
      await page.locator('#search').fill('');
      assert.equal(await page.locator('#food-grid').getAttribute('data-view'),view);
      await page.reload();await page.locator('.language-switcher').waitFor();
      assert.equal(await page.locator('#food-grid').getAttribute('data-view'),view);
      await page.addScriptTag({path:require.resolve('axe-core/axe.min.js')});
      const violations=await page.evaluate(async()=> (await axe.run(document,{runOnly:{type:'tag',values:['wcag2a','wcag2aa','wcag21aa','wcag22aa']}})).violations);
      assert.equal(violations.length,0,JSON.stringify(violations));
      if(locale==='es') {await page.locator('.menu-view-switch').scrollIntoViewIfNeeded();await page.screenshot({path:`artifacts/mobile-${view}.png`});}
    }
    await page.locator('.food-card').first().getByRole('button').click();
    assert.equal(await page.locator('#product-dialog').isVisible(),true);await page.keyboard.press('Escape');
    for(const width of [768,1280]) {await page.setViewportSize({width,height:900});assert.equal(await page.locator('.menu-view-switch').isVisible(),false);assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),true);}
    await page.setViewportSize({width:360,height:800});
    console.log(`PASS ${locale}: grid/list, persistence, search, product modal, accessibility and desktop`);
  }
} finally {await browser.close();}
