/* Test 1.126: Meine Aufträge – Zusatz/Packliste alle Positionen hergerichtet → „hergerichtet <Datum> von <Namen>“ (SP = Ordner mit fakesb.js) */
const {chromium}=require("playwright");const fs=require("fs");const S=(process.env.SP||"/tmp")+"/";const J=o=>JSON.stringify(o);
const t0=new Date();t0.setHours(0,0,0,0);const T0=t0.getTime(),D=n=>T0+n*864e5+8*36e5;
(async()=>{const b=await chromium.launch();let fail=0;const ok=(t,c)=>{if(!c)fail++;console.log((c?"OK   ":"FEHLT")+" "+t)};const errs=[];
 const pos=[{p:"1",n:4,u:"Stk",t:"Kabel 32A 50m",a:"1098",f:0},{p:"2",n:2,u:"Stk",t:"Schuko 20m",a:"1081",f:0}];
 const zpos=[{p:"1",n:2,u:"Stk",t:"Kabel 32A 25m",a:"1097",f:0},{p:"2",n:1,u:"Stk",t:"Verteiler",a:"1048",f:0}];
 const seed=[{col:"pack",id:"A",data:{ord:"20260741",ps:"100",ev:"Burg Clam",pl:"Jürgen Hartmann",db:D(-2),de:D(5),pos,zus:[{ps:"20260742",pos:zpos,t:D(-1),hd:D(-1),v:2}],by:"u1",t:D(-3)}},
  {col:"packh",id:"A",data:{h_1:{ok:true,by:"u1",t:D(-2)},h_2:{ok:true,by:"u1",by_as:"Max Muster",t:D(-2)+36e5},fin:{by:"u1",t:D(-2)+72e5},
   h_z20260742_1:{ok:true,by:"u1",by_as:"Max Muster",t:D(-1)},h_z20260742_2:{ok:true,by:"u1",t:D(0)}}}];
 const fk=fs.readFileSync(S+"fakesb.js","utf8").replace("const T={docs:[]","const T={docs:"+J(seed));
 const ctx=await b.newContext({viewport:{width:390,height:844}});const p=await ctx.newPage();p.on("pageerror",e=>errs.push(e.message));
 await ctx.route("**/*",r=>{const u=r.request().url();
  if(u.startsWith("https://app.test/"))return r.fulfill({body:fs.readFileSync("/home/claude/gh/index.html"),contentType:"text/html"});
  if(u.includes("supabase-js"))return r.fulfill({body:fk,contentType:"text/javascript"});
  return r.fulfill({status:404,body:""})});
 await p.goto("https://app.test/");await p.waitForTimeout(800);await p.mouse.click(200,400);await p.waitForTimeout(400);
 console.log("     Schlüssel:",J(await p.evaluate(()=>pkItems(packs.find(x=>x.id==="A")).map(o=>o.k))));
 await p.evaluate(()=>{curAu="A";go("auopen")});await p.waitForTimeout(400);const txt=await p.textContent("#app");
 const line=(txt.match(/Nachlieferung \(Zusatz 20260742\)[^N]{0,80}/)||[""])[0];console.log("     ",line);
 const dd=new Date(Date.now());const dm=String(dd.getDate()).padStart(2,"0")+"."+String(dd.getMonth()+1).padStart(2,"0")+".";
 ok("Zusatz komplett → „hergerichtet <heute> von Max M. (Tablet), Jürgen H.“",new RegExp("hergerichtet "+dm.replace(".","\\.")).test(line)&&/Max M\. \(Tablet\)/.test(line)&&/Jürgen H\./.test(line)&&!/wird hergerichtet/.test(line));
 await p.screenshot({path:S+"auzus.png",fullPage:true});
 /* Packliste selbst: alle Positionen fertig, aber nicht abgeschlossen */
 await p.evaluate(()=>{delete packh["A"].fin;draw()});await p.waitForTimeout(300);const t2=await p.textContent("#app");ok("Packliste komplett ohne Abschluss → „Hergerichtet“",/Hergerichtet/.test(t2)&&!/Wird hergerichtet/.test(t2));
 await p.evaluate(()=>{packh["A"].h_z20260742_2={ok:false};draw()});await p.waitForTimeout(300);ok("Zusatz unvollständig → „wird hergerichtet: 1 von 2“",/wird hergerichtet: 1 von 2 Positionen/.test(await p.textContent("#app")));
 await p.evaluate(()=>{go("au")});await p.waitForTimeout(300);ok("Liste: Schild „Nachlieferung …“ bei unvollständig",/Nachlieferung/.test(await p.textContent("#app")));
 console.log("Fehler:",errs);ok("keine Seitenfehler",!errs.length);console.log(fail?"FEHLGESCHLAGEN: "+fail:"ALLES OK");await b.close()})();
