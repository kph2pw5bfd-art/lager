/* Test 1.108: Push-Nachrichten in der App – Einstellungen, Anmelden (Attrappe für Service Worker/PushManager), Titel, Öffnen per ?go= */
const {chromium}=require("playwright");const fs=require("fs");const S=(process.env.SP||"/tmp")+"/";
const t0=new Date();t0.setHours(0,0,0,0);const T0=t0.getTime();
const seed=[{col:"titel",id:"lagerleiter",data:{name:"Lagerleiter",o:2,r:{abg_p:true,pk_s:true}}},{col:"titel",id:"werkstatt",data:{name:"Werkstatt",o:4,r:{def_s:true}}},{col:"titel",id:"lagerarbeiter",data:{name:"Lagerarbeiter",o:3,r:{pk_s:true}}},
 {col:"pack",id:"P1",data:{ord:"260111401",ps:"P1",ev:"Winterwunder",pl:"Marvin Wellisch",db:T0+8*36e5,de:T0+9*864e5,pos:[{p:"1",n:2,u:"Stk",t:"Kabel",a:"1098",f:0}],by:"u1",t:Date.now()}},
 {col:"defekte",id:"d1",data:{art:"Verteiler 32A Black",ev:"Spittelberg",desc:"Schalter",by:"u1",t:Date.now(),urg:true,done:false}}];
const MOCK=`(()=>{let sub=null,perm="default";window.__sw={msgs:[]};
 window.Notification=class{static get permission(){return perm}static async requestPermission(){perm="granted";return perm}};window.PushManager=function(){};
 const reg={pushManager:{getSubscription:async()=>sub,subscribe:async o=>{window.__key=Array.from(o.applicationServerKey).length;sub={endpoint:"https://push.test/e1",toJSON(){return{endpoint:this.endpoint,keys:{p256dh:"x",auth:"y"}}},unsubscribe:async()=>{sub=null;return true}};return sub}}};
 Object.defineProperty(navigator,"serviceWorker",{configurable:true,value:{register:async u=>{window.__swurl=u;return reg},ready:Promise.resolve(reg),addEventListener:(t,f)=>{window.__swmsg=f}}})})();`;
let bad=0;const ok=(c,m,x)=>{console.log((c?"OK   ":"FEHLER")+" "+m+(x!==undefined?": "+x:""));if(!c)bad++};
(async()=>{const b=await chromium.launch();const ctx=await b.newContext({viewport:{width:390,height:844}});await ctx.addInitScript(MOCK);
 const p=await ctx.newPage();const errs=[];p.on("pageerror",e=>errs.push(e.message));const fnCalls=[];
 const fk=fs.readFileSync(S+"fakesb.js","utf8").replace("const T={docs:[]","const T={docs:"+JSON.stringify(seed));
 await ctx.route("**/*",r=>{const u=r.request().url();
  if(u.includes("/functions/v1/push")){fnCalls.push(r.request().method()+" "+(r.request().postData()||""));return r.fulfill({contentType:"application/json",body:r.request().method()==="GET"?'{"key":"BEl62iUYgUivxIkv69yViEuiBIa-Ib9-SkvMeAtA3LFgDzkrxZJjSgSnfckjBJuBkr3qBUYIHBQFLXYp5Nksh8U"}':'{"ok":true,"gesendet":1}'})}
  if(u.startsWith("https://app.test/"))return r.fulfill({body:fs.readFileSync("/home/claude/gh/index.html"),contentType:"text/html"});if(u.includes("supabase-js"))return r.fulfill({body:fk,contentType:"text/javascript"});return r.fulfill({status:404,body:""})});
 await p.goto("https://app.test/?go=pk:P1");await p.waitForTimeout(900);await p.mouse.click(195,420);await p.waitForTimeout(2800);
 ok(await p.evaluate(()=>APPV)==="1.108","Version 1.108");
 ok(await p.evaluate(()=>window.__swurl)==="sw.js","Service Worker angemeldet");
 ok(await p.evaluate(()=>view)==="packopen"&&await p.evaluate(()=>curPack)==="P1","Antippen (?go=pk:P1) öffnet die Packliste");
 ok(await p.evaluate(()=>!/go=/.test(location.search)),"Adresse danach aufgeräumt");
 await p.evaluate(()=>window.__swmsg({data:{go:"def:d1"}}));await p.waitForTimeout(1200);ok(await p.evaluate(()=>view+" "+curDef)==="defopen d1","Nachricht bei offener App öffnet den Defekt");
 ok(await p.evaluate(()=>[pushTitOn("lagerleiter","pr"),pushTitOn("werkstatt","def"),pushTitOn("lagerarbeiter","pk"),pushTitOn("lagerarbeiter","pr")].join())==="true,true,true,false","Standard pro Titel");
 /* Einstellungen */
 await p.evaluate(()=>go("art"));await p.waitForTimeout(400);
 ok(/Benachrichtigungen erlauben/.test(await p.textContent("#pushbox")),"Einstellungen: Knopf „Benachrichtigungen erlauben“");
 await p.click("#pshon");await p.waitForTimeout(800);
 ok(await p.evaluate(()=>window.__key)===65,"angemeldet mit Schlüssel der Funktion (65 Bytes)");
 const ab=await p.evaluate(()=>JSON.stringify(__T.push_abos));ok(/push.test\/e1/.test(ab)&&/"user_id":"u1"/.test(ab),"Gerät in push_abos gespeichert",ab.slice(0,160));
 ok(/"pr":false,"def":false,"pk":false/.test(ab),"Admin: vorab nichts eingeschaltet");
 ok(/eingeschaltet/.test(await p.textContent("#pushbox"))&&(await p.$$("[data-psk]")).length===3,"Admin sieht alle drei Schalter");
 await p.check('[data-psk="pk"]');await p.waitForTimeout(400);ok(/"pk":true/.test(await p.evaluate(()=>JSON.stringify(__T.push_abos))),"Schalter „Neue Packlisten“ gespeichert");
 await p.click("#pshtest");await p.waitForTimeout(400);ok(fnCalls.some(c=>/POST .*"test":true/.test(c)),"Test-Nachricht angefordert");
 /* Titel und ihre Rechte */
 await p.evaluate(()=>go("users"));await p.waitForTimeout(500);
 const tc=await p.evaluate(()=>[...document.querySelectorAll("[data-pst]")].map(c=>c.dataset.pst+(c.checked?"+":"-")).join(" "));console.log("Titel:",tc);
 ok(/lagerleiter\|pr\+/.test(tc)&&/werkstatt\|def\+/.test(tc)&&/lagerarbeiter\|pk\+/.test(tc)&&/lagerleiter\|pk-/.test(tc),"Titel-Häkchen nach Standard");
 await p.evaluate(()=>{const c=document.querySelector('[data-pst="werkstatt|pk"]');c.checked=true;c.dispatchEvent(new Event("change"))});await p.waitForTimeout(400);
 ok(/"push":\{"pr":false,"def":true,"pk":true\}/.test(await p.evaluate(()=>JSON.stringify(__T.docs.find(d=>d.col==="titel"&&d.id==="werkstatt").data))),"Titel-Einstellung gespeichert");
 /* ausschalten */
 await p.evaluate(()=>go("art"));await p.waitForTimeout(400);await p.click("#pshoff");await p.click("#y");await p.waitForTimeout(500);
 ok(await p.evaluate(()=>__T.push_abos.length)===0&&/erlauben/.test(await p.textContent("#pushbox")),"Ausschalten löscht das Gerät");
 /* iPhone ohne Home-Bildschirm */
 await p.evaluate(()=>{Object.defineProperty(navigator,"userAgent",{configurable:true,get:()=>"Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X)"});pushRedraw()});
 ok(/Home-Bildschirm/.test(await p.textContent("#pushbox")),"iPhone im Browser: Hinweis auf Home-Bildschirm");
 ok(!errs.length,"keine JS-Fehler",errs.join(" | "));
 console.log("FEHLER GESAMT:",bad);await b.close()})();
