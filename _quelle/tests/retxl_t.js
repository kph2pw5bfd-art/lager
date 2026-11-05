/* Test 1.106: Retourschein-Excel – Differenz = Retour − Ausgang, Vorzeichen, Farben (fehlt rot, zu viel orange) */
const {chromium}=require("playwright");const fs=require("fs");const S=(process.env.SP||"/tmp")+"/";
const seed=[{col:"retour",id:"r1",data:{ev:"Messe Linz",ord:"26001",by:"u1",t:Date.now(),itemsJson:JSON.stringify({"1098":{nr:"1098",name:"32A Kabel 50m",g:"Kabel",q:2},"1097":{nr:"1097",name:"32A Kabel 25m",g:"Kabel",q:1}})}}];
/* großzügige ExcelJS-Attrappe: merkt sich Zellwerte, Formate und bedingte Formatierung */
const XL=`(()=>{const mkCell=()=>({});class WS{constructor(n){this.name=n;this.rows={};this.cf=[]}
 getRow(i){const r=this.rows[i]=this.rows[i]||{cells:{},height:0,getCell(n){return this.cells[n]=this.cells[n]||mkCell()},eachCell(o,f){if(typeof o==="function")f=o;Object.values(this.cells).forEach((c,k)=>f(c,k+1))}};
  if(!("values" in r))Object.defineProperty(r,"values",{set(v){(Array.isArray(v)?v:[]).forEach((x,k)=>{r.getCell(k+1).value=x})},get(){return Object.values(r.cells).map(c=>c.value)}});return r}
 getCell(a){const m=a.match(/([A-Z]+)(\\d+)/);return this.getRow(+m[2]).getCell(m[1].charCodeAt(0)-64)}
 mergeCells(){}addImage(){}addConditionalFormatting(o){this.cf.push(o)}set columns(c){}addRow(v){const n=Object.keys(this.rows).length+1;this.getRow(n).values=v;return this.getRow(n)}}
 window.ExcelJS={Workbook:class{constructor(){this.ws=[];this.xlsx={writeBuffer:async()=>new TextEncoder().encode(JSON.stringify(this.ws.map(w=>({name:w.name,cf:w.cf,rows:Object.fromEntries(Object.entries(w.rows).map(([i,r])=>[i,Object.fromEntries(Object.entries(r.cells).map(([k,c])=>[k,{v:c.value,f:c.numFmt}]))]))}))))}}
  addWorksheet(n){const w=new WS(n);this.ws.push(w);return w}addImage(){return 1}}}})();`;
let bad=0;const ok=(c,m,x)=>{console.log((c?"OK   ":"FEHLER")+" "+m+(x!==undefined?": "+x:""));if(!c)bad++};
(async()=>{const b=await chromium.launch();const ctx=await b.newContext({viewport:{width:390,height:844},acceptDownloads:true});await ctx.addInitScript(XL);
 const p=await ctx.newPage();const errs=[];p.on("pageerror",e=>errs.push(e.message));
 const fk=fs.readFileSync(S+"fakesb.js","utf8").replace("const T={docs:[]","const T={docs:"+JSON.stringify(seed));
 await ctx.route("**/*",r=>{const u=r.request().url();if(u.startsWith("https://app.test/"))return r.fulfill({body:fs.readFileSync("/home/claude/gh/index.html"),contentType:"text/html"});if(u.includes("supabase-js"))return r.fulfill({body:fk,contentType:"text/javascript"});return r.fulfill({status:404,body:""})});
 await p.goto("https://app.test/");await p.waitForTimeout(900);await p.mouse.click(195,420);await p.waitForTimeout(500);
 ok(await p.evaluate(()=>APPV)==="1.110","Version 1.110");
 const [dl]=await Promise.all([p.waitForEvent("download"),p.evaluate(()=>retXl(rets.find(r=>r.id==="r1")))]);const fp=S+"retxl.json";await dl.saveAs(fp);
 const W=JSON.parse(fs.readFileSync(fp,"utf8"))[0],R=W.rows;{const all=JSON.stringify(R),cr=Object.values(R).find(r=>Object.values(r).some(c=>c&&c.v==="Erstellt"));const crTxt=cr?JSON.stringify(cr):"";console.log((cr&&/\d{2}\.\d{2}\.\d{4}"/.test(crTxt)&&!/\d{2}:\d{2}/.test(crTxt)?"OK   ":"FEHLT")+" 1.120: „Erstellt“ ohne Uhrzeit ("+crTxt.slice(0,120)+")");}const hd=+Object.keys(R).find(i=>R[i][3]&&R[i][3].v==="Ausgang");
 const d=Object.keys(R).filter(i=>+i>hd).map(i=>R[i]);console.log("Zeilen:",d.map(r=>r[2].v+" | Ausgang "+(r[3]&&r[3].v)+" | Retour "+r[4].v+" | "+JSON.stringify(r[5])).join(" || "));
 ok(d.every(r=>/^IF\(C(\d+)="","",D\1-C\1\)$/.test(r[5].v.formula)),"Formel = Retour − Ausgang",d[0][5].v.formula);
 ok(d.every(r=>r[5].f==="+0;-0;0"),"Zahlenformat mit Vorzeichen (+2 / −2 / 0)");
 const cf=W.cf[0];ok(!!cf&&cf.ref==="E"+(hd+1)+":E"+(hd+d.length),"Farbregel über alle Artikelzeilen",cf&&cf.ref);
 ok(cf&&/<0/.test(cf.rules[0].formulae[0])&&cf.rules[0].style.font.color.argb==="FFC0392B","fehlt (negativ) rot");
 ok(cf&&/>0/.test(cf.rules[1].formulae[0])&&cf.rules[1].style.font.color.argb==="FFE67E22","zu viel (positiv) orange");
 ok(!errs.length,"keine JS-Fehler",errs.join(" | "));
 console.log("FEHLER GESAMT:",bad);await b.close()})();
