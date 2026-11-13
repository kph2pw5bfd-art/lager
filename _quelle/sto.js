/* ===== Packliste „Storniert“ (1.173, Jürgen 13.11.) =====
   Job storniert, Packliste evtl. schon hergerichtet. Zahnrad → „Auftrag storniert“ (nur Recht Packlisten-Hochladen), Grund freiwillig.
   packh.sto = {by,t,why}. pkSto/pkState (pack.js): gilt als erledigt „Storniert“, pkHDay = 0 → nicht mehr bei Herrichten/Wand/Woche/Briefing,
   nicht bei Dispo abgelaufen, Fehlmaterial, Vorschlägen „Zu viel zurück“, PL-„Zu erledigen“. Zurückräumen macht das Lager ohne App (Jürgens Wahl).
   „Storno zurücknehmen“ stellt alles wieder her. 3 Monate nach dem Storno wird die Packliste automatisch gelöscht (Papierkorb 30 Tage). */
const STO_KEEP=90*864e5;
function pkStoDlg(P){if(!can("pk_b"))return;const so=pkSto(P);
 if(so)return ask("Storno von „"+(P.ev||P.ord||"")+"“ zurücknehmen? Die Packliste ist dann wieder normal offen.",async()=>{await pkHSet(P,{sto:null});toast("Storno zurückgenommen",1);if(view==="packopen")packOpenView()});
 const g=pkProg(P),hz=g.d>0||(P.zus||[]).some(z=>pkZProg(P,z.ps).d>0),o=document.createElement("div");o.className="ov";
 o.innerHTML='<div class="card" style="width:100%;max-width:440px;margin:0"><b>Auftrag storniert</b><p class="mute" style="margin:4px 0 8px">'+esc(P.ev||"")+' · Auftrag '+esc(P.ord||"–")+(P.pl?' · '+esc(shortName(P.pl)):'')+'</p>'+
  '<p style="margin:0 0 8px">Die Packliste bleibt erhalten und wird als <b>Storniert</b> markiert. Sie muss nicht mehr hergerichtet werden und zählt nicht bei „Dispo abgelaufen“ oder „Fehlmaterial“. Nach 3 Monaten wird sie automatisch gelöscht.</p>'+
  (hz?'<div class="pkhint warn" style="margin:0 0 8px">Es ist schon Material hergerichtet – bitte zurückräumen.</div>':'')+
  '<label class="mute" for="pkstow">Grund (optional)</label><textarea id="pkstow" rows="2" placeholder="z. B. Kunde hat abgesagt"></textarea>'+
  '<div class="row" style="margin-top:8px"><button class="btn ghost" id="pkstoc" type="button">Abbrechen</button><button class="btn" id="pkstoo" type="button" style="background:#5b6573;border-color:#5b6573">Storniert</button></div></div>';
 document.body.appendChild(o);o.querySelector("#pkstoc").onclick=()=>o.remove();
 o.querySelector("#pkstoo").onclick=async()=>{const why=o.querySelector("#pkstow").value.trim();o.remove();await pkHSet(P,{sto:{by:me,t:Date.now(),why}});toast("Packliste als storniert markiert",1);if(view==="packopen")packOpenView()}}
/* automatisch löschen: 3 Monate nach dem Storno, einmal am Tag auf einem Gerät mit Löschen-Recht */
async function pkStoClean(now){now=now||Date.now();let n=0;for(const p of packs.slice()){const so=pkSto(p);if(!so||now-so.t<STO_KEEP)continue;
  try{if(typeof mfDelAll==="function")await mfDelAll(p);await db.doc("pack/"+p.id).delete();if(packh[p.id])await db.doc("packh/"+p.id).delete().catch(()=>{});n++}catch(e){console.warn("Storno aufräumen",e)}}return n}
function pkStoTick(){try{if(typeof me==="undefined"||!me||!can("pk_l")||!packs.length)return;const d=new Date().toDateString();let last="";try{last=localStorage.getItem("tpc_stoclean")||""}catch(e){}if(last===d)return;try{localStorage.setItem("tpc_stoclean",d)}catch(e){}pkStoClean()}catch(e){console.warn("Storno aufräumen",e)}}
setTimeout(pkStoTick,40000);setInterval(pkStoTick,3600e3);
(function(){try{const st=document.createElement("style");st.textContent='.pkhint.sto{background:#5b6573;color:#fff;border-color:#5b6573;font-weight:700}.tag.pksto{background:#5b6573;color:#fff;border-color:#5b6573}';document.head.appendChild(st)}catch(e){}})();
