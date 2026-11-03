/* Test 1.112: Öffnen eines Retourscheins ohne Änderung darf „Letzte Änderung“ (mod/modT) nicht setzen (SP = Ordner mit fakesb.js) */
const {chromium}=require("playwright");const fs=require("fs");const S=(process.env.SP||"/tmp")+"/";
(async()=>{const b=await chromium.launch();const ctx=await b.newContext({viewport:{width:390,height:844}});const errs=[];let fail=0;const ok=(t,c)=>{if(!c)fail++;console.log((c?"OK   ":"FEHLT")+" "+t)};
 await ctx.route("**/*",r=>{const u=r.request().url();
  if(u.startsWith("https://app.test/"))return r.fulfill({body:fs.readFileSync("/home/claude/gh/index.html"),contentType:"text/html"});
  if(u.includes("supabase-js"))return r.fulfill({body:fs.readFileSync(S+"fakesb.js"),contentType:"text/javascript"});
  return r.fulfill({status:404,body:""})});
 const start=async(seed)=>{const p=await ctx.newPage();p.on("pageerror",e=>errs.push(e.message));if(seed)await p.addInitScript(s=>{window.__seed=s},seed);await p.goto("https://app.test/");await p.waitForTimeout(500);await p.mouse.click(200,400);await p.waitForTimeout(300);return p};
 let p=await start();
 await p.click('[data-g="ret"]');await p.click('[data-rv="new"]');await p.fill("#rev","Zeit-Test");await p.click("#rgo");await p.waitForTimeout(300);
 await p.evaluate(()=>{const a=rKat()[0];rAdd(a.nr,{nr:a.nr,name:a.name,g:a.g,u:a.u||""},4);retEdit()});await p.evaluate(()=>rPersist(true));await p.waitForTimeout(600);
 /* „vor einer Stunde“: Zeiten in der Datenbank zurückdrehen, Daten merken */
 const docs=await p.evaluate(()=>{const H=3600e3;window.__T.docs.filter(r=>r.col==="retour").forEach(r=>{r.data.t-=H;if(r.data.modT)r.data.modT-=H});return JSON.stringify(window.__T.docs)});
 const before=JSON.parse(docs).find(r=>r.col==="retour").data;await p.close();
 /* App neu öffnen mit denselben Daten (localStorage bleibt im Kontext) */
 await ctx.addInitScript(d=>{const t=setInterval(()=>{if(window.__T){window.__T.docs.length=0;JSON.parse(d).forEach(x=>window.__T.docs.push(x));clearInterval(t)}},1)},docs);
 p=await start();await p.waitForTimeout(800);
 const mid=await p.evaluate(()=>window.__T.docs.find(r=>r.col==="retour").data);ok("Nach dem Start unverändert (modT "+mid.modT+" / vorher "+before.modT+")",mid.modT===before.modT);
 await p.evaluate(()=>{const u=db.doc;window.__W=[];db.doc=function(x){const d=u.call(db,x);const up=d.update.bind(d);d.update=v=>{window.__W.push(x+" "+JSON.stringify(v).slice(0,200)+" @"+new Error().stack.split("\n")[2]);return up(v)};return d}});await p.click('[data-g="ret"]');await p.waitForTimeout(300);await p.click("[data-ro]");await p.waitForTimeout(400);
 const eb=await p.$("#redit,[data-redit],button:has-text('Bearbeiten'),button:has-text('Weiter zählen')");if(eb){await eb.click();await p.waitForTimeout(1500)}
 const after=await p.evaluate(()=>window.__T.docs.find(r=>r.col==="retour").data);
 ok("Öffnen/Bearbeiten ohne Änderung: modT bleibt ("+after.modT+")",after.modT===before.modT);ok("mod bleibt",after.mod===before.mod);
 /* echte Änderung setzt modT */
 await p.evaluate(()=>{const a=rKat()[0];rAdd(a.nr,{nr:a.nr,name:a.name,g:a.g,u:a.u||""},1);retEdit()});await p.evaluate(()=>rPersist(true));await p.waitForTimeout(800);
 const ch=await p.evaluate(()=>window.__T.docs.find(r=>r.col==="retour").data);ok("Echte Änderung setzt modT neu",ch.modT>Date.now()-60e3&&ch.mod==="u1");
 console.log("Fehler:",errs);ok("keine Seitenfehler",!errs.length);console.log(fail?"FEHLGESCHLAGEN: "+fail:"ALLES OK");await b.close()})();
