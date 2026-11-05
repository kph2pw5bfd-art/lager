/* Test 1.122: Defekte schneller melden – Formular (Reihenfolge, QR, Packlisten-Knöpfe, Vorschläge, Stückzahl, Nächster Defekt)
   und „davon defekt“ im Retourschein-Zahlenfeld (SP = Ordner mit fakesb.js) */
const {chromium}=require("playwright");const fs=require("fs");const S=(process.env.SP||"/tmp")+"/";const J=o=>JSON.stringify(o);
const t0=new Date();t0.setHours(0,0,0,0);const T0=t0.getTime(),D=n=>T0+n*864e5+8*36e5;
const kat=JSON.parse(fs.readFileSync(__dirname+"/rkat.json","utf8")).map((x,i)=>({col:"rkat",id:"k"+i,data:x}));
(async()=>{const b=await chromium.launch();let fail=0;const ok=(t,c)=>{if(!c)fail++;console.log((c?"OK   ":"FEHLT")+" "+t)};const errs=[];
 const pos=[{p:"1",n:12,u:"Stk",t:"Kabel 32A 50m CEE",a:"1098",f:0},{p:"2",n:4,u:"Stk",t:"VT 32A Blackline FI",a:"4428",f:0},{p:"3",n:6,u:"Stk",t:"Schuko 20m",a:"1081",f:6},{p:"4",n:2,u:"Stk",t:"125A Kabel 50m",a:"1109",f:0}];
 const seed=[...kat,{col:"pack",id:"A",data:{ord:"2601080-01",ps:"14700",ev:"Weihnachtsmarkt Spittelberg 2026",pl:"Max Muster",db:D(-6),de:D(-1),pos,zus:[{ps:"14701",pos:[{p:"1",n:3,u:"Stk",t:"Kabel 32A 50m",a:"1098",f:0}]}],by:"u1",t:D(-8)}},
  {col:"retour",id:"rA",data:{ev:"Weihnachtsmarkt Spittelberg 2026",ord:"2601080-01",itemsJson:"{}",pa_u1:J({"1098":{nr:"1098",name:"32A Kabel 50m",g:"Kabel",u:"32A",q:15}}),by:"u1",t:D(0),draft:false}}];
 const fk=fs.readFileSync(S+"fakesb.js","utf8").replace("const T={docs:[]","const T={docs:"+J(seed));
 const ctx=await b.newContext({viewport:{width:390,height:844}});const p=await ctx.newPage();p.on("pageerror",e=>errs.push(e.message));
 await ctx.route("**/*",r=>{const u=r.request().url();
  if(u.startsWith("https://app.test/"))return r.fulfill({body:fs.readFileSync("/home/claude/gh/index.html"),contentType:"text/html"});
  if(u.includes("supabase-js"))return r.fulfill({body:fk,contentType:"text/javascript"});
  return r.fulfill({status:404,body:""})});
 await p.goto("https://app.test/");await p.waitForTimeout(800);await p.mouse.click(200,400);await p.waitForTimeout(400);
 const DEFS=()=>p.evaluate(()=>window.__T.docs.filter(r=>r.col==="defekte").map(r=>({id:r.id,...r.data})));
 /* ---- Teil A ---- */
 await p.evaluate(()=>{view="defnew";draw()});await p.waitForTimeout(400);
 const order=await p.evaluate(()=>[...document.querySelectorAll("#app .dsh")].map(e=>e.textContent));ok("Reihenfolge: "+order.join(" · "),order.join("|")==="Veranstaltung|Artikel|Defekt");
 ok("Knopf „QR scannen“ neben „Etikett fotografieren“",await p.evaluate(()=>{const q=document.querySelector("#dnqr"),l=document.querySelector("#dnlab");return q&&l&&q.parentNode===l.parentNode}));
 ok("Hinweis ohne Veranstaltung",/Zuerst die Veranstaltung wählen/.test(await p.textContent("#dnchips")));
 await p.screenshot({path:S+"defx_start.png",fullPage:true});
 /* Vorschläge ohne Veranstaltung */
 await p.click("#dnart");await p.type("#dnart","blackline fi");await p.waitForTimeout(150);
 const sg=await p.evaluate(()=>[...document.querySelectorAll(".dxsug [data-dxs]")].map(b=>b.textContent));ok("Vorschlag „blackline fi“ → "+J(sg),sg.length>=1&&/Verteiler 32A Blackline FI\/LS/.test(sg[0])&&/4428/.test(sg[0]));
 await p.fill("#dnart","");await p.type("#dnart","maxi 125");await p.waitForTimeout(150);const sg2=await p.evaluate(()=>[...document.querySelectorAll(".dxsug [data-dxs]")].map(b=>b.textContent));console.log("     maxi 125 →",J(sg2));
 await p.fill("#dnart","");await p.type("#dnart","32A 50");await p.waitForTimeout(150);await p.screenshot({path:S+"defx_sug.png"});
 await p.click('.dxsug [data-dxs="B0"]');await p.waitForTimeout(100);const pk1=[await p.inputValue("#dnart"),await p.inputValue("#dnnr")];ok("Vorschlag antippen füllt Name + Nummer "+J(pk1),pk1[0]==="32A Kabel 50m"&&pk1[1]==="1098");
 /* QR scannen → Veranstaltung + Auftrag, Packlisten-Knöpfe */
 await p.evaluate(()=>{$("#dnart").value="";$("#dnnr").value="";dxQrHit("dn","TPC:2601080-01")});await p.waitForTimeout(900);
 ok("QR: Veranstaltung + Auftrag",(await p.inputValue("#dnev"))==="Weihnachtsmarkt Spittelberg 2026"&&(await p.inputValue("#dnord"))==="2601080-01");
 const ch=await p.evaluate(()=>[...document.querySelectorAll("#dnchips .dxchip")].map(b=>b.textContent));console.log("     Knöpfe:",J(ch));
 ok("Packlisten-Knöpfe: ohne reine Fremdmiete, Zusatz eingerechnet",ch.length===3&&ch.some(c=>/32A Kabel 50m15 Stk/.test(c))&&!ch.some(c=>/Schuko/.test(c)));
 await p.evaluate(()=>[...document.querySelectorAll("#dnchips .dxchip")].find(b=>/Blackline/.test(b.textContent)).click());await p.waitForTimeout(100);
 ok("Knopf füllt Name + Nummer",(await p.inputValue("#dnart"))==="Verteiler 32A Blackline FI/LS"&&(await p.inputValue("#dnnr"))==="4428");
 await p.click("#dnn button:last-child");ok("Stückzahl 2",(await p.textContent("#dnn b"))==="2 Stk");
 await p.fill("#dnds","FI löst nicht aus");await p.screenshot({path:S+"defx_form.png",fullPage:true});
 await p.click("#dnsend");await p.waitForTimeout(900);let L=await DEFS();
 ok("Gespeichert mit n=2, Nummer, Auftrag",L.length===1&&L[0].n===2&&L[0].anr==="4428"&&L[0].ord==="2601080-01"&&L[0].ev==="Weihnachtsmarkt Spittelberg 2026");
 ok("Bestätigung mit „Nächster Defekt“",!!(await p.$("#dxnext"))&&/2 × Verteiler 32A Blackline FI\/LS/.test(await p.textContent("#app")));
 await p.waitForTimeout(400);ok("Bestätigung bleibt stehen (kein Neuzeichnen)",!!(await p.$("#dxnext")));await p.screenshot({path:S+"defx_done.png",fullPage:true});
 /* Nächster Defekt */
 await p.click("#dxnext");await p.waitForTimeout(500);
 ok("Veranstaltung bleibt stehen (Kasten)",!!(await p.$("#dnlock"))&&(await p.inputValue("#dnev"))==="Weihnachtsmarkt Spittelberg 2026"&&(await p.inputValue("#dnord"))==="2601080-01");
 ok("Artikel leer, Stückzahl 1",(await p.inputValue("#dnart"))===""&&(await p.textContent("#dnn b"))==="1 Stk");
 const ch2=await p.evaluate(()=>[...document.querySelectorAll("#dnchips .dxchip")].map(b=>b.textContent));ok("Knopf zeigt „2 gemeldet“",ch2.some(c=>/Blackline.*2 gemeldet/.test(c)));
 await p.screenshot({path:S+"defx_next.png",fullPage:true});
 await p.evaluate(()=>[...document.querySelectorAll("#dnchips .dxchip")].find(b=>/125A/.test(b.textContent)).click());await p.click("#dnsend");await p.waitForTimeout(900);L=await DEFS();
 ok("Zweiter Defekt gespeichert",L.length===2&&L.some(d=>d.art==="125A Kabel 50m"&&d.anr==="1109"&&d.n===1&&d.ord==="2601080-01"));
 ok("Liste „heute gemeldet“ zeigt beide",(await p.$$(".dxli")).length===2);
 await p.click("#dxfin");await p.waitForTimeout(300);const lst=await p.textContent("#app");ok("Defekte-Liste: „2 × …“",/2 × Verteiler 32A Blackline FI\/LS/.test(lst));
 /* Ändern-Knopf entsperrt */
 await p.evaluate(()=>{dxKeep={ev:"X",ord:""};view="defnew";draw()});await p.waitForTimeout(300);await p.click("#dnunlock");ok("„Ändern“ zeigt die Felder wieder",await p.isVisible("#dnev")&&!(await p.$("#dnlock")));
 /* Bearbeiten: Stückzahl */
 const id1=L.find(d=>d.n===2).id;await p.evaluate(id=>{curDef=id;view="defedit";draw()},id1);await p.waitForTimeout(500);ok("Bearbeiten: Stückzahl 2 vorbelegt",(await p.textContent("#den b"))==="2 Stk");
 await p.click("#den button:first-child");await p.evaluate(()=>{$("#desv").disabled=false});await p.click("#desv");await p.waitForTimeout(800);L=await DEFS();ok("Bearbeiten: n=1 gespeichert",L.find(d=>d.id===id1).n===1);
 /* Wochenbericht zählt Stückzahl */
 await p.evaluate(id=>{const d=defs.find(x=>x.id===id);d.n=3},id1);const wn=await p.evaluate(()=>{const R=wbDefNeed(0,9e15);const g=R.find(x=>/Blackline/.test(x.name));return g?g.n:-1});console.log("     wbDefNeed (nur wenn gebraucht):",wn);
 /* ---- Teil B ---- */
 await p.evaluate(()=>{curRet="rA";view="retopen";draw()});await p.waitForTimeout(300);await p.click("#red");await p.waitForTimeout(500);
 await p.evaluate(()=>rPad({nr:"1098",name:"32A Kabel 50m",g:"Kabel",u:"32A"},{nr:"1098",name:"32A Kabel 50m",g:"Kabel",u:"32A"}));await p.waitForTimeout(200);
 ok("Zahlenfeld: Zeile „davon defekt“ = 0",(await p.textContent("#dxn"))==="0");await p.screenshot({path:S+"defx_pad.png"});
 await p.click("#dxp");await p.waitForTimeout(200);ok("Fenster „Defekt: 32A Kabel 50m“",/Defekt: 32A Kabel 50m/.test(await p.textContent(".ov:last-child")));
 await p.fill("#dxds","Stecker gebrochen");await p.check("#dxu");await p.screenshot({path:S+"defx_dlg.png"});await p.click("#dxok");await p.waitForTimeout(900);
 L=await DEFS();let r=L.find(d=>d.ret==="rA");ok("Meldung aus dem Retourschein (ret, rnr, Auftrag, dringend)",r&&r.rnr==="1098"&&r.anr==="1098"&&r.n===1&&r.urg===true&&r.ord==="2601080-01"&&r.desc==="Stecker gebrochen");
 ok("Zähler im Zahlenfeld = 1",(await p.textContent("#dxn"))==="1");
 await p.click("#dxp");await p.waitForTimeout(600);L=await DEFS();r=L.find(d=>d.ret==="rA");ok("+ → dieselbe Meldung, n=2",L.filter(d=>d.ret==="rA").length===1&&r.n===2&&(await p.textContent("#dxn"))==="2");
 await p.click("#dxm");await p.waitForTimeout(600);L=await DEFS();r=L.find(d=>d.ret==="rA");ok("− → n=1",r.n===1);
 await p.click("#dxm");await p.waitForTimeout(200);ok("Auf 0 → Rückfrage löschen",/Defektmeldung „32A Kabel 50m“ löschen\?/.test(await p.textContent("body")));
 await p.click("#a2n");await p.waitForTimeout(300);L=await DEFS();ok("Behalten → bleibt",L.some(d=>d.ret==="rA"));
 await p.click("#dxm");await p.waitForTimeout(200);await p.click("#a2y");await p.waitForTimeout(800);L=await DEFS();ok("Löschen → weg (Admin)",!L.some(d=>d.ret==="rA"&&!d.del)&&(await p.textContent("#dxn"))==="0");
 /* „Später beschreiben“ und Schild auf der Kachel */
 await p.click("#dxp");await p.waitForTimeout(200);await p.click("#dxlater");await p.waitForTimeout(800);L=await DEFS();r=L.find(d=>d.ret==="rA");ok("Später beschreiben: Meldung ohne Text",r&&r.desc==="");
 await p.evaluate(()=>{document.querySelectorAll(".ov").forEach(o=>o.remove());retEdit()});await p.waitForTimeout(200);
 await p.evaluate(()=>{rs.lvl="items";rs.g="Kabel";rs.u="32A";retEdit()});await p.waitForTimeout(300);const tg=await p.evaluate(()=>{const t=document.querySelector('.rtile[data-ra="1098"] .dxdt');return t?t.textContent:""});ok("Kachel: Schild „1 defekt“ ("+tg+")",tg==="1 defekt");
 await p.screenshot({path:S+"defx_tiles.png",fullPage:true});
 /* Ohne Lösch-Recht: als gelöscht markiert */
 await p.evaluate(()=>{window.__c=can;can=k=>k==="def_l"?false:window.__c(k);rPad({nr:"1098",name:"32A Kabel 50m"},{nr:"1098",name:"32A Kabel 50m",g:"Kabel",u:"32A"})});await p.waitForTimeout(200);
 await p.click("#dxm");await p.waitForTimeout(200);await p.click("#a2y");await p.waitForTimeout(800);L=await DEFS();r=L.find(d=>d.ret==="rA");ok("Ohne Recht Löschen: del=true, aus der Liste",r&&r.del===true&&!(await p.evaluate(()=>defs.some(d=>d.ret==="rA"))));
 await p.evaluate(()=>{can=window.__c;document.querySelectorAll(".ov").forEach(o=>o.remove())});
 /* nochmal melden für Ansicht, Mail, Excel */
 await p.evaluate(()=>rPad({nr:"1098",name:"32A Kabel 50m"},{nr:"1098",name:"32A Kabel 50m",g:"Kabel",u:"32A"}));await p.waitForTimeout(200);await p.click("#dxp");await p.fill("#dxds","Mantel aufgerissen");await p.click("#dxok");await p.waitForTimeout(800);
 await p.evaluate(()=>{document.querySelectorAll(".ov").forEach(o=>o.remove());rs=null;curRet="rA";view="retopen";draw()});await p.waitForTimeout(400);
 ok("Retourschein: Streifen „1 Stk defekt gemeldet“",/1 Stk defekt gemeldet/.test(await p.evaluate(()=>(document.getElementById("dxret")||{}).textContent||"")));await p.screenshot({path:S+"defx_retopen.png",fullPage:true});
 const mail=await p.evaluate(()=>rMailBody(rets.find(r=>r.id==="rA")));ok("Mail: Zeile Defekt",/Defekt zurückgekommen: 1 Stk 32A Kabel 50m \(Mantel aufgerissen\)/.test(mail));
 const xl=await p.evaluate(()=>[dxRetN("rA"),dxRetXl({id:"rA"},"1098")]);ok("Excel-Werte",xl[0]===1&&xl[1]===1);
 /* Defekt ansehen: Link zurück */
 const did=(await DEFS()).find(d=>d.ret==="rA"&&!d.del).id;await p.evaluate(id=>{curDef=id;view="defopen";draw()},did);await p.waitForTimeout(300);
 ok("Defekt: „Gemeldet beim Zählen – Retourschein öffnen“",!!(await p.$("[data-dxr]")));await p.click("[data-dxr]");await p.waitForTimeout(300);ok("Link öffnet den Retourschein",await p.evaluate(()=>view==="retopen"&&curRet==="rA"));
 const ov=await p.evaluate(()=>document.documentElement.scrollWidth<=innerWidth);ok("kein seitliches Scrollen",ov);
 await p.emulateMedia({colorScheme:"dark"});await p.evaluate(()=>{view="defnew";draw()});await p.waitForTimeout(300);await p.evaluate(()=>dxQrHit("dn","TPC:2601080-01"));await p.waitForTimeout(800);await p.screenshot({path:S+"defx_dark.png",fullPage:true});
 console.log("Fehler:",errs);ok("keine Seitenfehler",!errs.length);console.log(fail?"FEHLGESCHLAGEN: "+fail:"ALLES OK");await b.close()})();
