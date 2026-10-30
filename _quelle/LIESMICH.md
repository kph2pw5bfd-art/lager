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
