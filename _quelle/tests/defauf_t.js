/* Test 1.190: Berichte-Karte in der Lager Übersicht; Zu prüfen – offene Defekte zum Auftrag (Schild, Hinweis, Rückfrage);
   Blatt „Defekte“ in Abgleich- und Retourschein-Excel nur, wenn alle Defekte erledigt sind (SP = Ordner mit fakesb.js) */
const {chromium}=require("playwright");const fs=require("fs");const zlib=require("zlib");const S=(process.env.SP||"/tmp")+"/";const J=o=>JSON.stringify(o);
function png(w,h){const raw=Buffer.concat(Array.from({length:h},()=>Buffer.concat([Buffer.from([0]),Buffer.from(Array(w).fill([32,96,192]).flat())])));
 const crc=b=>{let c,t=[];for(let n=0;n<256;n++){c=n;for(let k=0;k<8;k++)c=c&1?0xedb88320^(c>>>1):c>>>1;t[n]=c>>>0}let x=0xffffffff;for(const v of b)x=t[(x^v)&255]^(x>>>8);return (x^0xffffffff)>>>0};
 const ch=(ty,d)=>{const l=Buffer.alloc(4);l.writeUInt32BE(d.length);const td=Buffer.concat([Buffer.from(ty),d]);const c=Buffer.alloc(4);c.writeUInt32BE(crc(td));return Buffer.concat([l,td,c])};
 const ih=Buffer.alloc(13);ih.writeUInt32BE(w,0);ih.writeUInt32BE(h,4);ih[8]=8;ih[9]=2;
 return "data:image/png;base64,"+Buffer.concat([Buffer.from([137,80,78,71,13,10,26,10]),ch("IHDR",ih),ch("IDAT",zlib.deflateSync(raw)),ch("IEND",Buffer.alloc(0))]).toString("base64")}
const IMG=png(8,6),now=Date.now(),day=864e5;
const seed=[
 {col:"pack",id:"A",data:{ord:"260130001",ps:"14402",ev:"Gala Wien",pl:"Max Muster",db:now-9*day,de:now-3*day,pos:[{p:"1",n:4,u:"Stk",t:"Verteiler 63A",a:"1048",f:0}],by:"u1",t:now-10*day}},
 {col:"packh",id:"A",data:{c:1,h_1:{ok:true,by:"u1",t:1},fin:{by:"u1",t:now-9*day}}},
 {col:"retour",id:"rE",data:{ev:"Gala Wien",ord:"260130001",by:"u1",t:now-2*day,closed:true,art:"end",closedT:now-2*day,closedBy:"u1",itemsJson:J({"1048":{nr:"1048",name:"Verteiler 63A",g:"Verteiler",q:4}})}},
 {col:"retour",id:"rT",data:{ev:"Gala Wien",ord:"260130001",by:"u1",t:now-4*day,closed:true,art:"teil",closedT:now-4*day,closedBy:"u1",itemsJson:J({"1048":{nr:"1048",name:"Verteiler 63A",g:"Verteiler",q:1}})}},
 {col:"defekte",id:"d1",data:{by:"u1",t:now-2*day,done:false,art:"Verteiler 63A",anr:"1048",ev:"Gala Wien",ord:"260130001",desc:"FI löst aus",urg:true,n:1,fn:0}},
 {col:"defekte",id:"d2",data:{by:"u1",t:now-2*day,done:true,doneBy:"u1",doneT:now-day,art:"Schuko 20m",anr:"1081",ev:"Gala Wien",ret:"rE",desc:"Kupplung gebrochen",n:2,fn:1,foto:true,rep:"Kupplung getauscht",et:[{n:2,u:"Stk",nm:"Schuko-Kupplung",tnr:"5501"}],rz:45,rfn:1}},
 {col:"defekte",id:"d3",data:{by:"u1",t:now-day,done:false,art:"16A Kabel",ev:"Andere",ord:"999",n:1,fn:0}},
 {col:"fotos",id:"d2-0",data:{d:IMG}},{col:"fotos",id:"d2r-0",data:{d:IMG}}];
const XL=`(()=>{const mkCell=()=>({});class WS{constructor(n){this.name=n;this.rows={};this.cf=[];this.img=0}
 get rowCount(){return Math.max(0,...Object.keys(this.rows).map(Number))}
 getRow(i){const r=this.rows[i]=this.rows[i]||{cells:{},height:0,getCell(n){return this.cells[n]=this.cells[n]||mkCell()},eachCell(o,f){if(typeof o==="function")f=o;Object.values(this.cells).forEach((c,k)=>f(c,k+1))}};
  if(!("values" in r))Object.defineProperty(r,"values",{set(v){(Array.isArray(v)?v:[]).forEach((x,k)=>{r.getCell(k+1).value=x})},get(){return Object.values(r.cells).map(c=>c.value)}});if(!("font" in r))r.font={};return r}
 getCell(a){const m=a.match(/([A-Z]+)(\\d+)/);return this.getRow(+m[2]).getCell(m[1].charCodeAt(0)-64)}
 mergeCells(){}addImage(){this.img++}addConditionalFormatting(o){this.cf.push(o)}set columns(c){}addRow(v){const n=this.rowCount+1;this.getRow(n).values=v;return this.getRow(n)}}
 window.ExcelJS={Workbook:class{constructor(){this.ws=[];this.xlsx={writeBuffer:async()=>new TextEncoder().encode(JSON.stringify(this.ws.map(w=>({name:w.name,img:w.img,txt:Object.values(w.rows).flatMap(r=>Object.values(r.cells).map(c=>typeof c.value==="object"&&c.value?JSON.stringify(c.value):String(c.value??""))).join(" | ")}))))}}
  addWorksheet(n){const w=new WS(n);this.ws.push(w);return w}addImage(){return 1}}}})();`;
(async()=>{const b=await chromium.launch();let fail=0;const ok=(t,c,x)=>{if(!c)fail++;console.log((c?"OK   ":"FEHLT")+" "+t+(x!==undefined?" → "+x:""))};const errs=[];
 const ctx=await b.newContext({viewport:{width:390,height:900},acceptDownloads:true});await ctx.addInitScript(XL);const p=await ctx.newPage();p.on("pageerror",e=>errs.push(e.message+" "+(e.stack||"").split("\n").slice(1,3).join(" ")));
 const fk=fs.readFileSync(S+"fakesb.js","utf8").replace("const T={docs:[]","const T={docs:"+J(seed));
 await ctx.route("**/*",r=>{const u=r.request().url();if(u.startsWith("https://app.test/"))return r.fulfill({body:fs.readFileSync("/home/claude/gh/index.html"),contentType:"text/html"});if(u.includes("supabase-js"))return r.fulfill({body:fk,contentType:"text/javascript"});return r.fulfill({status:404,body:""})});
 await p.goto("https://app.test/");await p.waitForTimeout(1200);await p.mouse.click(200,400);await p.waitForTimeout(400);
 ok("Version ab 1.190",await p.evaluate(()=>+APPV.split(".")[1]>=190));
 /* 1) Berichte-Karte */
 await p.evaluate(()=>{view="jarvis";draw()});await p.waitForTimeout(400);
 const rows=await p.evaluate(()=>[...document.querySelectorAll("#bercard .berrow")].map(b=>b.id+":"+b.querySelector(".bertx b").textContent));
 ok("Karte „Berichte und Listen“ mit 3 Zeilen",J(rows)===J(["jvwb:Wochenbericht","jvfm:Austragen in epirent","jvet:Ersatzteile-Bericht"]),J(rows));
 ok("keine alten Einzelkarten mehr",!(await p.$(".jvcard.wbopen")));
 ok("Schild Austragen: ✓ Nichts offen",/Nichts offen/.test(await p.textContent("#jvfm")));
 await p.click("#jvet");await p.waitForTimeout(300);ok("Ersatzteile-Bericht öffnet",/Ersatzteile-Bericht/.test(await p.textContent(".ov")));await p.evaluate(()=>document.querySelectorAll(".ov").forEach(o=>o.remove()));
 await p.evaluate(()=>{view="jarvis";draw()});await p.waitForTimeout(200);await p.click("#jvwb");await p.waitForTimeout(400);ok("Wochenbericht öffnet",await p.evaluate(()=>view==="wb"));
 await p.evaluate(()=>{view="jarvis";draw()});await p.waitForTimeout(200);await p.click("#jvfm");await p.waitForTimeout(300);ok("Austragen öffnet",await p.evaluate(()=>view==="fmaus"));
 await p.evaluate(()=>{df="alle";view="def";draw()});await p.waitForTimeout(300);ok("Defekte-Liste ohne Ersatzteile-Knopf",!(await p.$("#etrep")));
 await p.evaluate(()=>{wsForce=true;wsTab=null;view="jarvis";draw()});await p.waitForTimeout(300);ok("Werkstatt Übersicht behält den Link",!!(await p.$("#wsrepb")));await p.evaluate(()=>{wsForce=false});
 /* 2) Zu prüfen */
 ok("Zuordnung: d1 (Auftrag) + d2 (beim Zählen), nicht d3",await p.evaluate(()=>dfaDefs(packs.find(x=>x.id==="A"),null).map(d=>d.id).join(","))==="d1,d2");
 await p.evaluate(()=>{abgPrT="zu";go("abgpr")});await p.waitForTimeout(400);ok("Schild „1 Defekt offen“",/1 Defekt offen/.test(await p.textContent(".abgcard")));
 await p.screenshot({path:S+"dfa_liste.png",fullPage:true});
 await p.click("[data-prk]");await p.waitForTimeout(300);ok("Geprüft-Fenster: roter Kasten mit dem Defekt",/noch 1 Defekt offen/.test(await p.textContent("#dfabox"))&&/Verteiler 63A – FI löst aus/.test(await p.textContent("#dfabox")));
 ok("Knopf heißt „Trotzdem geprüft“",(await p.textContent("#abgns"))==="Trotzdem geprüft");await p.screenshot({path:S+"dfa_dlg.png"});
 await p.click("[data-dfa]");await p.waitForTimeout(500);ok("„Öffnen“ springt zum Defekt",await p.evaluate(()=>view==="defopen"&&curDef==="d1"));
 await p.evaluate(()=>{curPack="A";go("pkabg")});await p.waitForTimeout(500);ok("Auftragskonto: Hinweis offene Defekte",/1 Defekt offen: Verteiler 63A/.test(await p.textContent("#dfahint")));
 /* 3) Excel – noch offen → kein Blatt */
 const xlA=async()=>JSON.parse(await p.evaluate(async()=>{const x=await abgXlMake(packs.find(q=>q.id==="A"));return await x.blob.text()}));
 let W=await xlA();ok("Abgleich-Excel mit offenem Defekt: kein Blatt Defekte",!W.some(w=>w.name==="Defekte"),W.map(w=>w.name).join(","));
 /* d1 ausmustern → alle erledigt */
 await p.evaluate(()=>db.doc("defekte/d1").update({done:true,doneBy:"u1",doneT:Date.now(),aus:{by:"u1",t:Date.now(),why:"Gehäuse gebrochen",n:1,fn:0}}));await p.waitForTimeout(500);
 W=await xlA();const D=W.find(w=>w.name==="Defekte");ok("Abgleich-Excel: Blatt Defekte",!!D,W.map(w=>w.name).join(","));
 ok("Inhalt: Ausgemustert + Grund, Repariert, Ersatzteil, Reparaturzeit",D&&/Ausgemustert/.test(D.txt)&&/Gehäuse gebrochen/.test(D.txt)&&/Repariert/.test(D.txt)&&/2 Stk Schuko-Kupplung \(TPC 5501\)/.test(D.txt)&&/45 Min/.test(D.txt)&&/Reparaturzeit gesamt 45 Min/.test(D.txt),D&&D.txt.slice(0,300));
 ok("Fotos: Defekt + Reparatur (2 Bilder)",D&&D.img===2,D&&D.img);
 ok("kein fremder Defekt (d3)",D&&!/16A Kabel/.test(D.txt));
 ok("Auftragskonto: kein Hinweis mehr",await p.evaluate(()=>{curPack="A";go("pkabg");return !document.querySelector("#dfahint")}));
 /* Retourschein-Excel */
 const rx=async id=>{const [dl]=await Promise.all([p.waitForEvent("download"),p.evaluate(id=>retXl(rets.find(r=>r.id===id)),id)]);const fp=S+"dfa_"+id+".json";await dl.saveAs(fp);return JSON.parse(fs.readFileSync(fp,"utf8"))};
 let R=await rx("rE");ok("Retourschein-Excel Endretoure: Blatt Defekte",R.some(w=>w.name==="Defekte"),R.map(w=>w.name).join(","));
 R=await rx("rT");ok("Retourschein-Excel Teilretoure: kein Blatt",!R.some(w=>w.name==="Defekte"),R.map(w=>w.name).join(","));
 /* Prüfen ohne offene Defekte: normales Fenster */
 await p.evaluate(()=>{abgPrT="zu";go("abgpr")});await p.waitForTimeout(400);ok("Liste: kein Schild mehr",!/Defekt offen/.test(await p.textContent(".abgcard")));
 await p.click("[data-prk]");await p.waitForTimeout(300);ok("Geprüft-Fenster normal",!(await p.$("#dfabox"))&&(await p.textContent("#abgns"))==="Geprüft");
 ok("keine JS-Fehler",!errs.length,errs.join(" | "));await b.close();console.log(fail?"FEHLER: "+fail:"ALLES OK")})();
