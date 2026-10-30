/* Test 1.68: Frag Jarvis – feste Fragen, Antworten aus den Daten, Mikrofon (Attrappe) */
const {chromium}=require("playwright");const fs=require("fs");const S=(process.env.SP||"/tmp")+"/";
const t0=new Date();t0.setHours(0,0,0,0);const T0=t0.getTime(),day=864e5,D=n=>{const d=new Date(T0);d.setDate(d.getDate()+n);return d.getTime()};
const P1=[{p:"1.7",n:16,u:"Stk",t:"Kabel CEE 32A 5pol 50m",a:"1098",f:0},{p:"1.14",n:20,u:"Stk",t:"Kabel Schuko 20m",a:"1081",f:11}];
const P2=[{p:"1.1",n:4,u:"Stk",t:"Kabel CEE 32A 5pol 50m",a:"1098",f:0}];
const seed=[{col:"rkat",id:"k1",data:{nr:"1098",g:"Kabel",u:"CEE 32A",name:"CEE 32A 50m",o:1}},{col:"rkat",id:"k2",data:{nr:"1097",g:"Kabel",u:"CEE 32A",name:"CEE 32A 25m",o:2}},
 {col:"pack",id:"a",data:{ord:"260111401",ps:"a",ev:"Winterwunder Mörbisch",pl:"Marvin Wellisch",db:T0-2*day,de:D(60),pos:P1,by:"u1",t:1}},
 {col:"packh",id:"a",data:{c:1,h_1_7:{q:15,alt:[{n:2,t:"CEE 32A 25m",a:"1097"}],by:"u1",t:1},h_1_14:{ok:true,fm:"miete",by:"u1",t:1},fin:{by:"u1",t:1}}},
 {col:"pack",id:"b",data:{ord:"260120001",ps:"b",ev:"Messe Linz",pl:"Max PL",db:T0+8*36e5,de:D(4),pos:P2,by:"u1",t:1}},
 {col:"pack",id:"c",data:{ord:"260130001",ps:"c",ev:"Gala Wien",pl:"Max PL",db:D(-9),de:D(-3),pos:P2,by:"u1",t:1}},{col:"packh",id:"c",data:{c:1,h_1_1:{ok:true,by:"u1",t:1},fin:{by:"u1",t:1}}},
 {col:"pack",id:"d",data:{ord:"260140001",ps:"d",ev:"Adventmarkt Baden",pl:"Max PL",db:D(-1),de:D(5),pos:P2,by:"u1",t:1}},
 {col:"retour",id:"r1",data:{ev:"Gala Wien",ord:"2601300-01",itemsJson:"{}",by:"u1",t:Date.now()}},
 {col:"defekte",id:"d1",data:{art:"VT 125A Maxi 2",ev:"Ice Magic",by:"u1",t:Date.now()-day,done:false,urg:true}},{col:"defekte",id:"d2",data:{art:"Kabel 32A 25m",by:"u1",t:Date.now()-day,done:false}}];
(async()=>{const b=await chromium.launch();const ctx=await b.newContext({viewport:{width:390,height:844}});
 await ctx.addInitScript(()=>{window.__said=[];localStorage.setItem("tpc_jv_engine","device");localStorage.setItem("tpc_jv_style","sachlich");window.SpeechSynthesisUtterance=class{constructor(t){this.text=t}};
  Object.defineProperty(window,"speechSynthesis",{configurable:true,value:{getVoices:()=>[{name:"G",lang:"de-DE",voiceURI:"g"}],addEventListener(){},cancel(){},speak(u){__said.push(u.text);setTimeout(()=>u.onend&&u.onend(),5)}}});
  window.SpeechRecognition=window.webkitSpeechRecognition=class{start(){console.log("MIC-START");setTimeout(()=>{this.onresult&&this.onresult({results:[Object.assign([{transcript:"Was ist überfällig"}],{isFinal:true})]});this.onend&&this.onend()},50)}stop(){}}});
 /* ab 1.73 öffnet „Hilfe“ den Hilfe-Bildschirm – für diese Tests gleich wieder schließen */await ctx.addInitScript(()=>{new MutationObserver(()=>document.querySelectorAll(".jvhelp").forEach(o=>o.remove())).observe(document,{childList:true,subtree:true})});const p=await ctx.newPage();const errs=[];p.on("pageerror",e=>errs.push(e.message));p.on("console",m=>{if(/MIC/.test(m.text()))console.log("PAGE:",m.text())});
 const fk=fs.readFileSync(S+"fakesb.js","utf8").replace("const T={docs:[]","const T={docs:"+JSON.stringify(seed));
 await ctx.route("**/*",r=>{const u=r.request().url();if(u.startsWith("https://app.test/"))return r.fulfill({body:fs.readFileSync("/home/claude/gh/index.html"),contentType:"text/html"});if(u.includes("supabase-js"))return r.fulfill({body:fk,contentType:"text/javascript"});return r.fulfill({status:404,body:""})});
 await p.goto("https://app.test/");await p.waitForTimeout(800);await p.mouse.click(195,420);await p.waitForTimeout(400);
 await p.evaluate(()=>{view="jarvis";hist=["start"];draw()});await p.waitForTimeout(300);
 console.log("Mikrofon-Knopf sichtbar:",await p.isVisible("#jvmic"));
 const Q=["Hilfe","Was ist heute herzurichten?","Was ist diese Woche herzurichten","Was ist nicht hergerichtet?","Was kommt heute zurück?","Was ist überfällig?","Welche Defekte sind offen?","Was ist dringend?","Wo ist Artikel 1098?","Wo sind die Kabel CEE 32A 50m?","Wo ist Artikel 1097","Wo ist die Kette","Was ist mit Auftrag 260111401?","Was ist mit Messe Linz","Blablabla"];
 for(const q of Q){await p.fill("#jvaq",q);await p.click("#jvgo");await p.waitForTimeout(250);
  console.log("❓ "+q+"\n   → "+await p.textContent(".jvat")+(await p.$$eval(".jvarows .jvrow",l=>l.length?" ["+l.map(x=>x.innerText.replace(/\s+/g," ")).join(" | ")+"]":"")))}
 await p.screenshot({path:S+"ask.png",fullPage:true});
 await p.fill("#jvaq","Was ist mit Auftrag 260111401?");await p.click("#jvgo");await p.waitForTimeout(200);console.log("Knöpfe:",await p.$$eval(".jvacts button",l=>l.map(x=>x.textContent).join(" | ")));
 await p.evaluate(()=>__said.length=0);await p.click("#jvmic");await p.waitForTimeout(800);console.log("Mikrofon → Frage:",await p.textContent(".jvaq2"),"| gesprochen:",(await p.evaluate(()=>__said)).join(" "));
 await p.fill("#jvaq","Zeig mir Auftrag 260111401");await p.click("#jvgo");await p.waitForTimeout(300);console.log("Zeig → Ansicht:",await p.evaluate(()=>view+" "+curPack));
 await p.evaluate(()=>{view="jarvis";draw()});await p.waitForTimeout(200);await p.fill("#jvaq","Defekt melden");await p.click("#jvgo");await p.waitForTimeout(200);console.log("Defekt melden → Ansicht:",await p.evaluate(()=>view));
 console.log("Fehler:",errs);await b.close()})();
