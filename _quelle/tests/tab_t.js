/* Test 1.66: Lager-Tablet – Namenskacheln, Helfer, Name wird mitgeschrieben/angezeigt, 30-Min.-Pause, Benutzerverwaltung */
const {chromium}=require("playwright");const fs=require("fs");const S=(process.env.SP||"/tmp")+"/";
const t0=new Date();t0.setHours(0,0,0,0);const T0=t0.getTime();
const pos=[{p:"1.1",n:2,u:"Stk",t:"VT",a:"1048",f:0},{p:"1.2",n:4,u:"Stk",t:"Kabel",a:"1097",f:0}];
const base=[{col:"titel",id:"lagerarbeiter",data:{name:"Lagerarbeiter",o:3,r:{ret_s:true,ret_b:true,pk_s:true,jv_s:true}}},
 {col:"rolle",id:"u2",data:{t:"lagerarbeiter",x:{},tl:true}},{col:"rolle",id:"u3",data:{t:"lagerarbeiter",x:{},tl:true}},{col:"rolle",id:"u4",data:{t:"lagerarbeiter",x:{}}},
 {col:"pack",id:"p1",data:{ord:"2601",ps:"p1",ev:"Stadtfest Graz",pl:"Anna PL",db:T0+8*36e5,de:T0+5*864e5,pos,by:"u2",t:Date.now()}}];
const profs='{id:"u2",name:"Max Muster",email:"m@x",role:"user",active:true,created_at:"1"},{id:"u3",name:"Sonja Lager",email:"s@x",role:"user",active:true,created_at:"2"},{id:"u4",name:"Peter Pan",email:"p@x",role:"user",active:true,created_at:"3"}';
async function ctxFor(b,role,extra){const ctx=await b.newContext({viewport:{width:1024,height:768}});
 const docs=base.concat(extra||[]);
 const fk=fs.readFileSync(S+"fakesb.js","utf8").replace("const T={docs:[]","const T={docs:"+JSON.stringify(docs)).replace('role:"admin",active:true,created_at:"2026-10-28"}','role:"'+role+'",active:true,created_at:"2026-10-28"},'+profs);
 await ctx.addInitScript(()=>{window.__said=[];localStorage.setItem("tpc_jv_engine","device");localStorage.setItem("tpc_jv_style","sachlich");window.SpeechSynthesisUtterance=class{constructor(t){this.text=t}};
  Object.defineProperty(window,"speechSynthesis",{configurable:true,value:{getVoices:()=>[{name:"G",lang:"de-DE",voiceURI:"g"}],addEventListener(){},cancel(){},speak(u){__said.push(u.text);setTimeout(()=>u.onend&&u.onend(),5)}}})});
 await ctx.route("**/*",r=>{const u=r.request().url();if(u.startsWith("https://app.test/"))return r.fulfill({body:fs.readFileSync("/home/claude/gh/index.html"),contentType:"text/html"});if(u.includes("supabase-js"))return r.fulfill({body:fk,contentType:"text/javascript"});return r.fulfill({status:404,body:""})});
 return ctx}
(async()=>{const b=await chromium.launch();
 /* Tablet */
 const ctx=await ctxFor(b,"user",[{col:"rolle",id:"u1",data:{t:"lagerarbeiter",x:{},tab:true}}]);const p=await ctx.newPage();const errs=[];p.on("pageerror",e=>errs.push(e.message));
 await p.goto("https://app.test/");await p.waitForTimeout(900);await p.mouse.click(512,600);await p.waitForTimeout(600);
 console.log("Auswahl da:",await p.isVisible("#tabov"),"| Kacheln:",await p.evaluate(()=>[...document.querySelectorAll("#tabov .tabt b")].map(e=>e.textContent).join(" | ")));
 await p.screenshot({path:S+"tab_pick.png"});
 await p.click('[data-tbu="u2"]');await p.waitForTimeout(300);console.log("Kopfzeile:",await p.textContent("#who"));
 await p.click('[data-g="pack"]');await p.waitForTimeout(200);await p.click('[data-pk="p1"]');await p.waitForTimeout(200);await p.click('[data-pc="0"]');await p.waitForTimeout(300);
 console.log("gespeichert:",await p.evaluate(()=>JSON.stringify((__T.docs.find(d=>d.col==="packh")||{}).data.h_1_1)),"| angezeigt:",await p.textContent(".pkby"));
 await p.click("#tabsw");await p.waitForTimeout(300);await p.click("#tbother");await p.fill("#tbname","Hans Helfer");await p.click("#tbok");await p.waitForTimeout(300);
 console.log("Helfer → Kopfzeile:",await p.textContent("#who"));await p.click('[data-pc="1"]');await p.waitForTimeout(300);
 console.log("Helfer gespeichert:",await p.evaluate(()=>JSON.stringify(__T.docs.find(d=>d.col==="packh").data.h_1_2.by_as)),"| angezeigt:",await p.evaluate(()=>[...document.querySelectorAll(".pkby")].map(e=>e.textContent).join(" / ")));
 await p.evaluate(()=>{view="jarvis";hist=["start"];draw()});await p.waitForTimeout(300);console.log("Jarvis-Begrüßung:",await p.textContent("#jvg"));
 await p.reload();await p.waitForTimeout(900);await p.mouse.click(512,600);await p.waitForTimeout(600);console.log("Nach Neuladen (<30 Min.): Auswahl da:",await p.isVisible("#tabov"),"| Kopfzeile:",await p.textContent("#who"));
 await p.evaluate(()=>{const a=JSON.parse(localStorage.getItem("tpc_tab_act"));a.t=Date.now()-31*60e3;localStorage.setItem("tpc_tab_act",JSON.stringify(a))});
 await p.reload();await p.waitForTimeout(900);await p.mouse.click(512,600);await p.waitForTimeout(600);console.log("Nach 31 Min.: Auswahl da:",await p.isVisible("#tabov"),"| Helfer-Kachel gemerkt:",await p.evaluate(()=>[...document.querySelectorAll("#tabov .tabt.hlp b")].map(e=>e.textContent).join(",")));
 await p.click('[data-tbu="u3"]');await p.waitForTimeout(300);
 await p.evaluate(()=>{TAB.last=Date.now()-31*60e3});await p.evaluate(()=>tabCheck());await p.waitForTimeout(300);console.log("Pause im Betrieb → Auswahl:",await p.isVisible("#tabov"));
 console.log("Fehler Tablet:",errs);await ctx.close();
 /* normales Handy (kein Tablet) */
 const c2=await ctxFor(b,"user",[{col:"rolle",id:"u1",data:{t:"lagerarbeiter",x:{}}}]);const p2=await c2.newPage();const e2=[];p2.on("pageerror",e=>e2.push(e.message));
 await p2.goto("https://app.test/");await p2.waitForTimeout(900);await p2.mouse.click(512,600);await p2.waitForTimeout(500);console.log("Handy ohne Tablet: Auswahl:",await p2.isVisible("#tabov"),"| Kopfzeile:",await p2.textContent("#who"),"| Fehler:",e2);await c2.close();
 /* Admin: Benutzerverwaltung */
 const c3=await ctxFor(b,"admin",[{col:"rolle",id:"u5",data:{}}]);const p3=await c3.newPage();const e3=[];p3.on("pageerror",e=>e3.push(e.message));
 await p3.goto("https://app.test/");await p3.waitForTimeout(900);await p3.mouse.click(512,600);await p3.waitForTimeout(400);
 await p3.evaluate(async()=>{await loadProfs();view="users";hist=["start"];draw()});await p3.waitForTimeout(400);
 console.log("Häkchen da:",await p3.evaluate(()=>document.querySelectorAll("[data-tl]").length+" × am Lager-Tablet, "+document.querySelectorAll("[data-tab]").length+" × Gemeinsames Gerät"));
 await p3.check('[data-tab="u4"]');await p3.waitForTimeout(300);await p3.uncheck('[data-tl="u3"]');await p3.waitForTimeout(300);
 console.log("rolle u4 / u3:",await p3.evaluate(()=>JSON.stringify(__T.docs.find(d=>d.col==="rolle"&&d.id==="u4").data)+" / "+JSON.stringify(__T.docs.find(d=>d.col==="rolle"&&d.id==="u3").data)));
 await p3.evaluate(()=>document.querySelector('[data-tl="u2"]').scrollIntoView({block:"center"}));await p3.screenshot({path:S+"tab_users.png"});
 console.log("Fehler Admin:",e3);await b.close()})();
