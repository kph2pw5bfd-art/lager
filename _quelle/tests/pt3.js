const fs=require("fs");const src=fs.readFileSync("/home/claude/gh/shim.js","utf8");
const grab=(n,end)=>{const i=src.indexOf("function "+n);return src.slice(i,src.indexOf(end,i)+end.length)};
eval(grab("parseLabel(","return{ev,on}}"));eval(grab("parseLabelData","return{on,ev}}"));
for(const f of process.argv.slice(2)){const rows=fs.readFileSync(f,"utf8").trim().split("\n").slice(1).map(r=>r.split("\t"));const L={};let text="";
 for(const r of rows){if(r[0]!=="5")continue;const k=r[2]+"-"+r[3]+"-"+r[4];const w={text:r[11],confidence:+r[10],bbox:{x0:+r[6],y0:+r[7],x1:+r[6]+ +r[8],y1:+r[7]+ +r[9]}};(L[k]=L[k]||{words:[]}).words.push(w)}
 const lines=Object.values(L).map(l=>({words:l.words,text:l.words.map(w=>w.text).join(" "),bbox:{y0:Math.min(...l.words.map(w=>w.bbox.y0)),y1:Math.max(...l.words.map(w=>w.bbox.y1))}}));text=lines.map(l=>l.text).join("\n");
 console.log(f.split("/").pop(),JSON.stringify(parseLabelData({text,lines})))}
