import { MENU, CATEGORIES } from '../public/menu.mjs';
import { localizedMenu, translate } from '../public/locale.mjs';
import { SEO } from '../public/i18n.mjs';
import { CONFIG } from '../public/config.mjs';

export const escapeHtml = value => String(value).replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;').replaceAll('"','&quot;').replaceAll("'",'&#39;');
const prices = item => (item.variantPriceMode==='full' ? item.variants.map(option=>option.price) : [item.price]).filter(Number.isSafeInteger);
export function staticMenu(lang) {
  const currency = new Intl.NumberFormat(lang==='tn'?'en-IE':lang,{style:'currency',currency:CONFIG.currency});
  return localizedMenu(MENU,lang).map(item=>{
    const values=prices(item);
    const price=values.length?translate(`${item.variantPriceMode==='full'?'From ':''}${currency.format(Math.min(...values)/100)}`,lang):translate('Price to be confirmed',lang);
    const label=translate(item.available?(item.variants.length?'Choose options':'Add to bag'):'Unavailable',lang);
    const photo=item.image?`<img src="${escapeHtml(item.image.replace(/\.webp$/,'-card.webp'))}" alt="${escapeHtml(item.name)}" width="700" height="480" loading="lazy">`:'';
    const credit=item.photoCredit?`<small class="photo-credit">${escapeHtml(item.photoCredit)}</small>`:'';
    return `<article class="food-card"><div class="card-photo${item.imageFit==='contain'?' packshot':''}${item.standardisedPhoto?' supplied-photo':''}">${photo}${credit}</div><div class="card-content"><p class="card-category">${escapeHtml(translate(item.category,lang))}</p><h3>${escapeHtml(item.name)}</h3><p>${escapeHtml(item.description)}</p><div class="card-bottom"><span class="card-price">${escapeHtml(price)}</span><button type="button" class="add-button" disabled>${escapeHtml(label)}</button></div></div></article>`;
  }).join('');
}
export function localContent(lang) {
  const s=SEO[lang];
  return `<section class="local-cuisine wrap" aria-labelledby="local-cuisine-title"><h2 id="local-cuisine-title">${escapeHtml(s.heading)}</h2><p>${escapeHtml(s.body)}</p><p>${escapeHtml(s.related)}</p><p class="fine">${escapeHtml(s.terms)}</p><div class="local-contact"><a href="https://wa.me/${CONFIG.whatsappNumber}" target="_blank" rel="noopener noreferrer">WhatsApp · +34 624 052 575</a><a href="https://www.instagram.com/thespicesoukmadrid/" target="_blank" rel="noopener noreferrer">Instagram</a><a href="https://www.facebook.com/TheSpiceSouk/" target="_blank" rel="noopener noreferrer">Facebook</a></div><nav class="locale-links" aria-label="${escapeHtml(translate('Language',lang))}"><a href="/en/" lang="en">English</a><a href="/es/" lang="es">Español</a><a href="/fr/" lang="fr">Français</a><a href="/tn/" lang="aeb">تونسي</a></nav></section>`;
}
export function structuredData(lang) {
  const url=`${CONFIG.siteUrl}/${lang}/`,inLanguage=lang==='tn'?'aeb':lang;
  const menu=localizedMenu(MENU,lang);
  const graph=[
    {'@type':'Organization','@id':`${CONFIG.siteUrl}/#organization`,name:CONFIG.brand,url:CONFIG.siteUrl,logo:`${CONFIG.siteUrl}/assets/header-emblem.webp`,telephone:`+${CONFIG.whatsappNumber}`,sameAs:['https://www.instagram.com/thespicesoukmadrid/','https://www.facebook.com/TheSpiceSouk/'],areaServed:{'@type':'City',name:'Madrid'},description:SEO[lang].intro},
    {'@type':'WebSite','@id':`${CONFIG.siteUrl}/#website`,url:CONFIG.siteUrl,name:CONFIG.brand,publisher:{'@id':`${CONFIG.siteUrl}/#organization`},inLanguage:['en','es','fr','aeb']},
    {'@type':'WebPage','@id':url,url,name:SEO[lang].title,description:SEO[lang].description,inLanguage,isPartOf:{'@id':`${CONFIG.siteUrl}/#website`},mainEntity:{'@id':`${url}#menu`}},
    {'@type':'Menu','@id':`${url}#menu`,name:translate('Our menu',lang),url:`${url}#menu`,inLanguage,hasMenuSection:CATEGORIES.filter(category=>menu.some(item=>item.category===category)).map(category=>({'@type':'MenuSection',name:translate(category,lang),hasMenuItem:menu.filter(item=>item.category===category).map(item=>({'@type':'MenuItem',name:item.name,description:item.description,...(item.image?{image:`${CONFIG.siteUrl}/${item.image}`}:{}) ,offers:(item.variantPriceMode==='full'?item.variants:[{name:item.name,price:item.price}]).filter(option=>Number.isSafeInteger(option.price)).map(option=>({'@type':'Offer',name:option.name,price:(option.price/100).toFixed(2),priceCurrency:CONFIG.currency,availability:`https://schema.org/${item.available?'InStock':'OutOfStock'}`}))}))}))}
  ];
  return JSON.stringify({'@context':'https://schema.org','@graph':graph}).replaceAll('<','\\u003c');
}
