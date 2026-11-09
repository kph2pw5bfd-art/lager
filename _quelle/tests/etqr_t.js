/* Test 1.144: QR mit Veranstaltung – Inhalt, Umlaute, Kürzen, alte Etiketten, Scan ohne Packliste, Lesbarkeit bei 203 dpi (SP = Ordner mit fakesb.js) */
const {chromium}=require("playwright");const fs=require("fs");const {execFileSync}=require("child_process");const S=(process.env.SP||"/tmp")+"/";
(async()=>{const b=await chromium.launch();let fail=0;const ok=(t,c)=>{if(!c)fail++;console.log((c?"OK   ":"FEHLT")+" "+t)};const errs=[];
 const fk=fs.readFileSync(S+"fakesb.js","utf8");const ctx=await b.newContext({viewport:{width:390,height:844}});const p=await ctx.newPage();p.on("pageerror",e=>errs.push(e.message));
 await ctx.route("**/*",r=>{const u=r.request().url();if(u.startsWith("https://app.test/"))return r.fulfill({body:fs.readFileSync("/home/claude/gh/index.html"),contentType:"text/html"});if(u.includes("supabase-js"))return r.fulfill({body:fk,contentType:"text/javascript"});return r.fulfill({status:404,body:""})});
 await p.goto("https://app.test/");await p.waitForTimeout(700);await p.mouse.click(200,400);await p.waitForTimeout(400);
 const R=await p.evaluate(()=>({a:gbQr("2601080-01","Ice Magic Innsbruck"),n:gbQr("2601080-01",""),pa:gbParse("TPC:2601080-01 | Weihnachtsmarkt Mörbisch | 2026"),pn:gbParse("TPC:2601080-01"),h:gbParse("https://www.tpc-rental.at"),l:gbQr("2601999-01","Äußerst langer Veranstaltungsname Weihnachtsmarkt am Spittelberg 2026 mit Zusatz und noch mehr Text")}));console.log("   ",R.l);
 ok("Inhalt",R.a==="TPC:2601080-01 | Ice Magic Innsbruck");ok("Ohne Veranstaltung nur Nummer",R.n==="TPC:2601080-01");ok("Trennzeichen im Namen bleibt",R.pa.ord==="2601080-01"&&R.pa.ev==="Weihnachtsmarkt Mörbisch | 2026");ok("Altes Etikett",R.pn.ord==="2601080-01"&&!R.pn.ev);ok("Homepage",R.h.old);ok("Lang gekürzt",new TextEncoder().encode(R.l).length<=78);
 const docs=await p.evaluate(()=>[["TPC:2601080-01 | Ice Magic Innsbruck",{ord:"2601080-01",ev:"Ice Magic Innsbruck",art:"proj",n:1,rot:0}],["TPC:2500261-01 | Burg Clam Mörbisch Größe",{ord:"2500261-01",ev:"Burg Clam Mörbisch Größe",art:"inh",n:1,inh:"x",rot:0}],[gbQr("2601999-01","Sehr langer Veranstaltungsname Weihnachtsmarkt am Spittelberg 2026 mit Zusatz"),{ord:"2601999-01",ev:"Sehr langer Veranstaltungsname Weihnachtsmarkt am Spittelberg 2026 mit Zusatz",art:"proj",n:1,rot:0}]].map(([q,j])=>[q,gbDoc(j)]));
 const lp=await b.newPage({viewport:{width:600,height:600},deviceScaleFactor:203/96});const X=[];let i=0;for(const [q,d] of docs){await lp.setContent(d);await lp.waitForTimeout(400);const f=S+"etq"+i+".png";await (await lp.$(".qr")).screenshot({path:f});X.push([f,q]);i++}
 fs.writeFileSync(S+"etq.json",JSON.stringify(X));const py=`import cv2,json,sys
for f,q in json.load(open(sys.argv[1])):
  im=cv2.imread(f,0);_,bw=cv2.threshold(im,128,255,cv2.THRESH_BINARY);im=cv2.copyMakeBorder(bw,30,30,30,30,cv2.BORDER_CONSTANT,value=255);big=cv2.resize(im,None,fx=3,fy=3,interpolation=cv2.INTER_LINEAR);bl=cv2.GaussianBlur(big,(7,7),0)
  d=cv2.QRCodeDetector();t=d.detectAndDecode(big)[0];u=d.detectAndDecode(bl)[0]
  print("OK  " if t==q.encode('utf8').decode('latin1') or t==q else "FEHLT",im.shape,repr(t),"| unscharf:",repr(u))`;
 fs.writeFileSync(S+"etq.py",py);console.log(execFileSync("python3",[S+"etq.py",S+"etq.json"]).toString());
 await p.evaluate(()=>{packs.length=0;rets.length=0;view="ret";draw();gbScanHit("TPC:2609999-01 | Nur im QR")});await p.waitForTimeout(500);await p.locator(".ov button",{hasText:"Neuen Retourschein"}).click();await p.waitForTimeout(400);
 const r=await p.evaluate(()=>({o:rs&&rs.ord,e:rs&&rs.ev}));ok("Retourschein ohne Packliste: Veranstaltung aus QR "+JSON.stringify(r),r.o==="2609999-01"&&r.e==="Nur im QR");
 ok("Keine JS-Fehler "+errs.join("|"),!errs.length);await b.close();console.log(fail?"FEHLER: "+fail:"ALLES OK")})();
