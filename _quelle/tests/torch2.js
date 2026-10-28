const {chromium}=require("playwright");const fs=require("fs");const S=__dirname+"/";
(async()=>{const b=await chromium.launch({args:["--use-fake-ui-for-media-stream","--use-fake-device-for-media-stream"]});const ctx=await b.newContext({viewport:{width:390,height:780},permissions:["camera"]});const p=await ctx.newPage();
 const errs=[];p.on("pageerror",e=>errs.push(e.message));
 await ctx.addInitScript(()=>{window.BarcodeDetector=class{detect(){return Promise.resolve([])}};window.__tc=[];const g=MediaStreamTrack.prototype.getCapabilities;MediaStreamTrack.prototype.getCapabilities=function(){return{...g.call(this),torch:true}};const a=MediaStreamTrack.prototype.applyConstraints;MediaStreamTrack.prototype.applyConstraints=function(c){if(c&&c.advanced&&"torch" in c.advanced[0]){window.__tc.push(c.advanced[0].torch);return Promise.resolve()}return a.call(this,c)}});
 await ctx.route("**/*",r=>{const u=r.request().url();if(u.startsWith("https://app.test/"))return r.fulfill({body:fs.readFileSync("/home/claude/gh/index.html"),contentType:"text/html"});if(u.includes("supabase-js"))return r.fulfill({body:fs.readFileSync(S+"fakesb.js"),contentType:"text/javascript"});return r.fulfill({status:404,body:""})});
 await p.goto("https://app.test/");await p.waitForTimeout(800);
 await p.click('[data-g="new"]');await p.waitForTimeout(400);await p.fill("#e1","Test");await p.fill("#o1","123");await p.click("#go");await p.waitForTimeout(500);console.log("hat #cam:",!!await p.$("#cam"));
 if(!await p.$("#cam")){console.log(await p.evaluate(()=>[...document.querySelectorAll("#app input,#app button")].map(b=>b.id+"|"+b.textContent.trim().slice(0,20)).join(" ; ")))}
 await p.click("#cam");await p.waitForTimeout(1200);
 console.log("scan:",await p.evaluate(()=>{const t=document.querySelector("#torchb");return[!!t,t&&t.textContent,window.__tc.join(),!document.querySelector("#camp").hidden]}));
 await p.click("#torchb");await p.waitForTimeout(200);console.log("klick:",await p.evaluate(()=>[document.querySelector("#torchb").textContent,window.__tc.join()]));
 await p.screenshot({path:S+"torch2.png"});
 await p.click("#cx");await p.waitForTimeout(300);console.log("geschlossen, knopf weg:",!await p.$("#torchb"));
 await p.click("#cam");await p.waitForTimeout(1200);console.log("wieder offen, knöpfe:",await p.$$eval("#torchb",x=>x.length));
 console.log("ERR",errs);
 await b.close()})();
