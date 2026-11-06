/* ===== 1.136 – Projektleiter Übersicht (Jürgen, 6.11.; Entwurf 2 https://claude.ai/artifact/PcSVpxgpZZaZLDP1xFSGY8;
   gewählt: roter Block „Zu erledigen“ ganz oben (Fehlmaterial-Fragen, Dispo abgelaufen, Fremdverschulden, Abweichungen beim Herrichten),
   Kachel „Lager Übersicht“ heißt für den Titel Projektleiter „Projektleiter Übersicht“ mit roter Zahl, Push später).
   Nur eigene Aufträge (auIsMine bzw. Admin-Vorschau „Ansicht als“). „Gesehen“ in docs `plseen` (id = uid_schlüssel). ===== */
(function(){try{const st=document.createElement("style");st.textContent=
'.plmini{display:flex;justify-content:space-between;align-items:flex-end;gap:10px;margin:2px 0 12px}.plmini b{font-size:18px}.plmini small{display:block;color:var(--mute);font-size:13px}.plclock{font-size:30px;font-weight:800;color:var(--navy);font-variant-numeric:tabular-nums;line-height:1}'+
'.pltodo{background:#fdecea;border:2px solid #c0392b;border-radius:14px;padding:12px;margin-bottom:12px}.pltodo h3{margin:0 0 8px;font-size:18px;color:#a3150b;display:flex;justify-content:space-between;align-items:center}.pltodo h3 span{background:#c0392b;color:#fff;border-radius:999px;padding:1px 11px;font-size:15px}'+
'.plti{background:var(--card);border:1px solid var(--line);border-radius:10px;padding:10px 11px;margin-top:8px;display:flex;flex-direction:column;gap:3px}.plti .why{font-size:11.5px;font-weight:800;letter-spacing:.05em;text-transform:uppercase;color:#a3150b}.plti b{font-size:16px}.plti small{color:var(--mute);font-size:13px;line-height:1.35}'+
'.plact{display:flex;gap:8px;flex-wrap:wrap;margin-top:6px}.plact button{border:1px solid var(--line);border-radius:8px;padding:8px 14px;font:inherit;font-size:14px;font-weight:700;background:var(--card);color:var(--ink);cursor:pointer;min-height:40px}.plact button.p{background:var(--navy);border-color:var(--navy);color:#fff}'+
'.pldone{background:#e3f3e8;border:2px solid #1e9e55;border-radius:14px;padding:14px;text-align:center;font-weight:800;color:#1f6b41;font-size:17px;margin-bottom:12px}.pldone small{display:block;font-weight:600;font-size:13px;color:var(--mute);margin-top:3px}'+
'.plbig{display:grid;grid-template-columns:1fr 1fr;gap:10px;margin-bottom:12px}.plbig button{border:0;border-radius:12px;padding:14px 8px;font:inherit;font-weight:800;font-size:16px;color:#fff;background:var(--navy);cursor:pointer;min-height:58px}.plbig button.g{background:#1e9e55}'+
'.plsec{background:var(--card);border:1px solid var(--line);border-radius:12px;padding:12px;margin-bottom:12px}.plsec h4{margin:0 0 6px;font-size:12px;font-weight:800;letter-spacing:.06em;text-transform:uppercase;color:var(--mute);display:flex;justify-content:space-between;align-items:center}.plsec h4 button{background:none;border:0;color:var(--navy);font:inherit;font-weight:800;letter-spacing:0;text-transform:none;font-size:13px;cursor:pointer;padding:4px 0}'+
'.plli{display:flex;justify-content:space-between;gap:10px;width:100%;text-align:left;background:none;border:0;border-top:1px solid var(--line);padding:9px 0;font:inherit;color:var(--ink);cursor:pointer}.plli:first-of-type{border-top:0}.plli b{font-size:15px}.plli small{display:block;color:var(--mute);font-size:13px}.plli .r{white-space:nowrap;font-weight:700;font-variant-numeric:tabular-nums;align-self:center}.plli .r.red{color:#b8322a}.plli .r.ok{color:#1f6b41}.plli .r.m{color:var(--mute);font-weight:600}'+
'.plday{display:grid;grid-template-columns:52px 1fr;gap:10px;border-top:1px solid var(--line);padding:8px 0}.plday:first-of-type{border-top:0}.plday .dh{font-weight:800;color:var(--navy);font-size:14px;line-height:1.2}.plday .dh small{display:block;font-weight:600;color:var(--mute);font-size:12px}.plday.today .dh{background:var(--navy);color:#fff;border-radius:8px;padding:4px 6px;align-self:start}.plday.today .dh small{color:#dbe6f7}'+
'.plev{display:flex;flex-direction:column;gap:4px;min-width:0}.plev button{display:flex;gap:7px;align-items:baseline;background:none;border:0;padding:0;font:inherit;font-size:14px;color:var(--ink);cursor:pointer;text-align:left}.plpill{font-size:11px;font-weight:800;border-radius:999px;padding:1px 8px;white-space:nowrap}.plpill.h{background:#e8f0fb;color:#114a97}.plpill.z{background:#e3f3e8;color:#1f6b41}.plpill.r{background:#fff1e0;color:#8a4300}.plpill.x{background:#eef1f5;color:#3d4a5c}.plpill.d{background:#e3f3e8;color:#1f6b41}'+
'.plask .jvask{margin:0}.plask .jvaskrow{display:flex;gap:8px}.plask #jvaq{flex:1;min-width:0;margin:0}'+
'.plas{display:flex;gap:8px;align-items:center;flex-wrap:wrap;background:var(--bg);border:1px dashed var(--line);border-radius:10px;padding:8px 10px;margin-bottom:12px;font-size:14px}.plas select{width:auto;flex:1;min-width:160px;margin:0}'+
'@media (prefers-color-scheme:dark){:root:not([data-theme="light"]) .pltodo{background:#3d1512}:root:not([data-theme="light"]) .pltodo h3,:root:not([data-theme="light"]) .plti .why{color:#ffb4a8}:root:not([data-theme="light"]) .pldone{background:#16402a;color:#9fe0b8}:root:not([data-theme="light"]) .plclock,:root:not([data-theme="light"]) .plday .dh,:root:not([data-theme="light"]) .plsec h4 button{color:#8fb0ea}:root:not([data-theme="light"]) .plday.today .dh{color:#fff}:root:not([data-theme="light"]) .plpill.h{background:#16294a;color:#c7dbff}:root:not([data-theme="light"]) .plpill.z{background:#16402a;color:#9fe0b8}:root:not([data-theme="light"]) .plpill.r{background:#3a2610;color:#ffcf99}:root:not([data-theme="light"]) .plpill.x{background:#1d2633;color:#c5cedb}:root:not([data-theme="light"]) .plpill.d{background:#16402a;color:#9fe0b8}:root:not([data-theme="light"]) .plli .r.red{color:#ff9d92}:root:not([data-theme="light"]) .plli .r.ok{color:#8fd3a8}}'+
':root[data-theme="dark"] .pltodo{background:#3d1512}:root[data-theme="dark"] .pltodo h3,:root[data-theme="dark"] .plti .why{color:#ffb4a8}:root[data-theme="dark"] .pldone{background:#16402a;color:#9fe0b8}:root[data-theme="dark"] .plclock,:root[data-theme="dark"] .plday .dh,:root[data-theme="dark"] .plsec h4 button{color:#8fb0ea}:root[data-theme="dark"] .plday.today .dh{color:#fff}:root[data-theme="dark"] .plpill.h{background:#16294a;color:#c7dbff}:root[data-theme="dark"] .plpill.z{background:#16402a;color:#9fe0b8}:root[data-theme="dark"] .plpill.r{background:#3a2610;color:#ffcf99}:root[data-theme="dark"] .plpill.x{background:#1d2633;color:#c5cedb}:root[data-theme="dark"] .plpill.d{background:#16402a;color:#9fe0b8}:root[data-theme="dark"] .plli .r.red{color:#ff9d92}:root[data-theme="dark"] .plli .r.ok{color:#8fd3a8}';
document.head.appendChild(st)}catch(e){}})();
/* Fragen (Lager Assistent) auch für Projektleiter: Packlisten-Fragen gehen mit dem Recht „Aufträge“ (Jürgen, 6.11.: „wo gerade welches Material ist“) */
function jvPkOk(){return can("pk_s")||(typeof plIs==="function"&&plIs()&&can("au_s"))}
let plForce=false,plAs="",plWk=0,plIn2=false,plPrev=0,PLSEEN={},plSeenOn=false;
function plIs(){if(plForce)return true;try{const t=typeof hoTit==="function"?hoTit(hoMyTitle()):null;return !!(t&&/projektleiter/i.test(t.name||""))}catch(e){return false}}
try{Object.defineProperty(HO_NAME,"jarvis",{get:()=>wsIs()?"Werkstatt Übersicht":plIs()?"Projektleiter Übersicht":"Lager Übersicht",enumerable:true,configurable:true})}catch(e){}
function plSeenSub(){if(plSeenOn||typeof db==="undefined"||!db||!me)return;plSeenOn=true;try{db.collection("plseen").onSnapshot(s=>{const M={};s.docs.forEach(d=>{const x=d.data();if(x.by===me)M[x.k]=x});PLSEEN=M;if(view==="jarvis"&&plIs())plView()},()=>{plSeenOn=false})}catch(e){plSeenOn=false}}
const plSeen=k=>!!PLSEEN[k];
async function plSetSeen(k){PLSEEN[k]={k,by:me,t:Date.now()};try{await db.doc("plseen/"+String(me).slice(0,12)+"_"+k.replace(/[^0-9A-Za-z_]/g,"").slice(0,80)).set({k,by:me,...tabAs("by"),t:Date.now()})}catch(e){toast("Speichern fehlgeschlagen. Bitte nochmal versuchen.")}}
function plMine(p){if(!p||p._z||p.art==="verl"&&pkRoot(p)!==p)return false;if(!plAs)return auIsMine(p);const u=auToks(plAs),l=auToks(p.pl);return !!(u.length&&l.length&&u.every(w=>l.includes(w)))}
const plH=s=>{let h=0;String(s).split("").forEach(c=>{h=(h*31+c.charCodeAt(0))|0});return (h>>>0).toString(36)};
const plDig=s=>String(s||"").replace(/\D/g,"");
/* „Zu erledigen“ */
function plTodo(M){const T=[],t0=pkDay(Date.now());
 M.forEach(I=>{const p=I.p;
  if(I.missShow){const un=I.B.miss.filter(e=>!auAns(p,e.k).length);if(un.length){const n=un.reduce((a,e)=>a+(e.soll-e.back),0),nm=un.slice(0,2).map(e=>pkNum(e.soll-e.back)+" "+auUnit(p,e.k)+" "+e.name).join(", ")+(un.length>2?" …":"");
   T.push(I.B.hasEnd?{why:"Lager wartet auf Antwort",t:pkNum(n)+" "+(n===1?"Stück fehlt":"Stück fehlen")+" nach der Endretoure",s:esc(p.ev||"")+" · "+esc(nm),p,un,ord:0}:{why:"Dispo abgelaufen",t:"Noch "+pkNum(n)+" Stk draußen",s:esc(p.ev||"")+" · Dispo bis "+pkDM(p.de)+" · "+esc(nm),p,un,ord:1})}}
  const H=pkH(p);const parts=[[null,H.fin&&H.fin.t?H.fin:auHerrAll(p,null)]].concat((p.zus||[]).map(z=>[String(z.ps),pkZFin(p,z)||auHerrAll(p,String(z.ps))]));
  parts.forEach(([zps,f])=>{if(!f)return;const L=auDevNet(p,zps);if(!L.length)return;const k="dev_"+p.id+"_"+(zps||"")+"_"+plH(L.join("|"));if(plSeen(k))return;
   T.push({why:"Abweichung zum Packschein",t:(zps?"Zusatz "+zps+" ":"")+"hergerichtet mit "+(L.length===1?"1 Abweichung":L.length+" Abweichungen"),s:esc(p.ev||"")+(f.t?" · "+fmt(f.t).slice(0,6):"")+"<br>"+L.map(esc).join("<br>"),p,seen:k,ord:3})})});
 const ords=M.map(I=>plDig(I.p.ord)).filter(Boolean),evs=M.map(I=>dxNorm(I.p.ev));
 (typeof defs!=="undefined"?defs:[]).forEach(d=>{if(!d.fv||d.del)return;const o=plDig(d.ord),hit=o?ords.includes(o):evs.includes(dxNorm(d.ev));if(!hit)return;const k="fv_"+d.id;if(plSeen(k))return;
  T.push({why:"Kunde verrechnen?",t:"Defekt mit Fremdverschulden",s:esc((dxQ(d)>1?dxQ(d)+" × ":"")+d.art)+(d.desc?" – "+esc(d.desc):"")+" · "+esc(d.ev||"")+(d.fvw?" · „"+esc(d.fvw)+"“":""),d,seen:k,ord:2})});
 return T.sort((a,b)=>a.ord-b.ord)}
function plHot(){try{plSeenSub();const M=packs.filter(plMine).map(auInfo).filter(I=>!I.done||I.g.dev);const n=plTodo(M).length;return n?String(n):""}catch(e){return ""}}
/* Ereignisse eines Tages */
function plEvents(M,t){const E=[];M.forEach(I=>{const p=I.p;
  const day=x=>{if(!x)return 0;const d=pkDay(x),w=new Date(d).getDay();return w===6?pkAddD(d,-1):w===0?pkAddD(d,-2):d};
  if(!pkNoH(p)&&day(pkHDay(p))===t)E.push({c:"h",l:"Herrichten",p,ok:!!I.g.fin,x:I.g.fin?"":(I.g.d?I.g.d+"/"+I.g.n:"")});
  (p.zus||[]).forEach(z=>{if(day(pkZDay(p,z))===t){const f=pkZFin(p,z)||auHerrAll(p,String(z.ps));E.push({c:"z",l:"Zusatz",p,ok:!!f,x:""})}});
  if(p.db&&day(p.db)===t)E.push({c:"x",l:"Raus",p,ok:false,x:""});
  if(p.de&&day(p.de)===t)E.push({c:"r",l:I.B.hasEnd?"Zurückgekommen":"Kommt zurück",p,ok:!!I.B.hasEnd,x:I.B.hasEnd&&I.B.fehlt?"Fehlmaterial":""})});
 /* 1.137: eine Zeile pro Auftrag und Tag (Jürgen: „zu viel Info“) – Herrichten + Raus am selben Tag → nur „Raus“ (✓ = hergerichtet), Zusatz am selben Tag wie Herrichten → mit drin */
 const O=[];E.forEach(e=>{let g=O.find(x=>x.p===e.p);if(!g)O.push(g={p:e.p,E:[]});g.E.push(e)});
 return O.map(g=>{const f=c=>g.E.find(e=>e.c===c),h=f("h"),z=f("z"),x=f("x"),r=f("r");
  /* 1.138: nur „Herrichten“ (noch nicht fertig) oder „Hergerichtet“ – kein „Raus“ (Jürgen) */
  const out=[];if(h||z){const ok=(h?h.ok:true)&&(z?z.ok:true);out.push({c:ok?"d":"h",l:ok?"Hergerichtet":"Herrichten",p:g.p,ok,x:ok?"":(h&&h.x?h.x+" hergerichtet":"")})}
  if(r)out.push(r);return out}).flat()}
function plDraussen(M){return M.filter(I=>!I.done&&(I.B.R.length||I.g.fin&&auOutDay(I.p)&&auOutDay(I.p)<=pkDay(Date.now())||I.over)).map(I=>{const out=I.B.L.reduce((a,e)=>a+Math.max(0,e.soll-e.back),0);return{I,out}}).filter(x=>x.out>0||x.I.over).sort((a,b)=>(b.I.over?1:0)-(a.I.over?1:0)||(a.I.p.de||0)-(b.I.p.de||0))}
function plNews(M){const N=[];M.forEach(I=>{const p=I.p,H=pkH(p);
  const fin=H.fin&&H.fin.t?H.fin:auHerrAll(p,null);if(fin&&fin.t>plPrev){const L=auDevNet(p,null);N.push({t:fin.t,b:esc(p.ev||"")+" hergerichtet",s:L.length?L.map(esc).join(" · "):"ohne Abweichungen",p,r:fmt(fin.t).slice(0,6)})}
  (p.zus||[]).forEach(z=>{const f=pkZFin(p,z)||auHerrAll(p,String(z.ps));if(f&&f.t>plPrev)N.push({t:f.t,b:"Zusatz "+esc(z.ps)+" hergerichtet",s:esc(p.ev||""),p,r:fmt(f.t).slice(0,6)})});
  I.B.R.forEach(r=>{const t=r.closedT||0;if(r.closed&&t>plPrev)N.push({t,b:esc(p.ev||"")+(r.art==="end"?" – Endretoure":" – Teilretoure")+" zurück",s:r.art==="end"?(I.B.fehlt?pkNum(I.B.fehlt)+" Stk fehlen":"vollständig"):"",p,r:r.art==="end"&&!I.B.fehlt?"✓":fmt(t).slice(0,6),ok:r.art==="end"&&!I.B.fehlt})})});
 return N.sort((a,b)=>b.t-a.t).slice(0,8)}
function plView(){plSeenSub();if(!plIn2){plIn2=true;try{plPrev=+localStorage.getItem("tpc_pl_seen")||0}catch(e){}if(!plPrev)plPrev=Date.now()-864e5}
 $("#t").textContent="Projektleiter Übersicht";const all=packs.filter(plMine),M=all.map(auInfo),T=plTodo(M),t0=pkDay(Date.now());
 const nm=plAs?shortName(plAs):String(meName()).split(" ")[0];
 let h='<div class="jv" id="plv">';
 if(plForce){const P=[...new Set(packs.filter(p=>p.pl&&!p._z).map(p=>p.pl))].sort((a,b)=>a.localeCompare(b,"de"));
  h+='<div class="plas"><span>Vorschau – Ansicht als</span><select id="plas"><option value="">mich selbst</option>'+P.map(x=>'<option'+(x===plAs?' selected':'')+'>'+esc(x)+'</option>').join("")+'</select><button type="button" class="lnk" id="plback">‹ Zurück</button></div>'}
 const d=new Date();h+='<div class="plmini"><span><b>'+esc((d.getHours()<11?"Guten Morgen":d.getHours()<18?"Servus":"Guten Abend")+", "+nm)+'</b><small>'+d.toLocaleDateString("de-AT",{weekday:"long",day:"numeric",month:"long",year:"numeric"})+'</small></span><span class="plclock">'+String(d.getHours()).padStart(2,"0")+":"+String(d.getMinutes()).padStart(2,"0")+'</span></div>';
 h+=T.length?'<section class="pltodo"><h3>Zu erledigen <span>'+T.length+'</span></h3>'+T.map((x,i)=>'<div class="plti"><span class="why">'+esc(x.why)+'</span><b>'+esc(x.t)+'</b><small>'+x.s+'</small><span class="plact">'+
   (x.un?'<button type="button" class="p" data-plans="'+i+'">Antworten</button><button type="button" data-plo="'+i+'">Auftrag öffnen</button>':'<button type="button" class="p" data-plseen="'+i+'">Gesehen</button>'+(x.d?'<button type="button" data-pld="'+i+'">Defekt öffnen</button>':'<button type="button" data-plo="'+i+'">Auftrag öffnen</button>'))+'</span></div>').join("")+'</section>'
  :'<div class="pldone">✓ Nichts zu erledigen<small>Das Lager braucht gerade nichts von dir.</small></div>';
 h+='<div class="plbig">'+(can("au_s")?'<button type="button" id="plau">Meine Aufträge</button>':'')+'<button type="button" class="g" id="plmsg">Nachricht ans Lager</button></div>';
 h+='<section class="plsec plask"><h4>Frag mich<span><button type="button" id="plrd">'+(jvReadOn()?'Vorlesen an':'Vorlesen aus')+'</button> · <button type="button" id="plhelp">Was kann ich fragen?</button></span></h4>'+jvAskHtml()+'<p class="mute" style="margin:6px 0 0;font-size:13px">z. B. „Auf welcher Baustelle sind 50m 32A?“ · „Wie viele Defender Midi sind draußen?“ · „Was kommt heute zurück?“</p></section>';
 const today=plEvents(M,t0);
 h+='<section class="plsec"><h4>Heute</h4>'+(today.length?today.map(e=>'<button type="button" class="plli" data-plp="'+esc(e.p.id)+'"><span><b>'+esc(e.p.ev||"")+'</b><small>'+(e.c==="r"&&e.ok?"zurück":e.x||"Auftrag "+esc(e.p.ord||"–"))+'</small></span><span class="r'+(e.ok?' ok':'')+'">'+e.l+'</span></button>').join(""):'<p class="mute" style="margin:0">Heute passiert bei deinen Aufträgen nichts.</p>')+'</section>';
 const m0=pkAddD(pkMon(t0),7*plWk),days=[0,1,2,3,4].map(i=>pkAddD(m0,i)),WD=["Mo","Di","Mi","Do","Fr"];
 h+='<section class="plsec"><h4>'+(plWk?'Nächste Woche':'Diese Woche')+'<button type="button" id="plwk">'+(plWk?'‹ Diese Woche':'Nächste Woche ›')+'</button></h4>'+days.map((t,i)=>{const E=plEvents(M,t);
  return '<div class="plday'+(t===t0?' today':'')+'"><span class="dh">'+WD[i]+'<small>'+pkDM(t)+'</small></span><span class="plev">'+(E.length?E.map(e=>'<button type="button" data-plp="'+esc(e.p.id)+'"><span class="plpill '+e.c+'">'+e.l+'</span><span>'+esc(e.p.ev||"")+(e.x&&e.c==="r"?' <small class="mute">· '+esc(e.x)+'</small>':'')+'</span></button>').join(""):'<span class="mute">–</span>')+'</span></div>'}).join("")+'</section>';
 const DR=plDraussen(M);
 h+='<section class="plsec"><h4>Draußen <span>'+(DR.length===1?'1 Auftrag':DR.length+' Aufträge')+'</span></h4>'+(DR.length?DR.map(({I,out})=>'<button type="button" class="plli" data-plp="'+esc(I.p.id)+'"><span><b>'+esc(I.p.ev||"")+'</b><small>'+(I.B.hasEnd?'Endretoure zurück · Fehlmaterial':I.over?'Dispo abgelaufen '+pkDM(I.p.de):'bis '+pkDM(I.p.de))+(!I.B.hasEnd&&I.B.R.some(r=>r.closed&&r.art==="teil")?' · Teilretoure zurück':'')+'</small></span><span class="r'+(I.over||I.B.hasEnd?' red':'')+'">'+pkNum(out)+' Stk</span></button>').join(""):'<p class="mute" style="margin:0">Gerade ist nichts draußen.</p>')+'</section>';
 const N=plNews(M);
 h+='<section class="plsec"><h4>Neu seit deinem letzten Besuch</h4>'+(N.length?N.map(n=>'<button type="button" class="plli" data-plp="'+esc(n.p.id)+'"><span><b>'+n.b+'</b>'+(n.s?'<small>'+n.s+'</small>':'')+'</span><span class="r'+(n.ok?' ok':' m')+'">'+n.r+'</span></button>').join(""):'<p class="mute" style="margin:0">Nichts Neues.</p>')+'</section>';
 if(!all.length)h+='<p class="mute">Keine Packliste mit „'+esc(plAs||auMyName())+'“ als Projektleiter gefunden. Der Name in der Packliste muss zu deinem Namen in der App passen.</p>';
 h+='</div>';$("#app").innerHTML=h;
 const q=s=>document.querySelectorAll(s);
 q("[data-plp]").forEach(b=>b.onclick=()=>{curAu=b.dataset.plp;go("auopen")});
 q("[data-plo]").forEach(b=>b.onclick=()=>{curAu=T[+b.dataset.plo].p.id;go("auopen")});
 q("[data-pld]").forEach(b=>b.onclick=()=>{curDef=T[+b.dataset.pld].d.id;go("defopen")});
 q("[data-plseen]").forEach(b=>b.onclick=async()=>{b.disabled=true;await plSetSeen(T[+b.dataset.plseen].seen);plView()});
 q("[data-plans]").forEach(b=>b.onclick=()=>{const x=T[+b.dataset.plans];if(!can("au_b")&&!plAs)return errBox("Antworten darfst du nicht (Recht „Aufträge – Antworten“).");if(x.un.length===1)auAnsDlg(x.p,x.un[0]);else{curAu=x.p.id;go("auopen")}});
 const au=$("#plau");if(au)au.onclick=()=>go("au");$("#plmsg").onclick=()=>{const own=M.filter(I=>!I.done);if(own.length===1)return auMsgDlg(own[0].p);curAu=null;go("au");toast("Auftrag wählen, dann „Nachricht ans Lager“",1)};
 try{jvAskBind();const ph=$("#plhelp");if(ph)ph.onclick=jvHelpOpen;const rd=$("#plrd");if(rd)rd.onclick=()=>{const on=!jvReadOn();jvLS("tpc_jv_askread",on?"1":"0");rd.textContent=on?"Vorlesen an":"Vorlesen aus";if(!on)jvStop()};const q0=$("#jvaq");if(q0)q0.placeholder="Frag nach Material, Aufträgen …"}catch(e){}
 $("#plwk").onclick=()=>{plWk=plWk?0:1;plView()};
 const as=$("#plas");if(as)as.onchange=()=>{plAs=as.value;plView()};const bk=$("#plback");if(bk)bk.onclick=()=>{plForce=false;plAs="";draw()}}
/* Besuch endet auf der Hauptseite oder im Hintergrund */
setInterval(()=>{if(typeof view==="undefined")return;if(plIn2&&(view==="start"||document.visibilityState==="hidden")){if(!plForce)try{localStorage.setItem("tpc_pl_seen",String(Date.now()))}catch(e){}plIn2=false}if(plForce&&view==="start"){plForce=false;plAs=""}},800);
document.addEventListener("click",e=>{const t=e.target&&e.target.closest&&e.target.closest("#pladm");if(t){plForce=true;plAs="";draw()}});
