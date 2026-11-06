/* Test 1.135: Zusatz am selben Herricht-Tag → eine Karte auf der Wand (SP = Ordner mit fakesb.js) */
const {chromium}=require("playwright");const fs=require("fs");const S=(process.env.SP||"/tmp")+"/";const J=o=>JSON.stringify(o);
const t0=new Date();t0.setHours(0,0,0,0);const T0=t0.getTime(),D=n=>T0+n*864e5+8*36e5;const YMD=n=>{const d=new Date(T0+n*864e5+36e5*12);return d.getFullYear()+"-"+String(d.getMonth()+1).padStart(2,"0")+"-"+String(d.getDate()).padStart(2,"0")};
(async()=>{const b=await chromium.launch();let fail=0;const ok=(t,c)=>{if(!c)fail++;console.log((c?"OK   ":"FEHLT")+" "+t)};const errs=[];
 const pos=[{p:"1",n:2,u:"Stk",t:"A",a:"1098",f:0},{p:"2",n:1,u:"Stk",t:"B",a:"1081",f:1},{p:"3",n:1,u:"Stk",t:"C",a:"1109",f:0}];
 const zp=[{p:"1",n:1,u:"Stk",t:"D",a:"1097",f:0},{p:"2",n:1,u:"Stk",t:"E",a:"1048",f:0},{p:"3",n:1,u:"Stk",t:"F",a:"1060",f:0}];
 const seed=[{col:"pack",id:"A",data:{ord:"260105801",ps:"1",ev:"Miete Generator Feldbauernhof Variante 2",pl:"Stefan Huber",db:D(3),de:D(9),pos,zus:[{ps:"20260743",pos:zp,t:D(0),hd:D(0)}],by:"u1",t:D(-1)}},
  {col:"packh",id:"A",data:{hd:{d:YMD(0),why:"vorgezogen",by:"u1",t:D(-1)}}},{col:"packh",id:"B",data:{zd_20269999:{d:YMD(1),by:"u1",t:D(-1)}}},
  {col:"pack",id:"B",data:{ord:"260200001",ps:"5",ev:"Andere Veranstaltung",pl:"Max Muster",db:D(0),de:D(5),pos,zus:[{ps:"20269999",pos:zp,t:D(0),hd:D(1)}],by:"u1",t:D(-1)}}];
 const fk=fs.readFileSync(S+"fakesb.js","utf8").replace("const T={docs:[]","const T={docs:"+J(seed));
 const ctx=await b.newContext({viewport:{width:390,height:844}});const p=await ctx.newPage();p.on("pageerror",e=>errs.push(e.message));
 await ctx.route("**/*",r=>{const u=r.request().url();
  if(u.startsWith("https://app.test/"))return r.fulfill({body:fs.readFileSync("/home/claude/gh/index.html"),contentType:"text/html"});
  if(u.includes("supabase-js"))return r.fulfill({body:fk,contentType:"text/javascript"});
  return r.fulfill({status:404,body:""})});
 await p.goto("https://app.test/");await p.waitForTimeout(800);await p.mouse.click(200,400);await p.waitForTimeout(400);
 const hd=await p.evaluate(()=>[pkHDay(packs.find(x=>x.id==="A")),pkHDay(pkZTasks().find(z=>z._z==="20260743"))]);console.log("     Herricht-Tage:",J(hd.map(t=>new Date(t).toDateString())));
 const D0=await p.evaluate(()=>{const D=pkOvData(),all=[...D.w0,...D.w1].flatMap(d=>d.items).concat(D.kw.flatMap(k=>k.items));return all.map(o=>[o.p.ev,o.g.d+"/"+o.g.n,o.zm||null,new Date(o.s.t).toDateString()])});console.log(D0.map(x=>"     "+J(x)).join("\n"));
 const A=D0.filter(x=>/Feldbauernhof/.test(x[0]));ok("Feldbauernhof: eine Karte mit 0/6 und + Zusatz",A.length===1&&A[0][1]==="0/6"&&J(A[0][2])===J(["20260743"]));
 const B=D0.filter(x=>/Andere Veranstaltung/.test(x[0]));ok("Zusatz an anderem Tag bleibt eigene Karte",B.length===2);
 await p.evaluate(()=>{view="packov";draw()}).catch(()=>{});await p.evaluate(()=>{if(typeof packOverView==="function"){view="packov";packOverView()}});await p.waitForTimeout(300);
 ok("Schild „+ Zusatz 20260743“ auf der Karte",/\+ Zusatz 20260743/.test(await p.textContent("#app")));await p.screenshot({path:S+"zmerge.png",fullPage:true});
 console.log("Fehler:",errs);ok("keine Seitenfehler",!errs.length);console.log(fail?"FEHLGESCHLAGEN: "+fail:"ALLES OK");await b.close()})();
