/* Test 1.136: Projektleiter Übersicht (SP = Ordner mit fakesb.js) */
const {chromium}=require("playwright");const fs=require("fs");const S=(process.env.SP||"/tmp")+"/";const J=o=>JSON.stringify(o);
const t0=new Date();t0.setHours(0,0,0,0);const T0=t0.getTime(),D=n=>T0+n*864e5+8*36e5;
const kat=JSON.parse(fs.readFileSync(__dirname+"/rkat.json","utf8")).map((x,i)=>({col:"rkat",id:"k"+i,data:x}));
(async()=>{const b=await chromium.launch();let fail=0;const ok=(t,c)=>{if(!c)fail++;console.log((c?"OK   ":"FEHLT")+" "+t)};const errs=[];
 const pos=[{p:"1",n:9,u:"Stk",t:"VT 125A Maxi 2",a:"1048",f:0},{p:"2",n:12,u:"Stk",t:"125A Kabel 50m",a:"1109",f:0}];
 const HH={h_1:{ok:false,q:8,alt:[{n:1,t:"Verteiler 63A Indu",a:"1060"}],by:"u1",t:D(-1)},h_2:{ok:true,by:"u1",t:D(-1)},fin:{by:"u1",t:D(-1)}};
 const seed=[...kat,
  {col:"pack",id:"A",data:{ord:"260079601",ps:"1",ev:"Weihnachtsmarkt Spittelberg 2026",pl:"Heinz Tauber",db:D(-1),de:D(50),pos,zus:[],by:"u1",t:D(-5)}},{col:"packh",id:"A",data:HH},
  {col:"pack",id:"B",data:{ord:"260080001",ps:"2",ev:"Weihnachtsmarkt Am Hof",pl:"Heinz Tauber",db:D(-12),de:D(-2),pos,zus:[],by:"u1",t:D(-14)}},{col:"packh",id:"B",data:{h_1:{ok:true,by:"u1",t:D(-12)},h_2:{ok:true,by:"u1",t:D(-12)},fin:{by:"u1",t:D(-12)}}},
  {col:"retour",id:"rB",data:{ev:"Weihnachtsmarkt Am Hof",ord:"260080001",itemsJson:"{}",pa_u1:J({"1048":{nr:"1048",name:"Verteiler 125A Maxi 2",g:"Verteiler",u:"125A",q:6},"1109":{nr:"1109",name:"125A Kabel 50m",g:"Kabel",u:"125A",q:12}}),by:"u1",t:D(-1),closed:true,closedT:D(-1)+36e5,art:"end"}},
  {col:"pack",id:"C",data:{ord:"260090001",ps:"3",ev:"Firmenfeier Gösser",pl:"Heinz Tauber",db:D(-9),de:D(-3),pos,zus:[],by:"u1",t:D(-10)}},{col:"packh",id:"C",data:{h_1:{ok:true,by:"u1",t:D(-9)},h_2:{ok:true,by:"u1",t:D(-9)},fin:{by:"u1",t:D(-9)}}},
  {col:"pack",id:"E",data:{ord:"260095001",ps:"5",ev:"Feldbauernhof",pl:"Heinz Tauber",db:D(0),de:D(7),pos,zus:[],by:"u1",t:D(-2)}},
  {col:"pack",id:"X",data:{ord:"260099999",ps:"9",ev:"Fremder Auftrag",pl:"Stefan Huber",db:D(-9),de:D(-3),pos,zus:[],by:"u1",t:D(-10)}},
  {col:"defekte",id:"d1",data:{art:"Defender Midi",anr:"1200",ev:"Weihnachtsmarkt Spittelberg 2026",ord:"260079601",desc:"Rampe gebrochen",fv:true,fvw:"Bühnenbauer mit Stapler",by:"u1",t:D(0),done:false,n:1}}];
 const fk=fs.readFileSync(S+"fakesb.js","utf8").replace("const T={docs:[]","const T={docs:"+J(seed));
 const ctx=await b.newContext({viewport:{width:390,height:844}});const p=await ctx.newPage();p.on("pageerror",e=>errs.push(e.message));
 await ctx.addInitScript(t=>{try{localStorage.setItem("tpc_pl_seen",String(t));localStorage.setItem("tpc_jv_askread","0")}catch(e){}},D(-2));
 await ctx.route("**/*",r=>{const u=r.request().url();
  if(u.startsWith("https://app.test/"))return r.fulfill({body:fs.readFileSync("/home/claude/gh/index.html"),contentType:"text/html"});
  if(u.includes("supabase-js"))return r.fulfill({body:fk,contentType:"text/javascript"});
  return r.fulfill({status:404,body:""})});
 await p.goto("https://app.test/");await p.waitForTimeout(800);await p.mouse.click(200,400);await p.waitForTimeout(400);
 /* Admin-Vorschau als Heinz */
 await p.evaluate(()=>{view="jarvis";draw()});await p.waitForTimeout(300);ok("Admin: Link Projektleiter Übersicht",!!(await p.$("#pladm")));
 await p.click("#pladm");await p.waitForTimeout(300);await p.selectOption("#plas","Heinz Tauber");await p.waitForTimeout(300);
 const td=await p.evaluate(()=>[...document.querySelectorAll(".plti")].map(e=>e.innerText.replace(/\s+/g," ")));console.log(td.map(x=>"     "+x).join("\n"));
 ok("Zu erledigen: 4 Punkte",/Zu erledigen 4/.test((await p.textContent(".pltodo h3")).replace(/\s+/g," ")));
 ok("Reihenfolge: Antwort, Dispo, Fremdverschulden, Abweichung",/^LAGER WARTET/i.test(td[0])&&/^DISPO ABGELAUFEN/i.test(td[1])&&/^KUNDE VERRECHNEN/i.test(td[2])&&/^ABWEICHUNG/i.test(td[3]));
 ok("Fremder Auftrag nicht dabei",!/Fremder/.test(await p.textContent("#app")));
 ok("Abweichung kurz",/−1 Stk Verteiler 125A Maxi 2/.test(td[3])&&/\+1 Stk Verteiler 63A Indu/.test(td[3]));
 await p.screenshot({path:S+"pl_1.png",fullPage:true});
 const secs=await p.evaluate(()=>[...document.querySelectorAll(".plsec:not(.plask)")].map(e=>e.innerText.replace(/\s+/g," ")));console.log("     dbg",JSON.stringify(await p.evaluate(()=>[plPrev,pkH(packs.find(x=>x.id==="A")).fin])));console.log(secs.map(x=>"     "+x).join("\n"));
 ok("Heute: Feldbauernhof eine Zeile „Raus · noch nicht hergerichtet“",/Feldbauernhof noch nicht hergerichtet Raus/.test(secs[0])&&!/Herrichten/.test(secs[0]));
 ok("Woche: eine Zeile pro Auftrag",(secs[1].match(/Spittelberg/g)||[]).length===1);
 ok("Draußen: Gösser abgelaufen zuerst",/DRAUSSEN.*Firmenfeier Gösser Dispo abgelaufen/i.test(secs[2])&&/Am Hof Endretoure zurück · Fehlmaterial/.test(secs[2]));
 ok("Neu: Endretoure Am Hof + Spittelberg hergerichtet",/Am Hof – Endretoure zurück/.test(secs[3])&&/Spittelberg 2026 hergerichtet/.test(secs[3]));
 /* Gesehen */
 await p.click('[data-plseen="3"]');await p.waitForTimeout(600);ok("Gesehen → 3 Punkte",/Zu erledigen 3/.test((await p.textContent(".pltodo h3")).replace(/\s+/g," ")));
 ok("plseen gespeichert",await p.evaluate(()=>window.__T.docs.some(r=>r.col==="plseen"&&/^dev_A_/.test(r.data.k))));
 /* Antworten: Am Hof hat 2 Artikel? nur Maxi fehlt (6 von 9) → Dialog */
 await p.click('[data-plans="0"]');await p.waitForTimeout(300);ok("Antworten öffnet Dialog",!!(await p.$(".ov")));await p.evaluate(()=>document.querySelectorAll(".ov").forEach(o=>o.remove()));
 /* Fragen als PL ohne Packlisten-Recht */
 await p.evaluate(()=>{window.__c0=can;can=k=>k==="pk_s"?false:window.__c0(k)});
 console.log("     eov0:",await p.evaluate(()=>document.querySelectorAll(".eov").length));ok("Frag-Feld da",!!(await p.$("#jvaq")));await p.fill("#jvaq","Auf welcher Baustelle sind 50m 125A?");await p.click("#jvgo");await p.waitForTimeout(600);
 const ans=await p.evaluate(()=>(document.getElementById("jvans")||{}).innerText||"");console.log("     Antwort:",ans.replace(/\s+/g," ").slice(0,300));
 ok("Antwort nennt Baustellen (ohne Packlisten-Recht)",/Spittelberg|Gösser|Am Hof/.test(ans)&&!/Recht/.test(ans));
 console.log("     eov:",await p.evaluate(()=>[...document.querySelectorAll(".eov")].map(e=>e.innerHTML.slice(0,400)).join("|")));const r0=await p.$("#jvans [data-ja]");if(r0){await r0.click();await p.waitForTimeout(300);ok("Zeile öffnet den Auftrag (Meine Aufträge)",await p.evaluate(()=>view==="auopen"))}
 await p.evaluate(()=>{can=window.__c0;view="jarvis";draw()});await p.waitForTimeout(300);
 /* Woche */
 await p.click("#plwk");await p.waitForTimeout(200);ok("Nächste Woche",/Nächste Woche/.test(await p.textContent(".plsec:nth-of-type(2) h4, .plsec h4")+await p.textContent("#app")));
 /* Echter PL-Titel */
 await p.evaluate(()=>{plForce=false;plAs="";TIT["tp"]={id:"tp",name:"Projektleiter",r:{}};ROL[me]={...(ROL[me]||{}),t:"tp"};names[me]="Heinz Tauber";view="start";draw()});await p.waitForTimeout(400);
 const k=await p.textContent('[data-g="jarvis"]');console.log("     Kachel:",k.replace(/\s+/g," "));ok("Kachel „Projektleiter Übersicht“ mit Zahl 3",/Projektleiter Übersicht/.test(k)&&/3/.test(k));
 ok("Einstellungen-Name",await p.evaluate(()=>HO_NAME.jarvis==="Projektleiter Übersicht"));
 await p.evaluate(()=>{view="jarvis";draw()});await p.waitForTimeout(300);ok("Ansicht ohne Vorschau-Leiste",!(await p.$("#plas"))&&/Zu erledigen/.test(await p.textContent("#app")));
 /* Werkstatt bleibt Werkstatt */
 await p.evaluate(()=>{TIT["tw"]={id:"tw",name:"Werkstatt",r:{}};ROL[me]={...(ROL[me]||{}),t:"tw"};view="start";draw()});await p.waitForTimeout(300);ok("Werkstatt-Titel: Werkstatt Übersicht",/Werkstatt Übersicht/.test(await p.textContent('[data-g="jarvis"]')));
 /* alles erledigt → grün */
 await p.evaluate(()=>{TIT["tp"]={id:"tp",name:"Projektleiter",r:{}};ROL[me]={...(ROL[me]||{}),t:"tp"};names[me]="Niemand Sonst";view="jarvis";draw()});await p.waitForTimeout(300);ok("Keine Aufträge → grün + Hinweis",!!(await p.$(".pldone"))&&/Keine Packliste mit/.test(await p.textContent("#app")));
 ok("kein seitliches Scrollen",await p.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));
 await p.emulateMedia({colorScheme:"dark"});await p.evaluate(()=>{names[me]="Heinz Tauber";draw()});await p.waitForTimeout(300);await p.screenshot({path:S+"pl_dark.png",fullPage:true});
 console.log("Fehler:",errs);ok("keine Seitenfehler",!errs.length);console.log(fail?"FEHLGESCHLAGEN: "+fail:"ALLES OK");await b.close()})();
