/* ===== Packlisten (ab 1.57) =====
   PDF (epirent-Packliste) in der App hochladen -> im Gerät mit pdf.js lesen (pkparse.js) -> nur das Ausgelesene speichern (docs 'pack', id = Packscheinnummer).
   Kein PDF, keine Kundendaten. Kein automatisches Abrufen aus dem Postfach.
   Rechte: pk_s Sehen, pk_b Hochladen, pk_l Löschen (packliste.sql).
   Status: Herrichten heute = Dispo-Beginn heute · Heute zurück = Dispo-Ende heute · Überfällig = Dispo-Ende vor heute und kein abgeschlossener
   Retourschein mit derselben Auftragsnummer (Ziffern verglichen, 2601114-01 = 260111401). Materialgenauer Abgleich kommt später. */
let packs=[],curPack=null,pkf="aktuell";
const PK_ICON='<svg viewBox="0 0 24 24" width="28" height="28" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M21 8l-9-5-9 5 9 5 9-5z"/><path d="M3 8v8l9 5 9-5V8"/><path d="M12 13v8"/></svg>';
const PDFJS_SRC=["https://cdn.jsdelivr.net/npm/pdfjs-dist@4.10.38/legacy/build/","https://unpkg.com/pdfjs-dist@4.10.38/legacy/build/"];
let pdfLib=null;
async function pkLib(){if(pdfLib)return pdfLib;let err=null;for(const b of (window.__PDFJS_SRC||PDFJS_SRC)){try{const m=await import(b+"pdf.min.mjs");m.GlobalWorkerOptions.workerSrc=b+"pdf.worker.min.mjs";pdfLib=m;return m}catch(e){err=e}}throw err||new Error("PDF-Leser nicht gefunden")}
async function pkRead(file){const lib=await pkLib();const buf=new Uint8Array(await file.arrayBuffer());const doc=await lib.getDocument({data:buf}).promise;const it=[];
 for(let p=1;p<=doc.numPages;p++){const tc=await (await doc.getPage(p)).getTextContent();tc.items.forEach(i=>{if(i&&typeof i.str==="string")it.push({p,x:i.transform[4],y:i.transform[5],s:i.str})})}
 try{doc.destroy()}catch(e){}return pkParse(it)}
function packSub(){db.collection("pack").onSnapshot(s=>{packs=s.docs.map(d=>({id:d.id,...d.data()}));draw()})}
const pkDig=s=>String(s||"").replace(/\D/g,"");
const pkDay=t=>{const d=new Date(t);d.setHours(0,0,0,0);return d.getTime()};
function pkRets(p){const o=pkDig(p.ord);return o?rets.filter(r=>pkDig(r.ord)===o):[]}
function pkState(p){const t0=pkDay(Date.now()),R=pkRets(p),done=R.some(r=>r.closed);
 if(done)return{k:"done",l:"Retoure abgeschlossen",c:"ok"};
 if(p.de&&pkDay(p.de)<t0)return{k:"over",l:R.length?"Überfällig · Retourschein offen":"Überfällig",c:"warn"};
 if(p.db&&pkDay(p.db)===t0)return{k:"herr",l:"Heute herrichten",c:"hot"};
 if(p.de&&pkDay(p.de)===t0)return{k:"back",l:"Heute zurück",c:"hot"};
 if(p.db&&pkDay(p.db)>t0)return{k:"next",l:"Kommt noch",c:""};
 return{k:"out",l:"Unterwegs",c:""}}
const pkD=t=>t?new Date(t).toLocaleDateString("de-AT",{day:"2-digit",month:"2-digit",year:"numeric"})+(new Date(t).getHours()||new Date(t).getMinutes()?" "+new Date(t).toLocaleTimeString("de-AT",{hour:"2-digit",minute:"2-digit"}):""):"–";
const pkPosN=n=>n+(n===1?" Position":" Positionen");
const pkF=p=>(p.pos||[]).filter(x=>x.f>0);
function pkGroups(){const G={over:[],herr:[],back:[],out:[],next:[],done:[]};packs.forEach(p=>G[pkState(p).k].push(p));
 G.over.sort((a,b)=>(a.de||0)-(b.de||0));G.herr.sort((a,b)=>(a.db||0)-(b.db||0));G.back.sort((a,b)=>(a.de||0)-(b.de||0));G.out.sort((a,b)=>(a.de||0)-(b.de||0));G.next.sort((a,b)=>(a.db||0)-(b.db||0));G.done.sort((a,b)=>(b.de||0)-(a.de||0));return G}
function pkRow(p){const s=pkState(p),f=pkF(p).length;
 return '<div class="card pkr" data-pk="'+esc(p.id)+'"><div class="row" style="align-items:center"><b style="flex:1;min-width:0">'+esc(p.ev||"Ohne Veranstaltung")+'</b>'+(s.c?'<span class="tag pk'+s.c+'" style="flex:0;white-space:nowrap">'+esc(s.l)+'</span>':'')+'</div>'+
  '<div class="mute">Auftrag '+esc(p.ord||"–")+(p.pl?' · '+esc(p.pl):'')+'</div><div class="mute">Dispo '+pkD(p.db)+' – '+pkD(p.de)+'</div><div class="mute">'+pkPosN((p.pos||[]).length)+(f?' · <span class="pkfr">'+f+' mit Fremdmiete</span>':'')+'</div></div>'}
function packView(){$("#t").textContent="Packlisten";const G=pkGroups();
 const sec=(t,a)=>a.length?'<h3 class="pkh">'+t+' <span class="mute">'+a.length+'</span></h3>'+a.map(pkRow).join(""):"";
 const cur=sec("Überfällig",G.over)+sec("Heute herrichten",G.herr)+sec("Heute zurück",G.back)+sec("Unterwegs",G.out)+sec("Kommt noch",G.next);
 $("#app").innerHTML=(can("pk_b")?'<button class="btn" id="pkup">Packliste hochladen (PDF)</button><input id="pkfile" type="file" accept="application/pdf,.pdf" multiple hidden><p class="mute" style="font-size:13px;margin:6px 0 12px">Die PDF wird nur im Gerät gelesen. Gespeichert werden Auftrag, Veranstaltung, Projektleiter, Zeiten und Material – keine Kundendaten.</p>':'')+
  chips([["aktuell","Aktuell"],["done","Erledigt"],["alle","Alle"]],pkf,"data-pkf")+
  (pkf==="aktuell"?(cur||'<div class="card mute">Keine aktuellen Packlisten.</div>'):pkf==="done"?(sec("Retoure abgeschlossen",G.done)||'<div class="card mute">Noch keine erledigten Packlisten.</div>'):(packs.length?cur+sec("Retoure abgeschlossen",G.done):'<div class="card mute">Noch keine Packlisten hochgeladen.</div>'));
 document.querySelectorAll("[data-pkf]").forEach(b=>b.onclick=()=>{pkf=b.dataset.pkf;packView()});
 document.querySelectorAll("[data-pk]").forEach(e=>e.onclick=()=>{curPack=e.dataset.pk;go("packopen")});
 if($("#pkup")){$("#pkup").onclick=()=>$("#pkfile").click();$("#pkfile").onchange=e=>{const fs=[...e.target.files];e.target.value="";pkUpload(fs)}}}
async function pkUpload(files){for(const f of files){let P;const b=$("#pkup");if(b){b.disabled=true;b.textContent="Wird gelesen …"}
  try{P=await pkRead(f)}catch(e){console.warn("Packliste",e);if(b){b.disabled=false;b.textContent="Packliste hochladen (PDF)"}
   errBox(/Packliste|Auftragsnummer|Positionen/.test(String(e&&e.message))?"„"+f.name+"“ sieht nicht wie eine epirent-Packliste aus.":"Die PDF konnte nicht gelesen werden ("+String(e&&e.message||e).slice(0,80)+"). Bitte Internetverbindung prüfen und nochmal versuchen.");continue}
  if(b){b.disabled=false;b.textContent="Packliste hochladen (PDF)"}
  const ok=await pkConfirm(P);if(!ok)continue;
  const id=P.ps||("A"+pkDig(P.ord));
  try{await db.doc("pack/"+id).set({...P,by:me,t:Date.now()});toast("Packliste gespeichert",1)}catch(e){console.error(e);errBox("Speichern fehlgeschlagen. Hast du das Recht „Packlisten hochladen“?")}}}
function pkConfirm(P){return new Promise(res=>{const id=P.ps||("A"+pkDig(P.ord)),old=packs.find(x=>x.id===id),f=P.pos.filter(x=>x.f>0).length,o=document.createElement("div");o.className="ov";
 o.innerHTML='<div class="card" style="width:100%;max-width:420px;margin:0;max-height:90vh;overflow:auto"><b>Packliste erkannt</b>'+
  '<div class="pkkv"><span>Veranstaltung</span><b>'+esc(P.ev||"–")+'</b><span>Auftrag</span><b>'+esc(P.ord||"–")+'</b><span>Packschein</span><b>'+esc(P.ps||"–")+'</b><span>Projektleiter</span><b>'+esc(P.pl||"–")+'</b><span>Dispo Beginn</span><b>'+pkD(P.db)+'</b><span>Dispo Ende</span><b>'+pkD(P.de)+'</b></div>'+
  '<p style="margin:8px 0">'+pkPosN(P.pos.length)+(f?', davon <span class="pkfr">'+f+' mit Fremdmiete</span>':'')+'</p>'+
  (old?'<p class="pkold">Diese Packliste ist schon da (hochgeladen '+fmt(old.t)+' von '+esc(nm(old.by))+'). Beim Speichern wird sie ersetzt.</p>':'')+
  '<div class="row"><button class="btn ghost" id="pkcn">Abbrechen</button><button class="btn" id="pkok">'+(old?'Ersetzen':'Speichern')+'</button></div></div>';
 document.body.appendChild(o);o.querySelector("#pkcn").onclick=()=>{o.remove();res(false)};o.querySelector("#pkok").onclick=()=>{o.remove();res(true)}})}
function packOpenView(){const p=packs.find(x=>x.id===curPack);if(!p){view="pack";return packView()}
 $("#t").textContent="Packliste";const s=pkState(p),R=pkRets(p),f=pkF(p);
 $("#app").innerHTML='<div class="card" style="cursor:default"><div class="row" style="align-items:center"><b style="flex:1;min-width:0;font-size:18px">'+esc(p.ev||"Ohne Veranstaltung")+'</b><span class="tag pk'+s.c+'" style="flex:0;white-space:nowrap">'+esc(s.l)+'</span></div>'+
  '<div class="pkkv"><span>Auftrag</span><b>'+esc(p.ord||"–")+'</b><span>Packschein</span><b>'+esc(p.ps||"–")+'</b><span>Projektleiter</span><b>'+esc(p.pl||"–")+'</b>'+(p.sa?'<span>Selbstabholer</span><b>'+esc(p.sa)+'</b>':'')+'</div>'+
  '<div class="pkkv"><span>Dispo Beginn</span><b>'+pkD(p.db)+'</b><span>Dispo Ende</span><b>'+pkD(p.de)+'</b>'+(p.pk?'<span>Packen</span><b>'+pkD(p.pk)+'</b>':'')+(p.an?'<span>Anlieferung</span><b>'+pkD(p.an)+'</b>':'')+(p.eb?'<span>Event</span><b>'+pkD(p.eb)+' – '+pkD(p.ee)+'</b>':'')+'</div>'+
  '<div class="mute" style="font-size:13px;margin-top:6px">Hochgeladen '+fmt(p.t)+' von '+esc(nm(p.by))+'</div>'+
  (R.length&&can("ret_s")?R.map(r=>'<button class="btn ghost" data-pkr="'+esc(r.id)+'" style="margin-top:8px">Retourschein öffnen'+(r.closed?' (abgeschlossen)':' (offen)')+'</button>').join(""):'')+'</div>'+
  '<h3 class="pkh">Material <span class="mute">'+pkPosN((p.pos||[]).length)+(f.length?' · <span class="pkfr">'+f.length+' mit Fremdmiete</span>':'')+'</span></h3>'+
  '<div class="card pkl" style="cursor:default">'+(p.pos||[]).map(x=>'<div class="pkp"><span class="pkn">'+esc(String(x.n).replace(".",","))+(x.u?' '+esc(x.u):'')+'</span><span class="pkt">'+esc(x.t)+(x.a?' <small>'+esc(x.a)+'</small>':'')+(x.f>0?'<em class="pkfr">davon '+esc(String(x.f).replace(".",","))+' Fremdmiete</em>':'')+'</span></div>').join("")+'</div>'+
  (can("pk_l")?'<button class="btn ghost" id="pkdel" style="color:var(--bad);margin-top:12px">Packliste löschen</button>':'');
 document.querySelectorAll("[data-pkr]").forEach(b=>b.onclick=()=>{curRet=b.dataset.pkr;go("retopen")});
 if($("#pkdel"))$("#pkdel").onclick=()=>ask("Packliste „"+(p.ev||p.ord)+"“ wirklich löschen?",async()=>{try{await db.doc("pack/"+p.id).delete();view="pack";hist=hist.filter(v=>v!=="packopen");draw();toast("Packliste gelöscht",1)}catch(e){errBox("Löschen fehlgeschlagen.")}})}
/* Für Jarvis */
function pkJarvis(){if(!can("pk_s"))return null;const G=pkGroups();return{herr:G.herr,back:G.back,over:G.over}}
function pkSub(){const G=pkGroups(),a=[];if(G.over.length)a.push(G.over.length+" überfällig");if(G.herr.length)a.push(G.herr.length+" heute herrichten");if(G.back.length)a.push(G.back.length+" heute zurück");return a.length?a.join(", "):"PDF hochladen und ansehen"}
function pkHot(){const n=pkGroups().over.length;return n?String(n):""}
