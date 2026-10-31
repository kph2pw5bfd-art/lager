/* Test 1.77: Abgleich Ausgang ↔ Eingang – Konto, Zeile im Retourschein, Teil-/Endretoure, Fehlt noch, Zu viel zurück (nur Vorschläge), Zu prüfen, Excel, Mail-Anhang (SP = Ordner mit fakesb.js) */
const {chromium}=require("playwright");const fs=require("fs");const S=(process.env.SP||"/tmp")+"/";
const t0=new Date();t0.setHours(0,0,0,0);const T0=t0.getTime(),day=864e5,D=n=>{const d=new Date(T0);d.setDate(d.getDate()+n);return d.getTime()};
const kat=JSON.parse(fs.readFileSync(__dirname+"/rkat.json","utf8")).map((x,i)=>({col:"rkat",id:"k"+i,data:x}));
const it=(nr,name,q,g)=>({nr,name,q,g:g||"Kabel",u:"32A"});
const J=o=>JSON.stringify(o);
const seed=kat.concat([{col:"titel",id:"tl",data:{name:"Lagerleiter",o:1,r:{ret_s:true,abg_p:true}}},
 {col:"pack",id:"A",data:{ord:"260130001",ps:"14402",ev:"Gala Wien",pl:"Max Muster",db:D(-9),de:D(-3),pos:[{p:"1",n:16,u:"Stk",t:"Kabel CEE 32A 50m",a:"1098",f:0},{p:"2",n:4,u:"Stk",t:"Kabel CEE 32A 25m",a:"1097",f:0},{p:"3",n:8,u:"Stk",t:"Verteiler 3-fach",a:"1026",f:0},{p:"4",n:17,u:"Stk",t:"Schuko 20m",a:"1081",f:11}],
  zus:[{ps:"14455",t:D(-7),by:"u1",pos:[{p:"1",n:4,u:"Stk",t:"Kabel CEE 32A 25m",a:"1097",f:0}]}],by:"u1",t:D(-10)}},
 {col:"packh",id:"A",data:{c:1,h_1:{ok:true,by:"u1",t:1},h_2:{ok:true,by:"u1",t:1},h_3:{ok:true,by:"u1",t:1},h_4:{ok:true,fm:"miete",by:"u1",t:1},h_z14455_1:{ok:true,by:"u1",t:1},fin:{by:"u1",t:D(-9)}}},
 {col:"pack",id:"B",data:{ord:"260120001",ps:"14500",ev:"Messe Linz",pl:"Max Muster",db:D(-6),de:D(-1),pos:[{p:"1",n:2,u:"Stk",t:"Kabel CEE 32A 25m",a:"1097",f:0}],by:"u1",t:D(-7)}},
 {col:"packh",id:"B",data:{c:1,h_1:{ok:true,by:"u1",t:1},fin:{by:"u1",t:1}}},
 {col:"pack",id:"C",data:{ord:"260160001",ps:"14600",ev:"Stadtfest Graz",pl:"Marvin Wellisch",db:D(-2),de:D(3),pos:[{p:"1",n:5,u:"Stk",t:"Schuko 20m",a:"1081",f:0}],by:"u1",t:D(-3)}},
 {col:"packh",id:"C",data:{c:1,h_1:{ok:true,by:"u1",t:1},fin:{by:"u1",t:1}}},
 {col:"retour",id:"rA1",data:{ev:"Gala Wien",ord:"2601300-01",itemsJson:J({"1098":it("1098","32A Kabel 50m",4)}),by:"u1",t:D(-6),closed:true,art:"teil",closedBy:"u1",closedT:D(-6)}},
 {col:"retour",id:"rA2",data:{ev:"Gala Wien",ord:"2601300-01",itemsJson:J({"1098":it("1098","32A Kabel 50m",6),"1097":it("1097","32A Kabel 25m",10),"1026":it("1026","Verteiler Schuko 3-fach Gummi",8,"Verteiler"),"1081":it("1081","Schuko 20m",6)}),by:"u1",t:D(-1),closed:true,art:"end",closedBy:"u1",closedT:Date.now()-36e5}},
 {col:"retour",id:"rB",data:{ev:"Messe Linz",ord:"260120001",itemsJson:J({"1098":it("1098","32A Kabel 50m",2)}),by:"u1",t:D(-1),closed:true,art:"end",closedBy:"u1",closedT:Date.now()-2*36e5}},
 {col:"retour",id:"rC",data:{ev:"Stadtfest Graz",ord:"260160001",itemsJson:J({"1081":it("1081","Schuko 20m",2)}),by:"u1",t:Date.now()-36e5}},
 {col:"retour",id:"rOld",data:{ev:"Alt ohne Art",ord:"2501",itemsJson:"{}",by:"u1",t:D(-30),closed:true,closedBy:"u1",closedT:D(-30)}}]);
const XL=`window.ExcelJS={Workbook:class{constructor(){this.ws=[]}addWorksheet(n){const rows=[];const byI={};const mk=v=>{const cells={};const r={values:v,height:0,font:null,getCell(i){return cells[i]=cells[i]||{}},eachCell(o,f){if(typeof o==="function")f=o;(r.values||[]).forEach((x,k)=>f(r.getCell(k+1),k+1))}};return r};
 const ws={name:n,columns:[],rows,mergeCells(){},addImage(){},getRow(i){if(!byI[i]){byI[i]=mk([]);rows.push(byI[i])}return byI[i]},getCell(a){return {}},get rowCount(){return rows.length},addRow(v){const cells={};const r={values:v,height:0,font:null,getCell(i){return cells[i]=cells[i]||{}},eachCell(o,f){if(typeof o==="function")f=o;(v||[]).forEach((x,k)=>f(r.getCell(k+1),k+1))}};rows.push(r);return r}};this.ws.push(ws);return ws}
 addImage(){return 0}
 get xlsx(){const me=this;return{async writeBuffer(){return new TextEncoder().encode(JSON.stringify(me.ws.map(w=>({name:w.name,rows:w.rows.map(r=>r.values)}))))}}}}};`;
(async()=>{const b=await chromium.launch();const ctx=await b.newContext({viewport:{width:390,height:844}});
 await ctx.addInitScript(XL);await ctx.addInitScript(()=>{window.__saved=[];window.__shared=null;navigator.canShare=()=>true;navigator.share=async d=>{window.__shared={n:d.files.map(f=>f.name),text:d.text}}});
 const p=await ctx.newPage();const errs=[];p.on("pageerror",e=>errs.push(e.message));
 const fk=fs.readFileSync(S+"fakesb.js","utf8").replace("const T={docs:[]","const T={docs:"+JSON.stringify(seed));
 await ctx.route("**/*",r=>{const u=r.request().url();if(u.startsWith("https://app.test/"))return r.fulfill({body:fs.readFileSync("/home/claude/gh/index.html"),contentType:"text/html"});if(u.includes("supabase-js"))return r.fulfill({body:fk,contentType:"text/javascript"});return r.fulfill({status:404,body:""})});
 await p.goto("https://app.test/");await p.waitForTimeout(900);await p.mouse.click(195,420);await p.waitForTimeout(500);
 await p.evaluate(()=>{window.claude=window.claude||{};const u=claude.use;claude.use=async n=>n==="downloads"?{save:async o=>{__saved.push({fn:o.filename,txt:await o.data.text()})}}:u(n)});
 const T=async sel=>(await p.$$eval(sel,l=>l.map(x=>x.innerText.replace(/\s+/g," ").trim()))).join(" | ");
 const V=async v=>{await p.evaluate(v=>{document.querySelectorAll(".ov").forEach(o=>o.remove());view=v;hist=["start"];draw()},v);await p.waitForTimeout(250)};
 console.log("Status: Gala Wien",await p.evaluate(()=>pkState(packs.find(x=>x.id==="A")).l),"| Stadtfest (nur offener Schein)",await p.evaluate(()=>pkState(packs.find(x=>x.id==="C")).l));
 const bal=async id=>p.evaluate(id=>{const B=abgBal(packs.find(x=>x.id===id));return "raus "+B.raus+" zurück "+B.zur+" fehlt "+B.fehlt+" zu viel "+B.zuviel+" | "+B.L.map(e=>e.name+" "+e.soll+"·"+e.back+(e.fr?"(+"+e.fr+"F)":"")).join(", ")},id);
 console.log("Konto Gala Wien:",await bal("A"));console.log("Konto Messe Linz:",await bal("B"));
 /* Lager Übersicht */
 await V("jarvis");console.log("Streifen:",await T("#abgstrip"));console.log("Reiter:",await T(".jvtab"));
 await p.click('[data-jt="miss"]');await p.waitForTimeout(200);console.log("Fehlt noch:",await T(".jvlist"));
 await p.screenshot({path:S+"abg_uebs.png",fullPage:true});
 console.log("Kachel-Zähler:",await p.evaluate(()=>jvHot()));
 /* Packliste → Karte → Konto */
 await p.evaluate(()=>{curPack="A"});await V("packopen");console.log("Karte in Packliste:",await T(".abgpk"));
 await p.click(".abgpk");await p.waitForTimeout(250);console.log("→ Ansicht",await p.evaluate(()=>view));
 console.log("Prüf-Streifen:",await T(".abgchk"));console.log("Zahlen:",await T(".abgnums"));console.log("Verlauf:",await T(".abgcard:nth-of-type(3) .abgev"));
 console.log("Artikel:",await T(".abgart"));
 await p.screenshot({path:S+"abg_konto.png",fullPage:true});
 /* Excel */
 await p.click("#abgxl");await p.waitForTimeout(500);const xl=await p.evaluate(()=>__saved[0]);
 if(xl){const W=JSON.parse(xl.txt);console.log("Excel:",xl.fn,"| Blätter:",W.map(w=>w.name+" ("+w.rows.length+" Zeilen)").join(", "));console.log("  Übersicht:",W[0].rows.slice(4).map(r=>r.join(" ; ")).join("\n             "));console.log("  Verlauf 1-3:",W[1].rows.slice(5,8).map(r=>r.join(" ; ")).join(" || "));console.log("  Zu viel:",W[2].rows.slice(5).map(r=>r.join(" ; ")).join(" || "))}else console.log("Excel: nichts gespeichert");
 /* Zu viel zurück – nur Vorschläge */
 await V("abgzv");console.log("Zu viel zurück:",(await T(".abgzv")).slice(0,600));
 await p.screenshot({path:S+"abg_zv.png",fullPage:true});
 const before=await bal("A");
 await p.click('[data-zuo="0|0"]');await p.waitForTimeout(150);console.log("Rückfrage:",await T(".ov p"));await p.click(".ov #y");await p.waitForTimeout(500);
 console.log("Zuordnungen:",await p.evaluate(()=>ABZ.map(z=>z.q+"× "+z.name+" "+z.from+"→"+z.to).join(", ")));
 console.log("Gala Wien vorher:",before,"\nGala Wien nachher:",await bal("A"));console.log("Messe Linz nachher:",await bal("B"));
 await V("abgzv");console.log("Bestätigt-Liste:",await T(".abgcard:last-of-type"));
 /* Zeile im Retourschein */
 await p.evaluate(()=>{curRet="rA2"});await V("retopen");await p.waitForTimeout(200);console.log("Zeile (Ansicht):",await T("#rabg"));
 await p.evaluate(()=>{const r=rets.find(x=>x.id==="rC");rs={...rEd(r),lvl:"groups",g:null,u:null};view="retedit";hist=["start"];draw()});await p.waitForTimeout(300);console.log("Zeile (Zählen, Stadtfest):",await T("#rabg"));
 await p.evaluate(()=>{rAdd("1081",{nr:"1081",name:"Schuko 20m",g:"Kabel",u:"Schuko"},3);retEdit()});await p.waitForTimeout(200);console.log("Nach +3 Schuko:",await T("#rabg"));
 await p.screenshot({path:S+"abg_zaehlen.png"});
 /* Abschließen als Teilretoure */
 await p.evaluate(()=>{rPersist(true)});await p.waitForTimeout(800);
 await p.evaluate(()=>{curRet="rC"});await V("retopen");await p.click("#rclose");await p.waitForTimeout(200);
 console.log("Dialog:",(await T(".abgdlg")).slice(0,400),"| Knopf aktiv:",await p.isEnabled("#abgok"));
 await p.screenshot({path:S+"abg_dlg.png"});
 await p.click('[data-art="teil"]');await p.click("#abgok");await p.waitForTimeout(500);
 console.log("Gespeichert:",await p.evaluate(()=>{const r=rets.find(x=>x.id==="rC");return r.closed+" "+r.art}),"| Status Stadtfest:",await p.evaluate(()=>pkState(packs.find(x=>x.id==="C")).l),"| zu prüfen:",await p.evaluate(()=>abgToCheck().map(x=>x.id).join(",")));
 /* Zu prüfen */
 await V("abgpr");console.log("Zu prüfen:",await T(".abgcard"));await p.screenshot({path:S+"abg_pr.png",fullPage:true});
 await p.click('[data-prk="0"]');await p.waitForTimeout(500);console.log("Nach Geprüft:",await p.evaluate(()=>abgToCheck().map(x=>x.id).join(",")),"| Zähler",await p.evaluate(()=>jvHot()));
 /* Mail mit Anhang */
 await p.evaluate(()=>{curRet="rA2"});await V("retopen");await p.evaluate(()=>rMailAsk(rets.find(x=>x.id==="rA2")));await p.waitForTimeout(200);console.log("Mail-Dialog:",await T(".ov .abgbox"));
 await p.click("#mtg");await p.waitForTimeout(800);console.log("Fehlerfenster:",await T(".eov"));await p.evaluate(()=>document.querySelectorAll(".eov").forEach(o=>o.remove()));const sh=await p.evaluate(()=>__shared);console.log("Geteilt:",sh&&sh.n.join(" + "),"\n  Text-Ende:",sh&&sh.text.slice(-260).replace(/\n/g," / "));
 /* Assistent */
 await V("jarvis");for(const q of ["Was muss ich prüfen?","Was fehlt bei Auftrag 260130001?","War bei Auftrag 260120001 alles zurück?"]){await p.fill("#jvaq",q);await p.click("#jvgo");await p.waitForTimeout(250);console.log("❓",q,"→",await p.textContent(".jvat"),"| Fehlerfenster:",await T(".eov"));await p.evaluate(()=>document.querySelectorAll(".eov").forEach(o=>o.remove()))}
 /* Rechte-Raster */
 await V("users");await p.waitForTimeout(300);console.log("Rechte-Zeile vorhanden:",await p.evaluate(()=>!!document.querySelector('[data-k="abg_p"]')),"| Zusammenfassung:",await p.evaluate(()=>rSum({ret_s:true,abg_p:true})));
 console.log("Fehler:",errs);await b.close()})();
