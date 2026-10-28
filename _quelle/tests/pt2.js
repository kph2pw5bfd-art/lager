const src=require("fs").readFileSync("/home/claude/gh/shim.js","utf8");const i=src.indexOf("function parseLabel");const j=src.indexOf("return{ev,on}}",i)+14;eval(src.slice(i,j));
console.log(JSON.stringify(parseLabel(require("fs").readFileSync(0,"utf8"))));
