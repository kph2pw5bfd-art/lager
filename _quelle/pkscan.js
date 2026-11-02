/* ===== Artikel scannen beim Herrichten (ab 1.99, Entwurf https://claude.ai/artifact/Q6cgjYw5BLqLqFREdoviEL) =====
   Knopf „Artikel scannen“ in der Packliste (ausgeblendet, wenn alles abgeschlossen ist). Ein Scan pro Knopfdruck (rScanCam).
   Code → Artikelnummer wie im Retourschein (rScanNr: 1031–07 → 1031). IDs werden NICHT gespeichert.
   Treffer: Zeile blau markieren (pkScanHl) und das Bearbeiten-Fenster öffnen (pkEdit mit Hinweis). Mehrere Treffer: Auswahl.
   Nicht in der Packliste: Fehler-Ton + Auswahl Alternative für eine offene Position / Zusätzlich mitgeben / Verwerfen. */
function pkScanStart(P){rScanCam(raw=>pkScanHit(P,raw))}
const pkScanCur=P=>packs.find(x=>x.id===P.id)||P;
function pkScanHit(P0,raw){const P=pkScanCur(P0),nr=rScanNr(raw),code=artCode(nr);
 if(!code){beep(false);return errBox("Der Code „"+String(raw||"").trim()+"“ ist keine Artikelnummer.")}
 const IT=pkItems(P),hits=[];IT.forEach((o,i)=>{if(artCode(o.x.a)===code)hits.push(i)});
 const kat=rKat().find(a=>artCode(a.nr)===code)||null,name=(kat&&kat.name)||(hits.length?pkName(IT[hits[0]].x):"Artikel "+code);
 if(hits.length){const open=hits.filter(i=>!pkRowFin(P,i));
  if(!open.length){beep(false);return toast(name+": schon abgeschlossen – zum Ändern erst „Wieder öffnen“.",1)}
  beep(true);return open.length===1?pkScanOpen(P,open[0],code):pkScanPick(P,open,code,name)}
 beep(false);pkScanMiss(P,code,kat)}
/* Zeile markieren, hinscrollen, Bearbeiten öffnen */
function pkScanOpen(P0,i,code,extra){const P=pkScanCur(P0),x=pkPosAll(P)[i],h=pkH(P)[pkKeys(P)[i]],st=pkPS(x,h);
 pkScanHl={id:P.id,i};if(view==="packopen")packOpenView();
 const row=document.querySelector('[data-pkrow="'+i+'"]');if(row)row.scrollIntoView({block:"center",behavior:"smooth"});
 const done=st.s==="ok"&&!pkDevRow(x,h,st);
 pkEdit(P,i,Object.assign({msg:done?"Schon komplett hergerichtet – "+pkName(x):"✓ Gescannt: "+(code?code+" · ":"")+pkName(x)},extra||{}))}
/* Artikel steht mehrmals in der Packliste (z. B. Packschein und Zusatz) */
function pkScanPick(P,L,code,name){const IT=pkItems(P),H=pkH(P),o=document.createElement("div");o.className="ov";
 o.innerHTML='<div class="card" style="width:100%;max-width:420px;margin:0;max-height:92vh;overflow:auto"><div class="pkscm">✓ Gescannt: '+esc(code)+' · '+esc(name)+'</div><b>Steht mehrmals in der Packliste – welche Position?</b><div class="pkscl">'+
  L.map(i=>{const x=IT[i].x,st=pkPS(x,H[IT[i].k]);return '<button type="button" data-psi="'+i+'"><b>'+esc(pkNum(x.n))+(x.u?' '+esc(x.u):'')+' · '+esc(pkName(x))+'</b><small>'+(IT[i].z?'Zusatz '+esc(IT[i].z):'Packschein '+esc(P.ps||""))+' · '+(st.s==="ok"?'hergerichtet':st.s==="part"?pkNum(st.q)+' von '+pkNum(st.need)+' da':'noch offen')+'</small></button>'}).join("")+
  '</div><button class="btn ghost" id="psx" type="button" style="margin-top:10px">Abbrechen</button></div>';
 document.body.appendChild(o);o.querySelector("#psx").onclick=()=>o.remove();
 o.querySelectorAll("[data-psi]").forEach(b=>b.onclick=()=>{o.remove();pkScanOpen(P,+b.dataset.psi,code)})}
/* Nicht in der Packliste: Alternative für eine offene Position, zusätzlich mitgeben oder verwerfen */
function pkScanMiss(P,code,kat){const IT=pkItems(P),H=pkH(P),name=kat?kat.name:"Artikel "+code,gk=kat?[kat.g,kat.u].filter(Boolean).join(" · "):"",xFin=!!(H.fin&&H.fin.t);
 const L=kat?IT.map((o,i)=>({o,i,h:H[o.k]})).filter(r=>!pkRowFin(P,r.i)&&!pkL55(r.o.x,r.h)).map(r=>({...r,st:pkPS(r.o.x,r.h)})).filter(r=>r.st.s!=="ok")
  .map(r=>{const k=pkKat(r.o.x),same=k&&kat?([k.g,k.u].filter(Boolean).join(" · ")===gk?0:k.g===kat.g?1:2):2;return{...r,same}}).sort((a,b)=>a.same-b.same||a.i-b.i):[];
 const o=document.createElement("div");o.className="ov";
 o.innerHTML='<div class="card" style="width:100%;max-width:420px;margin:0;max-height:92vh;overflow:auto"><div class="pkscm w">Gescannt: '+esc(code)+' · '+esc(name)+'<br><b>'+(kat?'steht nicht in dieser Packliste':'ist nicht in der Artikelliste')+'</b></div><b>Was soll damit passieren?</b>'+
  (L.length?'<div class="mute" style="margin:8px 0 4px;font-size:13px">Als Alternative für eine offene Position:</div><div class="pkscl">'+L.map(r=>{const x=r.o.x,left=r.st.s==="part"?r.st.need-r.st.q:r.st.need;
   return '<button type="button" data-psa="'+r.i+'"><b>'+esc(pkName(x))+'</b><small>noch '+esc(pkNum(left))+' '+esc(x.u||"Stk")+' offen'+(r.same===0?' · gleiche Gruppe':'')+(r.o.z?' · Zusatz '+esc(r.o.z):'')+'</small></button>'}).join("")+'</div>':'')+
  (xFin?'':'<button class="btn" id="psxa" type="button" style="margin-top:10px;background:var(--ok);border-color:var(--ok)">+ Zusätzlich mitgeben</button>')+
  '<button class="btn ghost" id="psxx" type="button" style="margin-top:8px">Verwerfen</button></div>';
 document.body.appendChild(o);o.querySelector("#psxx").onclick=()=>o.remove();
 if(o.querySelector("#psxa"))o.querySelector("#psxa").onclick=()=>{o.remove();pkXDlg(P,null,kat?{t:kat.name,a:kat.nr||"",msg:"Gescannt: "+code+" · "+kat.name}:{t:"",a:"",msg:"Gescannt: "+code+" – nicht in der Artikelliste, bitte Namen eintippen"})};
 o.querySelectorAll("[data-psa]").forEach(b=>b.onclick=()=>{o.remove();const i=+b.dataset.psa;pkScanOpen(P,i,"",{msg:"Alternative: "+name+" ("+code+")",alt:{t:name,a:kat.nr||""}})})}
