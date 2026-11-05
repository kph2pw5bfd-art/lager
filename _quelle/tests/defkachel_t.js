/* Test 1.96: Kachel „Defekt melden“ → Defekte-Liste, Reiter „Alle“ */
const {chromium}=require("playwright");const fs=require("fs");const S=(process.env.SP||"/tmp")+"/";
const seed=[{col:"defekte",id:"a",data:{art:"A",ev:"Fest",by:"u1",t:Date.now()-1e5,done:false}},{col:"defekte",id:"b",data:{art:"B",ev:"Fest",by:"u1",t:Date.now()-2e5,done:true,doneT:Date.now()}}];
let F=0;const ok=(t,c,v)=>{F+=!c;console.log((c?"OK   ":"FEHLT")+" "+t+(v!==undefined?": "+v:""))};
(async()=>{const b=await chromium.launch();const ctx=await b.newContext({viewport:{width:390,height:844}});const p=await ctx.newPage();const errs=[];p.on("pageerror",e=>errs.push(e.message));
 const fk=fs.readFileSync(S+"fakesb.js","utf8").replace("const T={docs:[]","const T={docs:"+JSON.stringify(seed));
 await ctx.route("**/*",r=>{const u=r.request().url();if(u.startsWith("https://app.test/"))return r.fulfill({body:fs.readFileSync("/home/claude/gh/index.html"),contentType:"text/html"});if(u.includes("supabase-js"))return r.fulfill({body:fk,contentType:"text/javascript"});return r.fulfill({status:404,body:""})});
 await p.goto("https://app.test/");await p.waitForTimeout(900);await p.mouse.click(195,420);await p.waitForTimeout(500);
 await p.evaluate(()=>{df="offen";view="start";hist=[];draw()});await p.waitForTimeout(200);
 
 ok("Kachel heißt Defekte",/^Defekte/.test((await p.innerText('[data-g="defnew"] .ht b')).trim()));
 await p.click('[data-g="defnew"]');await p.waitForTimeout(300);
 ok("Kachel öffnet Liste mit Reiter Alle",await p.evaluate(()=>view==="def"&&df==="alle"&&document.querySelector('[data-dfl="alle"]').classList.contains("act")&&document.querySelectorAll("[data-df]").length===1&&/Erledigte anzeigen \(1\)/.test((document.getElementById("dxdtog")||{}).textContent||"")));
 await p.click('[data-v="defnew"]');await p.waitForTimeout(200);ok("Reiter Defekt melden → Formular",!!(await p.$("#dnart")));
 ok("keine JS-Fehler",!errs.length,errs.join(" / "));console.log("FEHLER GESAMT:",F);await b.close()})();
