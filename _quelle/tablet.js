/* ===== Lager-Tablet (ab 1.66) =====
   Ein Konto als "Gemeinsames Gerät" markiert (rolle.tab). Beim Start und nach 30 Min. ohne Bedienung: Namenskacheln
   (Personen mit rolle.tl = "am Lager-Tablet") + "Anderer Name …" für Helfer ohne Konto (bis Ende der Woche gemerkt, nur auf dem Gerät).
   Rechte bleiben die des Tablet-Kontos. Der gewählte Name wird beim Speichern als <feld>_as mitgeschrieben (build.py hängt
   ...tabAs("by") usw. an jedes by:me/mod:me/…) und überall als "Name (Tablet)" angezeigt (nmA). */
const TAB={act:null,last:0,shown:false,names:{}};
const TAB_IDLE=30*60e3,TAB_KEY="tpc_tab_act",TAB_HLP="tpc_tab_helpers";
const tabOn=()=>!!(typeof ROL!=="undefined"&&me&&ROL[me]&&ROL[me].tab===true);
function tabAs(k){return tabOn()&&TAB.act&&TAB.act.name?{[k+"_as"]:TAB.act.name}:{}}
function nmA(o,k){if(!o)return nm(undefined);const a=o[k+"_as"];return a?a+" (Tablet)":nm(o[k])}
const meName=()=>tabOn()&&TAB.act?TAB.act.name:(names[me]||"");
function tabLS(k,v){try{if(v===undefined)return JSON.parse(localStorage.getItem(k)||"null");if(v===null)localStorage.removeItem(k);else localStorage.setItem(k,JSON.stringify(v))}catch(e){return null}}
function tabWeekEnd(){const d=new Date();d.setHours(23,59,59,0);d.setDate(d.getDate()+(7-d.getDay())%7);return d.getTime()}
function tabHelpers(){const now=Date.now(),L=(tabLS(TAB_HLP)||[]).filter(h=>h&&h.n&&h.exp>now);tabLS(TAB_HLP,L);return L}
function tabPeople(){return Object.keys(ROL).filter(id=>ROL[id]&&ROL[id].tl===true&&id!==me)}
async function tabLoadNames(){const ids=tabPeople().filter(id=>!names[id]);if(!ids.length)return;try{const {data}=await SB.from("profiles").select("id,name").in("id",ids);(data||[]).forEach(p=>{if(p.name)names[p.id]=p.name})}catch(e){}}
function tabSet(a){TAB.act=a;TAB.last=Date.now();tabLS(TAB_KEY,a?{...a,t:TAB.last}:null);const o=$("#tabov");if(o)o.remove();TAB.shown=false;draw()}
/* Header: Name + Wechseln */
function tabHead(){const w=$("#who");if(!w)return;if(!tabOn()){w.textContent=names[me]||"";return}
 w.innerHTML=esc(TAB.act?TAB.act.name:"Lager-Tablet")+' <button type="button" id="tabsw" class="tabsw">Wechseln</button>';const b=$("#tabsw");if(b)b.onclick=e=>{e.stopPropagation();tabPick(true)}}
/* Auswahl */
async function tabPick(force){if(!tabOn()){const o=$("#tabov");if(o)o.remove();return}if(TAB.shown&&!force)return;TAB.shown=true;await tabLoadNames();
 const P=tabPeople().map(id=>({id,name:names[id]||"…"})).sort((a,b)=>a.name.localeCompare(b.name,"de")),H=tabHelpers();
 let o=$("#tabov");if(!o){o=document.createElement("div");o.id="tabov";document.body.appendChild(o)}
 const ini=n=>String(n).trim().split(/\s+/).map(w=>w[0]||"").join("").slice(0,2).toUpperCase();
 o.innerHTML='<div class="tabbox"><h2>Wer arbeitet gerade?</h2><p class="mute">Lager-Tablet · Name antippen</p><div class="tabgrid">'+
  P.map(p=>'<button type="button" class="tabt" data-tbu="'+esc(p.id)+'"><span class="tabi">'+esc(ini(p.name))+'</span><b>'+esc(p.name)+'</b></button>').join("")+
  H.map((h,i)=>'<button type="button" class="tabt hlp" data-tbh="'+i+'"><span class="tabi">'+esc(ini(h.n))+'</span><b>'+esc(h.n)+'</b><small>Helfer</small></button>').join("")+
  '<button type="button" class="tabt other" id="tbother"><span class="tabi">+</span><b>Anderer Name …</b></button></div>'+
  (P.length?'':'<p class="mute" style="margin-top:12px">Noch keine Namen freigegeben. Der Admin hakt in der Benutzerverwaltung bei den Kollegen „am Lager-Tablet“ an.</p>')+
  '<div id="tbin" class="tabin" hidden><label for="tbname">Name</label><input id="tbname" maxlength="40" autocomplete="off" placeholder="Vor- und Nachname"><div class="row"><button type="button" class="btn ghost" id="tbx">Abbrechen</button><button type="button" class="btn" id="tbok">Weiter</button></div><p class="mute" style="font-size:13px;margin:6px 0 0">Der Name bleibt bis Ende der Woche als Kachel auf diesem Tablet.</p></div>'+
  (TAB.act&&force?'<button type="button" class="lnk" id="tbback" style="margin-top:10px">Zurück (weiter als '+esc(TAB.act.name)+')</button>':'')+'</div>';
 o.querySelectorAll("[data-tbu]").forEach(b=>b.onclick=()=>tabSet({id:b.dataset.tbu,name:names[b.dataset.tbu]||"?"}));
 o.querySelectorAll("[data-tbh]").forEach(b=>b.onclick=()=>{const h=H[+b.dataset.tbh];tabSet({name:h.n,helper:true})});
 const inp=o.querySelector("#tbname");
 o.querySelector("#tbother").onclick=()=>{o.querySelector("#tbin").hidden=false;setTimeout(()=>inp.focus(),50)};
 o.querySelector("#tbx").onclick=()=>{o.querySelector("#tbin").hidden=true;inp.value=""};
 const ok=()=>{const n=inp.value.trim().replace(/\s+/g," ");if(n.length<2)return inp.classList.add("bad");const L=tabHelpers().filter(h=>h.n.toLowerCase()!==n.toLowerCase());L.push({n,exp:tabWeekEnd()});tabLS(TAB_HLP,L);tabSet({name:n,helper:true})};
 o.querySelector("#tbok").onclick=ok;inp.onkeydown=e=>{if(e.key==="Enter")ok()};
 const bk=o.querySelector("#tbback");if(bk)bk.onclick=()=>{o.remove();TAB.shown=false;TAB.last=Date.now()}}
/* Prüfen: beim Start, nach Rechte-Änderung, jede halbe Minute */
function tabCheck(){if(!tabOn()){if(TAB.act){TAB.act=null}const o=$("#tabov");if(o)o.remove();TAB.shown=false;return}
 if(!TAB.act){const s=tabLS(TAB_KEY);if(s&&s.name&&Date.now()-(s.t||0)<TAB_IDLE){TAB.act={id:s.id,name:s.name,helper:!!s.helper};TAB.last=s.t}}
 if(!TAB.act||Date.now()-TAB.last>TAB_IDLE){if(TAB.act){TAB.act=null;tabLS(TAB_KEY,null);draw()}tabPick(false)}}
let tabTouch=0;
["pointerdown","keydown","touchstart"].forEach(ev=>document.addEventListener(ev,()=>{if(!TAB.act)return;const n=Date.now();if(n-TAB.last>TAB_IDLE)return tabCheck();TAB.last=n;if(n-tabTouch>20e3){tabTouch=n;tabLS(TAB_KEY,{...TAB.act,t:n})}},{passive:true,capture:true}));
setInterval(()=>{if(typeof me!=="undefined"&&me)tabCheck()},30e3);
document.addEventListener("visibilitychange",()=>{if(document.visibilityState==="visible"&&typeof me!=="undefined"&&me)tabCheck()});
