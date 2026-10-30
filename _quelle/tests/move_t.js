/* Test 1.63: Herrichten verschieben, Hinweis "Noch nicht hergerichtet" und "verschoben" in der Packlisten-Liste */
const {chromium}=require("playwright");const fs=require("fs");const S=(process.env.SP||"/tmp")+"/";
const t0=new Date();t0.setHours(0,0,0,0);const T0=t0.getTime(),day=864e5;
const pos=[{p:"1.1",n:2,u:"Stk",t:"VT",a:"1048",f:0}];
const mk=(id,ev,db,de)=>({col:"pack",id,data:{ord:"26"+id,ps:id,ev,pl:"Max PL",db,de,pos,by:"u1",t:Date.now()}});
const seed=[mk("late","Messe Wels",T0-2*day+8*36e5,T0+5*day),mk("today","Stadtfest Graz",T0+8*36e5,T0+6*day),mk("fut","Gala Wien",T0+3*day+8*36e5,T0+7*day),mk("donepast","Ice Magic",T0-4*day,T0+4*day),
 {col:"packh",id:"donepast",data:{c:1,fin:{by:"u1",t:Date.now()-3*day}}}];
(async()=>{const b=await chromium.launch();const ctx=await b.newContext({viewport:{width:390,height:844}});
 await ctx.addInitScript(()=>{window.__said=[];localStorage.setItem("tpc_jv_engine","device");localStorage.setItem("tpc_jv_style","sachlich");window.SpeechSynthesisUtterance=class{constructor(t){this.text=t}};
  Object.defineProperty(window,"speechSynthesis",{configurable:true,value:{getVoices:()=>[{name:"G",lang:"de-DE",voiceURI:"g"}],addEventListener(){},cancel(){},speak(u){__said.push(u.text);setTimeout(()=>u.onend&&u.onend(),5)}}})});
 const p=await ctx.newPage();const errs=[];p.on("pageerror",e=>errs.push(e.message));
 const fk=fs.readFileSync(S+"fakesb.js","utf8").replace("const T={docs:[]","const T={docs:"+JSON.stringify(seed));
 await ctx.route("**/*",r=>{const u=r.request().url();if(u.startsWith("https://app.test/"))return r.fulfill({body:fs.readFileSync("/home/claude/gh/index.html"),contentType:"text/html"});if(u.includes("supabase-js"))return r.fulfill({body:fk,contentType:"text/javascript"});return r.fulfill({status:404,body:""})});
 await p.goto("https://app.test/");await p.waitForTimeout(800);await p.mouse.click(195,420);await p.waitForTimeout(400);
 const list=async t=>{await p.evaluate(()=>{view="packall";hist=["start"];draw()});await p.waitForTimeout(200);const r=await p.evaluate(()=>[...document.querySelectorAll("#app h3.pkh, #app .pkr")].map(e=>e.tagName==="H3"?"["+e.textContent.replace(/\s+\d+$/,"")+"]":e.querySelector("b").textContent+" ("+(e.querySelector(".tag")?e.querySelector(".tag").textContent:"-")+")"+(e.querySelector(".pkhint")?" -> "+e.querySelector(".pkhint").textContent:"")));console.log("== "+t+"\n   "+r.join("\n   "))};
 await list("Ausgangslage");await p.screenshot({path:S+"move_list.png",fullPage:true});
 await p.click('[data-pk="today"]');await p.waitForTimeout(200);console.log("Detail heute:",await p.textContent(".pkhday"));
 await p.click("#pkmv");await p.waitForTimeout(150);await p.screenshot({path:S+"move_dlg.png"});await p.click('[data-mvd="1"]');await p.fill("#pmvw","Material kommt erst morgen");await p.click("#pmvs");await p.waitForTimeout(300);
 console.log("nach Verschieben:",await p.textContent(".pkhday"),"|",await p.evaluate(()=>(document.querySelector("#app .pkhint")||{}).textContent));
 console.log("gespeichert:",await p.evaluate(()=>JSON.stringify(__T.docs.find(d=>d.col==="packh"&&d.id==="today").data.hd)));
 await p.evaluate(()=>{curPack="fut";view="packopen";draw()});await p.waitForTimeout(150);await p.click("#pkmv");await p.click('[data-mvd="0"]');await p.click("#pmvs");await p.waitForTimeout(300);
 await list("nach Verschieben (Stadtfest → morgen, Gala → heute)");
 await p.evaluate(()=>{view="jarvis";hist=["start"];draw()});await p.waitForTimeout(300);await p.click("#jvsp");await p.waitForTimeout(2500);console.log("Briefing:",(await p.evaluate(()=>__said)).slice(1,2).join(""));
 await p.evaluate(()=>{curPack="today";view="packopen";hist=["start"];draw()});await p.waitForTimeout(150);await p.click("#pkmv");await p.waitForTimeout(100);await p.click("#pmvr");await p.waitForTimeout(300);
 console.log("zurückgesetzt:",await p.textContent(".pkhday"),"| hd:",await p.evaluate(()=>JSON.stringify(__T.docs.find(d=>d.col==="packh"&&d.id==="today").data.hd)));
 await p.evaluate(()=>{curPack="donepast";view="packopen";draw()});await p.waitForTimeout(150);console.log("abgeschlossen → Verschieben-Knopf:",await p.evaluate(()=>!!document.querySelector("#pkmv")));
 console.log("Fehler:",errs);await b.close()})();
