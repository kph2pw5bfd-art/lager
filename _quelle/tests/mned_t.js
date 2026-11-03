/* Test 1.111: manuell eingetragenen Artikel umbenennen (Name + Nummer), Fehlende Artikel mitziehen, Anteil eines Kollegen, Artikelliste-Treffer (SP = Ordner mit fakesb.js) */
const {chromium}=require("playwright");const fs=require("fs");const S=(process.env.SP||"/tmp")+"/";
(async()=>{const b=await chromium.launch();const ctx=await b.newContext({viewport:{width:390,height:844}});const p=await ctx.newPage();const errs=[];p.on("pageerror",e=>errs.push(e.message));
 await ctx.route("**/*",r=>{const u=r.request().url();
  if(u.startsWith("https://app.test/"))return r.fulfill({body:fs.readFileSync("/home/claude/gh/index.html"),contentType:"text/html"});
  if(u.includes("supabase-js"))return r.fulfill({body:fs.readFileSync(S+"fakesb.js"),contentType:"text/javascript"});
  return r.fulfill({status:404,body:""})});
 let fail=0;const ok=(t,c)=>{if(!c)fail++;console.log((c?"OK   ":"FEHLT")+" "+t)};
 const fehl=()=>p.evaluate(()=>window.__T.docs.filter(r=>r.col==="fehlartikel").map(r=>r.id+":"+r.data.name+"/"+r.data.nr+" x"+r.data.times+" q"+r.data.qty).sort());
 const man=async(n,nr,q)=>{await p.click("#rman");await p.fill("#mnm",n);if(nr)await p.fill("#mnr",nr);else await p.fill("#mnr","");await p.fill("#mq",String(q));await p.click("#mok");await p.waitForTimeout(300)};
 await p.goto("https://app.test/");await p.waitForTimeout(500);await p.mouse.click(200,400);await p.waitForTimeout(300);
 await p.click('[data-g="ret"]');await p.click('[data-rv="new"]');await p.fill("#rev","Umbenenn-Test");await p.fill("#rord","2601234-01");await p.click("#rgo");await p.waitForTimeout(300);
 await man("Lampe rot","9876",2);await man("Zeltplan","",3);await p.evaluate(()=>rPersist(true));await p.waitForTimeout(500);
 console.log("   Fehlende vorher:",await fehl());
 await p.click("[data-rmg]");await p.waitForTimeout(200);
 await p.click('[data-rmk="M:9876"]');await p.waitForTimeout(200);ok("Link im Zahlenfeld",!!(await p.$("#rmned")));
 await p.screenshot({path:S+"mned1.png"});
 await p.click("#rmned");await p.waitForTimeout(200);ok("Dialog vorbelegt",(await p.inputValue("#men"))==="Lampe rot"&&(await p.inputValue("#menr"))==="9876");
 await p.screenshot({path:S+"mned2.png"});
 await p.fill("#men","LED Spot rot");await p.fill("#menr","9877");await p.click("#meok");await p.waitForTimeout(800);
 const T=await p.$$eval(".rgrid .rtile",l=>l.map(x=>x.textContent.trim()));console.log("   Kacheln:",T);ok("Kachel umbenannt",T.some(t=>/^2LED Spot rotNr\. 9877$/.test(t)));
 const db1=await p.evaluate(()=>{const r=window.__T.docs.find(r=>r.col==="retour");return{mn:r.data["mn_M:9876"],pa:r.data["pa_u1"]}});
 ok("mn_-Feld gespeichert",db1.mn&&db1.mn.name==="LED Spot rot"&&db1.mn.nr==="9877");ok("eigener Anteil mit neuem Namen",/LED Spot rot/.test(db1.pa));
 const F=await fehl();console.log("   Fehlende nachher:",F);ok("Fehlende Artikel: alt weg, neu da",!F.some(x=>x.startsWith("m9876:"))&&F.some(x=>x==="m9877:LED Spot rot/9877 x1 q2"));
 /* Kollege hat noch alten Namen im Anteil – Anzeige bleibt neu */
 await p.evaluate(()=>{const r=window.__T.docs.find(r=>r.col==="retour");r.data["pa_u2"]=JSON.stringify({"M:9876":{nr:"9876",name:"Lampe rot",g:"Manuell",u:"",manual:true,q:1}});rets=rets.map(x=>x.id===r.data.id||x.id===r.id?rView({id:r.id,...JSON.parse(JSON.stringify(r.data))}):x);rRemote();retEdit()});await p.waitForTimeout(300);
 const it=await p.evaluate(()=>rs.items["M:9876"]);ok("Mit Kollegen-Anteil: 3 Stk, neuer Name ("+it.q+" "+it.name+")",it.q===3&&it.name==="LED Spot rot"&&it.nr==="9877");
 const lst=await p.evaluate(()=>{const r=rets[0];return JSON.parse(r.itemsJson)["M:9876"].name});ok("Liste/Excel-Daten mit neuem Namen",lst==="LED Spot rot");
 /* gleicher Name wie anderer manueller Artikel → zusammenlegen */
 await p.click('[data-rmk="M:9876"]');await p.click("#rmned");await p.fill("#men","Zeltplan");await p.fill("#menr","");await p.click("#meok");await p.waitForTimeout(500);
 const z=await p.evaluate(()=>Object.values(rs.items).filter(x=>x.manual).map(x=>x.name+":"+x.q));console.log("   nach Zusammenlegen:",z);ok("Zusammengelegt: Zeltplan 6",z.length===1&&z[0]==="Zeltplan:6");
 /* neuer manueller Eintrag mit gleichem Namen landet beim selben Artikel */
 await p.click("#bk");await p.waitForTimeout(200);await man("zeltplan","",1);ok("Gleicher Name nochmal → selber Artikel",(await p.evaluate(()=>Object.values(rs.items).filter(x=>x.manual).length))===1);
 /* Name aus der Artikelliste → Frage, als diesen Artikel zählen */
 const cat=await p.evaluate(()=>rKat()[0]);await p.click("[data-rmg]");await p.waitForTimeout(200);const k=await p.evaluate(()=>Object.keys(rs.items).find(k=>rs.items[k].manual));
 await p.click('[data-rmk="'+k+'"]');await p.click("#rmned");await p.fill("#men","x");await p.fill("#menr",cat.nr);await p.click("#meok");await p.waitForTimeout(300);
 const q=await p.textContent(".ov");console.log("   Frage:",q.slice(0,140));ok("Frage zur Artikelliste",q.includes(cat.name));
 await p.screenshot({path:S+"mned3.png"});
 await p.click(".ov button >> text=/^Ja, als/");await p.waitForTimeout(500);
 const it2=await p.evaluate(n=>({m:Object.values(rs.items).filter(x=>x.manual).length,c:rs.items[n]&&rs.items[n].q,t:document.querySelector("#t").textContent}),cat.nr);
 ok("In Artikelliste-Artikel verschoben ("+JSON.stringify(it2)+")",it2.m===0&&it2.c===7);
 console.log("   Fehlende am Ende:",await fehl());
 console.log("Fehler:",errs);ok("keine Seitenfehler",!errs.length);console.log(fail?"FEHLGESCHLAGEN: "+fail:"ALLES OK");await b.close()})();
