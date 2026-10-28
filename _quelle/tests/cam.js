const {chromium}=require("playwright");const fs=require("fs");const S=__dirname+"/";
(async()=>{const b=await chromium.launch({args:["--use-fake-ui-for-media-stream","--use-fake-device-for-media-stream"]});const ctx=await b.newContext({viewport:{width:390,height:780},permissions:["camera"]});const p=await ctx.newPage();
 const errs=[];p.on("pageerror",e=>errs.push(e.message));
 await ctx.route("**/*",r=>{const u=r.request().url();if(u.startsWith("https://app.test/"))return r.fulfill({body:fs.readFileSync("/home/claude/gh/index.html"),contentType:"text/html"});if(u.includes("supabase-js"))return r.fulfill({body:fs.readFileSync(S+"fakesb.js"),contentType:"text/javascript"});return r.fulfill({status:404,body:""})});
 await p.goto("https://app.test/");await p.waitForTimeout(800);await p.click('[data-g="ret"]');await p.waitForTimeout(300);await p.click('[data-rv="new"]');await p.waitForTimeout(300);
 await p.click("#rcam");await p.waitForTimeout(1500);await p.screenshot({path:S+"cam.png"});
 const info=await p.evaluate(()=>{const v=document.querySelector(".lcam video");return{open:!!document.querySelector(".lcam"),vw:v&&v.videoWidth,vh:v&&v.videoHeight}});
 // capture: intercept readLabel to report blob size
 await p.evaluate(()=>{window.readLabel=async f=>{const im=await createImageBitmap(f);window.__shot=[im.width,im.height];return{on:"1234567-01",ev:"Test Fest"}}});
 console.log(await p.evaluate(()=>{const v=document.querySelector(".lcam video");return JSON.stringify([v.getBoundingClientRect(),document.querySelector(".lframe").getBoundingClientRect()])}));await p.click(".lshot");await p.waitForTimeout(800);
 console.log(JSON.stringify(info),await p.evaluate(()=>JSON.stringify([window.__shot,!!document.querySelector(".lcam"),document.querySelector("#rev").value,document.querySelector("#rord").value])),"ERR",errs);await b.close()})();
