/* ===== Zweite Wand „Retouren“ (1.182, Jürgen 16.11. im Sprachanruf: „Ja, perfekt“) =====
   Unter der Herricht-Wand, gleich aufgebaut (Diese Woche · Nächste Woche · Später, Fächer Mo–Fr, Wochenende beim Freitag),
   eingeordnet nach Dispo-Ende (bei Verlängerung das verlängerte). Farben: noch nicht fällig = normal · Endretoure da = grün ✓ (bleibt stehen)
   · Teilretoure = orange „teilweise zurück · x/y“ · Dispo abgelaufen ohne Endretoure = rot. Ältere abgelaufene ohne Endretoure oben im roten Kasten.
   Nicht dabei: stornierte, Verlängerungs-Packscheine (zählen beim Original), Zusätze. Am Handy dieselbe Woche wie der gewählte Reiter. */
let pkROpen=new Set();
function pkRSlot(p){const d=pkDay(p.de),w=new Date(d).getDay();return w===6?{t:pkAddD(d,-1),we:"Sa"}:w===0?{t:pkAddD(d,-2),we:"So"}:{t:d,we:""}}
function pkRInfo(p,t0){let B=null;try{B=typeof abgBal==="function"?abgBal(p):null}catch(e){}const kl=(packh[p.id]||{}).klar;
 if(B&&B.hasEnd)return{k:"ok",l:B.fehlt?"zurück · Fehlmaterial":"zurück",B};
 if(kl&&kl.t)return{k:"ok",l:"geklärt",B};
 const part=B&&B.R&&B.R.length>0;
 if(pkDay(p.de)<t0)return{k:"over",l:part?"Dispo abgelaufen · teilweise "+B.zur+"/"+B.raus:"Dispo abgelaufen",B};
 if(part)return{k:"part",l:"teilweise zurück · "+B.zur+"/"+B.raus,B};
 return{k:"",l:"",B}}
function pkRData(){const t0=pkDay(Date.now()),m0=pkMon(t0),m1=pkAddD(m0,7),m2=pkAddD(m0,14);
 const L=packs.filter(p=>p.de&&!p._z&&p.art!=="verl"&&!(typeof pkSto==="function"&&pkSto(p))).map(p=>({p,s:pkRSlot(p)})).filter(o=>o.s.t>=m0||pkState(o.p).k!=="done").map(o=>({...o,r:pkRInfo(o.p,t0)}));/* alte, erledigte gar nicht erst rechnen */
 const ord=(a,b)=>(a.r.k==="ok"?1:0)-(b.r.k==="ok"?1:0)||(a.p.de||0)-(b.p.de||0);
 const day=(m,i)=>{const t=pkAddD(m,i);return{t,items:L.filter(o=>o.s.t===t).sort(ord)}};
 const old=L.filter(o=>o.s.t<m0&&o.r.k==="over").sort((a,b)=>a.p.de-b.p.de);
 const later=L.filter(o=>o.s.t>=m2).sort((a,b)=>a.s.t-b.s.t);
 const kw=[0,1,2,3].map(k=>{const a=pkAddD(m2,7*k),b=pkAddD(a,7);return{lab:"KW "+pkKW(a)+" · "+pkDM(a)+"–"+pkDM(pkAddD(a,4)),items:later.filter(o=>o.s.t>=a&&o.s.t<b)}});
 kw.push({lab:"Danach",items:later.filter(o=>o.s.t>=pkAddD(m2,28))});
 return{t0,m0,m1,m2,old,w0:[0,1,2,3,4].map(i=>day(m0,i)),w1:[0,1,2,3,4].map(i=>day(m1,i)),kw}}
const pkRCnt=n=>' <b class="pkwn">· '+n+(n===1?' Retoure':' Retouren')+'</b>';
function pkRTag(o){const r=o.r;return r.k==="ok"?'<span class="pkrs ok">✓ '+esc(r.l)+'</span>':r.k?'<span class="pkrs '+r.k+'">'+esc(r.l)+'</span>':''}
function pkRWe(o){return o.s.we?'<span class="pkb we">'+(o.s.we==="Sa"?"Samstag":"Sonntag")+'</span>':''}
function pkRLine(o,lab){const p=o.p;return '<button class="pkline pkrl'+(o.r.k?' rk-'+o.r.k:'')+'" type="button" data-pk="'+esc(p.id)+'"><span class="pkl1">'+esc(lab||"")+'</span><span class="pkl2"><b>'+esc(p.ev||"Ohne Veranstaltung")+'</b><small>Auftrag '+esc(p.ord||"–")+(p.pl?' · '+esc(shortName(p.pl)):'')+'</small>'+(o.s.we?'<span class="pkbs">'+pkRWe(o)+'</span>':'')+'</span><span class="pkl3">'+pkRTag(o)+'</span></button>'}
function pkRCard(o,pre){const p=o.p;return '<button class="pkcard pkrc'+(o.r.k?' rk-'+o.r.k:'')+'" type="button" data-pk="'+esc(p.id)+'"><span class="pkct">'+(pre?'<span class="pkdt">'+pre+'</span>':'')+'<b>'+esc(p.ev||"Ohne Veranstaltung")+'</b></span><span class="pkcs">Auftrag '+esc(p.ord||"–")+(p.pl?' · '+esc(shortName(p.pl)):'')+'</span>'+(pkRTag(o)||o.s.we?'<span class="pkbs">'+pkRTag(o)+pkRWe(o)+'</span>':'')+'</button>'}
function pkRSum(d){const n=d.items.length,ok=d.items.filter(o=>o.r.k==="ok").length,ov=d.items.filter(o=>o.r.k==="over").length,pt=n-ok-ov;if(!n)return '<span class="mute">leer</span>';
 return [ok?'<span class="ok">'+ok+' zurück ✓</span>':'',pt?'<b class="part">'+pt+' teilweise</b>':'',ov?'<b class="warn">'+ov+' Dispo abgelaufen</b>':''].filter(Boolean).join(" · ")}
function pkROld(R){return R.old.length?'<section class="pklate pkrold"><h3>Dispo abgelaufen – noch nicht zurück <span>'+R.old.length+'</span></h3>'+R.old.map(o=>'<button class="pklc" type="button" data-pk="'+esc(o.p.id)+'"><span class="pkct"><b>'+esc(o.p.ev||o.p.ord)+'</b><small class="warn">'+esc(o.r.l)+'</small></span><span class="pkcs">Dispo bis '+pkWd(o.p.de)+' · Auftrag '+esc(o.p.ord||"–")+(o.p.pl?' · '+esc(shortName(o.p.pl)):'')+'</span></button>').join("")+'</section>':''}
function pkRetWall(wide){const R=pkRData(),t0=R.t0;let h='<h2 class="pkrhead">Retouren</h2>';
 if(!wide){
  const days=pkTab==="w1"?R.w1:pkTab==="sp"?null:R.w0;
  if(pkTab==="w0")h+=pkROld(R);
  const n=days?days.reduce((a,d)=>a+d.items.length,0):R.kw.reduce((a,k)=>a+k.items.length,0);
  h+='<div class="pkwh pkwhm pkrwh"><span>'+(pkTab==="w1"?"Nächste Woche":pkTab==="sp"?"Später":"Diese Woche")+pkRCnt(n)+'</span><small>'+(pkTab==="sp"?"nach Dispo-Ende":"KW "+pkKW(pkTab==="w1"?R.m1:R.m0))+'</small></div><div class="pktrays">';
  if(!days)h+=R.kw.map(k=>'<section class="pktray"><div class="pktl"><span>'+esc(k.lab)+'</span><small>'+(k.items.length||'')+'</small></div>'+(k.items.length?k.items.map(o=>pkRCard(o,pkDayLabel(o.s.t,0))).join(""):'<div class="pkempty">leer</div>')+'</section>').join("");
  else h+=days.map(d=>{const past=d.t<t0,open=pkROpen.has(d.t);
   if(past&&!open)return '<button class="pktray past" type="button" data-pkrd="'+d.t+'"><span class="pktl"><span>'+pkDayLabel(d.t,t0)+'</span></span><span class="pksum">'+pkRSum(d)+'</span></button>';
   return '<section class="pktray'+(d.t===t0?' today':'')+(past?' past open':'')+'"'+(past?' data-pkrd="'+d.t+'"':'')+'><div class="pktl"><span>'+pkDayLabel(d.t,t0)+'</span><small>'+(d.items.length?d.items.length+(d.items.length===1?' Retoure':' Retouren'):'')+'</small></div>'+(d.items.length?d.items.map(o=>pkRCard(o)).join(""):'<div class="pkempty">leer</div>')+'</section>'}).join("");
  return h+'</div>'}
 const week=(lab,sub,days)=>'<div class="pkwh pkrwh"><span>'+lab+pkRCnt(days.reduce((n,d)=>n+d.items.length,0))+'</span><small>'+sub+'</small></div>'+days.map(d=>{const past=d.t<t0,open=pkROpen.has(d.t);
  if(past&&!open)return '<button class="pkdrow past" type="button" data-pkrd="'+d.t+'"><span class="pkl1">'+pkDayLabel(d.t,t0)+'</span><span class="pksum">'+pkRSum(d)+'</span></button>';
  return '<div class="pkdh'+(d.t===t0?' today':'')+'"'+(past?' data-pkrd="'+d.t+'"':'')+'>'+pkDayLabel(d.t,t0)+(d.items.length?'':' <small>leer</small>')+'</div>'+d.items.map(o=>pkRLine(o)).join("")}).join("");
 const left=pkROld(R)+week("Diese Woche","KW "+pkKW(R.m0)+" · "+pkDM(R.m0)+"–"+pkDM(pkAddD(R.m0,4)),R.w0);
 const right=week("Nächste Woche","KW "+pkKW(R.m1)+" · "+pkDM(R.m1)+"–"+pkDM(pkAddD(R.m1,4)),R.w1)+'<div class="pkwh later pkrwh"><span>Später'+pkRCnt(R.kw.reduce((n,k)=>n+k.items.length,0))+'</span><small>nach Kalenderwoche</small></div>'+R.kw.map(k=>'<div class="pkdh">'+esc(k.lab)+(k.items.length?'':' <small>leer</small>')+'</div>'+k.items.map(o=>pkRLine(o,pkDayLabel(o.s.t,0))).join("")).join("");
 return h+'<div class="pkwide pkrwide"><div>'+left+'</div><div>'+right+'</div></div>'}
function pkRBind(){document.querySelectorAll("[data-pkrd]").forEach(b=>b.onclick=e=>{if(e.target.closest("[data-pk]"))return;const t=+b.dataset.pkrd;pkROpen.has(t)?pkROpen.delete(t):pkROpen.add(t);packOverView()})}
(function(){try{const st=document.createElement("style");st.textContent=
'.pkrhead{margin:26px 0 10px;font-size:22px;font-weight:800;color:var(--navy);border-top:3px solid var(--navy);padding-top:14px}'+
'.pkrs{display:inline-block;font-size:13px;font-weight:800;border-radius:999px;padding:3px 10px;color:#fff;white-space:nowrap}.pkrs.ok{background:#2e7d32}.pkrs.part{background:#e65100}.pkrs.over{background:#c62828}'+
'.pkrl .pkl3,.pkrc .pkbs{text-align:right}.pkrc .pkbs{display:flex;gap:6px;flex-wrap:wrap;margin-top:6px}'+
'.pkline.rk-over,.pkcard.rk-over{border-color:#c62828}.pkline.rk-part,.pkcard.rk-part{border-color:#e65100}'+
'.pksum b.part{color:#e65100}';document.head.appendChild(st)}catch(e){}})();
