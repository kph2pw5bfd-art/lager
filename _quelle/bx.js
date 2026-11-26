/* ===== 1.193 – „Inhalt pro Box erfassen“ beim Herrichten (Jürgen 25.11., Entwurf https://claude.ai/artifact/MxTUj6mDhgHrBvmm1qF2qx, „Ja passt“)
   Normal herrichten bleibt Standard – nur ein Knopf in der Packliste. Danach: Art wählen (Große Box, Kleine Box, Palette, Runge, Sonstiges mit Namen),
   Nummern laufen über alles durch. Ist eine Box offen, fragt der Kreis „Wie viele in Box n?“ (Vorschlag = offener Rest); die Menge zählt auch als hergerichtet.
   „Box fertig“: Inhalt, Etikett „Mit Inhalt“ (Box/Palette/Runge vorgewählt) oder „Normales Etikett“ (Sonstiges mit einem Artikel), Anzahl,
   an die Druckstation / hier drucken / ohne Etikett → „Nächste Box?“. Gespeichert in packh: bx_<n> = {n,typ,nm,it:{<Positionsschlüssel>:Menge},by,t,done:{by,t}|null,et:{art,n,t}}.
   Geht ohne Netz wie das übrige Herrichten (pkHSet). ===== */
const BX_T={gb:"Große Box",kb:"Kleine Box",pal:"Palette",run:"Runge",son:"Sonstiges"};
(function(){try{const st=document.createElement("style");st.textContent=
'.bxstart{width:100%;min-height:48px;margin:-4px 0 12px;border:2.5px solid var(--navy);border-radius:12px;background:var(--card);color:var(--navy);font:inherit;font-weight:800;font-size:15px;display:flex;align-items:center;justify-content:center;gap:8px;cursor:pointer}'+
'.bxbar{background:var(--card);border:2.5px solid var(--navy);border-radius:12px;padding:10px 12px;margin:-4px 0 12px;display:flex;flex-direction:column;gap:8px}.bxbar.idle{border-color:var(--line)}'+
'.bxtop{display:flex;align-items:center;gap:10px}.bxtag{flex:none;background:var(--navy);color:#fff;font-weight:800;border-radius:10px;padding:6px 10px;font-size:15px}.bxinfo{flex:1;min-width:0;font-size:13.5px;line-height:1.35}.bxinfo small{display:block;color:var(--mute);overflow:hidden;text-overflow:ellipsis;white-space:nowrap}'+
'.bxdone{flex:none;min-height:44px;border:0;border-radius:10px;background:#2a7d4f;color:#fff;font:inherit;font-weight:800;padding:0 12px;cursor:pointer}'+
'.bxchips{display:flex;gap:6px;flex-wrap:wrap;align-items:center;font-size:12px}.bxchip{border-radius:6px;padding:3px 7px;font-weight:700}.bxchip.ok{background:#e3f3e9;color:#1f6b41}.bxchip.op{background:#e6eef9;color:#114a97;font-weight:800}.bxchip.nd{background:#fff1e3;color:#9a4d00}'+
'.bxlnk{border:0;background:none;color:var(--navy);font:inherit;font-weight:700;padding:3px 4px;cursor:pointer}.pkp .bxin{display:block;font-size:12.5px;color:var(--navy);font-style:normal;font-weight:600}'+
'.bxgrid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:8px;margin:10px 0}.bxgrid button{min-height:60px;border:2.5px solid var(--line);border-radius:12px;background:var(--card);color:var(--ink);font:inherit;font-size:16px;font-weight:700;cursor:pointer}.bxgrid button.on{border:3px solid var(--navy);background:#e6eef9;color:#114a97;font-weight:800}'+
'.bxson{border:2.5px solid var(--line);border-radius:12px;padding:8px 10px}.bxson.on{border:3px solid var(--navy)}.bxson label{font-weight:700;font-size:14px;display:block;margin-bottom:4px}.bxson input{width:100%;font-size:16px}'+
'.bxq{display:flex;align-items:center;justify-content:center;gap:14px;margin:12px 0}.bxq button{width:56px;height:56px;border-radius:12px;border:2.5px solid var(--navy);background:var(--card);color:var(--navy);font-size:28px;font-weight:800;cursor:pointer}.bxq input{width:110px;text-align:center;font-size:34px;font-weight:800;padding:4px}'+
'.bxlist{border:2px solid var(--line);border-radius:10px;overflow:hidden;margin:8px 0}.bxlist div{display:flex;justify-content:space-between;align-items:center;gap:8px;padding:8px 10px;font-size:15px}.bxlist div+div{border-top:1px solid var(--line)}.bxlist .h{background:var(--bg);font-size:12px;font-weight:800;color:var(--mute)}.bxlist button{border:0;background:none;color:var(--bad);font-size:20px;cursor:pointer;padding:0 4px}'+
'.bxet{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:8px;margin:6px 0}.bxet button{min-height:54px;border:2.5px solid var(--line);border-radius:12px;background:var(--card);color:var(--ink);font:inherit;font-weight:700;cursor:pointer}.bxet button.on{border:3px solid var(--navy);background:#e6eef9;color:#114a97;font-weight:800}'+
'@media (prefers-color-scheme:dark){:root:not([data-theme="light"]) .bxgrid button.on,:root:not([data-theme="light"]) .bxet button.on{background:#22406f;color:#fff}:root:not([data-theme="light"]) .bxchip.op{background:#22406f;color:#fff}:root:not([data-theme="light"]) .bxchip.ok{background:#1f7a4a;color:#fff}:root:not([data-theme="light"]) .bxchip.nd{background:#8a4b0c;color:#fff}:root:not([data-theme="light"]) .pkp .bxin,:root:not([data-theme="light"]) .bxlnk,:root:not([data-theme="light"]) .bxstart{color:#8fb0ea}}'+
':root[data-theme="dark"] .bxgrid button.on,:root[data-theme="dark"] .bxet button.on,:root[data-theme="dark"] .bxchip.op{background:#22406f;color:#fff}:root[data-theme="dark"] .bxchip.ok{background:#1f7a4a;color:#fff}:root[data-theme="dark"] .pkp .bxin,:root[data-theme="dark"] .bxlnk,:root[data-theme="dark"] .bxstart{color:#8fb0ea}';
document.head.appendChild(st)}catch(e){}})();
/* ---------- Daten ---------- */
/* 1.194: jedes Gerät hat seine eigene offene Box (zu zweit auf 2 Tablets herrichten) – Gerätekennung in localStorage tpc_dev_id, Box-Schlüssel bx_<n>_<Gerät><Zeit> */
function bxDev(){try{let d=localStorage.getItem("tpc_dev_id");if(!d){d=Math.random().toString(36).slice(2,10);localStorage.setItem("tpc_dev_id",d)}return d}catch(e){return "x"}}
function bxAll(P){const H=pkH(P);return Object.keys(H).filter(k=>/^bx_\w+$/.test(k)&&H[k]&&typeof H[k]==="object").map(k=>({...H[k],k})).sort((a,b)=>a.n-b.n||(a.t||0)-(b.t||0))}
const bxMineB=b=>!b.done&&(b.dev?b.dev===bxDev():b.by===me);
const bxOpen=P=>bxAll(P).find(bxMineB)||null;
const bxGet=(P,b)=>bxAll(P).find(y=>y.k===b.k)||b;
const bxSave=(P,b,extra)=>{const {k,...d}=b;return {[k]:{...d,...(extra||{})}}};
const bxName=b=>b?(b.typ==="son"?(b.nm||"Sonstiges"):BX_T[b.typ]||"Box")+" "+b.n:"";
const bxIn=(P,k)=>bxAll(P).reduce((a,b)=>a+(+((b.it||{})[k])||0),0);
function bxCur(x,h){const st=pkPS(x,h);if(st.s==="ok")return h&&typeof h.q==="number"&&h.q>st.need?h.q:st.need;return st.s==="part"?st.q:0}
function bxLines(P,b){const IT=pkItems(P);return Object.entries(b.it||{}).filter(e=>+e[1]>0).map(([k,q])=>{const o=IT.find(i=>i.k===k);return{k,q:+q,x:o?o.x:{t:k},txt:pkNum(+q)+" "+((o&&o.x.u)||"Stk")+" "+(o?pkName(o.x):k)}})}
function bxCanH(P){return can("pk_s")&&!(pkH(P).fin&&pkH(P).fin.t&&!(P.zus||[]).some(z=>!pkZFin(P,z)))}
/* Menge q (kann negativ sein = herausnehmen) für Position i in Box b; Herricht-Stand = max(bisher, Summe in Boxen) */
function bxPut(P,b,i,q,fm){const IT=pkItems(P),o=IT[i];if(!o)return;const k=o.k,x=o.x,h0=pkH(P)[k]||null,h=fm?{...(h0||{}),fm}:h0;
 const it={...(b.it||{})},nq=Math.max(0,(+it[k]||0)+q);if(nq)it[k]=nq;else delete it[k];
 const inBoxes=bxIn(P,k)-(+((b.it||{})[k])||0)+nq,cur=bxCur(x,h),need=pkNeed(x,h);
 let T=q>0?Math.max(cur,inBoxes):Math.max(0,cur+q);if(q<0&&inBoxes>T)T=inBoxes;
 const base={alt:(h&&h.alt)||[],fm:(h&&h.fm)||"",...(h&&h.nb?{nb:h.nb}:{}),...(h&&typeof h.l55==="boolean"?{l55:h.l55}:{}),by:me,t:Date.now()};
 const hv=T<=0&&!base.alt.length?(base.fm?{fm:base.fm,by:me,t:Date.now()}:null):T===need?{ok:true,q:null,...base}:{ok:false,q:T,...base};
 return pkHSet(P,{...bxSave(P,b,{it}),[k]:hv})}
/* ---------- Leiste in der Packliste ---------- */
function bxBarHtml(P){const B=bxAll(P),ob=B.find(bxMineB);if(!bxCanH(P)&&!B.length)return"";
 const box='<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round" aria-hidden="true"><path d="M3 7l9-4 9 4v10l-9 4-9-4z"/><path d="M3 7l9 4 9-4M12 11v10"/></svg>';
 if(!B.length)return '<button type="button" class="bxstart" id="bxgo">'+box+'Inhalt pro Box erfassen</button>';
 const chips=B.map(b=>'<span class="bxchip '+(b.done?(b.et?'ok':'nd'):'op')+'">'+(b.done?'✓ ':'')+esc(bxName(b))+(b.done?(b.et?' · gedruckt':' · ohne Etikett'):' · offen'+(bxMineB(b)?'':' bei '+esc(nmA(b,"by"))))+'</span>').join("");
 if(ob){const L=bxLines(P,ob);return '<div class="bxbar" id="bxbar"><div class="bxtop"><span class="bxtag">'+esc(bxName(ob))+'</span><span class="bxinfo"><b>offen</b> · '+(L.length?L.length+(L.length===1?" Artikel drin":" Artikel drin"):"noch leer – Artikel antippen")+(L.length?'<small>'+esc(L.map(l=>l.txt).join(" · "))+'</small>':'')+'</span><button type="button" class="bxdone" id="bxfin">Box fertig</button></div><div class="bxchips">'+chips+'<button type="button" class="bxlnk" id="bxls">Boxen ansehen ›</button></div></div>'}
 return '<div class="bxbar idle" id="bxbar"><div class="bxchips">'+chips+'</div><div class="bxchips">'+(bxCanH(P)?'<button type="button" class="btn s" id="bxgo">Nächste Box starten</button>':'')+'<button type="button" class="bxlnk" id="bxls">Boxen ansehen ›</button></div></div>'}
(function(){const o=packOpenView;packOpenView=function(){o.apply(this,arguments);try{if(view!=="packopen")return;const P=packs.find(x=>x.id===curPack);if(!P||pkNoH(P))return;["#bxbar","#bxgo"].forEach(q=>{const e=$(q);if(e&&!e.closest(".bxbar"))e.remove();else if(e&&q==="#bxbar")e.remove()});document.querySelectorAll("#app .bxin").forEach(e=>e.remove());
  const a=document.querySelector("#app .pkacts");if(!a)return;a.insertAdjacentHTML("afterend",bxBarHtml(P));
  if($("#bxgo"))$("#bxgo").onclick=()=>bxStartDlg(P);if($("#bxfin"))$("#bxfin").onclick=()=>bxDoneDlg(P,bxOpen(P));if($("#bxls"))$("#bxls").onclick=()=>bxListDlg(P);
  const B=bxAll(P),IT=pkItems(P);if(B.length)document.querySelectorAll("#app [data-pkrow]").forEach(r=>{const i=+r.dataset.pkrow,o=IT[i];if(!o)return;const t=B.filter(b=>+((b.it||{})[o.k])>0).map(b=>pkNum(b.it[o.k])+" in "+bxName(b));
   if(t.length){const s=r.querySelector(".pkt");if(s)s.insertAdjacentHTML("beforeend",'<em class="bxin">'+esc(t.join(" · "))+'</em>')}});
  if(bxOpen(P))document.querySelectorAll("#app [data-pc]").forEach(b=>{const i=+b.dataset.pc,x=IT[i]&&IT[i].x;if(!x||pkL55(x,pkH(P)[IT[i].k]))return;b.onclick=()=>{if(pkRowFin(P,i))return;bxQtyDlg(P,i)}})}catch(e){console.warn(e)}}})();
/* ---------- Fenster ---------- */
function bxOv(html){const o=document.createElement("div");o.className="ov";o.innerHTML='<div class="card" style="width:100%;max-width:420px;margin:0">'+html+'</div>';document.body.appendChild(o);o.onclick=e=>{if(e.target===o)o.remove()};return o}
function bxStartDlg(P){if(bxOpen(P))return bxDoneDlg(P,bxOpen(P));const n=bxAll(P).reduce((a,b)=>Math.max(a,+b.n||0),0)+1;let typ="",nm="";
 const o=bxOv('<b style="font-size:19px">Box '+n+' – was ist es?</b><div class="mute" style="font-size:14px;margin-top:4px">'+(n>1?'Die Nummern laufen durch.':'Danach tippst du die Artikel an, die hineinkommen.')+'</div>'+
  '<div class="bxgrid">'+["gb","kb","pal","run"].map(t=>'<button type="button" data-bxt="'+t+'">'+BX_T[t]+'</button>').join("")+'</div>'+
  '<div class="bxson" id="bxsonb"><label for="bxson">Sonstiges</label><input id="bxson" placeholder="z. B. Verteilerkasten" maxlength="40"></div>'+
  '<div class="row" style="margin-top:12px"><button class="btn ghost" type="button" id="bxx">Abbrechen</button><button class="btn" type="button" id="bxok" disabled>Starten</button></div>');
 const ok=o.querySelector("#bxok"),upd=()=>{o.querySelectorAll("[data-bxt]").forEach(b=>b.classList.toggle("on",b.dataset.bxt===typ));o.querySelector("#bxsonb").classList.toggle("on",typ==="son");ok.disabled=!typ||(typ==="son"&&!nm.trim());ok.textContent=typ?(typ==="son"?(nm.trim()||"Sonstiges"):BX_T[typ])+" "+n+" starten":"Starten"};
 o.querySelectorAll("[data-bxt]").forEach(b=>b.onclick=()=>{typ=b.dataset.bxt;upd()});const si=o.querySelector("#bxson");si.oninput=()=>{nm=si.value;typ="son";upd()};si.onfocus=()=>{typ="son";upd()};
 o.querySelector("#bxx").onclick=()=>o.remove();
 ok.onclick=()=>{o.remove();const n2=bxAll(P).reduce((a,b)=>Math.max(a,+b.n||0),0)+1,dv=bxDev();pkHSet(P,{["bx_"+n2+"_"+dv.slice(0,5)+Date.now().toString(36).slice(-4)]:{n:n2,typ,nm:typ==="son"?nm.trim():"",it:{},dev:dv,by:me,t:Date.now(),done:null,et:null}});pkFS.open.main=true;(P.zus||[]).forEach(z=>pkFS.open["z"+z.ps]=true);if(view==="packopen")packOpenView();toast(bxName({n,typ,nm:nm.trim()})+" ist offen – Artikel antippen",1)}}
function bxQtyDlg(P,i){const b=bxOpen(P);if(!b)return;const IT=pkItems(P),o0=IT[i],x=o0.x,k=o0.k,h=pkH(P)[k];
 const go=fm=>{const hh=fm?{...(h||{}),fm}:h,need=pkNeed(x,hh),cur=bxCur(x,hh),inB=bxIn(P,k),here=+((b.it||{})[k])||0,rest=Math.max(0,Math.max(need,cur)-inB);let q=rest||1;
  const u=esc(x.u||"Stk"),o=bxOv('<b style="font-size:17px">'+esc(pkName(x))+' – wie viele in '+esc(bxName(b))+'?</b><div class="mute" style="font-size:13.5px;margin-top:4px">'+pkNum(need)+' '+u+' laut Packschein'+(inB?' · '+pkNum(inB)+' schon in Boxen':'')+' · noch '+pkNum(rest)+' '+u+' offen</div>'+
   '<div class="bxq"><button type="button" id="bxm" aria-label="weniger">−</button><input id="bxn" type="number" inputmode="decimal" min="0" step="1" value="'+q+'" aria-label="Menge"><button type="button" id="bxp" aria-label="mehr">+</button></div>'+
   (here?'<div class="mute" style="font-size:13px;text-align:center;margin-bottom:6px">Schon in dieser Box: '+pkNum(here)+' '+u+' <button type="button" class="lnk" id="bxrm">herausnehmen</button></div>':'')+
   '<div class="row"><button class="btn ghost" type="button" id="bxx">Abbrechen</button><button class="btn" type="button" id="bxok"></button></div><div class="mute" style="font-size:12.5px;margin-top:8px">Vorgeschlagen ist der offene Rest. Weniger eintragen → der Rest bleibt für die nächste Box offen.</div>');
  const inp=o.querySelector("#bxn"),ok=o.querySelector("#bxok"),upd=()=>{q=Math.max(0,parseFloat(String(inp.value).replace(",","."))||0);ok.textContent=pkNum(q)+" "+(x.u||"Stk")+" in "+bxName(b);ok.disabled=!q};
  o.querySelector("#bxm").onclick=()=>{inp.value=Math.max(0,(parseFloat(inp.value)||0)-1);upd()};o.querySelector("#bxp").onclick=()=>{inp.value=(parseFloat(inp.value)||0)+1;upd()};inp.oninput=upd;upd();
  o.querySelector("#bxx").onclick=()=>o.remove();ok.onclick=()=>{o.remove();bxPut(P,b,i,q,fm);if(view==="packopen")packOpenView()};
  const rm=o.querySelector("#bxrm");if(rm)rm.onclick=()=>{o.remove();bxPut(P,b,i,-here);if(view==="packopen")packOpenView()}};
 if(x.f>0&&!(h&&h.fm))return pkFmAsk(x,fm=>go(fm));go(null)}
function bxDoneDlg(P,b,re){if(!b)return;const L=bxLines(P,b);let art=b.typ==="son"&&L.length<=1?"pl":"inh",n=1;
 const o=bxOv('<div id="bxdc"></div>');const draw=()=>{const LL=bxLines(P,b);
  o.querySelector("#bxdc").innerHTML='<b style="font-size:19px">'+esc(bxName(b))+(re?' – Etikett nochmal drucken':' ist fertig')+'</b>'+
   '<div class="bxlist"><div class="h">INHALT ('+LL.length+(LL.length===1?' ARTIKEL':' ARTIKEL')+')</div>'+(LL.length?LL.map(l=>'<div><span>'+esc(pkName(l.x))+'</span><span><b>'+pkNum(l.q)+' '+esc(l.x.u||"Stk")+'</b>'+(re?'':' <button type="button" data-bxrm="'+esc(l.k)+'" aria-label="Aus der Box nehmen">×</button>')+'</span></div>').join(""):'<div class="mute">Noch nichts drin.</div>')+'</div>'+
   '<div style="font-weight:700;font-size:14px">Welches Etikett?</div><div class="bxet"><button type="button" data-bxa="inh" class="'+(art==="inh"?'on':'')+'">'+(art==="inh"?'✓ ':'')+'Mit Inhalt</button><button type="button" data-bxa="pl" class="'+(art==="pl"?'on':'')+'">'+(art==="pl"?'✓ ':'')+'Normales Etikett</button></div>'+
   '<div class="row" style="align-items:center;justify-content:space-between;margin:8px 0"><b style="font-size:14px">Anzahl</b><span style="display:flex;align-items:center;gap:10px"><button class="btn ghost s" type="button" id="bxem" aria-label="weniger">−</button><b style="font-size:20px">'+n+'</b><button class="btn ghost s" type="button" id="bxep" aria-label="mehr">+</button></span></div>'+
   (typeof gbStLine==="function"?gbStLine():'')+
   '<button class="btn" type="button" id="bxpr" style="margin-top:10px"'+(LL.length||art==="pl"?'':' disabled')+'>Etikett an die Druckstation</button>'+
   '<div class="row" style="margin-top:8px"><button class="btn ghost" type="button" id="bxhere">Hier drucken</button>'+(re?'':'<button class="btn ghost" type="button" id="bxno">Ohne Etikett</button>')+'</div>'+
   '<button class="btn ghost" type="button" id="bxback" style="margin-top:8px">'+(re?'Abbrechen':'Zurück in die Box')+'</button>';
  const q=s=>o.querySelector(s);o.querySelectorAll("[data-bxa]").forEach(x=>x.onclick=()=>{art=x.dataset.bxa;draw()});q("#bxem").onclick=()=>{n=Math.max(1,n-1);draw()};q("#bxep").onclick=()=>{n=Math.min(20,n+1);draw()};
  o.querySelectorAll("[data-bxrm]").forEach(x=>x.onclick=()=>{const k=x.dataset.bxrm,i=pkItems(P).findIndex(it=>it.k===k),cb=bxGet(P,b);if(i>=0){bxPut(P,cb,i,-(+((cb.it||{})[k])||0));setTimeout(()=>{b=bxGet(P,b);draw();if(view==="packopen"&&!document.querySelector(".ov:not(:last-child)"))packOpenView()},50)}});
  q("#bxback").onclick=()=>o.remove();
  const job=()=>{const cb=bxGet(P,b);return{pk:P.id,ord:P.ord||"",ev:P.ev||"",art,n,inh:art==="inh"?bxLines(P,cb).map(l=>l.txt).join("\n"):"",box:art==="inh"?bxName(cb).toUpperCase():"",bx:cb.n}};
  const fin=et=>{const cb=bxGet(P,b);pkHSet(P,bxSave(P,cb,{done:re&&cb.done?cb.done:{by:me,t:Date.now()},et:et||cb.et||null}));o.remove();if(view==="packopen")packOpenView();if(re)toast(et&&et.here?"Etikett wird gedruckt":"An die Druckstation geschickt",1);else bxNextAsk(P,cb,et)};
  if(q("#bxno"))q("#bxno").onclick=()=>fin(null);
  q("#bxhere").onclick=()=>{const j=job();gbPrint(j).catch(()=>errBox("Drucken hat nicht geklappt."));fin({art,n,t:Date.now(),here:true})};
  q("#bxpr").onclick=async()=>{const j=job(),bt=q("#bxpr");bt.disabled=true;try{await db.doc("druck/"+Date.now().toString(36)+Math.random().toString(36).slice(2,6)).set({...j,by:me,t:Date.now(),st:"neu"});fin({art,n,t:Date.now()})}
   catch(e){bt.disabled=false;errBox("Konnte nicht gesendet werden"+(typeof sbErr==="function"?sbErr(e):"")+".")}}};draw()}
function bxNextAsk(P,b,et){const o=bxOv('<b style="font-size:17px">'+esc(bxName(b))+(et?(et.here?' – Etikett wird gedruckt ✓':' – an die Druckstation geschickt ✓'):' – fertig ✓')+'</b><div class="mute" style="margin:6px 0 12px">'+(et&&!et.here&&typeof gbStationOk==="function"&&!gbStationOk()?'Die Druckstation ist gerade aus – das Etikett wird gedruckt, sobald sie läuft. ':'')+'Nächste Box?</div>'+
 '<div class="row"><button class="btn ghost" type="button" id="bxend">Fertig</button><button class="btn" type="button" id="bxnx">Box '+(bxAll(P).reduce((a,y)=>Math.max(a,+y.n||0),0)+1)+' starten</button></div>');
 o.querySelector("#bxend").onclick=()=>o.remove();o.querySelector("#bxnx").onclick=()=>{o.remove();bxStartDlg(P)}}
function bxListDlg(P){const B=bxAll(P);const o=bxOv('<b style="font-size:19px">Boxen ('+B.length+')</b>'+B.map(b=>{const L=bxLines(P,b);return '<div class="bxlist"><div class="h"><span>'+esc(bxName(b).toUpperCase())+' · '+(b.done?(b.et?'gedruckt':'ohne Etikett'):'offen')+'</span>'+
  (b.done?'<span><button type="button" class="lnk" data-bxre="'+esc(b.k)+'" style="color:var(--navy);font-size:13px">Etikett nochmal</button>'+(bxOpen(P)||!bxCanH(P)?'':' · <button type="button" class="lnk" data-bxop="'+esc(b.k)+'" style="color:var(--navy);font-size:13px">Wieder öffnen</button>')+'</span>':'')+'</div>'+
  (L.length?L.map(l=>'<div><span>'+esc(pkName(l.x))+'</span><b>'+pkNum(l.q)+' '+esc(l.x.u||"Stk")+'</b></div>').join(""):'<div class="mute">leer</div>')+'<div class="mute" style="font-size:12px">'+esc(nmA(b,"by"))+', '+fmt(b.t)+(b.done?' · fertig '+fmt(b.done.t).slice(-5):'')+'</div></div>'}).join("")+
  '<button class="btn ghost" type="button" id="bxx" style="margin-top:6px">Schließen</button>');
 o.querySelector("#bxx").onclick=()=>o.remove();
 o.querySelectorAll("[data-bxop]").forEach(x=>x.onclick=()=>{const b=B.find(y=>y.k===x.dataset.bxop);o.remove();pkHSet(P,bxSave(P,b,{done:null,dev:bxDev(),by:me}));if(view==="packopen")packOpenView()});
 o.querySelectorAll("[data-bxre]").forEach(x=>x.onclick=()=>{const b=B.find(y=>y.k===x.dataset.bxre);o.remove();bxDoneDlg(P,b,true)})}
