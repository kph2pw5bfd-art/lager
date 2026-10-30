/* Test 1.55: Recht "Jarvis – Sehen" (jv_s) in der Benutzerverwaltung; Kollegen: nur Gerätestimme, Standard sachlich, Retourscheine nur mit Recht */
const {chromium}=require("playwright");const fs=require("fs");const S=(process.env.SP||"/tmp")+"/";const now=Date.now();
const TIT=[["lagerarbeiter",{name:"Lagerarbeiter",o:3,r:{ret_s:true,ret_b:true,inf_s:true,inf_b:true}}],["monteur",{name:"Monteur",o:5,r:{}}],["chef",{name:"Chef",o:1,r:{v_user:true,v_rights:true}}]];
const base=[{col:"retour",id:"r1",data:{ev:"Stadtfest Linz",ord:"2601080-01",itemsJson:"{}",by:"u1",t:now-864e5}},
 {col:"defekte",id:"d1",data:{art:"VT 125A Maxi 2",ev:"Ice Magic",by:"u1",t:now-864e5,done:false,urg:true}}].concat(TIT.map(([id,data])=>({col:"titel",id,data})));
async function run(b,name,role,rolle,fn){const docs=base.concat(rolle?[{col:"rolle",id:"u1",data:rolle}]:[]);
 const fk=fs.readFileSync(S+"fakesb.js","utf8").replace("const T={docs:[]","const T={docs:"+JSON.stringify(docs)).replace('role:"admin"','role:"'+role+'"');
 const ctx=await b.newContext({viewport:{width:390,height:844}});
 await ctx.addInitScript(()=>{window.__said=[];if(!sessionStorage.x){localStorage.setItem("tpc_jv_engine","device");sessionStorage.x=1}const V=[{name:"Google Deutsch",lang:"de-DE",voiceURI:"g",localService:true}];window.SpeechSynthesisUtterance=class{constructor(t){this.text=t}};
  Object.defineProperty(window,"speechSynthesis",{configurable:true,value:{getVoices:()=>V,addEventListener(){},cancel(){},speak(u){__said.push(u.text);setTimeout(()=>u.onend&&u.onend(),10)}}})});
 const p=await ctx.newPage();const errs=[];p.on("pageerror",e=>errs.push(e.message));
 await ctx.route("**/*",r=>{const u=r.request().url();if(u.startsWith("https://app.test/"))return r.fulfill({body:fs.readFileSync("/home/claude/gh/index.html"),contentType:"text/html"});
  if(u.includes("supabase-js"))return r.fulfill({body:fk,contentType:"text/javascript"});return r.fulfill({status:404,body:""})});
 await p.goto("https://app.test/");await p.waitForTimeout(800);await p.mouse.click(195,420);await p.waitForTimeout(400);
 console.log("== "+name);await fn(p);console.log("   Fehler:",errs);await ctx.close()}
const card=p=>p.evaluate(()=>!!document.querySelector('[data-g="jarvis"]'));
async function inJarvis(p){await p.click('[data-g="jarvis"]');await p.waitForTimeout(400);
 console.log("   Felder:",(await p.$$eval(".jvlb",l=>l.map(x=>x.childNodes[0].textContent.trim()))).join(" | "));
 await p.click("#jvsp");await p.waitForTimeout(700);console.log("   Briefing:",(await p.evaluate(()=>__said)).join(" / "));
 console.log("   Motor:",await p.evaluate(()=>jvEngine()),"| Art:",await p.evaluate(()=>jvStyle()));
 await p.click("#jvvc");await p.waitForTimeout(200);console.log("   Dialog: Thorsten-Umschalter sichtbar:",await p.isVisible("#jvet"),"| Stimmenauswahl sichtbar:",await p.isVisible("#jvvs"),"| Frech/Sachlich:",await p.isVisible("#jvsf"));return p}
(async()=>{const b=await chromium.launch();
 await run(b,"Admin setzt Extra-Recht Jarvis für Max","admin",null,async p=>{
  await p.evaluate(async()=>{__T.profiles.push({id:"u2",name:"Max Monteur",email:"m@x",role:"user",active:true,created_at:"1"});await loadProfs();})
  await p.evaluate(()=>{__T.docs.push({col:"rolle",id:"u2",data:{t:"monteur"}})});
  await p.click('[data-g="users"]');await p.waitForTimeout(500);
  await p.evaluate(()=>document.querySelector('[data-xu="u2"]').open=true);await p.waitForTimeout(100);
  console.log("   Zeile Jarvis da:",await p.evaluate(()=>!!document.querySelector('[data-xc="u2"][data-k="jv_s"]')));
  await p.click('[data-xc="u2"][data-k="jv_s"]');await p.waitForTimeout(500);
  console.log("   gespeichert:",await p.evaluate(()=>JSON.stringify((__T.docs.find(d=>d.col==="rolle"&&d.id==="u2")||{}).data)));
  await p.evaluate(()=>document.querySelector('[data-xu="u2"]').scrollIntoView());await p.evaluate(()=>scrollBy(0,-90));await p.screenshot({path:S+"jvrecht_user.png"});
  const tb=await p.$$eval("details",l=>l.map(d=>d.querySelector("summary").textContent));console.log("   Abschnitte:",tb.join(" | "));
  await p.click("#bk");await p.waitForTimeout(200);console.log("   Admin Karte:",await card(p));await inJarvis(p)});
 await run(b,"Monteur ohne Recht","user",{t:"monteur"},async p=>{console.log("   Karte:",await card(p));await p.evaluate(()=>{view="jarvis";draw()});await p.waitForTimeout(200);console.log("   direkt aufgerufen → Ansicht:",await p.evaluate(()=>view))});
 await run(b,"Monteur mit Extra-Recht Jarvis","user",{t:"monteur",x:{jv_s:true}},async p=>{console.log("   Karte:",await card(p));await inJarvis(p)});
 await run(b,"Lagerarbeiter mit Extra-Recht Jarvis","user",{t:"lagerarbeiter",x:{jv_s:true}},async p=>{console.log("   Karte:",await card(p));await inJarvis(p);
  await p.evaluate(()=>localStorage.setItem("tpc_jv_engine","thorsten"));console.log("   trotz gespeichertem Thorsten → Motor:",await p.evaluate(()=>jvEngine()));
  await p.click("#jvsf");await p.waitForTimeout(100);console.log("   auf frech umgestellt:",await p.evaluate(()=>jvStyle()));await p.screenshot({path:S+"jvrecht_dlg.png"})});
 await b.close()})();
