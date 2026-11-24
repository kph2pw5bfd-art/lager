/* ===== Defekt: nicht reparierbar – ausmustern (1.185, Jürgen 24.11.; Notiz https://claude.ai/artifact/WFYfyMqxEhg29MsYjcELxc) =====
   Anlass: 16A-Kabel 5 m nicht mehr zu reparieren – Sonja soll es in epirent austragen.
   Im Defekt Knopf „Nicht reparierbar – ausmustern“ (Recht Defekte – Bearbeiten), Grund (Pflicht) + Fotos (optional), bei Stückzahl „Wie viele?“
   (Rest bleibt offen, wsSplit). Defekt danach erledigt: aus={by,t,why,n,fn}. Zusätzlich Eintrag in docs fmx (id ausg_<Defekt>, pk "ausg", was "ausg")
   → Liste „Noch in epirent auszutragen“ (fm.js), Sonja tippt „Ausgetragen ✓“. Push an „Aufträge zu prüfen“-Empfänger (Lagerleiter) über ausmustern.sql.
   „Wieder auf offen setzen“ bei einem ausgemusterten Defekt nimmt das Ausmustern samt fmx-Eintrag zurück. */
function ausBtn(d){return d.done?'':'<button class="btn" id="dausm" type="button" style="margin-top:10px;background:#b71c1c;border-color:#b71c1c;color:#fff">Nicht reparierbar – ausmustern</button>'}
function ausLine(d){const a=d.aus;if(!a||!a.t)return "";const x=typeof FMX!=="undefined"?FMX.find(y=>y.id==="ausg_"+d.id):null,et=x&&x.aus&&x.aus.t;
 return '<div class="ausbox"><b>Ausgemustert – nicht reparierbar'+(+a.n>1?' ('+a.n+' Stk)':'')+'</b><div>'+esc(a.why||"")+'</div><small>'+esc(nmA(a,"by"))+', '+fmt(a.t).slice(0,10)+' · '+(et?'in epirent ausgetragen von '+esc(nmA(x.aus,"by"))+', '+fmt(x.aus.t).slice(0,6):'noch in epirent auszutragen')+'</small>'+(+a.fn?'<div class="thr" id="dausph"></div>':'')+'</div>'}
async function ausPhotos(d){const el=document.getElementById("dausph");if(!el||!d.aus)return;let h="";for(let i=0;i<(+d.aus.fn||0);i++){try{const s=await db.doc("fotos/"+d.id+"-a"+i).get();if(s.exists&&s.data().d)h+='<img src="'+s.data().d+'" alt="Foto '+(i+1)+'" style="width:84px;height:84px;object-fit:cover;border-radius:8px;margin:6px 6px 0 0" data-ausbig="'+i+'">'}catch(e){}}
 el.innerHTML=h;el.querySelectorAll("img").forEach(im=>im.onclick=()=>{const o=document.createElement("div");o.className="ov";o.innerHTML='<img src="'+im.src+'" alt="Foto" style="max-width:96vw;max-height:86vh;border-radius:10px">';o.onclick=()=>o.remove();document.body.appendChild(o)})}
function ausStart(d){if(!can("def_b"))return toast("Dafür brauchst du das Recht „Defekte – Bearbeiten“.");const n=dxQ(d);if(n<=1)return ausDlg(d,1);let k=n;const o=document.createElement("div");o.className="ov";
 o.innerHTML='<div class="card" style="width:100%;max-width:400px;margin:0"><b style="font-size:18px">Wie viele sind nicht reparierbar?</b><p class="mute" style="margin:2px 0 0">'+n+' × '+esc(d.art)+'</p><div class="wsq"><button type="button" id="auqm" aria-label="Weniger">−</button><b id="auqv"></b><button type="button" id="auqp" aria-label="Mehr">+</button></div><p class="mute" id="auqh" style="font-size:13px;min-height:18px;margin:0 0 10px"></p><div class="row"><button class="btn ghost" type="button" id="auqx">Abbrechen</button><button class="btn" type="button" id="auqo">Weiter</button></div></div>';
 document.body.appendChild(o);const q=s=>o.querySelector(s),upd=()=>{q("#auqv").textContent=k+" von "+n;q("#auqh").textContent=k<n?(n-k)+" Stk bleiben als offener Defekt stehen.":"Alle Stück werden ausgemustert."};upd();
 q("#auqm").onclick=()=>{if(k>1){k--;upd()}};q("#auqp").onclick=()=>{if(k<n){k++;upd()}};q("#auqx").onclick=()=>o.remove();q("#auqo").onclick=()=>{o.remove();ausDlg(d,k)}}
function ausDlg(d,k){const n=dxQ(d),F=[],o=document.createElement("div");o.className="ov";
 o.innerHTML='<div class="card" style="width:100%;max-width:440px;margin:0"><b style="font-size:18px">Nicht reparierbar – ausmustern</b><p class="mute" style="margin:2px 0 10px">'+k+' × '+esc(d.art)+(d.anr?' · Nr. '+esc(d.anr):'')+'</p>'+
  '<label class="mute" for="ausw">Grund (Pflicht)</label><textarea id="ausw" rows="3" placeholder="z. B. Mantel gebrochen, Stecker verschmort – Reparatur lohnt nicht"></textarea>'+
  '<div class="row" style="margin-top:8px"><button class="btn ghost" type="button" id="ausc">📷 Foto machen</button><button class="btn ghost" type="button" id="ausg">🖼 Aus der Galerie</button></div><div id="ausf" style="display:flex;flex-wrap:wrap;gap:6px;margin-top:6px"></div>'+
  '<p class="mute" style="font-size:13px;margin:10px 0">Der Defekt ist danach erledigt. Der Artikel kommt auf die Liste „Noch in epirent auszutragen“, die Lagerleitung bekommt eine Nachricht.</p>'+
  '<div class="row"><button class="btn ghost" type="button" id="ausx">Abbrechen</button><button class="btn" type="button" id="auso" style="background:#b71c1c;border-color:#b71c1c">Ausmustern</button></div></div>';
 document.body.appendChild(o);const q=s=>o.querySelector(s);
 const draw0=()=>{q("#ausf").innerHTML=F.map((f,i)=>'<span style="position:relative"><img src="'+f+'" alt="Foto '+(i+1)+'" style="width:64px;height:64px;object-fit:cover;border-radius:8px"><button type="button" data-ausrm="'+i+'" aria-label="Foto entfernen" style="position:absolute;top:-6px;right:-6px;width:24px;height:24px;border-radius:50%;border:0;background:#b71c1c;color:#fff;font-weight:800">✕</button></span>').join("");q("#ausf").querySelectorAll("[data-ausrm]").forEach(b=>b.onclick=()=>{F.splice(+b.dataset.ausrm,1);draw0()})};
 const grab=cam=>{const i=document.createElement("input");i.type="file";i.accept="image/*";if(cam)i.setAttribute("capture","environment");else i.multiple=true;
  i.onchange=async()=>{for(const f of [...i.files].slice(0,6-F.length)){try{F.push(await shrink(f))}catch(e){}}draw0()};i.click()};
 q("#ausc").onclick=()=>grab(true);q("#ausg").onclick=()=>grab(false);q("#ausx").onclick=()=>o.remove();
 q("#auso").onclick=async()=>{const why=q("#ausw").value.trim();if(!why){q("#ausw").focus();return toast("Bitte einen Grund angeben.")}
  q("#auso").disabled=true;try{
   if(k<n&&typeof wsSplit==="function")await wsSplit(d,k);
   for(let i=0;i<F.length;i++)await db.doc("fotos/"+d.id+"-a"+i).set({d:F[i]});
   const t=Date.now(),a={by:me,t,why,n:k,fn:F.length};
   await db.doc("defekte/"+d.id).update({...(k<n?{n:k}:{}),done:true,doneBy:me,doneT:t,aus:a});
   await db.doc("fmx/ausg_"+d.id).set({pk:"ausg",k:"def:"+d.id,def:d.id,q:k,u:"Stk",name:d.art||"Artikel",code:d.anr||"",was:"ausg",by:me,t,txt:why+(d.ev?" · "+d.ev:""),aus:null});
   o.remove();toast("Ausgemustert – steht jetzt bei „Noch in epirent auszutragen“",1);draw()}catch(e){console.error(e);q("#auso").disabled=false;toast("Speichern fehlgeschlagen. Bitte nochmal versuchen.")}}}
function ausUndo(d){if(!can("def_b"))return;const x=typeof FMX!=="undefined"?FMX.find(y=>y.id==="ausg_"+d.id):null;
 ask((x&&x.aus&&x.aus.t?"Achtung: In epirent ist der Artikel schon als ausgetragen markiert. ":"")+"Ausmustern zurücknehmen? Der Defekt ist dann wieder offen.",async()=>{
  try{await db.doc("defekte/"+d.id).update({done:false,doneBy:"",doneT:0,aus:null});if(x)await db.doc("fmx/"+x.id).delete();toast("Zurückgenommen – Defekt wieder offen",1)}catch(e){toast("Speichern fehlgeschlagen.")}})}
(function(){try{const st=document.createElement("style");st.textContent='.ausbox{margin:10px 0;padding:10px 12px;border-radius:10px;background:#b71c1c;color:#fff}.ausbox b{display:block;font-size:16px}.ausbox small{display:block;opacity:.95;margin-top:4px}';document.head.appendChild(st)}catch(e){}})();
