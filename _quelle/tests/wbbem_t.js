/* Test 1.91: Bemerkungen zu Besprechungspunkten (mehrere, Name+Datum, ändern/löschen eigene, auch bei erledigten, im Ausdruck/PDF klein darunter) */
const {chromium}=require("playwright");const fs=require("fs");const S=(process.env.SP||"/tmp")+"/";
const at=d=>Date.now()+d*864e5;
const seed=[{col:"wbnote",id:"n1",data:{txt:"Neue Gitterboxen bestellen",by:"u1",t:at(-3),done:null,b_x1:{txt:"Angebot von Firma X kommt Mittwoch",by:"u2",t:at(-1)}}},
 {col:"wbnote",id:"n2",data:{txt:"Regal 4 umbauen",by:"u1",t:at(-6),done:{by:"u1",t:at(-2)}}}];
let F=0;const ok=(t,c,v)=>{F+=!c;console.log((c?"OK   ":"FEHLT")+" "+t+(v!==undefined?": "+v:""))};
(async()=>{const b=await chromium.launch();
 for(const role of ["admin","user"]){const docs=seed.concat(role==="user"?[{col:"titel",id:"tl",data:{name:"Lagerarbeiter",o:3,r:{jv_s:true}}},{col:"rolle",id:"u1",data:{t:"tl"}}]:[]);
  const fk=fs.readFileSync(S+"fakesb.js","utf8").replace("const T={docs:[]","const T={docs:"+JSON.stringify(docs)).replace('role:"admin"','role:"'+role+'"').replace('profiles:[{id:"u1"','profiles:[{id:"u2",name:"Sonja Hexer",email:"s@x",role:"user",active:true,created_at:"1"},{id:"u1"');
  const ctx=await b.newContext({viewport:{width:390,height:844}});const p=await ctx.newPage();const errs=[];p.on("pageerror",e=>errs.push(e.message));
  await ctx.route("**/*",r=>{const u=r.request().url();if(u.startsWith("https://app.test/"))return r.fulfill({body:fs.readFileSync("/home/claude/gh/index.html"),contentType:"text/html"});if(u.includes("supabase-js"))return r.fulfill({body:fk,contentType:"text/javascript"});
   if(u.includes("pdf-lib"))return r.fulfill({body:fs.readFileSync("/opt/npm-tools/node_modules/pdf-lib/dist/pdf-lib.min.js"),contentType:"text/javascript"});return r.fulfill({status:404,body:""})});
  await p.goto("https://app.test/");await p.waitForTimeout(900);await p.mouse.click(195,420);await p.waitForTimeout(500);
  const T=async sel=>(await p.$$eval(sel,l=>l.map(x=>x.innerText.replace(/\s+/g," ").trim()))).join(" | ");
  await p.evaluate(()=>{view="wb";hist=["start"];draw()});await p.waitForTimeout(400);
  console.log("--",role,"--");
  ok("Vorhandene Bemerkung sichtbar",/Angebot von Firma X/.test(await T(".wbedit .wbb")),await T(".wbedit .wbb"));
  const own=await p.$$eval('.wbedit [data-wbbe]',l=>l.length);ok(role==="admin"?"Admin darf fremde ändern":"Fremde Bemerkung nicht änderbar",role==="admin"?own===1:own===0,own);
  await p.click('[data-wbbo="n1"]');await p.waitForTimeout(250);await p.fill('[data-wbbi="n1"]',"20 Stück bestellt, Lieferung KW 47");await p.press('[data-wbbi="n1"]',"Enter");await p.waitForTimeout(400);
  const B=await p.evaluate(()=>wbBems(WBN.find(n=>n.id==="n1")).map(x=>x.txt+"|"+x.by).join(" ; "));ok("Zweite Bemerkung gespeichert",/Angebot.*u2 ; 20 Stück bestellt.*\|u1$/.test(B),B);
  ok("Im Bericht klein unter dem Punkt",/Neue Gitterboxen bestellen.*Firma X.*20 Stück bestellt/.test(await T(".wbpaper:not(.wbprint) .wbn")),await T(".wbpaper:not(.wbprint) .wbn"));
  /* ändern + löschen eigene */
  const k=await p.evaluate(()=>wbBems(WBN.find(n=>n.id==="n1")).find(x=>x.by==="u1").id);
  await p.click('[data-wbbe="n1|'+k+'"]');await p.waitForTimeout(250);ok("Ändern: Feld vorbelegt",(await p.inputValue('[data-wbbi="n1"]'))==="20 Stück bestellt, Lieferung KW 47");
  await p.fill('[data-wbbi="n1"]',"20 Stück bestellt, Lieferung KW 48");await p.click('[data-wbbs="n1"]');await p.waitForTimeout(400);
  ok("Geändert",await p.evaluate(k=>{const x=WBN.find(n=>n.id==="n1")[k];return x.txt.endsWith("KW 48")&&!!x.mod},k));
  /* erledigter Punkt */
  await p.click(".wbdone summary");await p.waitForTimeout(150);await p.click('[data-wbbo="n2"]');await p.waitForTimeout(250);ok("Erledigt-Liste bleibt offen",await p.evaluate(()=>document.querySelector(".wbdone").open));
  await p.fill('[data-wbbi="n2"]',"Fotos im Teams-Kanal");await p.click('[data-wbbs="n2"]');await p.waitForTimeout(400);ok("Bemerkung bei erledigtem Punkt",await p.evaluate(()=>wbBems(WBN.find(n=>n.id==="n2")).length===1));
  if(role==="admin"){await p.screenshot({path:S+"wbbem_app.png",fullPage:true});
   const b64=await p.evaluate(async()=>{const u=await wbPdf(wbData());let s="";for(let i=0;i<u.length;i+=8192)s+=String.fromCharCode(...u.subarray(i,i+8192));return btoa(s)});fs.writeFileSync(S+"wbbem.pdf",Buffer.from(b64,"base64"))}
  await p.click('[data-wbbx="n1|'+k+'"]');await p.waitForTimeout(200);await p.click(".ov .btn:not(.ghost)");await p.waitForTimeout(400);
  ok("Gelöscht",await p.evaluate(k=>!WBN.find(n=>n.id==="n1")[k],k));
  ok("keine JS-Fehler",!errs.length,errs.join(" / "));await ctx.close()}
 console.log("FEHLER GESAMT:",F);await b.close()})();
