import { test } from 'node:test';
import assert from 'node:assert/strict';
import { MENU } from '../public/menu.mjs';
import {tipFromEuros} from '../public/order.mjs';
import { addLine, changeQuantity, hydrateCart, subtotal, validateOrder as validateAtTime, madridTimestamp, minimumOrderTime, orderMessage, whatsappUrl, googleMapsUrl } from '../public/order.mjs';

const validateOrder=(...args)=>validateAtTime(...args,Date.parse('2026-10-09T12:00:00Z'),0);
const menu = [{ id: 'confirmed', name: 'Confirmed test item', category: 'Couscous', price: 1050, available: true, placeholder: false, variants: [{ id: 'large', name: 'Large', price: 250 }], addons: [{ id: 'extra', name: 'Extra', price: 125 }] }, { id: 'sold', name: 'Sold out', price: 500, available: false, variants: [], addons: [] }, { id: 'preview', name: 'Placeholder', price: null, placeholder: true, available: true, variants: [], addons: [] }];
const customer = { name: 'Ana', fulfilment: 'delivery', address: 'Calle Test 4', addressConfirmed:'on', time: '2026-10-10T19:30', phone: '+34 600000000', notes: 'No salt & less spice' };
test('optional tips are separate from food, validated and count towards the minimum',()=>{
  const cart=addLine([],MENU,'couscous','lamb');
  assert.equal(subtotal(cart,MENU),2000);
  assert.match(orderMessage(cart,MENU,{...customer,tipCents:'500'}),/Tip: €5.00\nTotal before delivery: €25.00/);
  assert.match(orderMessage(cart,MENU,customer),/Tip: €0.00\nTotal before delivery: €20.00/);
  for(const fulfilment of ['delivery','takeaway'])assert.ok(!validateAtTime(cart,MENU,{...customer,fulfilment,tipCents:'500'},'34600000000',Date.parse('2026-10-09T12:00:00Z')).includes('Your order is below the minimum amount.'));
  assert.equal(tipFromEuros('2.35'),235);assert.equal(tipFromEuros('2,35'),235);
  assert.ok(Number.isNaN(tipFromEuros('2.345')));
  assert.match(orderMessage(cart,MENU,{...customer,tipCents:235}),/Tip: €2.35\nTotal before delivery: €22.35/);
  for(const tipCents of ['-100','100001','1.5','NaN','Infinity']){
    assert.ok(validateOrder(cart,MENU,{...customer,tipCents},'34600000000').includes('Choose a valid tip amount.'));
    assert.throws(()=>orderMessage(cart,MENU,{...customer,tipCents}));
  }
});
test('25 euro minimum applies to delivery and takeaway at the exact cent boundary',()=>{
  for(const fulfilment of ['delivery','takeaway'])for(const price of [2499,2500,2501]){
    const priced=[{...menu[0],price}];const cart=addLine([],priced,'confirmed');
    const errors=validateAtTime(cart,priced,{...customer,fulfilment},'34600000000',Date.parse('2026-10-09T12:00:00Z'));
    assert.equal(errors.includes('Your order is below the minimum amount.'),price<2500);
  }
  const combined=addLine(addLine([],MENU,'couscous','chicken'),MENU,'brik','',[],2);
  assert.equal(subtotal(combined,MENU),2500);
  assert.ok(!validateAtTime(combined,MENU,customer,'34600000000',Date.parse('2026-10-09T12:00:00Z')).includes('Your order is below the minimum amount.'));
});

test('supplements belong to specific dishes and invalid pairings cannot enter an order',()=>{
  for(const id of ['couscous','pasta','tajin',...MENU.filter(item=>item.category==='Drinks').map(item=>item.id)])assert.deepEqual(MENU.find(item=>item.id===id).addons,[]);
  assert.deepEqual(MENU.find(item=>item.id==='brik').addons,[]);assert.throws(()=>addLine([],MENU,'brik','',['tuna']));assert.equal(subtotal(addLine([],MENU,'brik'),MENU),500);
  assert.equal(subtotal(addLine([],MENU,'tajin','tuna',[],1),MENU),300);
  assert.deepEqual(MENU.find(item=>item.id==='riz-djerbien').addons.map(option=>option.id),['merguez']);
  for(const id of ['chorba-frik','loubya','kamouniya','ojja'])assert.deepEqual(MENU.find(item=>item.id===id).addons.map(option=>option.id),['bread']);
  assert.throws(()=>addLine([],MENU,'couscous','chicken',['fries'],1));
  assert.throws(()=>addLine([],MENU,'ojja','merguez',['merguez'],1));
  assert.equal(addLine([],MENU,'kafteji','sandwich',['merguez'],1).length,1);
  assert.throws(()=>addLine([],MENU,'kafteji','sandwich',['bread'],1));
  assert.equal(addLine([],MENU,'kafteji','plate',['bread'],1).length,1);
  assert.deepEqual(MENU.find(item=>item.id==='libanaise').addons.map(option=>option.id),['fries','harissa']);
});
test('full option prices vary by meat and supplements are added once',()=>{
  const options=[{...menu[0],id:'couscous',price:null,variantRequired:true,variantPriceMode:'full',variants:[{id:'lamb',name:'Lamb',price:1500},{id:'chicken',name:'Chicken',price:1100}]}];
  let cart=addLine([],options,'couscous','lamb',['extra'],2);
  cart=addLine(cart,options,'couscous','chicken',[],1);
  assert.equal(subtotal(cart,options),4350);
  assert.match(orderMessage(cart,options,customer),/Couscous|Confirmed test item/);
  assert.equal(subtotal(addLine([],options,'couscous','lamb',[],1),[{...options[0],variants:[{id:'lamb',name:'Lamb',price:null}]}]),null);
});

test('confirmed supplements and Libanaise fillings have the requested prices',()=>{
  const sandwich=MENU.find(item=>item.id==='libanaise');
  assert.deepEqual(sandwich.variants.map(option=>[option.id,option.price]),[['chicken',900],['beef',1100],['merguez',1100]]);
  assert.equal(subtotal(addLine([],MENU,'libanaise','merguez',['fries','harissa'],2),MENU),2900);
  const minimumCart=addLine(addLine(addLine([],MENU,'libanaise','chicken',[],1),MENU,'libanaise','beef',[],1),MENU,'brik','',[],1);
  assert.equal(subtotal(minimumCart,MENU),2500);
  assert.equal(subtotal(addLine([],MENU,'kafteji','plate',['merguez','bread','harissa'],1),MENU),1200);
  assert.equal(subtotal(addLine([],MENU,'riz-djerbien','',['merguez'],2),MENU),2700);
  assert.ok(MENU.every(item=>item.addons.every(option=>option.price!==null)));
  assert.ok(!MENU.find(item=>item.id==='kafteji').addons.some(option=>option.id==='eggs'));
  assert.throws(()=>addLine([],MENU,'libanaise','lamb'));
});
test('existing meat products and kafteji choices migrate without losing quantities',()=>{
  const options=[{...menu[0],id:'couscous',legacyIds:{'couscous-lamb':'large'}},{...menu[0],id:'kafteji',legacyVariants:{'with-merguez':{variant:'large',addons:['extra']}}}];
  const cart=hydrateCart(JSON.stringify([{id:'couscous-lamb',quantity:2,addons:[]},{id:'kafteji',variant:'with-merguez',quantity:3,addons:[]}]),options);
  assert.equal(cart.length,2);assert.equal(cart[0].id,'couscous');assert.equal(cart[0].variant,'large');assert.equal(cart[0].quantity,2);assert.deepEqual(cart[1].addons,['extra']);assert.equal(cart[1].quantity,3);
});
test('24-hour deadline uses elapsed time in Madrid and rejects DST gaps and ambiguity', () => {
  const cart=addLine([],menu,'confirmed','',[],3);
  const now=Date.parse('2026-10-09T12:00:00Z');
  assert.ok(validateAtTime(cart,menu,{...customer,time:'2026-10-10T13:59'},'34600000000',now).some(e=>e.includes('24 hours')));
  assert.deepEqual(validateAtTime(cart,menu,{...customer,time:'2026-10-10T14:00'},'34600000000',now),[]);
  assert.equal(minimumOrderTime(now+1000),'2026-10-10T14:01');
  assert.equal(madridTimestamp('2026-03-29T03:30'),Date.parse('2026-03-29T01:30Z'));
  for(const time of ['2026-03-29T02:30','2026-10-25T02:30','2026-02-30T12:00','invalid']) assert.ok(Number.isNaN(madridTimestamp(time)),time);
  const spring=Date.parse('2026-03-28T12:00Z');
  assert.equal(minimumOrderTime(spring),'2026-03-29T14:00');
  assert.equal(minimumOrderTime(Date.parse('2026-10-24T12:00Z')),'2026-10-25T13:00');
});
test('phone is mandatory, notes optional, delivery address conditional',()=>{
  const cart=addLine([],menu,'confirmed');
  for(const phone of ['', '123', 'not a phone', '+34 abc 612345678']) assert.ok(validateOrder(cart,menu,{...customer,phone},'34600000000').some(e=>e.includes('phone')));
  assert.deepEqual(validateOrder(cart,menu,{...customer,notes:'',fulfilment:'takeaway',address:''},'34600000000'),[]);
});
test('merges matching choices, separates variants, calculates money in cents', () => {
  let cart = addLine([], menu, 'confirmed', 'large', ['extra'], 2);
  cart = addLine(cart, menu, 'confirmed', 'large', ['extra'], 1);
  cart = addLine(cart, menu, 'confirmed', '', [], 1);
  assert.equal(cart.length, 2); assert.equal(cart[0].quantity, 3); assert.equal(subtotal(cart, menu), 5325);
  assert.equal(changeQuantity(cart, cart[0].key, 0).length, 1);
});
test('rejects unavailable items, invalid options and noninteger quantities', () => {
  assert.throws(() => addLine([], menu, 'sold', '', [], 1));
  assert.throws(() => addLine([], menu, 'confirmed', 'fake', [], 1));
  assert.throws(() => addLine([], menu, 'confirmed', '', [], 1.5));
});
test('required variants cannot be omitted by a restored or constructed cart', () => {
  const requiredMenu = [{...menu[0],id:'required',variantRequired:true}];
  assert.throws(() => addLine([], requiredMenu, 'required', '', [], 1));
  assert.deepEqual(hydrateCart(JSON.stringify([{id:'required',quantity:1,addons:[]}]),requiredMenu),[]);
  assert.equal(addLine([],requiredMenu,'required','large',[],1).length,1);
});
test('restores valid cart lines and ignores corrupt, unavailable and obsolete data', () => {
  const cart = addLine([], menu, 'confirmed', '', [], 2);
  assert.deepEqual(hydrateCart(JSON.stringify(cart), menu), cart);
  assert.deepEqual(hydrateCart('{broken', menu), []);
  assert.deepEqual(hydrateCart(JSON.stringify([{id:'sold',quantity:2},{id:'obsolete',quantity:4}]), menu), []);
});
test('requires customer, delivery address and real prices, but takeaway needs no address', () => {
  const cart = addLine([], menu, 'confirmed', '', [], 1);
  assert.deepEqual(validateOrder(cart, menu, customer, '34600000000'), []);
  assert.ok(validateOrder(cart, menu, {...customer,address:''}, '34600000000').length);
  assert.deepEqual(validateOrder(cart, menu, {...customer,fulfilment:'takeaway',address:''}, '34600000000'), []);
  assert.ok(validateOrder([], menu, customer, '34600000000').length);
  assert.ok(validateOrder(cart, menu, customer, '').length);
  assert.ok(validateOrder(addLine([], menu, 'preview', '', [], 1), menu, customer, '34600000000').length);
});
test('delivery requires explicit confirmation and Maps preserves the complete address through WhatsApp',()=>{
  const cart=addLine([],menu,'confirmed');
  assert.ok(validateOrder(cart,menu,{...customer,addressConfirmed:undefined},'34600000000').includes('Confirm that your delivery address is correct.'));
  assert.deepEqual(validateOrder(cart,menu,{...customer,fulfilment:'takeaway',addressConfirmed:undefined},'34600000000'),[]);
  for(const address of ['paseo de la castellana 226','Calle Alcalá 12, 2º B','Rue A&B #4 + porte 2','نهج تونس 22']){
    const maps=googleMapsUrl(address);assert.equal(new URL(maps).searchParams.get('query'),address);
    const message=orderMessage(cart,menu,{...customer,address});
    assert.ok(message.includes(`Google Maps:\n${maps}\n\n`));
    assert.equal(new URL(whatsappUrl('34600000000',message)).searchParams.get('text'),message);
  }
  assert.ok(googleMapsUrl('paseo de la castellana 226').endsWith('paseo+de+la+castellana+226'));
});
test('WhatsApp message includes itemized choices, quantities, subtotal and customer details', () => {
  const cart = addLine([], menu, 'confirmed', 'large', ['extra'], 2);
  const message = orderMessage(cart, menu, customer);
  for (const value of ['2 × Confirmed test item','Large','Extra','€28.50','Ana','Calle Test 4','2026-10-10','600000000','No salt & less spice']) assert.ok(message.includes(value), value);
  const url = new URL(whatsappUrl('34600000000', message));
  assert.equal(url.hostname, 'wa.me'); assert.equal(url.searchParams.get('text'), message);
  const mapsLink=message.split('\n').find(line=>line.startsWith('https://www.google.com/maps/search/'));
  assert.equal(new URL(mapsLink).searchParams.get('query'),customer.address);
  assert.ok(message.includes('WhatsApp: '+customer.phone));
  assert.ok(message.includes('Delivery fee depends on your address'));
  assert.ok(!orderMessage(cart,menu,{...customer,fulfilment:'takeaway'}).includes('Google Maps:'));
  assert.throws(() => whatsappUrl('unknown', message));
  assert.ok(!orderMessage(cart, menu, {...customer,fulfilment:'takeaway'}).includes('Calle Test 4'));
});
