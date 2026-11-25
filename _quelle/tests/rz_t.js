/* Test 1.189: Reparaturzeit – Drehräder Std/Min, Pflicht, Anzeige im Defekt, Werkstatt Übersicht, Ersatzteile-Bericht, Wochenbericht (SP = Ordner mit fakesb.js) */
const {chromium}=require("playwright");const fs=require("fs");const {execSync}=require("child_process");const S=(process.env.SP||"/tmp")+"/";const J=o=>JSON.stringify(o);
const t0=new Date();t0.setHours(0,0,0,0);const wd=t0.getDay(),mon=new Date(t0);mon.setDate(mon.getDate()-((wd+6)%7));if(wd===6||wd===0)mon.setDate(mon.getDate()+7);const M=mon.getTime();
const at=d=>{const x=new Date(M);x.setDate(x.getDate()+d);x.setHours(10,0,0,0);return x.getTime()};const now=Date.now();
(async()=>{const b=await chromium.launch();let fail=0;const ok=(t,c,x)=>{if(!c)fail++;console.log((c?"OK   ":"FEHLT")+" "+t+(x!==undefined?" → "+x:""))};const errs=[];
 const D=(id,o)=>({col:"defekte",id,data:{by:"u1",t:now-5*864e5,done:false,urg:false,fn:0,foto:false,n:1,...o}});
 const seed=[D("o1",{art:"Verteiler 63A",anr:"1048",ev:"Gala Wien",desc:"FI löst aus"}),
  D("w1",{art:"Schuko 20m",anr:"1081",ev:"Messe",done:true,doneBy:"u1",doneT:at(-5),rep:"Kupplung",rz:50,t:at(-9)}),
  D("w2",{art:"CEE 32A 50m",anr:"1098",ev:"Am Hof",done:true,doneBy:"u1",doneT:at(-4),rep:"alt, ohne Zeit",n:2,t:at(-9)}),
  D("x1",{art:"16A Kabel 25m",anr:"1062",ev:"Gala",done:true,doneBy:"u1",doneT:now-6e4,rz:90})];
 const fk=fs.readFileSync(S+"fakesb.js","utf8").replace("const T={docs:[]","const T={docs:"+J(seed));
 const ctx=await b.newContext({viewport:{width:390,height:844},hasTouch:false});const p=await ctx.newPage();p.on("pageerror",e=>errs.push(e.message+" "+(e.stack||"").split("\n").slice(1,3).join(" ")));
 await ctx.route("**/*",r=>{const u=r.request().url();if(u.startsWith("https://app.test/"))return r.fulfill({body:fs.readFileSync("/home/claude/gh/index.html"),contentType:"text/html"});
  if(u.includes("pdf-lib"))return r.fulfill({body:fs.readFileSync("/opt/npm-tools/node_modules/pdf-lib/dist/pdf-lib.min.js"),contentType:"text/javascript"});
  if(u.includes("supabase-js"))return r.fulfill({body:fk,contentType:"text/javascript"});return r.fulfill({status:404,body:""})});
 await p.goto("https://app.test/");await p.waitForTimeout(1200);await p.mouse.click(200,400);await p.waitForTimeout(300);
 ok("Version ab 1.189",await p.evaluate(()=>+APPV.split(".")[1]>=189));
 const DEF=id=>p.evaluate(id=>{const r=window.__T.docs.find(x=>x.col==="defekte"&&x.id===id);return r&&r.data},id);
 ok("rzTx",await p.evaluate(()=>[rzTx(0),rzTx(5),rzTx(60),rzTx(75),rzTx(12*60+59)].join("|"))==="0 Min|5 Min|1 Std|1 Std 15 Min|12 Std 59 Min");
 /* Reparatur-Fenster */
 await p.evaluate(()=>{curDef="o1";go("defopen")});await p.waitForTimeout(600);await p.evaluate(()=>etDlg(defs.find(d=>d.id==="o1"),true));await p.waitForTimeout(400);
 ok("Räder Std 0–12 und Min 0–59",await p.evaluate(()=>document.querySelectorAll("#etrzh [data-rzi]").length===13&&document.querySelectorAll("#etrzm [data-rzi]").length===60));
 ok("Start: 0 Min",(await p.textContent("#etrzv"))==="0 Min");
 await p.screenshot({path:S+"rz_leer.png"});
 await p.fill("#etrep","FI getauscht");await p.click("#ets");await p.waitForTimeout(400);
 ok("Pflicht: ohne Zeit nicht gespeichert",(await DEF("o1")).done===false&&!!(await p.$("#ets")));
 ok("Pflicht: Hinweis + roter Rahmen",/Bitte Reparaturzeit einstellen/.test(await p.textContent("#etrzerr"))&&await p.evaluate(()=>document.querySelector("#etrzbox").classList.contains("bad")));
 await p.screenshot({path:S+"rz_pflicht.png"});
 /* Stunden mit dem Mausrad drehen */
 const hb=await (await p.$("#etrzh")).boundingBox();await p.mouse.move(hb.x+hb.width/2,hb.y+hb.height/2);await p.mouse.wheel(0,80);await p.waitForTimeout(700);
 ok("Mausrad: 2 Std",(await p.textContent("#etrzv"))==="2 Std",await p.textContent("#etrzv"));
 ok("Hinweis weg, sobald Zeit da",(await p.textContent("#etrzerr"))===""&&!(await p.evaluate(()=>document.querySelector("#etrzbox").classList.contains("bad"))));
 /* Minute antippen (minutengenau) */
 await p.evaluate(()=>{const c=document.querySelector("#etrzm");c.scrollTop=13*40;c.dispatchEvent(new Event("scroll"))});await p.waitForTimeout(400);
 const mb=await (await p.$("#etrzm")).boundingBox();await p.mouse.click(mb.x+mb.width/2,mb.y+mb.height/2+80);await p.waitForTimeout(900);/* 2 Zeilen unter der Mitte = 15 */
 ok("Minute antippen: 2 Std 15 Min",(await p.textContent("#etrzv"))==="2 Std 15 Min",await p.textContent("#etrzv"));
 ok("ausgewählte Zahlen hervorgehoben",await p.evaluate(()=>document.querySelector("#etrzh .on").textContent==="2"&&document.querySelector("#etrzm .on").textContent==="15"));
 await p.screenshot({path:S+"rz_dlg.png"});
 await p.click("#ets");await p.waitForTimeout(800);let d=await DEF("o1");ok("gespeichert: rz 135, erledigt",d.rz===135&&d.done===true&&d.rep==="FI getauscht",J({rz:d.rz,done:d.done}));
 await p.evaluate(()=>{curDef="o1";go("defopen")});await p.waitForTimeout(500);ok("Defekt zeigt Reparaturzeit",/Reparaturzeit\s*2 Std 15 Min/.test(await p.textContent(".etc")),await p.textContent(".etc"));
 await p.screenshot({path:S+"rz_defekt.png",fullPage:true});
 /* Reparatur ändern: vorausgefüllt */
 await p.evaluate(()=>etDlg(defs.find(d=>d.id==="o1"),false));await p.waitForTimeout(500);ok("Ändern: Räder stehen auf 2 Std 15 Min",(await p.textContent("#etrzv"))==="2 Std 15 Min");
 await p.click("#etx");await p.waitForTimeout(200);
 /* Teil-Reparatur: Rest ohne Zeit */
 await p.evaluate(()=>db.doc("defekte/t3").set({by:"u1",t:Date.now()-9e5,done:false,art:"Schuko 10m",anr:"1080",ev:"Gala",n:3,fn:0,foto:false}));await p.waitForTimeout(400);
 await p.evaluate(()=>etDlg(defs.find(d=>d.id==="t3"),true,2));await p.waitForTimeout(400);await p.evaluate(()=>document.querySelector("#ets").closest(".ov").rz.set(40));await p.click("#ets");await p.waitForTimeout(1000);
 const all=await p.evaluate(()=>window.__T.docs.filter(r=>r.col==="defekte").map(r=>({id:r.id,...r.data})));const t3=all.find(x=>x.id==="t3"),rest=all.find(x=>x.teilVon==="t3");
 ok("Teil-Reparatur: 2 Stk mit 40 Min, Rest offen ohne Zeit",t3.rz===40&&t3.n===2&&rest&&!rest.rz&&rest.done===false&&rest.n===1);
 /* Werkstatt Übersicht */
 await p.evaluate(()=>{wsForce=true;wsTab=null;view="jarvis";draw()});await p.waitForTimeout(400);const ws=await p.textContent(".wscard.plain");
 ok("Werkstatt Übersicht: Reparaturzeit diese Woche 4 Std 25 Min",/Reparaturzeit4 Std 25 Min/.test(ws),ws.slice(0,120));
 ok("Zuletzt repariert mit Zeit",/2 Std 15 Min ·/.test(ws));await p.screenshot({path:S+"rz_ws.png",fullPage:true});
 await p.evaluate(()=>{wsForce=false});
 /* Ersatzteile-Bericht */
 const inf=await p.evaluate(()=>{const {rz,rzOhne}=etData(etRange("y"));return rz+"/"+rzOhne});ok("Bericht: Summe 315 Min, 1 ohne Zeit",inf==="315/1",inf);
 const b64=await p.evaluate(async()=>{const u=await etPdf("y",etRange("y"));let s="";for(let i=0;i<u.length;i+=8192)s+=String.fromCharCode(...u.subarray(i,i+8192));return btoa(s)});fs.writeFileSync(S+"rz_ersatz.pdf",Buffer.from(b64,"base64"));
 const pt=execSync("pdftotext -layout "+S+"rz_ersatz.pdf -").toString();ok("PDF: Kasten Reparaturzeit gesamt",/5 Std 15 Min/.test(pt)&&/Reparaturzeit \(1 ohne Zeit\)/.test(pt));
 ok("PDF: Zeit pro Reparatur",/Reparaturzeit\s+2 Std 15 Min/.test(pt)&&/Reparaturzeit\s+–/.test(pt));
 /* Wochenbericht */
 await p.setViewportSize({width:1100,height:1400});await p.evaluate(()=>go("wb"));await p.waitForTimeout(800);
 const W=await p.evaluate(()=>{const D=wbData();return{rep:D.rep,z:D.repZ}});ok("Wochenbericht: 2 Reparaturen letzte Woche, 50 Min",W.rep.length===2&&W.z===50,J(W));
 ok("Zeile mit Zeit und „ohne Zeit“ rot",W.rep[0].r==="50 Min"&&W.rep[1].r==="ohne Zeit"&&W.rep[1].cls==="red"&&/^2 × CEE/.test(W.rep[1].n));
 ok("im Bericht sichtbar",/Werkstatt – repariert · Reparaturzeit 50 Min/.test(await p.textContent("#app")));await p.screenshot({path:S+"rz_wb.png",fullPage:true});
 const wb64=await p.evaluate(async()=>{const u=await wbPdf(wbData());let s="";for(let i=0;i<u.length;i+=8192)s+=String.fromCharCode(...u.subarray(i,i+8192));return btoa(s)});fs.writeFileSync(S+"rz_wb.pdf",Buffer.from(wb64,"base64"));
 ok("Wochenbericht-PDF enthält die Liste",/Werkstatt – repariert · Reparaturzeit 50 Min/.test(execSync("pdftotext "+S+"rz_wb.pdf -").toString()));
 ok("keine JS-Fehler",!errs.length,errs.join("|"));await b.close();console.log(fail?"FEHLER: "+fail:"ALLES OK")})();
