const {chromium}=require("playwright");const fs=require("fs");const S=__dirname+"/";
(async()=>{const b=await chromium.launch();const ctx=await b.newContext({viewport:{width:390,height:780}});const p=await ctx.newPage();
 let html=fs.readFileSync("/home/claude/gh/index.html","utf8");let n=0;const errs=[];p.on("pageerror",e=>errs.push(e.message));
 await ctx.route("**/*",r=>{const u=r.request().url();if(u.startsWith("https://app.test/")){n++;return r.fulfill({body:html,contentType:"text/html"})}if(u.includes("supabase-js"))return r.fulfill({body:fs.readFileSync(S+"fakesb.js"),contentType:"text/javascript"});return r.fulfill({status:404,body:""})});
 await p.goto("https://app.test/");await p.waitForTimeout(800);
 // Fall 1: mitten im Retourschein -> Banner
 await p.click('[data-g="ret"]');await p.waitForTimeout(200);await p.click('[data-rv="new"]');await p.waitForTimeout(200);await p.fill("#rev","Fest");await p.waitForTimeout(800);
 html=html.replace('const APPV="2.5 (28.10.)"','const APPV="2.6 (28.10.)"');
 await p.evaluate(()=>checkUpdate());await p.waitForTimeout(500);
 console.log("Banner:",await p.evaluate(()=>document.querySelector(".updb")&&document.querySelector(".updb").innerText));
 await p.click(".updb button");await p.waitForTimeout(1500);
 console.log("nach Klick Version:",await p.evaluate(()=>APPV),"DB:",await p.evaluate(()=>__T.docs.filter(d=>d.col==="retour").length),"loads:",n);
 // Fall 2: Startseite -> automatisch
 html=html.replace('const APPV="2.6 (28.10.)"','const APPV="2.7 (28.10.)"');await p.evaluate(()=>checkUpdate());await p.waitForTimeout(1500);
 console.log("auto Version:",await p.evaluate(()=>APPV),"ERR",errs);await b.close()})();
