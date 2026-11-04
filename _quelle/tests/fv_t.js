/* Test 1.116: Defekt – Fremdverschulden (melden, Liste, Detail, Bearbeiten, Werkstatt trägt nach, Ersatzteile-Bericht) (SP = Ordner mit fakesb.js) */
const {chromium}=require("playwright");const fs=require("fs");const S=(process.env.SP||"/tmp")+"/";const J=o=>JSON.stringify(o);
(async()=>{const b=await chromium.launch();let fail=0;const ok=(t,c)=>{if(!c)fail++;console.log((c?"OK   ":"FEHLT")+" "+t)};const errs=[];
 const now=Date.now(),seed=[{col:"defekte",id:"dx",data:{art:"Verteiler 63A",anr:"1050",ev:"Gala Wien",desc:"Gehäuse gebrochen",by:"u2",t:now-864e5,done:true,doneBy:"u1",doneT:now-36e5,urg:false,fn:0,foto:false,rep:"Gehäuse getauscht",et:[{nm:"Gehäuse",n:1,u:"Stk"}]}}];
 const fk=fs.readFileSync(S+"fakesb.js","utf8").replace("const T={docs:[]","const T={docs:"+J(seed)).replace('profiles:[{','profiles:[{id:"u2",name:"Max Muster",email:"m@x",role:"user",active:true,created_at:"2026-10-28"},{');
 const ctx=await b.newContext({viewport:{width:390,height:844}});const p=await ctx.newPage();p.on("pageerror",e=>errs.push(e.message));
 await ctx.route("**/*",r=>{const u=r.request().url();
  if(u.startsWith("https://app.test/"))return r.fulfill({body:fs.readFileSync("/home/claude/gh/index.html"),contentType:"text/html"});
  if(u.includes("supabase-js"))return r.fulfill({body:fk,contentType:"text/javascript"});
  if(u.includes("pdf-lib"))return r.fulfill({body:fs.readFileSync("/opt/npm-tools/node_modules/pdf-lib/dist/pdf-lib.min.js"),contentType:"text/javascript"});
  return r.fulfill({status:404,body:""})});
 await p.goto("https://app.test/");await p.waitForTimeout(600);await p.mouse.click(200,400);await p.waitForTimeout(400);
 const D=id=>p.evaluate(id=>(window.__T.docs.find(r=>r.col==="defekte"&&r.id===id)||{}).data,id);
 /* melden */
 await p.evaluate(()=>{view="defnew";draw()});await p.waitForTimeout(300);
 ok("Feld „Wer / wie?“ erst versteckt",await p.evaluate(()=>document.querySelector("#dnfvb").hidden));
 await p.fill("#dnart","Kabel 32A 50m");await p.fill("#dnev","Ice Magic");await p.check("#dnfv");await p.waitForTimeout(100);
 ok("Nach Anhaken sichtbar",await p.evaluate(()=>!document.querySelector("#dnfvb").hidden));await p.fill("#dnfvw","Bühnenbauer mit Stapler drübergefahren");
 await p.screenshot({path:S+"fv_melden.png"});
 await p.click("#dnsend");await p.waitForTimeout(800);
 const id=await p.evaluate(()=>window.__T.docs.filter(r=>r.col==="defekte"&&r.id!=="dx")[0].id);let d=await D(id);
 ok("Gespeichert: fv + fvw",d.fv===true&&d.fvw==="Bühnenbauer mit Stapler drübergefahren");
 /* Liste */
 await p.evaluate(()=>{df="alle";view="def";draw()});await p.waitForTimeout(300);
 const tag=await p.evaluate(id=>{const e=document.querySelector('[data-df="'+id+'"] .dfv');return e?e.textContent:""},id);ok("Liste: Schild ("+tag+")",tag==="FREMDVERSCHULDEN");
 await p.screenshot({path:S+"fv_liste.png"});
 /* Detail */
 await p.click('[data-df="'+id+'"]');await p.waitForTimeout(300);const line=await p.evaluate(()=>(document.querySelector(".dfvl")||{}).textContent||"");
 ok("Detail: "+line,/^Fremdverschulden: Bühnenbauer/.test(line));await p.screenshot({path:S+"fv_detail.png"});
 /* Bearbeiten (eigener Defekt): Haken weg → Text leer */
 await p.click("#ded");await p.waitForTimeout(300);ok("Bearbeiten vorbelegt",await p.isChecked("#defv")&&(await p.inputValue("#defvw"))==="Bühnenbauer mit Stapler drübergefahren");
 await p.uncheck("#defv");await p.evaluate(()=>{$("#desv").disabled=false});await p.click("#desv");await p.waitForTimeout(800);d=await D(id);ok("Bearbeiten: entfernt",d.fv===false&&d.fvw==="");
 /* fremder Defekt: Werkstatt trägt nach */
 await p.evaluate(()=>{curDef="dx";view="defopen";draw()});await p.waitForTimeout(300);ok("Fremder Defekt: Link „+ Fremdverschulden eintragen“",!!(await p.$("#dfved")));
 await p.click("#dfved");await p.check("#xfv");await p.fill("#xfvw","Kunde – Kabel überfahren");await p.click("#xfvo");await p.waitForTimeout(700);d=await D("dx");
 ok("Werkstatt trägt nach",d.fv===true&&d.fvw==="Kunde – Kabel überfahren"&&d.fvBy==="u1");
 /* Ersatzteile-Bericht */
 const b64=await p.evaluate(async()=>{const now=Date.now(),r=[now-30*864e5,now+864e5];const u=new Uint8Array(await etPdf("x",r));let s="";for(let i=0;i<u.length;i+=8192)s+=String.fromCharCode(...u.subarray(i,i+8192));return btoa(s)});
 fs.writeFileSync(S+"fv.pdf",Buffer.from(b64,"base64"));const pt=require("child_process").execSync("pdftotext -layout "+S+"fv.pdf -").toString();
 console.log(pt.split("\n").filter(l=>/Fremd|Reparatur|Verteiler/.test(l)).map(l=>"     "+l.trim()).join("\n"));
 ok("Bericht: Zeile Fremdverschulden + Zähler",/Fremdversch\.\s+Ja – Kunde – Kabel überfahren/.test(pt)&&/davon 1 Fremdverschulden/.test(pt));
 /* ohne Recht: kein Link bei fremdem Defekt */
 await p.evaluate(()=>{window.__c=can;can=k=>k==="def_b"?false:window.__c(k);curDef="dx";view="defopen";draw()});await p.waitForTimeout(200);ok("Ohne Bearbeiten-Recht: nur lesen",!(await p.$("#dfved"))&&!!(await p.$(".dfvl")));
 await p.emulateMedia({colorScheme:"dark"});await p.waitForTimeout(150);await p.screenshot({path:S+"fv_dark.png"});
 console.log("Fehler:",errs);ok("keine Seitenfehler",!errs.length);console.log(fail?"FEHLGESCHLAGEN: "+fail:"ALLES OK");await b.close()})();
