/* ===== Meine Aufträge (ab 1.85) – Lager-Stand für Projektleiter =====
   Recht au_s = Aufträge sehen (alle, eigene oben), au_b = auf eigene Aufträge antworten.
   Eigene = Projektleiter in der Packliste ist man selbst (Name aus dem Profil, Reihenfolge/Groß-Klein/Akzente egal).
   Antworten an das Lager: docs „plaw“ {pk, ord, ev, k, name, n, typ, to, toEv, toOrd, bis, txt, by, t, read:{by,t}}
   typ: anders (auf anderer Baustelle → to), bau (noch auf der Baustelle, bis), kunde (bleibt beim Kunden), zur (schon zurück), weiss (kläre ich), msg (freie Nachricht).
   Die App ändert nichts selbst – Antworten sind nur Infos; „anders“ erscheint beim Lager als Vorschlag bei „Zu viel zurück“. */
let PLAW=[],plawOn=false,auf="lauf",auq="",curAu=null;
function plawSub(){if(plawOn)return;plawOn=true;try{db.collection("plaw").onSnapshot(s=>{PLAW=s.docs.map(d=>({id:d.id,...d.data()})).sort((a,b)=>(b.t||0)-(a.t||0));draw()})}catch(e){console.warn(e)}}
const AU_ICON='<svg viewBox="0 0 24 24" width="28" height="28" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="5" y="3" width="14" height="18" rx="2"/><path d="M9 3v2h6V3"/><path d="M9 11l2 2 4-4"/><path d="M9 17h6"/></svg>';
/* ---------- eigene Aufträge ---------- */
const auToks=s=>jvNorm(String(s||"")).split(" ").filter(w=>w.length>1);
function auMyName(){return (tabOn()&&TAB.act?TAB.act.name:(names[me]||""))||""}
function auIsMine(p){const u=auToks(auMyName()),l=auToks(p&&p.pl);if(!u.length||!l.length)return false;
 if(u.length===1)return l.length===1&&l[0]===u[0];return u.every(w=>l.includes(w))}
/* ---------- Stand eines Auftrags ---------- */
const auOutDay=p=>Math.max(p.db?pkDay(p.db):0,pkHDay(p)||0);
function auInfo(p){const g=pkProg(p),st=pkState(p),B=abgBal(p),H=pkH(p),kl=!!(H.klar&&H.klar.t),t0=pkDay(Date.now()),over=st.k==="over",late=st.k==="late";
 const missShow=(B.hasEnd||over)&&!kl&&B.fehlt>0;const done=kl||(B.hasEnd&&!B.fehlt);
 const out=B.R.length>0||(g.fin&&auOutDay(p)&&auOutDay(p)<=t0);
 const S=[{c:"d"},{c:g.fin?(g.dev?"w":"d"):g.d?"n":late?"r":""},{c:over?"r":out||B.R.length?"d":""},{c:B.hasEnd?(B.fehlt&&!kl?"r":"d"):B.R.length?"n":""},{c:done?"d":""}];
 let lab,cls;
 if(done){lab=kl?"Geklärt":"Erledigt ✓";cls="ok"}
 else if(over&&!B.hasEnd){lab="Überfällig";cls="red"}
 else if(missShow){lab="Fehlt "+B.fehlt;cls="red"}
 else if(late){lab="Nicht hergerichtet";cls="red"}
 else if(B.R.length){lab=B.R.some(r=>r.closed&&r.art==="teil")?"Teilretoure":"Retoure läuft";cls="b"}
 else if(g.fin&&out){lab="Draußen";cls="b"}
 else if(g.fin){lab="Hergerichtet";cls="b"}
 else if(g.d){lab=g.d+" / "+g.n;cls="b"}
 else{lab=st.k==="herr"?"Heute herrichten":"Herrichten "+pkDM(pkHDay(p));cls="g"}
 const zlate=(p.zus||[]).some(z=>!pkZFin(p,z)&&pkZDay(p,z)<t0);const hot=!done&&(missShow||over||late||zlate);
 return{p,g,st,B,kl,done,over,late,missShow,S,lab,cls,hot}}
const auAns=(p,k)=>PLAW.filter(a=>a.pk===p.id&&a.k===k&&a.typ!=="msg");
const auAnsTxt=a=>{const T={anders:"Ist auf einer anderen Baustelle: "+(a.toEv||"")+(a.toOrd?" ("+a.toOrd+")":""),bau:"Ist noch auf der Baustelle"+(a.bis?", kommt bis "+pkWd(pkFromYmd(a.bis)):""),kunde:"Bleibt beim Kunden",zur:"Ist schon zurück – bitte nachzählen",weiss:"Weiß ich nicht / kläre ich",msg:"Nachricht"};
 return (T[a.typ]||"")+(a.txt?(a.typ==="msg"?": ":" – ")+"„"+a.txt+"“":"")};
const auStepL='<div class="aul"><span>Packliste</span><span>Herrichten</span><span>Draußen</span><span>Retouren</span><span>Erledigt</span></div>';
function auCard(I){const p=I.p,mine=auIsMine(p),pills=[];
 if(I.missShow)pills.push(abgTag(I.B.hasEnd?"Endretoure – "+I.B.fehlt+(I.B.fehlt===1?" Stück fehlt":" Stück fehlen"):I.B.fehlt+" Stück noch draußen","red"));
 if(I.missShow&&mine&&I.B.miss.some(e=>!auAns(p,e.k).length))pills.push(abgTag("Noch nicht beantwortet","or"));
 if(!I.done)(p.zus||[]).forEach(z=>{if(pkZFin(p,z))return;const d=pkZDay(p,z),late=d<pkDay(Date.now());pills.push(abgTag("Nachlieferung "+(late?"noch nicht hergerichtet":"herrichten "+pkDM(d)),late?"red":"blue"))});
 if(I.g.dev&&!I.done)pills.push(abgTag("Herrichten: "+I.g.dev+(I.g.dev===1?" Abweichung":" Abweichungen"),"or"));
 if(I.B.zuviel&&!I.done)pills.push(abgTag(I.B.zuviel+" mehr zurück","grey"));
 const sub=I.over?"Dispo-Ende war "+pkDM(p.de):I.done?"Dispo "+pkDM(p.db)+" – "+pkDM(p.de):I.st.k==="herr"?"Herrichten heute":"Dispo "+pkDM(p.db)+" – "+pkDM(p.de);
 return '<button class="aucard'+(mine?' mine':'')+(I.hot?' hot':'')+'" type="button" data-au="'+esc(p.id)+'"><span class="auct"><b>'+esc(p.ev||"Ohne Veranstaltung")+'</b>'+abgTag(I.lab,I.cls==="b"?"blue":I.cls==="g"?"grey":I.cls)+'</span>'+
  '<small class="mute">Auftrag '+esc(p.ord||"–")+(!mine&&p.pl?' · '+esc(shortName(p.pl)):'')+' · '+sub+'</small>'+
  '<span class="aus">'+I.S.map(s=>'<i class="'+s.c+'"></i>').join("")+'</span>'+auStepL+(pills.length?'<span class="aupills">'+pills.join("")+'</span>':'')+'</button>'}
function auList(){const t0=pkDay(Date.now()),q=jvNorm(auq);
 const A=packs.map(auInfo).filter(I=>(auf==="alle"||(auf==="done")===I.done)&&(!q||jvNorm((I.p.ev||"")+" "+(I.p.ord||"")+" "+(I.p.pl||"")).includes(q)));
 const srt=(a,b)=>(b.hot-a.hot)||(auf==="done"?(b.p.de||0)-(a.p.de||0):(a.done-b.done)||((pkHDay(a.p)||a.p.db||0)-(pkHDay(b.p)||b.p.db||0)));
 return{mine:A.filter(I=>auIsMine(I.p)).sort(srt),rest:A.filter(I=>!auIsMine(I.p)).sort(srt)}}
function auView(){if(!can("au_s")){view="start";return startView()}$("#t").textContent="Meine Aufträge";const L=auList(),nm0=shortName(auMyName());
 const empty=auf==="done"?"Keine erledigten Aufträge.":auf==="lauf"?"Keine laufenden Aufträge.":"Noch keine Aufträge.";
 const noMine=!L.mine.length&&!packs.some(auIsMine);
 $("#app").innerHTML=chips([["lauf","Laufend"],["done","Erledigt"],["alle","Alle"]],auf,"data-auf")+
  '<input id="auq" type="search" placeholder="Suchen: Veranstaltung, Auftrag, Projektleiter" autocomplete="off" style="margin:0 0 10px">'+
  '<div class="aug"><b>Meine Aufträge</b><small>'+L.mine.length+'</small></div>'+
  (L.mine.length?L.mine.map(auCard).join(""):'<div class="card mute" style="font-size:14px">'+(noMine?'Keine Packliste mit '+(nm0?'„'+esc(nm0)+'“':'deinem Namen')+' als Projektleiter.':empty)+'</div>')+
  '<div class="audiv"></div><div class="aug"><b>Alle anderen Aufträge</b><small>'+L.rest.length+'</small></div>'+
  (L.rest.length?L.rest.map(auCard).join(""):'<div class="card mute" style="font-size:14px">'+empty+'</div>')+
  '<p class="mute" style="font-size:12px;margin:12px 2px 0;line-height:1.4">Eigene Aufträge: Projektleiter in der Packliste = dein Name. Erledigt = Endretoure ohne Fehlmaterial oder mit dem Projektleiter geklärt.</p>';
 const qi=$("#auq");qi.value=auq;qi.oninput=()=>{auq=qi.value;const pos=qi.selectionStart;auView();const n=$("#auq");n.focus();try{n.setSelectionRange(pos,pos)}catch(e){}};
 document.querySelectorAll("[data-auf]").forEach(b=>b.onclick=()=>{auf=b.dataset.auf;auView()});
 document.querySelectorAll("[data-au]").forEach(b=>b.onclick=()=>{curAu=b.dataset.au;go("auopen")})}
/* ---------- ein Auftrag ---------- */
/* Einheit eines Artikels im Auftrag (aus der Packliste, sonst „Stk“) – Jürgen: überall Menge + Einheit */
function auUnit(p,k){const x=p&&k?pkPosAll(p).find(x=>abgKey(artCode(x.a),pkName(x))===k):null;return (x&&x.u)||"Stk"}
const auQ=(n,u)=>pkNum(n)+'<small> '+esc(u||"Stk")+'</small>';
function auDevLines(p,zps){const H=pkH(p),K=pkKeys(p),IT=pkItems(p),L=[];pkPosAll(p).forEach((x,i)=>{if((IT[i].z||null)!==(zps||null))return;const h=H[K[i]];if(pkL55(x,h))return;const st=pkPS(x,h),n=pkName(x);
 const u=" "+(x.u||"Stk");if(st.s==="part")L.push(n+": "+pkNum(st.q)+" von "+pkNum(st.need)+u+" – fehlen "+pkNum(st.need-st.q)+u);
 (st.s!=="open"?st.alt:[]).forEach(a=>L.push(n+": stattdessen "+pkNum(a.n)+" "+(x.u||"Stk")+" "+a.t));
 if(h&&h.fm==="lager"&&x.f>0)L.push(n+": "+pkNum(x.f)+" "+(x.u||"Stk")+" aus dem Lager statt Fremdmiete")});return L}
function auOpenView(){const p=packs.find(x=>x.id===curAu);if(!p||!can("au_s")){view="au";return auView()}
 $("#t").textContent=p.ev||"Auftrag";const I=auInfo(p),B=I.B,H=pkH(p),mine=auIsMine(p),act=mine&&can("au_b"),g=I.g,fr=pkF(p).length;
 const te=(c,t,s)=>'<div class="aute"><span class="audot '+c+'">'+(c==="d"?"✓":c==="r"||c==="w"?"!":"")+'</span><span><b>'+t+'</b>'+(s?'<small>'+s+'</small>':'')+'</span></div>';
 const dev=auDevLines(p),hd=pkHd(p);
 const herr=g.fin?te(g.dev?"w":"d","Hergerichtet",fmt(H.fin.t).slice(0,6)+' von '+esc(nmA(H.fin,"by"))+(dev.length?'<span class="audev">'+dev.map(esc).join("<br>")+'</span>':'')):
  g.d?te("n","Wird hergerichtet",g.d+" von "+g.n+" Positionen"):I.late?te("r","Noch nicht hergerichtet","geplant war "+pkWd(pkHDay(p))):te("","Herrichten",(pkShifted(p)?"verschoben auf "+pkWd(pkHDay(p))+" (Dispo-Beginn "+pkWd(p.db)+")":"geplant "+pkWd(pkHDay(p)))+(hd&&hd.why?" – "+esc(hd.why):""));
 const t00=pkDay(Date.now()),zusT=(p.zus||[]).map(z=>{const zg=pkZProg(p,z.ps),zf=pkZFin(p,z),zd=pkZDay(p,z),zdev=auDevLines(p,String(z.ps)),lab="Nachlieferung (Zusatz "+esc(z.ps)+")";
  return zf?te(zg.dev?"w":"d",lab,"hergerichtet "+fmt(zf.t).slice(0,6)+" von "+esc(nmA(zf,"by"))+(zdev.length?'<span class="audev">'+zdev.map(esc).join("<br>")+'</span>':"")):zg.d?te("n",lab,"wird hergerichtet: "+zg.d+" von "+zg.n+" Positionen"):zd<t00?te("r",lab,"noch nicht hergerichtet – geplant war "+pkWd(zd)):te("",lab,"herrichten "+(zd===t00?"heute":pkWd(zd))+" · "+pkPosN((z.pos||[]).length))}).join("");
 const outT=I.over?te("r","Überfällig","Dispo-Ende war "+pkWd(p.de)+(B.R.length?"":" – noch nichts zurück")):I.S[2].c==="d"?te("d","Draußen","Dispo "+pkWd(p.db)+" – "+pkWd(p.de)):te("","Draußen","ab "+pkWd(auOutDay(p)));
 const R=B.R.slice().sort((a,b)=>(abgRetT(a)||0)-(abgRetT(b)||0));
 const retT=R.length?R.map(r=>te(r.closed?(r.art==="teil"?"d":(B.fehlt&&!I.kl?"r":"d")):"n",abgRetLbl(r),fmt(abgRetT(r)).slice(0,6)+" · "+abgRetN(r)+" Stück"+(r.closed&&r.art!=="teil"?" · "+(B.fehlt?B.fehlt+" fehlen noch":"alles da"):""))).join(""):te("","Retouren","noch nichts zurück");
 const doneT=I.kl?te("d","Mit Projektleiter geklärt",fmt(H.klar.t).slice(0,6)+" · "+esc(nmA(H.klar,"by"))):I.done?te("d","Erledigt","alles zurück"):te("","Erledigt","wenn alles zurück oder geklärt ist");
 const tl='<section class="card aucd"><b class="ausec">Wie weit ist das Lager?</b><div class="autl">'+te("d","Packliste da",(p.t?fmt(p.t).slice(0,6)+" · ":"")+pkPosN(pkPosAll(p).length)+(fr?", davon "+fr+" mit Fremdmiete":"")+((p.zus||[]).length?" · "+(p.zus.length===1?"1 Zusatz":p.zus.length+" Zusätze"):""))+herr+zusT+outT+retT+doneT+'</div></section>';
 const ansH=a=>'<div class="auans"><b>'+(a.by===me?'Deine Antwort':esc(nmA(a,"by")))+'</b> · '+fmt(a.t).slice(0,6)+'<br>'+esc(auAnsTxt(a))+(a.read&&a.read.t?'<small>Gelesen von '+esc(nmA(a.read,"by"))+'</small>':'<small>Noch nicht gelesen</small>')+'</div>';
 const miss=I.missShow?'<section class="card aucd red"><b class="ausec red">Fehlt noch</b>'+B.miss.map((e,i)=>{const a=auAns(p,e.k)[0];return '<div class="aurow"><b class="auq">'+auQ(e.soll-e.back,auUnit(p,e.k))+'</b><span class="aun">'+esc(e.name)+'</span>'+(act?'<button class="btn ghost s auab" type="button" data-aua="'+i+'">'+(a?'Ändern':'Antworten')+'</button>':'')+'</div>'+(a?ansH(a):'')}).join("")+'</section>':
  (B.miss.length&&B.R.length&&!I.done?'<section class="card aucd"><b class="ausec">Noch draußen</b><small class="mute">Teilretoure – das kommt laut Packliste noch zurück.</small>'+B.miss.map(e=>'<div class="aurow"><b class="auq m">'+auQ(e.soll-e.back,auUnit(p,e.k))+'</b><span class="aun">'+esc(e.name)+'</span></div>').join("")+'</section>':'');
 const more=B.more.length&&!I.done?'<section class="card aucd"><b class="ausec">Mehr zurück als geplant</b>'+B.more.map(e=>'<div class="aurow"><b class="auq m">+'+auQ(e.back-e.soll-e.fr-e.l55,auUnit(p,e.k))+'</b><span class="aun">'+esc(e.name)+'</span></div>').join("")+'</section>':'';
 const M=PLAW.filter(a=>a.pk===p.id&&a.typ==="msg");
 const msgs=M.length?'<section class="card aucd"><b class="ausec">Nachrichten ans Lager</b>'+M.map(ansH).join("")+'</section>':'';
 const H2=pkH(p),K=pkKeys(p);
 const mat='<details class="card aucd aumat"><summary><b>Material</b><small>'+pkPosN(pkPosAll(p).length)+'</small></summary>'+pkPosAll(p).map((x,i)=>{const h=H2[K[i]],st=pkPS(x,h),l55=pkL55(x,h);
  return '<div class="aurow"><b class="auq m">'+auQ(x.n,x.u)+'</b><span class="aun">'+esc(pkName(x))+(x.f>0&&!(h&&h.fm==="lager")?' <small class="red">davon '+pkNum(x.f)+' '+esc(x.u||"Stk")+' Fremdmiete</small>':'')+'</span><span class="aust">'+(l55?'Lager 55':st.s==="open"?'':st.s==="part"?'<span class="or">'+pkNum(st.q)+' '+esc(x.u||"Stk")+' da</span>':'✓')+'</span></div>'}).join("")+'</details>';
 $("#app").innerHTML='<section class="card aucd"><div class="aukv"><span>Auftrag</span><b>'+esc(p.ord||"–")+'</b><span>Projektleiter</span><b>'+esc(shortName(p.pl)||"–")+(mine?' <small class="mute">(du)</small>':'')+'</b><span>Dispo</span><b>'+pkD(p.db)+' – '+pkD(p.de)+'</b>'+(p.an?'<span>Anlieferung</span><b>'+pkD(p.an)+'</b>':'')+'</div></section>'+
  tl+miss+more+msgs+(act?'<button class="btn" id="aumsg" type="button">Nachricht ans Lager</button>':'')+mat+
  (!mine?'<p class="mute" style="font-size:12px;margin:8px 2px">Antworten kann nur der Projektleiter dieses Auftrags.</p>':'');
 document.querySelectorAll("[data-aua]").forEach(b=>b.onclick=()=>auAnsDlg(p,B.miss[+b.dataset.aua]));
 if($("#aumsg"))$("#aumsg").onclick=()=>auMsgDlg(p)}
/* ---------- Antworten ---------- */
async function auSave(o,msg){const id=Date.now().toString(36)+Math.random().toString(36).slice(2,6);
 return rSave(()=>db.doc("plaw/"+id).set({...o,by:me,...tabAs("by"),t:Date.now()}),msg)}
function auAnsDlg(p,e){if(!e)return;const n=e.soll-e.back,o=document.createElement("div");o.className="ov";let typ=null,to=null;
 const O=[["anders","Ist auf einer anderen Baustelle","Auftrag wählen"],["bau","Ist noch auf der Baustelle","kommt bis: Datum (optional)"],["kunde","Bleibt beim Kunden","z. B. Miete verlängert, Verkauf"],["zur","Ist schon zurück","Lager soll nachzählen"],["weiss","Weiß ich nicht / kläre ich",""]];
 o.innerHTML='<div class="card audlg"><b style="font-size:17px">'+pkNum(n)+' '+esc(auUnit(p,e.k))+' '+esc(e.name)+'</b><div class="mute">'+esc(p.ev||"")+' · Auftrag '+esc(p.ord||"–")+'</div>'+
  O.map(([k,t,s])=>'<button class="auopt" type="button" data-ao="'+k+'"><i></i><span><b>'+t+'</b>'+(s?'<small>'+s+'</small>':'')+(k==="anders"?'<small class="auto" id="auto"></small>':'')+(k==="bau"?'<input type="date" id="aubis" hidden>':'')+'</span></button>').join("")+
  '<textarea id="autx" placeholder="Notiz (optional)" style="min-height:60px;margin-top:6px"></textarea><div class="row" style="margin-top:8px"><button class="btn ghost" id="aux" type="button">Abbrechen</button><button class="btn" id="auok" type="button" disabled>Antwort ans Lager schicken</button></div></div>';
 document.body.appendChild(o);const ok=o.querySelector("#auok"),bis=o.querySelector("#aubis"),tl=o.querySelector("#auto");
 const sel=k=>{typ=k;o.querySelectorAll("[data-ao]").forEach(x=>x.classList.toggle("on",x.dataset.ao===k));bis.hidden=k!=="bau";ok.disabled=k==="anders"&&!to;
  if(k==="anders"&&!to)abgPickPack(p,c=>{to=c;tl.textContent=(c.ev||"–")+" ("+(c.ord||"–")+") – ändern";ok.disabled=false})};
 o.querySelectorAll("[data-ao]").forEach(b=>b.onclick=ev=>{if(ev.target===bis)return;if(b.dataset.ao==="anders"&&typ==="anders"&&to){to=null;tl.textContent="";}sel(b.dataset.ao)});
 o.querySelector("#aux").onclick=()=>o.remove();
 ok.onclick=()=>{if(!typ)return;const d={pk:p.id,ord:p.ord||"",ev:p.ev||"",k:e.k,name:e.name,n,u:auUnit(p,e.k),typ,txt:o.querySelector("#autx").value.trim()};
  if(typ==="anders"&&to){d.to=to.id;d.toEv=to.ev||"";d.toOrd=to.ord||""}if(typ==="bau"&&bis.value)d.bis=bis.value;o.remove();auSave(d,"Antwort ans Lager geschickt")}}
function auMsgDlg(p){const o=document.createElement("div");o.className="ov";
 o.innerHTML='<div class="card audlg"><b style="font-size:17px">Nachricht ans Lager</b><div class="mute">'+esc(p.ev||"")+' · Auftrag '+esc(p.ord||"–")+'</div><textarea id="aumt" placeholder="z. B. Abbau verschiebt sich auf Montag" style="min-height:110px;margin-top:8px"></textarea><div class="row" style="margin-top:8px"><button class="btn ghost" id="aux" type="button">Abbrechen</button><button class="btn" id="auok" type="button">Senden</button></div></div>';
 document.body.appendChild(o);const t=o.querySelector("#aumt");o.querySelector("#aux").onclick=()=>o.remove();
 o.querySelector("#auok").onclick=()=>{const v=t.value.trim();if(!v){t.classList.add("bad");return}o.remove();auSave({pk:p.id,ord:p.ord||"",ev:p.ev||"",typ:"msg",txt:v},"Nachricht ans Lager geschickt")};setTimeout(()=>t.focus(),60)}
/* ---------- Lager-Seite ---------- */
const plIn=()=>can("pk_s");
const plUnread=()=>plIn()?PLAW.filter(a=>!(a.read&&a.read.t)):[];
function plStrip(){const U=plUnread();if(!U.length)return"";const nm=[...new Set(U.map(a=>a.ev||a.ord))].slice(0,2).join(", ");
 return '<button class="abgstrip" type="button" id="plstrip"><svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg><span><b>'+(U.length===1?'1 Antwort':U.length+' Antworten')+' von Projektleitern</b><br><small class="mute">'+esc(nm)+'</small></span><b>›</b></button>'}
function plBind(){const s=$("#plstrip");if(s)s.onclick=()=>go("plin")}
function plCard(a){const p=packs.find(x=>x.id===a.pk);
 return '<section class="card aucd'+(a.read&&a.read.t?'':' unread')+'"><div class="auct"><b>'+esc(a.ev||(p&&p.ev)||"–")+'</b><small class="mute">'+esc(nmA(a,"by"))+' · '+fmt(a.t)+'</small></div><small class="mute">Auftrag '+esc(a.ord||"–")+'</small>'+
  (a.typ!=="msg"?'<div class="aurow"><b class="auq">'+auQ(a.n||0,a.u||auUnit(p,a.k))+'</b><span class="aun">'+esc(a.name||"")+'</span></div>':'')+'<div class="auans">'+esc(auAnsTxt(a))+(a.read&&a.read.t?'<small>Gelesen von '+esc(nmA(a.read,"by"))+', '+fmt(a.read.t).slice(0,6)+'</small>':'')+'</div>'+
  '<div class="abg2">'+(p?'<button class="btn ghost s" type="button" data-plv="'+esc(a.id)+'">Ansehen</button>':'')+(a.read&&a.read.t?'':'<button class="btn s" type="button" data-plr="'+esc(a.id)+'">Gelesen</button>')+'</div></section>'}
function plInView(){if(!plIn()){view="start";return startView()}$("#t").textContent="Antworten von Projektleitern";const U=PLAW.filter(a=>!(a.read&&a.read.t)),R=PLAW.filter(a=>a.read&&a.read.t).slice(0,20);
 $("#app").innerHTML='<p class="mute" style="margin:0 0 10px;line-height:1.45">Projektleiter antworten in „Meine Aufträge“ auf Fehlmaterial oder schreiben eine Nachricht. Die App ändert dabei nichts – zugeordnet oder geklärt wird weiter von euch.</p>'+
  (U.length?U.map(plCard).join(""):'<div class="card mute">Keine neuen Antworten.</div>')+(R.length?'<details class="abgcard abgmore"><summary><b>Gelesen</b><small>'+R.length+'</small></summary>'+R.map(plCard).join("")+'</details>':'');
 document.querySelectorAll("[data-plr]").forEach(b=>b.onclick=()=>rSave(()=>db.doc("plaw/"+b.dataset.plr).update({read:{by:me,...tabAs("by"),t:Date.now()}}),"Als gelesen markiert"));
 document.querySelectorAll("[data-plv]").forEach(b=>b.onclick=()=>{const a=PLAW.find(x=>x.id===b.dataset.plv);curPack=a.pk;go(abgOk()?"pkabg":"packopen")})}
/* Antwort im Auftragskonto (abg.js) beim Artikel */
function plAbgLine(p,e){const a=auAns(p,e.k)[0];return a?'<div class="auans s"><b>'+esc(nmA(a,"by"))+'</b>, '+fmt(a.t).slice(0,6)+': '+esc(auAnsTxt(a))+'</div>':''}
function plAbgMsgs(p){const M=PLAW.filter(a=>a.pk===p.id&&a.typ==="msg");return M.length?'<section class="abgcard"><b class="abglh">Nachrichten vom Projektleiter</b>'+M.map(a=>'<div class="auans s"><b>'+esc(nmA(a,"by"))+'</b>, '+fmt(a.t).slice(0,6)+': '+esc(a.txt||"")+'</div>').join("")+'</section>':''}
/* Projektleiter sagt: „ist auf Baustelle A“ – Vorschlag bei „Zu viel zurück“ von A */
const plSays=(fromP,toP,k)=>PLAW.some(a=>a.typ==="anders"&&a.pk===fromP.id&&a.to===toP.id&&a.k===k);
/* Kachel auf der Hauptseite */
function auSubT(){const M=packs.filter(auIsMine).map(auInfo).filter(I=>!I.done);return M.length?M.length+(M.length===1?" eigener Auftrag läuft":" eigene Aufträge laufen"):"Lager-Stand deiner Aufträge"}
function auHot(){const n=packs.filter(auIsMine).map(auInfo).filter(I=>I.hot).length;return n?String(n):""}
