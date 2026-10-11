import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { writeFile } from 'node:fs/promises';
import { MENU } from '../public/menu.mjs';
const require=createRequire(import.meta.url);
const { chromium }=require(process.env.PLAYWRIGHT_MODULE||'playwright');
const browser=await chromium.launch({headless:true,channel:'chrome'});
const base=process.env.CATALOGUE_URL||'http://127.0.0.1:4173';
try{
  for(const lang of ['es','en','fr','tn']){
    const nojs=await browser.newPage({javaScriptEnabled:false,viewport:{width:360,height:800}});
    await nojs.goto(`${base}/${lang}/`);
    assert.equal(await nojs.locator('.food-card').count(),MENU.length);
    assert.equal(await nojs.locator('h1').count(),1);
    assert.ok(await nojs.locator('.local-cuisine').isVisible());
    await nojs.close();
    const page=await browser.newPage({viewport:{width:360,height:800}});
    const errors=[];page.on('pageerror',error=>errors.push(error.message));
    await page.goto(`${base}/${lang}/`);await page.locator('.language-switcher').waitFor();
    assert.equal(await page.locator('.food-card').count(),MENU.length);
    assert.equal(await page.locator('.local-cuisine h2').count(),1);
    for(const width of [360,768,1280]){
      await page.setViewportSize({width,height:800});
      assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1),`${lang} overflow at ${width}`);
    }
    if(lang==='es'){
      await page.setViewportSize({width:360,height:800});
      await page.locator('.local-cuisine').scrollIntoViewIfNeeded();
      await page.screenshot({path:'artifacts/seo-mobile-local-content.png'});
    }
    assert.deepEqual(errors,[]);
    await page.close();console.log(`${lang}: menu works with and without JS; mobile/tablet/desktop have no overflow`);
  }
}finally{await browser.close();}
