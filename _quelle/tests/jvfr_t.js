/* Test 1.54: freches Briefing (Zufallsauswahl), Schalter Frech/Sachlich im Stimmen-Dialog */
const {chromium}=require("playwright");const fs=require("fs");const S=(process.env.SP||"/tmp/")+"/";const now=Date.now();
const seed="const T={docs:["+JSON.stringify([
 {col:"retour",id:"r1",data:{ev:"Stadtfest Linz",ord:"2601080-01",itemsJson:"{}",by:"u1",t:now-864e5,modT:now-3600e3}},
 {col:"retour",id:"r3",data:{ev:"Ice Magic Innsbruck",ord:"2601090-02",itemsJson:"{}",by:"u1",t:now-2*864e5}},
 {col:"defekte",id:"d1",data:{art:"VT 125A Maxi 2",ev:"Ice Magic",by:"u1",t:now-864e5,done:false,urg:true}},
 {col:"defekte",id:"d2",data:{art:"Kabel 32A 25m",ev:"Stadtfest",by:"u1",t:now-3*864e5,done:false}},
 {col:"defekte",id:"d3",data:{art:"Scheinwerfer LED",ev:"Gala",by:"u1",t:now-5*864e5,done:true,doneT:now-7200e3}}
]).slice(1,-1)+",";
(async()=>{const b=await chromium.launch();const ctx=await b.newContext({viewport:{width:390,height:844}});
 await ctx.addInitScript(()=>{window.__said=[];localStorage.setItem("tpc_jv_engine","device");const V=[{name:"Microsoft Conrad Online (Natural) - German (Germany)",lang:"de-DE",voiceURI:"c",localService:true}];
  window.SpeechSynthesisUtterance=class{constructor(t){this.text=t}};
  Object.defineProperty(window,"speechSynthesis",{configurable:true,value:{getVoices:()=>V,addEventListener(){},cancel(){},speak(u){__said.push(u.text);setTimeout(()=>u.onend&&u.onend(),10)}}})});
 const p=await ctx.newPage();const errs=[];p.on("pageerror",e=>errs.push(e.message));
 await ctx.route("**/*",r=>{const u=r.request().url();if(u.startsWith("https://app.test/"))return r.fulfill({body:fs.readFileSync("/home/claude/gh/index.html"),contentType:"text/html"});
  if(u.includes("supabase-js"))return r.fulfill({body:fs.readFileSync(S+"fakesb.js","utf8").replace("const T={docs:[",seed),contentType:"text/javascript"});return r.fulfill({status:404,body:""})});
 await p.goto("https://app.test/");await p.waitForTimeout(700);await p.mouse.click(195,420);await p.waitForTimeout(300);
 await p.evaluate(()=>{view="jarvis";hist=["start"];draw()});await p.waitForTimeout(300);
 console.log("Standard-Art:",await p.evaluate(()=>jvStyle()));
 for(let i=1;i<=3;i++){await p.evaluate(()=>__said.length=0);await p.click("#jvsp");await p.waitForTimeout(900);console.log("-- Briefing frech "+i+":\n   "+(await p.evaluate(()=>__said)).join("\n   "))}
 // alle Lagen direkt durchspielen
 const cases=await p.evaluate(()=>{const R=e=>({ev:e}),Df=(a,u,ev)=>({art:a,urg:u,ev});const L=[
  {open:[],od:[],fixed:[]},{open:[R("Stadtfest Graz")],od:[Df("Verteiler 63A Indu",true,"Stadtfest Graz")],fixed:[{art:"Defender Midi"}]},
  {open:[R("A"),R("B"),R("C")],od:[Df("X",false),Df("Y",false)],fixed:[{art:"Verteiler 125A Classic"},{art:"Kabel 16A 50m"}]},
  {open:[R("A"),R("B"),R("C"),R("D"),R("E"),R("F"),R("G")],od:[Df("X",true),Df("Y",true),Df("Z",false)],fixed:[]},{open:[],od:[Df("X",false)],fixed:[]}];
  const out=[];L.forEach(D=>{const seen=new Set();for(let i=0;i<40;i++)jvTextFrech(D).forEach(s=>seen.add(s));out.push([...seen])});return out});
 cases.forEach((c,i)=>console.log("== Lage "+(i+1)+" ("+c.length+" versch. Sätze):\n   "+c.join("\n   ")));
 await p.click("#jvvc");await p.waitForTimeout(200);await p.screenshot({path:S+"jvfr_dlg.png"});
 await p.evaluate(()=>__said.length=0);await p.click("#jvvt");await p.waitForTimeout(400);console.log("Probe frech:",(await p.evaluate(()=>__said)).join(" / "));
 await p.click("#jvss");console.log("nach Tipp Sachlich:",await p.evaluate(()=>[jvStyle(),document.getElementById("jvss").className,document.getElementById("jvsf").className].join(" ")));
 await p.evaluate(()=>__said.length=0);await p.click("#jvvt");await p.waitForTimeout(400);console.log("Probe sachlich:",(await p.evaluate(()=>__said)).join(" / "));
 await p.click("#jvvo");await p.reload();await p.waitForTimeout(700);await p.mouse.click(195,420);await p.waitForTimeout(300);await p.evaluate(()=>{view="jarvis";hist=["start"];draw()});await p.waitForTimeout(200);
 console.log("nach Neuladen:",await p.evaluate(()=>jvStyle()));await p.evaluate(()=>__said.length=0);await p.click("#jvsp");await p.waitForTimeout(900);console.log("-- Briefing sachlich:\n   "+(await p.evaluate(()=>__said)).join("\n   "));
 await p.click("#jvvc");await p.waitForTimeout(200);await p.click("#jvvd");await p.waitForTimeout(200);console.log("nach Zurücksetzen:",await p.evaluate(()=>jvStyle()));
 console.log("Version:",await p.evaluate(()=>APPV),"| Fehler:",errs);await b.close()})();
