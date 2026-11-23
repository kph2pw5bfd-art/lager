/* Test 1.184: Kein Material – rausnehmen, Name merken, automatisch in anderen Packlisten, Doch Material, Abgleich/Fortschritt (SP = Ordner mit fakesb.js) */
const {chromium}=require("playwright");const fs=require("fs");const S=(process.env.SP||"/tmp")+"/";const J=o=>JSON.stringify(o);
const t0=new Date();t0.setHours(0,0,0,0);const D=n=>t0.getTime()+n*864e5+8*36e5;
const kat=JSON.parse(fs.readFileSync(__dirname+"/rkat.json","utf8")).map((x,i)=>({col:"rkat",id:"k"+i,data:x}));
(async()=>{const b=await chromium.launch();let fail=0;const ok=(t,c,x)=>{if(!c)fail++;console.log((c?"OK   ":"FEHLT")+" "+t+(x!==undefined?" → "+x:""))};const errs=[];
 const K=kat.map(k=>k.data).filter(k=>k.nr);
 const pos=[{p:"1",n:2,u:"Stk",t:K[0].name,a:K[0].nr,f:0},{p:"2",n:1,u:"Stk",t:"Übernachtungskosten",a:"",f:0}];
 const pos2=[{p:"1",n:3,u:"Stk",t:K[1].name,a:K[1].nr,f:0},{p:"2",n:2,u:"Pausch.",t:"übernachtungskosten",a:"",f:0}];
 const seed=kat.concat([{col:"pack",id:"A",data:{ord:"2601500-01",ps:"15000",ev:"Gala Wien",pl:"Max Muster",db:D(0),de:D(3),pos,by:"u1",t:D(-2)}},
  {col:"pack",id:"B",data:{ord:"2601501-01",ps:"15001",ev:"Ball Graz",pl:"Max Muster",db:D(-6),de:D(-1),pos:pos2,by:"u1",t:D(-8)}},
  {col:"packh",id:"B",data:{h_1:{ok:true,by:"u1",t:D(-6)},fin:{by:"u1",t:D(-6)}}},
  {col:"retour",id:"rB",data:{ev:"Ball Graz",ord:"2601501-01",itemsJson:J({[K[1].nr]:{nr:K[1].nr,name:K[1].name,q:3}}),by:"u1",t:D(0),closed:true,closedT:D(0),art:"end"}}]);
 const fk=fs.readFileSync(S+"fakesb.js","utf8").replace("const T={docs:[]","const T={docs:"+J(seed));
 const ctx=await b.newContext({viewport:{width:390,height:900}});const p=await ctx.newPage();p.on("pageerror",e=>errs.push(e.message));
 await ctx.route("**/*",r=>{const u=r.request().url();if(u.startsWith("https://app.test/"))return r.fulfill({body:fs.readFileSync("/home/claude/gh/index.html"),contentType:"text/html"});if(u.includes("supabase-js"))return r.fulfill({body:fk,contentType:"text/javascript"});return r.fulfill({status:404,body:""})});
 await p.goto("https://app.test/");await p.evaluate(()=>{window.PK_FOPEN=true;window.MF_NOASK=true});await p.waitForTimeout(2200);await p.mouse.click(200,400);await p.waitForTimeout(300);
 const prog=id=>p.evaluate(id=>{const g=pkProg(packs.find(x=>x.id===id));return g.d+"/"+g.n},id);
 const fehlt=()=>p.evaluate(()=>abgBal(packs.find(x=>x.id==="B")).miss.map(e=>e.name).join(","));
 ok("vorher: Fortschritt zählt die Kosten mit",(await prog("A"))==="0/2",await prog("A"));ok("vorher: Fehlmaterial Übernachtungskosten",/bernachtungskosten/.test(await fehlt()),await fehlt());
 await p.evaluate(()=>{curPack="A";view="packopen";draw()});await p.waitForTimeout(300);
 const i=await p.evaluate(()=>pkPosAll(packs.find(x=>x.id==="A")).findIndex(x=>x.t==="Übernachtungskosten"));
 await p.click('[data-pe="'+i+'"]');await p.waitForTimeout(200);ok("Knopf „Kein Material“",!!(await p.$("#pekm")));
 await p.click("#pekm");await p.waitForTimeout(400);
 ok("Fortschritt ohne Kosten",(await prog("A"))==="0/1",await prog("A"));
 ok("eigene graue Gruppe",/Kein Material – nicht herrichten/.test(await p.textContent("#app"))&&/rausgenommen von/.test(await p.textContent(".pk-km")));
 ok("Name gemerkt",await p.evaluate(()=>__T.docs.some(d=>d.col==="kmat"&&d.id==="uebernachtungskosten")));
 await p.screenshot({path:S+"kmat.png",fullPage:true});
 ok("andere Packliste automatisch (andere Schreibweise klein)",await p.evaluate(()=>{const P=packs.find(x=>x.id==="B");return pkKM(pkPosAll(P)[1],pkH(P)[pkKeys(P)[1]])}));
 ok("dort kein Fehlmaterial mehr",(await fehlt())==="",await fehlt());
 const j=await p.evaluate(()=>pkPosAll(packs.find(x=>x.id==="A")).findIndex(x=>x.a));await p.click('[data-pe="'+j+'"]');await p.waitForTimeout(200);
 ok("Artikel aus der Artikelliste: kein Knopf",!(await p.$("#pekm")));await p.click("#pex");await p.waitForTimeout(100);
 /* Doch Material in B */
 await p.evaluate(()=>{curPack="B";view="packopen";draw()});await p.waitForTimeout(300);await p.evaluate(()=>{packh.B.fin=null;draw()});await p.waitForTimeout(200);
 await p.evaluate(()=>{kmDlg(packs.find(x=>x.id==="B"),1)});await p.waitForTimeout(200);ok("Fenster „automatisch rausgenommen“",/automatisch/.test(await p.textContent(".ov .card")));
 await p.click("#kmno");await p.waitForTimeout(400);
 ok("Doch Material: B zählt wieder",await p.evaluate(()=>{const P=packs.find(x=>x.id==="B");return !pkKM(pkPosAll(P)[1],pkH(P)[pkKeys(P)[1]])}));
 ok("Name vergessen",await p.evaluate(()=>!__T.docs.some(d=>d.col==="kmat")));
 ok("A bleibt rausgenommen (selbst entschieden)",(await prog("A"))==="0/1");
 ok("keine JS-Fehler",!errs.length,errs.join("|"));await b.close();console.log(fail?"FEHLER: "+fail:"ALLES OK")})();
