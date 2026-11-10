/* Test 1.93: zusätzlich mitgegebenes Material – hinzufügen/ändern/löschen, Abgleich, PDF, Mails, Verrechnung mit späterem Zusatz / geändertem Packschein */
const {chromium}=require("playwright");const fs=require("fs");const S=(process.env.SP||"/tmp")+"/";
const t0=new Date();t0.setHours(0,0,0,0);const T0=t0.getTime(),D=(n,h)=>{const d=new Date(T0);d.setDate(d.getDate()+n);if(h)d.setHours(h);return d.getTime()};
const kat=JSON.parse(fs.readFileSync(__dirname+"/rkat.json","utf8")).map((x,i)=>({col:"rkat",id:"k"+i,data:x}));
const pos=(p,n,t,a,f)=>({p,n,u:"Stk",t,a,f:f||0});
const seed=kat.concat([
 {col:"pack",id:"14501",data:{ord:"2601131",ps:"14501",ev:"Firmenfeier Parndorf",pl:"Jürgen Hartmann",db:D(0,7),de:D(3,18),pos:[pos("1.1",10,"Kabel CEE 32A 50m","1098"),pos("1.2",4,"Verteiler 3-fach","1026")],by:"u1",t:D(-1)}},
 {col:"packh",id:"14501",data:{c:1,h_1_1:{ok:true,by:"u1",t:1},h_1_2:{ok:true,by:"u1",t:1}}},
 {col:"retour",id:"r1",data:{ev:"Firmenfeier Parndorf",ord:"2601131",itemsJson:JSON.stringify({"1098":{nr:"1098",name:"32A Kabel 50m",q:10,g:"Kabel",u:"32A"}}),by:"u1",t:Date.now()}}]);
let F=0;const ok=(t,c,v)=>{F+=!c;console.log((c?"OK   ":"FEHLT")+" "+t+(v!==undefined?": "+v:""))};
(async()=>{const b=await chromium.launch();const ctx=await b.newContext({viewport:{width:390,height:844}});const p=await ctx.newPage();const errs=[];p.on("pageerror",e=>errs.push(e.message));
 const fk=fs.readFileSync(S+"fakesb.js","utf8").replace("const T={docs:[]","const T={docs:"+JSON.stringify(seed));
 await ctx.route("**/*",r=>{const u=r.request().url();if(u.startsWith("https://app.test/"))return r.fulfill({body:fs.readFileSync("/home/claude/gh/index.html"),contentType:"text/html"});if(u.includes("supabase-js"))return r.fulfill({body:fk,contentType:"text/javascript"});
  if(u.includes("pdf-lib"))return r.fulfill({body:fs.readFileSync("/opt/npm-tools/node_modules/pdf-lib/dist/pdf-lib.min.js"),contentType:"text/javascript"});return r.fulfill({status:404,body:""})});
 await p.goto("https://app.test/");await p.evaluate(()=>window.PK_FOPEN=true);await p.waitForTimeout(900);await p.mouse.click(195,420);await p.waitForTimeout(500);
 const E=(f,a)=>p.evaluate(f,a),T=async sel=>(await p.$$eval(sel,l=>l.map(x=>x.innerText.replace(/\s+/g," ").trim()))).join(" | ");
 const V=async()=>{await E(()=>{document.querySelectorAll(".ov").forEach(o=>o.remove());curPack="14501";view="packopen";hist=["start"];draw()});await p.waitForTimeout(300)};
 await V();await p.click('[data-pkfg="main"]');ok("Knopf „+ Material hinzufügen“ im Zahnrad",!!(await p.$("#pkxadd")));await p.click(".pkmx");
 /* aus Artikelliste */
 await p.click('[data-pkfg="main"]');await p.click("#pkxadd");await p.waitForTimeout(200);await p.fill("#pxt","verteiler 32");await p.waitForTimeout(200);const hit=await T("#pxres button");console.log("Treffer:",hit.slice(0,120));
 await p.click("#pxres button");await p.fill("#pxn","2");await p.fill("#pxw","Monteur hat angerufen");await p.click("#pxs");await p.waitForTimeout(400);
 /* frei eingetippt */
 await p.click('[data-pkfg="main"]');await p.click("#pkxadd");await p.waitForTimeout(200);await p.fill("#pxt","Kabeltrommel Spezial");await p.click("#pxs");await p.waitForTimeout(400);
 const X=await E(()=>pkX(packs[0]).map(e=>e.n+" "+e.u+" "+pkXName(e)+"|"+e.a+"|"+(e.why||"")).join(" ; "));console.log("Zusätzlich:",X);
 ok("Zwei Einträge gespeichert",/^2 Stk .+\|\d+\|Monteur hat angerufen ; 1 Stk Kabeltrommel Spezial\|\|$/.test(X),X);
 ok("Grüne Gruppe sichtbar",/Zusätzlich \(nicht im Packschein\)/.test(await T(".pkgx")));await p.screenshot({path:S+"extra_view.png",fullPage:true});
 const ak=await E(()=>pkXKey(pkX(packs[0])[0]));
 ok("Abgleich zählt als raus",await E(k=>{const B=abgBal(packs[0]);const e=B.L.find(x=>x.k===k);return !!e&&e.soll===2},ak));
 ok("Info-Mail an PL",/Zusätzlich mitgegeben \(nicht im Packschein\): 2 Stk .*Monteur hat angerufen/.test(await E(()=>pkMailText(packs[0]).body)));
 ok("Abweichung zählt (Info-Frage)",await E(()=>pkProg(packs[0]).dev===2));
 const M=await E(()=>pkDrMail(packs[0]));ok("Mail an Monteur: Du bekommst",/2 Stk .*zusätzlich, nicht im Packschein/.test(M)&&/Zusätzlich mitgegeben: 2 Stk/.test(M),M.slice(0,500));
 const R=await E(()=>pkDrRows(packs[0]).map(r=>r.pos+"|"+r.soll+"|"+r.mit+"|"+r.name).join(" ; "));ok("PDF-Zeilen am Ende mit +",/; \+\|0\|2\|.* ; \+\|0\|1\|Kabeltrommel Spezial$/.test(R),R);
 const b64=await E(async()=>{const u=await pkDrPdf(packs[0]);let s="";for(let i=0;i<u.length;i+=8192)s+=String.fromCharCode(...u.subarray(i,i+8192));return btoa(s)});fs.writeFileSync(S+"extra.pdf",Buffer.from(b64,"base64"));
 /* ändern + löschen */
 const id2=await E(()=>pkX(packs[0])[1].id);await p.click('.pkt[data-pkxe="'+id2+'"]');await p.waitForTimeout(200);ok("Ändern: vorbelegt",(await p.inputValue("#pxt"))==="Kabeltrommel Spezial");
 await p.fill("#pxn","3");await p.click("#pxs");await p.waitForTimeout(400);ok("Geändert auf 3",await E(id=>pkH(packs[0])[id].n===3,id2));
 await p.click('.pkt[data-pkxe="'+id2+'"]');await p.waitForTimeout(200);await p.click("#pxd");await p.waitForTimeout(200);await p.click(".ov .btn:not(.ghost)");await p.waitForTimeout(400);ok("Gelöscht",await E(()=>pkX(packs[0]).length===1));
 /* Zusatz mit demselben Artikel → verrechnet */
 const code=await E(()=>pkX(packs[0])[0].a);
 await E(c=>{window.pkRead=async()=>({ord:"2601131",ps:"14533",ev:"Firmenfeier Parndorf",pl:"x",db:Date.now(),de:Date.now(),pos:[{p:"1",n:3,u:"Stk",t:"Verteiler 32A",a:c,f:0},{p:"2",n:2,u:"Stk",t:"Defender Midi",a:"2001",f:0}]});pkUpload([{name:"z.pdf"}])},code);await p.waitForTimeout(400);
 await p.click('[data-cm="zus"]');await p.click("#pkco");await p.waitForTimeout(300);await p.click("#pzo");await p.waitForTimeout(500);
 const zs=await E(()=>{const P=packs[0],H=pkH(P),it=pkItems(P).filter(o=>o.z==="14533");return it.map(o=>{const s=pkPS(o.x,H[o.k]);return o.x.p+":"+s.s+(s.s==="part"?s.q:"")}).join(",")+" | x:"+pkX(P).length});
 ok("Zusatz: 2 von 3 aus Zusätzlichem verrechnet, Zusätzlich aufgebraucht",zs==="1:part2,2:open | x:0",zs);
 ok("Abgleich nicht doppelt",await E(k=>{const e=abgBal(packs[0]).L.find(x=>x.k===k);return e&&e.soll===2},ak),await E(k=>JSON.stringify(abgBal(packs[0]).L.find(x=>x.k===k)),ak));
 /* geänderter Packschein mit zusätzlichem Artikel → verrechnet */
 await V();await p.click('[data-pkfg="main"]');await p.click("#pkxadd");await p.waitForTimeout(200);await p.fill("#pxt","schuko 20");await p.waitForTimeout(200);await p.click("#pxres button");await p.fill("#pxn","5");await p.click("#pxs");await p.waitForTimeout(400);
 await E(()=>{window.pkRead=async()=>({ord:"2601131",ps:"14560",ev:"Firmenfeier Parndorf",pl:"x",db:Date.now(),de:Date.now(),pos:[{p:"1.1",n:10,u:"Stk",t:"Kabel CEE 32A 50m",a:"1098",f:0},{p:"1.2",n:4,u:"Stk",t:"Verteiler 3-fach",a:"1026",f:0},{p:"1.3",n:5,u:"Stk",t:"Schuko 20m",a:"1081",f:0}]});pkUpload([{name:"n.pdf"}])});await p.waitForTimeout(400);
 await p.click('[data-cm="rep"]');await p.waitForTimeout(150);await p.click("#pkco");await p.waitForTimeout(500);
 const rs=await E(()=>{const P=packs[0],H=pkH(P);return pkItems(P).filter(o=>!o.z).map(o=>{const s=pkPS(o.x,H[o.k]);return o.x.p+":"+s.s}).join(",")+" | x:"+pkX(P).length});
 ok("Geänderter Packschein: Schuko 20m aus Zusätzlichem hergerichtet",rs==="1.1:ok,1.2:ok,1.3:ok | x:0",rs);
 ok("keine JS-Fehler",!errs.length,errs.join(" / "));console.log("FEHLER GESAMT:",F);await b.close()})();
