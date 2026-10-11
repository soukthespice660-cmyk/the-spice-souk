import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
const require=createRequire(import.meta.url);
const {chromium}=require(process.env.PLAYWRIGHT_MODULE||'playwright');
const browser=await chromium.launch({headless:true,channel:'chrome'});
try{
  for(const locale of ['en','es','fr','tn']){
    const page=await browser.newPage({viewport:{width:360,height:800},bypassCSP:true});
    await page.addInitScript(()=>{window.open=(url)=>{window.tipOrderUrl=url;return null;};});
    await page.goto(`${process.env.CATALOGUE_URL||'http://127.0.0.1:4173'}/${locale}/`);await page.locator('.language-switcher').waitFor();
    assert.ok((await page.locator('.minimum-order-note').innerText()).includes('25.00'));
    await page.evaluate(async()=>{const {MENU}=await import('/menu.mjs');const {addLine}=await import('/order.mjs');localStorage.setItem('spice-souk-cart-v1',JSON.stringify(addLine([],MENU,'couscous','lamb')));});
    await page.reload();await page.locator('.floating-cart').click();
    assert.equal(await page.locator('#order-button').isDisabled(),false);assert.equal(await page.locator('.minimum-cart-notice.reached').count(),1);
    assert.equal(await page.locator('#tip-amount').inputValue(),'500');
    assert.deepEqual(await page.locator('#tip-amount option').evaluateAll(options=>options.map(option=>option.value)),['0','200','500','1000','custom']);
    await page.locator('#tip-amount').selectOption('500');
    assert.equal(await page.locator('#order-total').innerText(),'€25.00');
    assert.equal(await page.locator('#order-button').isDisabled(),false);
    await page.locator('#tip-amount').selectOption('0');assert.equal(await page.locator('#order-button').isDisabled(),true);
    await page.locator('[value=delivery]').check();assert.equal(await page.locator('#order-button').isDisabled(),true);
    await page.locator('#tip-amount').selectOption('500');assert.equal(await page.locator('#order-button').isDisabled(),false);
    await page.locator('[value=takeaway]').check();
    await page.locator('[data-product-id=brik] button').click();await page.locator('#product-dialog button[type=submit]').click();
    assert.equal(await page.locator('#subtotal').innerText(),'€25.00');assert.equal(await page.locator('#order-button').isDisabled(),false);assert.equal(await page.locator('.minimum-cart-notice.reached').count(),1);
    assert.equal(await page.locator('#order-total').innerText(),'€30.00');
    await page.locator('#tip-amount').selectOption('1000');
    assert.equal(await page.locator('#order-total').innerText(),'€35.00');
    await page.locator('#tip-amount').selectOption('custom');
    assert.equal(await page.locator('#custom-tip').isVisible(),true);
    await page.locator('#custom-tip').fill('2.35');
    assert.equal(await page.locator('#order-total').innerText(),'€27.35');
    await page.locator('[name=name]').fill('Test Customer');
    await page.locator('[name=phone]').fill('+34600000000');
    await page.locator('[name=time]').fill('2099-01-01T12:00');
    await page.locator('#order-button').click();
    const message=await page.evaluate(()=>new URL(window.tipOrderUrl).searchParams.get('text'));
    assert.ok(message.includes('€2.35'));assert.ok(message.includes('€27.35'));
    await page.locator('#offers-reminder').press('Escape');
    await page.locator('#tip-amount').selectOption('0');
    assert.equal(await page.locator('#custom-tip').isVisible(),false);
    assert.equal(await page.locator('#order-total').innerText(),'€25.00');

    await page.locator('#tip-amount').selectOption('0');
    assert.equal(await page.locator('#order-total').innerText(),'€25.00');
    await page.locator('.cart-line').last().locator('.text-button').click();assert.equal(await page.locator('#order-button').isDisabled(),true);
    await page.addScriptTag({path:require.resolve('axe-core/axe.min.js')});const audit=await page.evaluate(async()=>axe.run(document,{runOnly:{type:'tag',values:['wcag2a','wcag2aa','wcag21aa','wcag22aa']}}));assert.equal(audit.violations.length,0,JSON.stringify(audit.violations));
    if(locale==='es')await page.screenshot({path:'artifacts/minimum-order.png'});
    console.log(`PASS ${locale}: minimum applies to both methods, exact threshold unlocks, removals lock and accessible messaging`);await page.close();
  }
}finally{await browser.close();}
