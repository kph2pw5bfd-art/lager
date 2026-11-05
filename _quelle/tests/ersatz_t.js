/* Test 1.95: Reparatur + Ersatzteile, Bericht-PDF, Sortierung Defekte, nach Melden Reiter „Alle“ */
const {chromium}=require("playwright");const fs=require("fs");const S=(process.env.SP||"/tmp")+"/";
const now=Date.now(),H=36e5,lm=new Date();lm.setDate(1);lm.setMonth(lm.getMonth()-1);lm.setHours(10);const LM=lm.getTime();
const df=(id,o)=>({col:"defekte",id,data:{art:"Artikel "+id,ev:"Fest",by:"u1",done:false,urg:false,fn:0,foto:false,...o}});
const seed=[df("a",{t:now-5*H}),df("b",{t:now-1*H}),df("c",{t:now-9*H,urg:true}),df("d",{t:now-2*H,done:true,doneBy:"u1",doneT:LM+H,urg:true,art:"Kabel CEE 32A 25m",ord:"2601098",desc:"Stecker gebrochen",rep:"Stecker getauscht",et:[{n:1,u:"Stk",nm:"CEE-Stecker 32A 5-polig",tnr:"5012",hnr:"PCE 025-6"}]}),df("e",{t:now-1.5*H,done:true,doneBy:"u1",doneT:LM+2*H,et:[{n:2,u:"Stk",nm:"CEE-Stecker 32A 5-polig",tnr:"5012",hnr:""},{n:1.5,u:"m",nm:"Gummikabel 5x6",tnr:"",hnr:""}]})];
let F=0;const ok=(t,c,v)=>{F+=!c;console.log((c?"OK   ":"FEHLT")+" "+t+(v!==undefined?": "+v:""))};
(async()=>{const b=await chromium.launch();const ctx=await b.newContext({viewport:{width:390,height:844}});const p=await ctx.newPage();const errs=[];p.on("pageerror",e=>errs.push(e.message));
 const fk=fs.readFileSync(S+"fakesb.js","utf8").replace("const T={docs:[]","const T={docs:"+JSON.stringify(seed));
 await ctx.route("**/*",r=>{const u=r.request().url();if(u.startsWith("https://app.test/"))return r.fulfill({body:fs.readFileSync("/home/claude/gh/index.html"),contentType:"text/html"});if(u.includes("supabase-js"))return r.fulfill({body:fk,contentType:"text/javascript"});
  if(u.includes("pdf-lib"))return r.fulfill({body:fs.readFileSync("/opt/npm-tools/node_modules/pdf-lib/dist/pdf-lib.min.js"),contentType:"text/javascript"});return r.fulfill({status:404,body:""})});
 await p.goto("https://app.test/");await p.waitForTimeout(900);await p.mouse.click(195,420);await p.waitForTimeout(500);
 const E=(f,a)=>p.evaluate(f,a);
 await E(()=>{df="alle";curDef=null;view="def";hist=["start"];draw()});await p.waitForTimeout(300);
 const ord=await E(()=>[...document.querySelectorAll("[data-df]")].map(e=>e.dataset.df).join(""));ok("Sortierung: dringend offen, offen neu→alt, erledigt neu→alt",ord==="cbaed",ord);
 ok("Knopf Bericht",!!(await p.$("#etrep")));
 /* Melden → Alle */
 await E(()=>{df="offen";go("defnew")});await p.waitForTimeout(200);await p.fill("#dnart","Testartikel");await p.fill("#dnev","Fest");await p.click("#dnsend");await p.waitForTimeout(500);await p.click("#dxfin");await p.waitForTimeout(300);
 ok("Nach Melden → Fertig: Reiter Alle",await E(()=>view==="def"&&df==="alle"&&document.querySelector('[data-dfl="alle"]').classList.contains("act")));
 /* Repariert */
 await E(()=>{curDef="b";go("defopen")});await p.waitForTimeout(300);ok("Knopf Repariert",(await p.innerText("#dd")).trim()==="Repariert");
 await p.click("#dd");await p.waitForTimeout(300);await p.fill("#etrep","Schalter getauscht");
 await p.click("#etadd");await p.waitForTimeout(200);await p.fill("#etn","cee-st");await p.waitForTimeout(150);const sg=await p.innerText("#etres");ok("Vorschlag mit Nummern + Anzahl",/CEE-Stecker 32A 5-polig[\s\S]*TPC 5012 · Hersteller PCE 025-6 · 2× verwendet/.test(sg),sg.replace(/\n/g," "));
 await p.click("#etres button");ok("Nummern übernommen",(await p.inputValue("#ett"))==="5012"&&(await p.inputValue("#ethn"))==="PCE 025-6");await p.click("#etpl");await p.click("#etps");await p.waitForTimeout(150);
 await p.click("#etadd");await p.waitForTimeout(150);await p.click("#etps");ok("Pflichtfeld Name",await E(()=>document.querySelector("#etn").classList.contains("bad")));await p.fill("#etn","Kippschalter 16A rot");await p.click("#etps");await p.waitForTimeout(150);
 await p.screenshot({path:S+"ersatz_dlg.png"});
 await p.click('[data-ete="1"]');await p.waitForTimeout(150);await p.fill("#etq","3");await p.click("#etps");await p.waitForTimeout(150);
 await p.click("#ets");await p.waitForTimeout(500);
 const d=await E(()=>JSON.stringify((({done,rep,et,rfn})=>({done,rep,et,rfn}))(defs.find(x=>x.id==="b"))));ok("Gespeichert + erledigt",/"done":true,"rep":"Schalter getauscht","et":\[\{"n":2,"u":"Stk","nm":"CEE-Stecker 32A 5-polig","tnr":"5012","hnr":"PCE 025-6"\},\{"n":3,"u":"Stk","nm":"Kippschalter 16A rot","tnr":"","hnr":""\}\],"rfn":0/.test(d),d);
 await p.waitForTimeout(200);await E(()=>draw());await p.waitForTimeout(200);const card=await p.innerText(".etc");ok("Karte Reparatur",/Schalter getauscht[\s\S]*2 Stk[\s\S]*CEE-Stecker[\s\S]*3 Stk/.test(card),card.replace(/\n/g," | "));
 ok("Knopf Reparatur ändern",(await p.innerText("#etedit")).trim()==="Reparatur ändern");await p.screenshot({path:S+"ersatz_open.png",fullPage:true});
 await p.click("#etedit");await p.waitForTimeout(300);await p.click('[data-ete="0"]');await p.waitForTimeout(150);await p.click("#etpd");await p.waitForTimeout(100);await p.click("#ets");await p.waitForTimeout(400);
 ok("Ändern: Teil entfernt, bleibt erledigt",await E(()=>{const x=defs.find(x=>x.id==="b");return x.done&&x.et.length===1&&x.et[0].nm==="Kippschalter 16A rot"}));
 /* Bericht */
 await E(()=>{view="def";draw()});await p.waitForTimeout(200);await p.click("#etrep");await p.waitForTimeout(200);
 const inf=await p.innerText("#etinfo");ok("Letzter Monat: 2 Reparaturen, 4 Teile, 2 verschiedene",/2 Reparaturen · 4 Ersatzteile · 2 verschiedene/.test(inf),inf);
 await p.click('[data-erg="c"]');await p.waitForTimeout(100);ok("Von–bis sichtbar",await p.isVisible("#etf"));
 const sum=await E(()=>{const r=etRange("lm");return etData(r).sum.map(s=>s.n+" "+s.u+" "+s.nm+" "+s.tnr+"/"+s.hnr).join(" ; ")});ok("Summe pro Teil",sum==="3 Stk CEE-Stecker 32A 5-polig 5012/PCE 025-6 ; 1.5 m Gummikabel 5x6 /",sum);
 const b64=await E(async()=>{const u=await etPdf("lm",etRange("lm"));let s="";for(let i=0;i<u.length;i+=8192)s+=String.fromCharCode(...u.subarray(i,i+8192));return btoa(s)});fs.writeFileSync(S+"ersatz.pdf",Buffer.from(b64,"base64"));
 const b64y=await E(async()=>{const u=await etPdf("y",etRange("y"));let s="";for(let i=0;i<u.length;i+=8192)s+=String.fromCharCode(...u.subarray(i,i+8192));return btoa(s)});fs.writeFileSync(S+"ersatz_y.pdf",Buffer.from(b64y,"base64"));
 ok("keine JS-Fehler",!errs.length,errs.join(" / "));console.log("FEHLER GESAMT:",F);await b.close()})();
