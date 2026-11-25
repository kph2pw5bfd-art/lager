/* Test 1.191: Auftrag suchen (Lager Übersicht) + Auftrags-Seite (SP = Ordner mit fakesb.js) */
const {chromium}=require("playwright");const fs=require("fs");const S=(process.env.SP||"/tmp")+"/";const J=o=>JSON.stringify(o);
const now=Date.now(),day=864e5;
const seed=[
 {col:"pack",id:"A",data:{ord:"260130001",ps:"14402",ev:"Gala Wien 2026",pl:"Max Muster",db:now-9*day,de:now-3*day,pos:[{p:"1",n:4,u:"Stk",t:"Verteiler 63A",a:"1048",f:0},{p:"2",n:6,u:"Stk",t:"Schuko 20m",a:"1081",f:0}],zus:[{ps:"14455",t:now-8*day,by:"u1",pos:[{p:"1",n:2,u:"Stk",t:"Schuko 20m",a:"1081",f:0}]}],by:"u1",t:now-10*day}},
 {col:"packh",id:"A",data:{c:1,h_1:{ok:true,by:"u1",t:1},h_2:{ok:true,by:"u1",t:1},h_z14455_1:{ok:true,by:"u1",t:1},fin:{by:"u1",t:now-9*day},hi_a:{txt:"Bühne hinten",by:"u1",t:now-9*day},n_x:{txt:"Abbau verschoben",by:"u1",t:now-5*day}}},
 {col:"pack",id:"B",data:{ord:"260131447",ps:"14600",ev:"Weihnachtsgala Hofburg",pl:"Heinz Tester",db:now-2*day,de:now+20*day,pos:[{p:"1",n:3,u:"Stk",t:"Schuko 20m",a:"1081",f:0}],by:"u1",t:now-3*day}},
 {col:"retour",id:"rT",data:{ev:"Gala Wien 2026",ord:"260130001",by:"u1",t:now-6*day,closed:true,art:"teil",closedT:now-6*day,closedBy:"u1",itemsJson:J({"1081":{nr:"1081",name:"Schuko 20m",g:"Kabel",q:4}})}},
 {col:"retour",id:"rE",data:{ev:"Gala Wien 2026",ord:"260130001",by:"u1",t:now-2*day,closed:true,art:"end",closedT:now-2*day,closedBy:"u1",fotos:["f1"],itemsJson:J({"1081":{nr:"1081",name:"Schuko 20m",g:"Kabel",q:2},"1048":{nr:"1048",name:"Verteiler 63A",g:"Verteiler",q:4}})}},
 {col:"retour",id:"rX",data:{ev:"Messe Linz",ord:"777001",by:"u1",t:now-day,closed:false,itemsJson:"{}"}},
 {col:"defekte",id:"d1",data:{by:"u1",t:now-2*day,done:false,art:"Verteiler 63A",anr:"1048",ev:"Gala Wien 2026",ord:"260130001",desc:"FI löst aus",urg:true,n:1,fn:0}},
 {col:"defekte",id:"d2",data:{by:"u1",t:now-2*day,done:true,doneBy:"u1",doneT:now-day,art:"Schuko 20m",ev:"Gala Wien 2026",ret:"rE",desc:"Kupplung",rep:"Kupplung getauscht",et:[{n:2,u:"Stk",nm:"Kupplung"}],rz:45,n:2,fn:0}},
 {col:"lists",id:"L1",data:{mode:"bleibt",ev1:"Gala Wien 2026",ord1:"260130001",ev2:"",ord2:"",by:"u1",t:now-4*day,itemsJson:J({a:{art:"1081",name:"Schuko",q:3}})}},
 {col:"infos",id:"i1",data:{by:"u1",t:now-5*day,text:"Kabeltrommel von Gala Wien 2026 bleibt bis Montag",fn:0,foto:false,read:false,readBy:"",readT:0,reply:"",replyT:0}},
 {col:"plaw",id:"pa1",data:{pk:"A",typ:"msg",txt:"Bitte Kabel zählen",by:"u1",t:now-day}}];
(async()=>{const b=await chromium.launch();let fail=0;const ok=(t,c,x)=>{if(!c)fail++;console.log((c?"OK   ":"FEHLT")+" "+t+(x!==undefined?" → "+x:""))};const errs=[];
 const ctx=await b.newContext({viewport:{width:390,height:900}});const p=await ctx.newPage();p.on("pageerror",e=>errs.push(e.message+" "+(e.stack||"").split("\n").slice(1,3).join(" ")));
 const fk=fs.readFileSync(S+"fakesb.js","utf8").replace("const T={docs:[]","const T={docs:"+J(seed));
 await ctx.route("**/*",r=>{const u=r.request().url();if(u.startsWith("https://app.test/"))return r.fulfill({body:fs.readFileSync("/home/claude/gh/index.html"),contentType:"text/html"});if(u.includes("supabase-js"))return r.fulfill({body:fk,contentType:"text/javascript"});return r.fulfill({status:404,body:""})});
 await p.goto("https://app.test/");await p.waitForTimeout(1200);await p.mouse.click(200,400);await p.waitForTimeout(400);
 ok("Version ab 1.191",await p.evaluate(()=>+APPV.split(".")[1]>=191));
 await p.evaluate(()=>{view="jarvis";draw()});await p.waitForTimeout(400);
 ok("Suchfeld in der Kopfkarte unter dem Frag-Feld",await p.evaluate(()=>{const s=document.querySelector(".jvhead #aufs");return !!s&&s.previousElementSibling.classList.contains("jvopts")}));
 const hits=async q=>{await p.fill("#aufq",q);await p.waitForTimeout(250);return p.evaluate(()=>[...document.querySelectorAll("#aufsug .aufr b")].map(b=>b.textContent))};
 let h=await hits("gala");ok("„gala“: beide Galas, keine doppelt",h.length===2&&h.includes("Gala Wien 2026")&&h.includes("Weihnachtsgala Hofburg"),J(h));
 ok("Gruppen Laufend / Erledigt",await p.evaluate(()=>[...document.querySelectorAll("#aufsug .aufg")].map(g=>g.textContent).join("|")).then(t=>/LAUFEND/.test(t)));
 ok("Markierung",await p.evaluate(()=>!!document.querySelector("#aufsug mark")));
 await p.screenshot({path:S+"auf_suche.png"});
 h=await hits("14455");ok("Packschein-Nr. eines Zusatzes findet den Auftrag",J(h)===J(["Gala Wien 2026"]),J(h));
 h=await hits("heinz");ok("Projektleiter",J(h)===J(["Weihnachtsgala Hofburg"]),J(h));
 h=await hits("130001");ok("Auftragsnummer teilweise",J(h)===J(["Gala Wien 2026"]),J(h));
 h=await hits("linz");ok("nur Retourschein (ohne Packliste)",J(h)===J(["Messe Linz"]),J(h));
 h=await hits("xyz");ok("nichts gefunden",/Kein Auftrag gefunden/.test(await p.textContent("#aufsug")));
 await hits("gala wien");await p.click('#aufsug [data-aufo="0"]');await p.waitForTimeout(500);
 ok("Treffer öffnet Auftrags-Seite",await p.evaluate(()=>view==="auftr"&&curAuf==="o:260130001"));
 const t=await p.textContent("#app");
 ok("Kopf: Veranstaltung, Auftrag, PL",/Gala Wien 2026/.test(t)&&/Auftrag 260130001/.test(t)&&/PL Max M/.test(t));
 ok("Schild „1 Defekt offen“ + Zu prüfen",/1 Defekt offen/.test(t)&&/Zu prüfen/.test(t));
 const secs=await p.evaluate(()=>[...document.querySelectorAll(".afsec h3")].map(h=>h.textContent));
 ok("Bereiche",J(secs)===J(["Packschein und Herrichten","Retourscheine und Abgleich","Defekte (2 · 1 offen)","Material vor Ort","Nachrichten und Notizen"]),J(secs));
 ok("Packschein + Zusatz + Info",/Packschein 14402/.test(t)&&/Zusatz 14455/.test(t)&&/Bühne hinten/.test(t));
 ok("Teil- und Endretoure + Abgleich",/Teilretoure/.test(t)&&/Endretoure/.test(t)&&/Abgleich mit Retouren/.test(t)&&/1 Foto/.test(t));
 ok("Defekte: offen dringend + repariert mit 45 Min",/OFFEN · DRINGEND/.test(t)&&/REPARIERT/.test(t)&&/45 Min/.test(t));
 ok("Material vor Ort",/Material bleibt vor Ort/.test(t));
 ok("Nachrichten: PL, Notiz, Info",/Bitte Kabel zählen/.test(t)&&/Abbau verschoben/.test(t)&&/Kabeltrommel/.test(t));
 ok("Verlauf",await p.evaluate(()=>document.querySelectorAll("#af_ver div").length>=6));
 ok("Sprungknöpfe",await p.evaluate(()=>document.querySelectorAll("[data-afj]").length===6));
 ok("kein seitliches Scrollen",await p.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));
 await p.screenshot({path:S+"auf_seite.png",fullPage:true});
 /* Antippen öffnet */
 const back=async()=>{await p.evaluate(()=>{curAuf="o:260130001";view="auftr";draw()});await p.waitForTimeout(300)};
 await p.click('[data-afdef="d1"]');await p.waitForTimeout(400);ok("Defekt öffnen",await p.evaluate(()=>view==="defopen"&&curDef==="d1"));await back();
 await p.click('[data-afret="rE"]');await p.waitForTimeout(400);ok("Retourschein öffnen",await p.evaluate(()=>view==="retopen"&&curRet==="rE"));await back();
 await p.click('[data-afpk="A"]');await p.waitForTimeout(400);ok("Packliste öffnen",await p.evaluate(()=>view==="packopen"&&curPack==="A"));await back();
 await p.click('[data-afabg="A"]');await p.waitForTimeout(400);ok("Abgleich öffnen",await p.evaluate(()=>view==="pkabg"));await back();
 await p.click('[data-aflist="L1"]');await p.waitForTimeout(400);ok("Materialliste öffnen",await p.evaluate(()=>view==="scan"&&cur==="L1"));
 /* Auftrag nur mit Retourschein */
 await p.evaluate(()=>{curAuf="o:777001";view="auftr";draw()});await p.waitForTimeout(300);ok("Auftrag ohne Packliste: Retourschein offen",/Messe Linz/.test(await p.textContent("#app"))&&/Retourschein offen/.test(await p.textContent("#app")));
 await p.emulateMedia({colorScheme:"dark"});await p.evaluate(()=>{curAuf="o:260130001";view="auftr";draw()});await p.waitForTimeout(300);await p.screenshot({path:S+"auf_dark.png",fullPage:true});
 /* 1.192: Projektleiter (nur Recht Aufträge + Lager Übersicht) */
 {const docs=seed.concat([{col:"titel",id:"tpl",data:{name:"Projektleiter",o:6,r:{jv_s:true,au_s:true,au_b:true}}},{col:"rolle",id:"u1",data:{t:"tpl"}}]);
  const fk2=fs.readFileSync(S+"fakesb.js","utf8").replace("const T={docs:[]","const T={docs:"+J(docs)).replace('role:"admin"','role:"user"');
  const c2=await b.newContext({viewport:{width:390,height:900}});const q=await c2.newPage();q.on("pageerror",e=>errs.push("PL: "+e.message));
  await c2.route("**/*",r=>{const u=r.request().url();if(u.startsWith("https://app.test/"))return r.fulfill({body:fs.readFileSync("/home/claude/gh/index.html"),contentType:"text/html"});if(u.includes("supabase-js"))return r.fulfill({body:fk2,contentType:"text/javascript"});return r.fulfill({status:404,body:""})});
  await q.goto("https://app.test/");await q.waitForTimeout(1200);await q.mouse.click(200,400);await q.waitForTimeout(400);
  await q.evaluate(()=>{view="jarvis";draw()});await q.waitForTimeout(500);
  ok("PL: Projektleiter Übersicht mit Suchfeld",await q.evaluate(()=>!!document.querySelector("#plv .jvhead #aufs")));
  await q.fill("#aufq","gal");await q.waitForTimeout(200);await q.evaluate(()=>draw());await q.waitForTimeout(300);
  ok("PL: Eingabe + Fokus bleiben beim Neuzeichnen",await q.evaluate(()=>document.activeElement&&document.activeElement.id==="aufq"&&document.activeElement.value==="gal"&&!document.querySelector("#aufsug").hidden));
  const hh=await q.evaluate(()=>[...document.querySelectorAll("#aufsug .aufr b")].map(b=>b.textContent));ok("PL: findet alle Aufträge",hh.includes("Gala Wien 2026")&&hh.includes("Weihnachtsgala Hofburg"),J(hh));
  await q.screenshot({path:S+"auf_pl_suche.png"});
  await q.click('#aufsug [data-aufo]:has-text("Gala Wien 2026")');await q.waitForTimeout(500);
  const tt=await q.textContent("#app");ok("PL: Seite offen, Kopf da",await q.evaluate(()=>view==="auftr")&&/Gala Wien 2026/.test(tt)&&/Auftrag 260130001/.test(tt));
  const nor=await q.evaluate(()=>[...document.querySelectorAll(".afsec")].filter(s=>s.querySelector(".afnor")).map(s=>s.querySelector("h3").textContent));
  ok("PL: Packschein und Retourscheine „Keine Berechtigung“",J(nor)===J(["Packschein und Herrichten","Retourscheine und Abgleich"]),J(nor));
  ok("PL: zurück/Fehlmaterial als –",await q.evaluate(()=>[...document.querySelectorAll(".afnum b")].map(b=>b.textContent).slice(1,3).join(",")==="–,–"));
  ok("PL: Nachrichten sichtbar",/Bitte Kabel zählen/.test(tt));
  await q.screenshot({path:S+"auf_pl_seite.png",fullPage:true});
  await q.click("[data-afau]");await q.waitForTimeout(400);ok("PL: „In Meine Aufträge öffnen“",await q.evaluate(()=>view==="auopen"&&curAu==="A"));
  await c2.close()}
 ok("keine JS-Fehler",!errs.length,errs.join(" | "));await b.close();console.log(fail?"FEHLER: "+fail:"ALLES OK")})();
