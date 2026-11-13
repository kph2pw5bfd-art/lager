/* Test 1.175: Übersicht (breit) – Anzahl Packlisten neben „Diese Woche“, „Nächste Woche“, „Später“ (SP = Ordner mit fakesb.js) */
const {chromium}=require("playwright");const fs=require("fs");const S=(process.env.SP||"/tmp")+"/";const J=o=>JSON.stringify(o);
(async()=>{const b=await chromium.launch();let fail=0;const ok=(t,c,x)=>{if(!c)fail++;console.log((c?"OK   ":"FEHLT")+" "+t+(x!==undefined?" → "+x:""))};const errs=[];
 const t0=new Date();t0.setHours(0,0,0,0);const wd=(t0.getDay()+6)%7,mo=t0.getTime()-wd*864e5;const at=(d)=>mo+d*864e5+8*36e5;
 const pos=[{p:"1",n:2,u:"Stk",t:"Kabel A",a:"1098",f:0}];let i=0;const P=(d,o)=>({col:"pack",id:"P"+(++i),data:{ord:"26010"+(10+i)+"-01",ps:String(700+i),ev:"Fest "+i,pl:"Heinz Tester",db:at(d),de:at(d+3),pos,by:"u1",t:at(-20),...o}});
 const seed=[P(0),P(1),P(2),P(4),P(5),P(8),P(9),P(20),P(30),P(31)];
 const fk=fs.readFileSync(S+"fakesb.js","utf8").replace("const T={docs:[]","const T={docs:"+J(seed));
 const ctx=await b.newContext({viewport:{width:1280,height:900}});const p=await ctx.newPage();p.on("pageerror",e=>errs.push(e.message));
 await ctx.route("**/*",r=>{const u=r.request().url();if(u.startsWith("https://app.test/"))return r.fulfill({body:fs.readFileSync("/home/claude/gh/index.html"),contentType:"text/html"});if(u.includes("supabase-js"))return r.fulfill({body:fk,contentType:"text/javascript"});return r.fulfill({status:404,body:""})});
 await p.goto("https://app.test/");await p.waitForTimeout(800);await p.mouse.click(640,500);await p.waitForTimeout(400);
 await p.evaluate(()=>go("pack"));await p.waitForTimeout(400);
 const H=await p.$$eval(".pkwh span",l=>l.map(x=>x.textContent));
 ok("Überschriften mit Anzahl",J(H)===J(["Diese Woche · 5 Packlisten","Nächste Woche · 2 Packlisten","Später · 3 Packlisten"]),J(H));
 await p.screenshot({path:S+"pkwn.png"});ok("keine JS-Fehler",!errs.length,errs.join("|"));await b.close();console.log(fail?"FEHLER: "+fail:"ALLES OK")})();
