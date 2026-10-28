# Titel und Rechte: alle Rechte-Prüfungen laufen über can("...") (Admin darf immer alles)
rep('const canDone=()=>owner||!!werk[me];\nconst vdefs=()=>defs.filter(d=>canDone()||d.by===me);',
    'const canDone=()=>can("def_b");\nconst vdefs=()=>defs.filter(d=>can("def_s")||d.by===me);')
rep('if(owner)swipe()}\nfunction defNewView','if(can("def_l"))swipe()}\nfunction defNewView')
rep('if(!d||!(canDone()||d.by===me))','if(!d||!(can("def_s")||d.by===me))')
rep('const canLager=()=>owner||!!lagr[me];','const canLager=()=>can("ret_s");')
rep("""(canLager()?'<button class="btn ghost" id="rdel\"""","""(can("ret_l")?'<button class="btn ghost" id="rdel\"""")
rep('function retDraw(){','function retDraw(){if(view==="retedit"&&!can("ret_b")){rs=null;view="ret"}retDraw0();rLock()}\nfunction retDraw0(){')
rep('if(view==="users"&&owner)return usersView();\n if(view==="appv"&&owner)return appView();\n if(view==="artlist"&&owner)',
    'if(view==="users"&&(can("v_user")||can("v_rights")))return usersView();\n if(view==="appv"&&can("v_app"))return appView();\n if(view==="artlist"&&can("v_app"))')
rep("""'Info an das Lager',owner?ui+' ungelesen':'Nachricht mit Foto ans Lager',owner&&ui?ui:''""","""'Info an das Lager',can("inf_s")?ui+' ungelesen':'Nachricht mit Foto ans Lager',can("inf_s")&&ui?ui:''""")
rep('infos.filter(i=>owner||i.by===me)','infos.filter(i=>can("inf_s")||i.by===me)')
rep('if(!i||!(owner||i.by===me))','if(!i||!(can("inf_s")||i.by===me))')
rep("""'</div>'+(owner?(i.read?'':'<button class="btn" id="irk\"""","""'</div>'+(can("inf_b")?(i.read?'':'<button class="btn" id="irk\"""")
rep('if(i.foto)loadTh("iph",i);','if(i.foto)loadTh("iph",i);infoDelBtn(i);')
rep("""(owner?'<button class="btn ghost s" data-g="appv">App-Verwaltung</button><button class="btn ghost s" data-g="users">Benutzerverwaltung'+(pendingN()?' <span class="hc" style="display:inline-grid;margin-left:6px">'+pendingN()+'</span>':'')+'</button>':'')""",
    """(can("v_app")?'<button class="btn ghost s" data-g="appv">App-Verwaltung</button>':'')+(can("v_user")||can("v_rights")?'<button class="btn ghost s" data-g="users">Benutzerverwaltung'+(can("v_user")&&pendingN()?' <span class="hc" style="display:inline-grid;margin-left:6px">'+pendingN()+'</span>':'')+'</button>':'')""")
rep('$("#inv").onclick=invDlg;userBlock();permBlock();','$("#inv").onclick=invDlg;if(!can("v_user"))$("#inv").remove();else userBlock();if(can("v_rights"))rightsBlock();')
rep('db.collection("lager").onSnapshot(s=>{lagr={};s.docs.forEach(d=>lagr[d.id]=d.data());draw()});','db.collection("lager").onSnapshot(s=>{lagr={};s.docs.forEach(d=>lagr[d.id]=d.data());draw()});rightsSub();')
