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

## Version 1.74
- Kachel auf der Hauptseite heißt „Material vor Ort erfassen“ statt „Materialliste erstellen“ (Jürgens Wahl, Variante 1: nur der Knopf). Der Begriff „Materialliste“ bleibt überall sonst (Überschriften, Recht, Meldungen, Assistent). Umsetzung als `rep` am Ende von build.py.

## Version 1.75 – Hauptseite sortieren
- `home.js` (von build.py nach jvfrag.js angehängt). Reihenfolge der Kacheln: eigene (docs `hord`, id = Benutzer-ID, {o:[…],t}) → Vorgabe vom Titel (`titel.ho`) → Vorschlag nach Titelname (`hoDefFor`: „Werkstatt“ → W, „Monteur“/„Projektleiter“ → M, sonst Lager L). Kachel-Schlüssel: jarvis, pack, ret, infonew, defnew, new.
- `homeSort()` sortiert nach dem Aufbau von startView die Kinder von `.hgrid` (rep in build.py). Rechte blenden wie bisher aus; „Lager Übersicht“ ist jetzt auch sortierbar.
- Titel: in „Titel und ihre Rechte“ unter den Häkchen „Reihenfolge auf der Hauptseite“ mit ↑/↓ (`hoTitleBlock`/`hoTitleBind`), „Vorschlag wiederherstellen“ setzt `ho` auf null.
- Einstellungen: Abschnitt „Hauptseite“ (`hoMineBlock`/`hoMineBind`), „Zurück zur Reihenfolge vom Titel“ löscht `hord/<id>`. Lager-Tablet: gilt für das Tablet-Konto.
- Kein SQL nötig (`hord` fällt unter die Standardregel). Test `tests/home_t.js`.

## Version 1.76 – Übersicht neu (Entwurf „Variante A“ mit blauen Rahmen, von Jürgen freigegeben)
- `jvPanels` in shim.js neu: fällige Erinnerungen als roter Streifen (`.jverb`), eine Karte mit Reitern (`jvTabs`: Überfällig, Heute herrichten, Heute zurück, Defekte dringend; ohne Packlisten-Recht: Defekte dringend, Defekte offen, ggf. Retourscheine offen) und darunter die Liste zum gewählten Reiter (`jvTabList`, Zeilen `jvLine` mit Unterzeile). Gewählter Reiter in `jvTab` (startet beim ersten Reiter mit Einträgen), „Mehr anzeigen“ (`#jvmore`, Zustand in `jvMoreOpen`) mit spätere Erinnerungen, Offene Retourscheine, weitere Defekte, Wieder einsatzbereit, Letzte Retouren – nur was es gibt.
- Rechte Spalte gibt es nicht mehr (`right:""`, `#jvr:empty` ausgeblendet). `jvPkPanel`/`jvErinPanel` sind ungenutzt (stehen noch drin).
- Antwort des Assistenten hat ein „×“ (`.jvax`): stoppt das Vorlesen und leert die Antwort.
- Blaue Rahmen: `.jvhead`, `.jvcard`, `.jvtab`, `.jvlist`. Entwurf: Artboard „Variante A“ in https://claude.ai/artifact/4w3L6yTj57wKfFwGc4gSLZ. Test `tests/uebs_t.js`; jv_t.js klappt „Mehr anzeigen“ vor dem Retourschein-Tipp auf.

## Version 1.77 – Abgleich Ausgang ↔ Eingang (Entwurf https://claude.ai/artifact/8rxVvGF99snA5TgHus8viP, von Jürgen freigegeben)
- `abg.js` (von build.py nach home.js angehängt). Konto pro Auftrag `abgBal(p, ov)`: raus = Packliste + Zusatz-Packscheine (hergerichtet; nicht hergerichtet = laut Packschein), ohne Fremdmiete, mit Alternativen; zurück = alle Retourscheine mit gleicher Auftragsnummer (ohne Zubehör) ± bestätigte Zuordnungen. Schlüssel pro Artikel `abgKey` (Artikelnummer, sonst Name). `ov` = beim Zählen der noch nicht gespeicherte eigene Retourschein. `jvBal` (Assistent) = `abgBal`.
- **Die App ordnet NIE selbst zu** (Jürgen): bei „zu viel“ nur Vorschläge `abgCands` (Menge passt genau, Dispo zur selben Zeit, gleicher Projektleiter, Materialliste „geht weiter“); gebucht wird erst mit „Zu … zuordnen“ → docs `abzu` {k,code,name,q,from,to,by,t}, „Rückgängig“ löscht. Notizen docs `abno` (id = packId|key).
- Retourschein abschließen → `rCloseDlg`: Teilretoure / Endretoure (`retour.art` = "teil"/"end") + Vorschau des Abgleichs. `pkState` „erledigt“ nur bei geschlossenem Schein, der keine Teilretoure ist (alte ohne `art` zählen als erledigt).
- Zeile im Retourschein `rAbgInject` („Mit Packliste: x von y zurück · z offen ›“, beim Zählen live), eingehängt per setTimeout in retEdit/retOpen. Karte „Abgleich mit Retouren“ in der Packliste (`abgPkCard`). Ansichten: `pkabg` (Auftragskonto: Prüf-Streifen, Zahlen, Verlauf, Artikel mit Vorschlägen, Excel, Nachfrage, geklärt), `abgzv` (Zu viel zurück), `abgpr` (Zu prüfen).
- Lager Übersicht: Reiter „Fehlt noch“ (`abgMissing`: Aufträge mit Endretoure oder überfällig, nicht geklärt; pro Artikel summiert; Hinweis „Vielleicht …“ nur als Vorschlag) + Link „Zu viel zurück: n offen“; blauer Streifen „n Aufträge zu prüfen“ (`abgPrStrip`).
- Prüfen: neues Recht `abg_p` (Zeile „Abgleich · Prüfen“ im Rechte-Raster). Jede Endretoure mit `art:"end"` landet in „Zu prüfen“ bis „Geprüft“ → docs `abpr` (id = packId oder "r_"+retId für Retourscheine ohne Packliste) {by,t,end}. Zählt in jvHot und Briefing; Frage „Was muss ich prüfen?“.
- Excel `abgXlMake`/`abgXl` (Blätter Übersicht / Verlauf / Zu viel – Zuordnungen), Knopf im Auftragskonto (Recht Retourscheine-Sehen). Retoure-Mail: Häkchen „Abgleich mit Packliste (Excel)“ (`abgMailOpt`), `retXl` teilt beide Dateien + Text „Fehlt noch / Mehr zurück“ (`abgXlFile`).
- Kein SQL nötig (abzu/abno/abpr fallen unter die Standardregel). Test `tests/abg_t.js` (eigene ExcelJS-Attrappe im Test). herr_t/tab_t gehen über „Alle Packlisten“ (am Wochenende liegt „heute“ im zugeklappten Freitag-Fach) und wählen in der Übersicht den Reiter.

## Version 1.78 – Lager 55
- Artikel, die der LKW-Fahrer oder Monteur selbst vom anderen Lagerplatz („Lager 55“, ca. 300 m entfernt) mitnimmt. Häkchen „Lager 55“ in der Artikelliste (`rkat.l55`, Kennzeichen „L55“ in der Liste), pro Position umstellbar: `packh.h_<Pos>.l55 = true/false` (`pkL55(x,h)` in pack.js; ohne Eintrag gilt die Artikelliste).
- Herrichten: Lager-55-Positionen als graue Gruppe „Lager 55“ am Ende (nur Filter „Alle“), ohne Kreis, Text „holt Fahrer/Monteur“; zählen nicht im Fortschritt (`pkProg` liefert n ohne sie + `l55`), blockieren Abschließen nicht, keine Abweichung in der Info-Mail. Antippen → „Packe ich doch selbst“; im normalen Bearbeiten-Dialog Knopf „Holt Fahrer/Monteur – Lager 55“.
- Abgleich: zählen nicht als „raus“ (`e.l55`), kommen meist zum Lager 55 zurück; kommt doch etwas bei uns zurück → kein „zu viel“, Hinweis „kam über uns statt Lager 55 zurück“ (`e.via55`). Excel-Bemerkung entsprechend.
- Assistent „Wo ist …“: zählt Lager-55-Mengen bei laufenden Aufträgen mit, Zusatz „über Lager 55“. „Was fehlt beim Packschein“ ohne Lager 55.
- Test `tests/l55_t.js`.

## Version 1.79 – Artikel aus dem Packschein in die Artikelliste übernehmen
- Bearbeiten-Dialog einer Position ohne Artikelliste-Eintrag (`!pkKat(x)`): oranger Kasten „Nicht in der Artikelliste“. Mit Recht `v_app`: „Zur Artikelliste hinzufügen“ → `alEdit(null,{nr,name,g,hint,done})` (Name/Nummer aus dem Packschein, Hauptgruppe per `alGuessG` vorgeschlagen, alles änderbar). Ohne Nummer im Packschein: Hinweis, dass die Position nicht zugeordnet werden kann. Nach dem Speichern wird ein passender Eintrag in `fehlartikel` gelöscht; die Packliste ordnet die Position über `rkat`-Snapshot sofort ein.
- Ohne `v_app`: „Fehlt in der Artikelliste – melden“ (`pkKatMeld`) → docs `fehlartikel` (wie manuelle Retourschein-Artikel, zusätzlich `src:"Packliste"`, ev/ord der Packliste).
- App-Verwaltung → „Fehlende Artikel“: Knopf „Übernehmen“ öffnet `alEdit` vorbelegt und löscht danach den Eintrag.
- `alEdit(a, pre)` hat jetzt einen zweiten Parameter für die Vorbelegung. Test `tests/kat_t.js`.

## Version 1.80
- `jvAgo` (Lager Assistent: „gemeldet heute/gestern/vor n Tagen“, Retourscheine „… · heute“ usw.) rechnet nach Kalendertagen statt 24-Stunden-Blöcken (Fehler: gestern Abend gemeldet zeigte „heute“).

## Version 1.81 – Wochenbericht (Entwurf https://claude.ai/artifact/1Fc7wBfpfFUf522RQGg47N)
- `wb.js` (von build.py nach abg.js angehängt), Ansicht `wb` (Recht `jv_s`), Karte „Wochenbericht“ unten in der Lager Übersicht, Frage „Wochenbericht“ im Assistenten.
- Besprechung = Montag dieser Woche, am Sa/So der nächste Montag (`wbMeet`, Pfeile ±1 Woche über `wbOff`). Block 1 letzte Woche (Mo–So davor): Hergerichtet (`packh.fin.t` in der Woche), Zurückgekommen (abgeschlossene Retourscheine, `closedT`), Überfällig (aktuell, `pkGroups().over`), Dispodaten stimmten nicht (Herrichten verschoben `packh.hd` mit Grund; Endretoure ≠ Dispo-Ende-Tag) + „Noch offen insgesamt“ aus `abgMissing` (ohne Defekte). Block 2 diese Woche: Tabelle Mo–Fr (Herrichten nach `pkSlot`, Sa/So beim Freitag; Rücklauf nach Dispo-Ende, ohne erledigte) + „Achtung“ (offene Defekte, die eine Packliste der Woche braucht; Zu prüfen nur mit `abg_p`). Block 3 „Sonstiges“: docs `wbnote` {txt,by,t,done} – jeder mit Lager Übersicht trägt ein, abhaken = done, nicht Erledigtes bleibt stehen („noch offen“, wenn älter als die letzte Woche), löschen: eigene oder Admin.
- Alle betroffenen Aufträge werden angeführt (Jürgen) – zu lang → zweite Seite. Druck: `#wbprintbox` (eigene Kopie des Berichts) + `body.wbprinting` + `@media print` (A4, 11/12 mm Rand), `window.print()`; „Als PDF speichern“ über das Druckfenster. Papier-Stile `.wbpaper` immer hell. Wichtig: im Bericht keine `<header>`/`<footer>`-Elemente (App-CSS färbt `header` blau).
- Test `tests/wb_t.js` (erzeugt eine PDF zum Prüfen).

## Version 1.82
- Retourscheine, Filter „Alle“: oben Überschrift „Offen“ (mit Anzahl), dann blauer Trennstrich, unten „Abgeschlossen“ (`rGroupList` in shim.js, rep am Ende von build.py). Filter „Offen“/„Abgeschlossen“ unverändert. Test `tests/rgrp_t.js`.

## Version 1.83
- Fehler behoben: Zwei Defektmeldungen zum selben Artikel erschienen im Wochenbericht („Achtung“) und beim Assistenten doppelt, jeweils „wird gebraucht“. Jetzt `wbDefNeed(von,bis)` in wb.js: pro Artikel (Artikelnummer aus `anr` vor dem Bindestrich, sonst Name) eine Zeile „x Stück defekt (davon y dringend) – gebraucht Mo für … (n Stück)“ mit der Menge aus der Packliste. `jvDefNeed` nutzt dieselbe Funktion.

## Version 1.84
- Fehler behoben: „Drucken“ im Wochenbericht tat am iPhone (Web-App vom Home-Bildschirm) nichts – `window.print()` wird dort ignoriert. Jetzt am Handy/Tablet (`wbMobile()`: iPhone/iPad/Android, Touch-Mac oder Standalone-Modus): `wbPdf(D)` zeichnet den Bericht mit pdf-lib 1.17.1 (dynamisch von jsDelivr, Ausweich unpkg, `wbLoadPdf`, beim Öffnen vorgeladen) als A4-PDF – Kopf, blaue Abschnittsrahmen, alle Aufträge, Tabelle, Achtung, Besprechungspunkte mit Kästchen, Fußzeile „Seite x von n“, automatischer Seitenumbruch – und öffnet das Teilen-Menü (`navigator.share` mit Datei → „Drucken“ / „In Dateien sichern“). Geht Teilen nicht: Download. Knopf heißt am Handy „Drucken / Teilen (PDF)“.
- Am PC bleibt „Drucken“ (`window.print`), daneben neu „Als PDF speichern“ (gleiche pdf-lib-PDF, Download).
- PDF-Schrift Helvetica (WinAnsi): `wbTx` ersetzt „→“ durch „->“, unbekannte Zeichen durch „?“.
- Test `tests/wb_t.js`: normal = PC-Druck; `MOB=1` = iPhone (Teilen abgefangen, schreibt wb_mob.pdf und eine lange Probe wb_lang.pdf über 3 Seiten). pdf-lib wird im Test auf /opt/npm-tools/node_modules/pdf-lib/dist/pdf-lib.min.js umgeleitet.

## Version 1.85 – Meine Aufträge (Entwurf https://claude.ai/artifact/PBCjZTLHdDe9uS6UiEE1MV, von Jürgen freigegeben)
- `au.js` (von build.py nach wb.js angehängt). Neues Recht „Aufträge“: `au_s` Sehen, `au_b` Antworten (Zeile im Rechte-Raster nach „Lager Übersicht“; `au_b` schließt `au_s` ein). Kachel „Meine Aufträge“ (`view="au"`), Detail `auopen`, Lager-Seite `plin`.
- Liste: Filter Laufend / Erledigt / Alle + Suche. Oben „Meine Aufträge“ (Projektleiter in der Packliste = eigener Name, `auIsMine`: alle Namensteile des Profilnamens kommen im PL-Namen vor, Reihenfolge/Groß-Klein/Akzente egal; am Lager-Tablet der gewählte Name), blauer Trennstrich, dann „Alle anderen Aufträge“. In jedem Block zuerst Rotes, dann nach Herricht-Tag. Erledigt = geklärt oder Endretoure ohne Fehlmaterial.
- Pro Auftrag 5 Schritte (Packliste · Herrichten · Draußen · Retouren · Erledigt, `auInfo`), Detail mit Zeitleiste inkl. Abweichungen beim Herrichten (`auDevLines`), „Fehlt noch“ (nur nach Endretoure oder überfällig, wie im Abgleich), „Noch draußen“ bei Teilretoure, „Mehr zurück als geplant“, Material eingeklappt (nur lesen).
- Antworten nur bei eigenen Aufträgen mit `au_b`: pro fehlendem Artikel (anders = andere Baustelle mit Auftragswahl über `abgPickPack`, bau = noch auf der Baustelle + Datum, kunde, zur, weiss) + Notiz; „Nachricht ans Lager“ (typ msg). docs `plaw` {pk, ord, ev, k (abgKey), name, n, typ, to, toEv, toOrd, bis, txt, by, t, read}. Die App ändert nichts selbst.
- Lager (Recht `pk_s`): blauer Streifen „n Antworten von Projektleitern“ in der Lager Übersicht → Liste mit „Ansehen“/„Gelesen“; zählt im Kachel-Zähler (`jvHot`) und im Briefing. Im Auftragskonto steht die Antwort beim Artikel (`plAbgLine`) und Nachrichten oben (`plAbgMsgs`). „anders“ → bei „Zu viel zurück“ des genannten Auftrags Vorschlag „Projektleiter sagt: ist dort“, ganz oben (`plSays` in `abgCands`).
- Hauptseite: Vorschlag Monteur/Projektleiter „Meine Aufträge“ zuerst; `hoFix` setzt fehlende Kacheln an ihre Stelle in HO_ALL (statt ans Ende).
- Datenbank: `auftraege.sql` (definiert can_read/can_write/can_delete vollständig neu – ab jetzt die letzte Version): pack + retour lesen auch mit au; plaw lesen mit au/pk/jv_s, schreiben eigene mit au_b oder Lager (pk), löschen nur Admin; Titel „projektleiter“ bekommt au_s+au_b. Tests `tests/au_t.js`, `tests/pg/sql_auftraege_test.py`.

## Version 1.86
- Fehler behoben (Meine Aufträge): Bei verschobenem Herrichten stand „Draußen ab <Dispo-Beginn>“. Jetzt `auOutDay(p)` = späterer von Dispo-Beginn und Herricht-Tag (`pkHDay`) – für „Draußen ab …“ und dafür, ab wann der Schritt „Draußen“ als erledigt gilt. Herrichten-Schritt zeigt „verschoben auf <Tag> (Dispo-Beginn …) – Grund“, Karten-Etikett „Herrichten <Tag>“ statt „Kommt …“. Test in `tests/au_t.js` (Auftrag G).

## Version 1.87
- Meine Aufträge: alle Mengen mit Einheit (Jürgen: „Bitte immer die Einheit dazu schreiben“). `auUnit(p,k)` holt die Einheit aus der Packliste (Position mit gleichem Artikel-Schlüssel), sonst „Stk“; `auQ(n,u)` schreibt „4 Stk“. Gilt für Material, Fehlt noch, Noch draußen, Mehr zurück, Antwort-Dialog, Antworten-Liste beim Lager (Einheit wird in `plaw.u` mitgespeichert), Abweichungen beim Herrichten und Fremdmiete.

## Version 1.88 – Zusatz-Packscheine mit eigenem Herricht-Tag
- Hintergrund (Jürgen): epirent gibt jedem Zusatz den Dispo-Beginn des ersten Packscheins. Darum fragt die App beim Anhängen „Wann wird der Zusatz hergerichtet?“ (`pkZAskDay`: Heute/Morgen/Übermorgen/Datum) und speichert `packh.zd_<ps>` = {d, why, by, t}. Rücklauf bleibt gemeinsam (Dispo-Ende).
- Eigener Abschluss: `packh.zf_<ps>` = {by,t} (`{t:0}` = offen/wieder geöffnet). Anhängen öffnet die Haupt-Packliste NICHT mehr. Neue Zusätze haben `v:2` in `pack.zus[]`.
- Alte Zusätze (ohne `v`): Tag = Hochlade-Tag (`z.t`), hergerichtet = Haupt-`fin.t` ≥ `z.t` (`pkZFin`). In der Info-Mail der Haupt-Packliste bleiben sie enthalten.
- `pkProg(P)` zählt nur noch den Haupt-Packschein (`pkProgOf(P,null)`); `pkZProg(P,ps)` den Zusatz. `pkRowFin(P,i)` sperrt pro Zeile (Tippen/Bearbeiten).
- Zusatz als eigener Eintrag: `pkZPseudo(P,z)` (id = Packliste, `_z`, ev „Zusatz <ps> zu <Veranstaltung>“) – `pkHDay/pkHd/pkShifted/pkProg` kennen `_z`. `pkZTasks()` = alle Zusätze nicht erledigter Aufträge. Eingebunden in: Wand-Übersicht (Fach + „Nicht hergerichtet“, Abzeichen „Zusatz“), `pkJarvis` (Heute herrichten, Briefing, Kachel-Untertitel `pkSub`), Assistent `jvHerr` (heute/morgen/Woche, nicht hergerichtet), Wochenbericht (Tabelle + „Hergerichtet“ letzte Woche).
- Herricht-Ansicht: pro Zusatz Kasten „Zusatz herrichten: <Tag>“ + Verschieben (`pkZMove`, mit Grund) + Fortschritt; unten „Zusatz abschließen“ bzw. „Info an Projektleiter“ (`pkMail(P,ps)`, nur Zusatz-Positionen, `packh.zi_<ps>`) / „Zusatz wieder öffnen“. `pkHint` zeigt pro Zusatz „herrichten <Tag>“ / „⚠ noch nicht hergerichtet“ / „hergerichtet“.
- Meine Aufträge: Zeitleiste mit „Nachlieferung (Zusatz <ps>)“, Karte mit Hinweis „Nachlieferung herrichten <Tag>“ (rot, wenn überfällig). Test `tests/zus_t.js`.

## Version 1.89 – Geänderte Packscheine (pkchg.js, von build.py nach au.js angehängt)
- epirent vergibt bei einer Änderung eine NEUE Packscheinnummer, „Neu“ steht nur (manchmal) im Mail-Betreff, nicht in der PDF. Darum Inhaltsvergleich beim Hochladen (`pkMatch`, Artikel-Schlüssel = `abgKey`): ≥ 60 % der Artikel des Haupt-Packscheins im neuen (mind. 2 Artikel) → Vorschlag „Ersetzt Packschein X (geändert)“; Zusatz mit ≥ 2 Artikeln, ≥ 60 % Überdeckung in beide Richtungen und wenig Überdeckung mit dem Haupt → „Ersetzt Zusatz X“; sonst „Als Zusatz anhängen“. Nur vorausgewählt – Dialog `pkChgDlg` mit allen Möglichkeiten + Vorschau „Was sich ändert“ (`pkDiff`, mit Einheit).
- Zusätze, die im neuen Packschein stecken (alle Artikel da, Menge ≥ 80 % von Haupt+Zusatz), sind als „im neuen Packschein enthalten“ angehakt (abwählbar) und gehen beim Ersetzen auf.
- `pkReplace(M,P,inc)`: Packliste behält id (Herricht-Tag, Notizen, Abgleich, Retourscheine bleiben), übernimmt ps/pos/Zeiten der neuen PDF, `pack.chg` = Verlauf {t,by,from[],to,kind,diff}, `pack.mod`. Herricht-Stand pro Artikel (`pkCarry`): mehr → Teilmenge, weniger/entfällt → `packh.zr` „Zurücklegen“ (abhakbar), neu → offen; Alternativen, Fremdmiete-Wahl und Lager-55-Umstellung wandern mit. Abgeschlossen + Änderungen (oder offene eingeschlossene Zusätze) → `fin` = null. `pkReplaceZ` analog für einen Zusatz (Tag `zd_` wandert zur neuen Nummer).
- Gleiche Packscheinnummer nochmal (auch, wenn die Packliste inzwischen eine andere id hat) → Dialog nur mit „Ersetzen“, ebenfalls mit Übernahme pro Artikel (vorher nach Positionsnummer – konnte bei neu nummerierten Positionen falsch landen).
- Anzeige: Karte `pkChgCard` in der Packliste (letzte Änderung, Änderungen, Zurücklegen, frühere Änderungen), `pkHint` „↻ Packschein geändert – Änderungen prüfen“ / „↩ Zurücklegen: …“, „Meine Aufträge“ Zeitleiste „Packschein geändert“ mit Änderungen. Projektleiter bekommt keine Info (Änderung kommt von ihm). Test `tests/pkchg_t.js`.

## Version 1.90 – Packliste drucken / an den Monteur schicken (Entwurf https://claude.ai/artifact/SRjNAEuY4JxYtuujsvu9dT, von Jürgen freigegeben)
- `pkdruck.js` (von build.py nach pkchg.js angehängt). Knopf „Drucken / Teilen (PDF)“ in jeder Packliste (`#pkprint`, auch während des Herrichtens; lädt pdf-lib vor) → Dialog `pkDrDlg`: „Drucken“ (Handy: Teilen-Menü nur mit PDF; PC: PDF in neuem Tab), „Als PDF speichern“ (nur PC), „An den Monteur schicken“ mit fertigem Text (änderbar) → „Teilen (PDF + Text)“, „Mail öffnen“ (nur Text, mailto), „Text kopieren“. PDF wird beim Öffnen des Dialogs schon erzeugt (Teilen am iPhone braucht die Tipp-Geste).
- Zweck (Jürgen): damit den Lieferschein in epirent erstellen – sehen, was sich geändert hat und was alles dabei ist.
- `pkDrRows(P)`: Zeilen in **epirent-Reihenfolge** (`P.pos` wie gelesen, Positionsnummer). Zusätze eingerechnet: gleicher Artikel (`pkAK`) → zur Haupt-Position („inkl. … aus Zusatz …“), neuer Artikel → am Ende („Z <pos>“). Spalten Laut Packschein (inkl. Fremdmiete) / Mitgegeben (aus dem Lager). Ersatzartikel als eigene Zeile direkt darunter („Ersatz für Pos. …“). Fremdmiete: `fm==="miete"` → „davon … Fremdmiete – kommt nicht vom Lager“, `"lager"` → Abweichung „aus dem Lager statt Fremdmiete“, ungeklärt → „(noch nicht geklärt)“. Lager 55 grau an seiner Stelle. Offen + abgeschlossen = „nicht mitgegeben“ (Abweichung), offen + nicht abgeschlossen = „noch nicht hergerichtet“.
- PDF `pkDrPdf(P)` (A4, Helvetica/WinAnsi über `wbTx`): Kopf, Stand (Haupt + jeder Zusatz), Kasten „Abweichungen zum Packschein (n)“ (zeilenweise, darf über Seiten gehen), Kasten „Noch nicht hergerichtet“, Tabelle mit Kopf auf jeder Seite, „Seite x von n“. Dateiname `Packliste_<Veranstaltung>.pdf`.
- Mail-Text `pkDrMail(P)`: Stand, „Anders als im Packschein“, „Noch nicht hergerichtet“, **ganze Liste** „Du bekommst:“ (pro Artikel zusammengezählt, inkl. Ersatz / davon Fremdmiete), „Lager 55 (bitte selbst mitnehmen)“. Test `tests/druck_t.js` (PC + iPhone, lange Liste über mehrere Seiten → `druck_lang.pdf`).

## Version 1.91 – Bemerkungen zu Besprechungspunkten (Entwurf https://claude.ai/artifact/KQuozRzp9KeLJrEhAMrgFk, von Jürgen freigegeben)
- wb.js: pro Punkt (docs `wbnote`) beliebig viele Bemerkungen als eigene Felder `b_<id>` = {txt, by, t, mod:{by,t}} (null = gelöscht; ein Feld pro Bemerkung, damit doc_update zusammenführt). `wbBems(n)` sortiert nach Zeit.
- Ansicht: unter jedem offenen und erledigten Punkt die Bemerkungen (Name, Datum, „(geändert)“) + „+ Bemerkung“ (Eingabefeld direkt darunter, Enter speichert, Esc bricht ab). „Ändern · Löschen“ bei eigenen, mit `v_app` bei allen. Schreiben darf jeder mit Lager Übersicht (Ansicht `wb` braucht `jv_s`; wbnote hat keine eigene DB-Regel). Erledigt-Liste bleibt beim Bearbeiten aufgeklappt.
- Bericht/Druck (`wbPaper`) und PDF (`wbPdf`): Bemerkungen klein unter dem Punkt („Name, T.M.: Text“). Erledigte Punkte weiterhin nicht im Ausdruck. Test `tests/wbbem_t.js`.

## Version 1.92
- Fehler behoben (Jürgen: „Ich kann das PDF nur teilen aber nicht runterladen“): „Als PDF speichern“ gibt es jetzt auch am Handy/Tablet – in „Packliste als PDF“ (`#pkdrs`) und im Wochenbericht (`#wbpdf`). Download über `<a download>` (Blob-URL 60 s gültig) bzw. `claude.use("downloads")`, danach Hinweis „PDF gespeichert: …“.

## Version 1.93 – Zusätzlich mitgegebenes Material (Entwurf https://claude.ai/artifact/Cm8BUsohJ4nP2aHYugFpi3, von Jürgen freigegeben)
- `pkextra.js` (nach pkdruck.js). Beim Herrichten „+ Material hinzufügen“ (`#pkxadd`, nur solange die Haupt-Packliste nicht abgeschlossen ist; jeder mit pk_s): Artikel aus der Artikelliste suchen oder frei eintippen, Menge, Einheit, Grund. Gespeichert als `packh.x_<id>` = {n,u,nm,a,why,by,ts,mod} (null = gelöscht). Grüne Gruppe „Zusätzlich (nicht im Packschein)“, antippen = ändern/löschen (`pkXDlg`).
- Zählt als Abweichung (`pkProgOf` dev → Frage „Info an PL?“), in der Info-Mail an den PL („Zusätzlich mitgegeben (nicht im Packschein): …“), im Abgleich als raus (`abgBal`), bei „Wo ist …“ (`jvArtCnt`), in „Meine Aufträge“ (Zeitleiste Abweichungen), im PDF (Kasten „Zusätzlich mitgegeben: …“ + grüne Zeilen am Ende, Laut Packschein „–“) und in der Mail an den Monteur („Du bekommst … (zusätzlich, nicht im Packschein)“).
- Verrechnung (`pkXApply(P,H,items)`): beim Anhängen eines Zusatzes (pack.js) und beim Ersetzen von Packschein/Zusatz (pkchg.js, nach `pkCarry`) wird zusätzliches Material gleichen Artikels (`pkXKey` = `pkAK`) auf offene Mengen der neuen Positionen übertragen (h.q/ok, `xf:true`) und `x_` gekürzt bzw. gelöscht – nichts wird doppelt hergerichtet oder doppelt im Abgleich gezählt. Test `tests/extra_t.js`.

## Version 1.94
- „Soll <PL> eine Info bekommen?“ (nach Herrichten/Zusatz abschließen) hat jetzt „Ja / Nein“ statt „Ja / Abbrechen“ (Jürgen). `ask(t,fn,nl)` hat einen optionalen dritten Parameter für den Nein-Text (rep am Ende von build.py); alle anderen Fragen bleiben „Ja / Abbrechen“.

## 1.95 – Werkstatt: Reparatur + Ersatzteile, Ersatzteile-Bericht
- Neu: `ersatz.js` (in build.py nach pkextra.js eingebunden), Styles `.et*` in jarvis.css.
- Offener Defekt: Knopf „Repariert“ (statt „Als erledigt markieren“) öffnet das Fenster „Reparatur“: Beschreibung, Ersatzteile (Menge + Einheit, Artikelname Pflicht, TPC-Nr. / Hersteller-Nr. optional), Fotos → „Speichern und erledigt“.
- Erledigter Defekt: Karte „Reparatur“ + Knopf „Reparatur ändern“ (bzw. „Reparatur / Ersatzteile eintragen“).
- Vorschläge beim Tippen aus allen bisher eingetragenen Teilen (mit beiden Nummern und „n× verwendet“).
- Daten im Defekt: `rep`, `et` [{n,u,nm,tnr,hnr}], `rfn` (Fotos `fotos/<id>r-<k>`), `repBy`, `repT`. Kein SQL nötig.
- Ersatzteile-Bericht (PDF): Knopf in der Defekte-Liste; Zeitraum nach Reparaturdatum (doneT): Dieser Monat / Letzter Monat / Dieses Jahr / Von–bis. Keine Preise.
- Recht: „Defekte – Bearbeiten“ (def_b) für Eintragen und Bericht.
- Defekte-Liste: offene oben (dringende zuerst), erledigte unten, jeweils neueste zuerst. Nach „Defekt melden“ öffnet sich der Reiter „Alle“.
- Test: tests/ersatz_t.js

## 1.96 – Kachel „Defekt melden“ öffnet die Defekte-Liste
- Hauptseite: Kachel „Defekt melden“ führt jetzt zur Defekte-Liste mit Reiter „Alle“ (Reihenfolge wie 1.95). Melden über den Reiter „Defekt melden“. Standard-Reiter der Liste ist „Alle“.
- Sprachbefehl „Defekt melden“ im Lager Assistent öffnet weiterhin direkt das Formular.
- Test: tests/defkachel_t.js

## 1.97 – Kachel heißt „Defekte“
- Hauptseite und Einstellungen (Reihenfolge der Kacheln): „Defekt melden“ → „Defekte“. Der Reiter in der Liste heißt weiterhin „Defekt melden“.

## 1.98 – Zu prüfen hervorheben, Geprüft mit Notiz, Übersicht „Geprüft“ (abg.js)
- Lager Übersicht: Feld „Aufträge zu prüfen“ ist orange mit Anzahl – nur wenn wirklich etwas zu prüfen ist. Sonst neutral „Nichts zu prüfen · Geprüfte Aufträge ansehen“ (nur mit Recht abg_p).
- „Geprüft“ öffnet abgCheckDlg: freiwillige Notiz, Knöpfe ABG_NOTES („Retoure per Mail an Projektleiter gesendet“, „Fehlmaterial mit Projektleiter geklärt“, „Alles vollständig“). Gespeichert in docs abpr: note. Anzeige im Abgleich bei „✓ Geprüft von …“.
- Ansicht „Zu prüfen“: Reiter „Zu prüfen (n)“ | „Geprüft“. Zu prüfen mit „wartet seit …“. Geprüft = alle geprüften Aufträge nach Monat, Suche (Veranstaltung, Auftrag, PL, Notiz, wer), Tipp öffnet Abgleich. „Zuletzt geprüft“ (nur diese Woche) entfällt.
- Test: tests/pruef_t.js

## 1.99 – Abweichungen oben + Artikel scannen beim Herrichten (Entwurf https://claude.ai/artifact/Q6cgjYw5BLqLqFREdoviEL, Jürgen: „Passt so“)
- Abweichung = zu wenig (`part`), zu viel (`pkOver`: h.q > Soll, vorher grüner ✓) oder Alternative (`pkDevRow`). Diese Zeilen stehen in der Herricht-Ansicht ganz oben in der orangen Gruppe „Abweichungen (n)“ (`.pkgdev`), mit oranger Kreis „!“ und Unterzeile Gruppe (+ Zusatz). Zählen im Fortschritt bei „mit Abweichung“ (auch zu viel). Kreis antippen bei zu viel öffnet Bearbeiten. Zeilen-HTML jetzt in `pkRowHtml`/`pkRowsHtml` (pack.js). Zusatz-Abschnitt ohne übrige Zeilen zeigt „Alle Positionen stehen oben …“ + Fußzeile.
- Info-Mail, PDF und Abgleich behandeln „zu viel“ unverändert (PDF: Mitgegeben max. Soll).
- `pkscan.js` (build.py nach pkextra.js): Knopf „Artikel scannen“ über der Liste (weg, wenn alle Zeilen abgeschlossen). `rScanCam` → `pkScanHit`: Nummer wie Retourschein (`rScanNr`, `artCode`), IDs werden NICHT gespeichert. Treffer → `pkScanHl` (blaue Zeile `.pkhl`), scrollen, `pkEdit(P,i,{msg})` mit grünem Hinweis (bzw. „Schon komplett hergerichtet“). Mehrere Treffer (Packschein + Zusatz) → Auswahl. Nicht in der Packliste → Fehler-Ton + Auswahl: Alternative für offene Position (gleiche Gruppe zuerst, `pkEdit(...,{alt:{t,a}})` belegt Artikel vor), „+ Zusätzlich mitgeben“ (`pkXDlg(P,null,{t,a,msg})`, nur wenn Haupt-Packliste offen), „Verwerfen“. Unbekannte Nummer: nur Zusätzlich/Verwerfen.
- Test `tests/pkscan_t.js` (SP). Hinweis: `ov_t.js` scheitert montags (kein vergangener Wochentag) – schon vor 1.99.

## 1.100 – „Zu viel“ überall als Abweichung (Jürgen: „Zu viel ist auch eine Abweichung! Jede Art von Abweichung soll angezeigt werden.“)
- Versionsnummer 1.99 → 1.100 (nach dem Punkt weiterzählen, nicht 2.0).
- `pkDevRow` zählt jetzt auch „aus dem Lager statt Fremdmiete“ → steht ebenfalls oben bei „Abweichungen“. Kreis antippen bei jeder Abweichung öffnet Bearbeiten.
- „Zu viel“ (`pkOver`) zählt als mitgegeben: Abgleich raus (abg.js, 3 Stellen), Assistent „Wo ist …“ (jvArtCnt), geänderter Packschein (pkchg), Zusatzmaterial-Verrechnung (pkextra). Info-Mail: Zeile „x von y – z mehr als im Packschein“. PDF: Mitgegeben = tatsächliche Menge, „!“, Hinweis und Zeile im Kasten „Abweichungen“; „!“ jetzt auch bei Ersatz. Meine Aufträge: Abweichungen beim Herrichten + Material-Liste zeigen zu viel.
- Einheiten ergänzt: „15 von 16 Stk da – fehlen 1 Stk“ (Herricht-Ansicht und Info-Mail).
- Test `tests/pkscan_t.js` prüft Mail, PDF und Abgleich mit zu viel.

## 1.101 – Herrichten ohne Netz (Fehler gemeldet von Jürgen: Tablet außerhalb des WLAN → „Speichern fehlgeschlagen“)
- `pkHSet` (alle Schreibstellen für `packh`: Abhaken, Mengen, Alternativen, Verschieben, Abschließen, Zusatzmaterial, geklärt, Notizen) schreibt zuerst in localStorage `tpc_packh_queue` ({<packliste-id>: {u, p:Patch, n, t}}, feldweise zusammengeführt) und zeigt es sofort an (`db.local` im DBX = put). Hochladen in `pkQFlush`: `update`, bei „Eintrag nicht gefunden“ `set({c,...p})` (statt vorher immer zuerst set). Netzfehler (`pkNetErr`) → bleibt in der Warteschlange, Toast „Kein Netz – wird im Gerät gemerkt …“ + Hinweis oben in der Packliste (`pkOffHint`). Anderer Fehler (Recht) → Eintrag verworfen, errBox, neu laden.
- Nachladen: online-Ereignis (+1,2 s), alle 20 s solange etwas wartet, 4 s nach dem Start. Danach Toast „Wieder Netz – alles vom Herrichten ist gespeichert“.
- `window.dbOverlay`/`dbOverlayIds` (shim.js, DBX `load`/`put`): wartende Änderungen bleiben sichtbar, auch wenn die Daten neu geladen werden.
- Nur Herrichten. Packliste hochladen/löschen, Materialliste, Defekte usw. brauchen weiter Netz (Retourschein hatte schon eigene Offline-Sicherung, autosave.js).
- Test `tests/offline_t.js` (fakesb: `window.__offline=true` → rpc „Failed to fetch“).

## 1.102 – Papierkorb + Datensicherung (Jürgen: „So wie von dir vorgeschlagen bitte“ = automatische Sicherung + Papierkorb + Knopf)
- **sicherung.sql** (Jürgen führt aus; nochmal Ausführen schadet nicht; can_read/can_write/can_delete NICHT verändert – letzte Version bleibt auftraege.sql):
  - Tabelle `papierkorb` (nr, col, doc_id, data, deleted_by, deleted_at). Trigger `papierkorb_fang` (BEFORE DELETE auf docs) kopiert JEDES Löschen hinein (außer `hord`), löscht Einträge > 30 Tage. Lesen nur Admin (Policy), schreiben nur Trigger/Funktionen.
  - `papierkorb_liste()` (Admin; ohne große Daten, `info` mit ev/ord/ps/name/nr/art/nm/txt/t/title/by/g), `papierkorb_zurueck(nr)` (Admin; stellt den Eintrag + im selben Zug (±10 min) Gelöschtes mit gleicher id bzw. Fotos `<id>-…`/`<id>r-…` wieder her; vorhandene Einträge werden NICHT überschrieben → `schon`).
  - Tabelle `sicherung` (k, wert, t): `schluessel` = sha256 des Sicherungs-Schlüssels (Schlüssel wird nur beim ersten Ausführen angezeigt), `zuletzt` = Anzahl + Zeit der letzten nächtlichen Sicherung. Funktionen `sicherung_docs(key, ab, n)` (seitenweise, max 500), `sicherung_profile(key)`, `sicherung_fertig(key, n)` – für anon mit Schlüssel; `sicherung_stand()` nur Admin.
  - Test `tests/pg/sql_sicherung_test.py`.
- **App** `sicher.js` (build.py nach pkscan.js; Hooks in build.py: `bkBlock()` am Ende von appView, `bkHint()` nach homeSort): nur `realOwner`. App-Verwaltung → „Datensicherung“ (Stand der nächtlichen Sicherung, rot ab 2 Tagen bzw. wenn jetzt < 80 % der gesicherten Anzahl; Knopf „Datensicherung herunterladen“ = alle docs + Profile als JSON, am Handy Teilen, sonst Download; localStorage `tpc_bk_last`) und „Papierkorb“ (Liste gruppiert: Fotos/Herricht-Stand hängen am Haupteintrag, Suche, Wiederherstellen). Hauptseite: einmal am Tag Toast, wenn nächtliche Sicherung ≥ 2 Tage alt oder manuelle ≥ 7 Tage. Test `tests/sicher_t.js`; `tests/fakesb.js` kann jetzt Papierkorb (Löschen → `T.papierkorb`, rpc papierkorb_liste/_zurueck, sicherung_stand mit `T.bk/bkT/bkN`).
- **Nächtliche Sicherung** `_quelle/sicherung/`: `sichern.mjs` (Node 20, holt alles über `sicherung_docs`, schreibt `daten/<col>.json`, `daten/fotos/<id>.json`, `daten/_profile.json`, `stand.json`; < 50 % der letzten Anzahl → trotzdem sichern, Exit 2 = Mail), `sicherung.yml` (GitHub Actions, täglich 01:17 UTC + „Run workflow“, Secret `SB_BACKUP_KEY`, anon-Key steht drin). Gehört ins **private** Repo `kph2pw5bfd-art/lager-sicherung` (Jürgen legt es an) als `sichern.mjs` + `.github/workflows/sicherung.yml`. `ANLEITUNG.md` = Schritte für Jürgen.
- Wiederherstellen aus der nächtlichen Sicherung: Stand aus lager-sicherung holen (git log/checkout des Tages), daraus SQL `insert … on conflict (col,id) do update` in Teilen erzeugen, Jürgen führt aus. (Noch kein fertiges Werkzeug.)
- Eingerichtet 2.11.: privates Repo heißt **kph2pw5bfd-art/lager-sicherung-** (Bindestrich am Ende). Erste Sicherung erfolgreich (328 Einträge). Von Hand starten: `gh api -X POST repos/kph2pw5bfd-art/lager-sicherung-/actions/workflows/404967831/dispatches -f ref=main` (GraphQL/„gh workflow run“ geht aus der Sitzung nicht).

## 1.103 – Artikelliste als Excel herunterladen (Jürgen: „Ja, und nimm die leere Vorlage raus“)
- `artxl.js` (build.py nach sicher.js). App-Verwaltung → Artikelliste: Knopf „Artikelliste als Excel herunterladen“ statt „Excel-Vorlage herunterladen“ (Datei `Artikelliste_Vorlage.xlsx` aus dem Repo entfernt). Export `artXlExport`: Blatt „Artikel“ (Spalten wie der frühere Vordruck + „Lager 55“, Reihenfolge wie `alBody`, ✔ für ID/Zubehör/A/B/C/Lager 55, Nummer leer bei Artikeln ohne Nummer, Kopfzeile fixiert, ✔-Auswahlliste E2:J3000), „Zubehör“, „Anleitung“.
- Import (Änderungen per rep in build.py): liest Spalte „Lager 55“ (fehlt sie → bisheriges Häkchen bleiben, `artXlL55`); Artikel ohne Nummer behalten ihren Schlüssel bei gleicher Gruppe + Name (`artXlKeep`); vor dem Speichern `artImpPreview`: x neu · y geändert · z fallen weg (mit Namen und was sich ändert, Zubehör), „Abbrechen“ / „Importieren“. Weggefallene Artikel landen im Papierkorb.
- Test `tests/artxl_t.js` (ExcelJS-Attrappe im Test, schreibt JSON statt xlsx – echtes ExcelJS kommt vom CDN, mit echter Datei noch nicht probiert).

## 1.104 – Begriffe in der Lager Übersicht (Jürgen)
- Reiter „Überfällig“ heißt „Dispo abgelaufen“, Reiter „Fehlt noch“ heißt „Fehlmaterial“ (jvTabs/jvTabList in shim.js, abgMissTab in abg.js, Hinweistext unten, Rückfrage „Mit Projektleiter geklärt“). Nur die Lager Übersicht – Packlisten-Gruppe „Überfällig“, Wochenbericht, Briefing, Assistenten-Fragen und „Meine Aufträge“ („Fehlt noch“) unverändert (Jürgen gefragt).

## 1.105 – „Dispo abgelaufen“ und „Fehlmaterial“ überall (Jürgen: „Ja bitte“) + Reiter-Layout
- Alle sichtbaren „Überfällig/überfällig“ → „Dispo abgelaufen“, Sätze umformuliert („Bei X ist die Dispo abgelaufen“, „Bei n Aufträgen …“, „mit abgelaufener Dispo“): Packlisten (Status-Etikett, Gruppe, Kachel), Lager-Übersicht-Kachel, Briefing frech/sachlich, Assistent (jvask/jvfrag inkl. Hilfe: „Wo ist die Dispo seit mehr als 3 Tagen abgelaufen?“, „Wo ist die Dispo am längsten abgelaufen?“), Wochenbericht, Meine Aufträge, Abgleich. „Fehlt noch“ → „Fehlmaterial“ (Meine Aufträge, Retoure-Mail, Nachfrage-Mail „Fehlmaterial laut Retourschein:“); in „Was kommt diese Woche zurück“ „noch nicht zurück“. Intern heißen Zustände weiter `over`.
- Erkennung im Assistenten: „überfällig“ UND „Dispo (ist) abgelaufen“, „abgelaufene Dispo“ usw. (jvfrag.js, Abschnitt Rücklauf & Dispo).
- Lager Übersicht: Reiter „Fehl-<br>material“ (Feld `lh` in jvTabs), Reiter oben ausgerichtet (`.jvtab{justify-content:flex-start}`) → Zahlen auf gleicher Höhe.
- Kleinigkeit: doppelter Punkt nach dem Datum in „Dispo-Ende Mi 28.10.“ entfernt.

## 1.106 – Retourschein-Excel: Differenz richtig (Fehler gemeldet von Jürgen)
- Spalte „Differenz“ = Retour − Ausgang (vorher Ausgang − Retour): 4 raus, 2 zurück → −2; zu viel → +1. Zahlenformat `+0;-0;0`, fett; bedingte Formatierung: < 0 rot (FFC0392B), > 0 orange (FFE67E22). Umsetzung per rep in build.py (basis.html bleibt unverändert, Funktion `retXl`).
- Abgleich-Excel (abg.js): Differenz bekommt ebenfalls `+0;-0;0` (Farben hatte es schon).
- Test `tests/retxl_t.js` (ExcelJS-Attrappe; mit echtem Excel noch nicht geöffnet).

## 1.107 – Push-Nachrichten aufs Handy (Entwurf https://claude.ai/artifact/J45vHSeumHWjGnqd9o4Q8f, Jürgen: „Ja das passt“)
- Arten: `pr` Endretoure abgeschlossen → „Zu prüfen“ (Standard Titel lagerleiter), `def` dringender Defekt (neu dringend oder auf dringend gestellt, nicht erledigt) → werkstatt, `pk` neue Packliste (nur echtes INSERT, Ersetzen/Upsert nicht) → lagerarbeiter – auch an den, der hochlädt (Jürgen: Tablet soll sie anzeigen). Sofort, keine Ruhezeiten.
- **push.sql** (Jürgen führt aus): `pg_net`, Tabelle `push_abos` (endpoint, user_id, sub, typen, geraet, t; jeder nur eigene Zeilen), `push_cfg` (Geheimnis Datenbank↔Funktion, VAPID-Schlüssel; nicht lesbar), Trigger `push_ausloesen` (AFTER INSERT/UPDATE auf docs) → `net.http_post` an `/functions/v1/push` mit anon-Key + Geheimnis; Fehler werden nur als Warnung geloggt (Speichern geht immer). Texte: „Zu prüfen: <ev>“ / „Endretoure von <Name> · Auftrag …“, „Dringender Defekt: <art>“ / „gemeldet von … · <ev> · „<desc>““, „Neue Packliste: <ev>“ / „Auftrag … · herrichten Fr. 06.11. · n Positionen“. Test `tests/pg/sql_push_test.py` (pg_net-Attrappe).
- **Edge Function** `_quelle/push/index.ts` (Jürgen legt sie im Dashboard „Via Editor“ an, Name `push`, JWT-Prüfung an lassen): `npm:web-push@3.6.7`, erzeugt VAPID beim ersten Aufruf in push_cfg. GET → {key}; POST {geheim,typ,…} → an Abos mit `typen[typ]===true` von aktiven Benutzern, deren Titel es erlaubt (`titel.push`, sonst Standard) oder Admin; 404/410 → Abo löschen. POST {test:true} mit Benutzer-Token → Test an eigene Geräte. Test `tests/pushfn_t.mjs` (Attrappen). **Mit echtem Supabase/Push-Dienst noch nicht getestet.**
- **sw.js** (Repo-Wurzel, neben index.html): nur push + notificationclick (öffnet `./?go=pr|def:<id>|pk:<id>` bzw. schickt `{go}` an die offene App). KEIN fetch-Handler/Cache.
- **App** `push.js` (build.py nach artxl.js): `pushStart` 1,5 s nach dem Login (sw.js anmelden, `?go=` auswerten, Nachrichten der offenen App), Einstellungen → „Benachrichtigungen“ (`pushBlock`/`pushBind` per rep in build.py): erlauben (Notification.requestPermission, subscribe mit Schlüssel aus GET), Schalter pro Art (nur erlaubte; Admin vorab aus, andere nach Titel), Test-Nachricht, ausschalten; iPhone im Browser → Hinweis Home-Bildschirm. Titel und ihre Rechte: „Benachrichtigungen aufs Handy“ (`pushTitleBlock`/`pushTitleBind`, in shim.js eingehängt) → `titel.push`. localStorage `tpc_push_ep`. Test `tests/push_t.js`; fakesb.js kann jetzt `update()` und Tabelle `push_abos`.
- Anleitung für Jürgen: `_quelle/push/ANLEITUNG.md`.

## Version 1.111 – manuell eingetragene Artikel umbenennen (Jürgen, 3.11.)
- Retourschein → „Manuell eingetragene Artikel“ → Artikel antippen → im Zahlenfeld Link „✎ Name / Nummer ändern“ (`rManEdBtn`) → Dialog `rManEdit` (Name Pflicht, Nummer optional). Nur solange der Schein bearbeitet wird (abgeschlossen = keine Zahlenfelder).
- Gespeichert als Feld `mn_<Schlüssel>` = {nr,name,by,t} am Retourschein (über `rSnap`, also auch offline gesichert; `rs.mn` hält es, bis der Stand aus der Datenbank es bestätigt). `rMnApply` setzt Name/Nummer nach dem Zusammenzählen in `rView` und `rRemote` – gilt damit auch über die Anteile `pa_<id>` der Kollegen, die noch den alten Namen tragen. Schlüssel (`M:…`) bleibt gleich.
- Neuer Name/Nummer gehört zu einem Artikel der Artikelliste → Frage „Ja, als „X“ zählen“ (Menge wird per `rAdd` verschoben, geht mit Anteilen) / „Nur umbenennen“. Gleich wie ein anderer manueller Artikel im Schein → zusammengelegt. `rManDlg` nimmt bei gleichem Namen/gleicher Nummer den vorhandenen manuellen Artikel (`rManFind`).
- „Fehlende Artikel“ (`rFehlMove`): alter Eintrag −1 Mal/−Menge (gelöscht, wenn nichts übrig), neuer +1/+Menge; beim Verschieben in die Artikelliste nur abziehen. Das Protokoll (rlog) behält bei alten Einträgen den alten Namen.
- Kein SQL nötig. Test `tests/mned_t.js` (SP-Umgebungsvariable).

## Version 1.112 – Fehler behoben: „Letzte Änderung“ beim bloßen Öffnen (Jürgen, 3.11.)
- Ursache: `rPersist` schreibt bei jedem Aufruf (auch ohne Änderung, z. B. `retEdit`, Verlassen der App) die lokale Sicherung `tpc_retour_backup`. Kam nichts Neues dazu, kehrte `rWrite` früh zurück, ohne diese Sicherung zu löschen → beim nächsten App-Start schrieb `rSyncLocal` sie mit `mod`/`modT` = jetzt hoch.
- Jetzt: `rSame(sn, gespeichert)` vergleicht den Anteil/Kopfdaten mit dem gespeicherten Stand – gleich → nicht schreiben, Sicherung löschen (in `rWrite` und `rSyncLocal`, dort auch kein „… wurde gespeichert“-Hinweis). `rBkDrop` löscht die Sicherung auch beim frühen Rücksprung. Echte Änderungen setzen `modT` wie bisher.
- Test `tests/modt_t.js` (Schein anlegen, Zeiten 1 Std. zurückdrehen, App neu öffnen + Schein öffnen → modT bleibt; echte Änderung → neu).
- Prüf-Test `tests/audit_t.js` (3.11.): geht alle Bildschirme durch (Hauptseite, Lager Übersicht, Wochenbericht, Zu prüfen, Zu viel zurück, Packlisten inkl. Abgleich, Meine Aufträge, Retourscheine ansehen/bearbeiten, Defekte, Infos, Materiallisten, Verwaltung), öffnet die App neu (`reopen` behält die Test-Daten) und meldet jede Datenbank-Änderung beim bloßen Ansehen. Ergebnis nach 1.112: nur `users/<id>.t` beim Start (Anmelde-Zeitstempel, gewollt) und Herzschlag `ed_…`; echte Änderungen werden nach dem Neu-Öffnen nicht nochmal geschrieben. Nach größeren Umbauten wieder laufen lassen.

## Version 1.113 – „In Arbeit“ nur, solange jemand den Schein offen hat (Jürgen, 3.11.)
- Bisher: gelbes „In Arbeit“ = `draft` (automatisch angelegt, noch nie „Retourschein speichern“) – blieb ewig stehen.
- Jetzt `rWorkTag(r)` (shim.js, rep am Ende von build.py): „In Arbeit · Jürgen H.“ (mehrere mit Komma, Tablet „Karl K. (Tablet)“), solange ein Herzschlag `ed_<id>` jünger als 90 s ist (`rWorkers`, wie `rWhoL`, aber inkl. eigenem Konto). Herzschlag kommt nur im Bearbeiten (`retedit`, sichtbar), alle 30 s; beim Verlassen wird er auf 0 gesetzt. Fällt ein Gerät weg (App zu, kein Netz), verschwindet die Markierung nach spätestens ~1,5–2 Min (Liste zeichnet sich alle 20 s neu).
- `draft` wird weiter gespeichert, aber nicht mehr angezeigt. Test `tests/inarb_t.js`.

## Version 1.114 – „Richtet her · Name“ beim Herrichten (Jürgen, 3.11.; gewählt: Wand, Alle Packlisten, in der Packliste; gilt, solange die Packliste offen ist)
- Herzschlag in eigenen docs `pked` (id = Packliste) {ed_<id>: Zeit, edn_<id>: Tablet-Name} – bewusst nicht in `packh` (dessen Vorhandensein/Felder zählen beim Herrichten). `pkHb` alle 4 s prüfen, alle 30 s schreiben, solange `view==="packopen"`, sichtbar und noch nicht alles abgeschlossen (inkl. Zusätze); beim Verlassen/Wechseln/pagehide 0. Ohne Netz kein Herzschlag (geht nicht in die Herricht-Warteschlange). Gültig 90 s (`pkWorkers`).
- Anzeige `pkWorkTag`: gelbes Schild „Richtet her · Max M.“ (Tablet „Karl K. (Tablet)“) in `pkRow` (Alle Packlisten), `pkCard`/`pkLine` (Wand schmal/breit) und „Nicht hergerichtet“; in der Packliste `pkWhoHint` „Max M. richtet gerade auch diese Packliste her.“ (ohne eigenes Konto). Übersicht/Alle Packlisten zeichnen sich alle 20 s neu (Ablauf). CSS `.pkwork` in build.py.
- Kein SQL (pked fällt unter die Standardregel). Test `tests/pkwork_t.js`; `audit_t.js` ignoriert neue Dokumente, die nur Herzschlag-Felder haben.
- Bekannt (schon vor 1.114): `offline_t`/`pkscan_t` melden nur „Version 1.110“ (fest im Test), `ov_t` hängt vom Datum ab.

## Version 1.115 – Info zum Herrichten (Jürgen, 4.11.; gewählt: beim Hochladen + später, großer Kasten oben, Schild „ℹ Info“ in den Listen, auch im PDF und an den Monteur)
- Feld „Info zum Herrichten (optional)“ in `pkConfirm` (neue Packliste) und `pkChgDlg` (Zusatz / geänderter Packschein / eigene); Text in `pkUpHi` (überlebt das Neuzeichnen des Dialogs), nach dem Speichern `pkHiUp(Ziel, Zusatz-Nr)`. Neu → eigene Packliste, Zusatz/Zusatz-Ersatz → Haupt-Packliste mit `z`, Ersetzen → Haupt-Packliste.
- Gespeichert in `packh` (bleibt beim Ersetzen): `hi_<key>` = {txt,by,t,z?,mod?,modT?}, gelöscht = null; über `pkHSet` (Warteschlange, auch ohne Netz). Mehrere Einträge möglich.
- Anzeige: `pkHiBox` als erstes Element in der Packliste (oranger Kasten, Text 19 px fett, Zeilenumbrüche, Name + Datum, „Zusatz <Nr>“-Abzeichen; dunkel eigene Farben, CSS in build.py). Mit Recht `pk_b`: „Ändern“ (Dialog `pkHiDlg` mit Löschen), „+ Weitere Info“, ohne Info „+ Info zum Herrichten eintragen“ (`pkHiAddLink`) – Klicks per document-Listener. Ohne pk_b nur lesen.
- `pkWorkTag` zeigt zusätzlich das Schild „ℹ Info“ (Wand schmal/breit, Nicht hergerichtet, Alle Packlisten).
- PDF (`pkDrPdf`): Kasten „Info zum Herrichten“ vor „Abweichungen“; Monteur-Text (`pkDrMail`): Block „Info:“ nach der Einleitung.
- Kein SQL. Test `tests/pkhi_t.js` (pdf-lib lokal, pdftotext prüft den Kasten).

## Version 1.116 – Defekt: „Fremdverschulden“ (Jürgen, 4.11.; gewählt: Häkchen + optional „Wer / wie?“, Anzeige Liste/Detail/Ersatzteile-Bericht, nachträglich änderbar)
- Felder am Defekt: `fv` (true/false), `fvw` (Wer / wie?), beim Nachtragen zusätzlich `fvBy`/`fvT`. Patches am Ende von build.py (Formulare „Defekt melden“ `dnfv`/`dnfvw` und „Bearbeiten“ `defv`/`defvw` unter „Dringend“; Feld erscheint erst nach dem Anhaken), Funktionen in ersatz.js (`defFvGet`, `defFvSet`, `defFvTag`, `defFvLine`, `defFvDlg`).
- Anzeige: rotes Schild „FREMDVERSCHULDEN“ in der Defekte-Liste und im Kopf des Defekts (auch erledigt), Kasten „Fremdverschulden: …“ im Defekt. Wer den Defekt gemeldet hat, ändert über „Bearbeiten“; alle anderen mit Recht Defekte-Bearbeiten (Werkstatt) über „+ Fremdverschulden eintragen“ / „Ändern“ (eigener Dialog, ändert nur fv/fvw).
- Ersatzteile-Bericht: Zeile „Fremdversch.  Ja – …“ (rot, fett) bei der Reparatur, Kachel „Reparaturen (davon n Fremdverschulden)“.
- Kein SQL. Test `tests/fv_t.js`.

## Version 1.117 – Knopf „Fertig“ beim Zählen (Jürgen, 4.11.: „kein Knopf zum Speichern, ich muss über die Pfeiltasten zurück“; gewählt: „Fertig“ neben „Schein ansehen“, springt zum Retourschein)
- Leiste unten (`rBar`): „Schein ansehen“ (jetzt ghost) + „Fertig“ (`#rfin`). Gebunden in retEdit neben `#rsum` (rep am Ende von build.py).
- Neue Funktion `rFinish(btn)` (autosave.js) – auch „Retourschein speichern“ in der Zusammenfassung ruft sie (der alte Handler wird in build.py herausgeschnitten). Ohne Änderung (`rSame`) wird nichts geschrieben (bei Entwurf nur `draft:false`) → „Letzte Änderung“ bleibt (vorher setzte „Retourschein speichern“ immer mod/modT). Danach Ansicht `retopen`. Leer → Hinweis „Bitte zuerst Artikel erfassen.“
- Test `tests/fertig_t.js` (360 + 390 px).

## Version 1.118 – Packscheine ohne Herrichten: „Von Baustelle“ und „Verlängerung“ (Jürgen, 4.11.; Entwurf https://claude.ai/artifact/3MeYzoAU44M8WS4vgNyAEE; gewählt: Quell-Baustelle freiwillig, einstellen nur mit pk_b, PL sieht es in „Meine Aufträge“)
- Felder am pack-Dokument: `art` = "bst" | "verl" | "" (normal), `von` = Quell-Auftrag (bst, freiwillig) bzw. verlängerter Auftrag (verl, Pflicht), `artBy`/`artT`. Kein SQL (pack-Schreibrecht = pk_b, Datenbank prüft das schon).
- Hochladen (`pkConfirm`, nur neue Aufträge – nicht beim Zusatz/geänderten Packschein): Block „Was ist das?“ (`pkArtInit` → `pkUpArt`). Vorschlag Verlängerung (`pkVerlSug`): gleiche Veranstaltung (Pflicht), beginnt −1…+2 Tage ums Dispo-Ende, ≥ 60 % gleiche Artikel – dann vorausgewählt mit blauem Hinweis. Quell-Vorschläge (`pkBstSug`): Dispo-Ende −2…+1 Tage um den Dispo-Beginn, gleiche Artikel; Suche über alle laufenden Aufträge; „Weiß ich nicht“.
- `pkNoH(p)`: kein Herricht-Tag (`pkHDay` 0), `pkState` eigene Zweige („Von Baustelle“ / „Verlängerung“ – Klassen `pkbst`/`pkverl`; bst kann „Dispo abgelaufen“ werden, verl nie – das zählt beim Original). Wand: `pkSlot` = Dispo-Beginn, gestrichelte Karte (`pkNoHCard`), nie „Nicht hergerichtet“, `pkOpenN`/`pkPastSum` zählen sie nicht. Packliste öffnen → `pkNoHView` (Kasten, Material nur zur Info, Vergleich mit dem Original, Art ändern, „Doch selbst herrichten“, Löschen). Kein „Richtet her“-Herzschlag. Wochenbericht-Herrichten ohne sie.
- Verlängerung: `pkRoot` (Kette über `von`), `pkArtFix` beim Laden: Original bekommt `de` = spätestes Dispo-Ende der Verlängerungen (`_de0` = ursprünglich, `_verl` = Kinder) – wirkt überall (Status, Lager Übersicht, Assistent, Abgleich). `pkRets` = Retourscheine aller Auftragsnummern von Original + Verlängerungen; `abgPackOf` → Original; `abgBal(verl)` leer, `abgPkCard(verl)` → Karte des Originals; `jvArtCnt` zählt die Verlängerung nicht (sonst doppelt). Mehr Material als im Original → `pkVerlExtra`: Frage, dann Zusatz am Original (`zus[].verl` = Verlängerungs-Packschein, Herricht-Tag per `pkZAskDay`). Weniger → nur Hinweis.
- Von Baustelle: zählt im eigenen Abgleich als draußen (laut Packschein); beim Quell-Auftrag zählt dieselbe Menge (ohne Fremdmiete) als zurück (`abgBal`, Feld `weit`), Hinweis „➜ Material geht direkt weiter an …“ (`pkArtHints`, auch „↻ Verlängert bis … (ursprünglich …)“).
- Meine Aufträge (au.js): Schritt Herrichten = „Kein Herrichten – kommt von einer Baustelle“ / „Verlängerung – kein Herrichten“; beim Original „Verlängert bis …“ und „Material geht weiter …“ in der Zeitleiste.
- „Art ändern“ (`pkArtDlg`, Link in jeder Packliste, nur pk_b); nachträglich auf Verlängerung → `pkVerlExtra` fragt ebenfalls nach dem Mehr.
- Offen: Push „Neue Packliste“ (Datenbank-Trigger) kommt auch bei diesen Packscheinen.
- Test `tests/pkart_t.js`.

## Version 1.119 – Fehlmaterial bis zum Austragen (Jürgen, 4.11.; Entwurf https://claude.ai/artifact/1uD7zopKBVgFtRFccSLWo3; gewählt: austragen nur Sonja + Jürgen, PL darf „verrechnet“ setzen, rot ab 7 Tagen, „Mit PL geklärt“ bleibt)
- Neue Datei `fm.js` (von build.py nach abg.js angehängt), docs `fmx` {pk,k,code,name,u,q,was,bis?,ziel?,zielEv?,txt,by,t,aus,pl?}. was: zur (kommt noch zurück, bleibt offen) / bau (andere Baustelle) / verr (dem Kunden verrechnet) / weg (verloren/gestohlen/kaputt) / nicht (Zählfehler). Kein SQL.
- Offene Menge pro Auftrag × Artikel = (soll − zurück) − Summe der Einträge außer „zur“ (`fmOpenQ`). `abgMissing` (Reiter Fehlmaterial, Wochenbericht „Noch offen insgesamt“) zählt nur noch die offene Menge; `abgBal` selbst bleibt unverändert (Zahlen „Fehlt“, Mails, Excel = physisch fehlend).
- Auftragskonto (`pkAbgView`): unter jedem fehlenden Artikel `fmArtLine` (Einträge mit Chip Offen/Noch auszutragen/Ausgetragen/Erledigt, „Rückgängig“, mit fm_a „In epirent ausgetragen ✓“) + Knopf „Was ist mit … ?“ (`fmDlg`, Lager = abgOk; Teilmenge mit −/+; bei verr/weg mit fm_a Häkchen „Schon in epirent ausgetragen“). Tag beim Artikel: „fehlt n“ (offen) / „auszutragen“ / „geklärt ✓“. Kopf: Chips (`fmHead`).
- Recht `fm_a` (RK, Zeile „Abgleich“ im Rechte-Raster „Fehlmaterial austragen“; Admin immer) → oranger Streifen in der Lager Übersicht (`fmStrip`, vor „Zu prüfen“), Ansicht `fmaus` (Offen/Ausgetragen, nach Auftrag, „Ausgetragen ✓“ → aus {by,t}, „Zurücknehmen“, Excel `fmXl`), Kachel-Zähler (`jvHot`), Briefing-Satz. Rot ab 7 Tagen (`fmOld`).
- Projektleiter (au.js `auAnsDlg`): neue Antwort „Dem Kunden verrechnet“ → zusätzlich fmx was=verr (pl:true, offene Menge) → landet bei „Noch auszutragen“.
- Wochenbericht: Liste „Fehlmaterial noch in epirent auszutragen“ in Block 1 (Bildschirm/Druck und Handy-PDF), Zeilen aus `fmWbRows`.
- „Mit Projektleiter geklärt“ bleibt (Auftrag fällt aus „Fehlmaterial“), die Liste „Noch auszutragen“ gilt unabhängig davon.
- Test `tests/fm_t.js`.

## Version 1.120 – Retourschein-Excel ohne Uhrzeiten (Jürgen, 5.11.)
- In `retXl` stehen bei „Erstellt“ und „Letzte Änderung“ nur noch Name + Datum (`fmt(..).slice(0,10)`), rep am Ende von build.py. Test-Zeile in `tests/retxl_t.js`.

## Version 1.121 – Gitterbox-Etiketten mit QR + Druckstation; PDF drucken am PC (Jürgen, 5.11.)
- Neue Datei `etik.js` (in build.py nach fm.js, Logo `etik-logo.png` als `__ETLOGO__` eingesetzt). Eigener QR-Encoder (Byte-Modus, ECC M, Version 1–6), Inhalt `TPC:<Auftragsnummer>`.
- Zwei Etiketten 100×100 mm wie in GoLabel: „Projektlabel“ und „Projektlabel mit Inhalt“ (Gewicht bleibt leer, kg wird händisch geschrieben). Keine Boxanzahl.
- Packliste → „Gitterbox-Etikett drucken“ (`#pketik`): Art, Anzahl, Inhalt (Chips aus der Packliste). „An die Druckstation“ legt einen Auftrag in docs `druck` an, „Hier drucken“ druckt direkt.
- Druckstation (Einstellungen → Etiketten-Druckstation, View `druckst`): Laptop im Lager mit Godex G530 (USB), Chrome mit `--kiosk-printing`. Häkchen „Dieses Gerät ist die Druckstation“ (localStorage `tpc_druckst`), Herzschlag in docs `druckst/main` alle 20 s, Aufträge neu → druckt → ok/fehler. Anleitung: `druck/ANLEITUNG.md`.
- Retourscheine: QR-Knopf `#rqr` scannt Etikett → öffnet den Retourschein zur Auftragsnummer; alter Homepage-QR → Hinweis.
- `wbMobile` in wb.js: installierte App am PC galt als Handy → Teilen-Fenster statt Drucken. Jetzt nur iPhone/iPad/Android.
- Test: `tests/etik_t.js`.

## Version 1.122 – Defekte schneller melden (Jürgen, 5.11.; Entwurf https://claude.ai/artifact/CfJLc8YRezZnoUsn9DmLYR; gewählt: Veranstaltung nach oben, EINE Meldung mit Stückzahl, „davon defekt“ darf jeder, der zählen darf, auf 0 → löschen mit Rückfrage)
- Anlass: 6 nicht gemeldete defekte Artikel von einer Veranstaltung – 6× Etikett fotografieren, kein Vorschlag beim Artikel, Nummer unbekannt.
- Neue Datei `defx.js` (von build.py nach ersatz.js angehängt, CSS darin). Patches am Ende von build.py (Abschnitt 1.122). Kein SQL.
- Formular „Defekt melden“ / „Bearbeiten“ (`dxForm(p,d)`, p = dn/de): Karte VERANSTALTUNG vor ARTIKEL; Knopf „QR scannen“ (rScanCam → `dxQrHit`, `gbParse` aus etik.js; alter Homepage-QR → Hinweis); Packlisten-Knöpfe (`dxPackFor` über abgPackOf bzw. Veranstaltungsname, `dxPackArts`: Packschein + Zusätze, ohne Fremdmiete, Artikellisten-Reihenfolge, „· n gemeldet“ = offene Meldungen gleicher Auftrag/Artikel); Vorschläge beim Tippen (`dxSuggest`: alle Wörter müssen in Name+Nummer vorkommen, Packliste zuerst, max. 10), Antippen füllt Name + Nummer; Feld „Stückzahl“ (`#dnn`/`#den`, `dxQty`). Etikett-Foto setzt Werte ohne Ereignis → kleiner Intervall prüft, solange das Formular offen ist.
- Nach dem Absenden `dxDone`: grüner Kasten, „+ Nächster Defekt von dieser Veranstaltung“ (dxKeep → Kasten mit „Ändern“), „Fertig“ → Defekte-Liste Reiter Alle, Liste „heute gemeldet“. Ein verstecktes `#dnart` hält draw() vom Neuzeichnen ab.
- Defekt-Feld `n` (Stückzahl, fehlt = 1, `dxQ`). Anzeige „2 × …“ in Liste und Detail, „Stückzahl“ im Detail; wbDefNeed zählt Stück.
- Retourschein: im Zahlenfeld (`rPad`) rote Zeile „davon defekt − n +“ (`dxPadRow`/`dxPadBind`). Pro Schein + Artikel eine Meldung (`ret`=Schein-ID, `rnr`=Artikel-Schlüssel), + öffnet beim ersten Mal das Fenster (Beschreibung, Dringend, Fremdverschulden, Fotos; „Defekt melden“ / „Später beschreiben“ / „Abbrechen“), danach n+1; − bis 1, dann Rückfrage „löschen?“. Löschen mit Recht Defekte-Löschen echt, sonst `del:true` (+delBy/delT) – Defekte mit del werden beim Laden ausgefiltert. Ändern fremder Meldungen nur mit def_b (Datenbank-Regel).
- Kacheln beim Zählen: Schild „n defekt“ (`dxRetTiles`), Retourschein ansehen: roter Streifen „n Stk defekt gemeldet“ mit „Ansehen ›“ (`dxRetOpen`), Mail-Text „Defekt zurückgekommen: …“ (`dxRetMail`), Excel-Spalte „davon defekt“ nur wenn es Meldungen gibt. Im Defekt: „Gemeldet beim Zählen – Retourschein öffnen“.
- Test `tests/defx_t.js`; `tests/ersatz_t.js` angepasst (nach Melden erst „Fertig“). Mit echtem Handy/QR noch nicht ausprobiert.

## Version 1.123 – Veranstaltung / Auftragsnummer vorschlagen (Jürgen, 5.11.: „Wenn ich kein Etikett habe auf der Box“; gewählt: laufende Aufträge zuerst, auch im Retourschein)
- In `defx.js` (Abschnitt 1.123): `dxEvSug(fe,fo,cb)` macht aus zwei Feldern (Veranstaltung, Auftragsnummer) Suchfelder mit Liste darunter (ersetzt die Browser-datalist). Tippen ab 2 Zeichen; Veranstaltung: alle Wörter im Namen/Nummer, Auftragsnummer: Ziffern-Teilfolge. Antippen füllt BEIDE Felder und löst input/change aus (Packlisten-Knöpfe, rHi im Retourschein).
- Quellen `dxOrders()`: Packlisten (ohne Zusatz-Einträge, Status `pkState`, Dispo, PL), Retourscheine, Defekte; Schlüssel = Auftragsnummer (nur Ziffern), sonst Veranstaltungsname. „Laufende Aufträge“ = Packliste nicht erledigt bzw. (ohne Packliste) offener Retourschein, sortiert nach Dispo-Ende; darunter „Erledigt / älter“ nach Datum, zusammen max. 8–11 Zeilen. Zeile: Veranstaltung, Status-Schild, Auftragsnummer · Dispo TT.MM.–TT.MM. · PL.
- Eingebaut in „Defekt melden“/„Bearbeiten“ (dxForm) und beim neuen/zu bearbeitenden Retourschein (Kopf, `#rev`/`#rord`, Patch in build.py).
- Test `tests/evsug_t.js`.

## Version 1.124 – Defekte-Liste: Suche, Scan, Erledigte eingeklappt (Jürgen, 5.11.: Norbert muss lange scrollen; gewählt: Scan ja, Erledigte einklappen)
- In `defx.js` (Abschnitt 1.124), Patches in build.py auf defView: Suchfeld `#dxdq` + Scan-Knopf `#dxdsc` unter den Reitern. Suche (`dxDQ`, `dxDefMatch`) über Artikel, Nummer, Veranstaltung, Auftrag, Beschreibung, Fremdverschulden, Reparatur, Rückmeldung, gemeldet von; alle Wörter müssen vorkommen. Reine Nummer passt auch über den Artikelnamen (Defekte ohne Nummer). Suchtext bleibt beim Neuzeichnen, Fokus/Cursor werden wiederhergestellt.
- Scan (`dxDefScanHit`): Nummer (ID wird abgeschnitten) als Suche; genau ein offener Defekt → öffnet ihn, sonst gefilterte Liste + Hinweis.
- Reiter „Alle“ (`dxDefRows`): offene oben, Erledigte nur über „Erledigte anzeigen (n)“ (`dxDoneOpen`); bei aktiver Suche werden Erledigte immer gezeigt (Überschrift „Erledigt (n)“). Zeile „n Treffer · Suche löschen“.
- Test `tests/defsuch_t.js`; `ersatz_t.js` und `defkachel_t.js` an das Einklappen angepasst.

## Version 1.125 – Werkstatt Übersicht (Jürgen, 5.11.; Entwurf https://claude.ai/artifact/9fRKHYxduFBgmCML6zbGA9; gewählt: Kachel „Lager Übersicht“ heißt nur für die Werkstatt „Werkstatt Übersicht“, KEIN Stand In Arbeit/Wartet auf Teil, KEIN Reiter „Gebraucht“ (App kennt den Lagerstand nicht), Teil-Reparatur: Rest bleibt offen)
- Neue Datei `ws.js` (nach defx.js angehängt). Werkstatt = Titelname enthält „Werkstatt“ (`wsIs`, über hoTit/hoMyTitle). Braucht wie bisher das Recht „Lager Übersicht“ (jv_s). Admin: Link „Werkstatt Übersicht ansehen ›“ unten in der Lager Übersicht (`wsForce`, „‹ Zurück zur Lager Übersicht“).
- draw: `view==="jarvis"` → `wsIs()?wsView():jarvisView()`; Kachel-Name/-Text/-Zähler (`wsHot` = offene dringende Meldungen); `HO_NAME.jarvis` als Getter (Einstellungen/Titel-Reihenfolge zeigen den passenden Namen). Container-ID `wsv` (nicht `jv`, sonst greift das Teil-Neuzeichnen von jarvisView).
- Ansicht: Kopf wie Lager Assistent (Uhr/Datum über jvClock, Begrüßung), Knöpfe „Repariert melden“ (Scan → `wsScanHit`: offene Meldungen zum Artikel über dxDefMatch; eine → Defekt + Reparatur-Fenster, mehrere → Auswahl, keine → Hinweis) und „Defekt erfassen“. Reiter Dringend · Neu (seit letztem Besuch: localStorage `tpc_ws_seen`, geschrieben erst auf der Hauptseite oder wenn die App in den Hintergrund geht – Defekt öffnen und zurück zählt nicht als neuer Besuch; ohne Wert 24 Std.) · Alle offen. Karte „Diese Woche“ (repariert/neu in Stück ab Montag), „Zuletzt repariert“ (4), Ersatzteile-Bericht (def_b), Alle Defekte.
- Teil-Reparatur: „Repariert“ (#dd) ruft `wsRepair(d)` – bei Stückzahl > 1 Fenster „Wie viele sind repariert? k von n“, dann `etDlg(d,true,k)`. Erst beim Speichern der Reparatur legt `wsSplit` den Rest als neue offene Meldung an (alle Felder außer Reparatur/Erledigt, n = Rest, `teilVon`, Meldungs-Fotos kopiert) und das Original bekommt n = k und wird erledigt. Abbrechen ändert nichts.
- Nebenbei: Uhrzeit im Lager Assistenten im Dunkelmodus jetzt hellblau (war Dunkelblau auf Dunkel).
- Test `tests/ws_t.js`.

## Version 1.126 – Meine Aufträge: „Hergerichtet“ sobald alle Positionen fertig sind (Jürgen, 5.11.)
- Gemeldet: Bei einer Nachlieferung stand „wird hergerichtet: 4 von 4 Positionen“, weil der Zusatz nicht über „Zusatz abschließen“ beendet wurde; Datum und Name fehlten.
- `auHerrAll(p,zps)` in au.js: alle Positionen (ohne Lager 55) abgehakt → Zeitleiste zeigt „hergerichtet TT.MM. von <alle, die hergerichtet haben>“ (Datum = letzte Position, Namen wie gespeichert inkl. „(Tablet)“). Gilt für Zusätze und die Packliste selbst; Abweichungen darunter wie beim Abschluss. Das Schild „Nachlieferung …“ in der Liste verschwindet dann ebenfalls.
- Test `tests/auzus_t.js`.

## Version 1.127 – Wortlaut Schild in „Meine Aufträge“ (Jürgen, 5.11.)
- „Herrichten: 1 Abweichung“ → „1 Abweichung zum Packschein“ / „n Abweichungen zum Packschein“ (au.js, Kartenschilder).
