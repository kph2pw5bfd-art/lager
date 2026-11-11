/* Test 1.169: Fotos vom fertigen Material – Frage beim Abschließen, Packliste, Meine Aufträge, Retourschein, Löschen, Aufräumen (SP = Ordner mit fakesb.js) */
const {chromium}=require("playwright");const fs=require("fs");const S=(process.env.SP||"/tmp")+"/";const J=o=>JSON.stringify(o);
const t0=new Date();t0.setHours(0,0,0,0);const T0=t0.getTime(),D=n=>T0+n*864e5+8*36e5;
(async()=>{const b=await chromium.launch();let fail=0;const ok=(t,c)=>{if(!c)fail++;console.log((c?"OK   ":"FEHLT")+" "+t)};const errs=[];
 const pos=[{p:"1",n:4,u:"Stk",t:"Kabel CEE 63A 25m",a:"1103",f:0},{p:"2",n:2,u:"Stk",t:"Kabel CEE 63A 50m",a:"1104",f:0}],zpos=[{p:"1",n:1,u:"Stk",t:"Verteiler 63A",a:"1060",f:0}];
 const seed=[{col:"pack",id:"A",data:{ord:"260116601",ps:"20260756",ev:"Testmarkt",pl:"Jürgen Hartmann",db:D(0),de:D(30),pos,zus:[{ps:"20260760",pos:zpos,t:D(0),v:2}],by:"u1",t:D(-1)}},
  {col:"packh",id:"A",data:{h_1:{ok:true,by:"u1",t:D(0)},h_2:{ok:true,by:"u1",t:D(0)},h_z20260760_1:{ok:true,by:"u1",t:D(0)}}},
  {col:"retour",id:"rA",data:{ev:"Testmarkt",ord:"260116601",itemsJson:"{}",by:"u1",t:Date.now()}},
  {col:"pack",id:"B",data:{ord:"250000101",ps:"1",ev:"Alt",pl:"X",db:D(-130),de:D(-110),pos,zus:[],by:"u1",t:D(-140)}},
  {col:"packh",id:"B",data:{mf_h:[{id:"B-mold",c:"",by:"u1",t:D(-130)}]}},{col:"fotos",id:"B-mold",data:{d:"data:image/png;base64,AA"}},
  {col:"retour",id:"rB",data:{ev:"Alt",ord:"250000101",itemsJson:"{}",by:"u1",t:D(-100),closed:true,art:"end",closedT:D(-100)}},
  {col:"pack",id:"C",data:{ord:"250000201",ps:"2",ev:"Neu zurück",pl:"X",db:D(-40),de:D(-20),pos,zus:[],by:"u1",t:D(-40)}},
  {col:"packh",id:"C",data:{mf_h:[{id:"C-m1",c:"",by:"u1",t:D(-40)}]}},
  {col:"retour",id:"rC",data:{ev:"Neu",ord:"250000201",itemsJson:"{}",by:"u1",t:D(-20),closed:true,art:"end",closedT:D(-20)}}];
 const fk=fs.readFileSync(S+"fakesb.js","utf8").replace("const T={docs:[]","const T={docs:"+J(seed));
 const ctx=await b.newContext({viewport:{width:390,height:844}});const p=await ctx.newPage();p.on("pageerror",e=>errs.push(e.message));
 await ctx.route("**/*",r=>{const u=r.request().url();if(u.startsWith("https://app.test/"))return r.fulfill({body:fs.readFileSync("/home/claude/gh/index.html"),contentType:"text/html"});if(u.includes("supabase-js"))return r.fulfill({body:fk,contentType:"text/javascript"});return r.fulfill({status:404,body:""})});
 await p.goto("https://app.test/");await p.waitForTimeout(800);await p.mouse.click(200,400);await p.waitForTimeout(400);
 const png=await p.screenshot({clip:{x:0,y:0,width:120,height:90}});
 await p.evaluate(()=>{curPack="A";go("packopen")});await p.waitForTimeout(400);
 ok("vor dem Abschließen kein Foto-Kasten",!(await p.$(".mfbox")));
 await p.click('[data-pkfg="main"]');await p.click("#pkfin");await p.waitForTimeout(400);
 ok("Frage nach Foto",/Foto vom fertigen Material machen/.test(await p.textContent("body")));
 const [fc]=await Promise.all([p.waitForEvent("filechooser"),p.click("#a2y")]);ok("1.170: öffnet Kamera (capture, nur ein Foto)",!fc.isMultiple()&&await p.evaluate(()=>{const i=document.querySelector("#mffile");return !!i&&i.getAttribute("capture")==="environment"}));await fc.setFiles({name:"m.png",mimeType:"image/png",buffer:png});await p.waitForTimeout(600);
 ok("Beschreibung-Fenster",!!(await p.$("#mfc")));
 const [fc2]=await Promise.all([p.waitForEvent("filechooser"),p.click("#mfmore")]);await fc2.setFiles({name:"m2.png",mimeType:"image/png",buffer:png});await p.waitForTimeout(500);ok("Noch ein Foto: 2 Vorschauen",(await p.$$("#mfcp img")).length===2);
 const [fc3]=await Promise.all([p.waitForEvent("filechooser"),p.click("#mfgal")]);ok("Galerie: mehrere erlaubt",fc3.isMultiple());await fc3.setFiles([{name:"a.png",mimeType:"image/png",buffer:png},{name:"b.png",mimeType:"image/png",buffer:png}]);await p.waitForTimeout(600);ok("4 Vorschauen",(await p.$$("#mfcp img")).length===4);
 await p.click('[data-mfrm="3"]');await p.click('[data-mfrm="2"]');await p.click('[data-mfrm="1"]');ok("entfernen → 1",(await p.$$("#mfcp img")).length===1);await p.fill("#mfc","3 Gitterboxen + 1 Palette");await p.click("#mfok");await p.waitForTimeout(800);
 const L=await p.evaluate(()=>(packh.A||{}).mf_h);ok("gespeichert mit Text",Array.isArray(L)&&L.length===1&&L[0].c==="3 Gitterboxen + 1 Palette"&&/^A-m/.test(L[0].id));
 ok("Bild in fotos",await p.evaluate(async id=>{const s=await db.doc("fotos/"+id).get();return s.exists&&/^data:image/.test(s.data().d)},L&&L[0].id));
 await p.evaluate(()=>{pkFS.open={};window.PK_FOPEN=false;draw()});await p.waitForTimeout(400);
 ok("Packliste zugeklappt: Vorschau + Text",await p.evaluate(()=>{const i=document.querySelector('.pkf.main img[data-mfph]');return !!i&&!!i.src&&/3 Gitterboxen/.test(document.querySelector(".pkf.main .mfbox").textContent)}));
 ok("Zusatz: noch kein Kasten (nicht abgeschlossen)",!(await p.$('.pkf.zus .mfbox')));
 await p.click('.pkf.main img[data-mfph]');await p.waitForTimeout(300);ok("groß anzeigen mit Text",/3 Gitterboxen/.test(await p.textContent(".mfv")));await p.click("[data-mfvz]");
 /* Zusatz abschließen, Ohne Foto */
 await p.click('[data-pkfg="z20260760"]').catch(async()=>{await p.click('.pkf.zus [data-pkfg]')});await p.click('[data-pkzf]');await p.waitForTimeout(400);await p.click("#a2n");await p.waitForTimeout(400);
 ok("Zusatz ohne Foto: Kasten mit Knopf",await p.evaluate(()=>!!document.querySelector('.pkf.zus [data-mfadd="20260760"]')));
 /* Meine Aufträge */
 await p.evaluate(()=>{auf="alle";go("au")});await p.waitForTimeout(400);ok("Kachel zeigt 📷 1",/📷 1/.test(await p.textContent('[data-au="A"]')));
 await p.evaluate(()=>{curAu="A";go("auopen")});await p.waitForTimeout(500);
 ok("Meine Aufträge: Abschnitt Fotos",await p.evaluate(()=>{const s=document.querySelector("#mfau");return !!s&&/Packschein 20260756/.test(s.textContent)&&!!s.querySelector("img").src}));
 await p.click("#mfau img");await p.waitForTimeout(300);ok("dort nur ansehen (kein Löschen)",!(await p.$("[data-mfvx]")));await p.click("[data-mfvz]");
 /* Retourschein */
 await p.evaluate(()=>{curRet="rA";go("retopen")});await p.waitForTimeout(600);ok("Retourschein: Fotos beim Herrichten",await p.evaluate(()=>{const s=document.querySelector("#mfret");return !!s&&!!s.querySelector("img[data-mfph]")}));
 /* Löschen in der Packliste */
 await p.evaluate(()=>{curPack="A";go("packopen")});await p.waitForTimeout(400);await p.click('.pkf.main img[data-mfph]');await p.click("[data-mfvx]");await p.click("#y");await p.waitForTimeout(600);
 ok("Foto gelöscht",await p.evaluate(()=>!(packh.A||{}).mf_h));
 /* Aufräumen: B (Endretoure vor 100 Tagen) weg, C (vor 20 Tagen) bleibt */
 const n=await p.evaluate(()=>mfClean());await p.waitForTimeout(600);
 ok("Aufräumen: alt gelöscht, neu bleibt",n===1&&await p.evaluate(async()=>!(packh.B||{}).mf_h&&!(await db.doc("fotos/B-mold").get()).exists&&(packh.C||{}).mf_h.length===1));
 await p.screenshot({path:S+"mfoto.png"});ok("Keine JS-Fehler "+errs.join("|"),!errs.length);await b.close();console.log(fail?"FEHLER: "+fail:"ALLES OK")})();
