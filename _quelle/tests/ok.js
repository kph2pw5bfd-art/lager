const {chromium}=require("playwright");const fs=require("fs");const S=__dirname+"/";
(async()=>{const b=await chromium.launch();const ctx=await b.newContext({viewport:{width:390,height:844}});const p=await ctx.newPage();const errs=[];p.on("pageerror",e=>errs.push(e.message));
 await ctx.route("**/*",r=>{const u=r.request().url();if(u.startsWith("https://app.test/"))return r.fulfill({body:fs.readFileSync("/home/claude/gh/index.html"),contentType:"text/html"});if(u.includes("supabase-js"))return r.fulfill({body:fs.readFileSync(S+"fakesb.js"),contentType:"text/javascript"});return r.fulfill({status:404,body:""})});
 await p.goto("https://app.test/");await p.waitForTimeout(800);
 await p.evaluate(async()=>{await DBX.doc("artikel/1092").set({name:"16A Kabel 50m"});audioUnlock();okBox("1092--15")});await p.waitForTimeout(300);
 console.log(await p.evaluate(()=>document.querySelector(".okb").innerText),"ACX:",await p.evaluate(()=>!!ACX&&ACX.state));await p.screenshot({path:S+"ok.png"});
 await p.evaluate(()=>{beep(false)});console.log("ERR",errs);await b.close()})();
