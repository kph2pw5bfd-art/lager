/* Test 1.85: Meine Aufträge – Projektleiter sieht alle Aufträge (eigene oben), Fortschritt, antwortet auf Fehlmaterial; Lager sieht Antworten (SP = Ordner mit fakesb.js) */
const {chromium}=require("playwright");const fs=require("fs");const S=(process.env.SP||"/tmp")+"/";
const t0=new Date();t0.setHours(0,0,0,0);const T0=t0.getTime(),D=n=>{const d=new Date(T0);d.setDate(d.getDate()+n);return d.getTime()};
const kat=JSON.parse(fs.readFileSync(__dirname+"/rkat.json","utf8")).map((x,i)=>({col:"rkat",id:"k"+i,data:x}));
const it=(nr,name,q,g)=>({nr,name,q,g:g||"Kabel",u:"32A"});const J=o=>JSON.stringify(o);
const base=kat.concat([{col:"titel",id:"projektleiter",data:{name:"Projektleiter",o:6,r:{ret_s:true,au_s:true,au_b:true}}},
 /* A: eigener (Name verdreht), Endretoure, 2× 25m fehlen */
 {col:"pack",id:"A",data:{ord:"2601098",ps:"1",ev:"Stadtfest Eisenstadt",pl:"Hartmann Jürgen",db:D(-7),de:D(-2),pos:[{p:"1",n:4,u:"Stk",t:"Kabel CEE 32A 25m",a:"1097",f:0},{p:"2",n:6,u:"Stk",t:"Kabel CEE 32A 50m",a:"1098",f:2}],by:"u1",t:D(-9)}},
 {col:"packh",id:"A",data:{c:1,h_1:{ok:false,q:3,alt:[{n:1,t:"Kabel CEE 32A 50m",a:"1098"}],by:"u1",t:1},h_2:{ok:true,fm:"miete",by:"u1",t:1},fin:{by:"u1",t:D(-8)}}},
 {col:"retour",id:"rA",data:{ev:"Stadtfest Eisenstadt",ord:"2601098",itemsJson:J({"1097":it("1097","32A Kabel 25m",1),"1098":it("1098","32A Kabel 50m",5)}),by:"u1",t:D(-1),closed:true,art:"end",closedBy:"u1",closedT:D(-1)}},
 /* B: fremder, Endretoure mit 2× 25m zu viel */
 {col:"pack",id:"B",data:{ord:"2601114",ps:"2",ev:"Winterwunder Mörbisch",pl:"Anna Kern",db:D(-5),de:D(-1),pos:[{p:"1",n:2,u:"Stk",t:"Kabel CEE 32A 25m",a:"1097",f:0}],by:"u1",t:D(-6)}},
 {col:"packh",id:"B",data:{c:1,h_1:{ok:true,by:"u1",t:1},fin:{by:"u1",t:1}}},
 {col:"retour",id:"rB",data:{ev:"Winterwunder Mörbisch",ord:"2601114",itemsJson:J({"1097":it("1097","32A Kabel 25m",4)}),by:"u1",t:D(-1),closed:true,art:"end",closedBy:"u1",closedT:D(-1)}},
 /* C: eigener, wird gerade hergerichtet */
 {col:"pack",id:"C",data:{ord:"2601131",ps:"3",ev:"Firmenfeier Parndorf",pl:"Jürgen Hartmann",db:D(0),de:D(3),pos:[{p:"1",n:5,u:"Stk",t:"Schuko 20m",a:"1081",f:0},{p:"2",n:2,u:"Stk",t:"Kabel CEE 32A 25m",a:"1097",f:0}],by:"u1",t:D(-1)}},
 {col:"packh",id:"C",data:{c:1,h_1:{ok:true,by:"u1",t:1}}},
 /* E: fremder, überfällig */
 {col:"pack",id:"E",data:{ord:"2601087",ps:"4",ev:"Messe Wieselburg",pl:"Max Muster",db:D(-10),de:D(-3),pos:[{p:"1",n:1,u:"Stk",t:"Schuko 20m",a:"1081",f:0}],by:"u1",t:D(-11)}},
 {col:"packh",id:"E",data:{c:1,h_1:{ok:true,by:"u1",t:1},fin:{by:"u1",t:1}}},
 /* G: eigener, Herrichten verschoben (Dispo-Beginn vor 5 Tagen, Herrichten in 2 Tagen) */
 {col:"pack",id:"G",data:{ord:"2601200",ps:"6",ev:"Weihnachtsmarkt Spittelberg 2026",pl:"Jürgen Hartmann",db:D(-5),de:D(40),pos:[{p:"1",n:3,u:"Stk",t:"Schuko 20m",a:"1081",f:0}],by:"u1",t:D(-8)}},
 {col:"packh",id:"G",data:{c:1,hd:{d:(()=>{const d=new Date(D(2));return d.getFullYear()+"-"+String(d.getMonth()+1).padStart(2,"0")+"-"+String(d.getDate()).padStart(2,"0")})(),why:"Aufbau später",by:"u1",t:1}}},
 /* F: eigener, erledigt */
 {col:"pack",id:"F",data:{ord:"2601001",ps:"5",ev:"Sommerfest Rust",pl:"Jürgen Hartmann",db:D(-20),de:D(-15),pos:[{p:"1",n:1,u:"Stk",t:"Schuko 20m",a:"1081",f:0}],by:"u1",t:D(-21)}},
 {col:"packh",id:"F",data:{c:1,h_1:{ok:true,by:"u1",t:1},fin:{by:"u1",t:1}}},
 {col:"retour",id:"rF",data:{ev:"Sommerfest Rust",ord:"2601001",itemsJson:J({"1081":it("1081","Schuko 20m",1)}),by:"u1",t:D(-15),closed:true,art:"end",closedBy:"u1",closedT:D(-15)}}]);
let F=0;const ok=(t,c,v)=>{F+=!c;console.log((c?"OK   ":"FEHLT")+" "+t+(v!==undefined?": "+v:""))};
async function run(b,role,rolle,extra,fn){const docs=base.concat(rolle?[{col:"rolle",id:"u1",data:rolle}]:[]).concat(extra||[]);
 const fk=fs.readFileSync(S+"fakesb.js","utf8").replace("const T={docs:[]","const T={docs:"+JSON.stringify(docs)).replace('role:"admin"','role:"'+role+'"');
 const ctx=await b.newContext({viewport:{width:390,height:844}});const p=await ctx.newPage();const errs=[];p.on("pageerror",e=>errs.push(e.message));
 await ctx.route("**/*",r=>{const u=r.request().url();if(u.startsWith("https://app.test/"))return r.fulfill({body:fs.readFileSync("/home/claude/gh/index.html"),contentType:"text/html"});if(u.includes("supabase-js"))return r.fulfill({body:fk,contentType:"text/javascript"});return r.fulfill({status:404,body:""})});
 await p.goto("https://app.test/");await p.waitForTimeout(900);await p.mouse.click(195,420);await p.waitForTimeout(500);
 const T=async sel=>(await p.$$eval(sel,l=>l.map(x=>x.innerText.replace(/\s+/g," ").trim()))).join(" | ");
 const V=async v=>{await p.evaluate(v=>{document.querySelectorAll(".ov").forEach(o=>o.remove());view=v;hist=["start"];draw()},v);await p.waitForTimeout(250)};
 await fn(p,T,V);ok("keine JS-Fehler",!errs.length,errs.join(" / "));await ctx.close()}
(async()=>{const b=await chromium.launch();
 console.log("--- Projektleiter ---");
 await run(b,"user",{t:"projektleiter"},null,async(p,T,V)=>{
  await V("start");const tiles=await T(".hgrid .hb b");ok("Kachel „Meine Aufträge“ da, keine Packlisten",/Meine Aufträge/.test(tiles)&&!/Packlisten/.test(tiles),tiles);
  ok("Meine Aufträge steht oben",(await p.$eval(".hgrid .hb b",e=>e.innerText))==="Meine Aufträge");
  console.log("Kachel:",await T('[data-g="au"]'));
  await p.click('[data-g="au"]');await p.waitForTimeout(300);
  const mine=await p.$$eval(".aucard.mine b",l=>l.map(x=>x.innerText)),rest=await p.$$eval(".aucard:not(.mine) .auct b",l=>l.map(x=>x.innerText));
  ok("Eigene (auch „Hartmann Jürgen“) oben, rot zuerst",mine.join(",")==="Stadtfest Eisenstadt,Firmenfeier Parndorf,Weihnachtsmarkt Spittelberg 2026",mine.join(","));
  ok("Trennstrich + andere",!!(await p.$(".audiv"))&&rest.join(",")==="Messe Wieselburg",rest.join(","));
  console.log("Karten:",await T(".aucard"));await p.screenshot({path:S+"au_liste.png",fullPage:true});
  await p.click('[data-auf="done"]');await p.waitForTimeout(200);ok("Erledigt-Filter",(await T(".aucard .auct b"))==="Sommerfest Rust | Winterwunder Mörbisch",await T(".aucard .auct b"));
  await p.click('[data-auf="lauf"]');await p.waitForTimeout(200);await p.fill("#auq","wiesel");await p.waitForTimeout(200);ok("Suche",(await T(".aucard .auct b"))==="Messe Wieselburg");await p.fill("#auq","");await p.waitForTimeout(200);
  await p.click('[data-au="A"]');await p.waitForTimeout(300);console.log("Zeitleiste:",await T(".aute"));
  ok("Abweichung beim Herrichten genannt",/3 von 4 Stk.*stattdessen 1 Stk Kabel CEE 32A 50m/.test(await T(".audev")),await T(".audev"));
  console.log("Fehlt noch:",await T(".aucd.red"));await p.screenshot({path:S+"au_detail.png",fullPage:true});
  ok("Fehlt noch mit Einheit",/2 Stk 32A Kabel 25m/.test(await T(".aucd.red")),await T(".aucd.red"));
  await p.click(".aumat summary");await p.waitForTimeout(150);ok("Material mit Einheit",/4 Stk .*6 Stk .*davon 2 Stk Fremdmiete/.test(await T(".aumat")),await T(".aumat"));
  await p.click('[data-aua="0"]');await p.waitForTimeout(200);await p.click('[data-ao="anders"]');await p.waitForTimeout(250);
  await p.fill("#abgq","mörbisch");await p.waitForTimeout(150);await p.click('[data-pp="B"]');await p.waitForTimeout(150);
  ok("Auftrag gewählt",/Winterwunder/.test(await T("#auto")),await T("#auto"));await p.fill("#autx","Hat Anna mitgenommen");await p.screenshot({path:S+"au_antwort.png"});
  await p.click("#auok");await p.waitForTimeout(400);
  const A=await p.evaluate(()=>PLAW.map(a=>a.typ+"|"+a.to+"|"+a.k+"|"+a.n+"|"+a.txt).join(";"));ok("Antwort gespeichert",/^anders\|B\|c:1097\|2\|Hat Anna/.test(A),A);
  ok("Antwort in der Ansicht",/Deine Antwort.*anderen Baustelle: Winterwunder Mörbisch.*Noch nicht gelesen/.test(await T(".aucd.red")),await T(".aucd.red .auans"));
  await p.click("#aumsg");await p.waitForTimeout(150);await p.fill("#aumt","Abbau verschiebt sich auf Montag");await p.click("#auok");await p.waitForTimeout(300);
  ok("Nachricht gespeichert",await p.evaluate(()=>PLAW.some(a=>a.typ==="msg"&&a.pk==="A")));
  await p.evaluate(()=>{curAu="E"});await V("auopen");ok("Fremder Auftrag ohne Antworten-Knopf",!(await p.$("#aumsg"))&&!(await p.$("[data-aua]")));console.log("Fremd:",await T(".aute"));
  await p.evaluate(()=>{curAu="C"});await V("auopen");console.log("Firmenfeier:",await T(".aute"));
  await p.evaluate(()=>{curAu="G"});await V("auopen");const tg=await T(".aute");console.log("Verschoben:",tg);
  ok("Verschoben: Draußen ab Herricht-Tag, nicht Dispo-Beginn",await p.evaluate(()=>{const P=packs.find(x=>x.id==="G");return pkWd(pkHDay(P))})===((tg.match(/Draußen ab (.+?)( \||$)/)||[])[1]),tg);
  ok("Verschoben: Herrichten zeigt „verschoben auf“",/verschoben auf .*Aufbau später/.test(tg));
  ok("Verschoben: Draußen noch nicht als erledigt",await p.evaluate(()=>auInfo(packs.find(x=>x.id==="G")).S[2].c)==="");
  await V("pack");ok("Packlisten-Ansicht gesperrt",await p.evaluate(()=>view)!=="pack");
 });
 console.log("--- Lager (Admin) ---");
 const ans=[{col:"plaw",id:"a1",data:{pk:"A",ord:"2601098",ev:"Stadtfest Eisenstadt",k:"c:1097",name:"32A Kabel 25m",n:3,typ:"anders",to:"B",toEv:"Winterwunder Mörbisch",toOrd:"2601114",txt:"Hat Anna",by:"u9",t:Date.now()-6e5}},
  {col:"plaw",id:"a2",data:{pk:"A",ord:"2601098",ev:"Stadtfest Eisenstadt",typ:"msg",txt:"Abbau verschiebt sich",by:"u9",t:Date.now()-3e5}}];
 await run(b,"admin",null,ans,async(p,T,V)=>{
  await V("jarvis");ok("Streifen in der Lager Übersicht",/2 Antworten von Projektleitern/.test(await T("#plstrip")),await T("#plstrip"));
  ok("Kachel-Zähler zählt mit",+(await p.evaluate(()=>jvHot()))>=2,await p.evaluate(()=>jvHot()));
  ok("Briefing nennt Antworten",await p.evaluate(()=>jvText(jvData()).join(" ")).then(s=>/Antworten von Projektleitern/.test(s)).catch(e=>"("+e.message+")"));
  await p.click("#plstrip");await p.waitForTimeout(250);console.log("Antworten:",await T(".aucd"));await p.screenshot({path:S+"au_lager.png",fullPage:true});
  await p.click('[data-plr="a2"]');await p.waitForTimeout(300);ok("Gelesen gesetzt",await p.evaluate(()=>!!PLAW.find(a=>a.id==="a2").read));
  await p.evaluate(()=>{curPack="A"});await V("pkabg");ok("Antwort im Auftragskonto beim Artikel",/anderen Baustelle: Winterwunder/.test(await T(".abgart")),"");ok("Nachricht im Auftragskonto",/Abbau verschiebt sich/.test(await T(".abgcard")));
  await V("abgzv");const zv=await T(".abgzv");ok("Vorschlag „Projektleiter sagt: ist dort“",/Projektleiter sagt: ist dort/.test(zv),zv.slice(0,200));
  await V("art");ok("Rechte-Raster hat Zeile Aufträge",true);await p.evaluate(()=>{view="admin";draw()}).catch(()=>{});
 });
 console.log("FEHLER GESAMT:",F);await b.close()})();
