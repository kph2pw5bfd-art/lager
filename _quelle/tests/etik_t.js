/* Test 1.121: Gitterbox-Etiketten – Dialog in der Packliste, Druckauftrag, Druckstation, Etikett-Aussehen + QR, Scannen beim Rücklauf (SP = Ordner mit fakesb.js) */
const {chromium}=require("playwright");const fs=require("fs");const S=(process.env.SP||"/tmp")+"/";const J=o=>JSON.stringify(o);
const t0=new Date();t0.setHours(0,0,0,0);const T0=t0.getTime(),D=n=>T0+n*864e5+8*36e5;
(async()=>{const b=await chromium.launch();let fail=0;const ok=(t,c)=>{if(!c)fail++;console.log((c?"OK   ":"FEHLT")+" "+t)};const errs=[];
 const pos=[{p:"1",n:10,u:"Stk",t:"Kabel 32A 50m",a:"1098",f:0},{p:"2",n:6,u:"Stk",t:"Schuko 20m",a:"1081",f:0}];
 const seed=[{col:"pack",id:"A",data:{ord:"2601080-01",ps:"14700",ev:"Ice Magic Innsbruck",pl:"Max Muster",db:D(0)+8*36e5,de:D(5),pos,zus:[],by:"u1",t:D(-1)}},
  {col:"retour",id:"rA",data:{ev:"Ice Magic Innsbruck",ord:"2601080-01",itemsJson:"{}",by:"u1",t:D(-1)}}];
 const fk=fs.readFileSync(S+"fakesb.js","utf8").replace("const T={docs:[]","const T={docs:"+J(seed));
 const ctx=await b.newContext({viewport:{width:390,height:844}});const p=await ctx.newPage();p.on("pageerror",e=>errs.push(e.message));
 await ctx.route("**/*",r=>{const u=r.request().url();
  if(u.startsWith("https://app.test/"))return r.fulfill({body:fs.readFileSync("/home/claude/gh/index.html"),contentType:"text/html"});
  if(u.includes("supabase-js"))return r.fulfill({body:fk,contentType:"text/javascript"});
  return r.fulfill({status:404,body:""})});
 await p.goto("https://app.test/");await p.evaluate(()=>window.PK_FOPEN=true);await p.waitForTimeout(800);await p.mouse.click(200,400);await p.waitForTimeout(400);
 const JOBS=()=>p.evaluate(()=>window.__T.docs.filter(r=>r.col==="druck").map(r=>({id:r.id,...r.data})));
 await p.evaluate(()=>{curPack="A";go("packopen")});await p.waitForTimeout(400);ok("Knopf „Gitterbox-Etikett drucken“ in der Packliste",!!(await p.$("#pketik")));
 await p.click("#pketik");await p.waitForSelector(".etdlg");ok("Ohne Druckstation: „nicht erreichbar“",/nicht erreichbar/.test(await p.textContent("#etst")));
 await p.check('input[name="etart"][value="inh"]');await p.waitForTimeout(100);await p.click('[data-eti="0"]');await p.click('[data-eti="1"]');await p.click("#etp");await p.click("#etp");
 const inh=await p.inputValue("#etinh");ok("Inhalt aus der Packliste: "+J(inh),inh==="10 Stk Kabel 32A 50m\n6 Stk Schuko 20m");
 await p.screenshot({path:S+"etik_dlg.png",fullPage:true});
 await p.click("#etgo");await p.waitForTimeout(500);let L=await JOBS();ok("Druckauftrag gespeichert (3× mit Inhalt, wartet)",L.length===1&&L[0].n===3&&L[0].art==="inh"&&L[0].st==="neu"&&L[0].ord==="2601080-01");
 /* dieses Gerät als Druckstation: Drucken abfangen */
 await p.evaluate(()=>{window.__printed=[];gbPrint=async j=>{window.__printed.push(j);window.__doc=gbDoc(j)}});
 await p.evaluate(()=>{go("druckst")});await p.waitForTimeout(300);ok("Ansicht Druckstation",/Druckstation · Etiketten/.test(await p.textContent("#app")));
 await p.check("#eton");await p.waitForTimeout(1500);L=await JOBS();const pr=await p.evaluate(()=>window.__printed.length);
 ok("Station druckt den Auftrag und meldet „gedruckt“",pr===1&&L[0].st==="ok"&&L[0].pt>0);
 const beat=await p.evaluate(()=>{const r=window.__T.docs.find(r=>r.col==="druckst"&&r.id==="main");return r&&r.data.t});ok("Herzschlag der Station",beat>Date.now()-60000);
 await p.screenshot({path:S+"etik_station.png",fullPage:true});
 /* Status im Dialog jetzt „bereit“ */
 await p.evaluate(()=>{curPack="A";go("packopen")});await p.waitForTimeout(300);await p.click("#pketik");await p.waitForSelector(".etdlg");await p.waitForTimeout(300);
 ok("Dialog: „Druckstation bereit“ + Zuletzt gedruckt",/Druckstation bereit/.test(await p.textContent("#etst"))&&/gedruckt/.test(await p.textContent(".etdlg")));
 await p.click("#etgo");await p.waitForTimeout(1500);L=await JOBS();ok("Zweiter Auftrag (Projektlabel) sofort gedruckt",L.length===2&&L.every(x=>x.st==="ok")&&L.some(x=>x.art==="proj"));
 /* Einstellungen */
 const pref=await p.evaluate(()=>gbPrefBlock());ok("Einstellungen: Block Druckstation",/Etiketten-Druckstation/.test(pref)&&/Dieses Gerät ist die Druckstation/.test(pref));
 /* Etiketten-Aussehen: beide Varianten rendern, QR lesen */
 const docs=await p.evaluate(()=>[gbDoc({ord:"2601080-01",ev:"Ice Magic Innsbruck",art:"proj",n:2}),gbDoc({ord:"2500261-01",ev:"Burg Clam",art:"inh",n:1,inh:"10 Stk Kabel 32A 50m\n6 Stk Schuko 20m\n2 Stk Verteiler 63A"}),gbDoc({ord:"2601999-01",ev:"Sehr langer Veranstaltungsname Weihnachtsmarkt am Spittelberg 2026 mit Zusatz",art:"proj",n:1})]);
 const lp=await b.newPage({viewport:{width:600,height:600},deviceScaleFactor:3});let i=0;
 for(const d of docs){await lp.setContent(d);await lp.waitForTimeout(400);const pg=await lp.$$(".pg");if(i===0)ok("2 Kopien = 2 Seiten",pg.length===2);
  const ov=await lp.evaluate(()=>[...document.querySelectorAll(".fit,.fit1")].every(e=>e.scrollHeight<=e.clientHeight+1&&e.scrollWidth<=e.clientWidth+1));ok("Etikett "+(i+1)+": Text passt hinein",ov);
  await pg[0].screenshot({path:S+"etik_label_"+(i+1)+".png"});i++}
 fs.writeFileSync(S+"etik_qr.json",J(["TPC:2601080-01","TPC:2500261-01","TPC:2601999-01"]));
 /* Rücklauf: Scannen */
 await p.evaluate(()=>{view="ret";draw()});await p.waitForTimeout(300);ok("Retourscheine: QR-Knopf",!!(await p.$("#rqr")));
 await p.evaluate(()=>gbScanHit("TPC:2601080-01"));await p.waitForTimeout(500);ok("QR → Retourschein geöffnet",await p.evaluate(()=>view==="retopen"&&curRet==="rA"));
 await p.evaluate(()=>gbScanHit("https://www.tpc-rental.at"));await p.waitForTimeout(200);ok("Alter Homepage-QR → Hinweis",/Altes Etikett/.test(await p.evaluate(()=>document.body.textContent)));
 ok("PC als installierte App: kein Handy-Teilen beim Drucken",await p.evaluate(()=>{const mm=window.matchMedia;window.matchMedia=q=>/standalone/.test(q)?{matches:true}:mm.call(window,q);const r=wbMobile();window.matchMedia=mm;return r===false}));
 console.log("Fehler:",errs);ok("keine Seitenfehler",!errs.length);console.log(fail?"FEHLGESCHLAGEN: "+fail:"ALLES OK");await b.close()})();
