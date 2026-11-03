
/* ===== Retourschein: automatisch speichern (nichts darf verloren gehen) ===== */
const RLS="tpc_retour_backup";let rTimer=null,rChain=Promise.resolve(),rDone={},rSynced=false;
const rNewId=()=>"r"+Date.now().toString(36)+Math.random().toString(36).slice(2,6);
function rSnap(){if(!rs||!String(rs.ev||"").trim())return null;if(!rs.id)rs.id=rNewId();rFold();
 /* nur den eigenen Anteil und geänderte Kopfdaten schicken – so überschreibt niemand die Eingaben der anderen */
 const d={["pa_"+me]:JSON.stringify(rs.mine||{})},h=rs.h0;["ev","ord","rem"].forEach(f=>{const v=String(rs[f]||"").trim();if(!h||v!==String(h[f]||"").trim())d[f]=v});Object.keys(rs.mn||{}).forEach(k=>d["mn_"+k]=rs.mn[k]);return{id:rs.id,d}}
function rBk(){try{return JSON.parse(localStorage.getItem(RLS)||"{}")||{}}catch(e){return{}}}
function rBkSet(o){try{localStorage.setItem(RLS,JSON.stringify(o))}catch(e){}}
function rLocal(sn){const o=rBk();o[sn.id]={u:me,d:sn.d};rBkSet(o)}
function rPersist(now){const sn=rSnap();if(!sn)return Promise.resolve();rLocal(sn);clearTimeout(rTimer);if(now)return rQueue(sn);rTimer=setTimeout(()=>rQueue(rSnap()||sn),600);return Promise.resolve()}
function rQueue(sn){rChain=rChain.then(()=>rWrite(sn)).catch(e=>console.warn("Retourschein lokal gesichert, Upload folgt",e));return rChain}
/* nichts geändert gegenüber dem gespeicherten Stand → nicht schreiben (sonst „Letzte Änderung“ = Öffnen, Fehler bis 1.111) */
function rSame(sn,old){return !!old&&Object.keys(sn.d).every(f=>{const a=sn.d[f],b=old[f];if(f.startsWith("pa_")&&a==="{}"&&(b==null||b===""))return true;return typeof a==="string"?String(b==null?"":b)===a:JSON.stringify(a)===JSON.stringify(b)})}
function rBkDrop(id,k){const o=rBk();if(o[id]&&JSON.stringify(o[id].d)===k){delete o[id];rBkSet(o)}}
async function rWrite(sn){const k=JSON.stringify(sn.d);if(rDone[sn.id]===k)return rBkDrop(sn.id,k);const old=rets.find(r=>r.id===sn.id),now=Date.now();
 if(rSame(sn,old)){rDone[sn.id]=k;return rBkDrop(sn.id,k)}
 if(old)await db.doc("retour/"+sn.id).update({...sn.d,mod:me,modT:now});else await db.doc("retour/"+sn.id).set({...sn.d,by:me,t:now,draft:true});
 rDone[sn.id]=k;const o=rBk();if(o[sn.id]&&JSON.stringify(o[sn.id].d)===k){delete o[sn.id];rBkSet(o)}}
async function rSyncLocal(){if(rSynced||!db||!me)return;rSynced=true;const o=rBk();let n=0;
 for(const id of Object.keys(o)){const x=o[id];if(!x||x.u!==me||(rs&&rs.id===id))continue;try{const ex=await db.doc("retour/"+id).get();const same=ex.exists&&rSame(x,ex.data());if(same);else if(ex.exists)await db.doc("retour/"+id).update({...x.d,mod:me,modT:Date.now()});else await db.doc("retour/"+id).set({...x.d,by:me,t:Date.now(),draft:true});const p=rBk();delete p[id];rBkSet(p);if(!same)n++}catch(e){rSynced=false}}
 if(n)toast(n===1?"Ein nicht übertragener Retourschein wurde gespeichert":n+" nicht übertragene Retourscheine wurden gespeichert",1)}
document.addEventListener("visibilitychange",()=>{if(document.visibilityState==="hidden"&&typeof rs!=="undefined"&&rs)rPersist(true)});
window.addEventListener("pagehide",()=>{if(typeof rs!=="undefined"&&rs)rPersist(true)});
window.addEventListener("online",()=>{rSynced=false;setTimeout(()=>{if(typeof rs!=="undefined"&&rs)rPersist(true);rSyncLocal()},1500)});
function retBack(){if(view!=="retedit"||!rs)return false;if(rs.q){rs.q="";retEdit();return true}
 rPersist(true);const saved=!!rs.id;
 if(!rs.isNew&&rs.add&&rs.lvl==="groups"){const id=rs.id;rs=null;curRet=id;hist=hist.filter(v=>v!=="retedit"&&v!=="retopen");view="retopen";draw();toast("Retourschein gespeichert",1);return true}
 if(!rs.isNew&&rs.lvl==="sum"){rs=null;toast("Retourschein gespeichert",1);return false}
 const m={manual:"groups",sum:"groups",items:rs.u!==null?"subs":"groups",subs:"groups",groups:rs.isNew?"head":"sum"};const n=m[rs.lvl];
 if(!n){rs=null;if(saved)toast("Retourschein gespeichert (in Arbeit)",1);return false}if(n==="subs")rs.u=null;rs.lvl=n;retEdit();return true}
