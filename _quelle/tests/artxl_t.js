/* Test 1.103: Artikelliste als Excel herunterladen, am PC ändern, wieder importieren (Vorschau, Lager 55, Artikel ohne Nummer) */
const {chromium}=require("playwright");const fs=require("fs");const S=(process.env.SP||"/tmp")+"/";
const seed=[{col:"rkat",id:"1098",data:{nr:"1098",hasNr:true,g:"Kabel",u:"32A",name:"32A Kabel 50m",o:1}},{col:"rkat",id:"1097",data:{nr:"1097",hasNr:true,g:"Kabel",u:"32A",name:"32A Kabel 25m",o:100002}},
 {col:"rkat",id:"X7",data:{nr:"X7",hasNr:false,g:"Kabel",u:"32A",name:"Kabelbrücke",o:100003}},{col:"rkat",id:"1031",data:{nr:"1031",hasNr:true,g:"Verteiler",u:"32A",name:"Verteiler 32A Black",id:true,l55:true,o:200004}},
 {col:"rkat",id:"1040",data:{nr:"1040",hasNr:true,g:"Verteiler",u:"63A",name:"Verteiler 63A Indu",zub:true,o:100005}},{col:"rkat",id:"_zubehoer",data:{list:["C-Haken","Halbschelle"]}}];
/* ExcelJS-Attrappe: schreibt/liest JSON statt xlsx */
const XL=`window.ExcelJS={Workbook:class{constructor(){this.worksheets=[];this.xlsx={writeBuffer:async()=>new TextEncoder().encode(JSON.stringify(this.worksheets.map(w=>({name:w.name,rows:w._rows,views:w.views,dv:w._dv})))),
 load:async b=>{JSON.parse(new TextDecoder().decode(b)).forEach(s=>{const w=this.addWorksheet(s.name);w._rows=s.rows})}}}
 addWorksheet(n){const w={name:n,_rows:[],_dv:[],views:null,dataValidations:{add:(r,v)=>w._dv.push(r)},
  set columns(c){w._rows[0]=c.map(x=>x.header)},
  getRow(i){const r=w._rows[i-1]||(w._rows[i-1]=[]);return{eachCell:f=>r.forEach((v,k)=>f({text:v==null?"":String(v),set font(x){},set fill(x){}},k+1)),getCell:k=>({text:r[k-1]==null?"":String(r[k-1])}),set font(x){}}},
  addRow(a){w._rows.push(a)},eachRow(f){w._rows.forEach((r,i)=>f(w.getRow(i+1),i+1))}};this.worksheets.push(w);return w}
 getWorksheet(n){return this.worksheets.find(w=>w.name===n)}}};`;
let bad=0;const ok=(c,m,x)=>{console.log((c?"OK   ":"FEHLER")+" "+m+(x!==undefined?": "+x:""));if(!c)bad++};
(async()=>{const b=await chromium.launch();const ctx=await b.newContext({viewport:{width:390,height:844},acceptDownloads:true});
 await ctx.addInitScript(XL);const p=await ctx.newPage();const errs=[];p.on("pageerror",e=>errs.push(e.message));
 const fk=fs.readFileSync(S+"fakesb.js","utf8").replace("const T={docs:[]","const T={docs:"+JSON.stringify(seed));
 await ctx.route("**/*",r=>{const u=r.request().url();if(u.startsWith("https://app.test/"))return r.fulfill({body:fs.readFileSync("/home/claude/gh/index.html"),contentType:"text/html"});if(u.includes("supabase-js"))return r.fulfill({body:fk,contentType:"text/javascript"});return r.fulfill({status:404,body:""})});
 await p.goto("https://app.test/");await p.waitForTimeout(900);await p.mouse.click(195,420);await p.waitForTimeout(500);
 ok(await p.evaluate(()=>APPV)==="1.103","Version 1.103");
 await p.evaluate(()=>go("appv"));await p.waitForTimeout(400);
 ok(!/Excel-Vorlage/.test(await p.textContent("#app")),"leere Vorlage ist weg");
 const [dl]=await Promise.all([p.waitForEvent("download"),p.click("#rexp")]);ok(/^Artikelliste_\d{4}-\d\d-\d\d\.xlsx$/.test(dl.suggestedFilename()),"Dateiname",dl.suggestedFilename());
 const fp=S+"ax.json";await dl.saveAs(fp);const W=JSON.parse(fs.readFileSync(fp,"utf8")),A=W.find(s=>s.name==="Artikel").rows;
 console.log("Export:");A.forEach(r=>console.log("  "+r.join(" | ")));
 ok(A[0].join("|")==="Artikelgruppe|Untergruppe|Artikelnummer|Artikelname|Mit ID|Mit Zubehör|A – oft|B – normal|C – selten|Lager 55","Spalten wie Vordruck + Lager 55");
 ok(A.slice(1).map(r=>r[3]).join(",")==="32A Kabel 50m,32A Kabel 25m,Kabelbrücke,Verteiler 32A Black,Verteiler 63A Indu","Reihenfolge wie in der App");
 const bl=A.find(r=>r[3]==="Verteiler 32A Black");ok(bl[4]==="✔"&&bl[8]==="✔"&&bl[9]==="✔","ID, C und Lager 55 angehakt");
 ok(A.find(r=>r[3]==="Kabelbrücke")[2]==="","ohne Nummer: Nummer leer");ok(A.find(r=>r[3]==="32A Kabel 50m")[6]==="✔","A angehakt");
 ok(W.find(s=>s.name==="Zubehör").rows.slice(1).map(r=>r[0]).join(",")==="C-Haken,Halbschelle","Zubehör-Blatt");ok(!!W.find(s=>s.name==="Anleitung"),"Anleitung dabei");
 ok(W.find(s=>s.name==="Artikel").views&&W.find(s=>s.name==="Artikel").dv.length===1,"Kopfzeile fixiert + ✔-Auswahl");
 /* am PC ändern: neue Zeile nach 25m, Name ändern, 63A löschen, Lager 55 bei 50m */
 const R=A.map(r=>r.slice());R.find(r=>r[3]==="32A Kabel 50m")[9]="✔";R.find(r=>r[3]==="Verteiler 32A Black")[3]="Verteiler 32A Black (neu)";
 const i25=R.findIndex(r=>r[3]==="32A Kabel 25m");R.splice(i25+1,0,["Kabel","32A","1099","32A Kabel 10m","","","","✔","",""]);R.splice(R.findIndex(r=>r[3]==="Verteiler 63A Indu"),1);
 W.find(s=>s.name==="Artikel").rows=R;W.find(s=>s.name==="Zubehör").rows.push(["Sicherheitsseil"]);fs.writeFileSync(S+"ax_neu.xlsx",JSON.stringify(W));
 await p.setInputFiles("#rimpf",S+"ax_neu.xlsx");await p.waitForTimeout(500);
 const pv=(await p.textContent(".ov .card")).replace(/\s+/g," ");console.log("Vorschau:",pv);
 ok(/5 Artikel in der Datei · 1 neu · 2 geändert · 1 fallen weg/.test(pv),"Vorschau-Zahlen");
 ok(/Fallen weg \(1\).*Verteiler 63A Indu \(1040\)/.test(pv),"wegfallender Artikel genannt");
 ok(/32A Kabel 50m \(1098\): jetzt Lager 55/.test(pv)&&/Name: Verteiler 32A Black → Verteiler 32A Black \(neu\)/.test(pv),"Änderungen genannt");
 ok(!/Kabelbrücke/.test(pv),"Artikel ohne Nummer nicht als weg/neu");ok(/\+ Sicherheitsseil/.test(pv),"Zubehör-Änderung");
 await p.click("#axx");await p.waitForTimeout(300);ok(await p.evaluate(()=>__T.docs.filter(d=>d.col==="rkat"&&d.id!=="_zubehoer").length)===5&&await p.evaluate(()=>!!__T.docs.find(d=>d.id==="1040")),"Abbrechen ändert nichts");
 await p.setInputFiles("#rimpf",S+"ax_neu.xlsx");await p.waitForTimeout(500);await p.click("#axok");await p.waitForTimeout(800);
 const K=await p.evaluate(()=>Object.fromEntries(__T.docs.filter(d=>d.col==="rkat").map(d=>[d.id,d.data])));
 ok(!K["1040"]&&!!K["1099"]&&K["1098"].l55===true&&K["1031"].l55===true&&K["1031"].name==="Verteiler 32A Black (neu)","Import übernommen inkl. Lager 55");
 ok(!!K["X7"]&&K["X7"].name==="Kabelbrücke","Artikel ohne Nummer behält seinen Schlüssel");
 ok(K["1099"].o<K["X7"].o&&K["1097"].o<K["1099"].o,"neue Zeile an der richtigen Stelle");
 ok(K["_zubehoer"].list.includes("Sicherheitsseil"),"Zubehör übernommen");
 ok(await p.evaluate(()=>__T.papierkorb.some(r=>r.doc_id==="1040")),"gelöschter Artikel im Papierkorb");
 /* alte Datei ohne Spalte Lager 55: Häkchen bleiben */
 const W2=JSON.parse(JSON.stringify(W));W2.find(s=>s.name==="Artikel").rows=R.map(r=>r.slice(0,9));fs.writeFileSync(S+"ax_alt.xlsx",JSON.stringify(W2));
 await p.setInputFiles("#rimpf",S+"ax_alt.xlsx");await p.waitForTimeout(500);ok(/0 geändert/.test(await p.textContent(".ov .card")),"alte Datei ohne Lager 55: keine Änderung angezeigt");await p.click("#axok");await p.waitForTimeout(600);
 ok(await p.evaluate(()=>__T.docs.find(d=>d.col==="rkat"&&d.id==="1031").data.l55===true),"Lager 55 bleibt erhalten");
 ok(!errs.length,"keine JS-Fehler",errs.join(" | "));
 console.log("FEHLER GESAMT:",bad);await b.close()})();
