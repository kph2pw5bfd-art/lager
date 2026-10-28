const {chromium}=require("playwright");const H=require("./pgharness.js");
const U={A:"00000000-0000-0000-0000-00000000000a",L:"00000000-0000-0000-0000-00000000000b",M:"00000000-0000-0000-0000-00000000000c",X:"00000000-0000-0000-0000-00000000000f"};
const N={A:"Jürgen Hartmann",L:"Lena Lagerleiter",M:"Max Monteur",X:"Xaver Lagerarbeiter"};
H.setupDb("app",{pre:Object.keys(U).map(k=>`insert into auth.users(id,email,raw_user_meta_data) values ('${U[k]}','${k}@x','{"name":"${N[k]}"}');`).join("\n")+`
update profiles set active=true;
insert into docs(col,id,data) values ('lists','l1','{"by":"${U.M}","t":1793000000000,"mode":"bleibt","ev1":"Ice Magic","ord1":"2601","itemsJson":"{}","chk":false}');`,
 post:`insert into docs(col,id,data) values ('rolle','${U.L}','{"t":"lagerleiter","x":{}}'),('rolle','${U.M}','{"t":"monteur","x":{}}'),('rolle','${U.X}','{"t":"lagerarbeiter","x":{}}');`});
let F=0;const ok=(t,c,x)=>{F+=!c;console.log((c?"OK   ":"FEHLT")+" "+t+(x!==undefined?" → "+x:""))};
(async()=>{const b=await chromium.launch();const pages=[];const srv=H.makeSrv("app",pages,10);
 const M=await H.openPage(b,U.M,srv,pages),X=await H.openPage(b,U.X,srv,pages),L=await H.openPage(b,U.L,srv,pages);
 const open=async p=>{await p.evaluate(()=>{cur="l1";view="scan";hist=["start","home"];draw()});await p.waitForTimeout(300)};
 const info=p=>p.evaluate(()=>({st:(document.querySelector("#app").innerText.match(/Status: [^\n]*/)||[""])[0],ck:document.querySelector("#ck")&&document.querySelector("#ck").textContent,ed:!!document.querySelector("#ed"),nt:document.querySelector("#nt")&&document.querySelector("#nt").disabled}));
 await open(M);let i=await info(M);console.log("   Max offen:",JSON.stringify(i));ok("Monteur: kein Abschließen-Knopf, Bearbeiten ja",!i.ck&&i.ed&&!i.nt);
 await open(X);i=await info(X);ok("Lagerarbeiter: 'Abschließen'",i.ck==="Abschließen",i.ck);
 await X.click("#ck");await X.waitForTimeout(200);const q=await X.evaluate(()=>document.querySelector(".ov").textContent);ok("Rückfrage beim Abschließen",/abschließen\?/.test(q),q.slice(0,60));
 await X.evaluate(()=>{const b=[...document.querySelectorAll(".ov button")].find(x=>/Ja|OK/i.test(x.textContent));b.click()});await X.waitForTimeout(1500);
 i=await info(X);ok("Status bei Xaver 'Abgeschlossen', Knopf 'Wieder öffnen'",/Abgeschlossen \(Xaver/.test(i.st)&&i.ck==="Wieder öffnen",i.st);
 await open(M);i=await info(M);console.log("   Max nach Abschluss:",JSON.stringify(i));ok("Max live: Abgeschlossen, kein Bearbeiten, Bemerkung gesperrt",/Abgeschlossen/.test(i.st)&&!i.ed&&i.nt&&!i.ck);
 const r=await M.evaluate(async()=>await save(it=>{it.x={art:"1234",qty:1}}));ok("Max kann in abgeschlossene Liste nichts mehr scannen",r===false);
 await M.evaluate(()=>{view="home";hist=[];draw()});await M.waitForTimeout(300);const chips=await M.evaluate(()=>[...document.querySelectorAll("[data-lf]")].map(x=>x.textContent).join(","));ok("Filter heißt 'Abgeschlossen'",/Abgeschlossen/.test(chips)&&!/Geprüft/.test(chips),chips);
 ok("Löschen (Wischen) nur Lagerleiterin",(await L.evaluate(()=>can("mat_l")))&&!(await X.evaluate(()=>can("mat_l")))&&!(await M.evaluate(()=>can("mat_l"))));
 await L.evaluate(()=>{view="users";tOpen.clear();tOpen.add("lagerarbeiter");draw()});await L.waitForTimeout(400);
 const rows=await L.evaluate(()=>{const d=document.querySelector('[data-tbox="lagerarbeiter"]');return d.querySelector(".tsum").textContent+" || "+[...d.querySelectorAll(".rmh b")].map(x=>x.textContent).join(",")});ok("Rechte-Seite: Bereich Materialliste vorhanden",/Materialliste: abschließen/.test(rows)&&/^.*\|\| Materialliste,Defekte/.test(rows),rows);
 await L.screenshot({path:__dirname+"/mat_rechte.png",fullPage:false});
 await L.click('[data-tc="lagerarbeiter"][data-k="mat_b"]');await L.waitForTimeout(2500);await open(X);i=await info(X);ok("Recht weggenommen → Xaver kein Wieder-öffnen mehr",!i.ck,JSON.stringify(i));
 console.log("Seitenfehler:",[M,X,L].flatMap(p=>p.__errs));console.log("FEHLER GESAMT:",F);await b.close()})();
