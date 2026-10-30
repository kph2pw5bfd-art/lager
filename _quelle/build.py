import re,json
s=open("/home/claude/lager_app.html",encoding="utf-8").read()
shim=open("/home/claude/gh/shim.js",encoding="utf-8").read()
def rep(a,b,c=1):
    global s
    n=s.count(a); assert n==c,(a[:80],n); s=s.replace(a,b)
# head
rep('<title>TPC Lager App</title>','''<title>TPC Lager</title>
<meta name="theme-color" content="#114a97">
<meta name="apple-mobile-web-app-capable" content="yes">
<meta name="mobile-web-app-capable" content="yes">
<meta name="apple-mobile-web-app-title" content="TPC Lager">
<meta name="apple-mobile-web-app-status-bar-style" content="default">
<link rel="manifest" href="manifest.webmanifest">
<link rel="apple-touch-icon" href="apple-touch-icon.png">
<link rel="icon" type="image/png" href="favicon.png">''')
css=''':root{--okbg:#dff3e5}@media (prefers-color-scheme:dark){:root:not([data-theme="light"]){--okbg:#16402a}}:root[data-theme="dark"]{--okbg:#16402a}.rdone{background:var(--okbg);border-color:#1e9e55}.tdone{background:#1e9e55;color:#fff}.btn.okbtn{background:#1e9e55;color:#fff}.srow{display:flex;gap:8px;align-items:center;margin:3px 0 8px}.srow input{flex:1;margin:0;min-width:0}.scb{width:auto;flex:none;padding:10px 14px;display:flex;align-items:center}.updb{position:fixed;left:12px;right:12px;bottom:calc(12px + env(safe-area-inset-bottom,0px));z-index:70;background:#114a97;color:#fff;border-radius:12px;padding:12px 14px;display:flex;gap:12px;align-items:center;justify-content:space-between;box-shadow:0 8px 24px rgba(0,0,0,.3);font-weight:600}.updb button{background:#fff;color:#114a97;border:0;border-radius:8px;padding:10px 14px;font:inherit;font-weight:700;white-space:nowrap}.mbtn{display:block;width:100%;margin:4px 0 10px;padding:14px;border:2px dashed var(--line);border-radius:10px;background:none;color:var(--navy);font:inherit;font-weight:700;cursor:pointer}.mbtn:active{background:var(--tint)}@media (prefers-color-scheme:dark){:root:not([data-theme="light"]) .mbtn{color:#8fb0ea}}.fl{display:flex;gap:10px;align-items:center;justify-content:space-between}.msent{font-size:14px;font-weight:600;color:#1e7a46;margin-top:2px}@media (prefers-color-scheme:dark){:root:not([data-theme="light"]) .msent{color:#6fd39a}}.okb .okn{font-size:17px;font-weight:600;line-height:1.25;padding:0 12px;max-height:3.8em;overflow:hidden}.rwho{display:flex;gap:8px;align-items:flex-start;background:#fff6d6;color:#5a4500;border:1px solid #f2c200;border-radius:10px;padding:9px 12px;margin:0 0 8px;font-size:14px;font-weight:600;line-height:1.3}.rwho svg{flex:none;margin-top:1px}@media (prefers-color-scheme:dark){:root:not([data-theme="light"]) .rwho{background:#3a3000;color:#ffe48a}}:root[data-theme="dark"] .rwho{background:#3a3000;color:#ffe48a}.mbtn.sbtn{display:flex;align-items:center;justify-content:center;gap:10px;background:var(--navy);border:2px solid var(--navy);color:#fff;margin:14px 0 8px}.mbtn.sbtn:active{opacity:.85;background:var(--navy)}@media (prefers-color-scheme:dark){:root:not([data-theme="light"]) .mbtn.sbtn{color:#fff}}.lframe.bc{aspect-ratio:auto;width:min(86vw,520px);height:min(36vw,190px)}.rgrid .rtile.rmang{background:#e67e22;border-color:#e67e22;color:#fff}.rgrid .rtile.rmang .mute{color:rgba(255,255,255,.9)}.rtile.rmani{background:#fff1e3;border-color:#e67e22;box-shadow:0 0 0 1px #e67e22 inset}.rtile.rmani .mute{color:#9a4d00}@media (prefers-color-scheme:dark){:root:not([data-theme="light"]) .rtile.rmani{background:#3d2410}:root:not([data-theme="light"]) .rtile.rmani .mute{color:#f5b878}}:root[data-theme="dark"] .rtile.rmani{background:#3d2410}:root[data-theme="dark"] .rtile.rmani .mute{color:#f5b878}.ttl{padding:12px}.tsel{width:auto;max-width:56%;margin:0;padding:8px 10px;font:inherit}.rmx{display:grid;gap:8px;margin-top:10px}.rmr{border-top:1px solid var(--line);padding-top:8px}.rmh b{font-size:15px}.rmh small{display:block;color:var(--mute);font-size:12px}.rml{display:flex;gap:6px;flex-wrap:wrap;margin-top:6px}.rml.rmv{flex-direction:column}.rmr:first-child{border-top:0;padding-top:0}.rmc{display:flex;align-items:center;gap:5px;border:1px solid var(--line);border-radius:8px;padding:9px 6px;font-size:13px;cursor:pointer;flex:1 1 0;min-width:0}.rmc span{white-space:nowrap}.rml.rmv .rmc span{white-space:normal}.rml.rmm .rmc:first-child{flex:2 1 0}.rml.rmm .rmc span{white-space:normal;line-height:1.2}.rmc input{width:18px!important;height:18px!important}@media (max-width:370px){.rmc{font-size:12px;gap:4px;padding:9px 5px}}.tdet>summary{list-style:none;cursor:pointer}.tdet>summary::-webkit-details-marker{display:none}.tdet>summary .fl b:after{content:" ▾";font-size:13px;color:var(--mute)}.tdet:not([open])>summary .fl b:after{content:" ▸"}.tsum{font-size:13px;margin-top:4px;line-height:1.35}.rmc input{width:20px;height:20px;margin:0;flex:none}.rmc.inh{opacity:.55;cursor:default}.rmc:has(input:checked){border-color:var(--navy);background:var(--tint)}.rxd{margin-top:8px}.rxd>summary{cursor:pointer;font-weight:600;color:var(--navy);padding:4px 0}.rxn{display:inline-grid;place-items:center;min-width:20px;height:20px;border-radius:10px;background:var(--navy);color:#fff;font-size:12px;padding:0 6px;margin-left:4px}@media (prefers-color-scheme:dark){:root:not([data-theme="light"]) .rxd>summary{color:#8fb0ea}}.dsh{font-weight:800;font-size:13px;letter-spacing:.06em;text-transform:uppercase;color:var(--navy);margin:0 0 10px;padding-bottom:6px;border-bottom:2px solid var(--line)}@media (prefers-color-scheme:dark){:root:not([data-theme="light"]) .dsh{color:#8fb0ea}}:root[data-theme="dark"] .dsh{color:#8fb0ea}.sndl{display:flex;flex-wrap:wrap;gap:6px}.sndb{display:flex;align-items:center;gap:6px;padding:9px 12px;border:1px solid var(--line);border-radius:20px;background:var(--card);color:var(--ink);font:inherit;font-size:15px;cursor:pointer}.sndb small{font-size:11px;color:var(--mute)}.sndb .sndp{font-size:11px;color:var(--navy)}.sndb.on{background:var(--navy);border-color:var(--navy);color:#fff;font-weight:600}.sndb.on small,.sndb.on .sndp{color:#fff}.sndb:active{transform:scale(.97)}@media (prefers-color-scheme:dark){:root:not([data-theme="light"]) .sndb .sndp{color:#8fb0ea}}:root[data-theme="dark"] .sndb .sndp{color:#8fb0ea}.pref{display:flex;align-items:center;justify-content:space-between;gap:12px;padding:12px;margin-bottom:8px}.pref b{display:block}.sw2{position:relative;flex:none;width:52px;height:30px;border-radius:15px;border:0;background:var(--line);cursor:pointer;transition:background .15s}.sw2:after{content:"";position:absolute;top:3px;left:3px;width:24px;height:24px;border-radius:50%;background:#fff;box-shadow:0 1px 3px rgba(0,0,0,.3);transition:left .15s}.sw2[aria-checked="true"]{background:#1e9e55}.sw2[aria-checked="true"]:after{left:25px}.algrp{margin:14px 0 6px}.algrp>summary{list-style:none;cursor:pointer;display:flex;justify-content:space-between;align-items:center;background:var(--navy);color:#fff;border-radius:10px;padding:12px 14px;font-weight:700;font-size:17px}.algrp>summary::-webkit-details-marker{display:none}.algrp>summary:after{content:"▾";transition:transform .15s}.algrp:not([open])>summary:after{transform:rotate(-90deg)}
.alsub{margin:12px 2px 6px;font-weight:700;color:var(--mute);font-size:13px;text-transform:uppercase;letter-spacing:.05em;display:flex;justify-content:space-between}
.alrow{display:flex;align-items:center;gap:10px;width:100%;text-align:left;background:var(--card);color:var(--ink);border:1px solid var(--line);border-radius:8px;padding:10px 12px;margin-bottom:6px;font:inherit;cursor:pointer}.alrow .nr{flex:none;width:52px;font-variant-numeric:tabular-nums;color:var(--mute);font-size:14px}.alrow .nm{flex:1;min-width:0;font-weight:600;overflow-wrap:break-word}.alrow .tg{flex:none;display:flex;gap:4px}.alrow .tg span{font-size:11px;font-weight:700;padding:2px 6px;border-radius:6px;background:var(--line)}.alrow .tg .ca{background:#1e9e55;color:#fff}.alrow .tg .cc{background:#f2c200;color:#1f2a33}
.rph{display:flex;flex-wrap:wrap;gap:8px;margin:8px 0}.rph .thw{position:relative}.rph img{width:84px;height:84px;object-fit:cover;border-radius:8px;background:var(--line);cursor:pointer;display:block}.rph .thx{position:absolute;top:-7px;right:-7px;width:24px;height:24px;border-radius:50%;border:0;background:#c0392b;color:#fff;font-size:13px;line-height:24px;padding:0}.phv{position:fixed;inset:0;background:rgba(0,0,0,.92);z-index:80;display:flex;align-items:center;justify-content:center;padding:16px}.phv img{max-width:100%;max-height:100%;border-radius:6px}.pmrow{display:flex;gap:8px;flex-wrap:wrap;margin-top:8px}.pmrow .zchk{flex:1;min-width:140px;margin:0}.pmrow .zchk small{display:block;font-weight:400;color:var(--mute);font-size:12px}.torchb{display:flex;align-items:center;justify-content:center;gap:8px}.ltorch{position:absolute;right:max(16px,env(safe-area-inset-right,0px));top:calc(52px + env(safe-area-inset-top,0px));background:rgba(0,0,0,.5);color:#fff;border:1px solid rgba(255,255,255,.6);border-radius:22px;padding:10px 14px;font:inherit;font-weight:600;z-index:2}.lcam{position:fixed;inset:0;background:#000;z-index:60;display:flex;flex-direction:column}.lcam video{position:absolute;inset:0;width:100%;height:100%;max-height:none;border-radius:0;object-fit:cover}
.lframe{position:absolute;left:50%;top:44%;width:min(84vw,62vh);aspect-ratio:1;transform:translate(-50%,-50%);border:3px solid #fff;border-radius:14px;box-shadow:0 0 0 200vmax rgba(0,0,0,.45)}
.lhint{position:absolute;left:0;right:0;top:calc(14px + env(safe-area-inset-top,0px));text-align:center;color:#fff;font-weight:600;font-size:17px;text-shadow:0 1px 3px #000}
.lbar{position:absolute;left:0;right:0;bottom:0;display:flex;align-items:center;justify-content:space-between;padding:18px max(20px,env(safe-area-inset-left,0px)) calc(22px + env(safe-area-inset-bottom,0px)) max(20px,env(safe-area-inset-right,0px))}
.lbar .lx,.lbar .lg{background:rgba(0,0,0,.45);color:#fff;border:1px solid rgba(255,255,255,.6);border-radius:22px;padding:10px 16px;font:inherit;font-weight:600;min-width:96px}
.lshot{width:76px;height:76px;border-radius:50%;background:#fff;border:6px solid rgba(255,255,255,.45);background-clip:padding-box;cursor:pointer}.lshot:active{transform:scale(.94)}.lshot:disabled{opacity:.5}
[hidden]{display:none!important}img{max-width:100%}
.authw{max-width:420px;margin:12px auto 0}.authl{display:flex;justify-content:space-between;gap:10px;flex-wrap:wrap;margin-top:6px}
.lnk{background:none;border:0;color:var(--navy);font-weight:600;padding:8px 2px;cursor:pointer;font:inherit;font-weight:600}
@media (prefers-color-scheme:dark){:root:not([data-theme="light"]) .lnk{color:#8fb0ea}}
.gbtn{background:#fff;color:#1f2a33;border:1px solid var(--line);display:flex;align-items:center;justify-content:center;gap:10px}
.orl{display:flex;align-items:center;gap:10px;color:var(--mute);font-size:13px;margin:12px 0}.orl:before,.orl:after{content:"";flex:1;height:1px;background:var(--line)}
.ubx{display:flex;gap:10px;align-items:center;justify-content:space-between;flex-wrap:wrap}.ubx.wait{border-color:#f2c200;box-shadow:0 0 0 2px rgba(242,194,0,.35)}.ubt{display:flex;gap:6px;flex-wrap:wrap}
'''
rep('.hgrid{display:grid',css+'.hgrid{display:grid')
rep('<script src="https://cdn.jsdelivr.net/npm/@zxing/library@0.21.3/umd/index.min.js"></script>','<script src="https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2.45.4/dist/umd/supabase.js"></script><script src="https://cdn.jsdelivr.net/npm/@zxing/library@0.21.3/umd/index.min.js"></script>')
# init error text
rep("catch(e){$(\"#app\").innerHTML='<div class=\"card\">Bitte in Claude geöffnet und angemeldet nutzen.</div>'}}",
    "catch(e){console.error(e);$(\"#app\").innerHTML='<div class=\"card\">Keine Verbindung zur Datenbank. Bitte Internet prüfen und neu laden.</div>'}}")
# start page: logout + pending badge
rep("""'<div style="text-align:center;margin-top:24px"><button class="btn ghost s" data-g="art">Einstellungen</button></div>':'');""",
    """'<div style="text-align:center;margin-top:24px"><button class="btn ghost s" data-g="art">Einstellungen'+(pendingN()?' <span class="hc" style="display:inline-grid;margin-left:6px">'+pendingN()+'</span>':'')+'</button></div>':'')+'<div style="text-align:center;margin-top:10px"><button class="btn ghost s" id="lgo">Abmelden</button></div><div class="mute" style="text-align:center;font-size:12px;margin-top:14px">Version '+APPV+'</div>';""")
rep("""document.querySelectorAll("[data-g]").forEach(b=>b.onclick=()=>{const v=b.dataset.g;if(v==="defnew")dpho=null;if(v==="infonew")ipho=null;go(v)})}""",
    """document.querySelectorAll("[data-g]").forEach(b=>b.onclick=()=>{const v=b.dataset.g;if(v==="defnew")dpho=null;if(v==="infonew")ipho=null;go(v)});$("#lgo").onclick=()=>ask("Wirklich abmelden?",()=>SB.auth.signOut())}""")
# admin blocks
rep('werkBlock();lagerBlock();retAdmin()}','userBlock();werkBlock();lagerBlock();retAdmin()}')
rep('const ids=Object.keys(usr).filter(i=>i!==me);','const ids=Object.keys(usr).filter(i=>i!==me&&profActive(i));',2)
rep('</style><script src="https://cdn.jsdelivr.net/npm/@supabase','''.rgrid{gap:10px;grid-template-columns:repeat(auto-fill,minmax(148px,1fr))}
.rtile{min-height:92px;padding:12px 12px 10px;justify-content:space-between;align-items:stretch;gap:8px;box-shadow:0 1px 2px rgba(20,40,75,.06);transition:border-color .15s,background .15s}
.rtile b{display:block;font-size:20px;line-height:1.18;font-weight:700;overflow-wrap:normal;word-break:normal;hyphens:manual;padding-right:26px;text-wrap:balance}
.rtile.big b{font-size:24px}.rtile.grp b{font-size:22px}
.rtile .mute{font-size:12px;letter-spacing:.01em}
.rtile.sel{border-color:var(--navy);background:var(--tint);box-shadow:0 0 0 1px var(--navy) inset}
@media (min-width:700px){.rgrid{grid-template-columns:repeat(auto-fill,minmax(170px,1fr))}}
</style><script src="https://cdn.jsdelivr.net/npm/@supabase''')
# label OCR instead of Claude
i=s.index("async function rCamBind(){");j=s.index("function rShrink(file)")
s=s[:i]+'''async function rCamBind(){const b=$("#rcam"),f=$("#rcamf");if(!b)return;b.hidden=false;
 b.onclick=async()=>{const shot=await labelCam();if(shot===undefined)return f.click();if(shot)rReadShot(shot)};
 f.onchange=()=>{const file=f.files[0];f.value="";if(file)rReadShot(file)};
 const rReadShot=async file=>{const t=$("#rcamt");b.disabled=true;t.textContent="Aufkleber wird gelesen …";
  try{const r=await readLabel(file);
   if(!r.ev&&!r.on)errBox("Auf dem Foto war nichts lesbar. Bitte nochmal mit mehr Licht und gerade von vorne fotografieren.");
   else{if(r.ev&&$("#rev"))$("#rev").value=r.ev;if(r.on&&$("#rord"))$("#rord").value=r.on;toast("Bitte kurz kontrollieren",1)}}
  catch(e){console.error(e);errBox("Der Aufkleber konnte nicht gelesen werden. Bitte nochmal versuchen oder von Hand eintippen.")}
  finally{if($("#rcam")){b.disabled=false;t.textContent="Aufkleber fotografieren"}}}}
'''+s[j:]
# Excel: share by mail
rep('<button class="btn grey" id="rxl">Als Excel speichern</button>','<button class="btn grey" id="rxl">Als Excel speichern</button><button class="btn grey" id="rmail" hidden>Per Mail senden</button>')
rep('rBindTabs();$("#rxl").onclick=()=>retXl(r);','rBindTabs();$("#rxl").onclick=()=>retXl(r);if(navigator.canShare){$("#rmail").hidden=false;$("#rmail").onclick=()=>retXl(r,1)}')
rep('async function retXl(r){','async function retXl(r,share){')
rep('''  await dl.save({filename:fn,data:new Blob([buf],{type:"application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"})})
 }catch(e){if(e&&e.code==="declined")return;''','''  const XT="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",blob=new Blob([buf],{type:XT});
  if(share){const file=new File([blob],fn,{type:XT});if(navigator.canShare&&navigator.canShare({files:[file]})){await navigator.share({files:[file],title:rMailSubj(r),text:rMailBody(r)});return}toast("Teilen geht auf diesem Gerät nicht. Die Datei wird gespeichert.",1)}
  await dl.save({filename:fn,data:blob})
 }catch(e){if(e&&(e.code==="declined"||e.name==="AbortError"))return;''')
exec(open("/home/claude/gh/autosave_patch.py",encoding="utf-8").read())
exec(open("/home/claude/gh/nrpatch.py",encoding="utf-8").read())
exec(open("/home/claude/gh/closepatch.py",encoding="utf-8").read())
exec(open("/home/claude/gh/listpatch.py",encoding="utf-8").read())
exec(open("/home/claude/gh/tilepatch.py",encoding="utf-8").read())
exec(open("/home/claude/gh/headpatch.py",encoding="utf-8").read())
exec(open("/home/claude/gh/manpatch.py",encoding="utf-8").read())
exec(open("/home/claude/gh/sentpatch.py",encoding="utf-8").read())
exec(open("/home/claude/gh/campatch.py",encoding="utf-8").read())
exec(open("/home/claude/gh/beeppatch.py",encoding="utf-8").read())
exec(open("/home/claude/gh/userspatch.py",encoding="utf-8").read())
exec(open("/home/claude/gh/apppatch.py",encoding="utf-8").read())
exec(open("/home/claude/gh/setpatch.py",encoding="utf-8").read())
exec(open("/home/claude/gh/alpatch.py",encoding="utf-8").read())
exec(open("/home/claude/gh/invpatch.py",encoding="utf-8").read())
exec(open("/home/claude/gh/photopatch.py",encoding="utf-8").read())
exec(open("/home/claude/gh/permpatch.py",encoding="utf-8").read())
exec(open("/home/claude/gh/torchpatch.py",encoding="utf-8").read())
exec(open("/home/claude/gh/collabpatch.py",encoding="utf-8").read())
exec(open("/home/claude/gh/scanpatch.py",encoding="utf-8").read())
exec(open("/home/claude/gh/mangrppatch.py",encoding="utf-8").read())
exec(open("/home/claude/gh/rechtepatch.py",encoding="utf-8").read())
exec(open("/home/claude/gh/einelistepatch.py",encoding="utf-8").read())
exec(open("/home/claude/gh/defordpatch.py",encoding="utf-8").read())
exec(open("/home/claude/gh/matpatch.py",encoding="utf-8").read())
exec(open("/home/claude/gh/rlogpatch.py",encoding="utf-8").read())
exec(open("/home/claude/gh/jarvispatch.py",encoding="utf-8").read())
rep("</style>","\n"+open("/home/claude/gh/jarvis.css",encoding="utf-8").read()+"</style>",1)
exec(open("/home/claude/gh/splashpatch.py",encoding="utf-8").read())
# boot
rep('\ninit();\n</script>','\nboot();\n</script>')
rep('<script>\nlet db,user,me,','<script>'+shim+'</script>\n<script>\nlet db,user,me,')
open("/home/claude/gh/index.html","w",encoding="utf-8").write(s)
json.dump({"name":"TPC Lager","short_name":"TPC Lager","description":"Lager-App von The Power Company","start_url":"./","scope":"./","display":"standalone","orientation":"any","background_color":"#114a97","theme_color":"#114a97","lang":"de",
 "icons":[{"src":"icon-192.png","sizes":"192x192","type":"image/png","purpose":"any"},{"src":"icon-512.png","sizes":"512x512","type":"image/png","purpose":"any"},{"src":"icon-maskable-512.png","sizes":"512x512","type":"image/png","purpose":"maskable"}]},
 open("/home/claude/gh/manifest.webmanifest","w",encoding="utf-8"),ensure_ascii=False,indent=1)
print(len(s))
