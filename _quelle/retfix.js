/* ===== 1.178: Retourschein flackert / springt nach oben (Jürgen, 16.11.) =====
   Ursache: jedes draw() (eigener „In Arbeit“-Herzschlag ed_<id> alle 30 s, Herzschlag beim Herrichten pked, Änderungen von Kollegen,
   5-Min-Nachladen …) baute den Retourschein komplett neu auf → Flackern, und weil „Mit Packliste“/„Aus der Packliste“ erst danach
   eingefügt werden, sprang die Seite nach oben.
   Jetzt: im Zählen (retedit) und in der Ansicht (retopen) wird nur neu gezeichnet, wenn sich etwas ändert, das dort zu sehen ist
   (der Schein ohne Herzschlag-Felder, Packliste + Herricht-Stand desselben Auftrags, Defekte des Scheins, Artikelliste).
   Wird doch neu gezeichnet, bleibt die Scroll-Position stehen. */
let rSigLast=null,rSigEl=null,rCtxLast="";
function rDig(x){return String(x||"").replace(/\D/g,"")}
function rSigNow(){try{let id=null,r=null;
 if(view==="retedit"&&rs){id=rs.id;r=id?rets.find(x=>x.id===id):null}else if(view==="retopen"){id=curRet;r=rets.find(x=>x.id===id)}else return null;
 const o={};if(r)Object.keys(r).sort().forEach(k=>{if(!/^edn?_/.test(k)&&k!=="draft"&&typeof r[k]!=="function")o[k]=r[k]});
 const ord=rDig(r?r.ord:(rs&&rs.ord)),P=ord?packs.filter(p=>rDig(p.ord)===ord).map(p=>[p,packh[p.id]||null]):[];
 const D=id?defs.filter(d=>d.ret===id).map(d=>[d.id,d.n||1,!!d.done]):[];
 /* wer sonst gerade mitzählt (für „… arbeitet gerade auch …“) – ohne Uhrzeit */
 const W=r?Object.keys(r).filter(k=>/^ed_/.test(k)&&k!=="ed_"+me&&+r[k]&&Date.now()-r[k]<90000).map(k=>k+"="+(r["edn_"+k.slice(3)]||"")).sort():[];
 return view+"|"+JSON.stringify([o,P,D,W,(rkat||[]).length])}catch(e){return null}}
function rCtxNow(){return view+"|"+(view==="retopen"?curRet:(rs?[rs.id,rs.lvl,rs.g,rs.u,rs.q].join("/"):""))}
function rMark(){rSigLast=rSigNow();rCtxLast=rCtxNow();const a=$("#app");let m=document.getElementById("rsigm");if(!m||m.parentNode!==a){if(m)m.remove();m=document.createElement("i");m.id="rsigm";m.hidden=true;a.appendChild(m)}rSigEl=m}
const rMarkOk=()=>!!rSigEl&&rSigEl.parentNode===$("#app")
function rKeepY(y){if(!(y>0))return;const go=()=>{if(Math.abs(window.scrollY-y)>2)window.scrollTo(0,y)};go();setTimeout(go,0);setTimeout(go,60);requestAnimationFrame(go)}
/* nach jedem Aufbau merken, was gerade zu sehen ist (auch wenn Knöpfe retEdit/retOpen direkt aufrufen) */
/* retEdit/retOpen stehen in einem späteren <script> → erst danach einhängen */
let rWrapped=false;function rWrap(){if(rWrapped||typeof retEdit!=="function"||typeof retOpen!=="function")return;rWrapped=true;
 const f=retEdit;retEdit=function(){const v=f.apply(this,arguments);rMark();return v};
 const g=retOpen;retOpen=function(){const v=g.apply(this,arguments);rMark();return v}}
setTimeout(rWrap,0);
function retDrawSafe(){rWrap();
 if(view==="retedit"||view==="retopen"){
  const s=rSigNow();if(s!==null&&s===rSigLast&&rMarkOk()&&rCtxNow()===rCtxLast)return;
  const same=rCtxNow()===rCtxLast&&rMarkOk(),y=window.scrollY;
  retDraw();if(same)rKeepY(y);return}
 rSigLast=null;rSigEl=null;rCtxLast="";return retDraw()}
