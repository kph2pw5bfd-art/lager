/* Test 1.124: Defekte-Liste – Suche, Scan, Erledigte eingeklappt (SP = Ordner mit fakesb.js) */
const {chromium}=require("playwright");const fs=require("fs");const S=(process.env.SP||"/tmp")+"/";const J=o=>JSON.stringify(o);
const kat=JSON.parse(fs.readFileSync(__dirname+"/rkat.json","utf8")).map((x,i)=>({col:"rkat",id:"k"+i,data:x}));
(async()=>{const b=await chromium.launch();let fail=0;const ok=(t,c)=>{if(!c)fail++;console.log((c?"OK   ":"FEHLT")+" "+t)};const errs=[];
 const now=Date.now(),D=(id,o)=>({col:"defekte",id,data:{by:"u1",t:now-36e5,done:false,urg:false,fn:0,foto:false,...o}});
 const seed=[...kat,D("a",{art:"32A Kabel 50m",anr:"1098",ev:"Weihnachtsmarkt Spittelberg 2026",ord:"2601080-01",desc:"Stecker gebrochen"}),
  D("b",{art:"Verteiler 125A Maxi 2",anr:"1048",ev:"Am Hof",desc:"FI defekt",urg:true}),
  D("c",{art:"32A Kabel 50m",anr:"",ev:"Gala Wien",desc:"Mantel",done:true,doneBy:"u1",doneT:now}),
  D("d",{art:"Schuko 20m",anr:"1081",ev:"Gala Wien",desc:"",done:true,doneBy:"u1",doneT:now}),
  D("e",{art:"Schuko 20m",anr:"1081",ev:"Messe Linz",desc:"Kupplung"})];
 const fk=fs.readFileSync(S+"fakesb.js","utf8").replace("const T={docs:[]","const T={docs:"+J(seed));
 const ctx=await b.newContext({viewport:{width:390,height:844}});const p=await ctx.newPage();p.on("pageerror",e=>errs.push(e.message));
 await ctx.route("**/*",r=>{const u=r.request().url();
  if(u.startsWith("https://app.test/"))return r.fulfill({body:fs.readFileSync("/home/claude/gh/index.html"),contentType:"text/html"});
  if(u.includes("supabase-js"))return r.fulfill({body:fk,contentType:"text/javascript"});
  return r.fulfill({status:404,body:""})});
 await p.goto("https://app.test/");await p.waitForTimeout(800);await p.mouse.click(200,400);await p.waitForTimeout(400);
 const ids=()=>p.evaluate(()=>[...document.querySelectorAll("[data-df]")].map(e=>e.dataset.df));
 await p.evaluate(()=>{df="alle";view="def";draw()});await p.waitForTimeout(300);
 ok("Alle: nur offene, Erledigte eingeklappt "+J(await ids()),(await ids())[0]==="b"&&J((await ids()).sort())===J(["a","b","e"])&&/Erledigte anzeigen \(2\)/.test(await p.textContent("#dxdtog")));
 await p.screenshot({path:S+"defsuch_liste.png",fullPage:true});
 await p.click("#dxdtog");await p.waitForTimeout(200);ok("Aufklappen zeigt Erledigte",(await ids()).length===5&&/ausblenden/.test(await p.textContent("#dxdtog")));
 await p.click("#dxdtog");await p.waitForTimeout(200);
 await p.click("#dxdq");await p.type("#dxdq","gala");await p.waitForTimeout(200);
 ok("Suche „gala“: Erledigte mitgesucht "+J(await ids()),J((await ids()).sort())===J(["c","d"])&&/2 Treffer/.test(await p.textContent(".dxhit")));
 ok("Fokus bleibt im Suchfeld",await p.evaluate(()=>document.activeElement.id==="dxdq"));
 await p.fill("#dxdq","");await p.type("#dxdq","kabel spittel");await p.waitForTimeout(200);ok("Wörter beliebig",J(await ids())===J(["a"]));
 await p.screenshot({path:S+"defsuch_suche.png",fullPage:true});
 await p.evaluate(()=>{const d=defs.find(x=>x.id==="a");d.t=d.t});await p.evaluate(()=>draw());await p.waitForTimeout(200);ok("Neuzeichnen behält Suche",(await p.inputValue("#dxdq"))==="kabel spittel"&&J(await ids())===J(["a"]));
 await p.click("#dxdqx");await p.waitForTimeout(200);ok("Suche löschen",(await p.inputValue("#dxdq"))===""&&(await ids()).length===3);
 /* Scan: 1081 → ein offener → öffnet */
 await p.evaluate(()=>dxDefScanHit("1081-07"));await p.waitForTimeout(300);ok("Scan mit genau einem offenen → Defekt geöffnet",await p.evaluate(()=>view==="defopen"&&curDef==="e"));
 /* Scan: 1098 → 1 offen (a) + erledigter c ohne Nummer über Namen */
 await p.evaluate(()=>{dxDQ="";df="alle";view="def";draw()});await p.waitForTimeout(200);
 await p.evaluate(()=>{defs.push({id:"f",art:"32A Kabel 50m",anr:"",ev:"Test",by:"u1",t:Date.now(),done:false});dxDefScanHit("1098")});await p.waitForTimeout(300);
 ok("Scan mit mehreren offenen → Liste gefiltert (auch ohne Nummer über den Namen) "+J(await ids()),await p.evaluate(()=>view==="def")&&J((await ids()).sort())===J(["a","c","f"]));
 await p.evaluate(()=>{dxDQ="";df="offen";defView()});await p.waitForTimeout(200);ok("Reiter Offen: Suchleiste da, keine Einklapp-Zeile",!!(await p.$("#dxdq"))&&!(await p.$("#dxdtog")));
 ok("kein seitliches Scrollen",await p.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));
 await p.emulateMedia({colorScheme:"dark"});await p.evaluate(()=>{df="alle";defView()});await p.waitForTimeout(200);await p.screenshot({path:S+"defsuch_dark.png",fullPage:true});
 console.log("Fehler:",errs);ok("keine Seitenfehler",!errs.length);console.log(fail?"FEHLGESCHLAGEN: "+fail:"ALLES OK");await b.close()})();
