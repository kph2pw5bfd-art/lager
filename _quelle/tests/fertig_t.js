/* Test 1.117: „Fertig“ beim Zählen – speichert und öffnet den Retourschein; ohne Änderung bleibt „Letzte Änderung“ (SP = Ordner mit fakesb.js) */
const {chromium}=require("playwright");const fs=require("fs");const S=(process.env.SP||"/tmp")+"/";const J=o=>JSON.stringify(o);
(async()=>{const b=await chromium.launch();let fail=0;const ok=(t,c)=>{if(!c)fail++;console.log((c?"OK   ":"FEHLT")+" "+t)};const errs=[];
 const old=Date.now()-3*36e5,seed=[{col:"retour",id:"rO",data:{ev:"Gala Wien",ord:"2601300-01",itemsJson:"{}",pa_u1:J({"7001":{nr:"7001",name:"Schuko 100m",g:"Kabel",u:"Schuko",q:3}}),by:"u1",t:old,mod:"u1",modT:old,draft:false}}];
 const fk=fs.readFileSync(S+"fakesb.js","utf8").replace("const T={docs:[]","const T={docs:"+J(seed));
 for(const w of [360,390]){
 const ctx=await b.newContext({viewport:{width:w,height:800}});const p=await ctx.newPage();p.on("pageerror",e=>errs.push(e.message));
 await ctx.route("**/*",r=>{const u=r.request().url();
  if(u.startsWith("https://app.test/"))return r.fulfill({body:fs.readFileSync("/home/claude/gh/index.html"),contentType:"text/html"});
  if(u.includes("supabase-js"))return r.fulfill({body:fk,contentType:"text/javascript"});
  return r.fulfill({status:404,body:""})});
 await p.goto("https://app.test/");await p.waitForTimeout(600);await p.mouse.click(200,400);await p.waitForTimeout(400);
 const R=id=>p.evaluate(id=>(window.__T.docs.find(r=>r.col==="retour"&&r.id===id)||{}).data,id);
 /* bestehender Schein: öffnen, Bearbeiten, nichts ändern, Fertig */
 await p.click('[data-g="ret"]');await p.waitForTimeout(300);await p.click('[data-ro="rO"]');await p.waitForTimeout(300);await p.click("#red");await p.waitForTimeout(500);await p.click("#rmore");await p.waitForTimeout(400);
 ok(w+" px: Knopf „Fertig“ in der Leiste",!!(await p.$(".rbar #rfin"))&&!!(await p.$(".rbar #rsum")));
 const fit=await p.evaluate(()=>{const bar=document.querySelector(".rbar").getBoundingClientRect(),f=document.querySelector("#rfin").getBoundingClientRect(),s=document.querySelector("#rsum").getBoundingClientRect();return f.right<=bar.right+1&&s.right<=f.left+1&&document.documentElement.scrollWidth<=innerWidth});ok(w+" px: passt in die Leiste",fit);
 await p.screenshot({path:S+"fertig_"+w+".png"});
 await p.click("#rfin");await p.waitForTimeout(900);let d=await R("rO");
 ok("Ohne Änderung: Retourschein-Ansicht",(await p.evaluate(()=>view))==="retopen");ok("Ohne Änderung: modT bleibt",d.modT===old);
 /* mit Änderung */
 await p.click("#red");await p.waitForTimeout(400);await p.click("#rmore");await p.waitForTimeout(300);await p.evaluate(()=>{rAdd("7001",{nr:"7001",name:"Schuko 100m",g:"Kabel",u:"Schuko"},2);retEdit()});await p.waitForTimeout(200);
 await p.click("#rfin");await p.waitForTimeout(900);d=await R("rO");
 ok("Mit Änderung: gespeichert + Ansicht",(await p.evaluate(()=>view))==="retopen"&&d.modT>old&&/"q":5/.test(d.pa_u1));
 const txt=await p.evaluate(()=>document.querySelector("#app").textContent);ok("Retourschein zeigt 5 Stück",/5/.test(txt));
 /* neuer Schein */
 await p.evaluate(()=>{rNew()});await p.waitForTimeout(200);await p.fill("#rev","Neu-Test");await p.click("#rgo");await p.waitForTimeout(300);
 await p.click("#rfin");await p.waitForTimeout(300);ok("Leer: Hinweis statt Speichern",(await p.evaluate(()=>view))==="retedit");
 await p.evaluate(()=>{document.querySelectorAll(".ov,.eov").forEach(o=>o.remove());rAdd("7001",{nr:"7001",name:"Schuko 100m",g:"Kabel",u:"Schuko"},1);retEdit()});await p.waitForTimeout(200);await p.click("#rfin");await p.waitForTimeout(900);
 const nd=await p.evaluate(()=>{const r=window.__T.docs.find(r=>r.col==="retour"&&r.data.ev==="Neu-Test");return r&&r.data});ok("Neuer Schein gespeichert, kein Entwurf",nd&&nd.draft===false&&(await p.evaluate(()=>view))==="retopen");
 /* Zusammenfassung → Retourschein speichern ohne Änderung */
 const m0=(await R("rO")).modT;await p.evaluate(()=>{curRet="rO";view="retopen";draw()});await p.waitForTimeout(200);await p.click("#red");await p.waitForTimeout(400);await p.click("#rsave");await p.waitForTimeout(900);
 ok("„Retourschein speichern“ ohne Änderung: modT bleibt",(await R("rO")).modT===m0&&(await p.evaluate(()=>view))==="retopen");
 await ctx.close()}
 console.log("Fehler:",errs);ok("keine Seitenfehler",!errs.length);console.log(fail?"FEHLGESCHLAGEN: "+fail:"ALLES OK");await b.close()})();
