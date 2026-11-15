/* ===== Weihnachten & Silvester (1.177, Jürgen 15.11.; Vorschau https://claude.ai/artifact/NBpeBYbpz2MgLiagX9nPwF) =====
   Dezent: Weihnachten (1. Advent – 26.12.) ein bisschen Schnee + warm-weiße Lichterkette im blauen Kopfbalken,
   Silvester (27.12. – 6.1.) im Kopfbalken aufsteigende weiße Striche mit Funkenstern. Startbild: unverändert + Schnee bzw. Striche (splashpatch.py).
   Nichts sonst wird bunt. Einstellungen → Schalter „Weihnachten & Silvester“ (pro Gerät, Standard an = automatisch). Druckstation ohne Deko.
   Gemeinsame Zeitraum-Regel: tpcSeason() (steht auch im Startbild-Skript). */
if(typeof window.tpcSeason!=="function")window.tpcSeason=function(d){d=d||new Date();var y=d.getFullYear(),m=d.getMonth(),t=d.getDate();
 if((m===11&&t>=27)||(m===0&&t<=6))return "s";var x=new Date(y,11,24),a1=new Date(y,11,24-x.getDay()-21);
 if(d>=a1&&(m===10||(m===11&&t<=26)))return "w";return ""};
PREF_DEF.xmas=true;
function xmOn(){try{if(localStorage.getItem("tpc_druckst")==="1")return ""}catch(e){}return pref("xmas")?tpcSeason():""}
function xmApply(force){const h=document.querySelector("header");if(!h)return;let el=h.querySelector(".xdeco");const k=xmOn();
 if(!k){if(el)el.remove();return}
 if(el&&el.dataset.k===k&&!force)return;if(el)el.remove();
 const H=Math.max(48,h.offsetHeight||60);el=document.createElement("div");el.className="xdeco";el.dataset.k=k;el.setAttribute("aria-hidden","true");
 let seed=7;const r=()=>{seed=(seed*9301+49297)%233280;return seed/233280};let x="";
 if(k==="w"){for(let i=0;i<10;i++)x+='<i class="xfl" style="left:'+Math.round(r()*100)+'%;width:'+(2+Math.round(r()*2))+'px;height:'+(2+Math.round(r()*2))+'px;opacity:'+(.35+r()*.35).toFixed(2)+';animation-duration:'+(7+r()*6).toFixed(1)+'s;animation-delay:'+(-r()*12).toFixed(1)+'s"></i>';
  let b1="",b2="";for(let i=0;i<9;i++){const c='<circle cx="'+(14+i*48)+'" cy="11" r="3" fill="#fff7d6"/>';if(i%2)b2+=c;else b1+=c}
  x+='<svg class="xli" width="100%" height="20" viewBox="0 0 430 20" preserveAspectRatio="xMinYMid slice"><path d="M-10 3 Q14 13 38 3 T86 3 T134 3 T182 3 T230 3 T278 3 T326 3 T374 3 T422 3 T470 3" fill="none" stroke="#0b2a57" stroke-width="1.5"/><g class="xlg">'+b1+'</g><g class="xlg" style="animation-delay:1.5s">'+b2+'</g></svg>'}
 else{for(let i=0;i<3;i++){const p=Math.round(10+i*38+r()*8),d=(4+r()*2).toFixed(1),w=(-r()*5).toFixed(1);
  x+='<i class="xrk" style="left:'+p+'%;animation-duration:'+d+'s;animation-delay:'+w+'s"><svg width="14" height="46" viewBox="0 0 14 46"><path d="M7 2V44" stroke="#fff" stroke-width="2" stroke-linecap="round" opacity=".8"/></svg></i>'+
   '<i class="xbu" style="left:calc('+p+'% - 17px);animation-duration:'+d+'s;animation-delay:'+w+'s"><svg width="48" height="48" viewBox="0 0 34 34"><g stroke="#fff3c4" stroke-width="1.5" stroke-linecap="round"><path d="M17 2v7M17 25v7M2 17h7M25 17h7M6.4 6.4l5 5M22.6 22.6l5 5M27.6 6.4l-5 5M11.4 22.6l-5 5"/></g></svg></i>'}}
 el.innerHTML=x+'<style>.xdeco{--xr:-'+(H-4)+'px;--xf:'+(H+12)+'px}.xdeco .xbu{top:'+Math.round(H*.35-30)+'px}</style>';
 h.insertBefore(el,h.firstChild)}
function xmPrefBlock(){return tpcSeason()?prefRow("xmas","Weihnachten &amp; Silvester","Etwas Schnee und Lichterkette bzw. Raketen im Kopfbalken (1. Advent bis 6. Jänner)"):prefRow("xmas","Weihnachten &amp; Silvester","Vom 1. Advent bis 6. Jänner etwas Deko im Kopfbalken")}
document.addEventListener("click",e=>{if(e.target.closest&&e.target.closest('[data-pref="xmas"]'))setTimeout(()=>xmApply(true),0)});
(function(){try{const st=document.createElement("style");st.textContent=
'header .xdeco{position:absolute;inset:0;overflow:hidden;pointer-events:none;z-index:0}header>*:not(.xdeco){position:relative;z-index:1}'+
'@keyframes xmfall{0%{transform:translateY(-10px)}100%{transform:translateY(var(--xf))}}@keyframes xmrise{0%{transform:translateY(0);opacity:0}10%{opacity:1}55%{transform:translateY(var(--xr));opacity:1}62%,100%{transform:translateY(var(--xr));opacity:0}}'+
'@keyframes xmpop{0%,55%{opacity:0;transform:scale(.3)}62%{opacity:1;transform:scale(1)}80%,100%{opacity:0;transform:scale(1.3)}}@keyframes xmglow{0%,100%{opacity:1}50%{opacity:.35}}'+
'.xdeco .xfl{position:absolute;top:-8px;border-radius:50%;background:#fff;animation:xmfall linear infinite}.xdeco .xrk{position:absolute;bottom:-46px;line-height:0;animation:xmrise ease-out infinite}'+
'.xdeco .xbu{position:absolute;line-height:0;opacity:0;animation:xmpop ease-out infinite}.xdeco .xli{position:absolute;left:0;bottom:0;display:block}.xdeco .xlg{animation:xmglow 3s ease-in-out infinite}'+
'@media (prefers-reduced-motion:reduce){.xdeco *{animation:none!important}.xdeco .xrk,.xdeco .xbu{display:none}}';document.head.appendChild(st)}catch(e){}})();
/* einschalten, sobald der Kopfbalken da ist; um Mitternacht/Zeitraum-Wechsel stündlich prüfen */
setTimeout(()=>xmApply(),300);setInterval(()=>xmApply(),3600e3);window.addEventListener("resize",()=>{clearTimeout(window.__xmR);window.__xmR=setTimeout(()=>xmApply(true),400)});
