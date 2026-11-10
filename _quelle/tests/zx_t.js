/* Test 1.153: zusätzliches Material beim Zusatz-Packschein (SP = Ordner mit fakesb.js) */
const {chromium}=require("playwright");const fs=require("fs");const S=(process.env.SP||"/tmp")+"/";const J=o=>JSON.stringify(o);
const t0=new Date();t0.setHours(0,0,0,0);const D=n=>t0.getTime()+n*864e5+8*36e5;const ymd=n=>{const d=new Date(t0.getTime()+n*864e5+12*36e5);return d.getFullYear()+"-"+String(d.getMonth()+1).padStart(2,"0")+"-"+String(d.getDate()).padStart(2,"0")};
(async()=>{const b=await chromium.launch();let fail=0;const ok=(t,c)=>{if(!c)fail++;console.log((c?"OK   ":"FEHLT")+" "+t)};const errs=[];
 const pos=[{p:"1",n:6,u:"Stk",t:"Kabel 32A 50m",a:"1098",f:0}];
 const seed=[{col:"pack",id:"A",data:{ord:"2601300",ps:"14700",ev:"Gala Wien",pl:"Max Muster",db:D(0),de:D(5),pos,zus:[{ps:"14701",v:2,t:D(0),by:"u1",pos:[{p:"1",n:2,u:"Stk",t:"Verteiler 63A",a:"1050",f:0}]}],by:"u1",t:D(-1)}},{col:"packh",id:"A",data:{zd_14701:{d:ymd(0),by:"u1",t:1}}}];
 const fk=fs.readFileSync(S+"fakesb.js","utf8").replace("const T={docs:[]","const T={docs:"+J(seed));
 const ctx=await b.newContext({viewport:{width:390,height:844}});const p=await ctx.newPage();p.on("pageerror",e=>errs.push(e.message));
 await ctx.route("**/*",r=>{const u=r.request().url();if(u.startsWith("https://app.test/"))return r.fulfill({body:fs.readFileSync("/home/claude/gh/index.html"),contentType:"text/html"});if(u.includes("supabase-js"))return r.fulfill({body:fk,contentType:"text/javascript"});return r.fulfill({status:404,body:""})});
 await p.goto("https://app.test/");await p.waitForTimeout(800);await p.mouse.click(200,400);await p.waitForTimeout(400);
 await p.evaluate(()=>{curPack="A";view="packopen";draw()});await p.waitForTimeout(300);
 ok("Knopf im Zusatz-Rahmen",!!(await p.$('.pkzbox [data-pkxadd="14701"]'))&&!!(await p.$('.pkmbox #pkxadd')));
 await p.click('.pkzbox [data-pkxadd="14701"]');await p.waitForSelector("#pxt");ok("Titel mit Zusatz",/Zusatz 14701/.test(await p.textContent(".ov")));
 await p.fill("#pxt","Kabeltrommel Spezial");await p.fill("#pxn","3");await p.fill("#pxw","PL hat angerufen");await p.click("#pxs");await p.waitForTimeout(400);
 const H=await p.evaluate(()=>JSON.parse(JSON.stringify(packh.A)));const xk=Object.keys(H).find(k=>/^x_/.test(k));ok("Gespeichert mit z "+J(H[xk]),H[xk]&&H[xk].z==="14701"&&H[xk].n===3);
 ok("Steht im Zusatz-Rahmen, nicht im Haupt",/Kabeltrommel Spezial/.test(await p.textContent(".pkzbox"))&&!/Kabeltrommel Spezial/.test(await p.textContent(".pkmbox")));
 const R=await p.evaluate(()=>{const P=packs.find(x=>x.id==="A");return{mz:pkMailText(P,"14701").body,mm:pkMailText(P).body,dz:pkZProg(P,"14701").dev,dm:pkProg(P).dev,ab:abgBal(P).L.find(e=>/Kabeltrommel/.test(e.name)),au:auDevLines(P,"14701"),pdf:pkDrDev(pkDrRows(P)).D}});
 ok("Info-Mail Zusatz ja, Haupt nein",/Kabeltrommel Spezial/.test(R.mz)&&!/Kabeltrommel/.test(R.mm));ok("Abweichung beim Zusatz",R.dz===1&&R.dm===0);
 ok("Abgleich raus 3",R.ab&&R.ab.soll===3);ok("Meine Aufträge Zusatz",R.au.some(l=>/Kabeltrommel/.test(l)));ok("PDF",R.pdf.some(l=>/Kabeltrommel/.test(l)));
 /* Zusatz abschließen → gesperrt, Haupt bleibt offen */
 await p.evaluate(()=>pkHSet(packs[0],{zf_14701:{by:"u1",t:Date.now()},h_z14701_1:{ok:true,by:"u1",t:1}}));await p.waitForTimeout(400);await p.evaluate(()=>draw());await p.waitForTimeout(200);
 ok("Zusatz abgeschlossen: kein Knopf",!(await p.$('[data-pkxadd="14701"]'))&&!!(await p.$('#pkxadd')));
 ok("Ändern gesperrt",await p.$eval('.pkzbox button[data-pkxe]',b=>b.disabled));
 await p.screenshot({path:S+"zx.png",fullPage:true});ok("Keine JS-Fehler "+errs.join("|"),!errs.length);await b.close();console.log(fail?"FEHLER: "+fail:"ALLES OK")})();
