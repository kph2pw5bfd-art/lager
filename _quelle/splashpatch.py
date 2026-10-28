# Start-Animation: Logo mittig auf Blau, wird größer bis aus dem Bild (~3 s), Tippen überspringt.
# Steht direkt nach <body>, damit sie sofort erscheint, während die App darunter lädt.
import base64
_logo=base64.b64encode(open("/home/claude/gh/splash-logo.png","rb").read()).decode()
_splash='''<body><div id="splash" style="position:fixed;inset:0;z-index:9999;background:#114a97;display:flex;align-items:center;justify-content:center;overflow:hidden;cursor:pointer"><style>
#splash{animation:splbg 3s linear forwards}
#splash img{width:min(68vw,52vh,340px);height:auto;transform-origin:50% 45%;animation:splz 3s cubic-bezier(.55,0,.85,.35) forwards;will-change:transform}
@keyframes splz{0%{transform:scale(.7);opacity:0}12%{transform:scale(1);opacity:1}30%{transform:scale(1.04)}100%{transform:scale(16);opacity:1}}
@keyframes splbg{0%,72%{opacity:1}100%{opacity:0}}
</style><img alt="TPC Lager" src="data:image/png;base64,'''+_logo+'''"></div><script>(function(){var d=document.getElementById("splash"),t;function end(){if(!d)return;clearTimeout(t);d.remove();d=null}d.addEventListener("click",end);d.addEventListener("animationend",function(e){if(e.target===d)end()});t=setTimeout(end,3300)})();</script>'''
rep('<body>',_splash)
