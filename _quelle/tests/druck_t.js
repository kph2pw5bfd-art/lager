/* Test 1.90: Packliste drucken/teilen – epirent-Reihenfolge, Zusatz eingerechnet, Ersatz, Fremdmiete, Lager 55, Mail-Text (SP = Ordner mit fakesb.js) */
const {chromium}=require("playwright");const fs=require("fs");const S=(process.env.SP||"/tmp")+"/";
const t0=new Date();t0.setHours(0,0,0,0);const T0=t0.getTime(),D=(n,h)=>{const d=new Date(T0);d.setDate(d.getDate()+n);if(h)d.setHours(h);return d.getTime()};
const ymd=t=>{const d=new Date(t);return d.getFullYear()+"-"+String(d.getMonth()+1).padStart(2,"0")+"-"+String(d.getDate()).padStart(2,"0")};
const kat=JSON.parse(fs.readFileSync(__dirname+"/rkat.json","utf8")).map((x,i)=>({col:"rkat",id:"k"+i,data:x}));
const pos=(p,n,t,a,f)=>({p,n,u:"Stk",t,a,f:f||0});
const seed=kat.concat([
 {col:"rkat",id:"l55",data:{nr:"3010",name:"Kabelbrücke 5-Kanal",g:"Zubehör Bau",u:"",l55:true,o:99999}},
 {col:"pack",id:"14501",data:{ord:"2601131",ps:"14501",ev:"Firmenfeier Parndorf",pl:"Jürgen Hartmann",db:D(0,7),de:D(3,18),
  pos:[pos("1.1",10,"Kabel CEE 32A 50m","1098"),pos("1.2",4,"Kabel CEE 32A 25m","1097"),pos("1.3",4,"Verteiler 3-fach","1026"),pos("1.4",30,"Schuko 20m","1081",10),pos("1.5",8,"Schuko 10m","1080",3),pos("1.6",6,"Defender Midi","2001"),pos("1.7",6,"Kabelbrücke 5-Kanal","3010")],
  zus:[{ps:"14533",t:D(0,9),by:"u1",v:2,pos:[pos("1",2,"Schuko 20m","1081"),pos("2",2,"Verteiler 32A Black","1031")]}],by:"u1",t:D(-1)}},
 {col:"packh",id:"14501",data:{c:1,h_1_1:{ok:true,by:"u1",t:1},h_1_2:{ok:false,q:3,alt:[{n:1,t:"Kabel CEE 32A 50m",a:"1098"}],by:"u1",t:1},h_1_3:{ok:true,by:"u1",t:1},h_1_4:{ok:true,fm:"lager",by:"u1",t:1},h_1_5:{ok:true,fm:"miete",by:"u1",t:1},h_1_6:{ok:true,by:"u1",t:1},
  fin:{by:"u1",t:D(0,14)},h_z14533_1:{ok:true,by:"u1",t:1},h_z14533_2:{ok:true,by:"u1",t:1},zd_14533:{d:ymd(T0),by:"u1",t:1},zf_14533:{by:"u1",t:D(0,14)}}}]);
let F=0;const ok=(t,c,v)=>{F+=!c;console.log((c?"OK   ":"FEHLT")+" "+t+(v!==undefined?": "+v:""))};
(async()=>{const b=await chromium.launch();
 for(const MOB of [0,1]){const ctx=await b.newContext({viewport:{width:390,height:844},userAgent:MOB?"Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X)":undefined});const p=await ctx.newPage();const errs=[];p.on("pageerror",e=>errs.push(e.message));
  const fk=fs.readFileSync(S+"fakesb.js","utf8").replace("const T={docs:[]","const T={docs:"+JSON.stringify(seed));
  await ctx.route("**/*",r=>{const u=r.request().url();if(u.startsWith("https://app.test/"))return r.fulfill({body:fs.readFileSync("/home/claude/gh/index.html"),contentType:"text/html"});if(u.includes("supabase-js"))return r.fulfill({body:fk,contentType:"text/javascript"});
   if(u.includes("pdf-lib"))return r.fulfill({body:fs.readFileSync("/opt/npm-tools/node_modules/pdf-lib/dist/pdf-lib.min.js"),contentType:"text/javascript"});return r.fulfill({status:404,body:""})});
  await ctx.addInitScript(()=>{window.__sh=null;navigator.canShare=()=>true;navigator.share=async o=>{const f=o.files[0];let s="";const u=new Uint8Array(await f.arrayBuffer());for(let i=0;i<u.length;i+=8192)s+=String.fromCharCode(...u.subarray(i,i+8192));window.__sh={name:f.name,text:o.text||"",b64:btoa(s)}}});
  await p.goto("https://app.test/");await p.evaluate(()=>window.PK_FOPEN=true);await p.waitForTimeout(900);await p.mouse.click(195,420);await p.waitForTimeout(500);
  const E=f=>p.evaluate(f);
  if(!MOB){
   const R=await E(()=>pkDrRows(packs.find(x=>x.id==="14501")).map(r=>[r.pos,r.name,r.soll,r.mit,r.ck,r.hints.map(h=>h[0]).join(" / "),r.alt.length].join(" | ")));console.log(R.join("\n"));
   ok("Reihenfolge wie Packschein + Zusatz-Artikel am Ende",R.map(r=>r.split(" | ")[0]).join(",")==="1.1,1.2,1.3,1.4,1.5,1.6,1.7,Z 2");
   ok("Zusatz eingerechnet (Schuko 20m 32)",/^1\.4 \| Schuko 20m \| 32 \| 32 \| ! \| .*aus dem Lager statt Fremdmiete.*inkl\. 2 Stk aus Zusatz 14533/.test(R[3]),R[3]);
   ok("Fehlmenge + Ersatz",/^1\.2 .* \| 4 \| 3 \| ! \| fehlt 1 Stk \| 1$/.test(R[1]),R[1]);
   ok("Fremdmiete-Hinweis",/^1\.5 .* \| 8 \| 5 \| ok \| davon 3 Stk Fremdmiete – kommt nicht vom Lager/.test(R[4]),R[4]);
   ok("Lager 55",/^1\.7 .*\| 55 \| Lager 55/.test(R[6]),R[6]);
   const M=await E(()=>pkDrMail(packs.find(x=>x.id==="14501")));console.log("--- Mail ---\n"+M);
   ok("Mail: ganze Liste mit Ersatz und Fremdmiete",/11 Stk 32A Kabel 50m \(inkl\. 1 Stk Ersatz\)/.test(M)&&/8 Stk Schuko 10m \(davon 3 Stk Fremdmiete\)/.test(M)&&/Lager 55 \(bitte selbst mitnehmen\):\n- 6 Stk Kabelbrücke/.test(M));
   await E(()=>{curPack="14501";view="packopen";hist=["start"];draw()});await p.waitForTimeout(300);
   ok("Knopf in der Packliste",await p.$("#pkprint")!==null);
   await p.evaluate(()=>{window.__saved=null;window.claude=window.claude||{};const u=claude.use;claude.use=async n=>n==="downloads"?{save:async o=>{let s="";const a=new Uint8Array(await o.data.arrayBuffer());for(let i=0;i<a.length;i+=8192)s+=String.fromCharCode(...a.subarray(i,i+8192));window.__saved={fn:o.filename,b64:btoa(s)}}}:u(n)});
   await p.click("#pkprint");await p.waitForTimeout(1200);console.log("Dialog:",(await p.textContent(".pkdrd")).replace(/\s+/g," ").slice(0,200));await p.screenshot({path:S+"druck_dlg.png"});
   await p.click("#pkdrs");await p.waitForFunction(()=>window.__saved,null,{timeout:8000});const sv=await E(()=>window.__saved);fs.writeFileSync(S+"druck_pc.pdf",Buffer.from(sv.b64,"base64"));ok("PC: PDF gespeichert",/^Packliste_Firmenfeier_Parndorf\.pdf$/.test(sv.fn),sv.fn);
   /* lange Liste */
   const b64=await E(async()=>{const P=JSON.parse(JSON.stringify(packs.find(x=>x.id==="14501")));for(let i=0;i<60;i++)P.pos.push({p:"2."+i,n:i+1,u:"Stk",t:"Langer Artikelname Nummer "+i+" mit Zusatztext",a:"9"+String(i).padStart(3,"0"),f:0});const u=await pkDrPdf(P);let s="";for(let i=0;i<u.length;i+=8192)s+=String.fromCharCode(...u.subarray(i,i+8192));return btoa(s)});
   fs.writeFileSync(S+"druck_lang.pdf",Buffer.from(b64,"base64"));
  }else{
   await E(()=>{curPack="14501";view="packopen";hist=["start"];draw()});await p.waitForTimeout(300);await p.click("#pkprint");await p.waitForTimeout(1200);
   ok("Handy: „Als PDF speichern“ da",!!(await p.$("#pkdrs")));
   await p.click("#pkdrsh");await p.waitForFunction(()=>window.__sh,null,{timeout:8000});const sh=await E(()=>window.__sh);ok("Handy: Teilen mit PDF + Text",sh.name==="Packliste_Firmenfeier_Parndorf.pdf"&&/Du bekommst:/.test(sh.text));
   await E(()=>window.__sh=null);await p.click("#pkdrp");await p.waitForFunction(()=>window.__sh,null,{timeout:8000});ok("Handy: Drucken = Teilen nur PDF",await E(()=>window.__sh.text===""));
  }
  ok("keine JS-Fehler ("+(MOB?"Handy":"PC")+")",!errs.length,errs.join(" / "));await ctx.close()}
 console.log("FEHLER GESAMT:",F);await b.close()})();
