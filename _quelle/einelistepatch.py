# Nur noch eine Artikelliste: art kommt aus der Artikelliste, keine eigene Scan-Liste mehr
rep('db.collection("artikel").onSnapshot(s=>{art={};s.docs.forEach(d=>art[d.id]=d.data());draw()});\n','')
rep('db.collection("rkat").onSnapshot(s=>{rkat=[];rzub=[];s.docs.forEach(d=>{const x=d.data();if(d.id==="_zubehoer")rzub=Array.isArray(x.list)?x.list:[];else rkat.push({...x,_k:d.id})});',
    'db.collection("rkat").onSnapshot(s=>{rkat=[];rzub=[];s.docs.forEach(d=>{const x=d.data();if(d.id==="_zubehoer")rzub=Array.isArray(x.list)?x.list:[];else rkat.push({...x,_k:d.id})});artFromKat();artCleanup();')
rep('{na++;jobs.push(db.doc("artikel/"+c).set({name:a.name}))}','na++')
rep('" mit Artikelnummer für den Scan"','" mit Artikelnummer"')
rep('Eine Liste für alle Bereiche: Retourschein (Gruppen und Kacheln) und Materialliste (Name zum gescannten Code). Der Import ersetzt die bisherige Retour-Liste.',
    'Eine Liste für alle Bereiche: Materialliste, Retourschein und Defekt melden. Der Import ersetzt die bisherige Artikelliste.')
# Defekt melden: Live-Scanner statt Foto
rep('$("#dnsc").onclick=()=>$("#dnsf").click();','$("#dnsc").onclick=()=>defScan($("#dnsf"));')
rep('const c=normCode(v),m=c.match(CODE_RE),a=m&&art[m[1].toUpperCase()];if(!a)return errBox("Artikelnummer nicht bekannt");$("#dnart").value=a.name;$("#dnnr").value=c;okBox(c)};','defScanHit(v)};')
rep('placeholder="z. B. 1234 oder 1234--56"','placeholder="z. B. 1234 oder 1234–56"')
