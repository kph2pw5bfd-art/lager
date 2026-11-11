/* Test 1.168: Meine Aufträge → Material vor dem Herrichten: „Raus“ zeigt –, nicht die Soll-Menge (SP = Ordner mit fakesb.js) */
const {chromium}=require("playwright");const fs=require("fs");const S=(process.env.SP||"/tmp")+"/";const J=o=>JSON.stringify(o);
const t0=new Date();t0.setHours(0,0,0,0);const T0=t0.getTime(),D=n=>T0+n*864e5+8*36e5;
(async()=>{const b=await chromium.launch();let fail=0;const ok=(t,c)=>{if(!c)fail++;console.log((c?"OK   ":"FEHLT")+" "+t)};const errs=[];
 const pos=[{p:"1",n:48,u:"Stk",t:"Kabel Schuko 10m",a:"1080",f:0},{p:"2",n:20,u:"Stk",t:"3-fach Schuko PVC",a:"3197",f:0},{p:"3",n:10,u:"Stk",t:"VT Zugang CEE 16A",a:"4670",f:4}];
 const seed=[{col:"pack",id:"A",data:{ord:"260116601",ps:"20260756",ev:"Testmarkt",pl:"Jürgen Hartmann",db:D(2),de:D(50),pos,zus:[],by:"u1",t:D(-1)}},
  {col:"pack",id:"B",data:{ord:"260116602",ps:"20260757",ev:"Testmarkt 2",pl:"Jürgen Hartmann",db:D(0),de:D(50),pos,zus:[],by:"u1",t:D(-1)}},
  {col:"packh",id:"B",data:{h_1:{ok:true,by:"u1",t:D(0)},h_2:{ok:false,q:15,by:"u1",t:D(0)}}}];
 const fk=fs.readFileSync(S+"fakesb.js","utf8").replace("const T={docs:[]","const T={docs:"+J(seed));
 const ctx=await b.newContext({viewport:{width:390,height:844}});const p=await ctx.newPage();p.on("pageerror",e=>errs.push(e.message));
 await ctx.route("**/*",r=>{const u=r.request().url();if(u.startsWith("https://app.test/"))return r.fulfill({body:fs.readFileSync("/home/claude/gh/index.html"),contentType:"text/html"});if(u.includes("supabase-js"))return r.fulfill({body:fk,contentType:"text/javascript"});return r.fulfill({status:404,body:""})});
 await p.goto("https://app.test/");await p.waitForTimeout(800);await p.mouse.click(200,400);await p.waitForTimeout(400);
 const look=async id=>{await p.evaluate(id=>{curAu=id;go("auopen")},id);await p.waitForTimeout(400);return p.evaluate(()=>({rows:[...document.querySelectorAll(".amt:not(.amz) .amr")].map(r=>[...r.children].map(c=>c.textContent.trim().replace(/\s+/g," ")).join(" | ")),kpi:(document.querySelector(".amk")||{}).textContent||""}))};
 let A=await look("A");console.log(A.rows.map(r=>"     "+r).join("\n"),"\n     KPI",A.kpi);
 ok("nichts hergerichtet: Raus überall –",A.rows.length===3&&A.rows.every(r=>/\| – \|/.test(r)));ok("Kennzahl raus = 0",/0raus/.test(A.kpi.replace(/\s/g,"")));
 let B=await look("B");console.log(B.rows.map(r=>"     "+r).join("\n"),"\n     KPI",B.kpi);
 const r=nm=>B.rows.find(x=>x.includes(nm))||"";
 ok("hergerichtet: 48",/\| 48 \| 48 \|/.test(r("Kabel Schuko")));ok("teilweise: 15 von 20",/\| 20 \| 15 \|/.test(r("3-fach")));ok("offen: –",/\| 6 \| – \|/.test(r("CEE 16A")));ok("Kennzahl raus = 63",/63raus/.test(B.kpi.replace(/\s/g,"")));
 await p.screenshot({path:S+"amraus.png"});ok("Keine JS-Fehler "+errs.join("|"),!errs.length);await b.close();console.log(fail?"FEHLER: "+fail:"ALLES OK")})();
