# Jarvis: Karte auf der Hauptseite (vorerst nur Admin) + eigener Bildschirm
rep("""'),''):'')+
 '</div>'+'<div style="display:flex;gap:10px;justify-content:center;flex-wrap:wrap;margin-top:24px">""","""'),''):'')+(can("jv_s")?T("jarvis",JV_ICON,'Jarvis','Briefing und Übersicht',''):'')+
 '</div>'+'<div style="display:flex;gap:10px;justify-content:center;flex-wrap:wrap;margin-top:24px">""")
rep('if(view==="start")return startView();','if(view==="jarvis"&&can("jv_s"))return jarvisView();\n if(view==="jarvis"){view="start";hist=[]}\n if(view==="start")return startView();')
rep('function draw(){if(!db)return;','function draw(){if(!db)return;document.body.classList.toggle("jvon",view==="jarvis");if(view!=="jarvis"&&typeof jvSpeaking!=="undefined"&&jvSpeaking)speechSynthesis.cancel();')
