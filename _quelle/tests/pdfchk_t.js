/* Test 1.166: kaputte/leere PDF -> klare Meldung, Base64/Vorspann werden repariert */
const {chromium}=require("playwright");const fs=require("fs");const S=(process.env.SP||"/tmp")+"/";
(async()=>{const b=await chromium.launch();let fail=0;const ok=(t,c)=>{if(!c)fail++;console.log((c?"OK   ":"FEHLT")+" "+t)};const errs=[];
 const fk=fs.readFileSync(S+"fakesb.js","utf8");
 const ctx=await b.newContext({viewport:{width:390,height:844}});const p=await ctx.newPage();p.on("pageerror",e=>errs.push(e.message));
 await ctx.route("**/*",r=>{const u=r.request().url();if(u.startsWith("https://app.test/"))return r.fulfill({body:fs.readFileSync("/home/claude/gh/index.html"),contentType:"text/html"});if(u.includes("supabase-js"))return r.fulfill({body:fk,contentType:"text/javascript"});return r.fulfill({status:404,body:""})});
 await p.goto("https://app.test/");await p.waitForTimeout(800);await p.mouse.click(200,400);await p.waitForTimeout(300);
 const r=await p.evaluate(()=>{const E=s=>new TextEncoder().encode(s),t=f=>{try{const o=f();return new TextDecoder("latin1").decode(o.subarray(0,8))}catch(e){return "ERR:"+e.message}};
  return{leer:t(()=>pkBytes(new Uint8Array(0))),html:t(()=>pkBytes(E("<html>login</html>"))),txt:t(()=>pkBytes(E("hallo welt"))),ok:t(()=>pkBytes(E("%PDF-1.4 x"))),vor:t(()=>pkBytes(E("Content-Type: x\r\n\r\n%PDF-1.7 y"))),b64:t(()=>pkBytes(E(btoa("%PDF-1.5 abc")+"\r\n")))}});
 console.log("  ",JSON.stringify(r));
 ok("leer erkannt",r.leer==="ERR:leer");ok("Webseite erkannt",r.html==="ERR:html");ok("keine PDF",r.txt==="ERR:kein");ok("normale PDF bleibt",r.ok.startsWith("%PDF-1.4"));ok("Vorspann abgeschnitten",r.vor.startsWith("%PDF-1.7"));ok("Base64 entpackt",r.b64.startsWith("%PDF-1.5"));
 await p.evaluate(()=>{view="packall";draw()});await p.waitForTimeout(300);
 await p.setInputFiles("#pkfile",{name:"Packliste.pdf",mimeType:"application/pdf",buffer:Buffer.alloc(0)});await p.waitForTimeout(500);
 const m=await p.evaluate(()=>document.body.innerText);ok("Meldung leer + Tipp, kein Internet-Hinweis",/leer angekommen/.test(m)&&/zuerst speichern/.test(m)&&!/Internetverbindung/.test(m));
 await p.screenshot({path:S+"pdfchk.png"});ok("Keine JS-Fehler "+errs.join("|"),!errs.length);await b.close();console.log(fail?"FEHLER: "+fail:"ALLES OK")})();
