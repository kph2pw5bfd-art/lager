/* ===== 1.125 – Werkstatt Übersicht (Jürgen, 5.11.; Entwurf https://claude.ai/artifact/9fRKHYxduFBgmCML6zbGA9;
   gewählt: nur für die Werkstatt heißt die Kachel „Lager Übersicht“ dann „Werkstatt Übersicht“ und zeigt diese Ansicht;
   KEIN Stand „In Arbeit / Wartet auf Teil“; KEIN Reiter „Gebraucht“ (dafür müsste die App den Lagerstand kennen);
   Teil-Reparatur: bei Stückzahl fragt „Repariert“ „Wie viele?“, der Rest bleibt als eigene offene Meldung).
   Werkstatt = Titelname enthält „Werkstatt“. Admin kann die Ansicht über den Link in der Lager Übersicht ansehen (wsForce). ===== */
(function(){try{const st=document.createElement("style");st.textContent=
'.wsbig{display:grid;grid-template-columns:1fr 1fr;gap:10px;margin:14px 0 4px}.wsbig button{border:0;border-radius:12px;padding:16px 10px;font:inherit;font-weight:800;font-size:17px;color:#fff;cursor:pointer;display:flex;flex-direction:column;align-items:center;gap:4px;min-height:84px;justify-content:center}.wsbig button small{font-weight:600;font-size:12.5px;opacity:.92}.wsbig .wsrep{background:#1e9e55}.wsbig .wsnew{background:var(--navy)}'+
'.wscard{background:var(--card);border:2.5px solid var(--navy);border-radius:12px;padding:12px;margin-bottom:12px}.wscard.plain{border:2px solid var(--line)}'+
'.wstabs{display:grid;grid-template-columns:repeat(3,1fr);gap:6px;margin-bottom:10px}.wstab{border:2px solid var(--line);border-radius:10px;padding:8px 4px;background:var(--card);color:var(--mute);font:inherit;font-size:13px;font-weight:700;cursor:pointer;text-align:center}.wstab b{display:block;font-size:22px;color:var(--ink);font-variant-numeric:tabular-nums}.wstab.red b{color:#b8322a}.wstab.on{background:var(--navy);border-color:var(--navy);color:#dbe6f7}.wstab.on b{color:#fff}'+
'.wsit{display:flex;flex-direction:column;gap:2px;width:100%;text-align:left;border:2px solid var(--line);border-left:5px solid #c0392b;border-radius:8px;padding:9px 11px;background:var(--card);color:var(--ink);font:inherit;cursor:pointer;margin-bottom:7px}.wsit.urg{background:#fdecea}.wsit .r1{display:flex;justify-content:space-between;gap:8px;align-items:baseline}.wsit b{font-size:15px}.wsit small{color:var(--mute);font-size:13px}'+
'.wssub{font-size:12px;font-weight:800;letter-spacing:.06em;text-transform:uppercase;color:var(--mute);margin:0 0 6px}.wsrow{display:flex;justify-content:space-between;gap:10px;padding:8px 0;border-top:1px solid var(--line);font-size:15px}.wsrow:first-of-type{border-top:0}.wsrow b{font-variant-numeric:tabular-nums}'+
'.wslinks{display:flex;justify-content:space-between;gap:10px;margin-top:6px}.wslinks button,.wsback{background:none;border:0;color:var(--navy);font:inherit;font-weight:700;cursor:pointer;padding:6px 0}.wsnote{font-size:13px;color:var(--mute);margin:0 0 8px}'+
'.wsq{display:flex;align-items:center;justify-content:center;gap:14px;margin:14px 0}.wsq button{width:52px;height:48px;border:2px solid var(--line);border-radius:10px;background:var(--bg);font:inherit;font-size:24px;cursor:pointer;color:var(--ink)}.wsq b{font-size:26px;min-width:90px;text-align:center;font-variant-numeric:tabular-nums}'+
'@media (prefers-color-scheme:dark){:root:not([data-theme="light"]) .jvclock{color:#8fb0ea}:root:not([data-theme="light"]) .wsit.urg{background:#3d1512}:root:not([data-theme="light"]) .wslinks button,:root:not([data-theme="light"]) .wsback{color:#8fb0ea}:root:not([data-theme="light"]) .wstab.red b{color:#ff9d92}}'+
':root[data-theme="dark"] .jvclock{color:#8fb0ea}:root[data-theme="dark"] .wsit.urg{background:#3d1512}:root[data-theme="dark"] .wslinks button,:root[data-theme="dark"] .wsback{color:#8fb0ea}:root[data-theme="dark"] .wstab.red b{color:#ff9d92}';
document.head.appendChild(st)}catch(e){}})();
let wsForce=false,wsTab=null,wsIn=false,wsPrev=0;
function wsIs(){if(wsForce)return true;try{const t=typeof hoTit==="function"?hoTit(hoMyTitle()):null;return !!(t&&/werkstatt/i.test(t.name||""))}catch(e){return false}}
try{Object.defineProperty(HO_NAME,"jarvis",{get:()=>wsIs()?"Werkstatt Übersicht":"Lager Übersicht",enumerable:true,configurable:true})}catch(e){}
const wsLS=(k,v)=>{try{if(v===undefined)return localStorage.getItem(k);localStorage.setItem(k,v)}catch(e){return null}};
/* Besuch: beim Betreten merken, wann man zuletzt da war */
/* Besuch endet erst auf der Hauptseite oder wenn die App in den Hintergrund geht – Defekt öffnen und zurück zählt nicht als neuer Besuch */
setInterval(()=>{if(typeof view==="undefined")return;if(wsIn&&(view==="start"||document.visibilityState==="hidden")){wsLS("tpc_ws_seen",String(Date.now()));wsIn=false}if(wsForce&&view==="start")wsForce=false},800);
const wsOpen=()=>vdefs().filter(d=>!d.done);
const wsUrg=()=>wsOpen().filter(d=>d.urg);
function wsHot(){return wsUrg().length}
function wsWeek(){const d=new Date();d.setHours(0,0,0,0);d.setDate(d.getDate()-((d.getDay()+6)%7));return +d}
function wsLine(d){let who="";try{who=nmA(d,"by")}catch(e){}const ago=fmt(d.t);
 return '<button type="button" class="wsit'+(d.urg?' urg':'')+'" data-wsd="'+esc(d.id)+'"><span class="r1"><b>'+(dxQ(d)>1?dxQ(d)+' × ':'')+esc(d.art)+'</b>'+(d.urg?'<span class="tag" style="background:#7a0f08;color:#fff">DRINGEND</span>':'')+'</span><small>'+[d.desc,d.ev,who,ago].filter(Boolean).map(esc).join(" · ")+(d.fv?' · Fremdverschulden':'')+(d.ret?' · beim Zählen gemeldet':'')+'</small></button>'}
function wsView(){if(!wsIn){wsIn=true;const s=+wsLS("tpc_ws_seen")||0;wsPrev=s||Date.now()-864e5}
 $("#t").textContent="Werkstatt Übersicht";const O=wsOpen().sort((a,b)=>b.t-a.t),U=O.filter(d=>d.urg),N=O.filter(d=>d.t>wsPrev);
 if(!wsTab)wsTab=U.length?"urg":N.length?"neu":"alle";const L=wsTab==="urg"?U:wsTab==="neu"?N:O.slice().sort((a,b)=>(b.urg?1:0)-(a.urg?1:0)||b.t-a.t);
 const w0=wsWeek(),all=vdefs(),rep=all.filter(d=>d.done&&(d.doneT||0)>=w0).reduce((s,d)=>s+dxQ(d),0),neu=all.filter(d=>d.t>=w0).reduce((s,d)=>s+dxQ(d),0),last=all.filter(d=>d.done&&d.doneT).sort((a,b)=>b.doneT-a.doneT).slice(0,4);
 const tab=(k,l,n,red)=>'<button type="button" class="wstab'+(wsTab===k?' on':'')+(red&&n?' red':'')+'" data-wst="'+k+'"><b>'+n+'</b>'+l+'</button>';
 $("#app").innerHTML='<div class="jv" id="wsv"><section class="jvhead"><div class="jvhrow"><div class="jvtime"><div class="jvclock" id="jvclock"></div><div class="jvdate" id="jvdate"></div></div></div><div class="jvgreet">'+esc(jvGreet())+'</div>'+
  '<div class="wsbig"><button type="button" class="wsrep" id="wsrep">Repariert melden<small>Teil scannen</small></button><button type="button" class="wsnew" id="wsnew">Defekt erfassen<small>neu melden</small></button></div></section>'+
  '<div class="wscard"><div class="wstabs">'+tab("urg","Dringend",U.length,1)+tab("neu","Neu",N.length)+tab("alle","Alle offen",O.length)+'</div>'+
  (wsTab==="neu"?'<p class="wsnote">Seit deinem letzten Besuch ('+fmt(wsPrev)+')</p>':'')+
  (L.length?L.map(wsLine).join(""):'<p class="wsnote">'+(wsTab==="urg"?'Keine dringenden Defekte.':wsTab==="neu"?'Nichts Neues seit deinem letzten Besuch.':'Keine offenen Defekte. Sauber!')+'</p>')+'</div>'+
  '<div class="wscard plain"><div class="wssub">Diese Woche</div><div class="wsrow"><span>Repariert</span><b>'+rep+' Stk</b></div><div class="wsrow"><span>Neu gemeldet</span><b>'+neu+' Stk</b></div>'+
  (last.length?'<div class="wssub" style="margin-top:12px">Zuletzt repariert</div>'+last.map(d=>'<div class="wsrow"><span>'+(dxQ(d)>1?dxQ(d)+' × ':'')+esc(d.art)+'</span><small class="mute">'+fmt(d.doneT)+'</small></div>').join(""):'')+
  '<div class="wslinks">'+(can("def_b")?'<button type="button" id="wsrepb">Ersatzteile-Bericht ›</button>':'<span></span>')+'<button type="button" id="wsall">Alle Defekte ›</button></div></div>'+
  (wsForce?'<button type="button" class="wsback" id="wsback">‹ Zurück zur Lager Übersicht</button>':'')+'</div>';
 if(typeof jvClock==="function")jvClock();
 document.querySelectorAll("[data-wst]").forEach(b=>b.onclick=()=>{wsTab=b.dataset.wst;wsView()});
 document.querySelectorAll("[data-wsd]").forEach(b=>b.onclick=()=>{curDef=b.dataset.wsd;go("defopen")});
 $("#wsrep").onclick=()=>rScanCam(wsScanHit);$("#wsnew").onclick=()=>{dpho=null;go("defnew")};
 $("#wsall").onclick=()=>{df="alle";go("def")};const rb=$("#wsrepb");if(rb)rb.onclick=etRepDlg;const bk=$("#wsback");if(bk)bk.onclick=()=>{wsForce=false;draw()}}
/* Repariert melden: Teil scannen → offene Meldungen zum Artikel */
function wsScanHit(raw){const v=String(raw||"").trim(),m=v.match(CODE_RE),nr=m?m[1].toUpperCase():(v.split(/[\s\-‐‑‒–—―−]+/)[0]||"").toUpperCase(),c=artCode(nr)||nr;
 if(!c){beep(false);return errBox("Kein Code erkannt.")}
 const k=typeof art!=="undefined"&&art[c],nm=k?k.name:"Nr. "+c,old=dxDQ;dxDQ=c;const L=wsOpen().filter(dxDefMatch).sort((a,b)=>(b.urg?1:0)-(a.urg?1:0)||a.t-b.t);dxDQ=old;
 if(!L.length){beep(false);return errBox("Kein offener Defekt zu „"+nm+"“.")}beep(true);
 if(L.length===1)return wsGoRepair(L[0]);
 const o=document.createElement("div");o.className="ov";o.innerHTML='<div class="card" style="width:100%;max-width:440px;margin:0;max-height:90vh;overflow:auto"><b style="font-size:18px">'+esc(nm)+'</b><p class="mute" style="margin:2px 0 10px">'+L.length+' offene Meldungen – welche ist repariert?</p>'+L.map(wsLine).join("")+'<button class="btn ghost" type="button" id="wsx" style="margin-top:6px">Abbrechen</button></div>';
 document.body.appendChild(o);o.querySelector("#wsx").onclick=()=>o.remove();o.addEventListener("click",e=>{if(e.target===o)o.remove()});
 o.querySelectorAll("[data-wsd]").forEach(b=>b.onclick=()=>{o.remove();wsGoRepair(L.find(d=>d.id===b.dataset.wsd))})}
function wsGoRepair(d){if(!d)return;curDef=d.id;go("defopen");if(can("def_b"))setTimeout(()=>wsRepair(d),150)}
/* „Repariert“ – bei Stückzahl erst fragen, wie viele */
function wsRepair(d){const n=dxQ(d);if(n<=1)return etDlg(d,true);let k=n;const o=document.createElement("div");o.className="ov";
 o.innerHTML='<div class="card" style="width:100%;max-width:400px;margin:0"><b style="font-size:18px">Wie viele sind repariert?</b><p class="mute" style="margin:2px 0 0">'+n+' × '+esc(d.art)+'</p><div class="wsq"><button type="button" id="wsqm" aria-label="Weniger">−</button><b id="wsqv">'+k+' von '+n+'</b><button type="button" id="wsqp" aria-label="Mehr">+</button></div><p class="mute" id="wsqh" style="font-size:13px;min-height:18px;margin:0 0 10px"></p><div class="row"><button class="btn ghost" type="button" id="wsqx">Abbrechen</button><button class="btn" type="button" id="wsqo">Weiter</button></div></div>';
 document.body.appendChild(o);const q=s=>o.querySelector(s),upd=()=>{q("#wsqv").textContent=k+" von "+n;q("#wsqh").textContent=k<n?(n-k)+" Stk bleiben als offener Defekt stehen.":"Alle Stück repariert."};upd();
 q("#wsqm").onclick=()=>{if(k>1){k--;upd()}};q("#wsqp").onclick=()=>{if(k<n){k++;upd()}};q("#wsqx").onclick=()=>o.remove();
 q("#wsqo").onclick=()=>{o.remove();etDlg(d,true,k<n?k:0)}}
/* Rest einer Meldung als eigene offene Meldung anlegen (vor dem Speichern der Reparatur) */
async function wsSplit(d,k){const n=dxQ(d),id=Date.now().toString(36)+Math.random().toString(36).slice(2,5),skip=/^(id|rep|et|rfn|repBy|repBy_as|repT|done|doneBy|doneBy_as|doneT|fb|edT)$/;
 const c={};Object.keys(d).forEach(f=>{if(!skip.test(f))c[f]=d[f]});c.n=n-k;c.done=false;c.teilVon=d.id;
 const fn=+d.fn||0;let m=0;try{if(fn){for(let i=0;i<fn;i++){const sn=await db.doc("fotos/"+d.id+"-"+i).get();if(sn.exists){await db.doc("fotos/"+id+"-"+m).set(sn.data());m++}}}else if(d.foto){const sn=await db.doc("fotos/"+d.id).get();if(sn.exists){await db.doc("fotos/"+id+"-0").set(sn.data());m=1}}}catch(e){}
 c.fn=m;c.foto=m>0;await db.doc("defekte/"+id).set(c);return id}
document.addEventListener("click",e=>{const t=e.target&&e.target.closest&&e.target.closest("#wsadm");if(t){wsForce=true;wsTab=null;draw()}});
