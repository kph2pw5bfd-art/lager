/* Test 1.71: iPhone – Mikrofon liefert nur beim ersten Mal Ton -> danach Tastatur-Mikrofon; Schalter "Vorlesen an/aus" */
const {chromium}=require("playwright");const fs=require("fs");const S=(process.env.SP||"/tmp")+"/";
(async()=>{const b=await chromium.launch();
 const ctx=await b.newContext({viewport:{width:390,height:844},userAgent:"Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.0 Mobile/15E148 Safari/604.1"});
 await ctx.addInitScript(()=>{window.__said=[];localStorage.setItem("tpc_jv_engine","device");window.SpeechSynthesisUtterance=class{constructor(t){this.text=t}};
  Object.defineProperty(window,"speechSynthesis",{configurable:true,value:{getVoices:()=>[{name:"G",lang:"de-DE",voiceURI:"g"}],addEventListener(){},cancel(){},speak(u){__said.push(u.text);setTimeout(()=>u.onend&&u.onend(),5)}}});
  window.__n=0;const C=class{start(){const n=window.__n++;if(n===0){setTimeout(()=>{this.onresult&&this.onresult({results:[Object.assign([{transcript:"Was ist überfällig"}],{isFinal:true})]})},80)}else{setTimeout(()=>{this.onend&&this.onend()},300)}}stop(){setTimeout(()=>{this.onend&&this.onend()},30)}abort(){}};
  window.SpeechRecognition=window.webkitSpeechRecognition=C});
 /* ab 1.73 öffnet „Hilfe“ den Hilfe-Bildschirm – für diese Tests gleich wieder schließen */await ctx.addInitScript(()=>{new MutationObserver(()=>document.querySelectorAll(".jvhelp").forEach(o=>o.remove())).observe(document,{childList:true,subtree:true})});const p=await ctx.newPage();const errs=[];p.on("pageerror",e=>errs.push(e.message));
 await ctx.route("**/*",r=>{const u=r.request().url();if(u.startsWith("https://app.test/"))return r.fulfill({body:fs.readFileSync("/home/claude/gh/index.html"),contentType:"text/html"});if(u.includes("supabase-js"))return r.fulfill({body:fs.readFileSync(S+"fakesb.js","utf8"),contentType:"text/javascript"});return r.fulfill({status:404,body:""})});
 await p.goto("https://app.test/");await p.waitForTimeout(800);await p.mouse.click(195,420);await p.waitForTimeout(300);
 await p.evaluate(()=>{view="jarvis";hist=["start"];draw()});await p.waitForTimeout(300);
 await p.click("#jvmic");await p.waitForTimeout(1600);console.log("1. Frage:",await p.textContent(".jvaq2"),"| gesprochen:",await p.evaluate(()=>__said.length>0));
 await p.click("#jvmic");await p.waitForTimeout(800);console.log("2. Tippen → Status:",await p.textContent("#jvms"));
 await p.click("#jvmic");await p.waitForTimeout(300);console.log("3. Tippen → Status:",await p.textContent("#jvms"),"| Eingabefeld hat Fokus:",await p.evaluate(()=>document.activeElement&&document.activeElement.id));
 console.log("Schalter:",await p.textContent("#jvrd"));await p.click("#jvrd");console.log("→",await p.textContent("#jvrd"),"| gespeichert:",await p.evaluate(()=>localStorage.getItem("tpc_jv_askread")));
 await p.evaluate(()=>__said.length=0);await p.fill("#jvaq","Hilfe");await p.click("#jvgo");await p.waitForTimeout(400);console.log("Vorlesen aus → gesprochen:",await p.evaluate(()=>__said.length),"| Antwort angezeigt:",!!(await p.textContent(".jvat")));
 await p.click("#jvsp");await p.waitForTimeout(400);console.log("Briefing trotzdem vorgelesen:",await p.evaluate(()=>__said.length>0));
 await p.screenshot({path:S+"mic2.png"});console.log("Fehler:",errs);await b.close()})();
