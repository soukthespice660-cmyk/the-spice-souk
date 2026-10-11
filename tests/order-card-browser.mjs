import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
import {readFile} from 'node:fs/promises';
import {madridDateTime} from '../public/order.mjs';
const require=createRequire(import.meta.url);
const {chromium}=require(process.env.PLAYWRIGHT_MODULE||'playwright');
const browser=await chromium.launch({headless:true,channel:'chrome'});
try {
  for(const language of ['es','tn']) {
    const page=await browser.newPage({viewport:{width:360,height:800}});
    const csp=(await readFile('public/_headers','utf8')).match(/Content-Security-Policy: (.+)/)[1].trim();
    await page.route('**/*',async route=>{
      if(!route.request().isNavigationRequest()){await route.continue();return;}
      const response=await route.fetch();await route.fulfill({response,headers:{...response.headers(),'content-security-policy':csp}});
    });
    await page.addInitScript(()=>{
      Object.defineProperty(navigator,'canShare',{value:({files})=>files.every(file=>file.type==='image/png')});
      Object.defineProperty(navigator,'share',{value:async({files})=>{window.sharedCardNames=files.map(file=>file.name);}});
    });
    const errors=[];page.on('pageerror',error=>errors.push(error.message));
    await page.goto(`http://127.0.0.1:4173/${language}/`);
    await page.evaluate(async()=>{
      const {MENU}=await import('/menu.mjs'),{addLine}=await import('/order.mjs');
      let cart=addLine([],MENU,'couscous','lamb',[],2);
      cart=addLine(cart,MENU,'brik','',[]);
      cart=addLine(cart,MENU,'mechouiya');
      localStorage.setItem('spice-souk-cart-v1',JSON.stringify(cart));
    });
    await page.reload();await page.locator('.bag-button').click();
    await page.locator('#preview-order-card').click();
    assert.equal(await page.locator('#order-card-dialog').isVisible(),false,'required fields prevent generation');
    await page.locator('[name=name]').fill('Cliente de prueba');
    await page.locator('[name=time]').fill(madridDateTime(Date.now()+48*3600000));
    await page.locator('[name=phone]').fill('+34612345678');
    await page.locator('[value=delivery]').check();
    await page.locator('[name=address]').fill('Calle de Prueba 12, 28001, piso 2');await page.locator('[name=addressConfirmed]').check();
    await page.locator('[name=notes]').fill('Pedido de prueba, no enviar');
    await page.locator('#preview-order-card').click();
    await page.locator('#order-card-preview img').waitFor();
    assert.equal(await page.locator('#order-card-preview img').count(),1);
    await page.waitForFunction(()=>document.querySelector('#order-card-preview img').naturalWidth===960);
    await page.locator('#share-order-card').click();
    assert.deepEqual(await page.evaluate(()=>window.sharedCardNames),['The-Spice-Souk-order-1.png']);
    assert.equal(await page.locator('#order-card-dialog').evaluate(node=>node.scrollWidth<=node.clientWidth),true);
    const downloadEvent=page.waitForEvent('download');await page.locator('#download-order-card').click();
    const download=await downloadEvent;
    assert.equal(download.suggestedFilename(),'The-Spice-Souk-order-1.png');
    await download.saveAs(`artifacts/order-card-${language}.png`);
    await page.screenshot({path:`artifacts/order-card-mobile-${language}.png`});
    await page.keyboard.press('Escape');
    await page.waitForFunction(()=>document.querySelector('#order-card-preview').children.length===0);
    assert.equal(await page.locator('#order-card-preview img').count(),0);
    assert.equal(await page.evaluate(()=>document.activeElement.id),'preview-order-card');
    assert.equal(await page.evaluate(()=>Object.keys(localStorage).some(key=>/name|phone|address|notes/.test(key))),false);
    const pages=await page.evaluate(async()=>{
      const {MENU}=await import('/menu.mjs'),{addLine}=await import('/order.mjs');
      const {createOrderCards}=await import('/order-card.mjs');
      const {localizedMenu,translate,language}=await import('/locale.mjs');
      const menu=localizedMenu(MENU);let cart=[];
      for(const item of menu.filter(item=>!item.variantRequired&&item.price!==null).slice(0,7))cart=addLine(cart,menu,item.id);
      const files=await createOrderCards(cart,menu,{name:'Test',fulfilment:'takeaway',time:'2026-10-12T12:00',phone:'+34612345678',notes:'x'.repeat(500)},translate,language==='tn');
      return Promise.all(files.map(async file=>{const image=await createImageBitmap(file);return {size:file.size,width:image.width,height:image.height,type:file.type};}));
    });
    assert.equal(pages.length,2);assert.ok(pages.every(p=>p.type==='image/png'&&p.width===960&&p.height>400&&p.height<6000&&p.size>50000));
    assert.deepEqual(errors,[]);console.log(`PASS ${language}: mobile preview, validation, PNG download, pagination, focus and privacy`);
    await page.close();
  }
}finally{await browser.close();}
