const {chromium}=require("playwright");const fs=require("fs");
const T={docs:[{col:"lager",id:"u2",data:{}},
  {col:"retour",id:"rold",data:{ev:"Alter Schein",ord:"111",rem:"",itemsJson:JSON.stringify({"7009":{nr:"7009",name:"16A 100m",g:"Kabel",u:"16A",q:4}}),by:"u1",t:1,draft:true}}],
 profiles:[{id:"u1",name:"Jürgen Hartmann",email:"j@x",role:"admin",active:true,created_at:"2026-10-01"},{id:"u2",name:"Max Monteur",email:"m@x",role:"user",active:true,created_at:"2026-10-02"}]};
const pages=[];const LAT=+process.env.LAT||40;
const bc=p=>pages.forEach(pg=>pg.evaluate(x=>window.__rt&&window.__rt(x),p).catch(()=>{}));
function srv(q){return new Promise(r=>setTimeout(()=>r(srv0(q)),LAT))}
function srv0(q){
 if(q.rpc==="doc_update"){const a=q.a,r=T.docs.find(x=>x.col===a.p_col&&x.id===a.p_id);if(!r)return{data:null,error:{message:"Eintrag nicht gefunden"}};r.data={...r.data,...a.p_patch};bc({table:"docs",eventType:"UPDATE",new:JSON.parse(JSON.stringify(r))});return{data:JSON.parse(JSON.stringify(r.data)),error:null}}
 if(q.rpc)return{data:null,error:null};
 const t=T[q.tab];
 if(q.op==="upsert"){const p=JSON.parse(JSON.stringify(q.payload));const i=t.findIndex(r=>r.col===p.col&&r.id===p.id);if(i>=0)t[i]=p;else t.push(p);bc({table:q.tab,eventType:i>=0?"UPDATE":"INSERT",new:p});return{data:q.one?p:[p],error:null}}
 const ok=r=>q.f.every(([ty,k,v])=>ty==="eq"?r[k]===v:v.includes(r[k]));let rows=t.filter(ok);
 if(q.op==="delete"){T[q.tab]=t.filter(r=>!rows.includes(r));rows.forEach(r=>bc({table:q.tab,eventType:"DELETE",old:r}));return{data:null,error:null}}
 if(q.rng)rows=rows.slice(q.rng[0],q.rng[1]+1);rows=JSON.parse(JSON.stringify(rows));return q.one?{data:rows[0]||null,error:null}:{data:rows,error:null}}
(async()=>{const b=await chromium.launch();const errs=[];
 const mk=async uid=>{const ctx=await b.newContext({viewport:{width:390,height:844}});await ctx.addInitScript(u=>{window.__UID=u},uid);await ctx.exposeFunction("__srv",srv);
  await ctx.route("**/*",r=>{const u=r.request().url();if(u.startsWith("https://app.test/"))return r.fulfill({body:fs.readFileSync("/home/claude/gh/index.html"),contentType:"text/html"});
   if(u.includes("supabase-js"))return r.fulfill({body:fs.readFileSync(__dirname+"/fakesb2.js"),contentType:"text/javascript"});return r.fulfill({status:404,body:""})});
  const p=await ctx.newPage();p.on("pageerror",e=>errs.push(uid+" "+e.message));await p.goto("https://app.test/");await p.waitForTimeout(600);await p.mouse.click(200,420);await p.waitForTimeout(300);pages.push(p);return p};
 const A=await mk("u1"),B=await mk("u2");
 const items=p=>p.evaluate(()=>rs?Object.fromEntries(Object.entries(rs.items).map(([k,v])=>[v.name,v.q])):null);
 const shown=p=>p.evaluate(()=>{const r=rets.find(x=>x.ev==="Messe Wels");return r?Object.fromEntries(Object.values(rIt(r)).map(v=>[v.name,v.q])):null});
 const toGrp=p=>p.evaluate(()=>{rs.q="";rs.lvl="groups";rs.g=null;rs.u=null;retEdit()});
 const add=async(p,u,nr,n,minus)=>{await toGrp(p);await p.click('[data-rg="Kabel"]');await p.click('[data-ru="'+u+'"]');await p.click('[data-ra="'+nr+'"]');if(minus&&await p.$("#pms"))await p.click("#pms");await p.click('[data-pn="'+n+'"]');await p.click("#pdo")};
 const ok=(t,c)=>console.log((c?"OK   ":"FEHLT")+" "+t);
 // 1) Jürgen legt einen neuen Schein an, 5x 16A 100m
 await A.click('[data-g="ret"]');await A.waitForTimeout(200);await A.click('[data-rv="new"]');await A.waitForTimeout(200);
 await A.fill("#rev","Messe Wels");await A.fill("#rord","2601234-01");await A.waitForTimeout(800);await A.click("#rgo");await A.waitForTimeout(200);
 await add(A,"16A","7009",5);await A.waitForTimeout(1500);
 // 2) Max öffnet denselben Schein
 await B.click('[data-g="ret"]');await B.waitForTimeout(300);
 const rid=await B.evaluate(()=>{const r=rets.find(x=>x.ev==="Messe Wels");return r&&r.id});ok("Max sieht neuen Schein live",!!rid);
 await B.evaluate(id=>{curRet=id;go("retopen")},rid);await B.waitForTimeout(300);await B.click("#radd");await B.waitForTimeout(5500);
 const wa=await A.evaluate(()=>{const e=document.querySelector(".rwho");return e&&e.textContent}),wb=await B.evaluate(()=>{const e=document.querySelector(".rwho");return e&&e.textContent});
 console.log("   Hinweis bei Jürgen:",wa);console.log("   Hinweis bei Max:",wb);ok("Hinweis 'arbeitet auch' auf beiden",/Max/.test(wa||"")&&/Jürgen/.test(wb||""));
 // 3) gleichzeitig: Max 3x 32A, Jürgen +2 16A
 await Promise.all([add(B,"32A","7018",3),add(A,"16A","7009",2)]);await A.waitForTimeout(2000);
 console.log("   Jürgen sieht:",JSON.stringify(await items(A)),"Max sieht:",JSON.stringify(await items(B)));
 ok("Beide sehen 16A=7 und 32A=3",JSON.stringify(await items(A))===JSON.stringify({"16A 100m":7,"32A 50m":3})&&JSON.stringify(await items(B))===JSON.stringify(await items(A)));
 // 4) gleicher Artikel gleichzeitig: beide +1 auf 16A
 await Promise.all([add(A,"16A","7009",1),add(B,"16A","7009",1)]);await A.waitForTimeout(2000);
 ok("Gleicher Artikel gleichzeitig wird zusammengezählt (16A=9): "+JSON.stringify(await items(A))+" / "+JSON.stringify(await items(B)),(await items(A))["16A 100m"]===9&&(await items(B))["16A 100m"]===9);
 // 5) Max zieht 1x 32A ab
 await add(B,"32A","7018",1,true);await B.waitForTimeout(2000);
 ok("Abziehen kommt bei Jürgen an (32A=2): "+JSON.stringify(await items(A)),(await items(A))["32A 50m"]===2);
 // 6) Bemerkung von Max, Jürgen übernimmt sie
 await B.evaluate(()=>{rs.lvl="sum";retEdit()});await B.waitForTimeout(200);await B.fill("#rrem","Ein Kabel defekt");await B.waitForTimeout(1500);await B.evaluate(()=>document.activeElement.blur());
 ok("Bemerkung kommt bei Jürgen an",(await A.evaluate(()=>rs.rem))==="Ein Kabel defekt");
 // 7) Max speichert endgültig, Jürgen geht zurück
 await B.click("#rsave");await B.waitForTimeout(1200);
 await A.evaluate(()=>{rs.lvl="sum";retEdit()});await A.waitForTimeout(300);await A.click("#rsave");await A.waitForTimeout(1500);
 console.log("   Gespeichert in Liste – Jürgen:",JSON.stringify(await shown(A)),"Max:",JSON.stringify(await shown(B)));
 ok("Nach Speichern beider: 16A=9, 32A=2",JSON.stringify(await shown(A))===JSON.stringify({"16A 100m":9,"32A 50m":2})&&JSON.stringify(await shown(B))===JSON.stringify(await shown(A)));
 const d=T.docs.find(x=>x.id===rid).data;console.log("   DB-Felder:",Object.keys(d).join(","),"| draft:",d.draft,"| rem:",d.rem);
 await A.waitForTimeout(5000);const ed=Object.entries(T.docs.find(x=>x.id===rid).data).filter(([k])=>k.startsWith("ed_"));ok("Arbeitet-Hinweis nach Verlassen zurückgesetzt "+JSON.stringify(ed),ed.every(([,v])=>v===0));
 // 8) alter Schein (vor dem Umbau): Grundstand bleibt, Ergänzung kommt dazu
 await A.evaluate(()=>{curRet="rold";go("retopen")});await A.waitForTimeout(300);await A.click("#radd");await A.waitForTimeout(300);await add(A,"16A","7009",1);await A.waitForTimeout(1500);
 const o=T.docs.find(x=>x.id==="rold").data;ok("Alter Schein: 4+1=5 angezeigt, Grundstand unverändert: "+JSON.stringify(await items(A))+" pa_u1="+o.pa_u1,(await items(A))["16A 100m"]===5&&JSON.parse(o.itemsJson)["7009"].q===4);
 console.log("Seitenfehler:",errs);await b.close()})();
