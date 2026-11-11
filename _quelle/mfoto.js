/* 1.169: Fotos vom fertigen Material (Jürgen, 11.11.)
   Pro Packschein (Haupt: packh.mf_h, Zusatz: packh.mf_z<ps>) bis zu 6 Fotos [{id,c,by,t}], Bild in fotos/<packId>-m… {d}.
   Beim Abschließen fragt die App nach einem Foto. Sichtbar in der Packliste (auch zugeklappt), in Meine Aufträge und im Retourschein.
   Automatisch gelöscht 3 Monate nach der Endretoure bzw. „Mit Projektleiter geklärt“. */
const MF_MAX=6,MF_KEEP=90*864e5;
const mfKey=ps=>ps?"mf_z"+pkZK(ps):"mf_h";
function mfList(p,ps){const P=packs.find(x=>x.id===p.id)||p,l=pkH(P)[mfKey(ps)];return Array.isArray(l)?l.filter(e=>e&&e.id):[]}
function mfAll(p){return [{ps:null,l:mfList(p,null)}].concat((p.zus||[]).map(z=>({ps:String(z.ps),l:mfList(p,String(z.ps))}))).filter(g=>g.l.length)}
const mfN=p=>mfAll(p).reduce((a,g)=>a+g.l.length,0);
function mfThumbs(p,ps,L){return '<div class="rph mfr">'+L.map(e=>'<figure class="mft"><img data-mfph="'+esc(e.id)+'" data-mfp="'+esc(p.id)+'" data-mfps="'+esc(ps||"")+'" alt="Foto vom Material">'+(e.c?'<figcaption>'+esc(e.c)+'</figcaption>':'')+'</figure>').join("")+'</div>'}
/* im Packschein-Feld der Packliste (auch zugeklappt) */
function mfFieldHtml(p,ps,fin){const L=mfList(p,ps);if(!fin&&!L.length)return "";
 return '<div class="mfbox"><div class="mfh"><b>Fotos vom Material'+(L.length?' ('+L.length+')':'')+'</b>'+(L.length<MF_MAX?'<button class="btn ghost s" type="button" data-mfadd="'+esc(ps||"")+'" data-mfp="'+esc(p.id)+'">📷 '+(L.length?'Weiteres Foto':'Foto vom Material')+'</button>':'')+'</div>'+
  (L.length?mfThumbs(p,ps,L):'<p class="mute mf0">Noch kein Foto. So sieht man später, wie viel rausgegangen ist.</p>')+'</div>'}
function mfGrpLbl(p,g){const f=g.l[0];return (g.ps?'Zusatz '+esc(g.ps):'Packschein '+esc(p.ps||"–"))+' · '+fmt(f.t).slice(0,6)+' von '+esc(nmA(f,"by"))}
/* Meine Aufträge */
function mfAuHtml(p){const G=mfAll(p);if(!G.length)return "";
 return '<section class="card aucd" id="mfau"><b class="ausec">Fotos vom fertigen Material</b>'+G.map(g=>'<div class="mfg">'+mfGrpLbl(p,g)+'</div>'+mfThumbs(p,g.ps,g.l)).join("")+'</section>'}
/* Retourschein: unter der Zeile „Mit Packliste“ */
function mfRetInject(p){const o=document.getElementById("mfret");if(o)o.remove();if(!p)return;const G=mfAll(p);if(!G.length)return;const a=document.getElementById("rabg");if(!a)return;
 a.insertAdjacentHTML("afterend",'<div class="card" id="mfret"><b>Fotos beim Herrichten</b><p class="mute" style="margin:2px 0 0;font-size:13px">So viel ist rausgegangen.</p>'+G.map(g=>'<div class="mfg">'+mfGrpLbl(p,g)+'</div>'+mfThumbs(p,g.ps,g.l)).join("")+'</div>');mfBind(false)}
/* Bilder laden, Antippen = groß; edit = in der Packliste (hinzufügen, Text ändern, löschen) */
function mfBind(edit){document.querySelectorAll("img[data-mfph]").forEach(async im=>{if(im.dataset.mfb)return;im.dataset.mfb="1";const id=im.dataset.mfph;im.onclick=()=>{const p=packs.find(x=>x.id===im.dataset.mfp);if(p)mfView(p,im.dataset.mfps||null,id,edit)};const u=await rPhoto(id);if(u)im.src=u});
 if(edit)document.querySelectorAll("[data-mfadd]").forEach(b=>b.onclick=e=>{e.stopPropagation();const p=packs.find(x=>x.id===b.dataset.mfp);if(p)mfPick(p,b.dataset.mfadd||null,null)})}
function mfView(p,ps,id,edit){const e=mfList(p,ps).find(x=>x.id===id);if(!e)return;const v=document.createElement("div");v.className="phv mfv";
 v.innerHTML='<img alt="Foto vom Material"><div class="mfvb"><div class="mfvt"></div><small></small><div class="mfvk">'+(edit?'<button class="btn ghost s" type="button" data-mfvc>Text ändern</button><button class="btn ghost s red" type="button" data-mfvx>Löschen</button>':'')+'<button class="btn s" type="button" data-mfvz>Schließen</button></div></div>';
 v.querySelector(".mfvt").textContent=e.c||"";v.querySelector("small").textContent=(ps?"Zusatz "+ps:"Packschein "+(p.ps||""))+" · "+fmt(e.t).slice(0,6)+" von "+nmA(e,"by");
 rPhoto(id).then(u=>{if(u)v.querySelector("img").src=u});const close=()=>v.remove();v.querySelector("img").onclick=close;v.querySelector("[data-mfvz]").onclick=close;
 if(edit){v.querySelector("[data-mfvc]").onclick=()=>{close();mfTextDlg(e.c||"",t=>mfSave(p,ps,mfList(p,ps).map(x=>x.id===id?{...x,c:t}:x)).then(()=>toast("Text gespeichert",1)))};
  v.querySelector("[data-mfvx]").onclick=()=>{close();ask("Foto löschen?",async()=>{try{await mfSave(p,ps,mfList(p,ps).filter(x=>x.id!==id));await db.doc("fotos/"+id).delete().catch(()=>{});toast("Foto gelöscht",1)}catch(x){errBox("Löschen fehlgeschlagen.")}})}}
 document.body.appendChild(v)}
function mfTextDlg(cur,fn){const o=document.createElement("div");o.className="ov";o.innerHTML='<div class="card" style="width:100%;max-width:400px;margin:0"><b>Kurze Beschreibung</b><input id="mftx" maxlength="80" placeholder="z. B. 3 Gitterboxen + 1 Palette" style="width:100%;margin:8px 0"><div class="row"><button class="btn" id="mfty">Speichern</button><button class="btn ghost" id="mftn">Abbrechen</button></div></div>';
 document.body.appendChild(o);const i=o.querySelector("#mftx");i.value=cur;i.focus();o.querySelector("#mftn").onclick=()=>o.remove();o.querySelector("#mfty").onclick=()=>{o.remove();fn(i.value.trim())}}
const mfSave=(p,ps,L)=>pkHSet(p,{[mfKey(ps)]:L.length?L:null});
/* Foto aufnehmen/auswählen → Beschreibung → speichern; after() läuft danach (auch bei Abbrechen) */
function mfPick(p,ps,after){const left=MF_MAX-mfList(p,ps).length;if(left<=0){toast("Maximal "+MF_MAX+" Fotos pro Packschein.");if(after)after();return}
 const inp=document.createElement("input");inp.type="file";inp.accept="image/*";inp.multiple=true;inp.hidden=true;inp.id="mffile";document.body.appendChild(inp);let done=false;
 const fin=()=>{if(done)return;done=true;inp.remove();if(after)after()};
 inp.addEventListener("cancel",fin);
 inp.onchange=async()=>{let fs=[...inp.files];if(!fs.length)return fin();if(fs.length>left){toast("Nur noch "+left+" Foto"+(left===1?"":"s")+" möglich – die ersten werden genommen.");fs=fs.slice(0,left)}
  const D=[];for(const f of fs){try{D.push(await shrink(f))}catch(x){}}if(!D.length){errBox("Foto konnte nicht gelesen werden.");return fin()}mfCapDlg(p,ps,D,fin)};
 inp.click()}
function mfCapDlg(p,ps,D,fin){const o=document.createElement("div");o.className="ov";
 o.innerHTML='<div class="card" style="width:100%;max-width:420px;margin:0"><b>Foto vom Material'+(D.length>1?' ('+D.length+')':'')+'</b><p class="mute" style="margin:2px 0 6px">'+(ps?'Zusatz '+esc(ps):'Packschein '+esc(p.ps||""))+'</p><div class="rph">'+D.map(()=>'<img alt="Vorschau">').join("")+'</div>'+
  '<label class="mute" for="mfc">Kurze Beschreibung (freiwillig)</label><input id="mfc" maxlength="80" placeholder="z. B. 3 Gitterboxen + 1 Palette" style="width:100%;margin:4px 0 10px"><div class="row"><button class="btn" id="mfok">Speichern</button><button class="btn ghost" id="mfno">Abbrechen</button></div></div>';
 o.querySelectorAll(".rph img").forEach((im,k)=>im.src=D[k]);document.body.appendChild(o);
 o.querySelector("#mfno").onclick=()=>{o.remove();fin()};
 o.querySelector("#mfok").onclick=async()=>{const b=o.querySelector("#mfok");b.disabled=true;b.textContent="Wird gespeichert …";const c=o.querySelector("#mfc").value.trim(),add=[];
  try{for(const d of D){const id=p.id+"-m"+Date.now().toString(36)+Math.random().toString(36).slice(2,6);await db.doc("fotos/"+id).set({d});RPH[id]=d;add.push({id,c,by:me,t:Date.now()})}
   await mfSave(p,ps,mfList(p,ps).concat(add));o.remove();toast(add.length===1?"Foto gespeichert":add.length+" Fotos gespeichert",1);fin()}
  catch(x){console.error(x);if(add.length){try{await mfSave(p,ps,mfList(p,ps).concat(add))}catch(y){}}o.remove();errBox("Foto konnte nicht gespeichert werden. Bitte Internetverbindung prüfen und nochmal versuchen.");fin()}}}
/* nach „Packschein abschließen“: fragen (nur wenn noch kein Foto da ist) */
function mfAfterFin(p,ps,next){if(window.MF_NOASK||mfList(p,ps).length)return next();/* MF_NOASK: nur für ältere Tests */ask2("Foto vom fertigen Material machen? Dann sehen Projektleiter und Retoure, wie viel es ist.","📷 Foto machen","Ohne Foto",()=>mfPick(p,ps,next),next)}
/* Löschen: ganze Packliste / ein Zusatz / automatisch 3 Monate nach Endretoure */
async function mfDelAll(p){const H=pkH(p);for(const k of Object.keys(H).filter(k=>/^mf_/.test(k)&&Array.isArray(H[k])))for(const e of H[k]){try{await db.doc("fotos/"+e.id).delete()}catch(x){}}}
async function mfDel(p,ps){const L=mfList(p,ps);if(!L.length)return;for(const e of L){try{await db.doc("fotos/"+e.id).delete()}catch(x){}}await mfSave(p,ps,[])}
function mfDoneT(p){const H=pkH(p);let t=0;pkRets(p).forEach(r=>{if(r.closed&&r.art!=="teil")t=Math.max(t,r.closedT||r.modT||0)});if(H.klar&&H.klar.t)t=Math.max(t,H.klar.t);return t}
function mfClean(now){now=now||Date.now();let n=0;packs.forEach(p=>{const H=pkH(p),ks=Object.keys(H).filter(k=>/^mf_/.test(k)&&Array.isArray(H[k])&&H[k].length);if(!ks.length)return;const t=mfDoneT(p);if(!t||now-t<MF_KEEP)return;
  ks.forEach(k=>H[k].forEach(e=>{n++;db.doc("fotos/"+e.id).delete().catch(()=>{})}));pkHSet(p,Object.fromEntries(ks.map(k=>[k,null])))});return n}
function mfCleanTick(){try{if(typeof me==="undefined"||!me||!can("pk_s")||!packs.length)return;const d=new Date().toDateString();let last="";try{last=localStorage.getItem("tpc_mfclean")||""}catch(e){}if(last===d)return;mfClean();try{localStorage.setItem("tpc_mfclean",d)}catch(e){}}catch(e){console.warn("Fotos aufräumen",e)}}
setTimeout(mfCleanTick,30000);setInterval(mfCleanTick,3600e3);
(function(){try{const st=document.createElement("style");st.textContent=
'.mfbox{margin:8px 14px 10px;padding-top:8px;border-top:2px solid var(--line)}.mfh{display:flex;align-items:center;justify-content:space-between;gap:8px}.mfh .btn{width:auto}.mf0{margin:4px 0 0;font-size:13px}'+
'.mfr{gap:10px}.mft{margin:0;width:84px}.mft figcaption{font-size:12px;line-height:1.25;margin-top:3px;color:var(--ink);word-break:break-word}.mfg{font-size:13px;font-weight:700;color:var(--mute);margin-top:8px}'+
'.mfv{flex-direction:column;gap:10px}.mfv img{max-height:calc(100% - 130px)}.mfvb{background:#fff;color:#17212f;border-radius:12px;padding:10px 12px;width:100%;max-width:520px}.mfvt{font-weight:700}.mfvb small{color:#4a5568}.mfvk{display:flex;gap:8px;justify-content:flex-end;margin-top:8px;flex-wrap:wrap}.mfvk .btn{width:auto}.mfvk .btn.ghost{background:#fff!important;color:#114a97!important;border:2px solid #114a97!important}.mfvk .btn.ghost.red{color:#b8322a!important;border-color:#b8322a!important}'+
/* Packschein-Feld ist auch im Dunkelmodus hell (wie die Zeilen ab 1.164) */
'.pkf .mfbox{border-top-color:#d5dbe5;color:#17212f}.pkf .mfh b,.pkf .mft figcaption{color:#17212f!important}.pkf .mf0{color:#4a5568!important}.pkf .mfh .btn.ghost{background:#fff!important;color:#114a97!important;border:2px solid #114a97!important}.pkf .rph img{background:#d5dbe5}';
document.head.appendChild(st)}catch(e){}})();
