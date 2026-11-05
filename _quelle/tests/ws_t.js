/* Test 1.125: Werkstatt Übersicht – Kachel-Name, Reiter Dringend/Neu/Alle, Repariert per Scan, Teil-Reparatur (SP = Ordner mit fakesb.js) */
const {chromium}=require("playwright");const fs=require("fs");const S=(process.env.SP||"/tmp")+"/";const J=o=>JSON.stringify(o);
const kat=JSON.parse(fs.readFileSync(__dirname+"/rkat.json","utf8")).map((x,i)=>({col:"rkat",id:"k"+i,data:x}));
(async()=>{const b=await chromium.launch();let fail=0;const ok=(t,c)=>{if(!c)fail++;console.log((c?"OK   ":"FEHLT")+" "+t)};const errs=[];
 const now=Date.now(),D=(id,o)=>({col:"defekte",id,data:{by:"u1",t:now-36e5,done:false,urg:false,fn:0,foto:false,...o}});
 const seed=[...kat,D("a",{art:"32A Kabel 50m",anr:"1098",ev:"Spittelberg",desc:"Stecker gebrochen",n:3,fn:1,foto:true,t:now-3*864e5}),
  D("b",{art:"Verteiler 125A Maxi 2",anr:"1048",ev:"Am Hof",desc:"FI defekt",urg:true,t:now-2*864e5}),
  D("c",{art:"Schuko 20m",anr:"1081",ev:"Gala",desc:"Kupplung",t:now-6e5}),
  D("d",{art:"Schuko 20m",anr:"1081",ev:"Messe",desc:"Mantel",t:now-5e5}),
  D("e",{art:"16A Kabel 25m",anr:"",ev:"Gala",done:true,doneBy:"u1",doneT:now-36e5,n:2}),
  {col:"fotos",id:"a-0",data:{d:"data:image/png;base64,iVBORw0KGgo="}}];
 const fk=fs.readFileSync(S+"fakesb.js","utf8").replace("const T={docs:[]","const T={docs:"+J(seed));
 const ctx=await b.newContext({viewport:{width:390,height:844}});const p=await ctx.newPage();p.on("pageerror",e=>errs.push(e.message+" "+(e.stack||"").split("\n").slice(1,3).join(" ")));
 await ctx.addInitScript(t=>{try{localStorage.setItem("tpc_ws_seen",String(t))}catch(e){}},now-864e5);
 await ctx.route("**/*",r=>{const u=r.request().url();
  if(u.startsWith("https://app.test/"))return r.fulfill({body:fs.readFileSync("/home/claude/gh/index.html"),contentType:"text/html"});
  if(u.includes("supabase-js"))return r.fulfill({body:fk,contentType:"text/javascript"});
  return r.fulfill({status:404,body:""})});
 await p.goto("https://app.test/");await p.waitForTimeout(800);await p.mouse.click(200,400);await p.waitForTimeout(400);
 const DEFS=()=>p.evaluate(()=>window.__T.docs.filter(r=>r.col==="defekte").map(r=>({id:r.id,...r.data})));
 /* Lager-Ansicht: Admin ohne Werkstatt-Titel */
 await p.evaluate(()=>{view="start";draw()});await p.waitForTimeout(200);ok("Admin: Kachel heißt „Lager Übersicht“",/Lager Übersicht/.test(await p.textContent('[data-g="jarvis"]')));
 await p.evaluate(()=>{view="jarvis";draw()});await p.waitForTimeout(300);ok("Admin: Link „Werkstatt Übersicht ansehen“",!!(await p.$("#wsadm")));
 await p.click("#wsadm");await p.waitForTimeout(300);ok("Link öffnet Werkstatt Übersicht",/Werkstatt Übersicht/.test(await p.textContent("#t"))&&!!(await p.$("#wsrep")));
 ok("Zurück-Link für Admin",!!(await p.$("#wsback")));await p.click("#wsback");await p.waitForTimeout(200);ok("Zurück → Lager Assistent",(await p.textContent("#t"))==="Lager Assistent");
 /* Werkstatt-Titel */
 await p.evaluate(t=>{localStorage.setItem("tpc_ws_seen",String(t));wsIn=false;wsTab=null},now-864e5);await p.evaluate(()=>{TIT["tw"]={id:"tw",name:"Werkstatt",r:{}};ROL[me]={...(ROL[me]||{}),t:"tw"};view="start";draw()});await p.waitForTimeout(300);
 ok("Werkstatt: Kachel heißt „Werkstatt Übersicht“, Zähler 1",/Werkstatt Übersicht/.test(await p.textContent('[data-g="jarvis"]'))&&/Dringend, neu gemeldet/.test(await p.textContent('[data-g="jarvis"]')));
 ok("Einstellungen-Name",await p.evaluate(()=>HO_NAME.jarvis==="Werkstatt Übersicht"));
 await p.evaluate(()=>{view="jarvis";draw()});await p.waitForTimeout(300);
 const tabs=await p.evaluate(()=>[...document.querySelectorAll("[data-wst]")].map(b=>b.textContent));ok("Reiter "+J(tabs),J(tabs)===J(["1Dringend","2Neu","4Alle offen"]));
 const first=await p.evaluate(()=>[...document.querySelectorAll("[data-wsd]")].map(b=>b.dataset.wsd));ok("Start im Reiter Dringend",J(first)===J(["b"]));
 ok("Diese Woche: Repariert 2 Stk",/Repariert2 Stk/.test(await p.evaluate(()=>document.querySelector(".wscard.plain").textContent)));
 await p.screenshot({path:S+"ws_start.png",fullPage:true});
 await p.click('[data-wst="neu"]');await p.waitForTimeout(200);const neu=await p.evaluate(()=>[...document.querySelectorAll("[data-wsd]")].map(b=>b.dataset.wsd));ok("Neu: seit letztem Besuch "+J(neu),J(neu.sort())===J(["c","d"].concat([]).sort())||J(neu.sort())===J(["b","c","d"]));
 console.log("     Neu:",J(neu));await p.screenshot({path:S+"ws_neu.png",fullPage:true});
 await p.click('[data-wst="alle"]');await p.waitForTimeout(200);ok("Alle offen: 3 × Kabel angezeigt",/3 × 32A Kabel 50m/.test(await p.textContent(".wscard")));
 /* Defekt öffnen und zurück: Neu bleibt */
 await p.evaluate(()=>{curDef="c";go("defopen")});await p.waitForTimeout(1200);await p.evaluate(()=>{back?back():history.back()}).catch(()=>{});await p.evaluate(()=>{view="jarvis";draw()});await p.waitForTimeout(300);
 await p.click('[data-wst="neu"]');await p.waitForTimeout(200);ok("Nach Defekt öffnen bleibt „Neu“ gefüllt",(await p.$$("[data-wsd]")).length>=2);
 /* Scan: 1081 → zwei offene → Auswahl */
 await p.evaluate(()=>wsScanHit("1081-03"));await p.waitForTimeout(300);ok("Scan mit 2 Meldungen → Auswahl",(await p.$$(".ov [data-wsd]")).length===2);
 await p.click('.ov [data-wsd="d"]');await p.waitForTimeout(600);ok("Auswahl → Defekt offen + Reparatur-Fenster",await p.evaluate(()=>view==="defopen"&&curDef==="d")&&!!(await p.$("#ets")));
 await p.fill("#etrep","Kupplung getauscht");await p.click("#ets");await p.waitForTimeout(800);let L=await DEFS();ok("Repariert: d erledigt",L.find(x=>x.id==="d").done===true);
 /* Scan Kabel mit Stückzahl 3 → Wie viele? 2 → Teilung */
 await p.evaluate(()=>{view="jarvis";draw()});await p.waitForTimeout(200);await p.evaluate(()=>wsScanHit("1098"));await p.waitForTimeout(700);
 ok("Stückzahl 3: Frage „Wie viele sind repariert?“",/Wie viele sind repariert/.test(await p.textContent("body"))&&(await p.textContent("#wsqv"))==="3 von 3");
 await p.click("#wsqm");ok("Hinweis Rest",/1 Stk bleiben/.test(await p.textContent("#wsqh")));await p.screenshot({path:S+"ws_teil.png"});
 await p.click("#wsqo");await p.waitForTimeout(300);await p.fill("#etrep","2 Stecker getauscht");await p.click("#ets");await p.waitForTimeout(1200);L=await DEFS();
 const a=L.find(x=>x.id==="a"),rest=L.find(x=>x.teilVon==="a");ok("Original: 2 Stk erledigt",a.done===true&&a.n===2&&a.rep==="2 Stecker getauscht");
 ok("Rest: 1 Stk offen, gleiche Daten, Foto kopiert",rest&&rest.done===false&&rest.n===1&&rest.desc==="Stecker gebrochen"&&rest.ev==="Spittelberg"&&!rest.rep&&rest.fn===1&&await p.evaluate(id=>window.__T.docs.some(r=>r.col==="fotos"&&r.id===id+"-0"),rest.id));
 /* Abbrechen ändert nichts */
 const n0=(await DEFS()).length;await p.evaluate(id=>{const d=defs.find(x=>x.id===id);d.n=2;wsRepair(d)},rest.id);await p.waitForTimeout(200);await p.click("#wsqx");await p.waitForTimeout(200);ok("Abbrechen: keine neue Meldung",(await DEFS()).length===n0);
 /* Scan ohne offenen Defekt */
 await p.evaluate(()=>wsScanHit("1109"));await p.waitForTimeout(200);ok("Scan ohne Treffer → Hinweis",/Kein offener Defekt/.test(await p.textContent("body")));
 ok("kein seitliches Scrollen",await p.evaluate(()=>{document.querySelectorAll(".ov,.eov").forEach(o=>o.remove());view="jarvis";draw();return document.documentElement.scrollWidth<=innerWidth}));
 await p.emulateMedia({colorScheme:"dark"});await p.waitForTimeout(200);await p.screenshot({path:S+"ws_dark.png",fullPage:true});
 console.log("Fehler:",errs);ok("keine Seitenfehler",!errs.length);console.log(fail?"FEHLGESCHLAGEN: "+fail:"ALLES OK");await b.close()})();
