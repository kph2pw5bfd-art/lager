/* ===== Packlisten (ab 1.57) =====
   PDF (epirent-Packliste) in der App hochladen -> im Gerät mit pdf.js lesen (pkparse.js) -> nur das Ausgelesene speichern (docs 'pack', id = Packscheinnummer).
   Kein PDF, keine Kundendaten. Kein automatisches Abrufen aus dem Postfach.
   Rechte: pk_s Sehen, pk_b Hochladen, pk_l Löschen (packliste.sql).
   Status: Herrichten heute = Dispo-Beginn heute · Heute zurück = Dispo-Ende heute · Dispo abgelaufen (intern „over“) = Dispo-Ende vor heute und kein abgeschlossener
   Retourschein mit derselben Auftragsnummer (Ziffern verglichen, 2601114-01 = 260111401). Materialgenauer Abgleich kommt später. */
let packs=[],curPack=null,pkf="aktuell";
const PK_ICON='<svg viewBox="0 0 24 24" width="28" height="28" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M21 8l-9-5-9 5 9 5 9-5z"/><path d="M3 8v8l9 5 9-5V8"/><path d="M12 13v8"/></svg>';
const PDFJS_SRC=["https://cdn.jsdelivr.net/npm/pdfjs-dist@4.10.38/legacy/build/","https://unpkg.com/pdfjs-dist@4.10.38/legacy/build/"];
let pdfLib=null;
async function pkLib(){if(pdfLib)return pdfLib;let err=null;for(const b of (window.__PDFJS_SRC||PDFJS_SRC)){try{const m=await import(b+"pdf.min.mjs");m.GlobalWorkerOptions.workerSrc=b+"pdf.worker.min.mjs";pdfLib=m;return m}catch(e){err=e}}throw err||new Error("PDF-Leser nicht gefunden")}
/* 1.166: Datei vor dem Lesen prüfen – leer, abgeschnitten, als Text (Base64) oder mit Vorspann. Klare Meldung statt „Invalid PDF structure“. */
function pkBytes(buf){const n=buf.length;if(!n){const e=new Error("leer");e.pkFile=1;throw e}
 const head=new TextDecoder("latin1").decode(buf.subarray(0,Math.min(n,4096)));
 const b64=head.replace(/^\s+/,"");if(/^JVBER/.test(b64)){try{const t=new TextDecoder("latin1").decode(buf).replace(/[^A-Za-z0-9+/=]/g,""),bin=atob(t),o=new Uint8Array(bin.length);for(let i=0;i<bin.length;i++)o[i]=bin.charCodeAt(i);return o}catch(x){}}
 let i=head.indexOf("%PDF-");if(i<0){const all=new TextDecoder("latin1").decode(buf.subarray(0,Math.min(n,1<<20)));i=all.indexOf("%PDF-")}
 if(i<0){const e=new Error(/^\s*</.test(head)?"html":"kein");e.pkFile=1;throw e}
 return i?buf.subarray(i):buf}
async function pkRead(file){const buf=pkBytes(new Uint8Array(await file.arrayBuffer()));const lib=await pkLib();let doc;try{doc=await lib.getDocument({data:buf}).promise}catch(x){if(/Invalid PDF|PDF header|Missing PDF|startxref|xref/i.test(String(x&&x.message))){const e=new Error("kaputt");e.pkFile=1;throw e}throw x}const it=[];
 for(let p=1;p<=doc.numPages;p++){const tc=await (await doc.getPage(p)).getTextContent();tc.items.forEach(i=>{if(i&&typeof i.str==="string")it.push({p,x:i.transform[4],y:i.transform[5],s:i.str})})}
 try{doc.destroy()}catch(e){}return pkParse(it)}
function packSub(){db.collection("pack").onSnapshot(s=>{packs=s.docs.map(d=>({id:d.id,...d.data()}));pkArtFix();draw()});db.collection("packh").onSnapshot(s=>{packh={};s.docs.forEach(d=>packh[d.id]=d.data());draw()});db.collection("pked").onSnapshot(s=>{pked={};s.docs.forEach(d=>pked[d.id]=d.data());if(typeof view!=="undefined"&&/^pack/.test(view))draw()});if(typeof jvErinSub==="function")jvErinSub()}
const pkDig=s=>String(s||"").replace(/\D/g,"");
const pkDay=t=>{const d=new Date(t);d.setHours(0,0,0,0);return d.getTime()};
function pkRets(p){const r=pkRoot(p),os=new Set([r].concat(pkVerlKids(r)).map(x=>pkDig(x.ord)).filter(Boolean));return os.size?rets.filter(x=>os.has(pkDig(x.ord))):[]}
/* Herricht-Tag: Dispo-Beginn oder verschoben (packh.hd = {d:"JJJJ-MM-TT", why, by, t}) */
const pkYmd=t=>{const d=new Date(t);return d.getFullYear()+"-"+String(d.getMonth()+1).padStart(2,"0")+"-"+String(d.getDate()).padStart(2,"0")};
const pkFromYmd=s=>{const m=String(s||"").match(/^(\d{4})-(\d{2})-(\d{2})$/);return m?new Date(+m[1],+m[2]-1,+m[3]).getTime():0};
function pkHd(p){if(p&&p._z){const h=(packh[p.id]||{})["zd_"+pkZK(p._z)];return h&&pkFromYmd(h.d)?h:null}const h=(packh[p.id]||{}).hd;return h&&pkFromYmd(h.d)?h:null}
function pkHDay(p){if(pkSto(p))return 0;if(p&&p._z){const z=pkZOf(p._p,p._z);return z?pkZDay(p._p,z):0}if(pkNoH(p))return 0;const h=pkHd(p);return h?pkFromYmd(h.d):(p.db?pkDay(p.db):0)}
const pkShifted=p=>!(p&&p._z)&&!pkSto(p)&&!!pkHd(p)&&pkHDay(p)!==(p.db?pkDay(p.db):0);
const pkWd=t=>t?new Date(t).toLocaleDateString("de-AT",{weekday:"short",day:"2-digit",month:"2-digit"}):"–";
/* 1.173: Storniert (packh.sto = {by,t,why}) – gilt wie erledigt, nicht mehr herzurichten */
function pkSto(p){const s=(packh[p&&p.id]||{}).sto;return s&&s.t?s:null}
function pkState(p){if(pkSto(p))return{k:"done",l:"Storniert",c:"sto"};const t0=pkDay(Date.now()),R=pkRets(p),done=R.some(r=>r.closed&&r.art!=="teil"),hd=pkHDay(p);
 if(done)return{k:"done",l:"Retoure abgeschlossen",c:"ok"};
 const kl=(packh[p.id]||{}).klar;if(kl&&kl.t)return{k:"done",l:"Mit Projektleiter geklärt",c:"ok"};
 if(pkNoH(p)){if(p.art==="verl"){const o=pkRoot(p);if(o!==p){const so=pkState(o);return so.k==="done"?so:{k:"out",l:"Verlängerung",c:"verl"}}}
  if(p.de&&pkDay(p.de)<t0)return{k:"over",l:R.length?"Dispo abgelaufen · Retourschein offen":"Dispo abgelaufen",c:"warn"};if(p.de&&pkDay(p.de)===t0)return{k:"back",l:"Heute zurück",c:"hot"};
  return{k:"out",l:p.art==="bst"?"Von Baustelle":"Verlängerung",c:p.art}}
 if(p.de&&pkDay(p.de)<t0)return{k:"over",l:R.length?"Dispo abgelaufen · Retourschein offen":"Dispo abgelaufen",c:"warn"};
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
function pkHint(p,noZ){const s=pkState(p),h=pkHd(p),out=[];const so=pkSto(p);if(so)out.push('<div class="pkhint sto">✕ Storniert'+(so.why?' – '+esc(so.why):'')+' · '+esc(nmA(so,"by"))+', '+fmt(so.t).slice(0,6)+'</div>');
 if(s.k==="late")out.push('<div class="pkhint '+(s.c==="part"?'part">◐ Teilweise hergerichtet':'warn">⚠ Nicht hergerichtet')+' – '+(pkShifted(p)?'verschoben auf '+pkWd(pkHDay(p))+', ':'')+'Dispo-Beginn war '+pkWd(p.db)+'</div>');
 else if(pkShifted(p))out.push('<div class="pkhint">↻ Herrichten verschoben auf '+pkWd(pkHDay(p))+' (Dispo-Beginn '+pkWd(p.db)+')'+(h.why?' – '+esc(h.why):'')+(h.by?' · '+esc(nm(h.by)):'')+'</div>');
 if(!p._z)out.push(...pkArtHints(p));const H=packh[p.id]||{};
 if(H.klar&&H.klar.t)out.push('<div class="pkhint">✓ Mit Projektleiter geklärt · '+esc(nmA(H.klar,"by"))+', '+fmt(H.klar.t).slice(0,6)+'</div>');
 Object.keys(H).filter(k=>/^n_/.test(k)&&H[k]&&H[k].txt).sort((a,b)=>H[a].t-H[b].t).forEach(k=>out.push('<div class="pkhint">✎ '+esc(H[k].txt)+' · '+esc(nmA(H[k],"by"))+', '+fmt(H[k].t).slice(0,6)+'</div>'));
 if(!p._z&&(p.chg||[]).length){const c=p.chg.slice().sort((a,b)=>b.t-a.t)[0];if(!(H.fin&&H.fin.t>c.t))out.push('<div class="pkhint warn">↻ Packschein geändert '+fmt(c.t).slice(0,6)+' ('+esc(pkChgLbl(c))+') – Änderungen prüfen</div>')}
 if(!p._z){const zr=pkZrOpen(p);if(zr.length)out.push('<div class="pkhint warn">↩ Zurücklegen: '+zr.map(([,r])=>pkNum(r.n)+' '+esc(r.u||"Stk")+' '+esc(r.name)).join(', ')+'</div>')}
 const t0=pkDay(Date.now());if(!p._z&&!noZ)(p.zus||[]).forEach(z=>{const f=pkZFin(p,z),d=pkZDay(p,z);out.push(f?'<div class="pkhint">＋ Zusatz '+esc(z.ps)+' hergerichtet</div>':d<t0?'<div class="pkhint warn">⚠ Zusatz '+esc(z.ps)+' noch nicht hergerichtet – war für '+pkWd(d)+' geplant</div>':'<div class="pkhint">＋ Zusatz '+esc(z.ps)+' – herrichten '+(d===t0?'heute':pkWd(d))+'</div>')});
 return out.join("")}
/* 1.150: kurze Karte in „Alle Packlisten“ (Jürgen, 9.11.) – Veranstaltung, Auftrag · PL, Dispo, rechts nur der Stand. Alles andere in der Packliste. */
function pkRowStand(p){const s=pkState(p),g=pkProg(p);if(s.k==="done")return s.l==="Retoure abgeschlossen"?"":'<span class="tag '+(s.c==="sto"?"pksto":"pkok")+'" style="flex:0;white-space:nowrap">'+esc(s.l)+'</span>';if(pkNoH(p))return '<span class="tag pk'+(s.c||"")+'" style="flex:0;white-space:nowrap">'+esc(s.l)+'</span>';return g.fin?'<span class="tag pkok" style="flex:0;white-space:nowrap">Hergerichtet</span>':g.d?'<b style="flex:0;white-space:nowrap;font-size:14px">'+g.d+'/'+g.n+'</b>':''}
function pkRow(p){return '<div class="card pkr" data-pk="'+esc(p.id)+'"><div class="row" style="align-items:center"><b style="flex:1;min-width:0">'+esc(p.ev||"Ohne Veranstaltung")+pkWorkTag(p.id)+'</b>'+pkRowStand(p)+'</div><div class="mute">'+esc(p.ord||"–")+(p.pl?' · '+esc(shortName(p.pl)):'')+'</div><div class="mute">'+(p.db?pkDM(p.db):"–")+' – '+(p.de?pkDM(p.de):"–")+'</div></div>'}
function pkUpHtml(){return can("pk_b")?'<button class="btn" id="pkup">Packliste hochladen (PDF)</button><input id="pkfile" type="file" accept="application/pdf,.pdf" multiple hidden><div class="pkdrop" id="pkdrop" role="button" tabindex="0"><b>PDF hierher ziehen</b><small>direkt aus der Mail – auch mehrere auf einmal</small></div>':''}
function pkUpBind(){if($("#pkup")){$("#pkup").onclick=()=>$("#pkfile").click();$("#pkfile").onchange=e=>{const fs=[...e.target.files];e.target.value="";pkUpload(fs)};const z=$("#pkdrop");if(z){z.onclick=()=>$("#pkfile").click();z.onkeydown=e=>{if(e.key==="Enter"||e.key===" "){e.preventDefault();$("#pkfile").click()}}}}}
/* ab 1.110: PDF aus der Mail ins Feld ziehen. Solange der Hochlade-Knopf sichtbar ist, nimmt die ganze Seite die Datei an
   (sonst würde der Browser die PDF einfach öffnen und die App verlassen). */
let pkDragN=0;
function pkDropOn(){return !!$("#pkdrop")}
function pkDropHi(on){const z=$("#pkdrop");if(z)z.classList.toggle("on",!!on);document.body.classList.toggle("pkdragging",!!on)}
function pkDropFiles(dt){const fs=[...(dt&&dt.files||[])];return{pdf:fs.filter(f=>/\.pdf$/i.test(f.name)||f.type==="application/pdf"),other:fs.filter(f=>!(/\.pdf$/i.test(f.name)||f.type==="application/pdf"))}}
window.addEventListener("dragenter",e=>{if(!pkDropOn())return;const t=[...(e.dataTransfer&&e.dataTransfer.types||[])];if(!t.includes("Files")&&!t.includes("FileGroupDescriptorW")&&!t.includes("FileGroupDescriptor"))return;e.preventDefault();pkDragN++;pkDropHi(true)});
window.addEventListener("dragover",e=>{if(!pkDropOn())return;e.preventDefault();if(e.dataTransfer)e.dataTransfer.dropEffect="copy"});
window.addEventListener("dragleave",e=>{if(!pkDropOn())return;pkDragN=Math.max(0,pkDragN-1);if(!pkDragN)pkDropHi(false)});
window.addEventListener("drop",e=>{if(!pkDropOn())return;e.preventDefault();pkDragN=0;pkDropHi(false);
 const {pdf,other}=pkDropFiles(e.dataTransfer);
 if(!pdf.length&&!other.length)return errBox("Es ist keine Datei angekommen. Das klassische Outlook-Programm gibt Anhänge beim Ziehen nicht an den Browser weiter – dann den Anhang zuerst auf den Desktop ziehen und von dort hierher, oder Outlook im Browser bzw. das neue Outlook verwenden.");
 if(other.length)errBox((other.length===1?"„"+other[0].name+"“ ist keine PDF":other.length+" Dateien sind keine PDF")+" und wurde"+(other.length===1?"":"n")+" nicht übernommen.");
 if(pdf.length)pkUpload(pdf)});
/* 1.149: Suche in „Alle Packlisten“ – Veranstaltung, Auftrag, Packschein (auch Zusatz), Projektleiter; sucht immer in allen, egal welcher Filter gewählt ist */
let pkq="";
function pkHay(p){return jvNorm([p.ev,p.ord,String(p.ord||"").replace(/\D/g,""),p.ps,(p.zus||[]).map(z=>z.ps).join(" "),p.pl,p.plo||""].join(" "))}
function pkListHtml(){const G0=pkGroups(),T=jvNorm(pkq).split(" ").filter(Boolean),hit=p=>T.every(w=>pkHay(p).includes(w)),G={};Object.keys(G0).forEach(k=>G[k]=T.length?G0[k].filter(hit):G0[k]);
 const sec=(t,a)=>a.length?'<section class="pkgrp"><h3 class="pkh">'+t+' <span class="mute">'+a.length+'</span></h3>'+a.map(pkRow).join("")+'</section>':"";
 const cur=sec("Dispo abgelaufen",G.over)+sec("Nicht hergerichtet",G.late)+sec("Heute herrichten",G.herr)+sec("Heute zurück",G.back)+sec("Unterwegs",G.out)+sec("Kommt noch",G.next);
 if(T.length){const n=Object.keys(G).reduce((a,k)=>a+G[k].length,0);return n?'<p class="mute" style="margin:8px 0">'+n+' Treffer in allen Packlisten</p>'+cur+sec("Retoure abgeschlossen",G.done):'<div class="card mute" style="margin-top:8px">Keine Packliste gefunden.</div>'}
 return pkf==="done"?(sec("Retoure abgeschlossen",G.done)||'<div class="card mute">Noch keine erledigten Packlisten.</div>'):(cur||'<div class="card mute">Keine offenen Packlisten.</div>')}
function pkListBind(){document.querySelectorAll("#pklist [data-pk]").forEach(e=>e.onclick=()=>{curPack=e.dataset.pk;go("packopen")})}
function pkListDraw(){const b=$("#pklist");if(b){b.innerHTML=pkListHtml();pkListBind()}}
function packView(){$("#t").textContent="Alle Packlisten";if(document.activeElement&&document.activeElement.id==="pkq"&&$("#pklist"))return pkListDraw();
 $("#app").innerHTML=pkUpHtml()+(can("pk_b")?'<div style="height:12px"></div>':'')+
  chips([["aktuell","Offen"],["done","Erledigt"]],pkf,"data-pkf")+
  '<input id="pkq" type="search" autocomplete="off" placeholder="Suchen: Veranstaltung, Auftrag, Projektleiter …" value="'+esc(pkq)+'" style="width:100%;margin:8px 0 4px"><div id="pklist">'+pkListHtml()+'</div>';
 document.querySelectorAll("[data-pkf]").forEach(b=>b.onclick=()=>{pkf=b.dataset.pkf;packView()});
 pkListBind();const qi=$("#pkq");if(qi)qi.oninput=()=>{pkq=qi.value;pkListDraw()};
 pkUpBind()}
function pkFileMsg(f,k){const nm="„"+f.name+"“",tip=" Bitte den Anhang in der Mail zuerst speichern (z. B. auf den Desktop) und dann von dort hochladen.";
 if(k==="leer")return nm+" ist leer angekommen (0 Byte). Das passiert oft beim Ziehen direkt aus Outlook."+tip;
 if(k==="html")return nm+" ist keine PDF, sondern eine Webseite (vermutlich eine Fehler- oder Anmeldeseite beim Herunterladen)."+tip;
 if(k==="kaputt")return nm+" ist beschädigt oder unvollständig angekommen ("+Math.round((f.size||0)/1024)+" KB)."+tip+" Wenn sie sich auch am PC nicht öffnen lässt, die Packliste in epirent neu erzeugen.";
 return nm+" ist keine echte PDF, auch wenn sie so heißt."+tip}
async function pkUpload(files){for(const f of files){let P;const b=$("#pkup");if(b){b.disabled=true;b.textContent="Wird gelesen …"}
  try{P=await pkRead(f)}catch(e){console.warn("Packliste",e);if(b){b.disabled=false;b.textContent="Packliste hochladen (PDF)"}
   errBox(e&&e.pkFile?pkFileMsg(f,e.message):/Packliste|Auftragsnummer|Positionen/.test(String(e&&e.message))?"„"+f.name+"“ sieht nicht wie eine epirent-Packliste aus.":"Die PDF konnte nicht gelesen werden ("+String(e&&e.message||e).slice(0,80)+"). Bitte nochmal versuchen – wenn es wieder nicht geht, den Anhang zuerst speichern und von dort hochladen.");continue}
  if(b){b.disabled=false;b.textContent="Packliste hochladen (PDF)"}
  pkUpHi="";pkUpArt=null;const id=P.ps||("A"+pkDig(P.ord)),cur=packs.find(x=>x.id===id||(P.ps&&String(x.ps)===String(P.ps))),main=cur?null:pkMainFor(P,id);
  /* 1.89: gleicher Auftrag schon da -> Vergleich: geändert (ersetzt) / Zusatz / eigene Packliste (pkchg.js) */
  let ok;if(cur||main){const r=await pkChgDlg(P,cur||main,!!cur);if(!r)continue;
   if(r.mode==="rep"){await pkReplace(cur||main,P,r.inc||[]);await pkHiUp(cur||main,null);continue}if(r.mode==="repz"){await pkReplaceZ(main,r.zps,P);await pkHiUp(main,P.ps);continue}ok=r.mode==="zus"?"zus":true}
  else{ok=await pkConfirm(P,null);if(!ok)continue}
  if(ok==="zus"){const day=await pkZAskDay(P,main);if(!day)continue;
   try{const zus=(main.zus||[]).filter(z=>String(z.ps)!==String(P.ps)).concat([{ps:P.ps,ev:P.ev,t:Date.now(),by:me,pos:P.pos,v:2}]);
    await db.doc("pack/"+main.id).update({zus});const zk=pkZK(P.ps),xp=typeof pkXApply==="function"?pkXApply(main,pkH(main),pkItems({...main,zus}).filter(o=>o.z===String(P.ps))):{},xn=Object.keys(xp).filter(k=>/^h_/.test(k)).length;
    await pkHSet(main,{["zd_"+zk]:{d:day,by:me,t:Date.now()},["zf_"+zk]:{t:0},...xp});
 await pkHiUp(main,P.ps);
    toast("Zusatz angehängt – herrichten "+pkWd(pkFromYmd(day))+(xn?" · "+xn+(xn===1?" Position":" Positionen")+" mit zusätzlich Mitgegebenem verrechnet":""),1)}catch(e){console.error(e);errBox("Speichern fehlgeschlagen. Hast du das Recht „Packlisten hochladen“?")}continue}
  try{const ua=pkUpArt;pkUpArt=null;await db.doc("pack/"+id).set({...P,zus:[],by:me,t:Date.now(),...(ua?{art:ua.art,von:ua.von||"",artBy:me,artT:Date.now()}:{})});await pkHiUp({id},null);
   toast(ua?(ua.art==="bst"?"Packliste gespeichert – nicht herrichten (von Baustelle)":"Verlängerung gespeichert – nicht herrichten"):"Packliste gespeichert",1);if(ua&&ua.art==="verl"&&ua.von)await pkVerlExtra(P,ua.von)}catch(e){console.error(e);errBox("Speichern fehlgeschlagen. Hast du das Recht „Packlisten hochladen“?")}}}
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
  (main?'':'<div id="pkart"></div>')+pkHiField()+(main?'<button class="btn" id="pkzok" type="button">Als Zusatz anhängen</button><div style="height:8px"></div><div class="row"><button class="btn ghost" id="pkcn">Abbrechen</button><button class="btn ghost" id="pkok">Als eigene Packliste</button></div></div>'
   :'<div class="row"><button class="btn ghost" id="pkcn">Abbrechen</button><button class="btn" id="pkok">'+(old?'Ersetzen':'Speichern')+'</button></div></div>');
 document.body.appendChild(o);pkHiFieldBind(o);const ast=main?null:pkArtInit(P,o.querySelector("#pkart"));o.querySelector("#pkcn").onclick=()=>{o.remove();res(false)};o.querySelector("#pkok").onclick=()=>{if(ast){if(ast.art==="verl"&&!ast.von)return errBox("Bitte den Auftrag wählen, der verlängert wird.");pkUpArt=ast.art==="norm"?null:{art:ast.art,von:ast.von||""}}o.remove();res(true)};if(o.querySelector("#pkzok"))o.querySelector("#pkzok").onclick=()=>{o.remove();res("zus")}})}
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
/* 1.152: „Wird nicht gebraucht“ (Monteur/PL sagt beim Herrichten ab): packh h_<Pos>.nb={n,w,why,by,t,pl} – zieht von der Lager-Menge ab, ist eine Abweichung (grau). pl=true: vom Projektleiter in „Meine Aufträge“ eingetragen */
const pkNbN=(x,h)=>h&&h.nb&&+h.nb.n>0?Math.min(+h.nb.n,Math.max(0,(+x.n||0)-(h.fm==="miete"?(+x.f||0):0))):0;
const pkNbWho=h=>h&&h.nb&&h.nb.w?"laut "+h.nb.w+(h.nb.pl?" (selbst eingetragen)":""):"";
const pkNbTx=(x,h)=>{const n=pkNbN(x,h);if(!n)return "";const w=pkNbWho(h);return "−"+pkNum(n)+" "+(x.u||"Stk")+" nicht gebraucht"+(w?" · "+w:"")};
const pkNbPl=(x,h)=>{const n=pkNbN(x,h);if(!n)return "";const w=pkNbWho(h);return pkNum(n)+" "+(x.u||"Stk")+" nicht gebraucht"+(w?" ("+w+")":"")+(h.nb.why?" – Grund: "+h.nb.why:"")};
/* 1.156: Grund gut sichtbar (Jürgen, 10.11.) */
const pkGrund=w=>w?'<span class="pkgrund">Grund: '+esc(w)+'</span>':"";
const pkNeed=(x,h)=>Math.max(0,(+x.n||0)-(h&&h.fm==="miete"?(+x.f||0):0)-pkNbN(x,h));
function pkPS(x,h){const need=pkNeed(x,h);if(!h)return{s:"open",need,alt:[]};const alt=h.alt||[];
 if(need<=0&&pkNbN(x,h)>0&&!alt.length&&!(typeof h.q==="number"&&h.q>0))return{s:"ok",q:0,need,alt};
 if(h.ok)return{s:"ok",q:need,need,alt};const q=typeof h.q==="number"?h.q:null;
 if(q!==null||alt.length)return{s:q!==null&&q>=need?"ok":"part",q:q===null?0:q,need,alt};return{s:"open",need,alt}}
/* Lager 55 (ab 1.78): holt Fahrer/Monteur selbst – Artikel in der Artikelliste markiert (rkat.l55), pro Position umstellbar (packh h_<Pos>.l55 = true/false) */
/* Abweichung beim Herrichten (ab 1.99): zu wenig, zu viel oder Alternative → oranges „!“, Zeile ganz oben */
const pkOver=(x,h,st)=>st.s==="ok"&&h&&typeof h.q==="number"&&h.q>st.need?h.q-st.need:0;
const pkDevRow=(x,h,st)=>pkNbN(x,h)>0||st.s==="part"||st.alt.length>0||pkOver(x,h,st)>0||!!(h&&h.fm==="lager"&&x.f>0&&st.s!=="open");
let pkScanHl=null;
function pkL55(x,h){if(h&&typeof h.l55==="boolean")return h.l55;const k=pkKat(x);return !!(k&&k.l55)}
function pkProg(P){if(P&&P._z)return pkZProg(P._p,P._z);return pkProgOf(P,null,!!(pkH(P).fin&&pkH(P).fin.t))}
function pkProgOf(P,zps,fin){const H=pkH(P);let d=0,dev=0,n=0,l55=0;pkItems(P).forEach(o=>{if((o.z||null)!==zps)return;const x=o.x,h=H[o.k];if(pkL55(x,h)){l55++;return}n++;const st=pkPS(x,h);if(st.s!=="open")d++;if(pkDevRow(x,h,st)||(h&&h.fm==="lager"&&x.f>0))dev++});
 if(typeof pkXz==="function")dev+=pkXz(P,zps).length;
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
/* Herrichten auch ohne Netz (ab 1.101): jede Änderung sofort im Gerät (localStorage tpc_packh_queue) und auf dem Bildschirm,
   hochgeladen sobald Netz da ist (online-Ereignis, alle 20 s, beim Start). Feldweise zusammengeführt wie doc_update. */
const PKQ="tpc_packh_queue";let pkQBusy=false,pkQWarned=false;
function pkQ(){try{return JSON.parse(localStorage.getItem(PKQ)||"{}")||{}}catch(e){return{}}}
function pkQSet(o){try{localStorage.setItem(PKQ,JSON.stringify(o))}catch(e){}}
const pkQN=()=>Object.values(pkQ()).filter(e=>e&&e.u===me).length;
const pkNetErr=e=>!navigator.onLine||/fetch|network|load failed|timeout|timed out|abort|offline|Verbindung/i.test(String(e&&(e.message||e.details||e)||""));
window.dbOverlay=(c,id,data)=>{if(c!=="packh")return data;const e=pkQ()[id];return e&&e.u===me?{...(data||{}),...e.p}:data};
window.dbOverlayIds=c=>c==="packh"?Object.keys(pkQ()).filter(id=>pkQ()[id].u===me):[];
function pkHSet(P,patch){const id=P.id,q=pkQ(),e=q[id]&&q[id].u===me?q[id]:{u:me,p:{},n:0};e.p={...e.p,...patch};e.n++;e.t=Date.now();q[id]=e;pkQSet(q);
 if(db&&db.local)db.local("packh",id,{c:Date.now(),...(packh[id]||{})});
 return pkQFlush()}
async function pkQFlush(){if(pkQBusy||typeof SB==="undefined"||!ME)return;const q0=pkQ(),ids=Object.keys(q0).filter(id=>q0[id].u===me);if(!ids.length)return;
 if(!navigator.onLine){pkQWarn();return}pkQBusy=true;let done=0,net=false;
 try{for(const id of ids){const e=pkQ()[id];if(!e)continue;const n=e.n;
   try{try{await db.doc("packh/"+id).update(e.p)}catch(x){if(/nicht gefunden/i.test(String(x&&x.message||x)))await db.doc("packh/"+id).set({c:Date.now(),...e.p});else throw x}
    const q=pkQ();if(q[id]&&q[id].n===n){delete q[id];pkQSet(q)}done++}
   catch(x){console.error(x);if(pkNetErr(x)){net=true;pkQWarn();break}
    const q=pkQ();delete q[id];pkQSet(q);errBox("Speichern fehlgeschlagen. Hast du das Recht zum Herrichten?");if(db.reloadAll)db.reloadAll()}}}
 finally{pkQBusy=false}
 if(!net&&pkQN())return pkQFlush();
 if(done&&!pkQN()){if(pkQWarned)toast("Wieder Netz – alles vom Herrichten ist gespeichert",1);pkQWarned=false;if(view==="packopen")packOpenView()}}
function pkQWarn(){if(!pkQWarned)toast("Kein Netz – wird im Gerät gemerkt und gespeichert, sobald wieder Netz da ist",1);pkQWarned=true;if(view==="packopen"&&!document.querySelector(".ov"))packOpenView()}
function pkOffHint(){const n=pkQN();return n?'<div class="pkhint part">⏳ Kein Netz – '+(n===1?'eine Packliste wartet':n+' Packlisten warten')+' aufs Speichern. Nichts geht verloren.</div>':''}
window.addEventListener("online",()=>setTimeout(pkQFlush,1200));setInterval(()=>{if(pkQN())pkQFlush()},20000);setTimeout(pkQFlush,4000);
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
/* Zeilen der Herricht-Ansicht: zuerst „Abweichungen“ (zu wenig / zu viel / Alternative), danach Gruppen und Zusätze wie bisher */
function pkRowHtml(p,r,sub){const {x,i,h,st}=r,fm=pkFmTxt(x,h),ov=pkOver(x,h,st),hl=pkScanHl&&pkScanHl.id===p.id&&pkScanHl.i===i;
 const dv=r.dev&&(st.s==="part"||st.alt.length>0||ov>0||!!(h&&h.fm==="lager"&&x.f>0&&st.s!=="open")),nbo=r.dev&&!dv;/* 1.152: nur „nicht gebraucht“ → grau statt orange */
 return '<div class="pkp pk-'+(dv?'part':st.s)+(nbo?' pk-nb':'')+(hl?' pkhl':'')+'" data-pkrow="'+i+'"><button class="pkc" type="button" data-pc="'+i+'" aria-label="Abhaken"'+(pkRowFin(p,i)?' disabled':'')+'>'+(dv?'!':st.s==="ok"?'✓':'')+'</button>'+
  '<span class="pkn" data-pe="'+i+'">'+esc(pkNum(x.n))+(x.u?' '+esc(x.u):'')+'</span><span class="pkt" data-pe="'+i+'">'+esc(pkName(x))+(x.a?' <small>'+esc(x.a)+'</small>':'')+(sub?'<small class="pksub">'+esc(sub)+'</small>':'')+
  (fm?'<em class="'+(h&&h.fm?'pkfm':'pkfr')+'">'+esc(fm)+'</em>':'')+
  (st.s==="part"?'<em class="pkpart">'+pkNum(st.q)+' von '+pkNum(st.need)+' '+esc(x.u||"Stk")+' da – fehlen '+pkNum(st.need-st.q)+' '+esc(x.u||"Stk")+'</em>':'')+
  (ov?'<em class="pkpart">'+pkNum(h.q)+' von '+pkNum(st.need)+' '+esc(x.u||"Stk")+' – '+pkNum(ov)+' '+esc(x.u||"Stk")+' mehr als im Packschein</em>':'')+
  st.alt.map(a=>'<em class="pkalt">+ '+esc(pkNum(a.n))+'× '+esc(a.t)+(a.a?' ('+esc(a.a)+')':'')+'</em>').join("")+
  (pkNbN(x,h)?'<em class="pknb">'+esc(pkNbTx(x,h))+'</em>'+pkGrund(h.nb.why):'')+
  (h&&h.by&&st.s!=="open"?'<small class="pkby">'+esc(nm(h.by))+', '+fmt(h.t).slice(-5)+'</small>':'')+'</span></div>'}
function pkRowsHtml(p,rows,mid){const D=rows.filter(r=>r.dev);let out=D.length?'<div class="pkg pkgdev">Abweichungen ('+D.length+')</div>'+D.map(r=>pkRowHtml(p,r,pkGrp(r.x)+(r.z?' · Zusatz '+r.z:''))).join(""):'';
 let lg=null,lz;rows.forEach((r,ri)=>{const z=r.z,newZ=z&&(ri===0||rows[ri-1].z!==z),last=z&&(ri===rows.length-1||rows[ri+1].z!==z);
  if(newZ){if(mid){out+=mid;mid=""}const zd=(p.zus||[]).find(q=>String(q.ps)===z);out+='<div class="pkzbox"><div class="pkzh"><span>Zusatz-Packschein '+esc(z)+(zd&&zd.t?' · hochgeladen '+fmt(zd.t).slice(0,6):'')+'</span>'+(can("pk_l")?'<button class="lnk" type="button" data-pkzx="'+esc(z)+'">Entfernen</button>':'')+'</div>'+pkZHead(p,zd);lg=null}
  if(!r.dev){const gl=pkGrp(r.x);if(gl!==lg||z!==lz)out+='<div class="pkg">'+esc(gl)+'</div>';lg=gl;lz=z;out+=pkRowHtml(p,r,"")}
  if(last){if(rows.filter(q=>q.z===z).every(q=>q.dev))out+='<div class="mute" style="padding:8px 0;font-size:13px">Alle Positionen stehen oben bei „Abweichungen“.</div>';out+=(typeof pkXHtml==="function"?pkXHtml(p,!!pkZFin(p,pkZOf(p,z)||{ps:z}),z):'')+pkZFoot(p,z)+'</div>';lg=null}});
 return out+(mid||"")}
/* 1.159: neue Packlisten-Ansicht (Jürgen, 10.11., Entwurf https://claude.ai/artifact/XJW8C49Cp6kxVfPLoLvBop):
   Kopf (Veranstaltung, Auftrag · PL, Dispo, „Alle Angaben“, Zahnrad) · Knöpfe Etikett / Retourschein / Drucken · Info zum Herrichten ·
   pro Packschein ein Feld (Hauptpackschein blau, Zusatz orange) mit Stand links/Mitte/rechts, immer zugeklappt, Zahnrad pro Feld · Abgleich · Verlauf */
let pkFS={pid:null,open:{},filt:{},aa:false};
function pkFReset(p){if(pkFS.pid!==p.id)pkFS={pid:p.id,open:{},filt:{},aa:false}}
function pkFOpenAll(){const p=packs.find(x=>x.id===curPack);if(!p)return;pkFReset(p);pkFS.open.main=true;(p.zus||[]).forEach(z=>pkFS.open["z"+z.ps]=true);if(view==="packopen")packOpenView()}
const PKGEAR='<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 1 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 1 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 1 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 1 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>';
function pkMenu(title,items){const o=document.createElement("div");o.className="ov pkmenuov";
 o.innerHTML='<div class="card pkmenu" role="menu"><b class="pkmt">'+title+'</b>'+items.filter(Boolean).map((it,i)=>'<button type="button" class="pkmi'+(it.red?' red':'')+'" data-pkmi="'+i+'"'+(it.id?' id="'+it.id+'"':'')+(it.a?' '+it.a:'')+(it.dis?' disabled':'')+'>'+esc(it.l)+(it.s?'<small>'+esc(it.s)+'</small>':'')+'</button>').join("")+'<button type="button" class="pkmi pkmx">Abbrechen</button></div>';
 const L=items.filter(Boolean);document.body.appendChild(o);o.onclick=e=>{if(e.target===o)o.remove()};o.querySelector(".pkmx").onclick=()=>o.remove();
 o.querySelectorAll("[data-pkmi]").forEach(b=>b.onclick=()=>{o.remove();const it=L[+b.dataset.pkmi];if(it&&it.fn)it.fn()})}
function pkFTile(t,c){return '<div class="pkft pkft-'+c+'">'+t+'</div>'}
function pkFRows(p,rows){const D=rows.filter(r=>r.dev);let out=D.length?'<div class="pkg pkgdev">Abweichungen ('+D.length+')</div>'+D.map(r=>pkRowHtml(p,r,pkGrp(r.x))).join(""):'';let lg=null;
 rows.forEach(r=>{if(r.dev)return;const gl=pkGrp(r.x);if(gl!==lg)out+='<div class="pkg">'+esc(gl)+'</div>';lg=gl;out+=pkRowHtml(p,r,"")});return out}
function pkField(p,key,rows0){const z=key==="main"?null:pkZOf(p,key.slice(1)),ps=z?String(z.ps):null;
 const g=z?pkZProg(p,ps):pkProg(p),fin=z?!!pkZFin(p,z):!!(g.fin),fo=z?pkZFin(p,z):pkH(p).fin,day=z?pkZDay(p,z):(pkSto(p)?(p.db?pkDay(p.db):0):pkHDay(p));
 const mine=rows0.filter(r=>(r.z||null)===ps),nPos=mine.filter(r=>!r.l55).length,filt=pkFS.filt[key]||"alle",open=!!(pkFS.open[key]||window.PK_FOPEN);
 const left=g.n&&g.d>=g.n?pkFTile('hergerichtet<small>'+g.d+' / '+g.n+'</small>','ok'):g.d>0?pkFTile('teilweise hergerichtet<small>'+g.d+' / '+g.n+'</small>','part'):pkFTile('nicht hergerichtet<small>0 / '+g.n+'</small>','bad');
 const mid=g.dev?pkFTile('mit '+g.dev+(g.dev===1?' Abweichung':' Abweichungen'),'part'):pkFTile('ohne Abweichung',g.n&&g.d>=g.n?'ok':'neu');
 const right=fin?pkFTile('✓ abgeschlossen','ok'):pkFTile('noch nicht abgeschlossen','neu');
 const late=!fin&&!pkSto(p)&&day<pkDay(Date.now());const pct=g.n?Math.round(g.d*100/g.n):0;
 let h='<section class="pkf '+(z?'zus':'main')+(open?' open':'')+'" data-pkf="'+esc(key)+'"><div class="pkfh"><button type="button" class="pkft0" data-pkfk="'+esc(key)+'" aria-expanded="'+open+'"><b>'+(z?'<span class="pkzb">ZUSATZ</span>':'')+'Packschein '+esc((z?z.ps:p.ps)||"–")+'</b>'+
  '<span class="pkfsub'+(late?' late':'')+'">Herrichten '+esc(pkWd(day))+(!z&&pkShifted(p)?' (verschoben'+(pkHd(p).why?' – '+esc(pkHd(p).why):'')+')':'')+(z&&(pkH(p)["zd_"+pkZK(ps)]||{}).why?' ('+esc(pkH(p)["zd_"+pkZK(ps)].why)+')':'')+(late?' – noch nicht hergerichtet':'')+' · '+nPos+(nPos===1?' Position':' Positionen')+(fin&&fo&&fo.by?' · abgeschlossen von '+esc(nmA(fo,"by"))+', '+fmt(fo.t).slice(0,6):'')+'</span></button>'+
  '<button type="button" class="pkgear" data-pkfg="'+esc(key)+'" aria-label="Einstellungen Packschein '+esc((z?z.ps:p.ps)||"")+'">'+PKGEAR+'</button></div>'+
  '<button type="button" class="pkftiles" data-pkfk="'+esc(key)+'" aria-label="Aufklappen">'+left+mid+right+'</button><div class="pkbar pkfbar"><i style="width:'+pct+'%"></i></div>'+(typeof mfFieldHtml==="function"?mfFieldHtml(p,ps,fin):'');
 if(open){const rows=mine.filter(r=>!r.l55&&(filt==="alle"||r.st.s!=="ok")),r55=filt==="alle"?mine.filter(r=>r.l55):[],lock=mine.every(r=>pkRowFin(p,r.i)),nOff=mine.filter(r=>!r.l55&&r.st.s!=="ok").length;
  h+='<div class="pkfbody"><div class="pkfchips"><button type="button" class="'+(filt==="alle"?'on':'')+'" data-pkff="'+esc(key)+'" data-v="alle">Alle</button><button type="button" class="'+(filt==="offen"?'on':'')+'" data-pkff="'+esc(key)+'" data-v="offen">Noch offen ('+nOff+')</button></div>'+
   (lock?'':'<button class="mbtn sbtn pkfscan" type="button" data-pkfscan="1"><svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true"><path d="M3 7V5a2 2 0 0 1 2-2h2M17 3h2a2 2 0 0 1 2 2v2M21 17v2a2 2 0 0 1-2 2h-2M7 21H5a2 2 0 0 1-2-2v-2M7 8v8M10 8v8M13 8v8M16.5 8v8"/></svg>Artikel scannen</button>')+
   '<div class="pkl">'+(rows.length?pkFRows(p,rows):'<div class="mute" style="padding:10px 0">'+(filt==="offen"?'Nichts mehr offen.':'Keine Positionen.')+'</div>')+
   (r55.length?'<div class="pkg pkg55">Lager 55</div>'+r55.map(({x,i})=>'<div class="pkp pk-l55"><span class="pkc pkc55" aria-hidden="true"></span><span class="pkn" data-pe="'+i+'">'+esc(pkNum(x.n))+(x.u?' '+esc(x.u):'')+'</span><span class="pkt" data-pe="'+i+'">'+esc(pkName(x))+(x.a?' <small>'+esc(x.a)+'</small>':'')+'<em class="pk55">holt Fahrer/Monteur'+(x.f>0?' · davon '+esc(pkNum(x.f))+' Fremdmiete':'')+'</em></span></div>').join(""):'')+
   (typeof pkXHtml==="function"?pkXHtml(p,fin,ps,true):'')+'</div>'+
   '<button type="button" class="pkfclose" data-pkfk="'+esc(key)+'">Zuklappen ▴</button></div>'}
 else h+='<button type="button" class="pkfmore" data-pkfk="'+esc(key)+'">Antippen zum Aufklappen ▾</button>';
 return h+'</section>'}
function pkHeadMenu(p){const H=pkH(p),fin=!!(H.fin&&H.fin.t),kl=H.klar&&H.klar.t,noh=pkNoH(p);
 if(noh)return pkMenu("Packliste",[can("pk_b")&&{l:"Projektleiter ändern",id:"pkplch",fn:()=>pkPlDlg(p)},can("pk_b")&&{l:"Kunde ändern",s:" kommt mit dem Umzug auf den Firmenserver",dis:true},
  can("pk_b")&&{l:"Art ändern",id:"pkmart",s:" Normal / Von Baustelle / Verlängerung",fn:()=>pkArtDlg(p)},can("pk_b")&&p.art==="bst"&&{l:"Doch selbst herrichten",id:"pkselbst",fn:()=>ask("Doch selbst herrichten? Die Packliste kommt dann wie gewohnt auf die Wand.",()=>pkArtSave(p,{art:"",von:""}))},
  can("pk_b")&&{l:"Info zum Herrichten",id:"pkmhi",fn:()=>pkHiDlg(p,null)},
  can("pk_b")&&{l:pkSto(p)?"Storno zurücknehmen":"Auftrag storniert",id:"pksto",s:pkSto(p)?"":" Packliste bleibt, muss nicht mehr hergerichtet werden",fn:()=>pkStoDlg(p)},
  can("pk_l")&&{l:"Packliste löschen",red:true,id:"pkdel",fn:()=>ask("Packliste „"+(p.ev||p.ord)+"“ wirklich löschen?",async()=>{try{if(typeof mfDelAll==="function")await mfDelAll(p);await db.doc("pack/"+p.id).delete();if(packh[p.id])await db.doc("packh/"+p.id).delete().catch(()=>{});view="pack";hist=hist.filter(v=>v!=="packopen");draw();toast("Packliste gelöscht",1)}catch(e){errBox("Löschen fehlgeschlagen.")}})}]);
 pkMenu("Packliste",[!fin&&{l:"Herrichten verschieben",id:"pkmv",fn:()=>pkMove(p)},can("pk_b")&&{l:"Projektleiter ändern",id:"pkplch",fn:()=>pkPlDlg(p)},can("pk_b")&&{l:"Kunde ändern",s:" kommt mit dem Umzug auf den Firmenserver",dis:true},
  can("pk_b")&&{l:"Info zum Herrichten",id:"pkmhi",s:pkHiList(p).length?" ändern / weitere":"",fn:()=>pkHiDlg(p,null)},can("pk_b")&&{l:"Art ändern",id:"pkmart",s:" Von Baustelle / Verlängerung",fn:()=>pkArtDlg(p)},
  {l:"Info an Projektleiter",id:"pkinfo",fn:()=>pkMail(p)},
  {l:kl?"„Mit Projektleiter geklärt“ zurücknehmen":"Mit Projektleiter geklärt",fn:()=>kl?ask("„Geklärt“ zurücknehmen?",()=>pkHSet(p,{klar:null})):ask("Auftrag "+(p.ord||"")+" als mit dem Projektleiter geklärt markieren? Dann zählt er nicht mehr bei „Fehlmaterial“ und nicht mehr bei „Dispo abgelaufen“.",()=>pkHSet(p,{klar:{by:me,t:Date.now()}}))},
  can("pk_b")&&{l:pkSto(p)?"Storno zurücknehmen":"Auftrag storniert",id:"pksto",s:pkSto(p)?"":" Packliste bleibt, muss nicht mehr hergerichtet werden",fn:()=>pkStoDlg(p)},
  can("pk_l")&&{l:"Packliste löschen",red:true,id:"pkdel",fn:()=>ask("Packliste „"+(p.ev||p.ord)+"“ wirklich löschen?",async()=>{try{if(typeof mfDelAll==="function")await mfDelAll(p);await db.doc("pack/"+p.id).delete();if(packh[p.id])await db.doc("packh/"+p.id).delete().catch(()=>{});view="pack";hist=hist.filter(v=>v!=="packopen");draw();toast("Packliste gelöscht",1)}catch(e){errBox("Löschen fehlgeschlagen.")}})}])}
function pkFieldMenu(p,key){if(key==="main"){const fin=!!(pkH(p).fin&&pkH(p).fin.t);
  return pkMenu("Packschein "+esc(p.ps||""),[fin?{l:"Packschein öffnen",id:"pkreo",fn:()=>ask("Herrichten wieder öffnen?",()=>pkHSet(p,{fin:null}))}:{l:"Packschein abschließen",id:"pkfin",fn:()=>pkFinish(p)},
   !fin&&typeof pkXDlg==="function"&&{l:"Material hinzufügen",id:"pkxadd",fn:()=>pkXDlg(p,null,null,null)},{l:"Info an Projektleiter",fn:()=>pkMail(p)}])}
 const ps=key.slice(1),z=pkZOf(p,ps);if(!z)return;const fin=!!pkZFin(p,z);
 pkMenu('<span class="pkzb">ZUSATZ</span>Packschein '+esc(ps),[fin?{l:"Packschein öffnen",a:'data-pkzr="'+esc(ps)+'"',fn:()=>pkZReopen(p,ps)}:{l:"Packschein abschließen",a:'data-pkzf="'+esc(ps)+'"',fn:()=>pkZFinish(p,ps)},
  !fin&&typeof pkXDlg==="function"&&{l:"Material hinzufügen",a:'data-pkxadd="'+esc(ps)+'"',fn:()=>pkXDlg(p,null,null,ps)},!fin&&{l:"Herrichten verschieben",a:'data-pkzmv="'+esc(ps)+'"',fn:()=>pkZMove(p,ps)},z.v&&{l:"Info an Projektleiter",a:'data-pkzi="'+esc(ps)+'"',s:" nur dieser Zusatz",fn:()=>pkMail(p,ps)},
  can("pk_l")&&{l:"Zusatz entfernen",a:'data-pkzx="'+esc(ps)+'"',red:true,fn:()=>ask("Zusatz-Packschein "+ps+" wirklich entfernen?",async()=>{try{if(typeof mfDel==="function")await mfDel(p,ps);const rest=(p.zus||[]).filter(q=>String(q.ps)!==ps);await db.doc("pack/"+p.id).update({zus:rest});if(!rest.length&&(packh[p.id]||{}).reo)await pkHSet(p,{reo:null});toast("Zusatz entfernt",1)}catch(e){errBox("Entfernen fehlgeschlagen. Hast du das Recht dazu?")}})}])}
function pkRetBtn(p){const R=pkRets(p);if(!R.length)return can("ret_b")?pkNewRet(p):errBox("Noch kein Retourschein – du hast kein Recht, einen anzulegen.");
 if(R.length===1&&!can("ret_b")){curRet=R[0].id;return go("retopen")}
 pkMenu("Retourscheine",R.map(r=>({l:"Öffnen – "+(r.closed?(r.art==="teil"?"Teilretoure":r.art==="end"?"Endretoure":"abgeschlossen"):"offen"),s:" "+fmt(r.t||0).slice(0,6),fn:()=>{curRet=r.id;go("retopen")}})).concat(can("ret_b")?[{l:"+ Neuen Retourschein anlegen",id:"pknewr",fn:()=>pkNewRet(p)}]:[]))}
/* 1.160: Kopf und Knöpfe auch für Von Baustelle / Verlängerung */
function pkHeadHtml(p){const kv=(k,v)=>v?'<span>'+k+'</span><b>'+v+'</b>':'',hd=pkHd(p);
 const head='<div class="card pkhead"><div class="pkhrow"><div class="pkhl"><h2 class="pkev">'+esc(p.ev||"Ohne Veranstaltung")+'</h2>'+
  '<div class="pkhm">'+esc(p.ord||"–")+(p.pl?' · '+esc(shortName(p.pl)):'')+'</div><div class="pkhm">Dispo '+(p.db?pkDM(p.db):"–")+' – '+(p.de?pkDM(p.de):"–")+'</div>'+
  '<button type="button" class="pkaa" id="pkaa" aria-expanded="'+pkFS.aa+'">Alle Angaben '+(pkFS.aa?'▴':'▾')+'</button></div><button type="button" class="pkgear big" id="pkhg" aria-label="Einstellungen Packliste">'+PKGEAR+'</button></div>'+
  (pkFS.aa?'<div class="pkkv">'+kv("Packschein",esc(p.ps||"–"))+kv("Dispo",pkD(p.db)+' – '+pkD(p.de))+kv("Herrichten",esc(pkWd(pkHDay(p)))+(pkShifted(p)?' <span class="mute">(verschoben von '+esc(pkWd(p.db))+(hd.why?' – '+esc(hd.why):'')+')</span>':''))+(p.pk?kv("Packen",pkD(p.pk)):'')+(p.an?kv("Anlieferung",pkD(p.an)):'')+(p.eb?kv("Veranstaltung",pkD(p.eb)+' – '+pkD(p.ee)):'')+(p.sa?kv("Selbstabholer",esc(p.sa)):'')+kv("Art",p.art==="verl"?"Verlängerung":p.art==="bst"?"Von Baustelle":"Normal herrichten")+kv("Hochgeladen",esc(nm(p.by))+', '+fmt(p.t))+'</div>':'')+
  pkOffHint()+pkWhoHint(p.id)+pkHint(p,true)+'</div>';
 return head}
function pkActsHtml(p,R){const acts='<div class="pkacts"><button type="button" id="pketik" class="pkact"><svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/><path d="M14 14h3v3h-3zM20 14v7h-6"/></svg>Etikett drucken</button>'+
  (can("ret_s")||can("ret_b")?'<button type="button" id="pkret" class="pkact"><svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path d="M9 14l-5-5 5-5"/><path d="M4 9h11a5 5 0 0 1 0 10h-3"/></svg>Retourschein'+(R.length?' <small>('+R.length+')</small>':'')+'</button>':'')+
  '<button type="button" id="pkprint" class="pkact"><svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path d="M6 9V3h12v6"/><rect x="3" y="9" width="18" height="8" rx="2"/><path d="M6 14h12v7H6z"/></svg>Drucken / Teilen</button></div>';
 return acts}
function packOpenView(){const p=packs.find(x=>x.id===curPack);if(!p){view="pack";return packView()}if(pkNoH(p))return pkNoHView(p);
 const ae=document.activeElement;if(ae&&/INPUT|TEXTAREA/.test(ae.tagName)&&document.querySelector(".ov"))return;
 pkFReset(p);$("#t").textContent="Packliste";const pr=pkProg(p),H=pr.H,K=pkKeys(p),R=pkRets(p);
 if(pkScanHl&&pkScanHl.id!==p.id)pkScanHl=null;
 const IT=pkItems(p),rows0=pkSortIdx(p).map(i=>{const x=IT[i].x,h=H[K[i]],st=pkPS(x,h),l55=pkL55(x,h);return{x,i,h,st,z:IT[i].z,l55,dev:!l55&&pkDevRow(x,h,st)}});
 if(pkScanHl){const it=IT[pkScanHl.i];if(it)pkFS.open[it.z?"z"+it.z:"main"]=true}
 const head=pkHeadHtml(p),acts=pkActsHtml(p,R);
 $("#app").innerHTML=head+acts+pkHiBox(p)+pkField(p,"main",rows0)+(p.zus||[]).map(z=>pkField(p,"z"+z.ps,rows0)).join("")+(typeof abgPkCard==="function"?abgPkCard(p):'')+(typeof pkChgCard==="function"?pkChgCard(p):'');
 pkHeadBind(p);
 if(typeof mfBind==="function")mfBind(true);
 document.querySelectorAll("[data-pkfk]").forEach(b=>b.onclick=()=>{const k=b.dataset.pkfk;pkFS.open[k]=!(pkFS.open[k]||window.PK_FOPEN);if(window.PK_FOPEN&&!pkFS.open[k])window.PK_FOPEN=false;packOpenView()});
 document.querySelectorAll("[data-pkfg]").forEach(b=>b.onclick=()=>pkFieldMenu(p,b.dataset.pkfg));
 document.querySelectorAll("[data-pkff]").forEach(b=>b.onclick=()=>{pkFS.filt[b.dataset.pkff]=b.dataset.v;packOpenView()});
 document.querySelectorAll("[data-pkfscan]").forEach(b=>b.onclick=()=>pkScanStart(p));
 if(typeof abgPkBind==="function")abgPkBind();
 document.querySelectorAll("[data-pc]").forEach(b=>b.onclick=()=>pkTap(p,+b.dataset.pc));
 document.querySelectorAll("[data-pe]").forEach(b=>b.onclick=()=>{if(pkRowFin(p,+b.dataset.pe))return toast((pkItems(p)[+b.dataset.pe]||{}).z?"Der Zusatz ist abgeschlossen – zum Ändern über das Zahnrad „Packschein öffnen“.":"Der Packschein ist abgeschlossen – zum Ändern über das Zahnrad „Packschein öffnen“.",1);pkEdit(p,+b.dataset.pe)});
 if(typeof pkChgBind==="function")pkChgBind(p);if(typeof pkXBind==="function")pkXBind(p);
}
function pkHeadBind(p){$("#pkaa").onclick=()=>{pkFS.aa=!pkFS.aa;packOpenView()};$("#pkhg").onclick=()=>pkHeadMenu(p);if($("#pkret"))$("#pkret").onclick=()=>pkRetBtn(p);
 if($("#pkprint")){if(typeof wbLoadPdf==="function")wbLoadPdf().catch(()=>{});$("#pkprint").onclick=()=>pkDrDlg(p)}}
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
 const go2=()=>pkHSet(P,{[k]:{by:me,t:Date.now()}}).then(()=>{toast("Zusatz hergerichtet",1);const dv=()=>{const pp=pkZProg(P,ps);if(pp.dev||pp.n-pp.d>0)ask("Es gibt Abweichungen. Soll "+(shortName(P.pl)||"der Projektleiter")+" eine Info bekommen?",()=>pkMail(P,ps),"Nein")};if(typeof mfAfterFin==="function")mfAfterFin(P,ps,dv);else dv()});
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
 const put=fm=>pkHSet(P,{[k]:{ok:true,q:null,alt:(h&&h.alt)||[],fm:fm||(h&&h.fm)||"",...(h&&h.nb?{nb:h.nb}:{}),by:me,t:Date.now()}});
 if(x.f>0&&!(h&&h.fm))return pkFmAsk(x,fm=>put(fm));
 if(st.s==="open")return put();
 if(st.s==="ok"&&h&&h.ok&&!pkDevRow(x,h,st))return pkHSet(P,{[k]:h.fm?{fm:h.fm,by:me,t:Date.now()}:null});
 pkEdit(P,i)}
function pkFmAsk(x,cb){const o=document.createElement("div");o.className="ov";
 o.innerHTML='<div class="card" style="width:100%;max-width:400px;margin:0"><b>'+esc(pkName(x))+'</b><p style="margin:8px 0">Laut Packliste '+pkNum(x.n)+(x.u?' '+esc(x.u):'')+', davon <span class="pkfr">'+pkNum(x.f)+' Fremdmiete</span>.</p>'+
  '<button class="btn" id="fml" type="button">Aus dem Lager<br><small style="font-weight:400">alle '+pkNum(x.n)+' kommen von uns</small></button><div style="height:8px"></div><button class="btn" id="fmm" type="button">Wird zugemietet<br><small style="font-weight:400">nur '+pkNum(Math.max(0,x.n-x.f))+' aus dem Lager</small></button><div style="height:8px"></div><button class="btn ghost" id="fmx" type="button">Abbrechen</button></div>';
 document.body.appendChild(o);o.querySelector("#fml").onclick=()=>{o.remove();cb("lager")};o.querySelector("#fmm").onclick=()=>{o.remove();cb("miete")};o.querySelector("#fmx").onclick=()=>o.remove()}
/* Menge, Alternative, Fremdmiete bearbeiten */
function pkEdit(P,i,opt){opt=opt||{};const x=pkPosAll(P)[i],k=pkKeys(P)[i],h=pkH(P)[k]||{};let fm=h.fm||"",alt=(h.alt||[]).map(a=>({...a})),pick=null;
 if(pkL55(x,h)){const o=document.createElement("div");o.className="ov";
  o.innerHTML='<div class="card" style="width:100%;max-width:420px;margin:0"><b style="font-size:17px">'+esc(pkName(x))+'</b>'+(x.a?' <span class="mute">'+esc(x.a)+'</span>':'')+'<p class="mute" style="margin:4px 0 12px">Laut Packliste: '+pkNum(x.n)+(x.u?' '+esc(x.u):'')+'. Steht auf <b>Lager 55</b> – holt der Fahrer oder Monteur selbst.</p>'+
   '<button class="btn" id="p55s" type="button">Packe ich doch selbst</button><button class="btn ghost" id="p55x" type="button" style="margin-top:8px">Schließen</button></div>';
  document.body.appendChild(o);o.querySelector("#p55x").onclick=()=>o.remove();
  o.querySelector("#p55s").onclick=()=>{o.remove();if(pkRowFin(P,i))return toast("Herrichten ist abgeschlossen – zum Ändern erst „Wieder öffnen“.",1);pkHSet(P,{[k]:{...(h||{}),l55:false,by:me,t:Date.now()}})};return}
 const o=document.createElement("div");o.className="ov";
 const nbv=()=>{const e=o.querySelector("#penb");const v=e?parseFloat(String(e.value).replace(",",".")):NaN;return isNaN(v)?0:Math.max(0,Math.min(v,nbMax()))},nbMax=()=>Math.max(0,(+x.n||0)-(fm==="miete"?(+x.f||0):0));
 const need=()=>pkNeed(x,{fm,nb:{n:nbv()}});
 o.innerHTML='<div class="card" style="width:100%;max-width:440px;margin:0;max-height:92vh;overflow:auto"><b style="font-size:17px">'+esc(pkName(x))+'</b>'+(x.a?' <span class="mute">'+esc(x.a)+'</span>':'')+(pkName(x)!==x.t?'<div class="mute" style="font-size:13px">Im Packschein: '+esc(x.t)+'</div>':'')+
  '<p class="mute" style="margin:4px 0 10px">Laut Packliste: '+pkNum(x.n)+(x.u?' '+esc(x.u):'')+(x.f>0?', davon <span class="pkfr">'+pkNum(x.f)+' Fremdmiete</span>':'')+'</p>'+
  (pkKat(x)?'':'<div class="pknokat"><span>Nicht in der Artikelliste</span>'+(can("v_app")?'<button class="btn s" id="pekat" type="button">Zur Artikelliste hinzufügen</button>':'<button class="btn ghost s" id="pekat" type="button">Fehlt in der Artikelliste – melden</button>')+'</div>')+
  (x.f>0?'<label class="mute">Fremdmiete</label><div class="row seg" style="margin:4px 0 10px"><button type="button" id="pefl">Aus dem Lager</button><button type="button" id="pefm">Wird zugemietet</button></div>':'')+
  '<label class="mute" for="peq">Vorhanden <span id="pen"></span></label><div class="row" style="align-items:center;gap:8px"><button class="btn ghost" id="pem" type="button" style="flex:0 0 52px">−</button><input id="peq" type="number" inputmode="numeric" min="0" style="text-align:center;font-size:20px;margin:0"><button class="btn ghost" id="pep" type="button" style="flex:0 0 52px">+</button></div>'+
  '<button class="btn ghost s" id="pea" type="button" style="margin-top:6px">Alles da</button>'+
  '<h4 style="margin:14px 0 4px">Alternative</h4><div id="pel"></div>'+
  '<div class="row" style="gap:8px;align-items:flex-start"><input id="pean" type="number" inputmode="numeric" min="1" placeholder="Anz." style="flex:0 0 72px;margin:0"><div style="flex:1;min-width:0;position:relative"><input id="peat" placeholder="Artikel suchen oder eintippen" autocomplete="off" style="margin:0"><div id="peres" class="peres"></div></div></div>'+
  '<button class="btn ghost" id="peadd" type="button" style="margin-top:6px">+ Alternative hinzufügen</button>'+
  '<h4 style="margin:14px 0 4px">Wird nicht gebraucht</h4><div class="row" style="gap:8px;align-items:center"><input id="penb" type="number" inputmode="numeric" min="0" placeholder="Anz." style="flex:0 0 72px;margin:0"><span class="mute" style="flex:0 0 auto">'+esc(x.u||"Stk")+'</span><button class="btn ghost s" id="penba" type="button" style="flex:0 0 auto;margin-left:auto">Alle</button></div>'+
  '<input id="penbw" list="penbl" autocomplete="off" placeholder="Wer hat es gesagt? (optional)" style="margin-top:6px"><datalist id="penbl">'+[...new Set([shortName(P.pl)].concat(typeof pkPlCands==="function"?pkPlCands().map(shortName):[]).filter(Boolean))].map(n=>'<option value="'+esc(n)+'">').join("")+'</datalist>'+
  '<input id="penbg" autocomplete="off" placeholder="Grund (optional)" style="margin-top:6px">'+
  '<div class="row" style="margin-top:14px"><button class="btn ghost" id="pex" type="button">Abbrechen</button><button class="btn" id="pes" type="button">Speichern</button></div>'+
  '<button class="btn ghost" id="pe55" type="button" style="margin-top:10px">Holt Fahrer/Monteur – Lager 55</button>'+
  '<button class="lnk" id="per" type="button" style="margin-top:6px;color:var(--bad)">Position zurücksetzen</button></div>';
 document.body.appendChild(o);const g=id=>o.querySelector("#"+id),qi=g("peq");
 if(h.nb){g("penb").value=String(+h.nb.n||"");g("penbw").value=h.nb.w||"";g("penbg").value=h.nb.why||""}
 qi.value=h.ok?String(need()):(typeof h.q==="number"?String(h.q):"");
 const lab=()=>{g("pen").textContent="(von "+pkNum(need())+")";if(g("pefl")){g("pefl").classList.toggle("on",fm==="lager");g("pefm").classList.toggle("on",fm==="miete")}};
 const drawAlt=()=>{g("pel").innerHTML=alt.map((a,j)=>'<div class="pealt"><span>'+esc(pkNum(a.n))+'× '+esc(a.t)+(a.a?' <small>'+esc(a.a)+'</small>':'')+'</span><button class="lnk" type="button" data-ax="'+j+'" style="color:var(--bad)">Entfernen</button></div>').join("");
  g("pel").querySelectorAll("[data-ax]").forEach(b=>b.onclick=()=>{alt.splice(+b.dataset.ax,1);drawAlt()})};
 lab();drawAlt();
 if(opt.msg)o.querySelector(".card").insertAdjacentHTML("afterbegin",'<div class="pkscm'+(opt.warn?' w':'')+'">'+esc(opt.msg)+'</div>');
 if(opt.alt){pick={t:opt.alt.t,a:opt.alt.a||""};g("peat").value=opt.alt.t;g("pean").value="";setTimeout(()=>{g("pean").focus();g("pean").scrollIntoView({block:"center"})},80)}
 if(g("pefl")){g("pefl").onclick=()=>{fm="lager";lab()};g("pefm").onclick=()=>{fm="miete";lab()}}
 let nbLast=need();const nbCh=()=>{const nn=need();if(qi.value.trim()!==""&&parseFloat(qi.value)===nbLast)qi.value=nn?String(nn):"";nbLast=nn;lab()};
 g("penb").oninput=nbCh;g("penba").onclick=()=>{g("penb").value=String(nbMax());nbCh()};
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
  const nn=nbv(),nw=g("penbw").value.trim(),ng=g("penbg").value.trim(),nb=nn>0?{n:nn,w:nw,why:ng,by:h.nb&&+h.nb.n===nn&&(h.nb.w||"")===nw&&(h.nb.why||"")===ng?h.nb.by:me,t:h.nb&&+h.nb.n===nn&&(h.nb.w||"")===nw&&(h.nb.why||"")===ng?h.nb.t:Date.now(),...(h.nb&&h.nb.pl&&+h.nb.n===nn&&(h.nb.w||"")===nw?{pl:true}:{})}:null;
  o.remove();if(q===null&&!alt.length)return pkHSet(P,{[k]:fm||nb?{fm,...(nb?{nb}:{}),by:me,t:Date.now()}:null});
  pkHSet(P,{[k]:{ok:q!==null&&q>=need()&&!alt.length,q,alt,fm,...(nb?{nb}:{}),by:me,t:Date.now()}})}}
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
 const go2=()=>pkHSet(P,{fin:{by:me,t:Date.now()},reo:null}).then(()=>{toast("Herrichten abgeschlossen",1);const dv=()=>{const pp=pkProg(P);if(pp.dev||pp.n-pp.d>0)ask("Es gibt Abweichungen. Soll "+(shortName(P.pl)||"der Projektleiter")+" eine Info bekommen?",()=>pkMail(P),"Nein")};if(typeof mfAfterFin==="function")mfAfterFin(P,null,dv);else dv()});
 if(open>0)ask("Noch "+open+(open===1?" Position ist":" Positionen sind")+" nicht hergerichtet. Trotzdem abschließen?",go2);else go2()}
function pkMailText(P,zps){const H=pkH(P),K=pkKeys(P),IT=pkItems(P),L=[],inc=o=>zps?o.z===String(zps):!o.z||!(pkZOf(P,o.z)||{}).v;
 pkPosAll(P).forEach((x,i)=>{if(!inc(IT[i]))return;const h=H[K[i]];if(pkL55(x,h))return;const st=pkPS(x,h),nm2=x.t+(x.a?" ("+x.a+")":"")+(IT[i].z?" [Zusatz "+IT[i].z+"]":""),u=x.u?" "+x.u:"";
  if(st.s==="open")L.push("- "+nm2+": nicht hergerichtet (laut Packliste "+pkNum(st.need)+u+")");
  else if(st.s==="part")L.push("- "+nm2+": "+pkNum(st.q)+" von "+pkNum(st.need)+u+" – fehlen "+pkNum(st.need-st.q)+u);
  else if(pkOver(x,h,st))L.push("- "+nm2+": "+pkNum(h.q)+" von "+pkNum(st.need)+u+" – "+pkNum(pkOver(x,h,st))+u+" mehr als im Packschein");
  if(st.alt.length)st.alt.forEach(a=>L.push((st.s==="part"||st.s==="open"||pkOver(x,h,st)?"  ":"- "+nm2+":\n  ")+"Alternative: "+pkNum(a.n)+"× "+a.t+(a.a?" ("+a.a+")":"")));
  if(h&&h.fm==="lager"&&x.f>0)L.push("- "+nm2+": aus dem Lager statt Fremdmiete ("+pkNum(x.f)+u+")");
  if(pkNbN(x,h))L.push("- "+nm2+": "+pkNbPl(x,h))});
 if(typeof pkXz==="function")pkXz(P,zps).forEach(e=>L.push("- Zusätzlich mitgegeben (nicht im "+(zps?"Zusatz":"Packschein")+"): "+pkXTx(e)+(e.why?" – Grund: "+e.why:"")));
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
function pkSub(){const G=pkGroups(),a=[];if(G.over.length)a.push(G.over.length+" Dispo abgelaufen");const hh=G.herr.filter(p=>!pkProg(p).fin).length+pkZToday().filter(z=>!pkProg(z).fin).length;if(hh)a.push(hh+" heute herrichten");if(G.back.length)a.push(G.back.length+" heute zurück");return a.length?a.join(", "):"PDF hochladen und ansehen"}
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
function pkSlot(p){const h=pkNoH(p)?(p.db?pkDay(p.db):0):pkHDay(p);if(!h)return{t:0,we:""};const w=new Date(h).getDay();return w===6?{t:pkAddD(h,-1),we:"Sa"}:w===0?{t:pkAddD(h,-2),we:"So"}:{t:h,we:""}}
function pkOvData(){const t0=pkDay(Date.now()),m0=pkMon(t0),m1=pkAddD(m0,7),m2=pkAddD(m0,14);
 let L=packs.filter(p=>p.db||pkHd(p)).filter(p=>pkState(p).k!=="done").concat(pkZTasks()).map(p=>({p,s:pkSlot(p),g:pkProg(p)}));
 /* 1.135: Zusatz am selben Tag wie die Packliste → eine Karte (Jürgen, 6.11.: „Warum habe ich 2 Packscheine vom selben Auftrag?“) */
 L=L.filter(o=>{if(!o.p._z)return true;const m=L.find(x=>!x.p._z&&x.p.id===o.p.id&&pkHDay(x.p)===pkHDay(o.p)&&!pkNoH(x.p));if(!m||!!m.g.fin!==!!o.g.fin)return true;
  m.zm=(m.zm||[]).concat(o.p._z);m.g={...m.g,d:m.g.d+o.g.d,n:m.g.n+o.g.n,fin:!!(m.g.fin&&o.g.fin)};return false});
 const late=L.filter(o=>!pkNoH(o.p)&&pkHDay(o.p)<t0&&!o.g.fin).sort((a,b)=>pkHDay(a.p)-pkHDay(b.p));
 const day=(m,i)=>{const t=pkAddD(m,i);return{t,items:L.filter(o=>o.s.t===t).sort((a,b)=>(a.g.fin?1:0)-(b.g.fin?1:0)||(a.p.db||0)-(b.p.db||0))}};
 const w0=[0,1,2,3,4].map(i=>day(m0,i)),w1=[0,1,2,3,4].map(i=>day(m1,i));
 const later=L.filter(o=>o.s.t>=m2).sort((a,b)=>a.s.t-b.s.t);
 const kw=[0,1,2,3].map(k=>{const a=pkAddD(m2,7*k),b=pkAddD(a,7);return{lab:"KW "+pkKW(a)+" · "+pkDM(a)+"–"+pkDM(pkAddD(a,4)),items:later.filter(o=>o.s.t>=a&&o.s.t<b)}});
 const after=pkAddD(m2,28);kw.push({lab:"Danach",items:later.filter(o=>o.s.t>=after)});
 return{t0,m0,m1,m2,late,w0,w1,kw}}
const pkOpenN=a=>a.filter(o=>!o.g.fin&&!pkNoH(o.p)).length;
function pkBadges(o,withShift){const p=o.p,f=pkF(p).length,b=[];
 if(f&&!o.g.fin)b.push('<span class="pkb fr">'+f+' Fremd</span>');
 if(p._z)b.push('<span class="pkb zu">Zusatz</span>');
 if(o.zm)o.zm.forEach(z=>b.push('<span class="pkb zu">+ Zusatz '+esc(z)+'</span>'));
 if(o.s.we)b.push('<span class="pkb we">'+(o.s.we==="Sa"?"Samstag":"Sonntag")+'</span>');
 if(withShift&&pkShifted(p))b.push('<span class="pkb sh">↻ '+(pkHDay(p)<pkDay(p.db)?'vorgezogen':'verschoben')+' (Dispo '+pkWd(p.db)+')</span>');
 return b.length?'<div class="pkbs">'+b.join("")+'</div>':''}
const pkTime=p=>!p._z&&p.db&&pkHDay(p)===pkDay(p.db)&&(new Date(p.db).getHours()||new Date(p.db).getMinutes())?new Date(p.db).toLocaleTimeString("de-AT",{hour:"2-digit",minute:"2-digit"}):"";
function pkBar(g){return '<div class="pkmb"><div class="pkbar"><i style="width:'+(g.n?Math.round(g.d*100/g.n):0)+'%"></i></div><b>'+g.d+'/'+g.n+'</b></div>'}
/* Karte (Handy) */
function pkCard(o){const p=o.p,g=o.g;if(pkNoH(p))return pkNoHCard(p,false);
 if(g.fin)return '<button class="pkcard fin" type="button" data-pk="'+esc(p.id)+'"><b>'+esc(p.ev||p.ord)+'</b><span class="pkok">Hergerichtet ✓</span></button>';
 return '<button class="pkcard" type="button" data-pk="'+esc(p.id)+'"><span class="pkct"><b>'+esc(p.ev||"Ohne Veranstaltung")+'</b>'+(pkTime(p)?'<small>'+pkTime(p)+'</small>':'')+'</span><span class="pkcs">Auftrag '+esc(p.ord||"–")+(p.pl?' · '+esc(shortName(p.pl)):'')+'</span>'+pkWorkTag(p.id,"span")+pkBar(g)+pkBadges(o,true)+'</button>'}
/* Zeile (breit) */
function pkLine(o,lab){const p=o.p,g=o.g;if(pkNoH(p))return pkNoHCard(p,true,lab);
 return '<button class="pkline'+(g.fin?' fin':'')+'" type="button" data-pk="'+esc(p.id)+'"><span class="pkl1">'+esc(lab||pkTime(p)||"")+'</span><span class="pkl2"><b>'+esc(p.ev||"Ohne Veranstaltung")+'</b><small>Auftrag '+esc(p.ord||"–")+(p.pl?' · '+esc(shortName(p.pl)):'')+'</small>'+(g.fin?'':pkWorkTag(p.id,"span")+pkBadges(o,true))+'</span><span class="pkl3">'+(g.fin?'<span class="pkok">✓</span>':g.n?g.d+'/'+g.n:'')+'</span></button>'}
function pkLateHtml(D,wide){if(!D.late.length)return"";
 return '<section class="pklate"><h3>Nicht hergerichtet <span>'+D.late.length+'</span></h3>'+D.late.map(o=>{const part=o.g.d>0;
  return '<button class="pklc" type="button" data-pk="'+esc(o.p.id)+'"><span class="pkct"><b>'+esc(o.p.ev||o.p.ord)+'</b><small class="'+(part?'part':'warn')+'">'+(part?'Teilweise hergerichtet':'Nicht hergerichtet')+'</small></span><span class="pkcs">seit '+pkWd(pkHDay(o.p))+' · Auftrag '+esc(o.p.ord||"–")+'</span>'+pkWorkTag(o.p.id,"span")+(part?pkBar(o.g):'')+'</button>'}).join("")+'</section>'}
function pkDayLabel(t,t0){return PK_WD[new Date(t).getDay()]+" "+pkDM(t)+(t===t0?" · Heute":"")}
/* vergangener Tag: zusammengeklappt, antippen klappt auf */
function pkPastSum(d){const I=d.items.filter(o=>!pkNoH(o.p)),n=I.length,f=I.filter(o=>o.g.fin).length,o2=n-f;if(!n&&d.items.length)return '<span class="mute">nichts herzurichten</span>';
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
  const pkCnt=n=>' <b class="pkwn">· '+n+(n===1?' Packliste':' Packlisten')+'</b>';/* 1.175: Anzahl neben der Überschrift (Jürgen) */
  const week=(lab,sub,days,isNow)=>'<div class="pkwh"><span>'+lab+pkCnt(days.reduce((n,d)=>n+d.items.length,0))+'</span><small>'+sub+'</small></div>'+days.map(d=>{const past=d.t<D.t0,open=pkOpenDays.has(d.t);
   if(past&&!open)return '<button class="pkdrow past" type="button" data-pkd="'+d.t+'"><span class="pkl1">'+pkDayLabel(d.t,D.t0)+'</span><span class="pksum">'+pkPastSum(d)+'</span></button>';
   return '<div class="pkdh'+(d.t===D.t0?' today':'')+'"'+(past?' data-pkd="'+d.t+'"':'')+'>'+pkDayLabel(d.t,D.t0)+(d.items.length?'':' <small>leer</small>')+'</div>'+d.items.map(o=>pkLine(o)).join("")}).join("");
  const left=pkLateHtml(D,true)+week("Diese Woche","KW "+pkKW(D.m0)+" · "+pkDM(D.m0)+"–"+pkDM(pkAddD(D.m0,4)),D.w0);
  const right=week("Nächste Woche","KW "+pkKW(D.m1)+" · "+pkDM(D.m1)+"–"+pkDM(pkAddD(D.m1,4)),D.w1)+'<div class="pkwh later"><span>Später'+pkCnt(D.kw.reduce((n,k)=>n+k.items.length,0))+'</span><small>nach Kalenderwoche</small></div>'+D.kw.map(k=>'<div class="pkdh">'+esc(k.lab)+(k.items.length?'':' <small>leer</small>')+'</div>'+k.items.map(o=>pkLine(o,pkDayLabel(o.s.t,0))).join("")).join("");
  $("#app").innerHTML=top+'<div class="pkwide"><div>'+left+'</div><div>'+right+'</div></div>'}
 document.querySelectorAll("[data-pkt]").forEach(b=>b.onclick=()=>{pkTab=b.dataset.pkt;packOverView()});
 document.querySelectorAll("[data-pkd]").forEach(b=>b.onclick=e=>{if(e.target.closest("[data-pk]"))return;const t=+b.dataset.pkd;pkOpenDays.has(t)?pkOpenDays.delete(t):pkOpenDays.add(t);packOverView()});
 document.querySelectorAll("[data-pk]").forEach(e=>e.onclick=ev=>{ev.stopPropagation();curPack=e.dataset.pk;go("packopen")});
 $("#pkall").onclick=()=>go("packall");pkUpBind()}
window.addEventListener("resize",()=>{if(typeof view!=="undefined"&&view==="pack"&&pkWideLast!==null&&(window.innerWidth>=900)!==pkWideLast)packOverView()});

/* Wer richtet gerade her? (1.114) – Herzschlag wie beim Retourschein: docs pked (id = Packliste) {ed_<id>: Zeit, edn_<id>: Tablet-Name}.
   Zählt, solange die Packliste offen und sichtbar ist und noch etwas nicht abgeschlossen ist; alle 30 s, beim Verlassen 0. Gültig 90 s. */
let pked={},pkHbId=null,pkHbLast=0;
function pkWorkers(id,notMe){const r=pked[id],n=Date.now();return r?Object.keys(r).filter(k=>k.startsWith("ed_")&&!(notMe&&k==="ed_"+me)&&n-(+r[k]||0)<90000).map(k=>{const u=k.slice(3);return r["edn_"+u]?shortName(r["edn_"+u])+" (Tablet)":nm(u)}):[]}
function pkWorkTag(id,el){const L=pkWorkers(id),P=packs.find(x=>x.id===id),hi=P&&pkHiList(P).length;if(!L.length&&!hi)return"";
 const t=(hi?'<span class="tag pkhit">ℹ Info</span>':'')+(hi&&L.length?' ':'')+(L.length?'<span class="tag pkwork">Richtet her · '+esc(L.join(", "))+'</span>':'');return el?'<'+el+' class="pkworkw">'+t+'</'+el+'>':' '+t}
function pkWhoHint(id){const L=pkWorkers(id,true);return L.length?'<div class="rwho"><span>'+esc(L.join(", "))+(L.length>1?" richten":" richtet")+' gerade auch diese Packliste her.</span></div>':""}
function pkEdSet(id,v){const ref=db.doc("pked/"+id),d={["ed_"+me]:v,...(v&&tabOn()&&TAB.act?{["edn_"+me]:TAB.act.name}:{})};return ref.update(d).catch(x=>{if(/nicht gefunden/i.test(String(x&&x.message||x)))return ref.set(d)}).catch(()=>{})}
function pkHb(){const P=view==="packopen"&&document.visibilityState==="visible"&&packs.find(x=>x.id===curPack),id=P&&!pkNoH(P)&&!pkItems(P).every((o,i)=>pkRowFin(P,i))?P.id:null;
 if(pkHbId&&pkHbId!==id){pkEdSet(pkHbId,0);pkHbLast=0}
 if(id&&(id!==pkHbId||Date.now()-pkHbLast>30000)){pkHbLast=Date.now();pkEdSet(id,Date.now())}
 pkHbId=id}
setInterval(()=>{if(typeof db!=="undefined"&&db&&me&&navigator.onLine)pkHb()},4000);
document.addEventListener("visibilitychange",()=>{if(typeof db!=="undefined"&&db&&me)pkHb()});
window.addEventListener("pagehide",()=>{if(pkHbId)pkEdSet(pkHbId,0)});
setInterval(()=>{if(typeof view!=="undefined"&&(view==="pack"||view==="packall")&&!document.querySelector(".ov"))draw()},20000);

/* ===== Info zum Herrichten (1.115) =====
   Beim Hochladen (Feld in „Packliste erkannt“ / „Zusatz/geänderter Packschein“) oder später in der Packliste (Recht pk_b).
   Gespeichert in packh (bleibt beim Ersetzen der PDF): Felder hi_<key> = {txt,by,t,z?(Zusatz-Packschein),mod?,modT?}; gelöscht = null. Geht über die Herricht-Warteschlange (auch ohne Netz).
   Anzeige: großer oranger Kasten ganz oben in der Packliste, Schild „ℹ Info“ in Übersicht/Alle Packlisten, im PDF und in der Nachricht an den Monteur. */
let pkUpHi="";
function pkHiField(){return '<label class="mute" for="pkhi" style="display:block;margin-top:10px">Info zum Herrichten <span style="font-weight:400">(optional – sieht, wer herrichtet)</span></label><textarea id="pkhi" rows="3" placeholder="z. B. Kabel bitte extra beschriften, Kunde holt um 7 Uhr ab">'+esc(pkUpHi)+'</textarea>'}
function pkHiFieldBind(o){const t=o.querySelector("#pkhi");if(t)t.oninput=()=>{pkUpHi=t.value}}
function pkHiList(P){const H=pkH(P);return Object.keys(H).filter(k=>k.startsWith("hi_")&&H[k]&&String(H[k].txt||"").trim()).map(k=>({k,...H[k]})).sort((a,b)=>(a.t||0)-(b.t||0))}
async function pkHiUp(P,z){const txt=String(pkUpHi||"").trim();pkUpHi="";if(!txt||!P||!P.id)return;try{await pkHiSave(P,null,txt,z)}catch(e){console.warn("Info zum Herrichten",e)}}
function pkHiSave(P,k,txt,z){const H=pkH(P),old=k&&H[k];if(old)return pkHSet(P,{[k]:{...old,txt,mod:me,modT:Date.now()}});
 return pkHSet(P,{["hi_"+Date.now().toString(36)+Math.random().toString(36).slice(2,5)]:{txt,by:me,t:Date.now(),...(z?{z:String(z)}:{})}})}
const pkHiHtml=t=>esc(t).replace(/\n/g,"<br>");
function pkHiBox(P){const L=pkHiList(P);if(!L.length)return"";const ed=can("pk_b");
 return '<div class="pkhi"><div class="pkhih">ℹ Info zum Herrichten</div>'+L.map(e=>'<div class="pkhie">'+(e.z?'<div class="pkhiz">Zusatz '+esc(e.z)+'</div>':'')+'<div class="pkhit2">'+pkHiHtml(e.txt)+'</div><div class="pkhim">'+esc(nmA(e,"by"))+', '+fmt(e.t)+(e.modT?' · geändert '+fmt(e.modT)+(e.mod&&e.mod!==e.by?' von '+esc(nmA(e,"mod")):''):'')+
  (ed?' <button class="lnk" type="button" data-hied="'+esc(e.k)+'">Ändern</button>':'')+'</div></div>').join("")+(ed?'<button class="lnk" type="button" id="pkhiadd2">+ Weitere Info</button>':'')+'</div>'}
function pkHiAddLink(P){return can("pk_b")&&!pkHiList(P).length?'<button class="lnk" type="button" id="pkhiadd" style="display:block;padding:6px 0 0">+ Info zum Herrichten eintragen</button>':""}
function pkHiDlg(P,k){const e=k?pkH(P)[k]:null,o=document.createElement("div");o.className="ov";
 o.innerHTML='<div class="card" style="width:100%;max-width:420px;margin:0"><b>Info zum Herrichten</b><p class="mute" style="margin:4px 0 8px">'+esc(P.ev||"")+' · Auftrag '+esc(P.ord||"–")+(e&&e.z?' · Zusatz '+esc(e.z):'')+'</p><textarea id="pkhit" rows="5" placeholder="Was soll der, der herrichtet, wissen?"></textarea>'+
  '<div class="row" style="margin-top:8px">'+(e?'<button class="btn ghost" id="pkhix" type="button" style="color:var(--red,#c0392b)">Löschen</button>':'')+'<button class="btn ghost" id="pkhic" type="button">Abbrechen</button><button class="btn" id="pkhio" type="button">Speichern</button></div></div>';
 document.body.appendChild(o);const t=o.querySelector("#pkhit");t.value=e?e.txt||"":"";setTimeout(()=>t.focus(),60);o.querySelector("#pkhic").onclick=()=>o.remove();
 o.querySelector("#pkhio").onclick=async()=>{const v=t.value.trim();if(!v){t.classList.add("bad");return errBox("Bitte einen Text eingeben – oder „Löschen“.")}if(e&&v===String(e.txt||"").trim()){o.remove();return}o.remove();await pkHiSave(P,k,v,null);toast("Info gespeichert",1);if(view==="packopen")packOpenView()};
 const x=o.querySelector("#pkhix");if(x)x.onclick=()=>ask("Info löschen?",async()=>{o.remove();await pkHSet(P,{[k]:null});toast("Info gelöscht",1);if(view==="packopen")packOpenView()})}
document.addEventListener("click",ev=>{if(typeof view==="undefined"||view!=="packopen")return;const b=ev.target.closest&&ev.target.closest("#pkhiadd,#pkhiadd2,[data-hied]");if(!b||!can("pk_b"))return;
 const P=packs.find(x=>x.id===curPack);if(!P)return;ev.stopPropagation();pkHiDlg(P,b.dataset.hied||null)});

/* ===== Packscheine ohne Herrichten (1.118) =====
   pack.art = "bst" (Material kommt direkt von einer anderen Baustelle) | "verl" (Verlängerung eines laufenden Auftrags, Kopie mit neuer Auftragsnummer) | leer (normal).
   pack.von = Quell-Auftrag (bst, freiwillig) bzw. verlängerter Auftrag (verl, Pflicht; immer auf das Original zurückgeführt), artBy/artT = wer/wann eingestellt.
   Einstellen nur mit Recht pk_b (Hochladen bzw. „Art ändern“).
   Wirkung: kein Herricht-Tag (pkHDay 0) → nie „Heute herrichten“/„Nicht hergerichtet“, auf der Wand als gestrichelte Karte am Dispo-Beginn.
   Verlängerung: das Original bekommt das späteste Dispo-Ende (_de0 = ursprüngliches), Retourscheine beider Auftragsnummern zählen beim Original (pkRets),
   der Verlängerungs-Datensatz selbst hat keinen eigenen Abgleich; mehr Material als im Original → automatisch Zusatz am Original (pkVerlExtra).
   Von Baustelle: zählt als draußen (laut Packschein); beim Quell-Auftrag zählt dasselbe Material als zurück („weitergegeben“, abgBal). */
let pkUpArt=null;
const pkNoH=p=>!!p&&!p._z&&(p.art==="bst"||p.art==="verl");
function pkRoot(p){let x=p,i=0;while(x&&x.art==="verl"&&x.von&&i<6){const n=packs.find(q=>q.id===x.von);if(!n||n===x)break;x=n;i++}return x||p}
function pkVerlKids(r){return packs.filter(x=>x!==r&&x.art==="verl"&&pkRoot(x)===r)}
function pkArtFix(){packs.forEach(p=>{const k=pkVerlKids(p);if(!k.length||p.art==="verl")return;const e=Math.max(...k.map(x=>x.de||0));if(e>(p.de||0)){p._de0=p.de;p.de=e}p._verl=k.map(x=>x.id)})}
const pkArtKey=x=>abgKey(artCode(x.a),pkName(x));
function pkArtAgg(L){const m={};(L||[]).forEach(x=>{const k=pkArtKey(x);m[k]=m[k]||{x,n:0};m[k].n+=+x.n||0});return m}
function pkArtCands(P){const own=pkArtAgg(P.pos),ks=Object.keys(own),evn=s=>String(s||"").trim().toLowerCase();
 return packs.filter(p=>!p._z&&p.art!=="verl"&&p.id!==(P.ps||"")&&pkState(p).k!=="done").map(p=>{const a=pkArtAgg(pkPosAll(p));const same=ks.filter(k=>a[k]).length;
  return{p,ov:ks.length?same/ks.length:0,dd:p.de&&P.db?Math.round((pkDay(P.db)-pkDay(p.de))/864e5):99,sameEv:!!P.ev&&evn(p.ev)===evn(P.ev),samePl:!!P.pl&&shortName(p.pl)===shortName(P.pl)}})}
function pkVerlSug(P){const c=pkArtCands(P).filter(c=>c.dd>=-1&&c.dd<=2&&c.sameEv&&c.ov>=0.6).sort((a,b)=>(b.sameEv*2+b.samePl+b.ov)-(a.sameEv*2+a.samePl+a.ov));return c[0]||null}
function pkBstSug(P){return pkArtCands(P).filter(c=>c.ov>0&&c.dd>=-2&&c.dd<=1).sort((a,b)=>b.ov-a.ov||Math.abs(a.dd)-Math.abs(b.dd)).slice(0,4)}
/* Auswahl „Was ist das?“ (Hochladen und „Art ändern“) – st = {art:"norm"|"bst"|"verl", von, q, sug} */
function pkArtInit(P,box,cur){if(!box)return null;const sug=pkVerlSug(P),st={art:cur?cur.art||"norm":sug?"verl":"norm",von:cur?cur.von||"":sug?sug.p.id:"",q:"",sug,pick:false};
 const rowP=(p,on,extra)=>'<button type="button" class="pkarow'+(on?' on':'')+'" data-avon="'+esc(p.id)+'"><span><b>'+esc(p.ev||"Ohne Veranstaltung")+'</b><small>Auftrag '+esc(p.ord||"–")+' · bis '+pkWd(p.de)+(extra?' · '+extra:'')+'</small></span>'+(on?'<span class="pkachk" aria-hidden="true">✓</span>':'')+'</button>';
 const draw=()=>{const vp=st.von&&packs.find(x=>x.id===st.von),opt=(k,t,s,inner)=>'<div class="pkaopt'+(st.art===k?' on '+k:'')+'"><label><input type="radio" name="pkart" value="'+k+'"'+(st.art===k?' checked':'')+'><span><b>'+t+'</b>'+(s?'<small>'+s+'</small>':'')+'</span></label>'+(st.art===k&&inner?inner:'')+'</div>';
  const list=k=>{const all=pkArtCands(P);let L;if(st.q){const q=st.q.toLowerCase();L=all.filter(c=>[c.p.ev,c.p.ord,c.p.pl].join(" ").toLowerCase().includes(q)).slice(0,8)}else L=k==="bst"?pkBstSug(P):all.sort((a,b)=>(b.sameEv*2+b.samePl+b.ov)-(a.sameEv*2+a.samePl+a.ov)).slice(0,4);
   return '<div class="pkapick">'+(vp&&!st.pick?rowP(vp,true)+'<button type="button" class="lnk" data-apick="1">'+(k==="verl"?'Anderen Auftrag wählen':'Ändern')+'</button>':
    '<input type="search" class="pkaq" placeholder="Veranstaltung oder Auftrag suchen" value="'+esc(st.q)+'" aria-label="Auftrag suchen">'+(L.length?L.map(c=>rowP(c.p,c.p.id===st.von,c.ov?Math.round(c.ov*100)+' % gleiche Artikel':'')).join(""):'<div class="mute" style="font-size:13px">Keine passenden laufenden Aufträge.</div>')+
    (k==="bst"?'<button type="button" class="pkarow'+(!st.von?' on':'')+'" data-avon=""><span><small>Weiß ich nicht / nicht in der App</small></span></button>':'')+(k==="bst"&&!st.q?'<small class="mute">Vorschläge: Aufträge, deren Dispo um den Dispo-Beginn endet und die gleiche Artikel haben.</small>':''))+'</div>'};
  box.innerHTML=(st.sug&&!cur?'<div class="pkasug"><b>Sieht aus wie eine Verlängerung</b> von <b>'+esc(st.sug.p.ev||"")+' · Auftrag '+esc(st.sug.p.ord||"–")+'</b>: '+[st.sug.sameEv?'gleiche Veranstaltung':'',st.sug.samePl?'gleicher Projektleiter':'',st.sug.dd===0?'beginnt am Dispo-Ende':'beginnt rund um das Dispo-Ende ('+pkWd(st.sug.p.de)+')',Math.round(st.sug.ov*100)+' % gleiche Artikel'].filter(Boolean).join(', ')+'.</div>':'')+
   '<div class="pkah">Was ist das?</div>'+opt("norm","Normal herrichten","Kommt auf die Wand, wird hergerichtet.")+
   opt("bst","Kommt von einer anderen Baustelle","Nicht herrichten – das Material geht direkt von Baustelle zu Baustelle.",'<div class="pkasub">Von welcher? <span>(freiwillig – dort zählt es dann als „weitergegeben“)</span></div>'+list("bst"))+
   opt("verl","Verlängerung eines laufenden Auftrags","Material ist schon unterwegs. Nicht herrichten, die Dispo läuft weiter.",list("verl"));
  box.querySelectorAll('input[name="pkart"]').forEach(r=>r.onchange=()=>{st.art=r.value;st.pick=false;st.q="";if(st.art==="norm")st.von="";else if(st.art==="verl"&&!st.von&&st.sug)st.von=st.sug.p.id;else if(st.art==="verl"){const vp=st.von&&packs.find(x=>x.id===st.von);if(vp&&vp.art==="verl")st.von=pkRoot(vp).id}draw()});
  box.querySelectorAll("[data-avon]").forEach(b=>b.onclick=()=>{st.von=b.dataset.avon;st.pick=false;st.q="";draw()});
  box.querySelectorAll("[data-apick]").forEach(b=>b.onclick=()=>{st.pick=true;draw()});
  const q=box.querySelector(".pkaq");if(q)q.oninput=()=>{st.q=q.value;const pos=q.selectionStart;draw();const n=box.querySelector(".pkaq");if(n){n.focus();try{n.setSelectionRange(pos,pos)}catch(e){}}}};
 draw();return st}
const pkArtWho=p=>p.artBy?' · '+esc(nm(p.artBy))+', '+fmt(p.artT||0).slice(0,6):'';
function pkArtLink(p){return can("pk_b")&&!p._z?'<button class="lnk" type="button" data-artch="'+esc(p.id)+'" style="display:block;padding:4px 0 0">Art ändern (nicht herrichten, Verlängerung …)</button>':""}
function pkArtHints(p){const out=[];if(p._verl&&p._verl.length){const k=p._verl.map(id=>packs.find(x=>x.id===id)).filter(Boolean).sort((a,b)=>(a.de||0)-(b.de||0));
  out.push('<div class="pkhint verl">↻ Verlängert bis '+pkWd(p.de)+(p._de0?' (ursprünglich '+pkWd(p._de0)+')':'')+' durch '+k.map(x=>'<a href="#" data-pkgo="'+esc(x.id)+'">Auftrag '+esc(x.ord||x.ps||"")+'</a>').join(", ")+'</div>')}
 packs.filter(x=>x.art==="bst"&&x.von===p.id).forEach(x=>out.push('<div class="pkhint bst">➜ Material geht direkt weiter an <a href="#" data-pkgo="'+esc(x.id)+'">'+esc(x.ev||"")+' (Auftrag '+esc(x.ord||"–")+')</a> – zählt hier als zurück</div>'));
 return out}
function pkNoHTxt(p){if(p.art==="bst"){const s=p.von&&packs.find(x=>x.id===p.von);return s?'kommt von '+esc(s.ev||"")+' · nicht herrichten':'kommt von einer anderen Baustelle · nicht herrichten'}
 const r=pkRoot(p);return r!==p?'Verlängerung von '+esc(r.ev||"")+' · läuft bis '+pkWd(r.de):'Verlängerung · nichts herrichten'}
function pkNoHCard(p,wide,lab){const l=p.art==="bst"?"Von Baustelle":"Verlängerung";
 if(wide)return '<button class="pkline noh '+p.art+'" type="button" data-pk="'+esc(p.id)+'"><span class="pkl1">'+esc(lab||"")+'</span><span class="pkl2"><b>'+esc(p.ev||"Ohne Veranstaltung")+'</b><small>'+pkNoHTxt(p)+'</small></span><span class="pkl3"><span class="tag pk'+p.art+'">'+l+'</span></span></button>';
 return '<button class="pkcard noh '+p.art+'" type="button" data-pk="'+esc(p.id)+'"><span class="pkct"><b>'+esc(p.ev||"Ohne Veranstaltung")+'</b><span class="tag pk'+p.art+'">'+l+'</span></span><span class="pkcs">'+pkNoHTxt(p)+'</span></button>'}
function pkNoHView(p){$("#t").textContent="Packliste";pkFReset(p);const s=pkState(p),bst=p.art==="bst",src=bst&&p.von&&packs.find(x=>x.id===p.von),r=bst?null:pkRoot(p),ed=can("pk_b");
 let cmp="";if(!bst&&r&&r!==p){const A=pkArtAgg(pkItems(r).filter(o=>!(o.z&&String(o.z)===String(p.ps||p.id))).map(o=>o.x)),B=pkArtAgg(p.pos),ks=[...new Set(Object.keys(A).concat(Object.keys(B)))];let same=0;const more=[],less=[];
  ks.forEach(k=>{const a=A[k]?A[k].n:0,b=B[k]?B[k].n:0,x=(B[k]||A[k]).x;if(a===b)same++;else(b>a?more:less).push({x,d:Math.abs(b-a)})});
  const z=(r.zus||[]).find(q=>String(q.verl||"")===String(p.id)||String(q.ps)===String(p.ps));
  cmp='<div class="card" style="cursor:default"><b>Vergleich mit dem Original</b>'+(same?'<div class="pkcmp"><span>'+same+(same===1?' Artikel':' Artikel')+' gleich</span><b class="okc">✓</b></div>':'')+
   more.map(e=>'<div class="pkcmp"><span>'+esc(pkName(e.x))+'</span><b class="morec">+'+pkNum(e.d)+' '+esc(e.x.u||"Stk")+' mehr</b></div>').join("")+less.map(e=>'<div class="pkcmp"><span>'+esc(pkName(e.x))+'</span><b class="lessc">−'+pkNum(e.d)+' '+esc(e.x.u||"Stk")+' weniger</b></div>').join("")+
   (more.length?'<p class="mute" style="margin:8px 0 0">'+(z?'Das Mehr wird als <b>Zusatz '+esc(z.ps)+'</b> beim Original hergerichtet.':'Das Mehr ist noch nicht als Zusatz angelegt.')+' <a href="#" data-pkgo="'+esc(r.id)+'">Original öffnen ›</a></p>':'')+(less.length?'<p class="mute" style="margin:6px 0 0">Weniger: kommt vermutlich schon früher zurück – Teilretoure beim Original. Beim Herrichten nichts zu tun.</p>':'')+'</div>'}
 const box=bst?'<div class="pkartbox bst"><b>Nicht herrichten</b><span>'+(src?'Das Material kommt direkt von <a href="#" data-pkgo="'+esc(src.id)+'"><b>'+esc(src.ev||"")+'</b> (Auftrag '+esc(src.ord||"–")+')</a>.':'Das Material kommt direkt von einer anderen Baustelle.')+'</span><small>Eingestellt'+pkArtWho(p)+'</small></div>'
  :'<div class="pkartbox verl"><b>↻ Verlängerung'+(r&&r!==p?' von '+esc(r.ev||""):'')+'</b><span>'+(r&&r!==p?'Auftrag '+esc(r.ord||"–")+' – das Material ist schon unterwegs. Nicht herrichten.':'Der verlängerte Auftrag ist nicht (mehr) in der App.')+'</span>'+(r&&r!==p?'<a href="#" data-pkgo="'+esc(r.id)+'">Original-Auftrag öffnen ›</a>':'')+'<small>Eingestellt'+pkArtWho(p)+'</small></div>';
 const pos=pkPosAll(p),R=pkRets(p),open=!!(pkFS.open.main||window.PK_FOPEN);
 /* 1.160: gleiche Optik wie normale Packlisten – Feld mit Hinweis „nicht herrichten“ statt Kacheln, aufklappbar zur Artikelliste */
 const fld='<section class="pkf main pkfnoh'+(open?' open':'')+'" data-pkf="main"><div class="pkfh"><button type="button" class="pkft0" data-pkfk="main" aria-expanded="'+open+'"><b>Packschein '+esc(p.ps||"–")+'</b><span class="pkfsub">Nicht herrichten · '+pos.length+(pos.length===1?' Position':' Positionen')+'</span></button></div>'+
  '<div class="pkfnbox">'+box+'</div>'+(open?'<div class="pkfbody"><div class="pknohh '+p.art+'">Material laut Packschein (nur zur Info)</div>'+pos.map(x=>'<div class="pknohr"><b>'+pkNum(+x.n||0)+' '+esc(x.u||"Stk")+'</b><span>'+esc(pkName(x))+(x.f>0?' <span class="pkfr">davon '+pkNum(x.f)+' Fremdmiete</span>':'')+'</span></div>').join("")+'<button type="button" class="pkfclose" data-pkfk="main">Zuklappen ▴</button></div>':'<button type="button" class="pkfmore" data-pkfk="main">Antippen zum Aufklappen ▾</button>')+'</section>';
 $("#app").innerHTML=pkHeadHtml(p)+pkActsHtml(p,R)+pkHiBox(p)+fld+cmp+(bst?abgPkCard(p):(r&&r!==p?abgPkCard(r):''));
 pkHeadBind(p);if(typeof abgPkBind==="function")abgPkBind();
 if(typeof mfBind==="function")mfBind(true);
 document.querySelectorAll("[data-pkfk]").forEach(b=>b.onclick=()=>{pkFS.open.main=!(pkFS.open.main||window.PK_FOPEN);if(window.PK_FOPEN&&!pkFS.open.main)window.PK_FOPEN=false;pkNoHView(p)})}
async function pkArtSave(p,v){try{await db.doc("pack/"+p.id).update({art:v.art||"",von:v.von||"",artBy:me,artT:Date.now()});toast(v.art==="bst"?"Gespeichert – nicht herrichten (von Baustelle)":v.art==="verl"?"Gespeichert – Verlängerung":"Gespeichert – wird normal hergerichtet",1)}catch(e){console.error(e);errBox("Speichern fehlgeschlagen"+(typeof sbErr==="function"?sbErr(e):"")+". Hast du das Recht „Packlisten hochladen“?")}}
function pkArtDlg(p){if(!can("pk_b"))return;const o=document.createElement("div");o.className="ov";
 o.innerHTML='<div class="card" style="width:100%;max-width:420px;margin:0;max-height:90vh;overflow:auto"><b>Art der Packliste</b><p class="mute" style="margin:4px 0 8px">'+esc(p.ev||"")+' · Auftrag '+esc(p.ord||"–")+'</p><div id="pkart2"></div><div class="row" style="margin-top:10px"><button class="btn ghost" id="pkac" type="button">Abbrechen</button><button class="btn" id="pkao" type="button">Speichern</button></div></div>';
 document.body.appendChild(o);const st=pkArtInit({...p,ps:p.id},o.querySelector("#pkart2"),{art:p.art||"norm",von:p.von||""});o.querySelector("#pkac").onclick=()=>o.remove();
 o.querySelector("#pkao").onclick=async()=>{if(st.art==="verl"&&!st.von)return errBox("Bitte den Auftrag wählen, der verlängert wird.");const v={art:st.art==="norm"?"":st.art,von:st.art==="norm"?"":st.von||""};
  if(v.art===(p.art||"")&&v.von===(p.von||"")){o.remove();return}o.remove();await pkArtSave(p,v);if(v.art==="verl"&&v.von)await pkVerlExtra(p,v.von)}}
/* Verlängerung mit mehr Material als im Original → das Mehr als Zusatz am Original herrichten */
async function pkVerlExtra(P,vonId){const v=packs.find(x=>x.id===vonId);if(!v)return;const r=pkRoot(v),pid=P.ps||P.id;if((r.zus||[]).some(z=>String(z.verl||"")===String(pid)))return;
 const A=pkArtAgg(pkPosAll(r)),B=pkArtAgg(P.pos),extra=[];let i=0;Object.keys(B).forEach(k=>{const d=B[k].n-(A[k]?A[k].n:0);if(d>0){const x=B[k].x;extra.push({p:"V"+(++i),n:d,u:x.u||"Stk",t:x.t,a:x.a||"",f:0})}});
 if(!extra.length)return;const zP={...P,ps:pid,pos:extra};
 const ok=await new Promise(res=>ask2("Die Verlängerung hat mehr Material als das Original ("+extra.map(x=>pkNum(x.n)+" "+(x.u||"Stk")+" "+pkName(x)).join(", ")+"). Als Zusatz beim Original herrichten?","Ja, als Zusatz","Nein",()=>res(true),()=>res(false)));if(!ok)return;
 const day=await pkZAskDay(zP,r);if(!day)return;
 try{const zus=(r.zus||[]).filter(z=>String(z.ps)!==String(pid)).concat([{ps:pid,ev:P.ev,t:Date.now(),by:me,pos:extra,v:2,verl:String(pid)}]);await db.doc("pack/"+r.id).update({zus});const zk=pkZK(pid);
  await pkHSet(r,{["zd_"+zk]:{d:day,by:me,t:Date.now()},["zf_"+zk]:{t:0}});toast("Mehr-Material als Zusatz beim Original – herrichten "+pkWd(pkFromYmd(day)),1)}catch(e){console.error(e);errBox("Zusatz konnte nicht angelegt werden. Hast du das Recht „Packlisten hochladen“?")}}
document.addEventListener("click",ev=>{const t=ev.target.closest&&ev.target.closest("[data-pkgo],[data-artch]");if(!t)return;ev.preventDefault();ev.stopPropagation();
 if(t.dataset.artch){const p=packs.find(x=>x.id===t.dataset.artch);if(p)pkArtDlg(p);return}
 if(packs.some(x=>x.id===t.dataset.pkgo)){curPack=t.dataset.pkgo;go("packopen")}},true);
/* 1.143: Projektleiter einer Packliste ändern (Recht pk_b). pack.pl = aktueller Name, pack.plo = Name laut Packschein (nur gesetzt, solange von Hand geändert).
   Geänderter Packschein (pkReplace): die Änderung bleibt, plo wird aktualisiert. Keine Nachricht, kein Verlauf (Jürgen, 9.11.). */
function pkPlLink(p){return can("pk_b")&&!p._z?' <button class="lnk" type="button" data-plch="'+esc(p.id)+'" style="padding:0 2px;font-size:13px">Ändern</button>':""}
function pkPlCands(){const L=[],add=n=>{n=String(n||"").trim().replace(/\s+/g," ");if(!n)return;const k=auToks(n).slice().sort().join(" ");if(k&&!L.some(x=>x.k===k))L.push({n,k})};
 (typeof PROFS!=="undefined"?PROFS:[]).forEach(u=>{const r=ROL[u.id],t=r&&TIT[r.t];if(u.name&&u.active!==false&&t&&/projektleiter/i.test(t.name||""))add(u.name)});
 packs.forEach(p=>{if(!p._z){add(p.pl);if(typeof p.plo==="string")add(p.plo)}});return L.map(x=>x.n).sort((a,b)=>shortName(a).localeCompare(shortName(b),"de"))}
function pkPlDlg(p){if(!can("pk_b"))return;const o=document.createElement("div");o.className="ov";const man=typeof p.plo==="string",all=pkPlCands();let sel="";
 const same=(a,b)=>auToks(a).slice().sort().join(" ")===auToks(b).slice().sort().join(" ");
 o.innerHTML='<div class="card" style="width:100%;max-width:420px;margin:0;max-height:90vh;overflow:auto"><b>Projektleiter ändern</b><p class="mute" style="margin:4px 0 8px">'+esc(p.ev||"")+' · Auftrag '+esc(p.ord||"–")+'<br>Bisher: <b>'+esc(shortName(p.pl)||"–")+'</b></p><input id="pkpln" type="text" autocomplete="off" placeholder="Name suchen oder eintippen" style="width:100%"><div id="pkpll" style="margin-top:8px;display:flex;flex-direction:column;gap:6px"></div>'+(man?'<button class="lnk" id="pkplr" type="button" style="display:block;margin-top:8px;text-align:left">Zurück auf Name laut Packschein ('+esc(shortName(p.plo)||"keiner")+')</button>':'')+'<div class="row" style="margin-top:10px"><button class="btn ghost" id="pkplc" type="button">Abbrechen</button><button class="btn" id="pkplo" type="button">Speichern</button></div></div>';
 document.body.appendChild(o);const inp=o.querySelector("#pkpln"),box=o.querySelector("#pkpll");
 const list=()=>{const q=sel&&inp.value===shortName(sel)?"":jvNorm(inp.value),L=all.filter(n=>!q||q.split(" ").every(w=>jvNorm(n).includes(w)));
  box.innerHTML=L.slice(0,30).map(n=>{const i=all.indexOf(n),on=sel?n===sel:same(n,p.pl);return '<button class="btn '+(on?'':'ghost ')+'s" type="button" data-pln="'+i+'" style="text-align:left">'+esc(shortName(n))+(same(n,p.pl)?' <small>(bisher)</small>':'')+'</button>'}).join("")||(q?'<p class="mute" style="margin:0">Neuer Name – wird so gespeichert.</p>':'');
  box.querySelectorAll("[data-pln]").forEach(b=>b.onclick=()=>{sel=all[+b.dataset.pln];inp.value=shortName(sel);list()})};
 inp.oninput=()=>{sel="";list()};list();o.querySelector("#pkplc").onclick=()=>o.remove();
 const save=async up=>{o.remove();try{await db.doc("pack/"+p.id).update(up);toast("Projektleiter geändert: "+(shortName(up.pl)||"–"),1)}catch(e){console.error(e);errBox("Speichern fehlgeschlagen"+(typeof sbErr==="function"?sbErr(e):"")+". Hast du das Recht „Packlisten hochladen“?")}};
 const br=o.querySelector("#pkplr");if(br)br.onclick=()=>save({pl:p.plo,plo:null});
 o.querySelector("#pkplo").onclick=()=>{const n=(sel&&inp.value===shortName(sel)?sel:inp.value).trim().replace(/\s+/g," ");if(!n)return errBox("Bitte einen Namen wählen oder eintippen.");if(same(n,p.pl)&&(n===p.pl||!man)){o.remove();return}
  if(man&&same(n,p.plo))return save({pl:p.plo,plo:null});save({pl:n,plo:man?p.plo:(p.pl||"")})};
 setTimeout(()=>inp.focus(),30)}
document.addEventListener("click",ev=>{const t=ev.target.closest&&ev.target.closest("[data-plch]");if(!t)return;ev.preventDefault();ev.stopPropagation();const p=packs.find(x=>x.id===t.dataset.plch);if(p)pkPlDlg(p)},true);
/* 1.154: Retourschein direkt aus der Packliste anlegen (Recht ret_b, auch vor dem Herrichten – Jürgen, 10.11.). Offener Schein da → fragen. */
function pkNewRet(p){const P=pkRoot(p)||p,R=(typeof pkRets==="function"?pkRets(P):[]).filter(r=>!r.closed);
 const neu=()=>{if(typeof rs!=="undefined"&&rs&&rs.id&&typeof rPersist==="function")rPersist(true);rs={id:null,ev:P.ev||"",ord:P.ord||"",items:{},rem:"",lvl:"groups",g:null,u:null};go("retedit")};
 if(!R.length)return neu();const o=document.createElement("div");o.className="ov";
 o.innerHTML='<div class="card" style="width:100%;max-width:420px;margin:0"><b>Es gibt schon einen offenen Retourschein</b><p class="mute" style="margin:6px 0 10px">'+esc(P.ev||"")+' · Auftrag '+esc(P.ord||"–")+'</p>'+R.map(r=>'<button class="btn" type="button" data-pnro="'+esc(r.id)+'" style="margin-top:6px">Offenen öffnen'+(R.length>1?' – '+esc(fmt(r.t||0).slice(0,6)):'')+'</button>').join("")+'<button class="btn ghost" type="button" id="pnrn" style="margin-top:8px">Trotzdem neuen anlegen</button><button class="btn ghost" type="button" id="pnrx" style="margin-top:8px">Abbrechen</button></div>';
 document.body.appendChild(o);o.querySelectorAll("[data-pnro]").forEach(b=>b.onclick=()=>{o.remove();curRet=b.dataset.pnro;go("retopen")});o.querySelector("#pnrn").onclick=()=>{o.remove();neu()};o.querySelector("#pnrx").onclick=()=>o.remove()}
