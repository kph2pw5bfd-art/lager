/* Test 1.178: Retourschein zählen – kein Neuaufbau bei Herzschlägen/fremden Änderungen, Scroll bleibt stehen (SP = Ordner mit fakesb.js) */
const {chromium}=require("playwright");const fs=require("fs");const S=(process.env.SP||"/tmp")+"/";const J=o=>JSON.stringify(o);
const t0=new Date();t0.setHours(0,0,0,0);const D=n=>t0.getTime()+n*864e5+8*36e5;
const kat=JSON.parse(fs.readFileSync(__dirname+"/rkat.json","utf8")).map((x,i)=>({col:"rkat",id:"k"+i,data:x}));
(async()=>{const b=await chromium.launch();let fail=0;const ok=(t,c,x)=>{if(!c)fail++;console.log((c?"OK   ":"FEHLT")+" "+t+(x!==undefined?" → "+x:""))};const errs=[];
 const K=kat.map(k=>k.data).filter(k=>k.nr);const pos=K.slice(0,30).map((a,i)=>({p:String(i+1),n:2,u:"Stk",t:a.name,a:a.nr,f:0}));
 const seed=kat.concat([{col:"pack",id:"A",data:{ord:"2601300-01",ps:"14700",ev:"Gala Wien",pl:"Max Muster",db:D(-3),de:D(-1),pos,by:"u1",t:D(-4)}},
  {col:"retour",id:"rA",data:{ev:"Gala Wien",ord:"2601300-01",itemsJson:J({[K[0].nr]:{nr:K[0].nr,name:K[0].name,q:1}}),by:"u1",t:D(-1)}}]);
 const fk=fs.readFileSync(S+"fakesb.js","utf8").replace("const T={docs:[]","const T={docs:"+J(seed));
 const ctx=await b.newContext({viewport:{width:390,height:700}});const p=await ctx.newPage();p.on("pageerror",e=>errs.push(e.message));
 await ctx.route("**/*",r=>{const u=r.request().url();if(u.startsWith("https://app.test/"))return r.fulfill({body:fs.readFileSync("/home/claude/gh/index.html"),contentType:"text/html"});if(u.includes("supabase-js"))return r.fulfill({body:fk,contentType:"text/javascript"});return r.fulfill({status:404,body:""})});
 await p.goto("https://app.test/");await p.waitForTimeout(900);await p.mouse.click(200,400);await p.waitForTimeout(400);
 await p.evaluate(()=>{const r=rets.find(x=>x.id==="rA");rs={...rEd(r),lvl:"groups",g:null,u:null};view="retedit";draw()});await p.waitForTimeout(500);
 const H=await p.evaluate(()=>document.documentElement.scrollHeight);ok("Seite lang genug",H>1400,H);
 await p.waitForTimeout(800);await p.evaluate(()=>draw());await p.waitForTimeout(300);
 await p.evaluate(()=>{window.scrollTo(0,900);window.__el=document.getElementById("rbody");window.__n=0;const f=retEdit;window.__cnt=()=>window.__n});
 await p.evaluate(()=>{const o=retEdit;retEdit=function(){window.__n++;return o.apply(this,arguments)}});
 const y=()=>p.evaluate(()=>Math.round(window.scrollY));const y0=await y();
 /* eigener Herzschlag + fremde Änderungen, die man hier nicht sieht */
 await p.evaluate(()=>{const r=__T.docs.find(d=>d.id==="rA");const d={...r.data,ed_u1:Date.now()};DBX.local("retour","rA",d);DBX.local("pked","X",{u:"u2",t:Date.now()});DBX.local("druckst","main",{t:Date.now()});DBX.local("plaw","q",{t:Date.now()});draw();draw()});await p.waitForTimeout(300);
 ok("Herzschlag/fremde Änderungen: kein Neuaufbau",await p.evaluate(()=>window.__n===0&&document.getElementById("rbody")===window.__el),await p.evaluate(()=>window.__n));
 ok("Scroll bleibt",Math.abs((await y())-y0)<3,(await y())+" / "+y0);
 /* 5-Min-Nachladen */
 await p.evaluate(()=>DBX.reloadAll());await p.waitForTimeout(400);ok("Nachladen: kein Neuaufbau, Scroll bleibt",await p.evaluate(()=>window.__n===0)&&Math.abs((await y())-y0)<3,await y());
 /* Kollege zählt mit → muss neu zeichnen, Scroll bleibt */
 await p.evaluate(nr=>{const r=__T.docs.find(d=>d.id==="rA");DBX.local("retour","rA",{...r.data,pa_u2:JSON.stringify({[nr]:{nr,name:"x",q:3}})});draw()},K[1].nr);await p.waitForTimeout(400);
 ok("Kollege zählt: neu gezeichnet",await p.evaluate(()=>window.__n>=1));ok("… und Scroll bleibt",Math.abs((await y())-y0)<3,(await y())+" / "+y0);
 /* Herrichten an der Packliste desselben Auftrags → „Aus der Packliste“ aktualisiert */
 const n1=await p.evaluate(()=>window.__n);await p.evaluate(()=>{DBX.local("packh","A",{h_1:{ok:true,by:"u2",t:Date.now()}});draw()});await p.waitForTimeout(300);
 ok("Herricht-Stand desselben Auftrags: neu gezeichnet",await p.evaluate(n=>window.__n>n,n1));
 /* Navigation im Schein funktioniert weiter */
 await p.evaluate(()=>window.scrollTo(0,0));const g=await p.$("[data-rg],.rtile");if(g){await g.click();await p.waitForTimeout(300)}ok("Gruppe öffnen geht",await p.evaluate(()=>rs.lvl!=="groups"||!document.querySelector(".rtile")));
 /* andere Ansicht und zurück → wird gezeichnet */
 await p.evaluate(()=>{view="start";draw();view="retedit";draw()});await p.waitForTimeout(200);ok("Zurück in den Schein: angezeigt",!!(await p.$("#rbody")));
 ok("keine JS-Fehler",!errs.length,errs.join("|"));await b.close();console.log(fail?"FEHLER: "+fail:"ALLES OK")})();
