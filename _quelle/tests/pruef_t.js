/* Test 1.98: Zu prüfen orange, Geprüft mit Notiz, Übersicht Geprüft (Basis aus abg_t) – Test 1.77: Abgleich Ausgang ↔ Eingang – Konto, Zeile im Retourschein, Teil-/Endretoure, Fehlt noch, Zu viel zurück (nur Vorschläge), Zu prüfen, Excel, Mail-Anhang (SP = Ordner mit fakesb.js) */
const {chromium}=require("playwright");const fs=require("fs");const S=(process.env.SP||"/tmp")+"/";
const t0=new Date();t0.setHours(0,0,0,0);const T0=t0.getTime(),day=864e5,D=n=>{const d=new Date(T0);d.setDate(d.getDate()+n);return d.getTime()};
const kat=JSON.parse(fs.readFileSync(__dirname+"/rkat.json","utf8")).map((x,i)=>({col:"rkat",id:"k"+i,data:x}));
const it=(nr,name,q,g)=>({nr,name,q,g:g||"Kabel",u:"32A"});
const J=o=>JSON.stringify(o);
const seed=kat.concat([{col:"titel",id:"tl",data:{name:"Lagerleiter",o:1,r:{ret_s:true,abg_p:true}}},
 {col:"pack",id:"A",data:{ord:"260130001",ps:"14402",ev:"Gala Wien",pl:"Max Muster",db:D(-9),de:D(-3),pos:[{p:"1",n:16,u:"Stk",t:"Kabel CEE 32A 50m",a:"1098",f:0},{p:"2",n:4,u:"Stk",t:"Kabel CEE 32A 25m",a:"1097",f:0},{p:"3",n:8,u:"Stk",t:"Verteiler 3-fach",a:"1026",f:0},{p:"4",n:17,u:"Stk",t:"Schuko 20m",a:"1081",f:11}],
  zus:[{ps:"14455",t:D(-7),by:"u1",pos:[{p:"1",n:4,u:"Stk",t:"Kabel CEE 32A 25m",a:"1097",f:0}]}],by:"u1",t:D(-10)}},
 {col:"packh",id:"A",data:{c:1,h_1:{ok:true,by:"u1",t:1},h_2:{ok:true,by:"u1",t:1},h_3:{ok:true,by:"u1",t:1},h_4:{ok:true,fm:"miete",by:"u1",t:1},h_z14455_1:{ok:true,by:"u1",t:1},fin:{by:"u1",t:D(-9)}}},
 {col:"pack",id:"B",data:{ord:"260120001",ps:"14500",ev:"Messe Linz",pl:"Max Muster",db:D(-6),de:D(-1),pos:[{p:"1",n:2,u:"Stk",t:"Kabel CEE 32A 25m",a:"1097",f:0}],by:"u1",t:D(-7)}},
 {col:"packh",id:"B",data:{c:1,h_1:{ok:true,by:"u1",t:1},fin:{by:"u1",t:1}}},
 {col:"pack",id:"C",data:{ord:"260160001",ps:"14600",ev:"Stadtfest Graz",pl:"Marvin Wellisch",db:D(-2),de:D(3),pos:[{p:"1",n:5,u:"Stk",t:"Schuko 20m",a:"1081",f:0}],by:"u1",t:D(-3)}},
 {col:"packh",id:"C",data:{c:1,h_1:{ok:true,by:"u1",t:1},fin:{by:"u1",t:1}}},
 {col:"retour",id:"rA1",data:{ev:"Gala Wien",ord:"2601300-01",itemsJson:J({"1098":it("1098","32A Kabel 50m",4)}),by:"u1",t:D(-6),closed:true,art:"teil",closedBy:"u1",closedT:D(-6)}},
 {col:"retour",id:"rA2",data:{ev:"Gala Wien",ord:"2601300-01",itemsJson:J({"1098":it("1098","32A Kabel 50m",6),"1097":it("1097","32A Kabel 25m",10),"1026":it("1026","Verteiler Schuko 3-fach Gummi",8,"Verteiler"),"1081":it("1081","Schuko 20m",6)}),by:"u1",t:D(-1),closed:true,art:"end",closedBy:"u1",closedT:Date.now()-36e5}},
 {col:"retour",id:"rB",data:{ev:"Messe Linz",ord:"260120001",itemsJson:J({"1098":it("1098","32A Kabel 50m",2)}),by:"u1",t:D(-1),closed:true,art:"end",closedBy:"u1",closedT:Date.now()-2*36e5}},
 {col:"retour",id:"rC",data:{ev:"Stadtfest Graz",ord:"260160001",itemsJson:J({"1081":it("1081","Schuko 20m",2)}),by:"u1",t:Date.now()-36e5}},
 {col:"retour",id:"rOld",data:{ev:"Alt ohne Art",ord:"2501",itemsJson:"{}",by:"u1",t:D(-30),closed:true,closedBy:"u1",closedT:D(-30)}}]);
(async()=>{const b=await chromium.launch();const ctx=await b.newContext({viewport:{width:390,height:844}});
await ctx.addInitScript(()=>{window.__saved=[];window.__shared=null;navigator.canShare=()=>true;navigator.share=async d=>{window.__shared={n:d.files.map(f=>f.name),text:d.text}}});
 const p=await ctx.newPage();const errs=[];p.on("pageerror",e=>errs.push(e.message));
 const fk=fs.readFileSync(S+"fakesb.js","utf8").replace("const T={docs:[]","const T={docs:"+JSON.stringify(seed));
 await ctx.route("**/*",r=>{const u=r.request().url();if(u.startsWith("https://app.test/"))return r.fulfill({body:fs.readFileSync("/home/claude/gh/index.html"),contentType:"text/html"});if(u.includes("supabase-js"))return r.fulfill({body:fk,contentType:"text/javascript"});return r.fulfill({status:404,body:""})});
 await p.goto("https://app.test/");await p.waitForTimeout(900);await p.mouse.click(195,420);await p.waitForTimeout(500);
 await p.evaluate(()=>{window.claude=window.claude||{};const u=claude.use;claude.use=async n=>n==="downloads"?{save:async o=>{__saved.push({fn:o.filename,txt:await o.data.text()})}}:u(n)});
 const T=async sel=>(await p.$$eval(sel,l=>l.map(x=>x.innerText.replace(/\s+/g," ").trim()))).join(" | ");
 const V=async v=>{await p.evaluate(v=>{document.querySelectorAll(".ov").forEach(o=>o.remove());view=v;hist=["start"];draw()},v);await p.waitForTimeout(250)};
 console.log("Status: Gala Wien",await p.evaluate(()=>pkState(packs.find(x=>x.id==="A")).l),"| Stadtfest (nur offener Schein)",await p.evaluate(()=>pkState(packs.find(x=>x.id==="C")).l));

 let F=0;const ok=(t,c,v)=>{F+=!c;console.log((c?"OK   ":"FEHLT")+" "+t+(v!==undefined?": "+v:""))};
 await V("jarvis");ok("Feld orange mit Anzahl",await p.evaluate(()=>{const s=document.querySelector("#abgstrip");return s&&s.classList.contains("hot")&&s.querySelector(".abgcnt").textContent==="2"}),await T("#abgstrip"));
 await p.screenshot({path:S+"pruef_strip.png"});
 await p.click("#abgstrip");await p.waitForTimeout(300);ok("Reiter Zu prüfen (2)",/Zu prüfen \(2\)/.test(await T("[data-prt]")));ok("wartet seit",/wartet seit heute/.test(await T(".abgcard")));
 await p.click('[data-prk="0"]');await p.waitForTimeout(200);await p.click('[data-anc="0"]');await p.waitForTimeout(100);
 ok("Knopf setzt Text",(await p.inputValue("#abgnt"))==="Retoure per Mail an Projektleiter gesendet");await p.screenshot({path:S+"pruef_dlg.png"});
 await p.click("#abgns");await p.waitForTimeout(500);
 const pr=await p.evaluate(()=>JSON.stringify(Object.values(ABP).map(x=>x.note)));ok("Notiz gespeichert",pr==='["Retoure per Mail an Projektleiter gesendet"]',pr);
 await p.click('[data-prk="0"]');await p.waitForTimeout(200);await p.click("#abgns");await p.waitForTimeout(500);
 ok("ohne Notiz geht auch",await p.evaluate(()=>Object.keys(ABP).length===2&&!abgToCheck().length));
 await V("jarvis");ok("Feld neutral wenn nichts zu prüfen",await p.evaluate(()=>{const s=document.querySelector("#abgstrip");return s&&!s.classList.contains("hot")&&s.classList.contains("abgnone")}),await T("#abgstrip"));
 await p.click("#abgstrip");await p.waitForTimeout(300);ok("öffnet Reiter Geprüft",await p.evaluate(()=>abgPrT==="ok"));
 const L=await T(".abgdn");ok("Übersicht zeigt beide mit Notiz",/Retoure per Mail an Projektleiter gesendet/.test(L)&&(await p.$$(".abgdn")).length===2,L);
 ok("Monat-Überschrift",(await p.$$(".abgmon")).length>=1);await p.screenshot({path:S+"pruef_ok.png",fullPage:true});
 await p.fill("#abgprq","mail an");await p.waitForTimeout(200);ok("Suche nach Notiz",(await p.$$(".abgdn")).length===1);
 await p.click(".abgdn");await p.waitForTimeout(300);ok("Tipp öffnet Abgleich mit Notiz",await p.evaluate(()=>view)==="pkabg"&&/Retoure per Mail/.test(await T(".abgdone")),await T(".abgdone"));
 ok("keine JS-Fehler",!errs.length,errs.join(" / "));console.log("FEHLER GESAMT:",F);await b.close()})();
