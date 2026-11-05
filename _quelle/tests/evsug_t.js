/* Test 1.123: Veranstaltung / Auftragsnummer vorschlagen – Defekt melden + neuer Retourschein (SP = Ordner mit fakesb.js) */
const {chromium}=require("playwright");const fs=require("fs");const S=(process.env.SP||"/tmp")+"/";const J=o=>JSON.stringify(o);
const t0=new Date();t0.setHours(0,0,0,0);const T0=t0.getTime(),D=n=>T0+n*864e5+8*36e5;
(async()=>{const b=await chromium.launch();let fail=0;const ok=(t,c)=>{if(!c)fail++;console.log((c?"OK   ":"FEHLT")+" "+t)};const errs=[];
 const pos=[{p:"1",n:12,u:"Stk",t:"Kabel 32A 50m",a:"1098",f:0}];
 const seed=[{col:"pack",id:"A",data:{ord:"2601080-01",ps:"14700",ev:"Weihnachtsmarkt Spittelberg 2026",pl:"Max Muster",db:D(-6),de:D(-1),pos,zus:[],by:"u1",t:D(-8)}},
  {col:"pack",id:"B",data:{ord:"2601090-01",ps:"14800",ev:"Weihnachtsmarkt Am Hof",pl:"Eva Berger",db:D(-3),de:D(10),pos,zus:[],by:"u1",t:D(-5)}},
  {col:"pack",id:"C",data:{ord:"2600900-01",ps:"14000",ev:"Weihnachtsmarkt Spittelberg 2025",pl:"Max Muster",db:D(-370),de:D(-330),pos,zus:[],by:"u1",t:D(-372)}},
  {col:"retour",id:"rC",data:{ev:"Weihnachtsmarkt Spittelberg 2025",ord:"2600900-01",itemsJson:"{}",by:"u1",t:D(-330),closed:true,closedT:D(-330),art:"end"}},
  {col:"retour",id:"rX",data:{ev:"Firmenfeier Gösser",ord:"2601111-01",itemsJson:"{}",by:"u1",t:D(-1)}}];
 const fk=fs.readFileSync(S+"fakesb.js","utf8").replace("const T={docs:[]","const T={docs:"+J(seed));
 const ctx=await b.newContext({viewport:{width:390,height:844}});const p=await ctx.newPage();p.on("pageerror",e=>errs.push(e.message));
 await ctx.route("**/*",r=>{const u=r.request().url();
  if(u.startsWith("https://app.test/"))return r.fulfill({body:fs.readFileSync("/home/claude/gh/index.html"),contentType:"text/html"});
  if(u.includes("supabase-js"))return r.fulfill({body:fk,contentType:"text/javascript"});
  return r.fulfill({status:404,body:""})});
 await p.goto("https://app.test/");await p.waitForTimeout(800);await p.mouse.click(200,400);await p.waitForTimeout(400);
 const rows=()=>p.evaluate(()=>[...document.querySelectorAll(".dxsug:not([hidden]) .dxev")].map(b=>b.textContent));
 const heads=()=>p.evaluate(()=>[...document.querySelectorAll(".dxsug:not([hidden]) .dxg")].map(b=>b.textContent));
 /* Defekt: Veranstaltung tippen */
 await p.evaluate(()=>{view="defnew";defNewView()});await p.waitForTimeout(400);
 await p.click("#dnev");await p.type("#dnev","spittel");await p.waitForTimeout(150);let R=await rows();console.log("     spittel →",J(R));
 ok("Laufender Auftrag zuerst, 2025 unter „Erledigt“",R.length===2&&/2026/.test(R[0])&&/2601080-01/.test(R[0])&&/2025/.test(R[1])&&J(await heads())===J(["Laufende Aufträge","Erledigt / älter"]));
 ok("Zeile mit Dispo + PL + Status",/Dispo \d\d\.\d\d\.–\d\d\.\d\d\./.test(R[0])&&/PL Max M\./.test(R[0])&&/Dispo abgelaufen/.test(R[0]));
 await p.screenshot({path:S+"evsug_ev.png"});
 await p.click('.dxsug:not([hidden]) [data-dxo="0"]');await p.waitForTimeout(800);
 ok("Antippen: Veranstaltung + Auftragsnummer",(await p.inputValue("#dnev"))==="Weihnachtsmarkt Spittelberg 2026"&&(await p.inputValue("#dnord"))==="2601080-01");
 ok("Packlisten-Knöpfe erscheinen",(await p.$$("#dnchips .dxchip")).length===1);
 /* umgekehrt: Auftragsnummer */
 await p.evaluate(()=>{view="defnew";defNewView()});await p.waitForTimeout(400);
 await p.click("#dnord");await p.type("#dnord","26010");await p.waitForTimeout(150);R=await rows();console.log("     26010 →",J(R));
 ok("Auftragsnummer: passende Aufträge",R.length===2&&R.some(r=>/Am Hof/.test(r))&&!R.some(r=>/Gösser/.test(r)));
 const ix=R.findIndex(r=>/Am Hof/.test(r));await p.screenshot({path:S+"evsug_ord.png"});await p.click('.dxsug:not([hidden]) [data-dxo="'+ix+'"]');await p.waitForTimeout(800);
 ok("Antippen füllt Veranstaltung",(await p.inputValue("#dnev"))==="Weihnachtsmarkt Am Hof"&&(await p.inputValue("#dnord"))==="2601090-01");
 ok("Datalist entfernt",await p.evaluate(()=>!document.querySelector("#dnev").getAttribute("list")));
 /* Retourschein ohne Packliste (nur Retourschein) */
 await p.evaluate(()=>{view="defnew";defNewView()});await p.waitForTimeout(300);await p.click("#dnev");await p.type("#dnev","gösser");await p.waitForTimeout(150);R=await rows();
 ok("Quelle Retourschein (offen → laufend)",R.length===1&&/Retourschein offen/.test(R[0])&&/2601111-01/.test(R[0]));
 /* Neuer Retourschein */
 await p.evaluate(()=>{document.activeElement.blur();rNew()});await p.waitForTimeout(400);await p.click("#rev");await p.type("#rev","am hof");await p.waitForTimeout(150);R=await rows();
 ok("Retourschein: Vorschlag",R.length===1&&/Am Hof/.test(R[0]));await p.screenshot({path:S+"evsug_ret.png"});
 await p.click('.dxsug:not([hidden]) [data-dxo="0"]');await p.waitForTimeout(300);
 ok("Retourschein: beide Felder + gemerkt",(await p.inputValue("#rord"))==="2601090-01"&&await p.evaluate(()=>rs.ev==="Weihnachtsmarkt Am Hof"&&rs.ord==="2601090-01"));
 await p.fill("#rord","");await p.click("#rord");await p.type("#rord","2600900");await p.waitForTimeout(150);R=await rows();ok("Retourschein: Nummer → 2025",R.length===1&&/Spittelberg 2025/.test(R[0])&&/Retoure abgeschlossen/.test(R[0]));
 ok("kein seitliches Scrollen",await p.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));
 await p.emulateMedia({colorScheme:"dark"});await p.evaluate(()=>{view="defnew";defNewView()});await p.waitForTimeout(300);await p.click("#dnev");await p.type("#dnev","weihn");await p.waitForTimeout(150);await p.screenshot({path:S+"evsug_dark.png"});
 console.log("Fehler:",errs);ok("keine Seitenfehler",!errs.length);console.log(fail?"FEHLGESCHLAGEN: "+fail:"ALLES OK");await b.close()})();
