/* ===== Gitterbox-Etiketten (1.121) =====
   Nachbau der GoLabel-Vorlagen „Projektlabel“ und „Projektlabel mit Inhalt“ (100 × 100 mm, Godex G530, 300 dpi),
   QR-Code jetzt mit der Auftragsnummer („TPC:<Auftragsnummer>“ – eigener QR-Erzeuger, Byte-Modus, Fehlerkorrektur M, Version 1–6).
   Druck vom Tablet: docs „druck“ {pk, ord, ev, art:"proj"|"inh", n, inh, by, t, st:"neu"|"druckt"|"ok"|"fehler", sid, pt}
   → Druckstation (Laptop mit Godex per USB, Chrome mit --kiosk-printing, localStorage tpc_druckst=1) druckt automatisch.
   Herzschlag der Station: docs druckst/main {t, by, name}. „Hier drucken“ = Druckfenster am eigenen Gerät.
   Rücklauf: Knopf „QR scannen“ in den Retourscheinen → rOpenByNr. Alte Etiketten (Homepage-QR) → Hinweis aufs Etikettenfoto. */
const GB_LOGO="__ETLOGO__";
/* ---------- QR-Code ---------- */
const QR_EXP=new Array(256),QR_LOG=new Array(256);(()=>{let x=1;for(let i=0;i<255;i++){QR_EXP[i]=x;QR_LOG[x]=i;x<<=1;if(x&256)x^=0x11d}QR_EXP[255]=QR_EXP[0]})();
const qrMul=(a,b)=>a&&b?QR_EXP[(QR_LOG[a]+QR_LOG[b])%255]:0;
function qrEc(data,n){let g=[1];for(let i=0;i<n;i++){const ng=new Array(g.length+1).fill(0);g.forEach((c,j)=>{ng[j]^=c;ng[j+1]^=qrMul(c,QR_EXP[i])});g=ng}
 const r=data.concat(new Array(n).fill(0));for(let i=0;i<data.length;i++){const c=r[i];if(c)for(let j=0;j<g.length;j++)r[i+j]^=qrMul(g[j],c)}return r.slice(data.length)}
/* Version: [Fehlerkorrektur-Codewörter je Block, Blöcke, Datencodewörter je Block] für Stufe M */
const QR_M={1:[10,1,16],2:[16,1,28],3:[26,1,44],4:[18,2,32],5:[24,2,43],6:[16,4,27]},QR_AL={2:18,3:22,4:26,5:30,6:34};
function qrMatrix(txt){const bytes=[...new TextEncoder().encode(String(txt))];let v=1;while(v<=6&&QR_M[v][1]*QR_M[v][2]*8<4+8+bytes.length*8)v++;if(v>6)throw new Error("Text zu lang für den QR-Code");
 const [ecn,nb,dpb]=QR_M[v],cap=nb*dpb,bits=[];const put=(val,len)=>{for(let i=len-1;i>=0;i--)bits.push((val>>i)&1)};
 put(4,4);put(bytes.length,8);bytes.forEach(b=>put(b,8));for(let i=0;i<4&&bits.length<cap*8;i++)bits.push(0);while(bits.length%8)bits.push(0);
 const data=[];for(let i=0;i<bits.length;i+=8)data.push(parseInt(bits.slice(i,i+8).join(""),2));for(let p=0;data.length<cap;p++)data.push(p%2?0x11:0xEC);
 const blocks=[],ecs=[];for(let b=0;b<nb;b++){const d=data.slice(b*dpb,(b+1)*dpb);blocks.push(d);ecs.push(qrEc(d,ecn))}
 const cw=[];for(let i=0;i<dpb;i++)blocks.forEach(d=>cw.push(d[i]));for(let i=0;i<ecn;i++)ecs.forEach(e=>cw.push(e[i]));
 const n=17+4*v,base=Array.from({length:n},()=>new Array(n).fill(null));
 const fin=(r,c)=>{for(let y=-1;y<=7;y++)for(let x=-1;x<=7;x++){const rr=r+y,cc=c+x;if(rr<0||cc<0||rr>=n||cc>=n)continue;base[rr][cc]=y>=0&&y<=6&&x>=0&&x<=6&&(y===0||y===6||x===0||x===6||(y>=2&&y<=4&&x>=2&&x<=4))}};
 fin(0,0);fin(0,n-7);fin(n-7,0);
 if(QR_AL[v]){const a=QR_AL[v];for(let y=-2;y<=2;y++)for(let x=-2;x<=2;x++)base[a+y][a+x]=Math.max(Math.abs(x),Math.abs(y))!==1}
 for(let i=8;i<n-8;i++){if(base[6][i]===null)base[6][i]=i%2===0;if(base[i][6]===null)base[i][6]=i%2===0}
 const fmtCells=[];for(let i=0;i<15;i++){fmtCells.push(i<6?[i,8]:i<8?[i+1,8]:[n-15+i,8]);fmtCells.push(i<8?[8,n-i-1]:i<9?[8,15-i]:[8,14-i])}
 fmtCells.forEach(([r,c])=>{base[r][c]=false});base[n-8][8]=true;
 const MASK=[(i,j)=>(i+j)%2===0,(i)=>i%2===0,(i,j)=>j%3===0,(i,j)=>(i+j)%3===0,(i,j)=>(Math.floor(i/2)+Math.floor(j/3))%2===0,(i,j)=>(i*j)%2+(i*j)%3===0,(i,j)=>((i*j)%2+(i*j)%3)%2===0,(i,j)=>((i*j)%3+(i+j)%2)%2===0];
 const fmtBits=m=>{const d=(0<<3)|m;let r=d<<10;for(let i=14;i>=10;i--)if((r>>i)&1)r^=0x537<<(i-10);return((d<<10)|r)^0x5412};
 const build=m=>{const M=base.map(r=>r.slice()),fn=MASK[m];let inc=-1,row=n-1,bit=7,byte=0;
  for(let col=n-1;col>0;col-=2){if(col===6)col--;for(;;){for(let c=0;c<2;c++){if(M[row][col-c]===null){let dark=byte<cw.length&&((cw[byte]>>>bit)&1)===1;if(fn(row,col-c))dark=!dark;M[row][col-c]=dark;if(--bit<0){byte++;bit=7}}}
   row+=inc;if(row<0||row>=n){row-=inc;inc=-inc;break}}}
  const fb=fmtBits(m);for(let i=0;i<15;i++){const on=((fb>>i)&1)===1,[a,b2]=fmtCells[2*i],[c,d]=fmtCells[2*i+1];M[a][b2]=on;M[c][d]=on}M[n-8][8]=true;return M};
 const pen=M=>{let p=0;const run=get=>{for(let a=0;a<n;a++){let len=1;for(let b=1;b<=n;b++){if(b<n&&get(a,b)===get(a,b-1))len++;else{if(len>=5)p+=len-2;len=1}}}};run((a,b)=>M[a][b]);run((a,b)=>M[b][a]);
  for(let r=0;r<n-1;r++)for(let c=0;c<n-1;c++){const x=M[r][c];if(x===M[r][c+1]&&x===M[r+1][c]&&x===M[r+1][c+1])p+=3}
  const pat=[true,false,true,true,true,false,true];for(let r=0;r<n;r++)for(let c=0;c<=n-7;c++){if(pat.every((x,k)=>M[r][c+k]===x)){const l=c>=4&&[1,2,3,4].every(k=>!M[r][c-k]),rt=c+11<=n&&[7,8,9,10].every(k=>!M[r][c+k]);if(l||rt)p+=40}if(pat.every((x,k)=>M[c+k][r]===x)){const l=c>=4&&[1,2,3,4].every(k=>!M[c-k][r]),rt=c+11<=n&&[7,8,9,10].every(k=>!M[c+k][r]);if(l||rt)p+=40}}
  let dk=0;M.forEach(r=>r.forEach(x=>{if(x)dk++}));p+=Math.floor(Math.abs(dk*20-n*n*10)/(n*n))*10;return p};
 let best=null,bp=1e9;for(let m=0;m<8;m++){const M=build(m),q=pen(M);if(q<bp){bp=q;best=M}}return best}
function qrSvg(txt){const M=qrMatrix(txt),n=M.length,q=2;let d="";M.forEach((r,y)=>r.forEach((x,c)=>{if(x)d+="M"+(c+q)+" "+(y+q)+"h1v1h-1z"}));
 return '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 '+(n+2*q)+' '+(n+2*q)+'" shape-rendering="crispEdges" style="width:100%;height:100%;display:block"><rect width="100%" height="100%" fill="#fff"/><path d="'+d+'" fill="#000"/></svg>'}
const gbQr=ord=>"TPC:"+String(ord||"").trim();
function gbParse(txt){const s=String(txt||"").trim();let m=s.match(/^TPC:(.+)$/i);if(m)return{ord:m[1].trim()};if(/tpc-rental|thepowercompany|https?:\/\//i.test(s))return{old:true};m=s.match(/^\d{6,8}(-\d{1,3})?$/);return m?{ord:s}:{bad:true}}
/* ---------- Etikett als Druckseite (100 × 100 mm) ---------- */
const gbEsc=s=>String(s==null?"":s).replace(/[&<>"]/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;"})[c]);
function gbHead(ord){return '<div class="hd"><img class="lg" src="'+GB_LOGO+'" alt=""><div class="ad"><span>THE POWER COMPANY Energy Systems GmbH<br>Laaber Straße 67 - 2384 Breitenfurt bei Wien<br>Telefon +43 (0)2239/34 777-0<br>office@thepowercompany.at</span><b>www.tpc-rental.at</b></div><div class="qr">'+qrSvg(gbQr(ord))+'</div></div>'}
function gbLabel(j){const ord=gbEsc(j.ord||"–"),ev=gbEsc(j.ev||"");
 if(j.art==="inh")return '<div class="pg">'+gbHead(j.ord)+'<div class="rw"><div class="lc2"><div class="h2c"><span class="lb">Veranstaltung:</span><b class="v2 fit1">'+ev+'</b></div><div class="h2c"><span class="lb">Auftrags-Nr.:</span><b class="v2 fit1">'+ord+'</b></div></div><div class="gw"><span class="lb">Gewicht:</span><span class="kg">kg</span></div></div><div class="bd"><span class="lb">Inhalt:</span><div class="inh fit">'+gbEsc(j.inh||"")+'</div></div></div>';
 return '<div class="pg">'+gbHead(j.ord)+'<div class="rw"><div class="lc"><span class="lb">Auftrags-Nr.:</span><b class="nr fit1">'+ord+'</b></div><div class="gw"><span class="lb">Gewicht:</span><span class="kg">kg</span></div></div><div class="bd"><span class="lb b">Projekt:</span><div class="pj fit">'+ev+'</div></div></div>'}
/* 1.132: Drehung beim Drucken pro Gerät (localStorage tpc_et_rot: 0/90/180/270, Standard 90 = im Uhrzeigersinn) – Jürgen, 6.11.: an der Godex muss das Etikett um 90° gedreht werden */
const gbRot=()=>{try{const v=localStorage.getItem("tpc_et_rot");return v===null?90:(+v||0)}catch(e){return 90}};
function gbDoc(j){const n=Math.max(1,Math.min(60,+j.n||1)),rot=j.rot!==undefined?j.rot:gbRot(),pages=Array.from({length:n},()=>'<div class="pp">'+gbLabel(j)+'</div>').join("");
 return '<!doctype html><html lang="de"><head><meta charset="utf-8"><title>Etikett '+gbEsc(j.ord||"")+'</title><style>@page{size:100mm 100mm;margin:0}*{box-sizing:border-box}html,body{margin:0;padding:0;background:#fff;color:#000;font-family:Arial,Helvetica,sans-serif;-webkit-print-color-adjust:exact;print-color-adjust:exact}'+
  '.pp{width:100mm;height:100mm;overflow:hidden;page-break-after:always;break-after:page}.pp:last-child{page-break-after:auto;break-after:auto}.pg{width:100mm;height:100mm;overflow:hidden;display:flex;flex-direction:column'+(rot?';transform:rotate('+rot+'deg);transform-origin:50% 50%':'')+'}'+
  '.hd{height:25mm;display:flex;align-items:center;gap:1.5mm;padding:1mm 2mm 1mm 2.5mm}.lg{width:30.5mm;height:auto;flex:none}.ad{flex:1;min-width:0;display:flex;flex-direction:column;gap:1mm}.ad span{font-size:1.72mm;line-height:1.25;white-space:nowrap}.ad b{font-size:3.75mm}.qr{width:21.5mm;height:21.5mm;flex:none}'+
  '.rw{height:20.5mm;display:flex;border-top:.6mm solid #000;border-bottom:.6mm solid #000}.lc{flex:1;border-right:.6mm solid #000;padding:.8mm 2mm;display:flex;flex-direction:column;min-width:0}.lc2{flex:1;border-right:.6mm solid #000;display:flex;flex-direction:column;min-width:0}.h2c{flex:1;padding:.5mm 2mm .3mm;display:flex;flex-direction:column;min-height:0;overflow:hidden}.h2c .lb{font-size:2.8mm;line-height:1.1}.h2c+.h2c{border-top:.6mm solid #000}'+
  '.gw{width:26mm;padding:.8mm 2mm;display:flex;flex-direction:column;justify-content:space-between}.kg{font-size:6.5mm;text-align:right;margin-bottom:2.5mm}.lb{font-size:3mm}.lb.b{font-weight:bold}'+
  '.nr{flex:1;display:flex;align-items:center;justify-content:center;font-size:9mm;white-space:nowrap;overflow:hidden}.v2{flex:1;min-height:0;display:flex;align-items:center;justify-content:center;font-size:5.3mm;line-height:1.05;white-space:nowrap;overflow:hidden}'+
  '.bd{flex:1;min-height:0;padding:1.5mm 2mm 2mm;display:flex;flex-direction:column}.pj{flex:1;min-height:0;font-weight:900;font-size:16mm;line-height:1.08;padding:1.5mm 0 0 3.5mm;overflow:hidden;overflow-wrap:normal;word-break:normal;hyphens:manual}.inh{flex:1;min-height:0;font-weight:bold;font-size:5.2mm;line-height:1.3;padding:1.5mm 0 0 2.5mm;white-space:pre-wrap;overflow:hidden;overflow-wrap:normal;word-break:normal;hyphens:manual}'+
  '</style></head><body>'+pages+'<script>(function(){function fit(){document.querySelectorAll(".fit").forEach(function(e){var s=parseFloat(getComputedStyle(e).fontSize);for(var i=0;i<60&&(e.scrollHeight>e.clientHeight+1||e.scrollWidth>e.clientWidth+1)&&s>6;i++){s*=0.93;e.style.fontSize=s+"px"}if(e.scrollWidth>e.clientWidth+1)e.style.overflowWrap="anywhere"});document.querySelectorAll(".fit1").forEach(function(e){var s=parseFloat(getComputedStyle(e).fontSize);for(var i=0;i<40&&(e.scrollWidth>e.clientWidth+1||e.scrollHeight>e.clientHeight+1)&&s>6;i++){s*=0.93;e.style.fontSize=s+"px"}});document.body.setAttribute("data-fit","1")}if(document.readyState==="complete")fit();else window.addEventListener("load",fit)})();<\/script></body></html>'}
/* Drucken über einen unsichtbaren Rahmen (an der Druckstation mit --kiosk-printing ohne Druckfenster) */
function gbPrint(j){return new Promise((res,rej)=>{const f=document.createElement("iframe");f.setAttribute("aria-hidden","true");f.style.cssText="position:fixed;right:0;bottom:0;width:100mm;height:100mm;border:0;opacity:0;pointer-events:none";
 let done=false;const fin=()=>{if(done)return;done=true;setTimeout(()=>f.remove(),4000);res()};
 f.onload=()=>{const w=f.contentWindow;let k=0;const go=()=>{try{if(w.document.body.getAttribute("data-fit")!=="1"&&k++<30)return setTimeout(go,50);window.__etLast=w.document.documentElement.outerHTML;w.focus();if(w.matchMedia)w.addEventListener("afterprint",fin);w.print();setTimeout(fin,1500)}catch(e){done=true;f.remove();rej(e)}};setTimeout(go,60)};
 f.srcdoc=gbDoc(j);document.body.appendChild(f)})}
/* ---------- Druckaufträge + Druckstation ---------- */
let GBJ=[],GBS=null,gbOn=false,gbBusy=false;
const gbIsStation=()=>{try{return localStorage.getItem("tpc_druckst")==="1"}catch(e){return false}};
const gbStationOk=()=>!!(GBS&&GBS.t&&Date.now()-GBS.t<75000);
function gbSub(){if(gbOn||typeof db==="undefined"||!db)return;gbOn=true;try{
 db.collection("druck").onSnapshot(s=>{GBJ=s.docs.map(d=>({id:d.id,...d.data()})).sort((a,b)=>(b.t||0)-(a.t||0));if(gbIsStation())gbRun();if(view==="druckst")gbStView()});
 db.collection("druckst").onSnapshot(s=>{const d=s.docs.find(x=>x.id==="main");GBS=d?d.data():null;const st=document.getElementById("etst");if(st)st.outerHTML=gbStLine()})}catch(e){console.warn(e)}}
/* 1.133: hängt ein Auftrag auf „druckt …“ (z. B. Druckfenster offen, weil Chrome nicht mit --kiosk-printing lief, oder Station neu gestartet), nach 2 Min. wieder freigeben */
function gbStuck(){if(!gbIsStation()||gbBusy)return;GBJ.filter(x=>x.st==="druckt"&&Date.now()-(x.dt||x.t||0)>120000).forEach(x=>{x.st="neu";db.doc("druck/"+x.id).update({st:"neu"}).catch(()=>{})})}
async function gbRun(){if(document.visibilityState==="hidden")return;gbStuck();if(gbBusy||!gbIsStation())return;const j=GBJ.filter(x=>x.st==="neu").sort((a,b)=>(a.t||0)-(b.t||0))[0];if(!j)return;gbBusy=true;
 try{await db.doc("druck/"+j.id).update({st:"druckt",sid:me,dt:Date.now()});await gbPrint(j);await db.doc("druck/"+j.id).update({st:"ok",pt:Date.now()})}
 catch(e){console.error(e);try{await db.doc("druck/"+j.id).update({st:"fehler",err:String(e&&e.message||e).slice(0,120)})}catch(x){}}
 finally{gbBusy=false;setTimeout(gbRun,400)}}
function gbBeat(){if(!gbIsStation()||typeof db==="undefined"||!db||!me)return;db.doc("druckst/main").set({t:Date.now(),by:me,name:typeof meName==="function"?meName():"",hid:document.visibilityState==="hidden"}).catch(()=>{})}
setInterval(()=>{if(typeof db!=="undefined"&&db&&me){gbSub();gbBeat();if(gbIsStation())gbRun()}},20000);
/* 1.134: minimiert druckt Chrome nicht – sobald das Fenster wieder sichtbar ist, sofort weiterdrucken (Jürgen, 6.11.) */
/* minimiert: nicht drucken (Auftrag bleibt „wartet“, nichts geht verloren), Herzschlag meldet „minimiert“; wieder sichtbar → sofort drucken */
document.addEventListener("visibilitychange",()=>{if(gbIsStation()&&typeof db!=="undefined"&&db&&me){gbBeat();if(document.visibilityState==="visible")gbRun()}});
setTimeout(()=>{if(typeof db!=="undefined"&&db&&me){gbSub();gbBeat()}},2500);
function gbStLine(){const ok=gbStationOk();if(ok&&GBS&&GBS.hid)return '<div class="etst off" id="etst"><i aria-hidden="true"></i><span><b>Druckstation ist minimiert</b> · am Laptop das Fenster wieder öffnen, dann wird gedruckt</span></div>';return '<div class="etst '+(ok?'ok':'off')+'" id="etst"><i aria-hidden="true"></i><span>'+(ok?'<b>Druckstation bereit</b>'+(GBS.name?' · '+esc(GBS.name):''):'<b>Druckstation nicht erreichbar</b> · Auftrag wird gedruckt, sobald sie läuft')+'</span></div>'}
/* Dialog am Tablet / Handy / PC */
function gbDlg(p){if(!p)return;gbSub();let art="proj",n=1,inh="";const o=document.createElement("div");o.className="ov";
 const last=GBJ.filter(x=>x.pk===p.id).slice(0,2),pos=pkPosAll(p);
 const draw=()=>{o.innerHTML='<div class="card etdlg" style="width:100%;max-width:440px;margin:0;max-height:92vh;overflow:auto"><b style="font-size:18px">Etikett drucken</b><div class="mute">'+esc(p.ev||"")+' · Auftrag '+esc(p.ord||"–")+'</div>'+
  '<div class="etart"><label class="'+(art==="proj"?"on":"")+'"><input type="radio" name="etart" value="proj"'+(art==="proj"?" checked":"")+'><span><b>Projektlabel</b><small>Projekt groß</small></span></label><label class="'+(art==="inh"?"on":"")+'"><input type="radio" name="etart" value="inh"'+(art==="inh"?" checked":"")+'><span><b>Mit Inhalt</b><small>Inhalt der Box</small></span></label></div>'+
  '<div class="etn"><b>Anzahl Etiketten</b><span class="fmqs"><button type="button" id="etm" aria-label="Weniger">−</button><b>'+n+'</b><button type="button" id="etp" aria-label="Mehr">+</button></span></div>'+
  (art==="inh"?'<label class="mute" for="etinh" style="display:block;margin-top:10px">Inhalt</label><textarea id="etinh" rows="4" placeholder="z. B. 10 Stk Kabel 32A 50m">'+esc(inh)+'</textarea><div class="mute" style="font-size:12.5px;margin:4px 0">Antippen fügt die Zeile hinzu:</div><div class="etchips">'+pos.map((x,i)=>'<button type="button" class="etchip" data-eti="'+i+'">'+esc(pkNum(+x.n||0)+" "+(x.u||"Stk")+" "+pkName(x))+'</button>').join("")+'</div>':'')+
  gbStLine()+
  (last.length?'<div class="mute" style="font-size:12.5px;margin-top:6px">Zuletzt: '+last.map(x=>x.n+"× "+(x.art==="inh"?"mit Inhalt":"Projektlabel")+" – "+({neu:"wartet",druckt:"wird gedruckt",ok:"gedruckt",fehler:"Fehler"}[x.st]||x.st)+" "+fmt(x.t).slice(11)).join(" · ")+'</div>':'')+
  '<button class="btn" id="etgo" type="button" style="margin-top:12px">'+n+(n===1?' Etikett':' Etiketten')+' an die Druckstation</button>'+
  '<div class="row" style="margin-top:8px"><button class="btn ghost" id="etx" type="button">Abbrechen</button><button class="btn ghost" id="ethere" type="button">Hier drucken</button></div></div>';
  o.querySelectorAll('input[name="etart"]').forEach(r=>r.onchange=()=>{art=r.value;draw()});
  o.querySelector("#etm").onclick=()=>{n=Math.max(1,n-1);draw()};o.querySelector("#etp").onclick=()=>{n=Math.min(60,n+1);draw()};
  const t=o.querySelector("#etinh");if(t)t.oninput=()=>{inh=t.value};
  o.querySelectorAll("[data-eti]").forEach(b=>b.onclick=()=>{const x=pos[+b.dataset.eti];inh=(inh.trim()?inh.replace(/\s+$/,"")+"\n":"")+pkNum(+x.n||0)+" "+(x.u||"Stk")+" "+pkName(x);draw();const tt=o.querySelector("#etinh");if(tt){tt.focus();tt.selectionStart=tt.selectionEnd=tt.value.length}});
  o.querySelector("#etx").onclick=()=>o.remove();
  const job=()=>({pk:p.id,ord:p.ord||"",ev:p.ev||"",art,n,inh:art==="inh"?inh.trim():""});
  o.querySelector("#ethere").onclick=()=>{const j=job();o.remove();gbPrint(j).catch(()=>errBox("Drucken hat nicht geklappt."))};
  o.querySelector("#etgo").onclick=async()=>{const j=job(),b=o.querySelector("#etgo");b.disabled=true;
   try{await db.doc("druck/"+Date.now().toString(36)+Math.random().toString(36).slice(2,6)).set({...j,by:me,t:Date.now(),st:"neu"});o.remove();toast(gbStationOk()?"An die Druckstation geschickt":"Gespeichert – wird gedruckt, sobald die Druckstation läuft",1)}
   catch(e){b.disabled=false;errBox("Konnte nicht gesendet werden"+(typeof sbErr==="function"?sbErr(e):"")+".")}}};
 document.body.appendChild(o);draw()}
document.addEventListener("click",ev=>{const b=ev.target.closest&&ev.target.closest("#pketik");if(!b)return;const p=packs.find(x=>x.id===curPack);if(p)gbDlg(p)});
/* Ansicht Druckstation */
function gbStView(){$("#t").textContent="Druckstation";gbSub();const on=gbIsStation(),t0=pkDay(Date.now()),L=GBJ.filter(x=>(x.t||0)>=pkAddD(t0,-2)).slice(0,40);
 $("#app").innerHTML='<div class="card" style="cursor:default"><div class="row" style="align-items:center"><b style="flex:1;font-size:18px">Druckstation · Etiketten</b><span class="etsb '+(on?'ok':'off')+'">'+(on?'Dieses Gerät druckt':'Aus')+'</span></div>'+
  '<label class="fmchk" style="background:var(--okbg,#e3f3e8);color:inherit"><input type="checkbox" id="eton"'+(on?' checked':'')+'><span><b>Dieses Gerät ist die Druckstation</b><small>Druckaufträge vom Tablet werden hier automatisch gedruckt. Dieses Fenster offen lassen.</small></span></label>'+
  '<p class="mute" style="font-size:13px;margin:8px 0 0">Ohne Druckfenster nur, wenn Chrome mit „--kiosk-printing“ gestartet wurde und die Godex der Standarddrucker ist (Etikett 100 × 100 mm). <b>Fenster nicht minimieren</b> – sonst druckt Chrome nicht (Bildschirm darf ausgehen). Siehe Anleitung.</p>'+
  '<label class="mute" for="etrot" style="display:block;margin:12px 0 4px">Etikett drehen beim Drucken (dieses Gerät)</label><select id="etrot">'+[[0,"nicht drehen"],[90,"90° im Uhrzeigersinn"],[180,"180°"],[270,"90° gegen den Uhrzeigersinn"]].map(o=>'<option value="'+o[0]+'"'+(gbRot()===o[0]?' selected':'')+'>'+o[1]+'</option>').join("")+'</select>'+
  '<div class="row" style="margin-top:10px"><button class="btn ghost" id="ettest" type="button">Testetikett drucken</button></div></div>'+
  '<div class="card" style="cursor:default;padding:0;overflow:hidden"><div style="padding:10px 14px;font-weight:700;border-bottom:1px solid var(--line,#edf0f4)">Druckaufträge (letzte 3 Tage)</div>'+
  (L.length?L.map(x=>'<div class="etjob"><span><b>'+esc(x.ev||"–")+'</b> · '+x.n+'× '+(x.art==="inh"?"mit Inhalt":"Projektlabel")+'<small>'+esc(nm(x.by))+' · '+fmt(x.t)+(x.err?' · '+esc(x.err):'')+'</small></span><span class="etsb '+({ok:"ok",fehler:"err",neu:"wait",druckt:"wait"}[x.st]||"")+'">'+({neu:"wartet",druckt:"druckt …",ok:"gedruckt",fehler:"Fehler"}[x.st]||x.st)+'</span>'+(x.st==="fehler"||x.st==="ok"||x.st==="druckt"&&Date.now()-(x.dt||x.t||0)>60000?'<button class="lnk" type="button" data-etre="'+esc(x.id)+'">Nochmal</button>':'')+'</div>').join(""):'<div class="mute" style="padding:12px 14px">Noch keine Druckaufträge.</div>')+'</div>';
 $("#eton").onchange=e=>{try{localStorage.setItem("tpc_druckst",e.target.checked?"1":"0")}catch(x){}if(e.target.checked){gbBeat();gbRun()}else db.doc("druckst/main").set({t:0,by:me}).catch(()=>{});gbStView()};
 $("#etrot").onchange=e=>{try{localStorage.setItem("tpc_et_rot",e.target.value)}catch(x){}toast("Drehung gespeichert",1)};
 $("#ettest").onclick=()=>gbPrint({ord:"2601080-01",ev:"Testetikett Druckstation",art:"proj",n:1}).catch(()=>errBox("Drucken hat nicht geklappt."));
 document.querySelectorAll("[data-etre]").forEach(b=>b.onclick=()=>db.doc("druck/"+b.dataset.etre).update({st:"neu",err:""}).catch(()=>{}))}
/* Hinweis, wenn Chrome NICHT mit --kiosk-printing läuft: dann kommt bei jedem Auftrag ein Druckfenster und der Auftrag bleibt auf „druckt …“ */
function gbPrefBlock(){return can("pk_s")?'<h3 style="margin:18px 0 4px">Etiketten-Druckstation</h3><p class="mute" style="margin:0 0 8px">'+(gbIsStation()?'Dieses Gerät ist die Druckstation.':'Nur am Laptop/PC mit der Godex einschalten.')+'</p><button class="btn ghost" id="etstopen" type="button">Druckstation öffnen</button>':""}
function gbPrefBind(){const b=$("#etstopen");if(b)b.onclick=()=>go("druckst")}
/* Rücklauf: QR vom Etikett scannen */
function gbScanHit(raw){const r=gbParse(raw);if(r.ord){if(typeof beep==="function")beep(true);go("ret");setTimeout(()=>rOpenByNr(r.ord),50);return}
 if(typeof beep==="function")beep(false);errBox(r.old?"Altes Etikett – der QR-Code zeigt nur auf die Homepage. Bitte „Etikett fotografieren“ verwenden.":"Kein Gitterbox-Etikett erkannt.")}
function gbScanBind(){const b=$("#rqr");if(b)b.onclick=()=>rScanCam(gbScanHit)}
