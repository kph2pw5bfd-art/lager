/* Test 1.143: Projektleiter einer Packliste ändern (SP = Ordner mit fakesb.js) */
const {chromium}=require("playwright");const fs=require("fs");const S=(process.env.SP||"/tmp")+"/";const J=o=>JSON.stringify(o);
const t0=new Date();t0.setHours(0,0,0,0);const T0=t0.getTime(),D=n=>T0+n*864e5+8*36e5;
(async()=>{const b=await chromium.launch();let fail=0;const ok=(t,c)=>{if(!c)fail++;console.log((c?"OK   ":"FEHLT")+" "+t)};const errs=[];
 const pos=[{p:"1",n:10,u:"Stk",t:"Kabel 32A 50m",a:"1098",f:0}];
 const seed=[{col:"pack",id:"A",data:{ord:"2601300",ps:"14700",ev:"Gala Wien",pl:"Max Muster",db:D(1),de:D(5),pos,zus:[],by:"u1",t:D(-1)}},
  {col:"pack",id:"S",data:{ord:"2601600",ps:"14600",ev:"Stadtfest Graz",pl:"Anna Klein",db:D(2),de:D(6),pos,zus:[],by:"u1",t:D(-1)}}];
 const fk=fs.readFileSync(S+"fakesb.js","utf8").replace("const T={docs:[]","const T={docs:"+J(seed));
 const ctx=await b.newContext({viewport:{width:390,height:844}});const p=await ctx.newPage();p.on("pageerror",e=>errs.push(e.message));
 await ctx.route("**/*",r=>{const u=r.request().url();if(u.startsWith("https://app.test/"))return r.fulfill({body:fs.readFileSync("/home/claude/gh/index.html"),contentType:"text/html"});if(u.includes("supabase-js"))return r.fulfill({body:fk,contentType:"text/javascript"});return r.fulfill({status:404,body:""})});
 await p.goto("https://app.test/");await p.evaluate(()=>window.PK_FOPEN=true);await p.waitForTimeout(700);await p.mouse.click(200,400);await p.waitForTimeout(400);
 const PK=()=>p.evaluate(()=>window.__T.docs.find(r=>r.col==="pack"&&r.id==="A").data);
 const open=async()=>{await p.evaluate(()=>{curPack="A";view="packopen";draw()});await p.waitForTimeout(300);await p.click("#pkhg");await p.click("#pkplch");await p.waitForSelector("#pkpln")};
 await open();const L=await p.$$eval("#pkpll [data-pln]",l=>l.map(x=>x.textContent));console.log("   Liste:",L);ok("Vorschläge: beide Namen, kurz",L.some(x=>/^Anna K\./.test(x))&&L.some(x=>/^Max M\..*bisher/.test(x)));
 await p.screenshot({path:S+"plch.png"});
 await p.click('#pkpll [data-pln]:has-text("Anna K.")');await p.click("#pkplo");await p.waitForTimeout(400);
 let d=await PK();ok("Gespeichert voller Name, Original gemerkt",d.pl==="Anna Klein"&&d.plo==="Max Muster");
 ok("Anzeige neu",/Anna K\./.test(await p.textContent("#app")));
 await p.evaluate(()=>pkReplace(packs.find(x=>x.id==="A"),{ord:"2601300",ps:"14700",ev:"Gala Wien",pl:"Berta Neu",db:packs[0].db,de:packs[0].de,pos:[{p:"1",n:12,u:"Stk",t:"Kabel 32A 50m",a:"1098",f:0}]},[]));await p.waitForTimeout(400);
 d=await PK();ok("Neuer Packschein: Änderung bleibt, plo aktualisiert",d.pl==="Anna Klein"&&d.plo==="Berta Neu"&&d.pos[0].n===12);
 await open();ok("Knopf zurück zeigt Packschein-Name",/Berta N\./.test(await p.textContent("#pkplr")));
 await p.fill("#pkpln","Franz Frei");await p.waitForTimeout(100);ok("Unbekannter Name: Hinweis",/Neuer Name/.test(await p.textContent("#pkpll")));await p.click("#pkplo");await p.waitForTimeout(400);
 d=await PK();ok("Frei getippt, plo bleibt",d.pl==="Franz Frei"&&d.plo==="Berta Neu");
 await open();await p.click("#pkplr");await p.waitForTimeout(400);d=await PK();ok("Zurück auf Packschein",d.pl==="Berta Neu"&&d.plo===null);
 await p.evaluate(()=>pkReplace(packs.find(x=>x.id==="A"),{ord:"2601300",ps:"14700",ev:"Gala Wien",pl:"Carl Dritt",db:packs[0].db,de:packs[0].de,pos:[{p:"1",n:12,u:"Stk",t:"Kabel 32A 50m",a:"1098",f:0}]},[]));await p.waitForTimeout(400);
 d=await PK();ok("Ohne Handänderung: Packschein gewinnt",d.pl==="Carl Dritt");
 await p.evaluate(()=>{window.can0=can;can=k=>k!=="pk_b"&&can0(k);view="pack";draw();curPack="A";view="packopen";draw()});await p.waitForTimeout(300);await p.click("#pkhg");ok("Ohne Recht kein Menüpunkt",!(await p.$("#pkplch")));await p.click(".pkmx");
 ok("Keine JS-Fehler "+errs.join("|"),!errs.length);await b.close();console.log(fail?"FEHLER: "+fail:"ALLES OK");process.exit(fail?1:0)})();
