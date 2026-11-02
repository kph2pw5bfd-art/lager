/* ===== Artikelliste als Excel herunterladen + Vorschau vor dem Import (ab 1.103) =====
   Export im Format des früheren Vordrucks (Blätter „Artikel“, „Zubehör“, „Anleitung“) mit ALLEN aktuellen Artikeln in der
   Reihenfolge der App, dazu Spalte „Lager 55“. Der Import liest „Lager 55“ mit (fehlt die Spalte, bleibt das Häkchen wie es war)
   und zeigt vor dem Speichern, was neu ist, was sich ändert und was wegfällt. Artikel ohne Nummer behalten ihren Schlüssel
   (gleiche Gruppe + gleicher Name), damit sie nicht als „weg + neu“ zählen. */
const AX_CK="✔",AX_CAT=a=>Math.min(2,Math.max(0,Math.floor((+a.o||0)/100000)));
function axSorted(){const L=(rkat.length?rkat:rKat()).filter(a=>a&&a.name).slice().sort((a,b)=>alRow(a)-alRow(b)||String(a.name).localeCompare(b.name,"de",{numeric:true})),G=[];
 L.forEach(a=>{let g=G.find(x=>x.g===a.g);if(!g)G.push(g={g:a.g,subs:[]});let u=g.subs.find(x=>x.u===(a.u||""));if(!u)g.subs.push(u={u:a.u||"",items:[]});u.items.push(a)});
 return G.flatMap(g=>g.subs.flatMap(u=>u.items))}
const axNr=a=>a.hasNr===false||/^X\d+_*$/.test(String(a.nr||""))?"":String(a.nr||"");
async function artXlExport(){if(typeof ExcelJS==="undefined")return toast("Excel-Bibliothek nicht geladen. Bitte die Seite neu laden.");
 try{const wb=new ExcelJS.Workbook(),ws=wb.addWorksheet("Artikel"),L=axSorted();
  ws.columns=[{header:"Artikelgruppe",width:20},{header:"Untergruppe",width:18},{header:"Artikelnummer",width:15},{header:"Artikelname",width:36},{header:"Mit ID",width:10},{header:"Mit Zubehör",width:13},{header:"A – oft",width:11},{header:"B – normal",width:11},{header:"C – selten",width:11},{header:"Lager 55",width:11}];
  const hd=r=>r.eachCell(c=>{c.font={bold:true,color:{argb:"FFFFFFFF"}};c.fill={type:"pattern",pattern:"solid",fgColor:{argb:"FF1F2A44"}}});hd(ws.getRow(1));
  L.forEach(a=>{const c=AX_CAT(a),ck=v=>v?AX_CK:"";ws.addRow([a.g||"",a.u||"",axNr(a),a.name,ck(a.id),ck(a.zub),ck(c===0),ck(c===1),ck(c===2),ck(a.l55)])});
  ws.views=[{state:"frozen",ySplit:1}];
  try{ws.dataValidations.add("E2:J3000",{type:"list",allowBlank:true,formulae:['"'+AX_CK+'"'],showErrorMessage:true,errorTitle:"Ungültig",error:"Bitte nur ✔ auswählen oder leer lassen."})}catch(e){}
  const zs=wb.addWorksheet("Zubehör");zs.columns=[{header:"Zubehör",width:28}];hd(zs.getRow(1));rZub().forEach(z=>zs.addRow([z]));
  const an=wb.addWorksheet("Anleitung");an.columns=[{header:"So erweiterst du die Artikelliste:",width:100}];an.getRow(1).font={bold:true};
  ["• Diese Datei enthält alle Artikel, die gerade in der App sind (Stand "+new Date().toLocaleDateString("de-AT")+"), in derselben Reihenfolge wie in der App.",
   "• Neue Artikel einfach als neue Zeile dazuschreiben – an der Stelle, wo sie in der App stehen sollen.",
   "• Artikelgruppe = große Kachel (z. B. Kabel). Untergruppe = zweite Ebene (z. B. 16A), sonst leer lassen.",
   "• Artikelnummer: so wie sie im Barcode steht (vor dem Bindestrich). Ohne Nummer erscheint der Artikel nur im Retourschein, nicht beim Scannen.",
   "• Kästchen „Mit ID“ / „Mit Zubehör“ / „A – oft“ / „B – normal“ / „C – selten“ / „Lager 55“: ✔ = Ja, leer = Nein. Ohne A/B/C zählt ein Artikel als B.",
   "• „Lager 55“ = holt der LKW-Fahrer oder Monteur selbst vom Lager 55.",
   "• Zubehör (Haken, Klemmen, Sicherheitsseil …) steht im Blatt „Zubehör“.",
   "• Zeile löschen = Artikel fällt beim Import weg (bleibt 30 Tage im Papierkorb).",
   "• Zurückspielen: App → App-Verwaltung → „Artikelliste importieren“ → diese Datei wählen (als .xlsx gespeichert). Vor dem Speichern zeigt die App, was neu ist, was sich ändert und was wegfällt."].forEach(t=>an.addRow([t]));
  const buf=await wb.xlsx.writeBuffer(),name="Artikelliste_"+new Date().toISOString().slice(0,10)+".xlsx";
  await DLX.save({filename:name,data:new Blob([buf],{type:"application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"})});toast(L.length+" Artikel exportiert",1)}
 catch(e){console.error(e);errBox("Excel konnte nicht erstellt werden.")}}
/* Artikel ohne Nummer: vorhandenen Schlüssel behalten (gleiche Gruppe + Name) */
function artXlKeep(g,name,used){const n=String(name).trim().toLowerCase(),a=rkat.find(x=>(x.hasNr===false||/^X\d+_*$/.test(String(x._k)))&&String(x.name).trim().toLowerCase()===n&&String(x.g)===String(g)&&!(used&&used[x._k]));return a?a._k:""}
const artXlL55=k=>!!((rkat.find(x=>x._k===k)||{}).l55);
/* Vorschau: was ändert sich? → Promise<true> = importieren */
function artImpPreview(out,zl){return new Promise(res=>{const old={};rkat.forEach(a=>old[a._k]=a);const ks=Object.keys(out),neu=[],weg=[],chg=[];
 const lab=a=>a.name+(axNr(a)?" ("+axNr(a)+")":""),cat=["A","B","C"];
 ks.forEach(k=>{const n=out[k],o=old[k];if(!o)return neu.push(lab(n));const d=[];
  if(String(o.name)!==String(n.name))d.push("Name: "+o.name+" → "+n.name);if(String(o.g||"")!==String(n.g||"")||String(o.u||"")!==String(n.u||""))d.push("Gruppe: "+[o.g,o.u].filter(Boolean).join(" · ")+" → "+[n.g,n.u].filter(Boolean).join(" · "));
  if(axNr(o)!==axNr(n))d.push("Nummer: "+(axNr(o)||"–")+" → "+(axNr(n)||"–"));if(!!o.id!==!!n.id)d.push(n.id?"jetzt mit ID":"ohne ID");if(!!o.zub!==!!n.zub)d.push(n.zub?"jetzt mit Zubehör":"ohne Zubehör");
  if(!!o.l55!==!!n.l55)d.push(n.l55?"jetzt Lager 55":"nicht mehr Lager 55");if(AX_CAT(o)!==AX_CAT(n))d.push(cat[AX_CAT(o)]+" → "+cat[AX_CAT(n)]);
  if(d.length)chg.push(lab(n)+": "+d.join(", "))});
 Object.keys(old).forEach(k=>{if(!out[k]&&!old[k]._ex)weg.push(lab(old[k]))});
 const zo=rZub(),zn=zl.length?zl:zo,zd=zn.filter(z=>!zo.includes(z)).map(z=>"+ "+z).concat(zo.filter(z=>!zn.includes(z)).map(z=>"− "+z));
 const sec=(t,L,cls)=>L.length?'<details class="axd"'+(L.length<=8?' open':'')+'><summary class="'+cls+'">'+t+' ('+L.length+')</summary><ul>'+L.map(x=>'<li>'+esc(x)+'</li>').join("")+'</ul></details>':'';
 const o=document.createElement("div");o.className="ov";
 o.innerHTML='<div class="card" style="width:100%;max-width:480px;margin:0;max-height:92vh;overflow:auto"><b style="font-size:17px">Artikelliste importieren?</b>'+
  '<p style="margin:8px 0"><b>'+ks.length+' Artikel</b> in der Datei · <span class="axn">'+neu.length+' neu</span> · <span class="axc">'+chg.length+' geändert</span> · <span class="axw">'+weg.length+' fallen weg</span></p>'+
  sec("Fallen weg",weg,"axw")+sec("Neu",neu,"axn")+sec("Geändert",chg,"axc")+sec("Zubehör geändert",zd,"axc")+
  (!neu.length&&!chg.length&&!weg.length&&!zd.length?'<p class="mute">Keine Änderungen an den Artikeln (nur die Reihenfolge wird übernommen).</p>':'')+
  (weg.length?'<p class="mute" style="font-size:13px">Weggefallene Artikel liegen danach 30 Tage im Papierkorb.</p>':'')+
  '<div class="row" style="margin-top:12px"><button class="btn ghost" id="axx" type="button">Abbrechen</button><button class="btn" id="axok" type="button">Importieren</button></div></div>';
 document.body.appendChild(o);o.querySelector("#axx").onclick=()=>{o.remove();res(false)};o.querySelector("#axok").onclick=()=>{o.remove();res(true)}})}
