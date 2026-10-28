rep("""'<div class="card"><b style="font-size:18px">'+esc(r.ev)+'</b><div class="mute">Auftragsnummer: '+esc(r.ord||"–")+'</div>""",
 """'<div class="card">'+(r.closed?'':'<button class="btn ghost s" id="rhed" style="float:right;margin:0 0 6px 10px">Ändern</button>')+'<b style="font-size:18px">'+esc(r.ev)+'</b><div class="mute">Auftragsnummer: '+esc(r.ord||"–")+'</div>""")
rep(""" if($("#rclose"))$("#rclose").onclick=""",""" if($("#rhed"))$("#rhed").onclick=()=>rEditHead(r);
 if($("#rclose"))$("#rclose").onclick=""")
