/* Test 1.149: Suche in „Alle Packlisten“ (SP = Ordner mit fakesb.js) */
const {chromium}=require("playwright");const fs=require("fs");const S=(process.env.SP||"/tmp")+"/";const J=o=>JSON.stringify(o);
const t0=new Date();t0.setHours(0,0,0,0);const D=n=>t0.getTime()+n*864e5+8*36e5;
(async()=>{const b=await chromium.launch();let fail=0;const ok=(t,c)=>{if(!c)fail++;console.log((c?"OK   ":"FEHLT")+" "+t)};const errs=[];
 const pos=[{p:"1",n:2,u:"Stk",t:"A",a:"1098",f:0}];
 const seed=[{col:"pack",id:"A",data:{ord:"2601300-01",ps:"14700",ev:"Gala Wien",pl:"Max Muster",db:D(2),de:D(9),pos,zus:[{ps:"14701",v:2,t:D(0),by:"u1",pos}],by:"u1",t:D(-1)}},
 {col:"pack",id:"B",data:{ord:"2601600",ps:"14600",ev:"Stadtfest Graz",pl:"Anna Klein",db:D(3),de:D(8),pos,zus:[],by:"u1",t:D(-1)}},
 {col:"pack",id:"C",data:{ord:"2500100",ps:"14000",ev:"Burg Clam",pl:"Max Muster",db:D(-30),de:D(-20),pos,zus:[],by:"u1",t:D(-40)}},
 {col:"retour",id:"rC",data:{ord:"2500100",ev:"Burg Clam",closed:true,art:"end",by:"u1",t:D(-20)}}];
 const fk=fs.readFileSync(S+"fakesb.js","utf8").replace("const T={docs:[]","const T={docs:"+J(seed));
 const ctx=await b.newContext({viewport:{width:390,height:844}});const p=await ctx.newPage();p.on("pageerror",e=>errs.push(e.message));
 await ctx.route("**/*",r=>{const u=r.request().url();if(u.startsWith("https://app.test/"))return r.fulfill({body:fs.readFileSync("/home/claude/gh/index.html"),contentType:"text/html"});if(u.includes("supabase-js"))return r.fulfill({body:fk,contentType:"text/javascript"});return r.fulfill({status:404,body:""})});
 await p.goto("https://app.test/");await p.evaluate(()=>window.PK_FOPEN=true);await p.waitForTimeout(800);await p.mouse.click(200,400);await p.waitForTimeout(400);await p.evaluate(()=>{view="packall";draw()});await p.waitForTimeout(300);
 const ids=()=>p.$$eval("#pklist [data-pk]",l=>l.map(x=>x.dataset.pk).sort().join(","));const q=async v=>{await p.fill("#pkq",v);await p.waitForTimeout(120);return ids()};
 console.log("   Start",await ids());
 ok("Veranstaltung",await q("graz")==="B");ok("Auftrag",await q("2601300")==="A");ok("Zusatz-Nummer",await q("14701")==="A");ok("Projektleiter + Wort, auch Erledigte",await q("max clam")==="C");ok("Projektleiter alle",await q("muster")==="A,C");ok("Nichts",await q("xyz")===""&&/Keine Packliste gefunden/.test(await p.textContent("#pklist")));
 await p.fill("#pkq","gala");await p.waitForTimeout(100);await p.evaluate(()=>draw());await p.waitForTimeout(150);ok("Bei Live-Update bleibt Cursor + Text",await p.evaluate(()=>document.activeElement.id==="pkq"&&document.activeElement.value==="gala"));
 await p.click("#pklist [data-pk]");await p.waitForTimeout(300);ok("Treffer öffnet Packliste",await p.evaluate(()=>view==="packopen"&&curPack==="A"));
 await p.evaluate(()=>{view="packall";draw()});await p.waitForTimeout(200);ok("Suche bleibt beim Zurückkommen",await p.inputValue("#pkq")==="gala"&&await ids()==="A");
 await p.fill("#pkq","");await p.waitForTimeout(100);ok("Leer: normaler Filter",!(await ids()).includes("C")&&(await ids()).includes("A"));
 await p.screenshot({path:S+"pkq.png"});ok("Keine JS-Fehler "+errs.join("|"),!errs.length);await b.close();console.log(fail?"FEHLER: "+fail:"ALLES OK")})();
