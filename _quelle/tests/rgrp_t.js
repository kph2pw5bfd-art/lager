/* Test 1.82: Retourscheine „Alle“ – oben Offen, unten Abgeschlossen, Trennstrich – SP = Ordner mit fakesb.js */
const {chromium}=require("playwright");const fs=require("fs");const S=(process.env.SP||"/tmp")+"/";
const seed=[{col:"retour",id:"r1",data:{ev:"Gala Wien",ord:"260130001",itemsJson:"{}",by:"u1",t:Date.now()-5e6,closed:true,art:"end",closedBy:"u1",closedT:Date.now()-4e6}},
 {col:"retour",id:"r2",data:{ev:"Messe Linz",ord:"260120001",itemsJson:"{}",by:"u1",t:Date.now()-3e6,draft:true}},
 {col:"retour",id:"r3",data:{ev:"Ice Magic",ord:"260150001",itemsJson:"{}",by:"u1",t:Date.now()-1e6}}];
(async()=>{const b=await chromium.launch();const p=await b.newPage({viewport:{width:390,height:844}});const errs=[];p.on("pageerror",e=>errs.push(e.message));
 const fk=fs.readFileSync(S+"fakesb.js","utf8").replace("const T={docs:[]","const T={docs:"+JSON.stringify(seed));
 await p.route("**/*",r=>{const u=r.request().url();if(u.startsWith("https://app.test/"))return r.fulfill({body:fs.readFileSync("/home/claude/gh/index.html"),contentType:"text/html"});if(u.includes("supabase-js"))return r.fulfill({body:fk,contentType:"text/javascript"});return r.fulfill({status:404,body:""})});
 await p.goto("https://app.test/");await p.waitForTimeout(900);await p.mouse.click(195,420);await p.waitForTimeout(400);
 const L=()=>p.$$eval("#rlist > *",l=>l.map(x=>x.classList.contains("rgh")?"["+x.innerText.replace(/\s+/g," ")+"]":x.tagName==="HR"?"———":x.matches(".card[data-ro]")?x.querySelector("b").textContent:"").filter(Boolean).join(" → "));
 await p.evaluate(()=>{rf="alle";view="ret";hist=["start"];draw()});await p.waitForTimeout(300);console.log("Alle:",await L());
 await p.screenshot({path:S+"rgrp.png",fullPage:true});
 await p.click('[data-rf="offen"]');await p.waitForTimeout(200);console.log("Offen:",await L());
 await p.click('[data-rf="zu"]');await p.waitForTimeout(200);console.log("Abgeschlossen:",await L());
 await p.click('[data-rf="alle"]');await p.fill("#rsq","gala");await p.waitForTimeout(200);console.log("Suche gala:",await L());
 console.log("Fehler:",errs);await b.close()})();
