/* ===== Lager Assistent – Fragen (ab 1.73) =====
   Alle Fragen aus dem Konzept „Was man Jarvis fragen kann“ (8 Gruppen) + Hilfe-Bildschirm + erweiterte Artikel-Abfrage.
   Ohne KI: Stichwörter, Antworten nur aus den Daten der App (Packlisten, Herricht-Stand, Retourscheine, Defekte, Infos, Materiallisten). */
const jvToday=()=>pkDay(Date.now());
const jvEv=p=>p.ev||("Auftrag "+(p.ord||"–"));
const jvWdL=t=>new Date(t).toLocaleDateString("de-AT",{weekday:"long"});
const jvDL=t=>jvWdL(t)+", "+pkDM(t);
const jvTime=t=>new Date(t).toLocaleTimeString("de-AT",{hour:"2-digit",minute:"2-digit"});
const jvSince=t=>{const d=Math.round((jvToday()-pkDay(t))/864e5);return d<=0?"heute":d===1?"seit gestern":"seit "+d+" Tagen"};
const JV_NOPK={say:["Dafür brauchst du das Recht, Packlisten zu sehen."]};
const JV_NORET={say:["Dafür brauchst du das Recht, Retourscheine zu sehen."]};
const JV_ZW={ein:1,eins:1,eine:1,einen:1,einer:1,zwei:2,drei:3,vier:4,fünf:5,sechs:6,sieben:7,acht:8,neun:9,zehn:10,elf:11,zwölf:12,fünfzehn:15,zwanzig:20,dreißig:30};
const jvZ=w=>/^\d+$/.test(w)?+w:JV_ZW[w];
/* Tag aus der Frage: heute/morgen/übermorgen/gestern/Wochentag/Datum (Text roh, wegen Punkten im Datum) */
const JV_WD=["sonntag","montag","dienstag","mittwoch","donnerstag","freitag","samstag"];
function jvDayIn(raw){const s=String(raw||"").toLowerCase(),t0=jvToday();
 let m=s.match(/\b(\d{1,2})\.\s?(\d{1,2})\.?(\s?(\d{2,4}))?/);
 if(m){const d=new Date(t0);let y=m[4]?+m[4]:d.getFullYear();if(y<100)y+=2000;const t=new Date(y,+m[2]-1,+m[1]).getTime();if(!m[4]&&t<pkAddD(t0,-60))return{t:new Date(y+1,+m[2]-1,+m[1]).getTime(),lab:"am "+pkDM(t)};return{t,lab:"am "+pkDM(t)}}
 if(/übermorgen/.test(s))return{t:pkAddD(t0,2),lab:"übermorgen"};
 if(/vorgestern/.test(s))return{t:pkAddD(t0,-2),lab:"vorgestern"};
 if(/\bmorgen\b/.test(s))return{t:pkAddD(t0,1),lab:"morgen"};
 if(/\bgestern\b/.test(s))return{t:pkAddD(t0,-1),lab:"gestern"};
 if(/\bheute\b/.test(s))return{t:t0,lab:"heute"};
 for(let i=0;i<7;i++){if(new RegExp("\\b"+JV_WD[i]).test(s)){let d=(i-new Date(t0).getDay()+7)%7;if(d===0&&/nächst/.test(s))d=7;const t=pkAddD(t0,d);return{t,lab:d===0?"heute":d===1?"morgen":"am "+jvWdL(t)}}}
 return null}
/* ---------- Artikel erkennen („50m 32A“, „Kabel 32A 50 Meter“, „Artikel 1098“) ---------- */
function jvATok(s){return String(s||"").toLowerCase().replace(/->|→|>/g," ").replace(/(\d)\s*-\s*fach/g,"$1fach")
 .replace(/(\d)\s*(meter|metern|mtr|m)(?![a-zäöüß0-9])/g,"$1m").replace(/(\d)\s*(ampere|amp|a)(?![a-zäöüß0-9])/g,"$1a")
 .replace(/[^a-z0-9äöüß]+/g," ").trim().split(" ").filter(Boolean)}
const JV_ASTOP=new Set(("wo ist sind die der das den dem des ein eine einen einer artikel gerade eigentlich denn noch bitte mal jarvis hey zeig zeige mir mich uns was mit "+
 "auf welcher welche welchen welchem welches baustelle baustellen veranstaltung veranstaltungen auftrag aufträge stehen steht liegen liegt draußen unterwegs gibt es haben hat hab habe wir unsere unser "+
 "momentan aktuell zurzeit jetzt stück stk stueck wie viele viel befindet befinden stecken steckt verliehen raus von vom bei im in am zuletzt letzte letzten war waren ist's "+
 "verfügbar frei könnten könnte gehören gehört zu zum welchem defekt defekte defekten kaputt repariert schon öfter oft häufig gab werkstatt dienstag montag mittwoch donnerstag freitag samstag sonntag "+
 "heute morgen übermorgen nächsten nächste woche füge hinzu trag eintragen dazu retourschein retourscheins in den einem ich lager").split(" "));
let jvVocK=null,jvVocL=0,jvVoc=[];
function jvVocab(){const K=rKat();if(K===jvVocK&&K.length===jvVocL)return jvVoc;const S=new Set();K.forEach(a=>jvATok(a.name+" "+(a.u||"")+" "+(a.g||"")).forEach(w=>S.add(w)));jvVocK=K;jvVocL=K.length;jvVoc=[...S];return jvVoc}
function jvTokHit(w,T){if(/\d/.test(w))return T.includes(w);return T.some(t=>t===w||(w.length>=4&&t.length>=4&&(t.startsWith(w)||w.startsWith(t))))}
const jvKatToks=a=>jvATok(a.name+" "+(a.u||"")+" "+(a.g||""));
function jvAOfKat(a){const c=artCode(a.nr);return{code:c,toks:jvATok(a.name).filter(w=>!/^\d{1,2}$/.test(w)),label:a.name,kat:a}}
/* liefert {A} (eindeutig), {list:[…]} (mehrere) oder null (nichts) */
function jvArtFind(q){const raw=jvATok(q).filter(w=>!JV_ASTOP.has(w));
 const num=raw.find(w=>/^\d{3,6}$/.test(w));
 if(num){const c=artCode(num),k=rKat().find(a=>artCode(a.nr)===c);return{A:k?jvAOfKat(k):{code:c,toks:[],label:"Artikel "+c}}}
 const toks=raw.filter(w=>!/^\d{1,2}$/.test(w));if(!toks.length)return null;
 const V=jvVocab(),need=toks.filter(w=>/\d/.test(w)||jvTokHit(w,V));
 if(need.length){const K=rKat().filter(a=>{const T=jvKatToks(a);return need.every(w=>jvTokHit(w,T))});
  if(K.length===1)return{A:jvAOfKat(K[0])};
  if(K.length>1){const ex=K.filter(a=>jvATok(a.name).filter(w=>!/^\d{1,2}$/.test(w)).every(w=>need.includes(w)||!/\d/.test(w)&&need.some(x=>jvTokHit(x,[w]))));
   return ex.length===1&&ex[0]&&jvATok(ex[0].name).length===need.length?{A:jvAOfKat(ex[0])}:{list:K.map(jvAOfKat)}}}
 /* nicht in der Artikelliste → Bezeichnungen in den Packlisten */
 const tt=need.length?need:toks,seen={};
 packs.forEach(p=>pkItems(p).forEach(o=>{const T=jvATok(o.x.t+" "+pkName(o.x));if(tt.every(w=>jvTokHit(w,T))){const nm=pkName(o.x);seen[nm]=seen[nm]||{code:artCode(o.x.a),toks:jvATok(nm).filter(w=>!/^\d{1,2}$/.test(w)),label:nm,byText:!artCode(o.x.a)}}}));
 const L=Object.values(seen);if(L.length===1)return{A:L[0]};if(L.length>1)return{list:L};
 return{A:{code:"",toks:tt,label:"„"+tt.join(" ")+"“",byText:true}}}
function jvMatcher(A){return(code,text)=>{if(A.code&&code)return code===A.code;if(!A.toks.length)return false;const T=jvATok(text);return A.toks.every(w=>jvTokHit(w,T))}}
/* Artikel klären, dann fn(A) – passen mehrere, fragt der Assistent nach */
function jvWithArt(q,fn,none){const R=jvArtFind(q);if(!R)return none?none():{say:["Welchen Artikel meinst du? Sag die Artikelnummer oder den Namen, z. B. „50m 32A“."]};
 if(R.A)return fn(R.A);
 const L=R.list.slice(0,10);
 return{say:["Da passen "+R.list.length+" Artikel. Welchen meinst du?"],rows:L.map(A=>{const n=jvOutSum(A);return{l:A.label,r:n?jvStk(n)+" draußen":"",fn:()=>fn(A)}})}}
/* ---------- Mengen pro Packliste ----------
   draußen = hergerichtet (bzw. bei laufender/abgelaufener Dispo laut Packschein), ohne Fremdmiete, + Alternativen, − schon im Retourschein */
function jvArtCnt(p,m){const H=pkH(p),k=pkState(p).k,run=k==="over"||k==="out"||k==="back";let out=0,plan=0,back=0,l55=0;
 pkItems(p).forEach(o=>{const x=o.x,h=H[o.k],st=pkPS(x,h),own=Math.max(0,(+x.n||0)-(h&&h.fm==="lager"?0:(+x.f||0)));
  if(m(artCode(x.a),x.t+" "+pkName(x))){if(pkL55(x,h)){if(run){out+=own;l55+=own}else plan+=own}else if(st.s==="open"){if(run)out+=own;else plan+=own}else out+=h&&h.ok?own:Math.min(own,+st.q||0)}
  if(st.s!=="open")(st.alt||[]).forEach(a=>{if(m(artCode(a.a),a.t))out+=+a.n||0})});
 pkRets(p).forEach(r=>Object.values(rIt(r)).forEach(it=>{if(it.g!=="Zubehör"&&m(artCode(it.nr),it.name))back+=+it.q||0}));
 return{out,plan,back,l55,rest:Math.max(0,out-back)}}
function jvOutSum(A){if(!can("pk_s"))return 0;const m=jvMatcher(A);let s=0;packs.forEach(p=>{if(pkState(p).k!=="done")s+=jvArtCnt(p,m).rest});return s}
/* „Auf welcher Baustelle sind 50m 32A?“ / „Wo ist Artikel 1098?“ / „Wie viele … sind auf Baustellen?“ */
function jvWhereA(A,count){if(!can("pk_s"))return JV_NOPK;const m=jvMatcher(A),L=[],P=[];let sum=0,sumP=0;
 packs.forEach(p=>{const s=pkState(p);if(s.k==="done")return;const c=jvArtCnt(p,m);
  if(c.rest){L.push({p,q:c.rest,back:c.back,l55:c.l55,over:s.k==="over"});sum+=c.rest}
  if(c.plan){P.push({p,q:c.plan});sumP+=c.plan}});
 L.sort((a,b)=>(b.over-a.over)||((a.p.de||0)-(b.p.de||0)));
 if(!L.length&&!P.length)return{say:[jvF()?jvPick([A.label+": auf keiner Baustelle. Entweder im Lager, oder jemand hat's gut versteckt.",A.label+" ist auf keiner Baustelle. Alles daheim."]):A.label+" ist laut Packlisten auf keiner Baustelle."]};
 const say=[],rows=[];
 if(L.length){const ov=L.filter(o=>o.over);
  say.push(A.label+": "+jvStk(sum)+(L.length===1?" auf einer Baustelle.":" auf "+L.length+" Baustellen."));
  if(!count||L.length<=3){if(ov.length)say.push("Überfällig: "+jvList(ov.map(o=>jvStk(o.q)+" bei "+jvEv(o.p)))+".");
   L.filter(o=>!o.over).slice(0,4).forEach(o=>say.push(jvStk(o.q)+" bei "+jvEv(o.p)+", Dispo bis "+jvDayName(pkDay(o.p.de))+"."))}
  else if(ov.length)say.push("Davon "+jvStk(ov.reduce((a,o)=>a+o.q,0))+" überfällig.");
  L.forEach(o=>rows.push({l:jvEv(o.p),sub:"Auftrag "+(o.p.ord||"–")+(o.l55?" · "+(o.l55>=o.q?"über Lager 55":"davon "+o.l55+" über Lager 55"):"")+(o.back?" · "+jvStk(o.back)+" schon zurück":""),r:jvStk(o.q)+" · "+(o.over?"überfällig, ":"bis ")+pkWd(o.p.de),cls:o.over?"warn":"ok",pk:o.p.id}));
  rows.push({sum:true,l:"Summe auf Baustellen",r:jvStk(sum)})}
 if(P.length){say.push((L.length?"Dazu geplant, noch nicht hergerichtet: ":A.label+": auf keiner Baustelle, aber geplant: ")+jvStk(sumP)+".");
  rows.push({hd:true,l:"Geplant, noch nicht hergerichtet"});
  P.sort((a,b)=>pkHDay(a.p)-pkHDay(b.p)).forEach(o=>rows.push({l:jvEv(o.p),sub:"Auftrag "+(o.p.ord||"–"),r:jvStk(o.q)+" · ab "+pkWd(pkHDay(o.p)),cls:"plan",pk:o.p.id}))}
 if(A.byText)say.push("Gesucht nach dem Namen – mit der Artikelnummer geht's genauer.");
 return{say,rows}}
/* „Auf welcher Veranstaltung war Artikel X zuletzt?“ */
function jvLastA(A){if(!can("pk_s"))return JV_NOPK;const m=jvMatcher(A),t0=Date.now();
 const L=packs.filter(p=>(p.db||0)<=t0&&pkItems(p).some(o=>m(artCode(o.x.a),o.x.t+" "+pkName(o.x))||(pkH(p)[o.k]&&(pkH(p)[o.k].alt||[]).some(a=>m(artCode(a.a),a.t))))).sort((a,b)=>(b.db||0)-(a.db||0));
 if(!L.length)return{say:[A.label+" war laut Packlisten noch auf keiner Veranstaltung."]};
 const p=L[0],c=jvArtCnt(p,m);
 return{say:[A.label+" war zuletzt bei "+jvEv(p)+" (Auftrag "+(p.ord||"–")+"), Dispo "+pkDM(p.db)+" bis "+pkDM(p.de)+(c.out?", "+jvStk(c.out):"")+"."],rows:L.slice(0,5).map(p=>({l:jvEv(p),sub:"Auftrag "+(p.ord||"–"),r:pkDM(p.db)+"–"+pkDM(p.de),pk:p.id}))}}
/* „Ist Artikel X am Dienstag verfügbar?“ – wie viele sind an dem Tag draußen (Bestand kennt die App nicht) */
function jvAvailA(A,D){if(!can("pk_s"))return JV_NOPK;const m=jvMatcher(A),t=D.t,L=[];let sum=0;
 packs.forEach(p=>{const s=pkState(p);if(s.k==="done")return;const a=Math.min(pkHDay(p)||pkDay(p.db||0),pkDay(p.db||0)),e=p.de?pkDay(p.de):a;
  const on=(a<=t&&t<=e)||(s.k==="over"&&t>=jvToday());if(!on)return;const c=jvArtCnt(p,m),q=Math.max(0,c.out+c.plan-c.back);if(q){L.push({p,q,over:s.k==="over"});sum+=q}});
 const dl=D.lab==="heute"?"heute":D.lab==="morgen"?"morgen":jvDL(D.t);
 if(!L.length)return{say:[A.label+": "+dl+" ist laut Packlisten nichts davon draußen. Wie viele wir insgesamt haben, weiß ich nicht."]};
 return{say:[A.label+": "+dl+" sind laut Packlisten "+jvStk(sum)+" verplant, auf "+L.length+(L.length===1?" Veranstaltung.":" Veranstaltungen."),"Den Gesamtbestand im Lager kenne ich nicht."],
  rows:L.sort((a,b)=>(b.over-a.over)||((a.p.de||0)-(b.p.de||0))).map(o=>({l:jvEv(o.p),sub:"Auftrag "+(o.p.ord||"–"),r:jvStk(o.q)+" · "+(o.over?"überfällig":"bis "+pkWd(o.p.de)),cls:o.over?"warn":"ok",pk:o.p.id})).concat([{sum:true,l:"Summe "+(D.lab==="heute"?"heute":pkDM(D.t)),r:jvStk(sum)}])}}
/* „Zu welchem Auftrag könnten 4 Stück Kabel A gehören?“ – Vorschlag nach Artikel + Menge */
function jvBelongA(A,n){if(!can("pk_s"))return JV_NOPK;const m=jvMatcher(A),t0=jvToday(),L=[];
 packs.forEach(p=>{const s=pkState(p);if(s.k==="done"||!(s.k==="over"||s.k==="out"||s.k==="back"))return;const c=jvArtCnt(p,m);if(c.rest>0)L.push({p,q:c.rest,over:s.k==="over",fit:n?(c.rest===n?2:c.rest>n?1:0):1})});
 if(!L.length)return{say:["Ich finde keinen laufenden Auftrag, bei dem "+A.label+" noch draußen ist."]};
 L.sort((a,b)=>b.fit-a.fit||(b.over-a.over)||((b.p.de||0)-(a.p.de||0)));
 const b=L[0];
 return{say:[(n?jvStk(n)+" "+A.label:A.label)+": am ehesten "+jvEv(b.p)+" (Auftrag "+(b.p.ord||"–")+")"+(b.fit===2?", dort fehlen genau "+jvStk(b.q)+".":", dort sind noch "+jvStk(b.q)+" draußen.")].concat(L.length>1?["Weitere Möglichkeiten stehen darunter."]:[]).concat(["Das ist nur ein Vorschlag nach Artikel und Menge."]),
  rows:L.slice(0,8).map(o=>({l:jvEv(o.p),sub:"Auftrag "+(o.p.ord||"–")+(o.fit===2?" · Menge passt genau":""),r:jvStk(o.q)+" · "+(o.over?"überfällig":"bis "+pkWd(o.p.de)),cls:o.over?"warn":"ok",pk:o.p.id}))}}
/* ---------- Abgleich Packliste ↔ Retourschein ---------- */
function jvBalAns(p,mode){const B=jvBal(p),say=[],rows=[],ev=jvEv(p);
 if(!B.has){say.push(mode==="all"?"Bei "+ev+" ist noch nichts zurück – es gibt keinen Retourschein.":"Zu "+ev+" gibt es noch keinen Retourschein. Laut Packliste ist alles draußen: "+jvStk(B.L.reduce((a,e)=>a+e.soll,0))+".");
  B.L.filter(e=>e.soll).forEach(e=>rows.push({l:e.name,r:jvStk(e.soll)+" draußen",cls:"ok",pk:p.id}));
  return{say,rows,acts:[{l:"Packliste öffnen",fn:()=>{curPack=p.id;go("packopen")}}]}}
 if(!B.miss.length)say.push(mode==="all"?(jvF()?"Ja, bei "+ev+" ist alles zurück. Brav.":"Ja, bei "+ev+" ist alles zurück."):"Bei "+ev+" fehlt nichts – alles zurück.");
 else{const n=B.miss.reduce((a,e)=>a+e.soll-e.back,0);
  say.push((mode==="all"?"Nein. ":"")+"Bei "+ev+" fehl"+(n===1?"t":"en")+" noch "+jvStk(n)+":");
  B.miss.slice(0,5).forEach(e=>say.push(jvStk(e.soll-e.back)+" "+e.name+"."))}
 if(B.more.length)say.push("Mehr zurück als laut Packliste: "+jvList(B.more.slice(0,3).map(e=>jvStk(e.back-e.soll-e.fr)+" "+e.name))+".");
 say.push(B.closed?"Der Retourschein ist abgeschlossen.":"Der Retourschein ist noch offen.");
 B.miss.forEach(e=>rows.push({l:e.name,sub:e.back?"zurück "+jvStk(e.back)+" von "+jvStk(e.soll):"noch nichts zurück",r:"fehlen "+pkNum(e.soll-e.back),cls:"warn",ret:B.R[0].id}));
 B.more.forEach(e=>rows.push({l:e.name,sub:"laut Packliste "+jvStk(e.soll)+(e.fr?" + "+pkNum(e.fr)+" Fremdmiete":""),r:"+"+pkNum(e.back-e.soll-e.fr)+" mehr",cls:"ok",ret:B.R[0].id}));
 const acts=B.R.map(r=>({l:"Retourschein öffnen",fn:()=>{curRet=r.id;go("retopen")}})).slice(0,1).concat([{l:"Packliste öffnen",fn:()=>{curPack=p.id;go("packopen")}}]);
 return{say,rows,acts}}
/* ---------- Auftrag finden ---------- */
const JV_OSTOP=new Set(("wann endet endete ende enden dispo von vom auftrag auftrags auftragsnummer wer ist projektleiter projektleiterin pl lies lese mir mich die der das den packliste packschein packscheins vor vorlesen "+
 "was fehlt fehlen fehlen beim bei noch öffne öffnen mach zeig zeige retourschein retourscheins für war alles zurück zurückgekommen markiere markier als geklärt geklaert erledigt nicht mehr zurücknehmen rückgängig "+
 "notiere notier notiz zu schreib schreibe retoure an schick schicke sende eine einen nachfrage gegenüber im vergleich zur zum veranstaltung baustelle ist's mit dem ein und hat haben es gibt ob ganz komplett vollständig "+
 "erinnere erinner erinnerung heute morgen übermorgen um uhr halb auf aus lass mich bitte mal jetzt so da dann").split(" "));
function jvPkFind(q){const n=jvNorm(q),dig=(n.match(/\d{6,}/)||[""])[0],P=can("pk_s")?packs:[];
 if(dig)return P.filter(p=>pkDig(p.ord)===dig||pkDig(p.ord).startsWith(dig)||String(p.ps)===dig);
 const T=n.split(" ").filter(w=>w&&!JV_OSTOP.has(w)&&!/^\d{1,5}$/.test(w)&&!JV_STOP.has(w));if(!T.length)return null;
 const L=P.filter(p=>{const e=jvNorm(p.ev);return T.every(w=>e.includes(w))});
 const act=L.filter(p=>pkState(p).k!=="done");return act.length?act:L}
function jvOnePk(q,fn){if(!can("pk_s"))return JV_NOPK;const L=jvPkFind(q);
 if(L===null)return{say:["Welchen Auftrag meinst du? Sag die Auftragsnummer oder die Veranstaltung."]};
 if(!L.length)return{say:[jvF()?"Zu diesem Auftrag finde ich nichts. Vielleicht noch nicht hochgeladen?":"Zu diesem Auftrag finde ich keine Packliste."]};
 if(L.length>1)return{say:["Da passen "+L.length+" Packlisten. Welche meinst du?"],rows:L.slice(0,8).map(p=>({...jvPkRow(p),pk:null,fn:()=>fn(p)}))};
 return fn(L[0])}
function jvRetFind(q){if(!can("ret_s"))return[];const n=jvNorm(q),dig=(n.match(/\d{6,}/)||[""])[0];
 if(dig)return rets.filter(r=>pkDig(r.ord)===dig||pkDig(r.ord).startsWith(dig));
 const T=n.split(" ").filter(w=>w&&!JV_OSTOP.has(w)&&!JV_STOP.has(w)&&!/^\d{1,5}$/.test(w));if(!T.length)return null;
 return rets.filter(r=>{const e=jvNorm(r.ev);return T.every(w=>e.includes(w))})}
/* ---------- Rücklauf & Dispo ---------- */
function jvOverDays(n){if(!can("pk_s"))return JV_NOPK;const m=n.match(/(\d+|[a-zäöü]+)\s*(tag|tage|tagen|woche|wochen)/),k=m?(jvZ(m[1])||1)*(/woche/.test(m[2])?7:1):3;
 const t0=jvToday(),L=pkGroups().over.filter(p=>(t0-pkDay(p.de))/864e5>k);
 if(!L.length)return{say:["Nichts ist länger als "+(k%7===0&&k>=7?(k/7===1?"eine Woche":k/7+" Wochen"):k+" Tage")+" überfällig."]};
 return{say:[L.length===1?"Eine Retoure ist länger als "+k+" Tage überfällig:":L.length+" Retouren sind länger als "+k+" Tage überfällig:"].concat(L.slice(0,4).map(p=>jvEv(p)+", "+jvSince(p.de)+".")),rows:L.map(p=>jvPkRow(p,"überfällig "+jvSince(p.de)))}}
function jvOverLongest(){if(!can("pk_s"))return JV_NOPK;const L=pkGroups().over;if(!L.length)return{say:["Überfällig ist nichts."]};const p=L[0];
 return{say:["Am längsten überfällig ist "+jvEv(p)+", Auftrag "+(p.ord||"–")+": Dispo-Ende war "+jvDL(p.de)+", also "+jvSince(p.de)+"."+(jvF()?" Zeit für einen Anruf.":"")+(jvPl(p)?" Projektleiter: "+jvPl(p)+".":"")],rows:L.slice(0,5).map(p=>jvPkRow(p,"überfällig "+jvSince(p.de)))}}
const jvPl=p=>shortName(p.pl)||"";
function jvBackDay(D){if(!can("pk_s"))return JV_NOPK;const L=packs.filter(p=>p.de&&pkDay(p.de)===D.t);
 if(!L.length)return{say:[(D.lab==="gestern"?"Gestern hätte":"Am "+pkDM(D.t)+" hätte")+" laut Packlisten nichts zurückkommen sollen."]};
 const ok=L.filter(p=>pkState(p).k==="done"),no=L.filter(p=>pkState(p).k!=="done");
 return{say:[(D.lab==="gestern"?"Gestern":jvDL(D.t))+" hätte"+(L.length===1?"":"n")+" "+(L.length===1?"eine Packliste":L.length+" Packlisten")+" zurückkommen sollen."].concat(ok.length?[jvList(ok.map(jvEv))+(ok.length===1?" ist":" sind")+" zurück."]:[]).concat(no.length?[jvList(no.map(jvEv))+(no.length===1?" fehlt":" fehlen")+" noch."]:[]),
  rows:L.map(p=>jvPkRow(p,pkState(p).k==="done"?"zurück ✓":"fehlt noch"))}}
function jvBackWeek(){if(!can("pk_s"))return JV_NOPK;const t0=jvToday(),e=pkAddD(pkMon(t0),6),L=packs.filter(p=>p.de&&pkDay(p.de)>=t0&&pkDay(p.de)<=e&&pkState(p).k!=="done").sort((a,b)=>a.de-b.de);
 if(!L.length)return{say:["Diese Woche kommt laut Packlisten nichts mehr zurück."]};
 return{say:["Diese Woche kommen noch "+(L.length===1?"eine Packliste":L.length+" Packlisten")+" zurück:"].concat(L.slice(0,5).map(p=>jvEv(p)+", "+jvDayName(pkDay(p.de))+".")),rows:L.map(p=>jvPkRow(p,"Dispo-Ende "+pkWd(p.de)))}}
function jvDispo(q){return jvOnePk(q,p=>({say:["Die Dispo von "+jvEv(p)+" (Auftrag "+(p.ord||"–")+") "+(p.de&&pkDay(p.de)<jvToday()?"endete":"endet")+" am "+jvDL(p.de)+(new Date(p.de).getHours()?" um "+jvTime(p.de):"")+"."].concat(pkState(p).k==="over"?["Die Retoure ist überfällig."]:[]),rows:[jvPkRow(p,"Dispo "+pkDM(p.db)+"–"+pkDM(p.de))]}))}
function jvPlOpen(q){if(!can("pk_s"))return JV_NOPK;const n=jvNorm(q).replace(/^.*?projektleiter(in)?\s*/,"").replace(/\b(sind|noch|offen|offene|aufträge|auftrag|von|welche|hat|was|alles)\b/g," ").trim();
 const T=n.split(" ").filter(w=>w.length>1);if(!T.length)return{say:["Welcher Projektleiter? Sag zum Beispiel „Aufträge von Projektleiter Marvin“."]};
 const L=packs.filter(p=>{const s=jvNorm(p.pl);return s&&T.every(w=>s.split(" ").some(x=>x.startsWith(w)))&&pkState(p).k!=="done"}).sort((a,b)=>(a.de||0)-(b.de||0));
 if(!L.length)return{say:["Für Projektleiter „"+T.join(" ")+"“ finde ich keine offenen Aufträge."]};
 const ov=L.filter(p=>pkState(p).k==="over");
 return{say:[jvPl(L[0])+" hat "+(L.length===1?"einen offenen Auftrag":L.length+" offene Aufträge")+(ov.length?", davon "+ov.length+" überfällig":"")+"."].concat(L.slice(0,4).map(p=>jvEv(p)+", "+pkState(p).l+".")),rows:L.map(p=>jvPkRow(p,pkState(p).l))}}
function jvNoMail(){if(!can("ret_s"))return JV_NORET;const L=rets.filter(r=>r.closed&&!(r.sent||[]).length).sort((a,b)=>(b.closedT||0)-(a.closedT||0));
 if(!L.length)return{say:[jvF()?"Für alles Zurückgekommene ist die Retoure geschrieben. Ordnung muss sein.":"Für alle abgeschlossenen Retourscheine ist eine Retoure verschickt."]};
 return{say:[(L.length===1?"Ein abgeschlossener Retourschein ist":L.length+" abgeschlossene Retourscheine sind")+" noch nicht per Mail verschickt:"].concat(L.slice(0,4).map(r=>(r.ev||"")+(r.ord?", Auftrag "+r.ord:"")+".")),rows:L.map(r=>({l:r.ev||"Retourschein",sub:"Auftrag "+(r.ord||"–"),r:"abgeschlossen "+jvAgo(r.closedT||r.t),cls:"warn",ret:r.id}))}}
/* ---------- Herrichten ---------- */
function jvRed(D){if(!can("pk_s"))return JV_NOPK;const L=packs.filter(p=>pkHDay(p)===D.t&&pkState(p).k!=="done"&&pkF(p).length);
 if(!L.length)return{say:[(D.lab==="heute"?"Heute":jvCap(D.lab))+" gibt es keine roten Zahlen."]};
 const say=[(D.lab==="heute"?"Heute":jvCap(D.lab))+" gibt es Fremdmiete bei "+(L.length===1?"einer Packliste:":L.length+" Packlisten:")];
 const rows=L.map(p=>{const H=pkH(p),K=pkKeys(p),F=pkItems(p).filter(o=>o.x.f>0),open=F.filter(o=>!(H[o.k]&&H[o.k].fm)).length;say.push(jvEv(p)+": "+F.length+(F.length===1?" Position":" Positionen")+(open?", "+open+" noch nicht geklärt":", alles geklärt")+".");return{l:jvEv(p),sub:"Auftrag "+(p.ord||"–"),r:F.length+" Fremd"+(open?" · "+open+" offen":" · geklärt"),cls:open?"warn":"ok",pk:p.id}});
 return{say,rows}}
function jvPkStarted(){if(!can("pk_s"))return JV_NOPK;const L=packs.filter(p=>{const g=pkProg(p);return g.d>0&&!g.fin&&pkState(p).k!=="done"}).sort((a,b)=>pkHDay(a)-pkHDay(b));
 if(!L.length)return{say:["Es gibt keine angefangenen Packscheine."]};
 return{say:[(L.length===1?"Ein Packschein ist":L.length+" Packscheine sind")+" angefangen, aber nicht fertig:"].concat(L.slice(0,4).map(p=>{const g=pkProg(p);return jvEv(p)+", "+g.d+" von "+g.n+"."})),rows:L.map(p=>jvPkRow(p,pkProg(p).d+"/"+pkProg(p).n+" · "+pkWd(pkHDay(p))))}}
function jvPkMissing(q){return jvOnePk(q,p=>{const H=pkH(p),L=[];pkItems(p).forEach(o=>{if(pkL55(o.x,H[o.k]))return;const st=pkPS(o.x,H[o.k]);if(st.s==="open")L.push({o,t:"offen",n:st.need});else if(st.s==="part")L.push({o,t:"fehlen "+pkNum(st.need-st.q),n:st.need-st.q,part:1})});
 const g=pkProg(p);if(!L.length)return{say:[jvEv(p)+": "+(g.fin?"hergerichtet, ":"")+"es fehlt nichts."],acts:[{l:"Packliste öffnen",fn:()=>{curPack=p.id;go("packopen")}}]};
 return{say:[jvEv(p)+": "+L.length+(L.length===1?" Position ist":" Positionen sind")+" noch nicht komplett."].concat(L.slice(0,5).map(x=>(x.part?pkNum(x.n)+" fehlen bei ":"Offen: "+pkNum(x.n)+" ")+pkName(x.o.x)+".")),
  rows:L.map(x=>({l:pkName(x.o.x),r:x.t,cls:x.part?"warn":"ok",pk:p.id})),acts:[{l:"Packliste öffnen",fn:()=>{curPack=p.id;go("packopen")}}]}})}
function jvAlt(n){if(!can("pk_s"))return JV_NOPK;const mine=/\bich\b/.test(n),L=[];
 packs.forEach(p=>{if(pkState(p).k==="done")return;const H=pkH(p);pkItems(p).forEach(o=>{const h=H[o.k];if(h&&(h.alt||[]).length&&(!mine||h.by===me))h.alt.forEach(a=>L.push({p,x:o.x,a,h}))})});
 if(!L.length)return{say:[mine?"Du hast in keiner laufenden Packliste eine Alternative eingetragen.":"In keiner laufenden Packliste ist eine Alternative eingetragen."]};
 return{say:[(mine?"Du hast ":"Es gibt ")+(L.length===1?"eine Alternative":L.length+" Alternativen")+(mine?" eingetragen:":":")].concat(L.slice(0,4).map(o=>jvEv(o.p)+": "+pkNum(o.a.n)+"× "+o.a.t+" statt "+pkName(o.x)+".")),
  rows:L.map(o=>({l:jvEv(o.p),sub:pkNum(o.a.n)+"× "+o.a.t+" statt "+pkName(o.x),r:(o.h.by?nmA(o.h,"by"):""),pk:o.p.id}))}}
function jvPlOf(q){return jvOnePk(q,p=>({say:[p.pl?"Projektleiter von "+jvEv(p)+" ist "+jvPl(p)+".":"Bei "+jvEv(p)+" steht kein Projektleiter auf der Packliste."],rows:[jvPkRow(p,jvPl(p)||"–")]}))}
function jvReadPk(q){return jvOnePk(q,p=>{const L=pkItems(p).map(o=>(o.x.u&&!/^stk|^st$/i.test(o.x.u)?pkNum(o.x.n)+" "+o.x.u:jvStk(+o.x.n||0))+" "+pkName(o.x)+(o.x.f>0?", davon "+pkNum(o.x.f)+" Fremdmiete":""));
 return{say:[jvEv(p)+", Auftrag "+(p.ord||"–")+": "+L.length+" Positionen."],speak:[jvEv(p)+". "+L.length+" Positionen."].concat(L.map(x=>x+".")),rows:pkItems(p).map(o=>({l:pkName(o.x),r:pkNum(o.x.n)+(o.x.f>0?" · "+pkNum(o.x.f)+" Fremd":""),cls:o.x.f>0?"warn":"ok",pk:p.id}))}})}
/* ---------- Material: IDs und Materiallisten ---------- */
const jvMlName=c=>c.mode==="bleibt"?"Bleibt: "+(c.ev1||"–"):(c.ev1||"–")+" → "+(c.ev2||"–");
const jvMlItems=c=>{try{return JSON.parse(c.itemsJson||"{}")||{}}catch(e){return{}}};
const jvArtNm=(code,x)=>x&&x.name||(typeof art!=="undefined"&&art[code]?art[code].name:"Artikel "+code);
function jvMlRow(c){return{l:jvMlName(c),sub:nmA(c,"by")+", "+fmt(c.t),r:c.chk?"abgeschlossen":"offen",ml:c.id}}
function jvMlSum(c){const g={};Object.values(jvMlItems(c)).forEach(x=>{const k=x.name?"n:"+x.name:x.art,e=g[k]=g[k]||{n:jvArtNm(x.art,x),q:0};e.q+=x.id?1:(+x.qty||0)});return Object.values(g).sort((a,b)=>b.q-a.q)}
function jvIdWhere(raw){const m=String(raw).match(/(\d{1,6})\s*[-–]\s*(\d{1,4})/);if(!m)return{say:["Sag die ID so: „Wo ist die ID 1234-56?“"]};
 const code=artCode(m[1]),id=String(+m[2]),H=[];
 (typeof lists!=="undefined"?lists:[]).forEach(c=>Object.values(jvMlItems(c)).forEach(x=>{if(x.id!==undefined&&x.id!==null&&artCode(x.art)===code&&String(+x.id)===id)H.push(c)}));
 const nm=jvArtNm(code)+" "+code+"-"+m[2];
 if(!H.length)return{say:["Die ID "+code+"-"+m[2]+" wurde noch in keiner Materialliste gescannt. Beim Rausgehen werden IDs nicht erfasst, deshalb kenne ich sie nur aus Materiallisten."]};
 H.sort((a,b)=>b.t-a.t);const c=H[0];
 return{say:[nm+" wurde zuletzt am "+pkDM(c.t)+" gescannt, in der Materialliste „"+jvMlName(c)+"“ von "+nmA(c,"by")+"."].concat(c.mode==="bleibt"?["Sie bleibt also bei "+(c.ev1||"der Veranstaltung")+"."]:["Sie ging von "+(c.ev1||"–")+" weiter zu "+(c.ev2||"–")+"."]),rows:H.slice(0,5).map(jvMlRow)}}
function jvMlToday(){const t0=jvToday(),L=(typeof lists!=="undefined"?lists:[]).filter(c=>(c.t||0)>=t0);
 if(!L.length)return{say:["Heute kam noch keine Materialliste."]};
 return{say:["Heute "+(L.length===1?"kam eine Materialliste":"kamen "+L.length+" Materiallisten")+": "+jvList(L.slice(0,4).map(c=>jvMlName(c)+" von "+nmA(c,"by")))+"."],rows:L.map(jvMlRow)}}
function jvMlFind(T,mode,T2){return(typeof lists!=="undefined"?lists:[]).filter(c=>(mode==="bleibt"?c.mode==="bleibt":c.mode!=="bleibt")&&T.every(w=>jvNorm(c.ev1).includes(w))&&(!T2||T2.every(w=>jvNorm(c.ev2).includes(w)))).sort((a,b)=>b.t-a.t)}
const jvTk=s=>jvNorm(s).split(" ").filter(w=>w&&!JV_OSTOP.has(w)&&!JV_STOP.has(w)&&!/^(baustelle|bleibt|stehen|steht|direkt|weiter|nach|geht|gehen|y|z|x)$/.test(w));
function jvMlStay(q){const T=jvTk(q);if(!T.length)return{say:["Welche Baustelle? Sag zum Beispiel „Was bleibt auf der Messe Linz stehen?“"]};
 const L=jvMlFind(T,"bleibt");if(!L.length)return{say:["Für „"+T.join(" ")+"“ gibt es keine Materialliste „Bleibt“."]};
 const S=jvMlSum(L[0]);return{say:["Laut Materialliste vom "+pkDM(L[0].t)+" bleiben bei "+(L[0].ev1||"")+" "+(S.length?jvList(S.slice(0,5).map(x=>jvStk(x.q)+" "+x.n)):"keine Artikel")+(S.length>5?" und mehr":"")+"."],rows:S.map(x=>({l:x.n,r:jvStk(x.q),ml:L[0].id})).concat(L.length>1?[{hd:true,l:"Weitere Listen"}].concat(L.slice(1,4).map(jvMlRow)):[])}}
function jvMlNext(q){const n=jvNorm(q),m=n.match(/von (.+?) (?:direkt )?weiter (?:zu|nach|zur|zum) (.+)$/);const T=jvTk(m?m[1]:q),T2=m?jvTk(m[2]):null;
 if(!T.length)return{say:["Von welcher Baustelle? Sag zum Beispiel „Was geht von Messe Linz direkt weiter zu Gala Wien?“"]};
 const L=jvMlFind(T,"weiter",T2&&T2.length?T2:null);if(!L.length)return{say:["Dazu finde ich keine Materialliste „geht weiter“."]};
 const S=jvMlSum(L[0]);return{say:["Laut Materialliste vom "+pkDM(L[0].t)+" geht von "+(L[0].ev1||"")+" direkt weiter zu "+(L[0].ev2||"")+": "+(S.length?jvList(S.slice(0,5).map(x=>jvStk(x.q)+" "+x.n)):"keine Artikel")+(S.length>5?" und mehr":"")+"."],rows:S.map(x=>({l:x.n,r:jvStk(x.q),ml:L[0].id})).concat(L.length>1?[{hd:true,l:"Weitere Listen"}].concat(L.slice(1,4).map(jvMlRow)):[])}}
/* ---------- Werkstatt ---------- */
const jvDefRow=d=>({l:d.art,sub:(d.ev?d.ev+" · ":"")+"gemeldet "+pkDM(d.t),r:d.done?"repariert "+pkDM(d.doneT||d.t):d.urg?"dringend":"offen",cls:!d.done&&d.urg?"warn":"ok",def:d.id});
const jvDefM=(A,d)=>{const m=jvMatcher(A),c=artCode(String(d.anr||"").split(/[-–]/)[0]);return m(c,d.art+" "+(d.desc||""))};
function jvDefOld(n){const m=n.match(/(\d+|[a-zäöü]+)\s*(tag|tage|tagen|woche|wochen)/),k=m?(jvZ(m[1])||1)*(/woche/.test(m[2])?7:1):7,lim=Date.now()-k*864e5;
 const L=defs.filter(d=>!d.done&&d.t<lim).sort((a,b)=>a.t-b.t);const lab=k%7===0?(k===7?"eine Woche":k/7+" Wochen"):k+" Tage";
 if(!L.length)return{say:["Kein offener Defekt ist älter als "+lab+"."]};
 return{say:[(L.length===1?"Ein Defekt ist":L.length+" Defekte sind")+" länger als "+lab+" offen"+(L.length<=3?": "+jvList(L.map(d=>d.art))+".":".")+(jvF()&&L.length>2?" Die Werkstatt hat zu tun.":"")],rows:L.map(jvDefRow)}}
function jvDefArt(q,mode){return jvWithArt(q,A=>{const L=defs.filter(d=>jvDefM(A,d)).sort((a,b)=>b.t-a.t);
 if(!L.length)return{say:["Zu "+A.label+" gibt es keine Defektmeldung."]};
 if(mode==="count"){const o=L.filter(d=>!d.done).length;return{say:[A.label+": "+(L.length===1?"eine Defektmeldung":L.length+" Defektmeldungen")+" bisher"+(o?", "+o+" davon offen":"")+"."+(L.length>=3?(jvF()?" Der Kandidat ist Stammgast in der Werkstatt.":" Das ist öfter."):"")],rows:L.map(jvDefRow)}}
 const d=L[0];return{say:[d.done?A.label+" ist repariert, seit "+jvDL(d.doneT||d.t)+".":A.label+" ist noch nicht repariert"+(d.urg?" – als dringend gemeldet":"")+", gemeldet "+jvAgo(d.t)+"."].concat(L.length>1?["Insgesamt "+L.length+" Meldungen dazu."]:[]),rows:L.slice(0,6).map(jvDefRow)}})}
function jvDefEv(q){const n=jvNorm(q).replace(/^.*?\b(von|bei|auf)\b\s*(der |dem |veranstaltung |baustelle )*/,"");const T=n.split(" ").filter(w=>w&&!JV_OSTOP.has(w)&&!/^(kamen|kam|defekte|defekt)$/.test(w));
 if(!T.length)return{say:["Welche Veranstaltung? Sag zum Beispiel „Welche Defekte kamen von Gala Wien?“"]};
 const L=defs.filter(d=>{const e=jvNorm(d.ev);return e&&T.every(w=>e.includes(w))}).sort((a,b)=>b.t-a.t);
 if(!L.length)return{say:["Von „"+T.join(" ")+"“ ist kein Defekt gemeldet."]};
 const o=L.filter(d=>!d.done).length;return{say:["Von "+(L[0].ev||"")+" "+(L.length===1?"kam ein Defekt":"kamen "+L.length+" Defekte")+(o?", "+o+" davon offen":", alle repariert")+(L.length<=3?": "+jvList(L.map(d=>d.art))+".":".")],rows:L.map(jvDefRow)}}
function jvDefWeek(){const m=pkMon(jvToday()),L=defs.filter(d=>d.done&&(d.doneT||0)>=m).sort((a,b)=>b.doneT-a.doneT);
 if(!L.length)return{say:["Diese Woche wurde noch nichts repariert."]};
 return{say:["Diese Woche "+(L.length===1?"wurde ein Defekt":"wurden "+L.length+" Defekte")+" repariert"+(L.length<=4?": "+jvList(L.map(d=>d.art))+".":".")],rows:L.map(jvDefRow)}}
function jvDefNeed(){if(!can("pk_s"))return JV_NOPK;const t0=jvToday(),G=wbDefNeed(t0,pkAddD(pkMon(t0),7));
 if(!G.length)return{say:["Kein defekter Artikel wird diese Woche in einer Packliste gebraucht."]};
 return{say:[(G.length===1?"Ja, ein Artikel:":"Ja, "+G.length+" Artikel:")].concat(G.slice(0,4).map(g=>g.name+": "+g.n+" Stück defekt"+(g.urg?", "+g.urg+" dringend":"")+", gebraucht "+g.use.map(u=>jvDayName(u.t)+" für "+u.ev+" ("+jvStk(u.q)+")").join(" und ")+".")),
  rows:G.flatMap(g=>g.use.map(u=>({l:g.name,sub:u.ev+" · "+jvStk(u.q)+" gebraucht · "+g.n+" defekt",r:pkWd(u.t),cls:g.urg?"warn":"ok",pk:u.p.id})))}}
/* ---------- Retourscheine ---------- */
function jvRetOpen(q){if(!can("ret_s"))return JV_NORET;const L=jvRetFind(q);
 if(L===null)return{say:["Welchen Retourschein? Sag die Auftragsnummer oder die Veranstaltung."]};
 if(!L.length){const P=jvPkFind(q);if(P&&P.length===1&&can("ret_b"))return{say:["Zu "+jvEv(P[0])+" gibt es noch keinen Retourschein."],acts:[{l:"Neuen Retourschein anlegen",fn:()=>go("ret")}]};return{say:["Dazu finde ich keinen Retourschein."]}}
 if(L.length>1)return{say:["Da passen "+L.length+" Retourscheine. Welchen meinst du?"],rows:L.slice(0,8).map(r=>({l:r.ev||"Retourschein",sub:"Auftrag "+(r.ord||"–"),r:r.closed?"abgeschlossen":"offen",ret:r.id}))};
 curRet=L[0].id;go("retopen");return{say:["Ich öffne den Retourschein."],quiet:true}}
function jvRetStarted(){if(!can("ret_s"))return JV_NORET;const L=rets.filter(r=>!r.closed).sort((a,b)=>(b.modT||b.t||0)-(a.modT||a.t||0));
 if(!L.length)return{say:["Es gibt keine angefangenen Retourscheine."]};
 return{say:[(L.length===1?"Ein Retourschein ist":L.length+" Retourscheine sind")+" angefangen"+(L.length<=3?": "+jvList(L.map(r=>r.ev||"ohne Namen"))+".":".")],rows:L.map(r=>({l:r.ev||"Retourschein",sub:"Auftrag "+(r.ord||"–"),r:rTot(rIt(r))+" Stk · "+jvAgo(r.modT||r.t),ret:r.id}))}}
function jvRetBal(q,mode){if(!can("ret_s"))return JV_NORET;return jvOnePk(q,p=>jvBalAns(p,mode))}
/* „Füge 3 Stück Kabel A zu Retourschein X hinzu.“ */
function jvRetAdd(q){if(!can("ret_b"))return{say:["Dafür fehlt dir das Recht für Retourscheine."]};
 const n=jvNorm(q),m=n.match(/(?:füge|füg|trag|trage|schreib|nimm)\s+(\d+|[a-zäöü]+)\s+(?:stück|stk)?\s*(.+?)\s+(?:zu|zum|in|auf|beim|bei|in den)\s+(?:den |dem |das )?(?:retourschein|retoure|auftrag)\s*(.*?)\s*(?:hinzu|dazu|ein)?$/);
 if(!m)return{say:["Sag es so: „Füge 3 Stück 32A Kabel 50m zu Retourschein 260111401 hinzu.“"]};
 const k=jvZ(m[1]);if(!k||k>999)return{say:["Wie viele Stück? Sag zum Beispiel „Füge 3 Stück …“."]};
 const R=jvRetFind(m[3]||"");if(R===null||!R.length)return{say:["Zu welchem Retourschein? Ich finde keinen passenden. Sag die Auftragsnummer."]};
 const r=R.filter(x=>!x.closed)[0]||R[0];
 return jvWithArt(m[2],A=>{const a=A.kat||rKat().find(x=>A.code&&artCode(x.nr)===A.code);if(!a||!a.nr)return{say:[A.label+" steht nicht in der Artikelliste – bitte im Retourschein manuell eintragen."],acts:[{l:"Retourschein öffnen",fn:()=>{curRet=r.id;go("retopen")}}]};
  if(r.closed)return{say:["Der Retourschein "+(r.ev||"")+" ist abgeschlossen. Erst wieder öffnen, dann geht's."],acts:[{l:"Retourschein öffnen",fn:()=>{curRet=r.id;go("retopen")}}]};
  return{say:[jvStk(k)+" "+a.name+" zu Retourschein "+(r.ev||"")+(r.ord?" ("+r.ord+")":"")+" hinzufügen?"],acts:[{l:"Ja, hinzufügen",fn:()=>jvRetAddDo(r,a,k)},{l:"Abbrechen",fn:()=>{const b=$("#jvans");if(b)b.innerHTML=""}}],speak:[jvStk(k)+" "+a.name+" hinzufügen? Bitte bestätigen."]}})}
function jvRetAddDo(r,a,k){try{if(rs&&rs.id&&rs.id!==r.id)rPersist(true);rs={...rEd(r),lvl:"groups",g:null,u:null};go("retedit");rAdd(a.nr,{nr:a.nr,name:a.name,g:a.g,u:a.u||""},k);retEdit();toast("+"+k+" "+a.name,1)}catch(e){console.error(e);errBox("Das hat nicht geklappt. Bitte im Retourschein selbst eintragen.")}}
/* ---------- Infos an das Lager ---------- */
const jvInfRow=i=>({l:nmA(i,"by"),sub:String(i.text||"").replace(/\s+/g," ").slice(0,70),r:i.read?fmt(i.t).slice(0,6):"neu",cls:i.read?"ok":"warn",inf:i.id});
function jvInfUnread(){const L=infos.filter(i=>!i.read).sort((a,b)=>b.t-a.t);
 if(!L.length)return{say:[jvF()?"Keine ungelesenen Nachrichten. Herrlich ruhig.":"Es gibt keine ungelesenen Nachrichten."]};
 return{say:[(L.length===1?"Eine ungelesene Nachricht":L.length+" ungelesene Nachrichten")+", von "+jvList([...new Set(L.map(i=>nmA(i,"by")))].slice(0,4))+"."],rows:L.map(jvInfRow)}}
function jvInfFrom(q){const T=jvNorm(q).split(" ").filter(w=>w&&!/^(was|hat|haben|der|die|monteur|monteurin|kollege|kollegin|geschrieben|schreibt|geschickt|von|mir|uns|denn|zuletzt|nachricht|nachrichten|info|infos)$/.test(w));
 if(!T.length)return{say:["Von wem? Sag zum Beispiel „Was hat Max geschrieben?“"]};
 const L=infos.filter(i=>{const s=jvNorm((i.by_as||"")+" "+(typeof names!=="undefined"&&names[i.by]||"")+" "+nmA(i,"by"));return T.every(w=>s.split(" ").some(x=>x.startsWith(w)))}).sort((a,b)=>b.t-a.t);
 if(!L.length)return{say:["Von „"+T.join(" ")+"“ finde ich keine Nachricht."]};
 const i=L[0];return{say:[nmA(i,"by")+" hat "+jvAgo(i.t)+" geschrieben: "+String(i.text||"(nur Foto)")],rows:L.slice(0,6).map(jvInfRow)}}
function jvInfLast(){const L=infos.slice().sort((a,b)=>b.t-a.t);if(!L.length)return{say:["Es gibt keine Nachrichten."]};const i=L[0];
 return{say:["Neueste Nachricht von "+nmA(i,"by")+", "+jvAgo(i.t)+" um "+jvTime(i.t)+": "+String(i.text||"(nur Foto)")],speak:["Neueste Nachricht von "+nmA(i,"by")+".",String(i.text||"Nur ein Foto.")],rows:[jvInfRow(i)]}}
/* ---------- Rückblick ---------- */
function jvClosedPacks(){return packs.filter(p=>pkRets(p).some(rIsEnd)).map(p=>({p,ct:Math.max(...pkRets(p).filter(rIsEnd).map(r=>r.closedT||0)),B:jvBal(p)})).sort((a,b)=>b.ct-a.ct)}
function jvLastMissing(){if(!can("ret_s")||!can("pk_s"))return JV_NORET;const L=jvClosedPacks().filter(o=>o.B.miss.length);
 if(!L.length)return{say:["Bei keiner abgeschlossenen Retoure fehlte laut Abgleich etwas."]};const o=L[0];
 return{say:["Zuletzt fehlte etwas bei "+jvEv(o.p)+" (Auftrag "+(o.p.ord||"–")+", Retoure "+pkDM(o.ct)+"): "+jvList(o.B.miss.slice(0,4).map(e=>jvStk(e.soll-e.back)+" "+e.name))+"."],rows:L.slice(0,6).map(o=>({l:jvEv(o.p),sub:"Retoure "+pkDM(o.ct),r:o.B.miss.reduce((a,e)=>a+e.soll-e.back,0)+" Stk fehlen",cls:"warn",pk:o.p.id}))}}
function jvTopMissing(){if(!can("ret_s")||!can("pk_s"))return JV_NORET;const M={};jvClosedPacks().forEach(o=>o.B.miss.forEach(e=>{const x=M[e.k]=M[e.k]||{n:e.name,a:0,q:0};x.a++;x.q+=e.soll-e.back}));
 const L=Object.values(M).sort((a,b)=>b.a-a.a||b.q-a.q);if(!L.length)return{say:["Bisher fehlte bei keiner abgeschlossenen Retoure etwas."]};
 return{say:["Am häufigsten fehlt "+L[0].n+": bei "+L[0].a+(L[0].a===1?" Auftrag":" Aufträgen")+", zusammen "+jvStk(L[0].q)+"."].concat(L.length>1?["Danach: "+jvList(L.slice(1,4).map(x=>x.n))+"."]:[]),rows:L.slice(0,10).map(x=>({l:x.n,sub:x.a+(x.a===1?" Auftrag":" Aufträge"),r:jvStk(x.q),cls:"warn"}))}}
function jvMonthBad(){if(!can("ret_s")||!can("pk_s"))return JV_NORET;const d=new Date();d.setDate(1);d.setHours(0,0,0,0);const L=jvClosedPacks().filter(o=>o.ct>=d.getTime()&&o.B.miss.length);
 const mn=d.toLocaleDateString("de-AT",{month:"long"});if(!L.length)return{say:["Im "+mn+" war jede abgeschlossene Retoure vollständig."]};
 return{say:["Im "+mn+" "+(L.length===1?"war ein Auftrag":"waren "+L.length+" Aufträge")+" unvollständig"+(L.length<=3?": "+jvList(L.map(o=>jvEv(o.p)))+".":".")],rows:L.map(o=>({l:jvEv(o.p),sub:"Retoure "+pkDM(o.ct),r:o.B.miss.reduce((a,e)=>a+e.soll-e.back,0)+" Stk fehlen",cls:"warn",pk:o.p.id}))}}
function jvRetWeek(){if(!can("ret_s"))return JV_NORET;const m=pkMon(jvToday()),C=rets.filter(r=>r.closed&&(r.closedT||0)>=m),N=rets.filter(r=>(r.t||0)>=m);
 return{say:["Diese Woche "+(C.length===1?"wurde ein Retourschein":"wurden "+C.length+" Retourscheine")+" abgeschlossen"+(N.length?", "+N.length+" neu angefangen":"")+"."],rows:C.sort((a,b)=>b.closedT-a.closedT).map(r=>({l:r.ev||"Retourschein",sub:"Auftrag "+(r.ord||"–"),r:"abgeschlossen "+pkWd(r.closedT),ret:r.id}))}}
/* ---------- Aktionen ---------- */
function jvKlar(q,undo){return jvOnePk(q,p=>{const K=pkH(p).klar;
 if(undo){if(!K)return{say:[jvEv(p)+" ist nicht als geklärt markiert."]};return{say:["Bei "+jvEv(p)+" „geklärt“ zurücknehmen?"],acts:[{l:"Ja, zurücknehmen",fn:()=>pkHSet(p,{klar:null}).then(()=>{toast("Zurückgenommen",1);jvAsk("Was ist mit Auftrag "+(p.ord||p.ev))})}]}}
 if(K&&K.t)return{say:[jvEv(p)+" ist schon geklärt, von "+nmA(K,"by")+" am "+pkDM(K.t)+"."]};
 return{say:["Auftrag "+(p.ord||"–")+" ("+jvEv(p)+") als mit dem Projektleiter geklärt markieren? Dann gilt er nicht mehr als überfällig."],speak:["Als geklärt markieren? Bitte bestätigen."],
  acts:[{l:"Ja, als geklärt markieren",fn:()=>pkHSet(p,{klar:{by:me,t:Date.now()}}).then(()=>{toast("Als geklärt markiert",1);jvShowRes({say:[jvEv(p)+" ist als geklärt markiert."],q:"Markiere Auftrag "+(p.ord||"")+" als geklärt"})})},{l:"Abbrechen",fn:()=>{const b=$("#jvans");if(b)b.innerHTML=""}}]}})}
function jvNote(q){const s=String(q).trim(),m=s.match(/^(?:bitte\s+)?notier\w*\s+(?:dir\s+)?(?:zu|bei|für|zum)?\s*(?:auftrag|veranstaltung|packliste)?\s*(.+?)\s*[:–-]\s*(.+)$/i)||s.match(/^(?:bitte\s+)?notier\w*\s+(?:dir\s+)?(?:zu|bei|für|zum)?\s*(?:auftrag)?\s*(\d{6,}[\d-]*)\s+(.+)$/i);
 if(!m)return{say:["Sag es so: „Notiere zu Auftrag 260111401: Kunde holt selbst ab.“"]};
 const txt=m[2].trim();if(!txt)return{say:["Was soll ich notieren?"]};
 return jvOnePk(m[1],p=>{pkHSet(p,{["n_"+Date.now().toString(36)]:{txt,by:me,t:Date.now()}}).then(()=>toast("Notiz gespeichert",1));
  return{say:["Notiert bei "+jvEv(p)+": "+txt],acts:[{l:"Packliste öffnen",fn:()=>{curPack=p.id;go("packopen")}}]}})}
const jvNotes=p=>{const H=pkH(p);return Object.keys(H).filter(k=>/^n_/.test(k)&&H[k]&&H[k].txt).map(k=>H[k]).sort((a,b)=>a.t-b.t)};
function jvDefTell(q){const s=String(q).replace(/^.*?defekt\s*(melden)?\s*[:,-]?\s*/i,"").trim();
 const i=s.search(/[,:;]/),a=(i>0?s.slice(0,i):s).trim(),d=i>0?s.slice(i+1).trim():"";
 dpho=null;go("defnew");setTimeout(()=>{const g=id=>document.getElementById(id);if(g("dnart")&&a)g("dnart").value=a.charAt(0).toUpperCase()+a.slice(1);if(g("dnds")&&d)g("dnds").value=d.charAt(0).toUpperCase()+d.slice(1);
  const R=a?jvArtFind(a):null;if(R&&R.A&&R.A.code&&g("dnnr"))g("dnnr").value=R.A.code},60);
 return{say:["Defekt melden"+(a?": "+a:"")+". Bitte noch die Veranstaltung ergänzen und senden."],quiet:true}}
function jvRetMail(q){if(!can("ret_s"))return JV_NORET;return jvOnePk(q,p=>{const R=pkRets(p),r=R.filter(x=>x.closed)[0]||R[0];
 if(!r)return{say:["Zu "+jvEv(p)+" gibt es noch keinen Retourschein. Erst den Retourschein ausfüllen, dann schreibe ich die Retoure."],acts:can("ret_b")?[{l:"Neuen Retourschein anlegen",fn:()=>go("ret")}]:[]};
 const B=jvBal(p),go2=()=>{curRet=r.id;go("retopen");setTimeout(()=>{rMailAsk(r);setTimeout(()=>{const m=document.getElementById("mto");if(m&&!m.value&&p.pl)m.value=p.pl},30)},80)};
 const say=[];if(B.miss.length)say.push("Achtung: laut Abgleich fehlen noch "+jvList(B.miss.slice(0,3).map(e=>jvStk(e.soll-e.back)+" "+e.name))+".");
 if(!r.closed)say.push("Der Retourschein ist noch nicht abgeschlossen.");
 if(!say.length){go2();return{say:["Ich öffne die Retoure an "+(jvPl(p)||"den Projektleiter")+"."],quiet:true}}
 return{say,acts:[{l:"Trotzdem Retoure schreiben",fn:go2},{l:"Retourschein öffnen",fn:()=>{curRet=r.id;go("retopen")}}]}})}
function jvMailDlg(title,subj,body){const o=document.createElement("div");o.className="ov";
 o.innerHTML='<div class="card" style="width:100%;max-width:460px;margin:0;max-height:92vh;overflow:auto"><b></b><p class="mute" style="margin:4px 0 8px"></p><textarea id="jvmt" style="min-height:220px"></textarea><div class="row" style="margin-top:8px"><a class="btn" id="jvmm" href="#">Mail öffnen</a><button class="btn ghost" id="jvms2" type="button" hidden>Teilen</button></div><div class="row" style="margin-top:8px"><button class="btn ghost" id="jvmc" type="button">Text kopieren</button><button class="btn ghost" id="jvmx" type="button">Schließen</button></div></div>';
 document.body.appendChild(o);const g=id=>o.querySelector("#"+id),ta=g("jvmt");o.querySelector("b").textContent=title;o.querySelector("p").textContent="Betreff: "+subj;ta.value=body;
 const upd=()=>{g("jvmm").href="mailto:?subject="+encodeURIComponent(subj)+"&body="+encodeURIComponent(ta.value)};upd();ta.oninput=upd;g("jvmm").onclick=()=>setTimeout(()=>o.remove(),300);
 if(navigator.share){g("jvms2").hidden=false;g("jvms2").onclick=()=>navigator.share({title:subj,text:ta.value}).then(()=>o.remove()).catch(()=>{})}
 g("jvmc").onclick=async()=>{try{await navigator.clipboard.writeText(subj+"\n\n"+ta.value);toast("Text kopiert",1)}catch(e){ta.select();toast("Bitte Text markieren und kopieren.")}};g("jvmx").onclick=()=>o.remove()}
function jvAskPl(q){return jvOnePk(q,jvAskPlP)}
function jvAskPlP(p){{const B=jvBal(p),vn=String(p.pl||"").split(" ")[0],me1=meName(),ov=pkState(p).k==="over";
 const L=B.has?B.miss.map(e=>"- "+jvStk(e.soll-e.back)+" "+e.name+(e.back?" (zurück: "+pkNum(e.back)+" von "+pkNum(e.soll)+")":"")):[];
 const body="Hallo"+(vn?" "+vn:"")+",\n\nkurze Nachfrage zu Auftrag "+(p.ord||"–")+" – "+(p.ev||"")+" (Dispo-Ende "+pkD(p.de)+"):\n\n"+
  (B.has?(L.length?"Laut Retourschein fehlt noch:\n"+L.join("\n")+"\n\nWeißt du, wo das Material ist bzw. wann es kommt?":"Bei uns ist laut Retourschein alles da. Passt das so für dich?"):(ov?"Das Material ist bei uns noch nicht zurück. Weißt du, wann es kommt?":"Weißt du schon, wann das Material zurückkommt?"))+
  "\n\nDanke und LG\n"+me1;
 jvMailDlg("Nachfrage an "+(jvPl(p)||"Projektleiter"),"Nachfrage Auftrag "+(p.ord||"")+" – "+(p.ev||""),body);
 return{say:["Hier ist die Nachfrage an "+(jvPl(p)||"den Projektleiter")+". Die Adresse gibst du im Mailprogramm ein."],quiet:true}}}
/* ---------- Erinnerungen (docs „jverin“, nur eigene) ---------- */
let jvErins=[],jvErinOn=false;
function jvErinSub(){if(jvErinOn)return;jvErinOn=true;try{db.collection("jverin").onSnapshot(s=>{jvErins=s.docs.map(d=>({id:d.id,...d.data()}));draw()})}catch(e){console.warn(e)}}
const jvErinMine=()=>{const a=tabAs("by").by_as||"";return jvErins.filter(x=>x.by===me&&(x.by_as||"")===a&&!x.done).sort((a,b)=>a.due-b.due)};
const jvErinDue=()=>jvErinMine().filter(x=>x.due<=Date.now());
function jvErin(q){const s=String(q).toLowerCase();let D=jvDayIn(s);
 let h=8,mi=0,tm=false;const m=s.match(/\bum\s+(\d{1,2})(?:[:.](\d{2}))?|(\d{1,2})(?:[:.](\d{2}))?\s*uhr|\bhalb\s+(\d{1,2})/);
 if(m){tm=true;if(m[5]){h=+m[5]-1;mi=30}else{h=+(m[1]||m[3]);mi=+(m[2]||m[4]||0)}}
 if(h>23||mi>59)return{say:["Die Uhrzeit verstehe ich nicht. Sag zum Beispiel „um 9“ oder „um 14:30“."]};
 if(!D)D={t:jvToday(),lab:"heute"};let due=new Date(D.t);due.setHours(h,mi,0,0);due=due.getTime();if(due<=Date.now()){if(D.lab==="heute"&&!tm){due=pkAddD(due,1)}else if(D.lab==="heute")due=pkAddD(due,1)}
 const tx=String(q).replace(/^.*?\ban\b\s*/i,"").replace(/\s*(heute|morgen|übermorgen)?\s*(um\s+\d{1,2}([:.]\d{2})?|\d{1,2}([:.]\d{2})?\s*uhr|halb\s+\d{1,2})\s*$/i,"").trim()||String(q);
 const P=jvPkFind(tx),p=P&&P.length===1?P[0]:null,id=Date.now().toString(36)+Math.random().toString(36).slice(2,5);
 const txt=p?jvEv(p)+" (Auftrag "+(p.ord||"–")+")":tx.charAt(0).toUpperCase()+tx.slice(1);
 db.doc("jverin/"+id).set({by:me,t:Date.now(),due,txt,pk:p?p.id:"",done:false}).then(()=>toast("Erinnerung gespeichert",1)).catch(()=>errBox("Erinnerung konnte nicht gespeichert werden."));
 const dl=pkDay(due)===jvToday()?"heute":pkDay(due)===pkAddD(jvToday(),1)?"morgen":jvDL(due);
 return{say:["Mach ich. Ich erinnere dich "+dl+" um "+jvTime(due)+" an "+txt+".","Die Erinnerung siehst du hier im Lager Assistenten und auf der Kachel – eine Nachricht aufs Handy bei geschlossener App kann ich noch nicht schicken."],speak:["Mach ich. "+jvCap(dl)+" um "+jvTime(due)+"."]}}
function jvErinDlg(x){ask2("Erinnerung: "+x.txt+" ("+(pkDay(x.due)===jvToday()?"heute":jvDL(x.due))+" "+jvTime(x.due)+")","Erledigt",x.pk?"Packliste öffnen":"Schließen",()=>db.doc("jverin/"+x.id).update({done:true,doneT:Date.now()}).then(()=>toast("Erledigt",1)),()=>{if(x.pk&&packs.some(p=>p.id===x.pk)){curPack=x.pk;go("packopen")}})}
function jvErinPanel(){const L=jvErinMine();if(!L.length)return"";const due=L.filter(x=>x.due<=Date.now());
 return '<section class="jvpn'+(due.length?' al':'')+'"><div class="jvlb">Erinnerungen <span>'+(due.length?due.length+" fällig":L.length)+'</span></div>'+L.slice(0,6).map(x=>'<button class="jvrow" type="button" data-jer="'+esc(x.id)+'"><span>'+esc(x.txt)+'</span><span class="'+(x.due<=Date.now()?"warn":"ok")+'">'+(x.due<=Date.now()?"fällig":(pkDay(x.due)===jvToday()?"heute":pkWd(x.due)))+" "+jvTime(x.due)+'</span></button>').join("")+'</section>'}
function jvErinBind(){document.querySelectorAll("[data-jer]").forEach(b=>b.onclick=()=>{const x=jvErins.find(e=>e.id===b.dataset.jer);if(x)jvErinDlg(x)})}
let jvErinN=-1;setInterval(()=>{try{const n=jvErinDue().length;if(n!==jvErinN){const f=jvErinN>=0;jvErinN=n;if(f&&(view==="jarvis"||view==="start"))draw()}}catch(e){}},30000);
/* ---------- Hilfe-Bildschirm ---------- */
const JV_FRAGEN=[
 {g:"Rücklauf & Dispo",r:"pk_s",q:["Was ist seit mehr als 3 Tagen überfällig?","Welcher Auftrag ist am längsten überfällig?","Was hätte gestern zurückkommen sollen?","Was kommt diese Woche noch zurück?","Wann endet die Dispo von Auftrag X?","Welche Aufträge von Projektleiter A sind noch offen?","Für welche zurückgekommenen Aufträge ist noch keine Retoure geschrieben?"]},
 {g:"Herrichten",r:"pk_s",q:["Was muss ich morgen herrichten?","Was geht übermorgen raus?","Wo gibt es heute rote Zahlen?","Ist Artikel X am Dienstag verfügbar?","Welche Packscheine sind angefangen, aber nicht fertig?","Was fehlt beim Packschein von Auftrag X noch?","Wo habe ich eine Alternative eingetragen?","Wer ist Projektleiter von Auftrag X?","Lies mir die Packliste von Auftrag X vor."]},
 {g:"Material suchen & zuordnen",q:["Auf welcher Baustelle sind 50m 32A?","Wo ist gerade die ID 1234-56?","Wie viele Artikel X sind gerade auf Baustellen?","Auf welcher Veranstaltung war Artikel X zuletzt?","Zu welchem Auftrag könnten 4 Stück Kabel A gehören?","Was fehlt bei Auftrag X noch?","Was bleibt auf Baustelle Y stehen?","Was geht von Baustelle Y direkt weiter zu Z?","Welche Materiallisten kamen heute von den Monteuren?"],note:"IDs kennt der Assistent nur, wenn sie in einer Materialliste gescannt wurden."},
 {g:"Werkstatt",q:["Welche Defekte sind dringend?","Welche Defekte sind älter als eine Woche?","Ist Artikel X schon repariert?","Welche Defekte kamen von Veranstaltung Y?","Gab es bei Artikel X schon öfter Defekte?","Was wurde diese Woche repariert?","Wird ein defekter Artikel diese Woche gebraucht?"]},
 {g:"Retourschein",r:"ret_s",q:["Öffne den Retourschein für Auftrag X.","Neuen Retourschein erstellen.","Welche Retourscheine sind angefangen?","Was muss ich prüfen?","Was fehlt bei Retourschein X gegenüber der Packliste?","Füge 3 Stück Kabel A zu Retourschein X hinzu."]},
 {g:"Info an das Lager",q:["Gibt es ungelesene Nachrichten?","Was hat Monteur X geschrieben?","Lies mir die neueste Nachricht vor."]},
 {g:"Rückblick & Auswertung",r:"ret_s",q:["War bei Auftrag X alles zurück?","Welche Veranstaltung hatte zuletzt Fehlmaterial?","Welche Artikel fehlen am häufigsten?","Welche Aufträge waren diesen Monat unvollständig?","Wie viele Retouren gab es diese Woche?"]},
 {g:"Aktionen",q:["Briefing noch einmal.","Zeig mir den Wochenbericht.","Erinnere mich morgen um 9 an Auftrag X.","Markiere Auftrag X als geklärt.","Notiere zu Auftrag X: …","Melde Defekt: Kabel 32A 25 m, Stecker gebrochen.","Auftrag X alles zurück, schreib Retoure an Projektleiter A.","Schick Projektleiter A eine Nachfrage zu Auftrag X."]}];
function jvHelpOpen(){const old=document.querySelector(".jvhelp");if(old)old.remove();const o=document.createElement("div");o.className="jvhelp";o.setAttribute("role","dialog");o.setAttribute("aria-label","Hilfe");
 const G=JV_FRAGEN.filter(g=>!g.r||can(g.r));
 o.innerHTML='<header class="jvhh"><button class="jvhb" type="button" aria-label="Zurück"><svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="2.5" stroke-linecap="round" aria-hidden="true"><path d="M15 6l-6 6 6 6"/></svg></button><div><b>Hilfe</b><small>Was kann ich fragen?</small></div></header>'+
  '<div class="jvhw"><section class="jvhc"><p>Sag oder tipp eine Frage. Tippst du hier auf eine Frage, wird sie gleich gestellt. Für X, Y und A setzt du Auftrag, Baustelle oder Projektleiter ein.</p><label class="jvhs"><span>Fragen durchsuchen</span><input type="search" placeholder="Fragen durchsuchen …" id="jvhsq"></label></section>'+
  G.map((g,gi)=>'<section class="jvhc" data-hg="'+gi+'"><b class="jvhg">'+esc(g.g)+'</b>'+g.q.map(t=>'<button class="jvhq" type="button" data-hq="'+esc(t)+'">„'+esc(t)+'“</button>').join("")+(g.note?'<p class="jvhn">'+esc(g.note)+'</p>':'')+'</section>').join("")+
  '<p class="jvhn jvhnone" hidden>Keine passende Frage gefunden.</p></div>';
 document.body.appendChild(o);document.body.classList.add("jvhopen");
 const close=()=>{o.remove();document.body.classList.remove("jvhopen")};o.querySelector(".jvhb").onclick=close;
 o.querySelectorAll("[data-hq]").forEach(b=>b.onclick=()=>{const t=b.dataset.hq;close();
  if(/\b[XYZA]\b|…/.test(t)&&!/^Melde Defekt/.test(t)){const q=$("#jvaq");if(q){q.value=t.replace(/\s*…$/," ");q.focus();const i=t.search(/\b[XYZA]\b/);if(i>=0)try{q.setSelectionRange(i,i+1)}catch(e){}else try{q.setSelectionRange(q.value.length,q.value.length)}catch(e){}jvMs("Ersetze X, Y oder A durch Auftrag, Baustelle oder Projektleiter, dann „Fragen“.")}}
  else jvAsk(t)});
 const sq=o.querySelector("#jvhsq");sq.oninput=()=>{const v=jvNorm(sq.value);let any=0;o.querySelectorAll("[data-hg]").forEach(sec=>{let k=0;sec.querySelectorAll("[data-hq]").forEach(b=>{const on=!v||jvNorm(b.dataset.hq).includes(v);b.hidden=!on;if(on)k++});sec.hidden=!k;any+=k});o.querySelector(".jvhnone").hidden=!!any}}
/* ---------- Antwort anzeigen ---------- */
function jvFin(A,q){A.q=q;A.say=(A.say||[]).filter(Boolean).map(x=>String(x).replace(/\.\.(\s|$)/g,".$1"));return A}
function jvShowRes(A){jvFin(A,A.q||"");if(view==="jarvis")jvShow(A,!A.quiet);else jvLast=A}
function jvShow(A,speak){jvLast=A;const box=$("#jvans");if(!box)return;const R=A.rows||[];
 box.innerHTML='<button class="jvax" type="button" aria-label="Antwort schließen"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" aria-hidden="true"><path d="M6 6l12 12M18 6L6 18"/></svg></button><div class="jvaq2">„'+esc(A.q)+'“</div><div class="jvat">'+A.say.map(esc).join(" ")+'</div>'+
  (R.length?'<div class="jvarows">'+R.map((r,i)=>r.hd?'<div class="jvahd">'+esc(r.l)+'</div>':r.sum?'<div class="jvrow jvsum"><span>'+esc(r.l)+'</span><span>'+esc(r.r||"")+'</span></div>':
   '<button class="jvrow" type="button" data-ja="'+i+'"><span>'+esc(r.l)+(r.sub?'<small>'+esc(r.sub)+'</small>':'')+'</span><span class="'+(r.cls||"ok")+'">'+esc(r.r||"")+'</span></button>').join("")+'</div>':'')+
  (A.acts&&A.acts.length?'<div class="jvacts">'+A.acts.map((a,i)=>'<button class="jvact" type="button" data-jact="'+i+'">'+esc(a.l)+'</button>').join("")+'</div>':'');
 box.querySelectorAll("[data-ja]").forEach(b=>b.onclick=()=>{const r=R[+b.dataset.ja];
  if(r.fn){const B=r.fn();if(B){B.q=A.q;jvShowRes(B)}}else if(r.pk){curPack=r.pk;go("packopen")}else if(r.ret){curRet=r.ret;go("retopen")}else if(r.def){curDef=r.def;go("defopen")}
  else if(r.inf){curInfo=r.inf;go("infoopen")}else if(r.ml&&typeof lists!=="undefined"&&lists.some(c=>c.id===r.ml)){cur=r.ml;go("scan")}});
 box.querySelectorAll("[data-jact]").forEach(b=>b.onclick=()=>A.acts[+b.dataset.jact].fn());
 box.querySelector(".jvax").onclick=()=>{jvStop();jvLast=null;box.innerHTML=""};
 if(speak&&jvReadOn()){jvMode="ask";jvSpeakLines((A.speak||A.say).slice(0,A.speak?80:6))}}
/* ---------- Erkennen ---------- */
function jvAnswer(q){const n=jvNorm(q),raw=String(q);
 if(/^(hilfe|help)$|was kann ich (dich )?fragen|was kannst du|was verstehst du|wie funktioniert/.test(n)){setTimeout(jvHelpOpen,30);return{say:["Hier ist meine Liste. Tipp eine Frage an, dann stelle ich sie."]}}
 if(/briefing|was steht (heute )?an|lagebericht|zusammenfassung/.test(n)){jvMode="brief";jvSpeakLines(jvText(jvData()));return{say:["Briefing läuft."],quiet:true}}
 /* Aktionen */
 if(/^(bitte )?erinner/.test(n))return jvErin(raw);
 if(/^(bitte )?notier|^notiz\b/.test(n))return jvNote(raw);
 if(/geklärt|geklaert/.test(n))return jvKlar(raw,/nicht (mehr )?geklärt|zurücknehm|rückgängig|doch nicht|aufheben/.test(n));
 if(/^(bitte )?(melde|meld) (einen )?defekt|^defekt melden/.test(n)){if(/[:,]|defekt\s+\S+\s+\S+/.test(raw.replace(/^.*?defekt/i,"")))return jvDefTell(raw);dpho=null;go("defnew");return{say:["Defekt melden."],quiet:true}}
 if(/schreib\w* .*retoure|retoure .*schreib/.test(n))return jvRetMail(raw);
 if(/nachfrage|frag (mal )?(beim |den )?projektleiter/.test(n))return jvAskPl(raw.replace(/projektleiter(in)?\s+\S+\s+(eine )?nachfrage/i,"nachfrage"));
 if(/^(bitte )?(füge|füg|trag|trage|nimm)\b.*(retourschein|retoure)/.test(n))return jvRetAdd(raw);
 if(/(neue[nrs]?|anlegen|erstelle).*retourschein|retourschein.*(neu|anlegen|erstellen)/.test(n)){if(!can("ret_b"))return{say:["Dafür fehlt dir das Recht für Retourscheine."]};go("ret");return{say:["Ich öffne die Retourscheine."],quiet:true}}
 if(/info (an|ans|für) (das )?lager|nachricht (an|ans) (das )?lager/.test(n)){ipho=null;go("infonew");return{say:["Info an das Lager."],quiet:true}}
 if(/^(übersicht|packlisten|zur übersicht|zeig (die )?übersicht)$/.test(n)){if(!can("pk_s"))return JV_NOPK;go("pack");return{say:["Übersicht."],quiet:true}}
 /* IDs, Materiallisten, Nachrichten */
 if(/\bid\b|\bids\b/.test(n)||/\b\d{3,4}\s*[-–]\s*\d{1,3}\b/.test(raw))return jvIdWhere(raw);
 if(/materialliste/.test(n))return jvMlToday();
 if(/\bbleib\w*\b.*\bsteh/.test(n)||/^was bleibt/.test(n))return jvMlStay(raw);
 if(/direkt weiter|\bweiter (zu|nach|zur|zum)\b/.test(n))return jvMlNext(raw);
 if(/ungelesen|neue nachricht/.test(n))return jvInfUnread();
 if(/(neueste|letzte) nachricht|nachricht vor/.test(n))return jvInfLast();
 if(/geschrieben|hat .* geschickt|schreibt/.test(n)&&!/retoure/.test(n))return jvInfFrom(raw);
 /* Werkstatt */
 if(/defekt|kaputt|repariert|reparatur|werkstatt/.test(n)){
  if(/gebraucht|braucht|benötigt/.test(n))return jvDefNeed();
  if(/älter|länger als|seit (mehr|über)/.test(n))return jvDefOld(n);
  if(/öfter|oft|häufig|wie viele defekte|schon mal/.test(n))return jvDefArt(raw,"count");
  if(/diese woche|woche/.test(n)&&/repariert/.test(n))return jvDefWeek();
  if(/kamen|von (der )?veranstaltung|bei (der )?veranstaltung|von (der )?baustelle/.test(n))return jvDefEv(raw);
  if(/^ist\b|schon repariert|noch kaputt|wieder (da|ganz|einsatz)/.test(n)&&jvArtFind(raw))return jvDefArt(raw,"status");
  return jvDef(q)}
 if(/(muss|soll) ich .*prüf|zu prüfen|was ist zu prüfen|prüfen\?$/.test(n)){if(!can("abg_p"))return{say:["Dafür brauchst du das Recht „Abgleich prüfen“."]};const L=abgToCheck();if(!L.length)return{say:[jvF()?"Nichts zu prüfen. Kaffeepause verdient.":"Es ist nichts zu prüfen."]};
  return{say:[(L.length===1?"Ein Auftrag wartet":L.length+" Aufträge warten")+" auf deine Prüfung: "+jvList(L.slice(0,4).map(x=>x.p?x.p.ev||x.p.ord:x.r.ev))+"."],rows:L.map(x=>({l:x.p?x.p.ev||"–":x.r.ev||"–",sub:"Endretoure von "+nmA(x.r,"closedBy")+", "+pkDM(x.r.closedT),r:x.B?(x.B.fehlt?x.B.fehlt+" fehlen":x.B.zuviel?x.B.zuviel+" zu viel":"alles zurück"):"ohne Packliste",cls:x.B&&(x.B.fehlt||x.B.zuviel)?"warn":"ok",fn:()=>{if(x.p){curPack=x.p.id;go("pkabg")}else{curRet=x.r.id;go("retopen")}}}))}}
 if(/wochenbericht|besprechung/.test(n)){go("wb");return{say:["Ich öffne den Wochenbericht."],quiet:true}}
 /* Rückblick */
 if(/alles zurück|vollständig zurück|komplett zurück/.test(n)&&/^(war|ist|kam)\b/.test(n))return jvRetBal(raw,"all");
 if(/zuletzt fehlmaterial|fehlmaterial/.test(n))return jvLastMissing();
 if(/(am )?(häufigsten|meisten|öftesten)/.test(n)&&/fehl/.test(n))return jvTopMissing();
 if(/unvollständig/.test(n))return jvMonthBad();
 if(/wie viele retour/.test(n))return jvRetWeek();
 /* Retourscheine */
 if(/retourschein/.test(n)){
  if(/fehlt|fehlen|gegenüber|vergleich/.test(n))return jvRetBal(raw,"miss");
  if(/angefangen|offen|welche retourscheine|weiter bearbeiten/.test(n))return jvRetStarted();
  if(/öffne|zeig|mach .* auf|aufmachen/.test(n))return jvRetOpen(raw)}
 /* Herrichten */
 if(/rote zahl|roten zahl|fremdmiete/.test(n))return jvRed(jvDayIn(raw)||{t:jvToday(),lab:"heute"});
 if(/verfügbar|frei am|haben wir am|übrig am/.test(n)){const D=jvDayIn(raw)||{t:jvToday(),lab:"heute"};return jvWithArt(raw,A=>jvAvailA(A,D))}
 if(/packschein/.test(n)&&/angefangen|nicht fertig|halb/.test(n))return jvPkStarted();
 if(/alternative/.test(n))return jvAlt(n);
 if(/fehlt/.test(n)&&/packschein|herricht/.test(n))return jvPkMissing(raw);
 if(/projektleiter/.test(n)&&/^wer\b/.test(n))return jvPlOf(raw);
 if(/(lies|lese|vorlesen).*(packliste|packschein)|(packliste|packschein).*vor(lesen)?$/.test(n))return jvReadPk(raw);
 /* Rücklauf & Dispo */
 if(/überfällig/.test(n)){if(/längsten|ältest/.test(n))return jvOverLongest();if(/seit|mehr als|länger als|über \d/.test(n))return jvOverDays(n);return jvOver()}
 if(/(hätte|sollte|sollten|hätten).*zurück/.test(n)){const D=jvDayIn(raw)||{t:pkAddD(jvToday(),-1),lab:"gestern"};return jvBackDay(D)}
 if(/woche/.test(n)&&/zurück/.test(n))return jvBackWeek();
 if(/dispo/.test(n)&&/(endet|ende|wann|bis wann)/.test(n))return jvDispo(raw);
 if(/projektleiter/.test(n)&&/offen|aufträge/.test(n))return jvPlOpen(raw);
 if(/keine retoure|retoure (noch )?nicht (geschrieben|geschickt)|ohne retoure/.test(n))return jvNoMail();
 /* Material */
 if(/zuletzt|letzte(n)? (veranstaltung|baustelle|einsatz)/.test(n))return jvWithArt(raw,jvLastA);
 if(/gehör|zuordnen|herrenlos/.test(n)){const m=n.match(/(\d+|[a-zäöü]+)\s+(stück|stk)/),k=m?jvZ(m[1]):0;return jvWithArt(raw,A=>jvBelongA(A,k))}
 if(/\bfehlt|fehlen\b/.test(n)&&(/\d{6,}/.test(n)||/auftrag|veranstaltung/.test(n)))return jvRetBal(raw,"miss");
 if(/wie viele/.test(n)&&!/retour|defekt/.test(n))return jvWithArt(raw,A=>jvWhereA(A,true));
 if(/\bwo (ist|sind|befindet|befinden|steckt|stecken|liegt|liegen)\b|\bwo hab(en)? wir\b|auf welche[rnm]? (baustelle|veranstaltung)|bei welche[rnm]? (baustelle|veranstaltung)|\bwo (gerade|überall)\b/.test(n))return jvWithArt(raw,A=>jvWhereA(A,false));
 /* bisherige Fragen */
 if(/zurück|retour kommt|kommt.*retour/.test(n)&&!/\d{6,}/.test(n))return jvBack(q);
 if(/herzurichten|herrichten|hergerichtet|zu richten|packen|\braus\b|ausliefern/.test(n)&&!/\d{6,}/.test(n))return jvHerr(q);
 if(/\d{6,}/.test(n)||/auftrag|packliste|veranstaltung|^zeig|was ist mit|wie schaut|stand/.test(n))return jvOrder(q,/^(zeig|öffne|öffnen|mach .* auf)/.test(n)||/\b(zeig|öffne)\b/.test(n));
 /* nur ein Artikel genannt („50m 32A?“) */
 const R=jvArtFind(raw);if(R&&(R.list||(R.A&&!R.A.byText)))return jvWithArt(raw,A=>jvWhereA(A,false));
 return{say:[jvF()?jvPick(["Das habe ich nicht verstanden. Sag „Hilfe“, dann zeige ich dir, was ich kann.","Hm. Das ist mir zu hoch. Sag „Hilfe“ für meine Liste."]):"Das habe ich nicht verstanden. Sag „Hilfe“, dann zeige ich dir, was ich kann."]}}
function jvAsk(q){q=String(q||"").trim();if(!q)return;jvStop();let A;try{A=jvAnswer(q)}catch(e){console.error(e);A={say:["Da ist bei mir etwas schiefgegangen. Bitte nochmal versuchen."]}}
 jvFin(A,q);const inp=$("#jvaq");if(inp)inp.value="";jvMs("");if(view==="jarvis")jvShow(A,!A.quiet);else jvLast=A}
/* Zähler auf der Kachel „Lager Übersicht“: überfällige Retouren + dringende Defekte + fällige Erinnerungen */
function jvHot(){let n=0;try{if(can("pk_s"))n+=pkGroups().over.length;n+=defs.filter(d=>!d.done&&d.urg).length;n+=jvErinDue().length;if(typeof abgToCheck==="function")n+=abgToCheck().length;if(typeof plUnread==="function")n+=plUnread().length}catch(e){}return n?String(n):""}
