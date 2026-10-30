const APPV="1.70";

/* ===== Verbindung zu Supabase (ersetzt die Claude-Datenbank) ===== */
const RECOVERY=/type=recovery/.test(location.hash);
const SB_URL="https://whfeipnyzffrejbakweb.supabase.co";
const SB_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndoZmVpcG55emZmcmVqYmFrd2ViIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTMxNjE3MjUsImV4cCI6MjEwODczNzcyNX0.aUo3d2SyIzFX5-a4vQa37FxaBMBI10CzFfnF9roHl0U";
const SB=supabase.createClient(SB_URL,SB_KEY,{auth:{persistSession:true,autoRefreshToken:true,detectSessionInUrl:true}});
const HERE=location.origin+location.pathname;
let ME=null,PROF=null,PROFS=[];
const LIVE=["lists","artikel","defekte","infos","werkstatt","users","lager","retour","rkat","titel","rolle"];
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
 const api={reloadAll:()=>reload(),
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
 $("#app").insertAdjacentHTML("beforeend",'<h3 style="margin:18px 0 4px">Benutzer</h3><p class="mute" style="margin:0 0 8px">Neue Konten müssen hier freigegeben werden. Gesperrte Benutzer kommen nicht mehr in die App.</p>'+(L.length?L.map(p=>'<div class="card ubx'+(p.active?'':' wait')+'"><div style="min-width:0"><b>'+esc(p.name||"Ohne Namen")+'</b>'+(p.role==="admin"?' <span class="tag">Admin</span>':'')+'<div class="mute" style="overflow-wrap:anywhere">'+esc(p.email||"")+'</div><div class="mute">'+(p.active?"Freigegeben":"Nicht freigegeben")+'</div></div><div class="ubt">'+(owner||p.role!=="admin"?'<button class="btn s'+(p.active?' ghost':'')+'" data-ua="'+p.id+'">'+(p.active?"Sperren":"Freigeben")+'</button>':'')+(owner&&p.active?'<button class="btn ghost s" data-ur="'+p.id+'">'+(p.role==="admin"?"Admin entfernen":"Zum Admin machen")+'</button>':'')+'</div></div>').join(""):'<div class="card mute">Noch keine weiteren Konten. Lade Benutzer über „Benutzer einladen“ ein.</div>'));
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

/* Artikel manuell eintragen + fehlende Artikel aufzeichnen */
function rManBtn(){const q=(rs&&rs.q||"").trim();return rScanBtn()+'<button class="mbtn" id="rman" type="button">'+(q?'„'+esc(q)+'“ manuell eintragen':'+ Artikel nicht in der Liste? Manuell eintragen')+'</button>'}
function rManBind(){const b=$("#rman");if(b)b.onclick=()=>rManDlg((rs&&rs.q||"").trim());const c=$("#rscanb");if(c)c.onclick=()=>rScanCam()}
function rManDlg(pre,pnr){const o=document.createElement("div");o.className="ov";
 o.innerHTML='<div class="card" style="width:100%;max-width:380px;margin:0"><b>Artikel manuell eintragen</b><p class="mute" style="margin:4px 0 10px">Wird als „fehlender Artikel“ vorgemerkt, damit er in die Artikelliste aufgenommen werden kann.</p><label class="mute" for="mnm">Artikelname <span class="rq">*</span></label><input id="mnm" autocomplete="off"><label class="mute" for="mnr">Artikelnummer (falls bekannt)</label><input id="mnr" inputmode="numeric" autocomplete="off"><label class="mute" for="mq">Stückzahl</label><input id="mq" type="number" inputmode="numeric" min="1" value="1"><div class="row"><button class="btn ghost" id="mcn">Abbrechen</button><button class="btn" id="mok">Hinzufügen</button></div></div>';
 document.body.appendChild(o);const g=i=>o.querySelector("#"+i);g("mnm").value=pre||"";if(pnr)g("mnr").value=pnr;g("mcn").onclick=()=>o.remove();
 g("mok").onclick=()=>{const name=g("mnm").value.trim().replace(/\s+/g," "),nr=g("mnr").value.trim(),q=Math.max(1,parseInt(g("mq").value,10)||1);if(!name){g("mnm").classList.add("bad");return errBox("Bitte den Artikelnamen eingeben.")}
  const cat=rKat().find(a=>(nr&&rNorm(a.nr)===rNorm(nr))||String(a.name).trim().toLowerCase()===name.toLowerCase());o.remove();
  if(cat){rAdd(cat.nr,{nr:cat.nr,name:cat.name,g:cat.g,u:cat.u||""},q);rs.q="";retEdit();toast("Ist schon in der Liste: "+cat.name+" (+"+q+")",1);return}
  const key="M:"+(rNorm(nr)||rNorm(name)||Date.now());rAdd(key,{nr,name,g:"Manuell",u:"",manual:true},q);rs.q="";retEdit();toast("+"+q+" "+name+" (manuell)",1);rLogMissing(name,nr,q)};
 setTimeout(()=>(pre?g("mq"):g("mnm")).focus(),60)}

/* Artikel scannen im Retourschein: Code lesen, dann Zahlenfeld. Bei Artikeln mit ID zählen nur die ersten 4 Ziffern (1234–56 -> 1234). */
function rScanBtn(){return '<button class="mbtn sbtn" id="rscanb" type="button"><svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true"><path d="M3 7V5a2 2 0 0 1 2-2h2M17 3h2a2 2 0 0 1 2 2v2M21 17v2a2 2 0 0 1-2 2h-2M7 21H5a2 2 0 0 1-2-2v-2M7 8v8M10 8v8M13 8v8M16.5 8v8"/></svg>Artikel scannen</button>'}
function rScanNr(raw){const s=String(raw||"").trim(),head=s.split(/[\s\-‐‑‒–—―−]+/)[0]||"",m=head.match(/^\d{4}/);return m?m[0]:head}
function rScanHit(raw){const nr=rScanNr(raw),a=nr&&rKat().find(x=>x.nr&&rNorm(x.nr)===rNorm(nr));
 if(!a){beep(false);return ask2("Artikel „"+(nr||String(raw||"").trim())+"“ ist nicht in der Artikelliste.","Manuell eintragen","Abbrechen",()=>rManDlg("",nr))}
 beep(true);rPad(a,{nr:a.nr,name:a.name,g:a.g,u:a.u||""})}
async function rScanCam(onHit){audioUnlock();if(!navigator.mediaDevices||!navigator.mediaDevices.getUserMedia)return errBox("Die Kamera ist auf diesem Gerät nicht verfügbar.");let st;
 try{st=await navigator.mediaDevices.getUserMedia({audio:false,video:{facingMode:{ideal:"environment"},width:{ideal:1920},height:{ideal:1080}}})}catch(e){return errBox("Die Kamera konnte nicht gestartet werden. Bitte den Kamera-Zugriff erlauben.")}
 const tr=st.getVideoTracks()[0];try{const cp=tr.getCapabilities?tr.getCapabilities():{};if(cp.focusMode&&cp.focusMode.includes("continuous"))await tr.applyConstraints({advanced:[{focusMode:"continuous"}]})}catch(e){}
 const o=document.createElement("div");o.className="lcam rscan";o.innerHTML='<video playsinline muted autoplay></video><div class="lframe bc"></div><div class="lhint">Barcode in den Rahmen halten</div><div class="lbar" style="justify-content:center"><button class="lx" type="button">Abbrechen</button></div>';
 document.body.appendChild(o);const v=o.querySelector("video");v.srcObject=st;try{await v.play()}catch(e){}const lt=document.createElement("button");lt.className="ltorch";lt.type="button";lt.hidden=true;o.appendChild(lt);torchUI(tr,null,lt);
 let done=false,tm=null,zx=null;const close=()=>{done=true;clearInterval(tm);if(zx){try{zx.reset()}catch(e){}}st.getTracks().forEach(t=>t.stop());o.remove()};
 const hit=c=>{if(done||!c)return;close();(onHit||rScanHit)(c)};o.querySelector(".lx").onclick=close;
 if("BarcodeDetector" in window){let bd,busy=false;try{bd=new BarcodeDetector()}catch(e){}if(bd){tm=setInterval(async()=>{if(busy||done||v.readyState<2)return;busy=true;try{const r=await bd.detect(v);if(r&&r.length)hit(String(r[0].rawValue))}catch(e){}busy=false},200);return}}
 if(window.ZXing){try{zx=new ZXing.BrowserMultiFormatReader(hints());zx.decodeFromStream(st,v,r=>{if(r)hit(r.getText())})}catch(e){close();errBox("Der Scanner konnte nicht gestartet werden.")}}else{close();errBox("Scanner-Bibliothek nicht geladen. Bitte die Seite neu laden.")}}
/* Manuell eingetragene Artikel des Scheins als eigene (orange) Gruppe */
function rManItems(){return Object.keys(rs.items).filter(k=>rs.items[k].manual).map(k=>({k,...rs.items[k]})).sort((a,b)=>String(a.name).localeCompare(String(b.name),"de",{numeric:true}))}
function rManTile(){const L=rManItems();return L.length?'<button class="rtile grp rmang" data-rmg="1">'+rBdg(L.reduce((a,x)=>a+(x.q||0),0))+'<b>Manuell eingetragene Artikel</b><span class="mute">'+L.length+' Artikel</span></button>':""}
function rManLevel(){const L=rManItems();if(!L.length){rs.lvl="groups";return retEdit()}$("#t").textContent="Manuell eingetragen";
 rPage('<div class="rgrid">'+L.map(x=>'<button class="rtile rmani" data-rmk="'+esc(x.k)+'">'+rBdg(x.q)+'<b>'+rLbl(x.name)+'</b><span class="mute">'+(x.nr?"Nr. "+esc(x.nr):"ohne Nummer")+'</span></button>').join("")+'</div>');
 document.querySelectorAll("[data-rmk]").forEach(b=>b.onclick=()=>{const x=rs.items[b.dataset.rmk];if(!x)return;const base={...x};delete base.q;rPad({nr:b.dataset.rmk,name:x.name,lbl:x.nr?"Nr. "+x.nr:"Manuell eingetragen"},base)})}
/* ===== Eine Artikelliste für alles =====
   Materialliste, Retourschein und Defekt melden lesen nur noch die Artikelliste (docs 'rkat').
   art (Nummer -> Name) wird daraus gebaut; die frühere Scan-Liste (docs 'artikel') entfällt. */
function artCode(nr){let c=String(nr||"").toUpperCase().replace(/\s/g,"");if(/^\d{1,3}$/.test(c))c=c.padStart(4,"0");return /^[A-Z0-9]{3,10}$/.test(c)&&!/^X\d+_*$/.test(c)?c:""}
function artFromKat(){const o={};rKat().forEach(a=>{const c=artCode(a.nr);if(c&&!o[c])o[c]={name:a.name}});art=o}
let artCleaned=false;
async function artCleanup(){if(artCleaned||!can("v_app"))return;artCleaned=true;try{const {data}=await SB.from("docs").select("id").eq("col","artikel");for(const r of data||[])await db.doc("artikel/"+r.id).delete()}catch(e){}}
/* Defekt melden: Live-Scan, Nummer mit ID behalten (es geht um genau dieses Gerät) */
function defScanHit(raw){const v=String(raw||"").trim(),m=v.match(CODE_RE);const nr=m?m[1].toUpperCase():(v.split(/[\s\-‐‑‒–—―−]+/)[0]||"").toUpperCase(),id=m&&m[2];
 const c=artCode(nr)||nr,a=art[c]||rKat().find(x=>rNorm(x.nr)===rNorm(nr)),f=$("#dnart")||$("#deart"),n=$("#dnnr")||$("#denr");if(!f||!n)return;
 n.value=c+(id?"–"+id:"");if(a){beep(true);f.value=a.name;f.classList.remove("bad");toast(a.name+(id?" · ID "+id:""),1)}else{beep(false);errBox("Artikel "+c+" ist nicht in der Artikelliste. Bitte den Namen eintragen.");setTimeout(()=>f.focus(),300)}}
function defScan(fileInput){audioUnlock();if(!navigator.mediaDevices||!navigator.mediaDevices.getUserMedia)return fileInput&&fileInput.click();rScanCam(defScanHit)}
/* Defekt melden/bearbeiten: Etikett fotografieren -> Veranstaltung + Auftragsnummer (gleiche Erkennung wie beim Retourschein) */
function defLabelBind(p){const b=$("#"+p+"lab"),f=$("#"+p+"labf"),t=$("#"+p+"labt");if(!b)return;
 const read=async file=>{b.disabled=true;t.textContent="Etikett wird gelesen …";
  try{const r=await readLabel(file);if(!r.ev&&!r.on)errBox("Auf dem Foto war nichts lesbar. Bitte nochmal mit mehr Licht und gerade von vorne fotografieren.");
   else{const e=$("#"+p+"ev"),o=$("#"+p+"ord");if(r.ev&&e){e.value=r.ev;e.classList.remove("bad")}if(r.on&&o)o.value=r.on;toast("Bitte kurz kontrollieren",1)}}
  catch(e){console.error(e);errBox("Das Etikett konnte nicht gelesen werden. Bitte nochmal versuchen oder von Hand eintippen.")}
  finally{if(document.body.contains(b)){b.disabled=false;t.textContent="Etikett fotografieren"}}};
 b.onclick=async()=>{const shot=await labelCam();if(shot===undefined)return f.click();if(shot)read(shot)};
 f.onchange=()=>{const x=f.files[0];f.value="";if(x)read(x)}}
/* ===== Material-Protokoll (nur Admin lesbar) =====
   Jede eigene Mengen-Änderung im Retourschein (aus rFold) wird als Zeile gemerkt: {t, rid, ev, ord, k, nr, name, g, d}.
   Zeilen warten in localStorage (auch offline) und gehen per rpc rlog_add in docs 'rlog'. Lesen darf nur der Admin (protokoll.sql). */
const RLQ="tpc_rlog_queue";let rlBusy=false,rlTm=null;
function rlQ(){try{return JSON.parse(localStorage.getItem(RLQ)||"[]")||[]}catch(e){return[]}}
function rlQSet(a){try{localStorage.setItem(RLQ,JSON.stringify(a.slice(-5000)))}catch(e){}}
function rLogPush(k,x,d){if(!rs||!rs.id||!d)return;const q=rlQ();q.push({id:"l"+Date.now().toString(36)+Math.random().toString(36).slice(2,8),d:{t:Date.now(),rid:rs.id,ev:String(rs.ev||""),ord:String(rs.ord||""),k,nr:String(x.nr||""),name:String(x.name||""),g:x.g==="Händisch"?"Manuell":String(x.g||""),d}});rlQSet(q);clearTimeout(rlTm);rlTm=setTimeout(rlFlush,1500)}
async function rlFlush(){if(rlBusy||typeof SB==="undefined"||!ME||!navigator.onLine)return;const q=rlQ();if(!q.length)return;rlBusy=true;
 try{const part=q.slice(0,200);const {error}=await SB.rpc("rlog_add",{p_rows:part});if(!error){const sent=new Set(part.map(x=>x.id));rlQSet(rlQ().filter(x=>!sent.has(x.id)));if(q.length>200)setTimeout(rlFlush,300)}}catch(e){}
 rlBusy=false}
window.addEventListener("online",()=>setTimeout(rlFlush,2000));setInterval(rlFlush,30000);setTimeout(rlFlush,5000);
/* Admin: Excel „Pro Tag“ */
const rlDay=t=>{const d=new Date(t);return d.getFullYear()+"-"+String(d.getMonth()+1).padStart(2,"0")+"-"+String(d.getDate()).padStart(2,"0")};
const rlHM=t=>new Date(t).toLocaleTimeString("de-DE",{hour:"2-digit",minute:"2-digit"});
const rlDE=s=>{const [y,m,d]=s.split("-");return d+"."+m+"."+y};
/* Admin: Protokoll eines einzelnen Retourscheins als Excel (Pro Tag, „Bearbeitet von“) */
async function rlogRetXl(r,btn){const lbl=btn&&btn.textContent;try{const dl=await claude.use("downloads");if(!window.ExcelJS)return toast("Excel-Bibliothek nicht geladen.");
  if(btn){btn.disabled=true;btn.textContent="Wird erstellt …"}await rlFlush();
  let all=[],off=0;for(;;){const {data,error}=await SB.from("docs").select("id,data").eq("col","rlog").range(off,off+999);if(error)throw error;all=all.concat(data||[]);if(!data||data.length<1000)break;off+=1000}
  const rows=all.map(x=>x.data||{}).filter(x=>x.rid===r.id&&x.t!==undefined);
  if(!rows.length)return errBox("Für diesen Retourschein gibt es noch keine Protokoll-Einträge.");
  const days={},who=[];rows.slice().sort((a,b)=>(a.t||0)-(b.t||0)).forEach(x=>{const wk=x.by_as?"as:"+x.by_as:x.by;if(wk&&!who.includes(wk))who.push(wk);const day=rlDay(x.t||0),D=days[day]=days[day]||{items:{},first:null,last:null};
   if(!x.nt){if(D.first===null||x.t<D.first)D.first=x.t;if(D.last===null||x.t>D.last)D.last=x.t}
   const key=String(x.k||x.nr||x.name),it=D.items[key]=D.items[key]||{nr:x.nr,name:x.name,g:x.g,q:0};it.q+=(+x.d||0);if(x.name)it.name=x.name;if(x.nr)it.nr=x.nr;if(x.g)it.g=x.g});
  if(!who.length&&r.by)who.push(r.by);
  const dk=Object.keys(days).sort().filter(d=>Object.values(days[d].items).some(i=>i.q));
  if(!dk.length)return errBox("Für diesen Retourschein gibt es noch keine Protokoll-Einträge.");
  const NAVY="FF114A97",wb=new ExcelJS.Workbook(),ws=wb.addWorksheet("Protokoll",{pageSetup:{orientation:"portrait",fitToPage:true,fitToWidth:1,fitToHeight:0},views:[{state:"frozen",ySplit:6}]});
  ws.columns=[{width:16},{width:12},{width:42},{width:16},{width:10}];
  const thin={style:"thin",color:{argb:"FFD5DBE5"}},bd={top:thin,left:thin,bottom:thin,right:thin},fill=h=>({type:"pattern",pattern:"solid",fgColor:{argb:h}});
  ws.mergeCells("A1:E1");const ti=ws.getCell("A1");ti.value="Protokoll Retourschein";ti.font={size:18,bold:true,color:{argb:NAVY}};ws.getRow(1).height=28;
  ws.mergeCells("A2:E2");ws.getCell("A2").value=String(r.ev||"")+(r.ord?" · Auftragsnummer "+r.ord:"");ws.getCell("A2").font={size:13,bold:true};
  ws.mergeCells("A3:E3");ws.getCell("A3").value="Bearbeitet von: "+who.map(k=>String(k).startsWith("as:")?shortName(k.slice(3))+" (Tablet)":nm(k)).join(", ");
  ws.mergeCells("A4:E4");ws.getCell("A4").value="Menge = pro Tag verrechnet (dazugezählt minus abgezogen). Uhrzeit = erster und letzter Eintrag des Tages. Erstellt "+fmt(Date.now());ws.getCell("A4").font={size:9,italic:true,color:{argb:"FF667385"}};
  const hr=ws.getRow(6);hr.values=["Datum","Artikelnr.","Artikel","Gruppe","Menge"];hr.height=22;hr.eachCell(c=>{c.fill=fill(NAVY);c.font={bold:true,color:{argb:"FFFFFFFF"}};c.alignment={vertical:"middle",horizontal:"left"};c.border=bd});hr.getCell(5).alignment={vertical:"middle",horizontal:"right"};
  let rw=6,tot=0;const gO=g=>g==="Zubehör"?2:g==="Manuell"?1:0;
  dk.forEach(day=>{const D=days[day],L=Object.values(D.items).filter(i=>i.q).sort((a,b)=>gO(a.g)-gO(b.g)||String(a.g).localeCompare(String(b.g),"de")||String(a.name).localeCompare(String(b.name),"de",{numeric:true})),sum=L.reduce((a,i)=>a+i.q,0);tot+=sum;
   rw++;const dr=ws.getRow(rw);const wd=new Date(day+"T12:00").toLocaleDateString("de-DE",{weekday:"short"}).replace(".","");
   dr.values=[wd+" "+rlDE(day),(D.first!==null?"erster Eintrag "+rlHM(D.first)+" · letzter Eintrag "+rlHM(D.last):"nachgetragen, ohne Uhrzeit"),null,null,sum];ws.mergeCells("B"+rw+":D"+rw);dr.height=20;
   for(let n=1;n<=5;n++){const c=dr.getCell(n);c.fill=fill("FFDCE6F4");c.font={bold:true,color:{argb:"FF0E2A55"}};c.border=bd;c.alignment={vertical:"middle",horizontal:n===5?"right":"left"}}
   L.forEach((i,ix)=>{rw++;const rr=ws.getRow(rw);rr.values=["",i.nr&&!/^X\d+_*$/.test(i.nr)?i.nr:"–",i.name,i.g||"",i.q];for(let n=1;n<=5;n++){const c=rr.getCell(n);c.border=bd;c.alignment={vertical:"middle",horizontal:n===5?"right":"left"};if(ix%2)c.fill=fill("FFF6F8FB")}})});
  rw++;const fr=ws.getRow(rw);fr.values=["Gesamt","","","",tot];ws.mergeCells("A"+rw+":D"+rw);for(let n=1;n<=5;n++){const c=fr.getCell(n);c.font={bold:true,color:{argb:"FFFFFFFF"}};c.fill=fill(NAVY);c.border=bd;c.alignment={horizontal:n===5?"right":"left"}}
  const buf=await wb.xlsx.writeBuffer(),blob=new Blob([buf],{type:"application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"}),safe=v=>String(v||"").replace(/[\\/:*?"<>|]+/g," ").replace(/\s+/g," ").trim().slice(0,60);
  await dl.save({filename:"Protokoll "+safe(r.ev)+(r.ord?" "+safe(r.ord):"")+".xlsx",data:blob})}
 catch(e){if(e&&(e.code==="declined"||e.name==="AbortError"))return;console.error(e);errBox("Das Protokoll konnte nicht erstellt werden.")}
 finally{if(btn&&document.body.contains(btn)){btn.disabled=false;btn.textContent=lbl}}}
/* ===== Jarvis (vorerst nur Admin) =====
   Eigene Karte auf der Hauptseite, eigener HUD-Bildschirm (dunkel, hell umschaltbar).
   Zeigt, was die App schon weiß: offene Retourscheine, offene Defekte, seit dem letzten Briefing repariert, letzte Retouren.
   Herrichten / Heute zurück / Überfällig brauchen die Packlisten (kommt später). Briefing per Sprachausgabe. */
const JV_ICON='<svg viewBox="0 0 24 24" width="28" height="28" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true"><circle cx="12" cy="12" r="9" stroke-dasharray="5 2.5"/><circle cx="12" cy="12" r="5"/><circle cx="12" cy="12" r="1.8" fill="currentColor"/></svg>';
let jvPrev=null,jvSpeaking=false;
function jvLS(k,v){try{if(v===undefined)return localStorage.getItem(k);localStorage.setItem(k,v)}catch(e){return null}}
function jvGreet(){const h=new Date().getHours();return (h<11?"Guten Morgen":h<18?"Guten Tag":"Guten Abend")+", "+String(meName()).split(" ")[0]}
function jvData(){const rs=can("ret_s");
 const open=!rs?[]:rets.filter(r=>!r.closed).sort((a,b)=>(b.modT||b.t||0)-(a.modT||a.t||0));
 const od=defs.filter(d=>!d.done).sort((a,b)=>(b.urg?1:0)-(a.urg?1:0)||b.t-a.t),urg=od.filter(d=>d.urg).length;
 const since=jvPrev||Date.now()-864e5,fixed=defs.filter(d=>d.done&&(d.doneT||0)>since).sort((a,b)=>b.doneT-a.doneT);
 const last=!rs?[]:rets.filter(r=>r.closed).sort((a,b)=>(b.closedT||0)-(a.closedT||0)).slice(0,5);
 const pk=typeof pkJarvis==="function"?pkJarvis():null;
 return{open,od,urg,fixed,last,since,rs,pk}}
function jvRow(attr,l,r,cls){return '<button class="jvrow" '+attr+'><span>'+l+'</span><span class="'+(cls||"ok")+'">'+r+'</span></button>'}
function jvAgo(t){const d=Math.floor((Date.now()-t)/864e5);return d<=0?"heute":d===1?"gestern":"vor "+d+" Tagen"}
function jvPkPanel(D){const P=D.pk;if(!P)return"";const now=pkDay(Date.now());
 const st='<div class="jvstats"><div class="jvstat"><div class="n">'+String(P.herr.length).padStart(2,"0")+'</div><div class="t">Heute herrichten</div></div><div class="jvstat"><div class="n">'+String(P.back.length).padStart(2,"0")+'</div><div class="t">Heute zurück</div></div><div class="jvstat'+(P.over.length?' al':'')+'"><div class="n">'+String(P.over.length).padStart(2,"0")+'</div><div class="t">Überfällig</div></div></div>';
 const sd=t=>{const d=Math.round((now-pkDay(t))/864e5);return d<=1?"seit gestern":"seit "+d+" Tagen"};
 const rows=P.over.map(p=>[p,"überfällig "+sd(p.de),"warn"]).concat(P.herr.map(p=>{const g=pkProg(p);return[p,"herrichten"+(g.d?" "+g.d+"/"+g.n:"")+(pkF(p).length?" · "+pkF(p).length+" Fremd":""),"ok"]}),(P.herrDone||[]).map(p=>[p,"hergerichtet ✓","ok"]),P.back.map(p=>[p,"zurück "+pkD(p.de).slice(-5),"ok"])).slice(0,8);
 return '<section class="jvpn'+(P.over.length?' al':'')+'"><div class="jvlb">Packlisten <span>heute</span></div>'+st+(rows.length?rows.map(([p,r,c])=>jvRow('data-jp="'+esc(p.id)+'"',esc((p.ord?p.ord+" · ":"")+p.ev),esc(r),c)).join(""):'<div class="jvempty">Heute nichts herzurichten, nichts zurück, nichts überfällig.</div>')+'</section>'}
function jvPanels(D){
 const st='<section class="jvpn"><div class="jvlb">Status <span>live</span></div><div class="jvstats">'+
  (D.rs?'<div class="jvstat"><div class="n">'+String(D.open.length).padStart(2,"0")+'</div><div class="t">Retourscheine offen</div></div>':'')+
  '<div class="jvstat'+(D.urg?' al':'')+'"><div class="n">'+String(D.od.length).padStart(2,"0")+'</div><div class="t">Defekte offen'+(D.urg?', '+D.urg+' dringend':'')+'</div></div>'+
  '<div class="jvstat"><div class="n">'+String(D.fixed.length).padStart(2,"0")+'</div><div class="t">Repariert</div></div></div></section>';
 const ret='<section class="jvpn"><div class="jvlb">Offene Retourscheine <span>'+D.open.length+'</span></div>'+(D.open.length?D.open.slice(0,8).map(r=>jvRow('data-jr="'+esc(r.id)+'"',esc((r.ord?r.ord+" · ":"")+r.ev),rTot(rIt(r))+" Stk · "+jvAgo(r.modT||r.t))).join(""):'<div class="jvempty">Keine offenen Retourscheine.</div>')+'</section>';
 const soon='<section class="jvpn dim"><div class="jvlb">Herrichten · Heute zurück · Überfällig <span>bald</span></div><div class="jvempty">Kommt, sobald Jarvis die Packlisten aus dem Lager-Postfach lesen darf.</div></section>';
 const def='<section class="jvpn'+(D.urg?' al':'')+'"><div class="jvlb">'+(can("def_s")?"Offene Defekte":"Deine offenen Defekte")+' <span>'+D.od.length+'</span></div>'+(D.od.length?D.od.slice(0,8).map(d=>jvRow('data-jd="'+esc(d.id)+'"',esc(d.art+(d.ev?" · "+d.ev:"")),d.urg?"dringend":jvAgo(d.t),d.urg?"warn":"ok")).join(""):'<div class="jvempty">Keine offenen Defekte.</div>')+'</section>';
 const fx='<section class="jvpn"><div class="jvlb">Wieder einsatzbereit <span>seit '+(jvPrev?"letztem Briefing":"24 Std.")+'</span></div>'+(D.fixed.length?D.fixed.slice(0,6).map(d=>jvRow('data-jd="'+esc(d.id)+'"',esc(d.art),"repariert "+fmt(d.doneT).slice(0,6)+" "+fmt(d.doneT).slice(-5))).join(""):'<div class="jvempty">Nichts Neues repariert.</div>')+'</section>';
 const lr='<section class="jvpn"><div class="jvlb">Letzte Retouren <span>abgeschlossen</span></div>'+(D.last.length?D.last.map(r=>jvRow('data-jr="'+esc(r.id)+'"',esc((r.ord?r.ord+" · ":"")+r.ev),jvAgo(r.closedT||r.t))).join(""):'<div class="jvempty">Noch keine abgeschlossenen Retourscheine.</div>')+'</section>';
 const pkp=jvPkPanel(D);
 return D.rs?{left:st+pkp+ret,right:def+fx+lr}:{left:st+pkp,right:def+fx}}
function jvReactor(){let t='';for(let i=0;i<90;i++){const a=i/90*Math.PI*2,big=i%6===0,r1=86,r2=r1+(big?12:5);t+='<line x1="'+(200+r1*Math.cos(a)).toFixed(1)+'" y1="'+(200+r1*Math.sin(a)).toFixed(1)+'" x2="'+(200+r2*Math.cos(a)).toFixed(1)+'" y2="'+(200+r2*Math.sin(a)).toFixed(1)+'" stroke="var(--jv-tick'+(big?'b':'')+')" stroke-width="1.2"/>'}
 return '<svg viewBox="0 0 400 400" aria-hidden="true"><g class="sd"><circle cx="200" cy="200" r="190" fill="none" stroke="var(--jv-line-dim)" stroke-width="1" stroke-dasharray="2 7"/><path d="M200 10 A190 190 0 0 1 390 200" fill="none" stroke="var(--jv-cyan)" stroke-width="2"/><path d="M200 390 A190 190 0 0 1 10 200" fill="none" stroke="var(--jv-mid)" stroke-width="1.5"/></g><g class="sa"><circle cx="200" cy="200" r="168" fill="none" stroke="var(--jv-mid)" stroke-width="8" stroke-dasharray="90 24 12 24"/></g><circle cx="200" cy="200" r="150" fill="none" stroke="var(--jv-line-dim)" stroke-width="1"/><g class="sb"><circle cx="200" cy="200" r="134" fill="none" stroke="var(--jv-cyan)" stroke-width="14" stroke-dasharray="20 8"/></g><g class="sc"><circle cx="200" cy="200" r="108" fill="none" stroke="var(--jv-pale)" stroke-width="2.5" stroke-dasharray="140 30 14 30"/></g><g>'+t+'</g><circle cx="200" cy="200" r="72" fill="none" stroke="var(--jv-mid)" stroke-width="2"/><g class="sb"><circle cx="200" cy="200" r="56" fill="none" stroke="var(--jv-cyan)" stroke-width="7" stroke-dasharray="9 6"/></g><circle cx="200" cy="200" r="34" fill="none" stroke="var(--jv-ice)" stroke-width="2.5"/><g class="core"><circle cx="200" cy="200" r="19" fill="var(--jv-cyan)"/><circle cx="200" cy="200" r="8" fill="var(--jv-core)"/></g></svg>'}
function jvClock(){const c=$("#jvclock");if(!c)return;const d=new Date();c.textContent=d.toLocaleTimeString("de-AT",{hour:"2-digit",minute:"2-digit",second:"2-digit"});const e=$("#jvdate");if(e)e.textContent=d.toLocaleDateString("de-AT",{weekday:"long"})+" · "+d.toLocaleDateString("de-AT",{day:"2-digit",month:"2-digit",year:"numeric"})}
setInterval(jvClock,1000);
function jvBind(){document.querySelectorAll("[data-jp]").forEach(b=>b.onclick=()=>{curPack=b.dataset.jp;go("packopen")});document.querySelectorAll("[data-jr]").forEach(b=>b.onclick=()=>{curRet=b.dataset.jr;go("retopen")});document.querySelectorAll("[data-jd]").forEach(b=>b.onclick=()=>{curDef=b.dataset.jd;go("defopen")})}
/* Sprache: beste deutsche Männerstimme des Geräts, ruhig und etwas tiefer; Satz für Satz gesprochen (natürliche Pausen) */
const JV_MALE=/conrad|killian|florian|christoph|kasper|ralf|bernd|klaus|jonas|markus|martin|yannick|viktor|stefan|hans|thomas|männlich|male/i;
const jvVK=v=>v.voiceURI||v.name;
function jvVQ(v){const u=String(v.voiceURI||"")+" "+v.name;return /premium/i.test(u)?"Premium":/enhanced|erweitert|verbessert/i.test(u)?"Erweitert":/natural|neural|online/i.test(u)?"Natural":/compact|kompakt/i.test(u)?"Standard":""}
function jvVLabel(v){const q=jvVQ(v);return v.name+(q&&!v.name.includes(q)?" ("+q+")":"")}
function jvVoiceScore(v){let s=0;const nm=v.name+" "+String(v.voiceURI||"");if(/^de[-_]DE/i.test(v.lang))s+=3;else if(/^de[-_]AT/i.test(v.lang))s+=2;else if(/^de/i.test(v.lang))s+=1;else return -99;
 if(/natural|neural|online/i.test(nm))s+=40;if(/premium/i.test(nm))s+=34;if(/enhanced|erweitert|verbessert/i.test(nm))s+=30;if(/google/i.test(nm))s+=12;
 if(JV_MALE.test(v.name))s+=20;if(/katja|amala|seraphina|louisa|anna|helena|petra|hedda|vicki|marlene|ingrid|female|weiblich/i.test(v.name))s-=8;if(/eloquence|compact|espeak|super-compact/i.test(nm))s-=15;return s}
function jvVoices(){if(!("speechSynthesis" in window))return[];const seen=new Set(),lab=new Set();return speechSynthesis.getVoices().filter(v=>/^de/i.test(v.lang)&&!seen.has(jvVK(v))&&seen.add(jvVK(v))).sort((a,b)=>jvVoiceScore(b)-jvVoiceScore(a)||a.name.localeCompare(b.name)).filter(v=>!lab.has(jvVLabel(v))&&lab.add(jvVLabel(v)))}
function jvVoice(){const L=jvVoices(),n=jvLS("tpc_jv_voice");return (n&&(L.find(v=>jvVK(v)===n)||L.find(v=>v.name===n)))||L[0]||null}
const jvPitch=()=>{const p=parseFloat(jvLS("tpc_jv_pitch"));return isFinite(p)?p:.9},jvRate=()=>{const r=parseFloat(jvLS("tpc_jv_rate"));return isFinite(r)?r:.96};
const JV_NUM=["keine","ein","zwei","drei","vier","fünf","sechs","sieben","acht","neun","zehn","elf","zwölf"];
const jvN=n=>n<JV_NUM.length?JV_NUM[n]:String(n);
const jvList=a=>a.length<2?a.join(""):a.slice(0,-1).join(", ")+" und "+a[a.length-1];
function jvSay(s){return String(s||"").replace(/\s+/g," ").replace(/(\d)\s*[-–]\s*(\d)/g,"$1 Strich $2").trim()}
/* Briefing als natürliche Sätze. Art pro Gerät: "frech" (Standard, trockener Butler-Humor + kumpelhaft, Zufallsauswahl) oder "sachlich" */
const jvStyle=()=>{const v=jvLS("tpc_jv_style");return v==="sachlich"||v==="frech"?v:(owner?"frech":"sachlich")};
const jvPick=a=>a[Math.floor(Math.random()*a.length)];
const jvCap=s=>String(s).replace(/^./,c=>c.toUpperCase());
function jvText(D){return jvStyle()==="sachlich"?jvTextSachlich(D):jvTextFrech(D)}
function jvHiFrech(){const h=new Date().getHours(),n=String(meName()).split(" ")[0];
 const hi=jvPick(["Servus"+(n?" "+n:""),(h<11?"Guten Morgen":h<18?"Guten Tag":"Guten Abend")+(n?", "+n:"")]);
 const q=["Das Lager hat dich vermisst. Ich nicht so sehr, aber das Lager schon.","Schön, dass du da bist. Dann schauen wir mal, was heute so los ist."];
 if(h<11)q.push("Kaffee schon da? Gut, dann fangen wir an.","Kaffee schon da? Gut, dann fangen wir an.");
 if(h>=18)q.push("Noch so spät da? Respekt. Oder schlechte Planung.","Noch so spät da? Respekt. Oder schlechte Planung.");
 return hi+". "+jvPick(q)}
function jvWhen(t){const d=Math.round((pkDay(Date.now())-pkDay(t))/864e5);return d<=1?"gestern":"vor "+jvN(d)+" Tagen"}
function jvPkFremd(a,frech){const n=a.reduce((s,p)=>s+pkF(p).length,0);if(!n)return"";const t=n===1?"eine Position":jvN(n)+" Positionen";
 return frech?jvPick([" Achtung, "+t+" davon "+(n===1?"ist":"sind")+" Fremdmiete. Nur so als Hinweis."," "+jvCap(t)+" davon "+(n===1?"kommt":"kommen")+" nicht von uns, Fremdmiete."]):" Davon "+t+" mit Fremdmiete."}
function jvPkText(D,frech){const P=D.pk,S=[];if(!P)return S;const ev=p=>jvSay(p.ev||("Auftrag "+p.ord)),H=P.herr,B=P.back,O=P.over;
 const HD=P.herrDone||[];
 if(!H.length&&HD.length)S.push(frech?jvPick(["Heute ist schon alles hergerichtet. Sauber.","Herrichten für heute: erledigt. Ich bin beeindruckt."]):"Heute ist alles hergerichtet.");
 else if(!H.length)S.push(frech?jvPick(["Herrichten heute: nichts. Verdächtig ruhig.","Heute muss nichts hergerichtet werden. Genieß es."]):"Heute ist nichts herzurichten.");
 else if(H.length===1){const g=pkProg(H[0]);S.push((frech?jvPick(["Heute wird "+ev(H[0])+" hergerichtet.","Heute ist "+ev(H[0])+" dran. Ab ins Lager."]):"Heute herzurichten: "+ev(H[0])+".")+(g.d?(frech?" "+g.d+" von "+g.n+" Positionen sind schon fertig. Weiter so.":" "+g.d+" von "+g.n+" Positionen sind fertig."):jvPkFremd(H,frech)))}
 else S.push((H.length<=3?"Heute sind "+jvN(H.length)+" Aufträge herzurichten: "+jvList(H.map(ev))+".":"Heute sind "+jvN(H.length)+" Aufträge herzurichten. Zuerst "+ev(H[0])+".")+jvPkFremd(H,frech)+(frech?jvPick([" Das wird ein Tag."," Kaffee nachfüllen empfohlen."]):""));
 if(B.length===1)S.push(frech?jvPick(["Heute kommt "+ev(B[0])+" zurück. Hoffentlich vollständig.","Zurück kommt heute "+ev(B[0])+". Ich zähl mit."]):"Heute sollte "+ev(B[0])+" zurückkommen.");
 else if(B.length>1)S.push((frech?"Heute kommen ":"Heute sollten ")+jvN(B.length)+" Aufträge zurück"+(frech?"":"kommen")+": "+jvList(B.slice(0,3).map(ev))+(B.length>3?" und weitere":"")+"."+(frech?" Hoffentlich vollständig.":""));
 if(!O.length)S.push(frech?jvPick(["Überfällig ist nichts. Respekt.","Überfällig: nichts. So soll's sein."]):"Überfällig ist nichts.");
 else if(O.length===1){const p=O[0],w=jvWhen(p.de),ro=pkRets(p).length?" Ein Retourschein ist schon angefangen.":"";S.push((frech?jvPick([ev(p)+" ist überfällig, Dispo-Ende war "+w+". Das Material macht offenbar noch Urlaub.",ev(p)+" hätte "+w+" zurück sein sollen. Ich sag ja nur."]):ev(p)+" ist überfällig, Dispo-Ende war "+w+".")+ro)}
 else S.push(jvCap(jvN(O.length))+" Aufträge sind überfällig. Am längsten "+ev(O[0])+", Dispo-Ende "+jvWhen(O[0].de)+"."+(frech?jvPick([" Die suchen wir besser mal."," Das Material macht offenbar noch Urlaub."]):""));
 return S}
function jvTextFrech(D){const S=[jvHiFrech()].concat(jvPkText(D,true)),h=new Date().getHours(),k=D.open.length,N=jvCap(jvN(k));
 if(!D.rs);else if(!k)S.push(jvPick(["Alle Retourscheine abgeschlossen. Ich bin fast ein bisschen enttäuscht.","Retourscheine: nichts offen. Genieß es, das bleibt nicht lange so."]));
 else if(k===1){const e=jvSay(D.open[0].ev);S.push(jvPick(["Ein Retourschein ist noch offen: "+e+". Der fühlt sich schon ein bisschen vernachlässigt.","Einer ist noch offen: "+e+". Nur einer. "+(h<11?"Das schaffst du vor dem Mittagessen.":"Das schaffst du heute noch.")]))}
 else if(k<=3){const l=jvList(D.open.map(r=>jvSay(r.ev)));S.push(jvPick([N+" Retourscheine sind offen: "+l+". Ich nehme an, die erledigen sich nicht von selbst.",N+" offene Retourscheine: "+l+". Die warten schon geduldig. Noch."]))}
 else{const e=jvSay(D.open[0].ev);S.push(jvPick([N+" Retourscheine sind offen. Ich nehme an, die erledigen sich nicht von selbst. Der jüngste ist "+e+".",N+" offene Retourscheine. Der jüngste ist "+e+". Die anderen warten schon geduldig. Noch."]))}
 const U=D.od.filter(d=>d.urg),m=D.od.length,M=jvCap(jvN(m)),tail=()=>jvPick([" Nur so als Hinweis."," Ich würde das nicht ignorieren. Aber ich bin ja nur Jarvis."]);
 if(!m)S.push(jvPick(["Keine offenen Defekte. Entweder läuft alles, oder keiner hat's gemeldet.","Defekte: null. Die Werkstatt langweilt sich vermutlich."]));
 else if(U.length===1){const a=jvSay(U[0].art)+(U[0].ev?" von "+jvSay(U[0].ev):"");S.push((m===1?"Ein Defekt ist offen, und der ist dringend: ":M+" Defekte warten, und einer davon ist dringend: ")+a+"."+tail())}
 else if(U.length>1)S.push(M+" Defekte sind offen, dringend davon: "+jvList(U.slice(0,3).map(d=>jvSay(d.art)))+"."+tail());
 else S.push(m===1?jvPick(["Ein Defekt wartet noch. Nur so als Hinweis.","Ein Defekt ist noch offen. Nichts Dramatisches, aber er erledigt sich auch nicht von allein."]):jvPick([M+" Defekte warten. Nur so als Hinweis.",M+" Defekte sind noch offen. Die Werkstatt hat also zu tun."]));
 const F=D.fixed.slice(0,4).map(d=>jvSay(d.art));
 if(F.length===1)S.push(jvPick(["Gute Nachricht: "+F[0]+" ist wieder einsatzbereit. Die Werkstatt hat geliefert.",jvCap(F[0])+" ist repariert. Wer hätte das gedacht."]));
 else if(F.length>1)S.push(jvPick(["Gute Nachricht: "+jvList(F)+" sind wieder einsatzbereit. Die Werkstatt hat geliefert.",jvCap(jvList(F))+" sind repariert. Wer hätte das gedacht."]));
 S.push(jvPick(["Das war's von mir. Ich bin dann wieder im Standby.","So, genug geredet. Ab an die Arbeit."]));
 return S}
function jvTextSachlich(D){const S=[jvGreet()+"."].concat(jvPkText(D,false));
 if(!D.rs);else if(!D.open.length)S.push("Bei den Retourscheinen ist gerade alles abgeschlossen.");
 else if(D.open.length===1)S.push("Ein Retourschein ist noch offen: "+jvSay(D.open[0].ev)+".");
 else if(D.open.length<=3)S.push(jvN(D.open.length).replace(/^./,c=>c.toUpperCase())+" Retourscheine sind noch offen: "+jvList(D.open.map(r=>jvSay(r.ev)))+".");
 else S.push(jvN(D.open.length).replace(/^./,c=>c.toUpperCase())+" Retourscheine sind noch offen. Der jüngste ist "+jvSay(D.open[0].ev)+".");
 const U=D.od.filter(d=>d.urg);
 if(!D.od.length)S.push("Defekte gibt es keine offenen.");
 else{S.push(D.od.length===1?"Ein Defekt ist noch offen.":jvN(D.od.length).replace(/^./,c=>c.toUpperCase())+" Defekte sind noch offen.");
  if(U.length===1)S.push("Dringend ist "+jvSay(U[0].art)+(U[0].ev?" von "+jvSay(U[0].ev):"")+".");
  else if(U.length>1)S.push("Dringend sind "+jvList(U.slice(0,3).map(d=>jvSay(d.art)))+".")}
 if(D.fixed.length===1)S.push("Gute Nachricht: "+jvSay(D.fixed[0].art)+" ist repariert und wieder einsatzbereit.");
 else if(D.fixed.length>1)S.push("Gute Nachricht: "+jvList(D.fixed.slice(0,4).map(d=>jvSay(d.art)))+" sind repariert und wieder einsatzbereit.");
 return S}
function jvTalk(on){jvSpeaking=on;const j=$("#jv"),b=$("#jvsp");if(j)j.classList.toggle("talk",on);if(b)b.textContent=on?(jvMode==="ask"?"Antwort stoppen":"Briefing stoppen"):"Briefing vorlesen"}
function jvSpeakDevice(lines,done){if(!("speechSynthesis" in window)){jvTalk(false);toast("Sprachausgabe geht auf diesem Gerät nicht.");return}
 speechSynthesis.cancel();const v=jvVoice();let i=0,stop=false;jvTalk(true);
 const next=()=>{if(stop||!jvSpeaking||i>=lines.length){jvTalk(false);if(done)done();return}
  const u=new SpeechSynthesisUtterance(lines[i++]);u.lang=v?v.lang:"de-DE";if(v)u.voice=v;u.pitch=jvPitch();u.rate=jvRate();
  u.onend=()=>setTimeout(next,260);u.onerror=e=>{if(e&&e.error==="interrupted"){stop=true}jvTalk(false)};speechSynthesis.speak(u)};
 setTimeout(next,60)}
/* Thorsten: freie deutsche Männerstimme (Piper/Thorsten-Voice), wird im Gerät berechnet.
   Bibliothek @diffusionstudio/vits-web lädt Sprachmodell (~60 MB, einmalig, im Gerät gespeichert) und rechnet Satz für Satz.
   Klappt etwas nicht, spricht Jarvis automatisch mit der Gerätestimme. Vorerst nur Admin-Test (Lizenz für Firmeneinsatz prüfen). */
const JV_TH_ID="de_DE-thorsten-medium";
const JV_TH_SRC=["https://cdn.jsdelivr.net/npm/@diffusionstudio/vits-web@1.0.3/+esm","https://cdn.jsdelivr.net/npm/@diffusionstudio/vits-web/+esm","https://esm.sh/@diffusionstudio/vits-web@1.0.3"];
let jvTH=null,jvAud=null;
const jvEngine=()=>owner?(jvLS("tpc_jv_engine")||"thorsten"):"device";
async function jvThLib(){if(jvTH)return jvTH;let err=null;for(const u of (window.__JV_TH_SRC||JV_TH_SRC)){try{const m=await import(u);if(m&&typeof m.predict==="function"){jvTH=m;return m}}catch(e){err=e}}throw err||new Error("Sprachprogramm nicht gefunden")}
function jvAudio(){if(!jvAud){jvAud=new Audio();jvAud.setAttribute("playsinline","");jvAud.preload="auto"}return jvAud}
const JV_SILENT="data:audio/wav;base64,UklGRiQAAABXQVZFZm10IBAAAAABAAEARKwAAIhYAQACABAAZGF0YQAAAAA=";
function jvUnlock(){const a=jvAudio();try{a.src=JV_SILENT;const p=a.play();if(p&&p.catch)p.catch(()=>{})}catch(e){}}
function jvBtn(t){const b=$("#jvsp");if(b)b.textContent=t}
async function jvThReady(){const m=await jvThLib();let have=[];try{have=(await m.stored())||[]}catch(e){}
 if(!have.includes(JV_TH_ID)){jvBtn("Thorsten wird geladen …");await m.download(JV_TH_ID,p=>{if(p&&p.total)jvBtn("Thorsten wird geladen … "+Math.min(100,Math.round(p.loaded*100/p.total))+" %")})}return m}
async function jvThSpeak(lines){const m=await jvThReady();if(!jvSpeaking)return;jvBtn("Thorsten überlegt …");const a=jvAudio();
 let next=m.predict({text:lines[0],voiceId:JV_TH_ID});
 for(let i=0;i<lines.length&&jvSpeaking;i++){const blob=await next;if(i+1<lines.length)next=m.predict({text:lines[i+1],voiceId:JV_TH_ID});if(!jvSpeaking)break;
  if(i===0)jvBtn("Briefing stoppen");const u=URL.createObjectURL(blob);a.src=u;a.playbackRate=jvRate();
  await new Promise(res=>{a.onended=res;a.onerror=res;a.onpause=()=>{if(!jvSpeaking)res()};try{const p=a.play();if(p&&p.catch)p.catch(res)}catch(e){res()}});
  URL.revokeObjectURL(u);if(jvSpeaking)await new Promise(r=>setTimeout(r,180))}}
function jvSpeakLines(lines,done){jvTalk(true);
 if(jvEngine()==="thorsten"){jvUnlock();jvThSpeak(lines).then(()=>{jvTalk(false);if(done)done()}).catch(e=>{console.warn("Thorsten",e);
   if(!jvSpeaking)return;toast("Thorsten ging nicht ("+String(e&&e.message||e).slice(0,80)+"). Ich spreche mit der Gerätestimme.");jvSpeakDevice(lines,done)});return}
 jvSpeakDevice(lines,done)}
function jvStop(){jvSpeaking=false;try{speechSynthesis.cancel()}catch(e){}if(jvAud){try{jvAud.pause()}catch(e){}}jvTalk(false)}
function jvSpeak(){if(jvSpeaking)return jvStop();jvMode="brief";jvSpeakLines(jvText(jvData()))}
/* Stimmen-Einstellung mit Probe-Hören */
function jvVoiceDlg(){const L=jvVoices(),cur=jvVoice(),o=document.createElement("div");o.className="ov";
 const best=L[0];o.innerHTML='<div class="card" style="width:100%;max-width:420px;margin:0"><b>Stimme von Jarvis</b><p class="mute" style="margin:4px 0 10px">Gilt nur für dieses Gerät.</p>'+
  '<div class="row seg" style="margin-bottom:10px'+(owner?'':';display:none')+'"><button type="button" id="jvet" class="'+(jvEngine()==="thorsten"?"on":"")+'">Thorsten</button><button type="button" id="jved" class="'+(jvEngine()==="device"?"on":"")+'">Gerätestimme</button></div>'+
  '<p class="mute" id="jvthi" style="font-size:13px;margin:0 0 8px">Freie deutsche Männerstimme, wird im Gerät berechnet. Beim ersten Mal einmalig ca. 60 MB laden (am besten im WLAN), danach geht es auch offline. Test nur für dich – für den Firmeneinsatz Lizenz noch prüfen.</p><div id="jvdev">'+
  (L.length?'<label class="mute" for="jvvs">Stimme</label><select id="jvvs">'+L.map(v=>'<option value="'+esc(jvVK(v))+'"'+(cur&&jvVK(v)===jvVK(cur)?' selected':'')+'>'+esc(jvVLabel(v))+(v===best?' – empfohlen':'')+'</option>').join("")+'</select>':'<p class="mute">Auf diesem Gerät ist keine deutsche Stimme installiert.</p>')+
  '<label class="mute" for="jvvp">Tonlage <span id="jvvpv"></span></label><input type="range" id="jvvp" min="0.6" max="1.3" step="0.05" value="'+jvPitch()+'"></div>'+
  '<label class="mute" for="jvvr">Tempo <span id="jvvrv"></span></label><input type="range" id="jvvr" min="0.75" max="1.25" step="0.05" value="'+jvRate()+'">'+
  '<label class="mute">Art zu sprechen</label><div class="row seg" style="margin:4px 0 6px"><button type="button" id="jvsf" class="'+(jvStyle()==="frech"?"on":"")+'">Frech</button><button type="button" id="jvss" class="'+(jvStyle()==="sachlich"?"on":"")+'">Sachlich</button></div>'+
  '<p class="mute" id="jvtip" style="font-size:13px;margin:8px 0">Tipp: Am PC klingen in Microsoft Edge die „Natural“-Stimmen am echtesten (z. B. Conrad). Am iPhone bekommt die App meist nur „Anna“, auch wenn weitere Stimmen geladen sind – dafür gibt es Thorsten.</p>'+
  '<div class="row"><button class="btn ghost" id="jvvt" type="button">Probe hören</button><button class="btn" id="jvvo" type="button">Fertig</button></div>'+
  '<button class="lnk" id="jvvd" type="button" style="margin-top:6px">Auf Standard zurücksetzen</button></div>';
 document.body.appendChild(o);const g=i=>o.querySelector("#"+i),eng=e=>{jvLS("tpc_jv_engine",e);g("jvet").classList.toggle("on",e==="thorsten");g("jved").classList.toggle("on",e==="device");g("jvdev").hidden=e==="thorsten";g("jvtip").hidden=e==="thorsten";g("jvthi").hidden=e!=="thorsten"};if(!owner){g("jvdev").hidden=false;g("jvtip").hidden=false;g("jvthi").hidden=true}else eng(jvEngine());g("jvet").onclick=()=>eng("thorsten");g("jved").onclick=()=>eng("device");const sty=v=>{jvLS("tpc_jv_style",v);g("jvsf").classList.toggle("on",v==="frech");g("jvss").classList.toggle("on",v==="sachlich")};g("jvsf").onclick=()=>sty("frech");g("jvss").onclick=()=>sty("sachlich");const lab=()=>{g("jvvpv").textContent=Math.round(+g("jvvp").value*100)+" %";g("jvvrv").textContent=Math.round(+g("jvvr").value*100)+" %"};lab();
 const save=()=>{if(g("jvvs"))jvLS("tpc_jv_voice",g("jvvs").value);jvLS("tpc_jv_pitch",g("jvvp").value);jvLS("tpc_jv_rate",g("jvvr").value);lab()};
 ["jvvs","jvvp","jvvr"].forEach(i=>{const e=g(i);if(e)e.oninput=e.onchange=save});
 g("jvvt").onclick=()=>{save();jvStop();jvSpeakLines(jvStyle()==="frech"?[jvHiFrech(),"So klinge ich mit dieser Einstellung. Soll ich so bleiben? Ich hätte nichts dagegen."]:[jvGreet()+".","So klinge ich mit dieser Einstellung. Soll ich so bleiben?"])};
 g("jvvd").onclick=()=>{["tpc_jv_voice","tpc_jv_pitch","tpc_jv_rate","tpc_jv_engine","tpc_jv_style"].forEach(k=>{try{localStorage.removeItem(k)}catch(e){}});o.remove();jvVoiceDlg()};
 g("jvvo").onclick=()=>{if(jvSpeaking)jvStop();o.remove()};
 o.addEventListener("click",e=>{if(e.target===o)g("jvvo").click()})}
if("speechSynthesis" in window){speechSynthesis.getVoices();speechSynthesis.addEventListener&&speechSynthesis.addEventListener("voiceschanged",()=>{})}
function jarvisView(){$("#t").textContent="Jarvis";const D=jvData(),P=jvPanels(D);
 if($("#jv")){$("#jvl").innerHTML=P.left;$("#jvr").innerHTML=P.right;$("#jvg").textContent=jvGreet();jvBind();return}
 if(jvPrev===null){jvPrev=+jvLS("tpc_jv_last")||0;jvLS("tpc_jv_last",String(Date.now()))}
 const light=jvLS("tpc_jv_light")==="1";
 $("#app").innerHTML='<div class="jv'+(light?' light':'')+'" id="jv"><div class="jvtop"><b>System · Lager-Assistent</b><span><span class="jvdot" aria-hidden="true"></span>Online · <button class="jvlink" id="jvvc" type="button">Stimme</button> · <button class="jvlink" id="jvth" type="button">'+(light?"Dunkel":"Hell")+'</button></span></div>'+
  '<div class="jvgrid"><div class="jvcol" id="jvl">'+P.left+'</div><div class="jvcenter"><div class="jvclock" id="jvclock"></div><div class="jvdate" id="jvdate"></div><div class="jvreactor">'+jvReactor()+'</div><div class="jvgreet" id="jvg">'+jvGreet()+'</div><button class="jvbtn" id="jvsp" type="button">Briefing vorlesen</button>'+jvAskHtml()+'</div><div class="jvcol" id="jvr">'+P.right+'</div></div>'+
  (owner?'<p class="jvnote">Wer Jarvis sieht, stellst du in der Benutzerverwaltung ein (Recht „Jarvis“). Herrichten, Heute zurück und Überfällig kommen aus den hochgeladenen Packlisten.</p>':'')+'</div>';
 jvClock();jvBind();jvAskBind();$("#jvsp").onclick=jvSpeak;$("#jvvc").onclick=jvVoiceDlg;$("#jvth").onclick=()=>{const l=!$("#jv").classList.contains("light");jvLS("tpc_jv_light",l?"1":"0");$("#jv").classList.toggle("light",l);$("#jvth").textContent=l?"Dunkel":"Hell"}}
async function rLogMissing(name,nr,q){try{const id="m"+((rNorm(nr)||rNorm(name)).slice(0,80)||Date.now().toString(36)),ref=db.doc("fehlartikel/"+id),old=await ref.get(),o=old.exists?old.data():{};
 await ref.set({name,nr:nr||o.nr||"",times:(o.times||0)+1,qty:(o.qty||0)+q,first:o.first||Date.now(),last:Date.now(),ev:rs?rs.ev:"",ord:rs?rs.ord:"",by:me})}catch(e){console.warn("Fehlartikel nicht gespeichert",e)}}
async function fehlBlock(){$("#app").insertAdjacentHTML("beforeend",'<h3 style="margin:18px 0 4px">Fehlende Artikel</h3><p class="mute" style="margin:0 0 8px">Artikel, die manuell in Retourscheine eingetragen wurden, weil sie in der Artikelliste fehlen.</p><div id="fbx"><div class="card mute">Lade …</div></div>');
 const {data,error}=await SB.from("docs").select("id,data").eq("col","fehlartikel");const box=$("#fbx");if(!box)return;if(error){box.innerHTML='<div class="card mute">Konnte nicht geladen werden.</div>';return}
 const L=(data||[]).map(x=>({id:x.id,...x.data})).sort((a,b)=>b.times-a.times||b.last-a.last);
 if(!L.length){box.innerHTML='<div class="card mute">Noch keine. Sobald jemand einen Artikel manuell einträgt, erscheint er hier.</div>';return}
 box.innerHTML='<button class="btn ghost" id="fxl" style="margin-bottom:8px">Als Excel herunterladen (Vorlage-Format)</button>'+L.map(a=>'<div class="card fl"><div style="min-width:0"><b>'+esc(a.name)+'</b><div class="mute">'+(a.nr?"Nr. "+esc(a.nr)+" · ":"")+a.times+"× eingetragen, "+a.qty+" Stück</div><div class=\"mute\">Zuletzt: "+esc(a.ev||"–")+(a.ord?" ("+esc(a.ord)+")":"")+", "+fmt(a.last)+'</div></div><button class="btn ghost s" data-fdel="'+a.id+'" style="flex:none">Erledigt</button></div>').join("");
 document.querySelectorAll("[data-fdel]").forEach(b=>b.onclick=()=>ask("Als erledigt markieren und aus der Liste entfernen?",async()=>{try{await db.doc("fehlartikel/"+b.dataset.fdel).delete();b.closest(".card").remove()}catch(e){errBox("Das hat nicht geklappt.")}}));
 $("#fxl").onclick=async()=>{try{const wb=new ExcelJS.Workbook(),ws=wb.addWorksheet("Artikel");ws.columns=[{header:"Artikelgruppe",width:18},{header:"Untergruppe",width:16},{header:"Artikelnummer",width:15},{header:"Artikelname",width:40},{header:"Mit ID",width:9},{header:"A – oft",width:9},{header:"B – normal",width:11},{header:"C – selten",width:11},{header:"Wie oft eingetragen",width:20},{header:"Zuletzt bei",width:34}];
  ws.getRow(1).eachCell(c=>{c.font={bold:true,color:{argb:"FFFFFFFF"}};c.fill={type:"pattern",pattern:"solid",fgColor:{argb:"FF1F2A44"}}});
  L.forEach(a=>ws.addRow(["","",a.nr||"",a.name,"","","","",a.times,(a.ev||"")+(a.ord?" ("+a.ord+")":"")]));
  const buf=await wb.xlsx.writeBuffer();await DLX.save({filename:"Fehlende_Artikel_"+new Date().toISOString().slice(0,10)+".xlsx",data:new Blob([buf],{type:"application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"})})}catch(e){errBox("Excel konnte nicht erstellt werden.")}}}

/* Betreff und Text für den Mailversand */
function rMailSubj(r){return "Retourschein "+r.ev+(r.ord?" – Auftragsnummer "+r.ord:"")}
function rMailBody(r){const it=rIt(r),n=Object.keys(it).length,st=r.closed?"Abgeschlossen":"In Bearbeitung";
 return "Hallo,\n\nanbei der Retourschein für folgende Veranstaltung:\n\nVeranstaltung: "+r.ev+"\nAuftragsnummer: "+(r.ord||"–")+"\nStatus: "+st+"\nPositionen: "+n+" ("+rTot(it)+" Stück)"+(r.rem?"\nBemerkungen: "+r.rem:"")+"\n\nDie vollständige Liste ist als Excel-Datei im Anhang.\n\nLiebe Grüße\n"+meName()}

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

/* ===== Mehrere Personen an einem Retourschein =====
   Jede Person speichert nur ihren eigenen Anteil im Feld pa_<Benutzer-ID> (JSON wie itemsJson, Mengen dürfen negativ sein = Korrektur).
   itemsJson bleibt der Grundstand (ältere Scheine). Angezeigt wird Grundstand + alle Anteile.
   Die Datenbank führt Felder per doc_update zusammen, darum überschreibt niemand den Anteil eines anderen.
   ed_<Benutzer-ID> = Zeitstempel "arbeitet gerade daran". */
function rJ(x){try{return JSON.parse(x||"{}")||{}}catch(e){return{}}}
function rCp(o){return JSON.parse(JSON.stringify(o||{}))}
function rAddTo(t,src){Object.keys(src||{}).forEach(k=>{const x=src[k];if(!x||typeof x!=="object")return;if(!t[k])t[k]={...x,q:0};else{const q=t[k].q;Object.assign(t[k],x);t[k].q=q}t[k].q+=(+x.q||0)})}
function rPos(t){const o={};Object.keys(t).forEach(k=>{if(t[k].q>0)o[k]=t[k]});return o}
function rView(r){const t={};r._base=r.itemsJson||"{}";rAddTo(t,rJ(r._base));Object.keys(r).forEach(k=>{if(k.startsWith("pa_"))rAddTo(t,rJ(r[k]))});Object.values(t).forEach(x=>{if(x.g==="Händisch")x.g="Manuell"});r.itemsJson=JSON.stringify(rPos(t));return r}
function rOthers(r){const t={};rAddTo(t,rJ(r._base));Object.keys(r).forEach(k=>{if(k.startsWith("pa_")&&k!=="pa_"+me)rAddTo(t,rJ(r[k]))});return t}
function rEd(r){const it=rIt(r);return{id:r.id,ev:r.ev,ord:r.ord||"",items:it,rem:r.rem||"",mine:rJ(r["pa_"+me]),view:rCp(it),h0:{ev:r.ev||"",ord:r.ord||"",rem:r.rem||""}}}
/* eigene Änderungen seit dem letzten Abgleich in den eigenen Anteil übernehmen */
function rFold(){if(!rs)return;if(!rs.mine)rs.mine={};if(!rs.view)rs.view={};const ks=new Set([...Object.keys(rs.items||{}),...Object.keys(rs.view)]);
 ks.forEach(k=>{const a=rs.items[k],b=rs.view[k],d=(a?+a.q||0:0)-(b?+b.q||0:0);if(!d)return;const m={...(rs.mine[k]||{}),...(a||b)};rLogPush(k,a||b,d);m.q=(rs.mine[k]?+rs.mine[k].q||0:0)+d;if(m.q)rs.mine[k]=m;else delete rs.mine[k]});
 rs.view=rCp(rs.items)}
/* Änderungen anderer in den offenen Schein übernehmen */
function rRemote(){if(!rs||!rs.id)return;const r=rets.find(x=>x.id===rs.id);if(!r)return;rFold();const t=rOthers(r);rAddTo(t,rs.mine);rs.items=rPos(t);rs.view=rCp(rs.items);
 if(rs.h0)["ev","ord","rem"].forEach(f=>{const loc=String(rs[f]||""),rem=String(r[f]||"");if(loc===String(rs.h0[f]||"")&&rem!==loc)rs[f]=rem});
 rs.h0={ev:r.ev||"",ord:r.ord||"",rem:r.rem||""}}
/* Hinweis: wer arbeitet gerade noch an diesem Schein */
function rWhoL(r){const n=Date.now();return r?Object.keys(r).filter(k=>k.startsWith("ed_")&&k!=="ed_"+me&&n-(+r[k]||0)<90000).map(k=>r["edn_"+k.slice(3)]?shortName(r["edn_"+k.slice(3)])+" (Tablet)":nm(k.slice(3))):[]}
function rWho(){const L=rWhoL(rs&&rs.id&&rets.find(x=>x.id===rs.id));return L.length?'<div class="rwho"><svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="9" cy="8" r="3.5"/><path d="M2.5 20c.6-3.6 3.3-5.5 6.5-5.5s5.9 1.9 6.5 5.5"/><circle cx="17" cy="9" r="2.8"/><path d="M17 14.5c2.5.2 4.1 1.9 4.5 5"/></svg><span>'+esc(L.join(", "))+(L.length>1?" arbeiten":" arbeitet")+' gerade auch an diesem Schein. Eure Mengen werden zusammengezählt.</span></div>':""}
let rHbId=null,rHbLast=0;
function rHb(){const id=rs&&rs.id&&view==="retedit"&&document.visibilityState==="visible"&&rets.find(x=>x.id===rs.id)?rs.id:null;
 if(rHbId&&rHbId!==id){db.doc("retour/"+rHbId).update({["ed_"+me]:0}).catch(()=>{});rHbLast=0}
 if(id&&(id!==rHbId||Date.now()-rHbLast>30000)){rHbLast=Date.now();db.doc("retour/"+id).update({["ed_"+me]:Date.now(),...(tabOn()&&TAB.act?{["edn_"+me]:TAB.act.name}:{})}).catch(()=>{})}
 rHbId=id}
setInterval(()=>{if(typeof db!=="undefined"&&db&&me)rHb()},4000);
document.addEventListener("visibilitychange",()=>{if(typeof db!=="undefined"&&db&&me)rHb()});

/* Signalton beim Scannen und Artikelname im grünen Feld */
let ACX=null;
function audioUnlock(){try{if(!ACX){const C=window.AudioContext||window.webkitAudioContext;if(C)ACX=new C()}if(ACX&&ACX.state==="suspended")ACX.resume();if(ACX){const o=ACX.createOscillator(),g=ACX.createGain();g.gain.value=0;o.connect(g).connect(ACX.destination);o.start();o.stop(ACX.currentTime+.01)}}catch(e){}}
/* Tonauswahl: [Frequenz, Start, Dauer, Wellenform, Lautstärke, Ziel-Frequenz (Gleiten), ausklingen] */
const SND={ok:[
 {id:"piep",n:"Piep",t:[[1320,0,.12,"sine",.35]]},
 {id:"kasse",n:"Kassen-Piep",t:[[2400,0,.09,"square",.12]]},
 {id:"doppel",n:"Doppel-Piep",t:[[1500,0,.07,"sine",.35],[1500,.11,.07,"sine",.35]]},
 {id:"glocke",n:"Glocke",t:[[1760,0,.7,"sine",.32,0,1],[3520,0,.35,"sine",.08,0,1]]},
 {id:"dingdong",n:"Ding-Dong",t:[[1047,0,.3,"sine",.32,0,1],[784,.24,.45,"sine",.32,0,1]]},
 {id:"auf",n:"Aufwärts",t:[[880,0,.08,"sine",.3],[1320,.09,.12,"sine",.3]]}],
 err:[
 {id:"summer",n:"Doppelton",t:[[330,0,.18,"square",.18],[220,.22,.28,"square",.18]]},
 {id:"brumm",n:"Brummen",t:[[110,0,.5,"sawtooth",.22]]},
 {id:"hupe",n:"Hupe",t:[[400,0,.4,"square",.13],[505,0,.4,"square",.1]]},
 {id:"drei",n:"Dreifach-Piep",t:[[880,0,.09,"square",.15],[880,.15,.09,"square",.15],[880,.3,.09,"square",.15]]},
 {id:"ab",n:"Abwärts",t:[[620,0,.5,"triangle",.32,150]]},
 {id:"rattern",n:"Rattern",t:[[200,0,.06,"square",.18],[200,.09,.06,"square",.18],[200,.18,.06,"square",.18],[200,.27,.06,"square",.18]]}]};
function sndSel(ok){const L=SND[ok?"ok":"err"];let v=null;try{v=localStorage.getItem("tpc_snd_"+(ok?"ok":"err"))}catch(e){}return L.find(x=>x.id===v)||L[0]}
function sndSet(ok,id){try{localStorage.setItem("tpc_snd_"+(ok?"ok":"err"),id)}catch(e){}}
function sndPlay(tones){try{if(!ACX)return;if(ACX.state==="suspended")ACX.resume();const t=ACX.currentTime+.01;
 tones.forEach(([f,s,d,w,v,f2,dec])=>{const o=ACX.createOscillator(),g=ACX.createGain();o.type=w;o.frequency.setValueAtTime(f,t+s);if(f2)o.frequency.exponentialRampToValueAtTime(f2,t+s+d);
  g.gain.setValueAtTime(0,t+s);g.gain.linearRampToValueAtTime(v,t+s+.01);if(dec){g.gain.exponentialRampToValueAtTime(.001,t+s+d)}else{g.gain.setValueAtTime(v,t+s+d-.03);g.gain.linearRampToValueAtTime(0,t+s+d)}
  o.connect(g).connect(ACX.destination);o.start(t+s);o.stop(t+s+d+.02)})}catch(e){}}
function beep(ok){try{if(navigator.vibrate&&pref("vib"))navigator.vibrate(ok?60:[120,80,120]);if(!ACX||!pref("snd"))return;sndPlay(sndSel(ok).t)}catch(e){}}
function sndBlock(){const grp=(ok,t)=>'<div class="sndg"><div class="mute" style="margin:8px 0 6px;font-weight:600">'+t+'</div><div class="sndl">'+SND[ok?"ok":"err"].map((x,i)=>'<button type="button" class="sndb'+(sndSel(ok).id===x.id?' on':'')+'" data-sok="'+(ok?1:0)+'" data-sid="'+x.id+'"><span class="sndp">▶</span>'+x.n+(i?'':' <small>Standard</small>')+'</button>').join("")+'</div></div>';
 return '<div class="card" style="margin-bottom:8px"><b>Töne auswählen</b><span class="mute" style="display:block;font-size:13px">Antippen spielt den Ton und wählt ihn aus.</span>'+grp(true,"Bei richtig erkanntem Artikel")+grp(false,"Bei Fehler")+'</div>'}
function sndBind(){document.querySelectorAll("[data-sid]").forEach(b=>b.onclick=()=>{const ok=b.dataset.sok==="1";audioUnlock();sndSet(ok,b.dataset.sid);sndPlay(sndSel(ok).t);document.querySelectorAll('[data-sok="'+b.dataset.sok+'"]').forEach(x=>x.classList.toggle("on",x===b))})}
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
 const scanOnly=[];
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
  try{await db.doc("rkat/"+k).set(doc);let c=NR;if(/^\d{1,3}$/.test(c))c=c.padStart(4,"0");o.remove();toast("Gespeichert",1);alBody()}catch(e){errBox("Speichern fehlgeschlagen. Bitte nochmal versuchen.")}};
 if(g("edl"))g("edl").onclick=()=>ask("Artikel „"+a.name+"“ wirklich löschen?",async()=>{try{await db.doc("rkat/"+a._k).delete();o.remove();toast("Gelöscht",1);alBody()}catch(e){errBox("Löschen fehlgeschlagen.")}})}

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

/* ===== Titel und Rechte =====
   docs 'titel': {name, o (Reihenfolge), r:{Recht:true}}   docs 'rolle' (id = Benutzer-ID): {t: Titel-ID, x:{Extra-Rechte}}
   Rechte: def_/ret_/inf_ + s (sehen) b (bearbeiten) l (löschen); v_user, v_rights, v_app. Der Admin darf immer alles.
   Die Datenbank prüft dieselben Rechte (rechte.sql). */
const RK=["jv_s","pk_s","pk_b","pk_l","mat_b","mat_l","def_s","def_b","def_l","ret_s","ret_b","ret_l","inf_s","inf_b","inf_l","v_user","v_rights","v_app"];
const RMAT=[["mat_b","Abschließen / Wieder öffnen"],["mat_l","Löschen"]];
const RAREA=[["def","Defekte","Alle Defekte, nicht nur die eigenen"],["ret","Retourscheine",""],["pk","Packlisten","Sehen = ansehen und herrichten"],["inf","Infos an das Lager",""]],RLVL=[["s","Sehen"],["b","Bearbeiten"],["l","Löschen"]];
const rLv=(a,l,t)=>a==="pk"&&l==="b"?"Hochladen":t;
const RVW=[["v_user","Benutzer freigeben/sperren"],["v_rights","Titel und Rechte"],["v_app","App-Verwaltung (inkl. Artikelliste)"]];
let TIT={},ROL={},rkLast=null,rxOpen=new Set(),tOpen=new Set();
function rSum(r){r=rNormR(r);const jv=r.jv_s?["Jarvis"]:[];const mt=RMAT.filter(([k])=>r[k]).map(([,t])=>t.toLowerCase());const L=jv.concat(mt.length?["Materialliste: "+mt.join(", ")]:[]).concat(RAREA.map(([a,n])=>{const l=RLVL.filter(([x])=>r[a+"_"+x]).map(([x,t])=>rLv(a,x,t).toLowerCase());return l.length?n+": "+l.join(", "):""})).filter(Boolean),v=RVW.filter(([k])=>r[k]).map(([,t])=>t);if(v.length)L.push("Verwaltung: "+v.join(", "));return L.length?L.join(" · "):"Nur Grundfunktionen"}
function rNormR(o){o=o||{};const r={};RK.forEach(k=>{if(o[k]===true)r[k]=true});["def","ret","inf","pk"].forEach(a=>{if(r[a+"_b"]||r[a+"_l"])r[a+"_s"]=true});return r}
function uRights(uid){const x=ROL[uid]||{},t=TIT[x.t]||{};return rNormR({...(t.r||{}),...Object.fromEntries(Object.entries(x.x||{}).filter(([,v])=>v===true))})}
/* Solange die Datenbank-Änderung (rechte.sql) fehlt, gibt es keine Titel: dann gelten die alten Häkchen Werkstatt/Lager */
const rightsReady=()=>Object.keys(TIT).length>0;
/* Materialliste-Recht: solange noch kein Titel mat_* hat (Datenbank-Update fehlt), gilt wie früher Defekte-Bearbeiten fürs Abschließen */
const matReady=()=>Object.values(TIT).some(t=>t.r&&(t.r.mat_b||t.r.mat_l))||Object.values(ROL).some(x=>x.x&&(x.x.mat_b||x.x.mat_l));
function can(k){if(owner)return true;if(k.startsWith("mat_")&&!matReady())return k==="mat_b"&&can("def_b");if(!rightsReady()){if(k.startsWith("def_"))return k!=="def_l"&&!!werk[me];if(k.startsWith("ret_"))return !!lagr[me];return false}return !!uRights(me)[k]}
function rightsSub(){packSub();db.collection("titel").onSnapshot(s=>{TIT={};s.docs.forEach(d=>TIT[d.id]=d.data());rightsChanged()});db.collection("rolle").onSnapshot(s=>{ROL={};s.docs.forEach(d=>ROL[d.id]=d.data());rightsChanged()})}
function rightsChanged(){const k=JSON.stringify(uRights(me));if(rkLast!==null&&k!==rkLast&&!owner)DBX.reloadAll();rkLast=k;draw();tabCheck()}
const titList=()=>Object.keys(TIT).map(id=>({id,...TIT[id]})).sort((a,b)=>(a.o||0)-(b.o||0)||String(a.name).localeCompare(String(b.name),"de"));
/* Retourschein: Knöpfe ohne Recht ausblenden */
function rLock(){if(!can("ret_b"))document.querySelectorAll('#radd,#red,#rclose,#rreo,#rhed,#rphadd,#rmail,#rscan,[data-rv="new"],.rph .thx').forEach(e=>e.remove());if(!can("ret_l")){const d=$("#rdel");if(d)d.remove()}}
/* Info löschen (Recht "Infos an das Lager – Löschen") */
function infoDelBtn(i){if(!can("inf_l")||$("#idel"))return;$("#app").insertAdjacentHTML("beforeend",'<button class="btn ghost" id="idel" style="color:var(--bad);margin-top:8px">Nachricht löschen</button>');
 $("#idel").onclick=()=>ask("Nachricht wirklich löschen?",async()=>{try{await db.doc("infos/"+i.id).delete();for(let k=0;k<(i.fn||0);k++){try{await db.doc("fotos/"+i.id+"-"+k).delete()}catch(e){}}view="info";hist=hist.filter(v=>v!=="infoopen");draw();toast("Nachricht gelöscht",1)}catch(e){errBox("Löschen fehlgeschlagen.")}})}
/* Kästchen-Raster: cur = eigene Häkchen, inh = vom Titel geerbt (grau, nicht änderbar) */
function rMx(cur,inh,attr){cur=cur||{};inh=inh||{};const cb=(k,l)=>{const i=!!inh[k],c=i||!!cur[k];return '<label class="rmc'+(i?' inh':'')+'"><input type="checkbox" '+attr+' data-k="'+k+'"'+(c?' checked':'')+(i?' disabled':'')+'><span>'+l+'</span></label>'};
 return '<div class="rmx"><div class="rmr"><div class="rmh"><b>Jarvis</b><small>Briefing und Übersicht (zeigt nur, was die Person sehen darf)</small></div><div class="rml">'+cb("jv_s","Sehen")+'</div></div><div class="rmr"><div class="rmh"><b>Materialliste</b><small>Erstellen und scannen darf jeder</small></div><div class="rml rmm">'+RMAT.map(([k,t])=>cb(k,t)).join("")+'</div></div>'+RAREA.map(([a,n,h])=>'<div class="rmr"><div class="rmh"><b>'+n+'</b>'+(h?'<small>'+h+'</small>':'')+'</div><div class="rml">'+RLVL.map(([l,t])=>cb(a+"_"+l,rLv(a,l,t))).join("")+'</div></div>').join("")+'<div class="rmr"><div class="rmh"><b>Verwaltung</b></div><div class="rml rmv">'+RVW.map(([k,t])=>cb(k,t)).join("")+'</div></div></div>'}
/* Häkchen lesen + Regeln: Bearbeiten/Löschen schließt Sehen ein, ohne Sehen kein Bearbeiten/Löschen */
function rMxRead(box,changed){const g=k=>box.querySelector('[data-k="'+k+'"]');const k=changed&&changed.dataset.k;
 if(k){const [a,l]=k.split("_");if(["def","ret","inf","pk"].includes(a)){if((l==="b"||l==="l")&&changed.checked){const s=g(a+"_s");if(s&&!s.disabled)s.checked=true}if(l==="s"&&!changed.checked)["b","l"].forEach(x=>{const e=g(a+"_"+x);if(e&&!e.disabled)e.checked=false})}}
 const o={};box.querySelectorAll("[data-k]").forEach(c=>{if(c.checked&&!c.disabled)o[c.dataset.k]=true});return o}
function tDlg(title,val,ok){const o=document.createElement("div");o.className="ov";o.innerHTML='<div class="card" style="width:100%;max-width:380px;margin:0"><b>'+esc(title)+'</b><div style="height:8px"></div><input id="tdn" maxlength="40" autocomplete="off"><div class="row"><button class="btn ghost" id="tdc">Abbrechen</button><button class="btn" id="tdo">Speichern</button></div></div>';
 document.body.appendChild(o);const i=o.querySelector("#tdn");i.value=val||"";o.querySelector("#tdc").onclick=()=>o.remove();o.querySelector("#tdo").onclick=()=>{const v=i.value.trim().replace(/\s+/g," ");if(!v){i.classList.add("bad");return}o.remove();ok(v)};setTimeout(()=>i.focus(),60)}
async function rSave(fn,msg){try{await fn();toast(msg||"Gespeichert",1)}catch(e){console.error(e);errBox("Speichern fehlgeschlagen. Hast du das Recht dazu?")}}
function rightsBlock(){if(!rightsReady()){$("#app").insertAdjacentHTML("beforeend",'<div class="card" style="border-color:#f2c200;margin-top:14px"><b>Datenbank-Update fehlt</b><p class="mute" style="margin:4px 0 0">Für Titel und Rechte muss einmal die Datei rechte.sql in Supabase ausgeführt werden. Bis dahin gelten die alten Häkchen.</p></div>');return permBlock()}const T=titList(),U=PROFS.filter(p=>p.active).sort((a,b)=>String(a.name).localeCompare(String(b.name),"de"));
 const opt=sel=>'<option value="">– kein Titel –</option>'+T.map(t=>'<option value="'+esc(t.id)+'"'+(t.id===sel?' selected':'')+'>'+esc(t.name)+'</option>').join("");
 $("#app").insertAdjacentHTML("beforeend",'<h3 style="margin:18px 0 4px">Titel der Benutzer</h3><p class="mute" style="margin:0 0 8px">Der Titel bestimmt die Rechte. Unter „Extra-Rechte“ kannst du einer Person zusätzlich etwas erlauben. Administratoren dürfen immer alles.</p>'+
  U.map(p=>{const x=ROL[p.id]||{},adm=p.role==="admin",t=TIT[x.t],xr=rNormR(x.x),nx=Object.keys(xr).length;
   return '<div class="card ttl"><div class="fl" style="flex-wrap:wrap"><div style="min-width:0;flex:1"><b>'+esc(p.name||"Ohne Namen")+'</b>'+(p.id===me?' <span class="mute">(du)</span>':'')+(adm?' <span class="tag">Admin</span>':'')+'</div>'+(adm?'<span class="mute" style="font-size:14px">darf immer alles</span>':'<select class="tsel" data-ut="'+p.id+'">'+opt(x.t||"")+'</select>')+'</div>'+
   (adm?'':'<details class="rxd" data-xu="'+p.id+'"'+(rxOpen.has(p.id)?' open':'')+'><summary>Extra-Rechte'+(nx?' <span class="rxn">'+nx+'</span>':'')+'</summary><div data-xbox="'+p.id+'">'+rMx(xr,t?rNormR(t.r):{},'data-xc="'+p.id+'"')+'</div><p class="mute" style="font-size:12px;margin:6px 0 0">Grau = kommt schon vom Titel'+(t?' „'+esc(t.name)+'“':'')+'.</p></details>')+
   '<div class="tabopt"><label><input type="checkbox" data-tl="'+p.id+'"'+(x.tl===true?' checked':'')+'> am Lager-Tablet <small>(Namenskachel)</small></label>'+(adm?'':'<label><input type="checkbox" data-tab="'+p.id+'"'+(x.tab===true?' checked':'')+'> Gemeinsames Gerät (Lager-Tablet) <small>fragt beim Start, wer arbeitet</small></label>')+'</div></div>'}).join("")+
  '<h3 style="margin:22px 0 4px">Titel und ihre Rechte</h3><p class="mute" style="margin:0 0 8px">Titel antippen, um seine Rechte zu ändern. Gilt sofort für alle mit diesem Titel. Materiallisten erstellen und scannen, eigene Defekte melden und Infos ans Lager schicken darf jeder.</p>'+
  T.map(t=>{const n=Object.values(ROL).filter(x=>x.t===t.id).length;return '<details class="card ttl tdet" data-tbox="'+esc(t.id)+'"'+(tOpen.has(t.id)?' open':'')+'><summary><div class="fl"><b style="font-size:17px">'+esc(t.name)+'</b><span class="mute" style="font-size:13px;white-space:nowrap">'+(n===1?"1 Person":n+" Personen")+'</span></div><div class="mute tsum">'+esc(rSum(t.r))+'</div></summary>'+rMx(rNormR(t.r),{},'data-tc="'+esc(t.id)+'"')+'<div class="ubt" style="margin-top:10px"><button class="btn ghost s" data-tren="'+esc(t.id)+'">Umbenennen</button><button class="btn ghost s" data-tdel="'+esc(t.id)+'" style="color:var(--bad)">Titel löschen</button></div></details>'}).join("")+
  '<button class="mbtn" id="tnew" type="button">+ Neuer Titel</button>');
 document.querySelectorAll("[data-ut]").forEach(sel=>sel.onchange=()=>{const id=sel.dataset.ut,v=sel.value;rSave(()=>ROL[id]?db.doc("rolle/"+id).update({t:v}):db.doc("rolle/"+id).set({t:v,x:{}}),"Titel gespeichert")});
 document.querySelectorAll("details[data-xu]").forEach(d=>d.ontoggle=()=>{d.open?rxOpen.add(d.dataset.xu):rxOpen.delete(d.dataset.xu)});
 document.querySelectorAll("details[data-tbox]").forEach(d=>d.ontoggle=()=>{d.open?tOpen.add(d.dataset.tbox):tOpen.delete(d.dataset.tbox)});
 document.querySelectorAll("[data-tl],[data-tab]").forEach(c=>c.onchange=()=>{const id=c.dataset.tl||c.dataset.tab,k=c.dataset.tl?"tl":"tab",v=c.checked;rSave(()=>ROL[id]?db.doc("rolle/"+id).update({[k]:v}):db.doc("rolle/"+id).set({t:"",x:{},[k]:v}),k==="tab"?(v?"Als Lager-Tablet markiert":"Kein Lager-Tablet mehr"):(v?"Kachel am Lager-Tablet an":"Kachel am Lager-Tablet aus"))});
 document.querySelectorAll("[data-xc]").forEach(c=>c.onchange=()=>{const id=c.dataset.xc,box=document.querySelector('[data-xbox="'+id+'"]'),x=rMxRead(box,c);rSave(()=>ROL[id]?db.doc("rolle/"+id).update({x}):db.doc("rolle/"+id).set({t:"",x}))});
 document.querySelectorAll("[data-tc]").forEach(c=>c.onchange=()=>{const id=c.dataset.tc,box=document.querySelector('[data-tbox="'+id+'"]'),r=rMxRead(box,c);rSave(()=>db.doc("titel/"+id).update({r}))});
 document.querySelectorAll("[data-tren]").forEach(b=>b.onclick=()=>{const id=b.dataset.tren;tDlg("Titel umbenennen",TIT[id]&&TIT[id].name,v=>rSave(()=>db.doc("titel/"+id).update({name:v})))});
 document.querySelectorAll("[data-tdel]").forEach(b=>b.onclick=()=>{const id=b.dataset.tdel,t=TIT[id];if(!t)return;const us=Object.keys(ROL).filter(u=>ROL[u].t===id);
  ask("Titel „"+t.name+"“ löschen?"+(us.length?" "+us.length+(us.length===1?" Person verliert":" Personen verlieren")+" damit den Titel und seine Rechte.":""),()=>rSave(async()=>{for(const u of us)await db.doc("rolle/"+u).update({t:""});await db.doc("titel/"+id).delete()},"Titel gelöscht"))});
 $("#tnew").onclick=()=>tDlg("Neuer Titel","",v=>{const o=Math.max(0,...titList().map(t=>t.o||0))+1,id="t"+Date.now().toString(36);tOpen.add(id);rSave(()=>db.doc("titel/"+id).set({name:v,o,r:{}}),"Titel angelegt")})}

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
