rep("rLbl(rShort(a))","rLbl(rShort2(a))")
rep("""<button class="rtile'+(sub?" big":"")+'" data-ra="'+esc(a.nr)+'">'""","""<button class="rtile'+(sub?" big":"")+(c?" sel":"")+'" data-ra="'+esc(a.nr)+'">'""")
rep("""'<button class="rtile" data-ra="'+esc(a.nr)+'">'""","""'<button class="rtile'+(c?" sel":"")+'" data-ra="'+esc(a.nr)+'">'""")
rep("""function rPage(x){const b=$("#rbody");if(rPartial&&b&&$("#rasq")){b.innerHTML=x;return}$("#app").innerHTML=rCrumb()+rSq()+'<div id="rbody">'+x+'</div>'+rBar()}""",
 """function rPage(x){const b=$("#rbody");if(rPartial&&b&&$("#rasq")){b.innerHTML=x;rFit();return}$("#app").innerHTML=rCrumb()+rSq()+'<div id="rbody">'+x+'</div>'+rBar();rFit()}""")
