/* ===== „Kein Material“ (1.184, Jürgen 23.11.) =====
   Projektleiter schreiben z. B. „Übernachtungskosten“ als Position in den Packschein (ohne Artikelnummer, Namen unterschiedlich).
   In der Packliste Position antippen → „Kein Material – rausnehmen“: packh h_<Pos>.km = true. Name wird gemerkt (docs kmat, id = Name normalisiert)
   und in allen Packlisten automatisch rausgenommen (nur Positionen, die nicht in der Artikelliste stehen). „Doch Material“: km=false + Name vergessen.
   Technisch wie Lager 55: pkL55() liefert auch für Kein Material true (→ nicht im Fortschritt, keine Abweichung, nicht in Info-Mail/Monteur/Scan),
   aber eigene graue Gruppe, nicht im PDF, nicht im Abgleich, nicht in „Material“ bei Meine Aufträge. */
let KMAT={};
function kmNorm(t){return String(t||"").toLowerCase().replace(/ä/g,"ae").replace(/ö/g,"oe").replace(/ü/g,"ue").replace(/ß/g,"ss").replace(/[^a-z0-9]+/g," ").trim()}
function kmId(t){return kmNorm(t).replace(/ /g,"_").slice(0,80)||"x"}
function pkKM(x,h){if(!x)return false;if(h&&typeof h.km==="boolean")return h.km;if(pkKat(x))return false;return !!KMAT[kmId(x.t)]}
async function kmSet(P,i,on){const x=pkPosAll(P)[i],k=pkKeys(P)[i],h=pkH(P)[k]||{};
 if(pkRowFin(P,i))return toast("Herrichten ist abgeschlossen – zum Ändern erst „Wieder öffnen“.",1);
 const v={...h,km:on,by:me,t:Date.now()};if(on){delete v.l55;delete v.ok;delete v.n;delete v.alt;delete v.nb}
 await pkHSet(P,{[k]:v});
 try{const id=kmId(x.t);if(on)await db.doc("kmat/"+id).set({n:x.t,by:me,t:Date.now()});else if(KMAT[id])await db.doc("kmat/"+id).delete()}catch(e){}
 toast(on?"„"+x.t+"“ ist kein Material – wird ab jetzt überall rausgenommen":"„"+x.t+"“ zählt wieder als Material",1)}
function kmDlg(P,i){const x=pkPosAll(P)[i],k=pkKeys(P)[i],h=pkH(P)[k]||{},o=document.createElement("div");o.className="ov";
 const who=h.km===true&&h.by?nmA(h,"by")+", "+fmt(h.t).slice(0,6):"automatisch (Name gemerkt)";
 o.innerHTML='<div class="card" style="width:100%;max-width:420px;margin:0"><b style="font-size:17px">'+esc(x.t)+'</b><p class="mute" style="margin:4px 0 12px">Laut Packschein: '+pkNum(x.n)+(x.u?' '+esc(x.u):'')+'. Als <b>Kein Material</b> rausgenommen – '+esc(who)+'.</p>'+
  '<button class="btn" id="kmno" type="button">Doch Material</button><button class="btn ghost" id="kmx" type="button" style="margin-top:8px">Schließen</button></div>';
 document.body.appendChild(o);o.querySelector("#kmx").onclick=()=>o.remove();o.querySelector("#kmno").onclick=()=>{o.remove();kmSet(P,i,false)}}
(function kmWait(){if(typeof db==="undefined"||!db||typeof me==="undefined"||!me)return setTimeout(kmWait,1500);
 try{db.collection("kmat").onSnapshot(s=>{KMAT={};s.docs.forEach(d=>KMAT[d.id]=d.data());if(typeof view!=="undefined"&&/^pack/.test(view))draw()})}catch(e){}})();
(function(){try{const st=document.createElement("style");st.textContent='.pkg.pkgkm{color:#fff;background:#5b6573}.pkp.pk-km .pkt em{display:block;font-style:normal;font-size:13px;color:var(--mute)}.pkp.pk-km{opacity:1}';document.head.appendChild(st)}catch(e){}})();
