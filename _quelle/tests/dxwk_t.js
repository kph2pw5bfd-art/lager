/* Test 1.174: erledigte Defekte nach Meldedatum – Diese Woche / Letzte Woche / Monate, mit Anzahl; offene unverändert (SP = Ordner mit fakesb.js) */
const {chromium}=require("playwright");const fs=require("fs");const S=(process.env.SP||"/tmp")+"/";const J=o=>JSON.stringify(o);
(async()=>{const b=await chromium.launch();let fail=0;const ok=(t,c,x)=>{if(!c)fail++;console.log((c?"OK   ":"FEHLT")+" "+t+(x!==undefined?" → "+x:""))};const errs=[];
 const d0=new Date();d0.setHours(10,0,0,0);const mo=d0.getTime()-((d0.getDay()+6)%7)*864e5;const now=Date.now();
 const D=(id,t,o)=>({col:"defekte",id,data:{by:"u1",t,done:true,doneBy:"u1",doneT:now,urg:false,fn:0,foto:false,art:"Artikel "+id,ev:"Fest",desc:"",...o}});
 const seed=[D("w0",Math.min(now-6e4,mo+36e5)),D("w1a",mo-2*864e5),D("w1b",mo-6*864e5),D("m1",new Date(2026,8,15).getTime()),D("m2",new Date(2026,8,3).getTime()),D("m3",new Date(2026,7,20).getTime()),
  D("o1",now-36e5,{done:false,doneBy:null,doneT:null}),D("o2",new Date(2026,7,1).getTime(),{done:false,doneBy:null,doneT:null})];
 const fk=fs.readFileSync(S+"fakesb.js","utf8").replace("const T={docs:[]","const T={docs:"+J(seed));
 const ctx=await b.newContext({viewport:{width:390,height:1400}});const p=await ctx.newPage();p.on("pageerror",e=>errs.push(e.message));
 await ctx.route("**/*",r=>{const u=r.request().url();if(u.startsWith("https://app.test/"))return r.fulfill({body:fs.readFileSync("/home/claude/gh/index.html"),contentType:"text/html"});if(u.includes("supabase-js"))return r.fulfill({body:fk,contentType:"text/javascript"});return r.fulfill({status:404,body:""})});
 await p.goto("https://app.test/");await p.waitForTimeout(800);await p.mouse.click(200,400);await p.waitForTimeout(400);
 const heads=()=>p.$$eval(".dxwk",l=>l.map(x=>x.textContent));
 await p.evaluate(()=>{df="offen";view="def";draw()});await p.waitForTimeout(300);ok("Offen: keine Wochen-Überschriften",!(await heads()).length);
 await p.evaluate(()=>{df="erledigt";draw()});await p.waitForTimeout(300);let H=await heads();
 ok("Erledigt: Überschriften mit Anzahl",J(H)===J(["Diese Woche (1)","Letzte Woche (2)","September 2026 (2)","August 2026 (1)"]),J(H));
 await p.screenshot({path:S+"dxwk.png"});
 await p.evaluate(()=>{df="alle";dxDoneOpen=false;draw()});await p.waitForTimeout(300);ok("Alle eingeklappt: keine Überschriften",!(await heads()).length);
 await p.click("#dxdtog");await p.waitForTimeout(300);H=await heads();ok("Alle ausgeklappt: Erledigte gruppiert",H.length===4&&H[0]==="Diese Woche (1)",J(H));
 const ord=await p.evaluate(()=>[...document.querySelectorAll("[data-df]")].map(e=>e.dataset.df).join(","));ok("Offene oben unverändert",ord.startsWith("o1,o2"),ord);
 await p.fill("#dxdq","Artikel m");await p.waitForTimeout(300);H=await heads();ok("Suche: nur Gruppen mit Treffern",J(H)===J(["September 2026 (2)","August 2026 (1)"]),J(H));
 ok("keine JS-Fehler",!errs.length,errs.join("|"));await b.close();console.log(fail?"FEHLER: "+fail:"ALLES OK")})();
