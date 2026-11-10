/* Test 1.159: neue Packlisten-Ansicht – Felder zugeklappt, Stand-Kacheln, Zahnrad-Menüs, Knöpfe (SP = Ordner mit fakesb.js) */
const {chromium}=require("playwright");const fs=require("fs");const S=(process.env.SP||"/tmp")+"/";const J=o=>JSON.stringify(o);
const t0=new Date();t0.setHours(0,0,0,0);const D=n=>t0.getTime()+n*864e5+8*36e5;const ymd=n=>{const d=new Date(t0.getTime()+n*864e5+12*36e5);return d.getFullYear()+"-"+String(d.getMonth()+1).padStart(2,"0")+"-"+String(d.getDate()).padStart(2,"0")};
(async()=>{const b=await chromium.launch();let fail=0;const ok=(t,c)=>{if(!c)fail++;console.log((c?"OK   ":"FEHLT")+" "+t)};const errs=[];
 const pos=[{p:"1",n:16,u:"Stk",t:"Kabel A",a:"1098",f:0},{p:"2",n:6,u:"Stk",t:"Kabel B",a:"1081",f:0}];
 const seed=[{col:"pack",id:"A",data:{ord:"2601080-01",ps:"738",ev:"Gala Wien",pl:"Heinz Tester",db:D(1),de:D(9),pos,zus:[{ps:"745",v:2,t:D(0),by:"u1",pos:[{p:"1",n:2,u:"Stk",t:"Verteiler",a:"1050",f:0}]}],by:"u1",t:D(-3)}},
  {col:"packh",id:"A",data:{h_1:{q:15,alt:[],by:"u1",t:1},zd_745:{d:ymd(2),by:"u1",t:1},zf_745:{by:"u1",t:Date.now()},h_z745_1:{ok:true,by:"u1",t:1}}}];
 const fk=fs.readFileSync(S+"fakesb.js","utf8").replace("const T={docs:[]","const T={docs:"+J(seed));
 const ctx=await b.newContext({viewport:{width:390,height:900}});const p=await ctx.newPage();p.on("pageerror",e=>errs.push(e.message));
 await ctx.route("**/*",r=>{const u=r.request().url();if(u.startsWith("https://app.test/"))return r.fulfill({body:fs.readFileSync("/home/claude/gh/index.html"),contentType:"text/html"});if(u.includes("supabase-js"))return r.fulfill({body:fk,contentType:"text/javascript"});return r.fulfill({status:404,body:""})});
 await p.goto("https://app.test/");await p.waitForTimeout(800);await p.mouse.click(200,400);await p.waitForTimeout(400);
 await p.evaluate(()=>{curPack="A";view="packopen";draw()});await p.waitForTimeout(300);
 ok("Kopf: Veranstaltung, Auftrag · PL, Dispo",/Gala Wien/.test(await p.textContent(".pkev"))&&/2601080-01 · Heinz T\./.test(await p.textContent(".pkhead")));
 ok("Zwei Felder, zugeklappt",(await p.$$(".pkf")).length===2&&!(await p.$(".pkf [data-pc]")));
 const tm=await p.$$eval(".pkf.main .pkft",l=>l.map(x=>x.textContent+"|"+x.className));const tz=await p.$$eval(".pkf.zus .pkft",l=>l.map(x=>x.textContent+"|"+x.className));console.log("   ",tm,tz);
 ok("Haupt: teilweise / mit 1 Abweichung / noch nicht abgeschlossen",/teilweise hergerichtet1 \/ 2\|.*part/.test(tm[0])&&/mit 1 Abweichung\|.*part/.test(tm[1])&&/noch nicht abgeschlossen/.test(tm[2]));
 ok("Zusatz: hergerichtet / ohne Abweichung / abgeschlossen",/^hergerichtet/.test(tz[0])&&/ohne Abweichung\|.*ok/.test(tz[1])&&/abgeschlossen\|.*ok/.test(tz[2]));
 await p.click('.pkf.main .pkfmore');await p.waitForTimeout(200);ok("Aufklappen zeigt Artikel + Filter",!!(await p.$('.pkf.main [data-pc]'))&&!!(await p.$('[data-pkff="main"]'))&&!(await p.$('.pkf.zus [data-pc]')));
 await p.evaluate(()=>draw());await p.waitForTimeout(200);ok("Bleibt nach Live-Update offen",!!(await p.$('.pkf.main [data-pc]')));
 await p.click('[data-pkff="main"][data-v="offen"]');await p.waitForTimeout(150);ok("Noch offen",(await p.$$('.pkf.main .pkp')).length===2);
 await p.click("#pkhg");const hm=await p.$$eval(".pkmi",l=>l.map(x=>x.textContent));console.log("   ",hm);ok("Kopf-Menü",["Herrichten verschieben","Projektleiter ändern","Kunde ändern","Info zum Herrichten","Art ändern","Info an Projektleiter","Mit Projektleiter geklärt","Packliste löschen"].every(t=>hm.some(h=>h.startsWith(t))));await p.click(".pkmx");
 await p.click('[data-pkfg="main"]');const fm=await p.$$eval(".pkmi",l=>l.map(x=>x.textContent));ok("Feld-Menü Haupt",fm[0]==="Packschein abschließen"&&fm.includes("Material hinzufügen"));await p.click(".pkmx");
 await p.click('[data-pkfg="z745"]');const zm=await p.$$eval(".pkmi",l=>l.map(x=>x.textContent));ok("Feld-Menü Zusatz abgeschlossen → öffnen",zm[0]==="Packschein öffnen"&&!zm.includes("Material hinzufügen"));await p.click(".pkmx");
 await p.click('[data-pkfg="main"]');await p.click("#pkfin");await p.waitForTimeout(200);await p.click(".ov .btn:not(.ghost)").catch(()=>{});await p.waitForTimeout(300);await p.$$eval(".ov",l=>l.forEach(o=>o.remove()));
 ok("Abschließen über Zahnrad",await p.evaluate(()=>!!(packh.A.fin&&packh.A.fin.t)));
 ok("Knöpfe Etikett / Retourschein / Drucken",!!(await p.$("#pketik"))&&!!(await p.$("#pkret"))&&!!(await p.$("#pkprint")));
 await p.click("#pkaa");ok("Alle Angaben",/Packschein\s*738/.test(await p.textContent(".pkhead .pkkv")));
 ok("Keine JS-Fehler "+errs.join("|"),!errs.length);await b.close();console.log(fail?"FEHLER: "+fail:"ALLES OK")})();
