/* Test 1.73: alle Fragen aus dem Konzept + Hilfe-Bildschirm + Aktionen (Fake-Supabase, Pfad zu fakesb.js über SP) */
const {chromium}=require("playwright");const fs=require("fs");const S=(process.env.SP||"/tmp")+"/";
const t0=new Date();t0.setHours(0,0,0,0);const T0=t0.getTime(),day=864e5,D=n=>{const d=new Date(T0);d.setDate(d.getDate()+n);return d.getTime()};
const kat=JSON.parse(fs.readFileSync(__dirname+"/rkat.json","utf8")).map((x,i)=>({col:"rkat",id:"k"+i,data:x}));
const it=(nr,name,q,g,u)=>({nr,name,q,g:g||"Kabel",u:u||"32A"});
const seed=kat.concat([
 {col:"pack",id:"a",data:{ord:"260111401",ps:"a",ev:"Winterwunder Mörbisch",pl:"Marvin Wellisch",db:D(-2),de:D(60),pos:[{p:"1.7",n:16,u:"Stk",t:"Kabel CEE 32A 5pol 50m",a:"1098",f:0},{p:"1.14",n:20,u:"Stk",t:"Kabel Schuko 20m",a:"1081",f:11}],by:"u1",t:1}},
 {col:"packh",id:"a",data:{c:1,h_1_7:{q:15,alt:[{n:2,t:"32A Kabel 25m",a:"1097"}],by:"u1",t:1},h_1_14:{ok:true,fm:"miete",by:"u1",t:1},fin:{by:"u1",t:1}}},
 {col:"pack",id:"b",data:{ord:"260120001",ps:"b",ev:"Messe Linz",pl:"Max Muster",db:T0+8*36e5,de:D(4),pos:[{p:"1.1",n:4,u:"Stk",t:"Kabel CEE 32A 5pol 50m",a:"1098",f:0},{p:"1.2",n:2,u:"Stk",t:"Kabel CEE 32A 25m",a:"1097",f:1}],by:"u1",t:1}},
 {col:"pack",id:"c",data:{ord:"260130001",ps:"c",ev:"Gala Wien",pl:"Max Muster",db:D(-9),de:D(-3),pos:[{p:"1.1",n:4,u:"Stk",t:"Kabel CEE 32A 5pol 50m",a:"1098",f:0},{p:"1.2",n:6,u:"Stk",t:"Kabel Schuko 20m",a:"1081",f:0}],by:"u1",t:1}},
 {col:"packh",id:"c",data:{c:1,h_1_1:{ok:true,by:"u1",t:1},h_1_2:{ok:true,by:"u1",t:1},fin:{by:"u1",t:1}}},
 {col:"pack",id:"d",data:{ord:"260140001",ps:"d",ev:"Adventmarkt Baden",pl:"Max Muster",db:D(-1),de:D(5),pos:[{p:"1.1",n:4,u:"Stk",t:"Kabel CEE 32A 5pol 50m",a:"1098",f:0},{p:"1.2",n:3,u:"Stk",t:"Kabel Schuko 20m",a:"1081",f:0}],by:"u1",t:1}},
 {col:"packh",id:"d",data:{c:1,h_1_1:{ok:true,by:"u1",t:1}}},
 {col:"pack",id:"e",data:{ord:"260150001",ps:"e",ev:"Ice Magic",pl:"Marvin Wellisch",db:D(-20),de:D(-12),pos:[{p:"1.1",n:3,u:"Stk",t:"Kabel CEE 32A 5pol 50m",a:"1098",f:0}],by:"u1",t:1}},
 {col:"pack",id:"f",data:{ord:"260160001",ps:"f",ev:"Stadtfest Graz",pl:"Marvin Wellisch",db:D(-6),de:D(-1),pos:[{p:"1.1",n:2,u:"Stk",t:"Kabel CEE 32A 5pol 50m",a:"1098",f:0}],by:"u1",t:1}},
 {col:"retour",id:"r1",data:{ev:"Gala Wien",ord:"2601300-01",itemsJson:JSON.stringify({"1081":it("1081","Schuko 20m",6,"Kabel","Schuko")}),by:"u1",t:Date.now()}},
 {col:"retour",id:"r2",data:{ev:"Ice Magic",ord:"260150001",itemsJson:JSON.stringify({"1098":it("1098","32A Kabel 50m",2)}),by:"u1",t:D(-11),closed:true,closedT:Date.now()-36e5}},
 {col:"lists",id:"l1",data:{mode:"bleibt",ev1:"Messe Linz",ord1:"",itemsJson:JSON.stringify({a:{art:"1098",id:56},b:{art:"1081",qty:3}}),by:"u1",t:Date.now()-2*36e5}},
 {col:"lists",id:"l2",data:{mode:"weiter",ev1:"Gala Wien",ev2:"Messe Linz",itemsJson:JSON.stringify({a:{art:"1097",qty:2}}),by:"u1",t:D(-2)}},
 {col:"infos",id:"i1",data:{text:"Zwei Kabel bei Halle 3 vergessen",by:"u1",t:Date.now()-36e5,read:false}},
 {col:"defekte",id:"d1",data:{art:"VT 125A Maxi 2",ev:"Ice Magic",by:"u1",t:Date.now()-day,done:false,urg:true}},
 {col:"defekte",id:"d2",data:{art:"32A Kabel 25m",anr:"1097-12",ev:"Gala Wien",desc:"Stecker",by:"u1",t:Date.now()-10*day,done:false}},
 {col:"defekte",id:"d3",data:{art:"32A Kabel 25m",anr:"1097",ev:"Messe Linz",by:"u1",t:Date.now()-20*day,done:true,doneT:Date.now()-36e5}},
 {col:"jverin",id:"e1",data:{by:"u1",t:1,due:Date.now()-6e4,txt:"Gala Wien (Auftrag 260130001)",pk:"c",done:false}}]);
const Q=["Hilfe",
 "Was ist seit mehr als 3 Tagen überfällig?","Welcher Auftrag ist am längsten überfällig?","Was hätte gestern zurückkommen sollen?","Was kommt diese Woche noch zurück?","Wann endet die Dispo von Auftrag 260130001?","Welche Aufträge von Projektleiter Marvin sind noch offen?","Für welche zurückgekommenen Aufträge ist noch keine Retoure geschrieben?",
 "Was muss ich morgen herrichten?","Was geht übermorgen raus?","Wo gibt es heute rote Zahlen?","Ist Artikel 1098 am Dienstag verfügbar?","Welche Packscheine sind angefangen, aber nicht fertig?","Was fehlt beim Packschein von Auftrag 260140001 noch?","Wo habe ich eine Alternative eingetragen?","Wer ist Projektleiter von Auftrag 260111401?","Lies mir die Packliste von Auftrag 260130001 vor.",
 "Auf welcher Baustelle sind 50m 32A?","Auf welcher Baustelle sind 50 m 32 A?","Wo sind die Kabel 32A?","Wo ist gerade die ID 1098-56?","Wie viele 32A Kabel 50m sind gerade auf Baustellen?","Auf welcher Veranstaltung war Artikel 1098 zuletzt?","Zu welchem Auftrag könnten 4 Stück 32A 50m gehören?","Was fehlt bei Auftrag 260130001 noch?","Was bleibt auf Baustelle Messe Linz stehen?","Was geht von Baustelle Gala Wien direkt weiter zu Messe Linz?","Welche Materiallisten kamen heute von den Monteuren?",
 "Welche Defekte sind dringend?","Welche Defekte sind älter als eine Woche?","Ist Artikel 1097 schon repariert?","Welche Defekte kamen von Veranstaltung Gala Wien?","Gab es bei Artikel 1097 schon öfter Defekte?","Was wurde diese Woche repariert?","Wird ein defekter Artikel diese Woche gebraucht?",
 "Welche Retourscheine sind angefangen?","Was fehlt bei Retourschein 260130001 gegenüber der Packliste?",
 "Gibt es ungelesene Nachrichten?","Was hat Jürgen geschrieben?","Lies mir die neueste Nachricht vor.",
 "War bei Auftrag 260150001 alles zurück?","Welche Veranstaltung hatte zuletzt Fehlmaterial?","Welche Artikel fehlen am häufigsten?","Welche Aufträge waren diesen Monat unvollständig?","Wie viele Retouren gab es diese Woche?",
 "Was ist mit Auftrag 260111401?","50m 32A?","Blablabla"];
(async()=>{const b=await chromium.launch();const ctx=await b.newContext({viewport:{width:390,height:844}});
 await ctx.addInitScript(()=>{window.__said=[];localStorage.setItem("tpc_jv_engine","device");localStorage.setItem("tpc_jv_style","sachlich");window.SpeechSynthesisUtterance=class{constructor(t){this.text=t}};
  Object.defineProperty(window,"speechSynthesis",{configurable:true,value:{getVoices:()=>[{name:"G",lang:"de-DE",voiceURI:"g"}],addEventListener(){},cancel(){},speak(u){__said.push(u.text);setTimeout(()=>u.onend&&u.onend(),5)}}})});
 const p=await ctx.newPage();const errs=[];p.on("pageerror",e=>errs.push(e.message));p.on("console",m=>{if(m.type()==="error")errs.push("console: "+m.text())});
 const fk=fs.readFileSync(S+"fakesb.js","utf8").replace("const T={docs:[]","const T={docs:"+JSON.stringify(seed));
 await ctx.route("**/*",r=>{const u=r.request().url();if(u.startsWith("https://app.test/"))return r.fulfill({body:fs.readFileSync("/home/claude/gh/index.html"),contentType:"text/html"});if(u.includes("supabase-js"))return r.fulfill({body:fk,contentType:"text/javascript"});return r.fulfill({status:404,body:""})});
 await p.goto("https://app.test/");await p.waitForTimeout(900);await p.mouse.click(195,420);await p.waitForTimeout(400);
 console.log("Kachel-Zähler Lager Übersicht:",await p.evaluate(()=>jvHot()));
 const J=async()=>{await p.evaluate(()=>{document.querySelectorAll(".ov,.jvhelp").forEach(o=>o.remove());view="jarvis";hist=["start"];draw()});await p.waitForTimeout(150)};
 await J();console.log("Erinnerungs-Feld:",(await p.textContent("#jvl")).slice(0,90).replace(/\s+/g," "));
 const ask=async q=>{await J();await p.fill("#jvaq",q);await p.click("#jvgo");await p.waitForTimeout(220);
  const v=await p.evaluate(()=>view);if(v!=="jarvis")return console.log("❓ "+q+"\n   → Ansicht "+v);
  console.log("❓ "+q+"\n   → "+(await p.textContent(".jvat"))+(await p.$$eval(".jvarows > *",l=>l.length?"\n     ["+l.map(x=>x.innerText.replace(/\s+/g," ")).join(" | ")+"]":""))+(await p.$$eval(".jvacts button",l=>l.length?"\n     Knöpfe: "+l.map(x=>x.textContent).join(" | "):"")))};
 for(const q of Q)await ask(q);
 /* Rückfrage bei mehreren Artikeln → antippen */
 await ask("Wo sind die Kabel 32A?");await p.click(".jvarows .jvrow >> nth=0");await p.waitForTimeout(200);console.log("Nach Antippen der Rückfrage →",await p.textContent(".jvat"));
 await p.screenshot({path:S+"frag_baustelle.png",fullPage:true});
 /* Hilfe-Bildschirm */
 await J();await p.click("#jvhl");await p.waitForTimeout(200);
 console.log("Hilfe: Gruppen",await p.$$eval(".jvhelp .jvhg",l=>l.map(x=>x.textContent).join(" | ")),"Fragen:",await p.$$eval(".jvhelp .jvhq",l=>l.length));
 await p.screenshot({path:S+"frag_hilfe.png",fullPage:false});
 await p.fill("#jvhsq","defekt");await p.waitForTimeout(100);console.log("Suche „defekt“ →",await p.$$eval(".jvhelp .jvhq:not([hidden])",l=>l.map(x=>x.textContent).join(" | ")));
 await p.fill("#jvhsq","");await p.click('.jvhq[data-hq="Wann endet die Dispo von Auftrag X?"]');await p.waitForTimeout(150);
 console.log("Platzhalter-Frage → Eingabefeld:",await p.inputValue("#jvaq"),"| markiert:",await p.evaluate(()=>{const q=document.querySelector("#jvaq");return q.value.slice(q.selectionStart,q.selectionEnd)}));
 await p.click("#jvhl");await p.waitForTimeout(100);await p.click('.jvhq[data-hq="Welche Defekte sind dringend?"]');await p.waitForTimeout(200);console.log("Direkt-Frage aus Hilfe →",await p.textContent(".jvat"));
 /* Aktionen */
 await ask("Füge 3 Stück 32A Kabel 50m zu Retourschein 260130001 hinzu");await p.click(".jvacts button >> nth=0");await p.waitForTimeout(400);
 console.log("Hinzufügen → Ansicht",await p.evaluate(()=>view),"| Menge 1098:",await p.evaluate(()=>rs&&rs.items["1098"]&&rs.items["1098"].q));
 await p.waitForTimeout(900);console.log("gespeicherter Anteil:",await p.evaluate(()=>{const r=__T.docs.find(d=>d.col==="retour"&&d.id==="r1");return r&&r.data["pa_u1"]}));
 await ask("Markiere Auftrag 260130001 als geklärt");await p.click(".jvacts button >> nth=0");await p.waitForTimeout(400);
 console.log("Geklärt → Status:",await p.evaluate(()=>pkState(packs.find(x=>x.id==="c")).l),"| Überfällig jetzt:",await p.evaluate(()=>pkGroups().over.map(x=>x.ev).join(", ")));
 await ask("Notiere zu Auftrag 260111401: Kunde holt Schuko selbst ab");await p.waitForTimeout(300);
 await ask("Was ist mit Auftrag 260111401?");
 await p.evaluate(()=>{curPack="a";go("packopen")});await p.waitForTimeout(200);console.log("Packliste zeigt Notiz:",await p.$$eval(".pkhint",l=>l.map(x=>x.textContent).join(" | ")));
 await ask("Erinnere mich morgen um 9 an Auftrag 260120001");await p.waitForTimeout(300);
 console.log("Erinnerung gespeichert:",await p.evaluate(()=>{const e=__T.docs.filter(d=>d.col==="jverin").map(d=>d.data);const x=e[e.length-1];return x.txt+" · "+new Date(x.due).toString().slice(0,21)}));
 await ask("Melde Defekt: Kabel 32A 25 m, Stecker gebrochen");console.log("   Felder:",await p.evaluate(()=>[$("#dnart").value,$("#dnnr").value,$("#dnds").value].join(" | ")));
 await ask("Schick Projektleiter Max eine Nachfrage zu Auftrag 260140001");console.log("   Mail-Text:",(await p.inputValue("#jvmt")).replace(/\n+/g," / "));
 await ask("Auftrag 260130001 alles zurück, schreib Retoure an Projektleiter Max");
 await ask("Öffne den Retourschein für Auftrag 260130001");
 await ask("Briefing noch einmal");console.log("   Briefing gesprochen:",(await p.evaluate(()=>__said.slice(0,3).join(" / "))));
 await J();await p.evaluate(()=>__said.length=0);await p.fill("#jvaq","Lies mir die Packliste von Auftrag 260111401 vor");await p.click("#jvgo");await p.waitForTimeout(400);console.log("Vorlesen:",await p.evaluate(()=>__said.join(" / ")));
 console.log("Fehler:",errs);await b.close()})();
