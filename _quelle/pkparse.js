/* Packliste (epirent) auslesen: aus den Textstücken des PDFs (pdf.js) die Kopfdaten und Positionen holen.
   Gespeichert wird nur: Auftragsnummer, Packscheinnummer, Veranstaltung, Projektleiter, Zeiten, Positionen (Anzahl, Bezeichnung, Artikelnummer, Fremd).
   Kunde/Adresse (links oben) und Fußzeile werden bewusst NICHT übernommen.
   Eingabe: [{p:Seite, x, y, s:Text}]  (y wächst nach oben, wie im PDF) */
function pkParse(items){
 const L=[];
 items.filter(i=>i&&String(i.s).trim()).slice().sort((a,b)=>a.p-b.p||b.y-a.y).forEach(i=>{const r=L[L.length-1],t={x:i.x,s:String(i.s).replace(/\s+/g," ").trim()};
  if(r&&r.p===i.p&&Math.abs(r.y-i.y)<=2.5)r.it.push(t);else L.push({p:i.p,y:i.y,it:[t]})});
 L.forEach(r=>r.it.sort((a,b)=>a.x-b.x));
 const lab=(r,re)=>{const i=r.it.findIndex(t=>re.test(t.s));return i<0?null:i};
 const val=(re,minX)=>{for(const r of L){const i=lab(r,re);if(i===null)continue;const rest=r.it.slice(i+1).filter(t=>t.x>=(minX||0)&&!/:$/.test(t.s));if(rest.length)return rest[0].s}return ""};
 const P={ord:"",ps:"",ev:"",pl:"",db:0,de:0,pk:0,an:0,eb:0,ee:0,sa:"",pos:[]};
 if(!L.some(r=>r.it.some(t=>/^PACKLISTE$/i.test(t.s)))&&!L.some(r=>r.it.some(t=>/^Packliste\/Jobinfo/i.test(t.s))))throw new Error("Keine Packliste");
 /* Veranstaltung kann über mehrere Zeilen gehen: Folgezeilen ohne eigenes Etikett dazunehmen */
 const evIdx=L.findIndex(r=>r.it.some(t=>/^Veranstaltung:?$/.test(t.s)));
 if(evIdx>=0){const r=L[evIdx],i=lab(r,/^Veranstaltung:?$/),x0=r.it[i+1]?r.it[i+1].x:120;let ev=r.it.slice(i+1).map(t=>t.s).join(" ");
  for(let j=evIdx+1;j<L.length&&L[j].p===r.p&&r.y-L[j].y<20;j++){const q=L[j];if(q.it.some(t=>/:$/.test(t.s)))break;ev+=" "+q.it.filter(t=>t.x>=x0-5).map(t=>t.s).join(" ")}
  P.ev=ev.trim()}
 P.pl=val(/^Projektleiter:?$/);P.ord=(val(/^Auftragsnummer:?$/).match(/[\d-]+/)||[""])[0];P.ps=(val(/^Packscheinnummer:?$/).match(/\d+/)||[""])[0];P.sa=val(/^Selbstabholer:?$/);
 /* Zeiten nur aus dem Block "Vorrausichtliche Zeiten" (oben rechts steht Dispo Ende nochmal) */
 const zt=L.findIndex(r=>r.it.some(t=>/voraus|vorraus/i.test(t.s)));
 const tm=re=>{for(let j=Math.max(0,zt);j<L.length;j++){const r=L[j];const i=lab(r,re);if(i===null)continue;const m=r.it.slice(i+1).map(t=>t.s).join(" ").match(/(\d{1,2})\.(\d{1,2})\.(\d{4})(?:\s*\/\s*(\d{1,2}):(\d{2}))?/);return m?new Date(+m[3],+m[2]-1,+m[1],+(m[4]||0),+(m[5]||0)).getTime():0}return 0};
 P.db=tm(/^Dispo Beginn:?$/);P.de=tm(/^Dispo Ende:?$/);P.pk=tm(/^Packen:?$/);P.an=tm(/^Anlieferung:?$/);P.eb=tm(/^Event Beginn:?$/);P.ee=tm(/^Event Ende:?$/);
 /* Positionen: Zeile mit Pos.-Nr. (z. B. 1.18) + Anzahl, darunter Zeile mit "Fremd" + ArtikelNr. – auch über den Seitenumbruch */
 let cur=null,inTab=false;
 for(const r of L){const s0=r.it[0]?r.it[0].s:"";
  if(r.it.some(t=>/^Pos\.?$/.test(t.s))&&r.it.some(t=>/^Bezeichnung$/.test(t.s))){inTab=true;continue}
  if(!inTab)continue;
  if(r.it.some(t=>/^Gesamt$/.test(t.s))){inTab=false;continue}
  if(r.y<70||r.it.some(t=>/^Packliste\/Jobinfo|^Seite \d+ von|Power Company.*GmbH|^Tel\.:|^Fax:|IBAN|Bankverbindung/.test(t.s)))continue;
  const fi=r.it.findIndex(t=>/^Fremd$/.test(t.s));
  if(fi>=0){const n=r.it.slice(0,fi).map(t=>t.s).join(" ").match(/(\d+(?:[.,]\d+)?)/);const an=r.it.slice(fi+1).map(t=>t.s).join(" ").match(/ArtikelNr\.?:?\s*([^/]*)\//i);
   if(cur){cur.f=n?+String(n[1]).replace(",","."):0;cur.a=an?an[1].trim():"";P.pos.push(cur);cur=null}continue}
  if(/^\d+(\.\d+)*$/.test(s0)&&r.it[1]&&/^\d+(?:[.,]\d+)?(\s+\S+)?$/.test(r.it[1].s)){
   if(cur)P.pos.push(cur);
   const m=r.it[1].s.match(/^(\d+(?:[.,]\d+)?)(?:\s+(\S+))?$/);const rest=r.it.slice(2).filter(t=>t.s!=="⃝"&&t.s!=="○"&&!/^[\d.,]*\s*(kg|m³|m3)$/.test(t.s));
   cur={p:s0,n:+m[1].replace(",","."),u:m[2]||"",t:rest.filter(t=>t.x<380).map(t=>t.s).join(" ").trim(),a:"",f:0};continue}
  /* umgebrochene Bezeichnung */
  if(cur&&!/^\d/.test(s0)){const add=r.it.filter(t=>t.x>110&&t.x<380&&!/^(kg|m³)$/.test(t.s)).map(t=>t.s).join(" ");if(add)cur.t=(cur.t+" "+add).trim()}}
 if(cur)P.pos.push(cur);
 if(!P.ord&&!P.ps)throw new Error("Keine Auftragsnummer gefunden");
 if(!P.pos.length)throw new Error("Keine Positionen gefunden");
 return P}
if(typeof module!=="undefined")module.exports={pkParse};
