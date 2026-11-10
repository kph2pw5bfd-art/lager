/* Prüfung 1.112: Welche Bildschirme schreiben beim bloßen Ansehen in die Datenbank? (SP = Ordner mit fakesb.js) */
const {chromium}=require("playwright");const fs=require("fs");const S=(process.env.SP||"/tmp")+"/";
const t0=new Date();t0.setHours(0,0,0,0);const T0=t0.getTime(),day=864e5,D=n=>T0+n*day,H=36e5,J=o=>JSON.stringify(o);
const kat=JSON.parse(fs.readFileSync(__dirname+"/rkat.json","utf8")).map((x,i)=>({col:"rkat",id:"k"+i,data:x}));
const it=(nr,name,q)=>({nr,name,q,g:"Kabel",u:"32A"});
const old=Date.now()-5*H;
const seed=kat.concat([
 {col:"pack",id:"A",data:{ord:"260130001",ps:"14402",ev:"Gala Wien",pl:"Jürgen Hartmann",db:D(-9),de:D(-3),pos:[{p:"1",n:16,u:"Stk",t:"Kabel CEE 32A 50m",a:"1098",f:0},{p:"2",n:4,u:"Stk",t:"Schuko 20m",a:"1081",f:2}],by:"u1",t:D(-10)}},
 {col:"packh",id:"A",data:{c:1,h_1:{ok:true,by:"u1",t:1},h_2:{q:2,by:"u1",t:1},fin:{by:"u1",t:D(-9)}}},
 {col:"pack",id:"C",data:{ord:"260160001",ps:"14600",ev:"Stadtfest Graz",pl:"Max Muster",db:D(0),de:D(3),pos:[{p:"1",n:5,u:"Stk",t:"Schuko 20m",a:"1081",f:0}],by:"u1",t:D(-3)}},
 {col:"pack",id:"E",data:{ord:"260170001",ps:"14700",ev:"Ball Linz",pl:"Max Muster",db:D(-2),de:D(5),pos:[{p:"1",n:3,u:"Stk",t:"Schuko 20m",a:"1081",f:0}],by:"u1",t:D(-3)}},
 {col:"retour",id:"rA",data:{ev:"Gala Wien",ord:"2601300-01",itemsJson:J({"1098":it("1098","32A Kabel 50m",10)}),pa_u1:J({"M:X1":{nr:"",name:"Plane",g:"Manuell",u:"",manual:true,q:1}}),by:"u1",t:old,mod:"u1",modT:old,closed:true,art:"end",closedBy:"u1",closedT:old}},
 {col:"retour",id:"rC",data:{ev:"Stadtfest Graz",ord:"260160001",itemsJson:"{}",pa_u1:J({"1081":it("1081","Schuko 20m",2)}),by:"u1",t:old,mod:"u1",modT:old}},
 {col:"lists",id:"L1",data:{mode:"stay",ev1:"Gala Wien",ev2:"",ord1:"2601300-01",ord2:"",by:"u1",t:old,itemsJson:J({"1098":{name:"32A Kabel 50m",ids:["1098-01"],q:1}})}},
 {col:"defekte",id:"d1",data:{art:"32A Kabel 50m",anr:"1098",ev:"Gala Wien",desc:"Stecker kaputt",by:"u1",t:old,done:false,urg:true,fn:0,foto:false}},
 {col:"infos",id:"i1",data:{by:"u1",t:old,text:"Bitte 2 Kabel nachliefern",fn:0,foto:false,read:false,readBy:"",readT:0,reply:"",replyT:0}},
 {col:"wbnote",id:"w1",data:{txt:"Gitterboxen zählen",by:"u1",t:old}},
 {col:"jverin",id:"e1",data:{by:"u1",due:Date.now()+H,txt:"Anrufen",done:false}}]);
(async()=>{const b=await chromium.launch();const ctx=await b.newContext({viewport:{width:390,height:844}});let p=await ctx.newPage();const errs=[];p.on("pageerror",e=>errs.push(e.message));
 /* „App schließen und wieder öffnen“ mit denselben Daten (die Test-Datenbank lebt sonst nur in der Seite) */
 const reopen=async()=>{const d=await p.evaluate(()=>JSON.stringify(window.__T.docs));await p.close();p=await ctx.newPage();p.on("pageerror",e=>errs.push(e.message));
  await p.addInitScript(d=>{const t=setInterval(()=>{if(window.__T){window.__T.docs.length=0;JSON.parse(d).forEach(x=>window.__T.docs.push(x));clearInterval(t)}},1)},d);
  await p.goto("https://app.test/");await p.evaluate(()=>window.PK_FOPEN=true);await p.waitForTimeout(1500);await p.mouse.click(200,400);await p.waitForTimeout(500)};
 const fk=fs.readFileSync(S+"fakesb.js","utf8").replace("const T={docs:[]","const T={docs:"+JSON.stringify(seed));
 await ctx.route("**/*",r=>{const u=r.request().url();
  if(u.startsWith("https://app.test/"))return r.fulfill({body:fs.readFileSync("/home/claude/gh/index.html"),contentType:"text/html"});
  if(u.includes("supabase-js"))return r.fulfill({body:fk,contentType:"text/javascript"});
  return r.fulfill({status:404,body:""})});
 await p.goto("https://app.test/");await p.evaluate(()=>window.PK_FOPEN=true);await p.waitForTimeout(800);await p.mouse.click(200,400);await p.waitForTimeout(800);
 const snap=()=>p.evaluate(()=>JSON.stringify(window.__T.docs.map(r=>[r.col,r.id,r.data])));
 const IGN=/^(ed_|edn_)/;/* users/<id>.t = „zuletzt angemeldet“, gewollt */
 const diff=(a,b)=>{const A=new Map(JSON.parse(a).map(x=>[x[0]+"/"+x[1],x[2]])),B=new Map(JSON.parse(b).map(x=>[x[0]+"/"+x[1],x[2]]));const out=[];
  for(const [k,v] of B){const o=A.get(k);if(!o){if(Object.keys(v).every(f=>IGN.test(f)))continue;out.push("NEU "+k+" "+JSON.stringify(v).slice(0,160));continue}for(const f of new Set([...Object.keys(o),...Object.keys(v)])){if(IGN.test(f))continue;if(JSON.stringify(o[f])!==JSON.stringify(v[f]))out.push("GEÄNDERT "+k+" ."+f+": "+JSON.stringify(o[f]).slice(0,60)+" → "+JSON.stringify(v[f]).slice(0,60))}}
  for(const k of A.keys())if(!B.has(k))out.push("GELÖSCHT "+k);return out};
 let base=await snap();console.log("Start:",diff(JSON.stringify(seed.map(x=>[x.col,x.id,x.data])),base));
 const step=async(name,fn)=>{try{await fn()}catch(e){console.log("   ("+name+": "+e.message.split("\n")[0]+")")}await p.waitForTimeout(900);const s=await snap();const d=diff(base,s);console.log((d.length?"SCHREIBT ":"ok       ")+name+(d.length?"\n   "+d.join("\n   "):""));base=s};
 const go=v=>p.evaluate(v=>{view=v;draw()},v);
 const clickFirst=async sel=>{const e=await p.$(sel);if(!e)throw new Error("kein "+sel);await e.click()};
 await step("Hauptseite",()=>go("start"));
 await step("Lager Übersicht",()=>go("jarvis"));
 await step("Wochenbericht",()=>go("wb"));
 await step("Zu prüfen",()=>go("abgpr"));
 await step("Zu viel zurück",()=>go("abgzv"));
 await step("Packlisten Übersicht",()=>go("pack"));
 await step("Alle Packlisten",()=>go("packall"));
 for(const id of ["A","C","E"]){await step("Packliste "+id+" öffnen",()=>p.evaluate(id=>{curPack=id;go("packopen")},id));await step("Packliste "+id+" Abgleich",()=>p.evaluate(id=>{curPack=id;go("pkabg")},id))}
 await step("Meine Aufträge",()=>go("au"));
 await step("Auftrag öffnen",()=>clickFirst("[data-au],[data-auo],.aucard"));
 await step("Retourscheine",()=>go("ret"));
 for(const id of ["rA","rC"]){await step("Retourschein "+id+" ansehen",async()=>{await go("ret");await clickFirst('[data-ro="'+id+'"]')});
  await step("Retourschein "+id+" bearbeiten (ohne Änderung)",()=>clickFirst("#red"));
  await step("Retourschein "+id+" zurück",()=>clickFirst("#bk"))}
 await step("Defekte",()=>go("def"));await step("Defekt öffnen",()=>clickFirst("[data-df]"));
 await step("Infos",()=>go("info"));await step("Info öffnen",()=>clickFirst("[data-io]"));
 await step("Material vor Ort (Packliste)",()=>go("plin"));await step("Materiallisten",()=>go("home"));await step("Materialliste öffnen",()=>clickFirst("[data-o]"));await step("Materialliste zurück",()=>clickFirst("#bk"));
 await step("App-Verwaltung",()=>go("appv"));await step("Benutzer",()=>go("users"));await step("Artikelliste",()=>go("artlist"));
 await step("App neu öffnen",reopen);
 await step("Sichtbarkeit weg/zurück",()=>p.evaluate(()=>{document.dispatchEvent(new Event("visibilitychange"));window.dispatchEvent(new Event("pagehide"))}));
 /* Warteschlangen: nach echten Änderungen + Neu laden darf nichts doppelt/neu geschrieben werden */
 await step("ECHT: Retourschein rC +1 zählen",async()=>{await go("ret");await clickFirst('[data-ro="rC"]');await clickFirst("#red");await p.waitForTimeout(400);await p.evaluate(()=>{const a=rKat()[0];rAdd(a.nr,{nr:a.nr,name:a.name,g:a.g,u:a.u||""},1);retEdit()});await p.waitForTimeout(1200);await clickFirst("#bk")});
 await step("ECHT: Herrichten Packliste C abhaken",async()=>{await p.evaluate(()=>{curPack="C";go("packopen")});await p.waitForTimeout(400);await clickFirst("[data-pc]")});
 await step("App neu öffnen nach echten Änderungen",reopen);
 await step("App nochmal neu öffnen",reopen);
 await step("Retourschein rC wieder öffnen",async()=>{await go("ret");await clickFirst('[data-ro="rC"]');await clickFirst("#red");await p.waitForTimeout(1500);await clickFirst("#bk")});
 await step("Packliste C wieder öffnen",()=>p.evaluate(()=>{curPack="C";go("packopen")}));
 console.log("Seitenfehler:",errs);await b.close()})();
