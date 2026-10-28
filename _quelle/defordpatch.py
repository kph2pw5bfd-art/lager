# Defekt melden/bearbeiten: Etikett lesen (Veranstaltung + Auftragsnummer), Auftragsnummer optional, Beschreibung optional
SEC=lambda t:'</div><div class="card"><div class="dsh">'+t+'</div>'
CAM=SEC("Veranstaltung")+'<button class="btn grey camb" id="%slab" type="button" style="margin-bottom:12px"><svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M4 8h3l2-3h6l2 3h3v11H4z"/><circle cx="12" cy="13" r="3.5"/></svg><span id="%slabt">Etikett fotografieren</span></button><input type="file" id="%slabf" accept="image/*" capture="environment" hidden>'
ORD='<label class="mute">Auftragsnummer (optional)</label><input id="%sord" inputmode="numeric" autocomplete="off">'+SEC("Defekt").replace("%","%%")
# Neu melden
rep('<label class="mute">Veranstaltung <span class="rq">*</span></label><input id="dnev" list="evs2">',CAM%("dn","dn","dn")+'<label class="mute">Veranstaltung <span class="rq">*</span></label><input id="dnev" list="evs2">')
rep('</datalist><label class="mute">Beschreibung des Defekts <span class="rq">*</span></label><textarea id="dnds" placeholder="Kurz beschreiben, was kaputt ist"></textarea>',
    '</datalist>'+ORD%"dn"+'<label class="mute">Beschreibung des Defekts (optional)</label><textarea id="dnds" placeholder="Kurz beschreiben, was kaputt ist – oft reicht das Foto"></textarea>')
rep(',miss=[!a&&"Artikel",!ev&&"Veranstaltung",!ds&&"Beschreibung"].filter(Boolean);if(miss.length){reqMark([["dnart",!a],["dnev",!ev],["dnds",!ds]]);',
    ',miss=[!a&&"Artikel",!ev&&"Veranstaltung"].filter(Boolean);if(miss.length){reqMark([["dnart",!a],["dnev",!ev]]);')
rep('desc:$("#dnds").value.trim(),by:me','desc:$("#dnds").value.trim(),ord:$("#dnord").value.trim(),by:me')
rep(' bindNav();$("#dnph").onclick=()=>$("#dnpf").click();',' bindNav();defLabelBind("dn");$("#dnph").onclick=()=>$("#dnpf").click();')
# Bearbeiten
rep('<label class="mute">Veranstaltung <span class="rq">*</span></label><input id="deev"><label class="mute">Beschreibung des Defekts <span class="rq">*</span></label>',
    CAM%("de","de","de")+'<label class="mute">Veranstaltung <span class="rq">*</span></label><input id="deev">'+ORD%"de"+'<label class="mute">Beschreibung des Defekts (optional)</label>')
rep('$("#deev").value=d.ev||"";','$("#deev").value=d.ev||"";$("#deord").value=d.ord||"";')
rep('bindNav();const n0=d.fn','bindNav();defLabelBind("de");const n0=d.fn')
rep(',miss=[!a&&"Artikel",!ev&&"Veranstaltung",!ds&&"Beschreibung"].filter(Boolean);if(miss.length){reqMark([["deart",!a],["deev",!ev],["deds",!ds]]);',
    ',miss=[!a&&"Artikel",!ev&&"Veranstaltung"].filter(Boolean);if(miss.length){reqMark([["deart",!a],["deev",!ev]]);')
rep('ev,desc:$("#deds").value.trim(),urg:','ev,desc:$("#deds").value.trim(),ord:$("#deord").value.trim(),urg:')
# Detailansicht
rep('<div class="mute">Veranstaltung: \'+esc(d.ev)+\'</div>','<div class="mute">Veranstaltung: \'+esc(d.ev)+\'</div>\'+(d.ord?\'<div class="mute">Auftragsnummer: \'+esc(d.ord)+\'</div>\':\'\')+\'')
# Überschrift für den ersten Bereich
rep('nav()+\'<div class="card"><button class="btn" id="dnsc"','nav()+\'<div class="card"><div class="dsh">Artikel</div><button class="btn" id="dnsc"')
rep('nav()+\'<div class="card"><label class="mute">Artikel <span class="rq">*</span></label><input id="deart">','nav()+\'<div class="card"><div class="dsh">Artikel</div><label class="mute">Artikel <span class="rq">*</span></label><input id="deart">')
