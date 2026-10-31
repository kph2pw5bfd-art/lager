/* Test 1.78: Lager 55 – Artikel holt Fahrer/Monteur selbst (Artikelliste-Häkchen, Herrichten, Umstellen, Info-Mail, Abgleich, Assistent) – SP = Ordner mit fakesb.js */
const {chromium}=require("playwright");const fs=require("fs");const S=(process.env.SP||"/tmp")+"/";
const t0=new Date();t0.setHours(0,0,0,0);const T0=t0.getTime(),D=n=>{const d=new Date(T0);d.setDate(d.getDate()+n);return d.getTime()};
const kat=JSON.parse(fs.readFileSync(__dirname+"/rkat.json","utf8")).map((x,i)=>({col:"rkat",id:"k"+i,data:x.nr==="3193"?{...x,l55:true}:x}));
const J=o=>JSON.stringify(o);
const seed=kat.concat([
 {col:"pack",id:"P",data:{ord:"260170001",ps:"14700",ev:"Kirtag Mödling",pl:"Max Muster",db:T0+8*36e5,de:D(4),pos:[{p:"1",n:4,u:"Stk",t:"Kabel CEE 32A 50m",a:"1098",f:0},{p:"2",n:2,u:"Stk",t:"VT 16A auf 3x16A",a:"3193",f:0},{p:"3",n:3,u:"Stk",t:"Schuko 20m",a:"1081",f:0}],by:"u1",t:Date.now()}},
 {col:"pack",id:"Q",data:{ord:"260180001",ps:"14800",ev:"Herbstfest Krems",pl:"Max Muster",db:D(-8),de:D(-2),pos:[{p:"1",n:4,u:"Stk",t:"Kabel CEE 32A 50m",a:"1098",f:0},{p:"2",n:2,u:"Stk",t:"VT 16A auf 3x16A",a:"3193",f:0}],by:"u1",t:D(-9)}},
 {col:"packh",id:"Q",data:{c:1,h_1:{ok:true,by:"u1",t:1},fin:{by:"u1",t:1}}},
 {col:"retour",id:"rQ",data:{ev:"Herbstfest Krems",ord:"260180001",itemsJson:J({"1098":{nr:"1098",name:"32A Kabel 50m",q:4,g:"Kabel"},"3193":{nr:"3193",name:"Verteiler 16A->3x16A",q:1,g:"Verteiler"}}),by:"u1",t:D(-1),closed:true,art:"end",closedBy:"u1",closedT:Date.now()-36e5}}]);
(async()=>{const b=await chromium.launch();const ctx=await b.newContext({viewport:{width:390,height:844}});
 await ctx.addInitScript(()=>{localStorage.setItem("tpc_jv_engine","device");localStorage.setItem("tpc_jv_style","sachlich");window.SpeechSynthesisUtterance=class{constructor(t){this.text=t}};Object.defineProperty(window,"speechSynthesis",{configurable:true,value:{getVoices:()=>[],addEventListener(){},cancel(){},speak(u){setTimeout(()=>u.onend&&u.onend(),5)}}})});
 const p=await ctx.newPage();const errs=[];p.on("pageerror",e=>errs.push(e.message));
 const fk=fs.readFileSync(S+"fakesb.js","utf8").replace("const T={docs:[]","const T={docs:"+JSON.stringify(seed));
 await ctx.route("**/*",r=>{const u=r.request().url();if(u.startsWith("https://app.test/"))return r.fulfill({body:fs.readFileSync("/home/claude/gh/index.html"),contentType:"text/html"});if(u.includes("supabase-js"))return r.fulfill({body:fk,contentType:"text/javascript"});return r.fulfill({status:404,body:""})});
 await p.goto("https://app.test/");await p.waitForTimeout(900);await p.mouse.click(195,420);await p.waitForTimeout(500);
 const T=async sel=>(await p.$$eval(sel,l=>l.map(x=>x.innerText.replace(/\s+/g," ").trim()))).join(" | ");
 const V=async v=>{await p.evaluate(v=>{document.querySelectorAll(".ov").forEach(o=>o.remove());view=v;hist=["start"];draw()},v);await p.waitForTimeout(250)};
 const prog=()=>p.evaluate(()=>{const g=pkProg(packs.find(x=>x.id==="P"));return g.d+" von "+g.n+" (Lager 55: "+g.l55+")"});
 await p.evaluate(()=>{curPack="P"});await V("packopen");
 console.log("Fortschritt:",await prog(),"|",await T(".pkprog"));
 console.log("Gruppen:",await p.$$eval(".pkg",l=>l.map(x=>x.textContent).join(" → ")));console.log("Lager-55-Zeile:",await T(".pk-l55"));
 await p.screenshot({path:S+"l55_herr.png",fullPage:true});
 /* normale Positionen abhaken → abschließen ohne Rückfrage zu offenen Positionen */
 for(const i of [0,2]){await p.click('[data-pc="'+i+'"]');await p.waitForTimeout(250)}
 console.log("Nach Abhaken:",await prog());
 /* umstellen: Lager 55 → selbst packen → wieder Lager 55 */
 await p.click('.pk-l55 [data-pe]');await p.waitForTimeout(150);console.log("Dialog:",await T(".ov .card"));await p.click("#p55s");await p.waitForTimeout(300);
 console.log("Nach „Packe ich doch selbst“:",await prog());
 await p.click('[data-pe="1"] >> nth=0');await p.waitForTimeout(150);console.log("Bearbeiten hat Knopf:",await p.isVisible("#pe55"));await p.click("#pe55");await p.waitForTimeout(300);
 console.log("Nach „Holt Fahrer – Lager 55“:",await prog());
 await p.click("#pkfin");await p.waitForTimeout(400);console.log("Nach Abschließen:",await T(".ov p"),"| Mail-Text:",await p.evaluate(()=>pkMailText(packs.find(x=>x.id==="P")).body.split("\n").filter(l=>l.startsWith("-")).join(" / ")||"(keine Abweichungen)"));
 /* Abgleich: Lager 55 zählt nicht, 1 kam über uns zurück */
 await p.evaluate(()=>{curPack="Q"});await V("pkabg");console.log("Konto Krems:",await T(".abgnums"),"| Kopf:",await T(".abgcard:nth-of-type(1) .abgpkb"));console.log("Artikel:",await T(".abgart"));
 console.log("Zu viel zurück:",await p.evaluate(()=>abgAllMore().length),"| Fehlt noch:",await p.evaluate(()=>abgMissing().map(g=>g.name+" "+g.n).join(", ")||"–"));
 await p.screenshot({path:S+"l55_konto.png",fullPage:true});
 /* Assistent */
 await V("jarvis");await p.fill("#jvaq","Wo ist Artikel 3193?");await p.click("#jvgo");await p.waitForTimeout(250);console.log("❓ Wo ist 3193 →",await p.textContent(".jvat"),"|",await T(".jvarows .jvrow"));
 /* Artikelliste: Häkchen */
 await p.evaluate(()=>alEdit(rkat.find(a=>a.nr==="3193")));await p.waitForTimeout(150);console.log("Artikelliste-Häkchen gesetzt:",await p.isChecked("#el55"));
 await p.evaluate(()=>document.querySelectorAll(".ov").forEach(o=>o.remove()));await p.evaluate(()=>alEdit(rkat.find(a=>a.nr==="1098")));await p.waitForTimeout(150);await p.check("#el55");await p.click("#esv");await p.waitForTimeout(400);
 console.log("Gespeichert l55 bei 1098:",await p.evaluate(()=>(rkat.find(a=>a.nr==="1098")||{}).l55));
 console.log("Fehler:",errs);await b.close()})();
