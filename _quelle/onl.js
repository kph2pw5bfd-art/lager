/* ===== Wer ist online? (1.171) =====
   Jedes Gerät schreibt, solange die App offen und sichtbar ist, etwa jede Minute einen Herzschlag in docs `online`
   (id = <Benutzer-ID>_<Geräte-ID>): {u, dev, b (Bereich = Seitentitel), t, vis, v, tn/tid (Lager-Tablet: gewählter Name / Person), p_<Person-ID>: Zeit}.
   Bereichswechsel wird sofort gemeldet (höchstens alle 10 s), beim Verlassen/Ausblenden vis:false.
   Anzeige nur für Admins in der Benutzerverwaltung (Punkt + „Online“ bzw. „Zuletzt online …“, Gerät, Bereich).
   Lesen darf laut online.sql nur der Admin, schreiben jeder nur seinen eigenen Eintrag. */
const ONL_BEAT=60000,ONL_FRESH=150000;
let onlLater=null,onlLoaded=false,onlLoadT=0,onlLast=0,onlLastB="",onlDocs=[],onlTimer=null,onlPoll=null;
function onlDevId(){try{let d=localStorage.getItem("tpc_devid");if(!d){d=Math.random().toString(36).slice(2,10)+Date.now().toString(36).slice(-4);localStorage.setItem("tpc_devid",d)}return d}catch(e){return "x"}}
function onlDev(ua,tp){ua=ua==null?navigator.userAgent:ua;tp=tp==null?(navigator.maxTouchPoints||0):tp;
 if(/iPad/.test(ua)||(/Macintosh/.test(ua)&&tp>1))return "iPad";
 if(/iPhone/.test(ua))return "iPhone";
 if(/Android/.test(ua))return /Mobile/.test(ua)?"Android-Handy":"Android-Tablet";
 if(/Windows/.test(ua))return "PC";
 if(/Macintosh|Mac OS/.test(ua))return "Mac";
 return "Computer"}
function onlArea(){const t=document.getElementById("t");return String(t&&t.textContent||"").trim().slice(0,50)}
function onlBeat(vis,force){try{
 if(typeof me==="undefined"||!me||typeof db==="undefined"||!db)return;
 vis=vis==null?document.visibilityState==="visible":vis;const n=Date.now(),b=onlArea();
 if(!force&&vis&&n-onlLast<(b!==onlLastB?10000:ONL_BEAT-2000)){if(b!==onlLastB&&!onlLater)onlLater=setTimeout(()=>{onlLater=null;onlBeat(true)},10000-(n-onlLast)+50);return}
 onlLast=n;onlLastB=b;
 const d={u:me,dev:tabOn()?"Lager-Tablet":onlDev(),b,t:n,vis:!!vis,v:APPV};
 if(tabOn()){const a=TAB.act;d.tn=a&&a.name?a.name:"";d.tid=a&&a.id?a.id:"";if(a&&a.id&&vis)d["p_"+a.id]=n}
 const ref=db.doc("online/"+me+"_"+onlDevId());
 ref.update(d).catch(x=>{if(/nicht gefunden/i.test(String(x&&x.message||x)))return ref.set(d)}).catch(()=>{})}catch(e){}}
function onlStart(){if(onlTimer)return;
 onlTimer=setInterval(()=>{if(document.visibilityState==="visible")onlBeat(true)},ONL_BEAT);
 document.addEventListener("visibilitychange",()=>onlBeat(document.visibilityState==="visible",true));
 window.addEventListener("pagehide",()=>onlBeat(false,true));
 const t=document.getElementById("t");if(t&&window.MutationObserver)new MutationObserver(()=>setTimeout(()=>onlBeat(true),300)).observe(t,{childList:true,characterData:true,subtree:true});
 onlBeat(true,true)}
/* Start, sobald jemand angemeldet ist und die Datenbank steht */
(function onlWait(){if(typeof me!=="undefined"&&me&&typeof db!=="undefined"&&db)return onlStart();setTimeout(onlWait,2000)})();

/* ---- Anzeige (Admin) ---- */
async function onlLoad(){try{const {data,error}=await SB.from("docs").select("id,data").eq("col","online").range(0,999);if(error)throw error;onlDocs=(data||[]).map(r=>({id:r.id,...r.data}))}catch(e){}return onlDocs}
function onlOn(d,n){return !!(d&&d.vis&&(n||Date.now())-(+d.t||0)<ONL_FRESH)}
function onlWhen(t,n){n=n||Date.now();const m=Math.round((n-t)/60000);if(m<1)return "gerade eben";if(m<60)return "vor "+m+" Min.";
 const D=new Date(t),hm=String(D.getHours()).padStart(2,"0")+":"+String(D.getMinutes()).padStart(2,"0"),T0=new Date(n);T0.setHours(0,0,0,0);
 const dd=Math.floor((T0-new Date(D.getFullYear(),D.getMonth(),D.getDate()))/864e5);
 if(dd<=0)return "heute "+hm;if(dd===1)return "gestern "+hm;
 if(dd<7)return ["So","Mo","Di","Mi","Do","Fr","Sa"][D.getDay()]+" "+D.getDate()+"."+(D.getMonth()+1)+". "+hm;
 return D.getDate()+"."+(D.getMonth()+1)+"."+D.getFullYear()}
/* Stand einer Person: eigene Geräte + Lager-Tablet (wenn sie dort gewählt war) */
function onlOf(uid,n){n=n||Date.now();const own=onlDocs.filter(d=>d.u===uid),now=[];let lastT=0,lastD=null;
 own.forEach(d=>{if(onlOn(d,n))now.push({dev:d.dev,b:d.b,tn:d.dev==="Lager-Tablet"&&d.tn?shortName(d.tn):""});if(+d.t>lastT){lastT=+d.t;lastD={dev:d.dev,b:d.b}}});
 onlDocs.forEach(d=>{if(d.u===uid)return;const pt=+d["p_"+uid]||0;if(!pt)return;
  if(onlOn(d,n)&&d.tid===uid)now.push({dev:"am Lager-Tablet",b:d.b});
  if(pt>lastT){lastT=pt;lastD={dev:"am Lager-Tablet",b:d.tid===uid?d.b:""}}});
 return{now,lastT,lastD}}
function onlLine(uid){if(!owner)return "";const o=onlOf(uid);
 const bits=x=>[x.dev,x.tn?x.tn+" arbeitet":"",x.b].filter(Boolean).map(esc).join(" · ");
 let h;
 if(o.now.length)h='<span class="onld on"></span><span><b>Online</b> · '+o.now.map(bits).join("<br>")+'</span>';
 else if(o.lastT)h='<span class="onld"></span><span>Zuletzt online: '+esc(onlWhen(o.lastT))+(o.lastD&&bits(o.lastD)?' · '+bits(o.lastD):'')+'</span>';
 else h='<span class="onld"></span><span>Noch nicht online gewesen (seit Version 1.171)</span>';
 return '<div class="onl" data-onl="'+esc(uid)+'">'+h+'</div>'}
function onlRank(uid){const o=onlOf(uid);return o.now.length?0:1}
/* Benutzerverwaltung: beim Öffnen laden, solange offen alle 30 s nachladen und nur die Zeilen tauschen */
function onlUsers(){if(!owner)return;
 const fresh=()=>{document.querySelectorAll("[data-onl]").forEach(el=>{const w=document.createElement("div");w.innerHTML=onlLine(el.dataset.onl);if(w.firstChild)el.replaceWith(w.firstChild)})};
 const get=()=>{onlLoadT=Date.now();return onlLoad().then(()=>{if(!onlLoaded){onlLoaded=true;if(typeof view!=="undefined"&&view==="users")return draw()}fresh()})};
 if(Date.now()-onlLoadT>10000)get();
 if(!onlPoll)onlPoll=setInterval(()=>{if(typeof view==="undefined"||view!=="users"||!document.querySelector("[data-onl]")){clearInterval(onlPoll);onlPoll=null;return}if(document.visibilityState==="visible")get()},30000)}
(function(){try{const st=document.createElement("style");st.textContent='.onl{display:flex;gap:8px;align-items:flex-start;margin-top:4px;font-size:13.5px;line-height:1.35;color:var(--mute)}.onld{width:10px;height:10px;border-radius:50%;background:#9aa4b2;flex:none;margin-top:4px}.onld.on{background:#1e9e55;box-shadow:0 0 0 3px rgba(30,158,85,.25)}.onl b{color:#1e7a46}@media (prefers-color-scheme:dark){:root:not([data-theme="light"]) .onl b{color:#6fd39a}}:root[data-theme="dark"] .onl b{color:#6fd39a}';document.head.appendChild(st)}catch(e){}})();
