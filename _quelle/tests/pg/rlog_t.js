const {chromium}=require("playwright");const H=require("./pgharness.js");const {execFileSync}=require("child_process");
const U={A:"00000000-0000-0000-0000-00000000000a",M:"00000000-0000-0000-0000-00000000000c"};
H.setupDb("app",{pre:`insert into auth.users(id,email,raw_user_meta_data) values ('${U.A}','a@x','{"name":"Jürgen Hartmann"}'),('${U.M}','m@x','{"name":"Max Monteur"}');update profiles set active=true;
insert into docs(col,id,data) values ('rkat','k1','{"nr":"7009","name":"16A 100m","g":"Kabel","u":"16A","o":1}'),('rkat','k2','{"nr":"7018","name":"32A 50m","g":"Kabel","u":"32A","o":2}'),
 ('retour','alt1','{"ev":"Alte Messe","ord":"1","t":1761800000000,"itemsJson":"{\\"7018\\":{\\"nr\\":\\"7018\\",\\"name\\":\\"32A 50m\\",\\"g\\":\\"Kabel\\",\\"q\\":7}}","by":"${U.A}"}');`,
 post:`insert into docs(col,id,data) values ('rolle','${U.M}','{"t":"lagerarbeiter","x":{}}');`});
let F=0;const ok=(t,c,x)=>{F+=!c;console.log((c?"OK   ":"FEHLT")+" "+t+(x!==undefined?" → "+x:""))};
const q=s=>execFileSync("psql",["-h","/home/postgres/pgt","-p","5499","-U","postgres","-X","-q","-t","-A","-d","app","-c",s]).toString().trim();
(async()=>{const b=await chromium.launch();const pages=[];const srv=H.makeSrv("app",pages,10);
 const M=await H.openPage(b,U.M,srv,pages),A=await H.openPage(b,U.A,srv,pages);
 const add=async(p,u,nr,n,minus)=>{await p.evaluate(()=>{rs.q="";rs.lvl="groups";rs.g=null;rs.u=null;retEdit()});await p.click('[data-rg="Kabel"]');await p.click('[data-ru="'+u+'"]');await p.click('[data-ra="'+nr+'"]');if(minus)await p.click("#pms");await p.click('[data-pn="'+n+'"]');await p.click("#pdo");await p.waitForTimeout(200)};
 await M.click('[data-g="ret"]');await M.click('[data-rv="new"]');await M.fill("#rev","Messe Wels");await M.fill("#rord","2601234");await M.click("#rgo");await M.waitForTimeout(300);
 await add(M,"16A","7009",5);await add(M,"16A","7009",1,true);await add(M,"32A","7018",3);
 await M.click("#rman");await M.fill("#mnm","Testlampe");await M.fill("#mq","2");await M.click("#mok");await M.waitForTimeout(300);
 // offline: Eintrag wird gemerkt und später nachgeschickt
 await M.evaluate(()=>{Object.defineProperty(navigator,"onLine",{get:()=>window.__off?false:true,configurable:true});window.__off=true});await add(M,"32A","7018",1);
 await M.waitForTimeout(2500);const qlen=await M.evaluate(()=>rlQ().length);ok("Offline: Einträge warten im Gerät",qlen>=1,qlen);
 await M.evaluate(()=>{window.__off=false;window.dispatchEvent(new Event("online"))});await M.waitForTimeout(4000);
 ok("Nach online: Warteschlange leer",(await M.evaluate(()=>rlQ().length))===0);
 const rows=q("select data->>'name'||':'||(data->>'d') from docs where col='rlog' and data->>'nt' is null order by data->>'t'").split("\n").join(", ");console.log("   Protokoll:",rows);
 ok("Alle Änderungen protokolliert (+5, −1, +3, +2 Lampe, +1)",rows==="16A 100m:5, 16A 100m:-1, 32A 50m:3, Testlampe:2, 32A 50m:1");
 ok("Max kann Protokoll nicht lesen",(await M.evaluate(async()=>{const {data}=await SB.from("docs").select("id").eq("col","rlog");return (data||[]).length}))===0);
 // Admin mischt beim selben Schein mit (+1 16A), und es gibt einen zweiten Schein, der NICHT in der Excel landen darf
 const rid=q("select id from docs where col='retour' and data->>'ev'='Messe Wels'");
 await A.evaluate(id=>{curRet=id;view="retopen";hist=["start","ret"];draw()},rid);await A.waitForTimeout(300);await A.click("#radd");await A.waitForTimeout(300);await add(A,"16A","7009",1);await A.waitForTimeout(2500);
 await A.evaluate(()=>{rs=null;view="ret";hist=["start"];draw()});await A.waitForTimeout(200);await A.click('[data-rv="new"]');await A.fill("#rev","Anderer Schein");await A.click("#rgo");await A.waitForTimeout(300);await add(A,"32A","7018",9);await A.waitForTimeout(2500);
 ok("Max sieht keinen Protokoll-Knopf im Schein",(await M.evaluate(id=>{rs=null;curRet=id;view="retopen";draw();return !!document.getElementById("rplx")},rid))===false);
 ok("Gesamtliste in App-Verwaltung ist weg",(await A.evaluate(()=>{rs=null;view="appv";draw();return !document.getElementById("rlx")&&!/Material-Protokoll/.test(document.getElementById("app").innerText)})));
 await A.evaluate(id=>{rs=null;curRet=id;view="retopen";hist=["start","ret"];draw()},rid);await A.waitForTimeout(300);ok("Admin: Knopf „Protokoll als Excel“ im Schein",(await A.textContent("#rplx"))==="Protokoll als Excel");
 const dlx=async(p,fp)=>{const [d]=await Promise.all([p.waitForEvent("download",{timeout:15000}),p.click("#rplx")]);await d.saveAs(fp);return {name:d.suggestedFilename(),X:JSON.parse(require("fs").readFileSync(fp,"utf8"))}};
 let {name,X}=await dlx(A,__dirname+"/p1.xlsx");ok("Dateiname",name==="Protokoll Messe Wels 2601234.xlsx",name);
 X.rows.forEach(([i,v])=>console.log("   Zeile",i,JSON.stringify(v)));
 const R=X.rows.map(r=>r[1]);
 ok("Kopf: Veranstaltung + Auftragsnummer",R.some(v=>v&&v[0]==="Messe Wels · Auftragsnummer 2601234"));
 ok("Bearbeitet von: Max + Jürgen",R.some(v=>v&&v[0]==="Bearbeitet von: Max Monteur, Jürgen Hartmann"));
 const day=R.find(v=>v&&/erster Eintrag/.test(v[1]||""));ok("Tageszeile mit erstem/letztem Eintrag + Summe 11",!!day&&day[4]===11,JSON.stringify(day));
 ok("16A netto 5 (Max 4 + Jürgen 1), 32A 4, Testlampe 2",R.some(v=>v&&v[2]==="16A 100m"&&v[4]===5)&&R.some(v=>v&&v[2]==="32A 50m"&&v[4]===4)&&R.some(v=>v&&v[2]==="Testlampe"&&v[3]==="Manuell"&&v[4]===2));
 ok("Anderer Schein (32A 9) NICHT enthalten",!R.some(v=>v&&v[4]===9));
 const tot=(await A.evaluate(id=>rTot(rIt(rets.find(x=>x.id===id))),rid));ok("Gesamt = Summe im Schein ("+tot+")",R.some(v=>v&&v[0]==="Gesamt"&&v[4]===tot));
 // alter, nachgetragener Schein
 await A.evaluate(()=>{curRet="alt1";view="retopen";draw()});await A.waitForTimeout(300);({name,X}=await dlx(A,__dirname+"/p2.xlsx"));const R2=X.rows.map(r=>r[1]);
 ok("Alter Schein: nachgetragen ohne Uhrzeit, Ersteller als Bearbeiter, 32A 7",R2.some(v=>v&&/nachgetragen, ohne Uhrzeit/.test(v[1]||"")&&v[4]===7)&&R2.some(v=>v&&v[0]==="Bearbeitet von: Jürgen Hartmann"),JSON.stringify(R2.slice(0,4)));
 console.log("Seitenfehler:",[M,A].flatMap(p=>p.__errs));console.log("FEHLER GESAMT:",F);await b.close()})();
