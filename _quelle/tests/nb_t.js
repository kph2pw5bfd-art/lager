/* Test 1.152: „Wird nicht gebraucht“ beim Herrichten + Projektleiter in Meine Aufträge (SP = Ordner mit fakesb.js) */
const {chromium}=require("playwright");const fs=require("fs");const S=(process.env.SP||"/tmp")+"/";const J=o=>JSON.stringify(o);
const t0=new Date();t0.setHours(0,0,0,0);const D=n=>t0.getTime()+n*864e5+8*36e5;
(async()=>{const b=await chromium.launch();let fail=0;const ok=(t,c)=>{if(!c)fail++;console.log((c?"OK   ":"FEHLT")+" "+t)};const errs=[];
 const pos=[{p:"1",n:6,u:"Stk",t:"Kabel 32A 50m",a:"1098",f:0},{p:"2",n:4,u:"Stk",t:"Schuko 20m",a:"1081",f:0},{p:"3",n:3,u:"Stk",t:"Verteiler 63A",a:"1050",f:0}];
 const seed=[{col:"pack",id:"A",data:{ord:"2601300",ps:"14700",ev:"Gala Wien",pl:"Max Muster",db:D(0),de:D(5),pos,zus:[],by:"u1",t:D(-1)}},
  {col:"pack",id:"B",data:{ord:"2601600",ps:"14600",ev:"Stadtfest Graz",pl:"ME",db:D(1),de:D(6),pos,zus:[],by:"u1",t:D(-1)}},{col:"packh",id:"B",data:{h_3:{ok:true,by:"u1",t:1}}}];
 const fk=fs.readFileSync(S+"fakesb.js","utf8").replace("const T={docs:[]","const T={docs:"+J(seed));
 const ctx=await b.newContext({viewport:{width:390,height:844}});const p=await ctx.newPage();p.on("pageerror",e=>errs.push(e.message));
 await ctx.route("**/*",r=>{const u=r.request().url();if(u.startsWith("https://app.test/"))return r.fulfill({body:fs.readFileSync("/home/claude/gh/index.html"),contentType:"text/html"});if(u.includes("supabase-js"))return r.fulfill({body:fk,contentType:"text/javascript"});return r.fulfill({status:404,body:""})});
 await p.goto("https://app.test/");await p.waitForTimeout(800);await p.mouse.click(200,400);await p.waitForTimeout(400);
 await p.evaluate(()=>{const P=packs.find(x=>x.id==="B");P.pl=auMyName()});
 const HH=id=>p.evaluate(id=>JSON.parse(JSON.stringify(packh[id]||{})),id);
 const openA=async()=>{await p.evaluate(()=>{curPack="A";view="packopen";draw()});await p.waitForTimeout(300)};
 await openA();await p.click('.pkp[data-pkrow="0"] [data-pe="0"].pkt');await p.waitForSelector("#penb");
 ok("Vorschlag PL im Wer-Feld",await p.$eval("#penbl",d=>[...d.options].some(o=>o.value==="Max M.")));
 await p.fill("#penb","2");await p.fill("#penbw","Max M.");await p.fill("#penbg","Kunde hat eigenes");await p.dispatchEvent("#penb","input");
 ok("Vorhanden-Anzeige von 4",/von 4/.test(await p.textContent("#pen")));await p.screenshot({path:S+"nb1.png"});await p.click("#pes");await p.waitForTimeout(400);
 let h=await HH("A");ok("nb gespeichert "+J(h.h_1),h.h_1&&h.h_1.nb&&h.h_1.nb.n===2&&h.h_1.nb.w==="Max M."&&!h.h_1.ok);
 let row=await p.$eval('.pkp[data-pkrow="0"]',e=>({c:e.className,t:e.textContent}));ok("Zeile grau mit Text "+row.c,/pk-nb/.test(row.c)&&!/pk-part/.test(row.c)&&/−2 Stk nicht gebraucht · laut Max M\.Grund: Kunde hat eigenes/.test(row.t));
 await p.click('.pkp[data-pkrow="0"] [data-pc]');await p.waitForTimeout(300);h=await HH("A");ok("Abhaken behält nb",h.h_1.ok===true&&h.h_1.nb&&h.h_1.nb.n===2);
 const st=await p.evaluate(()=>{const P=packs.find(x=>x.id==="A");return pkPS(P.pos[0],packh.A.h_1)});ok("Stand ok, need 4",st.s==="ok"&&st.need===4);
 await p.click('.pkp[data-pkrow="1"] [data-pe="1"].pkt');await p.waitForSelector("#penb");await p.click("#penba");await p.click("#pes");await p.waitForTimeout(400);
 h=await HH("A");const s2=await p.evaluate(()=>{const P=packs.find(x=>x.id==="A");return [pkPS(P.pos[1],packh.A.h_2).s,pkProg(P).d,pkProg(P).dev]});ok("Alle nicht gebraucht → erledigt "+J(s2),h.h_2.nb.n===4&&s2[0]==="ok"&&s2[1]===2&&s2[2]===2);
 const B=await p.evaluate(()=>{const P=packs.find(x=>x.id==="A"),B=abgBal(P),e=k=>B.L.find(x=>x.code===k)||{};return{k:e("1098").soll,s:e("1081").soll||0,mail:pkMailText(P).body,dev:pkDrDev(pkDrRows(P)).D,au:auDevLines(P,null),net:auDevNet(P,null)}});
 ok("Abgleich raus 4 / 0 "+B.k+"/"+B.s,B.k===4&&B.s===0);ok("Info-Mail",/Kabel 32A 50m \(1098\): 2 Stk nicht gebraucht \(laut Max M\.\) – Grund: Kunde hat eigenes/.test(B.mail));
 ok("PDF-Abweichungen "+J(B.dev),B.dev.some(d=>/Kabel.*2 Stk nicht gebraucht \(laut Max M\.\)/.test(d))&&B.dev.some(d=>/Schuko.*4 Stk nicht gebraucht/.test(d)));
 ok("Meine Aufträge "+J(B.net),B.au.some(l=>/2 Stk nicht gebraucht/.test(l))&&B.net.some(l=>/^−2 Stk .*nicht gebraucht, laut Max M\./.test(l)));
 /* geänderter Packschein: gleiche Menge → bleibt, andere Menge → weg */
 const C=await p.evaluate(()=>{const P=packs.find(x=>x.id==="A"),I=pkItems(P),n1=I.map(o=>({...o,x:{...o.x}})),n2=I.map(o=>({...o,x:{...o.x,n:o.x.p==="1"?4:o.x.n}}));return[pkCarry(packh.A,I,n1).patch,pkCarry(packh.A,I,n2).patch]});
 ok("Packschein gleich: nb übernommen",C[0].h_1.nb&&C[0].h_1.nb.n===2);ok("Menge geändert: nb weg",!(C[1].h_1||{}).nb&&C[1].h_2.nb.n===4);
 /* Projektleiter */
 await p.evaluate(()=>{curAu="B";view="auopen";draw()});await p.waitForTimeout(400);ok("Knopf in Meine Aufträge",!!(await p.$("#aunb")));
 await p.click("#aunb");await p.waitForSelector("[data-nbp]");ok("Hergerichtete Position gesperrt",/Wird schon hergerichtet/.test(await p.textContent(".ov")));
 await p.click('[data-nbp="0"]');await p.click('[data-nbp="0"]');await p.fill("#aunbg","Abbau früher");await p.screenshot({path:S+"nb2.png"});await p.click("#aunbo");await p.waitForTimeout(400);
 h=await HH("B");const me1=await p.evaluate(()=>shortName(meName()));ok("PL-Eintrag "+J(h.h_1),h.h_1&&h.h_1.nb.n===2&&h.h_1.nb.pl===true&&h.h_1.nb.w===me1);
 ok("Übersicht im Auftrag",/Wird nicht gebraucht/.test(await p.textContent("#app"))&&/selbst eingetragen/.test(await p.textContent("#app")));
 await p.evaluate(()=>{curPack="B";view="packopen";draw()});await p.waitForTimeout(300);ok("Lager sieht es in der Packliste",/nicht gebraucht · laut .*selbst eingetragen.*Grund: Abbau früher/.test(await p.textContent('.pkp[data-pkrow="0"]')));
 await p.evaluate(()=>{curAu="B";view="auopen";draw()});await p.waitForTimeout(300);await p.click("#aunb");await p.click('[data-nbm="0"]');await p.click('[data-nbm="0"]');await p.click("#aunbo");await p.waitForTimeout(300);h=await HH("B");ok("PL nimmt zurück",!h.h_1||!h.h_1.nb);
 ok("Keine JS-Fehler "+errs.join("|"),!errs.length);await b.close();console.log(fail?"FEHLER: "+fail:"ALLES OK")})();
