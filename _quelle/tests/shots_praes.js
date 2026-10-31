/* Bildschirmfotos mit Beispieldaten für die App-Präsentation (SP = Ordner mit fakesb.js, OUT = Zielordner) */
const {chromium}=require("playwright");const fs=require("fs");const S=(process.env.SP||"/tmp")+"/",O=(process.env.OUT||S)+"/";
const t0=new Date();t0.setHours(0,0,0,0);const T0=t0.getTime(),D=(n,h)=>{const d=new Date(T0);d.setDate(d.getDate()+n);if(h)d.setHours(h);return d.getTime()};
const ymd=t=>{const d=new Date(t);return d.getFullYear()+"-"+String(d.getMonth()+1).padStart(2,"0")+"-"+String(d.getDate()).padStart(2,"0")};
const kat=JSON.parse(fs.readFileSync(__dirname+"/rkat.json","utf8")).map((x,i)=>({col:"rkat",id:"k"+i,data:x}));
const pos=(p,n,t,a,f)=>({p,n,u:"Stk",t,a,f:f||0});const it=(nr,name,q,g)=>({nr,name,q,g:g||"Kabel",u:"32A"});const J=o=>JSON.stringify(o);
const mon=(()=>{const d=new Date(T0);const w=(d.getDay()+6)%7;d.setDate(d.getDate()-w+(w>=5?7:0));return d.getTime()})(),M=n=>{const d=new Date(mon);d.setDate(d.getDate()+n);d.setHours(7);return d.getTime()};
const seed=kat.concat([
 {col:"titel",id:"projektleiter",data:{name:"Projektleiter",o:6,r:{ret_s:true,au_s:true,au_b:true}}},
 /* Stadtfest: Endretoure, 2 fehlen */
 {col:"pack",id:"A",data:{ord:"2601098",ps:"14402",ev:"Stadtfest Eisenstadt",pl:"Jürgen Hartmann",db:D(-8,7),de:D(-2,18),pos:[pos("1",16,"Kabel CEE 32A 50m","1098"),pos("2",8,"Kabel CEE 32A 25m","1097"),pos("3",6,"Verteiler 3-fach","1026"),pos("4",20,"Schuko 20m","1081",8)],by:"u1",t:D(-10)}},
 {col:"packh",id:"A",data:{c:1,h_1:{ok:true,by:"u1",t:D(-8)},h_2:{ok:false,q:6,alt:[{n:2,t:"Kabel CEE 32A 50m",a:"1098"}],by:"u1",t:D(-8)},h_3:{ok:true,by:"u1",t:D(-8)},h_4:{ok:true,fm:"miete",by:"u1",t:D(-8)},fin:{by:"u1",t:D(-8,12)}}},
 {col:"retour",id:"rA1",data:{ev:"Stadtfest Eisenstadt",ord:"2601098",itemsJson:J({"1098":it("1098","32A Kabel 50m",10)}),by:"u1",t:D(-4),closed:true,art:"teil",closedBy:"u1",closedT:D(-4,15)}},
 {col:"retour",id:"rA2",data:{ev:"Stadtfest Eisenstadt",ord:"2601098",itemsJson:J({"1098":it("1098","32A Kabel 50m",8),"1097":it("1097","32A Kabel 25m",4),"1026":it("1026","Verteiler Schuko 3-fach Gummi",6,"Verteiler"),"1081":it("1081","Schuko 20m",12)}),by:"u1",t:D(-1),closed:true,art:"end",closedBy:"u1",closedT:D(-1,10)}},
 /* Winterwunder: zu viel zurück */
 {col:"pack",id:"B",data:{ord:"2601114",ps:"14450",ev:"Winterwunder Mörbisch",pl:"Anna Kern",db:D(-6,7),de:D(-1,18),pos:[pos("1",4,"Kabel CEE 32A 25m","1097"),pos("2",6,"Schuko 20m","1081")],by:"u1",t:D(-7)}},
 {col:"packh",id:"B",data:{c:1,h_1:{ok:true,by:"u1",t:1},h_2:{ok:true,by:"u1",t:1},fin:{by:"u1",t:D(-6)}}},
 {col:"retour",id:"rB",data:{ev:"Winterwunder Mörbisch",ord:"2601114",itemsJson:J({"1097":it("1097","32A Kabel 25m",6),"1081":it("1081","Schuko 20m",6)}),by:"u1",t:D(-1),closed:true,art:"end",closedBy:"u1",closedT:D(-1,9)}},
 /* Messe: überfällig */
 {col:"pack",id:"E",data:{ord:"2601087",ps:"14390",ev:"Messe Wieselburg",pl:"Max Muster",db:D(-12,7),de:D(-3,18),pos:[pos("1",12,"Schuko 20m","1081"),pos("2",2,"Verteiler 3-fach","1026")],by:"u1",t:D(-13)}},
 {col:"packh",id:"E",data:{c:1,h_1:{ok:true,by:"u1",t:1},h_2:{ok:true,by:"u1",t:1},fin:{by:"u1",t:D(-12)}}},
 /* Woche: Herrichten */
 {col:"pack",id:"C",data:{ord:"2601131",ps:"14501",ev:"Firmenfeier Parndorf",pl:"Jürgen Hartmann",db:M(0),de:M(3),pos:[pos("1",10,"Kabel CEE 32A 50m","1098"),pos("2",4,"Kabel CEE 32A 25m","1097"),pos("3",4,"Verteiler 3-fach","1026"),pos("4",30,"Schuko 20m","1081",10),pos("5",6,"Defender Midi","2001")],by:"u1",t:D(-2)}},
 {col:"packh",id:"C",data:{c:1,h_1:{ok:true,by:"u1",t:Date.now()-36e5},h_2:{ok:false,q:3,by:"u1",t:Date.now()-3e6},h_3:{ok:true,by:"u1",t:Date.now()-2e6}}},
 {col:"pack",id:"G",data:{ord:"2601200",ps:"14520",ev:"Weihnachtsmarkt Spittelberg 2026",pl:"Jürgen Hartmann",db:M(1),de:M(40),pos:[pos("1",8,"Schuko 20m","1081"),pos("2",2,"Verteiler 3-fach","1026")],zus:[{ps:"14533",t:D(-1),by:"u1",v:2,pos:[pos("1",4,"Kabel CEE 32A 25m","1097")]}],by:"u1",t:D(-3)}},
 {col:"packh",id:"G",data:{c:1,hd:{d:ymd(M(2)),why:"Aufbau verschoben",by:"u1",t:1},zd_14533:{d:ymd(M(3)),by:"u1",t:1},zf_14533:{t:0}}},
 {col:"pack",id:"H",data:{ord:"2601210",ps:"14540",ev:"Adventmarkt Baden",pl:"Anna Kern",db:M(3),de:M(30),pos:[pos("1",6,"Schuko 20m","1081")],by:"u1",t:D(-1)}},
 {col:"pack",id:"I",data:{ord:"2601220",ps:"14560",ev:"Eislaufplatz Rathaus",pl:"Max Muster",db:M(8),de:M(60),pos:[pos("1",14,"Kabel CEE 32A 50m","1098")],by:"u1",t:D(-1)}},
 {col:"pack",id:"K",data:{ord:"2601225",ps:"14570",ev:"Silvesterpfad Graz",pl:"Max Muster",db:M(10),de:M(14),pos:[pos("1",22,"Kabel CEE 32A 50m","1098")],by:"u1",t:D(-1)}},
 /* offener Retourschein zum Zählen */
 {col:"retour",id:"rC",data:{ev:"Messe Wieselburg",ord:"2601087",itemsJson:J({"1081":it("1081","Schuko 20m",8,"Kabel"),"1026":it("1026","Verteiler Schuko 3-fach Gummi",1,"Verteiler")}),by:"u1",t:Date.now()-36e5}},
 /* Defekte */
 {col:"defekte",id:"d1",data:{art:"Kabel CEE 32A 25m",ev:"Stadtfest Eisenstadt",txt:"Stecker gebrochen",urg:true,by:"u1",t:D(-1,9)}},
 {col:"defekte",id:"d2",data:{art:"Verteiler Schuko 3-fach Gummi",ev:"Messe Wieselburg",txt:"Schalter klemmt",by:"u1",t:D(-2,9)}},
 /* Antwort Projektleiter */
 {col:"plaw",id:"a1",data:{pk:"A",ord:"2601098",ev:"Stadtfest Eisenstadt",k:"c:1097",name:"32A Kabel 25m",n:2,u:"Stk",typ:"anders",to:"B",toEv:"Winterwunder Mörbisch",toOrd:"2601114",txt:"Hat Anna mitgenommen",by:"u1",t:Date.now()-18e5}},
 {col:"wbnote",id:"n1",data:{txt:"Neue Gitterboxen bestellen",by:"u1",t:D(-2)}}]);
(async()=>{const b=await chromium.launch();
 async function sess(role,rolle,fn){const docs=seed.concat(rolle?[{col:"rolle",id:"u1",data:rolle}]:[]);
  const fk=fs.readFileSync(S+"fakesb.js","utf8").replace("const T={docs:[]","const T={docs:"+JSON.stringify(docs)).replace('role:"admin"','role:"'+role+'"');
  const ctx=await b.newContext({viewport:{width:390,height:844},deviceScaleFactor:2});await ctx.addInitScript(()=>{try{localStorage.setItem("tpc_jv_engine","device")}catch(e){}});
  const p=await ctx.newPage();p.on("pageerror",e=>console.log("JS:",e.message));
  await ctx.route("**/*",r=>{const u=r.request().url();if(u.startsWith("https://app.test/"))return r.fulfill({body:fs.readFileSync("/home/claude/gh/index.html"),contentType:"text/html"});if(u.includes("supabase-js"))return r.fulfill({body:fk,contentType:"text/javascript"});
   if(u.includes("/npm/")||u.includes("unpkg")){const m=u.match(/(cdn\.jsdelivr\.net\/npm|unpkg\.com)\/(.+)$/);if(m){const f="/opt/npm-tools/node_modules/"+m[2].replace(/@[\d.]+/,"");if(fs.existsSync(f))return r.fulfill({body:fs.readFileSync(f),contentType:"text/javascript"})}}
   return r.fulfill({status:404,body:""})});
  await p.goto("https://app.test/");await p.waitForTimeout(4200);await p.mouse.click(195,420);await p.waitForTimeout(600);
  const V=async(v,pre)=>{await p.evaluate(([v,pre])=>{document.querySelectorAll(".ov").forEach(o=>o.remove());if(pre)eval(pre);view=v;hist=["start"];draw();window.scrollTo(0,0)},[v,pre]);await p.waitForTimeout(450)};
  const shot=async(n,full)=>{await p.screenshot({path:O+n+".png",fullPage:!!full});console.log("Bild",n)};
  await fn(p,V,shot);await ctx.close()}
 await sess("admin",null,async(p,V,shot)=>{
  await V("start");await shot("01_start");
  await V("jarvis");await p.evaluate(()=>{document.querySelectorAll("#jvmore").forEach(d=>d.open=false)});await shot("02_uebersicht");
  await p.click('[data-jt="over"]').catch(()=>{});await p.waitForTimeout(200);
  await V("pack","pkTab=new Date().getDay()%6===0?'w1':'w0'");await shot("03_wand");
  await V("packopen","curPack='C';pkHf='alle'");await p.evaluate(()=>window.scrollTo(0,330));await p.waitForTimeout(150);await shot("04_herrichten");
  await V("retedit","rs={...rEd(rets.find(x=>x.id==='rC')),lvl:'groups',g:null,u:null}");await shot("05_retourschein");
  await V("pkabg","curPack='A'");await shot("06_abgleich");
  await V("abgzv");await shot("07_zuviel");
  await V("plin");await shot("10_antworten");
  await V("wb");await p.evaluate(()=>window.scrollTo(0,0));await shot("11_wochenbericht");
  await V("defnew");await shot("12_defekt");
  await V("def").catch(()=>{});await shot("12b_defekte");
 });
 await sess("user",{t:"projektleiter"},async(p,V,shot)=>{
  await V("au");await shot("08_meine_auftraege");
  await V("auopen","curAu='A'");await shot("09_auftrag_detail");
 });
 await b.close()})();
