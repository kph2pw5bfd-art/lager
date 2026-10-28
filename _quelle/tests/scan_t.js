const {chromium}=require("playwright");const fs=require("fs");const S="/tmp/claude-0/-home-claude/a6efebc1-256e-5874-b05e-dc76785976da/scratchpad/";
(async()=>{const b=await chromium.launch({args:["--use-fake-device-for-media-stream","--use-fake-ui-for-media-stream"]});const ctx=await b.newContext({viewport:{width:390,height:844},permissions:["camera"]});
 await ctx.addInitScript(()=>{window.__code=null;window.BarcodeDetector=class{async detect(){if(window.__code){const c=window.__code;window.__code=null;return[{rawValue:c}]}return[]}}});
 const p=await ctx.newPage();const errs=[];p.on("pageerror",e=>errs.push(e.message));
 await ctx.route("**/*",r=>{const u=r.request().url();
  if(u.startsWith("https://app.test/"))return r.fulfill({body:fs.readFileSync("/home/claude/gh/index.html"),contentType:"text/html"});
  if(u.includes("supabase-js"))return r.fulfill({body:fs.readFileSync(S+"fakesb.js"),contentType:"text/javascript"});
  return r.fulfill({status:404,body:""})});
 const ok=(t,c)=>console.log((c?"OK   ":"FEHLT")+" "+t);
 const it=()=>p.evaluate(()=>Object.fromEntries(Object.entries(rs.items).map(([k,v])=>[k+" "+v.name+" ("+v.g+")",v.q])));
 await p.goto("https://app.test/");await p.waitForTimeout(500);await p.mouse.click(200,400);await p.waitForTimeout(300);
 await p.click('[data-g="ret"]');await p.click('[data-rv="new"]');await p.fill("#rev","Scan-Test");await p.click("#rgo");await p.waitForTimeout(300);
 const btns=await p.$$eval("#rbody .mbtn",l=>l.map(x=>x.id+":"+x.textContent.trim()));console.log("   Knöpfe unten:",btns);ok("Scan-Knopf über Manuell-Knopf",btns[0].startsWith("rscanb")&&btns[1].startsWith("rman:")&&/Manuell eintragen/.test(btns[1]));
 await p.evaluate(()=>{const e=document.getElementById("rscanb");e.scrollIntoView();});await p.screenshot({path:S+"scan_knopf.png"});
 // 1) Code mit ID (Gedankenstrich)
 await p.click("#rscanb");await p.waitForTimeout(800);ok("Kamera öffnet",!!(await p.$(".rscan")));await p.screenshot({path:S+"scan_cam.png"});
 await p.evaluate(()=>window.__code="7009–12");await p.waitForTimeout(700);
 ok("Kamera nach Treffer zu",!(await p.$(".rscan")));const pad=await p.evaluate(()=>{const o=document.querySelector(".ov .card");return o&&o.textContent.slice(0,60)});console.log("   Zahlenfeld:",pad);ok("Zahlenfeld für 16A 100m",/16A 100m/.test(pad||""));
 await p.click('[data-pn="3"]');await p.click("#pdo");await p.waitForTimeout(300);
 // 2) Code ohne ID
 await p.click("#rscanb");await p.waitForTimeout(600);await p.evaluate(()=>window.__code="7009");await p.waitForTimeout(700);
 const pad2=await p.evaluate(()=>document.querySelector(".ov .card").textContent.slice(0,60));ok("Zweiter Scan zeigt 'bisher 3 Stück': "+pad2,/bisher 3/.test(pad2));await p.click('[data-pn="2"]');await p.click("#pdo");await p.waitForTimeout(300);
 // 3) Abbrechen
 await p.click("#rscanb");await p.waitForTimeout(600);await p.click(".rscan .lx");await p.waitForTimeout(200);ok("Abbrechen schließt Kamera",!(await p.$(".rscan")));
 // 4) unbekannter Code
 await p.click("#rscanb");await p.waitForTimeout(600);await p.evaluate(()=>window.__code="9876-3");await p.waitForTimeout(700);
 const msg=await p.evaluate(()=>{const o=document.querySelector(".ov");return o&&o.textContent});console.log("   Meldung:",msg);ok("Unbekannt-Meldung mit Manuell",/9876/.test(msg||"")&&/Manuell eintragen/.test(msg||""));
 await p.click("#a2y");await p.waitForTimeout(200);const nr=await p.inputValue("#mnr");ok("Nummer 9876 vorausgefüllt",nr==="9876");const ttl=await p.textContent(".ov b");ok("Titel: "+ttl,ttl==="Artikel manuell eintragen");
 await p.fill("#mnm","Testlampe");await p.fill("#mq","2");await p.click("#mok");await p.waitForTimeout(300);
 const I=await it();console.log("   Schein:",JSON.stringify(I));ok("Ergebnis 16A=5, Testlampe=2 (Manuell)",JSON.stringify(I)===JSON.stringify({"7009 16A 100m (Kabel)":5,"M:9876 Testlampe (Manuell)":2}));
 const live=await p.evaluate(()=>[...document.querySelectorAll("video")].filter(v=>v.srcObject&&v.srcObject.active).length);ok("Keine Kamera läuft mehr",live===0);
 console.log("Fehler:",errs);await b.close()})();
