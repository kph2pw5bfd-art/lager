# Datensicherung einrichten (einmalig, ca. 10 Minuten)

Was am Ende läuft:
- **Papierkorb**: alles, was in der App gelöscht wird, bleibt 30 Tage und kann in der App-Verwaltung wiederhergestellt werden.
- **Nächtliche Sicherung**: jede Nacht um ca. 2:17 Uhr werden alle Daten inkl. Fotos in ein eigenes, **privates** GitHub-Repo kopiert. Jede Nacht bleibt als eigener Stand erhalten.
- **Warnung per Mail**: klappt eine Sicherung nicht oder sind plötzlich mehr als die Hälfte der Daten weg, schickt GitHub eine Mail.

## Schritt 1 – Supabase
1. Supabase SQL Editor öffnen: https://supabase.com/dashboard/project/whfeipnyzffrejbakweb/sql/new
2. Inhalt von `sicherung.sql` einfügen → **Run**.
3. Unten steht: „Fertig. NEUER Sicherungs-Schlüssel …: <langer Code>“. Diesen Code **kopieren** (nicht in den Chat schicken!).
   Er wird nur dieses eine Mal angezeigt. Verloren? Im SQL Editor `delete from sicherung where k = 'schluessel';` ausführen und Schritt 2 wiederholen – dann gibt es einen neuen.

## Schritt 2 – privates Repo auf GitHub anlegen
1. https://github.com/new öffnen (angemeldet als kph2pw5bfd-art).
2. Name: **lager-sicherung**, **Private** auswählen, sonst nichts ankreuzen → **Create repository**.

## Schritt 3 – Schlüssel bei GitHub eintragen
1. Im neuen Repo: **Settings** → **Secrets and variables** → **Actions** → **New repository secret**.
2. Name: `SB_BACKUP_KEY`, Secret: den Code aus Schritt 1 einfügen → **Add secret**.

## Schritt 4 – Claude Bescheid geben
Kurz schreiben „Repo lager-sicherung ist angelegt“. Claude legt dort das Sicherungs-Programm ab und startet die erste Sicherung.
Danach steht in der App unter App-Verwaltung → Datensicherung: „Automatische Sicherung: zuletzt heute …“.

## Wiederherstellen
- Einzelnes versehentlich Gelöschtes: App-Verwaltung → **Papierkorb öffnen** → Wiederherstellen.
- Größerer Schaden: Claude sagen, welcher Tag (z. B. „Stand von gestern Nacht“). Claude holt den Stand aus `lager-sicherung` und erstellt die SQL-Dateien zum Zurückspielen.
