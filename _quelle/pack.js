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
function packSub(){db.collection("pack").onSnapshot(s=>{packs=s.docs.map(d=>({id:d.id,...d.data()}));draw()});db.collection("packh").onSnapshot(s=>{packh={};s.docs.forEach(d=>packh[d.id]=d.data());draw()})}
const pkDig=s=>String(s||"").replace(/\D/g,"");
const pkDay=t=>{const d=new Date(t);d.setHours(0,0,0,0);return d.getTime()};
function pkRets(p){const o=pkDig(p.ord);return o?rets.filter(r=>pkDig(r.ord)===o):[]}
function pkState(p){const t0=pkDay(Date.now()),R=pkRets(p),done=R.some(r=>r.closed);
 if(done)return{k:"done",l:"Retoure abgeschlossen",c:"ok"};
 if(p.de&&pkDay(p.de)<t0)return{k:"over",l:R.length?"Überfällig · Retourschein offen":"Überfällig",c:"warn"};
 if(p.db&&pkDay(p.db)===t0){const g=pkProg(p);return g.fin?{k:"herr",l:"Hergerichtet",c:"ok"}:{k:"herr",l:g.d?"Herrichten "+g.d+"/"+g.n:"Heute herrichten",c:"hot"}}
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
  '<div class="mute">Auftrag '+esc(p.ord||"–")+(p.pl?' · '+esc(p.pl):'')+'</div><div class="mute">Dispo '+pkD(p.db)+' – '+pkD(p.de)+'</div><div class="mute">'+(()=>{const g=pkProg(p);return g.fin?'Hergerichtet ✓ · ':g.d?g.d+' von '+g.n+' hergerichtet · ':''})()+pkPosN((p.pos||[]).length)+(f?' · <span class="pkfr">'+f+' mit Fremdmiete</span>':'')+'</div></div>'}
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
/* ===== Herrichten (ab 1.58) =====
   Stand pro Packliste in docs 'packh' (id = Packlisten-id), damit jeder mit "Packlisten – Sehen" herrichten kann.
   Pro Position ein eigenes Feld h_<Pos> = {ok, q (vorhanden), alt:[{n,t,a}], fm ("lager"|"miete"), by, t} -> doc_update führt Felder zusammen,
   mehrere Kollegen können gleichzeitig an verschiedenen Positionen arbeiten. fin = {by,t} wenn abgeschlossen, info = {by,t} wenn PL-Info verschickt. */
let packh={},pkHf="alle";
function pkKeys(P){const seen={};return (P.pos||[]).map((x,i)=>{let k="h_"+String(x.p||i).replace(/[^0-9A-Za-z]/g,"_");if(seen[k])k+="_"+i;seen[k]=1;return k})}
const pkH=P=>packh[P.id]||{};
const pkNeed=(x,h)=>Math.max(0,(+x.n||0)-(h&&h.fm==="miete"?(+x.f||0):0));
function pkPS(x,h){const need=pkNeed(x,h);if(!h)return{s:"open",need,alt:[]};const alt=h.alt||[];
 if(h.ok)return{s:"ok",q:need,need,alt};const q=typeof h.q==="number"?h.q:null;
 if(q!==null||alt.length)return{s:q!==null&&q>=need?"ok":"part",q:q===null?0:q,need,alt};return{s:"open",need,alt}}
function pkProg(P){const H=pkH(P),K=pkKeys(P);let d=0,dev=0;(P.pos||[]).forEach((x,i)=>{const h=H[K[i]],st=pkPS(x,h);if(st.s!=="open")d++;if(st.s==="part"||st.alt.length||(h&&h.fm==="lager"&&x.f>0))dev++});
 return{d,n:(P.pos||[]).length,dev,fin:!!(H.fin&&H.fin.t),H}}
async function pkHSet(P,patch){try{if(!packh[P.id])await db.doc("packh/"+P.id).set({c:Date.now()});await db.doc("packh/"+P.id).update(patch)}catch(e){console.error(e);errBox("Speichern fehlgeschlagen. Bitte nochmal versuchen.")}}
/* Anzeigename: wie in der Artikelliste (über die Artikelnummer), sonst wie im Packschein */
function pkName(x){const c=typeof artCode==="function"?artCode(x&&x.a):"";if(c&&typeof rkat!=="undefined"&&Array.isArray(rkat)){const k=rkat.find(a=>artCode(a.nr)===c);if(k&&k.name)return k.name}return (x&&x.t)||""}
const pkNum=v=>String(v).replace(".",",");
const pkFmTxt=(x,h)=>!(x.f>0)?"":h&&h.fm==="miete"?pkNum(x.f)+" werden zugemietet → "+pkNum(pkNeed(x,h))+" aus dem Lager":h&&h.fm==="lager"?"Aus dem Lager statt Fremdmiete ("+pkNum(x.f)+")":pkNum(x.f)+" Fremdmiete – antippen zum Klären";
function packOpenView(){const p=packs.find(x=>x.id===curPack);if(!p){view="pack";return packView()}
 const ae=document.activeElement;if(ae&&/INPUT|TEXTAREA/.test(ae.tagName)&&document.querySelector(".ov"))return;
 $("#t").textContent="Packliste";const s=pkState(p),R=pkRets(p),pr=pkProg(p),H=pr.H,K=pkKeys(p),fin=pr.fin;
 const pct=pr.n?Math.round(pr.d*100/pr.n):0;
 const rows=(p.pos||[]).map((x,i)=>{const h=H[K[i]],st=pkPS(x,h);return{x,i,h,st}}).filter(r=>pkHf==="alle"||r.st.s!=="ok");
 $("#app").innerHTML='<div class="card" style="cursor:default"><div class="row" style="align-items:center"><b style="flex:1;min-width:0;font-size:18px">'+esc(p.ev||"Ohne Veranstaltung")+'</b><span class="tag pk'+s.c+'" style="flex:0;white-space:nowrap">'+esc(s.l)+'</span></div>'+
  '<div class="mute">Auftrag '+esc(p.ord||"–")+(p.pl?' · '+esc(p.pl):'')+'</div><div class="mute">Dispo '+pkD(p.db)+' – '+pkD(p.de)+'</div>'+
  '<details class="pkmore"><summary>Alle Angaben</summary><div class="pkkv"><span>Packschein</span><b>'+esc(p.ps||"–")+'</b>'+(p.sa?'<span>Selbstabholer</span><b>'+esc(p.sa)+'</b>':'')+(p.pk?'<span>Packen</span><b>'+pkD(p.pk)+'</b>':'')+(p.an?'<span>Anlieferung</span><b>'+pkD(p.an)+'</b>':'')+(p.eb?'<span>Event</span><b>'+pkD(p.eb)+' – '+pkD(p.ee)+'</b>':'')+'</div><div class="mute" style="font-size:13px;margin-top:6px">Hochgeladen '+fmt(p.t)+' von '+esc(nm(p.by))+'</div></details>'+
  (R.length&&can("ret_s")?R.map(r=>'<button class="btn ghost" data-pkr="'+esc(r.id)+'" style="margin-top:8px">Retourschein öffnen'+(r.closed?' (abgeschlossen)':' (offen)')+'</button>').join(""):'')+'</div>'+
  '<div class="card pkprog'+(fin?' fin':'')+'" style="cursor:default"><div class="row" style="align-items:baseline"><b style="flex:1;font-size:17px">'+(fin?'Hergerichtet':pr.d+' von '+pr.n+' Positionen')+'</b>'+(pr.dev?'<span class="pkdev">'+pr.dev+' mit Abweichung</span>':'')+'</div>'+
  '<div class="pkbar"><i style="width:'+pct+'%"></i></div>'+(fin?'<div class="mute" style="margin-top:6px">von '+esc(nm(H.fin.by))+', '+fmt(H.fin.t)+(H.info&&H.info.t?' · Info an Projektleiter '+fmt(H.info.t):'')+'</div>':'')+'</div>'+
  chips([["alle","Alle"],["offen","Noch offen"]],pkHf,"data-pkhf")+
  '<div class="card pkl" style="cursor:default">'+(rows.length?rows.map(({x,i,h,st})=>{const fm=pkFmTxt(x,h);
   return '<div class="pkp pk-'+st.s+'"><button class="pkc" type="button" data-pc="'+i+'" aria-label="Abhaken"'+(fin?' disabled':'')+'>'+(st.s==="ok"?'✓':st.s==="part"?'!':'')+'</button>'+
   '<span class="pkn" data-pe="'+i+'">'+esc(pkNum(x.n))+(x.u?' '+esc(x.u):'')+'</span><span class="pkt" data-pe="'+i+'">'+esc(pkName(x))+(x.a?' <small>'+esc(x.a)+'</small>':'')+
   (fm?'<em class="'+(h&&h.fm?'pkfm':'pkfr')+'">'+esc(fm)+'</em>':'')+
   (st.s==="part"?'<em class="pkpart">'+pkNum(st.q)+' von '+pkNum(st.need)+' da – fehlen '+pkNum(st.need-st.q)+'</em>':'')+
   st.alt.map(a=>'<em class="pkalt">+ '+esc(pkNum(a.n))+'× '+esc(a.t)+(a.a?' ('+esc(a.a)+')':'')+'</em>').join("")+
   (h&&h.by&&st.s!=="open"?'<small class="pkby">'+esc(String(nm(h.by)).split(" ")[0])+', '+fmt(h.t).slice(-5)+'</small>':'')+'</span></div>'}).join(""):'<div class="mute" style="padding:10px 0">Alles hergerichtet.</div>')+'</div>'+
  (fin?'<button class="btn ghost" id="pkinfo" style="margin-top:12px">Info an Projektleiter</button><button class="btn ghost" id="pkreo" style="margin-top:8px">Wieder öffnen</button>':'<button class="btn" id="pkfin" style="margin-top:12px">Herrichten abschließen</button>')+
  (can("pk_l")?'<button class="btn ghost" id="pkdel" style="color:var(--bad);margin-top:12px">Packliste löschen</button>':'');
 document.querySelectorAll("[data-pkhf]").forEach(b=>b.onclick=()=>{pkHf=b.dataset.pkhf;packOpenView()});
 document.querySelectorAll("[data-pkr]").forEach(b=>b.onclick=()=>{curRet=b.dataset.pkr;go("retopen")});
 document.querySelectorAll("[data-pc]").forEach(b=>b.onclick=()=>pkTap(p,+b.dataset.pc));
 document.querySelectorAll("[data-pe]").forEach(b=>b.onclick=()=>{if(fin)return toast("Herrichten ist abgeschlossen – zum Ändern erst „Wieder öffnen“.",1);pkEdit(p,+b.dataset.pe)});
 if($("#pkfin"))$("#pkfin").onclick=()=>pkFinish(p);
 if($("#pkreo"))$("#pkreo").onclick=()=>ask("Herrichten wieder öffnen?",()=>pkHSet(p,{fin:null}));
 if($("#pkinfo"))$("#pkinfo").onclick=()=>pkMail(p);
 if($("#pkdel"))$("#pkdel").onclick=()=>ask("Packliste „"+(p.ev||p.ord)+"“ wirklich löschen?",async()=>{try{await db.doc("pack/"+p.id).delete();if(packh[p.id])await db.doc("packh/"+p.id).delete().catch(()=>{});view="pack";hist=hist.filter(v=>v!=="packopen");draw();toast("Packliste gelöscht",1)}catch(e){errBox("Löschen fehlgeschlagen.")}})}
/* Kreis antippen: offen -> komplett; komplett (ohne Alternative) -> wieder offen; sonst Bearbeiten. Fremdmiete ungeklärt -> zuerst fragen */
function pkTap(P,i){const x=P.pos[i],k=pkKeys(P)[i],h=pkH(P)[k],st=pkPS(x,h);if(pkProg(P).fin)return;
 const put=fm=>pkHSet(P,{[k]:{ok:true,q:null,alt:(h&&h.alt)||[],fm:fm||(h&&h.fm)||"",by:me,t:Date.now()}});
 if(x.f>0&&!(h&&h.fm))return pkFmAsk(x,fm=>put(fm));
 if(st.s==="open")return put();
 if(st.s==="ok"&&h&&h.ok&&!st.alt.length)return pkHSet(P,{[k]:h.fm?{fm:h.fm,by:me,t:Date.now()}:null});
 pkEdit(P,i)}
function pkFmAsk(x,cb){const o=document.createElement("div");o.className="ov";
 o.innerHTML='<div class="card" style="width:100%;max-width:400px;margin:0"><b>'+esc(pkName(x))+'</b><p style="margin:8px 0">Laut Packliste '+pkNum(x.n)+(x.u?' '+esc(x.u):'')+', davon <span class="pkfr">'+pkNum(x.f)+' Fremdmiete</span>.</p>'+
  '<button class="btn" id="fml" type="button">Aus dem Lager<br><small style="font-weight:400">alle '+pkNum(x.n)+' kommen von uns</small></button><div style="height:8px"></div><button class="btn" id="fmm" type="button">Wird zugemietet<br><small style="font-weight:400">nur '+pkNum(Math.max(0,x.n-x.f))+' aus dem Lager</small></button><div style="height:8px"></div><button class="btn ghost" id="fmx" type="button">Abbrechen</button></div>';
 document.body.appendChild(o);o.querySelector("#fml").onclick=()=>{o.remove();cb("lager")};o.querySelector("#fmm").onclick=()=>{o.remove();cb("miete")};o.querySelector("#fmx").onclick=()=>o.remove()}
/* Menge, Alternative, Fremdmiete bearbeiten */
function pkEdit(P,i){const x=P.pos[i],k=pkKeys(P)[i],h=pkH(P)[k]||{};let fm=h.fm||"",alt=(h.alt||[]).map(a=>({...a})),pick=null;
 const o=document.createElement("div");o.className="ov";
 const need=()=>pkNeed(x,{fm});
 o.innerHTML='<div class="card" style="width:100%;max-width:440px;margin:0;max-height:92vh;overflow:auto"><b style="font-size:17px">'+esc(pkName(x))+'</b>'+(x.a?' <span class="mute">'+esc(x.a)+'</span>':'')+(pkName(x)!==x.t?'<div class="mute" style="font-size:13px">Im Packschein: '+esc(x.t)+'</div>':'')+
  '<p class="mute" style="margin:4px 0 10px">Laut Packliste: '+pkNum(x.n)+(x.u?' '+esc(x.u):'')+(x.f>0?', davon <span class="pkfr">'+pkNum(x.f)+' Fremdmiete</span>':'')+'</p>'+
  (x.f>0?'<label class="mute">Fremdmiete</label><div class="row seg" style="margin:4px 0 10px"><button type="button" id="pefl">Aus dem Lager</button><button type="button" id="pefm">Wird zugemietet</button></div>':'')+
  '<label class="mute" for="peq">Vorhanden <span id="pen"></span></label><div class="row" style="align-items:center;gap:8px"><button class="btn ghost" id="pem" type="button" style="flex:0 0 52px">−</button><input id="peq" type="number" inputmode="numeric" min="0" style="text-align:center;font-size:20px;margin:0"><button class="btn ghost" id="pep" type="button" style="flex:0 0 52px">+</button></div>'+
  '<button class="btn ghost s" id="pea" type="button" style="margin-top:6px">Alles da</button>'+
  '<h4 style="margin:14px 0 4px">Alternative</h4><div id="pel"></div>'+
  '<div class="row" style="gap:8px;align-items:flex-start"><input id="pean" type="number" inputmode="numeric" min="1" placeholder="Anz." style="flex:0 0 72px;margin:0"><div style="flex:1;min-width:0;position:relative"><input id="peat" placeholder="Artikel suchen oder eintippen" autocomplete="off" style="margin:0"><div id="peres" class="peres"></div></div></div>'+
  '<button class="btn ghost" id="peadd" type="button" style="margin-top:6px">+ Alternative hinzufügen</button>'+
  '<div class="row" style="margin-top:14px"><button class="btn ghost" id="pex" type="button">Abbrechen</button><button class="btn" id="pes" type="button">Speichern</button></div>'+
  '<button class="lnk" id="per" type="button" style="margin-top:6px;color:var(--bad)">Position zurücksetzen</button></div>';
 document.body.appendChild(o);const g=id=>o.querySelector("#"+id),qi=g("peq");
 qi.value=h.ok?String(need()):(typeof h.q==="number"?String(h.q):"");
 const lab=()=>{g("pen").textContent="(von "+pkNum(need())+")";if(g("pefl")){g("pefl").classList.toggle("on",fm==="lager");g("pefm").classList.toggle("on",fm==="miete")}};
 const drawAlt=()=>{g("pel").innerHTML=alt.map((a,j)=>'<div class="pealt"><span>'+esc(pkNum(a.n))+'× '+esc(a.t)+(a.a?' <small>'+esc(a.a)+'</small>':'')+'</span><button class="lnk" type="button" data-ax="'+j+'" style="color:var(--bad)">Entfernen</button></div>').join("");
  g("pel").querySelectorAll("[data-ax]").forEach(b=>b.onclick=()=>{alt.splice(+b.dataset.ax,1);drawAlt()})};
 lab();drawAlt();
 if(g("pefl")){g("pefl").onclick=()=>{fm="lager";lab()};g("pefm").onclick=()=>{fm="miete";lab()}}
 const qv=()=>{const v=qi.value.trim();return v===""?null:Math.max(0,parseFloat(v.replace(",","."))||0)};
 g("pem").onclick=()=>{qi.value=String(Math.max(0,(qv()===null?need():qv())-1))};g("pep").onclick=()=>{qi.value=String((qv()===null?0:qv())+1)};g("pea").onclick=()=>{qi.value=String(need())};
 const K=(typeof rkat!=="undefined"&&Array.isArray(rkat))?rkat:[];
 g("peat").oninput=()=>{pick=null;const t=g("peat").value.trim().toLowerCase();if(t.length<2){g("peres").innerHTML="";return}
  const L=K.filter(a=>String(a.name||"").toLowerCase().includes(t)||String(a.nr||"").toLowerCase().startsWith(t)).slice(0,6);
  g("peres").innerHTML=L.map((a,j)=>'<button type="button" data-ar="'+j+'"><b>'+esc(a.name)+'</b> <small>'+esc(a.nr||"")+(a.g?' · '+esc(a.g):'')+'</small></button>').join("");
  g("peres").querySelectorAll("[data-ar]").forEach(b=>b.onclick=()=>{const a=L[+b.dataset.ar];pick={t:a.name,a:a.nr||""};g("peat").value=a.name;g("peres").innerHTML=""})};
 g("peadd").onclick=()=>{const n=parseFloat(String(g("pean").value).replace(",","."))||0,t=g("peat").value.trim();if(!n||!t)return toast("Bitte Anzahl und Artikel angeben.");
  alt.push(pick&&pick.t===t?{n,t:pick.t,a:pick.a}:{n,t,a:""});g("pean").value="";g("peat").value="";pick=null;drawAlt()};
 g("pex").onclick=()=>o.remove();
 g("per").onclick=()=>{o.remove();pkHSet(P,{[k]:null})};
 g("pes").onclick=()=>{const pend=g("pean").value&&g("peat").value.trim();if(pend)g("peadd").click();const q=qv();if(x.f>0&&!fm&&(q!==null||alt.length))return toast("Bitte zuerst klären: aus dem Lager oder zugemietet.");
  o.remove();if(q===null&&!alt.length)return pkHSet(P,{[k]:fm?{fm,by:me,t:Date.now()}:null});
  pkHSet(P,{[k]:{ok:q!==null&&q>=need()&&!alt.length,q,alt,fm,by:me,t:Date.now()}})}}
/* Abschließen + Info an Projektleiter */
function pkFinish(P){const pr=pkProg(P),open=pr.n-pr.d;
 const go2=()=>pkHSet(P,{fin:{by:me,t:Date.now()}}).then(()=>{toast("Herrichten abgeschlossen",1);const pp=pkProg(P);if(pp.dev||pp.n-pp.d>0)ask("Es gibt Abweichungen. Soll "+(P.pl||"der Projektleiter")+" eine Info bekommen?",()=>pkMail(P))});
 if(open>0)ask("Noch "+open+(open===1?" Position ist":" Positionen sind")+" nicht hergerichtet. Trotzdem abschließen?",go2);else go2()}
function pkMailText(P){const H=pkH(P),K=pkKeys(P),L=[];
 (P.pos||[]).forEach((x,i)=>{const h=H[K[i]],st=pkPS(x,h),nm2=x.t+(x.a?" ("+x.a+")":""),u=x.u?" "+x.u:"";
  if(st.s==="open")L.push("- "+nm2+": nicht hergerichtet (laut Packliste "+pkNum(st.need)+u+")");
  else if(st.s==="part")L.push("- "+nm2+": "+pkNum(st.q)+" von "+pkNum(st.need)+u+" – fehlen "+pkNum(st.need-st.q));
  if(st.alt.length)st.alt.forEach(a=>L.push((st.s==="part"||st.s==="open"?"  ":"- "+nm2+":\n  ")+"Alternative: "+pkNum(a.n)+"× "+a.t+(a.a?" ("+a.a+")":"")));
  if(h&&h.fm==="lager"&&x.f>0)L.push("- "+nm2+": aus dem Lager statt Fremdmiete ("+pkNum(x.f)+u+")")});
 const vn=String(P.pl||"").split(" ")[0],me1=String(nm(me)||"");
 return{subj:"Packliste "+(P.ord||"")+" – "+(P.ev||"")+": Abweichungen beim Herrichten",
  body:"Hallo"+(vn?" "+vn:"")+",\n\nbeim Herrichten von "+(P.ev||"")+" (Auftrag "+(P.ord||"–")+", Packschein "+(P.ps||"–")+") gab es folgende Abweichungen:\n\n"+(L.length?L.join("\n"):"- keine")+"\n\nHergerichtet von "+(H.fin&&H.fin.by?nm(H.fin.by):me1)+(H.fin&&H.fin.t?", "+fmt(H.fin.t):"")+".\n\nLG\n"+me1}}
function pkMail(P){const m=pkMailText(P),o=document.createElement("div");o.className="ov";
 o.innerHTML='<div class="card" style="width:100%;max-width:460px;margin:0;max-height:92vh;overflow:auto"><b>Info an '+esc(P.pl||"Projektleiter")+'</b><p class="mute" style="margin:4px 0 8px">Betreff: '+esc(m.subj)+'</p><textarea id="kpmt" style="min-height:220px"></textarea>'+
  '<div class="row" style="margin-top:8px"><a class="btn" id="kpmm" href="#">Mail öffnen</a><button class="btn ghost" id="kpms" type="button" hidden>Teilen</button></div><div class="row" style="margin-top:8px"><button class="btn ghost" id="kpmc" type="button">Text kopieren</button><button class="btn ghost" id="kpmx" type="button">Schließen</button></div></div>';
 document.body.appendChild(o);const g=id=>o.querySelector("#"+id),ta=g("kpmt");ta.value=m.body;
 const mark=()=>pkHSet(P,{info:{by:me,t:Date.now()}});
 const upd=()=>{g("kpmm").href="mailto:?subject="+encodeURIComponent(m.subj)+"&body="+encodeURIComponent(ta.value)};upd();ta.oninput=upd;
 g("kpmm").onclick=()=>{mark();setTimeout(()=>o.remove(),300)};
 if(navigator.share){g("kpms").hidden=false;g("kpms").onclick=()=>navigator.share({title:m.subj,text:ta.value}).then(()=>{mark();o.remove()}).catch(()=>{})}
 g("kpmc").onclick=async()=>{try{await navigator.clipboard.writeText(m.subj+"\n\n"+ta.value);toast("Text kopiert",1);mark()}catch(e){ta.select();toast("Bitte Text markieren und kopieren.")}};
 g("kpmx").onclick=()=>o.remove()}
/* Für Jarvis */
function pkJarvis(){if(!can("pk_s"))return null;const G=pkGroups();return{herr:G.herr.filter(p=>!pkProg(p).fin),herrDone:G.herr.filter(p=>pkProg(p).fin),back:G.back,over:G.over}}
function pkSub(){const G=pkGroups(),a=[];if(G.over.length)a.push(G.over.length+" überfällig");const hh=G.herr.filter(p=>!pkProg(p).fin).length;if(hh)a.push(hh+" heute herrichten");if(G.back.length)a.push(G.back.length+" heute zurück");return a.length?a.join(", "):"PDF hochladen und ansehen"}
function pkHot(){const n=pkGroups().over.length;return n?String(n):""}
