/* ===== Wochenbericht (ab 1.81) – für die Montagsbesprechung, zum Drucken =====
   Besprechung = Montag der „diesen Woche“ (Sa/So → nächster Montag). Block 1 letzte Woche (Mo–So davor), Block 2 diese Woche (Mo–Fr, Sa/So beim Freitag),
   Block 3 Punkte zur Besprechung (docs „wbnote“ {txt,by,t,done:{by,t}|null}) – eintragen darf jeder mit „Lager Übersicht“. Alle betroffenen Aufträge werden angeführt. */
let wbOff=0,WBN=[],wbOn=false,wbBemOpen=null,wbBemEdit=null;
/* Bemerkungen zu Punkten (ab 1.91): Feld b_<id> = {txt,by,t,mod} im wbnote-Dokument (null = gelöscht); mehrere pro Punkt, schreiben darf jeder mit Lager Übersicht,
   ändern/löschen eigene, Admin (v_app) alle; auch bei erledigten Punkten; im Ausdruck klein unter dem Punkt */
const wbBems=n=>Object.keys(n||{}).filter(k=>/^b_/.test(k)&&n[k]&&n[k].txt).map(k=>({id:k,...n[k]})).sort((a,b)=>(a.t||0)-(b.t||0));
const wbBemTx=b=>nmA(b,"by")+", "+pkDM(b.t)+": "+b.txt;
function wbBemHtml(n){const B=wbBems(n),op=wbBemOpen===n.id,ed=wbBemEdit&&wbBemEdit.n===n.id?wbBemEdit.b:null,cur=ed?(n[ed]||{}).txt||"":"";
 return '<div class="wbbm">'+B.map(b=>'<div class="wbb"><span><b>'+esc(nmA(b,"by"))+'</b>, '+pkDM(b.t)+(b.mod?' (geändert)':'')+': '+esc(b.txt)+'</span>'+(b.by===me||can("v_app")?'<span class="wbba"><button type="button" class="lnk" data-wbbe="'+esc(n.id)+'|'+esc(b.id)+'">Ändern</button> · <button type="button" class="lnk" data-wbbx="'+esc(n.id)+'|'+esc(b.id)+'" style="color:var(--bad)">Löschen</button></span>':'')+'</div>').join("")+
  (op||ed?'<div class="wbbi"><label><span class="sr">Bemerkung</span><input data-wbbi="'+esc(n.id)+'" maxlength="300" placeholder="Bemerkung …" autocomplete="off" value="'+esc(cur)+'"></label><button class="btn s" type="button" data-wbbs="'+esc(n.id)+'">'+(ed?'Speichern':'Hinzufügen')+'</button><button class="lnk" type="button" data-wbbc="1">Abbrechen</button></div>':
   '<button type="button" class="lnk wbbadd" data-wbbo="'+esc(n.id)+'">+ Bemerkung</button>')+'</div>'}
function wbSub(){if(wbOn)return;wbOn=true;try{db.collection("wbnote").onSnapshot(s=>{WBN=s.docs.map(d=>({id:d.id,...d.data()}));if(view==="wb")wbView()})}catch(e){console.warn(e)}}
const wbWd=t=>PK_WD[new Date(t).getDay()]+" "+pkDM(t);
function wbMeet(){const t0=pkDay(Date.now()),w=new Date(t0).getDay();let m=pkMon(t0);if(w===6||w===0)m=pkAddD(m,7);return pkAddD(m,7*wbOff)}
const wbIn=(t,a,b)=>t&&t>=a&&t<b;
function wbData(){const M=wbMeet(),L0=pkAddD(M,-7),L1=M,N1=pkAddD(M,7),t0=pkDay(Date.now());
 const okPk=can("pk_s"),okRet=can("ret_s");
 /* letzte Woche */
 const herr=okPk?packs.filter(p=>{const H=pkH(p);return H.fin&&wbIn(H.fin.t,L0,L1)}).sort((a,b)=>pkH(a).fin.t-pkH(b).fin.t).map(p=>{const H=pkH(p),g=pkProg(p),f=pkF(p).length;
  return{n:p.ev||"Packliste",d:(p.ord||"–")+" · "+wbWd(H.fin.t)+" · "+g.n+(g.n===1?" Position":" Positionen")+(f?", "+f+" Fremdmiete":"")+(g.l55?", "+g.l55+" Lager 55":"")+" · "+nmA(H.fin,"by"),pk:p.id}}).concat(packs.flatMap(p=>(p.zus||[]).filter(z=>z.v).map(z=>({p,z,f:pkZFin(p,z)}))).filter(o=>o.f&&wbIn(o.f.t,L0,L1)).sort((a,b)=>a.f.t-b.f.t).map(o=>{const g=pkZProg(o.p,o.z.ps);
  return{n:"Zusatz "+o.z.ps+" zu "+(o.p.ev||"Packliste"),d:(o.p.ord||"–")+" · "+wbWd(o.f.t)+" · "+g.n+(g.n===1?" Position":" Positionen")+" · "+nmA(o.f,"by"),pk:o.p.id}})):[];
 const zur=okRet?rets.filter(r=>r.closed&&wbIn(r.closedT,L0,L1)).sort((a,b)=>a.closedT-b.closedT).map(r=>{const p=okPk&&typeof abgPackOf==="function"?abgPackOf(r.ord):null,B=p?abgBal(p):null,lb=r.art==="teil"?"Teilretoure":r.art==="end"?"Endretoure":"Retoure";
  let rt="",cls="";if(!B){rt="ohne Packliste"}else if(r.art==="teil"){rt="Teil"}else if(B.fehlt){rt=B.fehlt+(B.fehlt===1?" fehlt":" fehlen");cls="red"}else{rt="vollständig";cls="ok"}
  return{n:r.ev||"Retourschein",d:(r.ord||"–")+" · "+lb+" "+wbWd(r.closedT)+(B?" · "+B.zur+" von "+B.raus+(B.zuviel?" · "+B.zuviel+" zu viel":""):"")+" · "+nmA(r,"closedBy"),r:rt,cls,ret:r.id}}):[];
 const over=okPk?pkGroups().over.map(p=>{const d=Math.round((t0-pkDay(p.de))/864e5);return{n:p.ev||"Packliste",d:(p.ord||"–")+(p.pl?" · "+shortName(p.pl):"")+" · Dispo-Ende "+wbWd(p.de),r:d<=1?"seit gestern":"seit "+d+" Tagen",cls:"red",pk:p.id}}):[];
 const dis=[];if(okPk){packs.forEach(p=>{const h=pkHd(p);
  if(h&&pkShifted(p)&&(wbIn(pkDay(p.db||0),L0,L1)||wbIn(pkHDay(p),L0,L1)))dis.push({n:p.ev||"Packliste",d:"Herrichten verschoben "+wbWd(p.db)+" → "+wbWd(pkHDay(p))+(h.why?" · „"+h.why+"“":"")+(h.by?" · "+nmA(h,"by"):""),pk:p.id,t:pkHDay(p)});
  if(okRet&&p.de){const E=pkRets(p).filter(r=>r.closed&&r.art==="end"&&wbIn(r.closedT,L0,L1)).sort((a,b)=>b.closedT-a.closedT)[0];if(E){const x=Math.round((pkDay(E.closedT)-pkDay(p.de))/864e5);
   if(x)dis.push({n:p.ev||"Packliste",d:"Endretoure "+Math.abs(x)+(Math.abs(x)===1?" Tag ":" Tage ")+(x>0?"nach":"vor")+" Dispo-Ende ("+pkDM(p.de)+" → "+pkDM(E.closedT)+")",pk:p.id,t:E.closedT})}}});dis.sort((a,b)=>a.t-b.t)}
 let offen=null,aus=okPk&&okRet&&typeof fmWbRows==="function"?fmWbRows():[];if(okPk&&okRet&&typeof abgMissing==="function"){const G=abgMissing(),P=new Set();let n=0;G.forEach(g=>{n+=g.n;g.at.forEach(a=>P.add(a.p.id))});offen={n,a:P.size}}
 /* diese Woche */
 const days=[0,1,2,3,4].map(i=>{const t=pkAddD(M,i);return{t,h:[],z:[]}});const slot=t=>{const w=new Date(t).getDay();return w===6?pkAddD(t,-1):w===0?pkAddD(t,-2):t};
 if(okPk)pkZTasks().forEach(p=>{const s=pkSlot(p),dh=days.find(d=>d.t===s.t);if(dh&&wbIn(s.t,M,N1))dh.h.push({p,we:s.we})});
 if(okPk)packs.forEach(p=>{if(pkNoH(p))return;const s=pkSlot(p),dh=days.find(d=>d.t===s.t);if(dh&&wbIn(s.t,M,N1))dh.h.push({p,we:s.we});
  if(p.de&&pkState(p).k!=="done"){const de=pkDay(p.de),dz=days.find(d=>d.t===slot(de));if(dz&&wbIn(de,M,N1))dz.z.push({p,we:[ "So","","","","","","Sa"][new Date(de).getDay()]})}});
 const ach=[];if(okPk){wbDefNeed(M,N1).forEach(g=>ach.push(g.name+": "+g.n+(g.n===1?" Stück":" Stück")+" defekt"+(g.urg?(g.n>1?" (davon "+g.urg+" dringend)":" (dringend)"):"")+" – gebraucht "+g.use.map(u=>wbWd(u.t).split(" ")[0]+" für "+u.ev+" ("+u.q+(u.q===1?" Stück)":" Stück)")).join(", ")))}
 if(okRet&&typeof abgToCheck==="function"&&can("abg_p")){const n=abgToCheck().length;if(n)ach.push(n+(n===1?" Endretoure":" Endretouren")+" noch zu prüfen")}
 /* Punkte */
 const notes=WBN.filter(n=>!n.done).sort((a,b)=>(a.t||0)-(b.t||0)).map(n=>({...n,old:(n.t||0)<L0}));
 const doneN=WBN.filter(n=>n.done&&n.done.t>=pkAddD(M,-28)).sort((a,b)=>b.done.t-a.done.t);
 return{M,L0,N1,herr,zur,over,dis,offen,aus,days,ach,notes,doneN}}
/* Offene Defekte, deren Artikel in Packlisten der Woche gebraucht werden – pro Artikel zusammengefasst (ab 1.83: zwei Meldungen zum selben Artikel = eine Zeile) */
function wbDefNeed(a,b){const G={};defs.filter(d=>!d.done).forEach(d=>{const code=artCode(String(d.anr||"").split(/[-–]/)[0]),k=code?"c:"+code:"n:"+jvATok(d.art).join(" ");
  const g=G[k]=G[k]||{k,name:d.art,A:{code,toks:jvATok(d.art).filter(w=>!/^\d{1,2}$/.test(w)),label:d.art},n:0,urg:0,ids:[]};{const q=Math.max(1,parseInt(d.n,10)||1);g.n+=q;if(d.urg)g.urg+=q}g.ids.push(d.id)});
 return Object.values(G).map(g=>{const m=jvMatcher(g.A);g.use=packs.filter(p=>{const t=pkHDay(p);return t>=a&&t<b&&pkState(p).k!=="done"}).map(p=>{const c=jvArtCnt(p,m);return{p,t:pkHDay(p),ev:p.ev||p.ord,q:c.out+c.plan}}).filter(u=>u.q>0).sort((x,y)=>x.t-y.t);return g}).filter(g=>g.use.length).sort((x,y)=>y.urg-x.urg||x.use[0].t-y.use[0].t)}
/* ---------- Bericht (Bildschirm und Druck) ---------- */
function wbList(title,rows,red,empty){return '<div class="wbl"><div class="wblh'+(red?' red':'')+'"><b>'+esc(title)+'</b><b>'+rows.length+'</b></div>'+(rows.length?rows.map(r=>'<div class="wbr"><b>'+esc(r.n)+'</b><span>'+esc(r.d)+'</span>'+(r.r?'<em class="'+(r.cls||"")+'">'+esc(r.r)+'</em>':'')+'</div>').join(""):'<div class="wbe">'+esc(empty)+'</div>')+'</div>'}
function wbPaper(D,print){const kwL=pkKW(D.L0),kwN=pkKW(D.M),y=new Date(D.M).getFullYear();
 const day=(d,k)=>{const L=wbDayList(d[k]);return L.length?L.map(e=>'<div class="wbli">'+esc(e.n)+(e.zt?' <small class="wbz">'+esc(e.zt)+'</small>':'')+(e.we?' <small>('+e.we+')</small>':'')+(e.fin&&k==="h"?' <b class="wbok">✓</b>':'')+'</div>').join(""):'<span class="wbm">–</span>'};
 const nh=D.days.reduce((a,d)=>a+d.h.length,0),nz=D.days.reduce((a,d)=>a+d.z.length,0);
 return '<div class="wbpaper'+(print?' wbprint':'')+'"><div class="wbhd"><div><span>The Power Company · Lager</span><h1>Wochenbericht</h1></div><em>Besprechung '+wbWd(D.M)+y+'</em></div>'+
  '<section class="wbsec"><div class="wbbar"><b>1 · Letzte Woche</b><span>KW '+kwL+' · '+pkDM(D.L0)+'–'+pkDM(pkAddD(D.M,-1))+new Date(pkAddD(D.M,-1)).getFullYear()+'</span></div><div class="wbin">'+
   wbList("Hergerichtet",D.herr,false,"Nichts hergerichtet.")+wbList("Zurückgekommen",D.zur,false,"Nichts zurückgekommen.")+
   '<div class="wb2">'+wbList("Dispo abgelaufen",D.over,true,"Bei keinem Auftrag ist die Dispo abgelaufen.")+wbList("Dispodaten stimmten nicht",D.dis,false,"Keine Abweichungen.")+'</div>'+
   (D.offen?'<div class="wboff">'+(D.offen.n?'<b>Noch offen insgesamt:</b> '+D.offen.n+' Stück Fehlmaterial bei '+D.offen.a+(D.offen.a===1?' Auftrag':' Aufträgen')+' (auch aus früheren Wochen)':'<b>Noch offen insgesamt:</b> kein Fehlmaterial')+'</div>':'')+(D.aus&&D.aus.length?wbList("Fehlmaterial noch in epirent auszutragen",D.aus,true,""):"")+'</div></section>'+
  '<section class="wbsec"><div class="wbbar"><b>2 · Diese Woche</b><span>KW '+kwN+' · '+pkDM(D.M)+'–'+pkDM(pkAddD(D.M,4))+y+'</span></div><div class="wbin">'+
   '<table class="wbt"><thead><tr><th>Tag</th><th>Herrichten</th><th>Kommt zurück</th></tr></thead><tbody>'+D.days.map(d=>'<tr><td><b>'+wbWd(d.t)+'</b></td><td>'+day(d,"h")+'</td><td>'+day(d,"z")+'</td></tr>').join("")+
   '<tr class="wbsum"><td>Summe</td><td>'+nh+(nh===1?' Packliste':' Packlisten')+'</td><td>'+nz+(nz===1?' Rücklauf':' Rückläufe')+'</td></tr></tbody></table>'+
   (D.ach.length?'<div class="wbach"><b>Achtung</b>'+D.ach.map(a=>'<span>· '+esc(a)+'</span>').join("")+'</div>':'')+'</div></section>'+
  '<section class="wbsec wbnotes"><div class="wbbar"><b>3 · Sonstiges zur Besprechung</b></div><div class="wbin">'+
   D.notes.map(n=>'<div class="wbn"><span class="wbbox"></span><span class="wbnt">'+esc(n.txt)+wbBems(n).map(b=>'<span class="wbnb">'+esc(wbBemTx(b))+'</span>').join("")+'</span><small>'+esc(nmA(n,"by"))+', '+wbWd(n.t)+(n.old?' · noch offen':'')+'</small></div>').join("")+
   '<div class="wbline"></div><div class="wbline"></div></div></section>'+
  '<div class="wbft"><span>Erstellt aus der TPC Lager App · '+fmt(Date.now())+' · '+esc(meName())+'</span><span>Einzelheiten in der App</span></div></div>'}
/* ---------- Ansicht ---------- */
function wbView(){if(!can("jv_s")){view="start";return startView()}$("#t").textContent="Wochenbericht";const D=wbData(),kwL=pkKW(D.L0),kwN=pkKW(D.M);
 const ae=document.activeElement,keep=ae&&ae.id==="wbin"?ae.value:null,keepB=ae&&ae.dataset&&ae.dataset.wbbi?{n:ae.dataset.wbbi,v:ae.value}:null,dOpen=!!(document.querySelector(".wbdone")||{}).open;
 $("#app").innerHTML='<section class="wbnav"><button type="button" class="wbarr" id="wbp" aria-label="Eine Woche zurück"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" aria-hidden="true"><path d="M15 6l-6 6 6 6"/></svg></button><div><b>Rückblick KW '+kwL+' · Ausblick KW '+kwN+'</b><small>Besprechung '+wbWd(D.M)+new Date(D.M).getFullYear()+(wbOff?' · <button type="button" class="lnk" id="wbnow">zur aktuellen</button>':'')+'</small></div><button type="button" class="wbarr" id="wbn" aria-label="Eine Woche vor"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" aria-hidden="true"><path d="M9 6l6 6-6 6"/></svg></button></section>'+
  '<div class="wbbtns"><button class="btn" id="wbpr" type="button">'+(wbMobile()?'Drucken / Teilen (PDF)':'Drucken')+'</button>'+'<button class="btn ghost" id="wbpdf" type="button">Als PDF speichern</button>'+'</div>'+
  '<section class="wbedit"><b>Punkte für die Besprechung</b><small class="mute">'+wbWd(D.M)+' · wird mitgedruckt · nicht Erledigtes bleibt für die nächste Woche</small>'+
   D.notes.map(n=>'<div class="wbei"><input type="checkbox" data-wbd="'+esc(n.id)+'" aria-label="Erledigt"><span><span>'+esc(n.txt)+'</span><small>'+esc(nmA(n,"by"))+', '+wbWd(n.t)+(n.old?' · noch offen':'')+'</small></span>'+(n.by===me||can("v_app")?'<button type="button" class="lnk" data-wbx="'+esc(n.id)+'" style="color:var(--bad)">Löschen</button>':'')+'</div>'+wbBemHtml(n)).join("")+
   '<div class="wbadd"><label><span class="sr">Neuer Punkt</span><input id="wbin" maxlength="200" placeholder="Neuer Punkt …" autocomplete="off"></label><button class="btn s" id="wbadd" type="button">Hinzufügen</button></div>'+
   (D.doneN.length?'<details class="wbdone"><summary>Erledigt · '+D.doneN.length+'</summary>'+D.doneN.map(n=>'<div class="wbei"><input type="checkbox" checked data-wbu="'+esc(n.id)+'" aria-label="Wieder offen"><span><span>'+esc(n.txt)+'</span><small>erledigt '+wbWd(n.done.t)+' · '+esc(nmA(n.done,"by"))+'</small></span></div>'+wbBemHtml(n)).join("")+'</details>':'')+'</section>'+
  wbPaper(D,false);
 const old=document.getElementById("wbprintbox");if(old)old.remove();document.body.insertAdjacentHTML("beforeend",'<div id="wbprintbox">'+wbPaper(D,true)+'</div>');
 $("#wbp").onclick=()=>{wbOff--;wbView()};$("#wbn").onclick=()=>{wbOff++;wbView()};if($("#wbnow"))$("#wbnow").onclick=()=>{wbOff=0;wbView()};
 wbLoadPdf().catch(()=>{});
 $("#wbpr").onclick=()=>{if(wbMobile())return wbPdfOut(D,"share");document.body.classList.add("wbprinting");setTimeout(()=>{try{window.print()}catch(e){}setTimeout(()=>document.body.classList.remove("wbprinting"),500)},50)};
 if($("#wbpdf"))$("#wbpdf").onclick=()=>wbPdfOut(D,"save");
 const add=()=>{const v=$("#wbin").value.trim();if(!v)return;$("#wbin").value="";rSave(()=>db.doc("wbnote/"+Date.now().toString(36)+Math.random().toString(36).slice(2,5)).set({txt:v,by:me,t:Date.now(),done:null}),"Punkt gespeichert")};
 $("#wbadd").onclick=add;$("#wbin").onkeydown=e=>{if(e.key==="Enter"){e.preventDefault();add()}};if(keep!==null){$("#wbin").value=keep;$("#wbin").focus()}
 document.querySelectorAll("[data-wbd]").forEach(c=>c.onchange=()=>rSave(()=>db.doc("wbnote/"+c.dataset.wbd).update({done:{by:me,t:Date.now()}}),"Als erledigt markiert"));
 document.querySelectorAll("[data-wbu]").forEach(c=>c.onchange=()=>rSave(()=>db.doc("wbnote/"+c.dataset.wbu).update({done:null}),"Wieder offen"));
 document.querySelectorAll("[data-wbx]").forEach(b=>b.onclick=()=>ask("Punkt löschen?",()=>rSave(()=>db.doc("wbnote/"+b.dataset.wbx).delete(),"Gelöscht")))
 /* Bemerkungen */
 const dd=document.querySelector(".wbdone");if(dd&&(dOpen||(wbBemOpen||wbBemEdit)&&D.doneN.some(n=>n.id===wbBemOpen||(wbBemEdit&&n.id===wbBemEdit.n))))dd.open=true;
 if(keepB){const i=document.querySelector('[data-wbbi="'+keepB.n+'"]');if(i){i.value=keepB.v;i.focus()}}
 const focusB=id=>setTimeout(()=>{const i=document.querySelector('[data-wbbi="'+id+'"]');if(i){i.focus();try{i.setSelectionRange(i.value.length,i.value.length)}catch(e){}}},30);
 document.querySelectorAll("[data-wbbo]").forEach(b=>b.onclick=()=>{wbBemOpen=b.dataset.wbbo;wbBemEdit=null;wbView();focusB(wbBemOpen)});
 document.querySelectorAll("[data-wbbc]").forEach(b=>b.onclick=()=>{wbBemOpen=null;wbBemEdit=null;wbView()});
 document.querySelectorAll("[data-wbbe]").forEach(b=>b.onclick=()=>{const [n,k]=b.dataset.wbbe.split("|");wbBemEdit={n,b:k};wbBemOpen=null;wbView();focusB(n)});
 document.querySelectorAll("[data-wbbx]").forEach(b=>b.onclick=()=>{const [n,k]=b.dataset.wbbx.split("|");ask("Bemerkung löschen?",()=>rSave(()=>db.doc("wbnote/"+n).update({[k]:null}),"Bemerkung gelöscht"))});
 const saveB=nid=>{const i=document.querySelector('[data-wbbi="'+nid+'"]');const v=i?i.value.trim():"";if(!v){if(i)i.classList.add("bad");return}
  const N=WBN.find(x=>x.id===nid),e=wbBemEdit&&wbBemEdit.n===nid?wbBemEdit.b:null;wbBemOpen=null;wbBemEdit=null;
  if(e){const o=(N&&N[e])||{};rSave(()=>db.doc("wbnote/"+nid).update({[e]:{...o,txt:v,mod:{by:me,t:Date.now()}}}),"Bemerkung geändert")}
  else rSave(()=>db.doc("wbnote/"+nid).update({["b_"+Date.now().toString(36)+Math.random().toString(36).slice(2,5)]:{txt:v,by:me,...tabAs("by"),t:Date.now()}}),"Bemerkung gespeichert")};
 document.querySelectorAll("[data-wbbs]").forEach(b=>b.onclick=()=>saveB(b.dataset.wbbs));
 document.querySelectorAll("[data-wbbi]").forEach(i=>i.onkeydown=e=>{if(e.key==="Enter"){e.preventDefault();saveB(i.dataset.wbbi)}if(e.key==="Escape"){wbBemOpen=null;wbBemEdit=null;wbView()}})}
window.addEventListener("afterprint",()=>document.body.classList.remove("wbprinting"));
/* ---------- PDF (ab 1.84): am Handy (v. a. iPhone-Web-App) tut window.print() nichts → PDF erzeugen und teilen (Drucken / In Dateien sichern) ---------- */
const WB_PDF_URLS=["https://cdn.jsdelivr.net/npm/pdf-lib@1.17.1/dist/pdf-lib.min.js","https://unpkg.com/pdf-lib@1.17.1/dist/pdf-lib.min.js"];
let wbPdfP=null;
function wbLoadPdf(){if(window.PDFLib)return Promise.resolve();if(wbPdfP)return wbPdfP;
 wbPdfP=WB_PDF_URLS.reduce((pr,u)=>pr.catch(()=>new Promise((ok,no)=>{const s=document.createElement("script");s.src=u;s.onload=()=>window.PDFLib?ok():no(new Error("leer"));s.onerror=()=>{s.remove();no(new Error("Laden fehlgeschlagen"))};document.head.appendChild(s)})),Promise.reject(new Error("start"))).catch(e=>{wbPdfP=null;throw e});return wbPdfP}
const WB_WIN="€‚ƒ„…†‡ˆ‰Š‹ŒŽ‘’“”•–—˜™š›œžŸ";
const wbTx=s=>String(s==null?"":s).replace(/→/g,"->").replace(/✓/g,"ok").replace(/[  ]/g," ").replace(/[^\x20-\x7e\xa0-\xff]/g,c=>WB_WIN.includes(c)?c:"?");
const wbMobile=()=>/iPhone|iPad|iPod|Android/.test(navigator.userAgent)||(navigator.platform==="MacIntel"&&navigator.maxTouchPoints>1);
async function wbPdf(D){await wbLoadPdf();const {PDFDocument,StandardFonts,rgb}=PDFLib;const doc=await PDFDocument.create();
 const F=await doc.embedFont(StandardFonts.Helvetica),B=await doc.embedFont(StandardFonts.HelveticaBold);
 const W=595.28,HP=841.89,ML=34,MR=34,MT=34,MB=44,CW=W-ML-MR,IX=ML+10,IW=CW-20,WHITE=rgb(1,1,1);
 const NAVY=rgb(.067,.29,.592),INK=rgb(.09,.13,.18),GREY=rgb(.29,.33,.41),LINE=rgb(.6,.65,.71),RED=rgb(.72,.2,.16),GREEN=rgb(.12,.42,.25),PINK=rgb(.984,.922,.922),TINT=rgb(.933,.953,.98),HAIR=rgb(.87,.89,.93);
 let pg=null,y=0,sec=null;const pages=[];
 const closeBox=yb=>pg.drawRectangle({x:ML,y:yb,width:CW,height:sec.top-yb,borderColor:NAVY,borderWidth:1.5});
 const newPage=()=>{if(sec&&pg)closeBox(MB-6);pg=doc.addPage([W,HP]);pages.push(pg);y=HP-MT;if(sec)sec.top=y;if(sec)y-=6};
 const need=h=>{if(y-h<MB)newPage()};
 const txt=(s,x,yy,o)=>{o=o||{};pg.drawText(wbTx(s),{x,y:yy,size:o.size||10,font:o.bold?B:F,color:o.color||INK})};
 const tw=(s,f,z)=>f.widthOfTextAtSize(wbTx(s),z);
 const wrap=(s,f,z,w)=>{const out=[];wbTx(s).split("\n").forEach(par=>{let cur="";par.split(" ").forEach(word=>{const t=cur?cur+" "+word:word;if(f.widthOfTextAtSize(t,z)<=w){cur=t;return}if(cur)out.push(cur);cur=word;
   while(cur.length>1&&f.widthOfTextAtSize(cur,z)>w){let i=cur.length;while(i>1&&f.widthOfTextAtSize(cur.slice(0,i),z)>w)i--;out.push(cur.slice(0,i));cur=cur.slice(i)}});out.push(cur)});return out.length?out:[""]};
 const y0=new Date(D.M).getFullYear();
 newPage();
 txt("THE POWER COMPANY · LAGER",ML,y-8,{size:7.5,bold:true,color:NAVY});txt("Wochenbericht",ML,y-28,{size:19,bold:true});
 const bs="Besprechung "+wbWd(D.M)+y0;txt(bs,W-MR-tw(bs,F,9.5),y-27,{size:9.5,color:GREY});
 y-=36;pg.drawLine({start:{x:ML,y},end:{x:W-MR,y},thickness:.75,color:LINE});y-=12;
 const secStart=(t,r)=>{need(70);const bh=22;pg.drawRectangle({x:ML,y:y-bh,width:CW,height:bh,color:NAVY});txt(t,ML+10,y-15.5,{size:12,bold:true,color:WHITE});if(r)txt(r,W-MR-10-tw(r,F,9.5),y-15,{size:9.5,color:WHITE});sec={top:y};y-=bh+8};
 const secEnd=()=>{y-=4;closeBox(y);sec=null;y-=12};
 const list=(title,rows,red,empty)=>{need(40);const c=red?RED:NAVY,n=String(rows.length);txt(title,IX,y-10,{size:10,bold:true,color:c});txt(n,IX+IW-tw(n,B,10),y-10,{size:10,bold:true,color:c});y-=13;pg.drawLine({start:{x:IX,y},end:{x:IX+IW,y},thickness:1.2,color:c});y-=2;
  if(!rows.length){txt(empty,IX,y-10,{size:8.5,color:GREY});y-=16;return}
  rows.forEach(r=>{const NW=150,RW=r.r?tw(r.r,B,8.5)+10:0,DW=IW-NW-RW,nl=wrap(r.n,B,9,NW-8),dl=wrap(r.d,F,8,DW-4),h=Math.max(nl.length,dl.length)*10.5+5;need(h);
   nl.forEach((l,i)=>txt(l,IX,y-10-i*10.5,{size:9,bold:true}));dl.forEach((l,i)=>txt(l,IX+NW,y-10-i*10.5,{size:8,color:GREY}));
   if(r.r)txt(r.r,IX+IW-tw(r.r,B,8.5),y-10,{size:8.5,bold:true,color:r.cls==="red"?RED:r.cls==="ok"?GREEN:GREY});
   y-=h;pg.drawLine({start:{x:IX,y:y+1},end:{x:IX+IW,y:y+1},thickness:.5,color:HAIR})});y-=8};
 /* 1 · Letzte Woche */
 secStart("1 · Letzte Woche","KW "+pkKW(D.L0)+" · "+pkDM(D.L0)+"–"+pkDM(pkAddD(D.M,-1))+new Date(pkAddD(D.M,-1)).getFullYear());
 list("Hergerichtet",D.herr,false,"Nichts hergerichtet.");list("Zurückgekommen",D.zur,false,"Nichts zurückgekommen.");
 list("Dispo abgelaufen",D.over,true,"Bei keinem Auftrag ist die Dispo abgelaufen.");list("Dispodaten stimmten nicht",D.dis,false,"Keine Abweichungen.");
 if(D.offen){const a="Noch offen insgesamt: ",b=D.offen.n?D.offen.n+" Stück Fehlmaterial bei "+D.offen.a+(D.offen.a===1?" Auftrag":" Aufträgen")+" (auch aus früheren Wochen)":"kein Fehlmaterial";
  need(22);pg.drawRectangle({x:IX,y:y-18,width:IW,height:18,color:PINK});txt(a,IX+8,y-12.5,{size:9,bold:true,color:RED});txt(b,IX+8+tw(a,B,9),y-12.5,{size:9});y-=24}
 if(D.aus&&D.aus.length)list("Fehlmaterial noch in epirent auszutragen",D.aus,true,"");
 secEnd();
 /* 2 · Diese Woche */
 secStart("2 · Diese Woche","KW "+pkKW(D.M)+" · "+pkDM(D.M)+"–"+pkDM(pkAddD(D.M,4))+y0);
 const dayT=(d,k)=>{const L=wbDayList(d[k]);return L.length?L.map(e=>"• "+e.n+(e.zt?" "+e.zt:"")+(e.we?" ("+e.we+")":"")+(e.fin&&k==="h"?" ✓":"")).join("\n"):"–"};
 const c1=60,c3=Math.round((IW-c1)*0.38),c2=IW-c1-c3,CWS=[c1,c2,c3];
 const row=(cells,o)=>{const L=cells.map((s,i)=>wrap(s,o.bold||i===0?B:F,8.5,CWS[i]-8)),h=Math.max(...L.map(l=>l.length))*10.5+7;need(h);
  if(o.fill)pg.drawRectangle({x:IX,y:y-h,width:IW,height:h,color:o.fill});let x=IX;L.forEach((l,i)=>{pg.drawRectangle({x,y:y-h,width:CWS[i],height:h,borderColor:LINE,borderWidth:.6});l.forEach((t,j)=>txt(t,x+4,y-11-j*10.5,{size:8.5,bold:o.bold||i===0}));x+=CWS[i]});y-=h};
 const nh=D.days.reduce((a,d)=>a+d.h.length,0),nz=D.days.reduce((a,d)=>a+d.z.length,0);
 row(["Tag","Herrichten","Kommt zurück"],{bold:true,fill:TINT});D.days.forEach(d=>row([wbWd(d.t),dayT(d,"h"),dayT(d,"z")],{}));
 row(["Summe",nh+(nh===1?" Packliste":" Packlisten"),nz+(nz===1?" Rücklauf":" Rückläufe")],{bold:true,fill:TINT});y-=8;
 if(D.ach.length){const L=[].concat(...D.ach.map(a=>wrap("· "+a,F,8.5,IW-18))),h=L.length*11+22;need(h);pg.drawRectangle({x:IX,y:y-h,width:IW,height:h,borderColor:RED,borderWidth:1.2});
  txt("Achtung",IX+8,y-12,{size:9.5,bold:true,color:RED});L.forEach((l,i)=>txt(l,IX+8,y-24-i*11,{size:8.5}));y-=h+6}
 secEnd();
 /* 3 · Sonstiges */
 secStart("3 · Sonstiges zur Besprechung","");
 D.notes.forEach(n=>{const meta=nmA(n,"by")+", "+wbWd(n.t)+(n.old?" · noch offen":""),mw=tw(meta,F,7.5)+8,L=wrap(n.txt,F,9,IW-18-mw),BL=[].concat(...wbBems(n).map(b=>wrap(wbBemTx(b),F,7.5,IW-18-mw))),h=L.length*11+BL.length*9.5+6;need(h);
  pg.drawRectangle({x:IX,y:y-10,width:7,height:7,borderColor:INK,borderWidth:.8});L.forEach((l,i)=>txt(l,IX+14,y-9.5-i*11,{size:9}));BL.forEach((l,i)=>txt(l,IX+14,y-9.5-L.length*11-i*9.5+1,{size:7.5,color:GREY}));txt(meta,IX+IW-tw(meta,F,7.5),y-9.5,{size:7.5,color:GREY});
  y-=h;pg.drawLine({start:{x:IX,y:y+1},end:{x:IX+IW,y:y+1},thickness:.5,color:HAIR})});
 for(let i=0;i<3;i++){need(22);y-=20;pg.drawLine({start:{x:IX,y},end:{x:IX+IW,y},thickness:.6,color:LINE})}
 y-=4;secEnd();
 const foot="Erstellt aus der TPC Lager App · "+fmt(Date.now())+" · "+meName();
 pages.forEach((p,i)=>{p.drawText(wbTx(foot),{x:ML,y:24,size:7.5,font:F,color:GREY});const s="Seite "+(i+1)+" von "+pages.length;p.drawText(s,{x:W-MR-F.widthOfTextAtSize(s,7.5),y:24,size:7.5,font:F,color:GREY})});
 return doc.save()}
async function wbPdfOut(D,mode){const b=$("#wbpr"),old=b?b.textContent:"";if(b){b.disabled=true;b.textContent="PDF wird erstellt …"}
 try{const bytes=await wbPdf(D),fn="Wochenbericht_KW"+pkKW(D.M)+"_"+new Date(D.M).getFullYear()+".pdf",blob=new Blob([bytes],{type:"application/pdf"}),file=new File([blob],fn,{type:"application/pdf"});
  if(mode==="share"&&navigator.canShare&&navigator.canShare({files:[file]})){try{await navigator.share({files:[file],title:"Wochenbericht KW "+pkKW(D.M)});return}catch(e){if(e&&e.name==="AbortError")return;console.warn("Teilen ging nicht",e)}}
  const dl=typeof claude!=="undefined"&&claude.use?await claude.use("downloads"):null;
  if(dl){await dl.save({filename:fn,data:blob});toast("PDF gespeichert: "+fn,1);return}
  const u=URL.createObjectURL(blob),a=document.createElement("a");a.href=u;a.download=fn;a.rel="noopener";document.body.appendChild(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(u),60000);toast("PDF gespeichert: "+fn,1)}
 catch(e){if(e&&(e.name==="AbortError"||e.code==="declined"))return;console.error(e);errBox("Das PDF konnte nicht erstellt werden. Bitte Internetverbindung prüfen und nochmal versuchen.")}
 finally{if(b){b.disabled=false;b.textContent=old}}}
/* 1.158: „Diese Woche“ – eine Zeile pro Auftrag, Zusätze desselben Auftrags am selben Tag zusammen („+ Zusatz“ / „+ 2 Zusätze“, nur Zusatz → „(Zusatz)“), ✓ wenn alles hergerichtet (Jürgen, 10.11.) */
function wbDayList(L){const M=new Map();(L||[]).forEach(o=>{const P=o.p&&o.p._p?o.p._p:o.p,k=P.id||P.ord||Math.random();let e=M.get(k);if(!e){e={P,main:false,zn:0,we:"",fin:true};M.set(k,e)}
  if(o.p&&o.p._z)e.zn++;else e.main=true;if(o.we&&!e.we)e.we=o.we;try{if(!pkProg(o.p).fin)e.fin=false}catch(x){e.fin=false}});
 return [...M.values()].map(e=>({n:e.P.ev||e.P.ord||"–",zt:e.zn?(e.main?"+ "+(e.zn===1?"Zusatz":e.zn+" Zusätze"):"("+(e.zn===1?"Zusatz":e.zn+" Zusätze")+")"):"",we:e.we,fin:e.fin}))}
