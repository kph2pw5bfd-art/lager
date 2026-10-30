/* Test 1.75: Hauptseite sortieren – Vorschlag nach Titel, Vorgabe pro Titel, eigene Reihenfolge (SP = Ordner mit fakesb.js) */
const {chromium}=require("playwright");const fs=require("fs");const S=(process.env.SP||"/tmp")+"/";
const R={jv_s:true,pk_s:true,ret_s:true,ret_b:true,def_s:true,inf_s:true};
const seed=[{col:"titel",id:"tl",data:{name:"Lagerarbeiter",o:1,r:R}},{col:"titel",id:"tm",data:{name:"Monteur",o:2,r:R}},{col:"titel",id:"tw",data:{name:"Werkstatt",o:3,r:R}},
 {col:"rolle",id:"u1",data:{t:"tm",x:{}}}];
(async()=>{const b=await chromium.launch();const ctx=await b.newContext({viewport:{width:390,height:844}});const p=await ctx.newPage();const errs=[];p.on("pageerror",e=>errs.push(e.message));
 const fk=fs.readFileSync(S+"fakesb.js","utf8").replace("const T={docs:[]","const T={docs:"+JSON.stringify(seed));
 await ctx.route("**/*",r=>{const u=r.request().url();if(u.startsWith("https://app.test/"))return r.fulfill({body:fs.readFileSync("/home/claude/gh/index.html"),contentType:"text/html"});if(u.includes("supabase-js"))return r.fulfill({body:fk,contentType:"text/javascript"});return r.fulfill({status:404,body:""})});
 await p.goto("https://app.test/");await p.waitForTimeout(900);await p.mouse.click(195,420);await p.waitForTimeout(500);
 const order=async()=>{await p.evaluate(()=>{view="start";hist=[];draw()});await p.waitForTimeout(150);return (await p.$$eval(".hgrid > [data-g]",l=>l.map(x=>x.querySelector("b").textContent))).join(" › ")};
 console.log("Titel Monteur (Vorschlag):",await order());
 await p.evaluate(()=>db.doc("rolle/u1").update({t:"tw"}));await p.waitForTimeout(300);console.log("Titel Werkstatt (Vorschlag):",await order());
 await p.evaluate(()=>db.doc("rolle/u1").update({t:"tl"}));await p.waitForTimeout(300);console.log("Titel Lagerarbeiter (Vorschlag):",await order());
 /* Vorgabe im Titel ändern: Benutzerverwaltung → Lagerarbeiter aufklappen → „Defekt melden“ nach oben */
 await p.evaluate(()=>{view="users";draw()});await p.waitForTimeout(400);
 await p.evaluate(()=>document.querySelector('details[data-tbox="tl"]').open=true);await p.waitForTimeout(100);
 await p.click('[data-hobox="t:tl"] [data-hk="defnew"][data-hmv="-1"]');await p.waitForTimeout(400);
 console.log("Titel gespeichert:",await p.evaluate(()=>JSON.stringify(TIT.tl.ho)));
 await p.screenshot({path:S+"home_titel.png",fullPage:true});
 console.log("Lagerarbeiter nach Titel-Änderung:",await order());
 /* eigene Reihenfolge in den Einstellungen */
 await p.evaluate(()=>{view="art";draw()});await p.waitForTimeout(300);
 await p.click('[data-hobox="me"] [data-hk="new"][data-hmv="-1"]');await p.waitForTimeout(400);
 await p.click('[data-hobox="me"] [data-hk="new"][data-hmv="-1"]');await p.waitForTimeout(400);
 console.log("Eigene gespeichert:",await p.evaluate(()=>JSON.stringify(HORD.u1&&HORD.u1.o)));
 await p.screenshot({path:S+"home_einst.png",fullPage:true});
 console.log("Hauptseite mit eigener:",await order());
 await p.evaluate(()=>{view="art";draw()});await p.waitForTimeout(300);await p.click("#hoback");await p.waitForTimeout(400);
 console.log("Zurück zum Titel:",await order());
 await p.evaluate(()=>{view="users";draw()});await p.waitForTimeout(300);await p.evaluate(()=>document.querySelector('details[data-tbox="tl"]').open=true);await p.click('[data-hor="tl"]');await p.waitForTimeout(400);
 console.log("Vorschlag wiederhergestellt:",await order());
 console.log("Fehler:",errs);await b.close()})();
