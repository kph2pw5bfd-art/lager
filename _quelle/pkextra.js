/* ===== Zusätzlich mitgegebenes Material (ab 1.93) =====
   Beim Herrichten Material hinzufügen, das nicht im Packschein steht: packh.x_<id> = {n, u, nm, a, why, by, ts} (null = gelöscht).
   Gehört zur Haupt-Packliste; ändern/löschen, solange sie nicht abgeschlossen ist; darf jeder, der herrichten darf (pk_s).
   Zählt im Abgleich als „raus“, steht im PDF (Abweichungen + Liste), in der Info an den PL und in der Mail an den Monteur.
   Kommt später ein Zusatz oder geänderter Packschein mit demselben Artikel, wird es dagegen verrechnet (pkXApply). */
const pkX=P=>{const H=pkH(P);return Object.keys(H).filter(k=>/^x_/.test(k)&&H[k]&&(+H[k].n||0)>0).map(k=>({id:k,...H[k]})).sort((a,b)=>(a.ts||0)-(b.ts||0))};
const pkXName=e=>{const k=e.a?pkKat({a:e.a}):null;return (k&&k.name)||e.nm||""};
const pkXKey=e=>pkAK({a:e.a,t:e.nm});
const pkXTx=e=>pkNum(e.n)+" "+(e.u||"Stk")+" "+pkXName(e);
/* Liste in der Herricht-Ansicht */
function pkXHtml(P,fin){const X=pkX(P);if(!X.length&&fin)return"";
 return (X.length?'<div class="pkg pkgx">Zusätzlich (nicht im Packschein)</div>'+X.map(e=>'<div class="pkp pk-x"><button class="pkc pkcx" type="button" data-pkxe="'+esc(e.id)+'" aria-label="Ändern"'+(fin?' disabled':'')+'>+</button>'+
   '<span class="pkn" data-pkxe="'+esc(e.id)+'">'+esc(pkNum(e.n))+' '+esc(e.u||"Stk")+'</span><span class="pkt" data-pkxe="'+esc(e.id)+'">'+esc(pkXName(e))+(e.a?' <small>'+esc(e.a)+'</small>':'')+
   '<small class="pkby">'+(e.why?esc(e.why)+' · ':'')+esc(nmA(e,"by"))+', '+fmt(e.ts).slice(-5)+'</small></span></div>').join(""):'')+
  (fin?'':'<button class="pkxadd" id="pkxadd" type="button">+ Material hinzufügen</button>')}
function pkXBind(P,fin){const a=$("#pkxadd");if(a)a.onclick=()=>pkXDlg(P,null);
 document.querySelectorAll("[data-pkxe]").forEach(b=>b.onclick=()=>{if(fin)return toast("Herrichten ist abgeschlossen – zum Ändern erst „Wieder öffnen“.",1);pkXDlg(P,b.dataset.pkxe)})}
/* Hinzufügen / ändern */
function pkXDlg(P,id,pre){const e=id?(pkH(P)[id]||null):null,o=document.createElement("div");o.className="ov";let pick=e&&e.a?{t:pkXName(e),a:e.a}:pre&&pre.t?{t:pre.t,a:pre.a||""}:null;
 o.innerHTML='<div class="card" style="width:100%;max-width:440px;margin:0;max-height:92vh;overflow:auto"><b style="font-size:17px">'+(e?'Zusätzliches Material ändern':'Material hinzufügen')+'</b>'+
  '<p class="mute" style="margin:4px 0 10px">Steht nicht im Packschein – wird trotzdem mitgegeben.</p>'+
  '<label class="mute" for="pxt">Artikel</label><div style="position:relative"><input id="pxt" placeholder="Artikel suchen oder frei eintippen" autocomplete="off" style="margin:0"><div id="pxres" class="peres"></div></div>'+
  '<div class="row" style="gap:8px;align-items:flex-end;margin-top:10px"><div style="flex:1"><label class="mute" for="pxn">Menge</label><div class="row" style="align-items:center;gap:6px"><button class="btn ghost" id="pxm" type="button" style="flex:0 0 46px">−</button><input id="pxn" type="number" inputmode="decimal" min="0" style="text-align:center;font-size:20px;margin:0"><button class="btn ghost" id="pxp" type="button" style="flex:0 0 46px">+</button></div></div>'+
  '<div style="flex:0 0 86px"><label class="mute" for="pxu">Einheit</label><input id="pxu" maxlength="8" style="margin:0"></div></div>'+
  '<label class="mute" for="pxw" style="margin-top:10px;display:block">Grund (optional)</label><input id="pxw" maxlength="80" placeholder="z. B. Monteur hat angerufen" style="margin:0">'+
  '<div class="row" style="margin-top:14px"><button class="btn ghost" id="pxx" type="button">Abbrechen</button><button class="btn" id="pxs" type="button">'+(e?'Speichern':'Hinzufügen')+'</button></div>'+
  (e?'<button class="lnk" id="pxd" type="button" style="margin-top:8px;color:var(--bad)">Löschen</button>':'')+'</div>';
 document.body.appendChild(o);const g=k=>o.querySelector("#"+k),K=(typeof rkat!=="undefined"&&Array.isArray(rkat))?rkat:[];
 g("pxt").value=e?pkXName(e):(pre&&pre.t)||"";if(pre&&pre.msg)o.querySelector(".card").insertAdjacentHTML("afterbegin",'<div class="pkscm w">'+esc(pre.msg)+'</div>');g("pxn").value=e?String(e.n):"1";g("pxu").value=e?(e.u||"Stk"):"Stk";g("pxw").value=e?(e.why||""):"";
 g("pxt").oninput=()=>{pick=null;const t=g("pxt").value.trim().toLowerCase();if(t.length<2){g("pxres").innerHTML="";return}
  const L=K.filter(a=>String(a.name||"").toLowerCase().includes(t)||String(a.nr||"").toLowerCase().startsWith(t)).slice(0,6);
  g("pxres").innerHTML=L.map((a,j)=>'<button type="button" data-xr="'+j+'"><b>'+esc(a.name)+'</b> <small>'+esc(a.nr||"")+(a.g?' · '+esc(a.g):'')+'</small></button>').join("");
  g("pxres").querySelectorAll("[data-xr]").forEach(b=>b.onclick=()=>{const a=L[+b.dataset.xr];pick={t:a.name,a:a.nr||""};g("pxt").value=a.name;g("pxres").innerHTML=""})};
 const nv=()=>Math.max(0,parseFloat(String(g("pxn").value).replace(",","."))||0);
 g("pxm").onclick=()=>{g("pxn").value=String(Math.max(0,nv()-1))};g("pxp").onclick=()=>{g("pxn").value=String(nv()+1)};
 g("pxx").onclick=()=>o.remove();
 if(g("pxd"))g("pxd").onclick=()=>{o.remove();ask("Zusätzliches Material „"+pkXTx(e)+"“ löschen?",()=>pkHSet(P,{[id]:null}).then(()=>toast("Gelöscht",1)))};
 g("pxs").onclick=()=>{const t=g("pxt").value.trim(),n=nv(),u=g("pxu").value.trim()||"Stk";if(!t){g("pxt").classList.add("bad");return}if(!n){g("pxn").classList.add("bad");return}
  const d={n,u,nm:pick&&pick.t===t?pick.t:t,a:pick&&pick.t===t?pick.a:"",why:g("pxw").value.trim(),by:me,...tabAs("by"),ts:e?e.ts:Date.now()};if(e)d.mod={by:me,t:Date.now()};
  o.remove();pkHSet(P,{[id||("x_"+Date.now().toString(36)+Math.random().toString(36).slice(2,5))]:d}).then(()=>toast(e?"Geändert":"Hinzugefügt: "+pkXTx(d),1))}}
/* Später: Zusatz / geänderter Packschein mit demselben Artikel → zusätzliches Material dagegen verrechnen.
   H = Stand inkl. bereits geplanter Änderungen, items = neue Positionen [{x,k}]. Gibt Patch (Positionen + gekürzte/gelöschte x_) zurück. */
function pkXApply(P,H,items){const pool={},patch={};
 Object.keys(H).filter(k=>/^x_/.test(k)&&H[k]&&(+H[k].n||0)>0).forEach(k=>{const e=H[k],key=pkXKey(e);(pool[key]=pool[key]||[]).push({k,e,left:+e.n||0})});
 if(!Object.keys(pool).length)return patch;
 items.forEach(o=>{const x=o.x,h=H[o.k]||null;if(pkL55(x,h))return;const L=pool[pkAK(x)];if(!L)return;const st=pkPS(x,h),need=st.need,have=st.s==="ok"?need:st.s==="part"?(+st.q||0):0;let rest=need-have;if(rest<=0)return;
  let got=0,from=null;L.forEach(p=>{if(rest<=0||p.left<=0)return;const t=Math.min(rest,p.left);p.left-=t;rest-=t;got+=t;from=from||p.e});
  if(!got)return;const q=have+got,nh={...(h||{}),q,ok:q>=need,by:from.by,t:Date.now(),xf:true};if(nh.ok)delete nh.q;patch[o.k]=nh});
 Object.values(pool).forEach(L=>L.forEach(p=>{if(p.left<=0)patch[p.k]=null;else if(p.left!==(+p.e.n||0))patch[p.k]={...p.e,n:p.left}}));
 return patch}
