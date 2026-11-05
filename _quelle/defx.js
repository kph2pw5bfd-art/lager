/* ===== 1.122 – Defekte schneller melden (Jürgen, 5.11.; Entwurf https://claude.ai/artifact/CfJLc8YRezZnoUsn9DmLYR)
   Teil A – Formular „Defekt melden“ / „Bearbeiten“ (dxForm):
   · Karte VERANSTALTUNG steht vor ARTIKEL, neuer Knopf „QR scannen“ (Gitterbox-Etikett TPC:<Auftrag>, wie 1.121)
   · Artikel aus der Packliste der Veranstaltung als Knöpfe (Packschein + Zusätze, ohne Fremdmiete, Reihenfolge Artikelliste)
   · Vorschläge beim Tippen aus der Artikelliste (Name + Nummer, Wörter in beliebiger Reihenfolge), Nummer wird mit eingetragen
   · Stückzahl (Feld n, Jürgen: „eine Meldung mit Stückzahl“), Standard 1
   · nach dem Absenden „+ Nächster Defekt von dieser Veranstaltung“ (Veranstaltung/Auftrag bleiben stehen, dxKeep)
   Teil B – Retourschein-Zahlenfeld: Zeile „davon defekt“ (jeder, der zählen darf). Pro Schein + Artikel EINE Meldung mit
   Stückzahl (Felder ret, rnr). Auf 0 → Rückfrage „löschen?“; ohne Recht Defekte-Löschen wird sie als gelöscht markiert (del).
   Kein SQL nötig. ===== */
(function(){try{const st=document.createElement("style");st.textContent=
'.dxrow{display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-bottom:12px}.dxrow .btn{margin:0!important;display:flex;align-items:center;justify-content:center;gap:8px;min-width:0}'+
'.dxchips{display:flex;flex-wrap:wrap;gap:6px;margin:2px 0 10px}.dxchip{border:1px solid var(--line);background:var(--card);color:var(--ink);border-radius:999px;padding:7px 11px;font:inherit;font-size:14px;cursor:pointer;min-height:38px;text-align:left}.dxchip small{color:var(--mute);font-size:12px;margin-left:5px}.dxchip.on{background:var(--navy);border-color:var(--navy);color:#fff}.dxchip.on small{color:#dbe6f7}'+
'.dxhint{font-size:13.5px;color:var(--mute);margin:0 0 8px}.dxwrap{position:relative}.dxsug{position:absolute;left:0;right:0;top:100%;margin-top:-6px;z-index:20;background:var(--card);border:1px solid var(--line);border-radius:8px;box-shadow:0 8px 22px rgba(0,0,0,.18);max-height:300px;overflow:auto}'+
'.dxsug button{display:flex;justify-content:space-between;gap:10px;width:100%;text-align:left;background:none;border:0;border-top:1px solid var(--line);padding:10px 12px;font:inherit;font-size:15px;color:var(--ink);cursor:pointer}.dxsug button:first-child{border-top:0}.dxsug button small{color:var(--mute);white-space:nowrap;font-variant-numeric:tabular-nums}.dxsug .dxg{background:var(--bg);font-size:12px;font-weight:700;color:var(--mute);padding:5px 12px}.dxsug b{color:var(--navy)}'+
'.dxq{display:flex;align-items:center;justify-content:space-between;gap:10px;margin:2px 0 6px}.dxq .fmqs b{min-width:56px}'+
'.dxlock{display:flex;justify-content:space-between;align-items:center;gap:10px;background:var(--bg);border:1.5px solid var(--navy);border-radius:8px;padding:10px 12px}.dxlock b{display:block}.dxlock small{color:var(--mute);font-size:13px}.dxlock button{background:none;border:0;color:var(--navy);font:inherit;font-weight:700;cursor:pointer;padding:6px}'+
'.dxok{background:var(--okbg,#e3f3e8);border:1.5px solid #1e9e55;border-radius:10px;padding:12px;margin-bottom:10px}.dxok b{color:#1e7a46;font-size:17px;display:block}'+
'.dxli{border-left:5px solid #c0392b;background:var(--card);border-top:1px solid var(--line);border-right:1px solid var(--line);border-bottom:1px solid var(--line);border-radius:6px;padding:8px 10px;margin-bottom:6px}.dxli small{display:block;color:var(--mute)}'+
'.dxpad{display:flex;align-items:center;justify-content:space-between;gap:10px;background:#fdecea;color:#7a0f08;border-radius:10px;padding:8px 10px;margin:10px 0 0}.dxpad b{font-size:15px}.dxpad small{display:block;font-size:12.5px;opacity:.85;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;max-width:46vw}.dxpad .fmqs{background:#fff;border-color:#e3a59f}.dxpad .fmqs button{background:#fbe1de;color:#7a0f08;width:44px;height:40px;font-size:20px}.dxpad .fmqs b{min-width:40px}'+
'.dxdt{display:inline-block;align-self:flex-start;background:#fdecea;color:#a3150b;border:1.5px solid #c0392b;border-radius:999px;font-size:11.5px;font-weight:800;padding:1px 8px;margin-top:4px}'+
'.dxret{display:flex;gap:10px;align-items:center;justify-content:space-between;background:#fdecea;color:#7a0f08;border-left:5px solid #c0392b;border-radius:8px;padding:10px 12px;margin-bottom:10px;font-size:14.5px}.dxret button{background:none;border:0;color:inherit;font:inherit;font-weight:700;cursor:pointer;white-space:nowrap}'+
'.dxst{background:var(--line);border-radius:10px;padding:2px 9px;font-size:13px;font-weight:700;white-space:nowrap}'+
'@media (prefers-color-scheme:dark){:root:not([data-theme="light"]) .dxpad,:root:not([data-theme="light"]) .dxret,:root:not([data-theme="light"]) .dxdt{background:#3d1512;color:#ffd2ca}:root:not([data-theme="light"]) .dxpad .fmqs{background:#1d2633;border-color:#6b2a24}:root:not([data-theme="light"]) .dxpad .fmqs button{background:#4a1612;color:#ffd2ca}:root:not([data-theme="light"]) .dxok b,:root:not([data-theme="light"]) .dxsug b,:root:not([data-theme="light"]) .dxlock button{color:#8fd3a8}:root:not([data-theme="light"]) .dxsug b,:root:not([data-theme="light"]) .dxlock button{color:#8fb0ea}}'+
':root[data-theme="dark"] .dxpad,:root[data-theme="dark"] .dxret,:root[data-theme="dark"] .dxdt{background:#3d1512;color:#ffd2ca}:root[data-theme="dark"] .dxsug b,:root[data-theme="dark"] .dxlock button{color:#8fb0ea}:root[data-theme="dark"] .dxok b{color:#8fd3a8}';
document.head.appendChild(st)}catch(e){}})();

const dxNorm=s=>String(s||"").toLowerCase().replace(/[‐‑‒–—―−\-_/]+/g," ").replace(/[^0-9a-zäöüß]+/g," ").replace(/\s+/g," ").trim();
const dxQ=d=>Math.max(1,parseInt(d&&d.n,10)||1);
let dxKeep=null;
/* Packliste zur Veranstaltung / Auftragsnummer */
function dxPackFor(ev,ord){try{if(typeof packs==="undefined"||!packs.length)return null;
 if(ord&&typeof abgPackOf==="function"){const p=abgPackOf(ord);if(p)return p}
 const e=dxNorm(ev);if(!e)return null;const L=packs.filter(p=>!p._z&&dxNorm(p.ev)===e);if(!L.length)return null;
 const day=p=>typeof pkHDay==="function"?pkHDay(p)||0:0;L.sort((a,b)=>day(b)-day(a));
 const p=L.find(p=>typeof pkState!=="function"||pkState(p).k!=="done")||L[0];return typeof pkRoot==="function"?pkRoot(p):p}catch(e){return null}}
/* Artikel der Packliste, zusammengefasst, ohne Fremdmiete */
function dxPackArts(p){if(!p||typeof pkItems!=="function")return [];const M={};
 pkItems(p).forEach(o=>{const x=o.x||{},q=(+x.n||0)-(+x.f||0);if(q<=0)return;const c=typeof artCode==="function"?artCode(x.a):"",nmx=typeof pkName==="function"?pkName(x):(x.t||""),k=c||"n:"+dxNorm(nmx);if(!nmx)return;
  const g=M[k]=M[k]||{name:nmx,nr:c,q:0,u:x.u||"Stk"};g.q+=q});
 const K=typeof rKat==="function"?rKat():[],ix=a=>{const i=a.nr?K.findIndex(k=>artCode(k.nr)===a.nr):-1;return i<0?1e6:i};
 return Object.values(M).sort((a,b)=>ix(a)-ix(b))}
/* schon gemeldete Stück zu dieser Veranstaltung + Artikel (offen) */
function dxReported(ev,ord,name){const o=typeof pkDig==="function"?pkDig(ord):String(ord||"").replace(/\D/g,""),e=dxNorm(ev),a=dxNorm(name);
 return (typeof defs!=="undefined"?defs:[]).filter(d=>!d.done&&!d.del&&dxNorm(d.art)===a&&((o&&String(d.ord||"").replace(/\D/g,"")===o)||(!o&&e&&dxNorm(d.ev)===e))).reduce((s,d)=>s+dxQ(d),0)}
/* Vorschläge aus der Artikelliste */
function dxSuggest(q,packArts){const T=dxNorm(q).split(" ").filter(Boolean);if(!T.length)return [];
 const hit=s=>{const h=" "+dxNorm(s)+" ";return T.every(t=>h.includes(t))};
 const seen={},A=[],B=[];(packArts||[]).forEach(a=>{if(hit(a.name+" "+(a.nr||""))){seen[dxNorm(a.name)]=1;A.push({name:a.name,nr:a.nr,pk:1})}});
 (typeof rKat==="function"?rKat():[]).forEach(k=>{if(!k||!k.name||seen[dxNorm(k.name)])return;if(hit(k.name+" "+(k.nr||""))){seen[dxNorm(k.name)]=1;B.push({name:k.name,nr:artCode(k.nr)||""})}});
 return {A:A.slice(0,6),B:B.slice(0,10-Math.min(6,A.length))}}
function dxMark(name,q){let s=esc(name);dxNorm(q).split(" ").filter(t=>t.length>1).forEach(t=>{try{s=s.replace(new RegExp("("+t.replace(/[.*+?^${}()|[\]\\]/g,"\\$&")+")","i"),"<b>$1</b>")}catch(e){}});return s}
function dxQty(p){const e=document.getElementById(p+"n");return Math.max(1,parseInt(e&&e.dataset.v,10)||1)}

/* ---------- Teil A: Formular ---------- */
function dxForm(p,d){const g=id=>document.getElementById(p+id);const fa=g("art"),fn=g("nr"),fe=g("ev"),fo=g("ord");if(!fa||!fe||fa._dx)return;fa._dx=1;
 const cA=fa.closest(".card"),cE=fe.closest(".card");if(cA&&cE&&cA!==cE)cA.parentNode.insertBefore(cE,cA);
 /* QR-Knopf neben „Etikett fotografieren“ */
 const lab=g("lab");if(lab&&!g("qr")){const row=document.createElement("div");row.className="dxrow";lab.parentNode.insertBefore(row,lab);
  row.innerHTML='<button class="btn" id="'+p+'qr" type="button"><svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><path d="M14 14h3v3h-3zM20 14v.01M14 20h.01M17 20h4v-3"/></svg>QR scannen</button>';row.appendChild(lab);
  g("qr").onclick=()=>rScanCam(raw=>dxQrHit(p,raw))}
 /* Veranstaltung bleibt beim nächsten Defekt stehen */
 if(p==="dn"&&dxKeep){fe.value=dxKeep.ev||"";if(fo)fo.value=dxKeep.ord||"";const box=document.createElement("div");box.className="dxlock";box.id="dnlock";
  box.innerHTML='<span><b>'+esc(dxKeep.ev||"–")+'</b><small>'+(dxKeep.ord?'Auftrag '+esc(dxKeep.ord)+' · ':'')+'bleibt für den nächsten Defekt stehen</small></span><button type="button" id="dnunlock">Ändern</button>';
  const kids=[...cE.children].filter(x=>!x.classList.contains("dsh"));kids.forEach(x=>{x.dataset.dxh=x.hidden?"1":"";x.hidden=true});cE.appendChild(box);
  g("unlock").onclick=()=>{box.remove();kids.forEach(x=>x.hidden=x.dataset.dxh==="1")};dxKeep=null}
 /* Stückzahl */
 if(fn&&!g("n")){const w=document.createElement("div");w.className="dxq";let v=d?dxQ(d):1;
  w.innerHTML='<label class="mute" style="margin:0">Stückzahl</label><span class="fmqs" id="'+p+'n" data-v="'+v+'"><button type="button" aria-label="Weniger">−</button><b>'+v+' Stk</b><button type="button" aria-label="Mehr">+</button></span>';
  fn.insertAdjacentElement("afterend",w);const s=g("n"),bs=s.querySelectorAll("button"),set=x=>{v=Math.max(1,Math.min(999,x));s.dataset.v=v;s.querySelector("b").textContent=v+" Stk"};bs[0].onclick=()=>set(v-1);bs[1].onclick=()=>set(v+1)}
 /* Packlisten-Knöpfe */
 const chips=document.createElement("div");chips.id=p+"chips";const lbl=fa.previousElementSibling;(lbl&&lbl.tagName==="LABEL"?lbl:fa).insertAdjacentElement("beforebegin",chips);
 let PA=[],key="";
 const pick=(name,nr)=>{fa.value=name;fa.classList.remove("bad");if(fn&&nr!==undefined){const old=fn.value.trim();if(!(old&&nr&&artCode(old.split(/[\s\-‐‑‒–—―−]+/)[0])===nr))fn.value=nr||""}sug.hidden=true;paint()};
 const paint=()=>{const ev=fe.value.trim(),ord=fo?fo.value.trim():"";if(!PA.length){chips.innerHTML=ev?'<p class="dxhint">Keine Packliste zu dieser Veranstaltung gefunden – Artikel unten suchen.</p>':'<p class="dxhint">Zuerst die Veranstaltung wählen – dann stehen hier die Artikel aus der Packliste.</p>';return}
  const cur=dxNorm(fa.value);
  chips.innerHTML='<div class="mute" style="font-size:13px;margin-bottom:4px">Aus der Packliste antippen:</div><div class="dxchips">'+PA.map((a,i)=>{const r=dxReported(ev,ord,a.name)-(d&&dxNorm(d.art)===dxNorm(a.name)&&!d.done?dxQ(d):0);return '<button type="button" class="dxchip'+(dxNorm(a.name)===cur?' on':'')+'" data-dxc="'+i+'">'+esc(a.name)+'<small>'+(typeof pkNum==="function"?pkNum(a.q):a.q)+' '+esc(a.u||"Stk")+(r>0?' · '+r+' gemeldet':'')+'</small></button>'}).join("")+'</div>';
  chips.querySelectorAll("[data-dxc]").forEach(b=>b.onclick=()=>{const a=PA[+b.dataset.dxc];pick(a.name,a.nr||"")})};
 const refresh=()=>{const ev=fe.value.trim(),ord=fo?fo.value.trim():"",k=ev+"|"+ord;if(k===key)return;key=k;
  const P=dxPackFor(ev,ord);PA=dxPackArts(P);
  if(P&&fo&&!ord&&P.ord&&dxNorm(P.ev)===dxNorm(ev)){fo.value=P.ord;key=ev+"|"+P.ord}
  if(P&&!ev&&P.ev){fe.value=P.ev;fe.classList.remove("bad");key=P.ev+"|"+(fo?fo.value.trim():"")}
  paint()};
 /* Vorschläge */
 const wrap=document.createElement("div");wrap.className="dxwrap";fa.parentNode.insertBefore(wrap,fa);wrap.appendChild(fa);
 const sug=document.createElement("div");sug.className="dxsug";sug.hidden=true;sug.setAttribute("role","listbox");wrap.appendChild(sug);fa.setAttribute("autocomplete","off");
 fa.placeholder="Name oder Nummer tippen, z. B. 125 Maxi";
 const showSug=()=>{const q=fa.value.trim();if(q.length<2){sug.hidden=true;return}const R=dxSuggest(q,PA);if(!R.A.length&&!R.B.length){sug.hidden=true;return}
  sug.innerHTML=(R.A.length?'<div class="dxg">In der Packliste</div>'+R.A.map((a,i)=>'<button type="button" data-dxs="A'+i+'"><span>'+dxMark(a.name,q)+'</span><small>'+esc(a.nr||"–")+'</small></button>').join(""):'')+
   (R.B.length?'<div class="dxg">Artikelliste</div>'+R.B.map((a,i)=>'<button type="button" data-dxs="B'+i+'"><span>'+dxMark(a.name,q)+'</span><small>'+esc(a.nr||"–")+'</small></button>').join(""):'');
  sug.hidden=false;sug.querySelectorAll("[data-dxs]").forEach(b=>{b.onmousedown=e=>e.preventDefault();b.onclick=()=>{const s=b.dataset.dxs,a=R[s[0]][+s.slice(1)];pick(a.name,a.nr||"")}})};
 fa.addEventListener("input",()=>{showSug();paint()});fa.addEventListener("focus",showSug);
 fa.addEventListener("blur",()=>setTimeout(()=>{sug.hidden=true;if(fn&&!fn.value.trim()){const k=(typeof rKat==="function"?rKat():[]).find(x=>dxNorm(x.name)===dxNorm(fa.value));if(k)fn.value=artCode(k.nr)||""}},180));
 fa.addEventListener("keydown",e=>{if(e.key==="Escape")sug.hidden=true});
 fe.addEventListener("input",refresh);fe.addEventListener("change",refresh);if(fo){fo.addEventListener("input",refresh);fo.addEventListener("change",refresh)}
 /* Etikett-Foto / Scan setzen Werte ohne Ereignis → kurz nachsehen, solange das Formular offen ist */
 const tm=setInterval(()=>{if(!document.body.contains(fe))return clearInterval(tm);refresh();if(dxNorm(fa.value)!==fa._lv){fa._lv=dxNorm(fa.value);paint()}},600);
 dxEvSug(fe,fo);
 refresh()}
function dxQrHit(p,raw){const r=typeof gbParse==="function"?gbParse(raw):{bad:true};
 if(!r.ord){beep(false);return errBox(r.old?"Altes Etikett – der QR-Code zeigt nur auf die Homepage. Bitte „Etikett fotografieren“ verwenden.":"Kein Gitterbox-Etikett erkannt. Bitte „Etikett fotografieren“ verwenden.")}
 const fe=document.getElementById(p+"ev"),fo=document.getElementById(p+"ord");if(!fe)return;beep(true);
 const P=dxPackFor("",r.ord),R=(typeof rets!=="undefined"?rets:[]).find(x=>rNorm(x.ord)===rNorm(r.ord)),ev=(P&&P.ev)||(R&&R.ev)||"";
 if(fo)fo.value=r.ord;if(ev){fe.value=ev;fe.classList.remove("bad");toast("Auftrag "+r.ord+" · "+ev,1)}else{errBox("Auftrag "+r.ord+" erkannt, aber keine Packliste dazu gefunden. Bitte die Veranstaltung eintragen.");setTimeout(()=>fe.focus(),300)}
 fe.dispatchEvent(new Event("change"))}
/* nach dem Absenden: Bestätigung + „Nächster Defekt“ (verstecktes #dnart hält draw() vom Neuzeichnen ab) */
function dxDone(o){const ev=o.ev||"",ord=o.ord||"",e=dxNorm(ev),od=String(ord).replace(/\D/g,""),t0=new Date();t0.setHours(0,0,0,0);
 const L=(typeof defs!=="undefined"?defs:[]).filter(d=>!d.del&&d.t>=+t0&&(od?String(d.ord||"").replace(/\D/g,"")===od:dxNorm(d.ev)===e));
 if(o.id&&!L.some(d=>d.id===o.id))L.unshift({id:o.id,art:o.art,n:o.n,desc:o.desc,by:me,t:Date.now(),urg:o.urg});L.sort((a,b)=>b.t-a.t);
 $("#t").textContent="Defekt gemeldet";
 $("#app").innerHTML=nav()+'<input id="dnart" hidden><div class="dxok"><b>✓ Defekt gemeldet</b>'+(o.n>1?o.n+' × ':'')+esc(o.art)+(o.desc?' – '+esc(o.desc):'')+'</div>'+
  '<button class="btn" id="dxnext" type="button" style="margin-bottom:10px">+ Nächster Defekt von dieser Veranstaltung</button><button class="btn ghost" id="dxfin" type="button" style="margin-bottom:16px">Fertig</button>'+
  '<div class="mute" style="margin-bottom:6px">Von '+esc(ev||"–")+' heute gemeldet ('+L.reduce((s,d)=>s+dxQ(d),0)+' Stk):</div>'+L.map(d=>'<div class="dxli"><b>'+(dxQ(d)>1?dxQ(d)+' × ':'')+esc(d.art)+'</b>'+(d.urg?' <span class="tag" style="background:#7a0f08;color:#fff">DRINGEND</span>':'')+'<small>'+(d.desc?esc(d.desc)+' · ':'')+esc(nmA(d,"by"))+' · '+fmt(d.t).slice(-5)+'</small></div>').join("");
 bindNav();window.scrollTo(0,0);
 $("#dxnext").onclick=()=>{dxKeep={ev,ord};dpho=null;defNewView();window.scrollTo(0,0)};
 $("#dxfin").onclick=()=>{df="alle";view="def";draw()}}

/* ---------- Teil B: Retourschein „davon defekt“ ---------- */
const dxRetDefs=(rid,nr)=>rid?(typeof defs!=="undefined"?defs:[]).filter(d=>!d.del&&d.ret===rid&&(nr===undefined||d.rnr===nr)):[];
const dxRetN=(rid,nr)=>dxRetDefs(rid,nr).reduce((s,d)=>s+dxQ(d),0);
const dxMayEdit=d=>d.by===me||can("def_b");
function dxPadRow(a){const n=rs?dxRetN(rs.id,a.nr):0,L=rs?dxRetDefs(rs.id,a.nr):[],ds=L.map(d=>d.desc).filter(Boolean).join(" · ");
 return '<div class="dxpad" id="dxpad"><span><b>davon defekt</b>'+(n?'<small>'+(ds?esc(ds):'gemeldet – ohne Beschreibung')+'</small>':'<small>geht gleich an die Werkstatt</small>')+'</span><span class="fmqs"><button type="button" id="dxm" aria-label="Ein defektes Stück weniger">−</button><b id="dxn">'+n+'</b><button type="button" id="dxp" aria-label="Ein defektes Stück mehr">+</button></span></div>'}
function dxPadBind(o,a){const row=o.querySelector("#dxpad");if(!row||!rs)return;
 const redo=()=>{const x=o.querySelector("#dxpad");if(x){x.outerHTML=dxPadRow(a);dxPadBind(o,a)}};
 row.querySelector("#dxp").onclick=async()=>{const open=dxRetDefs(rs.id,a.nr).find(d=>!d.done);
  if(open){if(!dxMayEdit(open))return errBox("Diese Meldung hat jemand anderer angelegt. Ändern kann sie nur die Werkstatt.");try{await db.doc("defekte/"+open.id).update({n:dxQ(open)+1,edT:Date.now()});open.n=dxQ(open)+1;redo();toast("Defekt: "+open.n+" Stk "+a.name,1)}catch(e){toast("Speichern fehlgeschlagen. Bitte nochmal versuchen.")}return}
  dxDefDlg(a,()=>{redo();if(typeof retEdit==="function"&&view==="retedit")dxRetTiles()})};
 row.querySelector("#dxm").onclick=()=>{const L=dxRetDefs(rs.id,a.nr),open=L.find(d=>!d.done);
  if(!L.length)return;if(!open)return toast("Schon repariert – bitte in den Defekten ändern.");if(!dxMayEdit(open))return errBox("Diese Meldung hat jemand anderer angelegt. Ändern kann sie nur die Werkstatt.");
  if(dxQ(open)>1){db.doc("defekte/"+open.id).update({n:dxQ(open)-1,edT:Date.now()}).then(()=>{open.n=dxQ(open)-1;redo()}).catch(()=>toast("Speichern fehlgeschlagen. Bitte nochmal versuchen."));return}
  ask2("Defektmeldung „"+a.name+"“ löschen?","Löschen","Behalten",async()=>{try{await dxDel(open);redo();dxRetTiles();toast("Defektmeldung gelöscht",1)}catch(e){toast("Löschen fehlgeschlagen. Bitte nochmal versuchen.")}},()=>{})}}
async function dxDel(d){if(can("def_l")){await db.doc("defekte/"+d.id).delete();try{for(let k=0;k<(d.fn||0);k++)await db.doc("fotos/"+d.id+"-"+k).delete()}catch(e){}}
 else await db.doc("defekte/"+d.id).update({del:true,delBy:me,delT:Date.now()});d.del=true;if(typeof defs!=="undefined")defs=defs.filter(x=>x.id!==d.id)}
function dxDefDlg(a,done){const o=document.createElement("div");o.className="ov";o.style.zIndex="60";let fot=[];const code=artCode(String(a.nr||"").split(/[-–]/)[0])||"";
 o.innerHTML='<div class="card" style="width:100%;max-width:440px;margin:0;max-height:92vh;overflow:auto"><b style="font-size:18px">Defekt: '+esc(a.name)+'</b><div class="mute" style="margin-bottom:8px">'+esc(rs.ev||"–")+(rs.ord?' · Auftrag '+esc(rs.ord):'')+(code?' · Nr. '+esc(code):'')+'</div>'+
  '<label class="mute" for="dxds">Was ist kaputt? (optional)</label><textarea id="dxds" placeholder="Kurz beschreiben – oft reicht das Foto"></textarea>'+
  '<label style="display:flex;gap:8px;align-items:center;margin:4px 0 10px"><input type="checkbox" id="dxu" style="width:auto;margin:0">Dringend</label>'+
  '<label style="display:flex;gap:8px;align-items:center;margin:0 0 6px"><input type="checkbox" id="dxfv" style="width:auto;margin:0">Fremdverschulden</label><div id="dxfvb" hidden><label class="mute" for="dxfvw">Wer / wie? (optional)</label><input id="dxfvw" autocomplete="off" placeholder="z. B. Bühnenbauer mit Stapler drübergefahren"></div>'+
  '<button class="btn ghost" id="dxph" type="button">Foto aufnehmen</button><input id="dxpf" type="file" accept="image/*" capture="environment" hidden><div id="dxpv" class="thr"></div>'+
  '<div style="display:grid;gap:8px;margin-top:8px"><button class="btn" id="dxok" type="button">Defekt melden</button><button class="btn ghost" id="dxlater" type="button">Später beschreiben</button><button class="btn ghost" id="dxx" type="button">Abbrechen</button></div></div>';
 document.body.appendChild(o);const q=s=>o.querySelector(s);
 q("#dxfv").onchange=()=>{q("#dxfvb").hidden=!q("#dxfv").checked;if(q("#dxfv").checked)q("#dxfvw").focus()};
 q("#dxph").onclick=()=>q("#dxpf").click();
 q("#dxpf").onchange=async e=>{const f=e.target.files[0];e.target.value="";if(!f)return;if(fot.length>=6)return toast("Maximal 6 Fotos.");try{fot.push(await shrink(f));showTh("dxpv",fot,"dxph")}catch(x){toast("Foto konnte nicht gelesen werden.")}};
 q("#dxx").onclick=()=>o.remove();
 const save=async full=>{const bs=o.querySelectorAll("button");bs.forEach(b=>b.disabled=true);if(!rs.id&&typeof rNewId==="function")rs.id=rNewId();
  const id=Date.now().toString(36)+Math.random().toString(36).slice(2,5),fv=full&&q("#dxfv").checked;
  try{const fn=full?await savePhotos(id,fot):0;const doc={art:a.name,anr:code,ev:String(rs.ev||"").trim(),ord:String(rs.ord||"").trim(),n:1,ret:rs.id,rnr:a.nr,desc:full?q("#dxds").value.trim():"",by:me,...tabAs("by"),t:Date.now(),done:false,urg:full&&q("#dxu").checked,fv,fvw:fv?q("#dxfvw").value.trim():"",fn,foto:fn>0};
   await db.doc("defekte/"+id).set(doc);if(typeof defs!=="undefined"&&!defs.some(x=>x.id===id))defs=[{id,...doc},...defs];o.remove();toast("Defekt gemeldet: "+a.name,1);done&&done()}
  catch(x){bs.forEach(b=>b.disabled=false);toast("Senden fehlgeschlagen. Bitte nochmal versuchen.")}};
 q("#dxok").onclick=()=>save(true);q("#dxlater").onclick=()=>save(false)}
/* Schild „n defekt“ auf den Kacheln beim Zählen */
function dxRetTiles(){if(!rs||!rs.id)return;document.querySelectorAll(".rtile[data-ra]").forEach(b=>{const n=dxRetN(rs.id,b.dataset.ra),ex=b.querySelector(".dxdt");if(ex)ex.remove();if(n)b.insertAdjacentHTML("beforeend",'<span class="dxdt">'+n+' defekt</span>')})}
/* Retourschein ansehen: Streifen „n Defekte gemeldet“ */
function dxRetOpen(){const ex=document.getElementById("dxret");if(ex)ex.remove();if(view!=="retopen")return;const L=dxRetDefs(curRet);if(!L.length)return;
 const n=L.reduce((s,d)=>s+dxQ(d),0),el=document.createElement("div");el.className="dxret";el.id="dxret";
 el.innerHTML='<span><b>'+n+' Stk defekt gemeldet</b> von diesem Retourschein<br><small>'+L.map(d=>esc((dxQ(d)>1?dxQ(d)+' × ':'')+d.art)).join(", ")+'</small></span>'+(can("def_s")||L.every(d=>d.by===me)?'<button type="button" id="dxreta">Ansehen ›</button>':'');
 const app=document.getElementById("app"),c=app&&app.querySelector(".card");if(!c)return;c.insertAdjacentElement("beforebegin",el);
 const b=document.getElementById("dxreta");if(b)b.onclick=()=>{if(L.length===1){curDef=L[0].id;go("defopen")}else{df="alle";go("def")}}}
/* Mail-Text und Excel */
function dxRetMail(r){const L=dxRetDefs(r&&r.id);if(!L.length)return "";return "\nDefekt zurückgekommen: "+L.map(d=>dxQ(d)+" Stk "+d.art+(d.desc?" ("+d.desc+")":"")).join("; ")}
function dxRetXl(r,nr){const n=dxRetN(r&&r.id,nr);return n||null}
/* Defekt ansehen: Zeile Stückzahl + Herkunft Retourschein */
function dxDefLines(d){let h='';if(dxQ(d)>1)h+='<div class="mute">Stückzahl: <b>'+dxQ(d)+' Stk</b></div>';
 if(d.ret){const r=(typeof rets!=="undefined"?rets:[]).find(x=>x.id===d.ret);h+='<div class="mute">Gemeldet beim Zählen'+(r&&can("ret_s")?' – <a href="#" data-dxr="'+esc(d.ret)+'" style="color:var(--navy);font-weight:600">Retourschein öffnen</a>':'')+'</div>'}
 setTimeout(()=>document.querySelectorAll("[data-dxr]").forEach(a=>a.onclick=e=>{e.preventDefault();curRet=a.dataset.dxr;go("retopen")}),0);return h}

/* ===== 1.123 – Veranstaltung / Auftragsnummer vorschlagen (Jürgen, 5.11.: „Wenn ich kein Etikett auf der Box habe“; gewählt:
   laufende Aufträge zuerst, darunter Erledigte; auch im Retourschein). Quellen: Packlisten, Retourscheine, frühere Defekte.
   Ein Auftrag = eine Zeile (Schlüssel Auftragsnummer, nur Ziffern); Antippen füllt Veranstaltung UND Auftragsnummer. ===== */
(function(){try{const st=document.createElement("style");st.textContent=
'.dxsug .dxev{display:flex;flex-direction:column;align-items:stretch;gap:2px}.dxev .dxevt{display:flex;justify-content:space-between;gap:8px;align-items:baseline}.dxev .dxevt span{font-weight:600}.dxev small{white-space:normal!important}'+
'.dxst.warn{background:#fdecea;color:#a3150b}.dxst.hot{background:#fff1e0;color:#8a4300}.dxst.ok{background:#e3f3e8;color:#1f6b41}.dxst.run{background:#e8f0fb;color:#0b3570}'+
'@media (prefers-color-scheme:dark){:root:not([data-theme="light"]) .dxst.warn{background:#4a1612;color:#ffb4a8}:root:not([data-theme="light"]) .dxst.hot{background:#3a2610;color:#ffcf99}:root:not([data-theme="light"]) .dxst.ok{background:#16402a;color:#9fe0b8}:root:not([data-theme="light"]) .dxst.run{background:#16294a;color:#c7dbff}}'+
':root[data-theme="dark"] .dxst.warn{background:#4a1612;color:#ffb4a8}:root[data-theme="dark"] .dxst.hot{background:#3a2610;color:#ffcf99}:root[data-theme="dark"] .dxst.ok{background:#16402a;color:#9fe0b8}:root[data-theme="dark"] .dxst.run{background:#16294a;color:#c7dbff}';
document.head.appendChild(st)}catch(e){}})();
const dxDig=s=>String(s||"").replace(/\D/g,"");
const dxDM=t=>{if(!t)return "";const d=new Date(t);return String(d.getDate()).padStart(2,"0")+"."+String(d.getMonth()+1).padStart(2,"0")+"."};
/* alle bekannten Aufträge */
function dxOrders(){const M={},put=(ev,ord,o)=>{ev=String(ev||"").trim();ord=String(ord||"").trim();if(!ev&&!ord)return;const k=dxDig(ord)?"o:"+dxDig(ord):"e:"+dxNorm(ev);
  const x=M[k]=M[k]||{ev:"",ord:"",t:0};if(!x.ev&&ev)x.ev=ev;if(!x.ord&&ord)x.ord=ord;Object.assign(x,o||{},{t:Math.max(x.t||0,(o&&o.t)||0)});if(o&&o.p){x.ev=ev||x.ev;x.ord=ord||x.ord}};
 if(typeof packs!=="undefined")packs.forEach(p=>{if(p._z)return;let s=null;try{s=typeof pkState==="function"?pkState(p):null}catch(e){}
  put(p.ev,p.ord,{p:1,db:p.db,de:p.de,pl:p.pl,st:s,act:!!(s&&s.k!=="done"),t:p.de||p.db||p.t||0})});
 if(typeof rets!=="undefined")rets.forEach(r=>put(r.ev,r.ord,{t:r.modT||r.t||0,ret:1,rop:!r.closed}));
 if(typeof defs!=="undefined")defs.forEach(d=>put(d.ev,d.ord,{t:d.t||0}));
 /* ohne Packliste: offener Retourschein zählt als laufend */
 return Object.values(M).map(x=>(x.p?x:{...x,act:!!x.rop}))}
function dxOrdFind(q,mode){const T=dxNorm(q).split(" ").filter(Boolean),D=dxDig(q);if(!T.length)return [];
 const L=dxOrders().filter(x=>{if(mode==="ord"&&D.length>=2)return dxDig(x.ord).includes(D);const h=" "+dxNorm(x.ev+" "+x.ord)+" ";return T.every(t=>h.includes(t))||(D.length>=3&&dxDig(x.ord).includes(D))});
 const A=L.filter(x=>x.act).sort((a,b)=>(a.de||a.t||9e15)-(b.de||b.t||9e15)),B=L.filter(x=>!x.act).sort((a,b)=>(b.t||0)-(a.t||0));
 return {A:A.slice(0,8),B:B.slice(0,Math.max(3,8-A.length))}}
function dxStTag(x){const s=x.st;if(s)return '<span class="dxst '+({warn:"warn",hot:"hot",ok:"ok"}[s.c]||"run")+'">'+esc(s.k==="over"?"Dispo abgelaufen":s.l)+'</span>';return x.act?'<span class="dxst run">Retourschein offen</span>':''}
function dxEvSug(fe,fo,cb){if(!fe||fe._dxev)return;fe._dxev=1;fe.removeAttribute("list");
 const mk=inp=>{const w=document.createElement("div");w.className="dxwrap";inp.parentNode.insertBefore(w,inp);w.appendChild(inp);const s=document.createElement("div");s.className="dxsug";s.hidden=true;w.appendChild(s);inp.setAttribute("autocomplete","off");return s};
 const sE=mk(fe),sO=fo?mk(fo):null;
 const pick=x=>{fe.value=x.ev||fe.value;if(fo&&x.ord)fo.value=x.ord;fe.classList.remove("bad");sE.hidden=true;if(sO)sO.hidden=true;
  [fe,fo].forEach(i=>{if(i){i.dispatchEvent(new Event("input"));i.dispatchEvent(new Event("change"))}});cb&&cb(x)};
 const show=(inp,box,mode)=>{const q=inp.value.trim();if(q.length<2){box.hidden=true;return}const R=dxOrdFind(q,mode),all=[...R.A,...R.B];
  if(!all.length||(all.length===1&&dxNorm(all[0].ev)===dxNorm(fe.value)&&(!fo||dxDig(all[0].ord)===dxDig(fo.value)))){box.hidden=true;return}
  const row=(x,i)=>'<button type="button" class="dxev" data-dxo="'+i+'"><span class="dxevt"><span>'+dxMark(x.ev||"–",mode==="ord"?"":q)+'</span>'+dxStTag(x)+'</span><small>'+[x.ord?esc(x.ord):"ohne Auftragsnummer",x.db||x.de?"Dispo "+dxDM(x.db)+"–"+dxDM(x.de):"",x.pl?"PL "+esc(typeof shortName==="function"?shortName(x.pl):x.pl):""].filter(Boolean).join(" · ")+'</small></button>';
  box.innerHTML=(R.A.length?'<div class="dxg">Laufende Aufträge</div>'+R.A.map((x,i)=>row(x,i)).join(""):'')+(R.B.length?'<div class="dxg">Erledigt / älter</div>'+R.B.map((x,i)=>row(x,R.A.length+i)).join(""):'');
  box.hidden=false;box.querySelectorAll("[data-dxo]").forEach(b=>{b.onmousedown=e=>e.preventDefault();b.onclick=()=>pick(all[+b.dataset.dxo])})};
 const bind=(inp,box,mode)=>{inp.addEventListener("input",e=>{if(e.isTrusted!==false)show(inp,box,mode)});inp.addEventListener("focus",()=>show(inp,box,mode));inp.addEventListener("blur",()=>setTimeout(()=>box.hidden=true,180));inp.addEventListener("keydown",e=>{if(e.key==="Escape")box.hidden=true})};
 bind(fe,sE,"ev");if(fo)bind(fo,sO,"ord")}

/* ===== 1.124 – Suche + Scan in der Defekte-Liste, Erledigte eingeklappt (Jürgen, 5.11.: Norbert muss lange scrollen; gewählt: Scan ja, einklappen)
   Suche über Artikel, Nummer, Veranstaltung, Auftrag, Beschreibung, Fremdverschulden, Reparatur, gemeldet von (Wörter beliebig).
   Scan → Artikelnummer als Suche; genau EIN offener Treffer → öffnet ihn. Reiter „Alle“: Erledigte unter „Erledigte anzeigen (n)“;
   bei einer Suche werden Erledigte immer mit durchsucht und gezeigt. ===== */
(function(){try{const st=document.createElement("style");st.textContent=
'.dxdone{display:block;width:100%;margin:6px 0 10px;padding:12px 14px;border:1.5px dashed var(--line);border-radius:10px;background:none;color:var(--navy);font:inherit;font-weight:700;cursor:pointer;text-align:center}'+
'.dxhit{font-size:13.5px;color:var(--mute);margin:-2px 0 8px;display:flex;justify-content:space-between;gap:10px}.dxhit button{background:none;border:0;color:var(--navy);font:inherit;font-weight:700;cursor:pointer;padding:0}'+
'.dxdh{font-size:12px;font-weight:800;letter-spacing:.06em;text-transform:uppercase;color:var(--mute);margin:14px 0 6px}'+
'@media (prefers-color-scheme:dark){:root:not([data-theme="light"]) .dxdone,:root:not([data-theme="light"]) .dxhit button{color:#8fb0ea}}:root[data-theme="dark"] .dxdone,:root[data-theme="dark"] .dxhit button{color:#8fb0ea}';
document.head.appendChild(st)}catch(e){}})();
let dxDQ="",dxDoneOpen=false;
function dxDefHay(d){let who="";try{who=nmA(d,"by")}catch(e){}return dxNorm([d.art,d.anr,d.ev,d.ord,d.desc,d.fvw,d.rep,d.fb,who].filter(Boolean).join(" "))}
function dxDefMatch(d){const q=dxDQ.trim();if(!q)return true;const T=dxNorm(q).split(" ").filter(Boolean),h=" "+dxDefHay(d)+" ";if(T.length&&T.every(t=>h.includes(t)))return true;
 if(/^[A-Za-z0-9]{3,10}$/.test(q)){const c=artCode(q);if(!c)return false;if(artCode(String(d.anr||"").split(/[\s\-‐‑‒–—―−]+/)[0])===c)return true;const k=typeof art!=="undefined"&&art[c];if(k&&dxNorm(k.name)===dxNorm(d.art))return true}return false}
function dxDefSearch(){return '<div class="srow"><input id="dxdq" type="search" placeholder="Artikel, Nr., Veranstaltung" value="'+esc(dxDQ)+'" autocomplete="off" enterkeyhint="search"><button class="btn grey scb" id="dxdsc" type="button" aria-label="Artikel scannen und Defekte dazu zeigen" title="Artikel scannen"><svg width="24" height="20" viewBox="0 0 26 22" fill="none" stroke="currentColor" stroke-width="2.4" aria-hidden="true"><path d="M3 1v20M7 1v20M12 1v20M16 1v20M20 1v20M24 1v20"/></svg></button></div>'}
function dxDefRows(l,fn){const q=dxDQ.trim();let h="";
 if(q)h+='<div class="dxhit"><span>'+(l.length?l.length+' Treffer':'Keine Treffer für „'+esc(q)+'“')+'</span><button type="button" id="dxdqx">Suche löschen</button></div>';
 if(!l.length)return h+(q?'':'<div class="card mute">'+(df==="offen"?'Keine offenen Defekte.':'Keine Defekte gemeldet.')+'</div>');
 if(df!=="alle")return h+l.map(fn).join("");
 const O=l.filter(d=>!d.done),E=l.filter(d=>d.done);h+=O.length?O.map(fn).join(""):(q?'':'<div class="card mute">Keine offenen Defekte.</div>');
 if(!E.length)return h;
 if(q)return h+'<div class="dxdh">Erledigt ('+E.length+')</div>'+E.map(fn).join("");
 return h+(dxDoneOpen?'<button type="button" class="dxdone" id="dxdtog">Erledigte ausblenden ('+E.length+')</button>'+E.map(fn).join(""):'<button type="button" class="dxdone" id="dxdtog">Erledigte anzeigen ('+E.length+')</button>')}
function dxDefBind(foc){const i=document.getElementById("dxdq");if(!i)return;
 i.oninput=()=>{dxDQ=i.value;defView()};
 if(foc!==null&&foc!==undefined){i.focus();try{i.setSelectionRange(foc,foc)}catch(e){}}
 const x=document.getElementById("dxdqx");if(x)x.onclick=()=>{dxDQ="";defView()};
 const t=document.getElementById("dxdtog");if(t)t.onclick=()=>{dxDoneOpen=!dxDoneOpen;defView()};
 const s=document.getElementById("dxdsc");if(s)s.onclick=()=>rScanCam(dxDefScanHit)}
function dxDefScanHit(raw){const v=String(raw||"").trim(),m=v.match(CODE_RE),nr=m?m[1].toUpperCase():(v.split(/[\s\-‐‑‒–—―−]+/)[0]||"").toUpperCase(),c=artCode(nr)||nr;
 if(!c){beep(false);return errBox("Kein Code erkannt.")}
 dxDQ=c;const k=typeof art!=="undefined"&&art[c],nm=k?k.name:"Nr. "+c,open=vdefs().filter(d=>!d.done&&dxDefMatch(d));
 if(open.length===1){beep(true);curDef=open[0].id;go("defopen");toast("Offener Defekt: "+nm,1);return}
 if(df==="erledigt")df="alle";beep(!!open.length);defView();toast(open.length?open.length+" offene Defekte: "+nm:"Kein offener Defekt zu "+nm,1)}
