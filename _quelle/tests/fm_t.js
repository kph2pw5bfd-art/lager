/* Test 1.119: Fehlmaterial bis zum Austragen – Ausgang pro Artikel, Teilmenge, Noch auszutragen, Ausgetragen, PL „verrechnet“, Streifen, Briefing, Wochenbericht, Recht fm_a (SP = Ordner mit fakesb.js) */
const {chromium}=require("playwright");const fs=require("fs");const S=(process.env.SP||"/tmp")+"/";const J=o=>JSON.stringify(o);
const t0=new Date();t0.setHours(0,0,0,0);const T0=t0.getTime(),D=n=>T0+n*864e5+8*36e5;
(async()=>{const b=await chromium.launch();let fail=0;const ok=(t,c)=>{if(!c)fail++;console.log((c?"OK   ":"FEHLT")+" "+t)};const errs=[];
 const pos=[{p:"1",n:10,u:"Stk",t:"Kabel 32A 50m",a:"1098",f:0},{p:"2",n:6,u:"Stk",t:"Schuko 20m",a:"1081",f:0},{p:"3",n:2,u:"Stk",t:"Verteiler 63A",a:"1050",f:0}];
 const it=(nr,name,q)=>({nr,name,q,g:"Kabel",u:""});
 const seed=[{col:"pack",id:"A",data:{ord:"2601300",ps:"14700",ev:"Gala Wien",pl:"Jürgen Hartmann",db:D(-8),de:D(-2),pos,zus:[],by:"u1",t:D(-9)}},
  {col:"packh",id:"A",data:{c:1,h_1:{ok:true,by:"u1",t:1},h_2:{ok:true,by:"u1",t:1},h_3:{ok:true,by:"u1",t:1},fin:{by:"u1",t:D(-8)}}},
  {col:"retour",id:"r1",data:{ev:"Gala Wien",ord:"2601300",itemsJson:J({"1098":it("1098","32A Kabel 50m",6),"1081":it("1081","Schuko 20m",4),"1050":it("1050","Verteiler 63A",1)}),by:"u1",t:D(-1),closed:true,art:"end",closedBy:"u1",closedT:D(-1)}},
  {col:"fmx",id:"alt",data:{pk:"A",k:"c:1050",code:"1050",name:"Verteiler 63A",u:"Stk",q:1,was:"weg",txt:"gestohlen",by:"u1",t:D(-9),aus:null}}];
 const fk=fs.readFileSync(S+"fakesb.js","utf8").replace("const T={docs:[]","const T={docs:"+J(seed));
 const ctx=await b.newContext({viewport:{width:390,height:844}});const p=await ctx.newPage();p.on("pageerror",e=>errs.push(e.message));
 await ctx.addInitScript(()=>{window.__saved=[];window.claude=window.claude||{};window.claude.use=async k=>k==="downloads"?{save:async o=>{window.__saved.push(o.filename)}}:null});
 await ctx.route("**/*",r=>{const u=r.request().url();
  if(u.startsWith("https://app.test/"))return r.fulfill({body:fs.readFileSync("/home/claude/gh/index.html"),contentType:"text/html"});
  if(u.includes("supabase-js"))return r.fulfill({body:fk,contentType:"text/javascript"});
  if(u.includes("pdf-lib"))return r.fulfill({body:fs.readFileSync("/opt/npm-tools/node_modules/pdf-lib/dist/pdf-lib.min.js"),contentType:"text/javascript"});
  if(u.includes("exceljs"))return r.fulfill({body:"window.ExcelJS={Workbook:class{constructor(){this.ws=[]}addWorksheet(){const w={columns:[],rows:[],addRow(v){this.rows.push(v);return{}},getRow(){return{font:null}}};this.ws.push(w);return w}get xlsx(){const m=this;return{async writeBuffer(){window.__xl=m.ws[0].rows;return new Uint8Array(4)}}}}};",contentType:"text/javascript"});
  return r.fulfill({status:404,body:""})});
 await p.goto("https://app.test/");await p.waitForTimeout(800);await p.mouse.click(200,400);await p.waitForTimeout(400);
 const F=()=>p.evaluate(()=>window.__T.docs.filter(r=>r.col==="fmx").map(r=>({id:r.id,...r.data})));
 const miss=()=>p.evaluate(()=>abgMissing().map(g=>g.name+":"+g.n).sort());
 console.log("   Fehlmaterial vorher:",await miss());ok("Vorher: 4 Kabel + 2 Schuko offen (Verteiler schon als gestohlen markiert)",J(await miss())===J(["32A Kabel 50m:4","Schuko 20m:2"].sort())||J(await miss())===J(["Kabel 32A 50m:4","Schuko 20m:2"].sort()));
 /* Auftragskonto */
 await p.evaluate(()=>{curPack="A";go("pkabg")});await p.waitForTimeout(400);
 const chips=await p.evaluate(()=>[...document.querySelectorAll(".fmchips .fmchip")].map(x=>x.textContent));console.log("   Chips:",chips);ok("Kopf: offen / noch auszutragen",chips.includes("2 offen")&&chips.includes("1 noch auszutragen"));
 ok("Verteiler: „Noch auszutragen · seit 9 Tagen“ + Knopf",await p.evaluate(()=>/Noch auszutragen · seit 9 Tagen/.test(document.querySelector("#app").textContent)&&!!document.querySelector('[data-fmaus="alt"]')));
 await p.screenshot({path:S+"fm_konto.png",fullPage:true});
 /* Teilmenge: 2 von 4 Kabel verrechnet */
 const kK=await p.evaluate(()=>abgBal(packs.find(q=>q.id==="A")).L.find(e=>e.code==="1098").k);
 await p.click('[data-fmw="A"][data-fmk="'+kK+'"]');await p.waitForSelector("#fmo");await p.click("#fmqm");await p.click("#fmqm");
 await p.check('input[name="fmw"][value="verr"]');await p.waitForTimeout(100);await p.fill("#fmtx","Rechnung 26-1180");await p.screenshot({path:S+"fm_dlg.png",fullPage:true});
 await p.click("#fmo");await p.waitForTimeout(700);let L=await F();const v=L.find(x=>x.was==="verr");ok("Gespeichert: 2 Stk verrechnet, nicht ausgetragen",v&&v.q===2&&!v.aus&&v.txt==="Rechnung 26-1180");
 ok("Noch offen: 2 Kabel",(await miss()).some(x=>/32A 50m:2$/.test(x)));
 /* Rest: kommt noch zurück → bleibt offen */
 await p.click('[data-fmw="A"][data-fmk="'+kK+'"]');await p.waitForSelector("#fmo");await p.check('input[name="fmw"][value="zur"]');await p.waitForTimeout(100);await p.click("#fmo");await p.waitForTimeout(600);
 ok("„Kommt noch zurück“ bleibt offen",(await miss()).some(x=>/32A 50m:2$/.test(x)));
 /* Schuko: fehlt doch nicht */
 const kS=await p.evaluate(()=>abgBal(packs.find(q=>q.id==="A")).L.find(e=>e.code==="1081").k);
 await p.click('[data-fmw="A"][data-fmk="'+kS+'"]');await p.waitForSelector("#fmo");await p.check('input[name="fmw"][value="nicht"]');await p.waitForTimeout(100);await p.click("#fmo");await p.waitForTimeout(600);
 ok("Schuko erledigt – nicht mehr bei Fehlmaterial",!(await miss()).some(x=>/Schuko/.test(x)));
 /* Lager Übersicht: Streifen, Kachel-Zähler, Briefing */
 await p.evaluate(()=>{view="jarvis";draw()});await p.waitForTimeout(500);const strip=await p.evaluate(()=>(document.querySelector("#fmstrip")||{}).textContent||"");
 console.log("   Streifen:",strip);ok("Streifen: 2 Artikel noch auszutragen, 1 seit über einer Woche",/^2.*2 Artikel noch in epirent auszutragen.*1 davon seit über einer Woche/.test(strip));
 ok("Kachel-Zähler zählt mit",+(await p.evaluate(()=>jvHot()))>=2);
 const br=await p.evaluate(()=>{try{return (typeof jvBriefSay==="function"?jvBriefSay():null)||""}catch(e){return ""}});
 await p.screenshot({path:S+"fm_uebersicht.png",fullPage:true});
 /* Liste Noch auszutragen */
 await p.click("#fmstrip");await p.waitForTimeout(400);ok("Liste geöffnet, 2 Einträge",(await p.$$("#app [data-fmaus]")).length===2);
 await p.click("#fmxl");await p.waitForTimeout(500);const xl=await p.evaluate(()=>({f:window.__saved,r:window.__xl}));ok("Excel mit 2 Zeilen erstellt",xl.r&&xl.r.length===2&&xl.r[1][6]==="Dem Kunden verrechnet");
 await p.screenshot({path:S+"fm_liste.png",fullPage:true});
 await p.click('#app [data-fmaus="alt"]');await p.waitForTimeout(200);await p.locator(".ov").last().locator(".btn:not(.ghost)").last().click();await p.waitForTimeout(600);
 L=await F();ok("Ausgetragen mit Name + Datum",L.find(x=>x.id==="alt").aus&&L.find(x=>x.id==="alt").aus.by==="u1");
 await p.click('[data-fmt="done"]');await p.waitForTimeout(200);ok("Reiter „Ausgetragen“ zeigt ihn",/Verteiler 63A/.test(await p.evaluate(()=>document.querySelector("#app").textContent)));
 /* Wochenbericht */
 await p.evaluate(()=>{view="wb";draw()});await p.waitForTimeout(400);const wb=await p.evaluate(()=>document.querySelector("#app").textContent);
 ok("Wochenbericht: „Fehlmaterial noch in epirent auszutragen“",/Fehlmaterial noch in epirent auszutragen/.test(wb)&&/2 Stk Kabel 32A 50m – verrechnet/.test(wb));
 const b64=await p.evaluate(async()=>{const r=await wbPdf(wbData());const u=r instanceof Uint8Array?r:new Uint8Array(await (r.blob||r).arrayBuffer());let s="";for(let i=0;i<u.length;i+=8192)s+=String.fromCharCode(...u.subarray(i,i+8192));return btoa(s)}).catch(e=>"ERR "+e.message);
 if(/^ERR/.test(b64))console.log("   PDF:",b64);else{fs.writeFileSync(S+"fm_wb.pdf",Buffer.from(b64,"base64"));const pt=require("child_process").execSync("pdftotext -layout "+S+"fm_wb.pdf -").toString();ok("Wochenbericht-PDF (Handy) mit Liste",/Fehlmaterial noch in epirent auszutragen/.test(pt)&&/Kabel 32A 50m/.test(pt))}
 /* PL: „Dem Kunden verrechnet“ für die restlichen 2 Kabel – erst „zur“ zurücknehmen */
 const zid=(await F()).find(x=>x.was==="zur").id;await p.evaluate(id=>window.__T.docs.splice(window.__T.docs.findIndex(r=>r.col==="fmx"&&r.id===id),1),zid);await p.evaluate(()=>db.reloadAll&&db.reloadAll());await p.waitForTimeout(700);
 await p.evaluate(k=>{const P=packs.find(q=>q.id==="A");auAnsDlg(P,abgBal(P).L.find(e=>e.k===k))},kK);await p.waitForSelector('[data-ao="verr"]');await p.click('[data-ao="verr"]');await p.click("#auok");await p.waitForTimeout(800);
 L=await F();const pv=L.filter(x=>x.was==="verr"&&x.pl);ok("PL-Antwort „verrechnet“ → Noch auszutragen (2 Stk)",pv.length===1&&pv[0].q===2);ok("Kabel nicht mehr offen",!(await miss()).some(x=>/Kabel/.test(x)));
 /* ohne Recht fm_a: kein Streifen, kein Austragen-Knopf, kein Zugriff */
 await p.evaluate(()=>{window.__c=can;can=k=>k==="fm_a"?false:window.__c(k);view="jarvis";draw()});await p.waitForTimeout(300);ok("Ohne Recht: kein Streifen",!(await p.$("#fmstrip")));
 await p.evaluate(()=>{curPack="A";go("pkabg")});await p.waitForTimeout(300);ok("Ohne Recht: kein „ausgetragen“-Knopf",!(await p.$("[data-fmaus]")));
 const rr=await p.evaluate(()=>{can=window.__c;return RK.includes("fm_a")&&rSum({fm_a:true})});ok("Recht im Raster: "+rr,/Fehlmaterial austragen/.test(rr));
 console.log("Fehler:",errs);ok("keine Seitenfehler",!errs.length);console.log(fail?"FEHLGESCHLAGEN: "+fail:"ALLES OK");await b.close()})();
