/* Test 1.114: „Richtet her · Name“ in Übersicht (Wand), Alle Packlisten und in der Packliste (SP = Ordner mit fakesb.js) */
const {chromium}=require("playwright");const fs=require("fs");const S=(process.env.SP||"/tmp")+"/";const J=o=>JSON.stringify(o);
const t0=new Date();t0.setHours(0,0,0,0);const T0=t0.getTime(),D=n=>T0+n*864e5;
(async()=>{const b=await chromium.launch();let fail=0;const ok=(t,c)=>{if(!c)fail++;console.log((c?"OK   ":"FEHLT")+" "+t)};const now=Date.now(),errs=[];
 const pos=[{p:"1",n:5,u:"Stk",t:"Schuko 20m",a:"1081",f:0},{p:"2",n:2,u:"Stk",t:"Kabel 32A 50m",a:"1098",f:0}];
 const seed=[{col:"pack",id:"A",data:{ord:"260130001",ps:"1",ev:"Gala Wien",pl:"Max Muster",db:D(0)+8*36e5,de:D(3),pos,by:"u1",t:D(-2)}},
  {col:"pack",id:"B",data:{ord:"260140001",ps:"2",ev:"Messe Linz",pl:"Max Muster",db:D(0)+9*36e5,de:D(3),pos,by:"u1",t:D(-2)}},
  {col:"pack",id:"L",data:{ord:"260150001",ps:"3",ev:"Ball Graz",pl:"Max Muster",db:D(-3),de:D(3),pos,by:"u1",t:D(-5)}},
  {col:"pack",id:"F",data:{ord:"260160001",ps:"4",ev:"Fertig Fest",pl:"Max Muster",db:D(0)+10*36e5,de:D(3),pos,by:"u1",t:D(-2)}},
  {col:"packh",id:"F",data:{c:1,h_1:{ok:true,by:"u1",t:1},h_2:{ok:true,by:"u1",t:1},fin:{by:"u1",t:now-36e5}}},
  {col:"pked",id:"A",data:{ed_u2:now-10e3}},{col:"pked",id:"L",data:{ed_u2:now-5e3,edn_u2:"Karl Klein"}},{col:"pked",id:"B",data:{ed_u2:now-300e3}}];
 const fk=fs.readFileSync(S+"fakesb.js","utf8").replace("const T={docs:[]","const T={docs:"+J(seed)).replace('profiles:[{','profiles:[{id:"u2",name:"Max Muster",email:"m@x",role:"user",active:true,created_at:"2026-10-28"},{');
 for(const [w,h] of [[390,844],[1200,900]]){
 const ctx=await b.newContext({viewport:{width:w,height:h}});const p=await ctx.newPage();p.on("pageerror",e=>errs.push(e.message));
 await ctx.route("**/*",r=>{const u=r.request().url();
  if(u.startsWith("https://app.test/"))return r.fulfill({body:fs.readFileSync("/home/claude/gh/index.html"),contentType:"text/html"});
  if(u.includes("supabase-js"))return r.fulfill({body:fk,contentType:"text/javascript"});
  return r.fulfill({status:404,body:""})});
 await p.goto("https://app.test/");await p.waitForTimeout(600);await p.mouse.click(200,400);await p.waitForTimeout(400);
 const tags=()=>p.$$eval("[data-pk]",l=>l.map(x=>x.dataset.pk+":"+((x.querySelector(".pkwork")||{}).textContent||"")).filter(x=>!/:$/.test(x)));
 await p.evaluate(()=>{view="pack";draw()});await p.waitForTimeout(300);
 const W=await tags();console.log("   Wand "+w+":",W);ok("Wand "+w+": Gala Wien mit Max M.",W.includes("A:Richtet her · Max M."));ok("Wand "+w+": Nicht hergerichtet mit Tablet-Namen",W.includes("L:Richtet her · Karl K. (Tablet)"));ok("Wand "+w+": alter Herzschlag ohne Schild",!W.some(x=>x.startsWith("B:")));
 await p.screenshot({path:S+"pkwork_wand_"+w+".png"});
 await p.evaluate(()=>{view="packall";draw()});await p.waitForTimeout(300);const A=await tags();console.log("   Alle:",A);ok("Alle Packlisten "+w+": Schild bei A und L",A.includes("A:Richtet her · Max M.")&&A.includes("L:Richtet her · Karl K. (Tablet)")&&A.length===2);
 if(w>500){await p.screenshot({path:S+"pkwork_alle.png"});await ctx.close();continue}
 /* selbst öffnen: Hinweis auf Max, eigener Herzschlag */
 await p.evaluate(()=>{curPack="A";go("packopen")});await p.waitForTimeout(5000);
 const hint=await p.evaluate(()=>(document.querySelector("#app .rwho")||{}).textContent||"");ok("In der Packliste: "+hint,hint==="Max M. richtet gerade auch diese Packliste her.");
 const db1=await p.evaluate(()=>window.__T.docs.find(r=>r.col==="pked"&&r.id==="A").data);ok("Eigener Herzschlag gespeichert",db1.ed_u1>Date.now()-10e3);
 await p.screenshot({path:S+"pkwork_offen.png"});
 /* neue Packliste ohne pked-Eintrag: wird angelegt */
 await p.evaluate(()=>{curPack="B";go("packopen")});await p.waitForTimeout(5000);
 const st=await p.evaluate(()=>({a:window.__T.docs.find(r=>r.col==="pked"&&r.id==="A").data.ed_u1,b:window.__T.docs.find(r=>r.col==="pked"&&r.id==="B").data.ed_u1}));ok("Wechsel: A auf 0, B gesetzt",st.a===0&&st.b>0);
 /* abgeschlossene Packliste: kein Herzschlag */
 await p.evaluate(()=>{curPack="F";go("packopen")});await p.waitForTimeout(5000);
 const f=await p.evaluate(()=>{const r=window.__T.docs.find(r=>r.col==="pked"&&r.id==="F");return r?r.data.ed_u1:null});ok("Abgeschlossen: kein „Richtet her“ ("+f+")",!f);
 /* Liste: eigenes Schild nach Verlassen weg */
 await p.evaluate(()=>{view="packall";draw()});await p.waitForTimeout(5000);const A2=await tags();ok("Nach Verlassen nur noch fremde Schilder",!A2.some(x=>/Jürgen/.test(x)));
 /* Ablauf ohne Herzschlag */
 await p.evaluate(()=>{window.__n=Date.now;Date.now=()=>window.__n()+120e3});await p.waitForTimeout(21000);const A3=await tags();await p.evaluate(()=>{Date.now=window.__n});
 ok("Nach 2 Min ohne Herzschlag weg ("+A3+")",!A3.length);await ctx.close()}
 console.log("Fehler:",errs);ok("keine Seitenfehler",!errs.length);console.log(fail?"FEHLGESCHLAGEN: "+fail:"ALLES OK");await b.close()})();
