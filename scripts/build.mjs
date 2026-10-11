import { cp, mkdir, rm, writeFile, readFile } from 'node:fs/promises';
import { LANGUAGES, translate } from '../public/locale.mjs';
import { CONFIG } from '../public/config.mjs';
import { SEO } from '../public/i18n.mjs';
import { staticMenu, localContent, structuredData, escapeHtml } from './seo.mjs';
await rm(new URL('../dist/',import.meta.url),{recursive:true,force:true});
await mkdir(new URL('../dist/',import.meta.url),{recursive:true});
await cp(new URL('../public/',import.meta.url),new URL('../dist/',import.meta.url),{recursive:true,filter:source=>!source.endsWith('-original.jpg')});
const escape=value=>value.replaceAll('&','&amp;').replaceAll('"','&quot;');
const alternates=Object.keys(LANGUAGES).map(code=>`<link rel="alternate" hreflang="${code==='tn'?'ar-TN':code}" href="${CONFIG.siteUrl}/${code}/">`).join('')+`<link rel="alternate" hreflang="x-default" href="${CONFIG.siteUrl}/en/">`;
for(const code of Object.keys(LANGUAGES)){
  await mkdir(new URL(`../dist/${code}/`,import.meta.url),{recursive:true});
  for(const page of ['index.html','credits.html']){
    let html=await readFile(new URL(`../public/${page}`,import.meta.url),'utf8');
    html=html.replace('<html lang="en">',`<html lang="${code==='tn'?'aeb':code}" dir="${code==='tn'?'rtl':'ltr'}">`).replace('<head>','<head><base href="/">');
    html=html.replace(/>([^<>]+)</g,(all,text)=>'>'+translate(text.replaceAll('&amp;','&'),code).replaceAll('&','&amp;')+'<');
    if(page==='index.html'){
      const seo=SEO[code];
      html=html.replace(/<title>[^<]*<\/title>/,`<title>${escapeHtml(seo.title)}</title>`).replace(/<meta name="description" content="[^"]*">/,`<meta name="description" content="${escape(seo.description)}">`).replace(/<link rel="canonical"[^>]*>/,`<link rel="canonical" href="${CONFIG.siteUrl}/${code}/">${alternates}`).replace(/<meta property="og:title"[^>]*>/,`<meta property="og:title" content="${escape(seo.title)}">`).replace(/<meta property="og:description"[^>]*>/,`<meta property="og:description" content="${escape(seo.description)}">`).replace(/<meta property="og:url"[^>]*>/,`<meta property="og:url" content="${CONFIG.siteUrl}/${code}/">`);
      html=html.replace(/<p class="hero-description">[^<]*<\/p>/,`<p class="hero-description">${escapeHtml(seo.intro)}</p>`).replace('<div class="food-grid" id="food-grid" data-view="grid"></div>',`<div class="food-grid" id="food-grid" data-view="grid">${staticMenu(code)}</div>`).replace('<!-- local-search-content -->',localContent(code));
      html=html.replace('</head>',`<meta property="og:site_name" content="The Spice Souk"><meta property="og:locale" content="${seo.ogLocale}"><meta property="og:image:alt" content="${escapeHtml(translate('Couscous',code))}"><meta name="twitter:title" content="${escape(seo.title)}"><meta name="twitter:description" content="${escape(seo.description)}"><meta name="twitter:image" content="${CONFIG.siteUrl}/assets/product-woven-couscous.webp"><script type="application/ld+json">${structuredData(code)}</script></head>`);
    }
    html=html.replaceAll('href="#',`href="/${code}/#`);
    html=html.replace('href="credits.html"',`href="/${code}/credits.html"`).replace('href="index.html"',`href="/${code}/"`);
    await writeFile(new URL(`../dist/${code}/${page}`,import.meta.url),html);
    if(code==='en'&&page==='index.html')await writeFile(new URL('../dist/index.html',import.meta.url),html);
  }
}
await writeFile(new URL('../dist/sitemap.xml',import.meta.url),`<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${Object.keys(LANGUAGES).map(code=>`<url><loc>${CONFIG.siteUrl}/${code}/</loc></url>`).join('')}</urlset>`);
await writeFile(new URL('../dist/404.html',import.meta.url),`<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="robots" content="noindex"><title>404 | The Spice Souk</title><link rel="stylesheet" href="/style.css"></head><body><main class="local-cuisine wrap"><h1>404</h1><nav class="locale-links" aria-label="Language"><a href="/en/" lang="en">English</a><a href="/es/" lang="es">Español</a><a href="/fr/" lang="fr">Français</a><a href="/tn/" lang="aeb">تونسي</a></nav></main></body></html>`);
console.log('Static catalogue built. No publication performed.');
