/* ===== Push-Nachrichten aufs Handy (ab 1.107, Entwurf https://claude.ai/artifact/J45vHSeumHWjGnqd9o4Q8f, Jürgen: „Ja das passt“) =====
   Arten: pr = Aufträge zu prüfen (Endretoure), def = dringende Defekte, pk = neue Packlisten (auch an den, der hochlädt → Lager-Tablet).
   Wer darf: Titel-Einstellung titel.push {pr,def,pk} (sonst Standard: Lagerleiter pr, Werkstatt def, Lagerarbeiter pk); Admin alles.
   Jedes Handy meldet sich selbst an (Einstellungen → Benachrichtigungen): Service Worker sw.js + pushManager.subscribe,
   gespeichert in Tabelle push_abos (endpoint, sub, typen). Verschickt wird von der Edge Function „push“ (push.sql löst aus).
   Antippen der Nachricht öffnet ./?go=pr | def:<id> | pk:<id> (bzw. Nachricht an die offene App). */
const PUSH_FN=SB_URL+"/functions/v1/push",PUSH_EP="tpc_push_ep";
const PUSH_T=[["pr","Aufträge zu prüfen","bei jeder neuen Endretoure"],["def","Dringende Defekte","wenn ein dringender Defekt gemeldet wird"],["pk","Neue Packlisten","wenn eine Packliste hochgeladen wird"]];
const PUSH_DEF={pr:["lagerleiter"],def:["werkstatt"],pk:["lagerarbeiter"]};
const pushTitOn=(tid,typ)=>{const pu=((typeof TIT!=="undefined"&&TIT[tid])||{}).push;return pu&&typeof pu[typ]==="boolean"?pu[typ]:(PUSH_DEF[typ]||[]).includes(tid)};
const pushAllowed=typ=>(typeof realOwner!=="undefined"&&realOwner)||pushTitOn(hoMyTitle(),typ);
const pushHas=()=>"serviceWorker" in navigator&&"PushManager" in window&&"Notification" in window;
const pushStandalone=()=>!!(navigator.standalone||(window.matchMedia&&matchMedia("(display-mode: standalone)").matches));
const pushIOS=()=>/iP(hone|ad|od)/.test(navigator.userAgent)||(navigator.platform==="MacIntel"&&navigator.maxTouchPoints>1);
let pushReg=null,pushRow=null;
async function pushTok(){try{const {data}=await SB.auth.getSession();return data&&data.session?data.session.access_token:SB_KEY}catch(e){return SB_KEY}}
async function pushFetch(method,body){const r=await fetch(PUSH_FN,{method,headers:{"Content-Type":"application/json",apikey:SB_KEY,Authorization:"Bearer "+await pushTok()},body:body?JSON.stringify(body):undefined});const j=await r.json().catch(()=>({}));if(!r.ok)throw new Error(j.fehler||("Fehler "+r.status));return j}
const pushB64=s=>{const p="=".repeat((4-s.length%4)%4),b=atob((s+p).replace(/-/g,"+").replace(/_/g,"/"));return Uint8Array.from([...b].map(c=>c.charCodeAt(0)))};
function pushDev(){const u=navigator.userAgent;return (/iPhone/.test(u)?"iPhone":/iPad/.test(u)?"iPad":/Android/.test(u)?"Android":/Windows/.test(u)?"Windows-PC":/Mac/.test(u)?"Mac":"Gerät")+(typeof tabOn==="function"&&tabOn()?" (Lager-Tablet)":"")}
/* Start: Service Worker anmelden, ?go= auswerten, Nachrichten der offenen App annehmen */
async function pushStart(){if(!("serviceWorker" in navigator))return;
 try{pushReg=await navigator.serviceWorker.register("sw.js")}catch(e){console.warn("Service Worker",e)}
 navigator.serviceWorker.addEventListener("message",e=>{if(e.data&&typeof e.data.go==="string")pushGo(e.data.go)});
 try{const g=new URLSearchParams(location.search).get("go");if(g){history.replaceState(null,"",location.pathname);pushGo(g)}}catch(e){}
 pushLoad()}
async function pushLoad(){pushRow=null;try{const ep=localStorage.getItem(PUSH_EP);if(!ep||!pushHas()||Notification.permission!=="granted")return;
 const reg=pushReg||await navigator.serviceWorker.ready,sub=await reg.pushManager.getSubscription();if(!sub||sub.endpoint!==ep){localStorage.removeItem(PUSH_EP);return}
 const {data}=await SB.from("push_abos").select("endpoint,typen").eq("endpoint",ep).maybeSingle();pushRow=data||null;
 if(!pushRow){const typen={};PUSH_T.forEach(([k])=>typen[k]=!realOwner&&pushAllowed(k));await pushSave(sub,typen)}}catch(e){console.warn(e)}}
function pushGo(g){const run=()=>{if(g==="pr"){if(can("abg_p"))go("abgpr");return}const i=g.indexOf(":"),a=g.slice(0,i),id=g.slice(i+1);
  if(a==="def"&&id){curDef=id;go("defopen")}else if(a==="pk"&&id){curPack=id;go("packopen")}};setTimeout(run,900)}
async function pushSave(sub,typen){const row={endpoint:sub.endpoint,user_id:ME.id,sub:sub.toJSON?sub.toJSON():sub,typen,geraet:pushDev(),t:new Date().toISOString()};
 const {error}=await SB.from("push_abos").upsert(row);if(error)throw error;pushRow=row;try{localStorage.setItem(PUSH_EP,sub.endpoint)}catch(e){}}
async function pushOn(){if(!pushHas())return errBox("Dieses Gerät kann keine Nachrichten empfangen.");
 const p=await Notification.requestPermission();if(p!=="granted")return errBox("Nachrichten wurden nicht erlaubt. Das kannst du in den Einstellungen des Handys für die Lager App ändern.");
 try{const {key}=await pushFetch("GET");const reg=pushReg||await navigator.serviceWorker.register("sw.js");await navigator.serviceWorker.ready;
  let sub=await reg.pushManager.getSubscription();if(!sub)sub=await reg.pushManager.subscribe({userVisibleOnly:true,applicationServerKey:pushB64(key)});
  const typen={};PUSH_T.forEach(([k])=>typen[k]=!realOwner&&pushAllowed(k));await pushSave(sub,typen);toast("Benachrichtigungen eingeschaltet",1)}
 catch(e){console.error(e);errBox("Einschalten hat nicht geklappt ("+(e&&e.message||e)+"). Ist die Funktion „push“ in Supabase angelegt?")}
 pushRedraw()}
async function pushOff(){try{const reg=pushReg||await navigator.serviceWorker.ready,sub=await reg.pushManager.getSubscription(),ep=localStorage.getItem(PUSH_EP)||(sub&&sub.endpoint);
 if(ep)await SB.from("push_abos").delete().eq("endpoint",ep);if(sub)await sub.unsubscribe()}catch(e){console.warn(e)}try{localStorage.removeItem(PUSH_EP)}catch(e){}pushRow=null;toast("Benachrichtigungen auf diesem Gerät ausgeschaltet",1);pushRedraw()}
async function pushSet(k,v){if(!pushRow)return;const typen={...(pushRow.typen||{}),[k]:v};const {error}=await SB.from("push_abos").update({typen}).eq("endpoint",pushRow.endpoint);if(error)return errBox("Speichern fehlgeschlagen.");pushRow.typen=typen}
async function pushTest(b){b.disabled=true;try{const j=await pushFetch("POST",{test:true});toast(j.gesendet?"Test-Nachricht geschickt – kommt gleich":"Kein angemeldetes Gerät gefunden",1)}catch(e){errBox("Test ging nicht ("+(e&&e.message||e)+").")}b.disabled=false}
/* Einstellungen → Benachrichtigungen */
function pushBlock(){const A=PUSH_T.filter(([k])=>pushAllowed(k));
 return '<h3 style="margin:18px 0 4px">Benachrichtigungen</h3><div class="card" id="pushbox" style="cursor:default">'+pushInner(A)+'</div>'}
function pushInner(A){A=A||PUSH_T.filter(([k])=>pushAllowed(k));
 if(!A.length)return '<p class="mute" style="margin:0">Für deinen Titel gibt es keine Nachrichten aufs Handy.</p>';
 if(pushIOS()&&!pushStandalone())return '<div class="pshint">iPhone/iPad: Nachrichten gehen nur, wenn die App als Symbol auf dem Home-Bildschirm liegt (Teilen → „Zum Home-Bildschirm“) und von dort geöffnet wird.</div>';
 if(!pushHas())return '<p class="mute" style="margin:0">Dieses Gerät bzw. dieser Browser kann keine Nachrichten empfangen.</p>';
 if(Notification.permission==="denied")return '<div class="pshint">Nachrichten sind für die Lager App gesperrt. In den Einstellungen des Handys bei „Mitteilungen“ für die Lager App erlauben, dann hier nochmal versuchen.</div>';
 if(!pushRow)return '<p class="mute" style="margin:0 0 8px">Nachrichten kommen sofort aufs Handy, auch wenn die App zu ist: '+A.map(x=>x[1]).join(", ")+'.</p><button class="btn" id="pshon" type="button">Benachrichtigungen erlauben</button>';
 const T=pushRow.typen||{};
 return '<div class="psok">✓ Auf diesem Gerät eingeschaltet</div>'+A.map(([k,l,s])=>'<label class="pssw"><span>'+l+'<small>'+s+'</small></span><input type="checkbox" data-psk="'+k+'"'+(T[k]?' checked':'')+'></label>').join("")+
  '<button class="btn ghost" id="pshtest" type="button" style="margin-top:10px">Test-Nachricht senden</button><button class="btn ghost" id="pshoff" type="button" style="margin-top:8px">Auf diesem Gerät ausschalten</button>'}
function pushBind(){const box=$("#pushbox");if(!box)return;
 if($("#pshon"))$("#pshon").onclick=pushOn;if($("#pshoff"))$("#pshoff").onclick=()=>ask("Benachrichtigungen auf diesem Gerät ausschalten?",pushOff);if($("#pshtest"))$("#pshtest").onclick=e=>pushTest(e.currentTarget);
 box.querySelectorAll("[data-psk]").forEach(c=>c.onchange=()=>pushSet(c.dataset.psk,c.checked))}
function pushRedraw(){const box=$("#pushbox");if(box){box.innerHTML=pushInner();pushBind()}}
/* Titel und ihre Rechte: welche Nachrichten der Titel bekommen darf */
function pushTitleBlock(t){return '<div class="hoh" style="margin-top:12px"><b>Benachrichtigungen aufs Handy</b><small>Wer diesen Titel hat, kann sie in den Einstellungen einschalten.</small></div><div class="pstit">'+
  PUSH_T.map(([k,l])=>'<label><input type="checkbox" data-pst="'+esc(t.id)+'|'+k+'"'+(pushTitOn(t.id,k)?' checked':'')+'> '+l+'</label>').join("")+'</div>'}
function pushTitleBind(){document.querySelectorAll("[data-pst]").forEach(c=>c.onchange=()=>{const [id,k]=c.dataset.pst.split("|"),cur={};PUSH_T.forEach(([x])=>cur[x]=pushTitOn(id,x));cur[k]=c.checked;
 rSave(()=>db.doc("titel/"+id).update({push:cur}),"Benachrichtigungen gespeichert")})}

