rep("""(r.rem?'<div class="card"><div class="mute">Bemerkungen</div>'+esc(r.rem)+'</div>':"")+""","""(r.rem?'<div class="card"><div class="mute">Bemerkungen</div>'+esc(r.rem)+'</div>':"")+rPhotoBlock(r)+""")
rep('rBindTabs();$("#rxl").onclick=()=>retXl(r);','rBindTabs();rPhotoBind(r);$("#rxl").onclick=()=>retXl(r);')
rep('const buf=await wb.xlsx.writeBuffer(),fn="Retourschein_"','await rXlPhotos(wb,r,ws,rw);const buf=await wb.xlsx.writeBuffer(),fn="Retourschein_"')
A="""(r.mod?'<div class="mute">Letzte Änderung: '+esc(nm(r.mod))+", "+fmt(r.modT)+'</div>':"")+rSentLine(r)+'</div>'}).join("")"""
rep(A,A.replace("+rSentLine(r)+","+rSentLine(r)+((r.fotos||[]).length?'<div class=\"mute\">📷 '+r.fotos.length+(r.fotos.length===1?' Foto':' Fotos')+'</div>':'')+"))
