A="""(r.mod?'<div class="mute">Letzte Änderung: '+esc(nm(r.mod))+", "+fmt(r.modT)+'</div>':"")+'</div>'"""
rep(A+"""}).join("")""",A[:-len("+'</div>'")]+"""+rSentLine(r)+'</div>'}).join("")""")
rep(A+"""+\n '<div class="card" style="padding:4px""",A[:-len("+'</div>'")]+"""+rSentAll(r)+'</div>'+\n '<div class="card" style="padding:4px""")
rep('$("#rmail").onclick=()=>retXl(r,1)','$("#rmail").onclick=()=>rMailAsk(r)')
rep('await navigator.share({files:[file],title:rMailSubj(r),text:rMailBody(r)});return}','await navigator.share({files:[file],title:rMailSubj(r),text:rMailBody(r)});await rMarkSent(r,share&&share.to);return}')
