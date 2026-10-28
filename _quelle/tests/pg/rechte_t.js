const {chromium}=require("playwright");const H=require("./pgharness.js");
const U={A:"00000000-0000-0000-0000-00000000000a",L:"00000000-0000-0000-0000-00000000000b",M:"00000000-0000-0000-0000-00000000000c",P:"00000000-0000-0000-0000-00000000000d",W:"00000000-0000-0000-0000-00000000000e"};
const N={A:"Jürgen Hartmann",L:"Lena Lagerleiter",M:"Max Monteur",P:"Paul Projektleiter",W:"Willi Werkstatt"};
const users=Object.keys(U).map(k=>`insert into auth.users(id,email,raw_user_meta_data) values ('${U[k]}','${k.toLowerCase()}@x','{"name":"${N[k]}"}');`).join("\n");
H.setupDb("app",{pre:users+`
update profiles set active=true;
insert into docs(col,id,data) values ('werkstatt','${U.W}','{}'),
 ('defekte','d1','{"by":"${U.M}","art":"Kabel 16A","ev":"Messe","desc":"Stecker kaputt","t":1793000000000,"done":false}'),
 ('defekte','d2','{"by":"${U.W}","art":"Lampe","ev":"Zelt","desc":"flackert","t":1793000000001,"done":false}'),
 ('retour','r1','{"ev":"Messe Wels","ord":"2601","rem":"","itemsJson":"{\\"7009\\":{\\"nr\\":\\"7009\\",\\"name\\":\\"16A 100m\\",\\"g\\":\\"Kabel\\",\\"u\\":\\"16A\\",\\"q\\":4}}","by":"${U.A}","t":1793000000000,"draft":false}'),
 ('infos','i1','{"by":"${U.M}","t":1793000000000,"text":"Bitte Kabel nachbestellen","read":false}'),
 ('infos','i2','{"by":"${U.P}","t":1793000000001,"text":"Projekt verschoben","read":false}');`,
 post:`insert into docs(col,id,data) values ('rolle','${U.L}','{"t":"lagerleiter","x":{}}'),('rolle','${U.M}','{"t":"monteur","x":{}}'),('rolle','${U.P}','{"t":"projektleiter","x":{}}');`});
let F=0;const ok=(t,c,extra)=>{F+=!c;console.log((c?"OK   ":"FEHLT")+" "+t+(extra!==undefined?" → "+extra:""))};
(async()=>{const b=await chromium.launch();const pages=[];const srv=H.makeSrv("app",pages,15);
 const A=await H.openPage(b,U.A,srv,pages),L=await H.openPage(b,U.L,srv,pages),M=await H.openPage(b,U.M,srv,pages),P=await H.openPage(b,U.P,srv,pages),W=await H.openPage(b,U.W,srv,pages);
 const start=p=>p.evaluate(()=>{view="start";hist=[];draw();return [...document.querySelectorAll(".hb b,[data-g]")].map(e=>e.dataset.g||"").filter(Boolean).join(",")});
 const txt=p=>p.evaluate(()=>document.getElementById("app").innerText.replace(/\s+/g," "));
 const wait=ms=>new Promise(r=>setTimeout(r,ms));
 // 1) Startseiten
 const sm=await start(M),sp=await start(P),sl=await start(L),sw=await start(W),sa=await start(A);
 console.log("   Monteur:",sm,"\n   Projektleiter:",sp,"\n   Lagerleiterin:",sl,"\n   Werkstatt:",sw,"\n   Admin:",sa);
 ok("Monteur: kein Retourschein, keine Verwaltung",!/ret|appv|users/.test(sm));
 ok("Projektleiter: Retourschein ja, Verwaltung nein",/ret/.test(sp)&&!/appv|users/.test(sp));
 ok("Lagerleiterin: Retourschein + App- + Benutzerverwaltung",/ret/.test(sl)&&/appv/.test(sl)&&/users/.test(sl));
 ok("Admin: alles",/ret/.test(sa)&&/appv/.test(sa)&&/users/.test(sa));
 // 2) Defekte
 const dfl=p=>p.evaluate(()=>vdefs().map(d=>d.art).sort().join(","));
 ok("Monteur sieht nur eigenen Defekt",(await dfl(M))==="Kabel 16A",await dfl(M));
 ok("Werkstatt (altes Häkchen) sieht alle Defekte",(await dfl(W))==="Kabel 16A,Lampe",await dfl(W));
 ok("Projektleiter sieht keine fremden Defekte (DB)",(await P.evaluate(()=>defs.length))===0);
 await W.evaluate(()=>{curDef="d1";view="defopen";draw()});await W.waitForTimeout(200);ok("Werkstatt hat 'Als erledigt' + Rückmeldung",!!(await W.$("#dd"))&&!(await W.$eval("#dfb",e=>e.disabled)));
 // 3) Retourschein nur sehen (Projektleiter)
 await P.evaluate(()=>{curRet="r1";view="retopen";hist=["start","ret"];draw()});await P.waitForTimeout(300);
 const pb=await P.$$eval("#app button",l=>l.map(x=>x.id||x.dataset.rv).filter(Boolean));console.log("   Knöpfe Projektleiter:",pb.join(","));
 ok("Projektleiter: Excel ja, Bearbeiten/Hinzufügen/Abschließen/Löschen/Neu nein",pb.includes("rxl")&&!pb.some(x=>["red","radd","rclose","rdel","new","rhed","rphadd"].includes(x)));
 await P.evaluate(()=>{rs={...rEd(rets[0]),lvl:"groups"};view="retedit";draw()});await P.waitForTimeout(200);ok("Projektleiter kommt nicht in den Bearbeiten-Modus",(await P.evaluate(()=>view))==="ret");
 // 4) Infos
 ok("Monteur sieht nur eigene Info",(await M.evaluate(()=>infos.filter(i=>can("inf_s")||i.by===me).length))===1);
 await L.evaluate(()=>{view="info";draw()});await L.waitForTimeout(200);ok("Lagerleiterin sieht alle Infos",(await L.evaluate(()=>infos.length))===2);
 await L.evaluate(()=>{curInfo="i2";view="infoopen";draw()});await L.waitForTimeout(200);ok("Lagerleiterin: Lesen-bestätigen + Löschen-Knopf",!!(await L.$("#irk"))&&!!(await L.$("#idel")));
 await L.click("#idel");await L.click("#a2y").catch(()=>{});await L.evaluate(()=>{const b=[...document.querySelectorAll(".ov button")].find(x=>/Ja|Löschen|OK/i.test(x.textContent));if(b)b.click()});await wait(1200);
 ok("Info gelöscht (DB + Paul sieht sie nicht mehr)",(await L.evaluate(()=>infos.length))===1&&(await P.evaluate(()=>infos.length))===0);
 // 5) Benutzerverwaltung der Lagerleiterin
 await L.evaluate(()=>{view="users";hist=["start"];draw()});await L.waitForTimeout(400);const lt=await txt(L);
 ok("Lagerleiterin sieht Titel-Bereich",/Titel der Benutzer/.test(lt)&&/Titel und ihre Rechte/.test(lt));
 ok("Lagerleiterin hat KEIN 'Zum Admin machen'",!/Zum Admin machen/.test(lt));
 ok("Admin-Konto bei Lagerleiterin ohne Sperren-Knopf",!(await L.$('[data-ua="'+"00000000-0000-0000-0000-00000000000a"+'"]')));
 await L.screenshot({path:__dirname+"/users_l.png",fullPage:true});
 // Titel von Max auf Lagerarbeiter -> Max bekommt live Retourscheine
 await L.selectOption('[data-ut="'+U.M+'"]',"lagerarbeiter");await wait(2500);
 const sm2=await start(M);ok("Max (jetzt Lagerarbeiter) sieht Retourschein live",/ret/.test(sm2),sm2);
 ok("Max lädt Retourscheine nach (DB-Rechte)",(await M.evaluate(()=>rets.length))===1);
 // Extra-Recht: Max Defekte sehen
 await L.evaluate(()=>{view="users";draw()});await L.waitForTimeout(300);
 await L.evaluate(u=>{const d=document.querySelector('details[data-xu="'+u+'"]');d.open=true},U.M);await L.click('[data-xc="'+U.M+'"][data-k="def_s"]');await wait(2500);
 ok("Max bekommt Extra-Recht Defekte sehen → sieht alle",(await dfl(M))==="Kabel 16A,Lampe",await dfl(M));
 // Projektleiter-Titel: Bearbeiten an -> Paul bekommt Knöpfe
 await A.evaluate(()=>{view="users";hist=["start"];draw()});await A.waitForTimeout(400);await A.click('[data-tbox="projektleiter"] summary');await A.click('[data-tc="projektleiter"][data-k="ret_b"]');await wait(2500);
 await P.evaluate(()=>{curRet="r1";view="retopen";draw()});await P.waitForTimeout(300);const pb2=await P.$$eval("#app button",l=>l.map(x=>x.id).filter(Boolean));
 ok("Projektleiter mit Bearbeiten: Bearbeiten ja, Löschen nein",pb2.includes("red")&&!pb2.includes("rdel"),pb2.join(","));
 // Bearbeiten-Häkchen setzt Sehen automatisch, Sehen weg nimmt alles weg
 await A.click('[data-tbox="monteur"] summary');await A.click('[data-tc="monteur"][data-k="def_l"]');await wait(1500);const mr=await A.evaluate(()=>TIT.monteur.r);ok("Löschen-Häkchen setzt Sehen mit",mr.def_s&&mr.def_l,JSON.stringify(mr));
 await A.click('[data-tc="monteur"][data-k="def_s"]');await wait(1500);const mr2=await A.evaluate(()=>TIT.monteur.r);ok("Sehen aus nimmt Löschen mit weg",!mr2.def_s&&!mr2.def_l,JSON.stringify(mr2));
 // Neuer Titel, umbenennen, löschen
 await L.evaluate(()=>{view="users";draw()});await L.waitForTimeout(300);await L.click("#tnew");await L.fill("#tdn","Fahrer");await L.click("#tdo");await wait(1500);
 const tid=await L.evaluate(()=>Object.keys(TIT).find(k=>TIT[k].name==="Fahrer"));ok("Neuer Titel 'Fahrer' angelegt",!!tid);
 await L.click('[data-tren="'+tid+'"]');await L.fill("#tdn","Fahrer LKW");await L.click("#tdo");await wait(1500);ok("Umbenannt",(await L.evaluate(t=>TIT[t]&&TIT[t].name,tid))==="Fahrer LKW");
 await L.selectOption('[data-ut="'+U.P+'"]',tid);await wait(1500);
 await L.click('[data-tdel="'+tid+'"]');await L.evaluate(()=>{const b=[...document.querySelectorAll(".ov button")].find(x=>/Ja|Löschen|OK/i.test(x.textContent));if(b)b.click()});await wait(2000);
 ok("Titel gelöscht, Paul ohne Titel",!(await L.evaluate(t=>TIT[t],tid))&&(await L.evaluate(u=>ROL[u].t,U.P))==="");
 // Monteur darf nichts verwalten (DB)
 const r=await M.evaluate(async()=>{try{await db.doc("titel/monteur").update({r:{v_app:true}});return "geschrieben"}catch(e){return "abgelehnt"}});ok("Max kann Titel nicht per Trick ändern",r==="abgelehnt");
 await A.evaluate(()=>{view="users";tOpen.clear();tOpen.add("lagerarbeiter");draw()});await A.waitForTimeout(300);await A.screenshot({path:__dirname+"/users_a.png",fullPage:true});
 const errs=[A,L,M,P,W].flatMap(p=>p.__errs);console.log("Seitenfehler:",errs.slice(0,8));console.log("FEHLER GESAMT:",F);await b.close()})();
