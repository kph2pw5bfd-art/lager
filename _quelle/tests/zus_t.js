/* Test 1.88: Zusatz-Packscheine mit eigenem Herricht-Tag, eigenem Abschluss; überall auf ihrem Tag (SP = Ordner mit fakesb.js) */
const {chromium}=require("playwright");const fs=require("fs");const S=(process.env.SP||"/tmp")+"/";
const t0=new Date();t0.setHours(0,0,0,0);const T0=t0.getTime(),D=n=>{const d=new Date(T0);d.setDate(d.getDate()+n);return d.getTime()};
const ymd=t=>{const d=new Date(t);return d.getFullYear()+"-"+String(d.getMonth()+1).padStart(2,"0")+"-"+String(d.getDate()).padStart(2,"0")};
const kat=JSON.parse(fs.readFileSync(__dirname+"/rkat.json","utf8")).map((x,i)=>({col:"rkat",id:"k"+i,data:x}));
const seed=kat.concat([
 /* Hauptpackliste hergerichtet; alter Zusatz A1 (vor 1.88, nach dem Anhängen mit abgeschlossen); neuer Zusatz N1 für heute */
 {col:"pack",id:"P1",data:{ord:"2601300",ps:"100",ev:"Weihnachtsmarkt Spittelberg 2026",pl:"Jürgen Hartmann",db:D(-6),de:D(30),pos:[{p:"1",n:4,u:"Stk",t:"Kabel CEE 32A 25m",a:"1097",f:0}],
  zus:[{ps:"101",t:D(-5),by:"u1",pos:[{p:"1",n:2,u:"Stk",t:"Schuko 20m",a:"1081",f:0}]},{ps:"102",t:D(-1),by:"u1",v:2,pos:[{p:"1",n:3,u:"Stk",t:"Kabel CEE 32A 50m",a:"1098",f:0},{p:"2",n:1,u:"Stk",t:"Verteiler 3-fach",a:"1026",f:0}]}],by:"u1",t:D(-7)}},
 {col:"packh",id:"P1",data:{c:1,h_1:{ok:true,by:"u1",t:1},h_z101_1:{ok:true,by:"u1",t:1},fin:{by:"u1",t:D(-4)},zd_102:{d:ymd(T0),by:"u1",t:1},zf_102:{t:0}}},
 /* zweite Packliste mit Zusatz, der gestern hätte hergerichtet werden sollen */
 {col:"pack",id:"P2",data:{ord:"2601400",ps:"200",ev:"Eislaufplatz Rathaus",pl:"Anna Kern",db:D(-10),de:D(40),pos:[{p:"1",n:1,u:"Stk",t:"Schuko 20m",a:"1081",f:0}],
  zus:[{ps:"201",t:D(-3),by:"u1",v:2,pos:[{p:"1",n:5,u:"Stk",t:"Schuko 20m",a:"1081",f:0}]}],by:"u1",t:D(-11)}},
 {col:"packh",id:"P2",data:{c:1,h_1:{ok:true,by:"u1",t:1},fin:{by:"u1",t:D(-9)},zd_201:{d:ymd(D(-1)),by:"u1",t:1}}}]);
let F=0;const ok=(t,c,v)=>{F+=!c;console.log((c?"OK   ":"FEHLT")+" "+t+(v!==undefined?": "+v:""))};
(async()=>{const b=await chromium.launch();const ctx=await b.newContext({viewport:{width:390,height:844}});const p=await ctx.newPage();const errs=[];p.on("pageerror",e=>errs.push(e.message));
 const fk=fs.readFileSync(S+"fakesb.js","utf8").replace("const T={docs:[]","const T={docs:"+JSON.stringify(seed));
 await ctx.route("**/*",r=>{const u=r.request().url();if(u.startsWith("https://app.test/"))return r.fulfill({body:fs.readFileSync("/home/claude/gh/index.html"),contentType:"text/html"});if(u.includes("supabase-js"))return r.fulfill({body:fk,contentType:"text/javascript"});return r.fulfill({status:404,body:""})});
 await p.goto("https://app.test/");await p.waitForTimeout(900);await p.mouse.click(195,420);await p.waitForTimeout(500);
 const T=async sel=>(await p.$$eval(sel,l=>l.map(x=>x.innerText.replace(/\s+/g," ").trim()))).join(" | ");
 const V=async v=>{await p.evaluate(v=>{document.querySelectorAll(".ov").forEach(o=>o.remove());view=v;hist=["start"];draw()},v);await p.waitForTimeout(250)};
 const E=f=>p.evaluate(f);
 ok("Haupt bleibt hergerichtet (Zusätze zählen nicht mit)",await E(()=>{const g=pkProg(packs.find(x=>x.id==="P1"));return g.fin&&g.n===1}));
 ok("Alter Zusatz 101 gilt als hergerichtet",await E(()=>!!pkZFin(packs.find(x=>x.id==="P1"),{ps:"101",t:Date.now()-5*864e5})));
 ok("Neuer Zusatz 102 offen, heute",await E(()=>{const P=packs.find(x=>x.id==="P1"),z=pkZOf(P,"102");return !pkZFin(P,z)&&pkZDay(P,z)===pkDay(Date.now())}));
 /* Übersicht (Wand) */
 await E(()=>{pkTab="w0"});await V("pack");const sl=await E(()=>{const P=packs.find(x=>x.id==="P1");return pkDayLabel(pkSlot(pkZPseudo(P,pkZOf(P,"102"))).t,0)});const ov=await p.$$eval(".pktray",l=>l.map(x=>x.innerText.replace(/\s+/g," ")));const tr=ov.find(x=>x.includes(sl.split(" · ")[0]))||"";console.log("Fach",sl,":",tr);ok("Zusatz 102 im Fach seines Tages",await E(()=>pkOvData().w0.some(d=>d.items.some(o=>o.p._z==="102"&&o.s.t===d.t))),tr);
 const lt=await T(".pklate");ok("Zusatz 201 bei „Nicht hergerichtet“",/Zusatz 201 zu Eislaufplatz/.test(lt),lt);await p.screenshot({path:S+"zus_wand.png",fullPage:true});
 /* Lager Übersicht + Kachel + Assistent */
 ok("Kachel-Untertitel zählt Zusatz",/1 heute herrichten/.test(await E(()=>pkSub())),await E(()=>pkSub()));
 await V("jarvis");await p.click('[data-jt="herr"]').catch(()=>{});await p.waitForTimeout(200);const hh=await T(".jvlist");ok("Lager Übersicht: Heute herrichten mit Zusatz",/Zusatz 102/.test(hh),hh.slice(0,160));
 const a1=await E(()=>jvHerr("was ist heute herzurichten").say.join(" "));ok("Assistent: heute herrichten nennt Zusatz",/Zusatz 102/.test(a1),a1);
 const a2=await E(()=>jvHerr("was ist nicht hergerichtet").say.join(" "));ok("Assistent: nicht hergerichtet nennt Zusatz 201",/Zusatz 201/.test(a2),a2);
 /* Herricht-Ansicht */
 await E(()=>{curPack="P1"});await V("packopen");console.log("Zusatz-Köpfe:",await T(".pkzday"));
 const idx=await E(()=>pkItems(packs.find(x=>x.id==="P1")).map((o,i)=>[o.z||"",i]));const iMain=idx.find(x=>x[0]==="")[1],iZ=idx.find(x=>x[0]==="102")[1];
 ok("Haupt-Zeile gesperrt",await p.$eval('[data-pc="'+iMain+'"]',e=>e.disabled));ok("Zusatz-Zeile frei",!(await p.$eval('[data-pc="'+iZ+'"]',e=>e.disabled)));
 await p.click('[data-pc="'+iZ+'"]');await p.waitForTimeout(300);ok("Zusatz-Position abgehakt, Haupt bleibt zu",await E(()=>{const P=packs.find(x=>x.id==="P1");return pkZProg(P,"102").d===1&&pkProg(P).fin}));
 await p.screenshot({path:S+"zus_herr.png",fullPage:true});
 /* Verschieben */
 await p.click('[data-pkzmv="102"]');await p.waitForTimeout(200);await p.click('[data-zq="1"]');await p.fill("#pzw","Material kommt erst");await p.click("#pzo");await p.waitForTimeout(300);
 ok("Zusatz verschoben auf morgen",await E(()=>{const P=packs.find(x=>x.id==="P1");return pkZDay(P,pkZOf(P,"102"))===pkAddD(pkDay(Date.now()),1)}));ok("Grund sichtbar",/Material kommt erst/.test(await T(".pkzday")));
 /* Abschließen */
 await p.click('[data-pkzf="102"]');await p.waitForTimeout(200);console.log("Rückfrage:",await T(".ov"));await p.click(".ov .btn:not(.ghost)");await p.waitForTimeout(300);
 await p.$$eval(".ov",l=>l.forEach(o=>o.remove()));ok("Zusatz abgeschlossen",await E(()=>{const P=packs.find(x=>x.id==="P1");return !!pkZFin(P,pkZOf(P,"102"))}));
 ok("Zusatz-Zeilen jetzt gesperrt",await p.$eval('[data-pc="'+iZ+'"]',e=>e.disabled));
 ok("Mail nur Zusatz",await E(()=>{const m=pkMailText(packs.find(x=>x.id==="P1"),"102");return /Zusatz-Packschein 102/.test(m.subj)&&/Verteiler|1026/.test(m.body)&&!/1097/.test(m.body)}));
 await p.click('[data-pkzr="102"]');await p.waitForTimeout(200);await p.click(".ov .btn:not(.ghost)");await p.waitForTimeout(300);ok("Zusatz wieder geöffnet",await E(()=>{const P=packs.find(x=>x.id==="P1");return !pkZFin(P,pkZOf(P,"102"))}));
 /* Hochladen eines neuen Zusatzes (PDF-Lesen und Bestätigung nachgestellt) */
 await E(()=>{window.pkRead=async()=>({ord:"2601300",ps:"103",ev:"Weihnachtsmarkt Spittelberg 2026",pl:"Jürgen Hartmann",db:Date.now(),de:Date.now(),pos:[{p:"1",n:6,u:"Stk",t:"Schuko 20m",a:"1081",f:0}]});pkUpload([{name:"x.pdf"}])});
 await p.waitForTimeout(300);ok("Inhalt neu -> Zusatz vorgeschlagen",await p.$eval('[data-cm="zus"]',e=>e.classList.contains("on")));await p.click("#pkco");await p.waitForTimeout(300);const dlg=await T(".ov");ok("Frage nach dem Herricht-Tag",/Wann wird der Zusatz hergerichtet/.test(dlg),dlg.slice(0,120));await p.screenshot({path:S+"zus_frage.png"});
 await p.click('[data-zq="2"]');await p.click("#pzo");await p.waitForTimeout(400);
 ok("Neuer Zusatz: Tag übermorgen, Haupt bleibt hergerichtet",await E(()=>{const P=packs.find(x=>x.id==="P1"),z=pkZOf(P,"103");return !!z&&z.v===2&&pkZDay(P,z)===pkAddD(pkDay(Date.now()),2)&&!pkZFin(P,z)&&pkProg(P).fin}));
 /* Meine Aufträge */
 await E(()=>{curAu="P1"});await V("auopen");const tl=await T(".aute");console.log("Zeitleiste:",tl);ok("Zeitleiste mit Nachlieferungen",/Nachlieferung \(Zusatz 101\) hergerichtet.*Nachlieferung \(Zusatz 102\).*Nachlieferung \(Zusatz 103\) herrichten/.test(tl));
 await p.screenshot({path:S+"zus_au.png",fullPage:true});
 /* Wochenbericht */
 const wbH=await E(()=>wbData().days.flatMap(d=>d.h.map(o=>o.p.ev)).join(" | "));ok("Wochenbericht diese Woche mit Zusätzen",/Zusatz 10[23]/.test(wbH),wbH);
 ok("keine JS-Fehler",!errs.length,errs.join(" / "));console.log("FEHLER GESAMT:",F);await b.close()})();
