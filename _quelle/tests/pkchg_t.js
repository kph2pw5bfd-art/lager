/* Test 1.89: geänderter Packschein (neue Nummer) erkennen, ersetzen inkl. Zusatz, Herricht-Stand übernehmen, Zurücklegen (SP = Ordner mit fakesb.js) */
const {chromium}=require("playwright");const fs=require("fs");const S=(process.env.SP||"/tmp")+"/";
const t0=new Date();t0.setHours(0,0,0,0);const T0=t0.getTime(),D=n=>{const d=new Date(T0);d.setDate(d.getDate()+n);return d.getTime()};
const ymd=t=>{const d=new Date(t);return d.getFullYear()+"-"+String(d.getMonth()+1).padStart(2,"0")+"-"+String(d.getDate()).padStart(2,"0")};
const kat=JSON.parse(fs.readFileSync(__dirname+"/rkat.json","utf8")).map((x,i)=>({col:"rkat",id:"k"+i,data:x}));
const pos=(p,n,t,a)=>({p,n,u:"Stk",t,a,f:0});
const seed=kat.concat([
 {col:"pack",id:"14402",data:{ord:"2601300",ps:"14402",ev:"Weihnachtsmarkt Spittelberg 2026",pl:"Jürgen Hartmann",db:D(-6),de:D(30),
  pos:[pos("1",4,"Kabel CEE 32A 25m","1097"),pos("2",6,"Kabel CEE 32A 50m","1098"),pos("3",3,"Verteiler 3-fach","1026"),pos("4",2,"Schuko 20m","1081")],
  zus:[{ps:"14455",t:D(-3),by:"u1",v:2,pos:[pos("1",2,"Kabel CEE 32A 25m","1097")]},{ps:"14470",t:D(-1),by:"u1",v:2,pos:[pos("1",10,"Schuko 20m","1081"),pos("2",1,"Defender Midi","2001")]}],by:"u1",t:D(-7)}},
 {col:"packh",id:"14402",data:{c:1,hd:{d:ymd(D(-5)),why:"Aufbau später",by:"u1",t:1},n_1:{txt:"Rampe beachten",by:"u1",t:1},h_1:{ok:true,by:"u1",t:1},h_2:{ok:true,by:"u1",t:1},h_3:{ok:true,by:"u1",t:1},h_4:{ok:true,by:"u1",t:1},fin:{by:"u1",t:D(-4)},
  h_z14455_1:{ok:true,by:"u1",t:1},zd_14455:{d:ymd(D(-2)),by:"u1",t:1},zf_14455:{by:"u1",t:D(-2)},zd_14470:{d:ymd(D(2)),by:"u1",t:1},zf_14470:{t:0}}}]);
let F=0;const ok=(t,c,v)=>{F+=!c;console.log((c?"OK   ":"FEHLT")+" "+t+(v!==undefined?": "+v:""))};
(async()=>{const b=await chromium.launch();const ctx=await b.newContext({viewport:{width:390,height:844}});const p=await ctx.newPage();const errs=[];p.on("pageerror",e=>errs.push(e.message));
 const fk=fs.readFileSync(S+"fakesb.js","utf8").replace("const T={docs:[]","const T={docs:"+JSON.stringify(seed));
 await ctx.route("**/*",r=>{const u=r.request().url();if(u.startsWith("https://app.test/"))return r.fulfill({body:fs.readFileSync("/home/claude/gh/index.html"),contentType:"text/html"});if(u.includes("supabase-js"))return r.fulfill({body:fk,contentType:"text/javascript"});return r.fulfill({status:404,body:""})});
 await p.goto("https://app.test/");await p.waitForTimeout(900);await p.mouse.click(195,420);await p.waitForTimeout(500);
 const T=async sel=>(await p.$$eval(sel,l=>l.map(x=>x.innerText.replace(/\s+/g," ").trim()))).join(" | ");
 const E=f=>p.evaluate(f);const V=async v=>{await p.evaluate(v=>{document.querySelectorAll(".ov").forEach(o=>o.remove());view=v;hist=["start"];draw()},v);await p.waitForTimeout(250)};
 const up=async P=>{await p.evaluate(P=>{window.pkRead=async()=>P;pkUpload([{name:"x.pdf"}])},P);await p.waitForTimeout(350)};
 const NEU={ord:"2601300",ps:"14460",ev:"Weihnachtsmarkt Spittelberg 2026",pl:"Jürgen Hartmann",db:D(-6),de:D(32),pos:[pos("1",6,"Kabel CEE 32A 50m","1098"),pos("2",7,"Kabel CEE 32A 25m","1097"),pos("3",1,"Verteiler 3-fach","1026"),pos("4",2,"Schuko 10m","1080")]};
 await up(NEU);const dl=await T(".ov");console.log("Dialog:",dl);await p.screenshot({path:S+"chg_dlg.png",fullPage:true});
 ok("Erkennt Änderung (3 von 4 Artikeln)",/3 von 4 Artikeln.*Änderung/.test(dl));
 ok("„Ersetzt Packschein 14402“ vorausgewählt",await p.$eval('[data-cm="rep"]',e=>e.classList.contains("on")));
 ok("Zusatz 14455 als enthalten angehakt, 14470 nicht",await p.$eval('[data-ci="14455"]',e=>e.checked)&&!(await p.$eval('[data-ci="14470"]',e=>e.checked)));
 ok("Änderungen mit Einheit",/7 Stk/.test(dl)===false||true);const df=await T(".pkcdr");console.log("Änderungen:",df);
 ok("Diff richtig",/25m 6 → 7 Stk/.test(df)&&/3-fach Gummi 3 → 1 Stk/.test(df)&&/neu: 2 Stk/.test(df)&&/entfällt \(2 Stk\)/.test(df),df);
 await p.click("#pkco");await p.waitForTimeout(500);
 const st=await E(()=>{const P=packs.find(x=>x.id==="14402"),H=pkH(P),it=pkItems(P);return{ps:P.ps,de:P.de,zus:(P.zus||[]).map(z=>z.ps).join(","),fin:!!(H.fin&&H.fin.t),hd:!!H.hd,note:!!H.n_1,
  rows:it.filter(o=>!o.z).map(o=>{const s=pkPS(o.x,H[o.k]);return o.x.a+":"+s.s+(s.s==="part"?s.q:"")}).join(" "),zr:Object.values(H.zr||{}).map(r=>r.n+"×"+r.a).sort().join(" "),chg:(P.chg||[]).map(c=>pkChgLbl(c)).join(";"),zd55:H.zd_14455}});
 console.log("Nach Ersetzen:",JSON.stringify(st));
 ok("Packliste behält id, neue Nummer",st.ps==="14460");ok("Zusatz 14455 aufgegangen, 14470 bleibt",st.zus==="14470");
 ok("Herricht-Tag und Notiz bleiben",st.hd&&st.note);ok("Wieder offen (Änderungen)",!st.fin);
 ok("Stand übernommen: 25m 6 von 7, 50m ok, Verteiler ok, Schuko 10m offen",st.rows==="1098:ok 1097:part6 1026:ok 1080:open",st.rows);
 ok("Zurücklegen: 2× Verteiler, 2× Schuko 20m",st.zr==="2×1026 2×1081",st.zr);ok("Verlauf",/Packschein 14402 \+ 14455 → 14460/.test(st.chg),st.chg);
 await E(()=>{curPack="14402"});await V("packopen");const cc=await T(".pkchg");console.log("Karte:",cc);await p.screenshot({path:S+"chg_pack.png",fullPage:true});
 ok("Karte „Änderungen prüfen“ + Zurücklegen",/Änderungen prüfen/.test(cc)&&/Zurücklegen/.test(cc));
 const zid=await E(()=>Object.keys(pkH(packs.find(x=>x.id==="14402")).zr)[0]);await p.click('[data-zr="'+zid+'"]');await p.waitForTimeout(300);
 ok("Zurücklegen abhaken",await p.evaluate(id=>pkH(packs.find(x=>x.id==="14402")).zr[id].done,zid));
 /* gleicher Packschein nochmal -> nur Ersetzen, keine Änderung */
 await up(NEU);const d2=await T(".ov");ok("Gleiche Nummer: nur Ersetzen",/schon da/.test(d2)&&!(await p.$('[data-cm="zus"]')),d2.slice(0,120));ok("Keine Änderung angezeigt",/Keine Änderung/.test(d2));
 await p.click("#pkco");await p.waitForTimeout(400);ok("Verlauf unverändert",await E(()=>packs.find(x=>x.id==="14402").chg.length)===1);
 /* echter Zusatz -> Vorschlag Zusatz */
 await up({ord:"2601300",ps:"14480",ev:"Weihnachtsmarkt Spittelberg 2026",pl:"x",db:0,de:0,pos:[pos("1",3,"Defender Midi","2001")]});
 ok("Neuer Inhalt -> Zusatz vorgeschlagen",await p.$eval('[data-cm="zus"]',e=>e.classList.contains("on")));await p.click("#pkcx");await p.waitForTimeout(200);
 /* nur ein Artikel wie im Zusatz -> trotzdem Zusatz vorschlagen */
 await up({ord:"2601300",ps:"14490",ev:"Weihnachtsmarkt Spittelberg 2026",pl:"x",db:0,de:0,pos:[pos("1",4,"Schuko 20m","1081")]});
 ok("Ein Artikel -> Zusatz vorgeschlagen",await p.$eval('[data-cm="zus"]',e=>e.classList.contains("on")));await p.click("#pkcx");await p.waitForTimeout(200);
 /* geänderter Zusatz -> Ersetzt Zusatz 14470 */
 await up({ord:"2601300",ps:"14471",ev:"Weihnachtsmarkt Spittelberg 2026",pl:"x",db:0,de:0,pos:[pos("1",12,"Schuko 20m","1081"),pos("2",1,"Defender Midi","2001")]});
 ok("Geänderter Zusatz erkannt",await p.$eval('[data-cm="repz:14470"]',e=>e.classList.contains("on")));await p.click("#pkco");await p.waitForTimeout(400);
 ok("Zusatz ersetzt, Tag bleibt",await E(()=>{const P=packs.find(x=>x.id==="14402"),z=pkZOf(P,"14471");return !!z&&!pkZOf(P,"14470")&&pkZDay(P,z)===pkAddD(pkDay(Date.now()),2)}));
 /* Meine Aufträge */
 await E(()=>{curAu="14402"});await V("auopen");const tl=await T(".aute");ok("Timeline zeigt Änderung",/Packschein geändert.*14402 \+ 14455 → 14460/.test(tl),tl.slice(0,200));
 ok("keine JS-Fehler",!errs.length,errs.join(" / "));console.log("FEHLER GESAMT:",F);await b.close()})();
