/* Test 1.171: Wer ist online? – Herzschlag (Gerät, Bereich, Tablet-Name), Anzeige in der Benutzerverwaltung nur für Admin (SP = Ordner mit fakesb.js) */
const {chromium}=require("playwright");const fs=require("fs");const S=(process.env.SP||"/tmp")+"/";
const N=Date.now(),Y=new Date();Y.setDate(Y.getDate()-1);Y.setHours(14,20,0,0);
const base=[{col:"titel",id:"lagerarbeiter",data:{name:"Lagerarbeiter",o:3,r:{ret_s:true,ret_b:true,pk_s:true,jv_s:true}}},
 {col:"rolle",id:"u2",data:{t:"lagerarbeiter",x:{},tl:true}},{col:"rolle",id:"u3",data:{t:"lagerarbeiter",x:{},tl:true}},{col:"rolle",id:"u4",data:{t:"lagerarbeiter",x:{}}}];
const profs='{id:"u2",name:"Max Muster",email:"m@x",role:"user",active:true,created_at:"1"},{id:"u3",name:"Sonja Lager",email:"s@x",role:"user",active:true,created_at:"2"},{id:"u4",name:"Anton Alt",email:"p@x",role:"user",active:true,created_at:"3"},{id:"u5",name:"Lager Tablet",email:"t@x",role:"user",active:true,created_at:"4"}';
let F=0;const ok=(t,c,x)=>{F+=!c;console.log((c?"OK   ":"FEHLT")+" "+t+(x!==undefined?" → "+x:""))};
async function ctxFor(b,role,extra,ua){const ctx=await b.newContext({viewport:{width:1024,height:768},...(ua?{userAgent:ua}:{})});
 const fk=fs.readFileSync(S+"fakesb.js","utf8").replace("const T={docs:[]","const T={docs:"+JSON.stringify(base.concat(extra||[]))).replace('role:"admin",active:true,created_at:"2026-10-28"}','role:"'+role+'",active:true,created_at:"2026-10-28"},'+profs);
 await ctx.addInitScript(()=>{window.MF_NOASK=true;localStorage.setItem("tpc_jv_engine","device")});
 await ctx.route("**/*",r=>{const u=r.request().url();if(u.startsWith("https://app.test/"))return r.fulfill({body:fs.readFileSync("/home/claude/gh/index.html"),contentType:"text/html"});if(u.includes("supabase-js"))return r.fulfill({body:fk,contentType:"text/javascript"});return r.fulfill({status:404,body:""})});
 return ctx}
const onl=p=>p.evaluate(()=>__T.docs.filter(d=>d.col==="online").map(d=>({id:d.id,...d.data})));
(async()=>{const b=await chromium.launch();
 /* Gerätenamen */
 {const ctx=await ctxFor(b,"admin");const p=await ctx.newPage();await p.goto("https://app.test/");await p.waitForTimeout(800);
  const r=await p.evaluate(()=>[onlDev("Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X)",5),onlDev("Mozilla/5.0 (Linux; Android 14; SM-X200) Chrome/130 Safari",5),onlDev("Mozilla/5.0 (Linux; Android 14; Pixel 8) Chrome/130 Mobile Safari",5),onlDev("Mozilla/5.0 (Windows NT 10.0; Win64; x64)",0),onlDev("Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15)",5)].join(","));
  ok("Gerätenamen",r==="iPhone,Android-Tablet,Android-Handy,PC,iPad",r);
  const w=await p.evaluate(()=>{const n=Date.now(),d=new Date(n);d.setHours(0,5,0,0);return [onlWhen(n-20e3,n),onlWhen(n-5*6e4,n),onlWhen(d.getTime(),Math.max(n,d.getTime()+2*36e5))].join(" | ")});
  ok("Zeitangaben",/^gerade eben \| vor 5 Min\. \| heute 00:05$/.test(w),w);await ctx.close()}
 /* Lager-Tablet: Herzschlag mit gewähltem Namen und Bereich */
 {const ctx=await ctxFor(b,"user",[{col:"rolle",id:"u1",data:{t:"lagerarbeiter",x:{},tab:true}}],"Mozilla/5.0 (Linux; Android 14; SM-X200) AppleWebKit/537.36 Chrome/130 Safari/537.36");
  const p=await ctx.newPage();const errs=[];p.on("pageerror",e=>errs.push(e.message));
  await p.goto("https://app.test/");await p.waitForTimeout(900);await p.mouse.click(512,600);await p.waitForTimeout(600);
  await p.click('[data-tbu="u2"]');await p.waitForTimeout(400);await p.evaluate(()=>{onlLast=0;onlBeat(true)});await p.waitForTimeout(300);
  let d=(await onl(p))[0]||{};ok("Tablet-Eintrag mit Name",d.u==="u1"&&d.dev==="Lager-Tablet"&&d.tn==="Max Muster"&&d.tid==="u2"&&d.p_u2>0&&d.vis===true&&d.v==="1.171",JSON.stringify(d).slice(0,160));
  ok("ein Eintrag pro Gerät",(await onl(p)).length===1&&/^u1_/.test(d.id),d.id);
  await p.click('[data-g="pack"]');await p.waitForTimeout(12000);
  d=(await onl(p))[0];ok("Bereich wechselt mit",d.b&&d.b!=="Hauptseite",d.b);
  await p.evaluate(()=>onlBeat(false,true));await p.waitForTimeout(200);d=(await onl(p))[0];ok("Ausblenden → vis false",d.vis===false);
  await p.evaluate(()=>onlBeat(true,true));await p.waitForTimeout(200);
  await p.click("#tabsw");await p.waitForTimeout(300);await p.click('[data-tbu="u3"]');await p.waitForTimeout(300);await p.evaluate(()=>{onlLast=0;onlBeat(true)});await p.waitForTimeout(300);
  d=(await onl(p))[0];ok("Wechsel: Sonja jetzt, Max bleibt gemerkt",d.tid==="u3"&&d.p_u3>0&&d.p_u2>0,d.tn);
  ok("Tablet sieht keine Online-Zeilen (kein Admin)",await p.evaluate(()=>onlLine("u2")===""));
  ok("keine JS-Fehler Tablet",!errs.length,errs.join("|"));await ctx.close()}
 /* Admin: Benutzerverwaltung */
 {const ex=[{col:"rolle",id:"u5",data:{t:"lagerarbeiter",x:{},tab:true}},
   {col:"online",id:"u2_a",data:{u:"u2",dev:"iPhone",b:"Retourschein",t:N-30e3,vis:true}},
   {col:"online",id:"u2_b",data:{u:"u2",dev:"PC",b:"Packlisten",t:N-3*864e5,vis:false}},
   {col:"online",id:"u3_a",data:{u:"u3",dev:"PC",b:"Wochenbericht",t:Y.getTime(),vis:false}},
   {col:"online",id:"u5_x",data:{u:"u5",dev:"Lager-Tablet",b:"Packliste",t:N-20e3,vis:true,tn:"Sonja Lager",tid:"u3",p_u3:N-20e3,p_u4:N-6e5}}];
  const ctx=await ctxFor(b,"admin",ex);const p=await ctx.newPage();const errs=[];p.on("pageerror",e=>errs.push(e.message));
  await p.goto("https://app.test/");await p.waitForTimeout(900);await p.evaluate(()=>go("users"));await p.waitForTimeout(800);
  const L=await p.evaluate(()=>[...document.querySelectorAll(".ubx")].map(c=>c.querySelector("b").textContent+" = "+(c.querySelector(".onl")||{}).textContent));
  console.log(L.join("\n"));
  const g=n=>L.find(x=>x.startsWith(n))||"";
  ok("Max online mit iPhone + Bereich",/Online · iPhone · Retourschein/.test(g("Max")));
  ok("Sonja online am Lager-Tablet",/Online · am Lager-Tablet · Packliste/.test(g("Sonja")));
  ok("Anton zuletzt am Tablet",/Zuletzt online: vor 10 Min\. · am Lager-Tablet/.test(g("Anton")),g("Anton"));
  ok("Tablet-Konto zeigt, wer arbeitet",/Online · Lager-Tablet · Sonja L\. arbeitet · Packliste/.test(g("Lager Tablet")),g("Lager Tablet"));
  ok("Online oben",L.findIndex(x=>x.startsWith("Anton"))>L.findIndex(x=>x.startsWith("Max"))&&L.findIndex(x=>x.startsWith("Anton"))>L.findIndex(x=>x.startsWith("Sonja")));
  /* Max geht offline → nach Nachladen „Zuletzt“ */
  await p.evaluate(()=>{const d=__T.docs.find(x=>x.id==="u2_a");d.data.vis=false;d.data.t=Date.now()-9*6e4;onlLoadT=0;onlUsers()});await p.waitForTimeout(500);
  const m=await p.evaluate(()=>document.querySelector('[data-onl="u2"]').textContent);ok("Aktualisiert ohne Neuaufbau",/Zuletzt online: vor 9 Min\. · iPhone · Retourschein/.test(m),m);
  const sonja=await p.evaluate(()=>{const d=__T.docs.find(x=>x.id==="u5_x");d.data.tid="u2";onlLoadT=0;onlUsers();return 1});await p.waitForTimeout(400);
  ok("Sonja nicht mehr am Tablet → zuletzt",/Zuletzt online:/.test(await p.evaluate(()=>document.querySelector('[data-onl="u3"]').textContent)));
  await p.screenshot({path:S+"onl_users.png",fullPage:true});
  ok("keine JS-Fehler Admin",!errs.length,errs.join("|"));await ctx.close()}
 await b.close();console.log(F?"FEHLER: "+F:"ALLES OK")})();
