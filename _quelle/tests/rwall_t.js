/* Test 1.182: zweite Wand „Retouren“ – Einordnung nach Dispo-Ende, Farben, alte abgelaufene, PC + Handy (SP = Ordner mit fakesb.js) */
const {chromium}=require("playwright");const fs=require("fs");const S=(process.env.SP||"/tmp")+"/";const J=o=>JSON.stringify(o);
(async()=>{const b=await chromium.launch();let fail=0;const ok=(t,c,x)=>{if(!c)fail++;console.log((c?"OK   ":"FEHLT")+" "+t+(x!==undefined?" → "+x:""))};const errs=[];
 const t0=new Date();t0.setHours(0,0,0,0);const wd=(t0.getDay()+6)%7,mo=t0.getTime()-wd*864e5,at=d=>mo+d*864e5+8*36e5,T=t0.getTime()+10*36e5;
 const pos=[{p:"1",n:4,u:"Stk",t:"Kabel A",a:"1098",f:0}];let i=0;const P=(ev,db,de,o)=>({col:"pack",id:"P"+(++i),data:{ord:"26020"+(10+i)+"-01",ps:String(800+i),ev,pl:"Heinz Tester",db,de,pos,by:"u1",t:db-864e5,...o}});
 const today=(new Date(T)).getDay();/* Heute im Wochenbereich Mo–Fr? sonst Freitag */
 const dE=Math.min(wd,4);
 const seed=[P("Zurück früh",at(-7),at(dE)),P("Teilweise",at(-7),at(4)+864e5*0),P("Abgelaufen diese Woche",at(-10),T-864e5*1.2),P("Kommt nächste Woche",at(-3),at(9)),P("Alt abgelaufen",at(-30),at(-12)),P("Storniert",at(-3),at(3)),P("Später",at(0),at(20)),
  {col:"retour",id:"r1",data:{ev:"Zurück früh",ord:"2602011-01",itemsJson:J({"1098":{nr:"1098",name:"Kabel A",q:4}}),by:"u1",t:T,closed:true,closedT:T,art:"end"}},
  {col:"retour",id:"r2",data:{ev:"Teilweise",ord:"2602012-01",itemsJson:J({"1098":{nr:"1098",name:"Kabel A",q:1}}),by:"u1",t:T,closed:true,closedT:T,art:"teil"}},
  {col:"packh",id:"P6",data:{sto:{by:"u1",t:T,why:""}}}];
 const fk=fs.readFileSync(S+"fakesb.js","utf8").replace("const T={docs:[]","const T={docs:"+J(seed));
 const ctx=await b.newContext({viewport:{width:1280,height:900}});const p=await ctx.newPage();p.on("pageerror",e=>errs.push(e.message));
 await ctx.route("**/*",r=>{const u=r.request().url();if(u.startsWith("https://app.test/"))return r.fulfill({body:fs.readFileSync("/home/claude/gh/index.html"),contentType:"text/html"});if(u.includes("supabase-js"))return r.fulfill({body:fk,contentType:"text/javascript"});return r.fulfill({status:404,body:""})});
 await p.goto("https://app.test/");await p.waitForTimeout(900);await p.mouse.click(640,500);await p.waitForTimeout(400);
 await p.evaluate(()=>{pkROpen=new Set([...Array(7)].map((_,i)=>{const d=new Date();d.setHours(0,0,0,0);d.setDate(d.getDate()-i);return d.getTime()}));go("pack")});await p.waitForTimeout(500);
 ok("Überschrift Retouren",!!(await p.$(".pkrhead")));
 const st=await p.evaluate(()=>{const o={};document.querySelectorAll(".pkrwide [data-pk], .pkrold [data-pk]").forEach(e=>{const ev=e.querySelector("b").textContent;o[ev]=(e.className.match(/rk-(\w+)/)||[])[1]||(e.closest(".pkrold")?"alt":"")});return o});console.log("     "+J(st));
 ok("Endretoure: grün",st["Zurück früh"]==="ok");ok("Teilretoure: orange",st["Teilweise"]==="part"||(st["Teilweise"]==="over"));
 ok("abgelaufen diese Woche: rot",st["Abgelaufen diese Woche"]==="over"||st["Abgelaufen diese Woche"]==="alt");ok("nächste Woche: normal",st["Kommt nächste Woche"]==="");
 ok("ältere abgelaufene im roten Kasten",st["Alt abgelaufen"]==="alt");ok("storniert nicht dabei",!("Storniert" in st));ok("Später dabei",st["Später"]==="");
 const H=await p.$$eval(".pkrwh span",l=>l.map(x=>x.textContent));ok("Überschriften mit Anzahl",H.length===3&&/Retoure/.test(H[0]),J(H));
 const tag=await p.$eval(".pkrwide .rk-ok .pkrs",e=>e.textContent).catch(()=>"");ok("Schild ✓ zurück",/✓ zurück/.test(tag),tag);
 await p.screenshot({path:S+"rwall.png",fullPage:true});
 /* Handy */
 await p.setViewportSize({width:390,height:844});await p.evaluate(()=>{pkTab="w0";packOverView()});await p.waitForTimeout(300);
 ok("Handy: Retouren unter den Fächern",!!(await p.$(".pkrhead"))&&(await p.$$(".pkrc")).length>0);
 await p.click('[data-pkt="w1"]');await p.waitForTimeout(200);const m=await p.$$eval(".pkrc b",l=>l.map(x=>x.textContent));ok("Handy: nächste Woche",m.includes("Kommt nächste Woche"),J(m));
 await p.screenshot({path:S+"rwall_m.png",fullPage:true});
 ok("keine JS-Fehler",!errs.length,errs.join("|"));await b.close();console.log(fail?"FEHLER: "+fail:"ALLES OK")})();
