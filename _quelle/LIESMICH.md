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
Version in shim.js erhöhen (`const APPV="1.41"` → 1.42 …, zwei Stellen nach dem Punkt, ohne Datum),
dann index.html nach /home/claude/lager kopieren, die geänderten Quelldateien nach `_quelle/`, committen, `git push origin main`.

## Aufbau
- `basis.html` – ursprüngliche Artifact-App (unverändert lassen)
- `build.py` – wendet die Patches in fester Reihenfolge an, fügt shim.js ein, schreibt index.html
- `shim.js` – Supabase-Anbindung (ersetzt window.claude.use), Login, OCR, Retourschein-Helfer, Einstellungen, Licht usw.
- `*patch.py` – gezielte Änderungen an basis.html (Funktion `rep(alt,neu)`)
- `splashpatch.py` + `splash-logo.png` – Start-Animation (Original-Logo weiß auf Blau, ohne LAGER, zoomt ~3 s, Tippen überspringt)
- `collabpatch.py` + Abschnitt „Mehrere Personen“ in shim.js – mehrere Geräte an einem Retourschein: jede Person speichert nur ihren Anteil in `pa_<Benutzer-ID>` (Datenbank führt per doc_update zusammen), Anzeige = `itemsJson` (Grundstand) + alle Anteile; `ed_<Benutzer-ID>` = „arbeitet gerade daran“. Nie wieder das ganze Retour-Dokument mit set() ersetzen, sonst gehen fremde Anteile verloren.
- Retourschein-Scan (shim.js `rScanCam`/`rScanHit`, Knopf über „Manuell eintragen“): eigener Vollbild-Scanner, nimmt bei `1234–56` nur die ersten 4 Ziffern, dann Zahlenfeld; unbekannt → „Manuell eintragen“ mit Nummer. `scanpatch.py` benennt „Händisch“ → „Manuell“. Test: `tests/scan_t.js`.
- `mangrppatch.py` + `rManTile`/`rManLevel` in shim.js: orange Kachel „Manuell eingetragene Artikel“ (immer letzte, nur wenn der Schein manuelle Artikel hat), Ebene `manual`. Test: `tests/mang_t.js`.
- Titel und Rechte (ab 1.39): `rechtepatch.py` + Abschnitt „Titel und Rechte“ in shim.js (`can(k)`, `rightsBlock`). Daten: docs `titel` {name,o,r} und `rolle` (id = Benutzer-ID) {t,x}. Rechte: def_/ret_/inf_ + s/b/l, v_user, v_rights, v_app. Admin darf immer alles. Ohne Titel in der DB (rechte.sql nicht ausgeführt) gelten die alten Häkchen werkstatt/lager.
- `rechte.sql` – Datenbank-Update für Titel und Rechte (app_right, can_read/can_write/can_delete, Standard-Titel, Übernahme alter Häkchen). Einmal in Supabase ausführen, wiederholbar.
- `tests/pg/` – Tests gegen echtes Postgres (Supabase nachgebildet in `mock.sql`): `sql_rechte_test.py` (Regeln direkt), `rechte_t.js`/`old_t.js` (App im Browser über `pgharness.js`, das jede Anfrage als der jeweilige Benutzer in Postgres ausführt). Postgres 16 liegt unter /usr/lib/postgresql/16/bin; Server siehe pgharness (Socket /home/postgres/pgt, Port 5499).
- Eine Artikelliste (ab 1.41, `einelistepatch.py` + `artFromKat`/`defScanHit` in shim.js): einzige Quelle ist docs `rkat`. `art` (Nummer → Name für Materialliste/Defekte) wird daraus gebaut, Nummern 1–3-stellig werden auf 4 Stellen aufgefüllt. Die frühere Scan-Liste (docs `artikel`) wird nicht mehr gelesen/geschrieben und beim Start (Recht App-Verwaltung) gelöscht. Defekt melden: Live-Scanner (`rScanCam(defScanHit)`), Nummer mit ID `1234–56`. Test: `tests/eine_t.js`.
- `datenbank.sql` – Supabase-Schema mit Berechtigungen
- `tests/` – Playwright-Tests mit Fake-Supabase (`fakesb.js`); Kamera-Tests mit `--use-fake-device-for-media-stream`. `two.js` + `fakesb2.js`: zwei Benutzer gleichzeitig an einem Schein (liegt neben two.js, Verzögerung per `LAT=300`). Pfad `S` in den alten Tests auf das aktuelle Scratchpad anpassen.

Supabase: https://whfeipnyzffrejbakweb.supabase.co (anon key steht in shim.js; service_role-Key NIE verwenden/anfragen).
