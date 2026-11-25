/* ===== 1.190 – Defekte zum Auftrag (Jürgen 25.11.)
   1) Zu prüfen: hat der Auftrag noch offene Defekte → rotes Schild in der Liste, Hinweis im Auftragskonto,
      beim „Geprüft“ roter Kasten mit den Defekten + Knopf „Trotzdem geprüft“ (gewählt: Hinweis + Rückfrage, nicht sperren).
   2) Excel: sind ALLE Defekte des Auftrags erledigt (repariert oder ausgemustert), bekommen Retourschein-Excel der Endretoure
      und Abgleich-Excel ein Blatt „Defekte“: Übersicht + pro Defekt Beschreibung, Ersatzteile, Reparaturzeit, Fotos (Defekt, Reparatur, Ausmustern).
   Zuordnung: gleiche Auftragsnummer (Ziffern, inkl. Verlängerungen) oder beim Zählen im Retourschein des Auftrags gemeldet (d.ret). ===== */
function dfaOrdSet(p,r){const S=new Set(),R=new Set();
 if(p){const root=typeof pkRoot==="function"?pkRoot(p):p;[root].concat(typeof pkVerlKids==="function"?pkVerlKids(root):[]).forEach(x=>{const o=pkDig(x.ord);if(o)S.add(o)});
  (typeof pkRets==="function"?pkRets(root):[]).forEach(x=>R.add(x.id))}
 if(r){const o=pkDig(r.ord);if(o)S.add(o);R.add(r.id)}return{S,R}}
function dfaDefs(p,r){if(!p&&r&&typeof abgPackOf==="function")p=abgPackOf(r.ord);const {S,R}=dfaOrdSet(p,r);if(!S.size&&!R.size)return[];
 return (typeof defs!=="undefined"?defs:[]).filter(d=>d&&!d.del&&((d.ord&&S.has(pkDig(d.ord)))||(d.ret&&R.has(d.ret)))).sort((a,b)=>(a.t||0)-(b.t||0))}
const dfaOpen=L=>L.filter(d=>!d.done);
/* Prüf-Eintrag (id = Packlisten-ID oder "r_<Retourschein-ID>") → Defekte */
function dfaForCheck(id){if(String(id).startsWith("r_")){const r=rets.find(x=>x.id===String(id).slice(2));return r?dfaDefs(null,r):[]}const p=packs.find(x=>x.id===id);return p?dfaDefs(p,null):[]}
function dfaQ(d){return typeof dxQ==="function"?dxQ(d):Math.max(1,parseInt(d.n,10)||1)}
function dfaLine(d){return (dfaQ(d)>1?dfaQ(d)+" × ":"")+(d.art||"Artikel")}
(function(){try{const st=document.createElement("style");st.textContent=
'.dfabox{border:2px solid var(--bad);background:#fbebeb;border-radius:10px;padding:10px 12px;margin:10px 0 4px}.dfabox b{color:var(--bad)}.dfabox ul{margin:6px 0 0;padding-left:18px}.dfabox li{margin:3px 0}.dfabox .lnk{padding:0 0 0 6px}'+
'.dfahint{display:flex;gap:8px;align-items:center;border:2px solid var(--bad);background:#fbebeb;color:var(--bad);border-radius:10px;padding:8px 12px;font-weight:700;margin:0 0 10px}'+
'@media (prefers-color-scheme:dark){:root:not([data-theme="light"]) .dfabox,:root:not([data-theme="light"]) .dfahint{background:#3d1d1d;color:#ffb3aa}:root:not([data-theme="light"]) .dfabox b{color:#ffb3aa}}'+
':root[data-theme="dark"] .dfabox,:root[data-theme="dark"] .dfahint{background:#3d1d1d;color:#ffb3aa}:root[data-theme="dark"] .dfabox b{color:#ffb3aa}';
document.head.appendChild(st)}catch(e){}})();
const dfaTx=n=>n===1?"1 Defekt offen":n+" Defekte offen";
/* Liste „Zu prüfen“: Schild nachtragen */
(function(){const o=abgPrView;abgPrView=function(){o.apply(this,arguments);try{if(abgPrT==="ok")return;const L=abgToCheck(),T=document.querySelectorAll(".abgcard .abgtags");
 L.forEach((x,i)=>{const n=dfaOpen(dfaForCheck(x.id)).length;if(n&&T[i])T[i].insertAdjacentHTML("afterbegin",abgTag(dfaTx(n),"red")+" ")})}catch(e){console.warn(e)}}})();
/* Auftragskonto: Hinweis bei „Wartet auf Prüfung“ */
(function(){const o=pkAbgView;pkAbgView=function(){o.apply(this,arguments);try{const s=document.querySelector(".abgchk");if(!s)return;const p=packs.find(x=>x.id===curPack);const L=p?dfaOpen(dfaDefs(p,null)):[];
 if(L.length)s.insertAdjacentHTML("afterend",'<div class="dfahint" id="dfahint">⚠ '+esc(dfaTx(L.length))+': '+esc(L.map(dfaLine).join(", "))+'</div>')}catch(e){console.warn(e)}}})();
/* „Geprüft“-Fenster: Rückfrage bei offenen Defekten */
(function(){const o=abgCheckDlg;abgCheckDlg=function(id,endT,title){o.apply(this,arguments);try{const L=dfaOpen(dfaForCheck(id));if(!L.length)return;const ov=[...document.querySelectorAll(".ov")].pop(),b=ov&&ov.querySelector("#abgns");if(!b)return;
 const box='<div class="dfabox" id="dfabox"><b>⚠ Zu diesem Auftrag '+(L.length===1?"ist noch 1 Defekt":"sind noch "+L.length+" Defekte")+' offen</b><ul>'+L.map(d=>'<li>'+esc(dfaLine(d))+(d.desc?' – '+esc(d.desc):'')+(d.urg?' <b>(dringend)</b>':'')+'<button class="lnk" type="button" data-dfa="'+esc(d.id)+'">Öffnen ›</button></li>').join("")+'</ul><div style="font-size:13px;margin-top:6px">Die Defekte kommen erst ins Excel, wenn alle erledigt sind.</div></div>';
 (ov.querySelector(".card>.mute")||ov.querySelector(".card>b")).insertAdjacentHTML("afterend",box);b.textContent="Trotzdem geprüft";b.style.background="var(--bad)";
 ov.querySelectorAll("[data-dfa]").forEach(x=>x.onclick=()=>{ov.remove();curDef=x.dataset.dfa;go("defopen")})}catch(e){console.warn(e)}}})();

/* ---------- Excel-Blatt „Defekte“ ---------- */
async function dfaPhoto(key){try{if(typeof pc!=="undefined"&&pc[key])return pc[key];const s=await db.doc("fotos/"+key).get();if(s.exists){const u=s.data().d;if(typeof pc!=="undefined")pc[key]=u;return u}}catch(e){}return null}
function dfaPhotoKeys(d){const K=[],fn=+d.fn||0;if(fn)for(let k=0;k<fn;k++)K.push(["Defekt",d.id+"-"+k]);else if(d.foto)K.push(["Defekt",d.id]);
 for(let k=0;k<(+d.rfn||0);k++)K.push(["Reparatur",d.id+"r-"+k]);const a=d.aus&&+d.aus.fn||0;for(let k=0;k<a;k++)K.push(["Ausmustern",d.id+"-a"+k]);return K}
function dfaEt(d){return (Array.isArray(d.et)?d.et.filter(e=>e&&e.nm):[]).map(e=>{const n=+e.n||0;return (Number.isInteger(n)?n:String(n).replace(".",","))+" "+(e.u||"Stk")+" "+e.nm+(e.tnr?" (TPC "+e.tnr+")":"")+(e.hnr?" (Hersteller "+e.hnr+")":"")})}
function dfaRz(d){const m=typeof rzMin==="function"?rzMin(d):(+d.rz||0);return m?(typeof rzTx==="function"?rzTx(m):m+" Min"):"–"}
/* nur wenn es Defekte gibt UND alle erledigt sind; liefert true, wenn ein Blatt angelegt wurde */
async function dfaXlAdd(wb,L){if(!wb||!L||!L.length||dfaOpen(L).length)return false;
 const NAVY="FF114A97",fill=c=>({type:"pattern",pattern:"solid",fgColor:{argb:c}}),th={style:"thin",color:{argb:"FFD5DBE5"}},bd={top:th,left:th,bottom:th,right:th};
 const ws=wb.addWorksheet("Defekte",{pageSetup:{orientation:"portrait",fitToPage:true,fitToWidth:1,fitToHeight:0}});ws.columns=[{width:24},{width:30},{width:16},{width:30},{width:14},{width:22}];
 const t=ws.getCell("A1");t.value="Defekte zum Auftrag";t.font={size:18,bold:true,color:{argb:NAVY}};
 const tot=L.reduce((a,d)=>a+((typeof rzMin==="function"?rzMin(d):+d.rz||0)),0);
 ws.getCell("A2").value=L.length+(L.length===1?" Meldung":" Meldungen")+" · "+L.reduce((a,d)=>a+dfaQ(d),0)+" Stk · alle erledigt · Reparaturzeit gesamt "+(typeof rzTx==="function"?rzTx(tot):tot+" Min");ws.getCell("A2").font={color:{argb:"FF667385"}};
 let rw=4;const hr=ws.getRow(rw);hr.values=["Artikel","Defekt","Ergebnis","Ersatzteile","Reparaturzeit","Erledigt"];hr.height=22;hr.eachCell(c=>{c.fill=fill(NAVY);c.font={bold:true,color:{argb:"FFFFFFFF"}};c.border=bd;c.alignment={vertical:"middle",horizontal:"center",wrapText:true}});
 L.forEach((d,i)=>{rw++;const r=ws.getRow(rw);r.values=[dfaLine(d)+(d.anr?" ("+d.anr+")":""),d.desc||"–",d.aus?"Ausgemustert":"Repariert",dfaEt(d).join("\n")||"–",d.aus?"–":dfaRz(d),(typeof nmA==="function"?nmA(d,"doneBy"):"")+(d.doneT?", "+fmt(d.doneT).slice(0,10):"")];
  r.eachCell({includeEmpty:true},(c,n)=>{if(n>6)return;c.border=bd;c.alignment={vertical:"top",wrapText:true};if(i%2)c.fill=fill("FFF6F8FB")});r.getCell(1).font={bold:true};if(d.aus)r.getCell(3).font={bold:true,color:{argb:"FFC0392B"}}});
 const kv=(k,v,red)=>{rw++;ws.mergeCells("B"+rw+":F"+rw);const a=ws.getCell("A"+rw),b=ws.getCell("B"+rw);a.value=k;b.value=String(v==null||v===""?"–":v);a.font={bold:true};a.fill=fill("FFEEF2F8");a.border=bd;b.border=bd;b.alignment={wrapText:true,vertical:"top"};if(red)b.font={bold:true,color:{argb:"FFC0392B"}};
  const lines=String(b.value).split("\n").reduce((s,l)=>s+Math.max(1,Math.ceil(l.length/80)),0);if(lines>1)ws.getRow(rw).height=15*lines};
 for(let i=0;i<L.length;i++){const d=L[i];rw+=2;ws.mergeCells("A"+rw+":F"+rw);const h=ws.getCell("A"+rw);h.value=(i+1)+". "+dfaLine(d);h.font={bold:true,size:13,color:{argb:"FFFFFFFF"}};h.fill=fill(NAVY);ws.getRow(rw).height=22;h.alignment={vertical:"middle"};
  kv("Artikelnummer",d.anr);kv("Veranstaltung",(d.ev||"–")+(d.ord?" · Auftrag "+d.ord:""));kv("Defekt",d.desc);kv("Gemeldet",(typeof nmA==="function"?nmA(d,"by"):"")+", "+fmt(d.t)+(d.urg?" · dringend":"")+(d.ret?" · beim Zählen gemeldet":""));
  if(d.fv)kv("Fremdverschulden","Ja"+(d.fvw?" – "+d.fvw:""),true);
  if(d.aus){kv("Ergebnis","Nicht reparierbar – ausgemustert"+(d.aus.n?" ("+d.aus.n+" Stk)":""),true);kv("Grund",d.aus.why);kv("Ausgemustert",(typeof nmA==="function"?nmA(d.aus,"by"):"")+(d.aus.t?", "+fmt(d.aus.t):""))}
  else{kv("Reparatur",d.rep);kv("Ersatzteile",dfaEt(d).join("\n")||"Keine");kv("Reparaturzeit",dfaRz(d));kv("Repariert",(typeof nmA==="function"?nmA(d,"doneBy"):"")+(d.doneT?", "+fmt(d.doneT):""))}
  if(d.fb)kv("Werkstatt",d.fb);
  const K=dfaPhotoKeys(d);if(K.length){rw++;let col=0,rowH=0,start=rw+1;for(const [lab,key] of K){const u=await dfaPhoto(key);if(!u)continue;const im=new Image();im.src=u;try{await im.decode()}catch(e){continue}
   const W=230,H=Math.round(im.naturalHeight*W/Math.max(1,im.naturalWidth));if(col>=2){start+=Math.ceil(rowH/20)+2;col=0;rowH=0}
   ws.getCell((col?"D":"A")+start).value="Foto "+lab;ws.getCell((col?"D":"A")+start).font={bold:true,size:10,color:{argb:"FF667385"}};
   ws.addImage(wb.addImage({base64:u,extension:/^data:image\/png/.test(u)?"png":"jpeg"}),{tl:{col:col?3:0,row:start},ext:{width:W,height:H}});rowH=Math.max(rowH,H);col++}
   rw=start+Math.ceil(rowH/20)+1}}
 return true}
/* Retourschein-Excel: nur bei Endretoure (Hook am Ende von retXl über rXlPhotos) */
(function(){const o=rXlPhotos;rXlPhotos=async function(wb,r,ws,last){await o.apply(this,arguments);try{if(r&&r.art==="end")await dfaXlAdd(wb,dfaDefs(null,r))}catch(e){console.warn(e)}}})();
