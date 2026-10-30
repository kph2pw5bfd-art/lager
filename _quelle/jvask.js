/* ===== Frag Jarvis (ab 1.68) – feste Fragen ohne KI =====
   Mikrofon (Spracherkennung des Browsers) oder Eingabefeld. Stichwort-Erkennung, Antworten aus den Daten der App
   (nur was die Person sehen darf). Antwort als Text + gesprochen (eingestellte Stimme/Sprechart), Knöpfe zum Öffnen. */
let jvMode="brief",jvRec=null,jvRecOn=false,jvLast=null;
const JV_STOP=new Set("wo ist sind die der das den dem des ein eine einen artikel gerade eigentlich denn noch bitte mal jarvis hey zeig zeige mir mich uns was mit auftrag auftragsnummer packliste veranstaltung ist's gibt es vom von".split(" "));
const jvNorm=s=>String(s||"").toLowerCase().replace(/[„“”"'!?.,;:()]/g," ").replace(/\s+/g," ").trim();
const jvToks=s=>jvNorm(s).split(" ").filter(w=>w&&!JV_STOP.has(w));
const jvF=()=>jvStyle()==="frech";
const jvStk=n=>(String(n).replace(".",","))+(n===1?" Stück":" Stück");
function jvAskHtml(){return '<div class="jvask"><div class="jvaskrow">'+
 '<button class="jvmic" id="jvmic" type="button" aria-label="Frag Jarvis per Sprache" hidden><svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true"><rect x="9" y="3" width="6" height="11" rx="3"/><path d="M5 11a7 7 0 0 0 14 0M12 18v3"/></svg></button>'+
 '<input id="jvaq" type="search" enterkeyhint="send" autocomplete="off" placeholder="Frag Jarvis … z. B. „Hilfe“" aria-label="Frage an Jarvis">'+
 '<button class="jvbtn jvgo" id="jvgo" type="button">Fragen</button></div><div class="jvans" id="jvans" aria-live="polite"></div></div>'}
function jvAskBind(){const q=$("#jvaq"),go=()=>{const v=q.value.trim();if(v)jvAsk(v)};$("#jvgo").onclick=go;q.onkeydown=e=>{if(e.key==="Enter"){e.preventDefault();go()}};
 const SR=window.SpeechRecognition||window.webkitSpeechRecognition,mb=$("#jvmic");if(SR&&mb){mb.hidden=false;mb.onclick=()=>jvListen(SR)}
 if(jvLast)jvShow(jvLast,false)}
/* Zuhören. iPhone/Safari gibt die Erkennung nach einem Ergebnis oft nicht frei (kein onend) -> eine zweite Frage ging erst nach
   Neustart. Darum: alte Erkennung immer hart beenden (abort), nach dem Endergebnis selbst stoppen, Frage erst nach dem Ende
   (oder spätestens nach 1,2 s) stellen, bei "läuft noch" einmal neu versuchen. */
let jvRecTxt="",jvRecT=null;
function jvRecUi(on){const mb=$("#jvmic"),q=$("#jvaq");if(mb)mb.classList.toggle("on",on);if(q)q.placeholder=on?"Ich höre zu …":"Frag Jarvis … z. B. „Hilfe“"}
function jvRecKill(){const r=jvRec;jvRec=null;jvRecOn=false;clearTimeout(jvRecT);if(r){r.onresult=r.onerror=r.onend=null;try{r.abort()}catch(e){}}}
function jvRecDone(){if(!jvRecOn&&!jvRecTxt)return;const t=jvRecTxt.trim();jvRecTxt="";jvRecKill();jvRecUi(false);if(t)setTimeout(()=>jvAsk(t),150)}
function jvListen(SR,retry){if(jvRecOn){if(jvRecTxt)return jvRecDone();jvRecKill();jvRecUi(false);return}
 jvStop();jvRecKill();let r;try{r=new SR();r.lang="de-AT";r.interimResults=true;r.continuous=false;r.maxAlternatives=1}catch(e){return toast("Spracherkennung geht auf diesem Gerät nicht. Bitte die Frage eintippen.")}
 jvRec=r;jvRecTxt="";const q=$("#jvaq");if(q)q.value="";
 r.onresult=e=>{if(jvRec!==r)return;let t="",fin=false;for(const x of e.results){t+=x[0].transcript;if(x.isFinal)fin=true}jvRecTxt=t;if(q)q.value=t;
  if(fin){try{r.stop()}catch(x){}clearTimeout(jvRecT);jvRecT=setTimeout(jvRecDone,1200)}};
 r.onerror=e=>{if(jvRec!==r)return;const er=e&&e.error;const t=jvRecTxt;jvRecKill();jvRecUi(false);if(t)return setTimeout(()=>jvAsk(t),150);
  if(er==="not-allowed"||er==="service-not-allowed")toast("Bitte das Mikrofon für die App erlauben – oder die Frage eintippen.");
  else if(er==="no-speech")toast("Ich habe nichts gehört. Nochmal aufs Mikrofon tippen.",1)};
 r.onend=()=>{if(jvRec!==r)return;if(jvRecTxt)jvRecDone();else{jvRecKill();jvRecUi(false)}};
 try{r.start();jvRecOn=true;jvRecUi(true);jvRecT=setTimeout(()=>{if(jvRec===r&&!jvRecTxt){jvRecKill();jvRecUi(false)}},12000)}
 catch(e){jvRecKill();jvRecUi(false);if(!retry)setTimeout(()=>jvListen(SR,true),400);else toast("Das Mikrofon ist gerade belegt. Bitte kurz warten und nochmal tippen.",1)}}
/* Antwort anzeigen + sprechen. A = {q, say:[Sätze], rows:[{l,r,pk?,ret?,cls?}], acts:[{l,fn}]} */
function jvShow(A,speak){jvLast=A;const box=$("#jvans");if(!box)return;
 box.innerHTML='<div class="jvaq2">„'+esc(A.q)+'“</div><div class="jvat">'+A.say.map(esc).join(" ")+'</div>'+
  (A.rows&&A.rows.length?'<div class="jvarows">'+A.rows.map((r,i)=>'<button class="jvrow" type="button" data-ja="'+i+'"><span>'+esc(r.l)+'</span><span class="'+(r.cls||"ok")+'">'+esc(r.r||"")+'</span></button>').join("")+'</div>':'')+
  (A.acts&&A.acts.length?'<div class="jvacts">'+A.acts.map((a,i)=>'<button class="jvbtn" type="button" data-jact="'+i+'">'+esc(a.l)+'</button>').join("")+'</div>':'');
 box.querySelectorAll("[data-ja]").forEach(b=>b.onclick=()=>{const r=A.rows[+b.dataset.ja];if(r.pk){curPack=r.pk;go("packopen")}else if(r.ret){curRet=r.ret;go("retopen")}else if(r.def){curDef=r.def;go("defopen")}});
 box.querySelectorAll("[data-jact]").forEach(b=>b.onclick=()=>A.acts[+b.dataset.jact].fn());
 if(speak){jvMode="ask";jvSpeakLines(A.say.slice(0,6))}}
/* ---- Hilfen ---- */
const jvDayName=t=>{const d=pkDay(Date.now()),x=Math.round((t-d)/864e5);return x===0?"heute":x===1?"morgen":x===-1?"gestern":PK_WD[new Date(t).getDay()]+" "+pkDM(t)};
function jvPacksVisible(){return can("pk_s")?packs:[]}
function jvPkRow(p,extra){const g=pkProg(p);return{l:(p.ev||p.ord||"Packliste")+(p.ord?" · "+p.ord:""),r:extra||(g.fin?"hergerichtet ✓":g.d?g.d+"/"+g.n:"offen"),pk:p.id,cls:g.fin?"ok":g.d?"ok":"warn"}}
function jvFindPacks(q){const n=jvNorm(q),dig=(n.match(/\d{6,}/)||[""])[0],P=jvPacksVisible();
 if(dig){const L=P.filter(p=>pkDig(p.ord)===dig||pkDig(p.ord).startsWith(dig)||String(p.ps)===dig);if(L.length)return L}
 const T=jvToks(q).filter(w=>!/^\d+$/.test(w)||w.length>=3);if(!T.length)return[];
 return P.filter(p=>{const e=jvNorm(p.ev);return T.every(w=>e.includes(w))})}
function jvFindRets(q){if(!can("ret_s"))return[];const dig=(jvNorm(q).match(/\d{6,}/)||[""])[0];if(!dig)return[];return rets.filter(r=>pkDig(r.ord)===dig||pkDig(r.ord).startsWith(dig))}
/* Artikel finden: Nummer oder Name (Artikelliste, sonst Bezeichnungen in Packlisten) */
function jvArticle(q){const n=jvNorm(q),num=(n.match(/\b(\d{3,6})\b/)||[])[1];const K=(typeof rkat!=="undefined"&&Array.isArray(rkat))?rkat:[];
 if(num&&!/^\d{7,}$/.test(num)){const c=artCode(num),k=K.find(a=>artCode(a.nr)===c);return{code:c,name:k?k.name:"",label:"Artikel "+c+(k?" ("+k.name+")":"")}}
 const T=jvToks(q.replace(/^.*?\bwo\b/i,""));if(!T.length)return null;
 const hit=K.filter(a=>{const s=jvNorm(a.name+" "+(a.u||"")+" "+(a.g||""));return T.every(w=>s.includes(w))}).sort((a,b)=>a.name.length-b.name.length)[0];
 if(hit)return{code:artCode(hit.nr),name:hit.name,label:hit.name+(hit.nr?" ("+hit.nr+")":"")};
 return{code:"",text:T,name:T.join(" "),label:"„"+T.join(" ")+"“"}}
function jvArtMatch(A,x){if(A.code)return artCode(x.a)===A.code;const s=jvNorm(x.t+" "+pkName(x));return A.text.every(w=>s.includes(w))}
function jvWhere(q){const A=jvArticle(q);if(!A)return null;if(!can("pk_s"))return{say:["Dafür brauchst du das Recht, Packlisten zu sehen."]};
 const out=[],plan=[];let sum=0,sumP=0;
 jvPacksVisible().forEach(p=>{if(pkState(p).k==="done")return;const H=pkH(p),IT=pkItems(p);let q1=0,q2=0;
  IT.forEach(o=>{const x=o.x,h=H[o.k],st=pkPS(x,h),own=Math.max(0,(+x.n||0)-(h&&h.fm==="lager"?0:(+x.f||0)));
   if(jvArtMatch(A,x)){if(st.s==="open")q2+=own;else q1+=h&&h.ok?own:Math.min(own,+st.q||0)}
   (st.alt||[]).forEach(a=>{const hitA=A.code?artCode(a.a)===A.code:A.text.every(w=>jvNorm(a.t).includes(w));if(hitA&&st.s!=="open")q1+=+a.n||0})});
  if(q1){out.push({p,q:q1});sum+=q1}if(q2&&!pkProg(p).fin){plan.push({p,q:q2});sumP+=q2}});
 const say=[],rows=[];
 if(!out.length&&!plan.length)say.push(jvF()?jvPick([A.label+": nirgends unterwegs. Entweder im Lager, oder jemand hat ihn gut versteckt.",A.label+" steckt in keiner laufenden Packliste."]):A.label+" steckt in keiner laufenden Packliste.");
 if(out.length){say.push(A.label+": "+jvStk(sum)+" unterwegs.");out.sort((a,b)=>(a.p.de||0)-(b.p.de||0)).forEach(o=>{say.push(jvStk(o.q)+" bei "+(o.p.ev||"Auftrag "+o.p.ord)+", Dispo bis "+jvDayName(pkDay(o.p.de))+".");rows.push({l:(o.p.ev||"")+" · "+(o.p.ord||""),r:jvStk(o.q)+" · bis "+pkWd(o.p.de),pk:o.p.id})})}
 if(plan.length){say.push((out.length?"Dazu geplant, aber noch nicht hergerichtet: ":A.label+": noch nicht hergerichtet, aber geplant: ")+jvStk(sumP)+".");plan.forEach(o=>rows.push({l:(o.p.ev||"")+" · geplant",r:jvStk(o.q)+" · "+jvDayName(pkHDay(o.p)),pk:o.p.id,cls:"warn"}))}
 if(!A.code&&(out.length||plan.length))say.push("Gesucht nach dem Namen – die Artikelnummer ist genauer.");
 return{say,rows}}
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
 const acts=[{l:"Packliste öffnen",fn:()=>{curPack=p.id;go("packopen")}}];RR.forEach(r=>acts.push({l:"Retourschein öffnen",fn:()=>{curRet=r.id;go("retopen")}}));
 return{say,acts}}
function jvHerr(q){if(!can("pk_s"))return{say:["Dafür brauchst du das Recht, Packlisten zu sehen."]};const n=jvNorm(q),t0=pkDay(Date.now());
 if(/nicht hergerichtet|liegen|teilweise|vergessen/.test(n)){const L=pkGroups().late;
  if(!L.length)return{say:[jvF()?"Nichts liegengeblieben. Vorbildlich.":"Es ist nichts liegengeblieben."]};
  return{say:[L.length===1?"Eine Packliste ist nicht fertig hergerichtet:":L.length+" Packlisten sind nicht fertig hergerichtet:"].concat(L.slice(0,4).map(p=>{const g=pkProg(p);return (p.ev||p.ord)+(g.d?", teilweise, "+g.d+" von "+g.n:", nicht angefangen")+"."})),rows:L.map(p=>jvPkRow(p,pkProg(p).d?"teilweise "+pkProg(p).d+"/"+pkProg(p).n:"nicht hergerichtet"))}}
 let a=t0,b=t0,lab="heute";const mon=pkMon(t0);
 if(/übermorgen/.test(n)){a=b=pkAddD(t0,2);lab="übermorgen"}else if(/morgen/.test(n)){a=b=pkAddD(t0,1);lab="morgen"}
 else if(/nächste woche/.test(n)){a=pkAddD(mon,7);b=pkAddD(mon,13);lab="nächste Woche"}else if(/diese woche|woche/.test(n)){a=t0;b=pkAddD(mon,6);lab="diese Woche"}
 const L=jvPacksVisible().filter(p=>pkState(p).k!=="done"&&pkHDay(p)>=a&&pkHDay(p)<=b).sort((x,y)=>pkHDay(x)-pkHDay(y));
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
const JV_HELP=["Du kannst mich zum Beispiel fragen:","Was ist heute herzurichten? Auch morgen, diese Woche oder nächste Woche.","Was ist nicht hergerichtet?","Was kommt heute zurück? Was ist überfällig?","Welche Defekte sind offen? Was ist dringend? Was wurde repariert?","Wo ist Artikel 1098? Oder: Wo sind die Kabel CEE 32A 50 Meter?","Was ist mit Auftrag 260111401? Oder: Zeig mir Auftrag 260111401.","Neuer Retourschein, Defekt melden, Info an das Lager, Übersicht – und Briefing."];
/* ---- Erkennen ---- */
function jvAnswer(q){const n=jvNorm(q);
 if(/^(hilfe|help)$|was kannst du|was verstehst du|wie funktioniert/.test(n))return{say:JV_HELP};
 if(/briefing|was steht (heute )?an|lagebericht|zusammenfassung/.test(n)){jvMode="brief";jvSpeakLines(jvText(jvData()));return{say:["Briefing läuft."],quiet:true}}
 if(/(neue[nrs]?|anlegen|erstelle).*retourschein|retourschein.*(neu|anlegen)/.test(n)){if(!can("ret_b"))return{say:["Dafür fehlt dir das Recht für Retourscheine."]};go("ret");return{say:["Ich öffne die Retourscheine."],quiet:true}}
 if(/defekt melden|defekt.*(melden|eintragen|erfassen)/.test(n)){dpho=null;go("defnew");return{say:["Defekt melden."],quiet:true}}
 if(/info (an|ans|für) (das )?lager|nachricht (an|ans) (das )?lager/.test(n)){ipho=null;go("infonew");return{say:["Info an das Lager."],quiet:true}}
 if(/^(übersicht|packlisten|zur übersicht|zeig (die )?übersicht)$/.test(n)){if(!can("pk_s"))return{say:["Dafür brauchst du das Recht, Packlisten zu sehen."]};go("pack");return{say:["Übersicht."],quiet:true}}
 if(/\bwo (ist|sind|befindet|befinden|steckt|stecken|liegt|liegen)\b|\bwo hab(en)? wir\b/.test(n)){const r=jvWhere(q);if(r)return r}
 if(/defekt|kaputt|repariert|reparatur|dringend|werkstatt/.test(n))return jvDef(q);
 if(/überfällig|fehlt.*retour|retour.*fehlt/.test(n))return jvOver();
 if(/zurück|retour kommt|kommt.*retour/.test(n)&&!/\d{6,}/.test(n))return jvBack(q);
 if(/herzurichten|herrichten|hergerichtet|zu richten|packen/.test(n)&&!/\d{6,}/.test(n))return jvHerr(q);
 if(/\d{6,}/.test(n)||/auftrag|packliste|veranstaltung|^zeig|was ist mit|wie schaut|stand/.test(n))return jvOrder(q,/^(zeig|öffne|öffnen|mach .* auf)/.test(n)||/\b(zeig|öffne)\b/.test(n));
 return{say:[jvF()?jvPick(["Das habe ich nicht verstanden. Sag „Hilfe“, dann verrate ich dir, was ich kann.","Hm. Das ist mir zu hoch. Sag „Hilfe“ für meine Liste."]):"Das habe ich nicht verstanden. Sag „Hilfe“, dann zeige ich dir, was ich kann."]}}
function jvAsk(q){q=String(q||"").trim();if(!q)return;jvStop();let A;try{A=jvAnswer(q)}catch(e){console.error(e);A={say:["Da ist bei mir etwas schiefgegangen. Bitte nochmal versuchen."]}}
 A.q=q;A.say=A.say.map(x=>String(x).replace(/\.\.(\s|$)/g,".$1"));const inp=$("#jvaq");if(inp)inp.value="";if(view==="jarvis")jvShow(A,!A.quiet);else jvLast=A}
