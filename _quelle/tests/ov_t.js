/* Test 1.65: Übersicht (Handy: Fächer mit Umschalter, breit: zweispaltige Tagesliste), Wochenende -> Freitag, verschoben, Nicht/Teilweise hergerichtet */
const {chromium}=require("playwright");const fs=require("fs");const S=(process.env.SP||"/tmp")+"/";
const t0=new Date();t0.setHours(0,0,0,0);const T0=t0.getTime(),day=864e5;const D=n=>{const d=new Date(T0);d.setDate(d.getDate()+n);return d.getTime()};
const pos=[{p:"1.1",n:2,u:"Stk",t:"VT",a:"1048",f:0},{p:"1.2",n:4,u:"Stk",t:"Kabel",a:"1097",f:2},{p:"1.3",n:1,u:"Stk",t:"Heizer",a:"1182",f:0}];
const mk=(id,ev,db)=>({col:"pack",id,data:{ord:"26"+id.length+"00"+id.charCodeAt(0),ps:id,ev,pl:"Max PL",db,de:db+6*day,pos,by:"u1",t:Date.now()}});
const ymd=t=>{const d=new Date(t);return d.getFullYear()+"-"+String(d.getMonth()+1).padStart(2,"0")+"-"+String(d.getDate()).padStart(2,"0")};
const seed=[mk("late0","Messe Wels",D(-2)+8*36e5),mk("late1","Adventmarkt Baden",D(-1)+7*36e5),mk("fin29","Ice Magic",D(-1)),mk("today1","Winterwunder Mörbisch",T0+8*36e5),mk("todayfin","Stadtfest Graz",T0+7*36e5),
 mk("sat","Lichterfest Krems",D(1)+9*36e5),mk("vorg","Gala Wien",D(3)+13*36e5),mk("next","Messe Linz",D(5)),mk("versch","Firmenfeier Tulln",T0+10*36e5),mk("k46","Christkindlmarkt Wien",D(11)),mk("k47","Eislaufplatz Graz",D(18)),mk("spaet","Silvesterpfad Wien",D(46)),mk("retdone","Alte Gala",T0),
 {col:"packh",id:"late1",data:{c:1,h_1_1:{ok:true,by:"u1",t:Date.now()}}},{col:"packh",id:"fin29",data:{c:1,fin:{by:"u1",t:Date.now()}}},{col:"packh",id:"todayfin",data:{c:1,fin:{by:"u1",t:Date.now()}}},
 {col:"packh",id:"today1",data:{c:1,h_1_1:{ok:true,by:"u1",t:Date.now()}}},{col:"packh",id:"vorg",data:{c:1,hd:{d:ymd(T0),by:"u1",t:Date.now()}}},{col:"packh",id:"versch",data:{c:1,hd:{d:ymd(D(6)),why:"Material fehlt",by:"u1",t:Date.now()}}},
 {col:"retour",id:"r1",data:{ev:"Alte Gala",ord:"269"+"00"+"114",itemsJson:"{}",by:"u1",t:Date.now(),closed:true}}];
seed.find(x=>x.id==="retdone").data.ord="2690011400".slice(0,8);seed.find(x=>x.id==="r1").data.ord=seed.find(x=>x.id==="retdone").data.ord;
(async()=>{const b=await chromium.launch();
 for(const [w,h,name] of [[390,844,"handy"],[1280,900,"breit"]]){
  const ctx=await b.newContext({viewport:{width:w,height:h}});const p=await ctx.newPage();const errs=[];p.on("pageerror",e=>errs.push(e.message));
  const fk=fs.readFileSync(S+"fakesb.js","utf8").replace("const T={docs:[]","const T={docs:"+JSON.stringify(seed));
  await ctx.route("**/*",r=>{const u=r.request().url();if(u.startsWith("https://app.test/"))return r.fulfill({body:fs.readFileSync("/home/claude/gh/index.html"),contentType:"text/html"});if(u.includes("supabase-js"))return r.fulfill({body:fk,contentType:"text/javascript"});return r.fulfill({status:404,body:""})});
  await p.goto("https://app.test/");await p.waitForTimeout(800);await p.mouse.click(w/2,420);await p.waitForTimeout(400);
  await p.click('[data-g="pack"]');await p.waitForTimeout(300);console.log("===== "+name+" | Titel:",await p.textContent("#t"),"| heute:",new Date(T0).toDateString());
  const txt=()=>p.evaluate(()=>document.querySelector("#app").innerText.replace(/\n+/g," ¦ "));
  if(name==="handy"){
   console.log("Diese Woche:",await txt());await p.screenshot({path:S+"ov_handy_w0.png",fullPage:true});
   await p.click('[data-pkd]');await p.waitForTimeout(150);console.log("Vergangener Tag aufgeklappt:",await p.evaluate(()=>document.querySelector(".pktray.past.open")?document.querySelector(".pktray.past.open").innerText.replace(/\n+/g," ¦ "):"nein"));
   await p.click('[data-pkt="w1"]');await p.waitForTimeout(150);console.log("Nächste Woche:",await txt());await p.screenshot({path:S+"ov_handy_w1.png",fullPage:true});
   await p.click('[data-pkt="sp"]');await p.waitForTimeout(150);console.log("Später:",await txt());
   await p.click('[data-pk="k46"]');await p.waitForTimeout(200);console.log("Tipp → Ansicht:",await p.evaluate(()=>view+" "+curPack));await p.click("#bk");await p.waitForTimeout(200);console.log("zurück →",await p.evaluate(()=>view));
   await p.click("#pkall");await p.waitForTimeout(200);console.log("Alle Packlisten:",await p.evaluate(()=>[...document.querySelectorAll("#app h3.pkh")].map(e=>e.textContent).join(" | ")),"| Tags:",await p.evaluate(()=>[...document.querySelectorAll('[data-pk="late0"] .tag,[data-pk="late1"] .tag')].map(e=>e.textContent).join(" / ")));
  }else{console.log("Breit:",await txt());await p.screenshot({path:S+"ov_breit.png",fullPage:true});
   await p.setViewportSize({width:390,height:844});await p.waitForTimeout(200);console.log("nach Schmal-Ziehen Umschalter da:",await p.evaluate(()=>!!document.querySelector(".pktabs")));}
  console.log("Fehler:",errs);await ctx.close()}
 await b.close()})();
