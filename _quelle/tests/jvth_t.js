// Test Thorsten-Stimme (1.53): Stub-Modul statt echter vits-web-Bibliothek; Fall 2: Bibliothek nicht erreichbar -> Gerätestimme
const {chromium}=require("playwright");const fs=require("fs");const S="/tmp/claude-0/-home-claude/a6efebc1-256e-5874-b05e-dc76785976da/scratchpad/";
const stub=`let have=[];export async function stored(){return have}
export async function download(id,cb){window.__dl=id;for(const l of [20,60,100]){cb({url:"x",total:100,loaded:l});await new Promise(r=>setTimeout(r,60))}have.push(id)}
function wav(ms){const n=Math.round(22050*ms/1000),b=new ArrayBuffer(44+n*2),d=new DataView(b),w=(o,s)=>[...s].forEach((c,i)=>d.setUint8(o+i,c.charCodeAt(0)));
w(0,"RIFF");d.setUint32(4,36+n*2,true);w(8,"WAVEfmt ");d.setUint32(16,16,true);d.setUint16(20,1,true);d.setUint16(22,1,true);d.setUint32(24,22050,true);d.setUint32(28,44100,true);d.setUint16(32,2,true);d.setUint16(34,16,true);w(36,"data");d.setUint32(40,n*2,true);return new Blob([b],{type:"audio/wav"})}
export async function predict(o){(window.__th=window.__th||[]).push(o.text+"|"+o.voiceId);await new Promise(r=>setTimeout(r,40));return wav(150)}`;
(async()=>{const b=await chromium.launch({args:["--autoplay-policy=no-user-gesture-required"]});
 for(const fall of ["ok","kaputt","geraet"]){
  const ctx=await b.newContext({viewport:{width:390,height:844}});
  await ctx.addInitScript(f=>{window.__said=[];if(f==="geraet")localStorage.setItem("tpc_jv_engine","device");const V=[{name:"Anna",lang:"de-DE",voiceURI:"a1",localService:true},{name:"Anna",lang:"de-DE",voiceURI:"a2",localService:true}];
   window.SpeechSynthesisUtterance=class{constructor(t){this.text=t}};
   Object.defineProperty(window,"speechSynthesis",{configurable:true,value:{getVoices:()=>V,addEventListener(){},cancel(){},speak(u){__said.push(u.text);setTimeout(()=>u.onend&&u.onend(),30)}}})},fall);
  const p=await ctx.newPage();const errs=[];p.on("pageerror",e=>errs.push(e.message));
  await ctx.route("**/*",r=>{const u=r.request().url();if(u.startsWith("https://app.test/"))return r.fulfill({body:fs.readFileSync("/home/claude/gh/index.html"),contentType:"text/html"});
   if(u.includes("supabase-js"))return r.fulfill({body:fs.readFileSync(S+"fakesb.js","utf8"),contentType:"text/javascript"});
   if(u.includes("vits-web")&&fall==="ok")return r.fulfill({body:stub,contentType:"text/javascript",headers:{"access-control-allow-origin":"*"}});
   return r.fulfill({status:404,body:""})});
  await p.goto("https://app.test/");await p.waitForTimeout(700);await p.mouse.click(195,420);await p.waitForTimeout(300);
  await p.evaluate(()=>{view="jarvis";hist=["start"];draw()});await p.waitForTimeout(300);
  console.log("== "+fall+" | Version",await p.evaluate(()=>APPV),"| Motor:",await p.evaluate(()=>jvEngine()));
  await p.click("#jvsp");const seen=new Set();for(let i=0;i<40;i++){seen.add(await p.textContent("#jvsp"));await p.waitForTimeout(100)}
  console.log("   Knopftexte:",[...seen].join(" / "));
  await p.waitForTimeout(3000);
  console.log("   Thorsten-Sätze:",await p.evaluate(()=>(window.__th||[]).length),"| Gerätestimme-Sätze:",await p.evaluate(()=>__said.length),"| Download:",await p.evaluate(()=>window.__dl||"-"));
  console.log("   danach Knopf:",await p.textContent("#jvsp"),"| Kreis aus:",await p.evaluate(()=>!document.getElementById("jv").classList.contains("talk")));
  const t=await p.evaluate(()=>[...document.querySelectorAll(".toast,#toast")].map(e=>e.textContent).join(" "));if(t)console.log("   Hinweis:",t);
  if(fall==="ok"){console.log("   erster Satz:",await p.evaluate(()=>__th[0]));
   await p.evaluate(()=>{__th.length=0});await p.click("#jvsp");await p.waitForTimeout(250);await p.click("#jvsp");await p.waitForTimeout(800);console.log("   Stopp nach Start → Sätze:",await p.evaluate(()=>__th.length),"Knopf:",await p.textContent("#jvsp"));
   await p.click("#jvvc");await p.waitForTimeout(200);console.log("   Dialog: Thorsten aktiv",await p.evaluate(()=>document.getElementById("jvet").classList.contains("on")),"| Gerätefeld versteckt",await p.evaluate(()=>document.getElementById("jvdev").hidden));
   await p.screenshot({path:S+"jvth_dlg1.png"});await p.click("#jved");await p.waitForTimeout(150);
   console.log("   nach Gerätestimme: gespeichert",await p.evaluate(()=>localStorage.getItem("tpc_jv_engine")),"| Auswahl:",(await p.$$eval("#jvvs option",l=>l.map(o=>o.textContent))).join(" | "));
   await p.screenshot({path:S+"jvth_dlg2.png"});await p.click("#jvvo")}
  console.log("   Fehler:",errs);await ctx.close()}
 await b.close()})();
