# Mehrere Personen an einem Retourschein: Anteile statt ganzer Liste speichern, fremde Änderungen live übernehmen
rep("""db.collection("retour").onSnapshot(s=>{rets=s.docs.map(d=>({id:d.id,...d.data()})).sort((a,b)=>b.t-a.t);res(rets.flatMap(r=>[r.by,r.mod]));draw()});""",
    """db.collection("retour").onSnapshot(s=>{rets=s.docs.map(d=>rView({id:d.id,...d.data()})).sort((a,b)=>b.t-a.t);res(rets.flatMap(r=>[r.by,r.mod,...Object.keys(r).filter(k=>k.startsWith("ed_")).map(k=>k.slice(3))]));rRemote();draw()});""")
rep("""rs={id:r.id,ev:r.ev,ord:r.ord||"",items:rIt(r),rem:r.rem||"",""","""rs={...rEd(r),""",2)
rep("""function rCrumb(){return '<div class="rcrumb">'""","""function rCrumb(){return rWho()+'<div class="rcrumb">'""")
# Endgültig speichern: nicht mehr das ganze Dokument ersetzen
rep("""clearTimeout(rTimer);await rChain.catch(()=>{});const d={ev:rs.ev,ord:rs.ord,rem:rs.rem.trim(),itemsJson:JSON.stringify(rs.items),by:old?old.by:me,t:old?old.t:now,draft:false};if(old){d.mod=me;d.modT=now}
  try{await db.doc("retour/"+id).set(d);rDone[id]=JSON.stringify({ev:d.ev,ord:d.ord,rem:d.rem,itemsJson:d.itemsJson});""",
    """clearTimeout(rTimer);await rChain.catch(()=>{});rs.id=id;const sn=rSnap(),d={...sn.d,draft:false};if(old){d.mod=me;d.modT=now}else{d.ev=String(rs.ev).trim();d.ord=String(rs.ord||"").trim();d.rem=String(rs.rem||"").trim();d.itemsJson="{}";d.by=me;d.t=now}
  try{if(old)await db.doc("retour/"+id).update(d);else await db.doc("retour/"+id).set(d);rDone[id]=JSON.stringify(sn.d);""")
rep("""if(!r||JSON.stringify(rs.items)===JSON.stringify(rIt(r)))return done();
 try{await db.doc("retour/"+rs.id).update({itemsJson:JSON.stringify(rs.items),mod:me,modT:Date.now()});done();""",
    """if(!r)return done();const sn=rSnap();if(!sn||(Object.keys(sn.d).length===1&&sn.d["pa_"+me]===(r["pa_"+me]||"{}")))return done();
 try{await db.doc("retour/"+rs.id).update({...sn.d,mod:me,modT:Date.now()});rDone[sn.id]=JSON.stringify(sn.d);done();""")
