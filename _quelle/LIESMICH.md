# TPC Lager App – Quellcode (für Claude)

Die Datei `index.html` im Hauptordner wird aus diesen Dateien gebaut. **Nie direkt an index.html arbeiten.**

## Einrichten in einer neuen Sitzung
```
git clone https://github.com/kph2pw5bfd-art/lager /home/claude/lager
mkdir -p /home/claude/gh && cp /home/claude/lager/_quelle/* /home/claude/gh/ 2>/dev/null
cp /home/claude/lager/_quelle/basis.html /home/claude/lager_app.html
```
(build.py und die Patches erwarten genau diese Pfade.)

## Bauen + prüfen
```
cd /home/claude/gh && python3 build.py && python3 -c "import re;s=open('index.html').read();sc=re.findall(r'<script>(.*?)</script>',s,re.S);open('a.js','w').write(sc[-2]);open('b.js','w').write(sc[-1])" && node --check a.js && node --check b.js
```
## Veröffentlichen
Version in shim.js erhöhen (`const APPV="1.32 (28.10.)"` → 1.33 …, zwei Stellen nach dem Punkt),
dann index.html nach /home/claude/lager kopieren, die geänderten Quelldateien nach `_quelle/`, committen, `git push origin main`.

## Aufbau
- `basis.html` – ursprüngliche Artifact-App (unverändert lassen)
- `build.py` – wendet die Patches in fester Reihenfolge an, fügt shim.js ein, schreibt index.html
- `shim.js` – Supabase-Anbindung (ersetzt window.claude.use), Login, OCR, Retourschein-Helfer, Einstellungen, Licht usw.
- `*patch.py` – gezielte Änderungen an basis.html (Funktion `rep(alt,neu)`)
- `datenbank.sql` – Supabase-Schema mit Berechtigungen
- `tests/` – Playwright-Tests mit Fake-Supabase (`fakesb.js`); Kamera-Tests mit `--use-fake-device-for-media-stream`

Supabase: https://whfeipnyzffrejbakweb.supabase.co (anon key steht in shim.js; service_role-Key NIE verwenden/anfragen).

## Jarvis-Stimme (ab 1.53)
- Standard-Motor „Thorsten“: Piper-Stimme `de_DE-thorsten-medium` über `@diffusionstudio/vits-web` (dynamischer Import von jsDelivr/esm.sh, Modell ~60 MB einmalig im Gerät gespeichert, Satz für Satz berechnet, Wiedergabe über ein gemeinsames `Audio`-Element, im Tipp entsperrt).
- Klappt Laden/Berechnen nicht → Hinweis und automatisch Gerätestimme (`jvSpeakDevice`). Umschalten im Stimmen-Dialog (`localStorage tpc_jv_engine` = thorsten/device).
- Lizenz: Thorsten-Daten CC0, das Medium-Modell ist aber evtl. nur nicht-kommerziell (Feintuning auf „lessac“) → vor Firmeneinsatz prüfen. Vorerst nur Admin.
- Test `tests/jvth_t.js` nutzt ein Stub-Modul (echte Bibliothek ist aus der Testumgebung nicht erreichbar).

## Jarvis-Sprechart (ab 1.54)
- `jvText` wählt nach `localStorage tpc_jv_style`: „frech“ (Standard, `jvTextFrech` + `jvHiFrech`, pro Lage mehrere Sätze per Zufall) oder „sachlich“ (`jvTextSachlich`, frühere Sätze).
- Begrüßung frech: mal „Servus <Name>“, mal „Guten Morgen/Tag/Abend, <Name>“ + Spruch (morgens Kaffee, abends „Noch so spät da?“).
- Umschalter „Art zu sprechen: Frech / Sachlich“ im Stimmen-Dialog; „Auf Standard zurücksetzen“ setzt auf frech zurück.
- Test `tests/jvfr_t.js` (Pfad zur fakesb.js über Umgebungsvariable SP).

## Jarvis-Freigabe (ab 1.55)
- Recht `jv_s` („Jarvis – Sehen“) in RK, erste Zeile im Rechte-Raster (Titel + Extra-Rechte). Karte und Ansicht nur mit `can("jv_s")`. Datenbank braucht dafür nichts (Rechte als jsonb, Jarvis liest nur, was can_read erlaubt).
- Ohne `ret_s`: keine Retourschein-Felder/-Sätze in Jarvis. Ohne `def_s`: Feld heißt „Deine offenen Defekte“.
- Thorsten nur für den Admin (`jvEngine()` gibt sonst immer "device"; Umschalter im Dialog ausgeblendet). Sprechart-Standard: Admin frech, alle anderen sachlich.
- Test `tests/jvrecht_t.js` (SP-Umgebungsvariable).

## Packlisten (ab 1.57)
- PDF (epirent-Packliste) wird in der App hochgeladen und **im Gerät** gelesen: `pack.js` lädt pdf.js (`pdfjs-dist@4.10.38` legacy, jsDelivr, Rückfall unpkg), `pkparse.js` holt aus den Textstücken Kopfdaten + Positionen (auch über Seitenumbruch). Kein automatisches Abrufen aus dem Postfach (IT-Freigabe offen).
- Gespeichert in docs `pack` (id = Packscheinnummer): ord, ps, ev, pl, db/de/pk/an/eb/ee (ms), sa, pos[{p,n,u,t,a,f}], by, t. **Keine Kundendaten, kein PDF.** Gleiche Packscheinnummer nochmal → „Ersetzen“.
- Status: Herrichten heute = Dispo-Beginn heute; Heute zurück = Dispo-Ende heute; Überfällig = Dispo-Ende vor heute und kein abgeschlossener Retourschein mit gleicher Auftragsnummer (nur Ziffern verglichen: 2601114-01 = 260111401). Materialgenauer Abgleich kommt später.
- Recht „Packlisten“: pk_s Sehen, pk_b Hochladen, pk_l Löschen (Rechte-Raster, `rLv` benennt Bearbeiten → Hochladen). Datenbank: `packliste.sql` (definiert can_read/can_write/can_delete vollständig neu – ab jetzt die letzte Version).
- Jarvis: Panel „Packlisten“ (Herrichten heute / Heute zurück / Überfällig + Liste, Tipp öffnet Packliste), Briefing-Sätze frech/sachlich in `jvPkText`. Der alte Platzhalter-Satz „sobald ich die Packlisten lesen darf“ ist raus; frech endet jetzt mit „Das war's von mir …“ / „So, genug geredet …“.
- Tests: `tests/pack_t.js` (braucht in $SP `fakesb.js`, `pk_beispiel.pdf` = echte Packliste, `kaputt.pdf`; pdf.js lokal aus /opt/npm-tools/node_modules/pdfjs-dist 6.x), `tests/pg/sql_packliste_test.py`. Die Beispiel-PDF NICHT ins Repo (Kundenadresse, Repo ist öffentlich) – Jürgen schickt sie bei Bedarf neu.
- Test-Postgres neu aufsetzen: `useradd -m postgres; mkdir -p /home/postgres/pgt; cp tests/pg/mock.sql /home/postgres/pgt/`, als postgres `initdb -D /home/postgres/pgt/data -A trust -U postgres` und `pg_ctl -D … -o '-p 5499 -k /home/postgres/pgt -c listen_addresses=' start`, dann `create role anon nologin; create role authenticated nologin;`.
- npm ist in der Sitzung ggf. gesperrt (403) – pdf.js liegt lokal unter /opt/npm-tools.

## Herrichten (ab 1.58)
- Packliste öffnen = Herricht-Ansicht (`packOpenView` in pack.js): Fortschritt „x von y Positionen“ + Balken, Filter Alle / Noch offen, keine Positionsnummern.
- Kreis antippen: offen → komplett (✓ grün); nochmal → wieder offen. Fremdmiete ungeklärt → zuerst Dialog „Aus dem Lager“ (zählt voll) / „Wird zugemietet“ (Soll = Anzahl − Fremd).
- Text antippen → `pkEdit`: Vorhanden (−/+/Alles da), Alternativen (Anzahl + Artikel aus `rkat`-Suche oder freier Text), Fremdmiete umstellen, Zurücksetzen. Weniger als Soll → orange „!“ „15 von 16 da – fehlen 1“.
- Stand in docs `packh` (id = Packlisten-id), pro Position eigenes Feld `h_<Pos>` ({ok,q,alt,fm,by,t}), dazu `fin` {by,t} und `info` {by,t}. doc_update führt Felder zusammen → mehrere Kollegen gleichzeitig. Ersetzen der PDF behält den Stand (Schlüssel = Pos.-Nr.).
- Herrichten darf, wer Packlisten sehen darf (Jürgens Wahl). `packh` hat noch keine eigene Datenbank-Regel → Standard „jeder freigegebene Benutzer“ (lesen/schreiben); die App zeigt es nur mit pk_s. Optional später SQL: packh an app_see('pk') binden.
- Abschließen: bei offenen Positionen Rückfrage; bei Abweichungen (Fehlmenge, Alternative, offen, „aus dem Lager statt Fremdmiete“) Frage „Info an <PL>?“ → `pkMail`: fertiger Text, Mail öffnen (mailto ohne Adresse) / Teilen / Kopieren, setzt `info`. Danach gesperrt, „Wieder öffnen“ und „Info an Projektleiter“.
- Status/Jarvis: heute herzurichtende zeigen „Herrichten 4/24“ bzw. „Hergerichtet“; Jarvis zählt nur nicht abgeschlossene, Briefing nennt Fortschritt bzw. „Heute ist alles hergerichtet“.
- Test `tests/herr_t.js`.
- Ab 1.59: Artikelname in der Packliste = Name aus der Artikelliste (`pkName`: Artikelnummer über `artCode` mit `rkat` verglichen), sonst Bezeichnung aus dem Packschein. Im Bearbeiten-Dialog steht darunter „Im Packschein: …“, wenn es abweicht. Die Info-Mail an den Projektleiter nutzt bewusst die Packschein-Bezeichnung (wie in epirent) + Artikelnummer.
- Ab 1.60: Positionen in der Herricht-Ansicht in Reihenfolge der Artikelliste (`pkRanks`/`pkSortIdx`: gleiche Sortierung wie `alBody` – nach `alRow`, Gruppen/Untergruppen in Reihenfolge des ersten Auftretens); Artikel ohne Treffer danach in Packschein-Reihenfolge. Schlüssel `h_<Pos>` und `data-pc`/`data-pe` bleiben der Original-Index. Info-Mail bleibt in Packschein-Reihenfolge.
- Ab 1.61: Gruppen-Überschriften in der Herricht-Ansicht (`pkGrp`: „Gruppe · Untergruppe“ aus der Artikelliste, sonst „Nicht in der Artikelliste“), Stil `.pkg` in packpatch.py. Gilt auch im Filter „Noch offen“.
- Ab 1.63: Herrichten verschieben. Herricht-Tag = Dispo-Beginn oder `packh.hd` = {d:"JJJJ-MM-TT", why, by, t} (`pkHDay`, `pkShifted`, Dialog `pkMove`: Datum, Heute/Morgen/Übermorgen, Grund optional, „Zurück auf Dispo-Beginn“; gleicher Tag wie Dispo-Beginn = hd null). Status: neuer Zustand `late` („Nicht hergerichtet“, eigene Gruppe „Noch nicht hergerichtet“) = Herricht-Tag vor heute und nicht abgeschlossen; „Heute herrichten“ und Jarvis nutzen den Herricht-Tag; verschoben in die Zukunft = „Verschoben“ unter „Kommt noch“. Hinweise `pkHint` (rot: nicht hergerichtet, blau: verschoben mit Grund + wer) in Liste und Detail. Test `tests/move_t.js`.
- Ab 1.64: Zusatz-Packscheine. Beim Hochladen sucht `pkMainFor` eine Packliste mit gleicher Auftragsnummer (nur Ziffern, anderer Packschein; älteste zuerst; schon angehängter Zusatz mit gleicher Nummer → ersetzen). Dialog „Zusatz-Packschein erkannt“: „Als Zusatz anhängen“ (Standard) oder „Als eigene Packliste“. Zusatz liegt im Haupt-Datensatz `pack.zus = [{ps, ev, t, by, pos}]`, Dispo-Zeiten bleiben die des ersten Packscheins. War die Packliste hergerichtet: `packh.fin = null`, `packh.reo = {by,t,why}` (Hinweis „↺ Wieder geöffnet …“; Abschließen setzt reo null). Positionen über `pkItems`/`pkPosAll` (Zusatz-Schlüssel `h_z<ps>_<Pos>`), Anzeige unten mit orangem Balken „Zusatz-Packschein <Nr> · Datum“ + „Entfernen“ (Recht pk_l), Mail markiert „[Zusatz <Nr>]“. Haupt-Packschein ersetzen behält `zus`. Test `tests/zus_t.js` (ersetzt `pkRead` per Stub).
- Ab 1.65: Übersicht (`packOverView`, Ansicht `pack`) kommt zuerst beim Tippen auf „Packlisten“; die bisherige Liste heißt „Alle Packlisten“ (Ansicht `packall`, `packView`). Wie die Wand im Lager: Diese Woche / Nächste Woche (je Mo–Fr) / Später (KW +2 bis +5, „Danach“). Fach = Herricht-Tag (`pkSlot`: Dispo-Beginn oder verschoben; Sa/So → Freitag davor, Abzeichen „Samstag“/„Sonntag“). Packlisten mit abgeschlossener Retoure fehlen. Oben „Nicht hergerichtet“: Herricht-Tag vorbei, nicht abgeschlossen; pro Packliste „Nicht hergerichtet“ (0 abgehakt, rot) oder „Teilweise hergerichtet“ (orange + Fortschritt) – gleiche Bezeichnungen in „Alle Packlisten“ (Status `late`, Klasse `part`). Vergangene Tage zusammengeklappt (antippen klappt auf). Schmal (< 900 px): Umschalter + Fächer mit Karten (Vorschlag A); breit: zweispaltige Tagesliste (Vorschlag C), `body.pkovw` hebt die 640-px-Grenze von `main` auf (1180 px), Wechsel beim Drehen/Ändern der Fenstergröße. Test `tests/ov_t.js`.

## Lager-Tablet (ab 1.66)
- `tablet.js` (von build.py an shim angehängt). Konto mit `rolle.tab = true` („Gemeinsames Gerät (Lager-Tablet)“ in der Benutzerverwaltung) fragt beim Start und nach 30 Min. ohne Bedienung „Wer arbeitet gerade?“: Namenskacheln = alle mit `rolle.tl = true` („am Lager-Tablet“, auch Admins möglich, außer das Tablet-Konto selbst) + „Anderer Name …“ (Helfer, in localStorage `tpc_tab_helpers` bis Sonntag 23:59 gemerkt). Gewählt: localStorage `tpc_tab_act` {id?, name, helper?, t}. Kopfzeile: Name + „Wechseln“ (`tabHead`, ersetzt `$("#who").textContent=names[me]`).
- Rechte = die des Tablet-Kontos (kein PIN). `by` usw. bleiben die Konto-ID (Datenbank-Regeln!), zusätzlich `<feld>_as` = gewählter Name: build.py ersetzt am Ende per Regex jedes `by:|mod:|readBy:|closedBy:|doneBy:|chkBy:me` in Objekten durch `…:me,...tabAs("…")` (33 Stellen) und jedes `nm(x.by)` usw. durch `nmA(x,"by")` (28 Stellen) → Anzeige „Max Muster (Tablet)“. Neue Schreibstellen mit `by:me` werden automatisch erfasst. Protokoll-Excel „Bearbeitet von“ nutzt `by_as`. Jarvis-Begrüßung, Retourschein-Mail-Gruß und Packlisten-Info-Mail nutzen `meName()`.
- Nicht umgestellt: Mitarbeit-Hinweis im Retourschein („X arbeitet gerade auch …“, Anteile `pa_<uid>`/`ed_<uid>`) zeigt weiter das Tablet-Konto.
- Test `tests/tab_t.js`.
- Ab 1.67: Namen überall kurz „Vorname N.“ (`shortName` in tablet.js; `namepatch.py` ändert `nm()`; auch `nmA`, Kopfzeile, Tablet-Kacheln, Projektleiter in den Packlisten, Mails, Protokoll-Excel). Ausnahme: Benutzerverwaltung zeigt den vollen Namen (zum Unterscheiden). Mitarbeit-Hinweis im Retourschein am Tablet: Herzschlag schreibt zusätzlich `edn_<uid>` = gewählter Name, `rWhoL` zeigt „Max M. (Tablet)“.

## Frag Jarvis (ab 1.68)
- `jvask.js` (an shim angehängt): im Jarvis-Bildschirm unter „Briefing vorlesen“ Mikrofon-Knopf (Spracherkennung des Browsers, `de-AT`; nur wenn vorhanden) + Eingabefeld + „Fragen“. Feste Fragen per Stichwort (`jvAnswer`), keine KI: Hilfe, Briefing, Herrichten heute/morgen/übermorgen/diese/nächste Woche, nicht hergerichtet, heute/morgen zurück, überfällig, Defekte offen/dringend/repariert, „Wo ist Artikel …“ (Nummer oder Name; zählt hergerichtete Menge ohne Fremdmiete + Alternativen in Packlisten ohne abgeschlossene Retoure, nicht hergerichtete getrennt als „geplant“), „Was ist mit Auftrag …/Veranstaltung …“ (Stand + Knöpfe), „Zeig mir …“ (öffnet), Neuer Retourschein / Defekt melden / Info an das Lager / Übersicht. Antwort als Text + Zeilen zum Antippen + gesprochen (Stimme/Sprechart wie eingestellt), `jvMode` → Knopf „Antwort stoppen“. Rechte werden beachtet.
- Test `tests/ask_t.js` (Achtung: Test-Chromium hat eigenes `SpeechRecognition` → Attrappe auf beide Namen setzen).
- Ab 1.69: Mikrofon für mehrere Fragen hintereinander (iPhone gab die Erkennung nach der ersten Frage nicht frei): alte Erkennung immer per `abort()` beenden (`jvRecKill`), nach Endergebnis selbst `stop()`, Frage erst bei `onend` oder spätestens nach 1,2 s (`jvRecDone`), bei Fehler beim Start einmal nach 0,4 s neu versuchen, Sicherheits-Aus nach 12 s ohne Ergebnis. Test `tests/mic_t.js` (Attrappe wie iPhone, auch Variante „stop() endet nie“).
- Ab 1.70: iPhone – zweite Mikrofon-Frage startete nicht. Vor jedem Start Ton freigeben (`jvFreeAudio`: speechSynthesis.cancel, Audio-Element pausieren + src entfernen + load, `navigator.audioSession.type="play-and-record"`, danach `"auto"`), `start()` nur noch direkt im Antippen (zweiter Versuch sofort, nicht verzögert). Statuszeile `#jvms` unter dem Eingabefeld zeigt, was das Mikrofon meldet (Fehlercode) – zur Fehlersuche.
- Ab 1.71: iPhone: zweite Mikrofon-Sitzung startet, bekommt aber keinen Ton (vermutlich WebKit-Grenze in Web-Apps, evtl. durch Vorlesen ausgelöst). Erkennung: nach einer erfolgreichen Sitzung endet eine weitere ohne Ergebnis → `jvMicDead`; danach macht der Mikrofon-Knopf am iPhone das Eingabefeld aktiv (Tastatur geht auf) + Hinweis aufs Tastatur-Mikrofon (`jvKbdMic`). Schalter „Vorlesen an/aus“ oben im Jarvis-Bildschirm (localStorage `tpc_jv_askread`, nur für Antworten, Briefing wird immer vorgelesen) – auch zum Eingrenzen, ob das Vorlesen das Mikrofon blockiert. Test `tests/mic2_t.js`.

## Version 1.72 – Lager Assistent im App-Stil
- Jarvis heißt jetzt „Lager Assistent“, die Kachel auf der Hauptseite „Lager Übersicht“ (immer ganz oben, Zähler = Überfälliges + dringende Defekte).
- Seite im Stil der App: kleine Kreise, große Uhrzeit, darunter Wochentag und Datum, Knopf „Briefing“ (beim Sprechen „Stopp“), Frage-Zeile, darunter klein „Stimme · Vorlesen“.
- Hell/Dunkel-Schalter entfernt; Recht in der Benutzerverwaltung heißt „Lager Übersicht“.

## Version 1.73 – alle Fragen aus dem Konzept + Hilfe-Bildschirm
- Neue Datei `jvfrag.js` (von build.py nach jvask.js angehängt). jvask.js enthält nur noch Mikrofon, Eingabe und die alten Grundantworten (jvOrder, jvHerr, jvBack, jvOver, jvDef); `jvShow`, `jvAnswer`, `jvAsk`, `jvHot` stehen jetzt in jvfrag.js.
- 52 Fragen in 8 Gruppen (Liste `JV_FRAGEN` = Hilfe-Bildschirm): Rücklauf & Dispo, Herrichten, Material, Werkstatt, Retourschein, Infos, Rückblick, Aktionen. Erkennung per Stichwort in `jvAnswer` (Reihenfolge wichtig: Aktionen → IDs/Materiallisten/Nachrichten → Werkstatt → Rückblick → Retourschein → Herrichten → Rücklauf → Material → alte Fragen → nur Artikel genannt).
- Artikel-Erkennung `jvArtFind`: Einheiten zusammengezogen (50 m → 50m, 32 A → 32a, 3-fach → 3fach), Zahl+Einheit muss genau passen, Wörter, die in der Artikelliste nirgends vorkommen (z. B. „CEE“), werden ignoriert. Mehrere Treffer → Rückfrage mit Zeilen (`fn`-Zeilen, zeigen „x Stück draußen“). Nicht in der Artikelliste → Bezeichnungen in den Packlisten.
- Menge draußen `jvArtCnt`: hergerichtet (bei laufender/überfälliger Dispo auch nicht abgehakte Positionen laut Packschein), ohne Fremdmiete, + Alternativen, − was schon im Retourschein der Auftragsnummer steht. Antwort „Auf welcher Baustelle …“ (`jvWhereA`): Überfällige zuerst, dann nach Dispo-Ende, Zeile „Summe auf Baustellen“, darunter „Geplant, noch nicht hergerichtet“.
- Abgleich Packliste ↔ Retourschein `jvBal` (nach Artikelnummer, sonst Name; Zubehör ausgenommen; Mehr zurück wird Fremdmiete zugerechnet) für „Was fehlt bei Auftrag …“, „War … alles zurück“, Rückblick-Fragen.
- Aktionen: „Füge 3 Stück … zu Retourschein … hinzu“ (Bestätigung, dann `rAdd` im Retourschein), „Markiere Auftrag … als geklärt“ (`packh.klar` → Status „Mit Projektleiter geklärt“ = erledigt, zählt nicht mehr als überfällig; „… nicht mehr geklärt“ nimmt zurück), „Notiere zu Auftrag …: …“ (`packh.n_<id>` {txt,by,t}, Anzeige in Packliste + Antwort), „Erinnere mich … um … an …“ (docs `jverin` {by,due,txt,pk,done}, nur eigene; Feld „Erinnerungen“ im Assistenten, Briefing, Kachel-Zähler; keine Push-Nachricht bei geschlossener App), „Melde Defekt: …“ (füllt Formular vor), „… schreib Retoure an …“ (öffnet Retourschein-Mail, warnt bei Fehlmaterial), „Nachfrage an Projektleiter“ (Mail-Text zum Öffnen/Teilen/Kopieren).
- Hilfe-Bildschirm `jvHelpOpen` (Link „Was kann ich fragen?“ oder Frage „Hilfe“): Suche, Gruppen nach Rechten, Antippen stellt die Frage; Fragen mit X/Y/A kommen ins Eingabefeld mit markiertem Platzhalter.
- Sprachausgabe: `jvGen` verhindert, dass ein abgebrochenes Briefing weiterläuft, wenn gleich eine neue Antwort gesprochen wird.
- Tests: `tests/frag_t.js` (alle Fragen + Aktionen + Hilfe). ask_t/mic_t/mic2_t schließen den Hilfe-Bildschirm automatisch.
