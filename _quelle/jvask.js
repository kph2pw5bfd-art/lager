/* ===== Frag Jarvis (ab 1.68) – feste Fragen ohne KI =====
   Mikrofon (Spracherkennung des Browsers) oder Eingabefeld. Stichwort-Erkennung, Antworten aus den Daten der App
   (nur was die Person sehen darf). Antwort als Text + gesprochen (eingestellte Stimme/Sprechart), Knöpfe zum Öffnen. */
let jvMode="brief",jvRec=null,jvRecOn=false,jvLast=null,jvMicDead=false;
const jvIOS=/iPad|iPhone|iPod/.test(navigator.userAgent)||(navigator.platform==="MacIntel"&&navigator.maxTouchPoints>1);
/* Antworten vorlesen an/aus (pro Gerät) */
const jvReadOn=()=>jvLS("tpc_jv_askread")!=="0";
const JV_STOP=new Set("wo ist sind die der das den dem des ein eine einen artikel gerade eigentlich denn noch bitte mal jarvis hey zeig zeige mir mich uns was mit auftrag auftragsnummer packliste veranstaltung ist's gibt es vom von".split(" "));
const jvNorm=s=>String(s||"").toLowerCase().replace(/[„“”"'!?.,;:()]/g," ").replace(/\s+/g," ").trim();
const jvToks=s=>jvNorm(s).split(" ").filter(w=>w&&!JV_STOP.has(w));
const jvF=()=>jvStyle()==="frech";
const jvStk=n=>(String(n).replace(".",","))+(n===1?" Stück":" Stück");
function jvAskHtml(){return '<div class="jvask"><div class="jvaskrow">'+
 '<button class="jvmic" id="jvmic" type="button" aria-label="Frage sprechen" hidden><svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true"><rect x="9" y="3" width="6" height="11" rx="3"/><path d="M5 11a7 7 0 0 0 14 0M12 18v3"/></svg></button>'+
 '<input id="jvaq" type="search" enterkeyhint="send" autocomplete="off" placeholder="Frag mich … z. B. „Hilfe“" aria-label="Frage an den Lager Assistenten">'+
 '<button class="jvgo" id="jvgo" type="button">Fragen</button></div><div class="jvms" id="jvms" aria-live="polite"></div><div class="jvans" id="jvans" aria-live="polite"></div></div>'}
function jvAskBind(){const q=$("#jvaq"),go=()=>{const v=q.value.trim();if(v)jvAsk(v)};$("#jvgo").onclick=go;q.onkeydown=e=>{if(e.key==="Enter"){e.preventDefault();go()}};
 const SR=window.SpeechRecognition||window.webkitSpeechRecognition,mb=$("#jvmic");if(SR&&mb){mb.hidden=false;mb.onclick=()=>jvListen(SR)}
 if(jvLast)jvShow(jvLast,false)}
/* Zuhören. iPhone/Safari gibt die Erkennung nach einem Ergebnis oft nicht frei (kein onend) -> eine zweite Frage ging erst nach
   Neustart. Darum: alte Erkennung immer hart beenden (abort), nach dem Endergebnis selbst stoppen, Frage erst nach dem Ende
   (oder spätestens nach 1,2 s) stellen, bei "läuft noch" einmal neu versuchen. */
let jvRecTxt="",jvRecT=null;
function jvRecUi(on){const mb=$("#jvmic"),q=$("#jvaq");if(mb)mb.classList.toggle("on",on);if(q)q.placeholder=on?"Ich höre zu …":"Frag mich … z. B. „Hilfe“"}
function jvRecKill(){const r=jvRec;jvRec=null;jvRecOn=false;clearTimeout(jvRecT);if(r){r.onresult=r.onerror=r.onend=null;try{r.abort()}catch(e){}}}
function jvRecDone(){if(!jvRecOn&&!jvRecTxt)return;const t=jvRecTxt.trim();jvRecTxt="";jvRecKill();jvRecUi(false);jvAudioBack();jvMs("");if(t)setTimeout(()=>jvAsk(t),150)}
let jvRecUsed=false;const jvRecGot=()=>{jvRecUsed=true};
/* Status-Zeile unter dem Eingabefeld: was das Mikrofon meldet (zur Fehlersuche am iPhone) */
function jvMs(t){const m=$("#jvms");if(m)m.textContent=t||""}
/* Ton freigeben, bevor das Mikrofon startet: iPhone blockiert das Mikrofon, solange noch ein Audio-Element "spielt" oder geladen ist */
function jvFreeAudio(){try{speechSynthesis.cancel()}catch(e){}if(jvAud){try{jvAud.pause();jvAud.removeAttribute("src");jvAud.load()}catch(e){}}
 try{if(navigator.audioSession)navigator.audioSession.type="play-and-record"}catch(e){}}
function jvAudioBack(){try{if(navigator.audioSession)navigator.audioSession.type="auto"}catch(e){}}
function jvKbdMic(){const q=$("#jvaq");if(q){q.value="";q.focus()}jvMs("Am iPhone geht das Mikrofon der App nur einmal pro Start. Jetzt auf der Tastatur das Mikrofon (unten rechts) antippen, sprechen, dann „Fragen“.")}
function jvListen(SR){if(jvIOS&&jvMicDead&&!jvRecOn)return jvKbdMic();if(jvRecOn){if(jvRecTxt)return jvRecDone();jvRecKill();jvRecUi(false);jvMs("");return}
 jvSpeaking=false;jvTalk(false);jvFreeAudio();jvRecKill();
 /* start() muss direkt im Antippen passieren (iPhone) – kein verzögerter zweiter Versuch, sondern sofort mit neuer Erkennung */
 const mk=()=>{const r=new SR();r.lang="de-AT";r.interimResults=true;r.continuous=false;r.maxAlternatives=1;return r};
 let r,err="";for(let i=0;i<2&&!r;i++){try{const x=mk();x.start();r=x}catch(e){err=(e&&(e.name||e.message))||"Fehler";jvRecKill()}}
 if(!r){jvRecUi(false);jvAudioBack();jvMs("Mikrofon startet nicht ("+err+"). Bitte die Frage eintippen.");return}
 jvRec=r;jvRecTxt="";jvRecOn=true;jvRecUi(true);jvMs("Ich höre zu …");const q=$("#jvaq");if(q)q.value="";
 const off=()=>{jvRecUi(false);jvAudioBack()};
 r.onaudiostart=()=>{if(jvRec===r)jvMs("Mikrofon an – sprich jetzt.")};
 r.onresult=e=>{if(jvRec!==r)return;let t="",fin=false;for(const x of e.results){t+=x[0].transcript;if(x.isFinal)fin=true}jvRecTxt=t;if(q)q.value=t;
  if(fin){jvRecGot();try{r.stop()}catch(x){}clearTimeout(jvRecT);jvRecT=setTimeout(jvRecDone,1200)}};
 r.onerror=e=>{if(jvRec!==r)return;const er=(e&&e.error)||"unbekannt";const t=jvRecTxt;jvRecKill();off();if(t){jvMs("");return setTimeout(()=>jvAsk(t),150)}
  jvMs(er==="not-allowed"||er==="service-not-allowed"?"Mikrofon nicht erlaubt ("+er+"). Bitte in den Einstellungen erlauben oder eintippen.":er==="no-speech"?"Ich habe nichts gehört. Nochmal aufs Mikrofon tippen.":"Mikrofon-Fehler: "+er+". Bitte nochmal tippen oder eintippen.")};
 const dead=m=>{jvRecKill();off();if(jvIOS&&jvRecUsed){jvMicDead=true;jvMs("Das iPhone liefert dem Mikrofon der App keinen Ton mehr (geht nur einmal pro Start). Tippe nochmal aufs Mikrofon – dann nehmen wir das Tastatur-Mikrofon.")}else jvMs(m)};
 r.onend=()=>{if(jvRec!==r)return;if(jvRecTxt){jvMs("");jvRecGot();jvRecDone()}else dead("Mikrofon wurde beendet, ohne etwas zu hören. Nochmal tippen.")};
 jvRecT=setTimeout(()=>{if(jvRec===r&&!jvRecTxt)dead("Nichts gehört. Nochmal aufs Mikrofon tippen.")},12000)}
/* Antwort anzeigen + sprechen. A = {q, say:[Sätze], rows:[{l,r,pk?,ret?,cls?}], acts:[{l,fn}]} */
/* ---- Hilfen ---- */
const jvDayName=t=>{const d=pkDay(Date.now()),x=Math.round((t-d)/864e5);return x===0?"heute":x===1?"morgen":x===-1?"gestern":PK_WD[new Date(t).getDay()]+" "+pkDM(t)};
function jvPacksVisible(){return can("pk_s")?packs:[]}
function jvPkRow(p,extra){const g=pkProg(p);return{l:(p.ev||p.ord||"Packliste")+(p.ord?" · "+p.ord:""),r:extra||(g.fin?"hergerichtet ✓":g.d?g.d+"/"+g.n:"offen"),pk:p.id,cls:g.fin?"ok":g.d?"ok":"warn"}}
function jvFindPacks(q){const n=jvNorm(q),dig=(n.match(/\d{6,}/)||[""])[0],P=jvPacksVisible();
 if(dig){const L=P.filter(p=>pkDig(p.ord)===dig||pkDig(p.ord).startsWith(dig)||String(p.ps)===dig);if(L.length)return L}
 const T=jvToks(q).filter(w=>!/^\d+$/.test(w)||w.length>=3);if(!T.length)return[];
 return P.filter(p=>{const e=jvNorm(p.ev);return T.every(w=>e.includes(w))})}
function jvFindRets(q){if(!can("ret_s"))return[];const dig=(jvNorm(q).match(/\d{6,}/)||[""])[0];if(!dig)return[];return rets.filter(r=>pkDig(r.ord)===dig||pkDig(r.ord).startsWith(dig))}
function jvOrder(q,open){const L=jvFindPacks(q),R=jvFindRets(q);
 if(!L.length&&!R.length)return{say:[jvF()?"Zu diesem Auftrag finde ich nichts. Vielleicht noch nicht hochgeladen?":"Zu diesem Auftrag finde ich keine Packliste und keinen Retourschein."]};
 if(L.length>1)return{say:["Ich habe "+L.length+" passende Packlisten gefunden. Welche meinst du?"],rows:L.slice(0,8).map(p=>jvPkRow(p))};
 const p=L[0];if(open&&p){curPack=p.id;go("packopen");return{say:["Ich öffne "+(p.ev||"die Packliste")+"."],quiet:true}}
 if(!p){const r=R[0];if(open){curRet=r.id;go("retopen");return{say:["Ich öffne den Retourschein."],quiet:true}}return{say:["Retourschein "+(r.ev||"")+": "+(r.closed?"abgeschlossen.":"noch offen.")],rows:[{l:(r.ev||"")+" · "+(r.ord||""),r:r.closed?"abgeschlossen":"offen",ret:r.id}]}}
 const g=pkProg(p),s=pkState(p),RR=pkRets(p),say=[(p.ev||"Packliste")+", Auftrag "+(p.ord||"–")+"."];
 say.push(g.fin?"Hergerichtet.":g.d?g.d+" von "+g.n+" Positionen hergerichtet.":"Noch nicht hergerichtet.");
 say.push("Herrichten "+jvDayName(pkHDay(p))+", Dispo bis "+jvDayName(pkDay(p.de))+".");
 if(can("ret_s"))say.push(!RR.length?"Retourschein gibt es noch keinen.":RR.some(r=>r.closed)?"Die Retoure ist abgeschlossen.":"Ein Retourschein ist angefangen, aber noch offen.");
 if(s.k==="over")say.push(jvF()?"Und ja: Das ist überfällig.":"Die Retoure ist überfällig.");
 const KL=pkH(p).klar;if(KL&&KL.t)say.push("Mit dem Projektleiter geklärt, von "+nmA(KL,"by")+" am "+pkDM(KL.t)+".");
 if(typeof jvNotes==="function")jvNotes(p).forEach(x=>say.push("Notiz von "+nmA(x,"by")+": "+x.txt));
 const acts=[{l:"Packliste öffnen",fn:()=>{curPack=p.id;go("packopen")}}];RR.forEach(r=>acts.push({l:"Retourschein öffnen",fn:()=>{curRet=r.id;go("retopen")}}));
 return{say,acts}}
function jvHerr(q){if(!can("pk_s"))return{say:["Dafür brauchst du das Recht, Packlisten zu sehen."]};const n=jvNorm(q),t0=pkDay(Date.now());
 if(/nicht hergerichtet|liegen|teilweise|vergessen/.test(n)){const L=pkGroups().late.concat(pkZTasks().filter(z=>pkHDay(z)<t0&&!pkProg(z).fin));
  if(!L.length)return{say:[jvF()?"Nichts liegengeblieben. Vorbildlich.":"Es ist nichts liegengeblieben."]};
  return{say:[L.length===1?"Eine Packliste ist nicht fertig hergerichtet:":L.length+" Packlisten sind nicht fertig hergerichtet:"].concat(L.slice(0,4).map(p=>{const g=pkProg(p);return (p.ev||p.ord)+(g.d?", teilweise, "+g.d+" von "+g.n:", nicht angefangen")+"."})),rows:L.map(p=>jvPkRow(p,pkProg(p).d?"teilweise "+pkProg(p).d+"/"+pkProg(p).n:"nicht hergerichtet"))}}
 let a=t0,b=t0,lab="heute";const mon=pkMon(t0);
 if(/übermorgen/.test(n)){a=b=pkAddD(t0,2);lab="übermorgen"}else if(/morgen/.test(n)){a=b=pkAddD(t0,1);lab="morgen"}
 else if(/nächste woche/.test(n)){a=pkAddD(mon,7);b=pkAddD(mon,13);lab="nächste Woche"}else if(/diese woche|woche/.test(n)){a=t0;b=pkAddD(mon,6);lab="diese Woche"}
 const L=jvPacksVisible().filter(p=>pkState(p).k!=="done"&&pkHDay(p)>=a&&pkHDay(p)<=b).concat(pkZTasks().filter(z=>pkHDay(z)>=a&&pkHDay(z)<=b)).sort((x,y)=>pkHDay(x)-pkHDay(y));
 const open=L.filter(p=>!pkProg(p).fin);
 if(!L.length)return{say:[jvF()?jvPick(["Herrichten "+lab+": nichts. Verdächtig ruhig.","Für "+lab+" ist nichts herzurichten. Genieß es."]):"Für "+lab+" ist nichts herzurichten."]};
 const say=[(lab==="heute"?"Heute":lab.charAt(0).toUpperCase()+lab.slice(1))+" "+(L.length===1?"ist eine Packliste":"sind "+L.length+" Packlisten")+" dran"+(open.length<L.length?", "+(L.length-open.length)+" davon schon hergerichtet":"")+"."];
 open.slice(0,5).forEach(p=>{const g=pkProg(p);say.push((p.ev||p.ord)+(a!==b?", "+jvDayName(pkHDay(p)):"")+(g.d?", "+g.d+" von "+g.n+" fertig":"")+(pkF(p).length?", "+pkF(p).length+" mit Fremdmiete":"")+".")});
 return{say,rows:L.map(p=>jvPkRow(p,(a!==b?pkWd(pkHDay(p))+" · ":"")+(pkProg(p).fin?"✓":pkProg(p).d+"/"+pkProg(p).n)))}}
function jvBack(q){if(!can("pk_s"))return{say:["Dafür brauchst du das Recht, Packlisten zu sehen."]};const t=/morgen/.test(jvNorm(q))?pkAddD(pkDay(Date.now()),1):pkDay(Date.now()),lab=t===pkDay(Date.now())?"heute":"morgen";
 const L=jvPacksVisible().filter(p=>p.de&&pkDay(p.de)===t&&pkState(p).k!=="done");
 if(!L.length)return{say:["Zurück kommt "+lab+" laut Packlisten nichts."]};
 return{say:[(lab==="heute"?"Heute":"Morgen")+" sollte"+(L.length===1?"":"n")+" zurückkommen: "+jvList(L.map(p=>p.ev||p.ord))+"."].concat(jvF()?["Hoffentlich vollständig."]:[]),rows:L.map(p=>jvPkRow(p,"Dispo-Ende "+pkD(p.de).slice(-5)))}}
function jvOver(){if(!can("pk_s"))return{say:["Dafür brauchst du das Recht, Packlisten zu sehen."]};const L=pkGroups().over;
 if(!L.length)return{say:[jvF()?"Überfällig ist nichts. So soll's sein.":"Überfällig ist nichts."]};
 return{say:[L.length===1?"Eine Retoure ist überfällig:":L.length+" Retouren sind überfällig:"].concat(L.slice(0,4).map(p=>(p.ev||p.ord)+", Dispo-Ende "+jvDayName(pkDay(p.de))+".")),rows:L.map(p=>jvPkRow(p,"seit "+pkWd(p.de)))}}
function jvDef(q){const n=jvNorm(q),D=jvData();
 if(/repariert|wieder einsatz|fertig/.test(n)){if(!D.fixed.length)return{say:["Seit dem letzten Briefing wurde nichts repariert."]};return{say:[jvList(D.fixed.slice(0,5).map(d=>d.art))+(D.fixed.length===1?" ist":" sind")+" wieder einsatzbereit."],rows:D.fixed.map(d=>({l:d.art,r:"repariert",def:d.id}))}}
 const L=/dringend/.test(n)?D.od.filter(d=>d.urg):D.od;
 if(!L.length)return{say:[/dringend/.test(n)?"Dringende Defekte gibt es keine.":(jvF()?"Keine offenen Defekte. Entweder läuft alles, oder keiner hat's gemeldet.":"Es gibt keine offenen Defekte.")]};
 return{say:[(L.length===1?"Ein":jvCap(jvN(L.length)))+(/dringend/.test(n)?" dringende":"")+(L.length===1?(/dringend/.test(n)?"r Defekt ist":" Defekt ist"):" Defekte sind")+" offen"+(L.length<=3?": "+jvList(L.map(d=>d.art))+".":".")],rows:L.map(d=>({l:d.art+(d.ev?" · "+d.ev:""),r:d.urg?"dringend":"offen",cls:d.urg?"warn":"ok",def:d.id}))}}
