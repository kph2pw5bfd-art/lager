/* Test 1.181: manuell mitgegebene Artikel im Retourschein – „Aus der Packliste“, Vorschläge beim Manuell eintragen, ähnliche Namen (SP = Ordner mit fakesb.js) */
const {chromium}=require("playwright");const fs=require("fs");const S=(process.env.SP||"/tmp")+"/";const J=o=>JSON.stringify(o);
const t0=new Date();t0.setHours(0,0,0,0);const D=n=>t0.getTime()+n*864e5+8*36e5;
const kat=JSON.parse(fs.readFileSync(__dirname+"/rkat.json","utf8")).map((x,i)=>({col:"rkat",id:"k"+i,data:x}));
(async()=>{const b=await chromium.launch();let fail=0;const ok=(t,c,x)=>{if(!c)fail++;console.log((c?"OK   ":"FEHLT")+" "+t+(x!==undefined?" → "+x:""))};const errs=[];
 const K=kat.map(k=>k.data).filter(k=>k.nr);const pos=[{p:"1",n:2,u:"Stk",t:K[0].name,a:K[0].nr,f:0}];
 const seed=kat.concat([{col:"pack",id:"A",data:{ord:"2601400-01",ps:"14800",ev:"Gala Wien",pl:"Max Muster",db:D(-3),de:D(-1),pos,by:"u1",t:D(-4)}},
  {col:"packh",id:"A",data:{h_1:{ok:true,by:"u1",t:D(-3)},x_1:{nm:"Kette mit Zahlenschloss 2m",n:4,u:"Stk",by:"u1",ts:D(-3)},fin:{by:"u1",t:D(-3)}}},
  {col:"retour",id:"rA",data:{ev:"Gala Wien",ord:"2601400-01",itemsJson:"{}",by:"u1",t:D(-1)}}]);
 const fk=fs.readFileSync(S+"fakesb.js","utf8").replace("const T={docs:[]","const T={docs:"+J(seed));
 const ctx=await b.newContext({viewport:{width:390,height:900}});const p=await ctx.newPage();p.on("pageerror",e=>errs.push(e.message));
 await ctx.route("**/*",r=>{const u=r.request().url();if(u.startsWith("https://app.test/"))return r.fulfill({body:fs.readFileSync("/home/claude/gh/index.html"),contentType:"text/html"});if(u.includes("supabase-js"))return r.fulfill({body:fk,contentType:"text/javascript"});return r.fulfill({status:404,body:""})});
 await p.goto("https://app.test/");await p.waitForTimeout(900);await p.mouse.click(200,400);await p.waitForTimeout(400);
 ok("ähnlich: Tippfehler/Leerzeichen",await p.evaluate(()=>abgSimilar("Kette mit Zahlenschloss 2m","Kette mit Zahlenschlos 2 m")&&abgSimilar("Kette mit Zahlenschloss 2m","kette zahlenschloss 2m")&&!abgSimilar("Kette mit Zahlenschloss 2m","Kette mit Zahlenschloss 5m")&&!abgSimilar("Kette 2m","Kabel 32A 25m")));
 const open=async()=>{await p.evaluate(()=>{const r=rets.find(x=>x.id==="rA");rs={...rEd(r),lvl:"groups",g:null,u:null};view="retedit";draw()});await p.waitForTimeout(500)};
 await open();
 const tiles=await p.$$eval("#rpksec .rtile",l=>l.map(x=>x.innerText.replace(/\s+/g," ")));ok("Aus der Packliste: auch der manuelle Artikel",tiles.some(t=>/Kette mit Zahlenschloss 2m.*0 von 4 zurück · manuell/.test(t)),J(tiles));
 /* zählen über die Kachel */
 await p.click("#rpksec [data-rmp]");await p.waitForTimeout(200);await p.evaluate(()=>{const o=[...document.querySelectorAll(".ov")].pop();[...o.querySelectorAll("button")].find(x=>x.textContent.trim()==="3").click()});
 await p.evaluate(()=>{const o=[...document.querySelectorAll(".ov")].pop();const b=o.querySelector("#pok")||[...o.querySelectorAll("button")].find(x=>/✓|OK|Fertig/.test(x.textContent));b.click()});await p.waitForTimeout(400);
 const it=await p.evaluate(()=>Object.values(rs.items).filter(x=>x.manual).map(x=>x.name+"="+x.q).join(","));ok("gezählt mit genau dem Packlisten-Namen",it==="Kette mit Zahlenschloss 2m=3",it);
 const t2=await p.$$eval("#rpksec [data-rmp]",l=>l.map(x=>x.innerText.replace(/\s+/g," ")).join());ok("Kachel: 3 von 4 zurück",/3 von 4 zurück/.test(t2),t2);
 await p.screenshot({path:S+"rman181.png"});
 /* Manuell eintragen: Vorschläge */
 await p.evaluate(()=>{rs.items={};retEdit()});await p.waitForTimeout(300);await p.click("#rman");await p.waitForTimeout(200);
 const ch=await p.$$eval("[data-mpk]",l=>l.map(x=>x.innerText.replace(/\s+/g," ")));ok("Vorschläge aus der Packliste",ch.length===1&&/Kette mit Zahlenschloss 2m/.test(ch[0]),J(ch));
 await p.click("[data-mpk]");ok("Antippen füllt den Namen",(await p.inputValue("#mnm"))==="Kette mit Zahlenschloss 2m");await p.fill("#mq","2");await p.click("#mok");await p.waitForTimeout(300);
 ok("über Vorschlag eingetragen",await p.evaluate(()=>Object.values(rs.items).some(x=>x.manual&&x.name==="Kette mit Zahlenschloss 2m"&&x.q===2)));
 /* ähnlicher Name → Nachfrage */
 await p.evaluate(()=>{rs.items={};retEdit()});await p.waitForTimeout(300);await p.click("#rman");await p.waitForTimeout(200);await p.fill("#mnm","Kette mit Zahlenschlos 2 m");await p.click("#mok");await p.waitForTimeout(200);
 const qt=await p.evaluate(()=>{const o=[...document.querySelectorAll(".ov")].pop();return o?o.innerText.replace(/\s+/g," "):""});ok("Nachfrage bei ähnlichem Namen",/derselbe Artikel wie „Kette mit Zahlenschloss 2m“/.test(qt),qt.slice(0,120));
 await p.evaluate(()=>{const o=[...document.querySelectorAll(".ov")].pop();[...o.querySelectorAll("button")].find(x=>/^Ja/.test(x.textContent)).click()});await p.waitForTimeout(300);
 ok("Ja → Name aus der Packliste",await p.evaluate(()=>Object.values(rs.items).some(x=>x.manual&&x.name==="Kette mit Zahlenschloss 2m")));
 await p.evaluate(()=>{rs.items={};retEdit()});await p.waitForTimeout(300);await p.click("#rman");await p.waitForTimeout(200);await p.fill("#mnm","Kette mit Zahlenschlos 2 m");await p.click("#mok");await p.waitForTimeout(200);
 await p.evaluate(()=>{const o=[...document.querySelectorAll(".ov")].pop();[...o.querySelectorAll("button")].find(x=>/^Nein/.test(x.textContent)).click()});await p.waitForTimeout(300);
 ok("Nein → eigener Name bleibt",await p.evaluate(()=>Object.values(rs.items).some(x=>x.manual&&x.name==="Kette mit Zahlenschlos 2 m")));
 ok("keine JS-Fehler",!errs.length,errs.join("|"));await b.close();console.log(fail?"FEHLER: "+fail:"ALLES OK")})();
