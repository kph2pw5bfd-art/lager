# Push-Nachrichten einrichten (einmalig, ca. 10 Minuten)

## Schritt 1 – SQL
Supabase SQL Editor: https://supabase.com/dashboard/project/whfeipnyzffrejbakweb/sql/new
Inhalt von `push.sql` einfügen → **Run** → bei der Warnung **„Run and enable RLS“**.

## Schritt 2 – Funktion „push“ anlegen
1. https://supabase.com/dashboard/project/whfeipnyzffrejbakweb/functions öffnen.
2. **Deploy a new function** → **Via Editor**.
3. Name der Funktion: **push** (genau so, klein).
4. Den vorgegebenen Beispieltext komplett löschen und den Inhalt von `index.ts` einfügen.
5. **Deploy function** tippen. Fertig – es müssen keine Geheimnisse eingetragen werden.

## Schritt 3 – an jedem Handy einschalten
1. iPhone: Lager App über Safari öffnen → Teilen → **Zum Home-Bildschirm**, dann **nur noch über das Symbol** öffnen.
2. In der App: **Einstellungen → Benachrichtigungen → „Benachrichtigungen erlauben“** → im Fenster des Handys **Erlauben**.
3. **Test-Nachricht senden** – nach ein paar Sekunden kommt „TPC Lager – Test“.

Wer was bekommt (Standard): Lagerleiter → Zu prüfen · Werkstatt → dringende Defekte · Lagerarbeiter → neue Packlisten.
Änderbar unter Benutzerverwaltung → Titel und ihre Rechte → beim Titel „Benachrichtigungen aufs Handy“.
Admin bekommt nur, was er in den Einstellungen selbst einschaltet. Das Lager-Tablet bekommt, was sein Titel erlaubt.
