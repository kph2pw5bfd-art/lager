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
raf=requestAnimationFrame(fly);
d.addEventListener("click",end);d.addEventListener("animationend",function(e){if(e.target===d)end()});t=setTimeout(end,3300)})();</script>'''
rep('<body>',_splash)
