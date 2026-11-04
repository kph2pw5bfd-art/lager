/* Test 1.118: Packscheine ohne Herrichten – Von Baustelle / Verlängerung (Hochladen, Vorschlag, Wand, Status, Abgleich, Mehr-Material als Zusatz, Art ändern, Meine Aufträge) (SP = Ordner mit fakesb.js) */
const {chromium}=require("playwright");const fs=require("fs");const S=(process.env.SP||"/tmp")+"/";const J=o=>JSON.stringify(o);
const t0=new Date();t0.setHours(0,0,0,0);const T0=t0.getTime(),D=n=>T0+n*864e5+8*36e5;
(async()=>{const b=await chromium.launch();let fail=0;const ok=(t,c)=>{if(!c)fail++;console.log((c?"OK   ":"FEHLT")+" "+t)};const errs=[];
 const posA=[{p:"1",n:10,u:"Stk",t:"Kabel 32A 50m",a:"1098",f:0},{p:"2",n:6,u:"Stk",t:"Schuko 20m",a:"1081",f:0},{p:"3",n:2,u:"Stk",t:"Verteiler 63A",a:"1050",f:0}];
 const posS=[{p:"1",n:8,u:"Stk",t:"Kabel 32A 25m",a:"1097",f:0},{p:"2",n:4,u:"Stk",t:"Verteiler 32A",a:"1026",f:0}];
 const fin={c:1,h_1:{ok:true,by:"u1",t:1},h_2:{ok:true,by:"u1",t:1},h_3:{ok:true,by:"u1",t:1},fin:{by:"u1",t:D(-6)}};
 const seed=[{col:"pack",id:"A",data:{ord:"2601300",ps:"14700",ev:"Gala Wien",pl:"Max Muster",db:D(-6),de:D(-1),pos:posA,zus:[],by:"u1",t:D(-8)}},{col:"packh",id:"A",data:fin},
  {col:"pack",id:"S",data:{ord:"2601600",ps:"14600",ev:"Stadtfest Graz",pl:"Anna Klein",db:D(-4),de:D(2),pos:posS,zus:[],by:"u1",t:D(-6)}},{col:"packh",id:"S",data:{c:1,h_1:{ok:true,by:"u1",t:1},h_2:{ok:true,by:"u1",t:1},fin:{by:"u1",t:D(-4)}}},
  {col:"titel",id:"pl",data:{name:"Projektleiter",o:1,r:{au_s:true}}}];
 const fk=fs.readFileSync(S+"fakesb.js","utf8").replace("const T={docs:[]","const T={docs:"+J(seed));
 const ctx=await b.newContext({viewport:{width:390,height:844}});const p=await ctx.newPage();p.on("pageerror",e=>errs.push(e.message));
 await ctx.route("**/*",r=>{const u=r.request().url();
  if(u.startsWith("https://app.test/"))return r.fulfill({body:fs.readFileSync("/home/claude/gh/index.html"),contentType:"text/html"});
  if(u.includes("supabase-js"))return r.fulfill({body:fk,contentType:"text/javascript"});
  return r.fulfill({status:404,body:""})});
 await p.goto("https://app.test/");await p.waitForTimeout(700);await p.mouse.click(200,400);await p.waitForTimeout(400);
 const PK=id=>p.evaluate(id=>(window.__T.docs.find(r=>r.col==="pack"&&r.id===id)||{}).data,id);
 const st=id=>p.evaluate(id=>{const x=packs.find(q=>q.id===id);return x?pkState(x):null},id);
 const up=P=>p.evaluate(P=>{pkRead=async()=>P;view="pack";draw();pkUpload([{name:"x.pdf"}])},P);
 ok("Vorher: Gala Wien „Dispo abgelaufen“",(await st("A")).k==="over");
 /* 1) Verlängerung: Vorschlag + Mehr-Material */
 const PV={ord:"2601555",ps:"14800",ev:"Gala Wien",pl:"Max Muster",db:D(-1),de:D(10),pos:posA.map(x=>x.p==="1"?{...x,n:12}:x.p==="2"?{...x,n:4}:x)};
 await up(PV);await p.waitForSelector("#pkart .pkaopt");
 const sug=await p.evaluate(()=>({txt:(document.querySelector(".pkasug")||{}).textContent||"",sel:(document.querySelector('input[name="pkart"]:checked')||{}).value}));
 console.log("   Vorschlag:",sug.txt);ok("Verlängerung erkannt + vorausgewählt",sug.sel==="verl"&&/Gala Wien · Auftrag 2601300/.test(sug.txt));
 await p.screenshot({path:S+"pkart_up_verl.png",fullPage:true});
 await p.click("#pkok");await p.waitForTimeout(600);
 const q1=await p.evaluate(()=>(document.querySelector(".ov:last-of-type")||{}).textContent||"");console.log("   Frage:",q1.slice(0,150));ok("Frage: Mehr-Material als Zusatz",/mehr Material als das Original \(2 Stk/.test(q1));
 await p.locator(".ov").last().locator("button",{hasText:"Ja, als Zusatz"}).click();await p.waitForTimeout(400);
 await p.locator('.ov [data-zq="0"]').first().click().catch(()=>{});await p.waitForTimeout(100);await p.click("#pzo");await p.waitForTimeout(900);
 let v=await PK("14800"),a=await PK("A");ok("Verlängerung gespeichert (art=verl, von=A)",v&&v.art==="verl"&&v.von==="A");
 ok("Zusatz 14800 mit 2 Stk am Original",(a.zus||[]).length===1&&a.zus[0].verl==="14800"&&a.zus[0].pos.length===1&&a.zus[0].pos[0].n===2);
 const s1=await st("A"),sv=await st("14800");ok("Original nicht mehr abgelaufen ("+s1.l+")",s1.k!=="over");ok("Verlängerung: Status „Verlängerung“",sv.l==="Verlängerung");
 const deA=await p.evaluate(()=>{const x=packs.find(q=>q.id==="A");return{de:x.de,de0:x._de0}});ok("Original Dispo-Ende = Verlängerung, ursprüngliches gemerkt",deA.de===D(10)&&deA.de0===D(-1));
 /* 2) Von Baustelle */
 const PB={ord:"2601620",ps:"14820",ev:"Ball Linz",pl:"Anna Klein",db:D(2),de:D(5),pos:[{p:"1",n:8,u:"Stk",t:"Kabel 32A 25m",a:"1097",f:0},{p:"2",n:2,u:"Stk",t:"Verteiler 32A",a:"1026",f:0}]};
 await up(PB);await p.waitForSelector("#pkart .pkaopt");ok("Ohne Treffer: „Normal herrichten“ vorausgewählt",(await p.evaluate(()=>document.querySelector('input[name="pkart"]:checked').value))==="norm");
 await p.check('input[name="pkart"][value="bst"]');await p.waitForTimeout(150);
 const rows=await p.$$eval("#pkart [data-avon]",l=>l.map(x=>x.dataset.avon+":"+x.textContent.trim()));console.log("   Vorschläge:",rows);ok("Vorschlag Stadtfest Graz",rows.some(r=>r.startsWith("S:")));
 await p.click('#pkart [data-avon="S"]');await p.waitForTimeout(100);await p.screenshot({path:S+"pkart_up_bst.png",fullPage:true});
 await p.click("#pkok");await p.waitForTimeout(800);const bp=await PK("14820");ok("Gespeichert: art=bst, von=S",bp.art==="bst"&&bp.von==="S");
 ok("Von Baustelle: Status",(await st("14820")).l==="Von Baustelle");
 /* Abgleich: Stadtfest Graz bekommt das Material als zurück, Ball Linz hat es draußen */
 const ab=await p.evaluate(()=>{const s=abgBal(packs.find(q=>q.id==="S")),bl=abgBal(packs.find(q=>q.id==="14820"));return{sz:s.zur,sr:s.raus,sf:s.fehlt,br:bl.raus}});
 console.log("   Abgleich:",JSON.stringify(ab));ok("Quelle: 10 Stk weitergegeben zählen als zurück",ab.sz===10&&ab.sr===12&&ab.sf===2);ok("Ball Linz: 10 Stk draußen",ab.br===10);
 /* 3) Wand + Heute herrichten */
 await p.evaluate(()=>{view="pack";draw()});await p.waitForTimeout(300);
 const wall=await p.evaluate(()=>({ov:(()=>{const d=pkOvData();return d.w0.concat(d.w1).flatMap(x=>x.items).map(o=>o.p.id)})(),noh:[...document.querySelectorAll(".pkcard.noh")].map(x=>x.dataset.pk),late:[...document.querySelectorAll(".pklate [data-pk]")].map(x=>x.dataset.pk),herr:pkGroups().herr.map(x=>x.id),late2:pkGroups().late.map(x=>x.id)}));
 console.log("   Wand:",JSON.stringify(wall));ok("Wand: Verlängerung am Dispo-Beginn, Ball Linz als gestrichelte Karte",wall.ov.includes("14800")&&wall.noh.includes("14820"));ok("Vergangener Tag: Verlängerung nicht „nicht fertig“",await p.evaluate(()=>{const d=pkOvData();const day=d.w0.concat(d.w1).find(x=>x.items.some(o=>o.p.id==="14800"));return !!day&&!/nicht fertig/.test(pkPastSum(day))}));
 ok("Nie „Nicht hergerichtet“ / „Heute herrichten“",!wall.late.includes("14800")&&!wall.herr.includes("14800")&&!wall.late2.includes("14820"));
 const zt=await p.evaluate(()=>pkZTasks().map(z=>z.ev));ok("Mehr-Material steht als Zusatz zum Herrichten ("+zt+")",zt.some(e=>/Zusatz 14800 zu Gala Wien/.test(e)));
 await p.screenshot({path:S+"pkart_wand.png",fullPage:true});
 /* 4) Ansichten */
 await p.evaluate(()=>{curPack="14800";go("packopen")});await p.waitForTimeout(400);const vt=await p.evaluate(()=>document.querySelector("#app").textContent);
 ok("Verlängerung: Kasten + Vergleich",/↻ Verlängerung von Gala Wien/.test(vt)&&/\+2 Stk mehr/.test(vt)&&/−2 Stk weniger/.test(vt)&&/Zusatz 14800/.test(vt));if(!/\+2 Stk mehr/.test(vt))console.log("   Text:",vt.slice(0,600));
 ok("Keine Kreise zum Abhaken",!(await p.$("#app [data-pc]")));await p.screenshot({path:S+"pkart_verl.png",fullPage:true});
 await p.click('#app .pkartbox [data-pkgo="A"]');await p.waitForTimeout(400);const at=await p.evaluate(()=>document.querySelector("#app").textContent);
 ok("Original: „Verlängert bis … (ursprünglich …)“",/↻ Verlängert bis .* \(ursprünglich .*\) durch Auftrag 2601555/.test(at));await p.screenshot({path:S+"pkart_orig.png",fullPage:true});
 await p.evaluate(()=>{curPack="14820";go("packopen")});await p.waitForTimeout(400);const bt=await p.evaluate(()=>document.querySelector("#app").textContent);
 ok("Von Baustelle: „kommt direkt von Stadtfest Graz“",/Nicht herrichten/.test(bt)&&/Stadtfest Graz/.test(bt));await p.screenshot({path:S+"pkart_bst.png",fullPage:true});
 await p.evaluate(()=>{curPack="S";go("packopen")});await p.waitForTimeout(300);ok("Quelle: Hinweis „geht direkt weiter an Ball Linz“",/geht direkt weiter an Ball Linz/.test(await p.evaluate(()=>document.querySelector("#app").textContent)));
 /* 5) Retourschein mit der Verlängerungs-Nummer zählt beim Original */
 await p.evaluate(()=>{window.__T.docs.push({col:"retour",id:"rV",data:{ev:"Gala Wien",ord:"2601555",itemsJson:JSON.stringify({"1098":{nr:"1098",name:"32A Kabel 50m",g:"Kabel",u:"32A",q:12}}),by:"u1",t:Date.now(),closed:true,art:"end",closedBy:"u1",closedT:Date.now()}});db.reloadAll&&db.reloadAll()});await p.waitForTimeout(900);
 const ab2=await p.evaluate(()=>{const B=abgBal(packs.find(q=>q.id==="A"));return{z:B.zur,f:B.fehlt,r:B.raus,R:B.R.length,pk:(abgPackOf("2601555")||{}).id,st:pkState(packs.find(q=>q.id==="A")).k,stv:pkState(packs.find(q=>q.id==="14800")).k}});
 console.log("   Abgleich Original:",JSON.stringify(ab2));ok("Retourschein 2601555 zählt beim Original (raus 20 inkl. Zusatz)",ab2.R===1&&ab2.r===20&&ab2.z===12&&ab2.pk==="A");ok("Endretoure → Original + Verlängerung erledigt",ab2.st==="done"&&ab2.stv==="done");
 /* 6) Art ändern: Ball Linz doch normal */
 await p.evaluate(()=>{curPack="14820";go("packopen")});await p.waitForTimeout(300);await p.click("#app [data-artch]");await p.waitForSelector("#pkart2 .pkaopt");
 await p.check('#pkart2 input[name="pkart"][value="norm"]');await p.click("#pkao");await p.waitForTimeout(900);ok("Art ändern → normal: wieder herrichten",(await PK("14820")).art===""&&(await st("14820")).k==="next");
 /* 7) Meine Aufträge */
 const au=await p.evaluate(()=>{curAu="A";view="auopen";draw();return document.querySelector("#app").textContent});ok("Meine Aufträge: „Verlängert bis …“",/Verlängert bis/.test(au));
 const au2=await p.evaluate(()=>{curAu="14800";view="auopen";draw();return document.querySelector("#app").textContent});ok("Meine Aufträge: Verlängerung – kein Herrichten",/Verlängerung – kein Herrichten/.test(au2));
 /* 8) ohne Hochladen-Recht kein „Art ändern“ */
 await p.evaluate(()=>{window.__c=can;can=k=>k==="pk_b"?false:window.__c(k);curPack="14800";view="packopen";draw()});await p.waitForTimeout(200);ok("Ohne Hochladen-Recht: kein „Art ändern“",!(await p.$("[data-artch]")));
 console.log("Fehler:",errs);ok("keine Seitenfehler",!errs.length);console.log(fail?"FEHLGESCHLAGEN: "+fail:"ALLES OK");await b.close()})();
