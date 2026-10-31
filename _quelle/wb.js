/* ===== Wochenbericht (ab 1.81) – für die Montagsbesprechung, zum Drucken =====
   Besprechung = Montag der „diesen Woche“ (Sa/So → nächster Montag). Block 1 letzte Woche (Mo–So davor), Block 2 diese Woche (Mo–Fr, Sa/So beim Freitag),
   Block 3 Punkte zur Besprechung (docs „wbnote“ {txt,by,t,done:{by,t}|null}) – eintragen darf jeder mit „Lager Übersicht“. Alle betroffenen Aufträge werden angeführt. */
let wbOff=0,WBN=[],wbOn=false;
function wbSub(){if(wbOn)return;wbOn=true;try{db.collection("wbnote").onSnapshot(s=>{WBN=s.docs.map(d=>({id:d.id,...d.data()}));if(view==="wb")wbView()})}catch(e){console.warn(e)}}
const wbWd=t=>PK_WD[new Date(t).getDay()]+" "+pkDM(t);
function wbMeet(){const t0=pkDay(Date.now()),w=new Date(t0).getDay();let m=pkMon(t0);if(w===6||w===0)m=pkAddD(m,7);return pkAddD(m,7*wbOff)}
const wbIn=(t,a,b)=>t&&t>=a&&t<b;
function wbData(){const M=wbMeet(),L0=pkAddD(M,-7),L1=M,N1=pkAddD(M,7),t0=pkDay(Date.now());
 const okPk=can("pk_s"),okRet=can("ret_s");
 /* letzte Woche */
 const herr=okPk?packs.filter(p=>{const H=pkH(p);return H.fin&&wbIn(H.fin.t,L0,L1)}).sort((a,b)=>pkH(a).fin.t-pkH(b).fin.t).map(p=>{const H=pkH(p),g=pkProg(p),f=pkF(p).length;
  return{n:p.ev||"Packliste",d:(p.ord||"–")+" · "+wbWd(H.fin.t)+" · "+g.n+(g.n===1?" Position":" Positionen")+(f?", "+f+" Fremdmiete":"")+(g.l55?", "+g.l55+" Lager 55":"")+" · "+nmA(H.fin,"by"),pk:p.id}}):[];
 const zur=okRet?rets.filter(r=>r.closed&&wbIn(r.closedT,L0,L1)).sort((a,b)=>a.closedT-b.closedT).map(r=>{const p=okPk&&typeof abgPackOf==="function"?abgPackOf(r.ord):null,B=p?abgBal(p):null,lb=r.art==="teil"?"Teilretoure":r.art==="end"?"Endretoure":"Retoure";
  let rt="",cls="";if(!B){rt="ohne Packliste"}else if(r.art==="teil"){rt="Teil"}else if(B.fehlt){rt=B.fehlt+(B.fehlt===1?" fehlt":" fehlen");cls="red"}else{rt="vollständig";cls="ok"}
  return{n:r.ev||"Retourschein",d:(r.ord||"–")+" · "+lb+" "+wbWd(r.closedT)+(B?" · "+B.zur+" von "+B.raus+(B.zuviel?" · "+B.zuviel+" zu viel":""):"")+" · "+nmA(r,"closedBy"),r:rt,cls,ret:r.id}}):[];
 const over=okPk?pkGroups().over.map(p=>{const d=Math.round((t0-pkDay(p.de))/864e5);return{n:p.ev||"Packliste",d:(p.ord||"–")+(p.pl?" · "+shortName(p.pl):"")+" · Dispo-Ende "+wbWd(p.de),r:d<=1?"seit gestern":"seit "+d+" Tagen",cls:"red",pk:p.id}}):[];
 const dis=[];if(okPk){packs.forEach(p=>{const h=pkHd(p);
  if(h&&pkShifted(p)&&(wbIn(pkDay(p.db||0),L0,L1)||wbIn(pkHDay(p),L0,L1)))dis.push({n:p.ev||"Packliste",d:"Herrichten verschoben "+wbWd(p.db)+" → "+wbWd(pkHDay(p))+(h.why?" · „"+h.why+"“":"")+(h.by?" · "+nmA(h,"by"):""),pk:p.id,t:pkHDay(p)});
  if(okRet&&p.de){const E=pkRets(p).filter(r=>r.closed&&r.art==="end"&&wbIn(r.closedT,L0,L1)).sort((a,b)=>b.closedT-a.closedT)[0];if(E){const x=Math.round((pkDay(E.closedT)-pkDay(p.de))/864e5);
   if(x)dis.push({n:p.ev||"Packliste",d:"Endretoure "+Math.abs(x)+(Math.abs(x)===1?" Tag ":" Tage ")+(x>0?"nach":"vor")+" Dispo-Ende ("+pkDM(p.de)+" → "+pkDM(E.closedT)+")",pk:p.id,t:E.closedT})}}});dis.sort((a,b)=>a.t-b.t)}
 let offen=null;if(okPk&&okRet&&typeof abgMissing==="function"){const G=abgMissing(),P=new Set();let n=0;G.forEach(g=>{n+=g.n;g.at.forEach(a=>P.add(a.p.id))});offen={n,a:P.size}}
 /* diese Woche */
 const days=[0,1,2,3,4].map(i=>{const t=pkAddD(M,i);return{t,h:[],z:[]}});const slot=t=>{const w=new Date(t).getDay();return w===6?pkAddD(t,-1):w===0?pkAddD(t,-2):t};
 if(okPk)packs.forEach(p=>{const s=pkSlot(p),dh=days.find(d=>d.t===s.t);if(dh&&wbIn(s.t,M,N1))dh.h.push({p,we:s.we});
  if(p.de&&pkState(p).k!=="done"){const de=pkDay(p.de),dz=days.find(d=>d.t===slot(de));if(dz&&wbIn(de,M,N1))dz.z.push({p,we:[ "So","","","","","","Sa"][new Date(de).getDay()]})}});
 const ach=[];if(okPk){const D=defs.filter(d=>!d.done);D.forEach(d=>{const A={code:artCode(String(d.anr||"").split(/[-–]/)[0]),toks:jvATok(d.art).filter(w=>!/^\d{1,2}$/.test(w)),label:d.art},m=jvMatcher(A);
   const hit=packs.filter(p=>{const t=pkHDay(p);return t>=M&&t<N1&&pkState(p).k!=="done"}).find(p=>{const c=jvArtCnt(p,m);return c.out+c.plan>0});
   if(hit)ach.push((d.urg?"dringend: ":"")+d.art+" ist defekt (gemeldet "+pkDM(d.t)+") – wird "+wbWd(pkHDay(hit)).split(" ")[0]+" für "+(hit.ev||hit.ord)+" gebraucht")})}
 if(okRet&&typeof abgToCheck==="function"&&can("abg_p")){const n=abgToCheck().length;if(n)ach.push(n+(n===1?" Endretoure":" Endretouren")+" noch zu prüfen")}
 /* Punkte */
 const notes=WBN.filter(n=>!n.done).sort((a,b)=>(a.t||0)-(b.t||0)).map(n=>({...n,old:(n.t||0)<L0}));
 const doneN=WBN.filter(n=>n.done&&n.done.t>=pkAddD(M,-28)).sort((a,b)=>b.done.t-a.done.t);
 return{M,L0,N1,herr,zur,over,dis,offen,days,ach,notes,doneN}}
/* ---------- Bericht (Bildschirm und Druck) ---------- */
function wbList(title,rows,red,empty){return '<div class="wbl"><div class="wblh'+(red?' red':'')+'"><b>'+esc(title)+'</b><b>'+rows.length+'</b></div>'+(rows.length?rows.map(r=>'<div class="wbr"><b>'+esc(r.n)+'</b><span>'+esc(r.d)+'</span>'+(r.r?'<em class="'+(r.cls||"")+'">'+esc(r.r)+'</em>':'')+'</div>').join(""):'<div class="wbe">'+esc(empty)+'</div>')+'</div>'}
function wbPaper(D,print){const kwL=pkKW(D.L0),kwN=pkKW(D.M),y=new Date(D.M).getFullYear();
 const day=(d,k)=>{const L=d[k];return L.length?L.map(o=>esc(o.p.ev||o.p.ord||"–")+(o.we?' <small>('+o.we+')</small>':'')).join(", "):'<span class="wbm">–</span>'};
 const nh=D.days.reduce((a,d)=>a+d.h.length,0),nz=D.days.reduce((a,d)=>a+d.z.length,0);
 return '<div class="wbpaper'+(print?' wbprint':'')+'"><div class="wbhd"><div><span>The Power Company · Lager</span><h1>Wochenbericht</h1></div><em>Besprechung '+wbWd(D.M)+y+'</em></div>'+
  '<section class="wbsec"><div class="wbbar"><b>1 · Letzte Woche</b><span>KW '+kwL+' · '+pkDM(D.L0)+'–'+pkDM(pkAddD(D.M,-1))+new Date(pkAddD(D.M,-1)).getFullYear()+'</span></div><div class="wbin">'+
   wbList("Hergerichtet",D.herr,false,"Nichts hergerichtet.")+wbList("Zurückgekommen",D.zur,false,"Nichts zurückgekommen.")+
   '<div class="wb2">'+wbList("Überfällig",D.over,true,"Nichts überfällig.")+wbList("Dispodaten stimmten nicht",D.dis,false,"Keine Abweichungen.")+'</div>'+
   (D.offen?'<div class="wboff">'+(D.offen.n?'<b>Noch offen insgesamt:</b> '+D.offen.n+' Stück Fehlmaterial bei '+D.offen.a+(D.offen.a===1?' Auftrag':' Aufträgen')+' (auch aus früheren Wochen)':'<b>Noch offen insgesamt:</b> kein Fehlmaterial')+'</div>':'')+'</div></section>'+
  '<section class="wbsec"><div class="wbbar"><b>2 · Diese Woche</b><span>KW '+kwN+' · '+pkDM(D.M)+'–'+pkDM(pkAddD(D.M,4))+y+'</span></div><div class="wbin">'+
   '<table class="wbt"><thead><tr><th>Tag</th><th>Herrichten</th><th>Kommt zurück</th></tr></thead><tbody>'+D.days.map(d=>'<tr><td><b>'+wbWd(d.t)+'</b></td><td>'+day(d,"h")+'</td><td>'+day(d,"z")+'</td></tr>').join("")+
   '<tr class="wbsum"><td>Summe</td><td>'+nh+(nh===1?' Packliste':' Packlisten')+'</td><td>'+nz+(nz===1?' Rücklauf':' Rückläufe')+'</td></tr></tbody></table>'+
   (D.ach.length?'<div class="wbach"><b>Achtung</b>'+D.ach.map(a=>'<span>· '+esc(a)+'</span>').join("")+'</div>':'')+'</div></section>'+
  '<section class="wbsec wbnotes"><div class="wbbar"><b>3 · Sonstiges zur Besprechung</b></div><div class="wbin">'+
   D.notes.map(n=>'<div class="wbn"><span class="wbbox"></span><span class="wbnt">'+esc(n.txt)+'</span><small>'+esc(nmA(n,"by"))+', '+wbWd(n.t)+(n.old?' · noch offen':'')+'</small></div>').join("")+
   '<div class="wbline"></div><div class="wbline"></div></div></section>'+
  '<div class="wbft"><span>Erstellt aus der TPC Lager App · '+fmt(Date.now())+' · '+esc(meName())+'</span><span>Einzelheiten in der App</span></div></div>'}
/* ---------- Ansicht ---------- */
function wbView(){if(!can("jv_s")){view="start";return startView()}$("#t").textContent="Wochenbericht";const D=wbData(),kwL=pkKW(D.L0),kwN=pkKW(D.M);
 const ae=document.activeElement,keep=ae&&ae.id==="wbin"?ae.value:null;
 $("#app").innerHTML='<section class="wbnav"><button type="button" class="wbarr" id="wbp" aria-label="Eine Woche zurück"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" aria-hidden="true"><path d="M15 6l-6 6 6 6"/></svg></button><div><b>Rückblick KW '+kwL+' · Ausblick KW '+kwN+'</b><small>Besprechung '+wbWd(D.M)+new Date(D.M).getFullYear()+(wbOff?' · <button type="button" class="lnk" id="wbnow">zur aktuellen</button>':'')+'</small></div><button type="button" class="wbarr" id="wbn" aria-label="Eine Woche vor"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" aria-hidden="true"><path d="M9 6l6 6-6 6"/></svg></button></section>'+
  '<button class="btn" id="wbpr" type="button" style="margin:0 0 10px">Drucken / als PDF speichern</button>'+
  '<section class="wbedit"><b>Punkte für die Besprechung</b><small class="mute">'+wbWd(D.M)+' · wird mitgedruckt · nicht Erledigtes bleibt für die nächste Woche</small>'+
   D.notes.map(n=>'<div class="wbei"><input type="checkbox" data-wbd="'+esc(n.id)+'" aria-label="Erledigt"><span><span>'+esc(n.txt)+'</span><small>'+esc(nmA(n,"by"))+', '+wbWd(n.t)+(n.old?' · noch offen':'')+'</small></span>'+(n.by===me||can("v_app")?'<button type="button" class="lnk" data-wbx="'+esc(n.id)+'" style="color:var(--bad)">Löschen</button>':'')+'</div>').join("")+
   '<div class="wbadd"><label><span class="sr">Neuer Punkt</span><input id="wbin" maxlength="200" placeholder="Neuer Punkt …" autocomplete="off"></label><button class="btn s" id="wbadd" type="button">Hinzufügen</button></div>'+
   (D.doneN.length?'<details class="wbdone"><summary>Erledigt · '+D.doneN.length+'</summary>'+D.doneN.map(n=>'<div class="wbei"><input type="checkbox" checked data-wbu="'+esc(n.id)+'" aria-label="Wieder offen"><span><span>'+esc(n.txt)+'</span><small>erledigt '+wbWd(n.done.t)+' · '+esc(nmA(n.done,"by"))+'</small></span></div>').join("")+'</details>':'')+'</section>'+
  wbPaper(D,false);
 const old=document.getElementById("wbprintbox");if(old)old.remove();document.body.insertAdjacentHTML("beforeend",'<div id="wbprintbox">'+wbPaper(D,true)+'</div>');
 $("#wbp").onclick=()=>{wbOff--;wbView()};$("#wbn").onclick=()=>{wbOff++;wbView()};if($("#wbnow"))$("#wbnow").onclick=()=>{wbOff=0;wbView()};
 $("#wbpr").onclick=()=>{document.body.classList.add("wbprinting");setTimeout(()=>{try{window.print()}catch(e){}setTimeout(()=>document.body.classList.remove("wbprinting"),500)},50)};
 const add=()=>{const v=$("#wbin").value.trim();if(!v)return;$("#wbin").value="";rSave(()=>db.doc("wbnote/"+Date.now().toString(36)+Math.random().toString(36).slice(2,5)).set({txt:v,by:me,t:Date.now(),done:null}),"Punkt gespeichert")};
 $("#wbadd").onclick=add;$("#wbin").onkeydown=e=>{if(e.key==="Enter"){e.preventDefault();add()}};if(keep!==null){$("#wbin").value=keep;$("#wbin").focus()}
 document.querySelectorAll("[data-wbd]").forEach(c=>c.onchange=()=>rSave(()=>db.doc("wbnote/"+c.dataset.wbd).update({done:{by:me,t:Date.now()}}),"Als erledigt markiert"));
 document.querySelectorAll("[data-wbu]").forEach(c=>c.onchange=()=>rSave(()=>db.doc("wbnote/"+c.dataset.wbu).update({done:null}),"Wieder offen"));
 document.querySelectorAll("[data-wbx]").forEach(b=>b.onclick=()=>ask("Punkt löschen?",()=>rSave(()=>db.doc("wbnote/"+b.dataset.wbx).delete(),"Gelöscht")))}
window.addEventListener("afterprint",()=>document.body.classList.remove("wbprinting"));
