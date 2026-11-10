/* ===== Packliste drucken / an den Monteur schicken (ab 1.90) =====
   Zweck (Jürgen): mit dem Ausdruck den Lieferschein in epirent erstellen – dafür muss man sehen, was sich geändert hat und was alles dabei ist;
   außerdem die Packliste per Mail an den Monteur schicken (ganze Liste im Text + PDF).
   Reihenfolge wie im epirent-Packschein (Positionsnummern). Zusätze eingerechnet: gleicher Artikel → zur Position dazu („inkl. … aus Zusatz …“),
   neuer Artikel → am Ende („Z …“). Ersatzartikel direkt unter ihrer Position. Fremdmiete mit Hinweis „kommt nicht vom Lager“. Lager 55 an seiner Stelle, grau.
   PDF mit pdf-lib (wbLoadPdf/wbTx/wbMobile aus wb.js). */
const pkDrU=r=>r.u||"Stk";
const pkDrQ=(n,u)=>pkNum(n)+" "+(u||"Stk");
/* Zeilen in epirent-Reihenfolge */
function pkDrRows(P){const H=pkH(P),IT=pkItems(P),rows=[];
 IT.forEach((o,i)=>{const x=o.x,h=H[o.k],l55=pkL55(x,h),k=pkAK(x),part={i,x,h,st:pkPS(x,h),l55,f:+x.f||0,fm:(h&&h.fm)||"",z:o.z||null,fin:pkRowFin(P,i)};
  let r=o.z&&!l55?rows.find(q=>!q.z&&!q.l55&&q.k===k):null;
  if(!r){r={k,pos:(o.z?"Z ":"")+(x.p||String(i+1)),name:pkName(x),a:x.a||"",u:x.u||"Stk",z:o.z||null,l55,items:[]};rows.push(r)}
  r.items.push(part)});
 rows.forEach(r=>{Object.assign(r,{soll:0,mit:0,fz:0,fl:0,nf:0,miss:0,open:0,over:0,zn:{},alt:[],nb:0,nbw:[]});
  r.items.forEach(p=>{const n=+p.x.n||0;r.soll+=n;if(p.z&&!r.z)r.zn[p.z]=(r.zn[p.z]||0)+n;if(p.l55)return;
   const nbn=pkNbN(p.x,p.h);if(nbn){r.nb+=nbn;const w=pkNbWho(p.h);if(w&&!r.nbw.includes(w))r.nbw.push(w)}
   if(p.f>0){if(p.fm==="lager")r.fl+=p.f;else if(p.fm==="miete")r.fz+=p.f;else r.nf+=p.f}
   if(p.st.s==="open"){if(p.fin)r.miss+=p.st.need;else r.open+=p.st.need}
   else{const ov=pkOver(p.x,p.h,p.st),q=p.st.s==="ok"?p.st.need+ov:Math.min(p.st.need,+p.st.q||0);r.mit+=q;r.over+=ov;if(p.st.s==="part")r.miss+=p.st.need-q;p.st.alt.forEach(a=>r.alt.push(a))}});
  r.ck=r.l55?"55":r.miss||r.fl||r.over||r.alt.length||r.nb?"!":r.open&&!r.mit?"":r.open?"…":"ok";
  const u=pkDrU(r),h=[];
  if(r.l55)h.push(["Lager 55 – holt Fahrer/Monteur selbst","m"]);
  if(r.miss)h.push([r.mit?"fehlt "+pkDrQ(r.miss,u):"nicht mitgegeben","o"]);
  if(r.over)h.push([pkDrQ(r.over,u)+" mehr als im Packschein","o"]);
  if(r.nb)h.push([pkDrQ(r.nb,u)+" nicht gebraucht"+(r.nbw.length?" ("+r.nbw.join(", ")+")":""),"o"]);
  if(r.open)h.push([(r.mit?pkDrQ(r.open,u)+" ":"")+"noch nicht hergerichtet","m"]);
  if(r.fl)h.push([pkDrQ(r.fl,u)+" aus dem Lager statt Fremdmiete","o"]);
  if(r.fz)h.push(["davon "+pkDrQ(r.fz,u)+" Fremdmiete – kommt nicht vom Lager","m"]);
  if(r.nf)h.push(["davon "+pkDrQ(r.nf,u)+" Fremdmiete (noch nicht geklärt)","m"]);
  Object.keys(r.zn).forEach(z=>h.push(["inkl. "+pkDrQ(r.zn[z],u)+" aus Zusatz "+z,"m"]));
  if(r.z)h.push(["aus Zusatz "+r.z,"m"]);r.hints=h});
 if(typeof pkX==="function")pkX(P).forEach(e=>rows.push({k:pkXKey(e),pos:"+",name:pkXName(e),a:e.a||"",u:e.u||"Stk",z:null,l55:false,items:[],extra:e,soll:0,mit:+e.n||0,fz:0,fl:0,nf:0,miss:0,open:0,zn:{},alt:[],ck:"+",hints:[["zusätzlich (nicht im "+(e.z?"Zusatz "+e.z:"Packschein")+")"+(e.why?" – "+e.why:""),"g"]]}));
 return rows}
const pkDrAltName=a=>{const k=a.a?pkKat({a:a.a}):null;return (k&&k.name)||a.t||""};
/* Stand (Kopf) und Abweichungen (Kasten) */
function pkDrHead(P){const H=pkH(P),g=pkProg(P),L=[];
 L.push(g.fin?{ok:1,t:"Hergerichtet am "+fmt(H.fin.t)+" von "+nmA(H.fin,"by")}:{ok:0,t:"Stand: "+g.d+" von "+g.n+" Positionen hergerichtet – noch nicht abgeschlossen"});
 (P.zus||[]).forEach(z=>{const f=pkZFin(P,z),zg=pkZProg(P,z.ps);L.push(f?{ok:1,t:"Zusatz "+z.ps+" hergerichtet am "+fmt(f.t)+" von "+nmA(f,"by")}:{ok:0,t:"Zusatz "+z.ps+": "+zg.d+" von "+zg.n+" hergerichtet – herrichten "+pkWd(pkZDay(P,z))})});
 return L}
function pkDrDev(rows){const D=[],O=[];rows.forEach(r=>{const u=pkDrU(r);
  if(r.miss)D.push(r.name+": fehlt "+pkDrQ(r.miss,u)+(r.mit?" ("+pkDrQ(r.mit,u)+" mitgegeben)":" (nicht mitgegeben)"));
  if(r.over)D.push(r.name+": "+pkDrQ(r.over,u)+" mehr als im Packschein ("+pkDrQ(r.mit,u)+" mitgegeben)");
  if(r.nb)D.push(r.name+": "+pkDrQ(r.nb,u)+" nicht gebraucht"+(r.nbw&&r.nbw.length?" ("+r.nbw.join(", ")+")":""));
  r.alt.forEach(a=>D.push("Ersatz für "+r.name+": "+pkDrQ(+a.n||0,u)+" "+pkDrAltName(a)));
  if(r.fl)D.push(r.name+": "+pkDrQ(r.fl,u)+" aus dem Lager statt Fremdmiete");
  if(r.open)O.push(r.name+" ("+pkDrQ(r.open,u)+")");
  if(r.extra)D.push("Zusätzlich mitgegeben: "+pkDrQ(r.mit,u)+" "+r.name+(r.extra.why?" ("+r.extra.why+")":""))});return{D,O}}
/* ---------- PDF ---------- */
async function pkDrPdf(P){await wbLoadPdf();const {PDFDocument,StandardFonts,rgb}=PDFLib,doc=await PDFDocument.create(),F=await doc.embedFont(StandardFonts.Helvetica),B=await doc.embedFont(StandardFonts.HelveticaBold);
 const W=595.28,HP=841.89,ML=34,MR=34,MT=34,MB=44,CW=W-ML-MR;
 const NAVY=rgb(.067,.29,.592),INK=rgb(.09,.13,.18),GREY=rgb(.36,.41,.47),LINE=rgb(.73,.76,.83),HAIR=rgb(.89,.91,.93),OR=rgb(.6,.3,0),ORL=rgb(.902,.494,.133),ORBG=rgb(1,.945,.89),OKBG=rgb(.89,.953,.914),OK=rgb(.12,.42,.25),TINT=rgb(.933,.953,.98),BLUE=rgb(.067,.29,.592),XBG=rgb(.89,.953,.914),XG=rgb(.12,.42,.25);
 const rows=pkDrRows(P),head=pkDrHead(P),dev=pkDrDev(rows);let pg,y;const pages=[];
 const txt=(s,x,yy,o)=>{o=o||{};pg.drawText(wbTx(s),{x,y:yy,size:o.size||9,font:o.bold?B:F,color:o.color||INK})};
 const tw=(s,f,z)=>f.widthOfTextAtSize(wbTx(s),z);
 const wrap=(s,f,z,w)=>{const out=[];let cur="";wbTx(s).split(" ").forEach(word=>{const t=cur?cur+" "+word:word;if(f.widthOfTextAtSize(t,z)<=w){cur=t;return}if(cur)out.push(cur);cur=word;
   while(cur.length>1&&f.widthOfTextAtSize(cur,z)>w){let i=cur.length;while(i>1&&f.widthOfTextAtSize(cur.slice(0,i),z)>w)i--;out.push(cur.slice(0,i));cur=cur.slice(i)}});out.push(cur);return out};
 const C=[{w:18},{w:40,t:"Pos."},{w:66,t:"Laut Packschein",r:1},{w:62,t:"Mitgegeben",r:1},{w:0,t:"Artikel"},{w:52,t:"Art.-Nr."}];C[4].w=CW-C.reduce((a,c)=>a+c.w,0);
 let cx=ML;C.forEach(c=>{c.x=cx;cx+=c.w});
 const thead=()=>{C.forEach(c=>{if(!c.t)return;const s=c.t;txt(s,c.r?c.x+c.w-6-tw(s,B,7.5):c.x+4,y-9,{size:7.5,bold:true,color:GREY})});y-=13;pg.drawLine({start:{x:ML,y},end:{x:ML+CW,y},thickness:.8,color:LINE});y-=1};
 const newPage=(tab)=>{pg=doc.addPage([W,HP]);pages.push(pg);y=HP-MT;if(pages.length>1){txt("Packliste "+(P.ev||"")+" · Auftrag "+(P.ord||"–")+" (Fortsetzung)",ML,y-8,{size:8.5,bold:true,color:NAVY});y-=18}if(tab)thead()};
 const need=(h,tab)=>{if(y-h<MB)newPage(tab)};
 newPage(false);
 txt("THE POWER COMPANY · LAGER",ML,y-8,{size:7.5,bold:true,color:NAVY});
 const pr="Gedruckt "+fmt(Date.now()),pr2="von "+meName();txt(pr,W-MR-tw(pr,F,8.5),y-9,{size:8.5,color:GREY});txt(pr2,W-MR-tw(pr2,F,8.5),y-20,{size:8.5,color:GREY});
 const tl=wrap("Packliste – "+(P.ev||"Ohne Veranstaltung"),B,17,CW-130);tl.forEach((l,i)=>txt(l,ML,y-28-i*20,{size:17,bold:true}));y-=34+(tl.length-1)*20;
 pg.drawLine({start:{x:ML,y},end:{x:W-MR,y},thickness:1.6,color:NAVY});y-=14;
 const zs=(P.zus||[]).map(z=>z.ps),kv=[["Auftrag",P.ord||"–","Projektleiter",shortName(P.pl)||"–"],["Packschein",(P.ps||"–")+(zs.length?" + Zusatz "+zs.join(", "):""),"Dispo",pkWd(P.db)+" – "+pkWd(P.de)+" "+new Date(P.de||P.db||Date.now()).getFullYear()]];
 kv.forEach(r=>{txt(r[0],ML,y-8,{size:8.5,color:GREY});txt(r[1],ML+62,y-8,{size:8.5,bold:true});txt(r[2],ML+CW/2,y-8,{size:8.5,color:GREY});txt(r[3],ML+CW/2+68,y-8,{size:8.5,bold:true});y-=13});y-=6;
 head.forEach(s=>{const L=wrap((s.ok?"ok  ":"")+s.t,B,8.5,CW-16),h=L.length*11+8;pg.drawRectangle({x:ML,y:y-h,width:CW,height:h,color:s.ok?OKBG:TINT});L.forEach((l,i)=>txt(l,ML+8,y-11-i*11,{size:8.5,bold:true,color:s.ok?OK:NAVY}));y-=h+4});y-=4;
 /* Kasten zeilenweise (darf über Seiten gehen) */
 const box=(title,lines,col,bg)=>{if(!lines.length)return;const L=[].concat(...lines.map(l=>wrap("•  "+l,F,8.5,CW-22))),tc=col===ORL?OR:col;
  const seg=(h,top,bot)=>{pg.drawRectangle({x:ML,y:y-h,width:CW,height:h,color:bg});pg.drawLine({start:{x:ML,y},end:{x:ML,y:y-h},thickness:1.2,color:col});pg.drawLine({start:{x:ML+CW,y},end:{x:ML+CW,y:y-h},thickness:1.2,color:col});
   if(top)pg.drawLine({start:{x:ML,y},end:{x:ML+CW,y},thickness:1.2,color:col});if(bot)pg.drawLine({start:{x:ML,y:y-h},end:{x:ML+CW,y:y-h},thickness:1.2,color:col})};
  need(40,false);seg(20,true,false);txt(title,ML+9,y-13,{size:9.5,bold:true,color:tc});y-=20;
  L.forEach((l,i)=>{const last=i===L.length-1,h=last?17:11.5;if(y-h<MB){pg.drawLine({start:{x:ML,y},end:{x:ML+CW,y},thickness:1.2,color:col});newPage(false);seg(0.01,true,false)}
   seg(h,false,last);txt(l,ML+9,y-8.5,{size:8.5});y-=h});y-=8};
 {const hi=pkHiList(P);if(hi.length)box("Info zum Herrichten",[].concat(...hi.map(e=>String(e.txt).split(/\r?\n/).map(l=>l.trim()).filter(Boolean).map((l,i)=>(i===0&&e.z?"Zusatz "+e.z+": ":"")+l))),ORL,ORBG)}
 box("Abweichungen zum Packschein ("+dev.D.length+")",dev.D.length?dev.D:["Keine – alles wie im Packschein."],ORL,ORBG);
 box("Noch nicht hergerichtet ("+dev.O.length+")",dev.O,NAVY,TINT);
 y-=2;need(60,false);thead();
 const line=(cells,o)=>{const nameL=wrap(cells.name,o.l55?F:B,8.5,C[4].w-8),hl=[].concat(...(cells.hints||[]).map(h=>wrap(h[0],F,7.5,C[4].w-8).map(t=>[t,h[1]]))),h=Math.max(1,nameL.length)*10.5+hl.length*9.5+6;
  need(h,true);if(o.bg)pg.drawRectangle({x:ML,y:y-h,width:CW,height:h,color:o.bg});
  const ck=cells.ck;if(ck)txt(ck==="ok"?"ok":ck,C[0].x+3,y-10.5,{size:ck==="55"?7:8,bold:true,color:ck==="ok"?OK:ck==="+"?BLUE:ck==="55"?GREY:OR});
  txt(cells.pos,C[1].x+4,y-10.5,{size:8,color:GREY});
  [[2,cells.soll],[3,cells.mit]].forEach(([i,s])=>txt(s,C[i].x+C[i].w-6-tw(s,F,8.5),y-10.5,{size:8.5}));
  nameL.forEach((l,i)=>txt(l,C[4].x+4,y-10.5-i*10.5,{size:8.5,bold:!o.l55,color:o.l55?GREY:INK}));
  hl.forEach((l,i)=>txt(l[0],C[4].x+4,y-10.5-nameL.length*10.5-i*9.5+1,{size:7.5,color:l[1]==="o"?OR:l[1]==="b"?BLUE:l[1]==="g"?XG:GREY}));
  txt(cells.a||"",C[5].x+4,y-10.5,{size:8,color:GREY});y-=h;pg.drawLine({start:{x:ML,y},end:{x:ML+CW,y},thickness:.5,color:HAIR})};
 rows.forEach(r=>{const u=pkDrU(r);
  if(r.extra)return line({ck:"+",pos:"",soll:"–",mit:pkDrQ(r.mit,u),name:r.name,a:r.a,hints:r.hints},{bg:XBG});
  line({ck:r.ck,pos:r.pos,soll:pkDrQ(r.soll,u),mit:r.l55?"–":r.open&&!r.mit?"–":pkDrQ(r.mit,u),name:r.name,a:r.a,hints:r.hints},{bg:r.ck==="!"?ORBG:null,l55:r.l55});
  r.alt.forEach(a=>line({ck:"+",pos:"",soll:"–",mit:pkDrQ(+a.n||0,u),name:pkDrAltName(a),a:a.a||"",hints:[["Ersatz für Pos. "+r.pos,"b"]]},{bg:TINT}))});
 const foot="TPC Lager App · Packliste "+(P.ps||P.id);
 pages.forEach((p,i)=>{p.drawText(wbTx(foot),{x:ML,y:24,size:7.5,font:F,color:GREY});const s="Seite "+(i+1)+" von "+pages.length;p.drawText(s,{x:W-MR-F.widthOfTextAtSize(s,7.5),y:24,size:7.5,font:F,color:GREY})});
 return doc.save()}
/* ---------- Mail-Text an den Monteur: ganze Liste ---------- */
function pkDrMail(P){const rows=pkDrRows(P),dev=pkDrDev(rows),H=pkH(P),g=pkProg(P),me1=String(meName()||"");
 const ag={},order=[],add=(key,name,u,n,o)=>{if(!ag[key]){ag[key]={name,u,n:0,fz:0,alt:0};order.push(key)}const e=ag[key];e.n+=n;e.fz+=(o&&o.fz)||0;e.alt+=(o&&o.alt)||0};
 rows.forEach(r=>{if(r.l55)return;const u=pkDrU(r);if(r.extra){add(r.k+"|"+u,r.name,u,r.mit,{});ag[r.k+"|"+u].x=(ag[r.k+"|"+u].x||0)+r.mit;return}if(r.mit+r.fz)add(r.k+"|"+u,r.name,u,r.mit+r.fz,{fz:r.fz});
  r.alt.forEach(a=>{const ak=(a.a?abgKey(artCode(a.a),pkDrAltName(a)):"n:"+pkDrAltName(a))+"|"+u;add(ak,pkDrAltName(a),u,+a.n||0,{alt:+a.n||0})})});
 const L=order.map(k=>{const e=ag[k],x=[];if(e.alt)x.push("inkl. "+pkDrQ(e.alt,e.u)+" Ersatz");if(e.fz)x.push("davon "+pkDrQ(e.fz,e.u)+" Fremdmiete");if(e.x)x.push((e.x===e.n?"":"davon "+pkDrQ(e.x,e.u)+" ")+"zusätzlich, nicht im Packschein");return "- "+pkDrQ(e.n,e.u)+" "+e.name+(x.length?" ("+x.join(", ")+")":"")});
 const l55=rows.filter(r=>r.l55).map(r=>"- "+pkDrQ(r.soll,pkDrU(r))+" "+r.name);
 const st=g.fin?"hergerichtet am "+fmt(H.fin.t).slice(0,10):"Stand "+fmt(Date.now()).slice(0,10)+" ("+g.d+" von "+g.n+" Positionen hergerichtet)";
 const hi=pkHiList(P);
 return "Hallo,\n\nanbei die Packliste für "+(P.ev||"")+" (Auftrag "+(P.ord||"–")+"), "+st+".\n\n"+
  (hi.length?"Info:\n"+hi.map(e=>"- "+(e.z?"Zusatz "+e.z+": ":"")+String(e.txt).trim().replace(/\r?\n/g,"\n  ")).join("\n")+"\n\n":"")+
  (dev.D.length?"Anders als im Packschein:\n"+dev.D.map(d=>"- "+d).join("\n"):"Alles wie im Packschein.")+"\n\n"+
  (dev.O.length?"Noch nicht hergerichtet:\n"+dev.O.map(d=>"- "+d).join("\n")+"\n\n":"")+
  "Du bekommst:\n"+(L.length?L.join("\n"):"- (noch nichts hergerichtet)")+
  (l55.length?"\n\nLager 55 (bitte selbst mitnehmen):\n"+l55.join("\n"):"")+"\n\nLG\n"+me1}
/* ---------- Dialog ---------- */
const pkDrFn=P=>"Packliste_"+String(P.ev||P.ord||"Auftrag").replace(/[^A-Za-z0-9äöüÄÖÜß]+/g,"_").replace(/^_|_$/g,"")+".pdf";
async function pkDrSave(blob,fn){const dl=typeof claude!=="undefined"&&claude.use?await claude.use("downloads"):null;
 if(dl){await dl.save({filename:fn,data:blob});toast("PDF gespeichert: "+fn,1);return}
 const u=URL.createObjectURL(blob),a=document.createElement("a");a.href=u;a.download=fn;a.rel="noopener";document.body.appendChild(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(u),60000);toast("PDF gespeichert: "+fn,1)}
function pkDrDlg(P){const mob=wbMobile(),fn=pkDrFn(P),o=document.createElement("div");o.className="ov";let file=null,err=null;
 const ready=pkDrPdf(P).then(b=>{file=new File([new Blob([b],{type:"application/pdf"})],fn,{type:"application/pdf"});return file}).catch(e=>{err=e;console.warn("Packliste PDF",e);throw e});ready.catch(()=>{});
 const body=pkDrMail(P),subj="Packliste "+(P.ord||"")+" – "+(P.ev||"");
 o.innerHTML='<div class="card pkdrd"><b style="font-size:17px">Packliste als PDF</b><div class="mute">'+esc(P.ev||"")+' · Auftrag '+esc(P.ord||"–")+'</div>'+
  '<div class="pkdrf" id="pkdrf">PDF wird erstellt …</div>'+
  '<div class="pkdrb"><button class="btn" id="pkdrp" type="button">Drucken</button><button class="btn ghost" id="pkdrs" type="button">Als PDF speichern</button></div>'+
  '<b class="pkdrh">An den Monteur schicken</b><textarea id="pkdrt" style="min-height:200px"></textarea>'+
  '<div class="pkdrb">'+(navigator.canShare?'<button class="btn" id="pkdrsh" type="button">Teilen (PDF + Text)</button>':'')+'<a class="btn ghost" id="pkdrm" href="#">Mail öffnen</a><button class="btn ghost" id="pkdrc" type="button">Text kopieren</button></div>'+
  '<small class="mute" id="pkdrhint">'+(mob?'„Drucken“ öffnet das Teilen-Menü. „Als PDF speichern“ legt die Datei bei den Downloads ab.':'„Mail öffnen“ übernimmt nur den Text – die PDF über „Als PDF speichern“ anhängen.')+'</small>'+
  '<button class="btn ghost" id="pkdrx" type="button" style="margin-top:6px">Schließen</button></div>';
 document.body.appendChild(o);const g=id=>o.querySelector("#"+id),ta=g("pkdrt");ta.value=body;
 const upd=()=>{g("pkdrm").href="mailto:?subject="+encodeURIComponent(subj)+"&body="+encodeURIComponent(ta.value)};upd();ta.oninput=upd;
 ready.then(()=>{g("pkdrf").textContent="PDF: "+fn}).catch(()=>{g("pkdrf").textContent="PDF konnte nicht erstellt werden – bitte Internetverbindung prüfen.";g("pkdrf").classList.add("bad")});
 const share=async(withText)=>{let f;try{f=file||await ready}catch(e){return errBox("Die PDF konnte nicht erstellt werden. Bitte Internetverbindung prüfen und nochmal versuchen.")}
  const d=withText?{files:[f],title:subj,text:ta.value}:{files:[f],title:subj};
  if(navigator.canShare&&navigator.canShare({files:[f]})){try{await navigator.share(d);return true}catch(e){if(e&&e.name==="AbortError")return true;console.warn("Teilen ging nicht",e)}}
  await pkDrSave(f,fn);return false};
 g("pkdrp").onclick=async()=>{if(mob)return share(false);
  const w=window.open("","_blank");let f;try{f=file||await ready}catch(e){if(w)w.close();return errBox("Die PDF konnte nicht erstellt werden. Bitte Internetverbindung prüfen und nochmal versuchen.")}
  const u=URL.createObjectURL(f);if(w){w.location.href=u}else await pkDrSave(f,fn)};
 if(g("pkdrs"))g("pkdrs").onclick=async()=>{try{await pkDrSave(file||await ready,fn)}catch(e){errBox("Die PDF konnte nicht erstellt werden. Bitte Internetverbindung prüfen und nochmal versuchen.")}};
 if(g("pkdrsh"))g("pkdrsh").onclick=()=>share(true);
 g("pkdrc").onclick=async()=>{try{await navigator.clipboard.writeText(subj+"\n\n"+ta.value);toast("Text kopiert",1)}catch(e){ta.select();toast("Bitte Text markieren und kopieren.")}};
 g("pkdrx").onclick=()=>o.remove()}
