const src=require("fs").readFileSync("/home/claude/gh/shim.js","utf8");const i=src.indexOf("function parseLabel");const j=src.indexOf("return{ev,on}}",i)+14;eval(src.slice(i,j));
const a=`THE POWER COMPANY Energy Systems GmbH
Laaber StraBe 87 -2384 Breitenfurt bei Wien
Telefon +43 (0)2239/34 777-0

> office@thepowercompany at

COMPANY www.power4.events

2600926-01
UEL HBC
Sturm Graz-
Marseile`;
const b=`THE POWER COMPANY Energy Systems GmbH
Auftrags-Nr.: Gewicht:
2600926-01 kg
Projekt:
UEL HBC
Sturm Graz-
Marseile`;
const c=`Veranstaltung: Stadtfest Linz
Auftrags-NR: A-24117`;
for(const x of [a,b,c])console.log(JSON.stringify(parseLabel(x)));
