/* Test 1.113: „In Arbeit“ nur, solange jemand den Retourschein bearbeitet, mit Namen (SP = Ordner mit fakesb.js) */
const {chromium}=require("playwright");const fs=require("fs");const S=(process.env.SP||"/tmp")+"/";const J=o=>JSON.stringify(o);
(async()=>{const b=await chromium.launch();const ctx=await b.newContext({viewport:{width:390,height:844}});const p=await ctx.newPage();const errs=[];p.on("pageerror",e=>errs.push(e.message));
 let fail=0;const ok=(t,c)=>{if(!c)fail++;console.log((c?"OK   ":"FEHLT")+" "+t)};const now=Date.now();
 const seed=[{col:"retour",id:"rD",data:{ev:"Nur Entwurf",ord:"1",itemsJson:"{}",pa_u1:J({"7001":{nr:"7001",name:"Schuko 100m",q:1}}),by:"u1",t:now-5e6,draft:true}},
  {col:"retour",id:"rM",data:{ev:"Max zählt",ord:"2",itemsJson:"{}",pa_u2:J({"7001":{nr:"7001",name:"Schuko 100m",q:1}}),by:"u2",t:now-5e6,ed_u2:now-10e3}},
  {col:"retour",id:"rT",data:{ev:"Tablet zählt",ord:"3",itemsJson:"{}",by:"u2",t:now-5e6,ed_u2:now-5e3,edn_u2:"Karl Klein"}},
  {col:"retour",id:"rA",data:{ev:"Alt",ord:"4",itemsJson:"{}",by:"u2",t:now-5e6,ed_u2:now-300e3}}];
 const fk=fs.readFileSync(S+"fakesb.js","utf8").replace("const T={docs:[]","const T={docs:"+J(seed)).replace('profiles:[{','profiles:[{id:"u2",name:"Max Muster",email:"m@x",role:"user",active:true,created_at:"2026-10-28"},{');
 await ctx.route("**/*",r=>{const u=r.request().url();
  if(u.startsWith("https://app.test/"))return r.fulfill({body:fs.readFileSync("/home/claude/gh/index.html"),contentType:"text/html"});
  if(u.includes("supabase-js"))return r.fulfill({body:fk,contentType:"text/javascript"});
  return r.fulfill({status:404,body:""})});
 await p.goto("https://app.test/");await p.waitForTimeout(600);await p.mouse.click(200,400);await p.waitForTimeout(400);
 await p.click('[data-g="ret"]');await p.waitForTimeout(400);
 const tag=id=>p.evaluate(id=>{const c=document.querySelector('[data-ro="'+id+'"]');const t=c&&c.querySelector(".tag");return t?t.textContent:""},id);
 ok("Entwurf ohne Bearbeiter: keine Markierung ("+await tag("rD")+")",await tag("rD")==="");
 ok("Max bearbeitet gerade: "+await tag("rM"),await tag("rM")==="In Arbeit · Max M.");
 ok("Tablet mit Namen: "+await tag("rT"),await tag("rT")==="In Arbeit · Karl K. (Tablet)");
 ok("Herzschlag alt (5 Min): keine Markierung",await tag("rA")==="");
 await p.screenshot({path:S+"inarb1.png"});
 /* Max hört auf (App weg, kein Herzschlag mehr) → nach Ablauf verschwindet es von selbst */
 await p.evaluate(()=>{window.__n=Date.now;Date.now=()=>window.__n()+120e3});await p.waitForTimeout(21000);
 ok("Nach 2 Min ohne Herzschlag von selbst weg ("+await tag("rM")+")",await tag("rM")==="");
 await p.evaluate(()=>{Date.now=window.__n});
 /* selbst bearbeiten: eigener Name, nach Verlassen weg */
 await p.click('[data-ro="rD"]');await p.waitForTimeout(300);await p.click("#red");await p.waitForTimeout(5000);
 const own=await p.evaluate(()=>rWorkTag(rets.find(r=>r.id==="rD")));ok("Beim Bearbeiten eigener Name: "+own.replace(/<[^>]*>/g,""),/In Arbeit · Jürgen H\./.test(own));
 await p.click("#bk");await p.waitForTimeout(300);await p.evaluate(()=>{view="ret";draw()});await p.waitForTimeout(5000);
 ok("Nach dem Verlassen keine Markierung ("+await tag("rD")+")",await tag("rD")==="");
 console.log("Fehler:",errs);ok("keine Seitenfehler",!errs.length);console.log(fail?"FEHLGESCHLAGEN: "+fail:"ALLES OK");await b.close()})();
