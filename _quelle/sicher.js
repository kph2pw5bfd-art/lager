/* ===== Datensicherung + Papierkorb (ab 1.102, nur Administrator) =====
   Datenbank: sicherung.sql (Trigger fängt JEDES Löschen in docs → Tabelle papierkorb, 30 Tage; Funktionen papierkorb_liste,
   papierkorb_zurueck, sicherung_stand). Nächtliche Sicherung über GitHub (Repo lager-sicherung, Schlüssel SB_BACKUP_KEY).
   App-Verwaltung: Abschnitt „Datensicherung“ (Stand der nächtlichen Sicherung, „Datensicherung herunterladen“) und „Papierkorb“.
   Hinweis auf der Hauptseite (einmal am Tag): manuelle Sicherung älter als 7 Tage oder nächtliche Sicherung älter als 2 Tage. */
const BKL="tpc_bk_last",BKH="tpc_bk_hint";
const bkAdm=()=>typeof realOwner!=="undefined"&&!!realOwner;
const bkDays=t=>t?Math.floor((Date.now()-t)/864e5):null;
const bkAgo=t=>{const d=bkDays(t);return d===null?"noch nie":d===0?"heute":d===1?"gestern":"vor "+d+" Tagen"};
function bkLast(){try{return +localStorage.getItem(BKL)||0}catch(e){return 0}}
async function bkStand(){try{const {data,error}=await SB.rpc("sicherung_stand");if(error)throw error;return data||null}catch(e){return{err:String(e&&e.message||e)}}}
async function bkBlock(){if(!bkAdm())return;const app=$("#app");if(!app)return;
 app.insertAdjacentHTML("beforeend",'<h3 style="margin:18px 0 4px">Datensicherung</h3><div class="card bkcard" style="cursor:default"><div id="bkst" class="mute">Stand wird geladen …</div>'+
  '<button class="btn" id="bkdl" type="button" style="margin-top:10px">Datensicherung herunterladen</button><div class="mute" style="font-size:13px;margin-top:6px">Alle Daten inkl. Fotos als eine Datei. Zuletzt auf diesem Gerät: <b id="bkll">'+bkAgo(bkLast())+'</b>.</div></div>'+
  '<h3 style="margin:18px 0 4px">Papierkorb</h3><p class="mute" style="margin:0 0 8px">Alles, was in der App gelöscht wird, bleibt hier 30 Tage und kann wiederhergestellt werden.</p><button class="btn ghost" id="bktr" type="button">Papierkorb öffnen <span id="bktrn"></span></button>');
 $("#bkdl").onclick=bkDownload;$("#bktr").onclick=bkTrash;
 const s=await bkStand(),el=$("#bkst");if(!el)return;
 if(!s||s.err){el.innerHTML='<span class="bkw">Papierkorb und automatische Sicherung sind noch nicht eingerichtet – <b>sicherung.sql</b> in Supabase ausführen.</span>';$("#bktr").disabled=true;return}
 if(s.korb)$("#bktrn").textContent="("+s.korb+")";
 const z=s.zuletzt?Date.parse(s.zuletzt):0,old=!z||bkDays(z)>=2;
 el.innerHTML='<b>Automatische Sicherung (jede Nacht):</b> '+(z?'<span class="'+(old?'bkw':'bkok')+'">zuletzt '+bkAgo(z)+', '+fmt(z).slice(-5)+' Uhr · '+(s.n||0).toLocaleString("de-AT")+' Einträge</span>':'<span class="bkw">noch keine – GitHub-Sicherung einrichten (siehe Anleitung)</span>')+
  '<br><span style="font-size:13px">Jetzt in der App: '+(s.jetzt||0).toLocaleString("de-AT")+' Einträge'+(z&&s.n&&s.jetzt<s.n*0.8?' – <span class="bkw">deutlich weniger als bei der letzten Sicherung!</span>':'')+'</span>'}
/* Alles als eine Datei (JSON) – am Handy über Teilen (In Dateien sichern), am PC als Download */
async function bkDownload(){const b=$("#bkdl");if(!b||b.disabled)return;b.disabled=true;const t0=b.textContent;
 try{const all=[];for(let from=0;;from+=300){b.textContent="Wird gesammelt … "+all.length;const {data,error}=await SB.from("docs").select("col,id,data,updated_at").order("col").order("id").range(from,from+299);if(error)throw error;all.push(...data);if(data.length<300)break}
  const d=new Date(),ymd=d.getFullYear()+"-"+String(d.getMonth()+1).padStart(2,"0")+"-"+String(d.getDate()).padStart(2,"0");
  const blob=new Blob([JSON.stringify({app:"TPC Lager App",version:APPV,erstellt:d.toISOString(),von:meName(),anzahl:all.length,profile:PROFS,docs:all})],{type:"application/json"}),name="TPC-Lager-Sicherung_"+ymd+".json";
  const f=new File([blob],name,{type:"application/json"});let done=false;
  if(window.matchMedia&&matchMedia("(pointer:coarse)").matches&&navigator.canShare&&navigator.canShare({files:[f]})){try{await navigator.share({files:[f],title:name});done=true}catch(e){if(e&&e.name==="AbortError"){b.disabled=false;b.textContent=t0;return}}}
  if(!done)await DLX.save({filename:name,data:blob});
  try{localStorage.setItem(BKL,String(Date.now()))}catch(e){}if($("#bkll"))$("#bkll").textContent="heute";
  toast("Datensicherung gespeichert: "+all.length.toLocaleString("de-AT")+" Einträge ("+Math.max(1,Math.round(blob.size/1048576))+" MB)",1)}
 catch(e){console.error(e);errBox("Datensicherung fehlgeschlagen ("+(e&&e.message||e)+"). Bitte mit Netz nochmal versuchen.")}
 b.disabled=false;b.textContent=t0}
/* Papierkorb */
const BK_T={retour:"Retourschein",pack:"Packliste",packh:"Herricht-Stand",defekte:"Defekt",infos:"Info an das Lager",lists:"Materialliste",fotos:"Foto",rkat:"Artikel",artikel:"Artikel (alt)",titel:"Titel",rolle:"Benutzer-Rolle",wbnote:"Besprechungspunkt",jverin:"Erinnerung",fehlartikel:"Fehlender Artikel",abzu:"Zuordnung (zu viel zurück)",plaw:"Antwort Projektleiter",werkstatt:"Werkstatt",lager:"Lager",users:"Benutzer"};
const bkSide=c=>c==="fotos"||c==="packh";
function bkGroups(L){const used=new Set(),G=[];
 L.filter(r=>!bkSide(r.col)).forEach(r=>{const t=Date.parse(r.deleted_at),sib=L.filter(x=>x!==r&&!used.has(x.nr)&&Math.abs(Date.parse(x.deleted_at)-t)<=6e5&&(x.doc_id===r.doc_id||(x.col==="fotos"&&(x.doc_id.startsWith(r.doc_id+"-")||x.doc_id.startsWith(r.doc_id+"r-")))));
  sib.forEach(x=>used.add(x.nr));used.add(r.nr);G.push({r,sib})});
 L.filter(r=>!used.has(r.nr)).forEach(r=>G.push({r,sib:[]}));
 return G.sort((a,b)=>Date.parse(b.r.deleted_at)-Date.parse(a.r.deleted_at))}
function bkLabel(r){const i=r.info||{},main=i.ev||i.name||i.art||i.nm||i.title||i.txt||i.t||r.doc_id;return{typ:BK_T[r.col]||r.col,main,sub:[i.ord?"Auftrag "+i.ord:"",i.nr?"Nr. "+i.nr:"",i.ps&&r.col==="pack"?"Packschein "+i.ps:""].filter(Boolean).join(" · ")}}
async function bkTrash(){const o=document.createElement("div");o.className="ov";
 o.innerHTML='<div class="card" style="width:100%;max-width:520px;margin:0;max-height:92vh;overflow:auto"><div class="row" style="align-items:center"><b style="flex:1;font-size:17px">Papierkorb</b><button class="btn ghost s" id="bkx" type="button" style="flex:0 0 auto;width:auto">Schließen</button></div>'+
  '<p class="mute" style="margin:4px 0 8px;font-size:13px">Gelöschtes bleibt 30 Tage. „Wiederherstellen“ holt den Eintrag samt Fotos bzw. Herricht-Stand zurück.</p><input id="bkq" placeholder="Suchen: Veranstaltung, Auftrag, Artikel …" autocomplete="off"><div id="bkl" class="mute">Wird geladen …</div></div>';
 document.body.appendChild(o);o.querySelector("#bkx").onclick=()=>o.remove();let L=[];
 const draw=()=>{const q=o.querySelector("#bkq").value.trim().toLowerCase(),G=bkGroups(L).filter(g=>{if(!q)return true;const l=bkLabel(g.r);return (l.typ+" "+l.main+" "+l.sub).toLowerCase().includes(q)});
  o.querySelector("#bkl").innerHTML=G.length?G.map(g=>{const l=bkLabel(g.r),nf=g.sib.filter(x=>x.col==="fotos").length,nh=g.sib.some(x=>x.col==="packh");
   return '<div class="bkrow"><div class="bkt"><small>'+esc(l.typ)+'</small><b>'+esc(l.main)+'</b>'+(l.sub?'<small>'+esc(l.sub)+'</small>':'')+'<small>gelöscht '+fmt(Date.parse(g.r.deleted_at))+(g.r.deleted_by?' von '+esc(nm(g.r.deleted_by)):'')+(nf?' · mit '+nf+(nf===1?' Foto':' Fotos'):'')+(nh?' · mit Herricht-Stand':'')+'</small></div><button class="btn s" type="button" data-bkr="'+g.r.nr+'">Wiederherstellen</button></div>'}).join(""):'<div class="mute" style="padding:10px 0">'+(q?'Nichts gefunden.':'Der Papierkorb ist leer.')+'</div>';
  o.querySelectorAll("[data-bkr]").forEach(b=>b.onclick=()=>{const g=G.find(x=>String(x.r.nr)===b.dataset.bkr),l=bkLabel(g.r);
   ask(l.typ+" „"+l.main+"“ wiederherstellen?",async()=>{try{const {data,error}=await SB.rpc("papierkorb_zurueck",{p_nr:g.r.nr});if(error)throw error;
     toast(data.schon&&!data.ok?"Ist schon wieder vorhanden – nichts überschrieben":"Wiederhergestellt"+(data.ok>1?" ("+data.ok+" Einträge)":"")+(data.schon?" – "+data.schon+" schon vorhanden, nicht überschrieben":""),1);
     if(db.reloadAll)db.reloadAll();await load()}catch(e){console.error(e);errBox("Wiederherstellen fehlgeschlagen ("+(e&&e.message||e)+").")}})})};
 const load=async()=>{try{const {data,error}=await SB.rpc("papierkorb_liste");if(error)throw error;L=data||[];draw()}catch(e){o.querySelector("#bkl").innerHTML='<span class="bkw">Papierkorb nicht erreichbar – ist sicherung.sql ausgeführt? ('+esc(e&&e.message||e)+')</span>'}};
 o.querySelector("#bkq").oninput=draw;load()}
/* Hinweis auf der Hauptseite: einmal am Tag */
async function bkHint(){if(!bkAdm())return;const d=new Date().toDateString();try{if(localStorage.getItem(BKH)===d)return;localStorage.setItem(BKH,d)}catch(e){return}
 const s=await bkStand();if(!s||s.err)return;const z=s.zuletzt?Date.parse(s.zuletzt):0;
 if(s.schluessel&&(!z||bkDays(z)>=2))return toast("Achtung: Die automatische Sicherung lief "+(z?"zuletzt "+bkAgo(z):"noch nie")+". App-Verwaltung → Datensicherung",1);
 const m=bkLast();if(!m||bkDays(m)>=7)toast("Datensicherung: letzte manuelle "+bkAgo(m)+". App-Verwaltung → Datensicherung herunterladen",1)}
