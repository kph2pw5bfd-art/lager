/* Test 1.110: Packschein-PDF aus der Mail ins Feld ziehen */
const {chromium}=require("playwright");const fs=require("fs");const S=(process.env.SP||"/tmp")+"/";
let bad=0;const ok=(c,m,x)=>{console.log((c?"OK   ":"FEHLER")+" "+m+(x!==undefined?": "+x:""));if(!c)bad++};
(async()=>{const b=await chromium.launch();const errs=[];
 const run=async(vp,touch)=>{const ctx=await b.newContext({viewport:vp,hasTouch:touch,isMobile:touch});const p=await ctx.newPage();p.on("pageerror",e=>errs.push(e.message));
  const fk=fs.readFileSync(S+"fakesb.js","utf8");
  await ctx.route("**/*",r=>{const u=r.request().url();if(u.startsWith("https://app.test/"))return r.fulfill({body:fs.readFileSync("/home/claude/gh/index.html"),contentType:"text/html"});if(u.includes("supabase-js"))return r.fulfill({body:fk,contentType:"text/javascript"});return r.fulfill({status:404,body:""})});
  await p.goto("https://app.test/");await p.waitForTimeout(900);await p.mouse.click(vp.width/2,420);await p.waitForTimeout(500);
  await p.evaluate(()=>{document.querySelectorAll(".ov,.toast").forEach(o=>o.remove());go("pack")});await p.waitForTimeout(400);return{ctx,p}};
 /* PC */
 let {ctx,p}=await run({width:1280,height:900},false);
 ok(await p.evaluate(()=>APPV)==="1.110","Version 1.110");
 ok(await p.isVisible("#pkdrop"),"Feld „PDF hierher ziehen“ am PC sichtbar");
 await p.evaluate(()=>{window.__got=[];window.pkUpload=async fs=>{window.__got.push(...fs.map(f=>f.name))}});
 const drop=async(el,names)=>p.evaluate(([el,names])=>{const dt=new DataTransfer();names.forEach(n=>dt.items.add(new File(["%PDF"],n,{type:/\.pdf$/i.test(n)?"application/pdf":"text/plain"})));
  const t=document.querySelector(el);t.dispatchEvent(new DragEvent("dragenter",{bubbles:true,cancelable:true,dataTransfer:dt}));const hi=document.querySelector("#pkdrop").classList.contains("on");
  const ev=new DragEvent("drop",{bubbles:true,cancelable:true,dataTransfer:dt});t.dispatchEvent(ev);return{hi,prevented:ev.defaultPrevented}},[el,names]);
 let r=await drop("#pkdrop",["14402.pdf"]);ok(r.hi,"beim Drüberziehen blau markiert");ok(r.prevented,"Browser öffnet die PDF nicht selbst");
 await p.waitForTimeout(100);ok((await p.evaluate(()=>__got)).join(",")==="14402.pdf","PDF wird gelesen");
 ok(!(await p.evaluate(()=>document.querySelector("#pkdrop").classList.contains("on"))),"Markierung danach weg");
 await p.evaluate(()=>__got=[]);r=await drop(".pkovtop, #app",["a.pdf","b.PDF","bild.png"]);await p.waitForTimeout(150);
 ok((await p.evaluate(()=>__got)).join(",")==="a.pdf,b.PDF","mehrere PDFs, auch daneben abgelegt");
 ok(/„bild.png“ ist keine PDF/.test(await p.textContent("body")),"Nicht-PDF wird abgelehnt");
 await p.evaluate(()=>document.querySelectorAll(".ov,.eov").forEach(o=>o.remove()));
 await p.evaluate(()=>{const dt=new DataTransfer();const ev=new DragEvent("drop",{bubbles:true,cancelable:true,dataTransfer:dt});document.querySelector("#pkdrop").dispatchEvent(ev)});await p.waitForTimeout(100);
 ok(/klassische Outlook-Programm/.test(await p.textContent("body")),"keine Datei angekommen → Hinweis zu Outlook");
 await p.evaluate(()=>document.querySelectorAll(".ov,.eov").forEach(o=>o.remove()));
 await p.screenshot({path:S+"drop_pc.png",clip:{x:0,y:0,width:1280,height:330}});
 /* Feld anklicken öffnet Dateiauswahl */
 const [fc]=await Promise.all([p.waitForEvent("filechooser",{timeout:2000}).catch(()=>null),p.click("#pkdrop")]);ok(!!fc,"Feld anklicken öffnet Dateiauswahl");
 /* andere Seite: Drop wird nicht abgefangen */
 await p.evaluate(()=>go("start"));await p.waitForTimeout(300);r=await p.evaluate(()=>{const ev=new DragEvent("drop",{bubbles:true,cancelable:true,dataTransfer:new DataTransfer()});document.body.dispatchEvent(ev);return ev.defaultPrevented});
 ok(!r,"auf anderen Seiten unverändert");await ctx.close();
 /* Handy */
 ({ctx,p}=await run({width:390,height:844},true));ok(!(await p.isVisible("#pkdrop")),"am Handy kein Feld (nur Knopf)");ok(await p.isVisible("#pkup"),"Knopf am Handy da");await ctx.close();
 ok(!errs.length,"keine JS-Fehler",errs.join(" | "));console.log("FEHLER GESAMT:",bad);await b.close()})();
