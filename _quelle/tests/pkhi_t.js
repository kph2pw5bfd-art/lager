/* Test 1.115: Info zum Herrichten – beim Hochladen (neu, Zusatz, Ersetzen), Kasten oben, Ändern/Löschen, Schild in Listen, PDF + Monteur-Text (SP = Ordner mit fakesb.js) */
const {chromium}=require("playwright");const fs=require("fs");const S=(process.env.SP||"/tmp")+"/";const J=o=>JSON.stringify(o);
const t0=new Date();t0.setHours(0,0,0,0);const T0=t0.getTime(),D=n=>T0+n*864e5;
(async()=>{const b=await chromium.launch();let fail=0;const ok=(t,c)=>{if(!c)fail++;console.log((c?"OK   ":"FEHLT")+" "+t)};const errs=[];
 const ctx=await b.newContext({viewport:{width:390,height:844}});const p=await ctx.newPage();p.on("pageerror",e=>errs.push(e.message));
 await ctx.route("**/*",r=>{const u=r.request().url();
  if(u.startsWith("https://app.test/"))return r.fulfill({body:fs.readFileSync("/home/claude/gh/index.html"),contentType:"text/html"});
  if(u.includes("supabase-js"))return r.fulfill({body:fs.readFileSync(S+"fakesb.js"),contentType:"text/javascript"});
  if(u.includes("pdf-lib"))return r.fulfill({body:fs.readFileSync("/opt/npm-tools/node_modules/pdf-lib/dist/pdf-lib.min.js"),contentType:"text/javascript"});
  return r.fulfill({status:404,body:""})});
 await p.goto("https://app.test/");await p.waitForTimeout(600);await p.mouse.click(200,400);await p.waitForTimeout(400);
 const H=id=>p.evaluate(id=>{const r=window.__T.docs.find(r=>r.col==="packh"&&r.id===id);return r?r.data:{}},id);
 const his=async id=>Object.entries(await H(id)).filter(([k,v])=>k.startsWith("hi_")&&v).map(([k,v])=>v);
 const up=P=>p.evaluate(P=>{pkRead=async()=>P;pkUpload([{name:"x.pdf"}])},P);
 const P1={ord:"2601500",ps:"501",ev:"Ice Magic",pl:"Max Muster",db:D(0)+8*36e5,de:D(4),pos:[{p:"1",n:6,u:"Stk",t:"Schuko 20m",a:"1081",f:0},{p:"2",n:2,u:"Stk",t:"Kabel 32A 50m",a:"1098",f:0}]};
 /* 1) neue Packliste mit Info */
 await p.evaluate(()=>{view="pack";draw()});await up(P1);await p.waitForSelector("#pkhi");
 await p.screenshot({path:S+"pkhi_up.png"});
 await p.fill("#pkhi","Kabel bitte extra beschriften!\nKunde holt um 7 Uhr selbst ab.");await p.click("#pkok");await p.waitForTimeout(900);
 let L=await his("501");ok("Info beim Hochladen gespeichert ("+L.length+")",L.length===1&&/beschriften/.test(L[0].txt)&&L[0].by==="u1"&&!L[0].z);
 /* 2) Wand + Alle: Schild */
 await p.evaluate(()=>{view="pack";draw()});await p.waitForTimeout(300);
 const tag=await p.evaluate(()=>{const c=document.querySelector('[data-pk="501"] .pkhit');return c?c.textContent:""});ok("Wand: Schild „ℹ Info“ ("+tag+")",tag==="ℹ Info");
 await p.evaluate(()=>{view="packall";draw()});await p.waitForTimeout(300);ok("Alle Packlisten: Schild",!!(await p.$('[data-pk="501"] .pkhit')));
 /* 3) Packliste: Kasten oben, gut lesbar */
 await p.evaluate(()=>{curPack="501";go("packopen")});await p.waitForTimeout(400);
 const box=await p.evaluate(()=>{const b=document.querySelector("#app > .pkhi");if(!b)return null;const t=b.querySelector(".pkhit2"),cs=getComputedStyle(t);return{first:document.querySelector("#app").firstElementChild===b,html:t.innerHTML,size:cs.fontSize,meta:b.querySelector(".pkhim").textContent}});
 console.log("   Kasten:",JSON.stringify(box));ok("Kasten ganz oben, Zeilenumbruch, große Schrift",box&&box.first&&/<br>/.test(box.html)&&parseFloat(box.size)>=18&&/Jürgen H\./.test(box.meta));
 await p.screenshot({path:S+"pkhi_box.png"});
 /* 4) Ändern */
 await p.click("[data-hied]");await p.waitForSelector("#pkhit");ok("Ändern-Fenster vorbelegt",/beschriften/.test(await p.inputValue("#pkhit")));
 await p.fill("#pkhit","Kabel bitte extra beschriften!");await p.click("#pkhio");await p.waitForTimeout(700);
 L=await his("501");ok("Geändert",L.length===1&&L[0].txt==="Kabel bitte extra beschriften!"&&L[0].modT>0);
 /* 5) Zusatz mit eigener Info */
 await up({...P1,ps:"502",pos:[{p:"1",n:3,u:"Stk",t:"Verteiler",a:"1026",f:0}]});await p.waitForSelector("#pkhi");
 await p.fill("#pkhi","Zusatz: Verteiler in eigene Gitterbox");await p.click("#pkco");await p.waitForTimeout(500);
 const dayBtn=await p.$(".ov button:has-text('Heute')");if(dayBtn){await dayBtn.click();await p.waitForTimeout(300)}const okb=await p.$(".ov .btn:not(.ghost)");if(okb&&await p.$(".ov")){await okb.click()}await p.waitForTimeout(900);
 L=await his("501");console.log("   Infos:",L.map(x=>(x.z||"-")+": "+x.txt));ok("Zusatz-Info mit Kennzeichen",L.length===2&&L.some(x=>x.z==="502"&&/Gitterbox/.test(x.txt)));
 /* 6) Ersetzen behält Infos */
 await up({...P1,pos:P1.pos.concat([{p:"3",n:1,u:"Stk",t:"Stromzähler",a:"1200",f:0}])});await p.waitForSelector("#pkhi");await p.click("#pkco");await p.waitForTimeout(1200);
 L=await his("501");ok("Ersetzen ohne neue Info: Infos bleiben ("+L.length+")",L.length===2);
 /* 7) PDF + Monteur-Text */
 const P=await p.evaluate(()=>packs.find(x=>x.id==="501"));const mail=await p.evaluate(()=>pkDrMail(packs.find(x=>x.id==="501")));
 console.log("   Mail-Anfang:\n"+mail.split("\n").slice(0,7).map(l=>"     "+l).join("\n"));ok("Monteur-Text mit Info",/Info:\n- Kabel bitte extra beschriften!\n- Zusatz 502: Zusatz: Verteiler/.test(mail));
 const b64=await p.evaluate(async()=>{const r=await pkDrPdf(packs.find(x=>x.id==="501"));const blob=r instanceof Blob?r:new Blob([r.bytes||r]);const u=new Uint8Array(await blob.arrayBuffer());let s="";for(let i=0;i<u.length;i+=8192)s+=String.fromCharCode(...u.subarray(i,i+8192));return btoa(s)});
 fs.writeFileSync(S+"pkhi.pdf",Buffer.from(b64,"base64"));const pt=require("child_process").execSync("pdftotext -layout "+S+"pkhi.pdf -").toString();console.log("   PDF:\n"+pt.split("\n").slice(0,16).map(l=>"     "+l).join("\n"));
 ok("PDF mit Kasten „Info zum Herrichten“",/Info zum Herrichten/.test(pt)&&/Kabel bitte extra beschriften/.test(pt)&&/Zusatz 502: Zusatz: Verteiler/.test(pt));
 /* 8) Löschen beide → Kasten weg, Link da */
 await p.evaluate(()=>{curPack="501";go("packopen")});await p.waitForTimeout(300);
 for(let i=0;i<2;i++){await p.click("[data-hied]");await p.click("#pkhix");await p.waitForTimeout(200);await p.locator(".ov").last().locator(".btn:not(.ghost)").last().click();await p.waitForTimeout(600)}
 ok("Gelöscht: kein Kasten, Link „+ Info zum Herrichten eintragen“",!(await p.$(".pkhi"))&&!!(await p.$("#pkhiadd")));
 await p.click("#pkhiadd");await p.fill("#pkhit","Später eingetragen");await p.click("#pkhio");await p.waitForTimeout(600);ok("Später eintragen",(await his("501")).length===1&&!!(await p.$(".pkhi")));
 /* 9) ohne Recht Hochladen: kein Ändern */
 await p.evaluate(()=>{window.__can=can;can=k=>k==="pk_b"?false:window.__can(k);packOpenView()});await p.waitForTimeout(200);
 ok("Ohne Hochladen-Recht: lesen ja, ändern nein",!!(await p.$(".pkhi"))&&!(await p.$("[data-hied]"))&&!(await p.$("#pkhiadd2")));
 await p.emulateMedia({colorScheme:"dark"});await p.waitForTimeout(200);await p.screenshot({path:S+"pkhi_dark.png"});
 console.log("Fehler:",errs);ok("keine Seitenfehler",!errs.length);console.log(fail?"FEHLGESCHLAGEN: "+fail:"ALLES OK");await b.close()})();
