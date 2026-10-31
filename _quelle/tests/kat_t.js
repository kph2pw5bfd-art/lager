/* Test 1.79: Artikel aus dem Packschein in die Artikelliste übernehmen (App-Verwaltung) bzw. als fehlend melden – SP = Ordner mit fakesb.js */
const {chromium}=require("playwright");const fs=require("fs");const S=(process.env.SP||"/tmp")+"/";
const t0=new Date();t0.setHours(0,0,0,0);const T0=t0.getTime(),D=n=>{const d=new Date(T0);d.setDate(d.getDate()+n);return d.getTime()};
const kat=JSON.parse(fs.readFileSync(__dirname+"/rkat.json","utf8")).map((x,i)=>({col:"rkat",id:"k"+i,data:x}));
const seed=kat.concat([{col:"pack",id:"P",data:{ord:"260190001",ps:"14900",ev:"Weinfest Gumpoldskirchen",pl:"Max Muster",db:T0+8*36e5,de:D(3),
 pos:[{p:"1",n:4,u:"Stk",t:"Kabel CEE 32A 5pol 50m",a:"1098",f:0},{p:"2",n:6,u:"Stk",t:"Kabelbrücke 5-Kanal gelb",a:"7788",f:0},{p:"3",n:2,u:"Stk",t:"Kette ca 1m",a:"",f:0}],by:"u1",t:Date.now()}}]);
(async()=>{const b=await chromium.launch();const ctx=await b.newContext({viewport:{width:390,height:844}});
 const p=await ctx.newPage();const errs=[];p.on("pageerror",e=>errs.push(e.message));
 const fk=fs.readFileSync(S+"fakesb.js","utf8").replace("const T={docs:[]","const T={docs:"+JSON.stringify(seed));
 await ctx.route("**/*",r=>{const u=r.request().url();if(u.startsWith("https://app.test/"))return r.fulfill({body:fs.readFileSync("/home/claude/gh/index.html"),contentType:"text/html"});if(u.includes("supabase-js"))return r.fulfill({body:fk,contentType:"text/javascript"});return r.fulfill({status:404,body:""})});
 await p.goto("https://app.test/");await p.waitForTimeout(900);await p.mouse.click(195,420);await p.waitForTimeout(500);
 const T=async sel=>(await p.$$eval(sel,l=>l.map(x=>x.innerText.replace(/\s+/g," ").trim()))).join(" | ");
 await p.evaluate(()=>{curPack="P";view="packopen";hist=["start"];draw()});await p.waitForTimeout(300);
 const grp=()=>p.$$eval(".pkg,.pkt",l=>l.map(x=>x.classList.contains("pkg")?"["+x.textContent+"]":x.textContent.replace(/\s+/g," ")).join(" → "));
 console.log("Vorher:",await grp());
 /* Admin */
 await p.click('[data-pe="1"] >> nth=0');await p.waitForTimeout(150);console.log("Dialog-Hinweis:",await T(".pknokat"));
 await p.screenshot({path:S+"kat_dlg.png"});
 await p.click("#pekat");await p.waitForTimeout(200);
 console.log("Artikel-Fenster:",await p.evaluate(()=>["eg","enr","enm"].map(i=>i+"="+document.getElementById(i).value).join(" ; ")),"| Hinweis:",await T(".ov .card p.mute"));
 await p.fill("#eu","Zubehör");await p.fill("#enm","Kabelbrücke 5-Kanal");await p.evaluate(()=>{if(!$("#eg").value)$("#eg").value="Kabel"});await p.click("#esv");await p.waitForTimeout(600);
 console.log("Gespeichert:",await p.evaluate(()=>{const a=rkat.find(x=>x.nr==="7788");return a?a.name+" · "+a.g+" · "+a.u:"–"}));
 console.log("Nachher:",await grp());
 /* ohne Nummer */
 await p.click('[data-pe="2"] >> nth=0');await p.waitForTimeout(150);await p.click("#pekat");await p.waitForTimeout(200);console.log("Ohne Nummer – Hinweis:",await T(".ov .card p.mute"));
 await p.evaluate(()=>document.querySelectorAll(".ov").forEach(o=>o.remove()));
 /* Kollege ohne App-Verwaltung */
 await p.evaluate(()=>{window.__can=can;window.can=k=>k==="v_app"?false:__can(k);draw()});await p.waitForTimeout(200);
 await p.click('[data-pe="2"] >> nth=0');await p.waitForTimeout(150);console.log("Kollege sieht:",await T(".pknokat"));await p.click("#pekat");await p.waitForTimeout(500);
 console.log("Fehlartikel:",await p.evaluate(()=>__T.docs.filter(d=>d.col==="fehlartikel").map(d=>d.data.name+" · "+d.data.src+" · "+d.data.ev+" · "+d.data.qty+" Stk").join(" | ")));
 await p.evaluate(()=>document.querySelectorAll(".ov").forEach(o=>o.remove()));
 /* Admin übernimmt aus „Fehlende Artikel“ */
 await p.evaluate(()=>{window.can=__can;view="appv";hist=["start"];draw()});await p.waitForTimeout(800);
 console.log("Fehlende Artikel:",await T("#fbx .card"));
 await p.click("[data-fadd]");await p.waitForTimeout(200);console.log("Vorbelegt:",await p.evaluate(()=>["eg","enr","enm"].map(i=>i+"="+document.getElementById(i).value).join(" ; ")));
 await p.fill("#eg","Zubehör");await p.click("#esv");await p.waitForTimeout(600);
 console.log("In Artikelliste:",await p.evaluate(()=>!!rkat.find(x=>x.name==="Kette ca 1m")),"| Fehlartikel übrig:",await p.evaluate(()=>__T.docs.filter(d=>d.col==="fehlartikel").length),"| Karte weg:",await p.evaluate(()=>!document.querySelector("[data-fadd]")));
 console.log("Fehler:",errs);await b.close()})();
