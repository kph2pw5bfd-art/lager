const {chromium}=require("playwright");const fs=require("fs");const S=process.env.SP+"/";
const now=Date.now();
const seed="const T={docs:["+JSON.stringify([
 {col:"retour",id:"r1",data:{ev:"Stadtfest Linz",ord:"2601080-01",itemsJson:JSON.stringify({"7009":{nr:"7009",name:"16A 100m",g:"Kabel",q:12}}),by:"u1",t:now-2*864e5,modT:now-3600e3,draft:true}},
 {col:"retour",id:"r2",data:{ev:"Messe Wels",ord:"2601234",itemsJson:JSON.stringify({"7018":{nr:"7018",name:"32A 50m",g:"Kabel",q:4}}),by:"u1",t:now-4*864e5,closed:true,closedT:now-864e5}},
 {col:"defekte",id:"d1",data:{art:"VT 125A Maxi 2",ev:"Ice Magic",by:"u1",t:now-864e5,done:false,urg:true}},
 {col:"defekte",id:"d2",data:{art:"Kabel 32A 25m",ev:"Stadtfest",by:"u1",t:now-3*864e5,done:false}},
 {col:"defekte",id:"d3",data:{art:"Scheinwerfer LED",ev:"Gala",by:"u1",t:now-5*864e5,done:true,doneT:now-7200e3,doneBy:"u1"}}
]).slice(1,-1)+",";
(async()=>{const b=await chromium.launch();
 for(const [w,h,owner] of [[390,844,true],[1280,860,true],[390,844,false]]){
  const ctx=await b.newContext({viewport:{width:w,height:h}});const p=await ctx.newPage();const errs=[];p.on("pageerror",e=>errs.push(e.message));
  await ctx.route("**/*",r=>{const u=r.request().url();
   if(u.startsWith("https://app.test/"))return r.fulfill({body:fs.readFileSync("/home/claude/gh/index.html"),contentType:"text/html"});
   if(u.includes("supabase-js")){let f=fs.readFileSync(S+"fakesb.js","utf8").replace("const T={docs:[",seed);if(!owner)f=f.replace('role:"admin"','role:"user"');return r.fulfill({body:f,contentType:"text/javascript"})}
   return r.fulfill({status:404,body:""})});
  await p.goto("https://app.test/");await p.waitForTimeout(700);await p.mouse.click(w/2,h/2);await p.waitForTimeout(400);
  const card=await p.$('[data-g="jarvis"]');console.log(w,owner?"Admin":"Monteur","Jarvis-Karte:",!!card);
  if(owner){await p.screenshot({path:S+"jv_home_"+w+".png",fullPage:true});await card.click();await p.waitForTimeout(600);
   console.log("  Titel:",await p.textContent("#t"),"| Status:",await p.$$eval(".jvstat",l=>l.map(x=>x.innerText.replace(/\s+/g," ")).join(" / ")));
   console.log("  Panels:",await p.$$eval(".jvlb",l=>l.map(x=>x.innerText.replace(/\s+/g," ")).join(" | ")));
   console.log("  Text:",(await p.evaluate(()=>jvText(jvData()))).slice(0,260));
   await p.screenshot({path:S+"jv_"+w+".png",fullPage:true});
   const ov=await p.evaluate(()=>document.documentElement.scrollWidth>innerWidth);console.log("  quer scrollbar:",ov);
   /* Hell/Dunkel gibt es ab 1.72 nicht mehr */
   await p.click('[data-jd="d1"]');await p.waitForTimeout(300);console.log("  Tippen Defekt ->",await p.textContent("#t"),"| body jvon:",await p.evaluate(()=>document.body.classList.contains("jvon")));
   await p.click("#bk");await p.waitForTimeout(300);console.log("  Zurück ->",await p.textContent("#t"));
   await p.evaluate(()=>{const m=document.querySelector("#jvmore");if(m)m.open=true});/* ab 1.76 unter „Mehr anzeigen“ */
   await p.click('[data-jr="r1"]');await p.waitForTimeout(300);console.log("  Tippen Retourschein ->",await p.textContent("#t"));
  }
  console.log("  Fehler:",errs);await ctx.close()}
 await b.close()})();
