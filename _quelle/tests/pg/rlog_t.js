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
 ok("Max sieht keinen Protokoll-Knopf",(await M.evaluate(()=>{view="appv";draw();return !!document.getElementById("rlx")}))===false);
 // Admin: Excel
 await A.evaluate(()=>{view="appv";hist=["start"];draw()});await A.waitForTimeout(400);ok("Admin: Knopf in App-Verwaltung",!!(await A.$("#rlx")));
 await A.click("#rlx");await A.waitForTimeout(200);await A.click('[data-rp="alles"]');
 const [dlo]=await Promise.all([A.waitForEvent("download",{timeout:15000}),A.click("#rlo")]);const fp=__dirname+"/protokoll.xlsx";await dlo.saveAs(fp);ok("Excel heruntergeladen",dlo.suggestedFilename().startsWith("Material-Protokoll_"),dlo.suggestedFilename());
 const X=JSON.parse(require("fs").readFileSync(fp,"utf8"));X.rows.forEach(([i,v])=>console.log("   Zeile",i,JSON.stringify(v)));
 const R=X.rows.map(r=>r[1]);const day=R.find(v=>v&&/erster Eintrag/.test(v[1]||""));ok("Tageszeile mit erstem/letztem Eintrag + Summe 10",!!day&&day[4]===10,JSON.stringify(day));
 ok("16A netto 4, 32A 4, Testlampe 2 (Manuell)",R.some(v=>v&&v[2]==="16A 100m"&&v[4]===4)&&R.some(v=>v&&v[2]==="32A 50m"&&v[4]===4)&&R.some(v=>v&&v[2]==="Testlampe"&&v[3]==="Manuell"&&v[4]===2));
 ok("Alter Schein nachgetragen ohne Uhrzeit (32A 7)",R.some(v=>v&&/nachgetragen, ohne Uhrzeit/.test(v[1]||"")&&v[4]===7));
 ok("Gesamtzeile 17",R.some(v=>v&&v[0]==="Gesamt"&&v[4]===17));
 console.log("Seitenfehler:",[M,A].flatMap(p=>p.__errs));console.log("FEHLER GESAMT:",F);await b.close()})();
