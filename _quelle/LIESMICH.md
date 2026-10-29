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
Version in shim.js erhöhen (`const APPV="1.52"` → 1.53 …, zwei Stellen nach dem Punkt, ohne Datum),
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
- Defekt melden/bearbeiten (ab 1.42, `defordpatch.py` + `defLabelBind` in shim.js): Knopf „Etikett fotografieren“ über Veranstaltung (labelCam + readLabel wie Retourschein) füllt Veranstaltung + Auftragsnummer (Feld `ord`, optional, nur in der Detailansicht). Beschreibung optional; Pflicht nur Artikel + Veranstaltung. Formular in drei Karten mit Überschrift (Artikel / Veranstaltung / Defekt, Klasse `dsh`, ab 1.43). Test: `tests/deford_t.js`.
- Materialliste (ab 1.44, `matpatch.py`, `materialliste.sql`): „Abgeschlossen“ statt „Geprüft“ (interner Wert bleibt `chk`, Filterwert `geprüft`). Rechte `mat_b` (Abschließen/Wieder öffnen, abgeschlossene Liste ändern) und `mat_l` (Löschen); erstellen/scannen darf jeder. Solange kein Titel mat_* hat, gilt fürs Abschließen Defekte-Bearbeiten (alt). DB: lists mit chk=true nur mit mat_b änderbar, Löschen nur mit mat_l. Tests: `tests/pg/mat_t.js`, `tests/pg/sql_materialliste_test.py`.
- Startbild-Hexe (ab 1.45, seit 1.46 dezent): `splashpatch.py` + `splash-hexe.svg` = einfarbige dunkle Silhouette, fliegt ca. 0,15–2,05 s (seit 1.49 langsamer, Größe 0,52 statt 0,42) halbtransparent (max. 55 %) im Hintergrund von links nach rechts über/hinter dem Logo, klein, ohne Zoom. Vorschau-Vorlage mit den früheren 4 Varianten: `hexe/hexe_vorschau_vorlage.html`.
- Material-Protokoll (ab 1.47, `rlogpatch.py`, Abschnitt in shim.js, `protokoll.sql`): jede eigene Mengen-Änderung im Retourschein (aus `rFold`) → Zeile in docs `rlog` {t,rid,ev,ord,k,nr,name,g,d}. Warteschlange in localStorage `tpc_rlog_queue`, Senden per rpc `rlog_add` (setzt by, nur neue Zeilen). Lesen nur Admin, ändern/löschen niemand. Alte Scheine einmalig mit Anlegedatum nachgetragen (`nt:true`, id `alt_…`). Admin (ab 1.48 pro Schein): im geöffneten Retourschein Knopf „Protokoll als Excel“ (`rlogRetXl`, nur owner) → Kopf mit Veranstaltung/Auftragsnummer, „Bearbeitet von“ (alle by der Zeilen, sonst Ersteller), dann pro Tag Tageszeile mit erstem/letztem Eintrag + Summe, darunter Artikel netto, Gesamt. Die frühere Gesamtliste über alle Scheine in der App-Verwaltung ist entfernt (Jürgens Wunsch). Tests: `tests/pg/rlog_t.js` (ExcelJS-Attrappe `fakexl.js`), `tests/pg/sql_protokoll_test.py`. Nachtrag speichert seinen Zeitpunkt in meta/rlog_backfill.t; rlog_add überspringt Zeilen mit älterem t (sonst doppelt gezählt, wenn Geräte vor dem SQL-Update gezählt haben).
- Jarvis (ab 1.50, vorerst nur owner): `jarvispatch.py` (Karte auf Hauptseite + Route `jarvis`, body-Klasse `jvon`), `jarvis.css` (HUD-Stil, dunkel Standard, `.jv.light` hell; Wahl in localStorage `tpc_jv_light`), Abschnitt „Jarvis“ in shim.js (`jarvisView`, `jvData`, `jvText` = Briefing per speechSynthesis de-DE; „seit letztem Briefing“ = localStorage `tpc_jv_last`). Zeigt offene Retourscheine, offene Defekte, seit letztem Öffnen repariert, letzte abgeschlossene Retouren; Einträge antippen springt in Retourschein/Defekt. Herrichten/Heute zurück/Überfällig = Platzhalter bis Packlisten. Konzept-Dokument: https://claude.ai/artifact/SukTyeA7sigsoPEUXVTpXT, Layout: https://claude.ai/artifact/NiQU17VNX1SYKMmuRR7XdG. Ab 1.51 Stimme: `jvVoices`/`jvVoiceScore` wählt die beste deutsche Männerstimme des Geräts (Natural/Online > Premium/Erweitert > Google; männliche Namen bevorzugt), Tonlage 0,9 / Tempo 0,96 als Standard; Dialog „Stimme“ (Auswahl, Tonlage, Tempo, Probe hören; localStorage `tpc_jv_voice/pitch/rate`). Ab 1.52 Stimmen über `voiceURI` unterschieden (iPhone liefert z. B. zweimal „Anna“: compact = Standard, enhanced = Erweitert), Anzeige mit Fassung, gespeichert per voiceURI. Briefing `jvText` liefert natürliche Sätze, die einzeln mit kurzer Pause gesprochen werden. Keine Nachbildung echter Personen-Stimmen (z. B. Film-Jarvis) – Jürgen gefragt, abgelehnt; Profi-Stimme (Azure/OpenAI/ElevenLabs über Supabase-Funktion) später nach Klärung Firmenkonten. Tests: `tests/jv_t.js`, `tests/jvv_t.js`.
- `datenbank.sql` – Supabase-Schema mit Berechtigungen
- `tests/` – Playwright-Tests mit Fake-Supabase (`fakesb.js`); Kamera-Tests mit `--use-fake-device-for-media-stream`. `two.js` + `fakesb2.js`: zwei Benutzer gleichzeitig an einem Schein (liegt neben two.js, Verzögerung per `LAT=300`). Pfad `S` in den alten Tests auf das aktuelle Scratchpad anpassen.

Supabase: https://whfeipnyzffrejbakweb.supabase.co (anon key steht in shim.js; service_role-Key NIE verwenden/anfragen).
