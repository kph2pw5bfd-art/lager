# Materialliste: "abgeschlossen" statt "geprüft", eigenes Recht Materialliste (mat_b = Abschließen/Wieder öffnen, mat_l = Löschen)
rep("(c.chk?'Geprüft ('","(c.chk?'Abgeschlossen ('")
rep("""(c.chk?(owner?'<button class="btn ghost s" id="ck" style="margin:8px 8px 0 0">Wieder öffnen</button>':''):(canDone()?'<button class="btn s" id="ck" style="margin:8px 8px 0 0;background:var(--ok)">Als geprüft markieren</button>':''))""",
    """(can("mat_b")?(c.chk?'<button class="btn ghost s" id="ck" style="margin:8px 8px 0 0">Wieder öffnen</button>':'<button class="btn s" id="ck" style="margin:8px 8px 0 0;background:var(--ok)">Abschließen</button>'):'')""")
rep("""+'<button class="btn ghost s" id="xl" style="margin-top:8px">Als Excel speichern</button> <button class="btn ghost s" id="ed" style="margin-top:8px">Bearbeiten</button></div>'""",
    """+'<button class="btn ghost s" id="xl" style="margin-top:8px">Als Excel speichern</button>'+(c.chk&&!can("mat_b")?'':' <button class="btn ghost s" id="ed" style="margin-top:8px">Bearbeiten</button>')+'</div>'""")
rep('$("#ed").onclick=()=>editList(c);','if($("#ed"))$("#ed").onclick=()=>editList(c);')
rep('placeholder="Bemerkung (optional)" value="\'+esc(c.note)+\'">','placeholder="Bemerkung (optional)" value="\'+esc(c.note)+\'"\'+(c.chk&&!can("mat_b")?\' disabled\':\'\')+\'>')
rep('if($("#ck"))$("#ck").onclick=()=>db.doc("lists/"+c.id).update(c.chk?{chk:false,chkBy:"",chkT:0}:{chk:true,chkBy:me,chkT:Date.now()});',
    'if($("#ck"))$("#ck").onclick=()=>ask(c.chk?"Materialliste wieder öffnen, damit sie bearbeitet werden kann?":"Materialliste abschließen? Danach kann sie nur noch angesehen werden. Bei Bedarf kann man sie wieder öffnen.",()=>db.doc("lists/"+c.id).update(c.chk?{chk:false,chkBy:"",chkT:0}:{chk:true,chkBy:me,chkT:Date.now()}).then(()=>toast(c.chk?"Materialliste wieder geöffnet":"Materialliste abgeschlossen",1)).catch(()=>errBox("Das hat nicht geklappt. Hast du das Recht dazu?")));')
rep('if(c.chk&&!owner){errBox("Die Liste ist geprüft und gesperrt.");return false}','if(c.chk&&!can("mat_b")){errBox("Die Liste ist abgeschlossen und gesperrt.");return false}')
rep('if(owner)swipe()}\nfunction newView','if(can("mat_l"))swipe()}\nfunction newView')
rep('["geprüft","Geprüft"]','["geprüft","Abgeschlossen"]')
rep('info.push(["Prüfstatus",c.chk?"Geprüft":"Offen"]);','info.push(["Status",c.chk?"Abgeschlossen":"Offen"]);')
