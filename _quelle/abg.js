/* ===== Abgleich Ausgang ↔ Eingang (ab 1.77) =====
   Pro Auftrag ein laufendes Konto: raus = Packliste + Zusatz-Packscheine (hergerichtet, ohne Fremdmiete, mit Alternativen),
   zurück = alle Retourscheine mit gleicher Auftragsnummer (Teil- und Endretouren) ± bestätigte Zuordnungen.
   Die App ordnet NIE selbst zu: bei „zu viel“ gibt es nur Vorschläge, gezählt wird erst nach „Zuordnen“ (docs „abzu“).
   Prüfen: jede Endretoure (retour.art="end") landet in „Zu prüfen“, bis jemand mit Recht abg_p „Geprüft“ tippt (docs „abpr“). */
let ABZ=[],ABN={},ABP={},abgOn=false;
function abgSub(){if(abgOn)return;abgOn=true;try{
 db.collection("abzu").onSnapshot(s=>{ABZ=s.docs.map(d=>({id:d.id,...d.data()}));draw()});
 db.collection("abno").onSnapshot(s=>{ABN={};s.docs.forEach(d=>ABN[d.id]=d.data());draw()});
 db.collection("abpr").onSnapshot(s=>{ABP={};s.docs.forEach(d=>ABP[d.id]=d.data());draw()})}catch(e){console.warn(e)}}
const abgOk=()=>can("pk_s")&&can("ret_s");
const abgKey=(c,nm)=>c?"c:"+c:"n:"+jvATok(nm).join(" ");
const rIsEnd=r=>!!r.closed&&r.art!=="teil";
const abgPackOf=ord=>{const o=pkDig(ord);if(!o)return null;return packs.find(p=>pkDig(p.ord)===o)||null};
const abgN=n=>String(n);
/* Konto eines Auftrags. ov = {id, items} ersetzt beim Zählen den eigenen, noch nicht gespeicherten Retourschein */
function abgBal(p,ov){const H=pkH(p),M={};
 const get=(k,c,nm)=>M[k]=M[k]||{k,code:c||"",name:nm,raus:0,nach:0,fr:0,l55:0,soll:0,back0:0,zin:0,zout:0,back:0,via55:0};
 const add=(c,nm,zus,q,f)=>{const e=get(abgKey(c,nm),c,nm);e.soll+=q;e.fr+=f;if(zus)e.nach+=q+f;else e.raus+=q+f};
 pkItems(p).forEach(o=>{const x=o.x,h=H[o.k],st=pkPS(x,h),f=h&&h.fm==="lager"?0:(+x.f||0),own=Math.max(0,(+x.n||0)-f);
  if(pkL55(x,h)){get(abgKey(artCode(x.a),pkName(x)),artCode(x.a),pkName(x)).l55+=own;return}
  add(artCode(x.a),pkName(x),!!o.z,st.s==="open"?own:h&&h.ok?own:Math.min(own,+st.q||0),f);
  if(st.s!=="open")(st.alt||[]).forEach(a=>{const k=pkKat({a:a.a});add(artCode(a.a),k?k.name:a.t,!!o.z,+a.n||0,0)})});
 const R=pkRets(p);
 R.forEach(r=>{const it=ov&&ov.id&&r.id===ov.id?ov.items:rIt(r);Object.values(it||{}).forEach(i=>{if(i.g==="Zubehör")return;const c=artCode(i.nr);get(abgKey(c,i.name),c,i.name).back0+=+i.q||0})});
 if(ov&&!ov.id)Object.values(ov.items||{}).forEach(i=>{if(i.g==="Zubehör")return;const c=artCode(i.nr);get(abgKey(c,i.name),c,i.name).back0+=+i.q||0});
 ABZ.forEach(z=>{if(z.from===p.id)get(z.k,z.code,z.name).zout+=+z.q||0;if(z.to===p.id)get(z.k,z.code,z.name).zin+=+z.q||0});
 const L=Object.values(M).filter(e=>e.soll||e.back0||e.fr||e.zin||e.zout||e.l55);L.forEach(e=>{e.back=Math.max(0,e.back0-e.zout+e.zin);e.via55=Math.min(e.l55,Math.max(0,e.back-e.soll-e.fr))});
 const miss=L.filter(e=>e.soll>e.back),more=L.filter(e=>e.back>e.soll+e.fr+e.l55);
 const ends=R.filter(rIsEnd),hasEnd=ends.length>0,endR=ends.sort((a,b)=>(b.closedT||0)-(a.closedT||0))[0]||null;
 return{p,L,R,miss,more,has:R.length>0||!!ov,closed:hasEnd,hasEnd,endR,
  raus:L.reduce((a,e)=>a+e.soll,0),zur:L.reduce((a,e)=>a+Math.min(e.back,e.soll),0),
  fehlt:miss.reduce((a,e)=>a+e.soll-e.back,0),zuviel:more.reduce((a,e)=>a+e.back-e.soll-e.fr-e.l55,0),l55:L.reduce((a,e)=>a+e.l55,0)}}
/* für die Fragen im Assistenten (jvfrag.js) */
function jvBal(p){return abgBal(p)}
/* ---------- Vorschläge (nur anzeigen, nie selbst buchen) ---------- */
const abgOverlap=(a,b)=>(a.db||0)<=(b.de||0)&&(b.db||0)<=(a.de||0);
function abgMlHit(fromP,toP,e){/* Materialliste „geht weiter“ von toP-Veranstaltung zu fromP-Veranstaltung mit diesem Artikel */
 const L=typeof lists!=="undefined"?lists:[],n=s=>jvNorm(s);
 return L.some(c=>c.mode!=="bleibt"&&n(c.ev1)&&n(c.ev2)&&n(toP.ev).includes(n(c.ev1))&&n(fromP.ev).includes(n(c.ev2))&&Object.values(jvMlItems(c)).some(x=>abgKey(artCode(x.art),x.name||jvArtNm(x.art,x))===e.k))}
/* Wo fehlt derselbe Artikel? (für „zu viel“ bei Auftrag A) */
function abgCands(A,e,need){const out=[];packs.forEach(p=>{if(p.id===A.id)return;const k=(packh[p.id]||{}).klar;if(k&&k.t)return;
  const B=abgBal(p),m=B.miss.find(x=>x.k===e.k);if(!m)return;const fehlt=m.soll-m.back,why=[];
  if(fehlt===need)why.push("Menge passt genau");if(abgOverlap(A,p))why.push("Dispo zur selben Zeit");if(p.pl&&A.pl&&jvNorm(p.pl)===jvNorm(A.pl))why.push("gleicher Projektleiter");if(abgMlHit(A,p,e))why.push("Materialliste „geht weiter“");
  out.push({p,fehlt,why,over:pkState(p).k==="over",end:B.hasEnd})});
 return out.sort((a,b)=>b.why.length-a.why.length||(b.over-a.over)||(b.end-a.end)||((a.p.de||0)-(b.p.de||0)))}
/* Wo kam derselbe Artikel zu viel zurück? (für „fehlt“ bei Auftrag B) */
function abgMoreElse(B0,e){const out=[];packs.forEach(p=>{if(p.id===B0.id)return;const m=abgBal(p).more.find(x=>x.k===e.k);if(m)out.push({p,q:m.back-m.soll-m.fr-m.l55})});return out.sort((a,b)=>b.q-a.q)}
/* ---------- Listen über alle Aufträge ---------- */
function abgAllMore(){const out=[];packs.forEach(p=>{const B=abgBal(p);B.more.forEach(e=>{const q=e.back-e.soll-e.fr-e.l55;const last=B.R.slice().sort((a,b)=>(b.modT||b.closedT||b.t||0)-(a.modT||a.closedT||a.t||0))[0];out.push({p,e,q,last})})});
 return out.sort((a,b)=>((b.last&&(b.last.closedT||b.last.modT||b.last.t))||0)-((a.last&&(a.last.closedT||a.last.modT||a.last.t))||0))}
function abgMissing(){/* Aufträge mit Endretoure oder überfällig, nicht geklärt; pro Artikel zusammengezählt */
 const G={};packs.forEach(p=>{const kl=(packh[p.id]||{}).klar;if(kl&&kl.t)return;const st=pkState(p).k,B=abgBal(p);if(!(B.hasEnd||st==="over"))return;
  B.miss.forEach(e=>{const g=G[e.k]=G[e.k]||{k:e.k,name:e.name,n:0,at:[]};const f=e.soll-e.back;g.n+=f;g.at.push({p,f,over:st==="over",end:B.hasEnd})})});
 return Object.values(G).map(g=>{g.at.sort((a,b)=>(b.over-a.over)||b.f-a.f);g.hint=null;
  for(const a of g.at){const m=abgMoreElse(a.p,{k:g.k});if(m.length){g.hint={from:m[0].p,q:m[0].q};break}}return g}).sort((a,b)=>b.n-a.n)}
function abgToCheck(){if(!can("abg_p"))return[];const out=[];
 packs.forEach(p=>{const B=abgBal(p);if(!B.R.some(r=>r.closed&&r.art==="end"))return;const e=B.R.filter(r=>r.closed&&r.art==="end").sort((a,b)=>(b.closedT||0)-(a.closedT||0))[0],pr=ABP[p.id];
  if(!pr||(pr.t||0)<(e.closedT||0))out.push({id:p.id,p,r:e,B})});
 rets.forEach(r=>{if(!(r.closed&&r.art==="end")||abgPackOf(r.ord))return;const pr=ABP["r_"+r.id];if(!pr||(pr.t||0)<(r.closedT||0))out.push({id:"r_"+r.id,p:null,r,B:null})});
 return out.sort((a,b)=>(a.r.closedT||0)-(b.r.closedT||0))}
function abgCheck(id,endT){return rSave(()=>db.doc("abpr/"+id).set({by:me,t:Date.now(),end:endT||0}),"Als geprüft markiert")}
/* ---------- Bausteine ---------- */
const abgTag=(t,c)=>'<span class="abtag '+c+'">'+esc(t)+'</span>';
function abgBadge(B){return !B.has?abgTag("noch nichts zurück","grey"):B.fehlt||B.zuviel?(B.fehlt?abgTag(B.fehlt+(B.fehlt===1?" fehlt":" fehlen"),"red"):"")+(B.zuviel?abgTag(B.zuviel+" zu viel","or"):""):abgTag("alles zurück ✓","ok")}
const abgRetLbl=r=>!r.closed?"Retourschein offen":r.art==="teil"?"Teilretoure":r.art==="end"?"Endretoure":"Retoure abgeschlossen";
const abgRetT=r=>r.closed?(r.closedT||r.modT||r.t):(r.modT||r.t);
const abgRetN=r=>Object.values(rIt(r)).filter(i=>i.g!=="Zubehör").reduce((a,i)=>a+(+i.q||0),0);
/* Karte in der Packliste (Herricht-Ansicht) */
function abgPkCard(p){if(!abgOk())return"";const B=abgBal(p);if(!B.has)return"";
 return '<button class="card abgpk" type="button" data-abgo="'+esc(p.id)+'"><span class="abgpkt"><b>Abgleich mit Retouren</b><small>'+B.zur+' von '+B.raus+' zurück'+(B.hasEnd?' · Endretoure':'')+'</small></span><span class="abgpkb">'+abgBadge(B)+'</span><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" aria-hidden="true"><path d="M9 6l6 6-6 6"/></svg></button>'}
function abgPkBind(){document.querySelectorAll("[data-abgo]").forEach(b=>b.onclick=()=>{curPack=b.dataset.abgo;go("pkabg")})}
/* Zeile im Retourschein (beim Zählen und in der Ansicht) */
function rAbgInject(){try{if(!abgOk())return;const ex=document.getElementById("rabg");if(ex)ex.remove();let p=null,B=null;
 if(view==="retedit"&&rs){p=abgPackOf(rs.ord);if(p)B=abgBal(p,{id:rs.id,items:rs.items})}
 else if(view==="retopen"){const r=rets.find(x=>x.id===curRet);if(r){p=abgPackOf(r.ord);if(p)B=abgBal(p)}}
 if(!p||!B)return;const off=Math.max(0,B.raus-B.zur),pct=B.raus?Math.min(100,Math.round(B.zur*100/B.raus)):0;
 const h='<button class="rabg" id="rabg" type="button"><span class="rabgt"><span><b>Mit Packliste:</b> '+B.zur+' von '+B.raus+' zurück</span><b class="rabgr">'+(off?off+' offen':'alles da ✓')+(B.zuviel?' · '+B.zuviel+' zu viel':'')+' ›</b></span><span class="rabgbar"><i style="width:'+pct+'%"></i></span></button>';
 const app=$("#app"),first=app&&app.querySelector(".card");if(!app)return;if(first)first.insertAdjacentHTML("afterend",h);else app.insertAdjacentHTML("afterbegin",h);
 $("#rabg").onclick=()=>{if(view==="retedit"&&typeof rPersist==="function")rPersist(true);curPack=p.id;go("pkabg")}}catch(e){console.warn("Abgleich-Zeile",e)}}
/* ---------- Retourschein abschließen: Teil- oder Endretoure ---------- */
function rCloseDlg(r,fn){const p=abgOk()?abgPackOf(r.ord):null,o=document.createElement("div");o.className="ov";let art=null;
 let pv="";if(p){const B=abgBal(p),mL=B.miss.slice(0,3),zL=B.more.slice(0,2);
  pv='<div class="abgbox"><b class="abglh">Abgleich mit der Packliste</b><div class="abgl"><span>Zurück insgesamt</span><b>'+B.zur+' von '+B.raus+'</b></div>'+
   mL.map(e=>{const h=abgMoreElse(p,e)[0];return '<div class="abgl"><span>'+esc(e.name)+(h?'<small class="or">Vorschlag: '+h.q+' zu viel bei '+esc(h.p.ev||h.p.ord)+'</small>':'')+'</span><b class="red">fehlt '+(e.soll-e.back)+'</b></div>'}).join("")+(B.miss.length>3?'<div class="abgl"><span class="mute">und '+(B.miss.length-3)+' weitere</span></div>':'')+
   zL.map(e=>{const zz=e.back-e.soll-e.fr-e.l55,c=abgCands(p,e,zz)[0];return '<div class="abgl"><span>'+esc(e.name)+(c?'<small class="or">Vorschlag: fehlen bei '+esc(c.p.ev||c.p.ord)+'</small>':'')+'</span><b class="or">'+zz+' zu viel</b></div>'}).join("")+
   (!B.miss.length&&!B.more.length?'<div class="abgl"><span>Alles da.</span><b class="ok">✓</b></div>':'')+
   '<small class="mute">Die App ordnet nichts selbst zu. Vorschläge klärst du unter „Zu viel zurück“.</small></div>'}
 o.innerHTML='<div class="card abgdlg"><b style="font-size:18px">Retourschein abschließen</b><div class="mute">'+esc(r.ev||"")+(r.ord?' · Auftrag '+esc(r.ord):'')+'</div>'+
  '<b style="display:block;margin:12px 0 8px">Kommt von diesem Auftrag noch etwas zurück?</b>'+
  '<button class="abgopt" type="button" data-art="teil"><i></i><span><b>Teilretoure – es kommt noch etwas</b><small>Zum Beispiel der Rest nach dem Aufbau. Der offene Stand sinkt, niemand wird gefragt.</small></span></button>'+
  '<button class="abgopt" type="button" data-art="end"><i></i><span><b>Endretoure – Abbau ist zurück</b><small>Danach kommt der Auftrag zur Prüfung.</small></span></button>'+pv+
  '<div class="row" style="margin-top:12px"><button class="btn ghost" id="abgx">Abbrechen</button><button class="btn" id="abgok" disabled>Abschließen</button></div></div>';
 document.body.appendChild(o);const ok=o.querySelector("#abgok");
 o.querySelectorAll("[data-art]").forEach(b=>b.onclick=()=>{art=b.dataset.art;o.querySelectorAll("[data-art]").forEach(x=>x.classList.toggle("on",x===b));ok.disabled=false});
 o.querySelector("#abgx").onclick=()=>o.remove();ok.onclick=()=>{if(!art)return;o.remove();fn(art)}}
/* ---------- Ansicht: Auftragskonto ---------- */
function pkAbgView(){const p=packs.find(x=>x.id===curPack);if(!p||!abgOk()){view="pack";return packOverView()}
 $("#t").textContent="Abgleich";const B=abgBal(p),H=pkH(p),kl=H.klar&&H.klar.t?H.klar:null,pr=ABP[p.id],endT=B.R.filter(r=>r.closed&&r.art==="end").reduce((a,r)=>Math.max(a,r.closedT||0),0);
 const wait=endT&&(!pr||(pr.t||0)<endT),endR=B.R.filter(r=>r.closed&&r.art==="end").sort((a,b)=>(b.closedT||0)-(a.closedT||0))[0];
 const chk=wait&&can("abg_p")?'<section class="abgchk"><svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M9 11l3 3 8-8"/><path d="M20 12v7a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h9"/></svg><span><b>Wartet auf Prüfung</b><small>Endretoure von '+esc(nmA(endR,"closedBy"))+', '+fmt(endR.closedT).slice(0,6)+'</small></span><button class="btn s" id="abgpr" type="button">Geprüft</button></section>':
  (pr&&!wait?'<div class="abgdone">✓ Geprüft von '+esc(nmA(pr,"by"))+', '+fmt(pr.t).slice(0,6)+'</div>':'');
 const nums=[[B.raus,"Raus",""],[B.zur,"Zurück",""],[B.fehlt,"Fehlt",B.fehlt?"red":""]].concat(B.zuviel?[[B.zuviel,"Zu viel","or"]]:[]);
 const head='<section class="abgcard"><div class="abgh"><span><b>'+esc(p.ev||"Ohne Veranstaltung")+'</b><small>Auftrag '+esc(p.ord||"–")+(p.pl?' · '+esc(shortName(p.pl)):'')+' · Dispo '+pkDM(p.db)+'–'+pkDM(p.de)+'</small></span><span class="abgpkb">'+abgBadge(B)+'</span></div>'+
  '<div class="abgnums" style="grid-template-columns:repeat('+nums.length+',minmax(0,1fr))">'+nums.map(([n,l,c])=>'<div class="'+c+'"><b>'+n+'</b><span>'+l+'</span></div>').join("")+'</div>'+
  '<small class="mute">Ohne Fremdmiete'+(B.l55?' und Lager 55':'')+'. Zugeordnet wird nur, was jemand bestätigt hat – Vorschläge ändern nichts an den Zahlen.</small>'+(kl?'<div class="abgdone">✓ Mit Projektleiter geklärt · '+esc(nmA(kl,"by"))+', '+fmt(kl.t).slice(0,6)+'</div>':'')+'</section>';
 const ev=[{t:p.db||p.t,l:"Packliste raus",s:"Packschein "+(p.ps||"–")+(pkProg(p).fin?" · hergerichtet von "+esc(nm(H.fin.by)):""),n:"↑ "+(B.raus-abgZusOut(p)),c:"out"}];
 (p.zus||[]).forEach(z=>ev.push({t:z.t||p.t,l:"Nachlieferung",s:"Zusatz-Packschein "+(z.ps||"–"),n:"↑ "+abgZusOut(p,z.ps),c:"out"}));
 B.R.forEach(r=>ev.push({t:abgRetT(r),l:abgRetLbl(r),s:esc(nmA(r,r.closed?"closedBy":"by")),n:"↓ "+abgRetN(r),c:"in",ret:r.id}));
 ABZ.filter(z=>z.from===p.id||z.to===p.id).forEach(z=>{const o=packs.find(x=>x.id===(z.from===p.id?z.to:z.from));ev.push({t:z.t,l:z.from===p.id?"Zugeordnet an "+(o?o.ev||o.ord:"anderen Auftrag"):"Zugeordnet von "+(o?o.ev||o.ord:"anderem Auftrag"),s:z.q+"× "+z.name+" · "+nmA(z,"by"),n:(z.from===p.id?"− ":"+ ")+z.q,c:"zu"})});
 ev.sort((a,b)=>(a.t||0)-(b.t||0));
 const verl='<section class="abgcard"><b class="abglh">Verlauf</b>'+ev.map(x=>'<'+(x.ret?'button type="button" data-abgr="'+esc(x.ret)+'"':'div')+' class="abgev"><span class="abgd">'+pkDM(x.t)+'</span><span class="abgt"><b>'+esc(x.l)+'</b><small>'+x.s+'</small></span><b class="abgn '+x.c+'">'+esc(x.n)+'</b></'+(x.ret?'button':'div')+'>').join("")+'</section>';
 const ord=e=>e.soll>e.back?0:e.back>e.soll+e.fr+e.l55?1:2;
 const arts='<section class="abgcard"><div class="abglh" style="display:flex"><b style="flex:1">Artikel</b><small class="mute">raus · zurück</small></div>'+B.L.slice().sort((a,b)=>ord(a)-ord(b)||String(a.name).localeCompare(String(b.name),"de")).map(e=>{
  const f=e.soll-e.back,z=e.back-e.soll-e.fr-e.l55,tag=f>0?abgTag("fehlt "+f,"red"):z>0?abgTag(z+" zu viel","or"):!e.soll&&e.l55&&!e.back?abgTag("Lager 55","grey"):abgTag("passt ✓","ok"),sub=[];
  if(f>0){const h=abgMoreElse(p,e)[0];if(h)sub.push('<button class="abgsug" type="button" data-abgzv="1"><span>Vorschlag: bei '+esc(h.p.ev||h.p.ord)+' kamen '+h.q+' zu viel zurück</span><b>Klären ›</b></button>')}
  if(z>0){const c=abgCands(p,e,z)[0];sub.push('<button class="abgsug" type="button" data-abgzv="1"><span>'+(c?'Vorschlag: fehlen bei '+esc(c.p.ev||c.p.ord):'Kein Vorschlag – fehlt derzeit nirgends')+'</span><b>Klären ›</b></button>')}
  if(e.fr)sub.push('<small class="mute">+ '+pkNum(e.fr)+' Fremdmiete – zählen hier nicht</small>');
  if(e.l55)sub.push('<small class="mute">+ '+pkNum(e.l55)+' über Lager 55 – zählen hier nicht</small>');if(e.via55)sub.push('<small class="mute">'+e.via55+' kam über uns statt Lager 55 zurück</small>');
  if(e.zin)sub.push('<small class="mute">'+e.zin+' von anderem Auftrag zugeordnet</small>');if(e.zout)sub.push('<small class="mute">'+e.zout+' an anderen Auftrag zugeordnet</small>');
  return '<div class="abgart"><div class="abgar"><b>'+esc(e.name)+'</b><span>'+pkNum(e.soll)+' · '+pkNum(e.back)+'</span>'+tag+'</div>'+sub.join("")+'</div>'}).join("")+'</section>';
 $("#app").innerHTML=chk+head+verl+arts+'<div class="abgbtns"><button class="btn ghost" id="abgxl" type="button">Abgleich als Excel</button>'+
  (B.fehlt||B.zuviel?'<button class="btn" id="abgask" type="button">Nachfrage an '+esc(shortName(p.pl)||"Projektleiter")+'</button>':'')+
  (kl?'<button class="btn ghost" id="abgkl0" type="button">„Geklärt“ zurücknehmen</button>':'<button class="btn ghost" id="abgkl" type="button">Mit Projektleiter geklärt</button>')+
  '<button class="btn ghost" id="abgpk" type="button">Packliste öffnen</button></div>';
 if($("#abgpr"))$("#abgpr").onclick=()=>abgCheck(p.id,endT);
 document.querySelectorAll("[data-abgr]").forEach(b=>b.onclick=()=>{curRet=b.dataset.abgr;go("retopen")});
 document.querySelectorAll("[data-abgzv]").forEach(b=>b.onclick=()=>go("abgzv"));
 $("#abgxl").onclick=()=>abgXl(p);if($("#abgask"))$("#abgask").onclick=()=>jvAskPlP(p);
 if($("#abgkl"))$("#abgkl").onclick=()=>ask("Auftrag "+(p.ord||"")+" als mit dem Projektleiter geklärt markieren? Dann zählt er nicht mehr bei „Fehlt noch“ und gilt nicht als überfällig.",()=>pkHSet(p,{klar:{by:me,t:Date.now()}}).then(()=>toast("Als geklärt markiert",1)));
 if($("#abgkl0"))$("#abgkl0").onclick=()=>ask("„Geklärt“ zurücknehmen?",()=>pkHSet(p,{klar:null}).then(()=>toast("Zurückgenommen",1)));
 $("#abgpk").onclick=()=>go("packopen")}
function abgZusOut(p,ps){const H=pkH(p);let n=0;pkItems(p).forEach(o=>{if(!o.z||(ps!==undefined&&o.z!==String(ps)))return;const x=o.x,h=H[o.k],st=pkPS(x,h),f=h&&h.fm==="lager"?0:(+x.f||0),own=Math.max(0,(+x.n||0)-f);
 n+=st.s==="open"?own:h&&h.ok?own:Math.min(own,+st.q||0);if(st.s!=="open")(st.alt||[]).forEach(a=>n+=+a.n||0)});return n}
/* ---------- Ansicht: Zu viel zurück ---------- */
function abgZvView(){if(!abgOk()){view="start";return startView()}$("#t").textContent="Zu viel zurück";const L=abgAllMore();
 const card=(o,i)=>{const C=abgCands(o.p,o.e,o.q),nk=o.p.id+"|"+o.e.k,note=ABN[nk];
  return '<section class="abgcard abgzv"><div class="abgh"><span><b>'+o.q+'× '+esc(o.e.name)+' zu viel</b><small>zurück mit '+esc(o.p.ev||"–")+' (Auftrag '+esc(o.p.ord||"–")+')'+(o.last?' · '+esc(nmA(o.last,o.last.closed?"closedBy":"by"))+', '+fmt(abgRetT(o.last)).slice(0,6):'')+'</small></span></div>'+
   (C.length?'<b class="abglh">Könnte passen zu</b>'+C.slice(0,3).map((c,j)=>'<div class="abgcand"><div class="abgar"><b>'+esc(c.p.ev||"–")+'</b>'+abgTag("fehlen "+c.fehlt,"red")+'</div><small class="mute">Auftrag '+esc(c.p.ord||"–")+(c.p.pl?' · '+esc(shortName(c.p.pl)):'')+(c.over?' · überfällig':c.end?' · Endretoure':'')+'</small>'+
     (c.why.length?'<div class="abgwhy">'+c.why.map(w=>'<span>'+esc(w)+'</span>').join("")+'</div>':'')+'<button class="btn s'+(j?' ghost':'')+'" type="button" data-zuo="'+i+'|'+j+'">Zu '+esc(c.p.ev||c.p.ord)+' zuordnen</button></div>').join(""):
    '<div class="abgnone">Kein Vorschlag – fehlt derzeit nirgends. Fehlt es später irgendwo, erscheint hier ein Vorschlag.</div>')+
   (note?'<div class="abgnote">✎ '+esc(note.txt)+' · '+esc(nmA(note,"by"))+', '+fmt(note.t).slice(0,6)+'</div>':'')+
   '<div class="abgbtnr">'+(o.p.pl?'<button class="btn ghost s" type="button" data-zask="'+i+'">Nachfrage an PL</button>':'')+'<button class="btn ghost s" type="button" data-zoth="'+i+'">Anderer Auftrag …</button><button class="btn ghost s" type="button" data-znote="'+i+'">Notiz</button></div></section>'};
 const done=ABZ.slice().sort((a,b)=>(b.t||0)-(a.t||0)).slice(0,20);
 $("#app").innerHTML='<p class="mute" style="margin:0 0 10px;line-height:1.45">Kam irgendwo mehr zurück als rausging, zeigt die App, wo derselbe Artikel fehlt. Zugeordnet wird erst, wenn du es bestätigst – bis dahin bleibt alles, wie es ist.</p>'+
  (L.length?L.map(card).join(""):'<div class="card mute">Nichts offen. Nirgends kam mehr zurück als rausging.</div>')+
  (done.length?'<section class="abgcard"><b class="abglh">Bestätigt · '+ABZ.length+'</b>'+done.map(z=>{const f=packs.find(x=>x.id===z.from),t=packs.find(x=>x.id===z.to);
   return '<div class="abgev"><span class="abgt"><b>'+z.q+'× '+esc(z.name)+' → '+esc(t?t.ev||t.ord:"?")+'</b><small>kam mit '+esc(f?f.ev||f.ord:"?")+' · '+esc(nmA(z,"by"))+', '+fmt(z.t).slice(0,6)+'</small></span><button class="btn ghost s" type="button" data-zundo="'+esc(z.id)+'">Rückgängig</button></div>'}).join("")+'</section>':'');
 const zuo=(o,c,q)=>ask(q+"× "+o.e.name+" zu "+(c.ev||c.ord)+" zuordnen? Dann zählt es dort als zurück und bei "+(o.p.ev||o.p.ord)+" nicht mehr als zu viel.",()=>rSave(()=>db.doc("abzu/"+Date.now().toString(36)+Math.random().toString(36).slice(2,5)).set({k:o.e.k,code:o.e.code||"",name:o.e.name,q,from:o.p.id,to:c.id,by:me,t:Date.now()}),"Zugeordnet"));
 document.querySelectorAll("[data-zuo]").forEach(b=>b.onclick=()=>{const[i,j]=b.dataset.zuo.split("|").map(Number),o=L[i],c=abgCands(o.p,o.e,o.q)[j];if(c)zuo(o,c.p,Math.min(o.q,c.fehlt))});
 document.querySelectorAll("[data-zask]").forEach(b=>b.onclick=()=>jvAskPlP(L[+b.dataset.zask].p));
 document.querySelectorAll("[data-zoth]").forEach(b=>b.onclick=()=>{const o=L[+b.dataset.zoth];abgPickPack(o.p,c=>zuo(o,c,o.q))});
 document.querySelectorAll("[data-znote]").forEach(b=>b.onclick=()=>{const o=L[+b.dataset.znote],nk=o.p.id+"|"+o.e.k;tDlg("Notiz zu "+o.q+"× "+o.e.name,(ABN[nk]||{}).txt||"",v=>rSave(()=>db.doc("abno/"+nk.replace(/[^A-Za-z0-9_|:-]/g,"_")).set({txt:v,by:me,t:Date.now()}),"Notiz gespeichert"))});
 document.querySelectorAll("[data-zundo]").forEach(b=>b.onclick=()=>ask("Zuordnung zurücknehmen?",()=>rSave(()=>db.doc("abzu/"+b.dataset.zundo).delete(),"Zurückgenommen")))}
function abgPickPack(not,cb){const o=document.createElement("div");o.className="ov";const P=packs.filter(p=>p.id!==not.id).sort((a,b)=>(b.de||0)-(a.de||0));
 o.innerHTML='<div class="card" style="width:100%;max-width:420px;margin:0;max-height:88vh;display:flex;flex-direction:column"><b>Zu welchem Auftrag?</b><input id="abgq" placeholder="Auftragsnummer oder Veranstaltung" style="margin:8px 0"><div id="abgpl" style="overflow:auto;flex:1"></div><button class="btn ghost" id="abgpx" style="margin-top:8px">Abbrechen</button></div>';
 document.body.appendChild(o);const q=o.querySelector("#abgq"),box=o.querySelector("#abgpl");
 const show=()=>{const v=jvNorm(q.value);box.innerHTML=P.filter(p=>!v||jvNorm((p.ev||"")+" "+(p.ord||"")).includes(v)).slice(0,30).map(p=>'<button class="jvln" type="button" data-pp="'+esc(p.id)+'"><span class="jvlt"><b>'+esc(p.ev||"–")+'</b><small>Auftrag '+esc(p.ord||"–")+' · Dispo '+pkDM(p.db)+'–'+pkDM(p.de)+'</small></span></button>').join("")||'<div class="mute" style="padding:8px 0">Nichts gefunden.</div>';
  box.querySelectorAll("[data-pp]").forEach(b=>b.onclick=()=>{o.remove();cb(packs.find(x=>x.id===b.dataset.pp))})};
 q.oninput=show;show();o.querySelector("#abgpx").onclick=()=>o.remove();setTimeout(()=>q.focus(),60)}
/* ---------- Ansicht: Zu prüfen ---------- */
function abgPrView(){if(!can("abg_p")){view="start";return startView()}$("#t").textContent="Zu prüfen";const L=abgToCheck();
 const wk=pkMon(pkDay(Date.now())),D=Object.entries(ABP).filter(([,x])=>(x.t||0)>=wk).sort((a,b)=>b[1].t-a[1].t);
 $("#app").innerHTML='<p class="mute" style="margin:0 0 10px;line-height:1.45">Jede Endretoure landet hier, bis jemand mit dem Recht „Abgleich prüfen“ sie als geprüft markiert.</p>'+
  (L.length?L.map((x,i)=>'<section class="abgcard"><div class="abgh"><span><b>'+esc(x.p?x.p.ev||"–":x.r.ev||"–")+'</b><small>Auftrag '+esc((x.p?x.p.ord:x.r.ord)||"–")+(x.p&&x.p.pl?' · '+esc(shortName(x.p.pl)):'')+' · Endretoure von '+esc(nmA(x.r,"closedBy"))+', '+fmt(x.r.closedT).slice(0,6)+'</small></span></div>'+
   '<div class="abgtags">'+(x.B?abgBadge(x.B)+(x.B.more.length?abgTag(x.B.more.length===1?"1 Vorschlag":x.B.more.length+" Vorschläge","grey"):""):abgTag("keine Packliste – nur Retourschein","grey"))+'</div>'+
   '<div class="abg2"><button class="btn ghost" type="button" data-prv="'+i+'">Ansehen</button><button class="btn" type="button" data-prk="'+i+'">Geprüft</button></div></section>').join(""):'<div class="card mute">Nichts zu prüfen.</div>')+
  (D.length?'<details class="abgcard abgmore"><summary><b>Zuletzt geprüft</b><small>'+D.length+' diese Woche</small></summary>'+D.map(([id,x])=>{const p=packs.find(q=>q.id===id),r=id.startsWith("r_")?rets.find(q=>"r_"+q.id===id):null;
   return '<div class="abgev"><span class="abgt"><b>'+esc(p?p.ev||p.ord:r?r.ev:"–")+'</b><small>'+esc(nmA(x,"by"))+', '+fmt(x.t)+'</small></span></div>'}).join("")+'</details>':'');
 document.querySelectorAll("[data-prv]").forEach(b=>b.onclick=()=>{const x=L[+b.dataset.prv];if(x.p){curPack=x.p.id;go("pkabg")}else{curRet=x.r.id;go("retopen")}});
 document.querySelectorAll("[data-prk]").forEach(b=>b.onclick=()=>{const x=L[+b.dataset.prk];abgCheck(x.id,x.r.closedT)})}
/* ---------- Excel ---------- */
async function abgXlMake(p){if(!window.ExcelJS)throw new Error("Excel-Bibliothek nicht geladen.");const B=abgBal(p),NAVY="FF114A97",wb=new ExcelJS.Workbook();
 const fill=c=>({type:"pattern",pattern:"solid",fgColor:{argb:c}}),bd={top:{style:"thin",color:{argb:"FFC9D1DC"}},left:{style:"thin",color:{argb:"FFC9D1DC"}},bottom:{style:"thin",color:{argb:"FFC9D1DC"}},right:{style:"thin",color:{argb:"FFC9D1DC"}}};
 const head=(ws,cols)=>{const r=ws.addRow(cols);r.eachCell(c=>{c.fill=fill(NAVY);c.font={bold:true,color:{argb:"FFFFFFFF"}};c.border=bd;c.alignment={vertical:"middle",horizontal:"center",wrapText:true}});r.height=22};
 const kopf=ws=>{ws.addRow(["Abgleich Packliste ↔ Retouren"]).font={bold:true,size:14,color:{argb:NAVY}};
  ws.addRow(["Veranstaltung: "+(p.ev||"–")+" · Auftrag: "+(p.ord||"–")+" · Projektleiter: "+(shortName(p.pl)||"–")+" · Dispo "+pkD(p.db)+" – "+pkD(p.de)]);
  ws.addRow(["Stand: "+(B.hasEnd?"Endretoure ("+fmt(B.endR.closedT)+")":B.R.length?"Teilretoure / offen":"noch nichts zurück")+" · Retourscheine: "+B.R.length+" · Erstellt von "+meName()+", "+fmt(Date.now())]);ws.addRow([])};
 const ws=wb.addWorksheet("Übersicht",{pageSetup:{orientation:"landscape",fitToPage:true,fitToWidth:1,fitToHeight:0}});kopf(ws);
 ws.columns=[{width:11},{width:36},{width:9},{width:13},{width:12},{width:9},{width:11},{width:10},{width:46}];
 head(ws,["Art.-Nr.","Artikel","Raus","Nachlieferung","Fremdmiete","Zurück","Differenz","Status","Bemerkung / Zuordnung"]);
 const ord=e=>e.soll>e.back?0:e.back>e.soll+e.fr+e.l55?1:2;let sr=0,sn=0,sf=0,sb=0;
 B.L.slice().sort((a,b)=>ord(a)-ord(b)||String(a.name).localeCompare(String(b.name),"de")).forEach((e,i)=>{const f=e.soll-e.back,z=e.back-e.soll-e.fr-e.l55,st=f>0?"fehlt":z>0?"zu viel":!e.soll&&e.l55&&!e.back?"Lager 55":"passt",bm=[];if(e.l55)bm.push(pkNum(e.l55)+" über Lager 55 zählen nicht");if(e.via55)bm.push(e.via55+" kam über uns statt Lager 55 zurück");
  if(f>0){const h=abgMoreElse(p,e)[0];if(h)bm.push("Vorschlag: "+h.q+" zu viel bei "+(h.p.ev||h.p.ord))}if(z>0){const c=abgCands(p,e,z)[0];bm.push(c?"Vorschlag: fehlen bei "+(c.p.ev||c.p.ord):"kein Vorschlag")}
  if(e.zin)bm.push(e.zin+" von anderem Auftrag zugeordnet");if(e.zout)bm.push(e.zout+" an anderen Auftrag zugeordnet");if(e.fr)bm.push(pkNum(e.fr)+" Fremdmiete zählen nicht");
  const r=ws.addRow([e.code||"",e.name,e.raus,e.nach||"",e.fr||"",e.back,f>0?-f:z>0?z:0,st,bm.join(" · ")]);sr+=e.raus;sn+=e.nach;sf+=e.fr;sb+=e.back;
  const col=f>0?"FFB8322A":z>0?"FF9A4D00":"FF1F6B41",bg=f>0?"FFFBEBEB":z>0?"FFFFF1E3":"FFE3F3E9";
  r.eachCell({includeEmpty:true},(c,n)=>{c.border=bd;c.alignment={vertical:"middle",horizontal:n===2||n===9?"left":"center",wrapText:n===9};if(i%2)c.fill=fill("FFF6F8FB")});
  r.getCell(7).font={bold:true,color:{argb:col}};r.getCell(8).font={bold:true,color:{argb:col}};r.getCell(8).fill=fill(bg)});
 const t=ws.addRow(["","Gesamt",sr,sn||"",sf||"",sb,(B.fehlt?"−"+B.fehlt:"0")+(B.zuviel?" / +"+B.zuviel:""),"",(B.fehlt?B.fehlt+" fehlen":"nichts fehlt")+(B.zuviel?" · "+B.zuviel+" zu viel":"")]);
 t.eachCell({includeEmpty:true},(c,n)=>{c.border=bd;c.font={bold:true};c.fill=fill("FFEEF3FA");c.alignment={horizontal:n===2||n===9?"left":"center"}});
 const wv=wb.addWorksheet("Verlauf");wv.columns=[{width:17},{width:22},{width:36},{width:10},{width:18}];kopf(wv);head(wv,["Datum","Art","Artikel","Menge","Wer"]);
 const ev=[];const H=pkH(p);
 pkItems(p).forEach(o=>{const x=o.x,h=H[o.k],st=pkPS(x,h),f=h&&h.fm==="lager"?0:(+x.f||0),own=Math.max(0,(+x.n||0)-f),q=st.s==="open"?own:h&&h.ok?own:Math.min(own,+st.q||0);
  const zd=o.z?(p.zus||[]).find(z=>String(z.ps)===o.z):null;if(q)ev.push([zd?zd.t||p.t:p.db||p.t,zd?"Nachlieferung "+o.z:"Packliste raus",pkName(x),q,h&&h.by?nmA(h,"by"):""]);
  if(st.s!=="open")(st.alt||[]).forEach(a=>ev.push([zd?zd.t||p.t:p.db||p.t,"Alternative",a.t,+a.n||0,h&&h.by?nmA(h,"by"):""]))});
 B.R.forEach(r=>Object.values(rIt(r)).forEach(i=>{if(i.g!=="Zubehör"&&+i.q)ev.push([abgRetT(r),abgRetLbl(r),i.name,-(+i.q),nmA(r,r.closed?"closedBy":"by")])}));
 ABZ.filter(z=>z.from===p.id||z.to===p.id).forEach(z=>{const o=packs.find(x=>x.id===(z.from===p.id?z.to:z.from));ev.push([z.t,z.from===p.id?"Zugeordnet an "+(o?o.ev||o.ord:"?"):"Zugeordnet von "+(o?o.ev||o.ord:"?"),z.name,z.from===p.id?+z.q:-z.q,nmA(z,"by")])});
 ev.sort((a,b)=>(a[0]||0)-(b[0]||0)).forEach((e,i)=>{const r=wv.addRow([fmt(e[0]),e[1],e[2],e[3]>0?"↑ "+e[3]:"↓ "+(-e[3]),e[4]]);r.eachCell({includeEmpty:true},(c,n)=>{c.border=bd;if(i%2)c.fill=fill("FFF6F8FB");if(n===4)c.alignment={horizontal:"center"}})});
 const wz=wb.addWorksheet("Zu viel – Zuordnungen");wz.columns=[{width:30},{width:9},{width:28},{width:40},{width:22}];kopf(wz);head(wz,["Artikel","Menge","Status","Auftrag / Vorschlag","Wer / Wann"]);
 B.more.forEach(e=>{const z=e.back-e.soll-e.fr-e.l55,C=abgCands(p,e,z);wz.addRow([e.name,z,"offen – zu viel hier",C.length?"Vorschlag: "+C.slice(0,3).map(c=>(c.p.ev||c.p.ord)+" (fehlen "+c.fehlt+")").join(", "):"kein Vorschlag",""]).eachCell(c=>c.border=bd)});
 B.miss.forEach(e=>{const M=abgMoreElse(p,e);if(M.length)wz.addRow([e.name,e.soll-e.back,"fehlt hier – Vorschlag",M.slice(0,3).map(m=>m.q+" zu viel bei "+(m.p.ev||m.p.ord)).join(", "),""]).eachCell(c=>c.border=bd)});
 ABZ.filter(z=>z.from===p.id||z.to===p.id).forEach(z=>{const o=packs.find(x=>x.id===(z.from===p.id?z.to:z.from));wz.addRow([z.name,z.q,"bestätigt",(z.from===p.id?"an ":"von ")+(o?o.ev||o.ord:"?"),nmA(z,"by")+", "+fmt(z.t)]).eachCell(c=>c.border=bd)});
 if(wz.rowCount<=5)wz.addRow(["Nichts zu viel, keine Zuordnungen."]);
 const buf=await wb.xlsx.writeBuffer(),fn="Abgleich_"+String(p.ev||p.ord||"Auftrag").replace(/[^A-Za-z0-9äöüÄÖÜß]+/g,"_")+"_"+new Date().toISOString().slice(0,10)+".xlsx";
 const XT="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet";return{fn,blob:new Blob([buf],{type:XT}),XT,B}}
async function abgXl(p){const dl=await claude.use("downloads");if(!dl)return toast("Speichern ist hier nicht verfügbar.");try{const x=await abgXlMake(p);await dl.save({filename:x.fn,data:x.blob})}catch(e){if(e&&(e.code==="declined"||e.name==="AbortError"))return;console.error(e);toast("Excel konnte nicht erstellt werden.")}}
/* für die Retoure-Mail: Datei + kurzer Text */
async function abgXlFile(r){const p=abgOk()?abgPackOf(r.ord):null;if(!p)return null;try{const x=await abgXlMake(p),B=x.B;
 const t="\n\nAbgleich mit der Packliste (Auftrag "+(p.ord||"–")+"): "+B.zur+" von "+B.raus+" zurück."+(B.miss.length?"\nFehlt noch:\n"+B.miss.map(e=>"- "+(e.soll-e.back)+"× "+e.name).join("\n"):"\nEs fehlt nichts.")+(B.more.length?"\nMehr zurück:\n"+B.more.map(e=>"- "+(e.back-e.soll-e.fr-e.l55)+"× "+e.name).join("\n"):"")+"\nDetails im Anhang (Abgleich-Excel).";
 return{file:new File([x.blob],x.fn,{type:x.XT}),fn:x.fn,blob:x.blob,txt:t}}catch(e){console.warn(e);return null}}
function abgMailOpt(r){const p=abgOk()?abgPackOf(r.ord):null;if(!p)return"";const B=abgBal(p);
 return '<div class="abgbox" style="margin:10px 0"><b class="abglh">Anhänge</b><label class="abgchkl"><input type="checkbox" checked disabled>Retourschein (Excel)</label><label class="abgchkl"><input type="checkbox" id="mtabg" checked><span>Abgleich mit Packliste (Excel)<small class="mute">'+(B.fehlt||B.zuviel?(B.fehlt?B.fehlt+" fehlen":"")+(B.fehlt&&B.zuviel?" · ":"")+(B.zuviel?B.zuviel+" zu viel":""):"alles zurück")+'</small></span></label></div>'}
/* ---------- Lager Übersicht: Streifen „Zu prüfen“ und Reiter „Fehlt noch“ ---------- */
function abgPrStrip(){const L=abgToCheck();if(!L.length)return"";const nm=L.slice(0,2).map(x=>x.p?x.p.ev||x.p.ord:x.r.ev).join(", ")+(L.length>2?" …":"");
 return '<button class="abgstrip" type="button" id="abgstrip"><svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M9 11l3 3 8-8"/><path d="M20 12v7a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h9"/></svg><span><b>'+(L.length===1?"1 Auftrag":L.length+" Aufträge")+' zu prüfen</b> · '+esc(nm)+'</span><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" aria-hidden="true"><path d="M9 6l6 6-6 6"/></svg></button>'}
function abgMissTab(){const G=abgMissing(),Z=abgAllMore().length;
 return{h:"Fehlt noch",e:"Es fehlt nichts. Gezählt werden Aufträge mit Endretoure oder überfällig.",
  L:G.map(g=>{const a=g.at[0];return '<button class="jvln" type="button" data-'+(g.hint?'abgzv="1"':'jp="'+esc(a.p.id)+'" data-jpa="1"')+'><span class="jvlt"><b>'+esc(g.name)+'</b><small>'+(g.hint?'<span class="or">Vielleicht: '+g.hint.q+' kamen bei '+esc(g.hint.from.ev||g.hint.from.ord)+' zu viel zurück</span>':'am ehesten bei '+esc(a.p.ev||a.p.ord)+(a.over?', überfällig':', Endretoure'))+'</small></span><span class="jvlr warn">'+g.n+(g.n===1?' fehlt':' fehlen')+'</span></button>'}),
  foot:Z?'<button class="jvln abgzvl" type="button" data-abgzv="1"><span class="jvlt"><b>Zu viel zurück: '+Z+' offen zum Klären</b></span><span class="jvlr">›</span></button>':""}}
function abgJvBind(){const s=$("#abgstrip");if(s)s.onclick=()=>go("abgpr");document.querySelectorAll("#jv [data-abgzv]").forEach(b=>b.onclick=()=>go("abgzv"));document.querySelectorAll("#jv [data-jpa]").forEach(b=>b.onclick=()=>{curPack=b.dataset.jp;go("pkabg")})}
