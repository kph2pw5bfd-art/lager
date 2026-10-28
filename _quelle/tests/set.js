const {chromium}=require("playwright");const fs=require("fs");const S=__dirname+"/";
(async()=>{const b=await chromium.launch();const ctx=await b.newContext({viewport:{width:390,height:844}});const p=await ctx.newPage();const errs=[];p.on("pageerror",e=>errs.push(e.message));
 await ctx.route("**/*",r=>{const u=r.request().url();if(u.startsWith("https://app.test/"))return r.fulfill({body:fs.readFileSync("/home/claude/gh/index.html"),contentType:"text/html"});if(u.includes("supabase-js"))return r.fulfill({body:fs.readFileSync(S+"fakesb.js"),contentType:"text/javascript"});return r.fulfill({status:404,body:""})});
 await p.goto("https://app.test/");await p.waitForTimeout(800);
 await p.click('[data-g="art"]');await p.waitForTimeout(300);await p.click('[data-pref="snd"]');await p.waitForTimeout(100);await p.screenshot({path:S+"set.png"});
 console.log("snd:",await p.evaluate(()=>pref("snd")),"vib:",await p.evaluate(()=>pref("vib")));
 // Monteur-Ansicht: Einstellungen sichtbar, Admin-Knöpfe nicht
 await p.click("#pvb");await p.waitForTimeout(300);console.log("Monteur Start:",await p.evaluate(()=>[...document.querySelectorAll("[data-g]")].map(b=>b.textContent).join(" | ")));
 await p.click('[data-g="art"]');await p.waitForTimeout(300);console.log("Monteur Einst.:",(await p.textContent("#app")).replace(/\s+/g," ").slice(0,200));
 console.log("ERR",errs);await b.close()})();
