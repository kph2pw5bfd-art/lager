/* Test 1.188: Wochenbericht – „Letzte Woche in epirent ausgetragen“ (mit Art.-Nr./ID, Grund, wer/wann), nur letzte Woche (SP = Ordner mit fakesb.js) */
const {chromium}=require("playwright");const fs=require("fs");const S=(process.env.SP||"/tmp")+"/";const J=o=>JSON.stringify(o);
const t0=new Date();t0.setHours(0,0,0,0);const wd=t0.getDay(),mon=new Date(t0);mon.setDate(mon.getDate()-((wd+6)%7));if(wd===6||wd===0)mon.setDate(mon.getDate()+7);const M=mon.getTime();
const at=d=>{const x=new Date(M);x.setDate(x.getDate()+d);x.setHours(10,0,0,0);return x.getTime()};
(async()=>{const b=await chromium.launch();let fail=0;const ok=(t,c,x)=>{if(!c)fail++;console.log((c?"OK   ":"FEHLT")+" "+t+(x!==undefined?" → "+x:""))};const errs=[];
 const seed=[
  {col:"defekte",id:"d1",data:{by:"u1",t:at(-9),done:true,doneBy:"u1",doneT:at(-5),art:"16A Kabel 5m",anr:"1062–56",ev:"Gala Wien",desc:"x",n:1,aus:{by:"u1",t:at(-5),why:"Isolierung beschädigt",n:1,fn:0}}},
  {col:"fmx",id:"ausg_d1",data:{pk:"ausg",k:"def:d1",def:"d1",q:1,u:"Stk",name:"16A Kabel 5m",code:"1062",was:"ausg",by:"u1",t:at(-5),txt:"Isolierung beschädigt · Gala Wien",aus:{by:"u1",t:at(-4)}}},
  {col:"fmx",id:"f2",data:{pk:"zz",k:"x",q:2,u:"Stk",name:"Schuko 20m",code:"1081",was:"weg",by:"u1",t:at(-3),aus:{by:"u1",t:at(0)}}},
  {col:"fmx",id:"f3",data:{pk:"zz",k:"y",q:3,u:"Stk",name:"CEE 32A 50m",code:"1098",was:"verr",by:"u1",t:at(-3),aus:null}}];
 const fk=fs.readFileSync(S+"fakesb.js","utf8").replace("const T={docs:[]","const T={docs:"+J(seed));
 const ctx=await b.newContext({viewport:{width:1100,height:1400}});const p=await ctx.newPage();p.on("pageerror",e=>errs.push(e.message));
 await ctx.route("**/*",r=>{const u=r.request().url();if(u.startsWith("https://app.test/"))return r.fulfill({body:fs.readFileSync("/home/claude/gh/index.html"),contentType:"text/html"});if(u.includes("pdf-lib"))return r.fulfill({body:fs.readFileSync("/opt/npm-tools/node_modules/pdf-lib/dist/pdf-lib.min.js"),contentType:"text/javascript"});if(u.includes("supabase-js"))return r.fulfill({body:fk,contentType:"text/javascript"});return r.fulfill({status:404,body:""})});
 await p.goto("https://app.test/");await p.waitForTimeout(1500);await p.mouse.click(200,400);await p.waitForTimeout(300);
 await p.evaluate(()=>{if(typeof fmSub==="function")fmSub();go("wb")});await p.waitForTimeout(800);
 const D=await p.evaluate(()=>wbData().ausD);ok("eine Zeile (nur letzte Woche)",D.length===1,J(D));
 ok("Art.-Nr., ID und Grund",D[0]&&/1 Stk 16A Kabel 5m · Art\.-Nr\. 1062 · ID 56 – nicht reparierbar \(„Isolierung beschädigt“\)/.test(D[0].d),D[0]&&D[0].d);
 ok("wer und wann",D[0]&&/· Jürgen|· /.test(D[0].r),D[0]&&D[0].r);
 const t=await p.textContent("#app");ok("im Bericht sichtbar",/Letzte Woche in epirent ausgetragen/.test(t));
 ok("offene Zeile mit Art.-Nr.",/Art\.-Nr\. 1098 – verrechnet/.test(t));
 await p.screenshot({path:S+"wbaus.png",fullPage:true});
 const pdf=await p.evaluate(async()=>{try{const D=wbData();const by=await wbPdf(D);return by&&by.length||0}catch(e){return "ERR "+e.message}});ok("PDF lässt sich erstellen",typeof pdf==="number"||pdf===0,pdf);
 ok("keine JS-Fehler",!errs.length,errs.join("|"));await b.close();console.log(fail?"FEHLER: "+fail:"ALLES OK")})();
