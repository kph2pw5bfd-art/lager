# Druckstation einrichten (Laptop im Lager + Godex G530)

1. **Drucker anschließen:** Godex G530 per USB an den Laptop. Treiber von godexintl.com („Seagull“-Windows-Treiber für G530) installieren.
2. **Etikettengröße:** Windows → Drucker → Godex G530 → Druckeinstellungen: Papier 100 × 100 mm, Ränder 0. Bei Bedarf in GoLabel/Treiber „Kalibrieren“.
3. **Als Standarddrucker setzen** (Windows: „Windows verwaltet Standarddrucker“ ausschalten).
4. **Chrome-Verknüpfung** auf dem Desktop anlegen, Ziel:
   `"C:\Program Files\Google\Chrome\Application\chrome.exe" --kiosk-printing https://<App-Adresse>`
   (`--kiosk-printing` = druckt ohne Druckfenster auf den Standarddrucker.) Vorher alle Chrome-Fenster schließen.
5. In der App anmelden → **Einstellungen → Etiketten-Druckstation → Druckstation öffnen** → Häkchen **„Dieses Gerät ist die Druckstation“**.
6. **Testetikett drucken.** Passt der Rand nicht: in Chrome einmal ohne Kiosk drucken, Ränder „Keine“, Skalierung 100 %.
7. **Energie:** Laptop nicht in Ruhezustand, Deckel zuklappen = „Nichts unternehmen“, Bildschirm darf ausgehen. Fenster offen lassen.

Ist die Station aus, bleiben Aufträge liegen und werden gedruckt, sobald sie wieder läuft.
