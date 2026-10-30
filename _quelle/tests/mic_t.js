/* Test 1.69: mehrere Fragen hintereinander per Mikrofon – Attrappe wie iPhone (zweiter Start wirft, solange der erste nicht frei ist; Variante "hängt": stop() beendet nie) */
const {chromium}=require("playwright");const fs=require("fs");const S=(process.env.SP||"/tmp")+"/";
(async()=>{const b=await chromium.launch();
 for(const mode of ["normal","haengt"]){
  const ctx=await b.newContext({viewport:{width:390,height:844}});
  await ctx.addInitScript(mode=>{window.__said=[];localStorage.setItem("tpc_jv_engine","device");window.SpeechSynthesisUtterance=class{constructor(t){this.text=t}};
   Object.defineProperty(window,"speechSynthesis",{configurable:true,value:{getVoices:()=>[{name:"G",lang:"de-DE",voiceURI:"g"}],addEventListener(){},cancel(){},speak(u){__said.push(u.text);setTimeout(()=>u.onend&&u.onend(),5)}}});
   window.__Q=["Was ist überfällig","Hilfe","Welche Defekte sind offen"];window.__n=0;window.__active=false;
   const C=class{start(){if(window.__active){const e=new Error("already started");e.name="InvalidStateError";throw e}window.__active=true;const q=window.__Q[window.__n++%3];
     setTimeout(()=>{this.onresult&&this.onresult({results:[Object.assign([{transcript:q.slice(0,8)}],{isFinal:false})]})},60);
     setTimeout(()=>{this.onresult&&this.onresult({results:[Object.assign([{transcript:q}],{isFinal:true})]})},120)}
    stop(){if(mode==="haengt")return;setTimeout(()=>{window.__active=false;this.onend&&this.onend()},50)}abort(){window.__active=false}};
   window.SpeechRecognition=window.webkitSpeechRecognition=C},mode);
  const p=await ctx.newPage();const errs=[];p.on("pageerror",e=>errs.push(e.message));
  await ctx.route("**/*",r=>{const u=r.request().url();if(u.startsWith("https://app.test/"))return r.fulfill({body:fs.readFileSync("/home/claude/gh/index.html"),contentType:"text/html"});if(u.includes("supabase-js"))return r.fulfill({body:fs.readFileSync(S+"fakesb.js","utf8"),contentType:"text/javascript"});return r.fulfill({status:404,body:""})});
  await p.goto("https://app.test/");await p.waitForTimeout(800);await p.mouse.click(195,420);await p.waitForTimeout(300);
  await p.evaluate(()=>{view="jarvis";hist=["start"];draw()});await p.waitForTimeout(300);
  const got=[];for(let i=0;i<3;i++){await p.click("#jvmic");await p.waitForTimeout(1800);got.push(await p.textContent(".jvaq2"))}
  console.log("== "+mode+": "+got.join(" → ")+" | Mikrofon danach frei:",!(await p.evaluate(()=>window.__active))||mode==="haengt","| Knopf aus:",!(await p.evaluate(()=>$("#jvmic").classList.contains("on"))),"| Fehler:",errs);
  await ctx.close()}
 await b.close()})();
