# Start-Animation: Logo mittig auf Blau, wird größer bis aus dem Bild (~3 s), Tippen überspringt.
# Dazu fliegt die Lager-Hexe (splash-hexe.svg) einmal ums Logo: hinten klein, vorne groß, am Ende vorne rechts aus dem Bild.
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
</style><img alt="TPC Lager" src="data:image/png;base64,'''+_logo+'''"><div id="splw">'''+_hexe+'''</div></div><script>(function(){var d=document.getElementById("splash"),w=document.getElementById("splw"),im=d.querySelector("img"),ft=w.querySelector(".ftx"),t,raf,t0=performance.now();
function end(){if(!d)return;clearTimeout(t);cancelAnimationFrame(raf);d.remove();d=null}
function ease(x){return x<.5?2*x*x:1-Math.pow(-2*x+2,2)/2}
function fly(now){if(!d)return;var el=now-t0,T=Math.min(1,el/3000),W=d.clientWidth,H=d.clientHeight,U=im.offsetWidth/.78;
 w.style.width=(U*.62)+"px";
 var u=Math.min(1,T/.8),w2=Math.max(0,(T-.8)/.2),th=6.03-5.03*ease(u)-.55*w2,rx=U*(.4+.06*u+1.05*w2*w2),ry=rx*.56,
  x=W/2+rx*Math.cos(th),y=H/2+ry*Math.sin(th)+Math.sin(el/170)*U*.012,
  s=(.34+.86*Math.pow(u,1.5))*(1+.2*Math.sin(th))+1.7*w2*w2,dir=Math.sin(th)>=0?1:-1,
  tilt=Math.max(-22,Math.min(22,-Math.cos(th)*18*dir));
 w.style.transform="translate("+(x-w.offsetWidth/2)+"px,"+(y-w.offsetHeight/2)+"px) rotate("+tilt+"deg) scale("+(s*dir)+","+s+")";
 w.style.zIndex=Math.sin(th)>-.15?3:1;w.style.opacity=Math.min(1,T/.08);
 if(ft)ft.setAttribute("transform",dir<0?"translate(375 0) scale(-1 1)":"");
 if(T<1)raf=requestAnimationFrame(fly)}
raf=requestAnimationFrame(fly);
d.addEventListener("click",end);d.addEventListener("animationend",function(e){if(e.target===d)end()});t=setTimeout(end,3300)})();</script>'''
rep('<body>',_splash)
