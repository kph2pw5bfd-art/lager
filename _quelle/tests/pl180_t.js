/* Test 1.180: Projektleiter Übersicht – „Gesehen (n)“ + Zurückgekommen am Tag der Endretoure (SP = Ordner mit fakesb.js) */
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
  {col:"pack",id:"F",data:{ord:"260096001",ps:"6",ev:"Früher zurück",pl:"Heinz Tauber",db:D(-4),de:D(2),pos,zus:[],by:"u1",t:D(-5)}},{col:"packh",id:"F",data:{h_1:{ok:true,by:"u1",t:D(-4)},h_2:{ok:true,by:"u1",t:D(-4)},fin:{by:"u1",t:D(-4)}}},
  {col:"retour",id:"rF",data:{ev:"Früher zurück",ord:"260096001",itemsJson:"{}",pa_u1:J({"1048":{nr:"1048",name:"Verteiler 125A Maxi 2",g:"Verteiler",u:"125A",q:9},"1109":{nr:"1109",name:"125A Kabel 50m",g:"Kabel",u:"125A",q:12}}),by:"u1",t:D(0),closed:true,closedT:D(0)+36e5,art:"end"}},
  {col:"defekte",id:"d1",data:{art:"Defender Midi",anr:"1200",ev:"Weihnachtsmarkt Spittelberg 2026",ord:"260079601",desc:"Rampe gebrochen",fv:true,fvw:"Bühnenbauer mit Stapler",by:"u1",t:D(0),done:false,n:1}}];
 const fk=fs.readFileSync(S+"fakesb.js","utf8").replace("const T={docs:[]","const T={docs:"+J(seed));
 const ctx=await b.newContext({viewport:{width:390,height:844}});const p=await ctx.newPage();p.on("pageerror",e=>errs.push(e.message));
 await ctx.addInitScript(t=>{try{localStorage.setItem("tpc_pl_seen",String(t));localStorage.setItem("tpc_jv_askread","0")}catch(e){}},D(-2));
 await ctx.route("**/*",r=>{const u=r.request().url();
  if(u.startsWith("https://app.test/"))return r.fulfill({body:fs.readFileSync("/home/claude/gh/index.html"),contentType:"text/html"});
  if(u.includes("supabase-js"))return r.fulfill({body:fk,contentType:"text/javascript"});
  return r.fulfill({status:404,body:""})});
 await p.goto("https://app.test/");await p.waitForTimeout(800);await p.mouse.click(200,400);await p.waitForTimeout(400);
 await p.evaluate(()=>{view="jarvis";draw()});await p.waitForTimeout(300);await p.click("#pladm");await p.waitForTimeout(300);await p.selectOption("#plas","Heinz Tauber");await p.waitForTimeout(300);
 /* früher zurück */
 const ev=await p.evaluate(()=>{const M=packs.filter(plMine).map(auInfo),t0=pkDay(Date.now()),f=t=>plEvents(M,t).filter(e=>e.p.id==="F").map(e=>e.l).join(",");return [f(t0),f(pkAddD(t0,2))]});
 ok("Früher zurück: heute „Zurückgekommen“, am Dispo-Ende nichts",ev[0].includes("Zurückgekommen")&&!ev[1].includes("zurück"),);console.log("     ",JSON.stringify(ev));
 const n0=(await p.$$(".pltodo .plti")).length;ok("ohne Gesehen-Bereich am Anfang",!(await p.$(".plseen")));
 const idx=await p.evaluate(()=>[...document.querySelectorAll(".pltodo .plti")].findIndex(e=>e.querySelector("[data-plseen]")));
 await p.click(".pltodo .plti:nth-child("+(idx+2)+") [data-plseen]");await p.waitForTimeout(400);
 ok("Gesehen: einer weniger",(await p.$$(".pltodo .plti")).length===n0-1);
 ok("Bereich „Gesehen (1)“ eingeklappt",/Gesehen \(1\)/.test(await p.textContent("#plsh"))&&!(await p.$(".plseen .plti")));
 await p.click("#plsh");await p.waitForTimeout(200);const st=await p.textContent(".plseen .plti");ok("aufgeklappt mit Datum",/Gesehen \d+\.\d+\./.test(st),st);
 await p.screenshot({path:S+"pl_seen.png",fullPage:true});
 await p.click("[data-plun]");await p.waitForTimeout(400);ok("Wieder anzeigen: zurück in Zu erledigen",(await p.$$(".pltodo .plti")).length===n0&&!(await p.$(".plseen")));
 ok("plseen-Eintrag gelöscht",await p.evaluate(()=>!__T.docs.some(d=>d.col==="plseen")));
 ok("keine JS-Fehler",!errs.length);console.log(errs.join("|"));await b.close();console.log(fail?"FEHLER: "+fail:"ALLES OK")})();
