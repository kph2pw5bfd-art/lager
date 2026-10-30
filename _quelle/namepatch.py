# Namen kurz anzeigen (ab 1.67): Vorname + Anfangsbuchstabe Nachname + Punkt
rep('const nm=i=>names[i]||"…";','const nm=i=>names[i]?shortName(names[i]):"…";')
