(function(){
const $=s=>document.querySelector(s);
const LOGO=new URL('../img/clover.svg',document.currentScript.src).href;
const TPLS=[['kortele','Kortelė','Švarus ir aiškus, tinka visiems. Numatytasis.',0],['tamsus','Tamsus','Elegantiškas tamsus fonas, ryškūs mygtukai.',1],['minimalus','Minimalus','Tik vardas ir nuorodos, nieko daugiau.',1],['zalias','Žalias','Krissty dobilo spalvos, gaivus ir gyvas.',1]];
let tpl='kortele';
const esc=s=>String(s||'').replace(/([\\;,:"])/g,'\\$1');
const TYPES={
 social:{l:'Socialiniai tinklai',f:[['ti','Pavadinimas (vardas ar įmonė)','text','Krissty'],['d','Trumpas aprašymas (neprivaloma)','text',''],['a','Nuotraukos nuoroda (neprivaloma)','url',''],['fb','Facebook (nuoroda arba vardas)','text',''],['ig','Instagram (@vardas arba nuoroda)','text',''],['tt','TikTok (@vardas arba nuoroda)','text',''],['yt','YouTube (@kanalas arba nuoroda)','text','']],
  b:v=>{const N={fb:'https://www.facebook.com/',ig:'https://www.instagram.com/',tt:'https://www.tiktok.com/@',yt:'https://www.youtube.com/@'};
   const L=[];for(const k of ['fb','ig','tt','yt']){let u=(v[k]||'').trim();if(!u)continue;
    if(!/^https?:\/\//i.test(u)){u=u.replace(/^@/,'');u=/[\/.]/.test(u)&&!/^[\w.]+$/.test(u)?'https://'+u:N[k]+u}
    L.push([k,u])}
   for(const c of customs){let u=(c.u||'').trim();if(!u||!c.l.trim())continue;if(!/^https?:\/\//i.test(u))u='https://'+u;L.push(['x',u,c.l.trim().slice(0,80)])}
   const o={t:v.ti||'',l:L,template:tpl};const bio=(v.d||'').trim().slice(0,160);if(bio)o.d=bio;
   let av=(v.a||'').trim();if(av){if(!/^https?:\/\//i.test(av))av='https://'+av;o.a=av}
   if(pageColors()){o.c=$('#pcAcc').value;o.bg=$('#pcBg').value}
   const d=btoa(unescape(encodeURIComponent(JSON.stringify(o)))).replace(/\+/g,'-').replace(/\//g,'_').replace(/=+$/,'');
   return new URL('../p/',location.href).href+'#'+d}},
 url:{l:'Nuoroda',f:[['url','Nuoroda','url','https://krissty.lt']],b:v=>{let u=v.url.trim();if(u&&!/^[a-z]+:/i.test(u))u='https://'+u;return u}},
 text:{l:'Tekstas',f:[['t','Tekstas','area','Labas!']],b:v=>v.t},
 wifi:{l:'Wi-Fi',f:[['s','Tinklo pavadinimas (SSID)','text',''],['p','Slaptažodis','password',''],['e','Apsauga','sel:WPA|WEP|nopass','WPA']],b:v=>`WIFI:T:${v.e};S:${esc(v.s)};P:${v.e==='nopass'?'':esc(v.p)};;`},
 vcard:{l:'Vizitinė kortelė',f:[['fn','Vardas','text',''],['ln','Pavardė','text',''],['org','Įmonė','text',''],['tel','Telefonas','tel',''],['em','El. paštas','email',''],['web','Svetainė','url',''],['adr','Adresas','text','']],
  b:v=>['BEGIN:VCARD','VERSION:3.0',`N:${v.ln};${v.fn}`,`FN:${(v.fn+' '+v.ln).trim()}`,v.org&&`ORG:${v.org}`,v.tel&&`TEL:${v.tel}`,v.em&&`EMAIL:${v.em}`,v.web&&`URL:${v.web}`,v.adr&&`ADR:;;${v.adr}`,'END:VCARD'].filter(Boolean).join('\n')},
 email:{l:'El. laiškas',f:[['to','Kam','email',''],['su','Tema','text',''],['bo','Tekstas','area','']],b:v=>`mailto:${v.to}?subject=${encodeURIComponent(v.su)}&body=${encodeURIComponent(v.bo)}`},
 sms:{l:'SMS',f:[['n','Telefono numeris','tel','+370'],['m','Žinutė','area','']],b:v=>`SMSTO:${v.n}:${v.m}`},
 tel:{l:'Skambutis',f:[['n','Telefono numeris','tel','+370']],b:v=>`tel:${v.n.replace(/\s/g,'')}`},
 wa:{l:'WhatsApp',f:[['n','Numeris su šalies kodu','tel','370'],['m','Žinutė','text','']],b:v=>`https://wa.me/${v.n.replace(/\D/g,'')}${v.m?'?text='+encodeURIComponent(v.m):''}`},
 geo:{l:'Vieta',f:[['la','Platuma','text','54.5562'],['lo','Ilguma','text','23.3500']],b:v=>`geo:${v.la},${v.lo}`},
 event:{l:'Renginys',f:[['ti','Pavadinimas','text',''],['st','Pradžia','dt',''],['en','Pabaiga','dt',''],['lo','Vieta','text','']],
  b:v=>{const d=x=>x?x.replace(/[-:]/g,'')+'00':'';return ['BEGIN:VEVENT',`SUMMARY:${v.ti}`,v.st&&`DTSTART:${d(v.st)}`,v.en&&`DTEND:${d(v.en)}`,v.lo&&`LOCATION:${v.lo}`,'END:VEVENT'].filter(Boolean).join('\n')}},
 pay:{l:'Mokėjimas (SEPA)',f:[['nm','Gavėjas','text',''],['ib','IBAN','text','LT'],['am','Suma, €','text',''],['ds','Mokėjimo paskirtis','text','']],
  b:v=>['BCD','002','1','SCT','',v.nm,v.ib.replace(/\s/g,''),v.am?'EUR'+(+v.am.replace(',','.')).toFixed(2):'','','',v.ds].join('\n')}
};
let type='social';const customs=[];
const DOM={fb:/(^|\.)(facebook\.com|fb\.com|fb\.me)$/i,ig:/(^|\.)instagram\.com$/i,tt:/(^|\.)tiktok\.com$/i,yt:/(^|\.)(youtube\.com|youtu\.be)$/i};
const NETNAME=/f[a4@]c[e3]b[o0]{2}k|[i1l]nst[a4@]gr[a4@]m|t[i1l]kt[o0]k|y[o0]utub[e3]|\bfb\b|\big\b/i;const vals={};
function drawFields(){
 const t=TYPES[type];vals[type]=vals[type]||{};
 $('#fields').innerHTML=t.f.map(([k,l,kind,def])=>{
  const v=vals[type][k]??def;vals[type][k]=v;const id='f_'+k;
  if(kind==='area')return `<label for="${id}">${l}</label><textarea id="${id}" data-k="${k}">${v}</textarea>`;
  if(kind.startsWith('sel:'))return `<label for="${id}">${l}</label><select id="${id}" data-k="${k}">${kind.slice(4).split('|').map(o=>`<option ${o===v?'selected':''} value="${o}">${o==='nopass'?'Be slaptažodžio':o}</option>`).join('')}</select>`;
  const it=kind==='dt'?'datetime-local':kind;
  return `<label for="${id}">${l}</label><input type="${it}" id="${id}" data-k="${k}" value="${String(v).replace(/"/g,'&quot;')}">`}).join('');
 $('#fields').querySelectorAll('[data-k]').forEach(e=>e.addEventListener('input',()=>{vals[type][e.dataset.k]=e.value;checkNet();upd()}));
 if(type==='social'){
  const box=document.createElement('div');box.id='customs';$('#fields').appendChild(box);drawCustoms();
  const w=document.createElement('p');w.id='netWarn';w.className='warn';w.hidden=true;$('#fields').appendChild(w);checkNet();
 }
}
function drawCustoms(){
 const box=$('#customs');if(!box)return;
 box.innerHTML='<label style="margin-top:16px">Savos nuorodos <span class="tag">Daugiau nuorodų turi Pilnas planas</span></label>'+
  customs.map((c,i)=>`<div class="row" style="grid-template-columns:1fr 1.4fr auto;align-items:center;margin-top:8px"><input type="text" placeholder="Mygtuko užrašas" maxlength="80" data-ci="${i}" data-cf="l" value="${c.l.replace(/"/g,'&quot;')}"><input type="url" placeholder="https://" data-ci="${i}" data-cf="u" value="${c.u.replace(/"/g,'&quot;')}"><button type="button" class="btn line" style="min-height:40px;padding:8px 14px" data-del="${i}" aria-label="Pašalinti">✕</button></div>`).join('')+
  (customs.length<10?'<button type="button" class="btn line" id="addC" style="margin-top:10px;min-height:42px">+ Pridėti nuorodą</button>':'<p class="note">Daugiausia 10 savų nuorodų.</p>')+
  '<p class="note">Savos nuorodos ir neriboti puslapiai yra Pilname plane. Basic plane gali pridėti tik 4 tinklus.</p>';
 box.querySelectorAll('[data-ci]').forEach(e=>e.addEventListener('input',()=>{customs[+e.dataset.ci][e.dataset.cf]=e.value;checkNet();upd()}));
 box.querySelectorAll('[data-del]').forEach(b=>b.addEventListener('click',()=>{customs.splice(+b.dataset.del,1);drawCustoms();upd()}));
 const a=$('#addC');if(a)a.addEventListener('click',()=>{customs.push({l:'',u:''});drawCustoms();box.querySelector('[data-ci="'+(customs.length-1)+'"]').focus()});
}
function host(u){try{return new URL(/^https?:/i.test(u)?u:'https://'+u).hostname}catch(e){return ''}}
function checkNet(){
 const w=$('#netWarn');if(!w)return;const v=vals.social||{},msg=[];
 const nm={fb:'Facebook',ig:'Instagram',tt:'TikTok',yt:'YouTube'};
 for(const k in DOM){const u=(v[k]||'').trim();if(u&&/[\/.]/.test(u)&&!/^@?[\w.]+$/.test(u)&&!DOM[k].test(host(u)))msg.push(`${nm[k]} laukelyje turi būti ${nm[k]} adresas.`)}
 customs.forEach(c=>{if(NETNAME.test(c.l))msg.push(`Savos nuorodos užrašas „${c.l}“ panašus į tinklo pavadinimą. Tinklams naudok jų laukelius viršuje.`)});
 w.textContent=msg.join(' ');w.hidden=!msg.length;
}
function pageColors(){return !!($('#pcOn')&&$('#pcOn').checked)}
function fullReasons(){if(type!=='social')return [];const r=[];if(customs.some(c=>c.u.trim()))r.push('Pridėjai savų nuorodų');
 if(tpl!=='kortele')r.push('Pasirinkai šabloną „'+TPLS.find(x=>x[0]===tpl)[1]+'“');if(pageColors())r.push('Pasirinkai savas puslapio spalvas');return r}
function needsFull(){return fullReasons().length>0}
$('#tpls').innerHTML=TPLS.map(([k,l,d,lock])=>`<button type="button" class="tp" data-tpl="${k}" aria-pressed="${k===tpl}"><span class="mini ${k}"><i></i><em></em><u></u><u></u><u></u></span><b>${l}</b><small>${d}</small>${lock?'<span class="tag lock">Pilname plane</span>':''}</button>`).join('');
$('#tpls').addEventListener('click',e=>{const b=e.target.closest('.tp');if(!b)return;tpl=b.dataset.tpl;$('#tpls').querySelectorAll('.tp').forEach(x=>x.setAttribute('aria-pressed',x===b));upd()});
$('#pcOn').addEventListener('change',()=>{$('#pcRow').hidden=!$('#pcOn').checked;upd()});
['pcAcc','pcBg'].forEach(id=>$('#'+id).addEventListener('input',upd));
$('#types').innerHTML=Object.entries(TYPES).map(([k,t])=>`<button type="button" data-t="${k}" aria-pressed="${k===type}">${t.l}</button>`).join('');
$('#types').addEventListener('click',e=>{const b=e.target.closest('button');if(!b)return;type=b.dataset.t;$('#types').querySelectorAll('button').forEach(x=>x.setAttribute('aria-pressed',x===b));drawFields();upd()});

const PRESETS=[['#1f5e1f','#ffffff'],['#000000','#ffffff'],['#0d47a1','#ffffff'],['#6a1b9a','#ffffff'],['#c62828','#ffffff'],['#e65100','#fff8e1'],['#004d40','#e0f2f1'],['#ffffff','#1f5e1f']];
$('#presets').innerHTML=PRESETS.map(([a,b])=>`<button type="button" class="sw" style="background:linear-gradient(135deg,${a} 50%,${b} 50%)" data-a="${a}" data-b="${b}" aria-label="Spalvos ${a} ir ${b}"></button>`).join('');
$('#presets').addEventListener('click',e=>{const b=e.target.closest('.sw');if(!b)return;$('#fg').value=b.dataset.a;$('#bg').value=b.dataset.b;upd()});
function opts(el,list,cur,cb){el.innerHTML=list.map(([v,l])=>`<button type="button" data-v="${v}" aria-pressed="${v===cur}">${l}</button>`).join('');el.addEventListener('click',e=>{const b=e.target.closest('button');if(!b)return;el.querySelectorAll('button').forEach(x=>x.setAttribute('aria-pressed',x===b));cb(b.dataset.v);upd()})}
let dotType='rounded',cornerType='extra-rounded',logo='clover';
opts($('#dots'),[['square','Kvadratai'],['dots','Taškai'],['rounded','Apvalūs'],['extra-rounded','Labai apvalūs'],['classy','Elegantiški'],['classy-rounded','Elegantiški apvalūs']],dotType,v=>dotType=v);
opts($('#corners'),[['square','Kvadratas'],['extra-rounded','Apvalus'],['dot','Taškas']],cornerType,v=>cornerType=v);
opts($('#logos'),[['none','Be logotipo'],['clover','Dobilas']],logo,v=>{logo=v;customLogo=null});
let customLogo=null;
$('#logoFile').addEventListener('change',e=>{const f=e.target.files[0];if(!f)return;const r=new FileReader();r.onload=()=>{customLogo=r.result;$('#logos').querySelectorAll('button').forEach(x=>x.setAttribute('aria-pressed',false));upd()};r.readAsDataURL(f)});
['fg','bg','fg2','logoSize','frameTxt','frameCol','ecl'].forEach(id=>$('#'+id).addEventListener('input',upd));
$('#grad').addEventListener('change',()=>{$('#gradRow').hidden=!$('#grad').checked;upd()});
$('#frameOn').addEventListener('change',upd);
$('#size').addEventListener('input',()=>{$('#sizeV').textContent=$('#size').value});

function lum(h){const c=[1,3,5].map(i=>parseInt(h.substr(i,2),16)/255).map(v=>v<=.03928?v/12.92:Math.pow((v+.055)/1.055,2.4));return .2126*c[0]+.7152*c[1]+.0722*c[2]}
function contrast(a,b){const x=lum(a),y=lum(b);return (Math.max(x,y)+.05)/(Math.min(x,y)+.05)}
function data(){return TYPES[type].b(vals[type])||' '}
function config(size){
 const fg=$('#fg').value,color=$('#grad').checked?{gradient:{type:'linear',rotation:Math.PI/4,colorStops:[{offset:0,color:fg},{offset:1,color:$('#fg2').value}]}}:{color:fg};
 const img=customLogo||(logo==='clover'?LOGO:undefined);
 return {width:size,height:size,type:'canvas',data:data(),margin:Math.round(size*.03),image:img,
  qrOptions:{errorCorrectionLevel:$('#ecl').value},
  dotsOptions:Object.assign({type:dotType},color),
  cornersSquareOptions:Object.assign({type:cornerType},color),
  cornersDotOptions:Object.assign({type:cornerType==='square'?'square':'dot'},color),
  backgroundOptions:{color:$('#bg').value},
  imageOptions:{crossOrigin:'anonymous',margin:Math.round(size*.01),imageSize:+$('#logoSize').value,hideBackgroundDots:true}};
}
drawFields();
const qr=new QRCodeStyling(config(300));
qr.append($('#qr'));
let t;function upd(){clearTimeout(t);t=setTimeout(()=>{
 try{qr.update(config(300))}catch(e){}
 const box=$('#qr');box.classList.toggle('framed',$('#frameOn').checked);box.style.setProperty('--fc',$('#frameCol').value);
 let ft=box.querySelector('.ftxt');if($('#frameOn').checked){if(!ft){ft=document.createElement('div');ft.className='ftxt';box.appendChild(ft)}ft.textContent=$('#frameTxt').value}else if(ft)ft.remove();
 box.style.flexDirection='column';
 $('#contrastWarn').hidden=contrast($('#fg').value,$('#bg').value)>=3;
 const d=data();$('#stepTpl').hidden=type!=='social';if(type==='social'){$('#pageLink').href=d;const r=fullReasons();$('#aiN').textContent=AIL()[r.length?'full':'basic'];$('#tplNote').textContent=r.length?'Šiam puslapiui reikės Pilno plano.':'Šis puslapis tinka Basic planui.'}
 $('#contentNote').textContent=d.length>300?`Kode ${d.length} simbolių, tad jis bus tankesnis. Spausdink bent 3 cm dydžio.`:'';
},60)}

function save(blob,name){const a=document.createElement('a');a.href=URL.createObjectURL(blob);a.download=name;a.click();setTimeout(()=>URL.revokeObjectURL(a.href),2000)}
const fname=()=>'krissty-qr-'+type;
async function framedPng(size){
 const q=new QRCodeStyling(config(size));const blob=await q.getRawData('png');
 if(!$('#frameOn').checked)return blob;
 const im=await createImageBitmap(blob),pad=Math.round(size*.06),th=Math.round(size*.16);
 const c=document.createElement('canvas');c.width=size+pad*2;c.height=size+pad*2+th;const x=c.getContext('2d');
 x.fillStyle=$('#frameCol').value;rr(x,0,0,c.width,c.height,Math.round(size*.07));x.fill();
 x.drawImage(im,pad,pad);x.fillStyle='#fff';x.font=`700 ${Math.round(size*.075)}px Poppins, Inter, sans-serif`;x.textAlign='center';x.textBaseline='middle';
 x.fillText($('#frameTxt').value,c.width/2,size+pad+th/2+pad/3);
 return new Promise(r=>c.toBlob(r,'image/png'));
}
function rr(x,a,b,w,h,r){x.beginPath();x.moveTo(a+r,b);x.arcTo(a+w,b,a+w,b+h,r);x.arcTo(a+w,b+h,a,b+h,r);x.arcTo(a,b+h,a,b,r);x.arcTo(a,b,a+w,b,r);x.closePath()}
let pending=null;const dlg=$('#pay');
function gate(fn){pending=fn;const full=needsFull(),b=document.querySelector('input[name=plan][value=basic]');b.disabled=full;if(full&&b.checked)document.querySelector('input[name=plan][value=full]').checked=true;
 $('#fullOnly').hidden=!full;aiPlan();$('#fullOnly').textContent=full?fullReasons().join(', ')+', todėl reikia Pilno plano.':'';dlg.showModal()}
const AIL=()=>(window.KQR_CONFIG&&window.KQR_CONFIG.AI_LIMITS)||{basic:10,full:25,premium:50,trial:3};
function aiPlan(){const p=document.querySelector('input[name=plan]:checked').value;$('#aiPlan').textContent=`Iki ${AIL()[p]} AI dizainų kas 30 dienų. Bandymo metu – iki ${AIL().trial}.`}
document.querySelectorAll('input[name=plan]').forEach(r=>r.addEventListener('change',aiPlan));
$('#payClose').addEventListener('click',()=>dlg.close());
$('#payGo').addEventListener('click',async()=>{dlg.close();if(pending)await pending();pending=null});
const doPng=async()=>save(await framedPng(+$('#size').value),fname()+'.png');
$('#dlPng').addEventListener('click',()=>gate(doPng));
const doSvg=async()=>{
 const s=1000,cfg=Object.assign(config(s),{type:'svg'});
 if(cfg.image&&cfg.image===LOGO){cfg.image=await fetch(cfg.image).then(r=>r.text()).then(t=>'data:image/svg+xml;base64,'+btoa(unescape(encodeURIComponent(t))))}
 const q=new QRCodeStyling(cfg);let svg=await (await q.getRawData('svg')).text();
 if($('#frameOn').checked){const pad=60,th=160,W=s+pad*2,H=s+pad*2+th,inner=svg.replace(/<\?xml[^>]*>/,'').replace('<svg',`<svg x="${pad}" y="${pad}"`);
  const txt=$('#frameTxt').value.replace(/[<&>]/g,c=>({'<':'&lt;','&':'&amp;','>':'&gt;'}[c]));
  svg=`<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}"><rect width="${W}" height="${H}" rx="70" fill="${$('#frameCol').value}"/>${inner}<text x="${W/2}" y="${s+pad+th/2+20}" fill="#fff" font-family="Poppins,Inter,sans-serif" font-weight="700" font-size="75" text-anchor="middle" dominant-baseline="middle">${txt}</text></svg>`}
 save(new Blob([svg],{type:'image/svg+xml'}),fname()+'.svg');
};
$('#dlSvg').addEventListener('click',()=>gate(doSvg));
upd();
})();
