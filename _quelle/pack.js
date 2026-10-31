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
function packSub(){db.collection("pack").onSnapshot(s=>{packs=s.docs.map(d=>({id:d.id,...d.data()}));draw()});db.collection("packh").onSnapshot(s=>{packh={};s.docs.forEach(d=>packh[d.id]=d.data());draw()});if(typeof jvErinSub==="function")jvErinSub()}
const pkDig=s=>String(s||"").replace(/\D/g,"");
const pkDay=t=>{const d=new Date(t);d.setHours(0,0,0,0);return d.getTime()};
function pkRets(p){const o=pkDig(p.ord);return o?rets.filter(r=>pkDig(r.ord)===o):[]}
/* Herricht-Tag: Dispo-Beginn oder verschoben (packh.hd = {d:"JJJJ-MM-TT", why, by, t}) */
const pkYmd=t=>{const d=new Date(t);return d.getFullYear()+"-"+String(d.getMonth()+1).padStart(2,"0")+"-"+String(d.getDate()).padStart(2,"0")};
const pkFromYmd=s=>{const m=String(s||"").match(/^(\d{4})-(\d{2})-(\d{2})$/);return m?new Date(+m[1],+m[2]-1,+m[3]).getTime():0};
function pkHd(p){if(p&&p._z){const h=(packh[p.id]||{})["zd_"+pkZK(p._z)];return h&&pkFromYmd(h.d)?h:null}const h=(packh[p.id]||{}).hd;return h&&pkFromYmd(h.d)?h:null}
function pkHDay(p){if(p&&p._z){const z=pkZOf(p._p,p._z);return z?pkZDay(p._p,z):0}const h=pkHd(p);return h?pkFromYmd(h.d):(p.db?pkDay(p.db):0)}
const pkShifted=p=>!(p&&p._z)&&!!pkHd(p)&&pkHDay(p)!==(p.db?pkDay(p.db):0);
const pkWd=t=>t?new Date(t).toLocaleDateString("de-AT",{weekday:"short",day:"2-digit",month:"2-digit"}):"–";
function pkState(p){const t0=pkDay(Date.now()),R=pkRets(p),done=R.some(r=>r.closed&&r.art!=="teil"),hd=pkHDay(p);
 if(done)return{k:"done",l:"Retoure abgeschlossen",c:"ok"};
 const kl=(packh[p.id]||{}).klar;if(kl&&kl.t)return{k:"done",l:"Mit Projektleiter geklärt",c:"ok"};
 if(p.de&&pkDay(p.de)<t0)return{k:"over",l:R.length?"Überfällig · Retourschein offen":"Überfällig",c:"warn"};
 if(hd&&hd===t0){const g=pkProg(p);return g.fin?{k:"herr",l:"Hergerichtet",c:"ok"}:{k:"herr",l:g.d?"Herrichten "+g.d+"/"+g.n:"Heute herrichten",c:"hot"}}
 if(p.de&&pkDay(p.de)===t0)return{k:"back",l:"Heute zurück",c:"hot"};
 if(hd&&hd<t0&&!pkProg(p).fin){const g=pkProg(p);return g.d?{k:"late",l:"Teilweise hergerichtet "+g.d+"/"+g.n,c:"part"}:{k:"late",l:"Nicht hergerichtet",c:"warn"}}
 if(hd&&hd>t0)return{k:"next",l:pkShifted(p)?"Verschoben":"Kommt noch",c:pkShifted(p)?"hot":""};
 return{k:"out",l:"Unterwegs",c:""}}
const pkD=t=>t?new Date(t).toLocaleDateString("de-AT",{day:"2-digit",month:"2-digit",year:"numeric"})+(new Date(t).getHours()||new Date(t).getMinutes()?" "+new Date(t).toLocaleTimeString("de-AT",{hour:"2-digit",minute:"2-digit"}):""):"–";
const pkPosN=n=>n+(n===1?" Position":" Positionen");
const pkF=p=>pkPosAll(p).filter(x=>x.f>0);
function pkGroups(){const G={over:[],late:[],herr:[],back:[],out:[],next:[],done:[]};packs.forEach(p=>G[pkState(p).k].push(p));
 G.over.sort((a,b)=>(a.de||0)-(b.de||0));G.herr.sort((a,b)=>(a.db||0)-(b.db||0));G.back.sort((a,b)=>(a.de||0)-(b.de||0));G.out.sort((a,b)=>(a.de||0)-(b.de||0));G.next.sort((a,b)=>pkHDay(a)-pkHDay(b));G.late.sort((a,b)=>pkHDay(a)-pkHDay(b));G.done.sort((a,b)=>(b.de||0)-(a.de||0));return G}
function pkHint(p){const s=pkState(p),h=pkHd(p),out=[];
 if(s.k==="late")out.push('<div class="pkhint '+(s.c==="part"?'part">◐ Teilweise hergerichtet':'warn">⚠ Nicht hergerichtet')+' – '+(pkShifted(p)?'verschoben auf '+pkWd(pkHDay(p))+', ':'')+'Dispo-Beginn war '+pkWd(p.db)+'</div>');
 else if(pkShifted(p))out.push('<div class="pkhint">↻ Herrichten verschoben auf '+pkWd(pkHDay(p))+' (Dispo-Beginn '+pkWd(p.db)+')'+(h.why?' – '+esc(h.why):'')+(h.by?' · '+esc(nm(h.by)):'')+'</div>');
 const H=packh[p.id]||{};
 if(H.klar&&H.klar.t)out.push('<div class="pkhint">✓ Mit Projektleiter geklärt · '+esc(nmA(H.klar,"by"))+', '+fmt(H.klar.t).slice(0,6)+'</div>');
 Object.keys(H).filter(k=>/^n_/.test(k)&&H[k]&&H[k].txt).sort((a,b)=>H[a].t-H[b].t).forEach(k=>out.push('<div class="pkhint">✎ '+esc(H[k].txt)+' · '+esc(nmA(H[k],"by"))+', '+fmt(H[k].t).slice(0,6)+'</div>'));
 if(!p._z&&(p.chg||[]).length){const c=p.chg.slice().sort((a,b)=>b.t-a.t)[0];if(!(H.fin&&H.fin.t>c.t))out.push('<div class="pkhint warn">↻ Packschein geändert '+fmt(c.t).slice(0,6)+' ('+esc(pkChgLbl(c))+') – Änderungen prüfen</div>')}
 if(!p._z){const zr=pkZrOpen(p);if(zr.length)out.push('<div class="pkhint warn">↩ Zurücklegen: '+zr.map(([,r])=>pkNum(r.n)+' '+esc(r.u||"Stk")+' '+esc(r.name)).join(', ')+'</div>')}
 const t0=pkDay(Date.now());if(!p._z)(p.zus||[]).forEach(z=>{const f=pkZFin(p,z),d=pkZDay(p,z);out.push(f?'<div class="pkhint">＋ Zusatz '+esc(z.ps)+' hergerichtet</div>':d<t0?'<div class="pkhint warn">⚠ Zusatz '+esc(z.ps)+' noch nicht hergerichtet – war für '+pkWd(d)+' geplant</div>':'<div class="pkhint">＋ Zusatz '+esc(z.ps)+' – herrichten '+(d===t0?'heute':pkWd(d))+'</div>')});
 return out.join("")}
function pkRow(p){const s=pkState(p),f=pkF(p).length;
 return '<div class="card pkr" data-pk="'+esc(p.id)+'"><div class="row" style="align-items:center"><b style="flex:1;min-width:0">'+esc(p.ev||"Ohne Veranstaltung")+'</b>'+(s.c?'<span class="tag pk'+s.c+'" style="flex:0;white-space:nowrap">'+esc(s.l)+'</span>':'')+'</div>'+
  '<div class="mute">Auftrag '+esc(p.ord||"–")+(p.pl?' · '+esc(shortName(p.pl)):'')+'</div><div class="mute">Dispo '+pkD(p.db)+' – '+pkD(p.de)+'</div><div class="mute">'+(()=>{const g=pkProg(p);return g.fin?'Hergerichtet ✓ · ':g.d?g.d+' von '+g.n+' hergerichtet · ':''})()+pkPosN(pkPosAll(p).length)+((p.zus||[]).length?' · '+(p.zus.length===1?'1 Zusatz':p.zus.length+' Zusätze'):'')+(f?' · <span class="pkfr">'+f+' mit Fremdmiete</span>':'')+'</div>'+pkHint(p)+'</div>'}
function pkUpHtml(){return can("pk_b")?'<button class="btn" id="pkup">Packliste hochladen (PDF)</button><input id="pkfile" type="file" accept="application/pdf,.pdf" multiple hidden>':''}
function pkUpBind(){if($("#pkup")){$("#pkup").onclick=()=>$("#pkfile").click();$("#pkfile").onchange=e=>{const fs=[...e.target.files];e.target.value="";pkUpload(fs)}}}
function packView(){$("#t").textContent="Alle Packlisten";const G=pkGroups();
 const sec=(t,a)=>a.length?'<h3 class="pkh">'+t+' <span class="mute">'+a.length+'</span></h3>'+a.map(pkRow).join(""):"";
 const cur=sec("Überfällig",G.over)+sec("Nicht hergerichtet",G.late)+sec("Heute herrichten",G.herr)+sec("Heute zurück",G.back)+sec("Unterwegs",G.out)+sec("Kommt noch",G.next);
 $("#app").innerHTML=(can("pk_b")?pkUpHtml()+'<p class="mute" style="font-size:13px;margin:6px 0 12px">Die PDF wird nur im Gerät gelesen. Gespeichert werden Auftrag, Veranstaltung, Projektleiter, Zeiten und Material – keine Kundendaten.</p>':'')+
  chips([["aktuell","Aktuell"],["done","Erledigt"],["alle","Alle"]],pkf,"data-pkf")+
  (pkf==="aktuell"?(cur||'<div class="card mute">Keine aktuellen Packlisten.</div>'):pkf==="done"?(sec("Retoure abgeschlossen",G.done)||'<div class="card mute">Noch keine erledigten Packlisten.</div>'):(packs.length?cur+sec("Retoure abgeschlossen",G.done):'<div class="card mute">Noch keine Packlisten hochgeladen.</div>'));
 document.querySelectorAll("[data-pkf]").forEach(b=>b.onclick=()=>{pkf=b.dataset.pkf;packView()});
 document.querySelectorAll("[data-pk]").forEach(e=>e.onclick=()=>{curPack=e.dataset.pk;go("packopen")});
 pkUpBind()}
async function pkUpload(files){for(const f of files){let P;const b=$("#pkup");if(b){b.disabled=true;b.textContent="Wird gelesen …"}
  try{P=await pkRead(f)}catch(e){console.warn("Packliste",e);if(b){b.disabled=false;b.textContent="Packliste hochladen (PDF)"}
   errBox(/Packliste|Auftragsnummer|Positionen/.test(String(e&&e.message))?"„"+f.name+"“ sieht nicht wie eine epirent-Packliste aus.":"Die PDF konnte nicht gelesen werden ("+String(e&&e.message||e).slice(0,80)+"). Bitte Internetverbindung prüfen und nochmal versuchen.");continue}
  if(b){b.disabled=false;b.textContent="Packliste hochladen (PDF)"}
  const id=P.ps||("A"+pkDig(P.ord)),cur=packs.find(x=>x.id===id||(P.ps&&String(x.ps)===String(P.ps))),main=cur?null:pkMainFor(P,id);
  /* 1.89: gleicher Auftrag schon da -> Vergleich: geändert (ersetzt) / Zusatz / eigene Packliste (pkchg.js) */
  let ok;if(cur||main){const r=await pkChgDlg(P,cur||main,!!cur);if(!r)continue;
   if(r.mode==="rep"){await pkReplace(cur||main,P,r.inc||[]);continue}if(r.mode==="repz"){await pkReplaceZ(main,r.zps,P);continue}ok=r.mode==="zus"?"zus":true}
  else{ok=await pkConfirm(P,null);if(!ok)continue}
  if(ok==="zus"){const day=await pkZAskDay(P,main);if(!day)continue;
   try{const zus=(main.zus||[]).filter(z=>String(z.ps)!==String(P.ps)).concat([{ps:P.ps,ev:P.ev,t:Date.now(),by:me,pos:P.pos,v:2}]);
    await db.doc("pack/"+main.id).update({zus});const zk=pkZK(P.ps);await pkHSet(main,{["zd_"+zk]:{d:day,by:me,t:Date.now()},["zf_"+zk]:{t:0}});
    toast("Zusatz angehängt – herrichten "+pkWd(pkFromYmd(day)),1)}catch(e){console.error(e);errBox("Speichern fehlgeschlagen. Hast du das Recht „Packlisten hochladen“?")}continue}
  try{await db.doc("pack/"+id).set({...P,zus:[],by:me,t:Date.now()});toast("Packliste gespeichert",1)}catch(e){console.error(e);errBox("Speichern fehlgeschlagen. Hast du das Recht „Packlisten hochladen“?")}}}
/* Gibt es schon eine Packliste mit derselben Auftragsnummer (anderer Packschein)? -> Zusatz. Bereits angehängter Zusatz mit gleicher Nummer -> derselbe Haupt-Packschein */
function pkMainFor(P,id){const o=pkDig(P.ord);if(!o||packs.some(x=>x.id===id||String(x.ps)===String(P.ps)))return null;
 const z=packs.find(x=>(x.zus||[]).some(q=>String(q.ps)===String(P.ps)));if(z)return z;
 return packs.filter(x=>pkDig(x.ord)===o).sort((a,b)=>(a.t||0)-(b.t||0))[0]||null}
function pkConfirm(P,main){return new Promise(res=>{const id=P.ps||("A"+pkDig(P.ord)),old=packs.find(x=>x.id===id),f=P.pos.filter(x=>x.f>0).length,o=document.createElement("div");o.className="ov";
 const mf=main&&(packh[main.id]||{}).fin,again=main&&(main.zus||[]).some(q=>String(q.ps)===String(P.ps));
 o.innerHTML='<div class="card" style="width:100%;max-width:420px;margin:0;max-height:90vh;overflow:auto"><b>'+(main?'Zusatz-Packschein erkannt':'Packliste erkannt')+'</b>'+
  '<div class="pkkv"><span>Veranstaltung</span><b>'+esc(P.ev||"–")+'</b><span>Auftrag</span><b>'+esc(P.ord||"–")+'</b><span>Packschein</span><b>'+esc(P.ps||"–")+'</b><span>Projektleiter</span><b>'+esc(shortName(P.pl)||"–")+'</b><span>Dispo Beginn</span><b>'+pkD(P.db)+'</b><span>Dispo Ende</span><b>'+pkD(P.de)+'</b></div>'+
  '<p style="margin:8px 0">'+pkPosN(P.pos.length)+(f?', davon <span class="pkfr">'+f+' mit Fremdmiete</span>':'')+'</p>'+
  (old?'<p class="pkold">Diese Packliste ist schon da (hochgeladen '+fmt(old.t)+' von '+esc(nm(old.by))+'). Beim Speichern wird sie ersetzt.</p>':'')+
  (main?'<p class="pkzinfo">Zum Auftrag '+esc(P.ord)+' gibt es schon die Packliste <b>'+esc(main.ev||"")+'</b> (Packschein '+esc(main.ps||main.id)+'). '+(again?'Dieser Zusatz ist dort schon angehängt und wird ersetzt. ':'Der Zusatz wird unten angehängt. ')+'Den Herricht-Tag für den Zusatz fragt die App gleich danach.'+(mf&&mf.t?' Die Packliste bleibt hergerichtet – der Zusatz wird für sich hergerichtet.':'')+'</p>':'')+
  (main?'<button class="btn" id="pkzok" type="button">Als Zusatz anhängen</button><div style="height:8px"></div><div class="row"><button class="btn ghost" id="pkcn">Abbrechen</button><button class="btn ghost" id="pkok">Als eigene Packliste</button></div></div>'
   :'<div class="row"><button class="btn ghost" id="pkcn">Abbrechen</button><button class="btn" id="pkok">'+(old?'Ersetzen':'Speichern')+'</button></div></div>');
 document.body.appendChild(o);o.querySelector("#pkcn").onclick=()=>{o.remove();res(false)};o.querySelector("#pkok").onclick=()=>{o.remove();res(true)};if(o.querySelector("#pkzok"))o.querySelector("#pkzok").onclick=()=>{o.remove();res("zus")}})}
/* ===== Herrichten (ab 1.58) =====
   Stand pro Packliste in docs 'packh' (id = Packlisten-id), damit jeder mit "Packlisten – Sehen" herrichten kann.
   Pro Position ein eigenes Feld h_<Pos> = {ok, q (vorhanden), alt:[{n,t,a}], fm ("lager"|"miete"), by, t} -> doc_update führt Felder zusammen,
   mehrere Kollegen können gleichzeitig an verschiedenen Positionen arbeiten. fin = {by,t} wenn abgeschlossen, info = {by,t} wenn PL-Info verschickt. */
let packh={},pkHf="alle";
/* Alle Positionen: Haupt-Packschein, dann angehängte Zusatz-Packscheine (P.zus = [{ps, ev, t, by, pos}]); Zusatz-Schlüssel h_z<ps>_<Pos> */
function pkItems(P){const seen={},out=[];const add=(x,i,pre,zps)=>{let k="h_"+pre+String(x.p||i).replace(/[^0-9A-Za-z]/g,"_");if(seen[k])k+="_"+i;seen[k]=1;out.push({x,k,z:zps})};
 (P.pos||[]).forEach((x,i)=>add(x,i,"",null));(P.zus||[]).forEach(z=>(z.pos||[]).forEach((x,i)=>add(x,i,"z"+String(z.ps||"").replace(/[^0-9A-Za-z]/g,"")+"_",String(z.ps||""))));return out}
const pkKeys=P=>pkItems(P).map(o=>o.k);
const pkPosAll=P=>pkItems(P).map(o=>o.x);
const pkH=P=>packh[P.id]||{};
const pkNeed=(x,h)=>Math.max(0,(+x.n||0)-(h&&h.fm==="miete"?(+x.f||0):0));
function pkPS(x,h){const need=pkNeed(x,h);if(!h)return{s:"open",need,alt:[]};const alt=h.alt||[];
 if(h.ok)return{s:"ok",q:need,need,alt};const q=typeof h.q==="number"?h.q:null;
 if(q!==null||alt.length)return{s:q!==null&&q>=need?"ok":"part",q:q===null?0:q,need,alt};return{s:"open",need,alt}}
/* Lager 55 (ab 1.78): holt Fahrer/Monteur selbst – Artikel in der Artikelliste markiert (rkat.l55), pro Position umstellbar (packh h_<Pos>.l55 = true/false) */
function pkL55(x,h){if(h&&typeof h.l55==="boolean")return h.l55;const k=pkKat(x);return !!(k&&k.l55)}
function pkProg(P){if(P&&P._z)return pkZProg(P._p,P._z);return pkProgOf(P,null,!!(pkH(P).fin&&pkH(P).fin.t))}
function pkProgOf(P,zps,fin){const H=pkH(P);let d=0,dev=0,n=0,l55=0;pkItems(P).forEach(o=>{if((o.z||null)!==zps)return;const x=o.x,h=H[o.k];if(pkL55(x,h)){l55++;return}n++;const st=pkPS(x,h);if(st.s!=="open")d++;if(st.s==="part"||st.alt.length||(h&&h.fm==="lager"&&x.f>0))dev++});
 return{d,n,dev,l55,fin,H}}
/* ===== Zusatz-Packscheine mit eigenem Herricht-Tag (ab 1.88) =====
   epirent gibt jedem Zusatz den Dispo-Beginn des ersten Packscheins – darum eigener Tag: packh.zd_<ps> = {d:"JJJJ-MM-TT", why, by, t} (beim Hochladen gefragt, „Verschieben“).
   Eigener Abschluss: packh.zf_<ps> = {by,t} (t=0 = wieder geöffnet). Rücklauf gemeinsam mit dem Rest (Dispo-Ende).
   Alte Zusätze (vor 1.88, ohne z.v): Tag = Hochlade-Tag, hergerichtet = Packliste nach dem Anhängen abgeschlossen. */
const pkZK=ps=>String(ps||"").replace(/[^0-9A-Za-z]/g,"");
const pkZOf=(P,ps)=>(P&&P.zus||[]).find(z=>String(z.ps)===String(ps))||null;
function pkZDay(P,z){const h=pkH(P)["zd_"+pkZK(z.ps)];return h&&pkFromYmd(h.d)?pkFromYmd(h.d):(z.t?pkDay(z.t):(P.db?pkDay(P.db):0))}
function pkZFin(P,z){const H=pkH(P),f=H["zf_"+pkZK(z.ps)];if(f)return f.t?f:null;if(!z.v&&H.fin&&H.fin.t&&H.fin.t>=(z.t||0))return H.fin;return null}
function pkZProg(P,ps){const z=pkZOf(P,ps);return pkProgOf(P,String(ps),!!(z&&pkZFin(P,z)))}
/* Zusatz als eigener Eintrag für Listen (Übersicht, Heute herrichten, Briefing, Wochenbericht) – öffnet die Packliste */
function pkZPseudo(P,z){return{id:P.id,_z:String(z.ps),_p:P,ev:"Zusatz "+z.ps+" zu "+(P.ev||"Auftrag "+(P.ord||"")),ord:P.ord,pl:P.pl,db:P.db,de:P.de,ps:z.ps,pos:z.pos||[],zus:[],t:z.t,by:z.by}}
function pkZTasks(){return packs.flatMap(P=>pkState(P).k==="done"?[]:(P.zus||[]).map(z=>pkZPseudo(P,z)))}
/* Zeile i (Index in pkItems) gesperrt? Haupt-Positionen mit fin, Zusatz-Positionen mit ihrem eigenen Abschluss */
function pkRowFin(P,i){const o=pkItems(P)[i];if(!o)return false;if(o.z){const z=pkZOf(P,o.z);return !!(z&&pkZFin(P,z))}return !!(pkH(P).fin&&pkH(P).fin.t)}
async function pkHSet(P,patch){try{if(!packh[P.id])await db.doc("packh/"+P.id).set({c:Date.now()});await db.doc("packh/"+P.id).update(patch)}catch(e){console.error(e);errBox("Speichern fehlgeschlagen. Bitte nochmal versuchen.")}}
/* Anzeigename: wie in der Artikelliste (über die Artikelnummer), sonst wie im Packschein */
function pkKat(x){const c=typeof artCode==="function"?artCode(x&&x.a):"";if(!c||typeof rkat==="undefined"||!Array.isArray(rkat))return null;return rkat.find(a=>artCode(a.nr)===c)||null}
const pkGrp=x=>{const k=pkKat(x);return k?[k.g,k.u].filter(Boolean).join(" · ")||"Ohne Gruppe":"Nicht in der Artikelliste"};
function pkName(x){const c=typeof artCode==="function"?artCode(x&&x.a):"";if(c&&typeof rkat!=="undefined"&&Array.isArray(rkat)){const k=rkat.find(a=>artCode(a.nr)===c);if(k&&k.name)return k.name}return (x&&x.t)||""}
/* Reihenfolge wie in der Artikelliste (Gruppen und Untergruppen in der Reihenfolge, in der die Artikelliste sie zeigt); Artikel ohne Treffer danach, in Packschein-Reihenfolge */
let pkRkRef=null,pkRkLen=-1,pkRank={};
function pkRanks(){if(typeof rkat==="undefined"||!Array.isArray(rkat))return{};if(pkRkRef===rkat&&pkRkLen===rkat.length)return pkRank;
 const rw=a=>typeof alRow==="function"?alRow(a):(+a.o||0)%100000,L=rkat.slice().sort((a,b)=>rw(a)-rw(b)||String(a.name).localeCompare(b.name,"de",{numeric:true})),G=[];
 L.forEach(a=>{let g=G.find(x=>x.g===a.g);if(!g)G.push(g={g:a.g,subs:[]});let u=g.subs.find(x=>x.u===(a.u||""));if(!u)g.subs.push(u={u:a.u||"",items:[]});u.items.push(a)});
 const R={};let n=0;G.forEach(g=>g.subs.forEach(u=>u.items.forEach(a=>{const c=artCode(a.nr);if(c&&!(c in R))R[c]=n;n++})));pkRkRef=rkat;pkRkLen=rkat.length;pkRank=R;return R}
function pkSortIdx(P){const R=pkRanks(),big=1e9,I=pkItems(P),zo=[null].concat((P.zus||[]).map(z=>String(z.ps||"")));return I.map((o,i)=>{const c=artCode(o.x.a);return{i,zi:zo.indexOf(o.z),r:c&&c in R?R[c]:big}}).sort((a,b)=>a.zi-b.zi||a.r-b.r||a.i-b.i).map(o=>o.i)}
const pkNum=v=>String(v).replace(".",",");
const pkFmTxt=(x,h)=>!(x.f>0)?"":h&&h.fm==="miete"?pkNum(x.f)+" werden zugemietet → "+pkNum(pkNeed(x,h))+" aus dem Lager":h&&h.fm==="lager"?"Aus dem Lager statt Fremdmiete ("+pkNum(x.f)+")":pkNum(x.f)+" Fremdmiete – antippen zum Klären";
function pkZHead(P,z){if(!z)return"";const g=pkZProg(P,z.ps),fin=pkZFin(P,z),day=pkZDay(P,z),late=!fin&&day<pkDay(Date.now()),h=pkH(P)["zd_"+pkZK(z.ps)];
 return '<div class="pkzday'+(late?' late':'')+(fin?' fin':'')+'"><div class="pkzdl"><span>Zusatz herrichten: <b>'+pkWd(day)+'</b>'+(late?' <em>noch nicht hergerichtet</em>':'')+(h&&h.why?' <small>– '+esc(h.why)+'</small>':'')+'</span>'+(fin?'':'<button class="btn ghost s" type="button" data-pkzmv="'+esc(z.ps)+'">Verschieben</button>')+'</div>'+
  '<div class="pkzdp">'+(fin?'<b class="ok">Hergerichtet ✓</b> <small>von '+esc(nmA(fin,"by"))+', '+fmt(fin.t)+'</small>':pkBar(g))+(g.dev?' <span class="pkdev">'+g.dev+' mit Abweichung</span>':'')+'</div></div>'}
function pkZFoot(P,ps){const z=pkZOf(P,ps);if(!z)return"";const fin=pkZFin(P,z);
 return '<div class="pkzfoot">'+(fin?(z.v?'<button class="btn ghost s" type="button" data-pkzi="'+esc(ps)+'">Info an Projektleiter</button><button class="btn ghost s" type="button" data-pkzr="'+esc(ps)+'">Zusatz wieder öffnen</button>':''):'<button class="btn s" type="button" data-pkzf="'+esc(ps)+'">Zusatz abschließen</button>')+'</div>'}
function packOpenView(){const p=packs.find(x=>x.id===curPack);if(!p){view="pack";return packView()}
 const ae=document.activeElement;if(ae&&/INPUT|TEXTAREA/.test(ae.tagName)&&document.querySelector(".ov"))return;
 $("#t").textContent="Packliste";const s=pkState(p),R=pkRets(p),pr=pkProg(p),H=pr.H,K=pkKeys(p),fin=pr.fin;
 const pct=pr.n?Math.round(pr.d*100/pr.n):0;
 const IT=pkItems(p),rows0=pkSortIdx(p).map(i=>{const x=IT[i].x,h=H[K[i]],st=pkPS(x,h);return{x,i,h,st,z:IT[i].z,l55:pkL55(x,h)}}),rows=rows0.filter(r=>!r.l55&&(pkHf==="alle"||r.st.s!=="ok")),r55=pkHf==="alle"?rows0.filter(r=>r.l55):[];
 $("#app").innerHTML='<div class="card" style="cursor:default"><div class="row" style="align-items:center"><b style="flex:1;min-width:0;font-size:18px">'+esc(p.ev||"Ohne Veranstaltung")+'</b><span class="tag pk'+s.c+'" style="flex:0;white-space:nowrap">'+esc(s.l)+'</span></div>'+
  '<div class="mute">Auftrag '+esc(p.ord||"–")+(p.pl?' · '+esc(shortName(p.pl)):'')+'</div><div class="mute">Dispo '+pkD(p.db)+' – '+pkD(p.de)+'</div>'+
  '<div class="pkhday"><span>Herrichten: <b>'+pkWd(pkHDay(p))+'</b>'+(pkShifted(p)?' <span class="mute">(verschoben)</span>':'')+'</span>'+(fin?'':'<button class="btn ghost s" id="pkmv" type="button">Verschieben</button>')+'</div>'+pkHint(p)+
  '<details class="pkmore"><summary>Alle Angaben</summary><div class="pkkv"><span>Packschein</span><b>'+esc(p.ps||"–")+'</b>'+(p.sa?'<span>Selbstabholer</span><b>'+esc(p.sa)+'</b>':'')+(p.pk?'<span>Packen</span><b>'+pkD(p.pk)+'</b>':'')+(p.an?'<span>Anlieferung</span><b>'+pkD(p.an)+'</b>':'')+(p.eb?'<span>Event</span><b>'+pkD(p.eb)+' – '+pkD(p.ee)+'</b>':'')+'</div><div class="mute" style="font-size:13px;margin-top:6px">Hochgeladen '+fmt(p.t)+' von '+esc(nm(p.by))+'</div></details>'+
  (R.length&&can("ret_s")?R.map(r=>'<button class="btn ghost" data-pkr="'+esc(r.id)+'" style="margin-top:8px">Retourschein öffnen'+(r.closed?(r.art==="teil"?' (Teilretoure)':r.art==="end"?' (Endretoure)':' (abgeschlossen)'):' (offen)')+'</button>').join(""):'')+'</div>'+
  (typeof pkChgCard==="function"?pkChgCard(p):'')+(typeof abgPkCard==="function"?abgPkCard(p):'')+'<div class="card pkprog'+(fin?' fin':'')+'" style="cursor:default"><div class="row" style="align-items:baseline"><b style="flex:1;font-size:17px">'+(fin?'Hergerichtet':pr.d+' von '+pr.n+' Positionen')+'</b>'+(pr.dev?'<span class="pkdev">'+pr.dev+' mit Abweichung</span>':'')+'</div>'+
  '<div class="pkbar"><i style="width:'+pct+'%"></i></div>'+((p.zus||[]).filter(z=>z.v).length?'<div class="mute" style="margin-top:6px;font-size:13px">Ohne Zusatz-Packscheine – die haben unten ihren eigenen Tag und Stand.</div>':'')+(pr.l55?'<div class="mute" style="margin-top:6px;font-size:13px">+ '+pr.l55+(pr.l55===1?' Position':' Positionen')+' Lager 55 (holt Fahrer/Monteur)</div>':'')+(fin?'<div class="mute" style="margin-top:6px">von '+esc(nm(H.fin.by))+', '+fmt(H.fin.t)+(H.info&&H.info.t?' · Info an Projektleiter '+fmt(H.info.t):'')+'</div>':'')+'</div>'+
  chips([["alle","Alle"],["offen","Noch offen"]],pkHf,"data-pkhf")+
  '<div class="card pkl" style="cursor:default">'+(rows.length?rows.map(({x,i,h,st,z},ri)=>{const fm=pkFmTxt(x,h),gl=pkGrp(x),newZ=z&&(ri===0||rows[ri-1].z!==z),zd=newZ?(p.zus||[]).find(q=>String(q.ps)===z):null,
    zh=newZ?'<div class="pkzh"><span>Zusatz-Packschein '+esc(z)+(zd&&zd.t?' · hochgeladen '+fmt(zd.t).slice(0,6):'')+'</span>'+(can("pk_l")?'<button class="lnk" type="button" data-pkzx="'+esc(z)+'">Entfernen</button>':'')+'</div>'+pkZHead(p,zd):'',
    zf=z&&(ri===rows.length-1||rows[ri+1].z!==z)?pkZFoot(p,z):'',
    gh=newZ||ri===0||pkGrp(rows[ri-1].x)!==gl||rows[ri-1].z!==z?'<div class="pkg">'+esc(gl)+'</div>':'';
   return zh+gh+'<div class="pkp pk-'+st.s+'"><button class="pkc" type="button" data-pc="'+i+'" aria-label="Abhaken"'+(pkRowFin(p,i)?' disabled':'')+'>'+(st.s==="ok"?'✓':st.s==="part"?'!':'')+'</button>'+
   '<span class="pkn" data-pe="'+i+'">'+esc(pkNum(x.n))+(x.u?' '+esc(x.u):'')+'</span><span class="pkt" data-pe="'+i+'">'+esc(pkName(x))+(x.a?' <small>'+esc(x.a)+'</small>':'')+
   (fm?'<em class="'+(h&&h.fm?'pkfm':'pkfr')+'">'+esc(fm)+'</em>':'')+
   (st.s==="part"?'<em class="pkpart">'+pkNum(st.q)+' von '+pkNum(st.need)+' da – fehlen '+pkNum(st.need-st.q)+'</em>':'')+
   st.alt.map(a=>'<em class="pkalt">+ '+esc(pkNum(a.n))+'× '+esc(a.t)+(a.a?' ('+esc(a.a)+')':'')+'</em>').join("")+
   (h&&h.by&&st.s!=="open"?'<small class="pkby">'+esc(nm(h.by))+', '+fmt(h.t).slice(-5)+'</small>':'')+'</span></div>'+zf}).join(""):'<div class="mute" style="padding:10px 0">Alles hergerichtet.</div>')+
   (r55.length?'<div class="pkg pkg55">Lager 55</div>'+r55.map(({x,i})=>'<div class="pkp pk-l55"><span class="pkc pkc55" aria-hidden="true"></span><span class="pkn" data-pe="'+i+'">'+esc(pkNum(x.n))+(x.u?' '+esc(x.u):'')+'</span><span class="pkt" data-pe="'+i+'">'+esc(pkName(x))+(x.a?' <small>'+esc(x.a)+'</small>':'')+'<em class="pk55">holt Fahrer/Monteur'+(x.f>0?' · davon '+esc(pkNum(x.f))+' Fremdmiete':'')+'</em></span></div>').join(""):'')+'</div>'+
  (fin?'<button class="btn ghost" id="pkinfo" style="margin-top:12px">Info an Projektleiter</button><button class="btn ghost" id="pkreo" style="margin-top:8px">Wieder öffnen</button>':'<button class="btn" id="pkfin" style="margin-top:12px">Herrichten abschließen</button>')+
  (can("pk_l")?'<button class="btn ghost" id="pkdel" style="color:var(--bad);margin-top:12px">Packliste löschen</button>':'');
 document.querySelectorAll("[data-pkhf]").forEach(b=>b.onclick=()=>{pkHf=b.dataset.pkhf;packOpenView()});
 document.querySelectorAll("[data-pkr]").forEach(b=>b.onclick=()=>{curRet=b.dataset.pkr;go("retopen")});if(typeof abgPkBind==="function")abgPkBind();
 document.querySelectorAll("[data-pc]").forEach(b=>b.onclick=()=>pkTap(p,+b.dataset.pc));
 document.querySelectorAll("[data-pe]").forEach(b=>b.onclick=()=>{if(pkRowFin(p,+b.dataset.pe))return toast((pkItems(p)[+b.dataset.pe]||{}).z?"Der Zusatz ist abgeschlossen – zum Ändern erst „Zusatz wieder öffnen“.":"Herrichten ist abgeschlossen – zum Ändern erst „Wieder öffnen“.",1);pkEdit(p,+b.dataset.pe)});
 document.querySelectorAll("[data-pkzmv]").forEach(b=>b.onclick=()=>pkZMove(p,b.dataset.pkzmv));if(typeof pkChgBind==="function")pkChgBind(p);
 document.querySelectorAll("[data-pkzf]").forEach(b=>b.onclick=()=>pkZFinish(p,b.dataset.pkzf));
 document.querySelectorAll("[data-pkzr]").forEach(b=>b.onclick=()=>pkZReopen(p,b.dataset.pkzr));
 document.querySelectorAll("[data-pkzi]").forEach(b=>b.onclick=()=>pkMail(p,b.dataset.pkzi));
 if($("#pkfin"))$("#pkfin").onclick=()=>pkFinish(p);
 if($("#pkmv"))$("#pkmv").onclick=()=>pkMove(p);
 document.querySelectorAll("[data-pkzx]").forEach(b=>b.onclick=()=>ask("Zusatz-Packschein "+b.dataset.pkzx+" wirklich entfernen?",async()=>{try{const rest=(p.zus||[]).filter(z=>String(z.ps)!==b.dataset.pkzx);await db.doc("pack/"+p.id).update({zus:rest});if(!rest.length&&(packh[p.id]||{}).reo)await pkHSet(p,{reo:null});toast("Zusatz entfernt",1)}catch(e){errBox("Entfernen fehlgeschlagen. Hast du das Recht dazu?")}}));
 if($("#pkreo"))$("#pkreo").onclick=()=>ask("Herrichten wieder öffnen?",()=>pkHSet(p,{fin:null}));
 if($("#pkinfo"))$("#pkinfo").onclick=()=>pkMail(p);
 if($("#pkdel"))$("#pkdel").onclick=()=>ask("Packliste „"+(p.ev||p.ord)+"“ wirklich löschen?",async()=>{try{await db.doc("pack/"+p.id).delete();if(packh[p.id])await db.doc("packh/"+p.id).delete().catch(()=>{});view="pack";hist=hist.filter(v=>v!=="packopen");draw();toast("Packliste gelöscht",1)}catch(e){errBox("Löschen fehlgeschlagen.")}})}
/* Zusatz: Herricht-Tag fragen (beim Hochladen) bzw. ändern. Gibt "JJJJ-MM-TT" (bzw. {d,why} beim Verschieben) zurück oder null */
function pkZAskDay(P,main,cur,why0){return new Promise(res=>{const o=document.createElement("div");o.className="ov";const t0=Date.now(),mv=!!cur;
 o.innerHTML='<div class="card" style="width:100%;max-width:400px;margin:0"><b>'+(mv?'Zusatz verschieben':'Wann wird der Zusatz hergerichtet?')+'</b><p class="mute" style="margin:4px 0 10px">Zusatz-Packschein '+esc(P.ps||"–")+' zu '+esc((main&&main.ev)||P.ev||"")+(mv?'':'<br>epirent gibt immer den Dispo-Beginn vom ersten Packschein mit – darum hier den echten Tag wählen.')+'</p>'+
  '<div class="row pkzq"><button class="btn ghost s" type="button" data-zq="0">Heute</button><button class="btn ghost s" type="button" data-zq="1">Morgen</button><button class="btn ghost s" type="button" data-zq="2">Übermorgen</button></div>'+
  '<label class="mute" for="pzd">Tag</label><input id="pzd" type="date">'+(mv?'<label class="mute" for="pzw">Grund (optional)</label><input id="pzw" maxlength="80" placeholder="z. B. Material kommt erst">':'')+
  '<div class="row" style="margin-top:10px"><button class="btn ghost" id="pzx" type="button">Abbrechen</button><button class="btn" id="pzo" type="button">'+(mv?'Speichern':'Zusatz anhängen')+'</button></div></div>';
 document.body.appendChild(o);const di=o.querySelector("#pzd");di.value=cur||pkYmd(t0);if(o.querySelector("#pzw"))o.querySelector("#pzw").value=why0||"";
 const mark=()=>o.querySelectorAll("[data-zq]").forEach(b=>b.classList.toggle("act",di.value===pkYmd(pkAddD(pkDay(t0),+b.dataset.zq))));mark();di.oninput=mark;
 o.querySelectorAll("[data-zq]").forEach(b=>b.onclick=()=>{di.value=pkYmd(pkAddD(pkDay(t0),+b.dataset.zq));mark()});
 o.querySelector("#pzx").onclick=()=>{o.remove();res(null)};
 o.querySelector("#pzo").onclick=()=>{if(!pkFromYmd(di.value)){di.classList.add("bad");return}const w=o.querySelector("#pzw");o.remove();res(mv?{d:di.value,why:w?w.value.trim():""}:di.value)}})}
async function pkZMove(P,ps){const z=pkZOf(P,ps);if(!z)return;const h=pkH(P)["zd_"+pkZK(ps)]||{};const r=await pkZAskDay({ps,ev:P.ev},P,pkYmd(pkZDay(P,z)),h.why);if(!r)return;
 await pkHSet(P,{["zd_"+pkZK(ps)]:{d:r.d,why:r.why||"",by:me,t:Date.now()}});toast("Zusatz verschoben auf "+pkWd(pkFromYmd(r.d)),1)}
function pkZFinish(P,ps){const g=pkZProg(P,ps),open=g.n-g.d,k="zf_"+pkZK(ps);
 const go2=()=>pkHSet(P,{[k]:{by:me,t:Date.now()}}).then(()=>{toast("Zusatz hergerichtet",1);const pp=pkZProg(P,ps);if(pp.dev||pp.n-pp.d>0)ask("Es gibt Abweichungen. Soll "+(shortName(P.pl)||"der Projektleiter")+" eine Info bekommen?",()=>pkMail(P,ps))});
 if(open>0)ask("Noch "+open+(open===1?" Position ist":" Positionen sind")+" vom Zusatz nicht hergerichtet. Trotzdem abschließen?",go2);else go2()}
const pkZReopen=(P,ps)=>ask("Zusatz "+ps+" wieder öffnen?",()=>pkHSet(P,{["zf_"+pkZK(ps)]:{t:0,by:me,ro:Date.now()}}));
/* Herrichten auf einen anderen Tag verschieben */
function pkMove(P){const h=pkHd(P),o=document.createElement("div");o.className="ov";const dbd=P.db?pkYmd(P.db):"",t0=Date.now();
 o.innerHTML='<div class="card" style="width:100%;max-width:400px;margin:0"><b>Herrichten verschieben</b><p class="mute" style="margin:4px 0 10px">'+esc(P.ev||"")+' · Dispo-Beginn '+pkWd(P.db)+'</p>'+
  '<label class="mute" for="pmvd">Neuer Tag</label><input id="pmvd" type="date">'+
  '<div class="row" style="gap:8px;margin:6px 0 10px"><button class="btn ghost s" type="button" data-mvd="0">Heute</button><button class="btn ghost s" type="button" data-mvd="1">Morgen</button><button class="btn ghost s" type="button" data-mvd="2">Übermorgen</button></div>'+
  '<label class="mute" for="pmvw">Grund (optional)</label><input id="pmvw" maxlength="80" placeholder="z. B. Material kommt erst Montag">'+
  '<div class="row" style="margin-top:12px"><button class="btn ghost" id="pmvx" type="button">Abbrechen</button><button class="btn" id="pmvs" type="button">Speichern</button></div>'+
  (h?'<button class="lnk" id="pmvr" type="button" style="margin-top:6px">Zurück auf Dispo-Beginn ('+pkWd(P.db)+')</button>':'')+'</div>';
 document.body.appendChild(o);const g=id=>o.querySelector("#"+id);g("pmvd").value=pkYmd(pkHDay(P)||t0);g("pmvw").value=h&&h.why||"";
 o.querySelectorAll("[data-mvd]").forEach(b=>b.onclick=()=>{g("pmvd").value=pkYmd(t0+(+b.dataset.mvd)*864e5+3*36e5)});
 g("pmvx").onclick=()=>o.remove();
 if(g("pmvr"))g("pmvr").onclick=()=>{o.remove();pkHSet(P,{hd:null}).then(()=>toast("Herrichten wieder am Dispo-Beginn",1))};
 g("pmvs").onclick=()=>{const d=g("pmvd").value;if(!pkFromYmd(d))return toast("Bitte einen Tag wählen.");o.remove();
  if(d===dbd)return pkHSet(P,{hd:null}).then(()=>toast("Herrichten am Dispo-Beginn",1));
  pkHSet(P,{hd:{d,why:g("pmvw").value.trim(),by:me,t:Date.now()}}).then(()=>toast("Herrichten verschoben auf "+pkWd(pkFromYmd(d)),1))}}
/* Kreis antippen: offen -> komplett; komplett (ohne Alternative) -> wieder offen; sonst Bearbeiten. Fremdmiete ungeklärt -> zuerst fragen */
function pkTap(P,i){const x=pkPosAll(P)[i],k=pkKeys(P)[i],h=pkH(P)[k],st=pkPS(x,h);if(pkRowFin(P,i))return;
 if(pkL55(x,h))return pkEdit(P,i);
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
function pkEdit(P,i){const x=pkPosAll(P)[i],k=pkKeys(P)[i],h=pkH(P)[k]||{};let fm=h.fm||"",alt=(h.alt||[]).map(a=>({...a})),pick=null;
 if(pkL55(x,h)){const o=document.createElement("div");o.className="ov";
  o.innerHTML='<div class="card" style="width:100%;max-width:420px;margin:0"><b style="font-size:17px">'+esc(pkName(x))+'</b>'+(x.a?' <span class="mute">'+esc(x.a)+'</span>':'')+'<p class="mute" style="margin:4px 0 12px">Laut Packliste: '+pkNum(x.n)+(x.u?' '+esc(x.u):'')+'. Steht auf <b>Lager 55</b> – holt der Fahrer oder Monteur selbst.</p>'+
   '<button class="btn" id="p55s" type="button">Packe ich doch selbst</button><button class="btn ghost" id="p55x" type="button" style="margin-top:8px">Schließen</button></div>';
  document.body.appendChild(o);o.querySelector("#p55x").onclick=()=>o.remove();
  o.querySelector("#p55s").onclick=()=>{o.remove();if(pkRowFin(P,i))return toast("Herrichten ist abgeschlossen – zum Ändern erst „Wieder öffnen“.",1);pkHSet(P,{[k]:{...(h||{}),l55:false,by:me,t:Date.now()}})};return}
 const o=document.createElement("div");o.className="ov";
 const need=()=>pkNeed(x,{fm});
 o.innerHTML='<div class="card" style="width:100%;max-width:440px;margin:0;max-height:92vh;overflow:auto"><b style="font-size:17px">'+esc(pkName(x))+'</b>'+(x.a?' <span class="mute">'+esc(x.a)+'</span>':'')+(pkName(x)!==x.t?'<div class="mute" style="font-size:13px">Im Packschein: '+esc(x.t)+'</div>':'')+
  '<p class="mute" style="margin:4px 0 10px">Laut Packliste: '+pkNum(x.n)+(x.u?' '+esc(x.u):'')+(x.f>0?', davon <span class="pkfr">'+pkNum(x.f)+' Fremdmiete</span>':'')+'</p>'+
  (pkKat(x)?'':'<div class="pknokat"><span>Nicht in der Artikelliste</span>'+(can("v_app")?'<button class="btn s" id="pekat" type="button">Zur Artikelliste hinzufügen</button>':'<button class="btn ghost s" id="pekat" type="button">Fehlt in der Artikelliste – melden</button>')+'</div>')+
  (x.f>0?'<label class="mute">Fremdmiete</label><div class="row seg" style="margin:4px 0 10px"><button type="button" id="pefl">Aus dem Lager</button><button type="button" id="pefm">Wird zugemietet</button></div>':'')+
  '<label class="mute" for="peq">Vorhanden <span id="pen"></span></label><div class="row" style="align-items:center;gap:8px"><button class="btn ghost" id="pem" type="button" style="flex:0 0 52px">−</button><input id="peq" type="number" inputmode="numeric" min="0" style="text-align:center;font-size:20px;margin:0"><button class="btn ghost" id="pep" type="button" style="flex:0 0 52px">+</button></div>'+
  '<button class="btn ghost s" id="pea" type="button" style="margin-top:6px">Alles da</button>'+
  '<h4 style="margin:14px 0 4px">Alternative</h4><div id="pel"></div>'+
  '<div class="row" style="gap:8px;align-items:flex-start"><input id="pean" type="number" inputmode="numeric" min="1" placeholder="Anz." style="flex:0 0 72px;margin:0"><div style="flex:1;min-width:0;position:relative"><input id="peat" placeholder="Artikel suchen oder eintippen" autocomplete="off" style="margin:0"><div id="peres" class="peres"></div></div></div>'+
  '<button class="btn ghost" id="peadd" type="button" style="margin-top:6px">+ Alternative hinzufügen</button>'+
  '<div class="row" style="margin-top:14px"><button class="btn ghost" id="pex" type="button">Abbrechen</button><button class="btn" id="pes" type="button">Speichern</button></div>'+
  '<button class="btn ghost" id="pe55" type="button" style="margin-top:10px">Holt Fahrer/Monteur – Lager 55</button>'+
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
 if(g("pekat"))g("pekat").onclick=()=>pkKatAdd(P,x,o);
 g("per").onclick=()=>{o.remove();pkHSet(P,{[k]:null})};
 g("pe55").onclick=()=>{o.remove();pkHSet(P,{[k]:{l55:true,by:me,t:Date.now()}})};
 g("pes").onclick=()=>{const pend=g("pean").value&&g("peat").value.trim();if(pend)g("peadd").click();const q=qv();if(x.f>0&&!fm&&(q!==null||alt.length))return toast("Bitte zuerst klären: aus dem Lager oder zugemietet.");
  o.remove();if(q===null&&!alt.length)return pkHSet(P,{[k]:fm?{fm,by:me,t:Date.now()}:null});
  pkHSet(P,{[k]:{ok:q!==null&&q>=need()&&!alt.length,q,alt,fm,by:me,t:Date.now()}})}}
/* Artikel aus dem Packschein in die Artikelliste übernehmen (ab 1.79, nur mit App-Verwaltung) bzw. als fehlend melden */
function pkKatAdd(P,x,dlg){const nr=String(x.a||"").trim(),nm=String(x.t||"").trim();
 if(!can("v_app"))return pkKatMeld(P,x).then(()=>toast("Gemeldet – steht jetzt unter „Fehlende Artikel“ in der App-Verwaltung.",1));
 if(dlg)dlg.remove();
 alEdit(null,{nr,name:nm,g:alGuessG(nm),hint:nr?"Aus dem Packschein von "+(P.ev||P.ord||"")+". Name und Nummer kannst du ändern.":"Im Packschein steht keine Artikelnummer. Ohne Nummer bleibt diese Position auf den Packlisten unter „Nicht in der Artikelliste“.",
  done:doc=>{const id="m"+((rNorm(nr)||rNorm(nm)).slice(0,80));db.doc("fehlartikel/"+id).delete().catch(()=>{});if(nr&&artCode(doc.nr)!==artCode(nr))toast("Achtung: andere Nummer als im Packschein – diese Position wird nicht zugeordnet.");if(view==="packopen")packOpenView()}})}
async function pkKatMeld(P,x){const nr=String(x.a||"").trim(),nm=String(x.t||"").trim();try{const id="m"+((rNorm(nr)||rNorm(nm)).slice(0,80)||Date.now().toString(36)),ref=db.doc("fehlartikel/"+id),old=await ref.get(),o=old.exists?old.data():{};
 await ref.set({name:o.name||nm,nr:nr||o.nr||"",times:(o.times||0)+1,qty:(o.qty||0)+(+x.n||0),first:o.first||Date.now(),last:Date.now(),ev:P.ev||"",ord:P.ord||"",by:me,src:"Packliste"})}catch(e){errBox("Melden hat nicht geklappt. Bitte nochmal versuchen.")}}
/* Abschließen + Info an Projektleiter */
function pkFinish(P){const pr=pkProg(P),open=pr.n-pr.d;
 const go2=()=>pkHSet(P,{fin:{by:me,t:Date.now()},reo:null}).then(()=>{toast("Herrichten abgeschlossen",1);const pp=pkProg(P);if(pp.dev||pp.n-pp.d>0)ask("Es gibt Abweichungen. Soll "+(shortName(P.pl)||"der Projektleiter")+" eine Info bekommen?",()=>pkMail(P))});
 if(open>0)ask("Noch "+open+(open===1?" Position ist":" Positionen sind")+" nicht hergerichtet. Trotzdem abschließen?",go2);else go2()}
function pkMailText(P,zps){const H=pkH(P),K=pkKeys(P),IT=pkItems(P),L=[],inc=o=>zps?o.z===String(zps):!o.z||!(pkZOf(P,o.z)||{}).v;
 pkPosAll(P).forEach((x,i)=>{if(!inc(IT[i]))return;const h=H[K[i]];if(pkL55(x,h))return;const st=pkPS(x,h),nm2=x.t+(x.a?" ("+x.a+")":"")+(IT[i].z?" [Zusatz "+IT[i].z+"]":""),u=x.u?" "+x.u:"";
  if(st.s==="open")L.push("- "+nm2+": nicht hergerichtet (laut Packliste "+pkNum(st.need)+u+")");
  else if(st.s==="part")L.push("- "+nm2+": "+pkNum(st.q)+" von "+pkNum(st.need)+u+" – fehlen "+pkNum(st.need-st.q));
  if(st.alt.length)st.alt.forEach(a=>L.push((st.s==="part"||st.s==="open"?"  ":"- "+nm2+":\n  ")+"Alternative: "+pkNum(a.n)+"× "+a.t+(a.a?" ("+a.a+")":"")));
  if(h&&h.fm==="lager"&&x.f>0)L.push("- "+nm2+": aus dem Lager statt Fremdmiete ("+pkNum(x.f)+u+")")});
 const vn=String(P.pl||"").split(" ")[0],me1=String(meName()||""),F=zps?pkZFin(P,pkZOf(P,zps)||{})||{}:H.fin||{};
 return{subj:(zps?"Zusatz-Packschein "+zps:"Packliste "+(P.ord||""))+" – "+(P.ev||"")+": Abweichungen beim Herrichten",
  body:"Hallo"+(vn?" "+vn:"")+",\n\nbeim Herrichten von "+(zps?"Zusatz-Packschein "+zps+" zu ":"")+(P.ev||"")+" (Auftrag "+(P.ord||"–")+", Packschein "+(zps||P.ps||"–")+") gab es folgende Abweichungen:\n\n"+(L.length?L.join("\n"):"- keine")+"\n\nHergerichtet von "+(F.by?nm(F.by):me1)+(F.t?", "+fmt(F.t):"")+".\n\nLG\n"+me1}}
function pkMail(P,zps){const m=pkMailText(P,zps),o=document.createElement("div");o.className="ov";
 o.innerHTML='<div class="card" style="width:100%;max-width:460px;margin:0;max-height:92vh;overflow:auto"><b>Info an '+esc(shortName(P.pl)||"Projektleiter")+'</b><p class="mute" style="margin:4px 0 8px">Betreff: '+esc(m.subj)+'</p><textarea id="kpmt" style="min-height:220px"></textarea>'+
  '<div class="row" style="margin-top:8px"><a class="btn" id="kpmm" href="#">Mail öffnen</a><button class="btn ghost" id="kpms" type="button" hidden>Teilen</button></div><div class="row" style="margin-top:8px"><button class="btn ghost" id="kpmc" type="button">Text kopieren</button><button class="btn ghost" id="kpmx" type="button">Schließen</button></div></div>';
 document.body.appendChild(o);const g=id=>o.querySelector("#"+id),ta=g("kpmt");ta.value=m.body;
 const mark=()=>pkHSet(P,{[zps?"zi_"+pkZK(zps):"info"]:{by:me,t:Date.now()}});
 const upd=()=>{g("kpmm").href="mailto:?subject="+encodeURIComponent(m.subj)+"&body="+encodeURIComponent(ta.value)};upd();ta.oninput=upd;
 g("kpmm").onclick=()=>{mark();setTimeout(()=>o.remove(),300)};
 if(navigator.share){g("kpms").hidden=false;g("kpms").onclick=()=>navigator.share({title:m.subj,text:ta.value}).then(()=>{mark();o.remove()}).catch(()=>{})}
 g("kpmc").onclick=async()=>{try{await navigator.clipboard.writeText(m.subj+"\n\n"+ta.value);toast("Text kopiert",1);mark()}catch(e){ta.select();toast("Bitte Text markieren und kopieren.")}};
 g("kpmx").onclick=()=>o.remove()}
/* Für Jarvis */
function pkZToday(){const t0=pkDay(Date.now());return pkZTasks().filter(z=>pkHDay(z)===t0)}
function pkJarvis(){if(!can("pk_s"))return null;const G=pkGroups(),Z=pkZToday();return{herr:G.herr.filter(p=>!pkProg(p).fin).concat(Z.filter(z=>!pkProg(z).fin)),herrDone:G.herr.filter(p=>pkProg(p).fin).concat(Z.filter(z=>pkProg(z).fin)),back:G.back,over:G.over}}
function pkSub(){const G=pkGroups(),a=[];if(G.over.length)a.push(G.over.length+" überfällig");const hh=G.herr.filter(p=>!pkProg(p).fin).length+pkZToday().filter(z=>!pkProg(z).fin).length;if(hh)a.push(hh+" heute herrichten");if(G.back.length)a.push(G.back.length+" heute zurück");return a.length?a.join(", "):"PDF hochladen und ansehen"}
function pkHot(){const n=pkGroups().over.length;return n?String(n):""}
/* ===== Übersicht (ab 1.65) – wie die Wand im Lager: Diese Woche / Nächste Woche / Später, je 5 Fächer Mo–Fr.
   Jede Packliste liegt im Fach ihres Herricht-Tags (Dispo-Beginn oder verschoben); Samstag/Sonntag -> Freitag davor.
   Schmal (Handy): Umschalter + Fächer (Vorschlag A). Breit ab 900 px (Tablet quer, PC): zweispaltige Tagesliste (Vorschlag C).
   Vergangene Herricht-Tage, nicht abgeschlossen -> oben "Nicht hergerichtet" (0 abgehakt) bzw. "Teilweise hergerichtet". */
let pkTab="w0",pkOpenDays=new Set(),pkWideLast=null;
const PK_WD=["So","Mo","Di","Mi","Do","Fr","Sa"];
const pkMon=t=>{const d=new Date(t);d.setHours(0,0,0,0);const w=(d.getDay()+6)%7;return d.getTime()-w*864e5};
const pkAddD=(t,n)=>{const d=new Date(t);d.setDate(d.getDate()+n);return d.getTime()};
function pkKW(t){const d=new Date(t);d.setHours(0,0,0,0);d.setDate(d.getDate()+3-(d.getDay()+6)%7);const w1=new Date(d.getFullYear(),0,4);return 1+Math.round(((d-w1)/864e5-3+(w1.getDay()+6)%7)/7)}
const pkDM=t=>{const d=new Date(t);return d.getDate()+"."+(d.getMonth()+1)+"."};
/* Fach-Tag: Herricht-Tag, Wochenende auf Freitag davor */
function pkSlot(p){const h=pkHDay(p);if(!h)return{t:0,we:""};const w=new Date(h).getDay();return w===6?{t:pkAddD(h,-1),we:"Sa"}:w===0?{t:pkAddD(h,-2),we:"So"}:{t:h,we:""}}
function pkOvData(){const t0=pkDay(Date.now()),m0=pkMon(t0),m1=pkAddD(m0,7),m2=pkAddD(m0,14);
 const L=packs.filter(p=>p.db||pkHd(p)).filter(p=>pkState(p).k!=="done").concat(pkZTasks()).map(p=>({p,s:pkSlot(p),g:pkProg(p)}));
 const late=L.filter(o=>pkHDay(o.p)<t0&&!o.g.fin).sort((a,b)=>pkHDay(a.p)-pkHDay(b.p));
 const day=(m,i)=>{const t=pkAddD(m,i);return{t,items:L.filter(o=>o.s.t===t).sort((a,b)=>(a.g.fin?1:0)-(b.g.fin?1:0)||(a.p.db||0)-(b.p.db||0))}};
 const w0=[0,1,2,3,4].map(i=>day(m0,i)),w1=[0,1,2,3,4].map(i=>day(m1,i));
 const later=L.filter(o=>o.s.t>=m2).sort((a,b)=>a.s.t-b.s.t);
 const kw=[0,1,2,3].map(k=>{const a=pkAddD(m2,7*k),b=pkAddD(a,7);return{lab:"KW "+pkKW(a)+" · "+pkDM(a)+"–"+pkDM(pkAddD(a,4)),items:later.filter(o=>o.s.t>=a&&o.s.t<b)}});
 const after=pkAddD(m2,28);kw.push({lab:"Danach",items:later.filter(o=>o.s.t>=after)});
 return{t0,m0,m1,m2,late,w0,w1,kw}}
const pkOpenN=a=>a.filter(o=>!o.g.fin).length;
function pkBadges(o,withShift){const p=o.p,f=pkF(p).length,b=[];
 if(f&&!o.g.fin)b.push('<span class="pkb fr">'+f+' Fremd</span>');
 if(p._z)b.push('<span class="pkb zu">Zusatz</span>');
 if(o.s.we)b.push('<span class="pkb we">'+(o.s.we==="Sa"?"Samstag":"Sonntag")+'</span>');
 if(withShift&&pkShifted(p))b.push('<span class="pkb sh">↻ '+(pkHDay(p)<pkDay(p.db)?'vorgezogen':'verschoben')+' (Dispo '+pkWd(p.db)+')</span>');
 return b.length?'<div class="pkbs">'+b.join("")+'</div>':''}
const pkTime=p=>!p._z&&p.db&&pkHDay(p)===pkDay(p.db)&&(new Date(p.db).getHours()||new Date(p.db).getMinutes())?new Date(p.db).toLocaleTimeString("de-AT",{hour:"2-digit",minute:"2-digit"}):"";
function pkBar(g){return '<div class="pkmb"><div class="pkbar"><i style="width:'+(g.n?Math.round(g.d*100/g.n):0)+'%"></i></div><b>'+g.d+'/'+g.n+'</b></div>'}
/* Karte (Handy) */
function pkCard(o){const p=o.p,g=o.g;
 if(g.fin)return '<button class="pkcard fin" type="button" data-pk="'+esc(p.id)+'"><b>'+esc(p.ev||p.ord)+'</b><span class="pkok">Hergerichtet ✓</span></button>';
 return '<button class="pkcard" type="button" data-pk="'+esc(p.id)+'"><span class="pkct"><b>'+esc(p.ev||"Ohne Veranstaltung")+'</b>'+(pkTime(p)?'<small>'+pkTime(p)+'</small>':'')+'</span><span class="pkcs">Auftrag '+esc(p.ord||"–")+(p.pl?' · '+esc(shortName(p.pl)):'')+'</span>'+pkBar(g)+pkBadges(o,true)+'</button>'}
/* Zeile (breit) */
function pkLine(o,lab){const p=o.p,g=o.g;
 return '<button class="pkline'+(g.fin?' fin':'')+'" type="button" data-pk="'+esc(p.id)+'"><span class="pkl1">'+esc(lab||pkTime(p)||"")+'</span><span class="pkl2"><b>'+esc(p.ev||"Ohne Veranstaltung")+'</b><small>Auftrag '+esc(p.ord||"–")+(p.pl?' · '+esc(shortName(p.pl)):'')+'</small>'+(g.fin?'':pkBadges(o,true))+'</span><span class="pkl3">'+(g.fin?'<span class="pkok">✓</span>':g.n?g.d+'/'+g.n:'')+'</span></button>'}
function pkLateHtml(D,wide){if(!D.late.length)return"";
 return '<section class="pklate"><h3>Nicht hergerichtet <span>'+D.late.length+'</span></h3>'+D.late.map(o=>{const part=o.g.d>0;
  return '<button class="pklc" type="button" data-pk="'+esc(o.p.id)+'"><span class="pkct"><b>'+esc(o.p.ev||o.p.ord)+'</b><small class="'+(part?'part':'warn')+'">'+(part?'Teilweise hergerichtet':'Nicht hergerichtet')+'</small></span><span class="pkcs">seit '+pkWd(pkHDay(o.p))+' · Auftrag '+esc(o.p.ord||"–")+'</span>'+(part?pkBar(o.g):'')+'</button>'}).join("")+'</section>'}
function pkDayLabel(t,t0){return PK_WD[new Date(t).getDay()]+" "+pkDM(t)+(t===t0?" · Heute":"")}
/* vergangener Tag: zusammengeklappt, antippen klappt auf */
function pkPastSum(d){const n=d.items.length,f=d.items.filter(o=>o.g.fin).length,o2=n-f;
 return n?(f?'<span class="ok">'+f+' hergerichtet ✓</span>':'')+(f&&o2?' · ':'')+(o2?'<b class="warn">'+o2+' nicht fertig</b>':''):'<span class="mute">leer</span>'}
function packOverView(){$("#t").textContent="Übersicht";const D=pkOvData(),wide=window.innerWidth>=900;pkWideLast=wide;document.body.classList.toggle("pkovw",wide);
 const top='<div class="pkovtop">'+pkUpHtml()+'<button class="btn ghost" id="pkall" type="button">Alle Packlisten</button></div>';
 if(!wide){
  const tabs=[["w0","Diese Woche",pkDM(D.m0)+"–"+pkDM(pkAddD(D.m0,4)),D.w0.reduce((n,d)=>n+pkOpenN(d.items),0)],["w1","Nächste Woche",pkDM(D.m1)+"–"+pkDM(pkAddD(D.m1,4)),D.w1.reduce((n,d)=>n+pkOpenN(d.items),0)],["sp","Später","ab "+pkDM(D.m2),D.kw.reduce((n,k)=>n+pkOpenN(k.items),0)]];
  const tabH='<div class="pktabs" role="tablist">'+tabs.map(([k,a,b,n])=>'<button type="button" role="tab" aria-selected="'+(pkTab===k)+'" class="'+(pkTab===k?'on':'')+'" data-pkt="'+k+'">'+a+'<small>'+b+(n?' · '+n:'')+'</small></button>').join("")+'</div>';
  let body="";
  if(pkTab==="sp")body=D.kw.map(k=>'<section class="pktray"><div class="pktl"><span>'+esc(k.lab)+'</span><small>'+(k.items.length||'')+'</small></div>'+(k.items.length?k.items.map(o=>pkCard(o).replace('<span class="pkct"><b>','<span class="pkct"><span class="pkdt">'+pkDayLabel(o.s.t,0)+'</span><b>')).join(""):'<div class="pkempty">leer</div>')+'</section>').join("");
  else body=(pkTab==="w0"?D.w0:D.w1).map(d=>{const past=d.t<D.t0,today=d.t===D.t0,open=pkOpenDays.has(d.t);
   if(past&&!open)return '<button class="pktray past" type="button" data-pkd="'+d.t+'"><span class="pktl"><span>'+pkDayLabel(d.t,D.t0)+'</span></span><span class="pksum">'+pkPastSum(d)+'</span></button>';
   return '<section class="pktray'+(today?' today':'')+(past?' past open':'')+'"'+(past?' data-pkd="'+d.t+'"':'')+'><div class="pktl"><span>'+pkDayLabel(d.t,D.t0)+'</span><small>'+(d.items.length?d.items.length+(d.items.length===1?' Packliste':' Packlisten'):'')+'</small></div>'+(d.items.length?d.items.map(pkCard).join(""):'<div class="pkempty">leer</div>')+'</section>'}).join("");
  $("#app").innerHTML=top+tabH+(pkTab==="w0"?pkLateHtml(D,false):'')+'<div class="pktrays">'+body+'</div>';
 }else{
  const week=(lab,sub,days,isNow)=>'<div class="pkwh"><span>'+lab+'</span><small>'+sub+'</small></div>'+days.map(d=>{const past=d.t<D.t0,open=pkOpenDays.has(d.t);
   if(past&&!open)return '<button class="pkdrow past" type="button" data-pkd="'+d.t+'"><span class="pkl1">'+pkDayLabel(d.t,D.t0)+'</span><span class="pksum">'+pkPastSum(d)+'</span></button>';
   return '<div class="pkdh'+(d.t===D.t0?' today':'')+'"'+(past?' data-pkd="'+d.t+'"':'')+'>'+pkDayLabel(d.t,D.t0)+(d.items.length?'':' <small>leer</small>')+'</div>'+d.items.map(o=>pkLine(o)).join("")}).join("");
  const left=pkLateHtml(D,true)+week("Diese Woche","KW "+pkKW(D.m0)+" · "+pkDM(D.m0)+"–"+pkDM(pkAddD(D.m0,4)),D.w0);
  const right=week("Nächste Woche","KW "+pkKW(D.m1)+" · "+pkDM(D.m1)+"–"+pkDM(pkAddD(D.m1,4)),D.w1)+'<div class="pkwh later"><span>Später</span><small>nach Kalenderwoche</small></div>'+D.kw.map(k=>'<div class="pkdh">'+esc(k.lab)+(k.items.length?'':' <small>leer</small>')+'</div>'+k.items.map(o=>pkLine(o,pkDayLabel(o.s.t,0))).join("")).join("");
  $("#app").innerHTML=top+'<div class="pkwide"><div>'+left+'</div><div>'+right+'</div></div>'}
 document.querySelectorAll("[data-pkt]").forEach(b=>b.onclick=()=>{pkTab=b.dataset.pkt;packOverView()});
 document.querySelectorAll("[data-pkd]").forEach(b=>b.onclick=e=>{if(e.target.closest("[data-pk]"))return;const t=+b.dataset.pkd;pkOpenDays.has(t)?pkOpenDays.delete(t):pkOpenDays.add(t);packOverView()});
 document.querySelectorAll("[data-pk]").forEach(e=>e.onclick=ev=>{ev.stopPropagation();curPack=e.dataset.pk;go("packopen")});
 $("#pkall").onclick=()=>go("packall");pkUpBind()}
window.addEventListener("resize",()=>{if(typeof view!=="undefined"&&view==="pack"&&pkWideLast!==null&&(window.innerWidth>=900)!==pkWideLast)packOverView()});
