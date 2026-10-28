const APPV="1.32 (28.10.)";

/* ===== Verbindung zu Supabase (ersetzt die Claude-Datenbank) ===== */
const RECOVERY=/type=recovery/.test(location.hash);
const SB_URL="https://whfeipnyzffrejbakweb.supabase.co";
const SB_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndoZmVpcG55emZmcmVqYmFrd2ViIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTMxNjE3MjUsImV4cCI6MjEwODczNzcyNX0.aUo3d2SyIzFX5-a4vQa37FxaBMBI10CzFfnF9roHl0U";
const SB=supabase.createClient(SB_URL,SB_KEY,{auth:{persistSession:true,autoRefreshToken:true,detectSessionInUrl:true}});
const HERE=location.origin+location.pathname;
let ME=null,PROF=null,PROFS=[];
const LIVE=["lists","artikel","defekte","infos","werkstatt","users","lager","retour","rkat"];
const DBX=(()=>{const subs={};let ch=null;
 const snap=s=>({docs:[...s.rows.values()].map(r=>({id:r.id,data:()=>r.data}))});
 const emit=c=>{const s=subs[c];if(!s||!s.ready)return;const v=snap(s);s.cbs.slice().forEach(f=>{try{f(v)}catch(e){console.error(e)}})};
 async function load(c){const s=subs[c];let all=[],from=0;for(;;){const {data,error}=await SB.from("docs").select("id,data").eq("col",c).range(from,from+999);if(error){console.error(error);return}all=all.concat(data);if(data.length<1000)break;from+=1000}s.rows=new Map(all.map(r=>[r.id,r]));s.ready=true;emit(c)}
 const put=(c,id,data)=>{const s=subs[c];if(s){s.rows.set(id,{id,data});emit(c)}};
 const del=(c,id)=>{const s=subs[c];if(s&&s.rows.delete(id))emit(c)};
 const reload=()=>Object.keys(subs).forEach(load);
 function listen(){if(ch)return;const f="col=in.("+LIVE.join(",")+")";
  ch=SB.channel("docs-live")
   .on("postgres_changes",{event:"INSERT",schema:"public",table:"docs",filter:f},p=>p.new&&put(p.new.col,p.new.id,p.new.data))
   .on("postgres_changes",{event:"UPDATE",schema:"public",table:"docs",filter:f},p=>p.new&&put(p.new.col,p.new.id,p.new.data))
   .on("postgres_changes",{event:"DELETE",schema:"public",table:"docs"},p=>p.old&&del(p.old.col,p.old.id))
   .on("postgres_changes",{event:"*",schema:"public",table:"profiles"},()=>loadProfs())
   .subscribe(st=>{if(st==="SUBSCRIBED")reload()})}
 document.addEventListener("visibilitychange",()=>{if(document.visibilityState==="visible"&&ME){reload();loadProfs()}});
 window.addEventListener("online",()=>{if(ME){reload();loadProfs()}});
 const api={
  collection:c=>({onSnapshot(cb){let s=subs[c];if(!s){s=subs[c]={rows:new Map(),cbs:[],ready:false};load(c)}s.cbs.push(cb);if(s.ready)cb(snap(s));listen();return()=>{s.cbs=s.cbs.filter(f=>f!==cb)}},doc:id=>api.doc(c+"/"+id)}),
  doc:p=>{const i=p.indexOf("/"),c=p.slice(0,i),id=p.slice(i+1);return{
   async set(d){const {data,error}=await SB.from("docs").upsert({col:c,id,data:d,updated_at:new Date().toISOString()}).select("data").single();if(error)throw error;put(c,id,data.data)},
   async update(pt){const {data,error}=await SB.rpc("doc_update",{p_col:c,p_id:id,p_patch:pt});if(error)throw error;put(c,id,data)},
   async delete(){const {error}=await SB.from("docs").delete().eq("col",c).eq("id",id);if(error)throw error;del(c,id)},
   async get(){const {data,error}=await SB.from("docs").select("data").eq("col",c).eq("id",id).maybeSingle();if(error)throw error;return{exists:!!data,data:()=>data?data.data:undefined}}}}};
 return api})();
const USERX={id:async()=>ME.id,isOwner:async()=>!!PROF&&PROF.role==="admin",
 profiles:async ids=>{const o={};if(!ids||!ids.length)return o;const {data}=await SB.from("profiles").select("id,name").in("id",ids);(data||[]).forEach(p=>o[p.id]={name:p.name});return o}};
const DLX={save:async({filename,data})=>{const u=URL.createObjectURL(data),a=document.createElement("a");a.href=u;a.download=filename;document.body.appendChild(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(u),5000)}};
window.claude={use:async n=>n==="db"?DBX:n==="user"?USERX:n==="downloads"?DLX:null};

async function loadProfs(){const {data}=await SB.from("profiles").select("id,name,email,role,active,created_at").order("created_at");PROFS=data||[];const mine=PROFS.find(p=>p.id===(ME&&ME.id));if(mine){PROF=mine;PROFS.forEach(p=>{if(p.name)names[p.id]=p.name})}if(typeof draw==="function"&&db)draw()}
const profActive=i=>{const p=PROFS.find(x=>x.id===i);return !p||p.active};
const pendingN=()=>PROFS.filter(p=>!p.active).length;

/* ===== Anmeldung ===== */
function authErr(e){const m=String(e&&(e.message||e.error_description)||e||"");
 if(/invalid login/i.test(m))return "E-Mail oder Passwort ist falsch.";
 if(/already registered|already exists/i.test(m))return "Für diese E-Mail gibt es schon ein Konto. Bitte anmelden.";
 if(/not confirmed/i.test(m))return "Bitte zuerst die E-Mail bestätigen. Der Link ist in deinem Postfach.";
 if(/at least|password should/i.test(m))return "Das Passwort muss mindestens 6 Zeichen haben.";
 if(/rate limit|too many/i.test(m))return "Zu viele Versuche. Bitte ein paar Minuten warten.";
 if(/provider is not enabled|unsupported provider/i.test(m))return "Die Google-Anmeldung ist noch nicht eingerichtet. Bitte mit E-Mail anmelden.";
 if(/valid email|invalid.*email/i.test(m))return "Bitte eine gültige E-Mail-Adresse eingeben.";
 if(/fetch|network/i.test(m))return "Keine Verbindung. Bitte Internet prüfen.";
 return "Das hat nicht geklappt: "+m}
const GSVG='<svg width="20" height="20" viewBox="0 0 48 48" aria-hidden="true"><path fill="#FFC107" d="M43.6 20.5H42V20H24v8h11.3C33.7 32.7 29.2 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.8 1.2 7.9 3.1l5.7-5.7C34 6.1 29.3 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20 20-8.9 20-20c0-1.3-.1-2.4-.4-3.5z"/><path fill="#FF3D00" d="M6.3 14.7l6.6 4.8C14.7 15.1 19 12 24 12c3.1 0 5.8 1.2 7.9 3.1l5.7-5.7C34 6.1 29.3 4 24 4 16.3 4 9.7 8.3 6.3 14.7z"/><path fill="#4CAF50" d="M24 44c5.2 0 9.9-2 13.4-5.2l-6.2-5.2C29.2 35.1 26.7 36 24 36c-5.2 0-9.6-3.3-11.3-8l-6.5 5C9.5 39.6 16.2 44 24 44z"/><path fill="#1976D2" d="M43.6 20.5H42V20H24v8h11.3c-.8 2.2-2.2 4.2-4.1 5.6l6.2 5.2C37 39.2 44 34 44 24c0-1.3-.1-2.4-.4-3.5z"/></svg>';
function authShell(title,html){$("#t").textContent=title;$("#bk").hidden=true;$("#who").textContent="";$("#app").innerHTML='<div class="authw">'+html+'</div>'}
function loginView(){authShell("Anmelden",'<div class="card"><label class="mute" for="le">E-Mail</label><input id="le" type="email" autocomplete="username" inputmode="email"><label class="mute" for="lp">Passwort</label><input id="lp" type="password" autocomplete="current-password"><button class="btn" id="lb">Anmelden</button></div><div class="authl"><button class="lnk" id="lr">Neues Konto erstellen</button><button class="lnk" id="lf">Passwort vergessen?</button></div>');
 const go=async()=>{const e=$("#le").value.trim(),p=$("#lp").value;if(!e||!p)return errBox("Bitte E-Mail und Passwort eingeben.");$("#lb").disabled=true;const {data,error}=await SB.auth.signInWithPassword({email:e,password:p});$("#lb")&&($("#lb").disabled=false);if(error)return errBox(authErr(error));ME=data.user;afterLogin()};
 $("#lb").onclick=go;$("#lp").onkeydown=e=>{if(e.key==="Enter")go()};
 $("#lr").onclick=registerView;$("#lf").onclick=forgotView}
function registerView(){authShell("Neues Konto",'<div class="card"><label class="mute" for="rn">Vor- und Nachname</label><input id="rn" autocomplete="name"><label class="mute" for="re">E-Mail</label><input id="re" type="email" autocomplete="username" inputmode="email"><label class="mute" for="rp">Passwort (mindestens 6 Zeichen)</label><input id="rp" type="password" autocomplete="new-password"><button class="btn" id="rb">Konto erstellen</button><p class="mute" style="margin:10px 0 0">Nach dem Erstellen muss der Administrator dein Konto freigeben.</p></div><div class="authl"><button class="lnk" id="rl">Zurück zur Anmeldung</button></div>');
 $("#rl").onclick=loginView;
 $("#rb").onclick=async()=>{const n=$("#rn").value.trim(),e=$("#re").value.trim(),p=$("#rp").value;if(!n)return errBox("Bitte deinen Namen eingeben.");if(!e||!p)return errBox("Bitte E-Mail und Passwort eingeben.");$("#rb").disabled=true;
  const {data,error}=await SB.auth.signUp({email:e,password:p,options:{data:{name:n},emailRedirectTo:HERE}});$("#rb")&&($("#rb").disabled=false);if(error)return errBox(authErr(error));
  if(data.session){ME=data.user;afterLogin()}else authShell("Fast geschafft",'<div class="card"><b>Bitte bestätige deine E-Mail.</b><p class="mute">Wir haben dir einen Link an '+esc(e)+' geschickt. Danach kannst du dich anmelden.</p><button class="btn" id="ok">Zur Anmeldung</button></div>'),$("#ok").onclick=loginView}}
function forgotView(){authShell("Passwort vergessen",'<div class="card"><label class="mute" for="fe">E-Mail</label><input id="fe" type="email" inputmode="email"><button class="btn" id="fb">Link zum Zurücksetzen schicken</button></div><div class="authl"><button class="lnk" id="fl">Zurück zur Anmeldung</button></div>');
 $("#fl").onclick=loginView;$("#fb").onclick=async()=>{const e=$("#fe").value.trim();if(!e)return errBox("Bitte E-Mail eingeben.");const {error}=await SB.auth.resetPasswordForEmail(e,{redirectTo:HERE});if(error)return errBox(authErr(error));toast("Link verschickt. Bitte Postfach prüfen.",1);loginView()}}
function newPwView(){authShell("Neues Passwort",'<div class="card"><label class="mute" for="np">Neues Passwort (mindestens 6 Zeichen)</label><input id="np" type="password" autocomplete="new-password"><button class="btn" id="nb">Passwort speichern</button></div>');
 $("#nb").onclick=async()=>{const {data,error}=await SB.auth.updateUser({password:$("#np").value});if(error)return errBox(authErr(error));history.replaceState(null,"",HERE);toast("Passwort gespeichert",1);ME=data.user;afterLogin()}}
function waitView(){authShell("Warte auf Freigabe",'<div class="card"><b>Dein Konto ist noch nicht freigegeben.</b><p class="mute">Sag dem Administrator Bescheid, damit er dich in den Einstellungen freigibt. Danach hier auf „Nochmal prüfen“ tippen.</p><div style="display:grid;gap:8px"><button class="btn" id="wr">Nochmal prüfen</button><button class="btn ghost" id="wo">Abmelden</button></div></div>');
 $("#wr").onclick=()=>afterLogin();$("#wo").onclick=()=>SB.auth.signOut()}
let booted=false;
async function afterLogin(){const {data,error}=await SB.from("profiles").select("*").eq("id",ME.id).maybeSingle();
 if(error){$("#app").innerHTML='<div class="card">Keine Verbindung zur Datenbank. Bitte Internet prüfen und neu laden.</div>';return}
 PROF=data;if(!PROF||!PROF.active)return waitView();
 if(PROF.name)names[ME.id]=PROF.name;if(booted)return;booted=true;await loadProfs();init();setTimeout(()=>rSyncLocal(),4000)}
async function boot(){SB.auth.onAuthStateChange(ev=>{if(ev==="SIGNED_OUT")location.replace(HERE);if(ev==="PASSWORD_RECOVERY")newPwView()});
 const {data:{session}}=await SB.auth.getSession();if(RECOVERY&&session){ME=session.user;return newPwView()}
 if(!session)return loginView();ME=session.user;afterLogin()}

/* ===== Admin: Kollegen verwalten ===== */
function userBlock(){const L=PROFS.filter(p=>p.id!==me).sort((a,b)=>(a.active-b.active)||String(a.name).localeCompare(b.name,"de"));
 $("#app").insertAdjacentHTML("beforeend",'<h3 style="margin:18px 0 4px">Benutzer</h3><p class="mute" style="margin:0 0 8px">Neue Konten müssen hier freigegeben werden. Gesperrte Benutzer kommen nicht mehr in die App.</p>'+(L.length?L.map(p=>'<div class="card ubx'+(p.active?'':' wait')+'"><div style="min-width:0"><b>'+esc(p.name||"Ohne Namen")+'</b>'+(p.role==="admin"?' <span class="tag">Admin</span>':'')+'<div class="mute" style="overflow-wrap:anywhere">'+esc(p.email||"")+'</div><div class="mute">'+(p.active?"Freigegeben":"Nicht freigegeben")+'</div></div><div class="ubt"><button class="btn s'+(p.active?' ghost':'')+'" data-ua="'+p.id+'">'+(p.active?"Sperren":"Freigeben")+'</button>'+(p.active?'<button class="btn ghost s" data-ur="'+p.id+'">'+(p.role==="admin"?"Admin entfernen":"Zum Admin machen")+'</button>':'')+'</div></div>').join(""):'<div class="card mute">Noch keine weiteren Konten. Lade Benutzer über „Benutzer einladen“ ein.</div>'));
 const set=async(p,a,r)=>{const {error}=await SB.rpc("admin_set_user",{p_id:p.id,p_active:a,p_role:r});if(error)return errBox("Ändern fehlgeschlagen: "+error.message);await loadProfs();toast("Gespeichert",1)};
 document.querySelectorAll("[data-ua]").forEach(b=>b.onclick=()=>{const p=PROFS.find(x=>x.id===b.dataset.ua);if(!p)return;if(p.active)ask((p.name||"Kollege")+" sperren?",()=>set(p,false,"user"));else set(p,true,p.role)});
 document.querySelectorAll("[data-ur]").forEach(b=>b.onclick=()=>{const p=PROFS.find(x=>x.id===b.dataset.ur);if(!p)return;const na=p.role==="admin"?"user":"admin";ask(na==="admin"?(p.name||"Kollege")+" zum Administrator machen? Er kann dann alles verwalten.":"Admin-Rechte von "+(p.name||"Kollege")+" entfernen?",()=>set(p,true,na))})}

/* ===== Aufkleber-Foto mit Texterkennung am Gerät ===== */
function loadScript(src){return new Promise((ok,no)=>{if(document.querySelector('script[src="'+src+'"]'))return ok();const s=document.createElement("script");s.src=src;s.onload=ok;s.onerror=no;document.head.appendChild(s)})}
function parseLabel(t){const L=String(t).split(/\n/).map(x=>x.replace(/[|\[\]{}]/g," ").replace(/\s+/g," ").trim()).filter(Boolean),NR=/(\d{5,9})\s?[-–—]\s?(\d{1,3})(?!\d)/;let on="",ni=-1,pi=-1;
 for(let i=0;i<L.length;i++){if(/telefon|tel\.|\+43|fax|stra(ss|ß|b)e/i.test(L[i]))continue;const m=L[i].match(NR);if(m){on=m[1]+"-"+m[2];ni=i;break}}
 if(!on)for(let i=0;i<L.length;i++){const m=L[i].match(/auftrags?\s*[-.]?\s*(?:nr|nummer|no)\.?\s*[:.\-]?\s*(.*)$/i);if(m){on=((m[1]||"").trim()||(L[i+1]||"")).replace(/[^A-Za-z0-9\-\/]/g,"");ni=i;break}}
 for(let i=0;i<L.length;i++)if(/^(projekt|veranstaltung)\b/i.test(L[i])){pi=i;break}
 const st=pi>=0?pi:ni,parts=[];
 if(st>=0)for(let i=st;i<L.length;i++){let l=L[i];if(i===st&&pi<0)continue;if(i>st&&/^(auftrag|gewicht)/i.test(l))break;
  l=l.replace(/^(projekt|veranstaltung)\s*[:.]?\s*/i,"").replace(/gewicht\s*:?/ig,"").replace(/\bkg\b/ig,"").trim();
  if(!parts.length&&NR.test(l))continue;if((l.match(/[A-Za-zÄÖÜäöüß]/g)||[]).length<2)continue;parts.push(l)}
 const ev=parts.slice(0,4).reduce((a,p)=>a?(/-$/.test(a)?a+p:a+" "+p):p,"");
 return{ev,on}}

/* Liest Auftragsnummer und Veranstaltung über Zeilengröße und Erkennungssicherheit */
function parseLabelData(d){const NR=/(\d{5,9})\s?[-–—]\s?(\d{1,3})(?!\d)/,fb=parseLabel(d.text||"");
 const wh=w=>w.bbox.y1-w.bbox.y0,lines=(d.lines||[]).map(l=>{const ws=(l.words||[]).filter(w=>w.confidence>=15&&/[A-Za-zÄÖÜäöüß0-9]/.test(w.text));return{ws,t:ws.map(w=>w.text).join(" ").trim(),y0:l.bbox.y0,y1:l.bbox.y1,h:Math.max(0,...ws.map(wh)),raw:l.text||""}}).filter(l=>l.t);
 const nl=lines.find(l=>NR.test(l.t)&&!/telefon|tel\.|\+43|fax/i.test(l.raw));if(!nl)return fb;
 const m=nl.t.match(NR),on=m[1]+"-"+m[2];
 const parts=lines.filter(l=>l.y0>nl.y0+nl.h*.5).map(l=>l.ws.filter(w=>wh(w)>=nl.h*.55&&w.confidence>=20).map(w=>w.text).join(" ")).map(t=>t.replace(/^(projekt|veranstaltung)\s*[:.]?\s*/i,"").replace(/gewicht\s*:?/ig,"").replace(/\bkg\b/ig,"").replace(/[^A-Za-zÄÖÜäöüß0-9&.,'\/\- ]/g,"").replace(/\s+/g," ").trim()).filter(t=>(t.match(/[A-Za-zÄÖÜäöüß]/g)||[]).length>=2||(t.match(/\d/g)||[]).length>=2).slice(0,4).map(t=>t.charAt(0).toUpperCase()+t.slice(1));
 const ev=parts.reduce((a,p)=>a?(/-$/.test(a)?a+p:a+" "+p):p,"");
 return{on,ev}}

/* Bild für die Texterkennung vorbereiten: verkleinern, grau, Kontrast strecken */
function ocrPrep(file,W){return new Promise((ok,no)=>{const u=URL.createObjectURL(file),im=new Image();im.onload=()=>{const k=Math.min(1,W/Math.max(im.width,im.height)),c=document.createElement("canvas");c.width=Math.round(im.width*k);c.height=Math.round(im.height*k);const g=c.getContext("2d",{willReadFrequently:true});g.drawImage(im,0,0,c.width,c.height);URL.revokeObjectURL(u);
 const d=g.getImageData(0,0,c.width,c.height),a=d.data,n=a.length/4,H=new Uint32Array(256),Y=new Uint8Array(n);for(let i=0;i<n;i++){const y=(a[i*4]*299+a[i*4+1]*587+a[i*4+2]*114)/1000|0;Y[i]=y;H[y]++}
 let lo=0,hi=255,acc=0;const cut=n*.02;while(lo<255&&(acc+=H[lo])<cut)lo++;acc=0;while(hi>0&&(acc+=H[hi])<cut)hi--;const sp=Math.max(1,hi-lo);
 for(let i=0;i<n;i++){const v=Math.max(0,Math.min(255,(Y[i]-lo)*255/sp));a[i*4]=a[i*4+1]=a[i*4+2]=v}g.putImageData(d,0,0);c.toBlob(b=>b?ok(b):no(new Error("img")),"image/jpeg",.9)};im.onerror=()=>{URL.revokeObjectURL(u);no(new Error("img"))};im.src=u})}
let TW=null;
const ocrScore=r=>(r.on?10:0)+(r.ev.match(/[A-Za-zÄÖÜäöüß]/g)||[]).length-(/-$/.test(r.ev)?6:0);
const LNR=/(\d{5,9})\s?[-–—]\s?(\d{1,3})(?!\d)/;
const ocrLines=d=>(d.lines||[]).map(l=>({t:l.text.trim(),y0:l.bbox.y0,y1:l.bbox.y1,w:(l.words||[]).map(w=>[w.text,Math.round(w.confidence),w.bbox.y1-w.bbox.y0])}));
async function ocrRun(blob,psm){await TW.setParameters({tessedit_pageseg_mode:psm});return(await TW.recognize(blob)).data}
async function readLabel(file,opt){await loadScript("https://cdn.jsdelivr.net/npm/tesseract.js@5.1.1/dist/tesseract.min.js");if(!TW)TW=await Tesseract.createWorker("deu");
 const base=await ocrPrep(file,1000),log=[];let d=null,nl=null,blob=base;
 for(const rot of [0,90,270,180]){const b=rot?await rotBlob(base,rot):base;
  for(const psm of rot?["3"]:["3","11"]){const r=await ocrRun(b,psm);log.push({step:"voll",rot,psm,lines:ocrLines(r)});nl=(r.lines||[]).find(l=>LNR.test(l.text)&&!/telefon|tel\.|\+43|fax/i.test(l.text)&&(l.words||[]).some(w=>LNR.test(w.text)||/\d{5}/.test(w.text))&&(l.words||[]).filter(w=>/\d{3}/.test(w.text)).every(w=>(w.bbox.x1-w.bbox.x0)>(w.bbox.y1-w.bbox.y0)*1.8));if(nl){d=r;blob=b;break}}
  if(nl)break}
 let best;
 if(!nl){best={on:"",ev:""};for(const W of [700,1300]){const r=await ocrRun(await ocrPrep(file,W),"3"),x=parseLabelData(r);log.push({step:"groesse",W,lines:ocrLines(r),r:x});if(ocrScore(x)>ocrScore(best))best=x}}
 else{const m=nl.text.match(LNR),on=m[1]+"-"+m[2],nh=Math.max(10,...(nl.words||[]).filter(w=>/\d/.test(w.text)).map(w=>w.bbox.y1-w.bbox.y0));
  if(opt&&opt.onlyNr){ocrSaveLog(log,{on,ev:""},blob);return{on,ev:""}}
  const im=await createImageBitmap(blob),y0=Math.min(im.height-1,Math.round(nl.bbox.y1+nh*.25)),y1=Math.min(im.height,Math.round(nl.bbox.y1+nh*12));
  const c=document.createElement("canvas");c.width=im.width;c.height=Math.max(1,y1-y0);c.getContext("2d").drawImage(im,0,y0,c.width,c.height,0,0,c.width,c.height);
  const cb=await new Promise(r=>c.toBlob(r,"image/jpeg",.92));let ev="";
  for(const psm of ["4","6"]){const r=await ocrRun(cb,psm);
   const parts=(r.lines||[]).map(l=>(l.words||[]).filter(w=>w.confidence>=20&&/[A-Za-zÄÖÜäöüß0-9]/.test(w.text)&&(w.bbox.y1-w.bbox.y0)>=nh*.55).map(w=>w.text).join(" ").replace(/gewicht\s*:?/ig,"").replace(/\bkg\b/ig,"").replace(/[^A-Za-zÄÖÜäöüß0-9&.,'\/\- ]/g,"").replace(/\s+/g," ").trim())
    .filter(t=>t&&!/^proje/i.test(t)&&((t.match(/[A-Za-zÄÖÜäöüß]/g)||[]).length>=2||(t.match(/\d/g)||[]).length>=2)).slice(0,4).map(t=>t.charAt(0).toUpperCase()+t.slice(1));
   ev=parts.reduce((a,p)=>a?(/-$/.test(a)?a+p:a+" "+p):p,"");log.push({step:"ausschnitt",psm,lines:ocrLines(r),ev});if(ev&&!/-$/.test(ev))break}
  if(!ev)ev=parseLabelData(d).ev;best={on,ev}}
 ocrSaveLog(log,best,blob);return best}
async function ocrSaveLog(log,best,blob){try{const id="o"+Date.now().toString(36),img=await new Promise(r=>{const f=new FileReader();f.onload=()=>r(f.result);f.readAsDataURL(blob)});
 await db.doc("ocrlog/"+id).set({t:Date.now(),by:me,ua:navigator.userAgent.slice(0,120),best,log});await db.doc("ocrimg/"+id).set({d:img})}catch(e){console.warn(e)}}

function rotBlob(blob,deg){return new Promise(async(ok,no)=>{try{const im=await createImageBitmap(blob),q=deg%180!==0,c=document.createElement("canvas");c.width=q?im.height:im.width;c.height=q?im.width:im.height;const g=c.getContext("2d");g.translate(c.width/2,c.height/2);g.rotate(deg*Math.PI/180);g.drawImage(im,-im.width/2,-im.height/2);c.toBlob(b=>b?ok(b):no(new Error("rot")),"image/jpeg",.92)}catch(e){no(e)}})}
/* Eigene Kamera für Etiketten: hintere Kamera, Rahmen, nur der Rahmenbereich wird verwendet */
async function labelCam(){if(!navigator.mediaDevices||!navigator.mediaDevices.getUserMedia)return undefined;let st;
 try{st=await navigator.mediaDevices.getUserMedia({audio:false,video:{facingMode:{ideal:"environment"},width:{ideal:1920},height:{ideal:1440}}})}catch(e){return undefined}
 const o=document.createElement("div");o.className="lcam";o.innerHTML='<video playsinline muted autoplay></video><div class="lframe"></div><div class="lhint">Etikett in den Rahmen halten</div><div class="lbar"><button class="lx" type="button">Abbrechen</button><button class="lshot" type="button" aria-label="Foto aufnehmen"></button><button class="lg" type="button">Galerie</button></div>';
 document.body.appendChild(o);const v=o.querySelector("video");v.srcObject=st;try{await v.play()}catch(e){}const lt=document.createElement("button");lt.className="ltorch";lt.type="button";lt.hidden=true;o.appendChild(lt);torchUI(st.getVideoTracks()[0],null,lt);
 return new Promise(res=>{const end=b=>{st.getTracks().forEach(t=>t.stop());o.remove();res(b)};
  o.querySelector(".lx").onclick=()=>end(null);o.querySelector(".lg").onclick=()=>end(undefined);
  o.querySelector(".lshot").onclick=()=>{const vw=v.videoWidth,vh=v.videoHeight;if(!vw)return;const vr=v.getBoundingClientRect(),fr=o.querySelector(".lframe").getBoundingClientRect(),sc=Math.max(vr.width/vw,vr.height/vh),ox=(vr.width-vw*sc)/2,oy=(vr.height-vh*sc)/2,m=.12;
   let x0=(fr.left-vr.left-ox)/sc,y0=(fr.top-vr.top-oy)/sc,w=fr.width/sc,h=fr.height/sc;x0-=w*m;y0-=h*m;w*=1+2*m;h*=1+2*m;x0=Math.max(0,x0);y0=Math.max(0,y0);w=Math.min(vw-x0,w);h=Math.min(vh-y0,h);
   const c=document.createElement("canvas");c.width=Math.round(w);c.height=Math.round(h);c.getContext("2d").drawImage(v,x0,y0,w,h,0,0,c.width,c.height);o.querySelector(".lshot").disabled=true;c.toBlob(b=>end(b),"image/jpeg",.93)}})}

/* Retourschein über Etikett finden */
function rNorm(x){return String(x||"").replace(/[^0-9A-Za-z]/g,"").toUpperCase()}
function ask2(t,yl,nl,fy,fn){const o=document.createElement("div");o.className="ov";o.innerHTML='<div class="card"><p></p><div style="display:grid;gap:8px"><button class="btn" id="a2y"></button><button class="btn ghost" id="a2n"></button></div></div>';o.querySelector("p").textContent=t;o.querySelector("#a2y").textContent=yl;o.querySelector("#a2n").textContent=nl;document.body.appendChild(o);o.querySelector("#a2y").onclick=()=>{o.remove();fy()};o.querySelector("#a2n").onclick=()=>{o.remove();if(fn)fn()}}
function rScanBind(){const b=$("#rscan"),f=$("#rscanf");if(!b)return;
 const run=async file=>{b.disabled=true;toast("Etikett wird gelesen …",1);try{const r=await readLabel(file,{onlyNr:true});if(!r.on)return errBox("Keine Auftragsnummer erkannt. Bitte nochmal gerade von vorne fotografieren.");rOpenByNr(r.on)}catch(e){console.error(e);errBox("Das Etikett konnte nicht gelesen werden. Bitte nochmal versuchen.")}finally{if($("#rscan"))$("#rscan").disabled=false}};
 b.onclick=async()=>{const shot=await labelCam();if(shot===undefined)return f.click();if(shot)run(shot)};f.onchange=()=>{const x=f.files[0];f.value="";if(x)run(x)}}
function rOpenByNr(on){rf="alle";const n=rNorm(on),hit=rets.filter(r=>rNorm(r.ord)===n);
 if(hit.length===1){curRet=hit[0].id;go("retopen");toast("Retourschein "+on+" geöffnet",1);return}
 const base=on.split("-")[0];rqv=hit.length?on:base;const q=$("#rsq");if(q)q.value=rqv;if($("#rlist"))rListBody();
 if(!hit.length&&!rets.some(r=>rNorm(r.ord).startsWith(rNorm(base))))ask2("Kein Retourschein mit Auftragsnummer "+on+" gefunden.","Neuen Retourschein anlegen","Abbrechen",()=>{rqv="";rNew();rs.ord=on;retEdit()},()=>{rqv="";if($("#rsq"))$("#rsq").value="";if($("#rlist"))rListBody()})}

/* Gleiche Artikelnamen eindeutig machen: Untergruppe dazuschreiben */
function rDedupe(list){const key=a=>String(a.name).trim().toLowerCase(),cnt={};list.forEach(a=>{cnt[key(a)]=(cnt[key(a)]||0)+1});
 list.forEach(a=>{if(cnt[key(a)]<2||!a.u)return;const n=String(a.name).trim(),u=String(a.u).trim(),fw=u.split(/\s+/)[0];
  if(n.toLowerCase().startsWith(u.toLowerCase()))return;a.name=n.toLowerCase().startsWith(fw.toLowerCase()+" ")?u+" "+n.slice(fw.length+1):n+" ("+u+")"})}

/* Kachelbeschriftung: doppelte Gruppenwörter weglassen, Schrift an die Kachel anpassen */
function rShort2(a){const ws=String(a.name||"").trim().split(/\s+/),skip=new Set((String(a.g||"")+" "+String(a.u||"")).toLowerCase().split(/\s+/).filter(Boolean));let i=0;while(i<ws.length-1&&skip.has(ws[i].toLowerCase()))i++;return ws.slice(i).join(" ")}
function rFit(){requestAnimationFrame(()=>document.querySelectorAll(".rtile b").forEach(el=>{el.style.fontSize="";let fs=parseFloat(getComputedStyle(el).fontSize),n=0;const lh=1.18,max=3;
 while(n++<16&&fs>12&&(el.scrollWidth>el.clientWidth+1||el.scrollHeight>fs*lh*max+2)){fs-=1;el.style.fontSize=fs+"px"}}))}
window.addEventListener("resize",()=>{clearTimeout(window.__rf);window.__rf=setTimeout(()=>{if(document.querySelector(".rtile"))rFit()},150)});

/* Automatische Update-Prüfung: neue Version erkennen und neu laden */
let updShown=false;
async function checkUpdate(){try{const t=await fetch(HERE,{cache:"reload"}).then(r=>r.ok?r.text():"");const m=t.match(/const APPV="([^"]+)"/);if(!m||m[1]===APPV)return;
 const idle=(typeof view==="undefined"||view==="start")&&(typeof rs==="undefined"||!rs);if(idle&&!document.querySelector(".ov,.lcam,.eov")){location.reload();return}
 if(updShown)return;updShown=true;const d=document.createElement("div");d.className="updb";d.innerHTML='<span>Neue Version '+m[1].replace(/[<>&]/g,"")+' verfügbar</span><button type="button">Jetzt aktualisieren</button>';d.querySelector("button").onclick=async()=>{if(typeof rs!=="undefined"&&rs){try{await rPersist(true)}catch(e){}}location.reload()};document.body.appendChild(d)}catch(e){}}
setTimeout(checkUpdate,8000);setInterval(checkUpdate,10*60*1000);
document.addEventListener("visibilitychange",()=>{if(document.visibilityState==="visible")checkUpdate()});

/* Veranstaltung und Auftragsnummer nachträglich ändern */
function rEditHead(r){const o=document.createElement("div");o.className="ov";
 o.innerHTML='<div class="card" style="width:100%;max-width:380px;margin:0"><b>Kopfdaten ändern</b><div style="height:8px"></div><label class="mute" for="hev">Veranstaltung <span class="rq">*</span></label><input id="hev"><label class="mute" for="hord">Auftragsnummer</label><input id="hord"><div id="hwarn" class="mute" style="color:var(--bad);margin:-2px 0 8px" hidden></div><div class="row"><button class="btn ghost" id="hcn">Abbrechen</button><button class="btn" id="hsv">Speichern</button></div></div>';
 document.body.appendChild(o);const g=i=>o.querySelector("#"+i);g("hev").value=r.ev||"";g("hord").value=r.ord||"";
 const chk=()=>{const n=rNorm(g("hord").value),d=n&&rets.find(x=>x.id!==r.id&&rNorm(x.ord)===n);g("hwarn").hidden=!d;if(d)g("hwarn").textContent="Achtung: Diese Auftragsnummer hat schon der Retourschein „"+d.ev+"“."};g("hord").oninput=chk;
 g("hcn").onclick=()=>o.remove();
 g("hsv").onclick=async()=>{const ev=g("hev").value.trim(),ord=g("hord").value.trim();if(!ev){g("hev").classList.add("bad");return errBox("Bitte die Veranstaltung eingeben.")}
  if(ev===(r.ev||"")&&ord===(r.ord||""))return o.remove();g("hsv").disabled=true;
  try{await db.doc("retour/"+r.id).update({ev,ord,mod:me,modT:Date.now()});o.remove();toast("Gespeichert",1)}catch(e){g("hsv").disabled=false;errBox("Speichern fehlgeschlagen. Bitte nochmal versuchen.")}};
 setTimeout(()=>g("hev").focus(),50)}

/* Artikel händisch eintragen + fehlende Artikel aufzeichnen */
function rManBtn(){const q=(rs&&rs.q||"").trim();return '<button class="mbtn" id="rman" type="button">'+(q?'„'+esc(q)+'“ händisch eintragen':'+ Artikel nicht in der Liste? Händisch eintragen')+'</button>'}
function rManBind(){const b=$("#rman");if(b)b.onclick=()=>rManDlg((rs&&rs.q||"").trim())}
function rManDlg(pre){const o=document.createElement("div");o.className="ov";
 o.innerHTML='<div class="card" style="width:100%;max-width:380px;margin:0"><b>Artikel händisch eintragen</b><p class="mute" style="margin:4px 0 10px">Wird als „fehlender Artikel“ vorgemerkt, damit er in die Artikelliste aufgenommen werden kann.</p><label class="mute" for="mnm">Artikelname <span class="rq">*</span></label><input id="mnm" autocomplete="off"><label class="mute" for="mnr">Artikelnummer (falls bekannt)</label><input id="mnr" inputmode="numeric" autocomplete="off"><label class="mute" for="mq">Stückzahl</label><input id="mq" type="number" inputmode="numeric" min="1" value="1"><div class="row"><button class="btn ghost" id="mcn">Abbrechen</button><button class="btn" id="mok">Hinzufügen</button></div></div>';
 document.body.appendChild(o);const g=i=>o.querySelector("#"+i);g("mnm").value=pre||"";g("mcn").onclick=()=>o.remove();
 g("mok").onclick=()=>{const name=g("mnm").value.trim().replace(/\s+/g," "),nr=g("mnr").value.trim(),q=Math.max(1,parseInt(g("mq").value,10)||1);if(!name){g("mnm").classList.add("bad");return errBox("Bitte den Artikelnamen eingeben.")}
  const cat=rKat().find(a=>(nr&&rNorm(a.nr)===rNorm(nr))||String(a.name).trim().toLowerCase()===name.toLowerCase());o.remove();
  if(cat){rAdd(cat.nr,{nr:cat.nr,name:cat.name,g:cat.g,u:cat.u||""},q);rs.q="";retEdit();toast("Ist schon in der Liste: "+cat.name+" (+"+q+")",1);return}
  const key="M:"+(rNorm(nr)||rNorm(name)||Date.now());rAdd(key,{nr,name,g:"Händisch",u:"",manual:true},q);rs.q="";retEdit();toast("+"+q+" "+name+" (händisch)",1);rLogMissing(name,nr,q)};
 setTimeout(()=>(pre?g("mq"):g("mnm")).focus(),60)}
async function rLogMissing(name,nr,q){try{const id="m"+((rNorm(nr)||rNorm(name)).slice(0,80)||Date.now().toString(36)),ref=db.doc("fehlartikel/"+id),old=await ref.get(),o=old.exists?old.data():{};
 await ref.set({name,nr:nr||o.nr||"",times:(o.times||0)+1,qty:(o.qty||0)+q,first:o.first||Date.now(),last:Date.now(),ev:rs?rs.ev:"",ord:rs?rs.ord:"",by:me})}catch(e){console.warn("Fehlartikel nicht gespeichert",e)}}
async function fehlBlock(){$("#app").insertAdjacentHTML("beforeend",'<h3 style="margin:18px 0 4px">Fehlende Artikel</h3><p class="mute" style="margin:0 0 8px">Artikel, die händisch in Retourscheine eingetragen wurden, weil sie in der Artikelliste fehlen.</p><div id="fbx"><div class="card mute">Lade …</div></div>');
 const {data,error}=await SB.from("docs").select("id,data").eq("col","fehlartikel");const box=$("#fbx");if(!box)return;if(error){box.innerHTML='<div class="card mute">Konnte nicht geladen werden.</div>';return}
 const L=(data||[]).map(x=>({id:x.id,...x.data})).sort((a,b)=>b.times-a.times||b.last-a.last);
 if(!L.length){box.innerHTML='<div class="card mute">Noch keine. Sobald jemand einen Artikel händisch einträgt, erscheint er hier.</div>';return}
 box.innerHTML='<button class="btn ghost" id="fxl" style="margin-bottom:8px">Als Excel herunterladen (Vorlage-Format)</button>'+L.map(a=>'<div class="card fl"><div style="min-width:0"><b>'+esc(a.name)+'</b><div class="mute">'+(a.nr?"Nr. "+esc(a.nr)+" · ":"")+a.times+"× eingetragen, "+a.qty+" Stück</div><div class=\"mute\">Zuletzt: "+esc(a.ev||"–")+(a.ord?" ("+esc(a.ord)+")":"")+", "+fmt(a.last)+'</div></div><button class="btn ghost s" data-fdel="'+a.id+'" style="flex:none">Erledigt</button></div>').join("");
 document.querySelectorAll("[data-fdel]").forEach(b=>b.onclick=()=>ask("Als erledigt markieren und aus der Liste entfernen?",async()=>{try{await db.doc("fehlartikel/"+b.dataset.fdel).delete();b.closest(".card").remove()}catch(e){errBox("Das hat nicht geklappt.")}}));
 $("#fxl").onclick=async()=>{try{const wb=new ExcelJS.Workbook(),ws=wb.addWorksheet("Artikel");ws.columns=[{header:"Artikelgruppe",width:18},{header:"Untergruppe",width:16},{header:"Artikelnummer",width:15},{header:"Artikelname",width:40},{header:"Mit ID",width:9},{header:"A – oft",width:9},{header:"B – normal",width:11},{header:"C – selten",width:11},{header:"Wie oft eingetragen",width:20},{header:"Zuletzt bei",width:34}];
  ws.getRow(1).eachCell(c=>{c.font={bold:true,color:{argb:"FFFFFFFF"}};c.fill={type:"pattern",pattern:"solid",fgColor:{argb:"FF1F2A44"}}});
  L.forEach(a=>ws.addRow(["","",a.nr||"",a.name,"","","","",a.times,(a.ev||"")+(a.ord?" ("+a.ord+")":"")]));
  const buf=await wb.xlsx.writeBuffer();await DLX.save({filename:"Fehlende_Artikel_"+new Date().toISOString().slice(0,10)+".xlsx",data:new Blob([buf],{type:"application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"})})}catch(e){errBox("Excel konnte nicht erstellt werden.")}}}

/* Betreff und Text für den Mailversand */
function rMailSubj(r){return "Retourschein "+r.ev+(r.ord?" – Auftragsnummer "+r.ord:"")}
function rMailBody(r){const it=rIt(r),n=Object.keys(it).length,st=r.closed?"Abgeschlossen":"In Bearbeitung";
 return "Hallo,\n\nanbei der Retourschein für folgende Veranstaltung:\n\nVeranstaltung: "+r.ev+"\nAuftragsnummer: "+(r.ord||"–")+"\nStatus: "+st+"\nPositionen: "+n+" ("+rTot(it)+" Stück)"+(r.rem?"\nBemerkungen: "+r.rem:"")+"\n\nDie vollständige Liste ist als Excel-Datei im Anhang.\n\nLiebe Grüße\n"+(names[me]||"")}

/* Versand per Mail vermerken */
const RTO="tpc_mail_empf";
function rRecent(){let a=[];try{a=JSON.parse(localStorage.getItem(RTO)||"[]")}catch(e){}rets.forEach(r=>(r.sent||[]).forEach(x=>{if(x.to)a.push(x.to)}));return [...new Set(a.map(x=>String(x).trim()).filter(Boolean))].slice(0,30)}
function rMailAsk(r){const o=document.createElement("div");o.className="ov";const rec=rRecent();
 o.innerHTML='<div class="card" style="width:100%;max-width:380px;margin:0"><b>Per Mail senden</b><p class="mute" style="margin:4px 0 10px">An wen geht der Retourschein? Wird in der Übersicht vermerkt. Die Adresse gibst du danach im Mailprogramm ein.</p><label class="mute" for="mto">Empfänger (Name oder E-Mail, optional)</label><input id="mto" list="mtol" autocomplete="off"><datalist id="mtol">'+rec.map(x=>'<option value="'+esc(x)+'">').join("")+'</datalist><div class="row"><button class="btn ghost" id="mtc">Abbrechen</button><button class="btn" id="mtg">Weiter zum Mailprogramm</button></div></div>';
 document.body.appendChild(o);o.querySelector("#mto").value=(r.sent&&r.sent.length&&r.sent[r.sent.length-1].to)||"";o.querySelector("#mtc").onclick=()=>o.remove();
 o.querySelector("#mtg").onclick=()=>{const to=o.querySelector("#mto").value.trim();o.remove();if(to){try{const a=JSON.parse(localStorage.getItem(RTO)||"[]").filter(x=>x!==to);a.unshift(to);localStorage.setItem(RTO,JSON.stringify(a.slice(0,30)))}catch(e){}}retXl(r,{to})}}
async function rMarkSent(r,to){try{const cur=(rets.find(x=>x.id===r.id)||r).sent||[];await db.doc("retour/"+r.id).update({sent:cur.concat([{t:Date.now(),by:me,to:to||""}])});toast("Als per Mail gesendet vermerkt",1)}catch(e){console.warn(e)}}
function rSentLine(r){const s=r.sent||[];if(!s.length)return "";const x=s[s.length-1];return '<div class="msent">✉ Per Mail gesendet'+(x.to?' an '+esc(x.to):'')+' · '+fmt(x.t)+(s.length>1?' ('+s.length+'×)':'')+'</div>'}
function rSentAll(r){const s=r.sent||[];if(!s.length)return "";return s.slice().reverse().map(x=>'<div class="msent">✉ Per Mail gesendet'+(x.to?' an '+esc(x.to):'')+' · '+esc(nm(x.by))+', '+fmt(x.t)+'</div>').join("")}

/* Signalton beim Scannen und Artikelname im grünen Feld */
let ACX=null;
function audioUnlock(){try{if(!ACX){const C=window.AudioContext||window.webkitAudioContext;if(C)ACX=new C()}if(ACX&&ACX.state==="suspended")ACX.resume();if(ACX){const o=ACX.createOscillator(),g=ACX.createGain();g.gain.value=0;o.connect(g).connect(ACX.destination);o.start();o.stop(ACX.currentTime+.01)}}catch(e){}}
function beep(ok){try{if(navigator.vibrate&&pref("vib"))navigator.vibrate(ok?60:[120,80,120]);if(!ACX||!pref("snd"))return;if(ACX.state==="suspended")ACX.resume();const t=ACX.currentTime,tones=ok?[[1320,0,.12]]:[[330,0,.18],[220,.22,.28]];
 tones.forEach(([f,s,d])=>{const o=ACX.createOscillator(),g=ACX.createGain();o.type=ok?"sine":"square";o.frequency.value=f;g.gain.setValueAtTime(0,t+s);g.gain.linearRampToValueAtTime(ok?.35:.18,t+s+.01);g.gain.setValueAtTime(ok?.35:.18,t+s+d-.03);g.gain.linearRampToValueAtTime(0,t+s+d);o.connect(g).connect(ACX.destination);o.start(t+s);o.stop(t+s+d+.02)})}catch(e){}}
function artName(code){const nr=String(code||"").split(/-+/)[0].trim().toUpperCase();if(!nr)return "";const a=(typeof art!=="undefined"&&art[nr])||null;if(a&&a.name)return a.name;const k=rKat().find(x=>rNorm(x.nr)===rNorm(nr));return k?k.name:"Unbekannter Artikel"}

/* Bildschirm anlassen, solange die App offen ist */
let WL=null;
async function keepAwake(){try{if(!pref("wake")||!("wakeLock" in navigator)||document.visibilityState!=="visible"||(WL&&!WL.released))return;WL=await navigator.wakeLock.request("screen");WL.addEventListener("release",()=>{WL=null})}catch(e){}}
document.addEventListener("visibilitychange",()=>{if(document.visibilityState==="visible")keepAwake()});
["pointerdown","keydown"].forEach(ev=>document.addEventListener(ev,keepAwake,{passive:true}));setTimeout(keepAwake,0);

/* Geräte-Einstellungen (pro Gerät gespeichert) */
const PREF_DEF={snd:true,vib:true,wake:true};
function pref(k){try{const v=localStorage.getItem("tpc_pref_"+k);return v===null?PREF_DEF[k]:v==="1"}catch(e){return PREF_DEF[k]}}
function prefSet(k,v){try{localStorage.setItem("tpc_pref_"+k,v?"1":"0")}catch(e){}}
function prefRow(k,t,sub){return '<div class="card pref"><div><b>'+t+'</b><span class="mute">'+sub+'</span></div><button class="sw2" role="switch" aria-label="'+t+'" aria-checked="'+pref(k)+'" data-pref="'+k+'"></button></div>'}
function prefBind(){document.querySelectorAll("[data-pref]").forEach(b=>b.onclick=()=>{const k=b.dataset.pref,v=!pref(k);prefSet(k,v);b.setAttribute("aria-checked",v);if(k==="wake"){if(v)keepAwake();else if(WL){WL.release();WL=null}}})}

/* Artikelliste nach Gruppen (Verwaltung) */
let alq="",alOpen=new Set();const alCat=a=>Math.max(0,Math.min(2,Math.floor((+a.o||0)/100000)));const alRow=a=>(+a.o||0)%100000;
function artList2(){$("#t").textContent="Artikelliste";
 $("#app").innerHTML='<div class="srow"><input id="alq" type="search" placeholder="Suchen (Name, Nummer, Gruppe)" autocomplete="off" value="'+esc(alq)+'"><button class="btn scb" id="aladd" aria-label="Artikel hinzufügen" style="font-size:22px;font-weight:800">+</button></div><div id="albody"></div>';
 $("#alq").oninput=e=>{alq=e.target.value;alBody()};$("#aladd").onclick=()=>alEdit(null);alBody()}
function alBody(){const box=$("#albody");if(!box)return;const q=alq.trim().toLowerCase();
 if(!rkat.length){box.innerHTML='<div class="card mute">Noch keine Artikelliste importiert. Bitte unter App-Verwaltung → „Artikelliste importieren“ die Excel-Datei hochladen.</div>';return}
 const L=rkat.filter(a=>!q||[a.name,a.nr,a.g,a.u].join(" ").toLowerCase().includes(q)).slice().sort((a,b)=>alRow(a)-alRow(b)||String(a.name).localeCompare(b.name,"de",{numeric:true}));
 const scanOnly=Object.keys(art||{}).filter(k=>!rkat.some(a=>rNorm(a.nr)===rNorm(k))).filter(k=>!q||(k+" "+art[k].name).toLowerCase().includes(q));
 const groups=[];L.forEach(a=>{let g=groups.find(x=>x.g===a.g);if(!g)groups.push(g={g:a.g,subs:[]});let u=g.subs.find(x=>x.u===(a.u||""));if(!u)g.subs.push(u={u:a.u||"",items:[]});u.items.push(a)});
 const row=a=>'<button class="alrow" data-ak="'+esc(a._k)+'"><span class="nr">'+esc(a.nr&&!/^X\d+_*$/.test(a.nr)?a.nr:"–")+'</span><span class="nm">'+esc(a.name)+'</span><span class="tg">'+(a.id?'<span>ID</span>':'')+(a.zub?'<span>Zub.</span>':'')+'<span class="'+["ca","","cc"][alCat(a)]+'">'+"ABC"[alCat(a)]+'</span></span></button>';
 box.innerHTML='<p class="mute" style="margin:4px 2px">'+L.length+' Artikel in '+groups.length+' Gruppen'+(q?' (gefiltert)':'')+'</p>'+groups.map(g=>'<details class="algrp" data-dg="'+esc(g.g)+'"'+(q||alOpen.has(g.g)?' open':'')+'><summary><span>'+esc(g.g)+'</span><span style="font-weight:600;opacity:.85;margin-left:auto;margin-right:10px">'+g.subs.reduce((n,u)=>n+u.items.length,0)+'</span></summary>'+g.subs.map(u=>(u.u?'<div class="alsub"><span>'+esc(u.u)+'</span><span>'+u.items.length+'</span></div>':'')+u.items.map(row).join("")).join("")+'</details>').join("")+
  (scanOnly.length?'<details class="algrp"'+(q?' open':'')+'><summary><span>Nur für den Scan (ohne Gruppe)</span><span style="font-weight:600;opacity:.85;margin-left:auto;margin-right:10px">'+scanOnly.length+'</span></summary>'+scanOnly.map(k=>'<div class="alrow" style="cursor:default"><span class="nr">'+esc(k)+'</span><span class="nm">'+esc(art[k].name)+'</span><button class="btn ghost s" data-sdel="'+esc(k)+'" style="width:auto">Löschen</button></div>').join("")+'</details>':'');
 box.querySelectorAll("[data-ak]").forEach(b=>b.onclick=()=>alEdit(rkat.find(a=>a._k===b.dataset.ak)));
 box.querySelectorAll("[data-dg]").forEach(d=>d.addEventListener("toggle",()=>{if(!q){d.open?alOpen.add(d.dataset.dg):alOpen.delete(d.dataset.dg)}}));
 box.querySelectorAll("[data-sdel]").forEach(b=>b.onclick=()=>ask("Artikel "+b.dataset.sdel+" löschen?",async()=>{try{await db.doc("artikel/"+b.dataset.sdel).delete();alBody()}catch(e){errBox("Löschen fehlgeschlagen.")}}))}
function alEdit(a){const isNew=!a;a=a||{g:"",u:"",nr:"",name:"",id:false,zub:false,o:100000+99999};const o=document.createElement("div");o.className="ov";
 const gs=[...new Set(rkat.map(x=>x.g))],us=[...new Set(rkat.map(x=>x.u).filter(Boolean))],realNr=a.nr&&!/^X\d+_*$/.test(a.nr)?a.nr:"";
 o.innerHTML='<div class="card" style="width:100%;max-width:420px;margin:0;max-height:90vh;overflow:auto"><b>'+(isNew?"Artikel hinzufügen":"Artikel bearbeiten")+'</b><div style="height:8px"></div><label class="mute" for="eg">Hauptgruppe <span class="rq">*</span></label><input id="eg" list="egl"><datalist id="egl">'+gs.map(x=>'<option value="'+esc(x)+'">').join("")+'</datalist><label class="mute" for="eu">Untergruppe</label><input id="eu" list="eul"><datalist id="eul">'+us.map(x=>'<option value="'+esc(x)+'">').join("")+'</datalist><label class="mute" for="enr">Artikelnummer</label><input id="enr" inputmode="numeric"><label class="mute" for="enm">Artikelname <span class="rq">*</span></label><input id="enm"><label class="zchk"><input type="checkbox" id="eid">Mit ID</label><label class="zchk"><input type="checkbox" id="ezb">Mit Zubehör</label><label class="mute">Häufigkeit</label><div class="row seg" style="margin:4px 0 12px"><button data-c="0">A – oft</button><button data-c="1">B – normal</button><button data-c="2">C – selten</button></div><div class="row"><button class="btn ghost" id="ecn">Abbrechen</button><button class="btn" id="esv">Speichern</button></div>'+(isNew?'':'<button class="btn ghost" id="edl" style="margin-top:8px;color:var(--bad)">Artikel löschen</button>')+'</div>';
 document.body.appendChild(o);const g=i=>o.querySelector("#"+i);g("eg").value=a.g;g("eu").value=a.u||"";g("enr").value=realNr;g("enm").value=a.name;g("eid").checked=!!a.id;g("ezb").checked=!!a.zub;
 let cat=alCat(a);const seg=()=>o.querySelectorAll("[data-c]").forEach(b=>b.classList.toggle("on",+b.dataset.c===cat));seg();o.querySelectorAll("[data-c]").forEach(b=>b.onclick=()=>{cat=+b.dataset.c;seg()});
 g("ecn").onclick=()=>o.remove();
 g("esv").onclick=async()=>{const G=g("eg").value.trim(),U=g("eu").value.trim(),NR=g("enr").value.trim().toUpperCase(),NM=g("enm").value.trim();if(!G||!NM)return errBox("Bitte Hauptgruppe und Artikelname eingeben.");
  const dup=NR&&rkat.find(x=>x._k!==a._k&&rNorm(x.nr)===rNorm(NR));if(dup)return errBox("Die Artikelnummer "+NR+" hat schon „"+dup.name+"“.");
  const row=alRow(a)||99999,k=a._k||(NR?NR.replace(/[^A-Z0-9-]/g,""):"")||("X"+Date.now().toString(36)),doc={nr:NR||k,hasNr:!!NR,g:G,u:U,name:NM,id:g("eid").checked,zub:g("ezb").checked,o:cat*100000+row};
  try{await db.doc("rkat/"+k).set(doc);let c=NR;if(/^\d{1,3}$/.test(c))c=c.padStart(4,"0");if(c&&/^[A-Z0-9]{3,10}$/.test(c))await db.doc("artikel/"+c).set({name:NM});const old=realNr.toUpperCase();if(old&&old!==NR&&/^[A-Z0-9]{3,10}$/.test(old))await db.doc("artikel/"+old).delete();o.remove();toast("Gespeichert",1);alBody()}catch(e){errBox("Speichern fehlgeschlagen. Bitte nochmal versuchen.")}};
 if(g("edl"))g("edl").onclick=()=>ask("Artikel „"+a.name+"“ wirklich löschen?",async()=>{try{await db.doc("rkat/"+a._k).delete();if(realNr&&/^[A-Z0-9]{3,10}$/.test(realNr.toUpperCase()))await db.doc("artikel/"+realNr.toUpperCase()).delete();o.remove();toast("Gelöscht",1);alBody()}catch(e){errBox("Löschen fehlgeschlagen.")}})}

/* Kollegen einladen (WhatsApp / Mail / Teilen) */
function invText(){return "Hallo!\n\nDu bist zur TPC Lager App eingeladen.\n\nSo geht's:\n1. Diesen Link öffnen: "+HERE+"\n2. „Neues Konto erstellen“ antippen und Name, E-Mail und Passwort eingeben.\n3. Kurz warten, bis dein Konto freigegeben ist. Dann einfach anmelden.\n\nApp auf den Homebildschirm legen:\n• iPhone: Link in Safari öffnen → unten auf das Teilen-Symbol (Quadrat mit Pfeil nach oben) → „Zum Home-Bildschirm“ → „Hinzufügen“.\n• Android: Link in Chrome öffnen → oben rechts auf ⋮ → „App installieren“ bzw. „Zum Startbildschirm hinzufügen“.\n\nDanach startest du die App einfach über das Symbol „TPC Lager“.\n\nLiebe Grüße\ndas Lager Team"}
function invDlg(){const t=invText(),o=document.createElement("div");o.className="ov";
 o.innerHTML='<div class="card" style="width:100%;max-width:440px;margin:0;max-height:90vh;overflow:auto"><b>Benutzer einladen</b><p class="mute" style="margin:4px 0 8px">Diese Nachricht wird verschickt. Du kannst sie vorher noch anpassen.</p><textarea id="ivt" style="min-height:220px;font-size:14px"></textarea><div style="display:grid;gap:8px"><a class="btn" id="ivw" target="_blank" rel="noopener" style="background:#1fa855;text-align:center;text-decoration:none">Per WhatsApp senden</a><a class="btn" id="ivm" style="text-align:center;text-decoration:none">Per Mail senden</a><button class="btn grey" id="ivs" hidden>Anders teilen …</button><button class="btn ghost" id="ivc">Text kopieren</button><button class="btn ghost" id="ivx">Schließen</button></div></div>';
 document.body.appendChild(o);const g=i=>o.querySelector("#"+i),ta=g("ivt");ta.value=t;
 const upd=()=>{const v=ta.value;g("ivw").href="https://wa.me/?text="+encodeURIComponent(v);g("ivm").href="mailto:?subject="+encodeURIComponent("Einladung zur TPC Lager App")+"&body="+encodeURIComponent(v)};upd();ta.oninput=upd;
 if(navigator.share){g("ivs").hidden=false;g("ivs").onclick=()=>navigator.share({title:"Einladung zur TPC Lager App",text:ta.value}).catch(()=>{})}
 g("ivc").onclick=async()=>{try{await navigator.clipboard.writeText(ta.value);toast("Text kopiert",1)}catch(e){ta.select();toast("Text markiert – jetzt kopieren",1)}};g("ivx").onclick=()=>o.remove()}

/* Fotos im Retourschein */
const RPH={};
async function rPhoto(id){if(RPH[id])return RPH[id];try{const d=await db.doc("fotos/"+id).get();if(d.exists){RPH[id]=d.data().d;return RPH[id]}}catch(e){}return null}
function rPhotoBlock(r){const f=r.fotos||[];return '<div class="card"><div class="fl"><b>Fotos'+(f.length?' ('+f.length+')':'')+'</b>'+(r.closed?'':'<button class="btn ghost s" id="rphadd" style="width:auto">+ Foto hinzufügen</button>')+'</div><input type="file" id="rphf" accept="image/*" multiple hidden>'+(f.length?'<div class="rph">'+f.map(id=>'<div class="thw"><img data-ph="'+esc(id)+'" alt="Foto">'+(r.closed?'':'<button class="thx" data-phx="'+esc(id)+'" aria-label="Foto löschen">✕</button>')+'</div>').join("")+'</div>':'<p class="mute" style="margin:6px 0 0">Noch keine Fotos. Fotos werden in der Excel-Datei unten angehängt und mitgeschickt.</p>')+'</div>'}
function rPhotoBind(r){document.querySelectorAll("[data-ph]").forEach(async im=>{const u=await rPhoto(im.dataset.ph);if(u)im.src=u;im.onclick=()=>{if(!im.src)return;const v=document.createElement("div");v.className="phv";v.innerHTML='<img alt="Foto">';v.querySelector("img").src=im.src;v.onclick=()=>v.remove();document.body.appendChild(v)}});
 const b=$("#rphadd"),f=$("#rphf");if(b){b.onclick=()=>f.click();f.onchange=async()=>{const files=[...f.files];f.value="";if(!files.length)return;b.disabled=true;b.textContent="Wird hochgeladen …";const ids=[];
  try{for(const file of files){const d=await shrink(file),id="r-"+r.id+"-"+Date.now().toString(36)+Math.random().toString(36).slice(2,5);await db.doc("fotos/"+id).set({d});RPH[id]=d;ids.push(id)}
   const cur=(rets.find(x=>x.id===r.id)||r).fotos||[];await db.doc("retour/"+r.id).update({fotos:cur.concat(ids),mod:me,modT:Date.now()});toast(ids.length===1?"Foto gespeichert":ids.length+" Fotos gespeichert",1)}
  catch(e){console.error(e);errBox("Foto konnte nicht gespeichert werden. Bitte nochmal versuchen.");if(ids.length){try{const cur=(rets.find(x=>x.id===r.id)||r).fotos||[];await db.doc("retour/"+r.id).update({fotos:cur.concat(ids)})}catch(x){}}}}}
 document.querySelectorAll("[data-phx]").forEach(x=>x.onclick=()=>ask("Foto löschen?",async()=>{const id=x.dataset.phx;try{const cur=((rets.find(y=>y.id===r.id)||r).fotos||[]).filter(y=>y!==id);await db.doc("retour/"+r.id).update({fotos:cur,mod:me,modT:Date.now()});await db.doc("fotos/"+id).delete().catch(()=>{});toast("Foto gelöscht",1)}catch(e){errBox("Löschen fehlgeschlagen.")}}))}
async function rXlPhotos(wb,r,ws,last){const f=r.fotos||[];if(!f.length||!ws)return;let row=(last||ws.rowCount)+3;
 const t=ws.getCell("A"+row);t.value="Fotos ("+f.length+")";t.font={bold:true,size:14,color:{argb:"FF114A97"}};row+=1;
 for(let i=0;i<f.length;i++){const u=await rPhoto(f[i]);if(!u)continue;const im=new Image();im.src=u;try{await im.decode()}catch(e){continue}const W=520,H=Math.round(im.naturalHeight*W/im.naturalWidth);
  ws.getCell("A"+row).value="Foto "+(i+1);ws.getCell("A"+row).font={bold:true};const ix=wb.addImage({base64:u,extension:"jpeg"});ws.addImage(ix,{tl:{col:0,row:row},ext:{width:W,height:H}});row+=Math.ceil(H/20)+2}}

/* Berechtigungen pro Benutzer zum Abhaken */
function permBlock(){const L=PROFS.filter(p=>p.active&&p.id!==me).sort((a,b)=>String(a.name).localeCompare(b.name,"de"));
 $("#app").insertAdjacentHTML("beforeend",'<h3 style="margin:18px 0 4px">Berechtigungen</h3><p class="mute" style="margin:0 0 8px">Abhaken, was jeder Benutzer darf. Du als Administrator darfst immer alles.</p>'+(L.length?L.map(p=>'<div class="card"><b>'+esc(p.name||"Ohne Namen")+'</b>'+(p.role==="admin"?' <span class="tag">Admin</span>':'')+'<div class="mute" style="overflow-wrap:anywhere">'+esc(p.email||"")+'</div><div class="pmrow"><label class="zchk"><input type="checkbox" data-perm="werkstatt" data-uid="'+p.id+'"'+(werk[p.id]?' checked':'')+'><span>Werkstatt<small>Defekte als erledigt markieren</small></span></label><label class="zchk"><input type="checkbox" data-perm="lager" data-uid="'+p.id+'"'+(lagr[p.id]?' checked':'')+'><span>Lager<small>Retourscheine sehen und bearbeiten</small></span></label></div></div>').join(""):'<div class="card mute">Noch keine freigegebenen Benutzer.</div>'));
 document.querySelectorAll("[data-perm]").forEach(c=>c.onchange=async()=>{const col=c.dataset.perm,id=c.dataset.uid;c.disabled=true;try{if(c.checked)await db.doc(col+"/"+id).set({t:Date.now()});else await db.doc(col+"/"+id).delete();toast("Gespeichert",1)}catch(e){c.checked=!c.checked;errBox("Speichern fehlgeschlagen.")}c.disabled=false})}

/* Taschenlampe: geht beim Scannen automatisch an, per Knopf aus/an */
let TORCH=null;
function torchLbl(b,on){b.innerHTML='<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M9 18h6M10 21h4M12 3a6 6 0 0 0-4 10.5c.8.8 1 1.5 1 2.5h6c0-1 .2-1.7 1-2.5A6 6 0 0 0 12 3z"/></svg>'+(on?"Licht aus":"Licht an")}
async function torchUI(track,before,btn){try{if(!track)return;await new Promise(r=>setTimeout(r,250));const cp=track.getCapabilities?track.getCapabilities():{};if(!cp||!cp.torch)return;
 let on=true;try{await track.applyConstraints({advanced:[{torch:true}]})}catch(e){on=false}
 if(!btn){btn=document.createElement("button");btn.className="btn ghost torchb";btn.id="torchb";btn.type="button";btn.style.cssText="margin-top:6px;color:#fff;border-color:#888";if(before&&before.parentNode)before.parentNode.insertBefore(btn,before);TORCH=btn}
 btn.hidden=false;torchLbl(btn,on);btn.onclick=async()=>{on=!on;try{await track.applyConstraints({advanced:[{torch:on}]})}catch(e){on=!on}torchLbl(btn,on)}}catch(e){}}
function torchRemove(){if(TORCH){TORCH.remove();TORCH=null}}
