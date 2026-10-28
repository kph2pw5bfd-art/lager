const {chromium}=require("playwright");const fs=require("fs");const S=__dirname+"/";
(async()=>{const b=await chromium.launch();const p=await (await b.newContext()).newPage();
 await p.route("**/*",r=>{const u=r.request().url();if(u.startsWith("https://app.test/"))return r.fulfill({body:fs.readFileSync("/home/claude/gh/index.html"),contentType:"text/html"});if(u.includes("supabase-js"))return r.fulfill({body:fs.readFileSync(S+"fakesb.js"),contentType:"text/javascript"});return r.fulfill({status:404,body:""})});
 await p.goto("https://app.test/");await p.waitForTimeout(800);
 console.log(await p.evaluate(()=>{const r={ev:"Kaiserwiesn 2026",ord:"2600222-01",rem:"2 Kabel beschädigt",closed:true,itemsJson:JSON.stringify({a:{name:"x",q:5},b:{name:"y",q:3}})};return rMailSubj(r)+"\n---\n"+rMailBody(r)}));await b.close()})();
