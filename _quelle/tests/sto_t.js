/* Test 1.173: Packliste „Storniert“ – Zahnrad, Grund, Anzeige, raus aus Herrichten/Wand/Dispo abgelaufen/Fehlmaterial, Meine Aufträge, zurücknehmen, Aufräumen nach 3 Monaten (SP = Ordner mit fakesb.js) */
const {chromium}=require("playwright");const fs=require("fs");const S=(process.env.SP||"/tmp")+"/";const J=o=>JSON.stringify(o);
const t0=new Date();t0.setHours(0,0,0,0);const D=n=>t0.getTime()+n*864e5+8*36e5;
(async()=>{const b=await chromium.launch();let fail=0;const ok=(t,c,x)=>{if(!c)fail++;console.log((c?"OK   ":"FEHLT")+" "+t+(x!==undefined?" → "+x:""))};const errs=[];
 const pos=[{p:"1",n:16,u:"Stk",t:"Kabel A",a:"1098",f:0},{p:"2",n:6,u:"Stk",t:"Kabel B",a:"1081",f:0}];
 const seed=[{col:"pack",id:"A",data:{ord:"2601080-01",ps:"738",ev:"Gala Wien",pl:"Jürgen Hartmann",db:D(0),de:D(4),pos,by:"u1",t:D(-3)}},
  {col:"packh",id:"A",data:{h_1:{ok:true,by:"u1",t:1},h_2:{ok:true,by:"u1",t:1},fin:{by:"u1",t:D(-1)}}},
  {col:"pack",id:"B",data:{ord:"2601090-01",ps:"740",ev:"Ball Graz",pl:"Heinz Tester",db:D(-10),de:D(-2),pos,by:"u1",t:D(-12)}},
  {col:"packh",id:"B",data:{h_1:{ok:true,by:"u1",t:1},h_2:{ok:true,by:"u1",t:1},fin:{by:"u1",t:D(-10)}}},
  {col:"pack",id:"C",data:{ord:"2601000-01",ps:"700",ev:"Altes Fest",pl:"Heinz Tester",db:D(-120),de:D(-110),pos,by:"u1",t:D(-125)}},
  {col:"packh",id:"C",data:{sto:{by:"u1",t:D(-95),why:"alt"}}}];
 const fk=fs.readFileSync(S+"fakesb.js","utf8").replace("const T={docs:[]","const T={docs:"+J(seed));
 const ctx=await b.newContext({viewport:{width:390,height:900}});const p=await ctx.newPage();p.on("pageerror",e=>errs.push(e.message));
 await ctx.route("**/*",r=>{const u=r.request().url();if(u.startsWith("https://app.test/"))return r.fulfill({body:fs.readFileSync("/home/claude/gh/index.html"),contentType:"text/html"});if(u.includes("supabase-js"))return r.fulfill({body:fk,contentType:"text/javascript"});return r.fulfill({status:404,body:""})});
 await p.goto("https://app.test/");await p.evaluate(()=>{window.MF_NOASK=true;window.PK_FOPEN=true});await p.waitForTimeout(800);await p.mouse.click(200,400);await p.waitForTimeout(400);
 const st=id=>p.evaluate(id=>{const x=packs.find(q=>q.id===id);return x?pkState(x).k+"|"+pkState(x).l:"weg"},id);
 ok("vorher: A heute hergerichtet, B Dispo abgelaufen",(await st("A"))==="herr|Hergerichtet"&&(await st("B")).startsWith("over"),(await st("A"))+" / "+(await st("B")));
 /* A stornieren über das Zahnrad */
 await p.evaluate(()=>{curPack="A";view="packopen";draw()});await p.waitForTimeout(300);
 await p.click("#pkhg");await p.waitForTimeout(150);const mi=await p.$$eval(".pkmi",l=>l.map(x=>x.textContent));ok("Menüpunkt da",mi.some(x=>/^Auftrag storniert/.test(x)),mi.join(" | "));
 await p.click("#pksto");await p.waitForTimeout(200);ok("Hinweis zurückräumen",/bitte zurückräumen/.test(await p.textContent(".ov .card")));
 await p.fill("#pkstow","Kunde hat abgesagt");await p.click("#pkstoo");await p.waitForTimeout(500);
 const H=await p.evaluate(()=>__T.docs.find(d=>d.col==="packh"&&d.id==="A").data.sto);ok("gespeichert",H&&H.by==="u1"&&H.why==="Kunde hat abgesagt"&&H.t>0,J(H));
 ok("Status Storniert",(await st("A"))==="done|Storniert");
 const hint=await p.textContent(".pkhint.sto");ok("Hinweis oben",/Storniert – Kunde hat abgesagt · Jürgen H\./.test(hint),hint);
 await p.screenshot({path:S+"sto_pack.png"});
 /* raus aus Listen */
 ok("nicht bei Heute herrichten/Wand",await p.evaluate(()=>!pkGroups().herr.some(x=>x.id==="A")&&pkHDay(packs.find(x=>x.id==="A"))===0));
 ok("unter Erledigt",await p.evaluate(()=>pkGroups().done.some(x=>x.id==="A")));
 await p.evaluate(()=>go("pack"));await p.waitForTimeout(300);ok("Wand ohne A",!/Gala Wien/.test(await p.textContent("#app")));
 /* B stornieren (Dispo abgelaufen, kein Retourschein) → kein Fehlmaterial, kein Dispo abgelaufen */
 const fmB=await p.evaluate(()=>typeof abgFehlList==="function"?1:0);
 await p.evaluate(()=>pkHSet(packs.find(x=>x.id==="B"),{sto:{by:me,t:Date.now(),why:""}}));await p.waitForTimeout(400);
 ok("B nicht mehr Dispo abgelaufen",(await st("B"))==="done|Storniert"&&await p.evaluate(()=>!pkGroups().over.length));
 /* Meine Aufträge */
 const I=await p.evaluate(()=>{const x=auInfo(packs.find(q=>q.id==="A"));return x.lab+"|"+x.cls+"|"+x.done+"|"+x.hot});ok("Meine Aufträge: Storniert grau, erledigt",I==="Storniert|g|true|false",I);
 await p.evaluate(()=>{curAu="A";go("auopen")}).catch(()=>{});await p.waitForTimeout(300);
 /* Assistent */
 const say=await p.evaluate(()=>{try{return JSON.stringify(jvOrder("Was ist mit Auftrag 2601080-01"))}catch(e){return String(e)}});ok("Assistent nennt Storno",/storniert/.test(say),String(say).slice(0,160));
 /* Alle Packlisten: Schild */
 const row=await p.evaluate(()=>pkRowStand(packs.find(x=>x.id==="A")));ok("Schild grau",/pksto/.test(row)&&/Storniert/.test(row));
 /* zurücknehmen */
 await p.evaluate(()=>{curPack="A";view="packopen";draw()});await p.waitForTimeout(300);await p.click("#pkhg");await p.waitForTimeout(150);
 ok("Menüpunkt zurücknehmen",(await p.textContent("#pksto")).startsWith("Storno zurücknehmen"));await p.click("#pksto");await p.waitForTimeout(150);await p.click(".ov .btn:not(.ghost)").catch(()=>{});
 const okb=await p.$$eval(".ov button",l=>l.map(x=>x.textContent));if(okb.length){await p.evaluate(()=>{const b=[...document.querySelectorAll(".ov button")].find(x=>/^(Ja|OK)$/.test(x.textContent.trim()));if(b)b.click()})}
 await p.waitForTimeout(500);ok("wieder offen",(await st("A"))==="herr|Hergerichtet",await st("A"));
 /* Aufräumen: C (vor 95 Tagen storniert) weg, B (heute) bleibt */
 const n=await p.evaluate(()=>pkStoClean());await p.waitForTimeout(300);
 ok("nach 3 Monaten gelöscht",n===1&&(await st("C"))==="weg"&&(await st("B"))!=="weg",n);
 ok("keine JS-Fehler",!errs.length,errs.join(" | "));
 await b.close();console.log(fail?"FEHLER: "+fail:"ALLES OK")})();
