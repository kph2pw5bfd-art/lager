/* Test 1.177: Weihnachten & Silvester – Zeitraum, Kopfbalken (Schnee + Lichterkette / Raketen), Startbild, Schalter, Druckstation (SP = Ordner mit fakesb.js) */
const {chromium}=require("playwright");const fs=require("fs");const S=(process.env.SP||"/tmp")+"/";
(async()=>{const b=await chromium.launch();let fail=0;const ok=(t,c,x)=>{if(!c)fail++;console.log((c?"OK   ":"FEHLT")+" "+t+(x!==undefined?" → "+x:""))};
 const fk=fs.readFileSync(S+"fakesb.js","utf8");
 async function page(date,ls){const ctx=await b.newContext({viewport:{width:390,height:844}});const p=await ctx.newPage();const errs=[];p.on("pageerror",e=>errs.push(e.message));
  await p.clock.install({time:date});if(ls)await ctx.addInitScript(o=>{for(const k in o)localStorage.setItem(k,o[k])},ls);
  await ctx.route("**/*",r=>{const u=r.request().url();if(u.startsWith("https://app.test/"))return r.fulfill({body:fs.readFileSync("/home/claude/gh/index.html"),contentType:"text/html"});if(u.includes("supabase-js"))return r.fulfill({body:fk,contentType:"text/javascript"});return r.fulfill({status:404,body:""})});
  await p.goto("https://app.test/");await p.clock.runFor(400);return {ctx,p,errs}}
 /* Zeitraum */
 {const {ctx,p}=await page(new Date(2026,10,15,10,0));
  const r=await p.evaluate(()=>[[2026,10,28],[2026,10,29],[2026,11,24],[2026,11,26],[2026,11,27],[2027,0,1],[2027,0,6],[2027,0,7],[2027,10,27],[2027,10,28],[2028,11,2],[2028,11,3]].map(a=>tpcSeason(new Date(a[0],a[1],a[2],12))||"-").join(""));
  ok("Zeitraum (1. Advent 29.11.2026 / 28.11.2027 / 3.12.2028)",r==="-wwwsss--w-w",r);
  ok("Mitte November: keine Deko",!(await p.$("header .xdeco"))&&!(await p.$("#splash .xs")));await ctx.close()}
 /* Weihnachten */
 {const {ctx,p,errs}=await page(new Date(2026,11,15,8,0));
  ok("Startbild: Schnee",(await p.$$("#splash .xs .f")).length===14);
  await p.clock.runFor(3500);await p.mouse.click(200,400).catch(()=>{});await p.clock.runFor(600);
  ok("Kopfbalken: 10 Flocken + Lichterkette",(await p.$$("header .xdeco .xfl")).length===10&&!!(await p.$("header .xdeco .xli")));
  ok("keine Raketen",!(await p.$("header .xdeco .xrk")));
  const z=await p.evaluate(()=>{const t=document.getElementById("t");return getComputedStyle(t.closest("header>*")).zIndex});ok("Inhalt über der Deko",z==="1",z);
  await p.screenshot({path:S+"xmas_w.png",clip:{x:0,y:0,width:390,height:120}});
  await p.evaluate(()=>go("art"));await p.clock.runFor(300);const sw=await p.$('[data-pref="xmas"]');ok("Schalter in Einstellungen",!!sw&&(await sw.getAttribute("aria-checked"))==="true");
  await sw.click();await p.clock.runFor(100);ok("ausgeschaltet → weg",!(await p.$("header .xdeco"))&&await p.evaluate(()=>localStorage.getItem("tpc_pref_xmas"))==="0");
  await p.click('[data-pref="xmas"]');await p.clock.runFor(100);ok("wieder an",!!(await p.$("header .xdeco .xfl")));
  ok("keine JS-Fehler",!errs.length,errs.join("|"));await ctx.close()}
 /* Silvester */
 {const {ctx,p,errs}=await page(new Date(2026,11,30,8,0));
  ok("Startbild: 4 Striche + Funken",(await p.$$("#splash .xs .r")).length===4&&(await p.$$("#splash .xs .b")).length===4);
  await p.clock.runFor(3500);await p.clock.runFor(600);
  ok("Kopfbalken: 3 Raketen, kein Schnee, keine Lichterkette",(await p.$$("header .xdeco .xrk")).length===3&&!(await p.$("header .xdeco .xfl"))&&!(await p.$("header .xdeco .xli")));
  await p.screenshot({path:S+"xmas_s.png",clip:{x:0,y:0,width:390,height:120}});
  ok("keine JS-Fehler",!errs.length,errs.join("|"));await ctx.close()}
 /* aus / Druckstation */
 {const {ctx,p}=await page(new Date(2026,11,15,8,0),{tpc_pref_xmas:"0"});await p.clock.runFor(4000);ok("Schalter aus: nichts",!(await p.$("#splash .xs"))&&!(await p.$("header .xdeco")));await ctx.close()}
 {const {ctx,p}=await page(new Date(2026,11,15,8,0),{tpc_druckst:"1"});await p.clock.runFor(4000);ok("Druckstation: nichts",!(await p.$("#splash .xs"))&&!(await p.$("header .xdeco")));await ctx.close()}
 await b.close();console.log(fail?"FEHLER: "+fail:"ALLES OK")})();
