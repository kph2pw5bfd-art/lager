/* Test 1.165: Zubehör-Artikel als Alternative in der Packliste zählt beim Rücklauf (SP = Ordner mit fakesb.js) */
const {chromium}=require("playwright");const fs=require("fs");const S=(process.env.SP||"/tmp")+"/";const J=o=>JSON.stringify(o);
const t0=new Date();t0.setHours(0,0,0,0);const D=n=>t0.getTime()+n*864e5+8*36e5;
(async()=>{const b=await chromium.launch();let fail=0;const ok=(t,c)=>{if(!c)fail++;console.log((c?"OK   ":"FEHLT")+" "+t)};const errs=[];
 const pos=[{p:"1",n:4,u:"Stk",t:"Zahlenschloss",a:"",f:0},{p:"2",n:2,u:"Stk",t:"Kabel",a:"1098",f:0}];
 const seed=[{col:"rkat",id:"k1",data:{nr:"4560",name:"Kette inkl. Zahlenschloss",g:"Zubehör"}},{col:"rkat",id:"k2",data:{nr:"4561",name:"Kabelbinder",g:"Zubehör"}},{col:"rkat",id:"k3",data:{nr:"1098",name:"32A Kabel 50m",g:"Kabel"}},
  {col:"pack",id:"A",data:{ord:"2601300",ps:"1",ev:"Gala",pl:"Max Muster",db:D(-3),de:D(3),pos,zus:[],by:"u1",t:D(-5)}},
  {col:"packh",id:"A",data:{fin:{by:"u1",t:1},h_1:{q:0,alt:[{n:4,t:"Kette inkl. Zahlenschloss",a:"4560"}],by:"u1",t:1},h_2:{ok:true,by:"u1",t:1}}},
  {col:"retour",id:"r1",data:{ord:"2601300",ev:"Gala",itemsJson:J({"4560":{nr:"4560",name:"Kette inkl. Zahlenschloss",g:"Zubehör",q:4},"4561":{nr:"4561",name:"Kabelbinder",g:"Zubehör",q:10}}),by:"u1",t:D(0)}}];
 const fk=fs.readFileSync(S+"fakesb.js","utf8").replace("const T={docs:[]","const T={docs:"+J(seed));
 const ctx=await b.newContext({viewport:{width:390,height:900}});const p=await ctx.newPage();p.on("pageerror",e=>errs.push(e.message));
 await ctx.route("**/*",r=>{const u=r.request().url();if(u.startsWith("https://app.test/"))return r.fulfill({body:fs.readFileSync("/home/claude/gh/index.html"),contentType:"text/html"});if(u.includes("supabase-js"))return r.fulfill({body:fk,contentType:"text/javascript"});return r.fulfill({status:404,body:""})});
 await p.goto("https://app.test/");await p.waitForTimeout(800);await p.mouse.click(200,400);await p.waitForTimeout(400);
 const R=await p.evaluate(()=>{const B=abgBal(packs.find(x=>x.id==="A"));return B.L.map(e=>[e.code,e.name,e.soll,e.back])});console.log("   ",J(R));
 const k=R.find(e=>e[0]==="4560");ok("Kette 4 von 4 zurück",k&&k[2]===4&&k[3]===4);ok("Kabelbinder (Zubehör, nicht in Packliste) zählt nicht",!R.some(e=>e[0]==="4561"));
 ok("Keine JS-Fehler "+errs.join("|"),!errs.length);await b.close();console.log(fail?"FEHLER: "+fail:"ALLES OK")})();
