/* Test 1.76: Übersicht Variante A (Reiter, Erinnerung, Mehr anzeigen, Antwort schließen) – Daten wie frag_t.js */
/* Test 1.73: alle Fragen aus dem Konzept + Hilfe-Bildschirm + Aktionen (Fake-Supabase, Pfad zu fakesb.js über SP) */
const {chromium}=require("playwright");const fs=require("fs");const S=(process.env.SP||"/tmp")+"/";
const t0=new Date();t0.setHours(0,0,0,0);const T0=t0.getTime(),day=864e5,D=n=>{const d=new Date(T0);d.setDate(d.getDate()+n);return d.getTime()};
const kat=JSON.parse(fs.readFileSync(__dirname+"/rkat.json","utf8")).map((x,i)=>({col:"rkat",id:"k"+i,data:x}));
const it=(nr,name,q,g,u)=>({nr,name,q,g:g||"Kabel",u:u||"32A"});
const seed=kat.concat([
 {col:"pack",id:"a",data:{ord:"260111401",ps:"a",ev:"Winterwunder Mörbisch",pl:"Marvin Wellisch",db:D(-2),de:D(60),pos:[{p:"1.7",n:16,u:"Stk",t:"Kabel CEE 32A 5pol 50m",a:"1098",f:0},{p:"1.14",n:20,u:"Stk",t:"Kabel Schuko 20m",a:"1081",f:11}],by:"u1",t:1}},
 {col:"packh",id:"a",data:{c:1,h_1_7:{q:15,alt:[{n:2,t:"32A Kabel 25m",a:"1097"}],by:"u1",t:1},h_1_14:{ok:true,fm:"miete",by:"u1",t:1},fin:{by:"u1",t:1}}},
 {col:"pack",id:"b",data:{ord:"260120001",ps:"b",ev:"Messe Linz",pl:"Max Muster",db:T0+8*36e5,de:D(4),pos:[{p:"1.1",n:4,u:"Stk",t:"Kabel CEE 32A 5pol 50m",a:"1098",f:0},{p:"1.2",n:2,u:"Stk",t:"Kabel CEE 32A 25m",a:"1097",f:1}],by:"u1",t:1}},
 {col:"pack",id:"c",data:{ord:"260130001",ps:"c",ev:"Gala Wien",pl:"Max Muster",db:D(-9),de:D(-3),pos:[{p:"1.1",n:4,u:"Stk",t:"Kabel CEE 32A 5pol 50m",a:"1098",f:0},{p:"1.2",n:6,u:"Stk",t:"Kabel Schuko 20m",a:"1081",f:0}],by:"u1",t:1}},
 {col:"packh",id:"c",data:{c:1,h_1_1:{ok:true,by:"u1",t:1},h_1_2:{ok:true,by:"u1",t:1},fin:{by:"u1",t:1}}},
 {col:"pack",id:"d",data:{ord:"260140001",ps:"d",ev:"Adventmarkt Baden",pl:"Max Muster",db:D(-1),de:D(5),pos:[{p:"1.1",n:4,u:"Stk",t:"Kabel CEE 32A 5pol 50m",a:"1098",f:0},{p:"1.2",n:3,u:"Stk",t:"Kabel Schuko 20m",a:"1081",f:0}],by:"u1",t:1}},
 {col:"packh",id:"d",data:{c:1,h_1_1:{ok:true,by:"u1",t:1}}},
 {col:"pack",id:"e",data:{ord:"260150001",ps:"e",ev:"Ice Magic",pl:"Marvin Wellisch",db:D(-20),de:D(-12),pos:[{p:"1.1",n:3,u:"Stk",t:"Kabel CEE 32A 5pol 50m",a:"1098",f:0}],by:"u1",t:1}},
 {col:"pack",id:"f",data:{ord:"260160001",ps:"f",ev:"Stadtfest Graz",pl:"Marvin Wellisch",db:D(-6),de:D(-1),pos:[{p:"1.1",n:2,u:"Stk",t:"Kabel CEE 32A 5pol 50m",a:"1098",f:0}],by:"u1",t:1}},
 {col:"retour",id:"r1",data:{ev:"Gala Wien",ord:"2601300-01",itemsJson:JSON.stringify({"1081":it("1081","Schuko 20m",6,"Kabel","Schuko")}),by:"u1",t:Date.now()}},
 {col:"retour",id:"r2",data:{ev:"Ice Magic",ord:"260150001",itemsJson:JSON.stringify({"1098":it("1098","32A Kabel 50m",2)}),by:"u1",t:D(-11),closed:true,closedT:Date.now()-36e5}},
 {col:"lists",id:"l1",data:{mode:"bleibt",ev1:"Messe Linz",ord1:"",itemsJson:JSON.stringify({a:{art:"1098",id:56},b:{art:"1081",qty:3}}),by:"u1",t:Date.now()-2*36e5}},
 {col:"lists",id:"l2",data:{mode:"weiter",ev1:"Gala Wien",ev2:"Messe Linz",itemsJson:JSON.stringify({a:{art:"1097",qty:2}}),by:"u1",t:D(-2)}},
 {col:"infos",id:"i1",data:{text:"Zwei Kabel bei Halle 3 vergessen",by:"u1",t:Date.now()-36e5,read:false}},
 {col:"defekte",id:"d1",data:{art:"VT 125A Maxi 2",ev:"Ice Magic",by:"u1",t:Date.now()-day,done:false,urg:true}},
 {col:"defekte",id:"d2",data:{art:"32A Kabel 25m",anr:"1097-12",ev:"Gala Wien",desc:"Stecker",by:"u1",t:Date.now()-10*day,done:false}},
 {col:"defekte",id:"d3",data:{art:"32A Kabel 25m",anr:"1097",ev:"Messe Linz",by:"u1",t:Date.now()-20*day,done:true,doneT:Date.now()-36e5}},
 {col:"jverin",id:"e1",data:{by:"u1",t:1,due:Date.now()-6e4,txt:"Gala Wien (Auftrag 260130001)",pk:"c",done:false}}]);
(async()=>{const b=await chromium.launch();const ctx=await b.newContext({viewport:{width:390,height:844}});
 await ctx.addInitScript(()=>{localStorage.setItem("tpc_jv_engine","device");localStorage.setItem("tpc_jv_style","sachlich");window.SpeechSynthesisUtterance=class{constructor(t){this.text=t}};
  Object.defineProperty(window,"speechSynthesis",{configurable:true,value:{getVoices:()=>[],addEventListener(){},cancel(){},speak(u){setTimeout(()=>u.onend&&u.onend(),5)}}})});
 const p=await ctx.newPage();const errs=[];p.on("pageerror",e=>errs.push(e.message));
 const fk=fs.readFileSync(S+"fakesb.js","utf8").replace("const T={docs:[]","const T={docs:"+JSON.stringify(seed));
 await ctx.route("**/*",r=>{const u=r.request().url();if(u.startsWith("https://app.test/"))return r.fulfill({body:fs.readFileSync("/home/claude/gh/index.html"),contentType:"text/html"});if(u.includes("supabase-js"))return r.fulfill({body:fk,contentType:"text/javascript"});return r.fulfill({status:404,body:""})});
 await p.goto("https://app.test/");await p.waitForTimeout(900);await p.mouse.click(195,420);await p.waitForTimeout(400);
 await p.evaluate(()=>{view="jarvis";hist=["start"];draw()});await p.waitForTimeout(300);
 const txt=async sel=>(await p.$$eval(sel,l=>l.map(x=>x.innerText.replace(/\s+/g," ")))).join(" | ");
 console.log("Erinnerung:",await txt(".jverb"));console.log("Reiter:",await txt(".jvtab"));console.log("Gewählt:",await txt(".jvtab.on"));console.log("Liste:",await txt(".jvlist"));
 console.log("Mehr (zu):",await txt("#jvmore > summary"));
 await p.screenshot({path:S+"uebs_a.png",fullPage:true});
 await p.click('[data-jt="herr"]');await p.waitForTimeout(200);console.log("Nach Tipp Herrichten:",await txt(".jvlist"));
 await p.click('#jvmore > summary');await p.waitForTimeout(200);await p.evaluate(()=>draw());await p.waitForTimeout(200);console.log("Mehr bleibt offen nach Neuzeichnen:",await p.evaluate(()=>$("#jvmore").open),"|",(await txt("#jvmore")).slice(0,300));
 await p.fill("#jvaq","Was ist überfällig?");await p.click("#jvgo");await p.waitForTimeout(300);await p.screenshot({path:S+"uebs_b.png",fullPage:true});
 await p.click(".jvax");await p.waitForTimeout(150);console.log("Antwort nach ×:",JSON.stringify(await p.textContent("#jvans")));
 await p.evaluate(()=>{draw()});await p.waitForTimeout(150);console.log("Antwort nach Neuzeichnen:",JSON.stringify(await p.textContent("#jvans")));
 await p.click('.jvln[data-jp] >> nth=0');await p.waitForTimeout(200);console.log("Zeile antippen → Ansicht",await p.evaluate(()=>view+" "+curPack));
 console.log("Fehler:",errs);await b.close()})();
