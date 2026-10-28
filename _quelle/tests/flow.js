
const {chromium}=require("playwright");const fs=require("fs");
const S="/tmp/claude-0/-home-claude/f80e2216-de95-5392-89aa-0da763a211a4/scratchpad/";
(async()=>{const b=await chromium.launch();const ctx=await b.newContext({viewport:{width:400,height:800}});const p=await ctx.newPage();
 const errs=[];p.on("pageerror",e=>errs.push("PAGEERR "+e.message));p.on("console",m=>{if(m.type()==="error")errs.push("CONSOLE "+m.text())});
 await ctx.route("**/*",r=>{const u=r.request().url();
  if(u.startsWith("https://app.test/"))return r.fulfill({body:fs.readFileSync("/home/claude/gh/index.html"),contentType:"text/html"});
  if(u.includes("supabase-js"))return r.fulfill({body:fs.readFileSync(S+"fakesb.js"),contentType:"text/javascript"});
  return r.fulfill({status:404,body:""})});
 await p.goto("https://app.test/");await p.waitForTimeout(800);
 const T=async()=>p.evaluate(()=>JSON.parse(JSON.stringify(__T.docs.filter(d=>d.col==="retour"))));
 const txt=async()=>(await p.textContent("#app")).replace(/\s+/g," ").slice(0,160);
 const back=async()=>{await p.click("#bk");await p.waitForTimeout(900)};
 console.log("START:",await txt());
 await p.click('[data-g="ret"]');await p.waitForTimeout(300);
 await p.click('[data-rv="new"]');await p.waitForTimeout(300);
 await p.fill("#rev","Ice Magic Innsbruck");await p.fill("#rord","2601080-01");await p.waitForTimeout(900);
 console.log("1 nach Tippen, DB:",JSON.stringify((await T()).map(d=>[d.id,d.data.ev,d.data.draft,d.data.itemsJson])));
 await p.click("#rgo");await p.waitForTimeout(300);
 await p.click('[data-rg="Kabel"]');await p.waitForTimeout(200);await p.click('[data-ru="16A"]');await p.waitForTimeout(200);
 await p.click('.rtile >> nth=0');await p.waitForTimeout(200);await p.click('[data-pn="5"]');await p.click('#pdo');await p.waitForTimeout(900);
 console.log("2 nach 5 Stk, DB:",JSON.stringify((await T()).map(d=>[d.data.ev,d.data.itemsJson])));
 await back();console.log("3 zurück ->",await txt());await back();await back();console.log("4 zurück ->",await txt());await back();console.log("5 zurück ->",await txt());
 console.log("   DB:",JSON.stringify((await T()).map(d=>[d.data.ev,d.data.draft,d.data.itemsJson])));
 // Liste
 console.log("6 Liste:",await txt());
 // öffnen, Artikel hinzufügen, zurück
 await p.click('[data-ro]');await p.waitForTimeout(300);await p.click("#radd");await p.waitForTimeout(300);
 await p.click('[data-rg="Kabel"]');await p.waitForTimeout(200);await p.click('[data-ru="32A"]');await p.waitForTimeout(200);
 await p.click('.rtile >> nth=1');await p.waitForTimeout(200);await p.click('[data-pn="3"]');await p.click('#pdo');await p.waitForTimeout(200);
 await back();await back();await back();console.log("7 nach Hinzufügen+zurück ->",await txt());
 console.log("   DB:",JSON.stringify((await T()).map(d=>[d.data.draft,d.data.itemsJson])));
 // offline: Änderung, App schließen -> lokal gesichert, später synchronisiert
 await p.click("#red");await p.waitForTimeout(300);await p.evaluate(()=>window.__offline=true);
 await p.click('[data-rq] >> nth=1');await p.waitForTimeout(900);await back();
 console.log("8 offline, lokal:",await p.evaluate(()=>localStorage.getItem("tpc_retour_backup")));
 await p.evaluate(()=>{window.__offline=false;window.dispatchEvent(new Event("online"))});await p.waitForTimeout(2500);
 console.log("9 wieder online, DB:",JSON.stringify((await T()).map(d=>[d.data.itemsJson])),"lokal:",await p.evaluate(()=>localStorage.getItem("tpc_retour_backup")));
 // Speichern-Knopf
 console.log('  Ansicht vor 10:',await txt());if(await p.$('[data-ro]'))await p.click('[data-ro]');await p.waitForTimeout(300);await p.click("#red");await p.waitForTimeout(300);await p.click("#rsave");await p.waitForTimeout(600);
 console.log("10 nach Speichern:",await txt(),"draft:",(await T())[0].data.draft);
 console.log("FEHLER:",errs.filter(e=>!/404|Failed to load resource|ExcelJS|ZXing/.test(e)));await b.close()})();
