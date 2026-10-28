# Retourschein: orange Kachel "Manuell eingetragene Artikel" (immer als letzte), darin je Artikel eine Kachel
rep("""<div class="mute">Nr. '+esc(a.nr)+(cur?' · bisher '+cur+' Stück'""","""<div class="mute">'+(a.lbl!==undefined?esc(a.lbl):'Nr. '+esc(a.nr))+(cur?' · bisher '+cur+' Stück'""")
rep("""'<b>'+esc(g)+'</b><span class="mute">'+k.filter(a=>a.g===g).length+' Artikel</span></button>').join("")+'</div>');
  document.querySelectorAll("[data-rg]").forEach(b=>b.onclick=()=>{rs.g=b.dataset.rg;rs.u=null;rs.lvl=k.some(a=>a.g===rs.g&&a.u)?"subs":"items";retEdit()})}""",
    """'<b>'+esc(g)+'</b><span class="mute">'+k.filter(a=>a.g===g).length+' Artikel</span></button>').join("")+rManTile()+'</div>');
  document.querySelectorAll("[data-rg]").forEach(b=>b.onclick=()=>{rs.g=b.dataset.rg;rs.u=null;rs.lvl=k.some(a=>a.g===rs.g&&a.u)?"subs":"items";retEdit()});
  const mg=$("[data-rmg]");if(mg)mg.onclick=()=>{rs.lvl="manual";retEdit()}}
 if(L==="manual")rManLevel();""")
