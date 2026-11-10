/* ===== 1.128 – „Material“ in Meine Aufträge für Projektleiter (Jürgen, 5.11.; Entwurf https://claude.ai/artifact/8LeMr5yo3ZJW4Rh8PP97NL;
   gewählt: Spalten SOLL · RAUS · REIN, nach der ersten Retoure RAUS · REIN · DIFF; Gruppen wie beim Herrichten; Filter inkl. „Schon zurück“; kein PDF).
   Zahlen pro Artikel (Packschein + Zusätze + Ersatz + zusätzlich Mitgegebenes zusammengefasst über abgKey):
   SOLL = laut Packschein(en), RAUS = vom Lager mitgegeben (abgBal .soll, ohne Fremdmiete/Lager 55), REIN = zurück (abgBal .back),
   DIFF = REIN − RAUS (fehlt negativ; zu viel nur, was nicht durch Fremdmiete/Lager 55 erklärt ist). ===== */
(function(){try{const st=document.createElement("style");st.textContent=
'.amk{display:grid;grid-template-columns:repeat(4,1fr);border:2px solid var(--line);border-radius:10px;overflow:hidden;margin:10px 0 8px}.amk div{padding:7px 4px;text-align:center;font-size:12px;color:var(--mute);border-left:1px solid var(--line);line-height:1.2}.amk div:first-child{border-left:0}.amk b{display:block;font-size:19px;color:var(--ink);font-variant-numeric:tabular-nums}.amk .or b{color:#b35400}.amk .red b{color:#b8322a}'+
'.amch{display:flex;gap:6px;flex-wrap:wrap;margin:0 0 8px}.amch button{border:2px solid var(--line);border-radius:999px;padding:6px 11px;font:inherit;font-size:13px;font-weight:700;background:var(--card);color:var(--ink);cursor:pointer;min-height:36px}.amch button.on{background:var(--navy);border-color:var(--navy);color:#fff}'+
'.amq{margin:0 0 8px}.amt{border:2px solid var(--line);border-radius:10px;overflow:hidden}'+
'.amh,.amr{display:grid;grid-template-columns:minmax(0,1fr) 44px 44px 44px;gap:6px;padding:8px 10px;align-items:start}.amh{background:var(--bg);font-size:11px;font-weight:800;letter-spacing:.05em;text-transform:uppercase;color:var(--mute)}.amh span:not(:first-child){text-align:right}'+
'.amg{padding:6px 10px;font-size:12.5px;font-weight:800;color:var(--navy);background:#eef3fb;border-top:1px solid var(--line)}.amg.l55{color:var(--mute);background:var(--bg)}'+
'.amr{border-top:1px solid var(--line);font-size:14px}.amr .n{min-width:0;overflow-wrap:anywhere}.amr .n small{display:block;font-size:12px;color:var(--mute);line-height:1.35}.amr .n small.or{color:#b35400;font-weight:600}.amr .n small.red{color:#b8322a;font-weight:600}.amr .n small.pl{color:var(--navy)}'+
'.amr .q{text-align:right;font-variant-numeric:tabular-nums;font-weight:700}.amr .q.m{color:var(--mute);font-weight:500}.amr .q.or{color:#b35400}.amr .q.red{color:#b8322a}.amr .q.ok{color:#1f6b41}.amr.dev{background:#fff6ea}.amr.l55{color:var(--mute)}'+
'.ame{padding:12px;color:var(--mute);font-size:14px}.amz{margin-top:12px}.amz .amg{border-top:0;display:flex;flex-direction:column;gap:1px}.amz .amg small{font-weight:600;color:var(--mute);font-size:12px}'+
'@media (prefers-color-scheme:dark){:root:not([data-theme="light"]) .amg{background:#16294a;color:#8fb0ea}:root:not([data-theme="light"]) .amr.dev{background:#3a2610}:root:not([data-theme="light"]) .amr .n small.or,:root:not([data-theme="light"]) .amr .q.or,:root:not([data-theme="light"]) .amk .or b{color:#ffb066}:root:not([data-theme="light"]) .amr .n small.red,:root:not([data-theme="light"]) .amr .q.red,:root:not([data-theme="light"]) .amk .red b{color:#ff9d92}:root:not([data-theme="light"]) .amr .q.ok{color:#8fd3a8}:root:not([data-theme="light"]) .amr .n small.pl{color:#8fb0ea}}'+
':root[data-theme="dark"] .amg{background:#16294a;color:#8fb0ea}:root[data-theme="dark"] .amr.dev{background:#3a2610}:root[data-theme="dark"] .amr .n small.or,:root[data-theme="dark"] .amr .q.or,:root[data-theme="dark"] .amk .or b{color:#ffb066}:root[data-theme="dark"] .amr .n small.red,:root[data-theme="dark"] .amr .q.red,:root[data-theme="dark"] .amk .red b{color:#ff9d92}:root[data-theme="dark"] .amr .q.ok{color:#8fd3a8}:root[data-theme="dark"] .amr .n small.pl{color:#8fb0ea}';
document.head.appendChild(st)}catch(e){}})();
let amF="alle",amQ="",amOpen={},amPk=null;
function amRows(p,B){const H=pkH(p),M={},num=v=>pkNum(v);
 let ord=0;const get=(k,nm,code,u)=>M[k]=M[k]||{k,first:ord++,name:nm,code:code||"",u:u||"Stk",ps:0,zus:{},dev:[],ers:[],devBy:"",x:0,raus:0,fr:0,l55:0,back:0};
 pkItems(p).forEach(o=>{const x=o.x,h=H[o.k],c=artCode(x.a),nm=pkName(x),e=get(abgKey(c,nm),nm,c,x.u),st=pkPS(x,h);e.ps+=+x.n||0;if(o.z)e.zus[o.z]=(e.zus[o.z]||0)+(+x.n||0);
  if(pkDevRow(x,h,st)&&h){let w="";try{w=nmA(h,"by")}catch(er){}e.devBy=[w,h.t?fmt(h.t).slice(0,6):""].filter(Boolean).join(" ")}
  if(st.s!=="open")(st.alt||[]).forEach(a=>{const kk=pkKat({a:a.a}),an=kk?kk.name:a.t,ac=artCode(a.a),ea=get(abgKey(ac,an),an,ac,x.u);if(!ea.ers.includes(nm))ea.ers.push(nm)})});
 if(typeof pkX==="function")pkX(p).forEach(e=>{const c=artCode(e.a),nm=pkXName(e),r=get(abgKey(c,nm),nm,c,e.u);r.x+=+e.n||0});
 /* Abweichungs-Texte wie in der Zeitleiste, dem Artikel zugeordnet */
 const dl=[...auDevLines(p,null),...(p.zus||[]).flatMap(z=>auDevLines(p,String(z.ps)))];
 Object.values(M).forEach(e=>{const pre=e.name+": ";dl.forEach(l=>{if(l.startsWith(pre))e.dev.push(l.slice(pre.length))})});
 (B.L||[]).forEach(b=>{const e=M[b.k]||get(b.k,b.name,b.code);e.raus=b.soll;e.fr=b.fr;e.l55=b.l55;e.back=b.back});
 /* feste Reihenfolge wie beim Herrichten (pkRanks = Artikelliste nach Gruppe/Untergruppe/Position), sonst Packschein-Reihenfolge – rkat kommt ungeordnet aus der Datenbank */
 const RK=typeof pkRanks==="function"?pkRanks():{},ix=e=>e.code&&e.code in RK?RK[e.code]:1e6;
 return Object.values(M).map(e=>{const only55=e.l55>0&&!e.raus&&!e.fr;e.grp=only55?"Lager 55 – holt Fahrer/Monteur":pkGrp({a:e.code});
  e.sl=Math.max(0,e.ps-e.fr-(only55?0:e.l55));e.diff=e.back<e.raus?e.back-e.raus:Math.max(0,e.back-e.raus-e.fr-e.l55);e.isDev=e.dev.length>0||e.ers.length>0||e.x>0;e.ans=(typeof auAns==="function"?auAns(p,e.k)[0]:null)||null;e.only55=only55;return e})
  .filter(e=>e.ps||e.raus||e.back||e.x||e.l55).sort((a,b)=>(a.only55-b.only55)||(a.grp==="Nicht in der Artikelliste")-(b.grp==="Nicht in der Artikelliste")||ix(a)-ix(b)||a.first-b.first)}
function amFilters(R,ph2,endish){const F=[["alle","Alle",R.length],["dev","Abweichungen",R.filter(e=>e.isDev).length],["fr","Fremdmiete",R.filter(e=>e.fr>0).length],["l55","Lager 55",R.filter(e=>e.l55>0).length]];
 if(ph2){F.push(endish?["miss","Fehlmaterial",R.filter(e=>e.diff<0).length]:["out","Noch draußen",R.filter(e=>e.diff<0).length]);F.push(["back","Schon zurück",R.filter(e=>e.back>0).length])}
 return F.filter(f=>f[0]==="alle"||f[2]>0)}
function amPass(e){if(amF==="dev"&&!e.isDev)return false;if(amF==="fr"&&!(e.fr>0))return false;if(amF==="l55"&&!(e.l55>0))return false;if((amF==="out"||amF==="miss")&&!(e.diff<0))return false;if(amF==="back"&&!(e.back>0))return false;
 const q=amQ.trim();if(!q)return true;const T=dxNorm(q).split(" ").filter(Boolean),h=" "+dxNorm(e.name+" "+e.code+" "+e.grp)+" ";return T.every(t=>h.includes(t))}
function amBody(p,B,I){const R=amRows(p,B),ph2=!!(B.R&&B.R.length),endish=!!(B.hasEnd||(I&&I.over)),F=amFilters(R,ph2,endish);if(!F.some(f=>f[0]===amF))amF="alle";
 const L=R.filter(amPass),n=v=>pkNum(v),dash='<span class="q m">–</span>';
 const sum=k=>R.reduce((a,e)=>a+(+e[k]||0),0),raus=sum("raus"),back=R.reduce((a,e)=>a+Math.min(e.back,e.raus),0),devN=R.filter(e=>e.isDev).length,miss=R.reduce((a,e)=>a+(e.diff<0?-e.diff:0),0),more=R.reduce((a,e)=>a+(e.diff>0?e.diff:0),0);
 const kpi=ph2?'<div class="amk"><div><b>'+n(raus)+'</b>raus</div><div><b>'+n(back)+'</b>rein</div><div class="'+(miss?'red':'')+'"><b>'+n(miss)+'</b>'+(endish?'Fehlmaterial':'noch draußen')+'</div><div class="'+(more?'or':'')+'"><b>'+n(more)+'</b>zu viel</div></div>'
  :'<div class="amk"><div><b>'+n(R.filter(e=>!e.only55).reduce((a,e)=>a+e.sl,0))+'</b>Soll</div><div><b>'+n(raus)+'</b>raus</div><div class="'+(devN?'or':'')+'"><b>'+devN+'</b>Abweich.</div><div><b>'+n(sum("fr"))+'</b>Fremdmiete</div></div>';
 const head='<div class="amh"><span>Artikel</span>'+(ph2?'<span>Raus</span><span>Rein</span><span>Diff</span>':'<span>Soll</span><span>Raus</span><span>Rein</span>')+'</div>';
 let g0=null,rows="";L.forEach(e=>{if(e.grp!==g0){g0=e.grp;rows+='<div class="amg'+(e.only55?' l55':'')+'">'+esc(g0)+'</div>'}
  const notes=[];const u=" "+(e.u||"Stk");
  const zk=Object.keys(e.zus);if(zk.length)notes.push('<small>inkl. '+zk.map(z=>n(e.zus[z])+u+' aus Zusatz '+esc(z)).join(", ")+'</small>');
  e.dev.forEach(d=>notes.push('<small class="or">'+esc(d)+'</small>'));if(e.isDev&&e.devBy&&(amF==="dev"))notes.push('<small>'+esc(e.devBy)+'</small>');
  if(e.ers.length)notes.push('<small class="or">Ersatz für '+e.ers.map(esc).join(", ")+'</small>');
  if(e.x)notes.push('<small class="or">'+n(e.x)+u+' zusätzlich mitgegeben (nicht im Packschein)</small>');
  if(e.fr>0)notes.push('<small class="red">laut Packschein '+n(e.ps)+u+', davon '+n(e.fr)+u+' Fremdmiete – kommt nicht vom Lager</small>');
  if(e.l55>0&&!e.only55)notes.push('<small>'+n(e.l55)+u+' über Lager 55</small>');
  if(e.only55&&e.back>0)notes.push('<small>'+n(e.back)+u+' kam über uns statt Lager 55 zurück</small>');if(e.ans)notes.push('<small class="pl">'+esc(auAnsTxt(e.ans))+'</small>');
  if(e.u&&e.u!=="Stk")notes.push('<small>Menge in '+esc(e.u)+'</small>');
  const c1=e.only55?'<span class="q m">'+n(e.l55)+'</span>':'<span class="q m">'+n(e.sl)+'</span>',cR=e.only55?dash:'<span class="q'+(e.raus!==e.sl?' or':'')+'">'+n(e.raus)+'</span>',cB=e.back?'<span class="q ok">'+n(e.back)+'</span>':dash;
  const cD=e.only55&&!e.back?dash:'<span class="q '+(e.diff<0?'red':e.diff>0?'or':'m')+'">'+(e.diff>0?'+'+n(e.diff):e.diff<0?'−'+n(-e.diff):'0')+'</span>';
  rows+='<div class="amr'+(e.isDev?' dev':'')+(e.only55?' l55':'')+'"><span class="n">'+esc(e.name)+notes.join("")+'</span>'+(ph2?(e.only55?dash:'<span class="q m">'+n(e.raus)+'</span>')+cB+cD:c1+cR+cB)+'</div>'});
 return kpi+'<div class="amch">'+F.map(f=>'<button type="button" data-amf="'+f[0]+'" class="'+(amF===f[0]?'on':'')+'">'+esc(f[1])+(f[0]==="alle"?'':' '+f[2])+'</button>').join("")+'</div>'+
  '<input class="amq" id="amq" type="search" placeholder="Artikel suchen …" value="'+esc(amQ)+'" autocomplete="off">'+
  '<div class="amt">'+head+(rows||'<div class="ame">Nichts gefunden.</div>')+'</div>'+amZus(p)}
/* 1.130: Zusätze unten zusätzlich einzeln anführen (oben bleibt alles zusammengerechnet) – Jürgen, 5.11. */
function amZus(p){if(amF!=="alle"||!(p.zus||[]).length)return "";const H=pkH(p),n=v=>pkNum(v),q=amQ.trim(),T=q?dxNorm(q).split(" ").filter(Boolean):[];
 return (p.zus||[]).map(z=>{const ps=String(z.ps||""),zf=pkZFin(p,z),za=zf?null:auHerrAll(p,ps),g=pkZProg(p,ps);
  const st=zf?"hergerichtet "+fmt(zf.t).slice(0,6)+" von "+nmA(zf,"by"):za?"hergerichtet"+(za.t?" "+fmt(za.t).slice(0,6):"")+(za.who?" von "+za.who:""):g.d?"wird hergerichtet: "+g.d+" von "+g.n+" Positionen":"herrichten "+pkWd(pkZDay(p,z));
  let rows="";pkItems(p).forEach(o=>{if(o.z!==ps)return;const x=o.x,h=H[o.k],l55=pkL55(x,h),pst=pkPS(x,h),f=h&&h.fm==="lager"?0:(+x.f||0),own=Math.max(0,(+x.n||0)-f-pkNbN(x,h)),nm=pkName(x),u=" "+(x.u||"Stk");
   if(T.length&&!T.every(t=>(" "+dxNorm(nm+" "+(x.a||""))+" ").includes(t)))return;
   const raus=l55?null:pst.s==="open"?null:h&&h.ok?own:Math.min(own,+pst.q||0)+pkOver(x,h,pst),dev=!l55&&pkDevRow(x,h,pst),notes=[];
   (pst.s!=="open"?pst.alt||[]:[]).forEach(al=>notes.push('<small class="or">stattdessen '+n(+al.n||0)+u+' '+esc(al.t)+'</small>'));
   if(f>0)notes.push('<small class="red">laut Packschein '+n(+x.n||0)+u+', davon '+n(f)+u+' Fremdmiete</small>');if(l55)notes.push('<small>Lager 55 – holt Fahrer/Monteur</small>');
   rows+='<div class="amr'+(dev?' dev':'')+(l55?' l55':'')+'"><span class="n">'+esc(nm)+notes.join("")+'</span><span class="q m">'+n(own)+'</span>'+(raus===null?'<span class="q m">–</span>':'<span class="q'+(raus!==own?' or':'')+'">'+n(raus)+'</span>')+'<span></span></div>'});
  if(!rows)return "";
  return '<div class="amt amz"><div class="amg">Zusatz '+esc(ps)+'<small>'+esc(st)+'</small></div><div class="amh"><span>Artikel</span><span>Soll</span><span>Raus</span><span></span></div>'+rows+'</div>'}).join("")}
function auMat(p,B,I){if(amPk!==p.id){amPk=p.id;amF="alle";amQ=""}const ph2=!!(B.R&&B.R.length),cnt=pkPosAll(p).length;
 setTimeout(()=>amBind(p,B,I),0);
 return '<details class="card aucd aumat" id="amd"'+(amOpen[p.id]?' open':'')+'><summary><b>Material</b><small>'+pkPosN(cnt)+((p.zus||[]).length?' · '+(p.zus.length===1?'1 Zusatz':p.zus.length+' Zusätze'):'')+(ph2?' · Retouren da':'')+'</small></summary><div id="amb">'+amBody(p,B,I)+'</div></details>'}
function amBind(p,B,I){const d=document.getElementById("amd");if(!d)return;d.ontoggle=()=>{amOpen[p.id]=d.open};
 const re=(foc)=>{const b=document.getElementById("amb");if(!b)return;b.innerHTML=amBody(p,B,I);amBind2(p,B,I,foc)};amBind2(p,B,I,null,re)}
function amBind2(p,B,I,foc,re){re=re||(f=>{const b=document.getElementById("amb");if(!b)return;b.innerHTML=amBody(p,B,I);amBind2(p,B,I,f)});
 document.querySelectorAll("[data-amf]").forEach(b=>b.onclick=()=>{amF=b.dataset.amf;re(null)});
 const q=document.getElementById("amq");if(q){q.oninput=()=>{amQ=q.value;re(q.selectionStart)};if(foc!==null&&foc!==undefined){q.focus();try{q.setSelectionRange(foc,foc)}catch(e){}}}}
