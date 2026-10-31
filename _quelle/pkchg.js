/* ===== Geänderte Packscheine (ab 1.89) =====
   epirent vergibt bei einer Änderung eine NEUE Packscheinnummer, „Neu“ steht nicht in der PDF. Darum vergleicht die App den Inhalt:
   ein geänderter Packschein enthält fast die ganze Liste noch einmal (oft auch die Zusätze), ein Zusatz nur das, was dazukommt.
   Entscheiden tut immer der Mensch (Vorschlag ist nur vorausgewählt).
   Ersetzen: die Packliste behält ihre id (Herricht-Tag, Notizen, Abgleich, Retourscheine bleiben), pos/ps/Zeiten kommen aus der neuen PDF,
   eingeschlossene Zusätze fallen weg. Herricht-Stand wird pro Artikel (Artikelnummer, sonst Name) übernommen:
   mehr -> Teilmenge, weniger/entfällt -> „Zurücklegen“ (packh.zr = {id:{name,u,a,n,done,by,t}}), neu -> offen.
   Verlauf: pack.chg = [{t,by,from:[ps…],to,kind:"main"|"zus",diff:[{name,u,o,n}]}]. War abgeschlossen und es gibt Änderungen -> wieder offen. */
const pkAK=x=>abgKey(artCode(x&&x.a),pkName(x));
function pkSum(list){const M={};(list||[]).forEach(x=>{const k=pkAK(x),e=M[k]=M[k]||{k,name:pkName(x),u:x.u||"Stk",a:x.a||"",n:0};e.n+=+x.n||0});return M}
function pkDiff(oldL,newL){const A=pkSum(oldL),B=pkSum(newL),out=[];
 Object.keys(A).concat(Object.keys(B).filter(k=>!A[k])).forEach(k=>{const o=A[k]?A[k].n:0,n=B[k]?B[k].n:0;if(o!==n){const e=B[k]||A[k];out.push({k,name:e.name,u:e.u,o,n})}});
 const rk=d=>!d.o?1:!d.n?2:0;return out.sort((a,b)=>rk(a)-rk(b)||String(a.name).localeCompare(String(b.name),"de"))}
const pkDiffTxt=d=>!d.o?"neu: "+pkNum(d.n)+" "+d.u:!d.n?"entfällt ("+pkNum(d.o)+" "+d.u+")":pkNum(d.o)+" → "+pkNum(d.n)+" "+d.u;
const pkDiffCls=d=>!d.o?"nw":!d.n?"rm":d.n>d.o?"up":"dn";
/* Vorschlag: wie viel vom Bestehenden steckt im neuen Packschein? Bei nur einem Artikel ist das kein sicheres Zeichen -> dann Zusatz vorschlagen. */
function pkMatch(P,M){const N=pkSum(P.pos),nk=new Set(Object.keys(N)),mk=Object.keys(pkSum(M.pos)),ov=mk.length?mk.filter(k=>nk.has(k)).length/mk.length:0;
 const Z=(M.zus||[]).map(z=>{const zs=pkSum(z.pos),zk=Object.keys(zs),hit=zk.filter(k=>nk.has(k)).length,ms=pkSum(M.pos);
  const need=zk.reduce((a,k)=>a+(ms[k]?ms[k].n:0)+zs[k].n,0),got=zk.reduce((a,k)=>a+(N[k]?N[k].n:0),0);
  return{ps:String(z.ps),n:zk.length,hit,ov:zk.length?hit/zk.length:0,nov:nk.size?hit/nk.size:0,inc:zk.length>0&&hit===zk.length&&got>=need*0.8}});
 const same=Z.find(z=>z.ps===String(P.ps)),zbest=Z.filter(z=>z.n>=2&&z.ov>=0.6&&z.nov>=0.6).sort((a,b)=>b.ov-a.ov)[0];
 const sug=same?"repz:"+same.ps:ov>=0.6&&mk.length>=2?"rep":zbest&&ov<0.5?"repz:"+zbest.ps:"zus";
 return{ov,mk:mk.length,hit:mk.filter(k=>nk.has(k)).length,Z,sug}}
/* Dialog. cur=true: dieselbe Packscheinnummer ist schon da (nur Ersetzen). Gibt {mode:"rep",inc:[ps…]} | {mode:"repz",zps} | {mode:"zus"} | {mode:"own"} | null */
function pkChgDlg(P,M,same){return new Promise(res=>{const m=pkMatch(P,M),o=document.createElement("div");o.className="ov";let mode=same?"rep":m.sug.startsWith("repz:")?"repz":m.sug,zps=m.sug.startsWith("repz:")?m.sug.slice(5):null;
 const inc=new Set(m.Z.filter(z=>z.inc).map(z=>z.ps)),f=P.pos.filter(x=>x.f>0).length;
 const opt=(k,t,s,on)=>'<button class="abgopt'+(on?' on':'')+'" type="button" data-cm="'+k+'"><i></i><span><b>'+t+'</b>'+(s?'<small>'+s+'</small>':'')+'</span></button>';
 const why=same?'Packschein '+esc(P.ps)+' ist schon da – wird mit dem neuen Stand ersetzt.':m.mk?m.hit+' von '+m.mk+' Artikeln von Packschein '+esc(M.ps)+' stehen auch im neuen.'+(m.ov>=0.6?' Sieht nach einer Änderung aus.':' Sieht nach einem Zusatz aus.'):'';
 const zrows=m.Z.filter(z=>z.ps!==String(P.ps));
 const draw=()=>{const sel=mode==="rep"?"rep":mode==="repz"?"repz:"+zps:mode;
  const oldL=mode==="rep"?(M.pos||[]).concat(...(M.zus||[]).filter(z=>inc.has(String(z.ps))).map(z=>z.pos||[])):mode==="repz"?((pkZOf(M,zps)||{}).pos||[]):null,D=oldL?pkDiff(oldL,P.pos):[];
  o.innerHTML='<div class="card pkcd"><b style="font-size:18px">'+(same?'Packschein schon da':'Packschein zu Auftrag '+esc(P.ord||"")+' erkannt')+'</b>'+
   '<div class="mute" style="margin:2px 0 8px">'+esc(P.ev||"")+' · Packschein '+esc(P.ps||"–")+' · '+pkPosN(P.pos.length)+(f?', davon <span class="pkfr">'+f+' mit Fremdmiete</span>':'')+'</div>'+
   (why?'<p class="pkcwhy">'+why+'</p>':'')+
   (same?'':opt("rep","Ersetzt Packschein "+esc(M.ps)+" (geändert)","Packliste bleibt, was hergerichtet ist, wird übernommen.",sel==="rep")+
    (sel==="rep"&&zrows.length?'<div class="pkczl">'+zrows.map(z=>'<label class="abgchkl"><input type="checkbox" data-ci="'+esc(z.ps)+'"'+(inc.has(z.ps)?' checked':'')+'><span>Zusatz '+esc(z.ps)+' ist im neuen Packschein enthalten<small class="mute">'+z.hit+' von '+z.n+' Artikeln gefunden'+(z.inc?' – Mengen passen':'')+'</small></span></label>').join("")+'</div>':'')+
    (M.zus||[]).map(z=>opt("repz:"+esc(z.ps),"Ersetzt Zusatz "+esc(z.ps)+" (geändert)","Nur dieser Zusatz wird ersetzt, sein Herricht-Tag bleibt.",sel==="repz:"+z.ps)).join("")+
    opt("zus","Als Zusatz anhängen","Kommt zusätzlich dazu, eigener Herricht-Tag.",sel==="zus")+opt("own","Als eigene Packliste","",sel==="own"))+
   (oldL?'<div class="pkcdf"><b class="abglh">Was sich ändert</b>'+(D.length?D.map(d=>'<div class="pkcdr '+pkDiffCls(d)+'"><span>'+esc(d.name)+'</span><b>'+esc(pkDiffTxt(d))+'</b></div>').join(""):'<div class="mute">Keine Änderung bei Artikeln und Mengen.</div>')+
    '<small class="mute">Was schon hergerichtet ist, bleibt. Zu viel Hergerichtetes kommt auf die Liste „Zurücklegen“.</small></div>':'')+
   '<div class="row" style="margin-top:10px"><button class="btn ghost" id="pkcx" type="button">Abbrechen</button><button class="btn" id="pkco" type="button">'+(mode==="rep"||mode==="repz"?'Ersetzen':mode==="zus"?'Weiter':'Speichern')+'</button></div></div>';
  o.querySelectorAll("[data-cm]").forEach(b=>b.onclick=()=>{const v=b.dataset.cm;if(v.startsWith("repz:")){mode="repz";zps=v.slice(5)}else{mode=v;zps=null}draw()});
  o.querySelectorAll("[data-ci]").forEach(c=>c.onchange=()=>{c.checked?inc.add(c.dataset.ci):inc.delete(c.dataset.ci);draw()});
  o.querySelector("#pkcx").onclick=()=>{o.remove();res(null)};
  o.querySelector("#pkco").onclick=()=>{o.remove();res(mode==="rep"?{mode,inc:[...inc]}:mode==="repz"?{mode,zps}:{mode})}};
 document.body.appendChild(o);draw()})}
/* Herricht-Stand übernehmen: alte Positionen (mit Schlüssel) -> neue Positionen (mit Schlüssel). Gibt {patch, back:[…], diff} */
function pkCarry(H,oldI,newI){const done={},alt={},fm={},l55={},who={};
 oldI.forEach(o=>{const x=o.x,h=H[o.k];if(!h)return;const k=pkAK(x),st=pkPS(x,h);done[k]=(done[k]||0)+(st.s==="ok"?st.need:st.s==="part"?(+st.q||0):0);
  if(st.alt.length)alt[k]=(alt[k]||[]).concat(st.alt);if(h.fm)fm[k]=h.fm;if(typeof h.l55==="boolean")l55[k]=h.l55;if(h.by)who[k]={by:h.by,t:h.t}});
 const patch={};oldI.forEach(o=>{patch[o.k]=null});
 newI.forEach(o=>{const x=o.x,k=pkAK(x),h={};if(fm[k]&&x.f>0)h.fm=fm[k];if(k in l55)h.l55=l55[k];const need=pkNeed(x,h),av=done[k]||0;
  if(alt[k]){h.alt=alt[k];delete alt[k]}
  if(av>0||h.alt){const q=Math.min(av,need);done[k]=av-q;if(q>=need&&need>0)h.ok=true;else{h.ok=false;h.q=q}Object.assign(h,who[k]||{by:me,t:Date.now()})}
  patch[o.k]=Object.keys(h).length?h:null});
 const back=[];Object.keys(done).forEach(k=>{if(done[k]>0){const e=oldI.find(o=>pkAK(o.x)===k).x;back.push({k,name:pkName(e),u:e.u||"Stk",a:e.a||"",n:done[k]})}});
 return{patch,back,diff:pkDiff(oldI.map(o=>o.x),newI.map(o=>o.x))}}
function pkZrAdd(H,back,ps){const zr={...(H.zr||{})},t=Date.now();back.forEach((b,i)=>{zr["r"+t.toString(36)+i]={name:b.name,u:b.u,a:b.a,n:b.n,ps,done:false,by:me,t}});return zr}
/* Packliste (Haupt-Packschein + ausgewählte Zusätze) durch neuen Packschein ersetzen */
async function pkReplace(M,P,inc){const H=pkH(M),IT=pkItems(M),incS=new Set((inc||[]).map(String)),oldI=IT.filter(o=>!o.z||incS.has(o.z));
 const rest=(M.zus||[]).filter(z=>!incS.has(String(z.ps))),newP={...M,pos:P.pos,zus:rest},newI=pkItems(newP).filter(o=>!o.z);
 const C=pkCarry(H,oldI,newI),from=[M.ps].concat([...incS]).filter((v,i,a)=>v&&a.indexOf(v)===i),chg={t:Date.now(),by:me,from,to:P.ps,kind:"main",diff:C.diff.map(d=>({name:d.name,u:d.u,o:d.o,n:d.n}))};
 const patch={...C.patch};incS.forEach(ps=>{patch["zd_"+pkZK(ps)]=null;patch["zf_"+pkZK(ps)]=null});
 if(C.back.length)patch.zr=pkZrAdd(H,C.back,P.ps);
 const wasFin=!!(H.fin&&H.fin.t),same=String(P.ps)===String(M.ps)&&!incS.size;
 if(wasFin&&(C.diff.length||incS.size&&[...incS].some(ps=>!pkZFin(M,pkZOf(M,ps)||{ps}))))patch.fin=null;
 try{const up={ord:P.ord,ps:P.ps,ev:P.ev,pl:P.pl,db:P.db,de:P.de,pk:P.pk||0,an:P.an||0,eb:P.eb||0,ee:P.ee||0,sa:P.sa||"",pos:P.pos,zus:rest,mod:{by:me,t:Date.now()}};
  if(!same||C.diff.length)up.chg=(M.chg||[]).concat([chg]);
  await db.doc("pack/"+M.id).update(up);await pkHSet(M,patch);
  toast(same&&!C.diff.length?"Packliste aktualisiert – keine Änderung bei Artikeln":"Packschein ersetzt"+(C.diff.length?" – "+C.diff.length+(C.diff.length===1?" Änderung":" Änderungen"):"")+(patch.fin===null?", Packliste wieder offen":""),1)}
 catch(e){console.error(e);errBox("Ersetzen fehlgeschlagen. Hast du das Recht „Packlisten hochladen“?")}}
/* Einen Zusatz durch neuen Packschein ersetzen (Tag bleibt) */
async function pkReplaceZ(M,zps,P){const z=pkZOf(M,zps);if(!z)return;const H=pkH(M),IT=pkItems(M),oldI=IT.filter(o=>o.z===String(zps));
 const nz={ps:P.ps,ev:P.ev,t:Date.now(),by:me,pos:P.pos,v:2},rest=(M.zus||[]).map(q=>String(q.ps)===String(zps)?nz:q),newI=pkItems({...M,zus:rest}).filter(o=>o.z===String(P.ps));
 const C=pkCarry(H,oldI,newI),ok=pkZK(zps),nk=pkZK(P.ps),patch={...C.patch},zf=pkZFin(M,z);
 patch["zd_"+nk]=H["zd_"+ok]||{d:pkYmd(pkZDay(M,z)),by:me,t:Date.now()};patch["zf_"+nk]=zf&&!C.diff.length?zf:{t:0};if(ok!==nk){patch["zd_"+ok]=null;patch["zf_"+ok]=null}
 if(C.back.length)patch.zr=pkZrAdd(H,C.back,P.ps);
 try{await db.doc("pack/"+M.id).update({zus:rest,chg:(M.chg||[]).concat([{t:Date.now(),by:me,from:[String(zps)],to:P.ps,kind:"zus",diff:C.diff.map(d=>({name:d.name,u:d.u,o:d.o,n:d.n}))}])});await pkHSet(M,patch);
  toast("Zusatz ersetzt"+(C.diff.length?" – "+C.diff.length+(C.diff.length===1?" Änderung":" Änderungen"):""),1)}
 catch(e){console.error(e);errBox("Ersetzen fehlgeschlagen. Hast du das Recht „Packlisten hochladen“?")}}
/* ---------- Anzeige in der Packliste ---------- */
const pkZrOpen=P=>Object.entries(pkH(P).zr||{}).filter(([,r])=>r&&!r.done);
const pkChgLbl=c=>(c.kind==="zus"?"Zusatz ":"Packschein ")+(c.from||[]).join(" + ")+" → "+c.to;
function pkChgCard(P){const C=(P.chg||[]).slice().sort((a,b)=>b.t-a.t),Z=Object.entries(pkH(P).zr||{}).filter(([,r])=>r).sort((a,b)=>(a[1].done-b[1].done)||(a[1].t-b[1].t));if(!C.length&&!Z.length)return"";
 const last=C[0],H=pkH(P),open=last&&!(H.fin&&H.fin.t>last.t);
 return '<div class="card pkchg'+(open?' warn':'')+'" style="cursor:default">'+(last?'<b>↻ '+esc(pkChgLbl(last))+'</b><div class="mute">geändert '+fmt(last.t)+' von '+esc(nmA(last,"by"))+(open?' – Änderungen prüfen':'')+'</div>'+
  (last.diff&&last.diff.length?'<details class="pkchgd"'+(open?' open':'')+'><summary>'+last.diff.length+(last.diff.length===1?' Änderung':' Änderungen')+'</summary>'+last.diff.map(d=>'<div class="pkcdr '+pkDiffCls(d)+'"><span>'+esc(d.name)+'</span><b>'+esc(pkDiffTxt(d))+'</b></div>').join("")+'</details>':''):'')+
  (Z.length?'<div class="pkzr"><b>Zurücklegen</b>'+Z.map(([id,r])=>'<label class="pkzrr'+(r.done?' done':'')+'"><input type="checkbox" data-zr="'+esc(id)+'"'+(r.done?' checked':'')+'><span><b>'+pkNum(r.n)+' '+esc(r.u||"Stk")+'</b> '+esc(r.name)+(r.done&&r.dby?' <small>zurückgelegt von '+esc(nm(r.dby))+'</small>':'')+'</span></label>').join("")+'</div>':'')+
  (C.length>1?'<details class="pkchgd"><summary>Frühere Änderungen</summary>'+C.slice(1).map(c=>'<div class="mute">'+esc(pkChgLbl(c))+' · '+fmt(c.t)+' · '+esc(nmA(c,"by"))+'</div>').join("")+'</details>':'')+'</div>'}
function pkChgBind(P){document.querySelectorAll("[data-zr]").forEach(c=>c.onchange=()=>{const zr={...(pkH(P).zr||{})},r=zr[c.dataset.zr];if(!r)return;zr[c.dataset.zr]={...r,done:c.checked,dby:c.checked?me:null,dt:c.checked?Date.now():null};pkHSet(P,{zr})})}
