/* Test 1.102: Datensicherung + Papierkorb in der App-Verwaltung (Admin) */
const {chromium}=require("playwright");const fs=require("fs");const S=(process.env.SP||"/tmp")+"/";
const t0=new Date();t0.setHours(0,0,0,0);const T0=t0.getTime(),day=864e5;
const seed=[{col:"pack",id:"P1",data:{ord:"260111401",ps:"P1",ev:"Winterwunder",pl:"Marvin Wellisch",db:T0+8*36e5,de:T0+60*day,pos:[{p:"1",n:2,u:"Stk",t:"Kabel",a:"1098",f:0}],by:"u1",t:Date.now()}},
 {col:"packh",id:"P1",data:{h_1:{ok:true,by:"u1",t:1}}},{col:"retour",id:"r1",data:{ev:"Messe Linz",ord:"26001",items:{},by:"u1",t:Date.now()}},{col:"fotos",id:"r1-0",data:{d:"data:x"}}];
let bad=0;const ok=(c,m,x)=>{console.log((c?"OK   ":"FEHLER")+" "+m+(x!==undefined?": "+x:""));if(!c)bad++};
(async()=>{const b=await chromium.launch();const ctx=await b.newContext({viewport:{width:390,height:844},acceptDownloads:true});
 const p=await ctx.newPage();const errs=[];p.on("pageerror",e=>errs.push(e.message));const toasts=[];
 await p.exposeFunction("__toast",t=>toasts.push(t));await ctx.addInitScript(()=>{new MutationObserver(m=>m.forEach(x=>x.addedNodes.forEach(n=>{if(n.classList&&n.classList.contains("toast"))window.__toast(n.textContent)}))).observe(document,{childList:true,subtree:true})});
 const fk=fs.readFileSync(S+"fakesb.js","utf8").replace("const T={docs:[]","const T={docs:"+JSON.stringify(seed));
 await ctx.route("**/*",r=>{const u=r.request().url();if(u.startsWith("https://app.test/"))return r.fulfill({body:fs.readFileSync("/home/claude/gh/index.html"),contentType:"text/html"});if(u.includes("supabase-js"))return r.fulfill({body:fk,contentType:"text/javascript"});return r.fulfill({status:404,body:""})});
 await p.goto("https://app.test/");await p.waitForTimeout(900);await p.mouse.click(195,420);await p.waitForTimeout(600);
 ok(await p.evaluate(()=>APPV)==="1.107","Version 1.107");
 ok(toasts.some(t=>/Datensicherung: letzte manuelle noch nie/.test(t)),"Hinweis auf der Hauptseite",toasts.join(" | "));
 /* Packliste und Retourschein löschen */
 await p.evaluate(async()=>{await db.doc("pack/P1").delete();await db.doc("packh/P1").delete();await db.doc("retour/r1").delete();await db.doc("fotos/r1-0").delete()});
 ok(await p.evaluate(()=>__T.papierkorb.length)===4,"Löschen landet im Papierkorb");
 await p.evaluate(()=>go("appv"));await p.waitForTimeout(500);
 const st=await p.textContent("#bkst");ok(/noch keine/.test(st),"Stand: automatische Sicherung noch nicht eingerichtet",st);
 ok(/\(2\)|\(4\)/.test(await p.textContent("#bktr")),"Papierkorb-Zähler",await p.textContent("#bktr"));
 /* Papierkorb öffnen */
 await p.click("#bktr");await p.waitForTimeout(300);
 const rows=await p.evaluate(()=>[...document.querySelectorAll(".bkrow .bkt")].map(e=>e.innerText.replace(/\s+/g," ")));console.log("Papierkorb:",rows.join(" || "));
 ok(rows.length===2,"Fotos und Herricht-Stand hängen am Haupteintrag (2 Zeilen)");
 ok(rows.some(r=>/Retourschein Messe Linz Auftrag 26001 .*mit 1 Foto/.test(r)),"Retourschein mit Foto");
 ok(rows.some(r=>/Packliste Winterwunder .*mit Herricht-Stand/.test(r)),"Packliste mit Herricht-Stand");
 await p.fill("#bkq","linz");await p.waitForTimeout(100);ok(await p.$$eval(".bkrow",e=>e.length)===1,"Suche");await p.fill("#bkq","");await p.waitForTimeout(100);
 await p.screenshot({path:S+"sicher_korb.png"});
 await p.click('.bkrow:has-text("Winterwunder") [data-bkr]');await p.waitForTimeout(200);await p.click(".ov:last-of-type .btn:has-text('Ja'), #aok, .ov:last-of-type button.btn:not(.ghost)").catch(()=>{});await p.waitForTimeout(500);
 ok(await p.evaluate(()=>__T.docs.filter(d=>d.id==="P1").length)===2,"Packliste + Herricht-Stand wiederhergestellt");
 ok(await p.$$eval(".bkrow",e=>e.length)===1,"nur noch der Retourschein im Korb");
 ok(toasts.some(t=>/Wiederhergestellt \(2 Einträge\)/.test(t)),"Meldung Wiederhergestellt",toasts.slice(-1)[0]);
 await p.click("#bkx");
 /* Stand mit gelaufener Sicherung */
 await p.evaluate(()=>{__T.bk=1;__T.bkT=new Date(Date.now()-3*36e5).toISOString();__T.bkN=5;go("start");go("appv")});await p.waitForTimeout(500);
 ok(/zuletzt heute.*5 Einträge/.test(await p.textContent("#bkst")),"Stand: zuletzt heute",await p.textContent("#bkst"));
 await p.evaluate(()=>{__T.bkT=new Date(Date.now()-3*864e5).toISOString()});
 await p.evaluate(()=>{go("start");go("appv")});await p.waitForTimeout(500);ok(!!(await p.$("#bkst .bkw")),"Sicherung älter als 2 Tage rot");
 /* Herunterladen */
 const [dl]=await Promise.all([p.waitForEvent("download"),p.click("#bkdl")]);const fp=S+"bk.json";await dl.saveAs(fp);const J=JSON.parse(fs.readFileSync(fp,"utf8"));
 ok(/^TPC-Lager-Sicherung_\d{4}-\d\d-\d\d\.json$/.test(dl.suggestedFilename()),"Dateiname",dl.suggestedFilename());
 ok(J.anzahl===J.docs.length&&J.docs.some(d=>d.id==="P1")&&J.profile.length===1,"Datei enthält alle Einträge + Profile",J.anzahl);
 ok(await p.textContent("#bkll")==="heute","„Zuletzt auf diesem Gerät: heute“");
 /* Nicht-Admin sieht nichts */
 ok(await p.evaluate(()=>{realOwner=false;go("start");go("appv");return !document.querySelector("#bkdl")}),"ohne Admin kein Abschnitt");
 ok(!errs.length,"keine JS-Fehler",errs.join(" | "));
 console.log("FEHLER GESAMT:",bad);await b.close()})();
