/* ===== Werkstatt: Reparatur + verwendete Ersatzteile, Ersatzteile-Bericht als PDF (ab 1.95) =====
   Zweck (Jürgen): der Chef will wissen, welche Ersatzteile verbraucht wurden.
   Ablauf: Defekt offen → Werkstatt tippt „Repariert“ → Fenster mit Reparaturbeschreibung, Ersatzteilen (Menge+Einheit, Name Pflicht,
   TPC-Nr. / Hersteller-Nr. optional) und Fotos → „Speichern und erledigt“. Später beim erledigten Defekt „Reparatur ändern“.
   Daten im Defekt: rep (Text), et [{n,u,nm,tnr,hnr}], rfn (Anzahl Reparatur-Fotos, gespeichert als fotos/<id>r-<k>).
   Recht: „Defekte – Bearbeiten“ (def_b) – eintragen und Bericht. Bericht nach Reparaturdatum (doneT), keine Preise. */
const etList=d=>Array.isArray(d&&d.et)?d.et.filter(e=>e&&e.nm):[];
const etQ=e=>{const n=+e.n||0;return (Number.isInteger(n)?String(n):String(n).replace(".",","))+" "+(e.u||"Stk")};
const etNrs=e=>[e.tnr?"TPC "+e.tnr:"",e.hnr?"Hersteller "+e.hnr:""].filter(Boolean).join(" · ");
/* Vorschläge: alle bisher eingetragenen Teile, nach Häufigkeit */
function etKnown(){const M={};defs.forEach(d=>etList(d).forEach(e=>{const k=String(e.nm).trim().toLowerCase();if(!k)return;const m=M[k]||(M[k]={nm:e.nm,tnr:"",hnr:"",u:e.u||"Stk",c:0,t:0});m.c++;
  const t=d.doneT||d.t||0;if(t>=m.t){m.t=t;m.nm=e.nm;if(e.tnr)m.tnr=e.tnr;if(e.hnr)m.hnr=e.hnr;m.u=e.u||m.u}else{if(!m.tnr&&e.tnr)m.tnr=e.tnr;if(!m.hnr&&e.hnr)m.hnr=e.hnr}}));
 return Object.values(M).sort((a,b)=>b.c-a.c||a.nm.localeCompare(b.nm,"de"))}
/* Karte „Reparatur“ beim Defekt */
function etCard(d){const L=etList(d),rf=+d.rfn||0;if(!d.rep&&!L.length&&!rf)return "";
 return '<div class="card etc"><div class="dsh">Reparatur</div>'+(d.rep?'<p style="white-space:pre-wrap;margin:0 0 8px">'+esc(d.rep)+'</p>':'')+
  '<b class="eth">Verwendete Ersatzteile</b>'+(L.length?L.map(e=>'<div class="etr"><b>'+esc(etQ(e))+'</b><span>'+esc(e.nm)+(etNrs(e)?'<small>'+esc(etNrs(e))+'</small>':'')+'</span></div>').join(""):'<div class="mute">Keine Ersatzteile.</div>')+
  (rf?'<div id="etph" class="thr" style="margin-top:8px"></div>':'')+'</div>'}
function etBind(d){if((+d.rfn||0)&&$("#etph"))loadTh("etph",{id:d.id+"r",fn:+d.rfn});
 if($("#etedit"))$("#etedit").onclick=()=>etDlg(d,false)}
/* Fenster „Reparatur“ – fin=true: danach als erledigt markieren */
async function etDlg(d,fin){const o=document.createElement("div");o.className="ov";let L=etList(d).map(e=>({...e}));const ph=[],n0=+d.rfn||0;
 o.innerHTML='<div class="card etd"><b style="font-size:17px">Reparatur</b><div class="mute">'+esc(d.art)+(d.ev?' · '+esc(d.ev):'')+'</div>'+
  '<label class="mute" for="etrep" style="margin-top:10px;display:block">Was wurde gemacht? (optional)</label><textarea id="etrep" placeholder="z. B. Stecker getauscht, Kabel 20 cm gekürzt" style="min-height:80px"></textarea>'+
  '<b class="eth">Verwendete Ersatzteile</b><div id="etl"></div><button class="etadd" id="etadd" type="button">+ Ersatzteil</button>'+
  '<div id="etp" class="thr"></div><button class="btn ghost" id="etpb" type="button">Foto hinzufügen</button><input id="etpf" type="file" accept="image/*" capture="environment" hidden>'+
  '<div class="row" style="margin-top:12px"><button class="btn ghost" id="etx" type="button">Abbrechen</button><button class="btn" id="ets" type="button"'+(fin?' style="background:var(--ok)"':'')+'>'+(fin?'Speichern und erledigt':'Speichern')+'</button></div></div>';
 document.body.appendChild(o);const g=k=>o.querySelector("#"+k);g("etrep").value=d.rep||"";
 const draw=()=>{g("etl").innerHTML=L.length?L.map((e,i)=>'<div class="etr"><b>'+esc(etQ(e))+'</b><span>'+esc(e.nm)+(etNrs(e)?'<small>'+esc(etNrs(e))+'</small>':'')+'</span><button class="lnk" type="button" data-ete="'+i+'">Ändern</button></div>').join(""):'<div class="mute" style="margin:2px 0 6px">Noch keine – wenn keine Teile gebraucht wurden, einfach leer lassen.</div>';
  g("etl").querySelectorAll("[data-ete]").forEach(b=>b.onclick=()=>{const i=+b.dataset.ete;etPartDlg(L[i],r=>{if(r===null)L.splice(i,1);else L[i]=r;draw()})})};draw();
 g("etadd").onclick=()=>etPartDlg(null,r=>{if(r){L.push(r);draw()}});
 const showP=()=>{showTh("etp",ph,"etpb")};
 g("etpb").onclick=()=>g("etpf").click();
 g("etpf").onchange=async e=>{const f=e.target.files[0];e.target.value="";if(!f)return;if(ph.length>=6)return toast("Maximal 6 Fotos.");try{ph.push(await shrink(f));showP()}catch(x){toast("Foto konnte nicht gelesen werden.")}};
 g("etx").onclick=()=>o.remove();
 if(n0){g("ets").disabled=true;for(let k=0;k<n0;k++){const key=d.id+"r-"+k;let u=pc[key];if(!u){try{const sn=await db.doc("fotos/"+key).get();if(sn.exists){u=sn.data().d;pc[key]=u}}catch(e){}}if(u)ph.push(u)}g("ets").disabled=false}
 showP();
 g("ets").onclick=async()=>{g("ets").disabled=true;
  try{const n=await savePhotos(d.id+"r",ph);for(let k=n;k<n0;k++){try{await db.doc("fotos/"+d.id+"r-"+k).delete()}catch(e){}}
   Object.keys(pc).filter(k=>k.startsWith(d.id+"r-")).forEach(k=>delete pc[k]);
   const up={rep:g("etrep").value.trim(),et:L.map(e=>({n:+e.n||0,u:e.u||"Stk",nm:e.nm,tnr:e.tnr||"",hnr:e.hnr||""})),rfn:n,repBy:me,...tabAs("repBy"),repT:Date.now()};
   if(fin)Object.assign(up,{done:true,doneBy:me,...tabAs("doneBy"),doneT:Date.now()});
   await db.doc("defekte/"+d.id).update(up);o.remove();toast(fin?"Repariert – Defekt erledigt":"Gespeichert",1)}
  catch(x){g("ets").disabled=false;toast("Speichern fehlgeschlagen. Bitte nochmal versuchen.")}}}
/* Fenster „Ersatzteil hinzufügen / ändern“ – cb(teil) oder cb(null) = löschen */
function etPartDlg(e,cb){const o=document.createElement("div");o.className="ov";o.style.zIndex=25;const K=etKnown();
 o.innerHTML='<div class="card etd"><b style="font-size:17px">'+(e?'Ersatzteil ändern':'Ersatzteil hinzufügen')+'</b>'+
  '<label class="mute" for="etn" style="margin-top:10px;display:block">Artikelname <span class="rq">*</span></label><div style="position:relative"><input id="etn" autocomplete="off" placeholder="z. B. CEE-Stecker 32A 5-polig" style="margin:0"><div id="etres" class="peres"></div></div>'+
  '<div class="row" style="gap:8px;margin-top:10px"><div style="flex:1"><label class="mute" for="ett">TPC-Artikelnr. (optional)</label><input id="ett" autocomplete="off" style="margin:0"></div><div style="flex:1"><label class="mute" for="ethn">Hersteller-Nr. (optional)</label><input id="ethn" autocomplete="off" style="margin:0"></div></div>'+
  '<div class="row" style="gap:8px;align-items:flex-end;margin-top:10px"><div style="flex:1"><label class="mute" for="etq">Menge</label><div class="row" style="align-items:center;gap:6px"><button class="btn ghost" id="etm" type="button" style="flex:0 0 46px">−</button><input id="etq" type="number" inputmode="decimal" min="0" style="text-align:center;font-size:20px;margin:0"><button class="btn ghost" id="etpl" type="button" style="flex:0 0 46px">+</button></div></div>'+
  '<div style="flex:0 0 86px"><label class="mute" for="etu">Einheit</label><input id="etu" maxlength="8" list="etul" style="margin:0"><datalist id="etul"><option value="Stk"><option value="m"><option value="Pkg"><option value="Set"></datalist></div></div>'+
  '<div class="mute" style="margin-top:8px"><span class="rq">*</span> Pflichtfeld</div>'+
  '<div class="row" style="margin-top:12px"><button class="btn ghost" id="etpx" type="button">Abbrechen</button><button class="btn" id="etps" type="button">'+(e?'Übernehmen':'Hinzufügen')+'</button></div>'+
  (e?'<button class="lnk" id="etpd" type="button" style="margin-top:8px;color:var(--bad)">Entfernen</button>':'')+'</div>';
 document.body.appendChild(o);const g=k=>o.querySelector("#"+k);
 g("etn").value=e?e.nm:"";g("ett").value=e?(e.tnr||""):"";g("ethn").value=e?(e.hnr||""):"";g("etq").value=e?String(e.n):"1";g("etu").value=e?(e.u||"Stk"):"Stk";
 g("etn").oninput=()=>{g("etn").classList.remove("bad");const t=g("etn").value.trim().toLowerCase();if(t.length<2){g("etres").innerHTML="";return}
  const R=K.filter(k=>k.nm.toLowerCase().includes(t)||String(k.tnr).toLowerCase().startsWith(t)||String(k.hnr).toLowerCase().includes(t)).slice(0,6);
  g("etres").innerHTML=R.map((k,j)=>'<button type="button" data-er="'+j+'"><b>'+esc(k.nm)+'</b> <small>'+esc([etNrs(k),k.c+"× verwendet"].filter(Boolean).join(" · "))+'</small></button>').join("");
  g("etres").querySelectorAll("[data-er]").forEach(b=>b.onclick=()=>{const k=R[+b.dataset.er];g("etn").value=k.nm;g("ett").value=k.tnr||"";g("ethn").value=k.hnr||"";g("etu").value=k.u||"Stk";g("etres").innerHTML=""})};
 const nv=()=>Math.max(0,parseFloat(String(g("etq").value).replace(",","."))||0);
 g("etm").onclick=()=>{g("etq").value=String(Math.max(0,nv()-1))};g("etpl").onclick=()=>{g("etq").value=String(nv()+1)};
 g("etpx").onclick=()=>o.remove();
 if(g("etpd"))g("etpd").onclick=()=>{o.remove();cb(null)};
 g("etps").onclick=()=>{const nm=g("etn").value.trim(),n=nv();if(!nm){g("etn").classList.add("bad");g("etn").focus();return}if(!n){g("etq").classList.add("bad");return}
  o.remove();cb({n,u:g("etu").value.trim()||"Stk",nm,tnr:g("ett").value.trim(),hnr:g("ethn").value.trim()})}}
/* ===== Ersatzteile-Bericht ===== */
function etRange(k,a,b){const n=new Date(),y=n.getFullYear(),m=n.getMonth();
 if(k==="m")return [new Date(y,m,1).getTime(),new Date(y,m+1,1).getTime()-1];
 if(k==="lm")return [new Date(y,m-1,1).getTime(),new Date(y,m,1).getTime()-1];
 if(k==="y")return [new Date(y,0,1).getTime(),new Date(y+1,0,1).getTime()-1];
 const p=s=>{const q=String(s||"").split("-").map(Number);return q.length===3&&q[0]?new Date(q[0],q[1]-1,q[2]).getTime():0};const f=p(a),t=p(b);return f&&t&&t>=f?[f,t+864e5-1]:null}
const etDs=t=>{const d=new Date(t);return d.getDate()+"."+(d.getMonth()+1)+"."+d.getFullYear()};
function etRangeTx(k,r){const M=["Jänner","Februar","März","April","Mai","Juni","Juli","August","September","Oktober","November","Dezember"],d=new Date(r[0]);
 const span=etDs(r[0])+" – "+etDs(r[1]);if(k==="m"||k==="lm")return M[d.getMonth()]+" "+d.getFullYear()+" ("+span+")";if(k==="y")return "Jahr "+d.getFullYear()+" ("+span+")";return span}
function etData(r){const D=vdefs().filter(d=>d.done&&d.doneT>=r[0]&&d.doneT<=r[1]).sort((a,b)=>a.doneT-b.doneT),S={};let parts=0;
 D.forEach(d=>etList(d).forEach(e=>{parts+=/^stk/i.test(e.u||"Stk")?Math.ceil(+e.n||0):1; /* Stück zählen, Meterware usw. als 1 Teil */const k=String(e.nm).trim().toLowerCase()+"|"+String(e.u||"Stk").toLowerCase(),s=S[k]||(S[k]={nm:e.nm,u:e.u||"Stk",n:0,tnr:"",hnr:""});s.n+=+e.n||0;if(e.tnr)s.tnr=e.tnr;if(e.hnr)s.hnr=e.hnr}));
 const sum=Object.values(S).sort((a,b)=>b.n-a.n||a.nm.localeCompare(b.nm,"de"));return {D,sum,parts}}
async function etPdf(k,r){await wbLoadPdf();const {PDFDocument,StandardFonts,rgb}=PDFLib,doc=await PDFDocument.create(),F=await doc.embedFont(StandardFonts.Helvetica),B=await doc.embedFont(StandardFonts.HelveticaBold);
 const W=595.28,HP=841.89,ML=36,MR=36,MT=36,MB=44,CW=W-ML-MR,NAVY=rgb(.067,.29,.592),INK=rgb(.09,.13,.18),GREY=rgb(.36,.41,.47),LINE=rgb(.73,.76,.83),HAIR=rgb(.89,.91,.93),TINT=rgb(.933,.953,.98);
 const {D,sum,parts}=etData(r),rt=etRangeTx(k,r);let pg,y;const pages=[];
 const txt=(s,x,yy,o)=>{o=o||{};pg.drawText(wbTx(s),{x,y:yy,size:o.size||9,font:o.bold?B:F,color:o.color||INK})};
 const tw=(s,f,z)=>f.widthOfTextAtSize(wbTx(s),z);
 const wrap=(s,f,z,w)=>{const out=[];let cur="";wbTx(s).split(/\n/).forEach((par,pi)=>{if(pi){out.push(cur);cur=""}par.split(" ").forEach(word=>{const t=cur?cur+" "+word:word;if(f.widthOfTextAtSize(t,z)<=w){cur=t;return}if(cur)out.push(cur);cur=word;
   while(cur.length>1&&f.widthOfTextAtSize(cur,z)>w){let i=cur.length;while(i>1&&f.widthOfTextAtSize(cur.slice(0,i),z)>w)i--;out.push(cur.slice(0,i));cur=cur.slice(i)}})});out.push(cur);return out};
 const newPage=()=>{pg=doc.addPage([W,HP]);pages.push(pg);y=HP-MT;if(pages.length>1){txt("Ersatzteile-Bericht · "+rt+" (Fortsetzung)",ML,y-8,{size:8.5,bold:true,color:NAVY});y-=20}};
 const need=h=>{if(y-h<MB)newPage()};
 const C=[{w:56,t:"Menge",r:1},{w:0,t:"Ersatzteil"},{w:84,t:"TPC-Nr."},{w:110,t:"Hersteller-Nr."}];C[1].w=CW-C.reduce((a,c)=>a+c.w,0);let cx=ML;C.forEach(c=>{c.x=cx;cx+=c.w});
 const thead=(x0,w0)=>{C.forEach(c=>{const s=c.t;txt(s,c.r?c.x+c.w-6-tw(s,B,7.5):c.x+6,y-9,{size:7.5,bold:true,color:GREY})});y-=13;pg.drawLine({start:{x:x0,y},end:{x:x0+w0,y},thickness:.7,color:LINE});y-=1};
 const prow=e=>{const nl=wrap(e.nm,F,8.5,C[1].w-10),h=nl.length*10.5+5;need(h);const q=etQ(e);
  txt(q,C[0].x+C[0].w-6-tw(q,B,8.5),y-10,{size:8.5,bold:true});nl.forEach((l,i)=>txt(l,C[1].x+6,y-10-i*10.5,{size:8.5}));txt(e.tnr||"–",C[2].x+6,y-10,{size:8.5,color:e.tnr?INK:GREY});txt(e.hnr||"–",C[3].x+6,y-10,{size:8.5,color:e.hnr?INK:GREY});
  y-=h;pg.drawLine({start:{x:ML,y},end:{x:ML+CW,y},thickness:.4,color:HAIR})};
 newPage();
 txt("THE POWER COMPANY · WERKSTATT",ML,y-8,{size:7.5,bold:true,color:NAVY});
 const p1="Erstellt "+fmt(Date.now()),p2="von "+meName();txt(p1,W-MR-tw(p1,F,8.5),y-9,{size:8.5,color:GREY});txt(p2,W-MR-tw(p2,F,8.5),y-20,{size:8.5,color:GREY});
 txt("Ersatzteile-Bericht",ML,y-30,{size:18,bold:true});txt(rt+" · nach Reparaturdatum",ML,y-45,{size:9.5,color:GREY});y-=52;
 pg.drawLine({start:{x:ML,y},end:{x:W-MR,y},thickness:1.6,color:NAVY});y-=12;
 const bw=(CW-16)/3;[[D.length,"Reparaturen"],[String(parts).replace(".",","),"Ersatzteile verbaut"],[sum.length,"verschiedene Teile"]].forEach((s,i)=>{const x=ML+i*(bw+8);pg.drawRectangle({x,y:y-40,width:bw,height:40,color:TINT});txt(String(s[0]),x+10,y-20,{size:16,bold:true,color:NAVY});txt(s[1],x+10,y-33,{size:8.5,color:GREY})});y-=54;
 const sec=t=>{need(40);pg.drawRectangle({x:ML,y:y-17,width:CW,height:17,color:NAVY});txt(t,ML+8,y-12,{size:9.5,bold:true,color:rgb(1,1,1)});y-=24};
 sec("Reparaturen ("+D.length+")");
 if(!D.length){txt("Keine Reparaturen in diesem Zeitraum.",ML,y-10,{size:9,color:GREY});y-=20}
 D.forEach(d=>{const L=etList(d),hd=wrap(d.art+(d.anr?"  ("+d.anr+")":""),B,10.5,CW-170);need(54+Math.min(L.length,3)*11);
  pg.drawLine({start:{x:ML,y},end:{x:ML+CW,y},thickness:.8,color:LINE});y-=4;
  const rs="repariert "+etDs(d.doneT)+" · "+nmA(d,"doneBy");txt(rs,W-MR-tw(rs,F,8.5),y-11,{size:8.5,color:GREY});
  hd.forEach((l,i)=>txt(l,ML,y-11-i*13,{size:10.5,bold:true}));y-=hd.length*13+3;
  const meta=[["Defekt",d.desc||"Keine Beschreibung."],["Veranstaltung",(d.ev||"–")+"   ·   Auftrag "+(d.ord||"–")],["Gemeldet",etDs(d.t)+" von "+nmA(d,"by")+(d.urg?" · dringend":"")]];
  if(d.fb)meta.push(["Werkstatt",d.fb]);if(d.rep)meta.push(["Reparatur",d.rep]);
  meta.forEach(([l,v])=>{const vl=wrap(v,F,8.5,CW-78);need(vl.length*10.5+2);txt(l,ML,y-9,{size:8.5,color:GREY});vl.forEach((s,i)=>txt(s,ML+76,y-9-i*10.5,{size:8.5}));y-=vl.length*10.5+1.5});y-=4;
  if(L.length){need(28);thead(ML,CW);L.forEach(prow)}else{txt("Keine Ersatzteile eingetragen.",ML+76,y-9,{size:8.5,color:GREY});y-=14}
  y-=12});
 y-=4;sec("Summe pro Ersatzteil ("+sum.length+")");
 if(!sum.length){txt("Keine Ersatzteile in diesem Zeitraum.",ML,y-10,{size:9,color:GREY});y-=20}else{thead(ML,CW);sum.forEach(prow)}
 pages.forEach((p,i)=>{const s="Seite "+(i+1)+" von "+pages.length;p.drawText(s,{x:W-MR-F.widthOfTextAtSize(s,8),y:22,size:8,font:F,color:GREY})});
 return await doc.save()}
function etRepDlg(){const mob=wbMobile(),o=document.createElement("div");o.className="ov";let k="lm";const now=new Date(),iso=d=>d.getFullYear()+"-"+String(d.getMonth()+1).padStart(2,"0")+"-"+String(d.getDate()).padStart(2,"0");
 o.innerHTML='<div class="card etd"><b style="font-size:17px">Ersatzteile-Bericht</b><div class="mute">Welche Ersatzteile wurden verbaut? Zeitraum nach Reparaturdatum.</div>'+
  '<div class="etrg">'+[["m","Dieser Monat"],["lm","Letzter Monat"],["y","Dieses Jahr"],["c","Von … bis …"]].map(([v,t])=>'<button class="btn ghost s" type="button" data-erg="'+v+'">'+t+'</button>').join("")+'</div>'+
  '<div id="etcu" class="row" style="gap:8px;display:none"><div style="flex:1"><label class="mute" for="etf">Von</label><input id="etf" type="date" style="margin:0"></div><div style="flex:1"><label class="mute" for="ett2">Bis</label><input id="ett2" type="date" style="margin:0"></div></div>'+
  '<div class="pkdrf" id="etinfo"></div>'+
  '<div class="pkdrb"><button class="btn" id="etpp" type="button">Drucken</button><button class="btn ghost" id="etps2" type="button">Als PDF speichern</button></div>'+
  (navigator.canShare?'<button class="btn ghost" id="etsh" type="button" style="margin-top:8px">Teilen</button>':'')+
  '<button class="btn ghost" id="etrx" type="button" style="margin-top:8px">Schließen</button></div>';
 document.body.appendChild(o);const g=id=>o.querySelector("#"+id);g("etf").value=iso(new Date(now.getFullYear(),now.getMonth(),1));g("ett2").value=iso(now);
 const cur=()=>etRange(k,g("etf").value,g("ett2").value);
 const upd=()=>{o.querySelectorAll("[data-erg]").forEach(b=>b.classList.toggle("act",b.dataset.erg===k));g("etcu").style.display=k==="c"?"flex":"none";const r=cur();
  if(!r){g("etinfo").textContent="Bitte ein gültiges Von- und Bis-Datum wählen.";return}const {D,sum,parts}=etData(r);
  g("etinfo").textContent=etRangeTx(k,r)+": "+D.length+" Reparatur"+(D.length===1?"":"en")+" · "+String(parts).replace(".",",")+" Ersatzteile · "+sum.length+" verschiedene"};
 o.querySelectorAll("[data-erg]").forEach(b=>b.onclick=()=>{k=b.dataset.erg;upd()});g("etf").onchange=upd;g("ett2").onchange=upd;upd();
 const fnm=r=>"Ersatzteile-Bericht "+etDs(r[0]).replace(/\./g,"-")+" bis "+etDs(r[1]).replace(/\./g,"-")+".pdf";
 const mk=async()=>{const r=cur();if(!r){errBox("Bitte ein gültiges Von- und Bis-Datum wählen.");return null}g("etinfo").textContent="PDF wird erstellt …";
  try{const b=await etPdf(k,r),fn=fnm(r);upd();return {f:new File([new Blob([b],{type:"application/pdf"})],fn,{type:"application/pdf"}),fn}}catch(e){console.warn("Ersatzteile PDF",e);upd();errBox("Die PDF konnte nicht erstellt werden. Bitte Internetverbindung prüfen und nochmal versuchen.");return null}};
 const share=async()=>{const x=await mk();if(!x)return;if(navigator.canShare&&navigator.canShare({files:[x.f]})){try{await navigator.share({files:[x.f],title:"Ersatzteile-Bericht"});return}catch(e){if(e&&e.name==="AbortError")return;console.warn("Teilen ging nicht",e)}}await pkDrSave(x.f,x.fn)};
 g("etpp").onclick=async()=>{if(mob)return share();const w=window.open("","_blank"),x=await mk();if(!x){if(w)w.close();return}const u=URL.createObjectURL(x.f);if(w)w.location.href=u;else await pkDrSave(x.f,x.fn)};
 g("etps2").onclick=async()=>{const x=await mk();if(x)await pkDrSave(x.f,x.fn)};
 if(g("etsh"))g("etsh").onclick=share;
 g("etrx").onclick=()=>o.remove()}

/* ===== Fremdverschulden (1.116) – Felder fv (true/false) und fvw (Wer / wie?) am Defekt ===== */
function defFvGet(p){const c=$("#"+p+"fv"),w=$("#"+p+"fvw");const on=!!(c&&c.checked);return{fv:on,fvw:on&&w?w.value.trim():""}}
function defFvSet(p,d){const c=$("#"+p+"fv"),b=$("#"+p+"fvb"),w=$("#"+p+"fvw");if(!c)return;if(d){c.checked=!!d.fv;if(w)w.value=d.fvw||""}const up=()=>{if(b)b.hidden=!c.checked};up();c.addEventListener("change",()=>{up();if(c.checked&&w)setTimeout(()=>w.focus(),30)})}
function defFvTag(d){return d&&d.fv?'<span class="tag dfv" style="flex:0">FREMDVERSCHULDEN</span> ':""}
function defFvLine(d){const ed=d.by===me||canDone();
 if(!d.fv)return ed&&d.by!==me?'<button class="lnk" type="button" id="dfved" style="display:block;padding:6px 0 0">+ Fremdverschulden eintragen</button>':"";
 return '<div class="dfvl"><b>Fremdverschulden</b>'+(d.fvw?': '+esc(d.fvw):'')+(ed&&d.by!==me?' <button class="lnk" type="button" id="dfved">Ändern</button>':'')+'</div>'}
function defFvDlg(d){const o=document.createElement("div");o.className="ov";
 o.innerHTML='<div class="card" style="width:100%;max-width:400px;margin:0"><b>Fremdverschulden</b><p class="mute" style="margin:4px 0 8px">'+esc(d.art||"")+(d.ev?' · '+esc(d.ev):'')+'</p>'+
  '<label style="display:flex;gap:8px;align-items:center;margin:0 0 6px"><input type="checkbox" id="xfv" style="width:auto;margin:0">Fremdverschulden</label><div id="xfvb" hidden><label class="mute" for="xfvw">Wer / wie? (optional)</label><input id="xfvw" autocomplete="off" placeholder="z. B. Bühnenbauer mit Stapler drübergefahren"></div>'+
  '<div class="row" style="margin-top:10px"><button class="btn ghost" id="xfvc" type="button">Abbrechen</button><button class="btn" id="xfvo" type="button">Speichern</button></div></div>';
 document.body.appendChild(o);defFvSet("x",d);o.querySelector("#xfvc").onclick=()=>o.remove();
 o.querySelector("#xfvo").onclick=async()=>{const v=defFvGet("x");o.remove();if(!!d.fv===v.fv&&String(d.fvw||"")===v.fvw)return;
  try{await db.doc("defekte/"+d.id).update({...v,fvBy:me,fvT:Date.now()});toast(v.fv?"Fremdverschulden eingetragen":"Fremdverschulden entfernt",1)}catch(e){errBox("Speichern fehlgeschlagen"+(typeof sbErr==="function"?sbErr(e):"")+". Hast du das Recht dazu?")}}}
document.addEventListener("click",ev=>{const b=ev.target.closest&&ev.target.closest("#dfved");if(!b||typeof view==="undefined"||view!=="defopen")return;const d=defs.find(x=>x.id===curDef);if(d)defFvDlg(d)});
