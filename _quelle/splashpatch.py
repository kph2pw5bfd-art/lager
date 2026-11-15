# Start-Animation: Logo mittig auf Blau, wird größer bis aus dem Bild (~3 s), Tippen überspringt.
# Dazu fliegt dezent eine Hexen-Silhouette (splash-hexe.svg) ganz kurz im Hintergrund hinter dem Logo von links nach rechts.
# Steht direkt nach <body>, damit sie sofort erscheint, während die App darunter lädt.
import base64
_logo=base64.b64encode(open("/home/claude/gh/splash-logo.png","rb").read()).decode()
_hexe=open("/home/claude/gh/splash-hexe.svg",encoding="utf-8").read()
_splash='''<body><div id="splash" style="position:fixed;inset:0;z-index:9999;background:#114a97;display:flex;align-items:center;justify-content:center;overflow:hidden;cursor:pointer"><style>
#splash{animation:splbg 3s linear forwards}
#splash img{position:relative;z-index:2;width:min(78vw,60vh,380px);height:auto;transform-origin:50% 50%;animation:splz 3s cubic-bezier(.55,0,.85,.35) forwards;will-change:transform}
#splw{position:absolute;left:0;top:0;opacity:0;will-change:transform;pointer-events:none}
#splw svg{display:block;width:100%;height:auto;overflow:visible}
@keyframes splz{0%{transform:scale(.7);opacity:0}12%{transform:scale(1);opacity:1}30%{transform:scale(1.04)}100%{transform:scale(16);opacity:1}}
@keyframes splbg{0%,72%{opacity:1}100%{opacity:0}}
/* 1.177 Weihnachten & Silvester: ein paar Schneeflocken bzw. aufsteigende Striche mit Funkenstern */
@keyframes xsfall{0%{transform:translateY(-10px)}100%{transform:translateY(105vh)}}
@keyframes xsrise{0%{transform:translateY(0);opacity:0}10%{opacity:1}55%{transform:translateY(-75vh);opacity:1}62%,100%{transform:translateY(-75vh);opacity:0}}
@keyframes xspop{0%,55%{opacity:0;transform:scale(.3)}62%{opacity:1;transform:scale(1)}80%,100%{opacity:0;transform:scale(1.3)}}
#splash .xs{position:absolute;inset:0;z-index:0;pointer-events:none}
#splash .xs i{position:absolute;display:block;line-height:0}
#splash .xs .f{top:-8px;border-radius:50%;background:#fff;animation:xsfall linear infinite}
#splash .xs .r{bottom:-46px;animation:xsrise ease-out infinite}
#splash .xs .b{top:calc(25vh - 34px);opacity:0;animation:xspop ease-out infinite}
@media (prefers-reduced-motion:reduce){#splash .xs{display:none}}
</style><img alt="TPC Lager" src="data:image/png;base64,'''+_logo+'''"><div id="splw">'''+_hexe+'''</div></div><script>(function(){var d=document.getElementById("splash"),w=document.getElementById("splw"),im=d.querySelector("img"),t,raf,t0=performance.now();
function end(){if(!d)return;clearTimeout(t);cancelAnimationFrame(raf);d.remove();d=null}
function ease(x){return x<.5?2*x*x:1-Math.pow(-2*x+2,2)/2}
function fly(now){if(!d)return;var el=now-t0,T=Math.min(1,el/3000),W=d.clientWidth,H=d.clientHeight,U=im.offsetWidth/.78;
 w.style.width=(U*.62)+"px";
 /* dezent: nur Silhouette, kurz im Hintergrund hinter dem Logo von links nach rechts (ca. 0,15 s bis 2,05 s) */
 var p=(T-.05)/.63;if(p<0||p>1){w.style.opacity=0;if(T<1)raf=requestAnimationFrame(fly);return}
 var x=W/2+U*(-.95+1.9*p),y=H/2-U*.30-U*.10*Math.sin(Math.PI*p)+Math.sin(el/150)*U*.008,
  s=.52,tilt=-8+16*p,o=.55*Math.min(1,p/.15,(1-p)/.15);
 w.style.transform="translate("+(x-w.offsetWidth/2)+"px,"+(y-w.offsetHeight/2)+"px) rotate("+tilt+"deg) scale("+s+")";
 w.style.zIndex=1;w.style.opacity=o;
 if(T<1)raf=requestAnimationFrame(fly)}
window.tpcSeason=function(d){d=d||new Date();var y=d.getFullYear(),m=d.getMonth(),t=d.getDate();if((m===11&&t>=27)||(m===0&&t<=6))return "s";var x=new Date(y,11,24),a1=new Date(y,11,24-x.getDay()-21);if(d>=a1&&(m===10||(m===11&&t<=26)))return "w";return ""};
try{var k=localStorage.getItem("tpc_druckst")==="1"||localStorage.getItem("tpc_pref_xmas")==="0"?"":tpcSeason();if(k){var g=document.createElement("div"),h="",sd=7,R=function(){sd=(sd*9301+49297)%233280;return sd/233280};g.className="xs";
 if(k==="w")for(var i=0;i<14;i++){var z=2+Math.round(R()*2);h+='<i class="f" style="left:'+Math.round(R()*100)+'%;width:'+z+'px;height:'+z+'px;opacity:'+(.35+R()*.35).toFixed(2)+';animation-duration:'+(7+R()*6).toFixed(1)+'s;animation-delay:'+(-R()*12).toFixed(1)+'s"></i>'}
 else for(var j=0;j<4;j++){var q=Math.round(8+j*28+R()*6),u=(3+R()*1.5).toFixed(1),v=(-R()*3).toFixed(1);h+='<i class="r" style="left:'+q+'%;animation-duration:'+u+'s;animation-delay:'+v+'s"><svg width="14" height="46" viewBox="0 0 14 46"><path d="M7 2V44" stroke="#fff" stroke-width="2" stroke-linecap="round" opacity=".8"/></svg></i><i class="b" style="left:calc('+q+'% - 17px);animation-duration:'+u+'s;animation-delay:'+v+'s"><svg width="48" height="48" viewBox="0 0 34 34"><g stroke="#fff3c4" stroke-width="1.5" stroke-linecap="round"><path d="M17 2v7M17 25v7M2 17h7M25 17h7M6.4 6.4l5 5M22.6 22.6l5 5M27.6 6.4l-5 5M11.4 22.6l-5 5"/></g></svg></i>'}
 g.innerHTML=h;d.insertBefore(g,d.firstChild)}}catch(e){}
raf=requestAnimationFrame(fly);
d.addEventListener("click",end);d.addEventListener("animationend",function(e){if(e.target===d)end()});t=setTimeout(end,3300)})();</script>'''
rep('<body>',_splash)
