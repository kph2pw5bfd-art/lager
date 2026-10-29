const {chromium}=require("playwright");const fs=require("fs");const S="/tmp/claude-0/-home-claude/a6efebc1-256e-5874-b05e-dc76785976da/scratchpad/";const now=Date.now();
const seed="const T={docs:["+JSON.stringify([
 {col:"retour",id:"r1",data:{ev:"Stadtfest Linz",ord:"2601080-01",itemsJson:"{}",by:"u1",t:now-864e5,modT:now-3600e3}},
 {col:"retour",id:"r3",data:{ev:"Ice Magic Innsbruck",ord:"2601090-02",itemsJson:"{}",by:"u1",t:now-2*864e5}},
 {col:"defekte",id:"d1",data:{art:"VT 125A Maxi 2",ev:"Ice Magic",by:"u1",t:now-864e5,done:false,urg:true}},
 {col:"defekte",id:"d2",data:{art:"Kabel 32A 25m",ev:"Stadtfest",by:"u1",t:now-3*864e5,done:false}},
 {col:"defekte",id:"d3",data:{art:"Scheinwerfer LED",ev:"Gala",by:"u1",t:now-5*864e5,done:true,doneT:now-7200e3}}
]).slice(1,-1)+",";
const sets={
 edge:["Microsoft Katja Online (Natural) - German (Germany)|de-DE","Microsoft Conrad Online (Natural) - German (Germany)|de-DE","Microsoft Hedda - German (Germany)|de-DE","Microsoft Jonas Online (Natural) - German (Austria)|de-AT","Microsoft David - English (United States)|en-US"],
 android:["Deutsch Deutschland|de-DE","Google Deutsch|de-DE","English United States|en-US"],
 iphone:["Anna|de-DE","Helena|de-DE","Martin|de-DE","Markus (Erweitert)|de-DE","Petra (Premium)|de-DE"],
 iphone_ab_werk:["Anna|de-DE|com.apple.voice.compact.de-DE.Anna","Anna|de-DE|com.apple.voice.enhanced.de-DE.Anna","Samantha|en-US|com.apple.voice.compact.en-US.Samantha"],
 iphone_martin:["Anna|de-DE|com.apple.voice.compact.de-DE.Anna","Anna|de-DE|com.apple.voice.enhanced.de-DE.Anna","Martin|de-DE|com.apple.voice.enhanced.de-DE.Martin"],
 keine:["Samantha|en-US"]};
(async()=>{const b=await chromium.launch();
 for(const [k,vs] of Object.entries(sets)){
  const ctx=await b.newContext({viewport:{width:390,height:844}});
  await ctx.addInitScript(vs=>{window.__said=[];localStorage.setItem("tpc_jv_engine","device");const V=vs.map(x=>{const [name,lang,uri]=x.split("|");return{name,lang,voiceURI:uri||name,default:false,localService:true}});
   window.SpeechSynthesisUtterance=class{constructor(t){this.text=t}};
   Object.defineProperty(window,"speechSynthesis",{configurable:true,value:{getVoices:()=>V,addEventListener(){},cancel(){window.__cancel=(window.__cancel||0)+1},speak(u){__said.push({t:u.text,v:u.voice&&u.voice.name,p:u.pitch,r:u.rate});setTimeout(()=>u.onend&&u.onend(),30)}}})},vs);
  const p=await ctx.newPage();const errs=[];p.on("pageerror",e=>errs.push(e.message));
  await ctx.route("**/*",r=>{const u=r.request().url();if(u.startsWith("https://app.test/"))return r.fulfill({body:fs.readFileSync("/home/claude/gh/index.html"),contentType:"text/html"});
   if(u.includes("supabase-js"))return r.fulfill({body:fs.readFileSync(S+"fakesb.js","utf8").replace("const T={docs:[",seed),contentType:"text/javascript"});return r.fulfill({status:404,body:""})});
  await p.goto("https://app.test/");await p.waitForTimeout(700);await p.mouse.click(195,420);await p.waitForTimeout(300);
  await p.evaluate(()=>{view="jarvis";hist=["start"];draw()});await p.waitForTimeout(300);
  console.log("== "+k+": gewählt →",await p.evaluate(()=>{const v=jvVoice();return v?v.name:"(keine)"}));
  await p.click("#jvsp");await p.waitForTimeout(150);console.log("   Knopf beim Sprechen:",await p.textContent("#jvsp"),"| Kreis pulsiert:",await p.evaluate(()=>document.getElementById("jv").classList.contains("talk")));
  await p.waitForTimeout(3000);const said=await p.evaluate(()=>__said);
  if(k==="edge"){said.forEach((x,i)=>console.log("   Satz "+(i+1)+":",x.t));console.log("   Stimme/Tonlage/Tempo:",said[0].v,said[0].p,said[0].r)}
  console.log("   Sätze gesprochen:",said.length,"| danach Knopf:",await p.textContent("#jvsp"));
  if(k.startsWith("iphone_")){await p.click("#jvvc");await p.waitForTimeout(200);console.log("   Auswahl:",(await p.$$eval("#jvvs option",l=>l.map(o=>o.textContent))).join(" | "));await p.click("#jvvo")}
  if(k==="edge"){await p.click("#jvvc");await p.waitForTimeout(200);const opts=await p.$$eval("#jvvs option",l=>l.map(o=>o.textContent));console.log("   Auswahl:",opts.join(" | "));
   await p.screenshot({path:S+"jvv_dlg.png"});
   await p.selectOption("#jvvs",{index:2});await p.fill("#jvvp","0.75");await p.evaluate(()=>document.getElementById("jvvp").dispatchEvent(new Event("input")));
   await p.evaluate(()=>__said.length=0);await p.click("#jvvt");await p.waitForTimeout(800);const pr=await p.evaluate(()=>__said);console.log("   Probe:",pr.map(x=>x.t).join(" / "),"→",pr[0]&&pr[0].v,pr[0]&&pr[0].p);
   await p.click("#jvvo");await p.reload();await p.waitForTimeout(700);await p.mouse.click(195,420);await p.waitForTimeout(200);console.log("   Nach Neuladen gemerkt:",await p.evaluate(()=>[jvVoice().name,jvPitch()].join(", ")));}
  console.log("   Fehler:",errs);await ctx.close()}
 await b.close()})();
