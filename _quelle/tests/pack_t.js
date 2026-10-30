/* Test 1.57: Packlisten hochladen (echte epirent-PDF), ersetzen, Detail, Rechte-Raster, Jarvis-Panel + Briefing.
   pdf.js kommt im Test aus /opt/npm-tools (6.x) statt vom CDN (4.10.38). Pfade über Umgebungsvariable SP (fakesb.js, pk_beispiel.pdf). */
const {chromium}=require("playwright");const fs=require("fs");const S=(process.env.SP||"/tmp")+"/";const PJ="/opt/npm-tools/node_modules/pdfjs-dist/legacy/build/";
const day=864e5,t0=new Date();t0.setHours(0,0,0,0);const T0=t0.getTime();
const seed=[
 {col:"pack",id:"p_back",data:{ord:"2601200-01",ps:"111",ev:"Stadtfest Graz",pl:"Anna PL",db:T0-5*day+8*36e5,de:T0+17*36e5,pos:[{p:"1.1",n:4,u:"Stk",t:"Kabel",a:"1097",f:0}],by:"u1",t:Date.now()}},
 {col:"pack",id:"p_over",data:{ord:"2601300-01",ps:"222",ev:"Ice Magic Innsbruck",pl:"Max PL",db:T0-9*day,de:T0-3*day+18*36e5,pos:[{p:"1.1",n:2,u:"Stk",t:"VT",a:"1048",f:0}],by:"u1",t:Date.now()}},
 {col:"pack",id:"p_done",data:{ord:"2601400-01",ps:"333",ev:"Gala Wien",pl:"Max PL",db:T0-9*day,de:T0-4*day,pos:[{p:"1.1",n:2,u:"Stk",t:"VT",a:"1048",f:0}],by:"u1",t:Date.now()}},
 {col:"pack",id:"p_next",data:{ord:"2601500-01",ps:"444",ev:"Messe Linz",pl:"Max PL",db:T0+3*day,de:T0+6*day,pos:[{p:"1.1",n:2,u:"Stk",t:"VT",a:"1048",f:1}],by:"u1",t:Date.now()}},
 {col:"titel",id:"lagerarbeiter",data:{name:"Lagerarbeiter",o:3,r:{ret_s:true}}},
 {col:"retour",id:"r1",data:{ev:"Gala Wien",ord:"2601400-01",itemsJson:"{}",by:"u1",t:Date.now()-day,closed:true,closedT:Date.now()-day}},
 {col:"retour",id:"r2",data:{ev:"Ice Magic",ord:"260130001",itemsJson:"{}",by:"u1",t:Date.now()-day}}];
(async()=>{const b=await chromium.launch();const ctx=await b.newContext({viewport:{width:390,height:844}});
 await ctx.addInitScript(()=>{window.__said=[];localStorage.setItem("tpc_jv_engine","device");const V=[{name:"Google Deutsch",lang:"de-DE",voiceURI:"g",localService:true}];window.SpeechSynthesisUtterance=class{constructor(t){this.text=t}};
  Object.defineProperty(window,"speechSynthesis",{configurable:true,value:{getVoices:()=>V,addEventListener(){},cancel(){},speak(u){__said.push(u.text);setTimeout(()=>u.onend&&u.onend(),5)}}})});
 const p=await ctx.newPage();const errs=[];p.on("pageerror",e=>errs.push(e.message));p.on("response",r=>{if(r.status()===404)errs.push("404: "+r.url())});
 const fk=fs.readFileSync(S+"fakesb.js","utf8").replace("const T={docs:[]","const T={docs:"+JSON.stringify(seed));
 await ctx.route("**/*",r=>{const u=r.request().url();if(u.startsWith("https://app.test/"))return r.fulfill({body:fs.readFileSync("/home/claude/gh/index.html"),contentType:"text/html"});
  if(u.includes("supabase-js"))return r.fulfill({body:fk,contentType:"text/javascript"});
  const m=u.match(/pdfjs-dist@4\.10\.38\/legacy\/build\/(pdf(?:\.worker)?\.min\.mjs)$/);if(m&&u.includes("jsdelivr"))return r.fulfill({body:fs.readFileSync(PJ+m[1]),contentType:"text/javascript",headers:{"access-control-allow-origin":"*"}});
  return r.fulfill({status:404,body:""})});
 await p.goto("https://app.test/");await p.waitForTimeout(800);await p.mouse.click(195,420);await p.waitForTimeout(400);
 console.log("Version:",await p.evaluate(()=>APPV));
 console.log("Karte Hauptseite:",(await p.textContent('[data-g="pack"]')).replace(/\s+/g," ").trim());
 await p.click('[data-g="pack"]');await p.waitForTimeout(300);await p.click("#pkall");await p.waitForTimeout(200);
 console.log("Liste Aktuell:",(await p.$$eval(".pkh",l=>l.map(x=>x.textContent.replace(/\s+/g," ")))).join(" | "));
 await p.setInputFiles("#pkfile",S+"kaputt.pdf");await p.waitForTimeout(2500);console.log("Falsche PDF →",await p.evaluate(()=>{const e=document.querySelector(".eov");const t=e&&e.textContent.replace(/\s+/g," ").trim();if(e)e.remove();return t}));
 await p.setInputFiles("#pkfile",S+"pk_beispiel.pdf");await p.waitForSelector("#pkok",{timeout:15000});
 console.log("Dialog:",(await p.textContent(".ov .card")).replace(/\s+/g," ").trim());await p.screenshot({path:S+"pk_dialog.png"});
 await p.click("#pkok");await p.waitForTimeout(500);
 const d=await p.evaluate(()=>__T.docs.find(x=>x.col==="pack"&&x.id==="20260714"));console.log("Gespeichert:",d?Object.keys(d.data).join(","):"NEIN","| Positionen:",d&&d.data.pos.length,"| Kunde im Datensatz:",JSON.stringify(d&&d.data).includes("Krippenzauber")?"JA (Fehler)":"nein");
 console.log("Liste danach:",(await p.$$eval(".pkh",l=>l.map(x=>x.textContent.replace(/\s+/g," ")))).join(" | "));
 await p.setInputFiles("#pkfile",S+"pk_beispiel.pdf");await p.waitForSelector("#pkok",{timeout:15000});console.log("Nochmal hochladen:",(await p.textContent(".pkold")).trim(),"| Knopf:",await p.textContent("#pkok"));await p.click("#pkok");await p.waitForTimeout(400);
 console.log("Anzahl Packlisten:",await p.evaluate(()=>__T.docs.filter(x=>x.col==="pack").length));
 await p.screenshot({path:S+"pk_liste.png",fullPage:true});
 await p.click('[data-pk="20260714"]');await p.waitForTimeout(300);console.log("Detail Kopf:",(await p.textContent("#app .card")).replace(/\s+/g," ").slice(0,330));
 console.log("Fremd-Zeilen:",(await p.$$eval(".pkp",l=>l.filter(x=>x.querySelector("em")).map(x=>x.textContent.replace(/\s+/g," ")))).join(" | "));
 await p.screenshot({path:S+"pk_detail.png",fullPage:true});
 await p.click("#bk");await p.waitForTimeout(200);await p.click('[data-pkf="done"]');await p.waitForTimeout(100);console.log("Erledigt:",(await p.$$eval("[data-pk]",l=>l.map(x=>x.dataset.pk))).join(","));
 await p.click('[data-pkf="aktuell"]');await p.waitForTimeout(100);await p.click('[data-pk="p_over"]');await p.waitForTimeout(200);console.log("Überfällig-Detail Retourschein-Knopf:",await p.evaluate(()=>[...document.querySelectorAll("[data-pkr]")].map(x=>x.textContent).join("|")));
 await p.evaluate(()=>{view="start";hist=[];draw()});await p.waitForTimeout(200);console.log("Karte jetzt:",(await p.textContent('[data-g="pack"]')).replace(/\s+/g," ").trim());
 await p.click('[data-g="jarvis"]');await p.waitForTimeout(400);
 console.log("Jarvis Packlisten-Panel:",await p.evaluate(()=>{const s=[...document.querySelectorAll(".jvpn")].find(x=>x.textContent.includes("Packlisten"));return s?s.innerText.replace(/\s+/g," "):"FEHLT"}));
 await p.screenshot({path:S+"pk_jarvis.png",fullPage:true});
 for(const st of ["frech","frech","sachlich"]){await p.evaluate(s=>{localStorage.setItem("tpc_jv_style",s);__said.length=0},st);await p.click("#jvsp");await p.waitForTimeout(3500);console.log("-- Briefing "+st+":\n   "+(await p.evaluate(()=>__said)).join("\n   "))}
 await p.click('[data-jp="p_over"]');await p.waitForTimeout(200);console.log("Tipp im Jarvis →",await p.evaluate(()=>view+" "+curPack));
 await p.evaluate(()=>{view="users";hist=["start"];draw()});await p.waitForTimeout(300);
 console.log("Rechte-Raster Packlisten:",await p.evaluate(()=>{const r=[...document.querySelectorAll(".rmr")].filter(x=>x.textContent.includes("Packlisten"));return r.length?r.length+"× – "+r[0].textContent.replace(/\s+/g," "):"FEHLT"}));
 await p.evaluate(()=>{const d=document.querySelector("details.rxd")||document.querySelector("details");if(d)d.open=true;const r=[...document.querySelectorAll(".rmr")].find(x=>x.textContent.includes("Packlisten"));if(r)r.scrollIntoView()});await p.screenshot({path:S+"pk_rechte.png"});
 console.log("Fehler (ohne erwartete 404 anderer Bibliotheken):",errs.filter(e=>!/barcode-detector|zxing|exceljs/.test(e)));await b.close()})();
