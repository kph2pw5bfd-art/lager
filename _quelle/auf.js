/* ===== 1.191 – Auftrag suchen + Auftrags-Seite (Jürgen 25.11., Entwurf https://claude.ai/artifact/LbUgFe36XFcDPg4Z6FCYpm, „bauen“)
   Suchfeld „Auftrag suchen“ in der Kopfkarte der Lager Übersicht (unter dem Frag-Feld): Veranstaltung, Auftrags-Nr., Packschein-Nr. (auch Zusätze), Projektleiter.
   Treffer ab 2 Zeichen, laufend zuerst, dann „Erledigt / älter“; findet auch Aufträge nur mit Retourschein/Defekt.
   Auftrags-Seite (view "auftr", curAuf = Schlüssel "o:<Ziffern>" oder "e:<Veranstaltung>"): Kopf, Zahlen, Sprungknöpfe, Packschein und Herrichten,
   Retourscheine und Abgleich, Defekte, Material vor Ort, Nachrichten und Notizen, Verlauf. Nur was die Rechte erlauben, leere Bereiche fallen weg.
   Kunde kommt erst nach dem Umzug (Entscheidung 9.11.). ===== */
let curAuf=null,aufQ="";
(function(){try{const st=document.createElement("style");st.textContent=
'.aufs{display:flex;flex-direction:column;gap:4px;margin-top:10px;position:relative}.aufs label{font-size:12px;font-weight:800;color:var(--mute)}'+
'.aufbox{display:flex;align-items:center;gap:8px;border:2.5px solid var(--navy);border-radius:10px;padding:0 6px 0 10px;background:var(--card)}.aufbox svg{flex:none;color:var(--navy)}'+
'.aufbox input{flex:1;border:0!important;outline:0;font:inherit;font-size:16px;padding:11px 0!important;margin:0!important;background:transparent!important;color:var(--ink);box-shadow:none!important;min-width:0}'+
'.aufx{border:0;background:none;color:var(--mute);font-size:22px;line-height:1;cursor:pointer;padding:6px 8px}.aufhint{font-size:12px;color:var(--mute)}'+
'.aufsug{position:absolute;left:0;right:0;top:100%;z-index:30;margin-top:4px;background:var(--card);border:2px solid var(--line);border-radius:12px;box-shadow:0 8px 22px rgba(17,33,47,.18);max-height:60vh;overflow:auto}'+
'.aufg{font-size:11px;font-weight:800;color:var(--mute);padding:9px 12px 4px;letter-spacing:.03em}.aufr{display:flex;flex-direction:column;gap:2px;width:100%;text-align:left;border:0;border-top:1px solid var(--line);background:none;font:inherit;color:var(--ink);padding:10px 12px;cursor:pointer}.aufr:hover,.aufr:focus-visible{background:rgba(17,74,151,.06);outline:0}'+
'.aufr .t{display:flex;justify-content:space-between;gap:8px;align-items:center}.aufr b{font-size:15px}.aufr small{font-size:13px;color:var(--mute)}.aufr mark{background:#fff1b8;color:inherit;padding:0}.aufnone{padding:12px;color:var(--mute);font-size:14px}'+
'.aftg{flex:none;font-size:11px;font-weight:800;border-radius:6px;padding:2px 7px;white-space:nowrap}.aftg.red{background:#fbebeb;color:#b8322a}.aftg.or{background:#fff1e3;color:#9a4d00}.aftg.ok{background:#e3f3e9;color:#1f6b41}.aftg.b{background:#e6eef9;color:#114a97}.aftg.g{background:var(--line);color:var(--ink)}.aftg.rs{background:#b8322a;color:#fff}'+
'.afk{background:var(--card);border:2.5px solid var(--navy);border-radius:12px;padding:14px;display:flex;flex-direction:column;gap:8px}.afk h2{margin:0;font-size:22px;line-height:1.15}.afk .m{font-size:14px;color:var(--mute);line-height:1.5}.afk .m b{color:var(--ink)}'+
'.afst{display:grid;grid-template-columns:repeat(5,minmax(0,1fr));gap:4px;margin-top:4px}.afst span{display:flex;flex-direction:column;align-items:center;gap:4px;font-size:10.5px;font-weight:700;color:var(--mute)}.afst span:before{content:"";width:100%;height:6px;border-radius:3px;background:var(--line)}'+
'.afst .d{color:#1f6b41}.afst .d:before{background:#2a7d4f}.afst .n{color:#114a97}.afst .n:before{background:#5b86c7}.afst .r{color:#b8322a}.afst .r:before{background:#b8322a}.afst .w{color:#9a4d00}.afst .w:before{background:#e67e22}'+
'.aftags{display:flex;gap:6px;flex-wrap:wrap}.afnum{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:6px}.afnum div{background:var(--card);border:2px solid var(--line);border-radius:10px;padding:8px 4px;text-align:center}.afnum b{display:block;font-size:20px}.afnum b.red{color:#b8322a}.afnum span{font-size:11px;color:var(--mute)}'+
'.afjump{display:flex;gap:6px;flex-wrap:wrap}.afjump button{font:inherit;font-size:13px;font-weight:700;border:2px solid var(--navy);border-radius:999px;padding:6px 11px;background:var(--card);color:var(--navy);cursor:pointer}'+
'.afsec{background:var(--card);border:2.5px solid var(--navy);border-radius:12px;overflow:hidden;scroll-margin-top:70px}.afsec>h3{margin:0;background:var(--navy);color:#fff;padding:8px 12px;font-size:14px;font-weight:800}'+
'.afrow{display:flex;align-items:center;gap:10px;width:100%;text-align:left;border:0;border-top:1px solid var(--line);background:none;font:inherit;color:var(--ink);padding:11px 12px;cursor:pointer}.afsec>h3+.afrow{border-top:0}.afrow:hover{background:rgba(17,74,151,.05)}.afrow.hot{background:#fdf3f2}'+
'.afrow .tx{flex:1;display:flex;flex-direction:column;gap:2px;min-width:0}.afrow b{font-size:15px}.afrow small{font-size:13px;color:var(--mute)}.afrow .ch{color:var(--navy);font-weight:800;flex:none}'+
'.afinf{padding:10px 12px;border-top:1px solid var(--line);font-size:13.5px;line-height:1.55}.afinf .lb{font-weight:800}.afinf .red{color:#b8322a}.afinf .or{color:#9a4d00}.afinf .ok{color:#1f6b41}.afinf .mu{color:var(--mute)}.afinf p{margin:0 0 6px}.afinf p:last-child{margin:0}'+
'.afver{background:var(--card);border:2px solid var(--line);border-radius:12px;padding:10px 12px;scroll-margin-top:70px}.afver h3{margin:0 0 6px;font-size:12px;font-weight:800;color:var(--mute)}.afver div{display:flex;gap:10px;font-size:13.5px;line-height:1.5;padding:3px 0}.afver div span:first-child{flex:none;width:44px;color:var(--mute);font-variant-numeric:tabular-nums}'+
'.afwrap{display:flex;flex-direction:column;gap:12px}.afnote{font-size:12px;color:var(--mute);line-height:1.45;margin:0 2px}'+
'@media (prefers-color-scheme:dark){:root:not([data-theme="light"]) .aufr mark{background:#6b5a10;color:#fff}:root:not([data-theme="light"]) .afrow.hot{background:#3d1d1d}:root:not([data-theme="light"]) .aftg.red{background:#4a1612;color:#ffb4a8}:root:not([data-theme="light"]) .aftg.or{background:#3a2610;color:#ffcf99}:root:not([data-theme="light"]) .aftg.ok{background:#16402a;color:#9fe0b8}:root:not([data-theme="light"]) .aftg.b{background:#16294a;color:#c7dbff}:root:not([data-theme="light"]) .afjump button,:root:not([data-theme="light"]) .afrow .ch,:root:not([data-theme="light"]) .aufbox svg{color:#8fb0ea}:root:not([data-theme="light"]) .afinf .red,:root:not([data-theme="light"]) .afnum b.red{color:#ff9d92}:root:not([data-theme="light"]) .afinf .ok{color:#7fd6a2}:root:not([data-theme="light"]) .afinf .or{color:#ffbf7a}}'+
':root[data-theme="dark"] .aufr mark{background:#6b5a10;color:#fff}:root[data-theme="dark"] .afrow.hot{background:#3d1d1d}:root[data-theme="dark"] .aftg.red{background:#4a1612;color:#ffb4a8}:root[data-theme="dark"] .aftg.ok{background:#16402a;color:#9fe0b8}:root[data-theme="dark"] .afjump button,:root[data-theme="dark"] .afrow .ch{color:#8fb0ea}';
document.head.appendChild(st)}catch(e){}})();
const afN=s=>typeof dxNorm==="function"?dxNorm(s):String(s||"").toLowerCase().trim();
const afD=s=>String(s||"").replace(/\D/g,"");
const afSN=n=>typeof shortName==="function"?shortName(n):(n||"");
const afWho=(o,f)=>{try{return typeof nmA==="function"?nmA(o,f):""}catch(e){return ""}};
const afDM=t=>{if(!t)return"";const d=new Date(t);return String(d.getDate()).padStart(2,"0")+"."+String(d.getMonth()+1).padStart(2,"0")+"."};
const afDMY=t=>{if(!t)return"";const d=new Date(t);return afDM(t)+(d.getFullYear()!==new Date().getFullYear()?d.getFullYear():"")};
const afQ=(n,u)=>(typeof pkNum==="function"?pkNum(+n||0):String(n))+" "+(u||"Stk");
/* ---------- Suche ---------- */
function aufIndex(){const M={},key=(ord,ev)=>afD(ord)?"o:"+afD(ord):(afN(ev)?"e:"+afN(ev):"");
 const put=(k,o)=>{if(!k)return null;const x=M[k]=M[k]||{k,ev:"",ord:"",pl:"",ps:[],t:0,p:null,act:false,ret:0,rop:false};if(o.ev&&!x.ev)x.ev=o.ev;if(o.ord&&!x.ord)x.ord=o.ord;if(o.pl&&!x.pl)x.pl=o.pl;x.t=Math.max(x.t,o.t||0);return x};
 if(typeof packs!=="undefined"&&can("pk_s"))packs.forEach(p=>{if(p._z)return;const r=typeof pkRoot==="function"?pkRoot(p):p;const k=key(r.ord,r.ev),x=put(k,{ev:r.ev,ord:r.ord,pl:r.pl,t:r.de||r.db||r.t});if(!x)return;
  if(p.ps)x.ps.push(String(p.ps));(p.zus||[]).forEach(z=>z.ps&&x.ps.push(String(z.ps)));if(p!==r&&p.ord)x.ps.push(String(p.ord));
  if(p===r){x.p=r;x.ev=r.ev||x.ev;x.ord=r.ord||x.ord;x.pl=r.pl||x.pl;let s=null;try{s=pkState(r)}catch(e){}x.st=s;x.act=!!(s&&s.k!=="done");x.db=r.db;x.de=r.de}});
 if(typeof rets!=="undefined"&&can("ret_s"))rets.forEach(r=>{let k=key(r.ord,r.ev);const pp=r.ord&&typeof abgPackOf==="function"&&can("pk_s")?abgPackOf(r.ord):null;if(pp)k=key(pp.ord,pp.ev);const x=put(k,{ev:r.ev,ord:r.ord,t:r.modT||r.t});if(x){x.ret++;if(!r.closed)x.rop=true}});
 (typeof vdefs==="function"?vdefs():[]).forEach(d=>{if(d.del)return;const rr=d.ret&&!afD(d.ord)&&typeof rets!=="undefined"?rets.find(r=>r.id===d.ret):null;if(rr)d={...d,ord:rr.ord,ev:d.ev||rr.ev};let k=key(d.ord,d.ev);const pp=d.ord&&typeof abgPackOf==="function"&&can("pk_s")?abgPackOf(d.ord):null;if(pp)k=key(pp.ord,pp.ev);put(k,{ev:d.ev,ord:d.ord,t:d.t})});
 /* nur Veranstaltung ohne Nummer → zum Auftrag mit gleicher Veranstaltung (neuester) */
 Object.values(M).filter(x=>x.k.startsWith("e:")).forEach(x=>{const c=Object.values(M).filter(y=>y.k.startsWith("o:")&&afN(y.ev)===x.k.slice(2)).sort((a,b)=>(b.t||0)-(a.t||0))[0];if(c){c.ret+=x.ret;c.rop=c.rop||x.rop;c.t=Math.max(c.t,x.t);delete M[x.k]}});
 return Object.values(M).map(x=>(x.p?x:{...x,act:x.rop}))}
function aufFind(q){const T=afN(q).split(" ").filter(Boolean),D=afD(q);if(!T.length)return{A:[],B:[]};
 const L=aufIndex().filter(x=>{const h=" "+afN([x.ev,x.ord,x.pl,afSN(x.pl),x.ps.join(" ")].join(" "))+" ";if(T.every(t=>h.includes(t)))return true;
  return D.length>=3&&D.length===q.replace(/\s/g,"").length&&(afD(x.ord).includes(D)||x.ps.some(s=>afD(s).includes(D)))});
 const A=L.filter(x=>x.act).sort((a,b)=>(a.de||a.t||9e15)-(b.de||b.t||9e15)),B=L.filter(x=>!x.act).sort((a,b)=>(b.t||0)-(a.t||0));
 return{A:A.slice(0,10),B:B.slice(0,Math.max(4,12-Math.min(A.length,10)))}}
function aufMark(s,q){const t=String(s||"");const T=afN(q).split(" ").filter(x=>x.length>=2);if(!T.length)return esc(t);const low=t.toLowerCase();let out="",i=0;
 while(i<t.length){let hit=0;for(const w of T){if(low.startsWith(w,i)&&w.length>hit)hit=w.length}if(hit){out+="<mark>"+esc(t.slice(i,i+hit))+"</mark>";i+=hit}else{out+=esc(t[i]);i++}}return out}
function aufTag(x){if(x.p){let I=null;try{I=auInfo(x.p)}catch(e){}const chk=typeof abgToCheck==="function"&&abgToCheck().some(c=>c.id===x.p.id);
  if(chk)return '<span class="aftg or">Zu prüfen</span>';if(I){const m={ok:"ok",red:"red",b:"b",g:"g"}[I.cls]||"b";return '<span class="aftg '+m+'">'+esc(I.lab)+'</span>'}}
 return x.rop?'<span class="aftg b">Retourschein offen</span>':x.ret?'<span class="aftg g">nur Retourschein</span>':'<span class="aftg g">nur Defekt</span>'}
function aufSugHtml(q){const R=aufFind(q),all=[...R.A,...R.B];if(!all.length)return '<div class="aufnone">Kein Auftrag gefunden.</div>';
 const row=(x,i)=>'<button type="button" class="aufr" data-aufo="'+i+'"><span class="t"><b>'+aufMark(x.ev||"Ohne Veranstaltung",q)+'</b>'+aufTag(x)+'</span><small>'+[x.ord?"Auftrag "+aufMark(x.ord,q):"ohne Auftragsnummer",x.db||x.de?"Dispo "+afDM(x.db)+"–"+afDMY(x.de):"",x.pl?aufMark(afSN(x.pl),q):""].filter(Boolean).join(" · ")+(x.ps.length&&afD(q).length>=3&&x.ps.some(s=>afD(s).includes(afD(q)))?' · Packschein '+aufMark(x.ps.find(s=>afD(s).includes(afD(q))),q):'')+'</small></button>';
 aufSugHtml.L=all;return (R.A.length?'<div class="aufg">LAUFEND ('+R.A.length+')</div>'+R.A.map((x,i)=>row(x,i)).join(""):'')+(R.B.length?'<div class="aufg">ERLEDIGT / ÄLTER ('+R.B.length+')</div>'+R.B.map((x,i)=>row(x,R.A.length+i)).join(""):'')}
function aufSearchHtml(){return '<div class="aufs" id="aufs"><label for="aufq">Auftrag suchen</label><div class="aufbox"><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" aria-hidden="true"><circle cx="11" cy="11" r="7"/><path d="M20 20l-4-4"/></svg><input id="aufq" type="text" enterkeyhint="search" autocomplete="off" placeholder="Veranstaltung, Auftrag, Packschein, PL"><button type="button" class="aufx" id="aufx" aria-label="Suche leeren" hidden>×</button></div><div class="aufsug" id="aufsug" hidden></div></div>'}
function aufSearchBind(){const q=$("#aufq"),box=$("#aufsug"),x=$("#aufx");if(!q||q._af)return;q._af=1;q.value=aufQ;
 const show=()=>{aufQ=q.value;x.hidden=!q.value;if(q.value.trim().length<2){box.hidden=true;return}box.innerHTML=aufSugHtml(q.value.trim());box.hidden=false;
  box.querySelectorAll("[data-aufo]").forEach(b=>{b.onmousedown=e=>e.preventDefault();b.onclick=()=>{const it=aufSugHtml.L[+b.dataset.aufo];box.hidden=true;aufOpen(it.k)}})};
 q.addEventListener("input",show);q.addEventListener("focus",()=>{if(q.value.trim().length>=2)show()});q.addEventListener("blur",()=>setTimeout(()=>{box.hidden=true},200));
 q.addEventListener("keydown",e=>{if(e.key==="Escape"){box.hidden=true;q.blur()}if(e.key==="Enter"){const b=box.querySelector("[data-aufo]");if(b&&!box.hidden)b.click()}});
 x.onclick=()=>{q.value="";aufQ="";x.hidden=true;box.hidden=true;q.focus()}}
function aufOpen(k){curAuf=k;go("auftr")}
/* in die Kopfkarte der Lager Übersicht (nicht Werkstatt/PL) */
(function(){const o=jarvisView;jarvisView=function(){o.apply(this,arguments);try{if(!$("#jv")||$("#aufs"))return;const op=document.querySelector("#jv .jvhead .jvopts");if(op){op.insertAdjacentHTML("afterend",aufSearchHtml());aufSearchBind()}}catch(e){console.warn(e)}}})();
/* ---------- Daten zu einem Auftrag ---------- */
function aufData(k){const isO=String(k).startsWith("o:"),dig=isO?k.slice(2):"",evk=isO?"":String(k).slice(2);
 let p=null;if(isO&&can("pk_s")&&typeof abgPackOf==="function")p=abgPackOf(dig);
 if(!p&&!isO&&can("pk_s"))p=packs.find(x=>!x._z&&!afD(x.ord)&&afN(x.ev)===evk)||null;
 const P=p?[p].concat(typeof pkVerlKids==="function"?pkVerlKids(p):[]):[],S=new Set(P.map(x=>afD(x.ord)).filter(Boolean));if(dig)S.add(dig);
 const ev=p?p.ev:"",match=(ord,e)=>S.size?S.has(afD(ord)):afN(e)===evk;
 const R=can("ret_s")?(p&&typeof pkRets==="function"?pkRets(p):rets.filter(r=>match(r.ord,r.ev))).slice().sort((a,b)=>(abgRetT(a)||0)-(abgRetT(b)||0)):[];
 const RI=new Set(R.map(r=>r.id));
 const D=(typeof vdefs==="function"?vdefs():[]).filter(d=>!d.del&&(match(d.ord,d.ev)||(d.ret&&RI.has(d.ret)))).sort((a,b)=>(a.done?1:0)-(b.done?1:0)||(b.urg?1:0)-(a.urg?1:0)||(a.t||0)-(b.t||0));
 const L=(typeof lists!=="undefined"?lists:[]).filter(l=>match(l.ord1,l.ev1)||(l.ord2&&match(l.ord2,l.ev2))||(!S.size&&afN(l.ev2)===evk));
 const name=p?p.ev:(R[0]&&R[0].ev)||(D[0]&&D[0].ev)||(L[0]&&L[0].ev1)||"";const ord=p?p.ord:(R[0]&&R[0].ord)||(D[0]&&D[0].ord)||dig;
 const evn=afN(name),od=afD(ord);
 const INF=(typeof infos!=="undefined"?infos:[]).filter(i=>{const t=afN(i.text||"");return (od.length>=5&&afD(i.text||"").includes(od))||(evn.length>=6&&t.includes(evn))});
 const PA=p&&typeof PLAW!=="undefined"?PLAW.filter(a=>P.some(x=>x.id===a.pk)):[];
 const NT=[];P.forEach(x=>{const H=pkH(x);Object.keys(H).filter(k=>k.startsWith("n_")&&H[k]&&H[k].txt).forEach(k=>NT.push(H[k]))});
 const FM=p&&typeof FMX!=="undefined"?FMX.filter(x=>x.pk===p.id):[];
 const GB=p&&typeof GBJ!=="undefined"?GBJ.filter(j=>P.some(x=>x.id===j.pk)):[];
 return{k,p,P,R,D,L,INF,PA,NT,FM,GB,name,ord}}
/* ---------- Auftrags-Seite ---------- */
function afRow(attr,title,sub,tag,hot){return '<button type="button" class="afrow'+(hot?' hot':'')+'" '+attr+'><span class="tx"><b>'+esc(title)+'</b>'+(sub?'<small>'+esc(sub)+'</small>':'')+'</span>'+(tag||'')+'<span class="ch" aria-hidden="true">›</span></button>'}
const afTg=(t,c)=>'<span class="aftg '+c+'">'+esc(t)+'</span>';
function auftrView(){try{if(typeof fmSub==="function"&&can("pk_s"))fmSub();if(typeof plawSub==="function"&&can("pk_s"))plawSub()}catch(e){}const A=aufData(curAuf);if(!A.p&&!A.R.length&&!A.D.length&&!A.L.length){$("#t").textContent="Auftrag";$("#app").innerHTML='<div class="card mute">Zu diesem Auftrag gibt es nichts (mehr) in der App.</div>';return}
 const p=A.p,secs=[],jumps=[],ver=[];$("#t").textContent="Auftrag";
 let I=null,B=null,H=null;if(p){try{I=auInfo(p)}catch(e){}try{B=abgBal(p)}catch(e){}H=pkH(p)}
 const openD=A.D.filter(d=>!d.done),chk=p&&typeof abgToCheck==="function"&&abgToCheck().some(c=>c.id===p.id);
 /* Kopf */
 const stc=I?I.S.map(s=>s.c==="d"?"d":s.c==="n"?"n":s.c==="r"?"r":""):null;if(stc&&chk)stc[4]="w";
 const tags=[];if(openD.length)tags.push(afTg(openD.length===1?"1 Defekt offen":openD.length+" Defekte offen","red"));if(chk)tags.push(afTg("Zu prüfen","or"));
 if(I&&I.missShow)tags.push(afTg(B.fehlt+" Stk Fehlmaterial","red"));if(I&&I.over&&!B.hasEnd)tags.push(afTg("Dispo abgelaufen","red"));if(I&&I.so)tags.push(afTg("Storniert","g"));if(I&&!tags.length)tags.push(afTg(I.lab,{ok:"ok",red:"red",b:"b",g:"g"}[I.cls]||"b"));
 const head='<section class="afk"><h2>'+esc(A.name||"Ohne Veranstaltung")+'</h2><div class="m">'+(A.ord?'Auftrag <b>'+esc(A.ord)+'</b>':'ohne Auftragsnummer')+(p&&p.pl?' · PL '+esc(afSN(p.pl)):'')+
  (p?'<br>Dispo '+esc(afDMY(p.db))+' – '+esc(afDMY(p.de))+(typeof pkHDay==="function"&&!pkNoH(p)?' · Herrichten '+esc(afDM(pkHDay(p))):''):'')+'</div>'+
  (stc?'<div class="afst"><span class="'+stc[0]+'">Packliste</span><span class="'+stc[1]+'">Herrichten</span><span class="'+stc[2]+'">Unterwegs</span><span class="'+stc[3]+'">Retouren</span><span class="'+stc[4]+'">Geprüft</span></div>':'')+
  (tags.length?'<div class="aftags">'+tags.join("")+'</div>':'')+'</section>';
 const nums=B?'<div class="afnum"><div><b>'+B.raus+'</b><span>Stk raus</span></div><div><b>'+B.zur+'</b><span>zurück</span></div><div><b class="'+(B.fehlt&&(B.hasEnd||I&&I.over)?'red':'')+'">'+(B.hasEnd||I&&I.over?B.fehlt:"–")+'</b><span>Fehlmaterial</span></div><div><b class="'+(openD.length?'red':'')+'">'+A.D.length+'</b><span>Defekte</span></div></div>':'';
 /* Packschein und Herrichten */
 if(p){const rows=[],g=pkProg(p);const afPos=n=>n+(n===1?" Position":" Positionen");let sub=afPos((p.pos||[]).length);
  if(pkNoH(p))sub+=" · kein Herrichten ("+(p.art==="bst"?"kommt von einer Baustelle":"Verlängerung")+")";
  else if(H.fin&&H.fin.t)sub+=" · hergerichtet "+afDM(H.fin.t)+" von "+afWho(H.fin,"by");else{const ha=typeof auHerrAll==="function"?auHerrAll(p,null):null;sub+=ha?" · hergerichtet "+(ha.t?afDM(ha.t):"")+(ha.who?" von "+ha.who:""):g.d?" · wird hergerichtet: "+g.d+" von "+g.n:" · Herrichten "+afDM(pkHDay(p))}
  rows.push(afRow('data-afpk="'+esc(p.id)+'"',"Packschein "+(p.ps||"–"),sub,(H.fin&&H.fin.t)||pkNoH(p)?afTg("✓","ok"):I&&I.late?afTg("nicht hergerichtet","red"):""));
  if(p.t)ver.push([p.t,"Packschein "+(p.ps||"")+" hochgeladen"+(p.by?" ("+afWho(p,"by")+")":"")]);if(H.fin&&H.fin.t)ver.push([H.fin.t,"Hergerichtet ("+afWho(H.fin,"by")+")"+(g.dev?" · "+g.dev+(g.dev===1?" Abweichung":" Abweichungen"):"")]);
  (p.zus||[]).forEach(z=>{const zf=pkZFin(p,z),zg=pkZProg(p,z.ps);rows.push(afRow('data-afpk="'+esc(p.id)+'"',"Zusatz "+z.ps,afPos((z.pos||[]).length)+" · "+(zf?"hergerichtet "+afDM(zf.t)+" von "+afWho(zf,"by"):zg.d?"wird hergerichtet: "+zg.d+" von "+zg.n:"Herrichten "+afDM(pkZDay(p,z))),zf?afTg("✓","ok"):""));if(zf)ver.push([zf.t,"Zusatz "+z.ps+" hergerichtet"])});
  A.P.slice(1).forEach(x=>{rows.push(afRow('data-afpk="'+esc(x.id)+'"',"Verlängerung · Auftrag "+(x.ord||"–"),"bis "+afDMY(x.de),afTg("Verlängerung","b")));if(x.t)ver.push([x.t,"Verlängerung bis "+afDMY(x.de)])});
  const inf=[];let dev=[];try{dev=auDevNet(p,null)}catch(e){}if(dev.length)inf.push('<p><span class="lb or">'+(dev.length===1?"1 Abweichung":dev.length+" Abweichungen")+':</span> '+dev.map(esc).join(" · ")+'</p>');
  const hi=typeof pkHiList==="function"?pkHiList(p):[];if(hi.length)inf.push('<p><span class="lb">ℹ Info zum Herrichten:</span> '+hi.map(h=>esc(h.txt)).join(" · ")+'</p>');
  const fr=typeof pkF==="function"?pkF(p).length:0,gb=A.GB.reduce((a,j)=>a+(+j.n||1),0);const mu=[];if(fr)mu.push("Fremdmiete: "+fr+(fr===1?" Position":" Positionen"));if(gb)mu.push("Gitterbox-Etiketten: "+gb+" gedruckt"+(A.GB[0]?" (zuletzt "+afDM(A.GB[0].t)+")":""));
  if(I&&I.so){mu.push("Storniert "+afDM(I.so.t)+(I.so.why?" – "+I.so.why:""));ver.push([I.so.t,"Storniert"])}if(H.klar&&H.klar.t){mu.push("Mit Projektleiter geklärt ("+afWho(H.klar,"by")+", "+afDM(H.klar.t)+")");ver.push([H.klar.t,"Mit Projektleiter geklärt"])}
  (p.chg||[]).forEach(c=>{ver.push([c.t,"Packschein geändert"])});if(mu.length)inf.push('<p class="mu">'+mu.map(esc).join(" · ")+'</p>');
  secs.push(['pk',"Packschein und Herrichten",rows.join("")+(inf.length?'<div class="afinf">'+inf.join("")+'</div>':'')])}
 /* Retourscheine und Abgleich */
 if(A.R.length||(p&&can("ret_s"))){const rows=A.R.map(r=>{const n=typeof abgRetN==="function"?abgRetN(r):0,f=(r.fotos||[]).length;
   if(r.closed)ver.push([r.closedT||r.t,abgRetLbl(r)+" · "+n+" Stk"]);else ver.push([r.t,"Retourschein angelegt"]);
   return afRow('data-afret="'+esc(r.id)+'"',abgRetLbl(r)+" "+afDM(abgRetT(r)),n+" Stk · "+(r.closed?"abgeschlossen von "+afWho(r,"closedBy"):"angelegt von "+afWho(r,"by"))+(f?" · "+f+(f===1?" Foto":" Fotos"):"")+(r.sent?" · Mail gesendet":""),r.closed?"":afTg("offen","b"))});
  if(p&&B&&abgOk())rows.push(afRow('data-afabg="'+esc(p.id)+'"',"Abgleich mit Retouren",B.zur+" von "+B.raus+" zurück"+(B.fehlt?" · "+B.fehlt+" Stk fehlen":"")+(B.zuviel?" · "+B.zuviel+" zu viel":" · nichts zu viel"),""));
  const inf=[];if(p&&B&&B.miss.length&&(B.hasEnd||(I&&I.over))){inf.push('<p><span class="lb red">Fehlmaterial:</span> '+B.miss.map(e=>{const L=typeof fmFor==="function"?fmFor(p.id,e.k):[];const w=L.map(x=>(FMW[x.was]||x.was)+(x.aus&&x.aus.t?" – in epirent ausgetragen ("+afWho(x.aus,"by")+", "+afDM(x.aus.t)+")":"")).join("; ");
   return esc(afQ(e.soll-e.back,"Stk")+" "+e.name)+(w?' <span class="mu">– '+esc(w)+'</span>':' <span class="red">– noch offen</span>')}).join("<br>")+'</p>')}
  A.FM.forEach(x=>{ver.push([x.t,"Fehlmaterial: "+(FMW[x.was]||x.was)+" – "+x.name]);if(x.aus&&x.aus.t)ver.push([x.aus.t,"In epirent ausgetragen: "+x.name])});
  const pr=p&&typeof ABP!=="undefined"?ABP[p.id]:null;if(pr&&pr.t){inf.push('<p class="ok"><span class="lb">✓ Geprüft</span> von '+esc(afWho(pr,"by"))+', '+afDM(pr.t)+(pr.note?' – „'+esc(pr.note)+'“':'')+'</p>');ver.push([pr.t,"Geprüft ("+afWho(pr,"by")+")"])}else if(chk)inf.push('<p class="or"><span class="lb">Endretoure da – wartet auf die Prüfung.</span></p>');
  if(!rows.length)rows.push('<div class="afinf mu">Noch kein Retourschein.</div>');
  secs.push(['ret',"Retourscheine und Abgleich",rows.join("")+(inf.length?'<div class="afinf">'+inf.join("")+'</div>':'')])}
 /* Defekte */
 if(A.D.length){const rows=A.D.map(d=>{const q=typeof dxQ==="function"?dxQ(d):1,nm=(q>1?q+" × ":"")+(d.art||"Artikel");let sub,tag;
   ver.push([d.t,"Defekt gemeldet: "+nm+(d.ret?" (beim Zählen)":"")]);
   if(!d.done){sub=(d.desc||"Keine Beschreibung")+" · gemeldet "+afDM(d.t)+" von "+afWho(d,"by")+(d.ret?" beim Zählen":"");tag=afTg(d.urg?"OFFEN · DRINGEND":"OFFEN",d.urg?"rs":"red")}
   else if(d.aus){sub="Ausgemustert"+(d.aus.why?" – "+d.aus.why:"")+" · "+afWho(d.aus,"by")+", "+afDM(d.aus.t);tag=afTg("AUSGEMUSTERT","red");ver.push([d.aus.t||d.doneT,"Ausgemustert: "+nm])}
   else{const et=Array.isArray(d.et)?d.et.filter(e=>e&&e.nm).length:0,rz=typeof rzMin==="function"?rzMin(d):0;sub=[d.rep||"Repariert",et?et+(et===1?" Ersatzteil":" Ersatzteile"):"",rz?rzTx(rz):"",afWho(d,"doneBy")+", "+afDM(d.doneT)].filter(Boolean).join(" · ");tag=afTg("REPARIERT","ok");ver.push([d.doneT,"Repariert: "+nm+(rz?" ("+rzTx(rz)+")":"")])}
   if(d.fv)sub+=" · Fremdverschulden";return afRow('data-afdef="'+esc(d.id)+'"',nm,sub,tag,!d.done)});
  secs.push(['def',"Defekte ("+A.D.length+(openD.length?" · "+openD.length+" offen":"")+")",rows.join("")])}
 /* Material vor Ort */
 if(A.L.length){secs.push(['mat',"Material vor Ort",A.L.map(l=>{let n=0;try{n=Object.values(JSON.parse(l.itemsJson||"{}")).reduce((a,i)=>a+(+i.q||+i.n||0),0)}catch(e){}ver.push([l.t,(l.mode==="weiter"?"Material geht weiter":"Material bleibt vor Ort")+" erfasst"]);
  return afRow('data-aflist="'+esc(l.id)+'"',l.mode==="weiter"?"Material geht weiter → "+(l.ev2||"–"):"Material bleibt vor Ort",(n?n+" Stk · ":"")+"erfasst von "+afWho(l,"by")+", "+afDM(l.t)+(l.chk?" · abgeschlossen":""),"")}).join("")])}
 /* Nachrichten und Notizen */
 const msg=[];A.PA.slice().sort((a,b)=>(a.t||0)-(b.t||0)).forEach(a=>{msg.push([a.t,'<p><span class="lb">'+esc(afWho(a,"by"))+' (PL), '+afDM(a.t)+':</span> '+(a.typ==="msg"?'„'+esc(a.txt||"")+'“':esc(typeof auAnsTxt==="function"?auAnsTxt(a):(a.txt||"")))+'</p>']);ver.push([a.t,"Antwort/Nachricht vom Projektleiter"])});
 A.NT.forEach(n=>{msg.push([n.t,'<p><span class="lb">Notiz '+esc(afWho(n,"by"))+', '+afDM(n.t)+':</span> „'+esc(n.txt)+'“</p>'])});
 A.INF.forEach(i=>{msg.push([i.t,'<p><span class="lb">Info an das Lager, '+esc(afWho(i,"by"))+', '+afDM(i.t)+':</span> „'+esc(i.text||"")+'“ <button type="button" class="lnk" data-afinfo="'+esc(i.id)+'">Öffnen ›</button></p>'])});
 if(msg.length)secs.push(['msg',"Nachrichten und Notizen",'<div class="afinf">'+msg.sort((a,b)=>(a[0]||0)-(b[0]||0)).map(m=>m[1]).join("")+'</div>']);
 const JL={pk:"Packschein",ret:"Retouren",def:"Defekte",mat:"Vor Ort",msg:"Nachrichten"};secs.forEach(s=>jumps.push([s[0],JL[s[0]]]));
 const V=ver.filter(v=>v[0]).sort((a,b)=>a[0]-b[0]);if(V.length)jumps.push(["ver","Verlauf"]);
 $("#app").innerHTML='<div class="afwrap">'+head+nums+(jumps.length>1?'<div class="afjump">'+jumps.map(j=>'<button type="button" data-afj="'+j[0]+'">'+esc(j[1])+'</button>').join("")+'</div>':'')+
  secs.map(s=>'<section class="afsec" id="af_'+s[0]+'"><h3>'+esc(s[1])+'</h3>'+s[2]+'</section>').join("")+
  (V.length?'<section class="afver" id="af_ver"><h3>VERLAUF</h3>'+V.map(v=>'<div><span>'+afDM(v[0])+'</span><span>'+esc(v[1])+'</span></div>').join("")+'</section>':'')+
  '<p class="afnote">Zeilen antippen öffnet Packliste, Retourschein, Abgleich, Defekt oder Materialliste. Du siehst nur, was deine Rechte erlauben.</p></div>';
 const q=s=>document.querySelectorAll(s);
 q("[data-afj]").forEach(b=>b.onclick=()=>{const t=$("#af_"+b.dataset.afj);if(t)t.scrollIntoView({behavior:"smooth",block:"start"})});
 q("[data-afpk]").forEach(b=>b.onclick=()=>{curPack=b.dataset.afpk;go("packopen")});q("[data-afret]").forEach(b=>b.onclick=()=>{curRet=b.dataset.afret;go("retopen")});
 q("[data-afabg]").forEach(b=>b.onclick=()=>{curPack=b.dataset.afabg;go("pkabg")});q("[data-afdef]").forEach(b=>b.onclick=()=>{curDef=b.dataset.afdef;go("defopen")});
 q("[data-aflist]").forEach(b=>b.onclick=()=>{cur=b.dataset.aflist;go("scan")});q("[data-afinfo]").forEach(b=>b.onclick=()=>{curInfo=b.dataset.afinfo;go("infoopen")})}
