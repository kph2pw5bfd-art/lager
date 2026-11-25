/* Test 1.193: Inhalt pro Box erfassen – Box starten, Menge pro Box, Box fertig + Etikett, Sonstiges, Boxen ansehen, Etikett mit Box/Teilung (SP = Ordner mit fakesb.js) */
const {chromium}=require("playwright");const fs=require("fs");const S=(process.env.SP||"/tmp")+"/";const J=o=>JSON.stringify(o);
const t0=new Date();t0.setHours(0,0,0,0);const T0=t0.getTime(),day=864e5;
const pos=[{p:"1",n:30,u:"Stk",t:"Schuko 20m",a:"1081",f:0},{p:"2",n:2,u:"Stk",t:"Verteiler 63A",a:"1048",f:0},{p:"3",n:8,u:"Stk",t:"Defender 32A",a:"2201",f:0}];
const seed=[{col:"pack",id:"P1",data:{ord:"260130001",ps:"14402",ev:"Gala Wien 2026",pl:"Max Muster",db:T0+8*36e5,de:T0+9*day,pos,by:"u1",t:Date.now()}}];
(async()=>{const b=await chromium.launch();let fail=0;const ok=(t,c,x)=>{if(!c)fail++;console.log((c?"OK   ":"FEHLT")+" "+t+(x!==undefined?" → "+x:""))};const errs=[];
 const ctx=await b.newContext({viewport:{width:390,height:844}});const p=await ctx.newPage();p.on("pageerror",e=>errs.push(e.message+" "+(e.stack||"").split("\n").slice(1,3).join(" ")));
 const fk=fs.readFileSync(S+"fakesb.js","utf8").replace("const T={docs:[]","const T={docs:"+J(seed));
 await ctx.route("**/*",r=>{const u=r.request().url();if(u.startsWith("https://app.test/"))return r.fulfill({body:fs.readFileSync("/home/claude/gh/index.html"),contentType:"text/html"});if(u.includes("supabase-js"))return r.fulfill({body:fk,contentType:"text/javascript"});return r.fulfill({status:404,body:""})});
 await p.goto("https://app.test/");await p.evaluate(()=>{window.MF_NOASK=true;window.PK_FOPEN=true});await p.waitForTimeout(1000);await p.mouse.click(195,420);await p.waitForTimeout(400);
 ok("Version 1.193",await p.evaluate(()=>APPV==="1.193"));
 const H=()=>p.evaluate(()=>(__T.docs.find(d=>d.col==="packh"&&d.id==="P1")||{}).data||{});
 const open=async()=>{await p.evaluate(()=>{curPack="P1";view="packopen";draw()});await p.waitForTimeout(400)};
 const row=t=>p.evaluate(t=>{const r=[...document.querySelectorAll(".pkp")].find(x=>x.querySelector(".pkt").textContent.includes(t));return r?+r.dataset.pkrow:-1},t);
 await open();
 ok("Knopf „Inhalt pro Box erfassen“",(await p.textContent("#bxgo")).includes("Inhalt pro Box erfassen"));
 /* normales Abhaken ohne Box unverändert */
 let i=await row("Defender");await p.click('[data-pc="'+i+'"]');await p.waitForTimeout(300);ok("ohne Box: Kreis hakt wie bisher ab",(await H()).h_3&&(await H()).h_3.ok===true);
 await p.click('[data-pc="'+i+'"]');await p.waitForTimeout(300);ok("…und wieder auf",!(await H()).h_3);
 /* Box 1 */
 await p.click("#bxgo");await p.waitForTimeout(200);await p.click('[data-bxt="gb"]');ok("Startknopf heißt „Große Box 1 starten“",(await p.textContent("#bxok"))==="Große Box 1 starten");
 await p.screenshot({path:S+"bx_art.png"});await p.click("#bxok");await p.waitForTimeout(500);
 let h=await H();ok("Box 1 offen gespeichert",h.bx_1&&h.bx_1.typ==="gb"&&!h.bx_1.done);
 ok("Leiste zeigt offene Box",/Große Box 1/.test(await p.textContent("#bxbar"))&&!!(await p.$("#bxfin")));
 i=await row("Schuko 20m");await p.click('[data-pc="'+i+'"]');await p.waitForTimeout(300);
 ok("Mengen-Fenster mit Vorschlag 30",(await p.inputValue("#bxn"))==="30"&&/noch 30 Stk offen/.test(await p.textContent(".ov")));
 await p.fill("#bxn","10");await p.dispatchEvent("#bxn","input");ok("Knopf „10 Stk in Große Box 1“",(await p.textContent("#bxok"))==="10 Stk in Große Box 1");
 await p.screenshot({path:S+"bx_menge.png"});await p.click("#bxok");await p.waitForTimeout(500);
 h=await H();ok("Box enthält 10, Position teilweise (10 von 30)",h.bx_1.it.h_1===10&&h.h_1.q===10&&!h.h_1.ok,J(h.h_1));
 ok("Zeile zeigt „10 in Große Box 1“",/10 in Große Box 1/.test(await p.textContent('[data-pkrow="'+i+'"]')));
 i=await row("Verteiler");await p.click('[data-pc="'+i+'"]');await p.waitForTimeout(300);await p.click("#bxok");await p.waitForTimeout(500);
 h=await H();ok("Verteiler komplett (2 von 2) in Box 1",h.bx_1.it.h_2===2&&h.h_2.ok===true);
 await p.screenshot({path:S+"bx_box.png",fullPage:true});
 /* Box fertig */
 await p.click("#bxfin");await p.waitForTimeout(300);ok("Box fertig: Inhalt + „Mit Inhalt“ vorgewählt",/Schuko 20m/.test(await p.textContent(".ov"))&&(await p.getAttribute('[data-bxa="inh"]',"class")).includes("on"));
 await p.screenshot({path:S+"bx_fertig.png"});await p.click("#bxpr");await p.waitForTimeout(600);
 const jobs=await p.evaluate(()=>__T.docs.filter(d=>d.col==="druck").map(d=>d.data));
 ok("Druckauftrag mit Box und Inhalt",jobs.length===1&&jobs[0].art==="inh"&&jobs[0].box==="GROSSE BOX 1"&&jobs[0].inh==="10 Stk Schuko 20m\n2 Stk Verteiler 63A",J(jobs[0]));
 h=await H();ok("Box 1 fertig + gedruckt",!!h.bx_1.done&&!!h.bx_1.et);
 ok("Frage „Nächste Box?“",/Nächste Box/.test(await p.textContent(".ov"))&&/Box 2 starten/.test(await p.textContent("#bxnx")));
 await p.click("#bxnx");await p.waitForTimeout(200);await p.fill("#bxson","Verteilerkasten");await p.dispatchEvent("#bxson","input");ok("Sonstiges: „Verteilerkasten 2 starten“",(await p.textContent("#bxok"))==="Verteilerkasten 2 starten");
 await p.click("#bxok");await p.waitForTimeout(500);
 i=await row("Schuko 20m");await p.click('[data-pc="'+i+'"]');await p.waitForTimeout(300);ok("Rest-Vorschlag 20",(await p.inputValue("#bxn"))==="20");await p.click("#bxok");await p.waitForTimeout(500);
 h=await H();ok("Schuko jetzt komplett (10 + 20)",h.h_1.ok===true&&h.bx_2.it.h_1===20,J(h.h_1));
 ok("Zeile: 10 in Box 1 · 20 in Box 2",/10 in Große Box 1 · 20 in Verteilerkasten 2/.test(await p.textContent('[data-pkrow="'+i+'"]')));
 await p.click("#bxfin");await p.waitForTimeout(300);ok("Sonstiges mit 1 Artikel: „Normales Etikett“ vorgewählt",(await p.getAttribute('[data-bxa="pl"]',"class")).includes("on"));
 await p.click("#bxno");await p.waitForTimeout(400);await p.click("#bxend");await p.waitForTimeout(300);
 h=await H();ok("Box 2 fertig ohne Etikett",!!h.bx_2.done&&!h.bx_2.et);
 ok("Leiste: keine offene Box, „Nächste Box starten“",!!(await p.$("#bxbar.idle"))&&!!(await p.$("#bxgo")));
 /* ohne offene Box wieder normales Abhaken */
 i=await row("Defender");await p.click('[data-pc="'+i+'"]');await p.waitForTimeout(300);ok("ohne offene Box: normales Abhaken",(await H()).h_3&&(await H()).h_3.ok===true&&!(await p.$(".ov")));
 /* Boxen ansehen + nochmal drucken */
 await p.click("#bxls");await p.waitForTimeout(200);const lt=await p.textContent(".ov");ok("Boxen ansehen: beide Boxen",/GROSSE BOX 1/.test(lt)&&/VERTEILERKASTEN 2/.test(lt));
 await p.screenshot({path:S+"bx_liste.png"});
 await p.click('[data-bxre="1"]');await p.waitForTimeout(300);ok("Nochmal drucken ohne „Ohne Etikett“",!(await p.$("#bxno"))&&/nochmal/.test(await p.textContent(".ov")));
 await p.click("#bxpr");await p.waitForTimeout(500);ok("zweiter Druckauftrag, keine „Nächste Box?“-Frage",(await p.evaluate(()=>__T.docs.filter(d=>d.col==="druck").length))===2&&!(await p.$("#bxnx")));
 /* Etikett: Box-Schild und Teilung */
 const d1=await p.evaluate(()=>gbDoc({art:"inh",ord:"260130001",ev:"Gala Wien 2026",n:1,box:"PALETTE 2",inh:"20 Stk Schuko 20m\n8 Stk Defender 32A",rot:0}));
 ok("Etikett mit Box-Schild",/PALETTE 2/.test(d1)&&/class="bxt/.test(d1)&&!/Inhalt 1 von/.test(d1));
 const many=Array.from({length:15},(_,k)=>(k+1)+" Stk Artikel "+(k+1)).join("\n");
 const d2=await p.evaluate(m=>gbDoc({art:"inh",ord:"1",ev:"X",n:1,box:"RUNGE 3",inh:m,rot:0}),many);
 ok("viel Inhalt → 2 Etiketten „Inhalt 1 von 2 / 2 von 2“",(d2.match(/class="pp"/g)||[]).length===2&&/Inhalt 1 von 2/.test(d2)&&/Inhalt 2 von 2/.test(d2));
 const d3=await p.evaluate(()=>gbDoc({art:"inh",ord:"1",ev:"X",n:1,inh:"a",rot:0}));ok("altes Etikett ohne Box unverändert",!/class="bxt/.test(d3)&&/Inhalt:/.test(d3));
 fs.writeFileSync(S+"bx_label.html",d1);const lp=await ctx.newPage();await lp.setViewportSize({width:400,height:400});await lp.goto("file://"+S+"bx_label.html");await lp.waitForTimeout(300);await lp.screenshot({path:S+"bx_label.png"});
 ok("keine JS-Fehler",!errs.length,errs.join(" | "));await b.close();console.log(fail?"FEHLER: "+fail:"ALLES OK")})();
