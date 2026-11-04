/* ===== Fehlmaterial bis zum Austragen (1.119) =====
   Jedes Fehlmaterial (Auftrag × Artikel, auch Teilmengen) bekommt einen Ausgang: docs „fmx“
   {pk, k, code, name, u, q, was, bis?, ziel?, zielEv?, txt, by, t, aus:{by,t}|null}
   was: "zur" kommt noch zurück (bleibt offen, Datum) · "bau" ist auf anderer Baustelle (ziel) · "verr" dem Kunden verrechnet ·
        "weg" verloren/gestohlen/kaputt · "nicht" fehlt doch nicht (Zählfehler).
   verr/weg ohne aus → Liste „Noch in epirent auszutragen“ (Recht fm_a = Sonja + Jürgen; Admin immer). Erledigt = bau/nicht oder verr/weg mit aus.
   Setzen: Lager (abgOk) – der Projektleiter setzt „verr“ über seine Antwort in „Meine Aufträge“ (au.js). „Mit PL geklärt“ bleibt als Abkürzung,
   die Liste „Noch auszutragen“ gilt trotzdem. Rot ab 7 Tagen. Kein SQL (Standardregel). */
let FMX=[],fmOn=false,fmT="offen";
function fmSub(){if(fmOn)return;fmOn=true;try{db.collection("fmx").onSnapshot(s=>{FMX=s.docs.map(d=>({id:d.id,...d.data()}));draw()})}catch(e){console.warn(e)}}
const FMW={zur:"Kommt noch zurück",bau:"Ist auf einer anderen Baustelle",verr:"Dem Kunden verrechnet",weg:"Verloren / gestohlen / kaputt",nicht:"Fehlt doch nicht"};
const fmNeedsAus=x=>x.was==="verr"||x.was==="weg";
const fmFor=(pid,k)=>FMX.filter(x=>x.pk===pid&&x.k===k).sort((a,b)=>(a.t||0)-(b.t||0));
const fmRes=(pid,k)=>fmFor(pid,k).filter(x=>x.was!=="zur").reduce((a,x)=>a+(+x.q||0),0);
function fmOpenQ(p,e){return Math.max(0,(e.soll-e.back)-fmRes(p.id,e.k))}
const fmAusN=(pid,k)=>fmFor(pid,k).filter(x=>fmNeedsAus(x)&&!(x.aus&&x.aus.t)).length;
function fmAus(){return FMX.filter(x=>fmNeedsAus(x)&&!(x.aus&&x.aus.t)).sort((a,b)=>(a.t||0)-(b.t||0))}
function fmAusDone(){return FMX.filter(x=>fmNeedsAus(x)&&x.aus&&x.aus.t).sort((a,b)=>b.aus.t-a.aus.t)}
const fmDays=t=>Math.max(0,Math.round((pkDay(Date.now())-pkDay(t||Date.now()))/864e5));
const fmOld=x=>fmDays(x.t)>=7;
const fmCanSet=()=>typeof abgOk==="function"&&abgOk();
const fmU=x=>x.u||"Stk";
function fmTxt(x){const z=x.ziel&&packs.find(p=>p.id===x.ziel);return pkNum(+x.q||0)+" "+fmU(x)+" · "+(x.was==="bau"?"auf Baustelle "+(z?z.ev||z.ord:x.zielEv||"?"):x.was==="zur"?"kommt zurück"+(x.bis?" bis "+pkWd(pkFromYmd(x.bis)):""):FMW[x.was]||x.was)}
/* Zeilen im Auftragskonto unter einem fehlenden Artikel */
function fmArtLine(p,e){const L=fmFor(p.id,e.k),o=fmOpenQ(p,e),fa=can("fm_a");
 const rows=L.map(x=>{const need=fmNeedsAus(x),done=need&&x.aus&&x.aus.t,late=x.was==="zur"&&x.bis&&pkFromYmd(x.bis)<pkDay(Date.now());
  const chip=need?(done?'<span class="fmchip ok">Ausgetragen ✓</span>':'<span class="fmchip or'+(fmOld(x)?' red':'')+'">Noch auszutragen'+(fmOld(x)?' · seit '+fmDays(x.t)+' Tagen':'')+'</span>'):x.was==="zur"?'<span class="fmchip'+(late?' red':'')+'">'+(late?'überfällig':'offen')+'</span>':'<span class="fmchip ok">Erledigt</span>';
  return '<div class="fmrow"><div class="fmrt"><b>'+esc(fmTxt(x))+'</b>'+chip+'</div><small>'+esc(nmA(x,"by"))+', '+fmt(x.t).slice(0,6)+(x.txt?' · '+esc(x.txt):'')+(done?' · ausgetragen von '+esc(nmA(x.aus,"by"))+', '+fmt(x.aus.t).slice(0,6):'')+'</small>'+
   '<div class="fmrb">'+(need&&!done&&fa?'<button class="btn s fmaus" type="button" data-fmaus="'+esc(x.id)+'">In epirent ausgetragen ✓</button>':'')+((fmCanSet()&&(x.by===me||fa))&&!done?'<button class="lnk" type="button" data-fmdel="'+esc(x.id)+'">Rückgängig</button>':'')+'</div></div>'}).join("");
 return '<div class="fmbox">'+rows+(o>0&&fmCanSet()?'<button class="btn s" type="button" data-fmw="'+esc(p.id)+'" data-fmk="'+esc(e.k)+'">Was ist mit '+(o<(e.soll-e.back)?'den restlichen ':'')+pkNum(o)+' '+esc(fmUnit(p,e))+'?</button>':'')+'</div>'}
function fmUnit(p,e){const x=pkPosAll(p).find(x=>abgKey(artCode(x.a),pkName(x))===e.k);return (x&&x.u)||"Stk"}
function fmHead(p,B){let of=0,au=0,er=0;B.miss.forEach(e=>{if(fmOpenQ(p,e)>0)of++;const L=fmFor(p.id,e.k);au+=L.filter(x=>fmNeedsAus(x)&&!(x.aus&&x.aus.t)).length;er+=L.filter(x=>x.was==="bau"||x.was==="nicht"||(fmNeedsAus(x)&&x.aus&&x.aus.t)).length});
 if(!B.miss.length)return"";return '<div class="fmchips">'+(of?'<span class="fmchip red">'+of+' offen</span>':'')+(au?'<span class="fmchip or">'+au+' noch auszutragen</span>':'')+(er?'<span class="fmchip ok">'+er+' erledigt</span>':'')+(!of&&!au?'<span class="fmchip ok">Fehlmaterial: alles erledigt ✓</span>':'')+'</div>'}
/* Dialog „Was ist damit?“ */
function fmDlg(p,k){const B=abgBal(p),e=B.L.find(x=>x.k===k);if(!e)return;const max=fmOpenQ(p,e);if(max<=0)return toast("Für diesen Artikel ist schon alles erledigt.",1);
 const u=fmUnit(p,e),fa=can("fm_a"),pa=typeof auAns==="function"?auAns(p,k)[0]:null;let q=max,was=pa&&pa.typ==="kunde"?"verr":null,ziel=null;const o=document.createElement("div");o.className="ov";
 const draw=()=>{const opt=(w,s,extra)=>'<label class="pkaopt'+(was===w?' on fm'+w:'')+'"><input type="radio" name="fmw" value="'+w+'"'+(was===w?' checked':'')+'><span><b>'+FMW[w]+'</b><small>'+s+'</small>'+(was===w&&extra?extra:'')+'</span></label>';
  o.innerHTML='<div class="card" style="width:100%;max-width:420px;margin:0;max-height:92vh;overflow:auto"><b style="font-size:17px">Was ist mit '+pkNum(max)+' '+esc(u)+' '+esc(e.name)+'?</b><div class="mute">'+esc(p.ev||"")+' · Auftrag '+esc(p.ord||"–")+'</div>'+
   (pa?'<div class="fmpl">'+esc(nmA(pa,"by"))+': „'+esc(auAnsTxt(pa))+'“ · '+fmt(pa.t).slice(0,6)+'</div>':'')+
   (max>1?'<div class="fmq"><span class="mute">Menge</span><span class="fmqs"><button type="button" id="fmqm" aria-label="Weniger">−</button><b>'+pkNum(q)+' '+esc(u)+'</b><button type="button" id="fmqp" aria-label="Mehr">+</button></span><small class="mute">von '+pkNum(max)+' '+esc(u)+'</small></div>':'')+
   '<div style="margin-top:8px">'+opt("zur","Bleibt offen – Erinnerung am gewählten Tag",'<input type="date" id="fmbis" style="margin:6px 0 0">')+
   opt("bau","Auftrag wählen – zählt dort weiter",'<button type="button" class="lnk" id="fmziel">'+(ziel?esc((ziel.ev||"")+" ("+(ziel.ord||"–")+")")+' – ändern':'Auftrag wählen')+'</button>')+
   opt("verr","Material ist weg – muss in epirent ausgetragen werden")+opt("weg","Muss in epirent ausgetragen werden")+opt("nicht","Zählfehler, ist im Lager")+'</div>'+
   ((was==="verr"||was==="weg")&&fa?'<label class="fmchk"><input type="checkbox" id="fmaus0"><span><b>Schon in epirent ausgetragen</b><small>Sonst landet es bei „Noch auszutragen“</small></span></label>':'')+
   '<label class="mute" for="fmtx" style="display:block;margin-top:8px">Notiz (optional)</label><input id="fmtx" autocomplete="off" placeholder="z. B. Rechnungsnummer">'+
   '<div class="row" style="margin-top:10px"><button class="btn ghost" id="fmc" type="button">Abbrechen</button><button class="btn" id="fmo" type="button">Speichern</button></div></div>';
  const tx=o.querySelector("#fmtx");tx.value=o._tx||"";tx.oninput=()=>{o._tx=tx.value};
  o.querySelectorAll('input[name="fmw"]').forEach(r=>r.onchange=()=>{was=r.value;draw()});
  const m=o.querySelector("#fmqm"),pl=o.querySelector("#fmqp");if(m)m.onclick=()=>{q=Math.max(1,q-1);draw()};if(pl)pl.onclick=()=>{q=Math.min(max,q+1);draw()};
  const zb=o.querySelector("#fmziel");if(zb)zb.onclick=()=>abgPickPack(p,c=>{ziel=c;draw()});
  o.querySelector("#fmc").onclick=()=>o.remove();
  o.querySelector("#fmo").onclick=async()=>{if(!was)return errBox("Bitte auswählen, was mit dem Material ist.");if(was==="bau"&&!ziel)return errBox("Bitte den Auftrag wählen, auf dem das Material ist.");
   const bis=o.querySelector("#fmbis"),ac=o.querySelector("#fmaus0"),d={pk:p.id,k:e.k,code:e.code||"",name:e.name,u,q,was,txt:(o._tx||"").trim(),by:me,t:Date.now(),aus:null};
   if(was==="zur"&&bis&&bis.value)d.bis=bis.value;if(was==="bau"&&ziel){d.ziel=ziel.id;d.zielEv=ziel.ev||""}if(ac&&ac.checked)d.aus={by:me,t:Date.now()};
   o.remove();await rSave(()=>db.doc("fmx/"+Date.now().toString(36)+Math.random().toString(36).slice(2,6)).set(d),fmNeedsAus(d)&&!d.aus?"Gespeichert – steht bei „Noch auszutragen“":"Gespeichert")}};
 document.body.appendChild(o);draw()}
function fmAusDo(id){const x=FMX.find(y=>y.id===id);if(!x||!can("fm_a"))return;const p=packs.find(q=>q.id===x.pk);
 ask(pkNum(+x.q||0)+" "+fmU(x)+" "+x.name+(p?" ("+(p.ev||p.ord)+")":"")+" in epirent ausgetragen?",()=>rSave(()=>db.doc("fmx/"+id).update({aus:{by:me,t:Date.now()}}),"Als ausgetragen markiert"))}
function fmUndo(id){const x=FMX.find(y=>y.id===id);if(!x)return;ask("Eintrag „"+fmTxt(x)+"“ zurücknehmen?",()=>rSave(()=>db.doc("fmx/"+id).delete(),"Zurückgenommen"))}
function fmAusUndo(id){if(!can("fm_a"))return;ask("„Ausgetragen“ zurücknehmen?",()=>rSave(()=>db.doc("fmx/"+id).update({aus:null}),"Zurückgenommen"))}
document.addEventListener("click",ev=>{const b=ev.target.closest&&ev.target.closest("[data-fmw],[data-fmaus],[data-fmdel],[data-fmaus0],[data-fmgo]");if(!b)return;ev.stopPropagation();
 if(b.dataset.fmw){const p=packs.find(q=>q.id===b.dataset.fmw);if(p)fmDlg(p,b.dataset.fmk)}else if(b.dataset.fmaus)fmAusDo(b.dataset.fmaus);else if(b.dataset.fmdel)fmUndo(b.dataset.fmdel);else if(b.dataset.fmaus0)fmAusUndo(b.dataset.fmaus0);
 else if(b.dataset.fmgo){curPack=b.dataset.fmgo;go("pkabg")}},true);
/* Streifen in der Lager Übersicht + Liste „Noch auszutragen“ */
function fmStrip(){if(!can("fm_a"))return"";const L=fmAus();if(!L.length)return"";const old=L.filter(fmOld).length;
 return '<button class="fmstrip" type="button" id="fmstrip"><span class="fmcnt">'+L.length+'</span><span><b>'+(L.length===1?"1 Artikel":L.length+" Artikel")+' noch in epirent auszutragen</b><small>'+(old?old+' davon seit über einer Woche':'Verrechnet oder verloren – sonst stimmt der Lagerstand nicht')+'</small></span><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" aria-hidden="true"><path d="M9 6l6 6-6 6"/></svg></button>'}
function fmAusView(){if(!can("fm_a")){view="start";return startView()}$("#t").textContent="Noch auszutragen";const L=fmT==="offen"?fmAus():fmAusDone();
 const G={};L.forEach(x=>{(G[x.pk]=G[x.pk]||[]).push(x)});
 $("#app").innerHTML='<div class="row tabs"><button class="btn ghost'+(fmT==="offen"?' act':'')+'" data-fmt="offen">Offen · '+fmAus().length+'</button><button class="btn ghost'+(fmT==="done"?' act':'')+'" data-fmt="done">Ausgetragen</button></div>'+
  (Object.keys(G).length?Object.keys(G).map(pid=>{const p=packs.find(q=>q.id===pid);return '<div class="card fmg" style="cursor:default;padding:0;overflow:hidden"><button class="fmgh" type="button" data-fmgo="'+esc(pid)+'"><b>'+esc(p?p.ev||"Ohne Veranstaltung":"Gelöschte Packliste")+'</b><small>Auftrag '+esc(p?p.ord||"–":"–")+' ›</small></button>'+
   G[pid].map(x=>'<div class="fmar"><span><b>'+pkNum(+x.q||0)+' '+esc(fmU(x))+' '+esc(x.name)+'</b><small>'+esc(FMW[x.was])+' · '+esc(nmA(x,"by"))+', '+fmt(x.t).slice(0,6)+(x.txt?' · '+esc(x.txt):'')+(fmT==="offen"&&fmOld(x)?' · <b class="fmred">seit '+fmDays(x.t)+' Tagen</b>':'')+(fmT==="done"?' · ausgetragen von '+esc(nmA(x.aus,"by"))+', '+fmt(x.aus.t).slice(0,6):'')+'</small></span>'+
    (fmT==="offen"?'<button class="btn s fmaus" type="button" data-fmaus="'+esc(x.id)+'">Ausgetragen ✓</button>':'<button class="lnk" type="button" data-fmaus0="'+esc(x.id)+'">Zurücknehmen</button>')+'</div>').join("")+'</div>'}).join(""):'<div class="card mute">'+(fmT==="offen"?'Nichts auszutragen – der Lagerstand ist aktuell.':'Noch nichts ausgetragen.')+'</div>')+
  (fmT==="offen"&&L.length?'<button class="btn ghost" id="fmxl" type="button">Liste als Excel (zum Austragen am PC)</button>':'')+
  '<p class="mute" style="font-size:13px">„Ausgetragen ✓“ speichert Name und Datum. Danach ist der Artikel beim Auftrag erledigt.</p>';
 document.querySelectorAll("[data-fmt]").forEach(b=>b.onclick=()=>{fmT=b.dataset.fmt;fmAusView()});const xb=$("#fmxl");if(xb)xb.onclick=()=>fmXl()}
async function fmXl(){const dl=typeof claude!=="undefined"&&claude.use?await claude.use("downloads"):null;if(!dl)return toast("Speichern ist hier nicht verfügbar.");
 try{if(!window.ExcelJS)throw new Error("Excel-Bibliothek nicht geladen");const wb=new ExcelJS.Workbook(),ws=wb.addWorksheet("Noch auszutragen");
  ws.columns=[{header:"Veranstaltung",width:28},{header:"Auftrag",width:14},{header:"Menge",width:8},{header:"Einheit",width:8},{header:"Artikel",width:32},{header:"Art.-Nr.",width:10},{header:"Grund",width:28},{header:"Eingetragen von",width:18},{header:"am",width:12},{header:"Notiz",width:28}];
  fmAus().forEach(x=>{const p=packs.find(q=>q.id===x.pk);ws.addRow([p?p.ev||"":"",p?p.ord||"":"",+x.q||0,fmU(x),x.name,x.code||"",FMW[x.was],nmA(x,"by"),fmt(x.t).slice(0,10),x.txt||""])});
  ws.getRow(1).font={bold:true};const buf=await wb.xlsx.writeBuffer(),d=new Date();
  await dl.save({filename:"Noch_auszutragen_"+d.getFullYear()+"-"+String(d.getMonth()+1).padStart(2,"0")+"-"+String(d.getDate()).padStart(2,"0")+".xlsx",data:new Blob([buf],{type:"application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"})})}
 catch(e){if(e&&(e.code==="declined"||e.name==="AbortError"))return;console.error(e);toast("Excel konnte nicht erstellt werden.")}}
/* Wochenbericht: Zeilen „Noch in epirent auszutragen“ */
function fmWbRows(){return fmAus().map(x=>{const p=packs.find(q=>q.id===x.pk),d=fmDays(x.t);return{n:p?p.ev||p.ord||"–":"–",d:pkNum(+x.q||0)+" "+fmU(x)+" "+x.name+" – "+(x.was==="verr"?"verrechnet":"verloren/kaputt"),r:d>=7?"seit "+d+" Tagen":"",cls:d>=7?"red":"",pk:x.pk}})}
