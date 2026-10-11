import { initializeLocale } from './locale.mjs';
initializeLocale();
const container=document.getElementById('credits');
try {
  const response=await fetch('assets/credits.json');if(!response.ok)throw new Error('Credits unavailable');
  for(const photo of await response.json()){
    const article=document.createElement('article');article.className='credit-item';
    const img=document.createElement('img');img.src='assets/'+photo.key+'.webp';img.alt=photo.title.replace('File:','');img.width=160;img.height=100;img.loading='lazy';
    const title=document.createElement('h2');title.textContent=photo.title;
    const author=document.createElement('p');author.textContent='Photograph: '+photo.author+' / '+(photo.provider||'Wikimedia Commons')+'. '+photo.modified;
    article.append(img,title,author);
    if(photo.source){const source=document.createElement('a');source.href=photo.source;source.textContent='Source photograph';article.append(source,document.createTextNode(' · '));}
    const license=document.createElement(photo.licenseUrl?'a':'span');if(photo.licenseUrl)license.href=photo.licenseUrl;license.textContent=photo.license;article.append(license);container.append(article);
  }
}catch{const link=document.createElement('a');link.href='assets/credits.json';link.textContent='Read the photo attribution file';container.append(link);}
