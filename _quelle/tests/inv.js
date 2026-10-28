const {chromium}=require("playwright");const fs=require("fs");const S=__dirname+"/";
(async()=>{const b=await chromium.launch();const ctx=await b.newContext({viewport:{width:390,height:844}});const p=await ctx.newPage();const errs=[];p.on("pageerror",e=>errs.push(e.message));
 await ctx.route("**/*",r=>{const u=r.request().url();if(u.startsWith("https://app.test/"))return r.fulfill({body:fs.readFileSync("/home/claude/gh/index.html"),contentType:"text/html"});if(u.includes("supabase-js"))return r.fulfill({body:fs.readFileSync(S+"fakesb.js"),contentType:"text/javascript"});return r.fulfill({status:404,body:""})});
 await p.goto("https://app.test/");await p.waitForTimeout(800);await p.click('[data-g="users"]');await p.waitForTimeout(300);await p.screenshot({path:S+"inv0.png"});
 await p.click("#inv");await p.waitForTimeout(200);await p.screenshot({path:S+"inv1.png"});
 console.log(await p.inputValue("#ivt"));console.log("WA:",(await p.getAttribute("#ivw","href")).slice(0,80));console.log("ERR",errs);await b.close()})();
