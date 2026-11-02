/* Test 1.101: Herrichten ohne Netz – Änderungen bleiben im Gerät und werden nachgeladen */
const {chromium}=require("playwright");const fs=require("fs");const S=(process.env.SP||"/tmp")+"/";
const t0=new Date();t0.setHours(0,0,0,0);const T0=t0.getTime(),day=864e5;
const pos=[{p:"1.1",n:10,u:"Stk",t:"Kabel CEE 32A 50m",a:"1098",f:0},{p:"1.2",n:4,u:"Stk",t:"Kabel CEE 32A 25m",a:"1097",f:0},{p:"1.3",n:3,u:"Stk",t:"VT 32A Black",a:"1031",f:0}];
const seed=[{col:"pack",id:"P1",data:{ord:"260111401",ps:"P1",ev:"Winterwunder",pl:"Marvin Wellisch",db:T0+8*36e5,de:T0+60*day,pos,by:"u1",t:Date.now()}},
 {col:"rkat",id:"k1",data:{nr:"1097",g:"Kabel",u:"32A",name:"32A Kabel 25m",o:2}},{col:"rkat",id:"k2",data:{nr:"1098",g:"Kabel",u:"32A",name:"32A Kabel 50m",o:1}},{col:"rkat",id:"k3",data:{nr:"1031",g:"Verteiler",u:"32A",name:"Verteiler 32A Black",o:3}}];
let bad=0;const ok=(c,m,x)=>{console.log((c?"OK   ":"FEHLER")+" "+m+(x!==undefined?": "+x:""));if(!c)bad++};
(async()=>{const b=await chromium.launch();const ctx=await b.newContext({viewport:{width:390,height:844}});
 const p=await ctx.newPage();const errs=[];p.on("pageerror",e=>errs.push(e.message));
 const fk=fs.readFileSync(S+"fakesb.js","utf8").replace("const T={docs:[]","const T={docs:"+JSON.stringify(seed));
 await ctx.route("**/*",r=>{const u=r.request().url();if(u.startsWith("https://app.test/"))return r.fulfill({body:fs.readFileSync("/home/claude/gh/index.html"),contentType:"text/html"});if(u.includes("supabase-js"))return r.fulfill({body:fk,contentType:"text/javascript"});return r.fulfill({status:404,body:""})});
 await p.goto("https://app.test/");await p.waitForTimeout(800);await p.mouse.click(195,420);await p.waitForTimeout(400);
 ok(await p.evaluate(()=>APPV)==="1.105","Version 1.105");
 await p.click('[data-g="pack"]');await p.waitForTimeout(200);await p.evaluate(()=>go("packall"));await p.waitForTimeout(200);await p.click('[data-pk="P1"]');await p.waitForTimeout(300);
 const srv=()=>p.evaluate(()=>JSON.stringify((__T.docs.find(d=>d.col==="packh"&&d.id==="P1")||{}).data||null));
 const st=()=>p.evaluate(()=>[...document.querySelectorAll(".pkl .pkp .pkc")].map(c=>c.textContent||"o").join(""));
 /* Netz weg */
 await p.evaluate(()=>{window.__offline=true;Object.defineProperty(navigator,"onLine",{configurable:true,get:()=>false})});
 await p.click('[data-pc="0"]');await p.waitForTimeout(300);
 ok(!(await p.$(".eov")),"keine Fehlermeldung ohne Netz");
 ok((await st()).startsWith("✓"),"Haken sofort sichtbar",await st());
 ok(/Kein Netz/.test(await p.textContent("#app")),"Hinweis „Kein Netz“ in der Packliste");
 ok(await srv()==="null","noch nichts auf dem Server");
 ok(/"P1"/.test(await p.evaluate(()=>localStorage.getItem("tpc_packh_queue"))),"im Gerät gemerkt");
 await p.click('[data-pe="1"]');await p.waitForTimeout(200);await p.fill("#peq","3");await p.click("#pes");await p.waitForTimeout(300);
 ok(/!/.test(await st()),"Teilmenge offline gespeichert",await st());
 /* Daten neu laden (z. B. App kurz im Hintergrund) – lokale Änderungen bleiben */
 await p.evaluate(()=>db.reloadAll());await p.waitForTimeout(400);
 ok(/✓/.test(await st())&&/!/.test(await st()),"nach Neuladen weiter sichtbar",await st());
 /* Netz wieder da */
 await p.evaluate(()=>{window.__offline=false;Object.defineProperty(navigator,"onLine",{configurable:true,get:()=>true});window.dispatchEvent(new Event("online"))});
 await p.waitForTimeout(2500);
 const s=await srv();ok(/"h_1_1":\{"ok":true/.test(s)&&/"q":3/.test(s),"auf dem Server angekommen",s.slice(0,160));
 ok(await p.evaluate(()=>localStorage.getItem("tpc_packh_queue"))==="{}","Warteschlange leer");
 ok(!/Kein Netz/.test(await p.textContent("#app")),"Hinweis weg");
 /* online: normal weiter */
 await p.click('[data-pc="2"]');await p.waitForTimeout(400);ok(/"h_1_3":\{"ok":true/.test(await srv()),"online sofort gespeichert");
 ok(!errs.length,"keine JS-Fehler",errs.join(" | "));
 console.log("FEHLER GESAMT:",bad);await b.close()})();
