/* Test 1.99: Abweichungen oben (zu wenig / zu viel / Alternative) + Artikel scannen beim Herrichten */
const {chromium}=require("playwright");const fs=require("fs");const S=(process.env.SP||"/tmp")+"/";
const t0=new Date();t0.setHours(0,0,0,0);const T0=t0.getTime(),day=864e5;
const pos=[{p:"1.1",n:10,u:"Stk",t:"Kabel CEE 32A 50m",a:"1098",f:0},{p:"1.2",n:4,u:"Stk",t:"Kabel CEE 32A 25m",a:"1097",f:0},{p:"1.3",n:3,u:"Stk",t:"VT 32A Black",a:"1031",f:0},{p:"1.4",n:2,u:"Stk",t:"E-Heizer",a:"1182",f:0},{p:"1.5",n:1,u:"Stk",t:"VT 63A Indu",a:"1040",f:0}];
const seed=[{col:"pack",id:"P1",data:{ord:"260111401",ps:"P1",ev:"Winterwunder",pl:"Marvin Wellisch",db:T0+8*36e5,de:T0+60*day,pos,by:"u1",t:Date.now(),
   zus:[{ps:"Z9",t:Date.now(),by:"u1",v:1,pos:[{p:"1",n:2,u:"Stk",t:"VT 32A Black",a:"1031",f:0}]}]}},
 {col:"rkat",id:"k1",data:{nr:"1097",g:"Kabel",u:"32A",name:"32A Kabel 25m",o:2}},{col:"rkat",id:"k2",data:{nr:"1098",g:"Kabel",u:"32A",name:"32A Kabel 50m",o:1}},
 {col:"rkat",id:"k3",data:{nr:"1031",g:"Verteiler",u:"32A",name:"Verteiler 32A Black",o:3}},{col:"rkat",id:"k4",data:{nr:"1032",g:"Verteiler",u:"32A",name:"Verteiler 32A Indu",o:4}},
 {col:"rkat",id:"k5",data:{nr:"1182",g:"Heizung",u:"",name:"E-Heizer 15kW",o:6}},{col:"rkat",id:"k6",data:{nr:"1040",g:"Verteiler",u:"63A",name:"Verteiler 63A Indu",o:5}}];
let bad=0;const ok=(c,m,x)=>{console.log((c?"OK   ":"FEHLER")+" "+m+(x!==undefined?": "+x:""));if(!c)bad++};
(async()=>{const b=await chromium.launch();const ctx=await b.newContext({viewport:{width:390,height:844}});
 const p=await ctx.newPage();const errs=[];p.on("pageerror",e=>errs.push(e.message));
 const fk=fs.readFileSync(S+"fakesb.js","utf8").replace("const T={docs:[]","const T={docs:"+JSON.stringify(seed));
 await ctx.route("**/*",r=>{const u=r.request().url();if(u.startsWith("https://app.test/"))return r.fulfill({body:fs.readFileSync("/home/claude/gh/index.html"),contentType:"text/html"});if(u.includes("supabase-js"))return r.fulfill({body:fk,contentType:"text/javascript"});return r.fulfill({status:404,body:""})});
 await p.goto("https://app.test/");await p.waitForTimeout(800);await p.mouse.click(195,420);await p.waitForTimeout(400);
 ok(await p.evaluate(()=>APPV)==="1.105","Version 1.105");
 await p.click('[data-g="pack"]');await p.waitForTimeout(200);await p.evaluate(()=>go("packall"));await p.waitForTimeout(200);await p.click('[data-pk="P1"]');await p.waitForTimeout(300);
 const order=()=>p.evaluate(()=>[...document.querySelectorAll(".pkl .pkg, .pkl .pkzh, .pkl .pkp")].map(e=>e.classList.contains("pkp")?(e.querySelector(".pkc").textContent||"o")+e.querySelector(".pkt").childNodes[0].textContent.trim():"["+e.textContent.replace(/Entfernen|Verschieben/g,"").trim().slice(0,28)+"]").join(" → "));
 ok(await p.isVisible("#pkscan"),"Knopf „Artikel scannen“ da");
 ok(!(await p.$(".pkgdev")),"ohne Abweichung keine Gruppe oben");
 /* zu wenig, zu viel, Alternative setzen */
 await p.evaluate(async()=>{const P=packs.find(x=>x.id==="P1"),K=pkKeys(P);await pkHSet(P,{[K[0]]:{ok:true,q:12,alt:[],fm:"",by:me,t:Date.now()},[K[1]]:{ok:false,q:3,alt:[],fm:"",by:me,t:Date.now()},[K[3]]:{ok:false,q:2,alt:[{n:1,t:"Heizlüfter",a:""}],fm:"",by:me,t:Date.now()},[K[4]]:{ok:true,q:null,alt:[],fm:"",by:me,t:Date.now()}})});
 await p.waitForTimeout(300);const o1=await order();console.log("Reihenfolge:",o1);
 ok(/^\[Abweichungen \(3\)\] → !32A Kabel 50m → !32A Kabel 25m → !E-Heizer 15kW → \[Verteiler · 32A\]/.test(o1),"Abweichungen ganz oben in Artikelliste-Reihenfolge");
 ok(!/\[Kabel · 32A\]/.test(o1),"Gruppe ohne übrige Zeilen fällt weg");
 ok(/✓Verteiler 63A Indu/.test(o1),"komplett ohne Abweichung bleibt in seiner Gruppe");
 const em=await p.evaluate(()=>[...document.querySelectorAll(".pkp")][0].innerText.replace(/\s+/g," "));ok(/12 von 10 Stk – 2 Stk mehr als im Packschein/.test(em),"zu viel mit Text",em);
 ok(/Kabel · 32A/.test(await p.evaluate(()=>document.querySelector(".pksub").textContent)),"Gruppe als Unterzeile");
 ok(/3 mit Abweichung/.test(await p.textContent(".pkprog")),"Zähler zählt zu viel mit",await p.textContent(".pkprog .pkdev"));
 const ovx=await p.evaluate(()=>{const P=packs.find(x=>x.id==="P1"),m=pkMailText(P).body,D=pkDrDev(pkDrRows(P)).D.join(" | "),r=pkDrRows(P).find(r=>r.a==="1098"),B=abgBal(P),e=(B.L||[]).find(e=>e.code==="1098");return{m,D,mit:r&&r.mit,ck:r&&r.ck,raus:e&&e.raus}});
 ok(/32A Kabel 50m|Kabel CEE 32A 50m/.test(ovx.m)&&/12 von 10 Stk – 2 Stk mehr als im Packschein/.test(ovx.m),"Info-Mail nennt zu viel",ovx.m.split("\n").find(l=>/mehr als/.test(l)));
 ok(/2 Stk mehr als im Packschein \(12 Stk mitgegeben\)/.test(ovx.D),"PDF-Abweichungen nennen zu viel",ovx.D);
 ok(ovx.mit===12&&ovx.ck==="!","PDF: 12 mitgegeben mit !",ovx.mit+" "+ovx.ck);
 ok(ovx.raus===12,"Abgleich zählt 12 raus",ovx.raus);
 await p.click('[data-pc="0"]');await p.waitForTimeout(200);ok(await p.isVisible("#peq"),"Kreis bei zu viel öffnet Bearbeiten statt zurücksetzen");await p.click("#pex");await p.waitForTimeout(100);
 /* Filter Noch offen: nur zu wenig/Alternative-offen bleibt sichtbar */
 await p.click('[data-pkhf="offen"]');await p.waitForTimeout(150);console.log("Noch offen:",await order());await p.click('[data-pkhf="alle"]');await p.waitForTimeout(150);
 /* Scan: Treffer genau einmal */
 await p.evaluate(()=>pkScanHit(packs.find(x=>x.id==="P1"),"1040–07"));await p.waitForTimeout(400);
 ok(/Schon komplett hergerichtet/.test(await p.textContent(".ov .card")),"Scan auf komplette Position: Hinweis");
 ok(await p.evaluate(()=>!!document.querySelector('.pkp.pkhl [data-pe="4"]')),"Zeile blau markiert");await p.click("#pex");
 await p.evaluate(()=>pkScanHit(packs.find(x=>x.id==="P1"),"1097-12"));await p.waitForTimeout(300);
 ok(/✓ Gescannt: 1097 · 32A Kabel 25m/.test(await p.textContent(".ov .card")),"Scan mit ID findet Artikel",(await p.textContent(".pkscm")));
 await p.click("#pea");await p.click("#pes");await p.waitForTimeout(300);ok(!/!32A Kabel 25m/.test(await order()),"nach Alles da nicht mehr bei Abweichungen");
 /* Scan: Artikel zweimal (Packschein + Zusatz) */
 await p.evaluate(()=>pkScanHit(packs.find(x=>x.id==="P1"),"1031"));await p.waitForTimeout(300);
 const pick=await p.textContent(".ov .card");ok(/mehrmals/.test(pick)&&/Zusatz Z9/.test(pick)&&/Packschein P1/.test(pick),"Auswahl bei zwei Positionen",pick.replace(/\s+/g," ").slice(0,140));
 await p.click('[data-psi]:has-text("Zusatz")');await p.waitForTimeout(300);ok(/Verteiler 32A Black/.test(await p.textContent(".ov .card"))&&await p.isVisible("#peq"),"Zusatz-Position geöffnet");await p.click("#pex");
 /* Scan: nicht in der Packliste */
 await p.evaluate(()=>pkScanHit(packs.find(x=>x.id==="P1"),"1032-03"));await p.waitForTimeout(300);
 const ms=await p.evaluate(()=>[...document.querySelectorAll("[data-psa]")].map(b=>b.innerText.replace(/\s+/g," ")));console.log("Alternativ-Liste:",ms.join(" | "));
 ok(/steht nicht in dieser Packliste/.test(await p.textContent(".ov .card")),"Hinweis nicht in Packliste");
 ok(/Verteiler 32A Black.*gleiche Gruppe/.test(ms[0]||""),"gleiche Gruppe zuerst");
 ok(!ms.some(t=>/63A Indu/.test(t)),"komplette Positionen nicht angeboten");
 await p.click('[data-psa="2"]');await p.waitForTimeout(300);
 ok(await p.inputValue("#peat")==="Verteiler 32A Indu","Alternative vorbelegt");await p.fill("#pean","2");await p.click("#pes");await p.waitForTimeout(300);
 const alt=await p.evaluate(()=>{const P=packs.find(x=>x.id==="P1");return JSON.stringify(pkH(P)[pkKeys(P)[2]].alt)});ok(/"a":"1032"/.test(alt)&&/"n":2/.test(alt),"Alternative mit Artikelnummer gespeichert",alt);
 ok(/!Verteiler 32A Black/.test((await order()).split("[Verteiler")[0]),"Position mit Alternative jetzt oben");
 /* Scan: unbekannte Nummer → zusätzlich mitgeben */
 await p.evaluate(()=>pkScanHit(packs.find(x=>x.id==="P1"),"7777"));await p.waitForTimeout(300);
 ok(/nicht in der Artikelliste/.test(await p.textContent(".ov .card"))&&!(await p.$("[data-psa]")),"unbekannter Artikel: keine Alternativen");
 await p.click("#psxa");await p.waitForTimeout(200);ok(await p.isVisible("#pxt")&&/7777/.test(await p.textContent(".pkscm")),"Zusätzlich-Dialog mit Hinweis");await p.click("#pxx");
 await p.evaluate(()=>pkScanHit(packs.find(x=>x.id==="P1"),"1032"));await p.waitForTimeout(300);await p.click("#psxa");await p.waitForTimeout(200);
 ok(await p.inputValue("#pxt")==="Verteiler 32A Indu","Zusätzlich vorbelegt");await p.click("#pxs");await p.waitForTimeout(300);
 ok(/a":"1032"/.test(await p.evaluate(()=>JSON.stringify(pkX(packs.find(x=>x.id==="P1"))))),"Zusätzlich mit Nummer gespeichert");
 await p.screenshot({path:S+"pkscan_list.png",fullPage:true});
 /* abgeschlossen: Knopf weg */
 await p.evaluate(async()=>{const P=packs.find(x=>x.id==="P1");await pkHSet(P,{fin:{by:me,t:Date.now()},zf_Z9:{by:me,t:Date.now()}})});await p.waitForTimeout(300);
 ok(!(await p.$("#pkscan")),"abgeschlossen: kein Scan-Knopf");
 ok(!errs.length,"keine JS-Fehler",errs.join(" | "));
 console.log("FEHLER GESAMT:",bad);await b.close()})();
