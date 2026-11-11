/* Test 1.167: Kopfzeile der Positionen – „Pos.“ und „Anzahl“ einzeln oder als ein Textstück (node tests/pkparse_t.js) */
const {pkParse}=require("../pkparse.js");let fail=0;const ok=(t,c)=>{if(!c)fail++;console.log((c?"OK   ":"FEHLT")+" "+t)};
const mk=hdr=>[{p:1,x:48,y:580,s:"PACKLISTE"},{p:1,x:48,y:560,s:"Veranstaltung:"},{p:1,x:150,y:560,s:"Testfest 2026"},{p:1,x:48,y:500,s:"Auftragsnummer:"},{p:1,x:150,y:500,s:"260000101"},{p:1,x:310,y:500,s:"Packscheinnummer:"},{p:1,x:400,y:500,s:"20260001"},
 ...hdr,{p:1,x:142,y:187,s:"Bezeichnung"},
 {p:1,x:48,y:171,s:"8.2"},{p:1,x:77,y:171,s:"48 Stk"},{p:1,x:120,y:171,s:"⃝"},{p:1,x:142,y:171,s:"Kabel Schuko 10m"},{p:1,x:105,y:160,s:"Fremd"},{p:1,x:48,y:160,s:"0 Stk"},{p:1,x:142,y:160,s:"ArtikelNr.: 1080 /"},
 {p:1,x:48,y:141,s:"7.1"},{p:1,x:77,y:141,s:"2 Stk"},{p:1,x:142,y:141,s:"Kabel CEE 63A 50m"},{p:1,x:48,y:130,s:"0 Stk"},{p:1,x:105,y:130,s:"Fremd"},{p:1,x:142,y:130,s:"ArtikelNr.: 1104 /"}];
for(const [nm,h] of [["getrennt",[{p:1,x:48,y:187,s:"Pos."},{p:1,x:77,y:187,s:"Anzahl"}]],["ein Stück",[{p:1,x:48,y:187,s:"Pos. Anzahl"}]]]){
 let P=null,err="";try{P=pkParse(mk(h))}catch(e){err=e.message}
 ok(nm+": 2 Positionen "+err,P&&P.pos.length===2&&P.pos[0].a==="1080"&&P.pos[0].n===48&&P.pos[1].a==="1104")}
console.log(fail?"FEHLER: "+fail:"ALLES OK");process.exit(fail?1:0);
