/* ===== Hauptseite sortieren (ab 1.75) =====
   Reihenfolge der Kacheln: eigene Reihenfolge (docs „hord“, id = Benutzer) → Vorgabe vom Titel (titel.ho) → Vorschlag nach Titelname.
   Kacheln ohne Recht bleiben ausgeblendet, die Reihenfolge ändert daran nichts. */
const HO_ALL=["jarvis","au","pack","ret","infonew","defnew","new"];
const HO_NAME={jarvis:"Lager Übersicht",au:"Meine Aufträge",pack:"Packlisten",ret:"Retourschein",infonew:"Info an das Lager",defnew:"Defekt melden",new:"Material vor Ort erfassen"};
const HO_DEF={L:["jarvis","pack","ret","infonew","defnew","new"],M:["au","new","defnew","infonew","jarvis","pack","ret"],W:["defnew","infonew","jarvis","new","pack","ret","au"]};
function hoDefFor(t){const n=String(t&&t.name||"").toLowerCase();return /werkstatt/.test(n)?HO_DEF.W:/monteur|projektleit/.test(n)?HO_DEF.M:HO_DEF.L}
function hoFix(a){const o=(Array.isArray(a)?a:[]).filter((k,i,A)=>HO_ALL.includes(k)&&A.indexOf(k)===i);HO_ALL.forEach((k,i)=>{if(!o.includes(k))o.splice(Math.min(i,o.length),0,k)});return o}
const hoTit=id=>(typeof TIT!=="undefined"&&id&&TIT[id])||null;
function hoTitle(id){const t=hoTit(id);return hoFix(t&&Array.isArray(t.ho)?t.ho:hoDefFor(t))}
let HORD={},hoOn=false;
function hoSub(){if(hoOn)return;hoOn=true;try{db.collection("hord").onSnapshot(s=>{HORD={};s.docs.forEach(d=>HORD[d.id]=d.data());if(view==="start"||view==="art")draw()})}catch(e){console.warn(e)}}
const hoOwn=()=>{const x=HORD[me];return x&&Array.isArray(x.o)?hoFix(x.o):null};
const hoMyTitle=()=>(typeof ROL!=="undefined"&&ROL[me]&&ROL[me].t)||"";
function hoMine(){return hoOwn()||hoTitle(hoMyTitle())}
function homeSort(){const g=document.querySelector(".hgrid");if(!g)return;const o=hoMine(),ix=k=>{const i=o.indexOf(k);return i<0?99:i};
 [...g.children].sort((a,b)=>ix(a.dataset.g)-ix(b.dataset.g)).forEach(c=>g.appendChild(c))}
const HO_UP='<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M6 15l6-6 6 6"/></svg>';
const HO_DN='<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M6 9l6 6 6-6"/></svg>';
function hoList(o,box){return '<div class="hoed" data-hobox="'+esc(box)+'">'+o.map((k,i)=>'<div class="hor"><span class="hon">'+(i+1)+'</span><span class="hol">'+esc(HO_NAME[k])+'</span>'+
 '<button type="button" class="hob" data-hmv="-1" data-hk="'+k+'" aria-label="'+esc(HO_NAME[k])+' nach oben"'+(i===0?' disabled':'')+'>'+HO_UP+'</button>'+
 '<button type="button" class="hob" data-hmv="1" data-hk="'+k+'" aria-label="'+esc(HO_NAME[k])+' nach unten"'+(i===o.length-1?' disabled':'')+'>'+HO_DN+'</button></div>').join("")+'</div>'}
const hoMove=(o,k,d)=>{const a=o.slice(),i=a.indexOf(k),j=i+d;if(i<0||j<0||j>=a.length)return a;[a[i],a[j]]=[a[j],a[i]];return a};
/* Pfeile binden: get() = aktuelle Reihenfolge, save(neu) speichert; die Liste wird sofort neu gezeichnet */
function hoBind(box,get,save){const el=document.querySelector('[data-hobox="'+box+'"]');if(!el)return;
 el.querySelectorAll("[data-hmv]").forEach(b=>b.onclick=()=>{const a=hoMove(get(),b.dataset.hk,+b.dataset.hmv);el.outerHTML=hoList(a,box);save(a);hoBind(box,()=>a,save);
  const nb=document.querySelector('[data-hobox="'+box+'"] [data-hk="'+b.dataset.hk+'"][data-hmv="'+b.dataset.hmv+'"]');if(nb&&!nb.disabled)nb.focus()})}
/* „Titel und ihre Rechte“: Reihenfolge pro Titel */
function hoTitleBlock(t){return '<div class="hoh"><b>Reihenfolge auf der Hauptseite</b><small>Gilt für alle mit diesem Titel, außer jemand sortiert in den Einstellungen selbst.'+(Array.isArray(t.ho)?'':' Noch der Vorschlag.')+'</small></div>'+hoList(hoTitle(t.id),"t:"+t.id)+
 (Array.isArray(t.ho)?'<button class="btn ghost s hors" type="button" data-hor="'+esc(t.id)+'">Vorschlag wiederherstellen</button>':'')}
function hoTitleBind(){(typeof titList==="function"?titList():[]).forEach(t=>hoBind("t:"+t.id,()=>hoTitle(t.id),a=>rSave(()=>db.doc("titel/"+t.id).update({ho:a}),"Reihenfolge gespeichert")));
 document.querySelectorAll("[data-hor]").forEach(b=>b.onclick=()=>rSave(()=>db.doc("titel/"+b.dataset.hor).update({ho:null}),"Vorschlag wiederhergestellt"))}
/* Einstellungen: eigene Reihenfolge */
function hoMineBlock(){const own=hoOwn(),t=hoTit(hoMyTitle());
 return '<h3 style="margin:18px 0 4px">Hauptseite</h3><p class="mute" style="margin:0 0 8px">'+(own?'Deine eigene Reihenfolge. Gilt für dich auf allen Geräten.':'Reihenfolge '+(t?'vom Titel „'+esc(t.name)+'“':'(Vorschlag)')+'. Mit den Pfeilen sortierst du sie für dich selbst.')+'</p>'+
  '<div class="card" style="padding:4px 12px">'+hoList(hoMine(),"me")+'</div>'+(own?'<button class="btn ghost s" id="hoback" type="button">'+(t?'Zurück zur Reihenfolge vom Titel':'Zurück zum Vorschlag')+'</button>':'')}
function hoMineBind(){hoBind("me",hoMine,a=>rSave(()=>db.doc("hord/"+me).set({o:a,t:Date.now()}),"Reihenfolge gespeichert"));
 const b=$("#hoback");if(b)b.onclick=()=>rSave(()=>db.doc("hord/"+me).delete(),"Zurückgesetzt")}
