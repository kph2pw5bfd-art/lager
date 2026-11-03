/* Test 1.109: abgelaufene Anmeldung → erneuern + nochmal; sonst genaue Fehlermeldung */
const {chromium}=require("playwright");const fs=require("fs");const S=(process.env.SP||"/tmp")+"/";
const seed=[{col:"titel",id:"lagerleiter",data:{name:"Lagerleiter",o:1,r:{}}}];
let bad=0;const ok=(c,m,x)=>{console.log((c?"OK   ":"FEHLER")+" "+m+(x!==undefined?": "+x:""));if(!c)bad++};
(async()=>{const b=await chromium.launch();const p=await b.newPage({viewport:{width:390,height:844}});const errs=[];p.on("pageerror",e=>errs.push(e.message));
 const fk=fs.readFileSync(S+"fakesb.js","utf8").replace("const T={docs:[]","const T={docs:"+JSON.stringify(seed));
 await p.route("**/*",r=>{const u=r.request().url();if(u.startsWith("https://app.test/"))return r.fulfill({body:fs.readFileSync("/home/claude/gh/index.html"),contentType:"text/html"});if(u.includes("supabase-js"))return r.fulfill({body:fk,contentType:"text/javascript"});return r.fulfill({status:404,body:""})});
 await p.goto("https://app.test/");await p.waitForTimeout(900);await p.mouse.click(195,420);await p.waitForTimeout(500);
 ok(await p.evaluate(()=>APPV)==="1.109","Version 1.109");
 const r1=await p.evaluate(async()=>{const o=SB.rpc.bind(SB);let n=0,ref=0;SB.auth.refreshSession=async()=>{ref++;return{}};SB.rpc=(...a)=>{n++;return n===1?Promise.resolve({data:null,error:{message:"JWT expired",code:"PGRST301"}}):o(...a)};
  await rSave(()=>db.doc("titel/lagerleiter").update({push:{pr:true}}),"ok");SB.rpc=o;return{n,ref,v:__T.docs.find(d=>d.id==="lagerleiter").data.push}});
 ok(r1.ref===1&&r1.n===2&&r1.v&&r1.v.pr===true,"abgelaufen: erneuert und gespeichert",JSON.stringify(r1));
 ok(!(await p.$(".ov")),"keine Fehlermeldung");
 await p.evaluate(async()=>{const o=SB.rpc.bind(SB);SB.rpc=()=>Promise.resolve({data:null,error:{message:"Eintrag nicht gefunden"}});await rSave(()=>db.doc("titel/x").update({r:{}}));SB.rpc=o});
 await p.waitForTimeout(200);const t=await p.textContent("body");ok(/Speichern fehlgeschlagen \(Eintrag nicht gefunden\)/.test(t),"genaue Fehlermeldung sichtbar");
 ok(!errs.length,"keine JS-Fehler",errs.join(" | "));console.log("FEHLER GESAMT:",bad);await b.close()})();
