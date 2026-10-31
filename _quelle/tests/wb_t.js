/* Test 1.81: Wochenbericht – Inhalt, Wochenwechsel, Punkte eintragen/abhaken, Druck (PDF) – SP = Ordner mit fakesb.js */
const {chromium}=require("playwright");const fs=require("fs");const S=(process.env.SP||"/tmp")+"/";
const t0=new Date();t0.setHours(0,0,0,0);const T0=t0.getTime(),H=36e5;
/* Besprechung wie in der App: Mo dieser Woche, am Wochenende der nächste Montag */
const wd=t0.getDay(),mon=new Date(T0);mon.setDate(mon.getDate()-((wd+6)%7));if(wd===6||wd===0)mon.setDate(mon.getDate()+7);const M=mon.getTime();
const at=(d,h)=>{const x=new Date(M);x.setDate(x.getDate()+d);x.setHours(h||10,0,0,0);return x.getTime()};
const kat=JSON.parse(fs.readFileSync(__dirname+"/rkat.json","utf8")).map((x,i)=>({col:"rkat",id:"k"+i,data:x}));
const J=o=>JSON.stringify(o),pos=(n)=>[{p:"1",n,u:"Stk",t:"Kabel CEE 32A 50m",a:"1098",f:0},{p:"2",n:3,u:"Stk",t:"Schuko 20m",a:"1081",f:2}];
const pk=(id,ord,ev,db,de,extra)=>({col:"pack",id,data:{ord,ps:id,ev,pl:"Max Muster",db,de,pos:pos(4),by:"u1",t:db-H,...(extra||{})}});
const fin=(id,t,more)=>({col:"packh",id,data:{c:1,h_1:{ok:true,by:"u1",t},h_2:{ok:true,fm:"miete",by:"u1",t},fin:{by:"u1",t},...(more||{})}});
const seed=kat.concat([
 pk("A","260130001","Gala Wien",at(-7,8),at(-6,18)),fin("A",at(-7,9)),
 pk("B","260140001","Adventmarkt Baden",at(-6,8),at(10,18)),fin("B",at(-5,11),{hd:{d:new Date(at(-5)).toISOString().slice(0,10).replace(/(\d+)-(\d+)-(\d+)/,(m,y,mo,d)=>y+"-"+mo+"-"+d),why:"Kunde später",by:"u1",t:at(-6)}}),
 pk("C","260150001","Ice Magic",at(-9,8),at(-6,18)),fin("C",at(-9,9)),
 pk("D","260160001","Stadtfest Graz",at(-12,8),at(-4,18)),fin("D",at(-12,9)),
 pk("E","260170001","Kirtag Mödling",at(0,8),at(2,18)),
 pk("F","260180001","Christkindlmarkt Wien",at(3,8),at(30,18)),
 pk("G","260190001","Eislaufplatz Mödling",at(5,8),at(40,18)),
 {col:"retour",id:"rA",data:{ev:"Gala Wien",ord:"260130001",itemsJson:J({"1098":{nr:"1098",name:"32A Kabel 50m",q:4,g:"Kabel"},"1081":{nr:"1081",name:"Schuko 20m",q:1,g:"Kabel"}}),by:"u1",t:at(-6),closed:true,art:"end",closedBy:"u1",closedT:at(-6,15)}},
 {col:"retour",id:"rC",data:{ev:"Ice Magic",ord:"260150001",itemsJson:J({"1098":{nr:"1098",name:"32A Kabel 50m",q:2,g:"Kabel"}}),by:"u1",t:at(-3),closed:true,art:"end",closedBy:"u1",closedT:at(-3,14)}},
 {col:"retour",id:"rB",data:{ev:"Adventmarkt Baden",ord:"260140001",itemsJson:J({"1098":{nr:"1098",name:"32A Kabel 50m",q:2,g:"Kabel"}}),by:"u1",t:at(-2),closed:true,art:"teil",closedBy:"u1",closedT:at(-2,16)}},
 {col:"defekte",id:"d1",data:{art:"32A Kabel 50m",anr:"1098",ev:"Gala Wien",by:"u1",t:at(-4),done:false,urg:true}},
 {col:"wbnote",id:"n1",data:{txt:"Urlaubsplanung Dezember",by:"u1",t:at(-14),done:null}},
 {col:"wbnote",id:"n2",data:{txt:"Neue Gitterboxen für 32A-Kabel bestellen?",by:"u1",t:at(-4),done:null}},
 {col:"wbnote",id:"n3",data:{txt:"Schon erledigt",by:"u1",t:at(-10),done:{by:"u1",t:at(-7)}}}]);
(async()=>{const b=await chromium.launch();const ctx=await b.newContext({viewport:{width:390,height:844}});
 const p=await ctx.newPage();const errs=[];p.on("pageerror",e=>errs.push(e.message));
 const fk=fs.readFileSync(S+"fakesb.js","utf8").replace("const T={docs:[]","const T={docs:"+JSON.stringify(seed));
 await ctx.route("**/*",r=>{const u=r.request().url();if(u.startsWith("https://app.test/"))return r.fulfill({body:fs.readFileSync("/home/claude/gh/index.html"),contentType:"text/html"});if(u.includes("supabase-js"))return r.fulfill({body:fk,contentType:"text/javascript"});return r.fulfill({status:404,body:""})});
 await p.goto("https://app.test/");await p.waitForTimeout(900);await p.mouse.click(195,420);await p.waitForTimeout(500);
 const T=async sel=>(await p.$$eval(sel,l=>l.map(x=>x.innerText.replace(/\s+/g," ").trim()))).join(" | ");
 await p.evaluate(()=>{view="jarvis";hist=["start"];draw()});await p.waitForTimeout(300);console.log("Knopf in der Übersicht:",await T("#jvwb"));
 await p.click("#jvwb");await p.waitForTimeout(300);console.log("Ansicht:",await p.evaluate(()=>view),"|",await T(".wbnav"));
 for(const s of [".wbpaper .wbl"]){const L=await p.$$eval(".wbpaper:not(.wbprint) .wbl",l=>l.map(x=>x.innerText.replace(/\s+/g," ")));L.forEach(x=>console.log("  ",x.slice(0,330)))}
 console.log("  Noch offen:",await T(".wbpaper:not(.wbprint) .wboff"));
 console.log("  Diese Woche:",(await T(".wbpaper:not(.wbprint) .wbt")).slice(0,500));console.log("  Achtung:",await T(".wbpaper:not(.wbprint) .wbach"));
 console.log("  Punkte:",await T(".wbpaper:not(.wbprint) .wbn"));
 await p.screenshot({path:S+"wb_app.png",fullPage:true});
 /* Punkt eintragen + abhaken */
 await p.fill("#wbin","Stapler-Wartung ansprechen");await p.press("#wbin","Enter");await p.waitForTimeout(400);console.log("Nach Eintragen:",await T(".wbedit .wbei"));
 await p.click('[data-wbd="n1"]');await p.waitForTimeout(400);console.log("Nach Abhaken n1:",await T(".wbpaper:not(.wbprint) .wbn"),"| Erledigt-Liste:",await T(".wbdone summary"));
 /* Woche zurück */
 await p.click("#wbp");await p.waitForTimeout(200);console.log("Eine Woche zurück:",await T(".wbnav"));await p.click("#wbnow");await p.waitForTimeout(200);
 /* Drucken: Druckansicht als PDF */
 await p.evaluate(()=>{window.print=()=>{window.__printed=true};});await p.click("#wbpr");await p.waitForTimeout(100);console.log("Drucken aufgerufen:",await p.evaluate(()=>!!window.__printed),"| Klasse gesetzt:",await p.evaluate(()=>document.body.classList.contains("wbprinting")));
 const pdfP=await ctx.newPage();await pdfP.setContent(await p.evaluate(()=>{document.body.classList.add("wbprinting");return "<!doctype html>"+document.documentElement.outerHTML}),{waitUntil:"domcontentloaded"});
 await pdfP.emulateMedia({media:"print"});await pdfP.pdf({path:S+"wb.pdf",format:"A4",printBackground:true,preferCSSPageSize:true});
 await pdfP.setViewportSize({width:740,height:1050});await pdfP.screenshot({path:S+"wb_print.png",fullPage:true});
 console.log("PDF-Seiten:",(fs.readFileSync(S+"wb.pdf","latin1").match(/\/Type\s*\/Page[^s]/g)||[]).length);
 console.log("Fehler:",errs);await b.close()})();
